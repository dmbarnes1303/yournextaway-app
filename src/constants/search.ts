// src/constants/search.ts

/**
 * Search configuration + lightweight aliases.
 * Goal: make “human” inputs work (e.g., "Austria" -> Austrian Bundesliga),
 * without forcing users to know league names.
 */

import { DEFAULT_SEASON } from "@/src/constants/football";

export type CountryLeagueHint = {
  countryKey: string; // normalized key e.g. "austria"
  countryLabel: string; // display label e.g. "Austria"
  leagueId: number; // API-Football league id
  season: number;
  leagueLabel: string; // display label e.g. "Austrian Bundesliga"
  // optional: extra search terms that should map to this country/league
  aliases?: string[];
};

/**
 * Countries users commonly type, mapped to the primary league you want to open in Fixtures.
 * You can extend this over time (e.g. add Portugal, Scotland, Turkey, etc.).
 */
export const COUNTRY_LEAGUE_HINTS: CountryLeagueHint[] = [
  {
    countryKey: "england",
    countryLabel: "England",
    leagueId: 39,
    season: DEFAULT_SEASON,
    leagueLabel: "Premier League",
    aliases: ["uk", "u.k.", "britain", "great-britain", "gb"],
  },
  {
    countryKey: "spain",
    countryLabel: "Spain",
    leagueId: 140,
    season: DEFAULT_SEASON,
    leagueLabel: "La Liga",
    aliases: ["espana", "españa"],
  },
  {
    countryKey: "italy",
    countryLabel: "Italy",
    leagueId: 135,
    season: DEFAULT_SEASON,
    leagueLabel: "Serie A",
    aliases: ["italia"],
  },
  {
    countryKey: "germany",
    countryLabel: "Germany",
    leagueId: 78,
    season: DEFAULT_SEASON,
    leagueLabel: "Bundesliga",
    aliases: ["deutschland"],
  },
  {
    countryKey: "france",
    countryLabel: "France",
    leagueId: 61,
    season: DEFAULT_SEASON,
    leagueLabel: "Ligue 1",
    aliases: ["français", "francais"],
  },

  // Critical for your reported UX: users type "Austria" but don't know the league name.
  {
    countryKey: "austria",
    countryLabel: "Austria",
    leagueId: 218,
    season: DEFAULT_SEASON,
    leagueLabel: "Austrian Bundesliga",
    aliases: ["österreich", "osterreich", "austrian", "bundesliga-austria", "aut"],
  },
];

/**
 * Additional league-name aliases (when users type the league itself).
 * This is for the case where users *do* type “Austrian Bundesliga” or shorthand like “PL”.
 */
export type LeagueAlias = {
  leagueId: number;
  season: number;
  label: string; // display label
  terms: string[]; // normalized search terms
};

export const LEAGUE_ALIASES: LeagueAlias[] = [
  { leagueId: 39, season: DEFAULT_SEASON, label: "Premier League", terms: ["premier-league", "epl", "pl"] },
  { leagueId: 140, season: DEFAULT_SEASON, label: "La Liga", terms: ["la-liga", "laliga", "liga"] },
  { leagueId: 135, season: DEFAULT_SEASON, label: "Serie A", terms: ["serie-a", "seriea", "seria-a"] },
  { leagueId: 78, season: DEFAULT_SEASON, label: "Bundesliga", terms: ["bundesliga", "de-bundesliga", "german-bundesliga"] },
  { leagueId: 61, season: DEFAULT_SEASON, label: "Ligue 1", terms: ["ligue-1", "ligue1", "french-league"] },
  { leagueId: 218, season: DEFAULT_SEASON, label: "Austrian Bundesliga", terms: ["austrian-bundesliga", "bundesliga-austria", "austria-bundesliga"] },
];

/**
 * Keys (normalized) that should be treated as “generic noise” in search strings.
 * Keep this conservative; the goal is to remove obvious filler, not meaningful tokens.
 */
export const SEARCH_STOPWORDS = [
  "fc",
  "cf",
  "afc",
  "cfc",
  "the",
  "club",
  "team",
  "stadium",
  "ground",
  "arena",
  "city",
  "town",
  "country",
];

/**
 * How many results per section the Home search UI should show.
 * Keep this small in V1 to avoid overwhelming.
 */
export const SEARCH_LIMITS = {
  teams: 6,
  cities: 6,
  static: 6, // countries + leagues
  venues: 6,
  matches: 6,
} as const;
