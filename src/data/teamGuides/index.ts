// src/data/teamGuides/index.ts

import type { TeamGuide } from "./types";
import { teams } from "@/src/data/teams";

// Helpers
import { normalizeTeamKey, titleFromKey } from "./utils";

// League guide modules
import bundesligaGuides from "./bundesliga";
import laLigaGuides from "./laLiga";
import ligue1Guides from "./ligue1";
import premierLeagueGuides from "./premierLeague";
import serieAGuides from "./serieA";

// Legacy fallback (if it contains arrays/records)
import * as legacy from "./teamGuides";

/**
 * Convert any supported export shape into TeamGuide[]
 *
 * Supports:
 * - TeamGuide[] (direct or default)
 * - Record<string, TeamGuide> (direct or default)
 * - Module with named exports containing either of the above
 */
function toGuides(value: any): TeamGuide[] {
  if (!value) return [];

  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "object") {
    const vals = Object.values(value);
    if (
      vals.length &&
      vals.every((v) => v && typeof v === "object" && "teamKey" in (v as any))
    ) {
      return (vals as TeamGuide[]).filter(Boolean);
    }
  }

  return [];
}

/**
 * Extract guides from a module:
 * - If module.default exists, include it
 * - Also scan named exports
 */
function extractGuides(mod: any): TeamGuide[] {
  if (!mod) return [];

  const out: TeamGuide[] = [];

  if (mod.default) out.push(...toGuides(mod.default));
  out.push(...toGuides(mod));

  for (const v of Object.values(mod)) {
    out.push(...toGuides(v));
  }

  // De-dupe by *raw* teamKey while preserving first occurrence
  // (Normalization de-dupe happens later so we can log collisions properly.)
  const seen = new Set<string>();
  const deduped: TeamGuide[] = [];
  for (const g of out) {
    const k = g?.teamKey;
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(g);
  }

  return deduped;
}

/**
 * Build sources map
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
 * Build registry: Record<teamKey, TeamGuide>
 * - Normalize keys on ingest
 * - Track duplicates/collisions for debugging
 */
const registry: Record<string, TeamGuide> = {};
const duplicates: Record<string, number> = {};
const normalizedCollisions: Array<{
  normalizedKey: string;
  existingRawKey: string;
  incomingRawKey: string;
  source: string;
}> = [];

for (const [sourceName, guides] of Object.entries(SOURCES)) {
  for (const guide of guides) {
    const rawKey = guide?.teamKey;

    if (!rawKey) {
      console.log(`[teamGuides] Skipping guide without teamKey from ${sourceName}`);
      continue;
    }

    const key = normalizeTeamKey(rawKey);

    // If normalization changed it, keep the guide consistent
    const normalizedGuide =
      key === rawKey ? guide : { ...guide, teamKey: key };

    if (registry[key]) {
      duplicates[key] = (duplicates[key] || 1) + 1;
      normalizedCollisions.push({
        normalizedKey: key,
        existingRawKey: registry[key].teamKey,
        incomingRawKey: rawKey,
        source: sourceName,
      });
      console.log(
        `[teamGuides] Duplicate teamKey detected after normalization: ${key} (source: ${sourceName})`
      );
      continue;
    }

    registry[key] = normalizedGuide;
  }
}

/**
 * Identify missing team guides by comparing against teams registry
 * Normalize team keys from teams registry too, so comparisons are consistent.
 */
const missing = Object.values(teams)
  .filter((t) => !registry[normalizeTeamKey(t.teamKey)])
  .map((t) => ({
    expectedGuideKey: normalizeTeamKey(t.teamKey),
    name: t.name,
    leagueId: t.leagueId,
    season: t.season,
  }));

// -------------------------
// Public API
// -------------------------

export function hasTeamGuide(teamKey: string): boolean {
  return !!registry[normalizeTeamKey(teamKey)];
}

export function getTeamGuide(teamKey: string): TeamGuide | null {
  return registry[normalizeTeamKey(teamKey)] || null;
}

export type MissingTeamGuide = {
  expectedGuideKey: string;
  name: string;
  leagueId?: number;
  season?: number;
};

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
    normalizedCollisions,
    bySource: Object.fromEntries(Object.entries(SOURCES).map(([k, v]) => [k, v.length])),
  };
}

// ✅ export the helpers you’re trying to import in screens
export { normalizeTeamKey, titleFromKey };

// default export stays the registry
export default registry;
