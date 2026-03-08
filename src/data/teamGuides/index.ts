import type { TeamGuide } from "./types";
import { teams } from "@/src/data/teams";

import { normalizeTeamKey, titleFromKey } from "./utils";

import bundesligaGuides from "./bundesliga";
import laLigaGuides from "./laLiga";
import ligue1Guides from "./ligue1";
import premierLeagueGuides from "./premierLeague";
import serieAGuides from "./serieA";
import primeiraLigaGuides from "./primeiraLiga";
import eredivisieGuides from "./eredivisie";
import scottishPremiershipGuides from "./scottishPremiership";

import * as legacy from "./teamGuides";

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

function extractGuides(mod: any): TeamGuide[] {
  if (!mod) return [];

  const out: TeamGuide[] = [];

  if (mod.default) out.push(...toGuides(mod.default));
  out.push(...toGuides(mod));

  for (const v of Object.values(mod)) {
    out.push(...toGuides(v));
  }

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

const SOURCES: Record<string, TeamGuide[]> = {
  bundesliga: extractGuides(bundesligaGuides),
  laLiga: extractGuides(laLigaGuides),
  ligue1: extractGuides(ligue1Guides),
  premierLeague: extractGuides(premierLeagueGuides),
  serieA: extractGuides(serieAGuides),
  primeiraLiga: extractGuides(primeiraLigaGuides),
  eredivisie: extractGuides(eredivisieGuides),
  scottishPremiership: extractGuides(scottishPremiershipGuides),
  legacy: extractGuides(legacy),
};

const registry: Record<string, TeamGuide> = {};
const duplicates: Record<string, number> = {};

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

const missing = Object.values(teams)
  .filter((t) => !registry[t.teamKey])
  .map((t) => ({
    expectedGuideKey: t.teamKey,
    name: t.name,
    leagueId: t.leagueId,
    season: t.season,
  }));

export function hasTeamGuide(teamKey: string): boolean {
  return !!registry[teamKey];
}

export function getTeamGuide(teamKey: string): TeamGuide | null {
  return registry[teamKey] || null;
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
    bySource: Object.fromEntries(Object.entries(SOURCES).map(([k, v]) => [k, v.length])),
  };
}

export { normalizeTeamKey, titleFromKey };

export default registry;
