// src/utils/formatters.ts
import { parseIsoDateOnly } from "@/src/constants/football";

function toDateSafe(value?: string | number | Date | null): Date | null {
  if (value == null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatUkDateOnly(value?: string | number | Date | null): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = parseIsoDateOnly(value);
    if (!parsed) return "TBC";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsed);
  }

  const d = toDateSafe(value);
  if (!d) return "TBC";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatUkDateRange(
  startIso?: string | number | Date | null,
  endIso?: string | number | Date | null
): string {
  return `${formatUkDateOnly(startIso)} → ${formatUkDateOnly(endIso)}`;
}

export function formatUkDateTimeMaybe(
  iso?: string | number | Date | null
): string {
  const d = toDateSafe(iso);
  if (!d) return "TBC";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
