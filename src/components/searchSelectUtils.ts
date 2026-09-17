/**
 * Types and matching logic for `SearchSelect`. Kept out of the component file
 * so the module exports a component and nothing else (fast refresh).
 */
export interface SearchSelectOption {
  /** The value handed back to `onChange` and stored on the entity. */
  value: string;
  /** What the row and the closed trigger display. */
  label: string;
  /** Extra space-separated search terms (codes, aliases) that never render. */
  keywords?: string;
  /**
   * Secondary identifying info (e.g. an email or phone) shown as a muted
   * sub-line inside the option rows — never in the closed trigger, which
   * still shows only `label`.
   */
  detail?: string;
}

/** Accent- and case-insensitive so "Turkiye" matches "Türkiye". */
const key = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

interface IndexedOption {
  option: SearchSelectOption;
  label: string;
  terms: string;
}

/**
 * Normalises the labels once per option list instead of once per keystroke.
 * `detail` is folded into the keyword terms so secondary info (email, phone,
 * unit) is searchable without being part of the rendered label.
 */
export function indexOptions(options: SearchSelectOption[]): IndexedOption[] {
  return options.map((o) => ({
    option: o,
    label: key(o.label),
    terms: [o.keywords, o.detail].filter((t) => t !== undefined).map((t) => key(t)).join(' '),
  }));
}

/**
 * Ranked match: label prefixes first, then label substrings, then keyword-only
 * hits (so "united" leads with United Arab Emirates and "usa" still finds the
 * United States). An empty query keeps the list in its original order.
 */
export function matchOptions(index: IndexedOption[], query: string): SearchSelectOption[] {
  const q = key(query.trim());
  if (q === '') return index.map((h) => h.option);
  const prefix: SearchSelectOption[] = [];
  const inside: SearchSelectOption[] = [];
  const byTerm: SearchSelectOption[] = [];
  for (const h of index) {
    if (h.label.startsWith(q)) prefix.push(h.option);
    else if (h.label.includes(q)) inside.push(h.option);
    else if (h.terms.includes(q)) byTerm.push(h.option);
  }
  return [...prefix, ...inside, ...byTerm];
}
