import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { indexOptions, matchOptions } from './searchSelectUtils';
import type { SearchSelectOption } from './searchSelectUtils';

/**
 * Searchable multi-select — the multi-pick sibling of `SearchSelect`, reusing
 * its matching logic (`indexOptions`/`matchOptions`) and panel styling.
 *
 * Unlike `SearchSelect`, picking a row toggles membership without closing the
 * panel, so several picks happen in one open. Selected items render as
 * removable chips below the trigger, independent of whether the panel is open.
 */
export default function MultiSearchSelect({
  id,
  values,
  onChange,
  options,
  placeholder = 'Select options',
  searchPlaceholder = 'Type to search...',
  emptyLabel = 'No matches',
  invalid = false,
  maxVisible = 100,
}: {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  invalid?: boolean;
  maxVisible?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedSet = new Set(values);
  const selectedOptions = values.map((v) => options.find((o) => o.value === v)).filter((o): o is SearchSelectOption => o !== undefined);

  const index = useMemo(() => indexOptions(options), [options]);
  const matches = useMemo(() => matchOptions(index, query), [index, query]);

  const visible = matches.slice(0, maxVisible);
  const hidden = matches.length - visible.length;

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

  const toggle = (option: SearchSelectOption) => {
    onChange(selectedSet.has(option.value) ? values.filter((v) => v !== option.value) : [...values, option.value]);
  };

  const remove = (value: string) => onChange(values.filter((v) => v !== value));

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
      if (option) toggle(option);
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
    <div className="flex flex-col gap-2">
      <div className="combo" ref={wrapRef}>
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
          <span className={values.length > 0 ? '' : 'combo-placeholder'}>
            {values.length > 0 ? `${values.length} selected` : placeholder}
          </span>
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
            <ul className="combo-list" id={`${id}-list`} role="listbox" aria-multiselectable="true" ref={listRef}>
              {visible.length === 0 ? (
                <li className="combo-empty">{emptyLabel}</li>
              ) : (
                visible.map((o, i) => {
                  const picked = selectedSet.has(o.value);
                  return (
                    <li key={o.value} role="none">
                      <button
                        id={`${id}-opt-${i}`}
                        type="button"
                        role="option"
                        aria-selected={picked}
                        data-active={i === active}
                        className={`combo-option ${i === active ? 'active' : ''} ${picked ? 'selected' : ''}`}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => toggle(o)}
                      >
                        <span className="ms-check" aria-hidden="true">{picked ? '✓' : ''}</span>
                        <span className="combo-option-body">
                          <span className="combo-option-label">{o.label}</span>
                          {o.detail !== undefined ? <span className="combo-option-detail">{o.detail}</span> : null}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            {hidden > 0 ? (
              <div className="combo-foot">
                <span className="small muted">{hidden} more — keep typing to narrow</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {selectedOptions.length > 0 ? (
        <div className="chip-list">
          {selectedOptions.map((o) => (
            <span key={o.value} className="chip">
              {o.label}
              <button type="button" className="chip-remove" aria-label={`Remove ${o.label}`} onClick={() => remove(o.value)}>
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
