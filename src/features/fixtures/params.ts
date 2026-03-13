import type {
  DiscoverContext,
  DiscoverTripLength,
  DiscoverVibe,
} from "@/src/features/discover/discoverEngine";
import {
  isDiscoverCategory,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";

export function coerceString(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

export function coerceNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseDiscoverTripLength(v: unknown): DiscoverTripLength | null {
  const s = String(v ?? "").trim();
  if (s === "day" || s === "1" || s === "2" || s === "3") return s;
  return null;
}

export function parseDiscoverVibes(v: unknown): DiscoverVibe[] {
  const raw = String(v ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => String(part ?? "").trim())
    .filter(
      (part): part is DiscoverVibe =>
        part === "easy" ||
        part === "big" ||
        part === "nightlife" ||
        part === "culture" ||
        part === "warm"
    );
}

export function parseDiscoverCategory(v: unknown): DiscoverCategory | null {
  const s = coerceString(v);
  return isDiscoverCategory(s) ? s : null;
}

export function buildDiscoverContext(input: {
  discoverCategory: DiscoverCategory | null;
  discoverFrom?: unknown;
  discoverTripLength?: unknown;
  discoverVibes?: unknown;
}): DiscoverContext | null {
  if (!input.discoverCategory) return null;

  return {
    origin: coerceString(input.discoverFrom),
    tripLength: parseDiscoverTripLength(input.discoverTripLength),
    vibes: parseDiscoverVibes(input.discoverVibes),
  };
}

export function isTopPicksMode(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "rating" || s === "toppicks" || s === "top_picks" || s === "top-picks";
}
