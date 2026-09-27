import React, { useRef, useEffect, useState } from 'react';
import { useTasks } from '../context/TaskContext';
import {
  getDateStripRange,
  formatHeaderDate,
  formatYearMonth,
  parseDateKey,
  isToday,
} from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';

export const DateNavigator: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    goToToday,
    goToPrevDay,
    goToNextDay,
    taskCountByDate,
  } = useTasks();

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Generate 28 days around current selected date (-7 to +21)
  const stripItems = getDateStripRange(selectedDate, 8, 20);

  // Parse current year/month from selectedDate
  const parsedDate = parseDateKey(selectedDate);
  const year = parsedDate.getFullYear();
  const month = parsedDate.getMonth() + 1;
  const isSelectedToday = isToday(selectedDate);

  // Auto-scroll the active date item into center
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeItemRef.current;
      const containerWidth = container.offsetWidth;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;

      container.scrollTo({
        left: elementLeft - containerWidth / 2 + elementWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [selectedDate]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20 transition-colors">
      {/* Top Header Row */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        {/* Left: Year & Month + Quick Today */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              {formatYearMonth(year, month)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsDatePickerOpen(true)}
                className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <span>{formatHeaderDate(selectedDate)}</span>
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Day Step Controls & Today Button */}
        <div className="flex items-center gap-1.5">
          {!isSelectedToday && (
            <button
              onClick={goToToday}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition active:scale-95"
              title="回到今天"
            >
              <RotateCcw className="w-3 h-3" />
              <span>今天</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-full p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={goToPrevDay}
              aria-label="前一天"
              className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextDay}
              aria-label="后一天"
              className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden native Date Picker trigger modal */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              选择跳转日期
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setIsDatePickerOpen(false);
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  goToToday();
                  setIsDatePickerOpen(false);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                回到今天
              </button>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Scrollable Date Strip */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 px-3 pb-2.5 overflow-x-auto no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {stripItems.map((item) => {
          const isSelected = item.isSelected;
          const isCurrentDay = item.isToday;
          const taskCount = taskCountByDate.get(item.dateKey) || 0;

          return (
            <button
              key={item.dateKey}
              ref={isSelected ? activeItemRef : null}
              onClick={() => setSelectedDate(item.dateKey)}
              className={`flex flex-col items-center justify-center shrink-0 w-12 py-2 rounded-2xl transition-all duration-150 relative ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.03]'
                  : isCurrentDay
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {/* Weekday label */}
              <span
                className={`text-[10px] font-medium leading-none mb-1.5 ${
                  isSelected
                    ? 'text-indigo-100'
                    : isCurrentDay
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {item.weekday.replace('周', '')}
              </span>

              {/* Day number */}
              <span
                className={`text-base font-bold leading-none ${
                  isSelected
                    ? 'text-white'
                    : isCurrentDay
                    ? 'text-indigo-950 dark:text-indigo-200'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {item.dayNumber}
              </span>

              {/* Task indicator dots or TODAY mini badge */}
              <div className="h-2 flex items-center justify-center mt-1">
                {isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                ) : isCurrentDay ? (
                  <span className="text-[8px] font-extrabold tracking-tighter text-indigo-600 dark:text-indigo-400 scale-90">
                    今
                  </span>
                ) : taskCount > 0 ? (
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(taskCount, 3) }).map((_, idx) => (
                      <span
                        key={idx}
                        className="w-1 h-1 rounded-full bg-indigo-500/70 dark:bg-indigo-400/70"
                      />
                    ))}
                  </div>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
