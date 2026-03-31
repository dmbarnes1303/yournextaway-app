import type { CityGuide, CityTopThing, CityGuideBookingLinks } from "./types";
import { normalizeCityKey } from "@/src/utils/city";
import { teams } from "@/src/data/teams";
import { stadiums } from "@/src/data/stadiums";

/* IMPORTS UNCHANGED */
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

/* ---------- TYPES ---------- */

export type TripTopThingsBundle = {
  cityKey: string;
  hasGuide: boolean;
  thingsToDoUrl?: string;
  items: { title: string; description?: string }[];
  quickTips: string[];
};

type CityGuideMap = Record<string, CityGuide>;

/* ---------- HELPERS ---------- */

function cleanStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v || undefined;
}

function cleanStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.map(cleanStr).filter(Boolean) as string[];
  return out.length ? Array.from(new Set(out)) : undefined;
}

function normalizeTopThings(value: unknown): CityTopThing[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof x.title === "string" &&
        typeof x.tip === "string"
    )
    .map((x) => ({
      title: x.title.trim(),
      tip: x.tip.trim(),
    }));
}

/* 🔥 NEW — normalize bookingLinks properly */
function normalizeBookingLinks(value: unknown): CityGuideBookingLinks | undefined {
  if (!value || typeof value !== "object") return undefined;

  const v = value as CityGuideBookingLinks;

  const normalized: CityGuideBookingLinks = {
    thingsToDo: cleanStr(v.thingsToDo),
    carHire: cleanStr(v.carHire),
    esim: cleanStr(v.esim),
    airportTransfer: cleanStr(v.airportTransfer),
  };

  const hasAny =
    normalized.thingsToDo ||
    normalized.carHire ||
    normalized.esim ||
    normalized.airportTransfer;

  return hasAny ? normalized : undefined;
}

function normalizeGuide(inputKey: string, guide: CityGuide): CityGuide {
  const cityId = normalizeCityKey(guide.cityId || inputKey);

  return {
    ...guide,
    cityId,
    name: cleanStr(guide.name) ?? cityId,
    country: cleanStr(guide.country) ?? "",
    overview: cleanStr(guide.overview) ?? "",

    /* 🔥 FIXED */
    bookingLinks: normalizeBookingLinks(guide.bookingLinks),

    /* legacy fallback kept */
    thingsToDoUrl: cleanStr(guide.thingsToDoUrl),

    tripAdvisorTopThingsUrl: cleanStr(guide.tripAdvisorTopThingsUrl),

    topThings: normalizeTopThings(guide.topThings),
    tips: cleanStringArray(guide.tips) ?? [],
    food: cleanStringArray(guide.food),
    transport: cleanStr(guide.transport),
    accommodation: cleanStr(guide.accommodation),
  };
}

/* ---------- SOURCE MERGE ---------- */

const SOURCE_MAP: Record<string, CityGuideMap> = {
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

function buildCityGuideRegistry() {
  const merged: CityGuideMap = {};

  for (const source of Object.values(SOURCE_MAP)) {
    for (const [key, guide] of Object.entries(source)) {
      const normalized = normalizeGuide(key, guide);
      if (!merged[normalized.cityId]) {
        merged[normalized.cityId] = normalized;
      }
    }
  }

  return merged;
}

export const cityGuides: CityGuideMap = buildCityGuideRegistry();

/* ---------- PUBLIC API ---------- */

export function getCityGuide(city: string): CityGuide | null {
  const key = normalizeCityKey(city);
  return key ? cityGuides[key] ?? null : null;
}

export function hasCityGuide(city: string): boolean {
  const key = normalizeCityKey(city);
  return !!(key && cityGuides[key]);
}

/* 🔥 FIXED — canonical link logic */
export function getTopThingsToDoForTrip(city: string): TripTopThingsBundle {
  const key = normalizeCityKey(city);
  const guide = key ? cityGuides[key] : null;

  if (!guide) {
    return { cityKey: key, hasGuide: false, items: [], quickTips: [] };
  }

  const canonicalUrl =
    guide.bookingLinks?.thingsToDo ||
    guide.thingsToDoUrl ||
    undefined;

  return {
    cityKey: key,
    hasGuide: true,
    thingsToDoUrl: canonicalUrl,
    items: (guide.topThings ?? []).slice(0, 10).map((x) => ({
      title: x.title,
      description: x.tip,
    })),
    quickTips: (guide.tips ?? []).slice(0, 8),
  };
}
