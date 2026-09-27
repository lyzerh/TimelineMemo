import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Task } from '../types/Task';
import { TimelineTask } from './TimelineTask';
import { useTasks } from '../context/TaskContext';
import {
  isToday,
  timeStringToMinutes,
  getCurrentLocalMinutes,
  getCurrentLocalTimeString,
} from '../utils/dateUtils';
import { Moon, Check } from 'lucide-react';

interface TimelineProps {
  tasks: Task[];
}

const START_HOUR = 6;  // 06:00
const END_HOUR = 24;   // 24:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 18 hours
const HOUR_HEIGHT = 68; // px per hour

interface LayoutedTask {
  task: Task;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
}

export const Timeline: React.FC<TimelineProps> = ({ tasks }) => {
  const { selectedDate, openCreateModal, openEditModal, toggleTaskComplete } = useTasks();
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);

  // Current real time updates every 30 seconds
  const [currentMinutes, setCurrentMinutes] = useState<number>(getCurrentLocalMinutes);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(getCurrentLocalTimeString);

  const isCurrentDateToday = isToday(selectedDate);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMinutes(getCurrentLocalMinutes());
      setCurrentTimeStr(getCurrentLocalTimeString());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Partition tasks into early morning (< 06:00) vs main timeline (>= 06:00)
  const { earlyMorningTasks, mainTimelineTasks } = useMemo(() => {
    const early: Task[] = [];
    const main: Task[] = [];

    for (const t of tasks) {
      const mins = timeStringToMinutes(t.startTime || '08:00');
      if (mins < START_HOUR * 60) {
        early.push(t);
      } else {
        main.push(t);
      }
    }

    // Sort early tasks by start time
    early.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    return { earlyMorningTasks: early, mainTimelineTasks: main };
  }, [tasks]);

  // Compute overlapping columns layout for main timeline tasks (>= 06:00)
  const layoutedTasks: LayoutedTask[] = useMemo(() => {
    if (!mainTimelineTasks || mainTimelineTasks.length === 0) return [];

    // Map each task to minute interval
    const taskIntervals = mainTimelineTasks.map((task) => {
      const start = timeStringToMinutes(task.startTime || '08:00');
      let end = task.endTime ? timeStringToMinutes(task.endTime) : start + 60;
      if (end <= start) end = start + 30; // fallback duration

      // Offset from 06:00
      const timelineStart = START_HOUR * 60;
      const top = Math.max(0, ((start - timelineStart) / 60) * HOUR_HEIGHT);
      const height = Math.max(38, ((end - start) / 60) * HOUR_HEIGHT);

      return {
        task,
        start,
        end,
        top,
        height,
        col: 0,
        totalCols: 1,
      };
    });

    // Sort by start time, then duration
    taskIntervals.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Overlap clustering
    const clusters: Array<typeof taskIntervals> = [];
    let currentCluster: typeof taskIntervals = [];
    let clusterEnd = -1;

    for (const item of taskIntervals) {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterEnd = item.end;
      } else if (item.start < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.end;
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // Assign columns in each cluster
    for (const cluster of clusters) {
      const columns: number[] = [];
      for (const item of cluster) {
        let placed = false;
        for (let c = 0; c < columns.length; c++) {
          if (item.start >= columns[c]) {
            columns[c] = item.end;
            item.col = c;
            placed = true;
            break;
          }
        }
        if (!placed) {
          item.col = columns.length;
          columns.push(item.end);
        }
      }
      for (const item of cluster) {
        item.totalCols = columns.length;
      }
    }

    return taskIntervals.map((item) => ({
      task: item.task,
      top: item.top,
      height: item.height,
      leftPercent: (item.col / item.totalCols) * 100,
      widthPercent: 100 / item.totalCols,
    }));
  }, [mainTimelineTasks]);

  // Initial scroll to current time or earliest task
  useEffect(() => {
    if (!containerRef.current) return;

    let targetScrollY = 0;
    if (isCurrentDateToday) {
      const nowOffset = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      targetScrollY = Math.max(0, nowOffset - 180);
    } else if (layoutedTasks.length > 0) {
      targetScrollY = Math.max(0, layoutedTasks[0].top - 100);
    } else {
      // Default to 08:00
      targetScrollY = (8 - START_HOUR) * HOUR_HEIGHT - 50;
    }

    containerRef.current.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  }, [selectedDate, isCurrentDateToday]);

  // Generate hours array 06:00 to 24:00
  const hoursArray = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  }, []);

  // Handle clicking anywhere on the 06:00-24:00 timeline canvas
  const handleTimelineCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    // Convert pixel offset to minutes from 06:00
    const hourFraction = offsetY / HOUR_HEIGHT;
    const rawMinutes = START_HOUR * 60 + hourFraction * 60;

    // Clamp between 06:00 (360) and 23:45 (1425)
    const clampedMinutes = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - 15, rawMinutes));

    // Snap to nearest 15 minutes: 00, 15, 30, 45
    const snappedMinutes = Math.round(clampedMinutes / 15) * 15;
    const h = Math.floor(snappedMinutes / 60);
    const m = snappedMinutes % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    openCreateModal(selectedDate, timeStr);
  };

  // Current time position
  const nowTopPosition = useMemo(() => {
    const timelineStartMins = START_HOUR * 60;
    return ((currentMinutes - timelineStartMins) / 60) * HOUR_HEIGHT;
  }, [currentMinutes]);

  const showNowLine =
    isCurrentDateToday &&
    currentMinutes >= START_HOUR * 60 &&
    currentMinutes <= END_HOUR * 60;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto relative pb-28 select-none"
    >
      {/* 凌晨日程 (06:00 前任务区域，仅在存在该类任务时展示) */}
      {earlyMorningTasks.length > 0 && (
        <div className="mx-4 mt-2 mb-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span>凌晨日程 (06:00 前)</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
              ({earlyMorningTasks.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {earlyMorningTasks.map((t) => (
              <div
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(t);
                }}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                  t.completed
                    ? 'bg-slate-100/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-800/90 border-indigo-200/60 dark:border-indigo-800/60 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px] shrink-0">
                    {t.startTime}
                    {t.endTime ? ` - ${t.endTime}` : ''}
                  </span>
                  <span
                    className={`font-semibold truncate ${
                      t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {t.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskComplete(t.id);
                  }}
                  aria-label={t.completed ? '标记为未完成' : '标记为已完成'}
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition ${
                    t.completed
                      ? 'bg-emerald-500 text-white'
                      : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 06:00 - 24:00 时间轴主体画布 */}
      <div
        ref={gridRef}
        onClick={handleTimelineCanvasClick}
        className="relative min-w-full cursor-pointer"
        style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT + 40}px` }}
      >
        {/* Hour Grid lines & Left labels */}
        {hoursArray.map((hour, idx) => {
          const top = idx * HOUR_HEIGHT;
          const timeLabel = `${String(hour === 24 ? 24 : hour).padStart(2, '0')}:00`;

          return (
            <div
              key={hour}
              style={{ top: `${top}px` }}
              className="absolute left-0 right-0 h-[1px] flex items-center pointer-events-none"
            >
              {/* Left Time label */}
              <div className="w-14 pl-3 pr-2 text-right shrink-0 -translate-y-2.5">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 font-mono tracking-tighter">
                  {timeLabel}
                </span>
              </div>

              {/* Grid dividing line */}
              <div className="flex-1 h-[1px] bg-slate-200/70 dark:bg-slate-800/70 relative" />
            </div>
          );
        })}

        {/* Timetable right content lane (offset by 56px for time labels) */}
        <div className="absolute left-14 right-2 top-0 bottom-0 pointer-events-none">
          {/* Active Tasks positioned by startTime & duration */}
          <div className="relative w-full h-full pointer-events-auto">
            {layoutedTasks.map((item) => (
              <TimelineTask
                key={item.task.id}
                task={item.task}
                top={item.top}
                height={item.height}
                leftPercent={item.leftPercent}
                widthPercent={item.widthPercent}
              />
            ))}
          </div>
        </div>

        {/* Current Time NOW Line (when selectedDate is today) */}
        {showNowLine && (
          <div
            ref={nowIndicatorRef}
            style={{ top: `${nowTopPosition}px` }}
            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
          >
            {/* Time label badge on left */}
            <div className="w-14 pl-1 pr-1.5 flex items-center justify-end shrink-0">
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1 py-0.5 rounded font-mono shadow-xs">
                {currentTimeStr}
              </span>
            </div>

            {/* Glowing red marker line */}
            <div className="flex-1 flex items-center relative">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 shadow-xs -ml-1 shrink-0" />
              <div className="flex-1 h-[2px] bg-rose-500 shadow-sm" />
              <span className="absolute right-3 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                NOW
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
