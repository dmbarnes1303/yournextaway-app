// src/data/ticketGuides/index.ts

import type { TicketGuide } from "./types";

import premierLeagueTicketGuides from "./premierLeague";
import laLigaTicketGuides from "./laLiga";
import serieATicketGuides from "./serieA";
import bundesligaTicketGuides from "./bundesliga";
import ligue1TicketGuides from "./ligue1";

/**
 * Registry (single lookup point)
 */
export const ticketGuides: Record<string, TicketGuide> = {
  ...premierLeagueTicketGuides,
  ...laLigaTicketGuides,
  ...serieATicketGuides,
  ...bundesligaTicketGuides,
  ...ligue1TicketGuides,
};

/**
 * Normalize user/team/club strings to a stable key.
 * - lowercases
 * - strips punctuation
 * - collapses spaces to hyphens
 *
 * IMPORTANT:
 * Your per-league files must use stable keys that match this normalization + aliases.
 */
export function normalizeClubKey(input: string): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "";

  // Pragmatic aliases (fixes real-world inputs + API name variance)
  const alias: Record<string, string> = {
    /* ----------------------------- Premier League ----------------------------- */
    // Man Utd
    "man utd": "manchester-united",
    "man united": "manchester-united",
    "manchester utd": "manchester-united",

    // Man City
    "man city": "manchester-city",
    "manchester city": "manchester-city",

    // Spurs
    "spurs": "tottenham-hotspur",
    "tottenham": "tottenham-hotspur",
    "tottenham hotspur": "tottenham-hotspur",

    // Wolves
    "wolves": "wolverhampton-wanderers",
    "wolverhampton": "wolverhampton-wanderers",
    "wolverhampton wanderers": "wolverhampton-wanderers",

    // West Ham
    "west ham": "west-ham-united",
    "west ham united": "west-ham-united",

    // Newcastle
    "newcastle": "newcastle-united",
    "newcastle united": "newcastle-united",

    // Forest
    "nottingham forest": "nottingham-forest",
    "nottm forest": "nottingham-forest",
    "nffc": "nottingham-forest",

    // Bournemouth
    "bournemouth": "afc-bournemouth",
    "afc bournemouth": "afc-bournemouth",

    // Brighton
    "brighton": "brighton",
    "brighton and hove albion": "brighton",

    // Leeds
    "leeds": "leeds-united",
    "leeds utd": "leeds-united",

    /* -------------------------------- La Liga -------------------------------- */
    "atlético madrid": "atletico-madrid",
    "atletico madrid": "atletico-madrid",
    "atlético de madrid": "atletico-madrid",
    "atletico de madrid": "atletico-madrid",

    "athletic": "athletic-club",
    "athletic bilbao": "athletic-club",
    "athletic club": "athletic-club",

    "real sociedad": "real-sociedad",
    "real betis": "real-betis",
    "rayo": "rayo-vallecano",
    "rayo vallecano": "rayo-vallecano",

    "alavés": "alaves",
    "alaves": "alaves",

    "celta": "celta-vigo",
    "celta vigo": "celta-vigo",
    "rc celta": "celta-vigo",

    /* -------------------------------- Serie A -------------------------------- */
    "ac milan": "milan",
    "a.c. milan": "milan",
    "milan": "milan",

    "internazionale": "inter",
    "inter milan": "inter",
    "inter": "inter",

    "as roma": "roma",
    "a.s. roma": "roma",
    "roma": "roma",

    "ss lazio": "lazio",
    "s.s. lazio": "lazio",
    "lazio": "lazio",

    "hellas verona": "verona",
    "verona": "verona",

    /* ------------------------------ Bundesliga ------------------------------ */
    "bayern": "bayern-munich",
    "bayern munich": "bayern-munich",
    "fc bayern": "bayern-munich",

    "borussia dortmund": "borussia-dortmund",
    "bvb": "borussia-dortmund",
    "dortmund": "borussia-dortmund",

    "borussia mönchengladbach": "borussia-monchengladbach",
    "borussia monchengladbach": "borussia-monchengladbach",
    "m'gladbach": "borussia-monchengladbach",
    "gladbach": "borussia-monchengladbach",

    "rb leipzig": "rb-leipzig",
    "leipzig": "rb-leipzig",

    "bayer leverkusen": "bayer-leverkusen",
    "leverkusen": "bayer-leverkusen",

    "eintracht frankfurt": "eintracht-frankfurt",
    "frankfurt": "eintracht-frankfurt",

    "vfb stuttgart": "vfb-stuttgart",
    "stuttgart": "vfb-stuttgart",

    "1. fc köln": "fc-koln",
    "1. fc koln": "fc-koln",
    "fc köln": "fc-koln",
    "fc koln": "fc-koln",
    "koln": "fc-koln",
    "köln": "fc-koln",

    "hamburg": "hamburger-sv",
    "hamburger sv": "hamburger-sv",
    "hsv": "hamburger-sv",

    "st. pauli": "st-pauli",
    "fc st pauli": "st-pauli",
    "fc st. pauli": "st-pauli",

    "werder": "werder-bremen",
    "werder bremen": "werder-bremen",

    "tsg hoffenheim": "tsg-hoffenheim",
    "hoffenheim": "tsg-hoffenheim",

    "mainz": "mainz-05",
    "mainz 05": "mainz-05",

    /* -------------------------------- Ligue 1 -------------------------------- */
    "psg": "paris-saint-germain",
    "paris sg": "paris-saint-germain",
    "paris saint germain": "paris-saint-germain",
    "paris saint-germain": "paris-saint-germain",

    "olympique de marseille": "marseille",
    "om": "marseille",

    "olympique lyonnais": "lyon",
    "ol": "lyon",

    "as monaco": "monaco",
    "ogc nice": "nice",
    "rc lens": "lens",
    "stade rennais": "rennes",
    "fc nantes": "nantes",
    "stade brestois": "brest",
    "racing strasbourg": "strasbourg",
    "rc strasbourg": "strasbourg",
  };

  const directAlias = alias[raw];
  if (directAlias) return directAlias;

  const cleaned = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return alias[cleaned] ?? cleaned;
}

/**
 * Lookup by any string you have (team name from API, user input, etc).
 */
export function getTicketGuide(clubInput: string): TicketGuide | null {
  const key = normalizeClubKey(clubInput);
  if (!key) return null;
  return ticketGuides[key] ?? null;
}

/**
 * Safe helper: returns a lightweight “ticket badge” value for fixture cards.
 */
export function getTicketDifficultyBadge(clubInput: string): TicketGuide["difficulty"] | null {
  return getTicketGuide(clubInput)?.difficulty ?? null;
}
