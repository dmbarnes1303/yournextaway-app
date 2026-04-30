import { LEAGUES, type LeagueOption } from "@/src/constants/football";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import type { DiscoverCategory } from "./discoverCategories";
import type { DiscoverTripLength, DiscoverVibe } from "./discoverEngine";
import type { DiscoverWindowKey, ShortcutWindow } from "./types";

const EUROPEAN_COMPETITION_IDS = new Set([2, 3, 848]);
const ELITE_LEAGUE_IDS = new Set([39, 140, 135, 78, 61]);
const STRONG_SECOND_TIER_LEAGUE_IDS = new Set([88, 94, 203, 179, 144, 218, 207, 197]);
const VALUE_DEPTH_LEAGUE_IDS = new Set([
  119, 345, 106, 210, 286, 271, 283, 332, 373, 172, 318, 315, 357, 113, 103, 244, 164,
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
  "dortmund",
]);

const FAST_CORE_LEAGUE_IDS = [2, 140, 135, 78, 61, 39, 88, 94, 3, 848];

const DEFAULT_MIN_FIXTURES = 36;
const DEFAULT_MAX_LEAGUE_FETCHES = 14;
const DEFAULT_BATCH_SIZE = 5;
const MIN_BATCHES_BEFORE_EARLY_EXIT = 2;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function norm(value: unknown): string {
  return clean(value).toLowerCase();
}

function getLeagueId(row: FixtureListRow): number | null {
  return row?.league?.id != null ? Number(row.league.id) : null;
}

function getFixtureId(row: FixtureListRow): string {
  return row?.fixture?.id != null ? String(row.fixture.id) : "";
}

function getCity(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.city);
}

function getVenue(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.name);
}

function homeName(row: FixtureListRow): string {
  return clean(row?.teams?.home?.name);
}

function awayName(row: FixtureListRow): string {
  return clean(row?.teams?.away?.name);
}

function fixtureDate(row: FixtureListRow): Date | null {
  const raw = clean(row?.fixture?.date);
  if (!raw) return null;

  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
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

function leagueStrengthBucket(leagueId: number | null): number {
  if (leagueId == null) return 1;
  if (EUROPEAN_COMPETITION_IDS.has(leagueId)) return 5;
  if (ELITE_LEAGUE_IDS.has(leagueId)) return 4;
  if (STRONG_SECOND_TIER_LEAGUE_IDS.has(leagueId)) return 3;
  if (VALUE_DEPTH_LEAGUE_IDS.has(leagueId)) return 2;
  return 1;
}

function isWeekendFixture(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;

  const day = dt.getDay();
  return day === 5 || day === 6 || day === 0;
}

function isMidweekFixture(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;

  const day = dt.getDay();
  return day >= 1 && day <= 4;
}

function isLateKickoff(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;

  const h = dt.getHours();
  return h >= 19 && h <= 22;
}

function isEuropeanFixture(row: FixtureListRow) {
  const leagueId = getLeagueId(row);
  return leagueId != null && EUROPEAN_COMPETITION_IDS.has(leagueId);
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
      return isEuro ? 140 : strength * 4;

    case "bigMatches":
    case "bucketList":
      return isEuro ? 70 : strength * 24;

    case "derbies":
    case "atmospheres":
    case "matchdayCulture":
      return isEuro ? 22 : strength >= 3 ? 34 : 18;

    case "valueTrips":
    case "easyTickets":
    case "underratedTrips":
      if (isEuro) return -14;
      if (strength === 4) return 14;
      if (strength === 3) return 24;
      if (strength === 2) return 28;
      return 16;

    case "multiMatchTrips":
    case "weekendTrips":
      return isEuro ? 8 : strength >= 3 ? 30 : 20;

    case "legendaryStadiums":
      return isEuro ? 44 : strength * 22;

    case "iconicCities":
      return isEuro ? 18 : strength * 18;

    case "nightMatches":
      return isEuro ? 24 : strength * 18;

    case "titleDrama":
      return isEuro ? 38 : strength * 18;

    case "perfectTrips":
    default:
      return isEuro ? 24 : strength * 16;
  }
}

function buildPreferredLeagueOrder(seed: number, category: DiscoverCategory): LeagueOption[] {
  const fastCore = FAST_CORE_LEAGUE_IDS.map((id) => LEAGUES.find((l) => l.leagueId === id)).filter(
    (x): x is LeagueOption => Boolean(x)
  );

  const fastCoreIds = new Set(fastCore.map((l) => l.leagueId));

  const remaining = LEAGUES.filter((league) => !fastCoreIds.has(league.leagueId));

  const decorated = remaining.map((league, index) => ({
    league,
    score:
      categoryLeagueBias(category, league) +
      (league.homeVisible ? 10 : 0) +
      (league.featured ? 8 : 0),
    index,
  }));

  const stableRotated = rotateStable(decorated, seed);

  const orderedRemaining = stableRotated
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.league);

  const boostedCore = fastCore
    .map((league, index) => ({
      league,
      score: categoryLeagueBias(category, league) + 100 - index,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.league);

  return [...boostedCore, ...orderedRemaining];
}

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
  const city = norm(getCity(row));

  const isEuro = isEuropeanFixture(row);
  const isWeekend = isWeekendFixture(row);
  const isMidweek = isMidweekFixture(row);
  const isLate = isLateKickoff(row);

  let score = leagueStrengthBucket(leagueId) * 22;

  if (isEuro) score += 30;
  if (HIGH_PULL_CITIES.has(city)) score += 14;
  if (isLate) score += 10;
  if (isWeekend) score += 10;
  if (isMidweek) score += 5;

  switch (category) {
    case "europeanNights":
      if (isEuro) score += 90;
      if (isMidweek) score += 20;
      if (isLate) score += 14;
      break;

    case "weekendTrips":
      if (isWeekend) score += 70;
      if (HIGH_PULL_CITIES.has(city)) score += 18;
      break;

    case "nightMatches":
      if (isLate) score += 60;
      break;

    case "multiMatchTrips":
      if (HIGH_PULL_CITIES.has(city)) score += 24;
      if (isWeekend) score += 14;
      break;

    case "valueTrips":
    case "easyTickets":
    case "underratedTrips":
      if (!isEuro && leagueStrengthBucket(leagueId) <= 3) score += 28;
      break;

    case "bigMatches":
    case "bucketList":
    case "legendaryStadiums":
      if (isEuro || leagueStrengthBucket(leagueId) >= 4) score += 24;
      break;

    default:
      break;
  }

  return score;
}

function sortPool(rows: FixtureListRow[], category: DiscoverCategory): FixtureListRow[] {
  return [...rows].sort(
    (a, b) =>
      fixturePoolPriority(b, category) - fixturePoolPriority(a, category) ||
      clean(a?.fixture?.date).localeCompare(clean(b?.fixture?.date))
  );
}

function oneBestFixturePerLeague(
  rows: FixtureListRow[],
  category: DiscoverCategory
): FixtureListRow[] {
  const best = new Map<number, { row: FixtureListRow; score: number }>();

  for (const row of rows) {
    const leagueId = getLeagueId(row);
    if (leagueId == null) continue;

    const score = fixturePoolPriority(row, category);
    const existing = best.get(leagueId);

    if (!existing || score > existing.score) {
      best.set(leagueId, { row, score });
    }
  }

  return Array.from(best.values())
    .sort((a, b) => b.score - a.score)
    .map((x) => x.row);
}

function blendBalancedPool(rows: FixtureListRow[], category: DiscoverCategory): FixtureListRow[] {
  const sorted = sortPool(rows, category);
  const onePerLeague = oneBestFixturePerLeague(sorted, category);
  const seen = new Set(onePerLeague.map(getFixtureId));

  const extras = sorted.filter((row) => {
    const id = getFixtureId(row);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return [...onePerLeague, ...extras];
}

function clampLeagueFetchCount(requested: number | undefined, available: number): number {
  const base = requested ?? DEFAULT_MAX_LEAGUE_FETCHES;
  return Math.min(Math.max(1, base), available);
}

function clampBatchSize(requested: number | undefined): number {
  const base = requested ?? DEFAULT_BATCH_SIZE;
  return Math.min(Math.max(1, base), 6);
}

async function fetchLeagueRows(league: LeagueOption, window: ShortcutWindow) {
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
    minFixtures = DEFAULT_MIN_FIXTURES,
    maxLeagueFetches,
    batchSize,
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

  const effectiveMaxLeagueFetches = clampLeagueFetchCount(maxLeagueFetches, preferredLeagues.length);
  const effectiveBatchSize = clampBatchSize(batchSize);

  const leaguesToFetch = preferredLeagues.slice(0, effectiveMaxLeagueFetches);
  const collected: FixtureListRow[] = [];

  for (let i = 0; i < leaguesToFetch.length; i += effectiveBatchSize) {
    const batch = leaguesToFetch.slice(i, i + effectiveBatchSize);

    const results = await Promise.all(batch.map((league) => fetchLeagueRows(league, window)));

    collected.push(...results.flat());

    const usable = dedupeFixtures(collected).filter(hasMinimumFixtureShape);
    const balanced = blendBalancedPool(usable, category);
    const batchesCompleted = Math.floor(i / effectiveBatchSize) + 1;

    if (balanced.length >= minFixtures && batchesCompleted >= MIN_BATCHES_BEFORE_EARLY_EXIT) {
      return balanced;
    }
  }

  return blendBalancedPool(dedupeFixtures(collected).filter(hasMinimumFixtureShape), category);
}
