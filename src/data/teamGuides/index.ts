import type { TeamGuide, TeamGuideRegistry } from "./types";
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
import superLigGuides from "./superLig";
import proLeagueGuides from "./proLeague";
import superLeagueGreeceGuides from "./superLeagueGreece";
import austrianBundesligaGuides from "./austrianBundesliga";
import swissSuperLeagueGuides from "./swissSuperLeague";
import superligaDenmarkGuides from "./superligaDenmark";
import czechFirstLeagueGuides from "./czechFirstLeague";
import ekstraklasaGuides from "./ekstraklasa";
import hnlGuides from "./hnl";
import superLigaGuides from "./superLiga";
import firstLeagueBulgariaGuides from "./firstLeagueBulgaria";
import firstDivisionCyprusGuides from "./firstDivisionCyprus";
import superLigaSerbiaGuides from "./superLigaSerbia";
import superLigaSlovakiaGuides from "./superLigaSlovakia";
import prvaLigaSloveniaGuides from "./prvaLigaSlovenia";
import nbIGuides from "./nbI";
import allsvenskanGuides from "./allsvenskan";
import eliteserienGuides from "./eliteserien";
import veikkausliigaGuides from "./veikkausliiga";
import bestaDeildGuides from "./bestaDeild";
import premierLeagueBosniaGuides from "./premierLeagueBosnia";
import leagueOfIrelandPremierGuides from "./leagueOfIrelandPremier";

function isGuide(value: unknown): value is TeamGuide {
  if (!value || typeof value !== "object") return false;

  const v = value as Partial<TeamGuide>;

  return (
    typeof v.teamKey === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.sections)
  );
}

function toGuides(value: unknown): TeamGuide[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(isGuide);
  }

  if (typeof value === "object") {
    const vals = Object.values(value as Record<string, unknown>);
    if (vals.length > 0 && vals.every(isGuide)) {
      return vals as TeamGuide[];
    }
  }

  return [];
}

function extractGuides(mod: unknown): TeamGuide[] {
  if (!mod || typeof mod !== "object") return [];

  const out: TeamGuide[] = [];
  const moduleObj = mod as Record<string, unknown>;

  out.push(...toGuides(moduleObj.default));
  out.push(...toGuides(moduleObj));

  for (const value of Object.values(moduleObj)) {
    out.push(...toGuides(value));
  }

  const seen = new Set<string>();
  const deduped: TeamGuide[] = [];

  for (const guide of out) {
    const key = normalizeTeamKey(guide.teamKey);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    deduped.push({
      ...guide,
      teamKey: key,
    });
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
  superLig: extractGuides(superLigGuides),
  proLeague: extractGuides(proLeagueGuides),
  superLeagueGreece: extractGuides(superLeagueGreeceGuides),
  austrianBundesliga: extractGuides(austrianBundesligaGuides),
  swissSuperLeague: extractGuides(swissSuperLeagueGuides),
  superligaDenmark: extractGuides(superligaDenmarkGuides),
  czechFirstLeague: extractGuides(czechFirstLeagueGuides),
  ekstraklasa: extractGuides(ekstraklasaGuides),
  hnl: extractGuides(hnlGuides),
  superLiga: extractGuides(superLigaGuides),
  firstLeagueBulgaria: extractGuides(firstLeagueBulgariaGuides),
  firstDivisionCyprus: extractGuides(firstDivisionCyprusGuides),
  superLigaSerbia: extractGuides(superLigaSerbiaGuides),
  superLigaSlovakia: extractGuides(superLigaSlovakiaGuides),
  prvaLigaSlovenia: extractGuides(prvaLigaSloveniaGuides),
  nbI: extractGuides(nbIGuides),
  allsvenskan: extractGuides(allsvenskanGuides),
  eliteserien: extractGuides(eliteserienGuides),
  veikkausliiga: extractGuides(veikkausliigaGuides),
  bestaDeild: extractGuides(bestaDeildGuides),
  premierLeagueBosnia: extractGuides(premierLeagueBosniaGuides),
  leagueOfIrelandPremier: extractGuides(leagueOfIrelandPremierGuides),
};

const registry: TeamGuideRegistry = {};
const duplicates: Record<string, string[]> = {};

for (const [sourceName, guides] of Object.entries(SOURCES)) {
  for (const guide of guides) {
    const key = normalizeTeamKey(guide.teamKey);
    if (!key) continue;

    if (registry[key]) {
      if (!duplicates[key]) {
        duplicates[key] = [sourceName];
      } else {
        duplicates[key].push(sourceName);
      }
      continue;
    }

    registry[key] = {
      ...guide,
      teamKey: key,
      cityKey: guide.cityKey ? String(guide.cityKey).trim().toLowerCase() : guide.cityKey,
    };
  }
}

export type MissingTeamGuide = {
  expectedGuideKey: string;
  name: string;
  leagueId?: number;
  season?: number;
};

const missing: MissingTeamGuide[] = Object.values(teams)
  .map((team) => ({
    expectedGuideKey: normalizeTeamKey(team.teamKey),
    name: team.name,
    leagueId: team.leagueId,
    season: team.season,
  }))
  .filter((team) => !!team.expectedGuideKey && !registry[team.expectedGuideKey])
  .sort((a, b) => {
    const leagueA = a.leagueId ?? 0;
    const leagueB = b.leagueId ?? 0;
    if (leagueA !== leagueB) return leagueA - leagueB;
    return a.name.localeCompare(b.name);
  });

export function hasTeamGuide(teamKey: string): boolean {
  return !!registry[normalizeTeamKey(teamKey)];
}

export function getTeamGuide(teamKey: string): TeamGuide | null {
  const key = normalizeTeamKey(teamKey);
  return key ? registry[key] ?? null : null;
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
    duplicates: Object.entries(duplicates).map(([teamKey, sources]) => ({
      teamKey,
      count: sources.length + 1,
      duplicateSources: sources,
    })),
    bySource: Object.fromEntries(
      Object.entries(SOURCES).map(([key, value]) => [key, value.length])
    ),
  };
}

export { normalizeTeamKey, titleFromKey };

export default registry;
