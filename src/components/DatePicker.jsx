import { useState, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function DatePicker({ value, onChange, placeholder = 'Chọn ngày...' }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value + 'T00:00:00') : new Date();
  });
  const containerRef = useRef(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  // Update viewDate when value changes externally
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleSelect = (day) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const displayValue = selectedDate
    ? format(selectedDate, 'dd/MM/yyyy')
    : '';

  return (
    <div className="datepicker-wrapper" ref={containerRef}>
      <div
        className={`datepicker-trigger form-input ${open ? 'focused' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className={`datepicker-value ${!value ? 'placeholder' : ''}`}>
          {displayValue || placeholder}
        </span>
        <Calendar size={14} className="datepicker-icon" />
      </div>

      {open && (
        <div className="datepicker-dropdown">
          {/* Header */}
          <div className="datepicker-header">
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={() => setViewDate((d) => subMonths(d, 1))}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="datepicker-month-label">
              {format(viewDate, 'MMMM yyyy', { locale: vi })}
            </span>
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={() => setViewDate((d) => addMonths(d, 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="datepicker-weekdays">
            {WEEKDAYS.map((d) => (
              <div key={d} className="datepicker-weekday">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="datepicker-days">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewDate);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={[
                    'datepicker-day',
                    !inMonth && 'other-month',
                    selected && 'selected',
                    today && !selected && 'today',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleSelect(day)}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="datepicker-footer">
            <button
              type="button"
              className="datepicker-footer-btn"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Xóa
            </button>
            <button
              type="button"
              className="datepicker-footer-btn datepicker-today-btn"
              onClick={() => {
                handleSelect(new Date());
              }}
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
