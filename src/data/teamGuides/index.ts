// src/data/teamGuides/index.ts
import type { TeamGuide } from "./types";
import teamsRegistry, { normalizeTeamKey, resolveTeamKey } from "@/src/data/teams";

import { premierLeagueTeamGuides } from "./premierLeague";
import { laLigaTeamGuides } from "./laLiga";
import { serieATeamGuides } from "./serieA";
import { bundesligaTeamGuides } from "./bundesliga";
import { ligue1TeamGuides } from "./ligue1";

/**
 * Team Guide registry + helpers.
 *
 * Source of truth rules:
 * - Canonical team keys are defined in src/data/teams (team registry).
 * - Guides must be retrievable using resolveTeamKey() so fixture/user variants still map.
 * - This index merges all league guide maps into one registry.
 */

export const teamGuides: Record<string, TeamGuide> = {
  ...premierLeagueTeamGuides,
  ...laLigaTeamGuides,
  ...serieATeamGuides,
  ...bundesligaTeamGuides,
  ...ligue1TeamGuides,
};

/**
 * Re-export so consumers can use the same normalisation.
 */
export { normalizeTeamKey };

/**
 * Canonical guide key resolver:
 * - Prefer resolveTeamKey (aliases/diacritics/prefix variants)
 * - Fallback to normalizeTeamKey so “unknown” still works as a best-effort key
 */
function canonicalGuideKey(input: string): { key: string; resolved: boolean } | null {
  const s = String(input ?? "").trim();
  if (!s) return null;

  const resolvedKey = resolveTeamKey(s);
  if (resolvedKey) return { key: normalizeTeamKey(resolvedKey), resolved: true };

  const fallback = normalizeTeamKey(s);
  if (!fallback) return null;

  return { key: fallback, resolved: false };
}

/**
 * Main lookup: ALWAYS go through resolveTeamKey first.
 * This fixes “guide exists but not showing” due to naming variants.
 */
export function getTeamGuide(teamInput: string): TeamGuide | null {
  const ck = canonicalGuideKey(teamInput);
  if (!ck) return null;
  return teamGuides[ck.key] ?? null;
}

export function hasTeamGuide(teamInput: string): boolean {
  return !!getTeamGuide(teamInput);
}

/**
 * DEBUG helper: explains why a guide isn't found.
 * Use this in the Home DEV panel to quickly spot key mismatches.
 */
export function debugTeamGuideLookup(teamInput: string): {
  input: string;
  normalizedInput: string;
  resolvedTeamKey: string | null;
  canonicalGuideKey: string | null;
  resolved: boolean;
  hasGuide: boolean;
  knownTeamInRegistry: boolean;
  sampleGuideKeys: string[];
} {
  const input = String(teamInput ?? "");
  const normalizedInput = normalizeTeamKey(input);
  const resolvedTeamKey = resolveTeamKey(input);

  const ck = canonicalGuideKey(input);
  const canonicalKey = ck?.key ?? null;

  const hasGuide = canonicalKey ? !!teamGuides[canonicalKey] : false;
  const knownTeamInRegistry = !!(resolvedTeamKey ? teamsRegistry[normalizeTeamKey(resolvedTeamKey)] : teamsRegistry[normalizedInput]);

  return {
    input,
    normalizedInput,
    resolvedTeamKey,
    canonicalGuideKey: canonicalKey,
    resolved: !!ck?.resolved,
    hasGuide,
    knownTeamInRegistry,
    sampleGuideKeys: Object.keys(teamGuides).slice(0, 20),
  };
}

/**
 * Default export MUST be compatible with both patterns:
 * 1) Default import used as a plain registry map: guides["arsenal"]
 * 2) Callers treating it like a module object: guides.normalizeTeamKey(...)
 */
const teamGuidesModule = Object.assign(teamGuides, {
  normalizeTeamKey,
  getTeamGuide,
  hasTeamGuide,
  debugTeamGuideLookup,
});

export default teamGuidesModule;
