// src/data/teamGuides/index.ts
import type { TeamGuide } from "./types";
import teamsRegistry, { normalizeTeamKey } from "@/src/data/teams";

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

/**
 * Re-export so any consumer can use the SAME normalisation.
 * (Fixes crashes where callers expect teamGuides.normalizeTeamKey)
 */
export { normalizeTeamKey };

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

/* -----------------------------------------
   DEBUG: Missing team guides (no guessing)
   ----------------------------------------- */

function isDev(): boolean {
  // RN + Expo define __DEV__
  // (We keep it defensive so web builds don't crash)
  // eslint-disable-next-line no-undef
  return typeof __DEV__ !== "undefined" ? !!__DEV__ : false;
}

export type MissingTeamGuide = {
  teamKey: string; // canonical from registry
  name: string;
  leagueId?: number;
  city?: string;
  country?: string;
  expectedGuideKey: string; // normalizeTeamKey(teamKey)
};

/**
 * Returns the canonical team registry entries that do NOT have a guide,
 * based purely on the registry keys + normalizeTeamKey.
 *
 * This is the list you should work through to create guides — no guessing.
 */
export function getMissingTeamGuides(): MissingTeamGuide[] {
  const list = Object.values(teamsRegistry as any) as Array<{
    teamKey?: string;
    name?: string;
    leagueId?: number;
    city?: string;
    country?: string;
  }>;

  const missing: MissingTeamGuide[] = [];

  for (const t of list) {
    const teamKeyRaw = String(t?.teamKey ?? "").trim();
    const name = String(t?.name ?? "").trim();
    if (!teamKeyRaw || !name) continue;

    const expectedGuideKey = normalizeTeamKey(teamKeyRaw);
    if (!expectedGuideKey) continue;

    const has = !!teamGuides[expectedGuideKey];
    if (!has) {
      missing.push({
        teamKey: teamKeyRaw,
        name,
        leagueId: typeof t?.leagueId === "number" ? t.leagueId : undefined,
        city: t?.city ? String(t.city) : undefined,
        country: t?.country ? String(t.country) : undefined,
        expectedGuideKey,
      });
    }
  }

  // Stable ordering so the list doesn't jump around
  missing.sort((a, b) => a.expectedGuideKey.localeCompare(b.expectedGuideKey));
  return missing;
}

export type TeamGuidesDebugSnapshot = {
  guidesCount: number;
  registryTeamsCount: number;
  missingCount: number;
  missing: MissingTeamGuide[];
};

/**
 * Useful for a Home “DEV” card or console logging.
 */
export function getTeamGuidesDebugSnapshot(): TeamGuidesDebugSnapshot {
  const missing = getMissingTeamGuides();
  return {
    guidesCount: Object.keys(teamGuides).length,
    registryTeamsCount: Object.keys(teamsRegistry as any).length,
    missingCount: missing.length,
    missing,
  };
}

// Optional: one-time console output in dev to make it obvious immediately.
let _loggedOnce = false;
function maybeLogOnce() {
  if (!isDev()) return;
  if (_loggedOnce) return;
  _loggedOnce = true;

  const snap = getTeamGuidesDebugSnapshot();
  // eslint-disable-next-line no-console
  console.log(
    `[teamGuides] guides=${snap.guidesCount} registryTeams=${snap.registryTeamsCount} missing=${snap.missingCount}`,
    snap.missing.map((m) => `${m.expectedGuideKey} (${m.name})`)
  );
}
maybeLogOnce();

/**
 * Default export MUST be compatible with both patterns:
 * 1) Default import used as a plain registry map: guides["arsenal"]
 * 2) Callers treating it like a module object: guides.normalizeTeamKey(...)
 *
 * We do that by attaching helper functions onto the registry object.
 */
const teamGuidesModule = Object.assign(teamGuides, {
  normalizeTeamKey,
  getTeamGuide,
  hasTeamGuide,
  // debug helpers
  getMissingTeamGuides,
  getTeamGuidesDebugSnapshot,
});

export default teamGuidesModule;
