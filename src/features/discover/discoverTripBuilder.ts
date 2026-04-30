// src/features/discover/discoverTripBuilder.ts

import type { FixtureListRow } from "@/src/services/apiFootball";
import type { DiscoverTripLength, DiscoverVibe } from "./discoverEngine";
import type {
  DiscoverWindowKey,
  MultiMatchTrip,
  RankedDiscoverPick,
} from "./types";

const EUROPEAN_COMPETITION_IDS = new Set([2, 3, 848]);

const STACKABLE_CITIES = new Set([
  "london",
  "istanbul",
  "madrid",
  "milan",
  "rome",
  "manchester",
  "liverpool",
  "glasgow",
  "lisbon",
  "porto",
  "athens",
  "prague",
  "vienna",
  "amsterdam",
  "barcelona",
  "seville",
  "belgrade",
]);

const HIGH_PULL_CITIES = new Set([
  "london",
  "madrid",
  "barcelona",
  "milan",
  "rome",
  "munich",
  "amsterdam",
  "lisbon",
  "paris",
  "glasgow",
  "istanbul",
  "liverpool",
  "manchester",
  "naples",
  "porto",
  "seville",
  "marseille",
  "berlin",
  "vienna",
  "prague",
  "athens",
  "budapest",
  "split",
  "zagreb",
]);

const KNOWN_DERBY_LABELS: Record<string, string> = {
  "ajax|feyenoord": "De Klassieker",
  "arsenal|tottenham": "North London Derby",
  "atletico-madrid|real-madrid": "Madrid Derby",
  "celtic|rangers": "Old Firm",
  "fenerbahce|galatasaray": "Intercontinental Derby",
  "inter|milan": "Derby della Madonnina",
  "lazio|roma": "Rome Derby",
  "manchester-city|manchester-united": "Manchester Derby",
  "marseille|paris-saint-germain": "Le Classique",
  "olympiacos|panathinaikos": "Derby of the Eternal Enemies",
  "real-betis|sevilla": "Seville Derby",
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function norm(value: unknown): string {
  return clean(value).toLowerCase();
}

function toSlug(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function parseSafeDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fixtureDate(row: FixtureListRow): Date | null {
  return parseSafeDate(row?.fixture?.date);
}

function fixtureIsoDateOnly(row: FixtureListRow) {
  const raw = clean(row?.fixture?.date);
  return raw ? raw.slice(0, 10) : "";
}

function daysBetweenIso(a: string, b: string) {
  const da = parseSafeDate(`${a}T00:00:00.000Z`);
  const db = parseSafeDate(`${b}T00:00:00.000Z`);
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function hoursBetween(a: FixtureListRow, b: FixtureListRow) {
  const da = fixtureDate(a);
  const db = fixtureDate(b);
  if (!da || !db) return 999;
  return Math.abs(db.getTime() - da.getTime()) / 3600000;
}

function getFixtureId(row: FixtureListRow): string {
  return row?.fixture?.id != null ? String(row.fixture.id) : "";
}

function homeName(row: FixtureListRow): string {
  return clean(row?.teams?.home?.name) || "Home";
}

function awayName(row: FixtureListRow): string {
  return clean(row?.teams?.away?.name) || "Away";
}

function getCity(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.city);
}

function getCountry(row: FixtureListRow): string {
  return clean((row?.league as any)?.country);
}

function cityKey(row: FixtureListRow) {
  return toSlug(getCity(row));
}

function countryKey(row: FixtureListRow) {
  return toSlug(getCountry(row));
}

function isEuropeanCompetition(row: FixtureListRow) {
  const leagueId = row?.league?.id != null ? Number(row.league.id) : null;
  return leagueId != null && EUROPEAN_COMPETITION_IDS.has(leagueId);
}

function isLateKickoff(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;
  const h = dt.getHours();
  return h >= 19 && h <= 22;
}

function getFixturePairKey(row: FixtureListRow) {
  const a = toSlug(homeName(row));
  const b = toSlug(awayName(row));
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

function fixtureLabel(row: FixtureListRow) {
  return `${homeName(row)} vs ${awayName(row)}`;
}

function trendingLabelForFixture(row: FixtureListRow) {
  const pair = getFixturePairKey(row);
  const city = getCity(row);

  if (KNOWN_DERBY_LABELS[pair]) return KNOWN_DERBY_LABELS[pair];
  if (isEuropeanCompetition(row)) return "European night";
  if (city) return `${city} football trip`;
  return "Trending football trip";
}

function isDerby(row: FixtureListRow) {
  return Boolean(KNOWN_DERBY_LABELS[getFixturePairKey(row)]);
}

function styleLabel(style: MultiMatchTrip["style"]) {
  if (style === "same-city") return "Same-city";
  if (style === "nearby-cities") return "Nearby cities";
  return "Country run";
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function sortedRows(rows: FixtureListRow[]) {
  return [...rows].sort((a, b) =>
    clean(a?.fixture?.date).localeCompare(clean(b?.fixture?.date))
  );
}

function tripCities(rows: FixtureListRow[]): string[] {
  return unique(rows.map(getCity).filter(Boolean));
}

function tripCountries(rows: FixtureListRow[]): string[] {
  return unique(rows.map(getCountry).filter(Boolean));
}

function hasDerby(rows: FixtureListRow[]) {
  return rows.some(isDerby);
}

function hasEuropeanNight(rows: FixtureListRow[]) {
  return rows.some(isEuropeanCompetition);
}

function hasLateKickoff(rows: FixtureListRow[]) {
  return rows.some(isLateKickoff);
}

function makeTripId(style: MultiMatchTrip["style"], fixtureIds: string[], title: string) {
  return `${style}-${toSlug(title)}-${fixtureIds.join("-")}`;
}

function tripWindowPenalty(daysSpan: number): number {
  if (daysSpan <= 2) return 0;
  if (daysSpan === 3) return 4;
  if (daysSpan === 4) return 12;
  if (daysSpan === 5) return 24;
  if (daysSpan === 6) return 38;
  return 999;
}

function styleBonus(style: MultiMatchTrip["style"]): number {
  if (style === "same-city") return 48;
  if (style === "nearby-cities") return 24;
  return 8;
}

function rowShapeValid(row: FixtureListRow) {
  return Boolean(
    getFixtureId(row) &&
      fixtureIsoDateOnly(row) &&
      homeName(row) &&
      awayName(row) &&
      getCity(row) &&
      getCountry(row)
  );
}

function hasImpossibleTiming(rows: FixtureListRow[], style: MultiMatchTrip["style"]) {
  const sorted = sortedRows(rows);

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const sameDay = fixtureIsoDateOnly(a) === fixtureIsoDateOnly(b);
    const gap = hoursBetween(a, b);

    if (sameDay && style === "same-city" && gap < 4) return true;
    if (sameDay && style !== "same-city") return true;
  }

  return false;
}

function canBundleRows(rows: FixtureListRow[], style: MultiMatchTrip["style"]): boolean {
  if (rows.length < 2) return false;
  if (rows.some((row) => !rowShapeValid(row))) return false;

  const sorted = sortedRows(rows);
  const from = fixtureIsoDateOnly(sorted[0]);
  const to = fixtureIsoDateOnly(sorted[sorted.length - 1]);
  if (!from || !to) return false;

  const daysSpan = Math.max(1, daysBetweenIso(from, to) + 1);
  if (daysSpan > 6) return false;
  if (hasImpossibleTiming(sorted, style)) return false;

  const ids = sorted.map(getFixtureId).filter(Boolean);
  return unique(ids).length >= 2;
}

function scoreTripBundle(params: {
  rows: FixtureListRow[];
  scoreBase: number;
  style: MultiMatchTrip["style"];
  windowKey: DiscoverWindowKey;
  tripLength: DiscoverTripLength;
  vibes: DiscoverVibe[];
}): number {
  const { rows, scoreBase, style, windowKey, tripLength, vibes } = params;

  const sorted = sortedRows(rows);
  const from = fixtureIsoDateOnly(sorted[0]);
  const to = fixtureIsoDateOnly(sorted[sorted.length - 1]);
  const daysSpan = Math.max(1, daysBetweenIso(from, to) + 1);

  const cities = tripCities(rows);
  const countries = tripCountries(rows);
  const highPullCities = cities.filter((city) => HIGH_PULL_CITIES.has(norm(city))).length;
  const stackableCityCount = cities.filter((city) => STACKABLE_CITIES.has(norm(city))).length;

  let score = scoreBase;

  score += rows.length * 46;
  score += styleBonus(style);
  score -= tripWindowPenalty(daysSpan);

  score += highPullCities * 12;
  score += stackableCityCount * 10;

  if (style === "same-city" && STACKABLE_CITIES.has(norm(cities[0]))) score += 22;
  if (style === "nearby-cities" && countries.length === 1 && cities.length === 2) score += 10;
  if (style === "country-run" && cities.length >= 3) score += 6;

  if (hasDerby(rows)) score += 22;
  if (hasEuropeanNight(rows)) score += 16;
  if (hasLateKickoff(rows)) score += 8;

  if (windowKey === "wknd" && daysSpan <= 3) score += 30;
  if (tripLength === "day") score -= style === "same-city" && daysSpan <= 1 ? 0 : 34;
  if (tripLength === "1" && daysSpan <= 2) score += 12;
  if (tripLength === "2" && daysSpan <= 4) score += 18;
  if (tripLength === "3" && daysSpan <= 5) score += 14;

  if (vibes.includes("easy")) {
    if (style === "same-city") score += 24;
    if (style === "country-run") score -= 18;
  }

  if (vibes.includes("big")) {
    if (hasDerby(rows)) score += 20;
    if (hasEuropeanNight(rows)) score += 14;
  }

  if (vibes.includes("culture")) score += cities.length * 8;
  if (vibes.includes("nightlife") && hasLateKickoff(rows)) score += 12;
  if (vibes.includes("warm")) {
    const warmCountry = countries.some((c) =>
      ["spain", "portugal", "italy", "greece", "turkey", "croatia", "cyprus"].includes(norm(c))
    );
    if (warmCountry) score += 12;
  }

  return Math.round(score);
}

function buildSubtitle(style: MultiMatchTrip["style"], rows: FixtureListRow[], fallback: string) {
  const cities = tripCities(rows);

  if (style === "same-city" && cities[0]) return `${cities[0]} football break`;
  if (style === "nearby-cities" && cities.length >= 2) return cities.slice(0, 2).join(" • ");
  if (style === "country-run" && cities.length) return cities.slice(0, 3).join(" • ");

  return fallback;
}

function buildBonusLabels(rows: FixtureListRow[], base: string[]): string[] {
  const labels = [...base];

  if (hasDerby(rows)) labels.push("Derby edge");
  if (hasEuropeanNight(rows)) labels.push("European night");
  if (hasLateKickoff(rows)) labels.push("Night fixture");

  return unique(labels).slice(0, 5);
}

function buildTrip(
  rows: FixtureListRow[],
  scoreBase: number,
  style: MultiMatchTrip["style"],
  title: string,
  subtitleFallback: string,
  cityLabel: string,
  countryLabel: string,
  bonusLabels: string[],
  params: {
    vibes: DiscoverVibe[];
    tripLength: DiscoverTripLength;
    windowKey: DiscoverWindowKey;
  }
): MultiMatchTrip | null {
  if (!canBundleRows(rows, style)) return null;

  const sorted = sortedRows(rows);
  const from = fixtureIsoDateOnly(sorted[0]);
  const to = fixtureIsoDateOnly(sorted[sorted.length - 1]);
  if (!from || !to) return null;

  const daysSpan = Math.max(1, daysBetweenIso(from, to) + 1);
  const fixtureIds = unique(sorted.map(getFixtureId).filter(Boolean));
  if (fixtureIds.length < 2) return null;

  const score = scoreTripBundle({
    rows: sorted,
    scoreBase,
    style,
    windowKey: params.windowKey,
    tripLength: params.tripLength,
    vibes: params.vibes,
  });

  const labels = [
    `${sorted.length} matches`,
    `${daysSpan} days`,
    styleLabel(style),
    ...buildBonusLabels(sorted, bonusLabels),
  ].filter(Boolean);

  const subtitle = buildSubtitle(style, sorted, subtitleFallback);

  return {
    id: makeTripId(style, fixtureIds, title),
    title,
    subtitle,
    score,
    matchCount: sorted.length,
    daysSpan,
    from,
    to,
    cityLabel,
    countryLabel,
    style,
    fixtureIds,
    rows: sorted,
    labels,
  };
}

type RankedRow = {
  row: FixtureListRow;
  baseScore: number;
};

function bestCombinations(items: RankedRow[], maxSize: number): RankedRow[][] {
  const sorted = [...items].sort((a, b) => b.baseScore - a.baseScore).slice(0, 8);
  const combos: RankedRow[][] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      combos.push([sorted[i], sorted[j]]);

      if (maxSize >= 3) {
        for (let k = j + 1; k < sorted.length; k += 1) {
          combos.push([sorted[i], sorted[j], sorted[k]]);
        }
      }
    }
  }

  return combos.sort(
    (a, b) =>
      b.reduce((sum, item) => sum + item.baseScore, 0) -
      a.reduce((sum, item) => sum + item.baseScore, 0)
  );
}

export function buildMultiMatchTrips(
  rankedLive: RankedDiscoverPick[],
  params: {
    vibes: DiscoverVibe[];
    tripLength: DiscoverTripLength;
    windowKey: DiscoverWindowKey;
  }
): MultiMatchTrip[] {
  const rankedRows: RankedRow[] = rankedLive
    .map((entry) => ({
      row: entry.item.fixture,
      baseScore: entry.score,
    }))
    .filter((entry) => rowShapeValid(entry.row));

  const byCity = new Map<string, { city: string; country: string; items: RankedRow[] }>();
  const byCountry = new Map<string, { country: string; items: RankedRow[] }>();

  for (const entry of rankedRows) {
    const ck = cityKey(entry.row);
    const city = getCity(entry.row);
    const country = getCountry(entry.row);
    const cky = countryKey(entry.row);

    if (ck && city) {
      const existing = byCity.get(ck) ?? { city, country, items: [] };
      existing.items.push(entry);
      byCity.set(ck, existing);
    }

    if (cky && country) {
      const existing = byCountry.get(cky) ?? { country, items: [] };
      existing.items.push(entry);
      byCountry.set(cky, existing);
    }
  }

  const trips: MultiMatchTrip[] = [];

  for (const [, bucket] of byCity.entries()) {
    if (bucket.items.length < 2) continue;

    const combos = bestCombinations(bucket.items, 3).slice(0, 5);

    for (const combo of combos) {
      const rows = combo.map((item) => item.row);
      const scoreBase = combo.reduce((sum, item) => sum + item.baseScore, 0);
      const size = rows.length;

      const title =
        size >= 3 ? `Triple match break in ${bucket.city}` : `Double match break in ${bucket.city}`;

      const trip = buildTrip(
        rows,
        scoreBase,
        "same-city",
        title,
        `${bucket.city} football trip`,
        bucket.city,
        bucket.country,
        bucket.country ? [bucket.country] : [],
        params
      );

      if (trip) trips.push(trip);
    }
  }

  for (const [, bucket] of byCountry.entries()) {
    const top = [...bucket.items].sort((a, b) => b.baseScore - a.baseScore).slice(0, 12);
    const byUniqueCity: RankedRow[] = [];
    const seen = new Set<string>();

    for (const item of top) {
      const ck = cityKey(item.row);
      if (!ck || seen.has(ck)) continue;
      seen.add(ck);
      byUniqueCity.push(item);
    }

    if (byUniqueCity.length < 2) continue;

    const combos = bestCombinations(byUniqueCity, 3).slice(0, 6);

    for (const combo of combos) {
      const rows = combo.map((item) => item.row);
      const scoreBase = combo.reduce((sum, item) => sum + item.baseScore, 0);
      const cities = tripCities(rows);
      const style: MultiMatchTrip["style"] = cities.length <= 2 ? "nearby-cities" : "country-run";

      const title =
        style === "nearby-cities"
          ? `Two-city football break in ${bucket.country}`
          : `${rows.length} matches across ${bucket.country}`;

      const trip = buildTrip(
        rows,
        scoreBase,
        style,
        title,
        cities.length ? cities.join(" • ") : `${bucket.country} multi-match trip`,
        cities[0] ?? "",
        bucket.country,
        cities,
        params
      );

      if (trip) trips.push(trip);
    }
  }

  const deduped = new Map<string, MultiMatchTrip>();

  for (const trip of trips) {
    const key = [...trip.fixtureIds].sort().join("|");
    const existing = deduped.get(key);
    if (!existing || trip.score > existing.score) deduped.set(key, trip);
  }

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score || a.daysSpan - b.daysSpan)
    .slice(0, 8);
}

export function comboWhy(trip: MultiMatchTrip) {
  if (trip.style === "same-city") {
    return "Lowest-friction way to turn one match into a proper football trip.";
  }

  if (trip.style === "nearby-cities") {
    return "Multiple fixtures without stretching the travel too far.";
  }

  return "A denser football run with more than one genuine reason to travel.";
}
