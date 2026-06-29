import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IconCalendar, IconArrowLeft, IconArrowRight } from './Icons';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  label?: string;
  required?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  label,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const initialMonth = selectedDate
    ? { year: selectedDate.getFullYear(), month: selectedDate.getMonth() }
    : { year: today.getFullYear(), month: today.getMonth() };

  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonth, setViewMonth] = useState(initialMonth.month);

  const minDate = min ? new Date(min + 'T00:00:00') : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7; // Monday=0

    const days: {
      date: Date;
      day: number;
      inMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i);
      days.push({
        date: d, day: d.getDate(), inMonth: false,
        isToday: false, isSelected: false, isDisabled: true,
      });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(viewYear, viewMonth, i);
      d.setHours(0, 0, 0, 0);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d, day: i, inMonth: true,
        isToday: d.getTime() === today.getTime(),
        isSelected: iso === value,
        isDisabled: minDate ? d < minDate : false,
      });
    }

    // Next month padding
    const remainder = 7 - (days.length % 7);
    if (remainder < 7) {
      for (let i = 1; i <= remainder; i++) {
        const d = new Date(viewYear, viewMonth + 1, i);
        days.push({
          date: d, day: d.getDate(), inMonth: false,
          isToday: false, isSelected: false, isDisabled: true,
        });
      }
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, today]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDate = (d: Date) => {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(iso);
    setOpen(false);
  };

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}

      <input
        tabIndex={-1}
        aria-hidden="true"
        type="date"
        value={value}
        min={min}
        onChange={() => {}}
        required={required}
        className="absolute h-0 w-0 opacity-0 pointer-events-none"
      />

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
        <span className={`text-[13px] font-medium ${displayValue ? 'text-gray-800' : 'text-gray-400'}`}>
          {displayValue || 'Pick a date'}
        </span>
        <IconCalendar size={15} className="text-gray-400 shrink-0 ml-2" />
      </button>

      {/* Calendar Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-[300px] bg-white border border-border rounded-xl shadow-lg shadow-black/8 p-4 animate-[fadeIn_0.15s_ease]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg hover:bg-surface-secondary flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconArrowLeft size={14} />
            </button>
            <span className="text-[13px] font-semibold text-gray-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg hover:bg-surface-secondary flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconArrowRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {DAYS.map(d => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                type="button"
                disabled={day.isDisabled || !day.inMonth}
                onClick={() => day.inMonth && !day.isDisabled && selectDate(day.date)}
                className={`
                  relative w-full aspect-square flex items-center justify-center text-[12px] rounded-lg transition-all
                  ${!day.inMonth
                    ? 'text-gray-200 cursor-default'
                    : day.isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : day.isSelected
                    ? 'bg-primary-600 text-white font-bold shadow-sm shadow-primary-200'
                    : day.isToday
                    ? 'bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100'
                    : 'text-gray-700 hover:bg-surface-secondary font-medium'
                  }
                `}
              >
                {day.day}
                {day.isToday && !day.isSelected && (
                  <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-border-light">
            <button
              type="button"
              onClick={() => selectDate(today)}
              className="w-full text-[11px] font-semibold text-primary-600 hover:text-primary-700 py-1.5 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
