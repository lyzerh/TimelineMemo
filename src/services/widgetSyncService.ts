/**
 * Widget Data Synchronization Service
 * Bridge between React Task Repository and Android Native App Widget
 */

import { registerPlugin, Capacitor } from '@capacitor/core';
import { Task } from '../types/Task';
import {
  getLocalDateKey,
  formatMonthDay,
  getWeekdayName,
  addDays,
} from '../utils/dateUtils';

export interface WidgetTaskItem {
  id: string;
  title: string;
  allDay: boolean;
  startTime?: string;
  completed: boolean;
}

export interface WidgetDaySnapshot {
  date: string;         // "YYYY-MM-DD"
  dateDisplay: string;  // e.g. "9月27日 周日"
  total: number;
  completed: number;
  tasks: WidgetTaskItem[];
}

export interface WidgetSyncPayload {
  currentDate: string;
  today: WidgetDaySnapshot;
  days: Record<string, WidgetDaySnapshot>; // Today + next 7 days for reliable midnight date rollover
}

interface WidgetSyncPluginInterface {
  updateWidgetData(options: { payload: string }): Promise<{ success: boolean }>;
  getWidgetData(): Promise<{ payload: string }>;
}

const WidgetSyncPlugin = registerPlugin<WidgetSyncPluginInterface>('WidgetSyncPlugin');

class WidgetSyncService {
  /**
   * Sort tasks following the same rules as React TodayWidget:
   * 1. Timed tasks by startTime asc
   * 2. All-day tasks follow after
   * 3. Completed tasks are retained in place (flagged completed: true)
   */
  sortTasksForWidget(tasks: Task[]): Task[] {
    const timed = tasks
      .filter((t) => !t.allDay)
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    const allDay = tasks
      .filter((t) => t.allDay)
      .sort((a, b) => a.title.localeCompare(b.title));

    return [...timed, ...allDay];
  }

  /**
   * Builds snapshot for a specific local calendar date
   */
  createDaySnapshot(dateKey: string, allTasks: Task[]): WidgetDaySnapshot {
    const dayTasks = allTasks.filter((t) => t.date === dateKey);
    const sorted = this.sortTasksForWidget(dayTasks);

    const total = dayTasks.length;
    const completed = dayTasks.filter((t) => t.completed).length;

    const tasks: WidgetTaskItem[] = sorted.map((t) => ({
      id: t.id,
      title: t.title,
      allDay: t.allDay,
      startTime: t.startTime,
      completed: t.completed,
    }));

    return {
      date: dateKey,
      dateDisplay: `${formatMonthDay(dateKey)} ${getWeekdayName(dateKey)}`,
      total,
      completed,
      tasks,
    };
  }

  /**
   * Prepares payload with today snapshot plus 7 days ahead.
   * This guarantees that when the Android device clock crosses midnight (23:59 -> 00:00),
   * the native widget can immediately display the next day's tasks even if the app has not been opened!
   */
  createWidgetPayload(allTasks: Task[]): WidgetSyncPayload {
    const todayKey = getLocalDateKey();
    const todaySnapshot = this.createDaySnapshot(todayKey, allTasks);

    const days: Record<string, WidgetDaySnapshot> = {};
    days[todayKey] = todaySnapshot;

    // Pre-sync next 7 days
    for (let i = 1; i <= 7; i++) {
      const nextDateKey = addDays(todayKey, i);
      days[nextDateKey] = this.createDaySnapshot(nextDateKey, allTasks);
    }

    return {
      currentDate: todayKey,
      today: todaySnapshot,
      days,
    };
  }

  /**
   * Synchronizes data to Android Native SharedPreferences via Capacitor Plugin
   */
  async syncWidgetSnapshot(allTasks: Task[]): Promise<void> {
    try {
      const payload = this.createWidgetPayload(allTasks);
      const payloadJson = JSON.stringify(payload);

      // Always save to localStorage for inspection and web state persistence
      try {
        localStorage.setItem('timeline_memo_widget_payload', payloadJson);
      } catch {
        // ignore
      }

      // If on Android or Native Capacitor platform, send to native SharedPreferences
      if (Capacitor.isNativePlatform()) {
        await WidgetSyncPlugin.updateWidgetData({ payload: payloadJson });
      }
    } catch (e) {
      console.warn('Widget synchronization failed (expected when running in pure web mode):', e);
    }
  }
}

export const widgetSyncService = new WidgetSyncService();
