// src/data/teamGuides/index.ts
import type { TeamGuide } from "./types";
import { normalizeTeamKey } from "@/src/data/teams";

import { premierLeagueTeamGuides } from "./premierLeague";
import { laLigaTeamGuides } from "./laLiga";
import { serieATeamGuides } from "./serieA";
import { bundesligaTeamGuides } from "./bundesliga";
import { ligue1TeamGuides } from "./ligue1";

/**
 * Team Guide registry + helpers.
 *
 * Source of truth rules:
 * - Team keys are defined in src/data/teams (team registry).
 * - Guides must use the same key-normalisation as the team registry.
 * - This index merges all league guide maps into one registry.
 *
 * Key examples:
 * - "arsenal"
 * - "real-madrid"
 * - "paris-saint-germain"
 */

export const teamGuides: Record<string, TeamGuide> = {
  ...premierLeagueTeamGuides,
  ...laLigaTeamGuides,
  ...serieATeamGuides,
  ...bundesligaTeamGuides,
  ...ligue1TeamGuides,
};

export function getTeamGuide(teamInput: string): TeamGuide | null {
  const key = normalizeTeamKey(teamInput);
  return teamGuides[key] ?? null;
}

/**
 * Convenience helper for UI: whether a guide exists.
 */
export function hasTeamGuide(teamInput: string): boolean {
  return !!getTeamGuide(teamInput);
}

export default teamGuides;
