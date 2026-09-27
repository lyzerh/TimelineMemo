import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Task } from '../types/Task';
import { taskRepository } from '../services/taskRepository';
import { widgetSyncService } from '../services/widgetSyncService';
import { getLocalDateKey, addDays, parseDateKey } from '../utils/dateUtils';

export type AppTab = 'timeline' | 'calendar' | 'settings';

interface TaskContextType {
  // Navigation & selection
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;

  // Calendar month state
  calendarMonth: { year: number; month: number };
  setCalendarMonth: (val: { year: number; month: number }) => void;
  goToCalendarMonthForSelectedDate: () => void;

  // Tasks data
  tasks: Task[];
  loading: boolean;
  selectedDateTasks: {
    allDayTasks: Task[];
    timedTasks: Task[];
  };
  getTasksForDate: (date: string) => Task[];
  taskCountByDate: Map<string, number>;

  // Task actions
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTaskComplete: (id: string) => Promise<void>;
  resetToDemo: () => Promise<void>;
  clearAllTasks: () => Promise<void>;
  importTasks: (jsonStr: string) => Promise<void>;
  exportTasksJSON: () => Promise<string>;

  // Task modal editor
  isEditorOpen: boolean;
  editingTask: Task | null;
  editorPresetDate: string;
  editorPresetStartTime?: string;
  openCreateModal: (presetDate?: string, presetStartTime?: string) => void;
  openEditModal: (task: Task) => void;
  closeEditorModal: () => void;

  // Dark mode
  isDark: boolean;
  toggleDarkMode: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDateState] = useState<string>(() => getLocalDateKey());
  const [currentTab, setCurrentTab] = useState<AppTab>('timeline');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar Year & Month
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });

  // Modal Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editorPresetDate, setEditorPresetDate] = useState<string>(() => getLocalDateKey());
  const [editorPresetStartTime, setEditorPresetStartTime] = useState<string | undefined>(undefined);

  // Dark Mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('timeline_memo_dark');
      if (stored !== null) return stored === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply dark mode class to documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('timeline_memo_dark', String(isDark));
  }, [isDark]);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  // Load tasks on mount
  const refreshTasks = useCallback(async () => {
    try {
      const all = await taskRepository.getAllTasks();
      setTasks(all);
    } catch (e) {
      console.error('Failed to load tasks', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  // Synchronize Widget Snapshot to Android Native SharedPreferences
  useEffect(() => {
    if (!loading) {
      widgetSyncService.syncWidgetSnapshot(tasks);
    }
  }, [tasks, loading]);

  // Set selected date and ensure calendar month updates if needed
  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
    const parsed = parseDateKey(date);
    setCalendarMonth({
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = getLocalDateKey();
    setSelectedDate(today);
  }, [setSelectedDate]);

  const goToPrevDay = useCallback(() => {
    setSelectedDateState((curr) => addDays(curr, -1));
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDateState((curr) => addDays(curr, 1));
  }, []);

  const goToCalendarMonthForSelectedDate = useCallback(() => {
    const parsed = parseDateKey(selectedDate);
    setCalendarMonth({
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
    });
  }, [selectedDate]);

  // Task map count
  const taskCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      map.set(t.date, (map.get(t.date) || 0) + 1);
    }
    return map;
  }, [tasks]);

  const getTasksForDate = useCallback(
    (date: string) => {
      return tasks.filter((t) => t.date === date);
    },
    [tasks]
  );

  // Partitioned tasks for current selected date
  const selectedDateTasks = useMemo(() => {
    const dayTasks = tasks.filter((t) => t.date === selectedDate);
    const allDayTasks = dayTasks.filter((t) => t.allDay);
    const timedTasks = dayTasks
      .filter((t) => !t.allDay)
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    return { allDayTasks, timedTasks };
  }, [tasks, selectedDate]);

  // Task CRUD operations
  const createTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await taskRepository.createTask(taskData);
      setTasks((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const updateTask = useCallback(async (task: Task) => {
    const updated = await taskRepository.updateTask(task);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const ok = await taskRepository.deleteTask(id);
    if (ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
    return ok;
  }, []);

  const toggleTaskComplete = useCallback(async (id: string) => {
    const updated = await taskRepository.toggleComplete(id);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  }, []);

  const resetToDemo = useCallback(async () => {
    const demo = await taskRepository.resetToDemo();
    setTasks(demo);
  }, []);

  const clearAllTasks = useCallback(async () => {
    await taskRepository.clearAll();
    setTasks([]);
  }, []);

  const importTasks = useCallback(async (jsonStr: string) => {
    const imported = await taskRepository.importJSON(jsonStr);
    setTasks(imported);
  }, []);

  const exportTasksJSON = useCallback(async () => {
    return taskRepository.exportJSON();
  }, []);

  // Modal actions
  const openCreateModal = useCallback((presetDate?: string, presetStartTime?: string) => {
    setEditingTask(null);
    setEditorPresetDate(presetDate || selectedDate);
    setEditorPresetStartTime(presetStartTime);
    setIsEditorOpen(true);
  }, [selectedDate]);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setEditorPresetDate(task.date);
    setEditorPresetStartTime(task.startTime);
    setIsEditorOpen(true);
  }, []);

  const closeEditorModal = useCallback(() => {
    setIsEditorOpen(false);
    setEditingTask(null);
    setEditorPresetStartTime(undefined);
  }, []);

  const value = useMemo(
    () => ({
      selectedDate,
      setSelectedDate,
      goToToday,
      goToPrevDay,
      goToNextDay,
      currentTab,
      setCurrentTab,
      calendarMonth,
      setCalendarMonth,
      goToCalendarMonthForSelectedDate,
      tasks,
      loading,
      selectedDateTasks,
      getTasksForDate,
      taskCountByDate,
      createTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      resetToDemo,
      clearAllTasks,
      importTasks,
      exportTasksJSON,
      isEditorOpen,
      editingTask,
      editorPresetDate,
      editorPresetStartTime,
      openCreateModal,
      openEditModal,
      closeEditorModal,
      isDark,
      toggleDarkMode,
    }),
    [
      selectedDate,
      setSelectedDate,
      goToToday,
      goToPrevDay,
      goToNextDay,
      currentTab,
      calendarMonth,
      goToCalendarMonthForSelectedDate,
      tasks,
      loading,
      selectedDateTasks,
      getTasksForDate,
      taskCountByDate,
      createTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      resetToDemo,
      clearAllTasks,
      importTasks,
      exportTasksJSON,
      isEditorOpen,
      editingTask,
      editorPresetDate,
      editorPresetStartTime,
      openCreateModal,
      openEditModal,
      closeEditorModal,
      isDark,
      toggleDarkMode,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return ctx;
}
