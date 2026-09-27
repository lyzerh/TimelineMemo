import React, { useMemo } from 'react';
import { Task } from '../types/Task';
import { getLocalDateKey, formatMonthDay, getWeekdayName } from '../utils/dateUtils';
import { Check, Clock, Calendar } from 'lucide-react';

export interface TodayWidgetProps {
  todayDateKey?: string;
  tasks: Task[];
  onToggleTask?: (id: string) => void;
  onOpenTask?: (task: Task) => void;
  className?: string;
}

export const TodayWidget: React.FC<TodayWidgetProps> = ({
  todayDateKey,
  tasks,
  onToggleTask,
  onOpenTask,
  className = '',
}) => {
  const currentTodayKey = todayDateKey || getLocalDateKey();

  // Rule 1: Filter strictly to today's tasks
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === currentTodayKey);
  }, [tasks, currentTodayKey]);

  // Rule 2: Sorting:
  // 1. Timed tasks sorted by startTime
  // 2. All-day tasks follow after
  // 3. Keep completed tasks with reduced visual prominence
  const sortedTasks = useMemo(() => {
    const timed = todayTasks
      .filter((t) => !t.allDay)
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    const allDay = todayTasks
      .filter((t) => t.allDay)
      .sort((a, b) => a.title.localeCompare(b.title));

    return [...timed, ...allDay];
  }, [todayTasks]);

  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalCount = todayTasks.length;

  return (
    <div
      className={`rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 p-4 shadow-lg shadow-indigo-500/5 select-none transition-all ${className}`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5 mb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              TODAY
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {formatMonthDay(currentTodayKey)} {getWeekdayName(currentTodayKey)}
            </span>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
          {completedCount} / {totalCount} completed
        </div>
      </div>

      {/* Widget Task List */}
      <div className="space-y-1.5 min-h-[90px]">
        {sortedTasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-1">
            <Calendar className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            <span>今日暂无待办任务</span>
          </div>
        ) : (
          sortedTasks.slice(0, 6).map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between gap-2 p-1.5 rounded-xl transition ${
                task.completed
                  ? 'opacity-50 text-slate-400 dark:text-slate-500 line-through'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              {/* Checkbox + Title & Time */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleTask && onToggleTask(task.id)}
                  aria-label={task.completed ? '已完成' : '未完成'}
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition ${
                    task.completed
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-500'
                  }`}
                >
                  {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <div
                  onClick={() => onOpenTask && onOpenTask(task)}
                  className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                >
                  {!task.allDay && task.startTime && (
                    <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
                      {task.startTime}
                    </span>
                  )}
                  <span className="text-xs font-medium truncate">
                    {task.title}
                  </span>
                </div>
              </div>

              {/* Task Tag */}
              {task.allDay ? (
                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                  全天
                </span>
              ) : (
                <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
            </div>
          ))
        )}

        {sortedTasks.length > 6 && (
          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-1">
            还有 {sortedTasks.length - 6} 个任务...
          </p>
        )}
      </div>

      {/* Progress Bar indicator */}
      {totalCount > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
