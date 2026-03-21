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
]);

const DEFAULT_MIN_FIXTURES = 48;
const DEFAULT_MAX_LEAGUE_FETCHES = 12;
const DEFAULT_BATCH_SIZE = 4;
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
  return clean(row?.teams?.home?.name) || "Home";
}

function awayName(row: FixtureListRow): string {
  return clean(row?.teams?.away?.name) || "Away";
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
      return isEuro ? 120 : strength * 2;

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

function buildPreferredLeagueOrder(seed: number, category: DiscoverCategory): LeagueOption[] {
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
      if (HIGH_PULL_CITIES.has(city)) score += 18;
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

function clampLeagueFetchCount(requested: number | undefined, available: number): number {
  const base = requested ?? DEFAULT_MAX_LEAGUE_FETCHES;
  return Math.min(Math.max(1, base), available);
}

function clampBatchSize(requested: number | undefined): number {
  const base = requested ?? DEFAULT_BATCH_SIZE;
  return Math.min(Math.max(1, base), 6);
}

function sortPool(rows: FixtureListRow[], category: DiscoverCategory): FixtureListRow[] {
  return rows.sort(
    (a, b) =>
      fixturePoolPriority(b, category) - fixturePoolPriority(a, category) ||
      clean(a?.fixture?.date).localeCompare(clean(b?.fixture?.date))
  );
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

  const effectiveMaxLeagueFetches = clampLeagueFetchCount(
    maxLeagueFetches,
    preferredLeagues.length
  );

  const effectiveBatchSize = clampBatchSize(batchSize);
  const leaguesToFetch = preferredLeagues.slice(0, effectiveMaxLeagueFetches);
  const collected: FixtureListRow[] = [];

  for (let i = 0; i < leaguesToFetch.length; i += effectiveBatchSize) {
    const batch = leaguesToFetch.slice(i, i + effectiveBatchSize);

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
    const batchesCompleted = Math.floor(i / effectiveBatchSize) + 1;

    if (
      usable.length >= minFixtures &&
      batchesCompleted >= MIN_BATCHES_BEFORE_EARLY_EXIT
    ) {
      break;
    }
  }

  return sortPool(
    dedupeFixtures(collected).filter(hasMinimumFixtureShape),
    category
  );
}
