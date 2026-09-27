/**
 * Task Repository Layer
 * Clean repository abstraction for local persistence.
 * Uses localStorage with IndexedDB-ready async interface.
 */

import { Task } from '../types/Task';
import { getLocalDateKey, addDays } from '../utils/dateUtils';

const STORAGE_KEY = 'timeline_memo_tasks_v1';
const INITIALIZED_KEY = 'timeline_memo_initialized_v1';

export interface ITaskRepository {
  getAllTasks(): Promise<Task[]>;
  getTasksByDate(date: string): Promise<Task[]>;
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(task: Task): Promise<Task>;
  deleteTask(id: string): Promise<boolean>;
  toggleComplete(id: string): Promise<Task | null>;
  resetToDemo(): Promise<Task[]>;
  clearAll(): Promise<void>;
  exportJSON(): Promise<string>;
  importJSON(jsonString: string): Promise<Task[]>;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

export function createInitialDemoTasks(): Task[] {
  const today = getLocalDateKey();
  const tomorrow = addDays(today, 1);
  const now = new Date().toISOString();

  return [
    {
      id: generateId(),
      title: '英语学习',
      date: today,
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
      note: '背诵雅思核心单词 50 个，听力精听 1 篇',
      completed: false,
      color: 'indigo',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: '买牛奶',
      date: today,
      allDay: true,
      note: '顺路在超市买鲜牛奶与全麦面包',
      completed: false,
      color: 'emerald',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: '完成报告',
      date: today,
      allDay: false,
      startTime: '14:00',
      endTime: '15:30',
      note: '整理本季度项目进度总结与下周计划',
      completed: false,
      color: 'amber',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: '去图书馆',
      date: tomorrow,
      allDay: false,
      startTime: '10:00',
      endTime: '11:30',
      note: '自习与借阅专业设计与算法参考书',
      completed: false,
      color: 'sky',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

class LocalStorageTaskRepository implements ITaskRepository {
  private readFromStorage(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // First run initialization
        const isInit = localStorage.getItem(INITIALIZED_KEY);
        if (!isInit) {
          const demoTasks = createInitialDemoTasks();
          this.writeToStorage(demoTasks);
          localStorage.setItem(INITIALIZED_KEY, 'true');
          return demoTasks;
        }
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read tasks from storage:', e);
      return [];
    }
  }

  private writeToStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to write tasks to storage:', e);
    }
  }

  async getAllTasks(): Promise<Task[]> {
    return this.readFromStorage();
  }

  async getTasksByDate(date: string): Promise<Task[]> {
    const all = this.readFromStorage();
    return all.filter((t) => t.date === date);
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const all = this.readFromStorage();
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    all.push(newTask);
    this.writeToStorage(all);
    return newTask;
  }

  async updateTask(task: Task): Promise<Task> {
    const all = this.readFromStorage();
    const index = all.findIndex((t) => t.id === task.id);
    const updated: Task = {
      ...task,
      updatedAt: new Date().toISOString(),
    };
    if (index >= 0) {
      all[index] = updated;
    } else {
      all.push(updated);
    }
    this.writeToStorage(all);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const all = this.readFromStorage();
    const filtered = all.filter((t) => t.id !== id);
    const changed = filtered.length !== all.length;
    if (changed) {
      this.writeToStorage(filtered);
    }
    return changed;
  }

  async toggleComplete(id: string): Promise<Task | null> {
    const all = this.readFromStorage();
    const task = all.find((t) => t.id === id);
    if (!task) return null;
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    this.writeToStorage(all);
    return { ...task };
  }

  async resetToDemo(): Promise<Task[]> {
    const demo = createInitialDemoTasks();
    this.writeToStorage(demo);
    localStorage.setItem(INITIALIZED_KEY, 'true');
    return demo;
  }

  async clearAll(): Promise<void> {
    this.writeToStorage([]);
    localStorage.setItem(INITIALIZED_KEY, 'true');
  }

  async exportJSON(): Promise<string> {
    const tasks = this.readFromStorage();
    return JSON.stringify(tasks, null, 2);
  }

  async importJSON(jsonString: string): Promise<Task[]> {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid JSON format: expected an array of tasks');
    }
    this.writeToStorage(parsed);
    return parsed;
  }
}

export const taskRepository: ITaskRepository = new LocalStorageTaskRepository();
