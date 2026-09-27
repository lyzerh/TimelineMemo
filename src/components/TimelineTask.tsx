import React from 'react';
import { Task, TaskColor } from '../types/Task';
import { useTasks } from '../context/TaskContext';
import { Check } from 'lucide-react';

interface TimelineTaskProps {
  task: Task;
  top: number;
  height: number;
  leftPercent?: number;
  widthPercent?: number;
}

const COLOR_MAP: Record<
  TaskColor,
  {
    bg: string;
    border: string;
    stripe: string;
    text: string;
    timeText: string;
  }
> = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    stripe: 'bg-indigo-600 dark:bg-indigo-500',
    text: 'text-indigo-950 dark:text-indigo-100',
    timeText: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    stripe: 'bg-emerald-600 dark:bg-emerald-500',
    text: 'text-emerald-950 dark:text-emerald-100',
    timeText: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/60',
    stripe: 'bg-amber-600 dark:bg-amber-500',
    text: 'text-amber-950 dark:text-amber-100',
    timeText: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/60',
    stripe: 'bg-rose-600 dark:bg-rose-500',
    text: 'text-rose-950 dark:text-rose-100',
    timeText: 'text-rose-600 dark:text-rose-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/60',
    stripe: 'bg-purple-600 dark:bg-purple-500',
    text: 'text-purple-950 dark:text-purple-100',
    timeText: 'text-purple-600 dark:text-purple-400',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/60',
    stripe: 'bg-sky-600 dark:bg-sky-500',
    text: 'text-sky-950 dark:text-sky-100',
    timeText: 'text-sky-600 dark:text-sky-400',
  },
};

export const TimelineTask: React.FC<TimelineTaskProps> = ({
  task,
  top,
  height,
  leftPercent = 0,
  widthPercent = 100,
}) => {
  const { toggleTaskComplete, openEditModal } = useTasks();

  const colorScheme = COLOR_MAP[task.color || 'indigo'];

  return (
    <div
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 42)}px`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }}
      className="absolute pr-1.5 transition-all duration-150 z-10"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          openEditModal(task);
        }}
        className={`w-full h-full rounded-xl border flex flex-col justify-between p-2 pl-2.5 relative overflow-hidden cursor-pointer shadow-xs transition hover:shadow-md active:scale-[0.99] select-none ${
          task.completed
            ? 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
            : `${colorScheme.bg} ${colorScheme.border}`
        }`}
      >
        {/* Color Accent Indicator Strip */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            task.completed ? 'bg-slate-400 dark:bg-slate-600' : colorScheme.stripe
          }`}
        />

        {/* Top line: Time badge + Title + Complete Checkbox */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-bold tracking-tight ${
                  task.completed ? 'text-slate-400' : colorScheme.timeText
                }`}
              >
                {task.startTime}
                {task.endTime ? ` - ${task.endTime}` : ''}
              </span>
            </div>
            <h4
              className={`text-xs font-semibold leading-snug mt-0.5 truncate ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : colorScheme.text
              }`}
            >
              {task.title}
            </h4>
          </div>

          {/* Quick complete checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskComplete(task.id);
            }}
            aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition ${
              task.completed
                ? 'bg-emerald-500 text-white'
                : 'border border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white/80 dark:bg-slate-800/80'
            }`}
          >
            {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
          </button>
        </div>

        {/* Note if space permits and exists */}
        {height > 55 && task.note && (
          <p
            className={`text-[10px] line-clamp-1 mt-1 ${
              task.completed ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {task.note}
          </p>
        )}
      </div>
    </div>
  );
};
