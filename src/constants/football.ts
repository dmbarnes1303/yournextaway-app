// src/constants/football.ts

export type LeagueOption = {
  label: string;
  leagueId: number;
  season: number;
  countryCode: string; // ISO-2 for emoji flag
};

export const DEFAULT_SEASON = 2025;

export const LEAGUES: LeagueOption[] = [
  { label: "Premier League", leagueId: 39, season: DEFAULT_SEASON, countryCode: "GB" },
  { label: "La Liga", leagueId: 140, season: DEFAULT_SEASON, countryCode: "ES" },
  { label: "Serie A", leagueId: 135, season: DEFAULT_SEASON, countryCode: "IT" },
  { label: "Bundesliga", leagueId: 78, season: DEFAULT_SEASON, countryCode: "DE" },
  { label: "Ligue 1", leagueId: 61, season: DEFAULT_SEASON, countryCode: "FR" },
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

export function tomorrowLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

export function tomorrowIso(): string {
  return toIsoDate(tomorrowLocal());
}

export function clampFromIsoToTomorrow(fromIso: string): string {
  const tmr = tomorrowIso();
  const fromDate = parseIsoDateOnly(fromIso);
  const tmrDate = parseIsoDateOnly(tmr);
  if (!fromDate || !tmrDate) return tmr;
  return fromDate.getTime() < tmrDate.getTime() ? tmr : fromIso;
}

export function normalizeWindowIso(
  input: { from: string; to: string },
  daysIfInvalidTo = 30
): RollingWindowIso {
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
 * Defaults to 90 days (as you wanted).
 */
export function getRollingWindowIso(opts?: { days?: number; start?: Date }): RollingWindowIso {
  const days = opts?.days ?? 90;
  const start = opts?.start ?? tomorrowLocal();

  const from = toIsoDate(start);
  const to = addDaysIso(from, days);
  return normalizeWindowIso({ from, to }, days);
}
