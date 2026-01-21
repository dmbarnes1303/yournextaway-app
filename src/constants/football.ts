// src/constants/football.ts

export type LeagueOption = {
  label: string;
  leagueId: number;
  season: number;
};

export const DEFAULT_SEASON = 2025;
export const DEFAULT_WINDOW_DAYS = 30;

export const LEAGUES: LeagueOption[] = [
  { label: "Premier League", leagueId: 39, season: DEFAULT_SEASON },
  { label: "La Liga", leagueId: 140, season: DEFAULT_SEASON },
  { label: "Serie A", leagueId: 135, season: DEFAULT_SEASON },
  { label: "Bundesliga", leagueId: 78, season: DEFAULT_SEASON },
  { label: "Ligue 1", leagueId: 61, season: DEFAULT_SEASON },
];

export function findLeagueById(leagueId: number | null | undefined): LeagueOption | null {
  if (!leagueId) return null;
  return LEAGUES.find((l) => l.leagueId === leagueId) ?? null;
}

/** YYYY-MM-DD (local date) */
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
  const d = parseIsoDateOnly(baseIso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function getRollingWindowIso(days: number = DEFAULT_WINDOW_DAYS): { from: string; to: string } {
  const from = toIsoDate(new Date());
  const to = addDaysIso(from, Math.max(1, days));
  return { from, to };
}
