// src/constants/football.ts

export type LeagueOption = {
  label: string;
  leagueId: number;
  season: number;
  /**
   * Flag code for UI.
   * - ISO-3166-1 alpha-2 for sovereign countries (e.g. "ES", "DE")
   * - Special regional codes supported by our flag helpers (e.g. "ENG")
   */
  countryCode: string;
};

/**
 * European football seasons generally start in July/August.
 * API-Football uses the season "start year" (e.g. 2025 means 2025/26).
 */
export function currentFootballSeasonStartYear(now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0=Jan
  return m >= 6 ? y : y - 1; // July(6) onward = new season start year
}

/**
 * Keep this aligned with your API-Football season.
 * IMPORTANT: this is computed so you don't forget to bump it each year.
 */
export const DEFAULT_SEASON = currentFootballSeasonStartYear();

/**
 * Single source of truth for all top leagues used in the app.
 */
export const LEAGUES: LeagueOption[] = [
  // Premier League is ENGLAND (not "GB")
  { label: "Premier League", leagueId: 39, season: DEFAULT_SEASON, countryCode: "ENG" },
  { label: "La Liga", leagueId: 140, season: DEFAULT_SEASON, countryCode: "ES" },
  { label: "Serie A", leagueId: 135, season: DEFAULT_SEASON, countryCode: "IT" },
  { label: "Bundesliga", leagueId: 78, season: DEFAULT_SEASON, countryCode: "DE" },
  { label: "Ligue 1", leagueId: 61, season: DEFAULT_SEASON, countryCode: "FR" },
];

// --------------------
// League slot rules (kickoff-likely heuristics)
// --------------------

/**
 * Used when a fixture kickoff is not confirmed yet.
 * This is intentionally display-first (strings) so UI can show "Likely Sat 15:00"
 * without timezone complexity.
 */
export type LeagueSlotRule = {
  leagueId: number;
  primarySlot: string; // display text e.g. "Sat 15:00"
  typicalSlots: string[]; // optional: used later for UI
};

export const LEAGUE_SLOT_RULES: LeagueSlotRule[] = [
  {
    leagueId: 39,
    primarySlot: "Sat 15:00",
    typicalSlots: ["Fri 20:00", "Sat 12:30", "Sat 15:00", "Sat 17:30", "Sun 14:00", "Sun 16:30", "Mon 20:00"],
  },
  {
    leagueId: 140,
    primarySlot: "Sat 18:30",
    typicalSlots: [
      "Fri 21:00",
      "Sat 14:00",
      "Sat 16:15",
      "Sat 18:30",
      "Sat 21:00",
      "Sun 14:00",
      "Sun 16:15",
      "Sun 18:30",
      "Sun 21:00",
      "Mon 21:00",
    ],
  },
  {
    leagueId: 135,
    primarySlot: "Sun 20:45",
    typicalSlots: ["Fri 20:45", "Sat 15:00", "Sat 18:00", "Sat 20:45", "Sun 12:30", "Sun 15:00", "Sun 18:00", "Sun 20:45", "Mon 20:45"],
  },
  {
    leagueId: 78,
    primarySlot: "Sat 15:30",
    typicalSlots: ["Fri 20:30", "Sat 15:30", "Sat 18:30", "Sun 15:30", "Sun 17:30", "Sun 19:30"],
  },
  {
    leagueId: 61,
    primarySlot: "Sat 21:00",
    typicalSlots: ["Fri 21:00", "Sat 17:00", "Sat 19:00", "Sat 21:00", "Sun 13:00", "Sun 15:00", "Sun 17:00", "Sun 20:45"],
  },
];

// --------------------
// Date helpers
// --------------------

/**
 * CONTRACT (locked):
 * - from/to are ISO date-only "YYYY-MM-DD"
 * - from is clamped to TOMORROW (never includes today/past)
 * - to is INCLUSIVE (the final date included in the window)
 * - days means "number of included days" (days=1 => from==to)
 */

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

function isIsoDateOnly(s?: string): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
}

/**
 * Normalise a window so it is always valid and never includes past/today:
 * - clamps `from` to tomorrow
 * - ensures `to >= from` (if not, sets `to = from + (daysIfInvalidTo-1)`)
 */
export function normalizeWindowIso(input: { from: string; to: string }, daysIfInvalidTo = 90): RollingWindowIso {
  const from = clampFromIsoToTomorrow(String(input.from ?? "").trim());

  const fromDate = parseIsoDateOnly(from);
  const toRaw = String(input.to ?? "").trim();
  const toDate = parseIsoDateOnly(toRaw);

  const safeDays = Math.max(1, Number(daysIfInvalidTo) || 90);
  const fallbackTo = addDaysIso(from, safeDays - 1);

  if (!fromDate) {
    return { from: tomorrowIso(), to: addDaysIso(tomorrowIso(), safeDays - 1) };
  }

  if (!isIsoDateOnly(toRaw) || !toDate) {
    return { from, to: fallbackTo };
  }

  if (toDate.getTime() < fromDate.getTime()) {
    return { from, to: fallbackTo };
  }

  return { from, to: toRaw };
}

/**
 * Central fixture date window (rolling).
 * IMPORTANT: Defaults to TOMORROW onwards (excludes past + today).
 * days is inclusive length. Default is 90 days.
 */
export function getRollingWindowIso(opts?: { days?: number; start?: Date }): RollingWindowIso {
  const days = Math.max(1, Number(opts?.days ?? 90) || 90);
  const start = opts?.start ?? tomorrowLocal();

  const from = toIsoDate(start);
  const to = addDaysIso(from, days - 1);

  return normalizeWindowIso({ from, to }, days);
}

/**
 * Helper: window starting tomorrow for N inclusive days.
 */
export function windowFromTomorrowIso(days: number): RollingWindowIso {
  const safeDays = Math.max(1, Number(days) || 1);
  const from = tomorrowIso();
  const to = addDaysIso(from, safeDays - 1);
  return normalizeWindowIso({ from, to }, safeDays);
}

/**
 * Helper: next weekend (Sat–Sun) from tomorrow onwards.
 * Returns an inclusive window: { from: Saturday, to: Sunday }.
 */
export function nextWeekendWindowIso(): RollingWindowIso {
  const d = tomorrowLocal();
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const daysUntilSat = (6 - day + 7) % 7;

  const sat = new Date(d);
  sat.setHours(0, 0, 0, 0);
  sat.setDate(sat.getDate() + daysUntilSat);

  const sun = new Date(sat);
  sun.setHours(0, 0, 0, 0);
  sun.setDate(sun.getDate() + 1);

  const from = toIsoDate(sat);
  const to = toIsoDate(sun);

  return normalizeWindowIso({ from, to }, 2);
}
