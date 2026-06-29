import React, { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconCheck, IconSearch } from './Icons';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  searchable?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  required = false,
  searchable = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setSearch(''); }
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}

      <select
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={() => {}}
        required={required}
        className="absolute h-0 w-0 opacity-0 pointer-events-none"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between bg-surface-secondary border rounded-xl px-4 py-3 text-left transition-all outline-none
          ${open
            ? 'border-primary-400 ring-2 ring-primary-100'
            : 'border-border-light hover:border-gray-300'
          }`}
      >
        <span className={`text-[13px] font-medium truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <IconChevronDown
          size={15}
          className={`text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-border rounded-xl shadow-lg shadow-black/8 overflow-hidden animate-[fadeIn_0.15s_ease]">
          {/* Search */}
          {searchable && (
            <div className="p-2 border-b border-border-light">
              <div className="relative">
                <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-surface-secondary border border-border-light rounded-lg pl-8 pr-3 py-2 text-[12px] text-gray-700 outline-none focus:border-primary-300 transition-all"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="max-h-[220px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-[12px] text-gray-400 text-center">No results</div>
            )}
            {filtered.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors
                    ${isSelected
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:bg-surface-secondary'
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <IconCheck size={14} className="text-primary-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
