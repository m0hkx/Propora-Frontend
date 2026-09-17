import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { indexOptions, matchOptions } from './searchSelectUtils';
import type { SearchSelectOption } from './searchSelectUtils';

/**
 * Searchable single-select for lists too long for a native `<select>`.
 *
 * The value can only ever be one of `options` — the search box filters, it is
 * never the value — so a caller cannot receive free text. Matching ranks
 * label-prefix hits first, then label substrings, then keyword hits; only
 * `maxVisible` rows are rendered so a few hundred options stay cheap.
 */
export default function SearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Type to search...',
  emptyLabel = 'No matches',
  invalid = false,
  clearable = true,
  maxVisible = 100,
  className = '',
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  invalid?: boolean;
  clearable?: boolean;
  maxVisible?: number;
  /** Extra class(es) on the wrapping `.combo`, for callers that need non-default sizing. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const index = useMemo(() => indexOptions(options), [options]);
  const matches = useMemo(() => matchOptions(index, query), [index, query]);

  const visible = matches.slice(0, maxVisible);
  const hidden = matches.length - visible.length;

  // Focus the search box on open. Opening and closing reset the query in the
  // handlers below, so every open starts from the full list.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const openPanel = () => {
    setQuery('');
    setActive(0);
    setOpen(true);
  };

  const closePanel = (refocus = false) => {
    setOpen(false);
    setQuery('');
    if (refocus) triggerRef.current?.focus();
  };

  const pick = (option: SearchSelectOption) => {
    onChange(option.value);
    closePanel(true);
  };

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (visible.length === 0 ? 0 : (i + 1) % visible.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (visible.length === 0 ? 0 : (i - 1 + visible.length) % visible.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = visible[active];
      if (option) pick(option);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePanel(true);
    } else if (e.key === 'Tab') {
      closePanel();
    }
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openPanel();
    }
  };

  return (
    <div className={`combo ${className}`} ref={wrapRef}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={`combo-trigger ${invalid ? 'invalid' : ''}`}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-list`}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={onTriggerKey}
      >
        <span className={selected ? '' : 'combo-placeholder'}>{selected ? selected.label : placeholder}</span>
        <svg className="combo-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="combo-panel">
          <div className="combo-search">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={visible[active] ? `${id}-opt-${active}` : undefined}
              autoComplete="off"
            />
          </div>
          <ul className="combo-list" id={`${id}-list`} role="listbox" ref={listRef}>
            {visible.length === 0 ? (
              <li className="combo-empty">{emptyLabel}</li>
            ) : (
              visible.map((o, i) => (
                <li key={o.value} role="none">
                  <button
                    id={`${id}-opt-${i}`}
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    data-active={i === active}
                    className={`combo-option ${i === active ? 'active' : ''} ${o.value === value ? 'selected' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(o)}
                  >
                    <span className="combo-option-body">
                      <span className="combo-option-label">{o.label}</span>
                      {o.detail !== undefined ? <span className="combo-option-detail">{o.detail}</span> : null}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          {hidden > 0 || (clearable && selected) ? (
            <div className="combo-foot">
              <span className="small muted">{hidden > 0 ? `${hidden} more — keep typing to narrow` : ''}</span>
              {clearable && selected ? (
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => {
                    onChange('');
                    closePanel(true);
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
