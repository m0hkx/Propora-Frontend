import type { Lease, Payment, Tenant } from '../data/mock';

/**
 * Automated rent collection: monthly generation + overdue transitions.
 *
 * Architecture note — this project is a frontend-only SPA (no backend, no
 * cron/queue/scheduler; payments live in the in-memory Zustand store), so
 * there is no server process that could run while the app is closed. The job
 * is therefore split the way offline-first apps do it:
 *
 * - Pure, deterministic planners below (`planMonthlyPayments`,
 *   `planOverdueTransitions`, `planAutomationRun`). They take an explicit
 *   "today" and have no clock, network or DOM dependencies, so a future
 *   backend scheduler can call the exact same functions.
 * - `runPaymentAutomation` in the store applies one plan in a single `set()`.
 * - Catch-up triggers call it on app boot (`main.tsx`) and when the Payments
 *   page mounts — event-driven reconciliation, not a timer. Every run is
 *   idempotent, so re-runs are always safe.
 *
 * Idempotency: generated payments carry deterministic IDs
 * (`PAY-<leaseId>-<YYYY-MM>`) plus `leaseId`/`period` fields, and generation
 * additionally treats any same-tenant payment whose `date` falls in the
 * period as covering it — so manual "Record Payment" rows also block
 * duplicates. There is no database to add a constraint to; the deterministic
 * key plus the pre-insert check inside the store updater is the enforcement.
 */

/** Business timezone for month boundaries, due dates and overdue transitions. */
export const APP_TIMEZONE = 'UTC';

/** Generate the upcoming month once today is this many days before it starts. */
export const GENERATION_LEAD_DAYS = 3;

/** A Pending payment becomes Overdue once today passes due date + this many days. */
export const OVERDUE_GRACE_DAYS = 1;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_PERIOD = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_MS = 86_400_000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Strict `YYYY-MM-DD` check (rejects month 13, Feb 30, …). */
export function isIsoDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function dayToMillis(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function millisToDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Calendar-day arithmetic on `YYYY-MM-DD` strings (UTC-based, DST-proof). */
export function addDaysIso(iso: string, days: number): string {
  return millisToDay(dayToMillis(iso) + days * DAY_MS);
}

/** Coverage month (`YYYY-MM`) of a `YYYY-MM-DD` date. */
export function monthOfDay(isoDay: string): string {
  return isoDay.slice(0, 7);
}

/** First day (the rent due date by app convention) of a `YYYY-MM` period. */
export function firstOfPeriod(period: string): string {
  return `${period}-01`;
}

/** Shift a `YYYY-MM` period by whole months. */
export function shiftPeriod(period: string, delta: number): string {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  const total = year * 12 + (month - 1) + delta;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${pad2(m)}`;
}

/**
 * Today's date in the business timezone, as `YYYY-MM-DD`. All month
 * boundaries, due dates and overdue transitions derive from this — never
 * from the device's local clock or bare `toISOString()` (UTC) slicing.
 */
export function zonedToday(timeZone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Periods needing a generation pass for `today`: always the current month
 * (missed-run catch-up — a no-op when every live lease is already covered),
 * plus the upcoming month once we are inside the lead window. E.g. with a
 * 3-day lead, Sep 28 → `['2026-09', '2026-10']`; Sep 27 → `['2026-09']`.
 */
export function generationPeriods(todayIso: string): string[] {
  if (!isIsoDay(todayIso)) return [];
  const current = monthOfDay(todayIso);
  const next = shiftPeriod(current, 1);
  const windowOpens = addDaysIso(firstOfPeriod(next), -GENERATION_LEAD_DAYS);
  return todayIso >= windowOpens ? [current, next] : [current];
}

/** Deterministic idempotency key: one payment per lease per period, ever. */
export function paymentIdFor(leaseId: string, period: string): string {
  return `PAY-${leaseId}-${period}`;
}

/** Most recent payment method for continuity, defaulting to Bank. */
function latestMethod(payments: Payment[], tenantId: string): Payment['method'] {
  const mine = payments
    .filter((p) => p.tenantId === tenantId && isIsoDay(p.date))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return mine[0]?.method ?? 'Bank';
}

export type IneligibleReason = 'expired-lease' | 'inactive-tenant' | 'missing-data';

export interface GenerationPlan {
  toCreate: Payment[];
  duplicatesSkipped: number;
  ineligible: { leaseId: string; reason: IneligibleReason }[];
  errors: string[];
}

/**
 * Plan one period's rent generation. Pure: reads nothing, writes nothing.
 * Skips (never throws on) expired/cancelled leases, inactive tenants and
 * leases missing a usable rent; anything covering tenant + period — generated
 * or manually recorded — counts as a duplicate.
 */
export function planMonthlyPayments(
  leases: Lease[],
  tenants: Tenant[],
  payments: Payment[],
  period: string
): GenerationPlan {
  const plan: GenerationPlan = { toCreate: [], duplicatesSkipped: 0, ineligible: [], errors: [] };
  if (!ISO_PERIOD.test(period)) {
    plan.errors.push(`Invalid billing period "${period}" — expected YYYY-MM. Skipping generation.`);
    return plan;
  }
  const dueDate = firstOfPeriod(period);
  for (const lease of leases) {
    if (lease.status !== 'Active' && lease.status !== 'Expiring') {
      plan.ineligible.push({ leaseId: lease.id, reason: 'expired-lease' });
      continue;
    }
    if (!isIsoDay(lease.start) || !isIsoDay(lease.end) || lease.start > lease.end) {
      plan.errors.push(
        `Lease ${lease.id} has an unusable term (${lease.start} → ${lease.end}). Skipping ${period}.`
      );
      plan.ineligible.push({ leaseId: lease.id, reason: 'missing-data' });
      continue;
    }
    if (period < monthOfDay(lease.start) || period > monthOfDay(lease.end)) {
      plan.ineligible.push({ leaseId: lease.id, reason: 'expired-lease' });
      continue;
    }
    const tenant = tenants.find((t) => t.id === lease.tenantId);
    if (!tenant || tenant.status === 'Inactive') {
      plan.ineligible.push({ leaseId: lease.id, reason: 'inactive-tenant' });
      continue;
    }
    if (!Number.isFinite(lease.rent) || lease.rent <= 0) {
      plan.errors.push(
        `Lease ${lease.id} is missing a monthly rent amount. Skipping ${period} — no invalid payment created.`
      );
      plan.ineligible.push({ leaseId: lease.id, reason: 'missing-data' });
      continue;
    }
    const id = paymentIdFor(lease.id, period);
    const covered = payments.some(
      (p) =>
        p.id === id ||
        (p.tenantId === lease.tenantId && isIsoDay(p.date) && monthOfDay(p.date) === period)
    );
    if (covered) {
      plan.duplicatesSkipped += 1;
      continue;
    }
    plan.toCreate.push({
      id,
      tenantId: lease.tenantId,
      propertyId: lease.propertyId,
      amount: lease.rent,
      date: dueDate,
      method: latestMethod(payments, lease.tenantId),
      status: 'Pending',
      leaseId: lease.id,
      period,
    });
  }
  return plan;
}

/**
 * IDs of Pending payments whose due date is more than `OVERDUE_GRACE_DAYS`
 * behind `today` (due Oct 1 → Overdue from Oct 2 with the default 1-day
 * grace). Paid/Overdue rows are never touched; rows with an unparseable date
 * are conservatively left alone.
 */
export function planOverdueTransitions(payments: Payment[], todayIso: string): string[] {
  if (!isIsoDay(todayIso)) return [];
  const cutoff = addDaysIso(todayIso, -OVERDUE_GRACE_DAYS);
  const ids: string[] = [];
  for (const p of payments) {
    if (p.status !== 'Pending') continue;
    if (!isIsoDay(p.date)) continue;
    if (p.date <= cutoff) ids.push(p.id);
  }
  return ids;
}

export interface AutomationSnapshot {
  leases: Lease[];
  tenants: Tenant[];
  payments: Payment[];
}

export interface PaymentAutomationReport {
  ranAt: string;
  timeZone: string;
  periods: string[];
  createdIds: string[];
  duplicatesSkipped: number;
  ineligibleSkipped: number;
  markedOverdueIds: string[];
  errors: string[];
}

/**
 * Full job plan for one run: generation for every due period, then the
 * overdue pass over existing + just-created rows (a backfilled current-month
 * row already past grace correctly flips to Overdue in the same run).
 */
export function planAutomationRun(
  snapshot: AutomationSnapshot,
  todayIso: string
): { toCreate: Payment[]; toMarkOverdue: string[]; report: PaymentAutomationReport } {
  const report: PaymentAutomationReport = {
    ranAt: todayIso,
    timeZone: APP_TIMEZONE,
    periods: [],
    createdIds: [],
    duplicatesSkipped: 0,
    ineligibleSkipped: 0,
    markedOverdueIds: [],
    errors: [],
  };
  if (!isIsoDay(todayIso)) {
    report.errors.push(`Invalid run date "${todayIso}". Nothing was generated or transitioned.`);
    return { toCreate: [], toMarkOverdue: [], report };
  }
  const periods = generationPeriods(todayIso);
  report.periods = periods;
  const toCreate: Payment[] = [];
  for (const period of periods) {
    const plan = planMonthlyPayments(snapshot.leases, snapshot.tenants, snapshot.payments, period);
    // Later periods in the same run must see earlier periods' creations.
    const createdBefore = toCreate.length;
    const visible = [...snapshot.payments, ...toCreate];
    for (const payment of plan.toCreate) {
      const clash = visible.some(
        (p) =>
          p.id === payment.id ||
          (p.tenantId === payment.tenantId &&
            isIsoDay(p.date) &&
            monthOfDay(p.date) === period)
      );
      if (clash) {
        plan.duplicatesSkipped += 1;
        continue;
      }
      visible.push(payment);
      toCreate.push(payment);
    }
    report.createdIds.push(...toCreate.slice(createdBefore).map((p) => p.id));
    report.duplicatesSkipped += plan.duplicatesSkipped;
    report.ineligibleSkipped += plan.ineligible.length;
    report.errors.push(...plan.errors);
  }
  report.markedOverdueIds = planOverdueTransitions([...snapshot.payments, ...toCreate], todayIso);
  return { toCreate, toMarkOverdue: report.markedOverdueIds, report };
}

/**
 * Monitoring output. Deliberately PII-free: counts plus lease/payment IDs
 * only — never tenant names, emails, phones, units or amounts.
 */
export function logAutomationReport(
  report: PaymentAutomationReport,
  log: Pick<Console, 'info' | 'warn'> = console
): void {
  log.info(
    `[payments:auto] run complete date=${report.ranAt} tz=${report.timeZone} ` +
      `periods=${report.periods.join(',') || 'none'} created=${report.createdIds.length} ` +
      `duplicatesSkipped=${report.duplicatesSkipped} ineligibleSkipped=${report.ineligibleSkipped} ` +
      `markedOverdue=${report.markedOverdueIds.length} errors=${report.errors.length}`
  );
  for (const error of report.errors) log.warn(`[payments:auto] ${error}`);
}
