/**
 * Shared table sorting: one comparator set and one toggle rule for every table.
 *
 * All data is already fully loaded in the Zustand store, so every table sorts
 * client-side over its *complete* filtered set. Paginated tables sort before
 * slicing, never the visible page.
 *
 * Empty, missing and unparseable values always sort last, in both directions —
 * flipping direction reorders the real values and leaves the blanks at the
 * bottom, which is what people expect from a spreadsheet.
 */

export type SortDir = 'asc' | 'desc';

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

/** Compares two rows for a single column. Direction is applied inside. */
export type Comparator<T> = (a: T, b: T, dir: SortDir) => number;

const isMissing = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (typeof v === 'number' && Number.isNaN(v));

/**
 * Builds a comparator that pins missing values to the bottom regardless of
 * direction, then compares the rest and flips for `desc`.
 */
function withMissingLast<T, V>(get: (row: T) => V | undefined, compare: (a: V, b: V) => number): Comparator<T> {
  return (a, b, dir) => {
    const av = get(a);
    const bv = get(b);
    const aMissing = isMissing(av);
    const bMissing = isMissing(bv);
    if (aMissing || bMissing) return aMissing && bMissing ? 0 : aMissing ? 1 : -1;
    const cmp = compare(av as V, bv as V);
    return dir === 'asc' ? cmp : -cmp;
  };
}

/**
 * Alphabetical, case- and accent-insensitive, with embedded numbers compared
 * numerically so "A-2" precedes "A-10".
 */
export function byText<T>(get: (row: T) => string | undefined): Comparator<T> {
  return withMissingLast(get, (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true }));
}

/** Numeric, never string-based — callers pass the raw value, not the formatted one. */
export function byNumber<T>(get: (row: T) => number | undefined): Comparator<T> {
  return withMissingLast(get, (a, b) => a - b);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Chronological. Unparseable dates are treated as missing, so they pin last. */
export function byDate<T>(get: (row: T) => string | undefined): Comparator<T> {
  return withMissingLast<T, number>(
    (row) => {
      const raw = get(row)?.trim();
      if (raw === undefined || raw === '') return undefined;
      const ms = ISO_DATE.test(raw) ? Date.parse(`${raw}T00:00:00Z`) : Date.parse(raw);
      return Number.isNaN(ms) ? undefined : ms;
    },
    (a, b) => a - b
  );
}

/**
 * Status-style columns: sorted by the position of the value in `order`, so the
 * sequence is the domain's logical one rather than alphabetical. A value not in
 * `order` is treated as missing and pins last.
 */
export function byRank<T, V extends string>(get: (row: T) => V | undefined, order: readonly V[]): Comparator<T> {
  return withMissingLast<T, number>(
    (row) => {
      const v = get(row);
      if (v === undefined) return undefined;
      const i = order.indexOf(v);
      return i === -1 ? undefined : i;
    },
    (a, b) => a - b
  );
}

/**
 * Click behaviour for a header: a new column starts ascending, the active
 * column toggles asc → desc → asc.
 */
export function nextSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
  return key === current.key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' };
}

/**
 * Returns a sorted copy. `Array#sort` is stable, so rows that tie keep their
 * previous order and pagination stays deterministic. A key with no comparator
 * (e.g. the "featured" default) leaves the rows untouched.
 */
export function sortRows<T, K extends string>(
  rows: T[],
  sort: SortState<K>,
  comparators: Partial<Record<K, Comparator<T>>>
): T[] {
  const cmp = comparators[sort.key];
  if (!cmp) return rows;
  return [...rows].sort((a, b) => cmp(a, b, sort.dir));
}
