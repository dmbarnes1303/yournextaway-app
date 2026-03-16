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

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function toSlug(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function norm(value: unknown): string {
  return clean(value).toLowerCase();
}

function parseSafeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fixtureDate(row: FixtureListRow): Date | null {
  return parseSafeDate(row?.fixture?.date);
}

function fixtureIsoDateOnlyInternal(row: FixtureListRow) {
  const raw = clean(row?.fixture?.date);
  return raw ? raw.slice(0, 10) : "";
}

function daysBetweenIso(a: string, b: string) {
  const da = parseSafeDate(`${a}T00:00:00.000Z`);
  const db = parseSafeDate(`${b}T00:00:00.000Z`);
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
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

function cityKeyFromRow(row: FixtureListRow) {
  return toSlug(getCity(row));
}

function cityLabelFromRow(row: FixtureListRow) {
  return getCity(row);
}

function countryLabelFromRow(row: FixtureListRow) {
  return getCountry(row);
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

function trendingLabelForFixture(row: FixtureListRow) {
  const pair = getFixturePairKey(row);
  const city = getCity(row);

  if (KNOWN_DERBY_LABELS[pair]) return KNOWN_DERBY_LABELS[pair];
  if (isEuropeanCompetition(row)) return "European night";
  if (city) return `${city} football trip`;
  return "Trending football trip";
}

function styleLabel(style: MultiMatchTrip["style"]) {
  if (style === "same-city") return "Same-city";
  if (style === "nearby-cities") return "Nearby cities";
  return "Country run";
}

function tripWindowPenalty(daysSpan: number): number {
  if (daysSpan <= 2) return 0;
  if (daysSpan === 3) return 4;
  if (daysSpan === 4) return 10;
  if (daysSpan === 5) return 18;
  if (daysSpan === 6) return 28;
  return 999;
}

function tripBaseStyleBonus(style: MultiMatchTrip["style"]): number {
  if (style === "same-city") return 36;
  if (style === "nearby-cities") return 20;
  return 10;
}

function tripRowsHaveDerby(rows: FixtureListRow[]): boolean {
  return rows.some((row) => trendingLabelForFixture(row).toLowerCase().includes("derby"));
}

function tripRowsHaveEuropeanNight(rows: FixtureListRow[]): boolean {
  return rows.some((row) => isEuropeanCompetition(row));
}

function tripRowsHaveLateKickoff(rows: FixtureListRow[]): boolean {
  return rows.some((row) => isLateKickoff(row));
}

function tripCities(rows: FixtureListRow[]): string[] {
  return Array.from(new Set(rows.map((row) => cityLabelFromRow(row)).filter(Boolean)));
}

function makeTripId(style: MultiMatchTrip["style"], fixtureIds: string[], title: string) {
  return `${style}-${toSlug(title)}-${fixtureIds.join("-")}`;
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

  const sorted = [...rows].sort((a, b) =>
    clean(a?.fixture?.date).localeCompare(clean(b?.fixture?.date))
  );

  const from = fixtureIsoDateOnlyInternal(sorted[0]);
  const to = fixtureIsoDateOnlyInternal(sorted[sorted.length - 1]);
  const daysSpan = Math.max(1, daysBetweenIso(from, to) + 1);

  let score = scoreBase;

  score += rows.length * 44;
  score += tripBaseStyleBonus(style);
  score -= tripWindowPenalty(daysSpan);

  const cities = tripCities(rows);
  const highPullCityCount = cities.filter((city) => HIGH_PULL_CITIES.has(norm(city))).length;
  score += highPullCityCount * 10;

  if (tripRowsHaveDerby(rows)) score += 18;
  if (tripRowsHaveEuropeanNight(rows)) score += 14;
  if (tripRowsHaveLateKickoff(rows)) score += 8;

  if (windowKey === "wknd" && daysSpan <= 3) score += 28;
  if (tripLength === "2" && daysSpan <= 4) score += 16;
  if (tripLength === "3" && daysSpan <= 5) score += 12;

  if (vibes.includes("easy") && style === "same-city") score += 18;
  if (vibes.includes("culture") && cities.length > 0) score += 8;
  if (vibes.includes("big")) {
    if (tripRowsHaveDerby(rows)) score += 18;
    if (tripRowsHaveEuropeanNight(rows)) score += 12;
  }
  if (vibes.includes("nightlife") && tripRowsHaveLateKickoff(rows)) score += 10;

  return score;
}

function canBundleRows(rows: FixtureListRow[]): boolean {
  if (rows.length < 2) return false;

  const sorted = [...rows].sort((a, b) =>
    clean(a?.fixture?.date).localeCompare(clean(b?.fixture?.date))
  );

  const from = fixtureIsoDateOnlyInternal(sorted[0]);
  const to = fixtureIsoDateOnlyInternal(sorted[sorted.length - 1]);
  if (!from || !to) return false;

  const daysSpan = Math.max(1, daysBetweenIso(from, to) + 1);
  if (daysSpan > 6) return false;

  const fixtureIds = sorted.map((row) => getFixtureId(row)).filter(Boolean);
  return fixtureIds.length >= 2;
}

function buildTrip(
  rows: FixtureListRow[],
  scoreBase: number,
  style: MultiMatchTrip["style"],
  title: string,
  subtitle: string,
  cityLabel: string,
  countryLabel: string,
  bonusLabels: string[],
  params: {
    vibes: DiscoverVibe[];
    tripLength: DiscoverTripLength;
    windowKey: DiscoverWindowKey;
  }
): MultiMatchTrip | null {
  if (!canBundleRows(rows)) return null;

  const sorted = [...rows].sort((a, b) =>
    clean(a?.fixture?.date).localeCompare(clean(b?.fixture?.date))
  );

  const from = fixtureIsoDateOnlyInternal(sorted[0]);
  const to = fixtureIsoDateOnlyInternal(sorted[sorted.length - 1]);
  if (!from || !to) return null;

  const daysSpan = Math.max(1, daysBetweenIso(from, to) + 1);
  const fixtureIds = sorted.map((row) => getFixtureId(row)).filter(Boolean);
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
    ...bonusLabels,
  ].filter(Boolean);

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

export function buildMultiMatchTrips(
  rankedLive: RankedDiscoverPick[],
  params: {
    vibes: DiscoverVibe[];
    tripLength: DiscoverTripLength;
    windowKey: DiscoverWindowKey;
  }
): MultiMatchTrip[] {
  const rankedRows = rankedLive.map((entry) => ({
    row: entry.item.fixture,
    baseScore: entry.score,
  }));

  const byCity = new Map<string, { city: string; country: string; items: typeof rankedRows }>();
  const byCountry = new Map<string, { country: string; items: typeof rankedRows }>();

  for (const entry of rankedRows) {
    const cityKey = cityKeyFromRow(entry.row);
    const city = cityLabelFromRow(entry.row);
    const country = countryLabelFromRow(entry.row);

    if (cityKey && city) {
      const existing = byCity.get(cityKey) ?? { city, country, items: [] };
      existing.items.push(entry);
      byCity.set(cityKey, existing);
    }

    if (country) {
      const countryKey = toSlug(country);
      const existing = byCountry.get(countryKey) ?? { country, items: [] };
      existing.items.push(entry);
      byCountry.set(countryKey, existing);
    }
  }

  const trips: MultiMatchTrip[] = [];

  for (const [, bucket] of byCity.entries()) {
    const sorted = [...bucket.items].sort((a, b) => b.baseScore - a.baseScore).slice(0, 6);

    for (let size = Math.min(3, sorted.length); size >= 2; size -= 1) {
      const slice = sorted.slice(0, size);
      const rows = slice.map((item) => item.row);
      const scoreBase = slice.reduce((sum, item) => sum + item.baseScore, 0);

      const trip = buildTrip(
        rows,
        scoreBase,
        "same-city",
        `${size} matches in ${bucket.city}`,
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
    const sameCountryRows = [...bucket.items]
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, 10);

    const uniqueCityRows: typeof sameCountryRows = [];
    const seenCities = new Set<string>();

    for (const item of sameCountryRows) {
      const cityKey = cityKeyFromRow(item.row);
      if (!cityKey || seenCities.has(cityKey)) continue;
      seenCities.add(cityKey);
      uniqueCityRows.push(item);
    }

    for (let size = Math.min(3, uniqueCityRows.length); size >= 2; size -= 1) {
      const slice = uniqueCityRows.slice(0, size);
      const rows = slice.map((item) => item.row);
      const scoreBase = slice.reduce((sum, item) => sum + item.baseScore, 0);

      const cityNames = rows.map((row) => cityLabelFromRow(row)).filter(Boolean).slice(0, 3);
      const style: MultiMatchTrip["style"] =
        cityNames.length <= 2 ? "nearby-cities" : "country-run";

      const trip = buildTrip(
        rows,
        scoreBase,
        style,
        `${size} matches across ${bucket.country}`,
        cityNames.length ? cityNames.join(" • ") : `${bucket.country} multi-match trip`,
        cityNames[0] ?? "",
        bucket.country,
        cityNames,
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

  return [...deduped.values()].sort((a, b) => b.score - a.score).slice(0, 8);
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
