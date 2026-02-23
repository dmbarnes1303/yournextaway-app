// src/data/ticketGuides/index.ts

import type { TicketGuide } from "./types";

import premierLeagueTicketGuides from "./premierLeague";
import laLigaTicketGuides from "./laLiga";
import serieATicketGuides from "./serieA";
import bundesligaTicketGuides from "./bundesliga";
import ligue1TicketGuides from "./ligue1";

/**
 * Registry (single lookup point)
 * NOTE: Best practice is ONE canonical key per club in each league file.
 * Aliases should live in normalizeClubKey() only.
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
 * - strips punctuation/diacritics
 * - collapses whitespace
 * - converts to hyphenated slug
 *
 * IMPORTANT:
 * - Keep aliases here, not scattered across league files.
 * - This is what match/[id] should rely on via getTicketGuide(homeName).
 */
export function normalizeClubKey(input: string): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "";

  // Pragmatic aliases (real-world inputs + API name variance)
  const alias: Record<string, string> = {
    /* ---------------------------- Premier League --------------------------- */
    "man utd": "manchester-united",
    "man united": "manchester-united",
    "manchester utd": "manchester-united",
    "manutd": "manchester-united",

    "spurs": "tottenham-hotspur",
    "tottenham": "tottenham-hotspur",
    "tottenham hotspur": "tottenham-hotspur",

    "wolves": "wolverhampton-wanderers",
    "wolverhampton": "wolverhampton-wanderers",
    "wolverhampton wanderers": "wolverhampton-wanderers",

    "west ham": "west-ham-united",
    "west ham united": "west-ham-united",

    "newcastle": "newcastle-united",
    "newcastle united": "newcastle-united",

    "nottingham forest": "nottingham-forest",
    "nottm forest": "nottingham-forest",
    "nffc": "nottingham-forest",

    "bournemouth": "afc-bournemouth",
    "afc bournemouth": "afc-bournemouth",

    "brighton and hove albion": "brighton",
    "brighton & hove albion": "brighton",

    "leeds": "leeds-united",
    "leeds utd": "leeds-united",
    "leeds united": "leeds-united",

    "man city": "manchester-city",
    "mancity": "manchester-city",
    "manchester city": "manchester-city",

    "villa": "aston-villa",

    "palace": "crystal-palace",

    /* -------------------------------- La Liga ----------------------------- */
    "real madrid": "real-madrid",
    "realmadrid": "real-madrid",

    "barca": "barcelona",
    "fc barcelona": "barcelona",

    "atleti": "atletico-madrid",
    "atletico": "atletico-madrid",
    "atlético madrid": "atletico-madrid",
    "atlético": "atletico-madrid",
    "atl madrid": "atletico-madrid",

    "athletic bilbao": "athletic-club",
    "athletic club bilbao": "athletic-club",
    "athletic club": "athletic-club",

    "real sociedad": "real-sociedad",
    "sociedad": "real-sociedad",

    "real betis": "real-betis",
    "betis": "real-betis",

    "celta": "celta-vigo",
    "celta de vigo": "celta-vigo",
    "rc celta": "celta-vigo",

    "rayo": "rayo-vallecano",
    "rayo vallecano": "rayo-vallecano",

    "alavés": "alaves",

    /* -------------------------------- Serie A ----------------------------- */
    "ac milan": "milan",
    "a.c. milan": "milan",
    "milan": "milan",

    "inter milan": "inter",
    "internazionale": "inter",
    "fc inter": "inter",

    "as roma": "roma",
    "roma": "roma",

    "ss lazio": "lazio",
    "lazio": "lazio",

    "hellas verona": "verona",
    "verona": "verona",

    /* ------------------------------ Bundesliga ----------------------------- */
    "bayern": "bayern-munich",
    "bayern munchen": "bayern-munich",
    "bayern münchen": "bayern-munich",

    "dortmund": "borussia-dortmund",
    "bvb": "borussia-dortmund",
    "borussia dortmund": "borussia-dortmund",

    "leverkusen": "bayer-leverkusen",
    "bayer leverkusen": "bayer-leverkusen",

    "frankfurt": "eintracht-frankfurt",
    "eintracht": "eintracht-frankfurt",

    "stuttgart": "vfb-stuttgart",
    "vfb stuttgart": "vfb-stuttgart",

    "gladbach": "borussia-monchengladbach",
    "mönchengladbach": "borussia-monchengladbach",
    "monchengladbach": "borussia-monchengladbach",

    "freiburg": "sc-freiburg",
    "sc freiburg": "sc-freiburg",

    "union": "union-berlin",
    "union berlin": "union-berlin",

    "werder": "werder-bremen",
    "werder bremen": "werder-bremen",

    "mainz": "mainz-05",
    "mainz 05": "mainz-05",

    "vfl wolfsburg": "wolfsburg",
    "wolfsburg": "wolfsburg",

    "hoffenheim": "tsg-hoffenheim",
    "tsg hoffenheim": "tsg-hoffenheim",

    "köln": "fc-koln",
    "koln": "fc-koln",
    "1. fc köln": "fc-koln",
    "1. fc koln": "fc-koln",

    "hamburg": "hamburger-sv",
    "hamburger sv": "hamburger-sv",
    "hsv": "hamburger-sv",

    "heidenheim": "fc-heidenheim",

    "st. pauli": "st-pauli",
    "st pauli": "st-pauli",

    /* -------------------------------- Ligue 1 ----------------------------- */
    "psg": "paris-saint-germain",
    "paris sg": "paris-saint-germain",
    "paris saint germain": "paris-saint-germain",

    "om": "marseille",
    "olympique de marseille": "marseille",

    "ol": "lyon",
    "olympique lyonnais": "lyon",

    "as monaco": "monaco",

    "losc": "lille",
    "ogc nice": "nice",
    "stade rennais": "rennes",

    "rc lens": "lens",

    "rc strasbourg": "strasbourg",
    "racing strasbourg": "strasbourg",

    "fc nantes": "nantes",

    "le havre ac": "le-havre",
    "le havre": "le-havre",

    "paris fc": "paris-fc",
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
