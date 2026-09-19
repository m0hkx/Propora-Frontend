import type { Payment, Property } from '../data/mock';

/**
 * Honest per-property spread of a metric across the portfolio —
 * feeds KPI sparklines from live store data instead of mock trends.
 * `amount` defaults to 1 (counts); pass a field picker for sums.
 */
export function spreadByProperty<T>(
  properties: Property[],
  items: T[],
  key: (item: T) => string,
  amount: (item: T) => number = () => 1
): number[] {
  return properties.map((p) =>
    items.reduce((sum, item) => (key(item) === p.id ? sum + amount(item) : sum), 0)
  );
}

export type RevenueRange = 'Monthly' | 'Quarterly' | 'Yearly';

/**
 * Buckets Paid payments into a revenue-over-time series for the dashboard
 * chart — real payment history grouped by the selected range, not a mock
 * trend table. Returns at most `take` of the most recent buckets that
 * actually have data.
 */
export function revenueByPeriod(
  payments: Payment[],
  range: RevenueRange,
  take = 9
): { values: number[]; labels: string[]; counts: number[] } {
  const buckets = new Map<string, { total: number; count: number }>();
  for (const p of payments) {
    if (p.status !== 'Paid' || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) continue;
    const [y, m] = p.date.split('-');
    const key = range === 'Yearly' ? y : range === 'Quarterly' ? `${y}-Q${Math.ceil(Number(m) / 3)}` : `${y}-${m}`;
    const cur = buckets.get(key) ?? { total: 0, count: 0 };
    cur.total += p.amount;
    cur.count += 1;
    buckets.set(key, cur);
  }
  const keys = [...buckets.keys()].sort().slice(-take);
  const label = (key: string): string => {
    if (range === 'Yearly') return key;
    if (range === 'Quarterly') return key.slice(5);
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
  };
  return {
    values: keys.map((k) => Math.round(buckets.get(k)!.total)),
    labels: keys.map(label),
    counts: keys.map((k) => buckets.get(k)!.count),
  };
}
