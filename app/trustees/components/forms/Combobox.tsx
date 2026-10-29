'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { inputClass } from '../styles';

export interface ComboOption {
  value: string;
  label: string;
}

const MAX_SHOWN = 100;

/**
 * Text box with a dropdown list that filters as you type (ARIA combobox
 * pattern). The chosen option's value is posted in a hidden input named
 * `name`; typing without choosing leaves it empty, and `required` then
 * blocks submission with `requiredMessage`.
 */
export default function Combobox({ id, name, options, required, requiredMessage, placeholder, onNoMatch, noMatchLabel }: {
  id: string;
  name: string;
  options: ComboOption[];
  required?: boolean;
  requiredMessage: string;
  placeholder?: string;
  /** Offered as the last row when what's typed isn't an exact match */
  onNoMatch?: (query: string) => void;
  noMatchLabel?: (query: string) => string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ComboOption | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    // Once something is chosen, reopening shows everything rather than just that one.
    if (!q || selected?.label.toLowerCase() === q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, q, selected]);
  const shown = matches.slice(0, MAX_SHOWN);
  const exact = options.some((o) => o.label.toLowerCase() === q);
  const offerNew = !!onNoMatch && q.length >= 2 && !exact;
  const rowCount = shown.length + (offerNew ? 1 : 0);

  useEffect(() => {
    input.current?.setCustomValidity(required && !selected ? requiredMessage : '');
  }, [required, selected, requiredMessage]);

  function choose(o: ComboOption) {
    setSelected(o);
    setQuery(o.label);
    setOpen(false);
  }

  function pick(index: number) {
    if (index < shown.length) choose(shown[index]);
    else if (offerNew) { setOpen(false); onNoMatch!(query.trim()); }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(0); return; }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (rowCount ? (a + step + rowCount) % rowCount : 0));
    } else if (e.key === 'Enter' && open && rowCount) {
      e.preventDefault(); // choose, don't submit the form
      pick(active);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={input}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && rowCount ? `${listId}-${active}` : undefined}
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          // Typing a name exactly counts as choosing it.
          if (!selected) {
            const hit = options.find((o) => o.label.toLowerCase() === q);
            if (hit) choose(hit);
          }
        }}
        onKeyDown={onKeyDown}
        className={inputClass}
      />
      <input type="hidden" name={name} value={selected?.value ?? ''} />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          {shown.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={selected?.value === o.value}
              // mousedown, not click: keeps focus in the input so blur doesn't close the list first.
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-1.5 ${i === active ? 'bg-chapel-50 text-chapel-900' : 'text-gray-800'} ${selected?.value === o.value ? 'font-semibold' : ''}`}
            >
              {o.label}
            </li>
          ))}
          {matches.length > MAX_SHOWN && (
            <li role="presentation" className="px-3 py-1.5 text-xs text-gray-500">
              {matches.length - MAX_SHOWN} more — keep typing to narrow the list.
            </li>
          )}
          {!shown.length && !offerNew && (
            <li role="presentation" className="px-3 py-1.5 text-gray-500">No matches.</li>
          )}
          {offerNew && (
            <li
              id={`${listId}-${shown.length}`}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => { e.preventDefault(); pick(shown.length); }}
              onMouseEnter={() => setActive(shown.length)}
              className={`cursor-pointer border-t border-gray-100 px-3 py-1.5 text-chapel-700 ${active === shown.length ? 'bg-chapel-50' : ''}`}
            >
              {noMatchLabel ? noMatchLabel(query.trim()) : `Add “${query.trim()}”`}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
