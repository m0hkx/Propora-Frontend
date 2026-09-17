import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  conversations as seedConversations,
  documents as seedDocuments,
  leases as seedLeases,
  maintenance as seedMaintenance,
  notifications as seedNotifications,
  payments as seedPayments,
  properties as seedProperties,
  staff as seedStaff,
  tenants as seedTenants,
  units as seedUnits,
} from '../data/mock';
import type {
  AppNotification,
  ChatMessage,
  Conversation,
  DocFile,
  Lease,
  MaintenanceRequest,
  MaintenanceStaff,
  Payment,
  Property,
  Tenant,
  Unit,
} from '../data/mock';
import { validateUnit } from '../lib/units';
import { validateStaff } from '../lib/staff';
import { validateMaintenanceTarget } from '../lib/maintenanceScope';
import { sanitizeFileName, validateDocRecord } from '../lib/files';
import { DEFAULT_CALLING_COUNTRY } from '../data/phone';
import {
  APP_TIMEZONE,
  logAutomationReport,
  planAutomationRun,
  zonedToday,
} from '../lib/paymentAutomation';
import type { PaymentAutomationReport } from '../lib/paymentAutomation';

export interface Toast {
  id: number;
  message: string;
}

export interface StoreState {
  properties: Property[];
  addProperty: (p: Property) => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  units: Unit[];
  /**
   * Service-layer writes. Add/update run `validateUnit` (required name,
   * per-property uniqueness, non-negative numbers) and return the rejection
   * reason instead of persisting bad data — `null` means success.
   */
  addUnit: (u: Unit) => string | null;
  updateUnit: (id: string, patch: Partial<Unit>) => string | null;
  deleteUnit: (id: string) => void;
  tenants: Tenant[];
  addTenant: (t: Tenant) => void;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  leases: Lease[];
  addLease: (l: Lease) => void;
  payments: Payment[];
  addPayment: (p: Payment) => void;
  /**
   * Idempotent rent-automation job: generates due billing periods as Pending
   * and flips Pending rows past due date + grace to Overdue. Safe to run any
   * number of times; accepts an explicit clock for testing (defaults to now).
   * Applies at most one `set()` — and none when there is nothing to do.
   */
  runPaymentAutomation: (now?: Date) => PaymentAutomationReport;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  maintenance: MaintenanceRequest[];
  /**
   * Service-layer write: validates the property → unit(s)/tenant(s)
   * relationship (`validateMaintenanceTarget`) before persisting — the
   * store-layer stand-in for backend enforcement (this app has no backend).
   */
  addMaintenance: (m: MaintenanceRequest) => string | null;
  updateMaintenance: (id: string, patch: Partial<MaintenanceRequest>) => void;
  staff: MaintenanceStaff[];
  /** Add/update run `validateStaff` (name, email format, phone if present) and return the rejection reason — `null` means success. */
  addStaff: (s: MaintenanceStaff) => string | null;
  updateStaff: (id: string, patch: Partial<MaintenanceStaff>) => string | null;
  deleteStaff: (id: string) => void;
  documents: DocFile[];
  /**
   * Storage-layer gate (this app has no backend — this is the ingestion
   * point). Re-validates extension, size and MIME independently of the upload
   * form and sanitizes the stored display name. Returns the rejection reason,
   * or `null` on success.
   */
  addDocument: (d: DocFile, meta?: { sizeBytes: number; mime: string }) => string | null;
  updateDocument: (id: string, patch: Partial<DocFile>) => void;
  deleteDocument: (id: string) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'read'>) => void;
  conversations: Conversation[];
  markConversationRead: (id: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  toasts: Toast[];
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 1;
let notificationSeq = 100;
let messageSeq = 100;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
  properties: seedProperties,
  addProperty: (p) => set((s) => ({ properties: [p, ...s.properties] })),
  updateProperty: (id, patch) =>
    set((s) => ({ properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

  units: seedUnits,
  addUnit: (u) => {
    const err = validateUnit(get().units, u.propertyId, u);
    if (err) return err;
    set((s) => ({ units: [u, ...s.units] }));
    return null;
  },
  updateUnit: (id, patch) => {
    const units = get().units;
    const existing = units.find((u) => u.id === id);
    if (!existing) return 'Unit not found.';
    const next = { ...existing, ...patch };
    const err = validateUnit(units, next.propertyId, next, id);
    if (err) return err;
    set((s) => ({ units: s.units.map((u) => (u.id === id ? next : u)) }));
    return null;
  },
  deleteUnit: (id) => set((s) => ({ units: s.units.filter((u) => u.id !== id) })),

  tenants: seedTenants,
  addTenant: (t) => set((s) => ({ tenants: [t, ...s.tenants] })),
  updateTenant: (id, patch) =>
    set((s) => ({ tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  deleteTenant: (id) => set((s) => ({ tenants: s.tenants.filter((t) => t.id !== id) })),

  leases: seedLeases,
  addLease: (l) => set((s) => ({ leases: [l, ...s.leases] })),

  payments: seedPayments,
  addPayment: (p) => set((s) => ({ payments: [p, ...s.payments] })),
  runPaymentAutomation: (now) => {
    const { leases, tenants, payments } = get();
    let today: string;
    try {
      today = zonedToday(APP_TIMEZONE, now ?? new Date());
    } catch (err) {
      console.error('[payments:auto] clock/timezone failure — run aborted', err);
      return {
        ranAt: 'unknown',
        timeZone: APP_TIMEZONE,
        periods: [],
        createdIds: [],
        duplicatesSkipped: 0,
        ineligibleSkipped: 0,
        markedOverdueIds: [],
        errors: ['Clock/timezone failure — run aborted.'],
      };
    }
    const { toCreate, toMarkOverdue, report } = planAutomationRun({ leases, tenants, payments }, today);
    if (toCreate.length === 0 && toMarkOverdue.length === 0) return report;
    const flip = new Set(toMarkOverdue);
    set((s) => ({
      payments: [
        ...toCreate,
        ...s.payments.map((p) =>
          // Re-check Pending at apply time: a Paid row must never flip.
          flip.has(p.id) && p.status === 'Pending' ? { ...p, status: 'Overdue' as const } : p
        ),
      ],
    }));
    logAutomationReport(report);
    get().pushNotification({
      kind: 'payment',
      title: 'Rent automation ran',
      detail:
        `Periods ${report.periods.join(', ')}: ` +
        `${report.createdIds.length} payment(s) generated, ` +
        `${report.markedOverdueIds.length} marked overdue.`,
      time: 'Now',
      link: 'Payments',
    });
    return report;
  },
  updatePayment: (id, patch) =>
    set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

  maintenance: seedMaintenance,
  addMaintenance: (m) => {
    const err = validateMaintenanceTarget(m, get().units, get().tenants);
    if (err) return err;
    set((s) => ({ maintenance: [m, ...s.maintenance] }));
    return null;
  },
  updateMaintenance: (id, patch) =>
    set((s) => ({ maintenance: s.maintenance.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

  staff: seedStaff,
  addStaff: (staffMember) => {
    const err = validateStaff(staffMember, DEFAULT_CALLING_COUNTRY);
    if (err) return err;
    set((s) => ({ staff: [staffMember, ...s.staff] }));
    return null;
  },
  updateStaff: (id, patch) => {
    const existing = get().staff.find((s) => s.id === id);
    if (!existing) return 'Staff member not found.';
    const next = { ...existing, ...patch };
    const err = validateStaff(next, DEFAULT_CALLING_COUNTRY);
    if (err) return err;
    set((s) => ({ staff: s.staff.map((m) => (m.id === id ? next : m)) }));
    return null;
  },
  deleteStaff: (id) => set((s) => ({ staff: s.staff.filter((m) => m.id !== id) })),

  documents: seedDocuments,
  addDocument: (d, meta) => {
    const err = validateDocRecord(d.name, meta?.sizeBytes, meta?.mime);
    if (err) return err;
    const clean = sanitizeFileName(d.name);
    if (clean === '') return 'Document name is required.';
    set((s) => ({ documents: [{ ...d, name: clean }, ...s.documents] }));
    return null;
  },
  updateDocument: (id, patch) =>
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  deleteDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

  notifications: seedNotifications,
  markNotificationRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  pushNotification: (n) => {
    const id = `n-${notificationSeq++}`;
    set((s) => ({ notifications: [{ ...n, id, read: false }, ...s.notifications] }));
  },

  conversations: seedConversations,
  markConversationRead: (id) =>
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) })),
  sendMessage: (conversationId, text) => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    const message: ChatMessage = { id: `m-${messageSeq++}`, from: 'me', text: trimmed, time: 'Now' };
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c
      ),
    }));
  },

  toasts: [],
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  pushToast: (message) => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message }] }));
    window.setTimeout(() => get().dismissToast(id), 3500);
  },
    }),
    {
      // The slices with user-created/-changed records that must survive a
      // refresh; everything else stays session-scoped seed data. Additive
      // vs. the original units-only shape, so no version bump is needed —
      // old persisted blobs just leave maintenance/staff at their seed value.
      name: 'propora-units-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ units: s.units, maintenance: s.maintenance, staff: s.staff }),
    }
  )
);
