import type { CityGuide, CityTopThing, CityGuideBookingLinks } from "./types";
import { normalizeCityKey } from "@/src/utils/city";

import premierLeagueCityGuides from "./premierLeague";
import laLigaCityGuides from "./laLiga";
import bundesligaCityGuides from "./bundesliga";
import serieACityGuides from "./serieA";
import ligue1CityGuides from "./ligue1";
import primeiraLigaCityGuides from "./primeiraLiga";
import eredivisieCityGuides from "./eredivisie";
import scottishPremiershipCityGuides from "./scottishPremiership";
import superLigCityGuides from "./superLig";
import proLeagueCityGuides from "./proLeague";
import superLeagueGreeceCityGuides from "./superLeagueGreece";
import austrianBundesligaCityGuides from "./austrianBundesliga";
import swissSuperLeagueCityGuides from "./swissSuperLeague";
import superligaDenmarkCityGuides from "./superligaDenmark";
import czechFirstLeagueCityGuides from "./czechFirstLeague";
import ekstraklasaCityGuides from "./ekstraklasa";
import hnlCityGuides from "./hnl";
import superLigaCityGuides from "./superLiga";
import firstLeagueBulgariaCityGuides from "./firstLeagueBulgaria";
import firstDivisionCyprusCityGuides from "./firstDivisionCyprus";
import superLigaSerbiaCityGuides from "./superLigaSerbia";
import superLigaSlovakiaCityGuides from "./superLigaSlovakia";
import prvaLigaSloveniaCityGuides from "./prvaLigaSlovenia";
import nbICityGuides from "./nbI";
import allsvenskanCityGuides from "./allsvenskan";
import eliteserienCityGuides from "./eliteserien";
import veikkausliigaCityGuides from "./veikkausliiga";
import bestaDeildCityGuides from "./bestaDeild";
import premierLeagueBosniaCityGuides from "./premierLeagueBosnia";
import leagueOfIrelandPremierCityGuides from "./leagueOfIrelandPremier";

export type TripTopThingsBundle = {
  cityKey: string;
  hasGuide: boolean;
  thingsToDoUrl?: string;
  items: { title: string; description?: string }[];
  quickTips: string[];
};

type CityGuideMap = Record<string, CityGuide>;
type SourceMap = Record<string, CityGuideMap>;

function cleanStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function cleanStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .map((item) => cleanStr(item))
    .filter((item): item is string => Boolean(item));

  return cleaned.length ? Array.from(new Set(cleaned)) : undefined;
}

function normalizeTopThings(value: unknown): CityTopThing[] {
  if (!Array.isArray(value)) return [];

  const out: CityTopThing[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const maybeThing = item as Partial<CityTopThing>;
    const title = cleanStr(maybeThing.title);
    const tip = cleanStr(maybeThing.tip);

    if (!title || !tip) continue;

    out.push({ title, tip });
  }

  return out;
}

function normalizeBookingLinks(value: unknown): CityGuideBookingLinks | undefined {
  if (!value || typeof value !== "object") return undefined;

  const links = value as Partial<CityGuideBookingLinks>;

  const normalized: CityGuideBookingLinks = {
    thingsToDo: cleanStr(links.thingsToDo),
    carHire: cleanStr(links.carHire),
    esim: cleanStr(links.esim),
    airportTransfer: cleanStr(links.airportTransfer),
  };

  const hasAnyLink =
    Boolean(normalized.thingsToDo) ||
    Boolean(normalized.carHire) ||
    Boolean(normalized.esim) ||
    Boolean(normalized.airportTransfer);

  return hasAnyLink ? normalized : undefined;
}

function getCanonicalThingsToDoUrl(guide: CityGuide | null | undefined): string | undefined {
  if (!guide) return undefined;
  return cleanStr(guide.bookingLinks?.thingsToDo) ?? cleanStr(guide.thingsToDoUrl);
}

function normalizeGuide(inputKey: string, guide: CityGuide): CityGuide {
  const cityId = normalizeCityKey(guide.cityId || inputKey);

  return {
    ...guide,
    cityId,
    name: cleanStr(guide.name) ?? cityId,
    country: cleanStr(guide.country) ?? "",
    overview: cleanStr(guide.overview) ?? "",
    bookingLinks: normalizeBookingLinks(guide.bookingLinks),

    // legacy fallback fields kept for migration / backward compatibility only
    thingsToDoUrl: cleanStr(guide.thingsToDoUrl),
    tripAdvisorTopThingsUrl: cleanStr(guide.tripAdvisorTopThingsUrl),

    topThings: normalizeTopThings(guide.topThings),
    tips: cleanStringArray(guide.tips) ?? [],
    food: cleanStringArray(guide.food),
    transport: cleanStr(guide.transport),
    accommodation: cleanStr(guide.accommodation),
  };
}

const SOURCE_MAP: SourceMap = {
  premierLeague: premierLeagueCityGuides,
  laLiga: laLigaCityGuides,
  bundesliga: bundesligaCityGuides,
  serieA: serieACityGuides,
  ligue1: ligue1CityGuides,
  primeiraLiga: primeiraLigaCityGuides,
  eredivisie: eredivisieCityGuides,
  scottishPremiership: scottishPremiershipCityGuides,
  superLig: superLigCityGuides,
  proLeague: proLeagueCityGuides,
  superLeagueGreece: superLeagueGreeceCityGuides,
  austrianBundesliga: austrianBundesligaCityGuides,
  swissSuperLeague: swissSuperLeagueCityGuides,
  superligaDenmark: superligaDenmarkCityGuides,
  czechFirstLeague: czechFirstLeagueCityGuides,
  ekstraklasa: ekstraklasaCityGuides,
  hnl: hnlCityGuides,
  superLiga: superLigaCityGuides,
  firstLeagueBulgaria: firstLeagueBulgariaCityGuides,
  firstDivisionCyprus: firstDivisionCyprusCityGuides,
  superLigaSerbia: superLigaSerbiaCityGuides,
  superLigaSlovakia: superLigaSlovakiaCityGuides,
  prvaLigaSlovenia: prvaLigaSloveniaCityGuides,
  nbI: nbICityGuides,
  allsvenskan: allsvenskanCityGuides,
  eliteserien: eliteserienCityGuides,
  veikkausliiga: veikkausliigaCityGuides,
  bestaDeild: bestaDeildCityGuides,
  premierLeagueBosnia: premierLeagueBosniaCityGuides,
  leagueOfIrelandPremier: leagueOfIrelandPremierCityGuides,
};

function buildCityGuideRegistry(): CityGuideMap {
  const merged: CityGuideMap = {};
  const firstSourceByCityId: Record<string, string> = {};

  for (const [sourceName, sourceGuides] of Object.entries(SOURCE_MAP)) {
    for (const [rawKey, rawGuide] of Object.entries(sourceGuides)) {
      const guide = normalizeGuide(rawKey, rawGuide);
      const cityId = guide.cityId;

      if (!cityId) continue;

      if (merged[cityId]) {
        if (__DEV__) {
          console.warn(
            `[cityGuides] Duplicate cityId "${cityId}" ignored from source "${sourceName}". First source kept: "${firstSourceByCityId[cityId]}".`
          );
        }
        continue;
      }

      merged[cityId] = guide;
      firstSourceByCityId[cityId] = sourceName;
    }
  }

  return merged;
}

export const cityGuides: CityGuideMap = buildCityGuideRegistry();

export function getCityGuide(city: string): CityGuide | null {
  const cityKey = normalizeCityKey(city);
  return cityKey ? cityGuides[cityKey] ?? null : null;
}

export function hasCityGuide(city: string): boolean {
  const cityKey = normalizeCityKey(city);
  return Boolean(cityKey && cityGuides[cityKey]);
}

export function getCityGuideThingsToDoUrl(city: string): string | undefined {
  return getCanonicalThingsToDoUrl(getCityGuide(city));
}

export function getTopThingsToDoForTrip(city: string): TripTopThingsBundle {
  const cityKey = normalizeCityKey(city);

  if (!cityKey) {
    return {
      cityKey: "",
      hasGuide: false,
      items: [],
      quickTips: [],
    };
  }

  const guide = cityGuides[cityKey];

  if (!guide) {
    return {
      cityKey,
      hasGuide: false,
      items: [],
      quickTips: [],
    };
  }

  return {
    cityKey,
    hasGuide: true,
    thingsToDoUrl: getCanonicalThingsToDoUrl(guide),
    items: guide.topThings.slice(0, 10).map((thing) => ({
      title: thing.title,
      description: thing.tip,
    })),
    quickTips: guide.tips.slice(0, 8),
  };
}
