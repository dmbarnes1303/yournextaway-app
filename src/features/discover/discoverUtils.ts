// src/features/discover/discoverUtils.ts

import {
  LEAGUES,
  nextWeekendWindowIso,
  windowFromTomorrowIso,
  type LeagueOption,
} from "@/src/constants/football";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import type { DiscoverCategory } from "./discoverCategories";
import type { DiscoverTripLength, DiscoverVibe } from "./discoverEngine";
import type {
  DiscoverWindowKey,
  MultiMatchTrip,
  RankedDiscoverPick,
  ShortcutWindow,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const EUROPEAN_COMPETITION_IDS = new Set([2, 3, 848]);
const ELITE_LEAGUE_IDS = new Set([39, 140, 135, 78, 61]);
const STRONG_SECOND_TIER_LEAGUE_IDS = new Set([88, 94, 203, 179, 144, 218, 207, 197]);
const VALUE_DEPTH_LEAGUE_IDS = new Set([
  119, 345, 106, 210, 286, 271, 283, 332, 373, 172, 318, 315, 357, 113, 103, 244, 164,
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

/* -------------------------------------------------------------------------- */
/* Labels / UI helpers                                                        */
/* -------------------------------------------------------------------------- */

export function labelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "This Weekend";
  if (key === "d7") return "Next 7 Days";
  if (key === "d14") return "Next 14 Days";
  if (key === "d30") return "Next 30 Days";
  if (key === "d60") return "Next 60 Days";
  return "Next 90 Days";
}

export function shortLabelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "Weekend";
  if (key === "d7") return "7 Days";
  if (key === "d14") return "14 Days";
  if (key === "d30") return "30 Days";
  if (key === "d60") return "60 Days";
  return "90 Days";
}

export function labelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day Trip";
  if (v === "1") return "1 Night";
  if (v === "2") return "2 Nights";
  return "3 Nights";
}

export function shortLabelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day";
  if (v === "1") return "1N";
  if (v === "2") return "2N";
  return "3N";
}

export function labelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy Travel";
  if (v === "big") return "Big Match";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  return "Warm-ish";
}

export function shortLabelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy";
  if (v === "big") return "Big";
  if (v === "nightlife") return "Night";
  if (v === "culture") return "Culture";
  return "Warm";
}

export function windowForKey(key: DiscoverWindowKey): ShortcutWindow {
  if (key === "wknd") return nextWeekendWindowIso();
  if (key === "d7") return windowFromTomorrowIso(7);
  if (key === "d14") return windowFromTomorrowIso(14);
  if (key === "d30") return windowFromTomorrowIso(30);
  if (key === "d60") return windowFromTomorrowIso(60);
  return windowFromTomorrowIso(90);
}

export function pickRandom<T>(arr: T[]): T | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

export function clampVibes(next: DiscoverVibe[]) {
  if (next.length <= 3) return next;
  return next.slice(next.length - 3);
}

/* -------------------------------------------------------------------------- */
/* Primitive helpers                                                          */
/* -------------------------------------------------------------------------- */

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

function createStableSeed(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function rotateStable<T>(arr: T[], seed: number) {
  if (!arr.length) return arr;
  const offset = seed % arr.length;
  return [...arr.slice(offset), ...arr.slice(0, offset)];
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

function getLeagueId(row: FixtureListRow): number | null {
  return row?.league?.id != null ? Number(row.league.id) : null;
}

function getLeagueCountry(row: FixtureListRow): string {
  return clean((row?.league as any)?.country);
}

function getCity(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.city);
}

function getVenue(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.name);
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

function cityKeyFromRow(row: FixtureListRow) {
  return toSlug(getCity(row));
}

function cityLabelFromRow(row: FixtureListRow) {
  return getCity(row);
}

function countryLabelFromRow(row: FixtureListRow) {
  return getLeagueCountry(row);
}

function leagueStrengthBucket(leagueId: number | null): number {
  if (leagueId == null) return 1;
  if (EUROPEAN_COMPETITION_IDS.has(leagueId)) return 5;
  if (ELITE_LEAGUE_IDS.has(leagueId)) return 4;
  if (STRONG_SECOND_TIER_LEAGUE_IDS.has(leagueId)) return 3;
  if (VALUE_DEPTH_LEAGUE_IDS.has(leagueId)) return 2;
  return 1;
}

/* -------------------------------------------------------------------------- */
/* Category seed / ordering helpers                                           */
/* -------------------------------------------------------------------------- */

export function categorySeedFromFilters(params: {
  vibes: DiscoverVibe[];
  windowKey: DiscoverWindowKey;
  tripLength: DiscoverTripLength;
}): DiscoverCategory {
  const { vibes, windowKey, tripLength } = params;

  if (windowKey === "wknd") return "weekendTrips";
  if (tripLength === "2" || tripLength === "3") return "multiMatchTrips";
  if (vibes.includes("big")) return "bigMatches";
  if (vibes.includes("nightlife")) return "nightMatches";
  if (vibes.includes("culture")) return "matchdayCulture";
  if (vibes.includes("warm")) return "iconicCities";
  if (vibes.includes("easy")) return "easyTickets";
  return "perfectTrips";
}

export function prioritiseCategories(
  categories: DiscoverCategory[],
  preferred: DiscoverCategory
): DiscoverCategory[] {
  const deduped = categories.filter(
    (category, index) => categories.indexOf(category) === index
  );
  const withoutPreferred = deduped.filter((category) => category !== preferred);
  return deduped.includes(preferred) ? [preferred, ...withoutPreferred] : deduped;
}

function buildDiscoverSeedKey(params: {
  window: ShortcutWindow;
  windowKey: DiscoverWindowKey;
  origin: string;
  tripLength: DiscoverTripLength;
  vibes: DiscoverVibe[];
  category: DiscoverCategory;
}) {
  return [
    params.window.from,
    params.window.to,
    params.windowKey,
    params.origin.trim().toLowerCase(),
    params.tripLength,
    params.vibes.slice().sort().join(","),
    params.category,
  ].join("|");
}

function categoryLeagueBias(category: DiscoverCategory, league: LeagueOption): number {
  const leagueId = league.leagueId;
  const isEuro = EUROPEAN_COMPETITION_IDS.has(leagueId);
  const strength = leagueStrengthBucket(leagueId);

  switch (category) {
    case "europeanNights":
      if (isEuro) return 120;
      return strength * 2;

    case "bigMatches":
    case "bucketList":
      return isEuro ? 50 : strength * 20;

    case "derbies":
    case "atmospheres":
    case "matchdayCulture":
      return isEuro ? 18 : strength >= 3 ? 28 : 16;

    case "valueTrips":
    case "easyTickets":
    case "underratedTrips":
      if (isEuro) return -10;
      if (strength === 4) return 12;
      if (strength === 3) return 18;
      if (strength === 2) return 22;
      return 14;

    case "multiMatchTrips":
    case "weekendTrips":
      return isEuro ? 10 : strength >= 3 ? 22 : 18;

    case "legendaryStadiums":
      return isEuro ? 34 : strength * 18;

    case "iconicCities":
    case "nightMatches":
    case "titleDrama":
    case "perfectTrips":
    default:
      return isEuro ? 20 : strength * 14;
  }
}

function buildPreferredLeagueOrder(seed: number, category: DiscoverCategory) {
  const decorated = LEAGUES.map((league, index) => ({
    league,
    score:
      categoryLeagueBias(category, league) +
      (league.homeVisible ? 8 : 0) +
      (league.featured ? 6 : 0) +
      (HIGH_PULL_CITIES.has(norm(league.country)) ? 1 : 0),
    index,
  }));

  const stableRotated = rotateStable(decorated, seed);

  return stableRotated
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.league);
}

/* -------------------------------------------------------------------------- */
/* Fetch / pool building                                                      */
/* -------------------------------------------------------------------------- */

function dedupeFixtures(rows: FixtureListRow[]) {
  const deduped = new Map<string, FixtureListRow>();

  for (const row of rows) {
    const id = getFixtureId(row);
    if (!id) continue;
    if (!deduped.has(id)) deduped.set(id, row);
  }

  return Array.from(deduped.values());
}

function hasMinimumFixtureShape(row: FixtureListRow): boolean {
  return Boolean(
    getFixtureId(row) &&
      homeName(row) &&
      awayName(row) &&
      getVenue(row) &&
      getCity(row) &&
      clean(row?.fixture?.date)
  );
}

function fixturePoolPriority(row: FixtureListRow, category: DiscoverCategory): number {
  const leagueId = getLeagueId(row);
  const isEuro = leagueId != null && EUROPEAN_COMPETITION_IDS.has(leagueId);
  const isWeekend = isWeekendFixture(row);
  const isMidweek = isMidweekFixture(row);
  const isLate = isLateKickoff(row);
  const city = norm(getCity(row));

  let score = leagueStrengthBucket(leagueId) * 20;

  if (isEuro) score += 25;
  if (HIGH_PULL_CITIES.has(city)) score += 10;
  if (isLate) score += 8;
  if (isWeekend) score += 8;
  if (isMidweek) score += 4;

  switch (category) {
    case "europeanNights":
      if (isEuro) score += 80;
      if (isMidweek) score += 18;
      break;
    case "weekendTrips":
      if (isWeekend) score += 60;
      break;
    case "nightMatches":
      if (isLate) score += 50;
      break;
    case "multiMatchTrips":
      if (STACKABLE_CITIES.has(city)) score += 40;
      break;
    case "valueTrips":
    case "easyTickets":
    case "underratedTrips":
      if (!isEuro && leagueStrengthBucket(leagueId) <= 3) score += 24;
      break;
    default:
      break;
  }

  return score;
}

export async function fetchDiscoverPool(params: {
  window: ShortcutWindow;
  windowKey: DiscoverWindowKey;
  origin: string;
  tripLength: DiscoverTripLength;
  vibes: DiscoverVibe[];
  category: DiscoverCategory;
  minFixtures?: number;
  maxLeagueFetches?: number;
  batchSize?: number;
}) {
  const {
    window,
    windowKey,
    origin,
    tripLength,
    vibes,
    category,
    minFixtures = 72,
    maxLeagueFetches,
    batchSize = 6,
  } = params;

  const seedKey = buildDiscoverSeedKey({
    window,
    windowKey,
    origin,
    tripLength,
    vibes,
    category,
  });

  const seed = createStableSeed(seedKey);
  const preferredLeagues = buildPreferredLeagueOrder(seed, category);
  const effectiveMaxLeagueFetches = Math.min(
    Math.max(1, maxLeagueFetches ?? preferredLeagues.length),
    preferredLeagues.length
  );

  const leaguesToFetch = preferredLeagues.slice(0, effectiveMaxLeagueFetches);
  const collected: FixtureListRow[] = [];

  for (let i = 0; i < leaguesToFetch.length; i += batchSize) {
    const batch = leaguesToFetch.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (league) => {
        try {
          const rows = await getFixtures({
            league: league.leagueId,
            season: league.season,
            from: window.from,
            to: window.to,
          });

          return Array.isArray(rows) ? rows : [];
        } catch {
          return [];
        }
      })
    );

    collected.push(...results.flat());

    const usable = dedupeFixtures(collected).filter(hasMinimumFixtureShape);
    if (usable.length >= minFixtures && i + batchSize >= batchSize * 2) {
      break;
    }
  }

  return dedupeFixtures(collected)
    .filter(hasMinimumFixtureShape)
    .sort(
      (a, b) =>
        fixturePoolPriority(b, category) - fixturePoolPriority(a, category) ||
        clean(a?.fixture?.date).localeCompare(clean(b?.fixture?.date))
    );
}

/* -------------------------------------------------------------------------- */
/* Fixture presentation helpers                                               */
/* -------------------------------------------------------------------------- */

export function fixtureTitle(row: FixtureListRow) {
  return `${homeName(row)} vs ${awayName(row)}`;
}

export function fixtureMeta(row: FixtureListRow) {
  const kickoff = formatUkDateTimeMaybe(row?.fixture?.date);
  const city = getCity(row);
  const venue = getVenue(row);
  const tail = [venue, city].filter(Boolean).join(" • ");
  return tail ? `${kickoff} • ${tail}` : kickoff;
}

export function isMidweekFixture(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;
  const day = dt.getDay();
  return day >= 1 && day <= 4;
}

export function isLateKickoff(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;
  const h = dt.getHours();
  return h >= 19 && h <= 22;
}

export function isWeekendFixture(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;
  const day = dt.getDay();
  return day === 5 || day === 6 || day === 0;
}

export function isEuropeanCompetition(row: FixtureListRow) {
  const leagueId = getLeagueId(row);
  return leagueId != null && EUROPEAN_COMPETITION_IDS.has(leagueId);
}

function getFixturePairKey(row: FixtureListRow) {
  const a = toSlug(homeName(row));
  const b = toSlug(awayName(row));
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

export function trendingLabelForFixture(row: FixtureListRow) {
  const pair = getFixturePairKey(row);
  const city = getCity(row);

  if (KNOWN_DERBY_LABELS[pair]) return KNOWN_DERBY_LABELS[pair];
  if (isEuropeanCompetition(row)) return "European night";
  if (city) return `${city} football trip`;
  return "Trending football trip";
}

export function whyThisFits(
  row: FixtureListRow,
  category: DiscoverCategory,
  vibes: DiscoverVibe[],
  tripLength: DiscoverTripLength
) {
  if (category === "easyTickets") return "Cleaner route for a simpler football trip.";
  if (category === "bigMatches") return "Stronger occasion feel with more travel pull.";
  if (category === "derbies") return "History, hostility and genuine rivalry tension.";
  if (category === "atmospheres") return "Higher-upside crowd energy and matchday force.";
  if (category === "valueTrips") return "Better experience-per-pound potential.";
  if (category === "europeanNights") {
    return isEuropeanCompetition(row)
      ? "Continental occasion with stronger night-game pull."
      : "Still strong enough to survive a Europe-first ranking.";
  }
  if (category === "multiMatchTrips") {
    return "Good anchor fixture for stacking a bigger football trip.";
  }
  if (category === "weekendTrips") {
    return isWeekendFixture(row)
      ? "Weekend-timed fixture that fits a cleaner football break."
      : "Still workable for a weekend if paired correctly.";
  }
  if (category === "nightMatches") {
    return isLateKickoff(row)
      ? "Later kick-off gives it better lights-on energy."
      : "Good fit for an occasion-led evening trip.";
  }
  if (category === "matchdayCulture") return "Better city + football balance beyond the 90 minutes.";
  if (category === "iconicCities") return "The city itself adds real pull beyond the fixture.";
  if (category === "legendaryStadiums") return "Ground and club pull are doing the heavy lifting.";
  if (tripLength === "2" || tripLength === "3") return "Strong shape for a football city break.";
  if (isMidweekFixture(row)) return "Midweek-worthy fixture with enough travel pull.";
  if (vibes.includes("easy")) return "Lower-friction option from your current setup.";
  if (vibes.includes("big")) return "Leans more toward atmosphere, weight and occasion.";
  return "One of the stronger live options from your current setup.";
}

export function rankLabel(index: number) {
  if (index === 0) return "Top fit";
  if (index === 1) return "Strong";
  if (index === 2) return "Hot";
  return `#${index + 1}`;
}

export function trendingScore(row: FixtureListRow, baseScore: number) {
  let score = baseScore;

  const pair = getFixturePairKey(row);
  if (KNOWN_DERBY_LABELS[pair]) score += 80;
  if (isEuropeanCompetition(row)) score += 48;
  if (isLateKickoff(row)) score += 14;
  if (isMidweekFixture(row)) score += 10;

  const leagueId = getLeagueId(row);
  if (leagueId === 39) score += 14;
  if (leagueId === 140) score += 14;
  if (leagueId === 135) score += 14;
  if (leagueId === 78) score += 14;
  if (leagueId === 61) score += 10;

  return score;
}

export function fixtureIsoDateOnly(row: FixtureListRow) {
  return fixtureIsoDateOnlyInternal(row);
}

/* -------------------------------------------------------------------------- */
/* Multi-match trip builder                                                   */
/* -------------------------------------------------------------------------- */

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

function tripCountries(rows: FixtureListRow[]): string[] {
  return Array.from(new Set(rows.map((row) => countryLabelFromRow(row)).filter(Boolean)));
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
