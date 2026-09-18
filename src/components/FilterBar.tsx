import type { ReactNode } from 'react';
import { Icon } from './ui';
import { Icons } from './icons';

export interface FilterTab {
  key: string;
  label: string;
  count: number;
}

/**
 * Status-tab row shared by every list page's filter header. Pages differ on
 * where this sits relative to search/selects (see `FilterRow`), not on the
 * tab markup itself, so only this piece is unified.
 */
export function FilterTabs({
  tabs,
  active,
  onChange,
  ariaLabel,
  className = '',
}: {
  tabs: FilterTab[];
  active: string;
  onChange: (key: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={`tabs ${className}`} role="tablist" aria-label={ariaLabel}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={`tab ${active === t.key ? 'active' : ''}`}
        >
          {t.label} · {t.count}
        </button>
      ))}
    </div>
  );
}

/** The search input every filter header opens with. */
export function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  variant = 'grow',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  variant?: 'grow' | 'sm';
}) {
  return (
    <label className={`search ${variant === 'grow' ? 'search-grow' : 'search-sm'}`}>
      <Icon d={Icons.search} />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
    </label>
  );
}

/** The responsive flex shell wrapping search + selects (and, on some pages, tabs) in one row. */
export function FilterRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap max-md:flex-col max-md:items-stretch">
      {children}
    </div>
  );
}

/** The trailing group of selects/sort/reset controls, right-aligned beside the search field. */
export function FilterControls({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 items-center flex-wrap flex-auto justify-end max-md:w-full">
      {children}
    </div>
  );
}
