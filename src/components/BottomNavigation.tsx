import React from 'react';
import { useTasks, AppTab } from '../context/TaskContext';
import { Clock, Calendar, Settings } from 'lucide-react';

interface BottomNavigationProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const { selectedDateTasks } = useTasks();

  const activeTimedCount = selectedDateTasks.timedTasks.filter((t) => !t.completed).length;
  const activeAllDayCount = selectedDateTasks.allDayTasks.filter((t) => !t.completed).length;
  const pendingCount = activeTimedCount + activeAllDayCount;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-6 py-2 pb-safe pointer-events-auto shadow-lg transition-colors">
        <div className="flex items-center justify-around">
          {/* Tab 1: Timeline */}
          <button
            onClick={() => onTabChange('timeline')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 relative ${
              currentTab === 'timeline'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">时间线</span>
            {pendingCount > 0 && currentTab !== 'timeline' && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Tab 2: Calendar */}
          <button
            onClick={() => onTabChange('calendar')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 ${
              currentTab === 'calendar'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">日历</span>
          </button>

          {/* Tab 3: Settings */}
          <button
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 ${
              currentTab === 'settings'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">设置</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
