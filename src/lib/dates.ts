import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";

export function todayISO(base = new Date()): string {
  return format(startOfDay(base), "yyyy-MM-dd");
}

export function tomorrowISO(base = new Date()): string {
  return format(addDays(startOfDay(base), 1), "yyyy-MM-dd");
}

export function formatDateZh(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return iso;
  }
}

export function formatDateTimeZh(iso: string): string {
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
}

export function isDateTomorrow(iso: string, base = new Date()): boolean {
  return isSameDay(parseISO(iso), addDays(startOfDay(base), 1));
}

export function isDateToday(iso: string, base = new Date()): boolean {
  return isSameDay(parseISO(iso), startOfDay(base));
}
