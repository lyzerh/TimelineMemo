import React, { useState } from 'react';
import { Task } from '../types/Task';
import { useTasks } from '../context/TaskContext';
import { Check, Plus, ChevronDown, ChevronUp, CalendarCheck } from 'lucide-react';

interface AllDayTasksProps {
  tasks: Task[];
}

export const AllDayTasks: React.FC<AllDayTasksProps> = ({ tasks }) => {
  const { toggleTaskComplete, openEditModal, openCreateModal, selectedDate } = useTasks();
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="mx-4 mt-3 mb-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition"
        >
          <CalendarCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>全天待办</span>
          <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
            ({completedCount}/{tasks.length})
          </span>
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        <button
          onClick={() => openCreateModal(selectedDate)}
          className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-0.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
        >
          <Plus className="w-3 h-3" />
          <span>添加待办</span>
        </button>
      </div>

      {/* Task list */}
      {!collapsed && (
        <div className="p-2 space-y-1.5">
          {tasks.length === 0 ? (
            <div className="py-2.5 text-center text-xs text-slate-400 dark:text-slate-500">
              今日暂无全天待办，点击右上角快速添加
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-2 rounded-xl transition ${
                  task.completed
                    ? 'bg-slate-50/60 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500'
                    : 'bg-slate-50/90 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {/* Toggle checkbox + title */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                      task.completed
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div
                    onClick={() => openEditModal(task)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p
                      className={`text-xs font-medium truncate ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.note && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {task.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit hint on hover */}
                <button
                  onClick={() => openEditModal(task)}
                  className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-60 group-hover:opacity-100 transition px-1.5"
                >
                  编辑
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
