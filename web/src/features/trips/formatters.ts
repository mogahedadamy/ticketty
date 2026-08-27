import type { TripStatus } from "./types";

export const tripStatusLabels: Record<TripStatus, string> = {
  SCHEDULED: "مجدولة",
  OPEN: "مفتوحة",
  FULL: "مكتملة المقاعد",
  DEPARTED: "نشطة",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};

export function formatTripDate(value: string): string {
  return new Intl.DateTimeFormat("ar-SD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} دقيقة`;
  return remainder ? `${hours} س ${remainder} د` : `${hours} ساعة`;
}
