import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export interface CustomWeekPickerProps {
  value: string; // Expected in YYYY-Www format (e.g., '2026-W33') or empty
  onChange: (weekStr: string) => void;
  onRangeChange?: (startDate: string, endDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right' | 'auto';
  id?: string;
}

// ─── ISO Week Helper Functions ───────────────────────────────────────────────

export function getISOWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

export function getWeekRangeFromISO(weekStr: string): { start: Date; end: Date; label: string } {
  if (!weekStr) return { start: new Date(), end: new Date(), label: '' };
  
  const match = weekStr.match(/^(\d{4})-?W?(\d{1,2})$/i);
  if (!match) return { start: new Date(), end: new Date(), label: weekStr };
  
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  
  // 4th of January is always in week 1
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dayOfWeek <= 4)
    ISOweekStart.setDate(simple.getDate() - (simple.getDay() || 7) + 1);
  else
    ISOweekStart.setDate(simple.getDate() + (8 - (simple.getDay() || 7)));

  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 5); // Monday to Saturday delivery week

  return {
    start: ISOweekStart,
    end: ISOweekEnd,
    label: `Week ${String(week).padStart(2, '0')} (${ISOweekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${ISOweekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
  };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Wk', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const CustomWeekPicker: React.FC<CustomWeekPickerProps> = ({
  value,
  onChange,
  onRangeChange,
  placeholder = 'Select calendar week (Mon - Sat)',
  disabled = false,
  className = '',
  align = 'auto',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    isAbove: boolean;
  }>({ left: 0, isAbove: false });

  // Parse initial date from week or default to today
  const initDate = () => {
    if (value) {
      const range = getWeekRangeFromISO(value);
      return range.start;
    }
    return new Date();
  };

  const [viewDate, setViewDate] = useState<Date>(initDate);

  useEffect(() => {
    if (value) {
      const range = getWeekRangeFromISO(value);
      setViewDate(range.start);
    }
  }, [value]);

  // Calculate dynamic top/bottom and left/right position
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const calendarHeight = 410;
    const calendarWidth = 350;

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
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectWeek = (year: number, week: number, mondayDate: Date) => {
    const weekFormatted = `${year}-W${String(week).padStart(2, '0')}`;
    onChange(weekFormatted);

    if (onRangeChange) {
      const satDate = new Date(mondayDate);
      satDate.setDate(mondayDate.getDate() + 5);
      onRangeChange(
        mondayDate.toISOString().split('T')[0],
        satDate.toISOString().split('T')[0]
      );
    }
    setIsOpen(false);
  };

  const handleSetThisWeek = () => {
    const today = new Date();
    const iso = getISOWeek(today);
    const dayOfWeek = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    
    setViewDate(monday);
    handleSelectWeek(iso.year, iso.week, monday);
  };

  const handleSetNextWeek = () => {
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const iso = getISOWeek(nextWeekDate);
    const dayOfWeek = nextWeekDate.getDay() || 7;
    const monday = new Date(nextWeekDate);
    monday.setDate(nextWeekDate.getDate() - dayOfWeek + 1);

    setViewDate(monday);
    handleSelectWeek(iso.year, iso.week, monday);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Build Weeks Grid for Month
  // Find the first day of month (Monday-based: 1=Mon, ..., 7=Sun)
  const firstOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayDayOfWeek = firstOfMonth.getDay() || 7; // 1 to 7

  // Start from the Monday of the first week
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - firstDayDayOfWeek + 1);

  // Generate 6 weeks (42 days)
  const weeksData = [];
  const curr = new Date(startDate);

  for (let w = 0; w < 6; w++) {
    const weekDays = [];
    const mondayOfThisWeek = new Date(curr);
    const iso = getISOWeek(mondayOfThisWeek);
    const weekKey = `${iso.year}-W${String(iso.week).padStart(2, '0')}`;

    for (let d = 0; d < 7; d++) {
      weekDays.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    weeksData.push({
      weekNum: iso.week,
      weekYear: iso.year,
      weekKey,
      mondayDate: mondayOfThisWeek,
      days: weekDays,
      isCurrentMonth: weekDays.some(d => d.getMonth() === currentMonth)
    });
  }

  const selectedRange = value ? getWeekRangeFromISO(value) : null;

  return (
    <div className="relative w-full" id={id}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left border cursor-pointer ${
          disabled
            ? 'opacity-60 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
            : isOpen
            ? 'border-purple-500 bg-white dark:bg-slate-800 ring-4 ring-purple-500/15 shadow-md text-slate-900 dark:text-white'
            : 'bg-[#F7F9FB] dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-100 shadow-2xs'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          {value && selectedRange ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-extrabold text-purple-700 dark:text-purple-300">
                Week {value.replace(/^.*-W?/i, '')}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] truncate">
                ({selectedRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {selectedRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
              </span>
            </div>
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
            title="Clear week"
          >
            <X className="w-3.5 h-3.5" />
          </div>
        )}
      </button>

      {/* Dynamic Week Calendar Popover via Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : 'auto',
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
            left: `${coords.left}px`,
            width: '350px',
            zIndex: 999999
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-4 backdrop-blur-xl"
        >
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>{MONTH_NAMES[currentMonth]}</span>
              <span className="text-purple-600 dark:text-purple-400 font-black">{currentYear}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Column Headers (Wk + Mo Tu We Th Fr Sa Su) */}
          <div className="grid grid-cols-8 gap-0.5 text-center mb-1.5 w-full">
            {WEEKDAY_NAMES.map((d, index) => (
              <span
                key={d}
                className={`text-[10px] font-black uppercase tracking-wider py-0.5 ${
                  index === 0
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 rounded-md'
                    : index === 6 || index === 7
                    ? 'text-rose-500 dark:text-rose-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Weeks Rows */}
          <div className="space-y-1">
            {weeksData.map((week) => {
              const isSelected = value === week.weekKey;
              const isHovered = hoveredWeek === week.weekKey;

              return (
                <div
                  key={week.weekKey}
                  onMouseEnter={() => setHoveredWeek(week.weekKey)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  onClick={() => handleSelectWeek(week.weekYear, week.weekNum, week.mondayDate)}
                  className={`grid grid-cols-8 gap-0.5 items-center p-0.5 rounded-xl cursor-pointer transition-all duration-100 ${
                    isSelected
                      ? 'bg-purple-600 text-white font-extrabold shadow-md shadow-purple-600/30'
                      : isHovered
                      ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {/* Week Badge */}
                  <div
                    className={`h-7 flex items-center justify-center text-[10px] font-black rounded-lg ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isHovered
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold'
                    }`}
                  >
                    {week.weekNum}
                  </div>

                  {/* 7 Days of Week */}
                  {week.days.map((dayObj, dIdx) => {
                    const isDiffMonth = dayObj.getMonth() !== currentMonth;
                    return (
                      <div
                        key={dIdx}
                        className={`h-7 flex items-center justify-center text-xs rounded-md ${
                          isSelected
                            ? 'text-white font-bold'
                            : isDiffMonth
                            ? 'text-slate-300 dark:text-slate-600'
                            : 'text-slate-700 dark:text-slate-200 font-medium'
                        }`}
                      >
                        {dayObj.getDate()}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Quick Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSetThisWeek}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                This Week
              </button>
              <button
                type="button"
                onClick={handleSetNextWeek}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Next Week
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
