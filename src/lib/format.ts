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