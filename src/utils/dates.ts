// src/utils/dates.ts

function toDateSafe(value?: string | number | Date | null): Date | null {
  if (value == null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string): string {
  const d = toDateSafe(value);
  if (!d) return "";

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(time: string): string {
  return String(time ?? "").trim();
}

export function isToday(value: string): boolean {
  const checkDate = toDateSafe(value);
  if (!checkDate) return false;

  const today = new Date();

  return (
    today.getDate() === checkDate.getDate() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  );
}

export function formatUkDateTimeMaybe(
  value?: string | number | Date | null
): string | null {
  const d = toDateSafe(value);
  if (!d) return null;

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatIsoToYmd(
  value?: string | number | Date | null
): string | null {
  const d = toDateSafe(value);
  if (!d) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default {
  formatDate,
  formatTime,
  isToday,
  formatUkDateTimeMaybe,
  formatIsoToYmd,
};
