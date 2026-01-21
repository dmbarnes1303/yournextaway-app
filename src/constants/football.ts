// src/constants/football.ts

export type LeagueOption = { label: string; leagueId: number; season: number };

export const DEFAULT_SEASON = 2025;

// Single source of truth for all top leagues used in app
export const LEAGUES: LeagueOption[] = [
  { label: "Premier League", leagueId: 39, season: DEFAULT_SEASON },
  { label: "La Liga", leagueId: 140, season: DEFAULT_SEASON },
  { label: "Serie A", leagueId: 135, season: DEFAULT_SEASON },
  { label: "Bundesliga", leagueId: 78, season: DEFAULT_SEASON },
  { label: "Ligue 1", leagueId: 61, season: DEFAULT_SEASON },
];

// ---- Date helpers ----

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Parse "YYYY-MM-DD"
export function parseIsoDateOnly(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDaysIso(baseIso: string, days: number): string {
  const base = parseIsoDateOnly(baseIso) ?? new Date();
  base.setDate(base.getDate() + days);
  return toIsoDate(base);
}

export type RollingWindowIso = { from: string; to: string };

// Central fixture date window (rolling)
export function getRollingWindowIso(opts?: { days?: number; start?: Date }): RollingWindowIso {
  const days = opts?.days ?? 30;
  const start = opts?.start ?? new Date();

  const from = toIsoDate(start);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  const to = toIsoDate(end);

  return { from, to };
}
