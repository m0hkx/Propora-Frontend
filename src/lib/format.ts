/**
 * Bounds for every `<input type="date">` in the app. Also works around a
 * browser quirk where the year segment accepts more than four digits (e.g.
 * typing "99999" produces a value like "99999-01-01") — `min`/`max` alone
 * don't stop that while typing, so pair them with `isValidIsoDate` below.
 */
export const MIN_DATE = '1900-01-01';
export const MAX_DATE = '2100-12-31';

/** True for `''` (cleared/incomplete) or a `YYYY-MM-DD` string with a plain four-digit year. */
export function isValidIsoDate(value: string): boolean {
  return value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Shared date formatting for `YYYY-MM-DD` strings (the format used by every
 * domain date field). Parses in local time; invalid input is echoed back so
 * bad data stays visible instead of rendering "Invalid Date".
 */
export function fmtDate(iso: string | undefined, opts: { year?: boolean } = {}): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(
    'en-US',
    opts.year === false ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }
  );
}