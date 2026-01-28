// src/data/teamGuides/index.ts

import type { TeamGuide } from "./types";
import { teams } from "@/src/data/teams";

// Import all league guide modules
import bundesligaGuides from "./bundesliga";
import laLigaGuides from "./laLiga";
import ligue1Guides from "./ligue1";
import premierLeagueGuides from "./premierLeague";
import serieAGuides from "./serieA";

// Import legacy fallback
import * as legacy from "./teamGuides";

/**
 * Type guards
 */
function isTeamGuide(x: any): x is TeamGuide {
  return !!x && typeof x === "object" && typeof x.teamKey === "string" && x.teamKey.length > 0;
}

function isRecordOfTeamGuides(x: any): x is Record<string, TeamGuide> {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  const vals = Object.values(x);
  if (!vals.length) return false;
  return vals.every(isTeamGuide);
}

/**
 * Extract TeamGuide[] from a module.
 *
 * Handles:
 * - TeamGuide[] (direct)
 * - default export TeamGuide[]
 * - Record<string, TeamGuide> (direct)
 * - default export Record<string, TeamGuide>
 * - named export TeamGuide[]
 * - named export Record<string, TeamGuide>
 *
 * IMPORTANT:
 * Some bundlers / interop paths may give you the default export directly (no .default).
 * This function explicitly supports that.
 */
function extractGuides(mod: any): TeamGuide[] {
  if (!mod) return [];

  // 1) Module itself is a Record<string, TeamGuide>
  if (isRecordOfTeamGuides(mod)) return Object.values(mod);

  // 2) Module itself is an array
  if (Array.isArray(mod)) return mod.filter(isTeamGuide);

  // 3) Default export is a Record<string, TeamGuide>
  if (isRecordOfTeamGuides(mod.default)) return Object.values(mod.default);

  // 4) Default export is an array
  if (Array.isArray(mod.default)) return mod.default.filter(isTeamGuide);

  // 5) Search named exports for a Record<string, TeamGuide>
  for (const v of Object.values(mod)) {
    if (isRecordOfTeamGuides(v)) return Object.values(v);
  }

  // 6) Search named exports for an array with TeamGuide items
  for (const v of Object.values(mod)) {
    if (Array.isArray(v)) {
      const arr = (v as any[]).filter(isTeamGuide);
      if (arr.length) return arr;
    }
  }

  return [];
}

/**
 * Build sources map from all league files
 */
const SOURCES: Record<string, TeamGuide[]> = {
  bundesliga: extractGuides(bundesligaGuides),
  laLiga: extractGuides(laLigaGuides),
  ligue1: extractGuides(ligue1Guides),
  premierLeague: extractGuides(premierLeagueGuides),
  serieA: extractGuides(serieAGuides),
  legacy: extractGuides(legacy),
};

/**
 * Build the registry: Record<teamKey, TeamGuide>
 * Track duplicates for debugging
 *
 * Deterministic: first write wins.
 * Put "legacy" last so it never overrides the league sources.
 */
const registry: Record<string, TeamGuide> = {};
const duplicates: Record<string, number> = {};

// Populate registry from all sources
for (const [sourceName, guides] of Object.entries(SOURCES)) {
  for (const guide of guides) {
    const key = guide?.teamKey;

    if (!key) {
      console.log(`[teamGuides] Skipping guide without teamKey from ${sourceName}`);
      continue;
    }

    if (registry[key]) {
      duplicates[key] = (duplicates[key] || 1) + 1;
      console.log(`[teamGuides] Duplicate teamKey detected: ${key} (source: ${sourceName})`);
      continue;
    }

    registry[key] = guide;
  }
}

/**
 * Identify missing team guides by comparing against teams registry
 */
const missing = Object.values(teams)
  .filter((t) => !registry[t.teamKey])
  .map((t) => ({
    expectedGuideKey: t.teamKey,
    name: t.name,
    leagueId: t.leagueId,
    season: t.season,
  }));

// -------------------------
// Public API
// -------------------------

export type MissingTeamGuide = {
  expectedGuideKey: string;
  name: string;
  leagueId?: number;
  season?: number;
};

export function hasTeamGuide(teamKey: string): boolean {
  return !!registry[teamKey];
}

export function getTeamGuide(teamKey: string): TeamGuide | null {
  return registry[teamKey] || null;
}

export function getMissingTeamGuides(): MissingTeamGuide[] {
  return missing;
}

export function getTeamGuidesDebugSnapshot() {
  return {
    guidesCount: Object.keys(registry).length,
    registryTeamsCount: Object.keys(teams).length,
    missingCount: missing.length,
    missing,
    duplicates: Object.entries(duplicates).map(([k, v]) => ({ teamKey: k, count: v })),
    bySource: Object.fromEntries(Object.entries(SOURCES).map(([k, v]) => [k, v.length])),
  };
}

export default registry;
