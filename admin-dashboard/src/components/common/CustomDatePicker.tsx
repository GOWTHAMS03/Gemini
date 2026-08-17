import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  ChevronDown,
  Clock,
  ArrowRight
} from 'lucide-react';

export interface CustomDatePickerProps {
  value: string; // Expected in YYYY-MM-DD format
  onChange: (dateStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  align?: 'left' | 'right' | 'auto';
  id?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className = '',
  minDate,
  maxDate,
  align = 'auto',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    isAbove: boolean;
  }>({ left: 0, isAbove: false });

  // Parse initial date or default to current date
  const parsedDate = value ? new Date(value) : new Date();
  const validParsed = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

  const [currentYear, setCurrentYear] = useState(validParsed.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(validParsed.getMonth());

  // Synchronize calendar view with incoming value
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  // Calculate dynamic top/bottom and left/right position
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const calendarHeight = 390;
    const calendarWidth = 320;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const isAbove = spaceBelow < calendarHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    if (align === 'right' || left + calendarWidth > window.innerWidth - 12) {
      left = Math.max(12, rect.right - calendarWidth);
    }
    if (left < 12) left = 12;

    if (isAbove) {
      setCoords({
        bottom: window.innerHeight - rect.top + 8,
        left,
        isAbove: true
      });
    } else {
      setCoords({
        top: rect.bottom + 8,
        left,
        isAbove: false
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, align]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrev = () => {
    if (viewMode === 'days') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((prev) => prev - 1);
      } else {
        setCurrentMonth((prev) => prev - 1);
      }
    } else if (viewMode === 'months') {
      setCurrentYear((prev) => prev - 1);
    } else if (viewMode === 'years') {
      setCurrentYear((prev) => prev - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((prev) => prev + 1);
      } else {
        setCurrentMonth((prev) => prev + 1);
      }
    } else if (viewMode === 'months') {
      setCurrentYear((prev) => prev + 1);
    } else if (viewMode === 'years') {
      setCurrentYear((prev) => prev + 12);
    }
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handleSelectDay = (day: number) => {
    const dateStr = formatDateString(currentYear, currentMonth, day);
    onChange(dateStr);
    setIsOpen(false);
    setViewMode('days');
  };

  const handleSetToday = () => {
    const today = new Date();
    const dateStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
    onChange(dateStr);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setIsOpen(false);
    setViewMode('days');
  };

  const handleSetOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = formatDateString(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(dateStr);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setIsOpen(false);
    setViewMode('days');
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setViewMode('days');
  };

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === currentMonth &&
    today.getFullYear() === currentYear;

  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y === currentYear && m === currentMonth + 1 && d === day;
  };

  // Format trigger display date
  const displayFormattedDate = () => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Year range calculation for Year picker mode
  const yearStart = Math.floor(currentYear / 12) * 12;
  const yearRange = Array.from({ length: 12 }, (_, i) => yearStart + i);

  return (
    <div className="relative w-full" id={id}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setViewMode('days');
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left border cursor-pointer ${
          disabled
            ? 'opacity-60 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
            : isOpen
            ? 'border-indigo-500 bg-white dark:bg-slate-800 ring-4 ring-indigo-500/15 shadow-md text-slate-900 dark:text-white'
            : 'bg-[#F7F9FB] dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-100 shadow-2xs'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
          {value ? (
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {displayFormattedDate()}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        {value && !disabled && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-md transition"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </div>
        )}
      </button>

      {/* Dynamic Calendar Popover via Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : 'auto',
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
            left: `${coords.left}px`,
            width: '320px',
            zIndex: 999999
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-4 backdrop-blur-xl"
        >
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            {/* Quick Month & Year Switcher Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                className="font-extrabold text-xs text-slate-800 dark:text-white px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{MONTH_NAMES[currentMonth]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                className="font-black text-xs text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{viewMode === 'years' ? `${yearStart} - ${yearStart + 11}` : currentYear}</span>
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>
            </div>

            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VIEW 1: DAYS CALENDAR GRID */}
          {viewMode === 'days' && (
            <>
              {/* Weekday Labels (7 Equal Columns) */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5 w-full">
                {DAY_NAMES.map((d, index) => (
                  <span
                    key={d}
                    className={`text-[10px] font-black uppercase tracking-wider py-0.5 ${
                      index === 0 || index === 6
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Matrix */}
              <div className="grid grid-cols-7 gap-1 text-center w-full">
                {/* Previous Month Days */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                  const day = daysInPrevMonth - firstDayOfMonth + i + 1;
                  return (
                    <button
                      key={`prev-${i}`}
                      type="button"
                      onClick={() => {
                        handlePrev();
                      }}
                      className="h-8 w-full flex items-center justify-center text-[11px] text-slate-300 dark:text-slate-600 font-medium hover:text-slate-400 select-none cursor-pointer"
                    >
                      {day}
                    </button>
                  );
                })}

                {/* Current Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const selected = isSelected(day);
                  const todayDate = isToday(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-8 w-full rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-100 cursor-pointer relative ${
                        selected
                          ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/35 scale-105 z-10'
                          : todayDate
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold hover:bg-indigo-100'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {day}
                      {todayDate && !selected && (
                        <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* VIEW 2: MONTH SELECTION GRID */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {MONTH_SHORT.map((m, idx) => {
                const isCur = idx === currentMonth;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(idx);
                      setViewMode('days');
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCur
                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW 3: YEAR SELECTION GRID */}
          {viewMode === 'years' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {yearRange.map((y) => {
                const isCur = y === currentYear;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setCurrentYear(y);
                      setViewMode('months');
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCur
                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Shortcuts Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetOffset(0)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSetOffset(30)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition cursor-pointer"
              >
                +1 Mo
              </button>
              <button
                type="button"
                onClick={() => handleSetOffset(365)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition cursor-pointer"
              >
                +1 Yr
              </button>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition cursor-pointer px-1.5 py-0.5"
            >
              Clear
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
