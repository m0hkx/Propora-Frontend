import type { Property } from '../data/mock';

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
