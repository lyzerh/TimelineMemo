import React, { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import {
  getMonthCalendarGrid,
  formatYearMonth,
  addMonths,
  getLocalDateKey,
  formatMonthDay,
  getWeekdayName,
  parseDateKey,
} from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  CheckCircle2,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';

const WEEKDAYS_HEADER = ['一', '二', '三', '四', '五', '六', '日'];

export const CalendarView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    setCurrentTab,
    calendarMonth,
    setCalendarMonth,
    taskCountByDate,
    getTasksForDate,
    goToToday,
  } = useTasks();

  const { year, month } = calendarMonth;
  const todayKey = getLocalDateKey();

  const handlePrevMonth = () => {
    setCalendarMonth(addMonths(year, month, -1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(addMonths(year, month, 1));
  };

  const handleBackToToday = () => {
    goToToday();
    const today = new Date();
    setCalendarMonth({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    });
  };

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey);
    // Directly navigate to Timeline page as requested in specs:
    // "用户点击 27：直接跳转到：9月27日时间线。"
    setCurrentTab('timeline');
  };

  // Generate calendar grid
  const gridCells = useMemo(() => {
    return getMonthCalendarGrid(year, month);
  }, [year, month]);

  // Check if current selectedDate falls within the currently browsed year and month
  const parsedSelected = useMemo(() => parseDateKey(selectedDate), [selectedDate]);
  const isSelectedInViewMonth =
    parsedSelected.getFullYear() === year && parsedSelected.getMonth() + 1 === month;

  // Tasks preview for the currently selected date
  const selectedDateTasks = useMemo(() => {
    return isSelectedInViewMonth ? getTasksForDate(selectedDate) : [];
  }, [getTasksForDate, selectedDate, isSelectedInViewMonth]);

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Month Navigation Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sticky top-0 z-10 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatYearMonth(year, month)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToToday}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>回到今天</span>
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={handlePrevMonth}
                aria-label="上个月"
                className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="下个月"
                className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Calendar Board */}
      <div className="p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-xs">
          {/* Weekday headers: 一 二 三 四 五 六 日 */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {WEEKDAYS_HEADER.map((day, idx) => {
              const isWeekend = idx >= 5;
              return (
                <div
                  key={day}
                  className={`text-xs font-semibold py-1 ${
                    isWeekend
                      ? 'text-rose-500/80 dark:text-rose-400/80'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {gridCells.map((cell) => {
              const isSelected = cell.dateKey === selectedDate;
              const isCurrentDay = cell.isToday;
              const taskCount = taskCountByDate.get(cell.dateKey) || 0;

              return (
                <button
                  key={cell.dateKey}
                  onClick={() => handleDateClick(cell.dateKey)}
                  className={`flex flex-col items-center justify-between p-1.5 min-h-[52px] rounded-xl transition relative group ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isCurrentDay
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300/80 dark:border-indigo-800'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Day number */}
                  <span
                    className={`text-sm font-semibold leading-tight ${
                      isSelected
                        ? 'text-white'
                        : isCurrentDay
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : cell.isCurrentMonth
                        ? cell.isWeekend
                          ? 'text-rose-600/90 dark:text-rose-400/90'
                          : 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Task indicator dots */}
                  <div className="h-2 flex items-center justify-center gap-0.5">
                    {taskCount > 0 ? (
                      taskCount <= 3 ? (
                        Array.from({ length: taskCount }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : 'bg-indigo-500 dark:bg-indigo-400'
                            }`}
                          />
                        ))
                      ) : (
                        <span
                          className={`text-[9px] font-extrabold px-1 rounded-full ${
                            isSelected
                              ? 'bg-white text-indigo-700'
                              : 'bg-indigo-500 text-white'
                          }`}
                        >
                          {taskCount}
                        </span>
                      )
                    ) : isCurrentDay && !isSelected ? (
                      <span className="text-[8px] font-bold text-indigo-500 scale-90">
                        今
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date preview card */}
        <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          {!isSelectedInViewMonth ? (
            <div className="py-4 text-center">
              <CalendarCheck className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                选择日期查看当日日程
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                当前正在浏览 {formatYearMonth(year, month)}，点击上方任意日期可直接跳转该日时间线
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{formatMonthDay(selectedDate)} {getWeekdayName(selectedDate)}</span>
                    {selectedDate === todayKey && (
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded-full">
                        今天
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    共 {selectedDateTasks.length} 个任务
                  </p>
                </div>

                <button
                  onClick={() => setCurrentTab('timeline')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                >
                  <span>查看时间线</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedDateTasks.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                  该日暂无安排，点击上方或时间线即可添加
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setCurrentTab('timeline')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        t.completed
                          ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {t.allDay ? (
                          <CalendarCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`font-semibold truncate ${t.completed ? 'line-through text-slate-400' : ''}`}>
                            {t.title}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {t.allDay ? '全天' : `${t.startTime || ''} - ${t.endTime || ''}`}
                          </p>
                        </div>
                      </div>
                      {t.completed && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
