// src/constants/football.ts

export type LeagueOption = { label: string; leagueId: number; season: number };

/**
 * Keep this aligned with your API-Football season.
 * If you roll seasons later, this should be the single place you change it.
 */
export const DEFAULT_SEASON = 2025;

/**
 * Single source of truth for all top leagues used in the app.
 * IMPORTANT: This list is used by Home, Fixtures, and Trip Build.
 */
export const LEAGUES: LeagueOption[] = [
  { label: "Premier League", leagueId: 39, season: DEFAULT_SEASON },
  { label: "La Liga", leagueId: 140, season: DEFAULT_SEASON },
  { label: "Serie A", leagueId: 135, season: DEFAULT_SEASON },
  { label: "Bundesliga", leagueId: 78, season: DEFAULT_SEASON },
  { label: "Ligue 1", leagueId: 61, season: DEFAULT_SEASON },
];

// --------------------
// Date helpers
// --------------------

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse "YYYY-MM-DD" as a local-midnight Date (safe for date-only comparisons).
 */
export function parseIsoDateOnly(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDaysIso(baseIso: string, days: number): string {
  const base = parseIsoDateOnly(baseIso) ?? new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return toIsoDate(base);
}

export type RollingWindowIso = { from: string; to: string };

/**
 * Local "tomorrow" at 00:00:00.
 */
export function tomorrowLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

export function tomorrowIso(): string {
  return toIsoDate(tomorrowLocal());
}

/**
 * Enforce "tomorrow onwards" (excludes past + today).
 * If input is invalid, returns tomorrow.
 */
export function clampFromIsoToTomorrow(fromIso: string): string {
  const tmr = tomorrowIso();
  const fromDate = parseIsoDateOnly(fromIso);
  const tmrDate = parseIsoDateOnly(tmr);
  if (!fromDate || !tmrDate) return tmr;
  return fromDate.getTime() < tmrDate.getTime() ? tmr : fromIso;
}

/**
 * Normalise a window so it is always valid and never includes past/today:
 * - clamps `from` to tomorrow
 * - ensures `to >= from` (if not, sets `to = from + days`)
 */
export function normalizeWindowIso(input: { from: string; to: string }, daysIfInvalidTo = 30): RollingWindowIso {
  const from = clampFromIsoToTomorrow(input.from);

  const toDate = parseIsoDateOnly(input.to);
  const fromDate = parseIsoDateOnly(from);

  if (!toDate || !fromDate) {
    return { from, to: addDaysIso(from, daysIfInvalidTo) };
  }

  if (toDate.getTime() < fromDate.getTime()) {
    return { from, to: addDaysIso(from, daysIfInvalidTo) };
  }

  return { from, to: input.to };
}

/**
 * Central fixture date window (rolling).
 * IMPORTANT: Defaults to TOMORROW onwards (excludes past + today).
 */
export function getRollingWindowIso(opts?: { days?: number; start?: Date }): RollingWindowIso {
  const days = opts?.days ?? 30;
  const start = opts?.start ?? tomorrowLocal();

  const from = toIsoDate(start);
  const to = addDaysIso(from, days);

  // Safety: if caller passes a start in the past/today, we still clamp to tomorrow.
  return normalizeWindowIso({ from, to }, days);
}
