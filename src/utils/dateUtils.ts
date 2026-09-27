/**
 * Comprehensive Local Date Utilities
 * Never relies on UTC ISO conversion for local calendar operations.
 */

const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
const WEEKDAYS_SHORT_ZH = ['日', '一', '二', '三', '四', '五', '六'] as const;

/**
 * Returns YYYY-MM-DD in user's local timezone.
 */
export function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format explicit year, month (1-12), day into YYYY-MM-DD
 */
export function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Parse YYYY-MM-DD safely into a local Date object.
 * Uses 12:00:00 (noon) to avoid any DST boundary ambiguity.
 */
export function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;
  return new Date(year, month, day, 12, 0, 0, 0);
}

/**
 * Check if the given dateKey corresponds to today's local date.
 */
export function isToday(dateKey: string): boolean {
  return dateKey === getLocalDateKey();
}

/**
 * Add or subtract days safely across months, years, leap years.
 */
export function addDays(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return getLocalDateKey(d);
}

/**
 * Add or subtract months safely.
 */
export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1, 12, 0, 0, 0);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
  };
}

/**
 * Get weekday string (e.g. "周日", "周一")
 */
export function getWeekdayName(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return WEEKDAYS_ZH[d.getDay()];
}

/**
 * Get weekday short string (e.g. "日", "一")
 */
export function getWeekdayShort(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return WEEKDAYS_SHORT_ZH[d.getDay()];
}

/**
 * Formats "M月D日" (e.g. "9月27日")
 */
export function formatMonthDay(dateKey: string): string {
  const parts = dateKey.split('-').map(Number);
  return `${parts[1]}月${parts[2]}日`;
}

/**
 * Formats "YYYY年M月" (e.g. "2026年9月")
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

/**
 * Returns header text: "M月D日 周日"
 */
export function formatHeaderDate(dateKey: string): string {
  return `${formatMonthDay(dateKey)} ${getWeekdayName(dateKey)}`;
}

export interface DateStripItem {
  dateKey: string;
  dayNumber: number;
  weekday: string;
  isToday: boolean;
  isSelected: boolean;
}

/**
 * Generate a range of days around selectedDate for horizontal scrolling strip
 */
export function getDateStripRange(selectedDate: string, daysBefore = 7, daysAfter = 14): DateStripItem[] {
  const items: DateStripItem[] = [];
  const todayKey = getLocalDateKey();

  for (let i = -daysBefore; i <= daysAfter; i++) {
    const key = addDays(selectedDate, i);
    const d = parseDateKey(key);
    items.push({
      dateKey: key,
      dayNumber: d.getDate(),
      weekday: WEEKDAYS_ZH[d.getDay()],
      isToday: key === todayKey,
      isSelected: key === selectedDate,
    });
  }

  return items;
}

export interface CalendarGridDay {
  dateKey: string;
  year: number;
  month: number;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Builds the 6-row or 5-row calendar grid for a given year & month (1-12).
 * Standard Monday-first layout (一 二 三 四 五 六 日).
 */
export function getMonthCalendarGrid(year: number, month: number): CalendarGridDay[] {
  const todayKey = getLocalDateKey();
  const firstDayOfMonth = new Date(year, month - 1, 1, 12, 0, 0);
  const lastDayOfMonth = new Date(year, month, 0, 12, 0, 0);
  const daysInCurrentMonth = lastDayOfMonth.getDate();

  // Day of week: 0 is Sun, 1 is Mon, 2 is Tue... 6 is Sat.
  // In Monday-first, Monday is 0, Tuesday is 1... Sunday is 6.
  const rawFirstDay = firstDayOfMonth.getDay();
  const mondayOffset = (rawFirstDay + 6) % 7; // days to fill from prev month

  const grid: CalendarGridDay[] = [];

  // Prev month filler
  const prevMonthLastDate = new Date(year, month - 1, 0, 12, 0, 0);
  const prevMonthDays = prevMonthLastDate.getDate();
  const prevYear = prevMonthLastDate.getFullYear();
  const prevMonth = prevMonthLastDate.getMonth() + 1;

  for (let i = mondayOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const dateKey = formatDateKey(prevYear, prevMonth, dayNum);
    const dayOfWeek = parseDateKey(dateKey).getDay();
    grid.push({
      dateKey,
      year: prevYear,
      month: prevMonth,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  // Current month
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const dateKey = formatDateKey(year, month, dayNum);
    const dayOfWeek = parseDateKey(dateKey).getDay();
    grid.push({
      dateKey,
      year,
      month,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  // Next month filler up to a multiple of 7 (at least 35 or 42 cells)
  const remainingCells = (7 - (grid.length % 7)) % 7;
  // Ensure we display 35 or 42 cells
  const totalTarget = grid.length + remainingCells < 35 ? 35 : grid.length + remainingCells;
  const nextMonthFillerCount = totalTarget - grid.length;

  const nextMonthFirstDate = new Date(year, month, 1, 12, 0, 0);
  const nextYear = nextMonthFirstDate.getFullYear();
  const nextMonth = nextMonthFirstDate.getMonth() + 1;

  for (let dayNum = 1; dayNum <= nextMonthFillerCount; dayNum++) {
    const dateKey = formatDateKey(nextYear, nextMonth, dayNum);
    const dayOfWeek = parseDateKey(dateKey).getDay();
    grid.push({
      dateKey,
      year: nextYear,
      month: nextMonth,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return grid;
}

/**
 * Converts "HH:mm" to minutes from 00:00 (e.g. "14:30" -> 870)
 */
export function timeStringToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formats minutes from 00:00 to "HH:mm"
 */
export function minutesToTimeString(minutes: number): string {
  const clamped = Math.max(0, Math.min(1440, minutes));
  const h = Math.floor(clamped / 60);
  const m = Math.floor(clamped % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Returns current local time in minutes from midnight (0-1440)
 */
export function getCurrentLocalMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Returns current local time formatted as "HH:mm"
 */
export function getCurrentLocalTimeString(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
