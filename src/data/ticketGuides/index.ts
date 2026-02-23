// src/data/ticketGuides/index.ts

import type { TicketGuide } from "./types";
import premierLeagueTicketGuides from "./premierLeague";

/**
 * Registry (single lookup point)
 */
export const ticketGuides: Record<string, TicketGuide> = {
  ...premierLeagueTicketGuides,
};

/**
 * Normalize user/team/club strings to a stable key.
 * - lowercases
 * - strips punctuation
 * - collapses spaces to hyphens
 */
export function normalizeClubKey(input: string): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "";

  // Pragmatic aliases (fixes real-world inputs + API name variance)
  const alias: Record<string, string> = {
    // Man Utd
    "man utd": "manchester-united",
    "man united": "manchester-united",
    "manchester utd": "manchester-united",

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

    // City shorthand
    "man city": "manchester-city",
    "manchester city": "manchester-city",
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
