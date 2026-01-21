// src/config/fixturesConfig.ts

export type LeagueOption = {
  label: string;
  leagueId: number;
  season: number;
};

export const DEFAULT_SEASON = 2025;

// Single source of truth for “top leagues”
export const LEAGUES: LeagueOption[] = [
  { label: "Premier League", leagueId: 39, season: DEFAULT_SEASON },
  { label: "La Liga", leagueId: 140, season: DEFAULT_SEASON },
  { label: "Serie A", leagueId: 135, season: DEFAULT_SEASON },
  { label: "Bundesliga", leagueId: 78, season: DEFAULT_SEASON },
  { label: "Ligue 1", leagueId: 61, season: DEFAULT_SEASON },
];

// Rolling window used across the app (Home/Fixtures/Build Trip)
export const ROLLING_WINDOW_DAYS = 30;

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysIso(baseIso: string, days: number): string {
  const d = new Date(`${baseIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    // fallback if caller passes garbage
    const now = new Date();
    now.setDate(now.getDate() + days);
    return toIsoDate(now);
  }
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function getDefaultWindow(now: Date = new Date()) {
  const from = toIsoDate(now);
  const to = addDaysIso(from, ROLLING_WINDOW_DAYS);
  return { from, to };
}

export function findLeagueById(leagueId: number | null | undefined): LeagueOption | null {
  if (!leagueId) return null;
  return LEAGUES.find((l) => l.leagueId === leagueId) ?? null;
}

export function getDefaultLeague(): LeagueOption {
  return LEAGUES[0];
}
