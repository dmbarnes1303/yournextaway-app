
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
 * Helper to extract TeamGuide[] from various module export formats.
 * Handles:
 * - default export: TeamGuide[]
 * - named export: { teamGuides: TeamGuide[] } or { guides: TeamGuide[] }
 * - any array value in the module
 */
function extractGuides(mod: any): TeamGuide[] {
  if (!mod) return [];
  if (Array.isArray(mod)) return mod;
  if (Array.isArray(mod.default)) return mod.default;
  
  // Search for any array value in the module
  const found = Object.values(mod).find(v => Array.isArray(v));
  return found ? (found as TeamGuide[]) : [];
}

/**
 * Build sources map from all league files
 */
const SOURCES = {
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
 */
const registry: Record<string, TeamGuide> = {};
const duplicates: Record<string, number> = {};

// Populate registry from all sources
for (const [sourceName, guides] of Object.entries(SOURCES)) {
  for (const guide of guides) {
    const key = guide?.teamKey;
    
    // Skip guides without teamKey
    if (!key) {
      console.log(`[teamGuides] Skipping guide without teamKey from ${sourceName}`);
      continue;
    }
    
    // Track duplicates
    if (registry[key]) {
      duplicates[key] = (duplicates[key] || 1) + 1;
      console.log(`[teamGuides] Duplicate teamKey detected: ${key} (source: ${sourceName})`);
      continue;
    }
    
    // Register the guide
    registry[key] = guide;
  }
}

/**
 * Identify missing team guides by comparing against teams registry
 */
const missing = Object.values(teams)
  .filter(t => !registry[t.teamKey])
  .map(t => ({
    expectedGuideKey: t.teamKey,
    name: t.name,
    leagueId: t.leagueId,
    season: t.season,
  }));

// -------------------------
// Public API
// -------------------------

/**
 * Check if a team guide exists for the given teamKey
 */
export function hasTeamGuide(teamKey: string): boolean {
  return !!registry[teamKey];
}

/**
 * Get a team guide by teamKey
 * Returns null if not found
 */
export function getTeamGuide(teamKey: string): TeamGuide | null {
  return registry[teamKey] || null;
}

/**
 * Type definition for missing team guides
 */
export type MissingTeamGuide = {
  expectedGuideKey: string;
  name: string;
  leagueId?: number;
  season?: number;
};

/**
 * Get list of teams that exist in the teams registry but have no guide
 */
export function getMissingTeamGuides(): MissingTeamGuide[] {
  return missing;
}

/**
 * Debug snapshot showing registry health and statistics
 */
export function getTeamGuidesDebugSnapshot() {
  return {
    guidesCount: Object.keys(registry).length,
    registryTeamsCount: Object.keys(teams).length,
    missingCount: missing.length,
    missing,
    duplicates: Object.entries(duplicates).map(([k, v]) => ({ teamKey: k, count: v })),
    bySource: Object.fromEntries(
      Object.entries(SOURCES).map(([k, v]) => [k, v.length])
    ),
  };
}

/**
 * Default export: the complete registry
 */
export default registry;
