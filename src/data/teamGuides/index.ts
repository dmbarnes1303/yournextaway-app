import type { TeamGuide, TeamGuideRegistry } from "./types";
import { teams } from "@/src/data/teams";
import { stadiums } from "@/src/data/stadiums";
import { cityGuides } from "@/src/data/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";
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

type SourceGuidesMap = Record<string, TeamGuide[]>;
type DuplicateMap = Record<string, string[]>;
type StringIssue = {
  teamKey: string;
  name: string;
  value?: string;
  expected?: string;
};
type WeakGuideIssue = {
  teamKey: string;
  name: string;
  sectionsCount: number;
  shortSections: string[];
  missingCityKey: boolean;
  missingCountry: boolean;
  missingStadium: boolean;
  updatedAt?: string;
};

export type MissingTeamGuide = {
  expectedGuideKey: string;
  name: string;
  leagueId?: number;
  season?: number;
};

function cleanStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v || undefined;
}

function cleanBody(value: unknown): string {
  return String(value ?? "").trim();
}

function isGuide(value: unknown): value is TeamGuide {
  if (!value || typeof value !== "object") return false;

  const v = value as Partial<TeamGuide>;

  return (
    typeof v.teamKey === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.sections)
  );
}

function normalizeGuide(input: TeamGuide): TeamGuide {
  const normalizedTeamKey = normalizeTeamKey(input.teamKey);

  return {
    ...input,
    teamKey: normalizedTeamKey,
    name: cleanStr(input.name) ?? titleFromKey(normalizedTeamKey),
    cityKey: input.cityKey ? normalizeCityKey(input.cityKey) : undefined,
    city: cleanStr(input.city),
    country: cleanStr(input.country),
    stadium: cleanStr(input.stadium),
    sections: Array.isArray(input.sections)
      ? input.sections
          .filter(
            (section) =>
              !!section &&
              typeof section.title === "string" &&
              typeof section.body === "string" &&
              section.title.trim() &&
              section.body.trim()
          )
          .map((section) => ({
            title: section.title.trim(),
            body: cleanBody(section.body),
          }))
      : [],
    links: Array.isArray(input.links)
      ? input.links
          .filter(
            (link) =>
              !!link &&
              typeof link.label === "string" &&
              typeof link.url === "string" &&
              link.label.trim() &&
              link.url.trim()
          )
          .map((link) => ({
            label: link.label.trim(),
            url: link.url.trim(),
          }))
      : undefined,
    updatedAt: cleanStr(input.updatedAt),
  };
}

function toGuides(value: unknown): TeamGuide[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(isGuide).map(normalizeGuide);
  }

  if (typeof value === "object") {
    const vals = Object.values(value as Record<string, unknown>);
    if (vals.length > 0 && vals.every(isGuide)) {
      return (vals as TeamGuide[]).map(normalizeGuide);
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

const SOURCES: SourceGuidesMap = {
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
const duplicates: DuplicateMap = {};

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
      cityKey: guide.cityKey ? normalizeCityKey(guide.cityKey) : undefined,
    };
  }
}

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

const cityKeyMismatches: StringIssue[] = [];
const cityNameMismatches: StringIssue[] = [];
const countryMismatches: StringIssue[] = [];
const stadiumNameMismatches: StringIssue[] = [];
const invalidGuideCityKeys: StringIssue[] = [];
const weakGuides: WeakGuideIssue[] = [];

for (const guide of Object.values(registry)) {
  const team = teams[guide.teamKey];
  if (!team) continue;

  const expectedCityKey = team.cityKey ? normalizeCityKey(team.cityKey) : undefined;
  const actualCityKey = guide.cityKey ? normalizeCityKey(guide.cityKey) : undefined;

  if (expectedCityKey && actualCityKey && expectedCityKey !== actualCityKey) {
    cityKeyMismatches.push({
      teamKey: guide.teamKey,
      name: guide.name,
      value: actualCityKey,
      expected: expectedCityKey,
    });
  }

  if (actualCityKey && !cityGuides[actualCityKey]) {
    invalidGuideCityKeys.push({
      teamKey: guide.teamKey,
      name: guide.name,
      value: actualCityKey,
    });
  }

  const teamCity = cleanStr(team.city);
  const guideCity = cleanStr(guide.city);

  if (teamCity && guideCity && teamCity !== guideCity) {
    cityNameMismatches.push({
      teamKey: guide.teamKey,
      name: guide.name,
      value: guideCity,
      expected: teamCity,
    });
  }

  const teamCountry = cleanStr(team.country);
  const guideCountry = cleanStr(guide.country);

  if (teamCountry && guideCountry && teamCountry !== guideCountry) {
    countryMismatches.push({
      teamKey: guide.teamKey,
      name: guide.name,
      value: guideCountry,
      expected: teamCountry,
    });
  }

  const teamStadium = team.stadiumKey ? stadiums[team.stadiumKey] : undefined;
  const expectedStadiumName = cleanStr(teamStadium?.name);
  const guideStadiumName = cleanStr(guide.stadium);

  if (expectedStadiumName && guideStadiumName && expectedStadiumName !== guideStadiumName) {
    stadiumNameMismatches.push({
      teamKey: guide.teamKey,
      name: guide.name,
      value: guideStadiumName,
      expected: expectedStadiumName,
    });
  }

  const shortSections = guide.sections
    .filter((section) => cleanBody(section.body).length < 220)
    .map((section) => section.title);

  const isWeak =
    guide.sections.length < 10 ||
    shortSections.length > 0 ||
    !guide.cityKey ||
    !guide.country ||
    !guide.stadium;

  if (isWeak) {
    weakGuides.push({
      teamKey: guide.teamKey,
      name: guide.name,
      sectionsCount: guide.sections.length,
      shortSections,
      missingCityKey: !guide.cityKey,
      missingCountry: !guide.country,
      missingStadium: !guide.stadium,
      updatedAt: guide.updatedAt,
    });
  }
}

cityKeyMismatches.sort((a, b) => a.name.localeCompare(b.name));
cityNameMismatches.sort((a, b) => a.name.localeCompare(b.name));
countryMismatches.sort((a, b) => a.name.localeCompare(b.name));
stadiumNameMismatches.sort((a, b) => a.name.localeCompare(b.name));
invalidGuideCityKeys.sort((a, b) => a.name.localeCompare(b.name));
weakGuides.sort((a, b) => a.name.localeCompare(b.name));

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
    audits: {
      cityKeyMismatches,
      cityNameMismatches,
      countryMismatches,
      stadiumNameMismatches,
      invalidGuideCityKeys,
      weakGuides,
    },
  };
}

export { normalizeTeamKey, titleFromKey };

export default registry;
