// src/data/teamGuides/index.ts
import { teams, normalizeTeamKey } from "@/src/data/teams";
import type { TeamGuide } from "@/src/data/teamGuides/types";

/**
 * IMPORTANT:
 * Update these imports to match your actual files.
 * Each module should export either:
 * - default: TeamGuide[]
 * OR
 * - named export: teamGuides: TeamGuide[]
 */

// ✅ Adjust these 5 lines to your real filenames:
import premierLeagueGuides from "@/src/data/teamGuides/premierLeague";
import laLigaGuides from "@/src/data/teamGuides/laLiga";
import serieAGuides from "@/src/data/teamGuides/serieA";
import bundesligaGuides from "@/src/data/teamGuides/bundesliga";
import ligue1Guides from "@/src/data/teamGuides/ligue1";

export type MissingTeamGuide = {
  expectedGuideKey: string; // the teamKey we expect to exist in guides
  name: string; // team display name
  leagueId?: number;
};

type DebugSnapshot = {
  guidesCount: number;
  registryTeamsCount: number;
  missingCount: number;
  missing: MissingTeamGuide[];
  duplicateGuideKeys: string[];
  guideKeys: string[];
};

function asGuidesArray(mod: any): TeamGuide[] {
  if (!mod) return [];
  if (Array.isArray(mod)) return mod as TeamGuide[];
  if (Array.isArray(mod?.teamGuides)) return mod.teamGuides as TeamGuide[];
  if (Array.isArray(mod?.guides)) return mod.guides as TeamGuide[];
  return [];
}

const allGuides: TeamGuide[] = [
  ...asGuidesArray(premierLeagueGuides),
  ...asGuidesArray(laLigaGuides),
  ...asGuidesArray(serieAGuides),
  ...asGuidesArray(bundesligaGuides),
  ...asGuidesArray(ligue1Guides),
];

/**
 * Build registry:
 * - normalize teamKey to avoid subtle mismatches (spacing, diacritics, punctuation)
 * - detect duplicates deterministically
 */
const guidesByKey: Record<string, TeamGuide> = {};
const duplicates: Record<string, number> = {};

for (const g of allGuides) {
  const rawKey = (g as any)?.teamKey ?? "";
  const k = normalizeTeamKey(String(rawKey));

  if (!k) continue;

  if (guidesByKey[k]) {
    duplicates[k] = (duplicates[k] ?? 1) + 1;
    // Keep the first one to avoid “random overwrites”.
    // If you want “latest wins”, swap this behaviour.
    continue;
  }

  // Store a guide with a clean key (so downstream is consistent)
  guidesByKey[k] = { ...(g as any), teamKey: k } as TeamGuide;
}

const duplicateGuideKeys = Object.keys(duplicates).sort();

function buildMissing(): MissingTeamGuide[] {
  const res: MissingTeamGuide[] = [];

  for (const [teamKey, t] of Object.entries(teams)) {
    const k = normalizeTeamKey(teamKey);
    if (!guidesByKey[k]) {
      res.push({
        expectedGuideKey: k,
        name: t.name ?? k,
        leagueId: t.leagueId,
      });
    }
  }

  // Sort: leagueId desc grouping feels noisy; do leagueId asc then name
  res.sort((a, b) => {
    const la = typeof a.leagueId === "number" ? a.leagueId : 999999;
    const lb = typeof b.leagueId === "number" ? b.leagueId : 999999;
    if (la !== lb) return la - lb;
    return a.name.localeCompare(b.name);
  });

  return res;
}

// --- Public API ---

export function hasTeamGuide(teamKey: string): boolean {
  const k = normalizeTeamKey(teamKey);
  return !!guidesByKey[k];
}

export function getTeamGuide(teamKey: string): TeamGuide | null {
  const k = normalizeTeamKey(teamKey);
  return guidesByKey[k] ?? null;
}

export function getAllTeamGuides(): TeamGuide[] {
  return Object.values(guidesByKey);
}

export function getMissingTeamGuides(): MissingTeamGuide[] {
  return buildMissing();
}

/**
 * Used by your Home debug panel.
 * Includes duplicates so you can catch “guide exists but not reachable” errors fast.
 */
export function getTeamGuidesDebugSnapshot(): DebugSnapshot {
  const missing = buildMissing();
  const guideKeys = Object.keys(guidesByKey).sort();

  return {
    guidesCount: guideKeys.length,
    registryTeamsCount: Object.keys(teams).length,
    missingCount: missing.length,
    missing,
    duplicateGuideKeys,
    guideKeys,
  };
}

/**
 * Default export for convenience (matches your Home import)
 */
const teamGuidesRegistry = {
  allGuides,
  guidesByKey,
  duplicateGuideKeys,
  hasTeamGuide,
  getTeamGuide,
  getAllTeamGuides,
  getMissingTeamGuides,
  getTeamGuidesDebugSnapshot,
};

export default teamGuidesRegistry;
