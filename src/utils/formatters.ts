// src/utils/formatters.ts
import { parseIsoDateOnly } from "@/src/constants/football";

export function formatUkDateOnly(iso: string | undefined): string {
  if (!iso) return "TBC";
  const d = parseIsoDateOnly(iso);
  if (!d) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatUkDateTimeMaybe(iso: string | undefined): string {
  if (!iso) return "TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
