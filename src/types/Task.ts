/**
 * Task Data Models
 */

export type TaskColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'sky';

export interface Task {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD local date (e.g. "2026-09-27")
  allDay: boolean;
  startTime?: string; // HH:mm (24h format, e.g. "09:00")
  endTime?: string;   // HH:mm (24h format, e.g. "10:30")
  note?: string;
  completed: boolean;
  color?: TaskColor;
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
}

export interface TaskFilterOptions {
  date?: string;
  completed?: boolean;
}
