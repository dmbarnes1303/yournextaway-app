import {
  LEAGUES,
  nextWeekendWindowIso,
  windowFromTomorrowIso,
} from "@/src/constants/football";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import type { DiscoverCategory } from "./discoverCategories";
import type { DiscoverTripLength, DiscoverVibe } from "./discoverEngine";
import type { DiscoverWindowKey, MultiMatchTrip, RankedDiscoverPick, ShortcutWindow } from "./types";

const EUROPEAN_COMPETITION_IDS = new Set([2, 3, 848]);

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

export function toSlug(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

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
    minFixtures = 52,
    maxLeagueFetches = 24,
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

  const europeanLeagues = LEAGUES.filter((league) =>
    EUROPEAN_COMPETITION_IDS.has(league.leagueId)
  );
  const domesticLeagues = LEAGUES.filter(
    (league) => !EUROPEAN_COMPETITION_IDS.has(league.leagueId)
  );

  const preferred =
    category === "europeanNights"
      ? [...rotateStable(europeanLeagues, seed), ...rotateStable(domesticLeagues, seed)]
      : [...rotateStable(domesticLeagues, seed), ...rotateStable(europeanLeagues, seed)];

  const collected: FixtureListRow[] = [];

  for (let i = 0; i < preferred.length && i < maxLeagueFetches; i += batchSize) {
    const batch = preferred.slice(i, Math.min(i + batchSize, maxLeagueFetches));

    const results = await Promise.all(
      batch.map(async (league) => {
        try {
          const res = await getFixtures({
            league: league.leagueId,
            season: league.season,
            from: window.from,
            to: window.to,
          });
          return Array.isArray(res) ? res : [];
        } catch {
          return [];
        }
      })
    );

    const flat = results.flat().filter((row) => row?.fixture?.id != null);
    collected.push(...flat);

    if (collected.length >= minFixtures) break;
  }

  const deduped = new Map<string, FixtureListRow>();

  for (const row of collected) {
    const id = row?.fixture?.id != null ? String(row.fixture.id) : null;
    if (!id) continue;
    if (!deduped.has(id)) deduped.set(id, row);
  }

  return Array.from(deduped.values()).filter((row) => {
    const venue = String(row?.fixture?.venue?.name ?? "").trim();
    return !!venue;
  });
}

export function fixtureTitle(row: FixtureListRow) {
  const home = row?.teams?.home?.name ?? "Home";
  const away = row?.teams?.away?.name ?? "Away";
  return `${home} vs ${away}`;
}

export function fixtureMeta(row: FixtureListRow) {
  const kickoff = formatUkDateTimeMaybe(row?.fixture?.date);
  const city = String(row?.fixture?.venue?.city ?? "").trim();
  const venue = String(row?.fixture?.venue?.name ?? "").trim();
  const tail = [venue, city].filter(Boolean).join(" • ");
  return tail ? `${kickoff} • ${tail}` : kickoff;
}

export function isMidweekFixture(row: FixtureListRow) {
  const raw = row?.fixture?.date;
  if (!raw) return false;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  const day = dt.getDay();
  return day >= 1 && day <= 4;
}

export function isLateKickoff(row: FixtureListRow) {
  const raw = row?.fixture?.date;
  if (!raw) return false;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  const h = dt.getHours();
  return h >= 19 && h <= 22;
}

export function isWeekendFixture(row: FixtureListRow) {
  const raw = row?.fixture?.date;
  if (!raw) return false;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  const day = dt.getDay();
  return day === 5 || day === 6 || day === 0;
}

export function isEuropeanCompetition(row: FixtureListRow) {
  const leagueId = row?.league?.id != null ? Number(row.league.id) : null;
  if (leagueId == null) return false;
  return EUROPEAN_COMPETITION_IDS.has(leagueId);
}

function getFixturePairKey(row: FixtureListRow) {
  const a = toSlug(row?.teams?.home?.name ?? "");
  const b = toSlug(row?.teams?.away?.name ?? "");
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

export function trendingLabelForFixture(row: FixtureListRow) {
  const pair = getFixturePairKey(row);
  const city = String(row?.fixture?.venue?.city ?? "").trim();

  const labels: Record<string, string> = {
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

  if (labels[pair]) return labels[pair];
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
  if (category === "easyTickets") return "Cleaner route for a simpler football trip";
  if (category === "bigMatches") return "Stronger occasion feel with more travel pull";
  if (category === "derbies") return "History, edge and real rivalry tension";
  if (category === "atmospheres") return "Higher-upside crowd and matchday energy";
  if (category === "valueTrips") return "Better experience-per-pound potential";
  if (category === "europeanNights") {
    return isEuropeanCompetition(row)
      ? "Continental night with stronger occasion value"
      : "Still strong enough to survive European-night ranking";
  }
  if (category === "multiMatchTrips") return "Good anchor fixture for stacking a bigger trip";
  if (category === "weekendTrips") {
    return isWeekendFixture(row)
      ? "Weekend-timed fixture that suits a cleaner football break"
      : "Still workable for a football weekend with the right second match";
  }
  if (category === "nightMatches") {
    if (isLateKickoff(row)) return "Later kick-off gives it bigger lights-on energy";
    return "Good fit for a later, occasion-led football trip";
  }
  if (category === "matchdayCulture") return "Better city + match balance for a fuller trip";
  if (category === "iconicCities") return "The city itself adds real pull beyond the fixture";
  if (category === "legendaryStadiums") return "Ground and club pull are doing the heavy lifting";
  if (tripLength === "2" || tripLength === "3") return "Strong shape for a football city break";
  if (isMidweekFixture(row)) return "Midweek-worthy fixture with travel pull";
  if (vibes.includes("easy")) return "Lower-friction option from your current setup";
  if (vibes.includes("big")) return "Leans more towards atmosphere and fixture weight";
  return "One of the stronger live options from your current setup";
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
  const knownBigPairs = new Set([
    "ajax|feyenoord",
    "arsenal|tottenham",
    "atletico-madrid|real-madrid",
    "celtic|rangers",
    "fenerbahce|galatasaray",
    "inter|milan",
    "lazio|roma",
    "manchester-city|manchester-united",
    "marseille|paris-saint-germain",
    "olympiacos|panathinaikos",
    "real-betis|sevilla",
  ]);

  if (knownBigPairs.has(pair)) score += 80;
  if (isEuropeanCompetition(row)) score += 50;
  if (isLateKickoff(row)) score += 14;
  if (isMidweekFixture(row)) score += 10;

  const leagueId = row?.league?.id;
  if (leagueId === 39) score += 14;
  if (leagueId === 140) score += 14;
  if (leagueId === 135) score += 14;
  if (leagueId === 78) score += 14;
  if (leagueId === 61) score += 10;

  return score;
}

function fixtureIsoDateOnly(row: FixtureListRow) {
  const raw = String(row?.fixture?.date ?? "").trim();
  if (!raw) return "";
  return raw.slice(0, 10);
}

function parseSafeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetweenIso(a: string, b: string) {
  const da = parseSafeDate(`${a}T00:00:00.000Z`);
  const db = parseSafeDate(`${b}T00:00:00.000Z`);
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function cityKeyFromRow(row: FixtureListRow) {
  const city = String(row?.fixture?.venue?.city ?? "").trim();
  return toSlug(city);
}

function cityLabelFromRow(row: FixtureListRow) {
  return String(row?.fixture?.venue?.city ?? "").trim();
}

function countryLabelFromRow(row: FixtureListRow) {
  return String((row?.league as any)?.country ?? "").trim();
}

function styleLabel(style: MultiMatchTrip["style"]) {
  if (style === "same-city") return "Same-city";
  if (style === "nearby-cities") return "Nearby cities";
  return "Country run";
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

  const makeTrip = (
    rows: FixtureListRow[],
    scoreBase: number,
    title: string,
    subtitle: string,
    style: MultiMatchTrip["style"],
    cityLabel: string,
    countryLabel: string,
    bonusLabels: string[]
  ): MultiMatchTrip | null => {
    if (rows.length < 2) return null;

    const sorted = [...rows].sort((a, b) =>
      String(a?.fixture?.date ?? "").localeCompare(String(b?.fixture?.date ?? ""))
    );

    const from = fixtureIsoDateOnly(sorted[0]);
    const to = fixtureIsoDateOnly(sorted[sorted.length - 1]);
    if (!from || !to) return null;

    const daysSpan = Math.max(1, daysBetweenIso(from, to) + 1);
    if (daysSpan > 6) return null;

    const fixtureIds = sorted
      .map((row) => (row?.fixture?.id != null ? String(row.fixture.id) : ""))
      .filter(Boolean);

    if (fixtureIds.length < 2) return null;

    let score = scoreBase;
    score += rows.length * 50;
    score += Math.max(0, 28 - daysSpan * 3);

    if (style === "same-city") score += 35;
    if (style === "nearby-cities") score += 20;
    if (params.windowKey === "wknd" && daysSpan <= 3) score += 28;

    if (params.tripLength === "2" && daysSpan <= 4) score += 16;
    if (params.tripLength === "3" && daysSpan <= 5) score += 12;
    if (params.vibes.includes("easy") && style === "same-city") score += 18;
    if (params.vibes.includes("culture") && cityLabel) score += 8;
    if (params.vibes.includes("big")) {
      const derbyish = sorted.some((row) =>
        trendingLabelForFixture(row).toLowerCase().includes("derby")
      );
      const euroish = sorted.some((row) => isEuropeanCompetition(row));
      if (derbyish) score += 18;
      if (euroish) score += 12;
    }

    const labels = [
      `${rows.length} matches`,
      `${daysSpan} days`,
      styleLabel(style),
      ...bonusLabels,
    ].filter(Boolean);

    return {
      id: `${style}-${toSlug(title)}-${fixtureIds.join("-")}`,
      title,
      subtitle,
      score,
      matchCount: rows.length,
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
  };

  for (const [, bucket] of byCity.entries()) {
    const sorted = [...bucket.items].sort((a, b) => b.baseScore - a.baseScore).slice(0, 5);

    for (let size = Math.min(3, sorted.length); size >= 2; size -= 1) {
      const rows = sorted.slice(0, size).map((item) => item.row);
      const scoreBase = sorted.slice(0, size).reduce((sum, item) => sum + item.baseScore, 0);

      const trip = makeTrip(
        rows,
        scoreBase,
        `${size} matches in ${bucket.city}`,
        `${bucket.city} football trip`,
        "same-city",
        bucket.city,
        bucket.country,
        bucket.country ? [bucket.country] : []
      );

      if (trip) trips.push(trip);
    }
  }

  for (const [, bucket] of byCountry.entries()) {
    const sameCountryRows = [...bucket.items]
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, 8);

    const uniqueCityRows: typeof sameCountryRows = [];
    const seenCities = new Set<string>();

    for (const item of sameCountryRows) {
      const cityKey = cityKeyFromRow(item.row);
      if (!cityKey || seenCities.has(cityKey)) continue;
      seenCities.add(cityKey);
      uniqueCityRows.push(item);
    }

    for (let size = Math.min(3, uniqueCityRows.length); size >= 2; size -= 1) {
      const rows = uniqueCityRows.slice(0, size).map((item) => item.row);
      const scoreBase = uniqueCityRows
        .slice(0, size)
        .reduce((sum, item) => sum + item.baseScore, 0);

      const cityNames = rows
        .map((row) => cityLabelFromRow(row))
        .filter(Boolean)
        .slice(0, 3);

      const trip = makeTrip(
        rows,
        scoreBase,
        `${size} matches across ${bucket.country}`,
        cityNames.length ? cityNames.join(" • ") : `${bucket.country} multi-match trip`,
        cityNames.length <= 2 ? "nearby-cities" : "country-run",
        cityNames[0] ?? "",
        bucket.country,
        cityNames
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
