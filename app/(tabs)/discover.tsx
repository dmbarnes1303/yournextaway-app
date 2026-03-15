import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import {
  LEAGUES,
  nextWeekendWindowIso,
  windowFromTomorrowIso,
} from "@/src/constants/football";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import {
  DISCOVER_PRIMARY_CATEGORIES,
  DISCOVER_SECONDARY_CATEGORIES,
  DISCOVER_CATEGORY_META,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";
import {
  buildDiscoverScores,
  type DiscoverTripLength,
  type DiscoverVibe,
} from "@/src/features/discover/discoverEngine";
import { discoverScoreForCategory } from "@/src/features/discover/discoverRanking";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

type ShortcutWindow = { from: string; to: string };
type DiscoverWindowKey = "wknd" | "d7" | "d14" | "d30" | "d60" | "d90";

type RankedDiscoverPick = {
  item: ReturnType<typeof buildDiscoverScores>[number];
  score: number;
};

type InspirationPreset = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  vibe?: DiscoverVibe;
  category: DiscoverCategory;
  windowKey?: DiscoverWindowKey;
};

type QuickSpark = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: DiscoverCategory;
  vibe?: DiscoverVibe;
  windowKey?: DiscoverWindowKey;
  tripLength?: DiscoverTripLength;
};

type MultiMatchTrip = {
  id: string;
  title: string;
  subtitle: string;
  score: number;
  matchCount: number;
  daysSpan: number;
  from: string;
  to: string;
  cityLabel: string;
  countryLabel: string;
  style: "same-city" | "nearby-cities" | "country-run";
  fixtureIds: string[];
  rows: FixtureListRow[];
  labels: string[];
};

const PLACEHOLDER_DISCOVER_IMAGE =
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1600&h=1000&fm=jpg&q=82";

const INSPIRATION_PRESETS: InspirationPreset[] = [
  {
    id: "best-now",
    title: "Best trips right now",
    subtitle: "Strong live options for a football trip soon",
    icon: "flash-outline",
    category: "perfectTrips",
    windowKey: "d30",
  },
  {
    id: "easy",
    title: "Easy city breaks",
    subtitle: "Lower-friction trips with cleaner planning potential",
    icon: "navigate-outline",
    vibe: "easy",
    category: "easyTickets",
    windowKey: "d30",
  },
  {
    id: "big",
    title: "Big matches",
    subtitle: "High-profile fixtures worth travelling for",
    icon: "star-outline",
    vibe: "big",
    category: "bigMatches",
    windowKey: "d60",
  },
  {
    id: "derbies",
    title: "Derbies & rivalries",
    subtitle: "History, tension and real edge",
    icon: "flame-outline",
    vibe: "big",
    category: "derbies",
    windowKey: "d90",
  },
  {
    id: "atmospheres",
    title: "Insane atmospheres",
    subtitle: "Noise, intensity and full matchday energy",
    icon: "radio-outline",
    vibe: "big",
    category: "atmospheres",
    windowKey: "d60",
  },
  {
    id: "culture",
    title: "City + match trips",
    subtitle: "Trips where the place matters as much as the game",
    icon: "people-outline",
    vibe: "culture",
    category: "matchdayCulture",
    windowKey: "d60",
  },
];

const QUICK_SPARKS: QuickSpark[] = [
  {
    id: "derby-nights",
    title: "Big derby nights",
    icon: "flame-outline",
    category: "derbies",
    vibe: "big",
    windowKey: "d90",
  },
  {
    id: "midweek-football",
    title: "Midweek football trips",
    icon: "calendar-outline",
    category: "nightMatches",
    vibe: "nightlife",
    windowKey: "d30",
  },
  {
    id: "easy-two-night",
    title: "Easy 2-night trips",
    icon: "navigate-outline",
    category: "easyTickets",
    vibe: "easy",
    tripLength: "2",
    windowKey: "d30",
  },
  {
    id: "best-value",
    title: "Best value trips",
    icon: "cash-outline",
    category: "valueTrips",
    vibe: "easy",
    windowKey: "d60",
  },
  {
    id: "bucket-list",
    title: "Bucket-list football",
    icon: "bookmark-outline",
    category: "bucketList",
    vibe: "big",
    windowKey: "d90",
  },
  {
    id: "legendary-grounds",
    title: "Legendary stadiums",
    icon: "business-outline",
    category: "legendaryStadiums",
    vibe: "culture",
    windowKey: "d90",
  },
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function labelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "This Weekend";
  if (key === "d7") return "Next 7 Days";
  if (key === "d14") return "Next 14 Days";
  if (key === "d30") return "Next 30 Days";
  if (key === "d60") return "Next 60 Days";
  return "Next 90 Days";
}

function shortLabelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "Weekend";
  if (key === "d7") return "7 Days";
  if (key === "d14") return "14 Days";
  if (key === "d30") return "30 Days";
  if (key === "d60") return "60 Days";
  return "90 Days";
}

function labelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day Trip";
  if (v === "1") return "1 Night";
  if (v === "2") return "2 Nights";
  return "3 Nights";
}

function shortLabelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day";
  if (v === "1") return "1N";
  if (v === "2") return "2N";
  return "3N";
}

function labelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy Travel";
  if (v === "big") return "Big Match";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  return "Warm-ish";
}

function shortLabelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy";
  if (v === "big") return "Big";
  if (v === "nightlife") return "Night";
  if (v === "culture") return "Culture";
  return "Warm";
}

function windowForKey(key: DiscoverWindowKey): ShortcutWindow {
  if (key === "wknd") return nextWeekendWindowIso();
  if (key === "d7") return windowFromTomorrowIso(7);
  if (key === "d14") return windowFromTomorrowIso(14);
  if (key === "d30") return windowFromTomorrowIso(30);
  if (key === "d60") return windowFromTomorrowIso(60);
  return windowFromTomorrowIso(90);
}

function pickRandom<T>(arr: T[]): T | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
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

function clampVibes(next: DiscoverVibe[]) {
  if (next.length <= 3) return next;
  return next.slice(next.length - 3);
}

function toSlug(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function categorySeedFromVibes(vibes: DiscoverVibe[]): DiscoverCategory {
  if (vibes.includes("big")) return "bigMatches";
  if (vibes.includes("nightlife")) return "nightMatches";
  if (vibes.includes("culture")) return "matchdayCulture";
  if (vibes.includes("warm")) return "iconicCities";
  if (vibes.includes("easy")) return "easyTickets";
  return "perfectTrips";
}

function prioritiseCategories(
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

async function fetchDiscoverPool(params: {
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
    minFixtures = 40,
    maxLeagueFetches = 18,
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
  const orderedLeagues = rotateStable(LEAGUES, seed);
  const collected: FixtureListRow[] = [];

  for (let i = 0; i < orderedLeagues.length && i < maxLeagueFetches; i += batchSize) {
    const batch = orderedLeagues.slice(i, Math.min(i + batchSize, maxLeagueFetches));

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

function fixtureTitle(row: FixtureListRow) {
  const home = row?.teams?.home?.name ?? "Home";
  const away = row?.teams?.away?.name ?? "Away";
  return `${home} vs ${away}`;
}

function fixtureMeta(row: FixtureListRow) {
  const kickoff = formatUkDateTimeMaybe(row?.fixture?.date);
  const city = String(row?.fixture?.venue?.city ?? "").trim();
  const venue = String(row?.fixture?.venue?.name ?? "").trim();
  const tail = [venue, city].filter(Boolean).join(" • ");
  return tail ? `${kickoff} • ${tail}` : kickoff;
}

function getDiscoverCardImage() {
  return PLACEHOLDER_DISCOVER_IMAGE;
}

function isMidweekFixture(row: FixtureListRow) {
  const raw = row?.fixture?.date;
  if (!raw) return false;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  const day = dt.getDay();
  return day >= 1 && day <= 4;
}

function isLateKickoff(row: FixtureListRow) {
  const raw = row?.fixture?.date;
  if (!raw) return false;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  const h = dt.getHours();
  return h >= 19 && h <= 22;
}

function getFixturePairKey(row: FixtureListRow) {
  const a = toSlug(row?.teams?.home?.name ?? "");
  const b = toSlug(row?.teams?.away?.name ?? "");
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

function trendingLabelForFixture(row: FixtureListRow) {
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
  if (city) return `${city} football trip`;
  return "Trending football trip";
}

function whyThisFits(
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

function rankLabel(index: number) {
  if (index === 0) return "Top fit";
  if (index === 1) return "Strong";
  if (index === 2) return "Hot";
  return `#${index + 1}`;
}

function trendingScore(row: FixtureListRow, baseScore: number) {
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

function buildMultiMatchTrips(
  rankedLive: RankedDiscoverPick[],
  params: {
    vibes: DiscoverVibe[];
    tripLength: DiscoverTripLength;
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

    if (params.tripLength === "2" && daysSpan <= 4) score += 16;
    if (params.tripLength === "3" && daysSpan <= 5) score += 12;
    if (params.vibes.includes("easy") && style === "same-city") score += 18;
    if (params.vibes.includes("culture") && cityLabel) score += 8;
    if (params.vibes.includes("big")) {
      const derbyish = sorted.some((row) => trendingLabelForFixture(row).toLowerCase().includes("derby"));
      if (derbyish) score += 18;
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
        `${bucket.city} football trip across ${Math.max(
          1,
          daysBetweenIso(fixtureIsoDateOnly(rows[0]), fixtureIsoDateOnly(rows[rows.length - 1])) + 1
        )} days`,
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
        cityNames.length
          ? `${cityNames.join(" • ")}`
          : `${bucket.country} multi-match trip`,
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

function comboWhy(trip: MultiMatchTrip) {
  if (trip.style === "same-city") {
    return "Lowest-friction way to turn one match into a proper football trip.";
  }
  if (trip.style === "nearby-cities") {
    return "Multiple fixtures without stretching the travel too far.";
  }
  return "A denser football run with more than one genuine reason to travel.";
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeaderStack}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("d30");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverOrigin, setDiscoverOrigin] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [setupExpanded, setSetupExpanded] = useState(false);

  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveRows, setLiveRows] = useState<FixtureListRow[]>([]);

  const toggleSetup = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSetupExpanded((prev) => !prev);
  }, []);

  const toggleVibe = useCallback((vibe: DiscoverVibe) => {
    setDiscoverVibes((prev) => {
      const has = prev.includes(vibe);
      const next = has ? prev.filter((value) => value !== vibe) : [...prev, vibe];
      return clampVibes(next);
    });
  }, []);

  const resetFilters = useCallback(() => {
    setDiscoverWindowKey("d30");
    setDiscoverTripLength("2");
    setDiscoverVibes(["easy"]);
    setDiscoverOrigin("");
  }, []);

  const currentWindow = useMemo(
    () => windowForKey(discoverWindowKey),
    [discoverWindowKey]
  );

  const seededCategory = useMemo(
    () => categorySeedFromVibes(discoverVibes),
    [discoverVibes]
  );

  const prioritisedPrimaryCategories = useMemo(
    () => prioritiseCategories(DISCOVER_PRIMARY_CATEGORIES, seededCategory),
    [seededCategory]
  );

  const prioritisedSecondaryCategories = useMemo(() => {
    const primarySet = new Set(prioritisedPrimaryCategories);
    return prioritiseCategories(
      DISCOVER_SECONDARY_CATEGORIES.filter((category) => !primarySet.has(category)),
      seededCategory
    );
  }, [prioritisedPrimaryCategories, seededCategory]);

  const leadCategory = prioritisedPrimaryCategories[0];
  const remainingPrimaryCategories = prioritisedPrimaryCategories.slice(1);

  const filterSummary = useMemo(() => {
    const parts = [
      labelForKey(discoverWindowKey),
      labelForTripLength(discoverTripLength),
      discoverVibes.length ? discoverVibes.map(labelForVibe).join(" • ") : "Any vibe",
    ];

    if (discoverOrigin.trim()) parts.push(`From ${discoverOrigin.trim()}`);

    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, discoverOrigin]);

  const compactSummary = useMemo(() => {
    const parts = [
      shortLabelForKey(discoverWindowKey),
      shortLabelForTripLength(discoverTripLength),
      discoverVibes.length
        ? discoverVibes.map(shortLabelForVibe).join(" + ")
        : "Any vibe",
    ];

    if (discoverOrigin.trim()) parts.push(discoverOrigin.trim());

    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, discoverOrigin]);

  const browseModeLabel = useMemo(() => {
    const meta = DISCOVER_CATEGORY_META[seededCategory];
    return meta?.title ?? "Best-fit routes";
  }, [seededCategory]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingLive(true);
      setLiveError(null);

      try {
        const pool = await fetchDiscoverPool({
          window: currentWindow,
          windowKey: discoverWindowKey,
          origin: discoverOrigin,
          tripLength: discoverTripLength,
          vibes: discoverVibes,
          category: seededCategory,
        });

        if (cancelled) return;
        setLiveRows(pool);
      } catch (e: any) {
        if (cancelled) return;
        setLiveRows([]);
        setLiveError(e?.message ?? "Failed to load live route previews.");
      } finally {
        if (!cancelled) setLoadingLive(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    currentWindow.from,
    currentWindow.to,
    discoverWindowKey,
    discoverOrigin,
    discoverTripLength,
    discoverVibes,
    seededCategory,
  ]);

  const rankedLive = useMemo(() => {
    if (!liveRows.length) return [];

    const scored = buildDiscoverScores(liveRows);

    return scored
      .map((item) => ({
        item,
        score: discoverScoreForCategory(seededCategory, item, {
          origin: discoverOrigin.trim() || null,
          tripLength: discoverTripLength,
          vibes: discoverVibes,
        }),
      }))
      .sort((a, b) => b.score - a.score);
  }, [liveRows, seededCategory, discoverOrigin, discoverTripLength, discoverVibes]);

  const featuredLive = useMemo(() => rankedLive[0] ?? null, [rankedLive]);
  const previewLive = useMemo(() => rankedLive.slice(0, 6), [rankedLive]);

  const trendingTrips = useMemo(() => {
    return [...rankedLive]
      .sort((a, b) => {
        const aRow = a.item.fixture;
        const bRow = b.item.fixture;
        return trendingScore(bRow, b.score) - trendingScore(aRow, a.score);
      })
      .slice(0, 6);
  }, [rankedLive]);

  const multiMatchTrips = useMemo(
    () =>
      buildMultiMatchTrips(rankedLive, {
        vibes: discoverVibes,
        tripLength: discoverTripLength,
      }),
    [rankedLive, discoverVibes, discoverTripLength]
  );

  const goFixturesCategory = useCallback(
    (category: DiscoverCategory) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: currentWindow.from,
          to: currentWindow.to,
          discover: category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
        },
      } as any);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      discoverOrigin,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const goMatchFromRow = useCallback(
    (row: FixtureListRow | null | undefined) => {
      const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : null;
      const leagueId = row?.league?.id != null ? String(row.league.id) : null;
      const season =
        (row as any)?.league?.season != null ? String((row as any).league.season) : null;

      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          fixtureId,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
          from: currentWindow.from,
          to: currentWindow.to,
          prefMode: "discover",
          prefFrom: discoverOrigin.trim() ? discoverOrigin.trim() : undefined,
          prefWindow: discoverWindowKey,
          prefLength: discoverTripLength,
          prefVibes: discoverVibes.join(","),
        },
      } as any);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      discoverOrigin,
      discoverWindowKey,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const goMultiMatchTrip = useCallback(
    (trip: MultiMatchTrip) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: trip.from,
          to: trip.to,
          discover: "perfectTrips",
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
          comboMode: "1",
          comboTitle: trip.title,
          comboIds: trip.fixtureIds.join(","),
        },
      } as any);
    },
    [router, discoverOrigin, discoverTripLength, discoverVibes]
  );

  const applyPreset = useCallback(
    (preset: InspirationPreset) => {
      if (preset.windowKey) setDiscoverWindowKey(preset.windowKey);
      if (preset.vibe) setDiscoverVibes([preset.vibe]);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: windowForKey(preset.windowKey ?? discoverWindowKey).from,
          to: windowForKey(preset.windowKey ?? discoverWindowKey).to,
          discover: preset.category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: preset.vibe ? preset.vibe : discoverVibes.join(","),
        },
      } as any);
    },
    [router, discoverWindowKey, discoverOrigin, discoverTripLength, discoverVibes]
  );

  const applyQuickSpark = useCallback(
    (spark: QuickSpark) => {
      const nextWindowKey = spark.windowKey ?? discoverWindowKey;
      const nextTripLength = spark.tripLength ?? discoverTripLength;
      const nextVibes = spark.vibe ? [spark.vibe] : discoverVibes;

      if (spark.windowKey) setDiscoverWindowKey(spark.windowKey);
      if (spark.tripLength) setDiscoverTripLength(spark.tripLength);
      if (spark.vibe) setDiscoverVibes([spark.vibe]);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: windowForKey(nextWindowKey).from,
          to: windowForKey(nextWindowKey).to,
          discover: spark.category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibes.join(","),
        },
      } as any);
    },
    [
      router,
      discoverWindowKey,
      discoverOrigin,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const goRandomTrip = useCallback(async () => {
    if (loadingRandom) return;

    setLoadingRandom(true);

    try {
      const window = windowForKey(discoverWindowKey);

      const pool = await fetchDiscoverPool({
        window,
        windowKey: discoverWindowKey,
        origin: discoverOrigin,
        tripLength: discoverTripLength,
        vibes: discoverVibes,
        category: seededCategory,
      });

      if (!pool.length) return;

      const scored = buildDiscoverScores(pool);

      const ranked: RankedDiscoverPick[] = scored
        .map((item) => ({
          item,
          score: discoverScoreForCategory(seededCategory, item, {
            origin: discoverOrigin.trim() || null,
            tripLength: discoverTripLength,
            vibes: discoverVibes,
          }),
        }))
        .sort((a, b) => b.score - a.score);

      const poolTop = ranked.slice(0, Math.min(12, ranked.length));
      const chosen = pickRandom(poolTop);
      const fixture = chosen?.item?.fixture ?? null;

      const fixtureId =
        fixture?.fixture?.id != null ? String(fixture.fixture.id) : null;
      const leagueId =
        fixture?.league?.id != null ? String(fixture.league.id) : null;
      const season =
        (fixture as any)?.league?.season != null
          ? String((fixture as any).league.season)
          : null;

      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          fixtureId,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
          from: window.from,
          to: window.to,
          prefMode: "random",
          prefFrom: discoverOrigin.trim() ? discoverOrigin.trim() : undefined,
          prefWindow: discoverWindowKey,
          prefLength: discoverTripLength,
          prefVibes: discoverVibes.join(","),
        },
      } as any);
    } finally {
      setLoadingRandom(false);
    }
  }, [
    loadingRandom,
    discoverWindowKey,
    discoverOrigin,
    discoverTripLength,
    discoverVibes,
    seededCategory,
    router,
  ]);

  const renderCategoryCard = useCallback(
    (category: DiscoverCategory, compact = false) => {
      const meta = DISCOVER_CATEGORY_META[category];
      const primary = meta.emphasis === "primary";

      return (
        <Pressable
          key={category}
          onPress={() => goFixturesCategory(category)}
          style={({ pressed }) => [
            compact ? styles.categoryPressCompact : styles.categoryPress,
            pressed && styles.pressed,
          ]}
        >
          <GlassCard
            strength="default"
            style={[
              compact ? styles.categoryCardCompact : styles.categoryCard,
              primary && !compact ? styles.categoryCardPrimary : null,
            ]}
            noPadding
          >
            <View style={styles.categoryImageWrap}>
              <Image
                source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
                style={styles.categoryImage}
                resizeMode="cover"
              />
              <View style={styles.categoryImageOverlay} />
              <View style={styles.categoryEyebrowPill}>
                <Text style={styles.categoryEyebrowText}>
                  {compact ? "Browse" : "Discover"}
                </Text>
              </View>
            </View>

            <View style={compact ? styles.categoryInnerCompact : styles.categoryInner}>
              <View style={styles.categoryTopRow}>
                <View
                  style={[
                    styles.categoryIconWrap,
                    primary && !compact ? styles.categoryIconWrapPrimary : null,
                  ]}
                >
                  <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
                </View>
              </View>

              <View style={styles.categoryTextWrap}>
                <Text style={styles.categoryTitle}>{meta.title}</Text>
                <Text style={styles.categorySubtitle}>{meta.subtitle}</Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      );
    },
    [goFixturesCategory]
  );

  return (
    <Background
      imageSource={getBackground("explore")}
      overlayOpacity={0.04}
      topShadeOpacity={0.3}
      bottomShadeOpacity={0.36}
      centerShadeOpacity={0.03}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>DISCOVER</Text>
              <Text style={styles.title}>Find your next football trip</Text>
              <Text style={styles.sub}>
                Big atmospheres, city breaks, and fixtures worth travelling for.
              </Text>

              {featuredLive ? (
                <Pressable
                  onPress={() => goMatchFromRow(featuredLive.item.fixture)}
                  style={({ pressed }) => [styles.heroFeaturePress, pressed && styles.pressed]}
                >
                  <View style={styles.heroFeatureImageWrap}>
                    <Image
                      source={{ uri: getDiscoverCardImage() }}
                      style={styles.heroFeatureImage}
                      resizeMode="cover"
                    />
                    <View style={styles.heroFeatureOverlay} />
                    <View style={styles.heroFeatureBadge}>
                      <Text style={styles.heroFeatureBadgeText}>Top pick for your setup</Text>
                    </View>
                  </View>

                  <View style={styles.heroFeatureBody}>
                    <View style={styles.heroFeatureTopRow}>
                      <View style={styles.heroFeatureIconWrap}>
                        <Ionicons
                          name={DISCOVER_CATEGORY_META[seededCategory].icon}
                          size={18}
                          color={theme.colors.text}
                        />
                      </View>
                      <Text style={styles.heroFeatureCtaInline}>Open route</Text>
                    </View>

                    <Text style={styles.heroFeatureTitle} numberOfLines={2}>
                      {fixtureTitle(featuredLive.item.fixture)}
                    </Text>

                    <Text style={styles.heroFeatureMeta} numberOfLines={2}>
                      {fixtureMeta(featuredLive.item.fixture)}
                    </Text>

                    <Text style={styles.heroFeatureWhy} numberOfLines={2}>
                      {whyThisFits(
                        featuredLive.item.fixture,
                        seededCategory,
                        discoverVibes,
                        discoverTripLength
                      )}
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              <Pressable onPress={toggleSetup} style={styles.heroActionRow}>
                <View style={styles.heroActionPill}>
                  <Ionicons
                    name={setupExpanded ? "chevron-up-outline" : "options-outline"}
                    size={16}
                    color={theme.colors.text}
                  />
                  <Text style={styles.heroActionText}>
                    {setupExpanded ? "Hide trip setup" : "Edit trip setup"}
                  </Text>
                </View>

                <View style={styles.heroMiniSummary}>
                  <Text style={styles.heroMiniSummaryText}>{compactSummary}</Text>
                </View>
              </Pressable>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <SectionHeader
              title="Explore now"
              subtitle="Fast entry points so the screen feels alive straight away."
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sparkRow}
            >
              {QUICK_SPARKS.map((spark) => (
                <Pressable
                  key={spark.id}
                  onPress={() => applyQuickSpark(spark)}
                  style={({ pressed }) => [styles.sparkPress, pressed && styles.pressed]}
                >
                  <GlassCard strength="default" style={styles.sparkCard} noPadding>
                    <View style={styles.sparkInner}>
                      <View style={styles.sparkIconWrap}>
                        <Ionicons name={spark.icon} size={18} color={theme.colors.text} />
                      </View>
                      <Text style={styles.sparkTitle}>{spark.title}</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Multi-match trips"
              subtitle="The addictive bit: stack more than one match into the same trip."
            />

            {loadingLive ? (
              <GlassCard strength="default" style={styles.loadingCard}>
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Building multi-match routes…</Text>
                </View>
              </GlassCard>
            ) : null}

            {!loadingLive && !liveError && multiMatchTrips.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.multiRow}
              >
                {multiMatchTrips.map((trip, index) => (
                  <Pressable
                    key={trip.id}
                    onPress={() => goMultiMatchTrip(trip)}
                    style={({ pressed }) => [styles.multiPress, pressed && styles.pressed]}
                  >
                    <GlassCard strength="default" style={styles.multiCard} noPadding>
                      <View style={styles.multiImageWrap}>
                        <Image
                          source={{ uri: getDiscoverCardImage() }}
                          style={styles.multiImage}
                          resizeMode="cover"
                        />
                        <View style={styles.multiOverlay} />

                        <View style={styles.multiTopBar}>
                          <View style={styles.multiRankPill}>
                            <Text style={styles.multiRankText}>
                              {index === 0 ? "Best combo" : `${trip.matchCount} matches`}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.multiBody}>
                        <Text style={styles.multiTitle} numberOfLines={2}>
                          {trip.title}
                        </Text>

                        <Text style={styles.multiSubline} numberOfLines={2}>
                          {trip.subtitle}
                        </Text>

                        <Text style={styles.multiWhy} numberOfLines={2}>
                          {comboWhy(trip)}
                        </Text>

                        <View style={styles.multiLabelRow}>
                          {trip.labels.slice(0, 3).map((label) => (
                            <View key={`${trip.id}-${label}`} style={styles.multiLabelPill}>
                              <Text style={styles.multiLabelText}>{label}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.multiMatchList}>
                          {trip.rows.slice(0, 3).map((row, rowIndex) => (
                            <Text
                              key={`${trip.id}-${String(row?.fixture?.id ?? rowIndex)}`}
                              style={styles.multiMatchLine}
                              numberOfLines={1}
                            >
                              {`${rowIndex + 1}. ${fixtureTitle(row)}`}
                            </Text>
                          ))}
                        </View>

                        <View style={styles.multiFooter}>
                          <Text style={styles.multiFooterText}>
                            {`${trip.matchCount} matches in ${trip.daysSpan} days`}
                          </Text>
                          <Text style={styles.multiFooterArrow}>›</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {!loadingLive && !liveError && multiMatchTrips.length === 0 ? (
              <GlassCard strength="default" style={styles.noComboCard}>
                <Text style={styles.noComboTitle}>No strong combos yet</Text>
                <Text style={styles.noComboText}>
                  Widen the date window or ease the vibe filters and the app will surface stacked trips.
                </Text>
              </GlassCard>
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Trip setup</Text>
                <Text style={styles.sectionSub}>
                  Edit your setup here, then let discovery rank the right routes.
                </Text>
              </View>

              <View style={styles.setupHeaderActions}>
                <Pressable onPress={resetFilters} style={styles.resetPill}>
                  <Text style={styles.resetPillText}>Reset</Text>
                </Pressable>

                <Pressable onPress={toggleSetup} style={styles.collapsePill}>
                  <Ionicons
                    name={setupExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {!setupExpanded ? (
              <Pressable onPress={toggleSetup} style={({ pressed }) => [pressed && styles.pressed]}>
                <GlassCard strength="default" style={styles.setupCollapsedCard} noPadding>
                  <View style={styles.setupCollapsedInner}>
                    <View style={styles.setupCollapsedTop}>
                      <View style={styles.setupCollapsedBadge}>
                        <Text style={styles.setupCollapsedBadgeText}>{browseModeLabel}</Text>
                      </View>
                      <Text style={styles.setupCollapsedLink}>Open</Text>
                    </View>

                    <Text style={styles.setupCollapsedSummary}>{filterSummary}</Text>

                    <View style={styles.setupCollapsedChips}>
                      <View style={styles.setupTinyChip}>
                        <Text style={styles.setupTinyChipText}>
                          {shortLabelForKey(discoverWindowKey)}
                        </Text>
                      </View>
                      <View style={styles.setupTinyChip}>
                        <Text style={styles.setupTinyChipText}>
                          {shortLabelForTripLength(discoverTripLength)}
                        </Text>
                      </View>
                      {discoverVibes.slice(0, 2).map((vibe) => (
                        <View key={vibe} style={styles.setupTinyChip}>
                          <Text style={styles.setupTinyChipText}>
                            {shortLabelForVibe(vibe)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ) : (
              <GlassCard strength="default" style={styles.panel} noPadding>
                <View style={styles.panelInner}>
                  <View style={styles.inputBlock}>
                    <Text style={styles.label}>Flying from</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons
                        name="airplane-outline"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                      <TextInput
                        value={discoverOrigin}
                        onChangeText={setDiscoverOrigin}
                        placeholder="Optional: London, LGW, MAN"
                        placeholderTextColor={theme.colors.textTertiary}
                        style={styles.input}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <Text style={styles.label}>Date window</Text>
                    <View style={styles.chipsRow}>
                      {(["wknd", "d7", "d14", "d30", "d60", "d90"] as DiscoverWindowKey[]).map(
                        (key) => (
                          <FilterChip
                            key={key}
                            label={shortLabelForKey(key)}
                            active={discoverWindowKey === key}
                            onPress={() => setDiscoverWindowKey(key)}
                          />
                        )
                      )}
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <Text style={styles.label}>Trip length</Text>
                    <View style={styles.chipsRow}>
                      {(["day", "1", "2", "3"] as DiscoverTripLength[]).map((length) => (
                        <FilterChip
                          key={length}
                          label={labelForTripLength(length)}
                          active={discoverTripLength === length}
                          onPress={() => setDiscoverTripLength(length)}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <View style={styles.inlineLabelRow}>
                      <Text style={styles.label}>Vibe</Text>
                      <Text style={styles.labelHint}>Pick up to 3</Text>
                    </View>

                    <View style={styles.chipsRow}>
                      {(["easy", "big", "nightlife", "culture", "warm"] as DiscoverVibe[]).map(
                        (vibe) => (
                          <FilterChip
                            key={vibe}
                            label={labelForVibe(vibe)}
                            active={discoverVibes.includes(vibe)}
                            onPress={() => toggleVibe(vibe)}
                          />
                        )
                      )}
                    </View>
                  </View>

                  <View style={styles.setupSummaryRow}>
                    <View style={styles.setupSummaryPill}>
                      <Text style={styles.setupSummaryPillText}>{browseModeLabel}</Text>
                    </View>
                    <Text style={styles.setupSummaryText}>{filterSummary}</Text>
                  </View>
                </View>
              </GlassCard>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Live now"
              subtitle="Strong current options based on your setup, not generic filler."
            />

            {loadingLive ? (
              <GlassCard strength="default" style={styles.loadingCard}>
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Loading live route previews…</Text>
                </View>
              </GlassCard>
            ) : null}

            {!loadingLive && liveError ? (
              <EmptyState title="Live previews unavailable" message={liveError} />
            ) : null}

            {!loadingLive && !liveError && previewLive.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.liveRow}
              >
                {previewLive.map((entry, index) => {
                  const row = entry.item.fixture;

                  return (
                    <Pressable
                      key={String(row?.fixture?.id ?? index)}
                      onPress={() => goMatchFromRow(row)}
                      style={({ pressed }) => [styles.livePress, pressed && styles.pressed]}
                    >
                      <GlassCard strength="default" style={styles.liveCard} noPadding>
                        <View style={styles.liveImageWrap}>
                          <Image
                            source={{ uri: getDiscoverCardImage() }}
                            style={styles.liveImage}
                            resizeMode="cover"
                          />
                          <View style={styles.liveImageOverlay} />
                          <View style={styles.liveTopBar}>
                            <View style={styles.liveRankPill}>
                              <Text style={styles.liveRankText}>{rankLabel(index)}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.liveBody}>
                          <Text style={styles.liveTitle} numberOfLines={2}>
                            {fixtureTitle(row)}
                          </Text>
                          <Text style={styles.liveMeta} numberOfLines={2}>
                            {fixtureMeta(row)}
                          </Text>
                          <Text style={styles.liveWhy} numberOfLines={2}>
                            {whyThisFits(row, seededCategory, discoverVibes, discoverTripLength)}
                          </Text>
                        </View>
                      </GlassCard>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Trending football trips"
              subtitle="Big fixtures and city pulls people would actually travel for."
            />

            {loadingLive ? (
              <GlassCard strength="default" style={styles.loadingCard}>
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Finding trending trips…</Text>
                </View>
              </GlassCard>
            ) : null}

            {!loadingLive && !liveError && trendingTrips.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingRow}
              >
                {trendingTrips.map((entry, index) => {
                  const row = entry.item.fixture;

                  return (
                    <Pressable
                      key={`trend-${String(row?.fixture?.id ?? index)}`}
                      onPress={() => goMatchFromRow(row)}
                      style={({ pressed }) => [styles.trendingPress, pressed && styles.pressed]}
                    >
                      <GlassCard strength="default" style={styles.trendingCard} noPadding>
                        <View style={styles.trendingImageWrap}>
                          <Image
                            source={{ uri: getDiscoverCardImage() }}
                            style={styles.trendingImage}
                            resizeMode="cover"
                          />
                          <View style={styles.trendingOverlay} />
                          <View style={styles.trendingTopBar}>
                            <View style={styles.trendingHotPill}>
                              <Text style={styles.trendingHotText}>🔥 Trending</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.trendingBody}>
                          <Text style={styles.trendingTitle} numberOfLines={2}>
                            {fixtureTitle(row)}
                          </Text>
                          <Text style={styles.trendingLabel} numberOfLines={1}>
                            {trendingLabelForFixture(row)}
                          </Text>
                          <Text style={styles.trendingMeta} numberOfLines={2}>
                            {fixtureMeta(row)}
                          </Text>
                        </View>
                      </GlassCard>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Start with a mood"
              subtitle="Fast entry points for the kind of trip that already sounds good."
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inspirationRow}
            >
              {INSPIRATION_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => applyPreset(preset)}
                  style={({ pressed }) => [styles.inspirationPress, pressed && styles.pressed]}
                >
                  <GlassCard strength="default" style={styles.inspirationCard} noPadding>
                    <View style={styles.inspirationInner}>
                      <View style={styles.inspirationIconWrap}>
                        <Ionicons name={preset.icon} size={18} color={theme.colors.text} />
                      </View>

                      <View style={styles.inspirationTextWrap}>
                        <Text style={styles.inspirationTitle}>{preset.title}</Text>
                        <Text style={styles.inspirationSub}>{preset.subtitle}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Best fit right now"
              subtitle={`Based on your current setup, ${browseModeLabel} is the best place to start.`}
            />

            {!featuredLive && leadCategory ? renderCategoryCard(leadCategory) : null}

            <View style={styles.primaryGrid}>
              {remainingPrimaryCategories.map((category) => renderCategoryCard(category))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="More ways to browse"
              subtitle="Narrower angles when you want city pull, atmosphere, or more specific trip types."
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryRow}
            >
              {prioritisedSecondaryCategories.map((category) =>
                renderCategoryCard(category, true)
              )}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Concierge pick"
              subtitle="Give the app your setup and let it surface one of the stronger live options."
            />

            <Pressable
              onPress={goRandomTrip}
              disabled={loadingRandom}
              style={({ pressed }) => [
                styles.randomPress,
                (pressed || loadingRandom) && styles.pressed,
              ]}
            >
              <GlassCard strength="default" style={styles.randomCard} noPadding>
                <View style={styles.randomInner}>
                  <View style={styles.randomTop}>
                    <View style={styles.randomTopText}>
                      <Text style={styles.randomTitle}>Let the app choose</Text>
                      <Text style={styles.randomSub}>
                        We rank a live pool against your setup before making the pick.
                      </Text>
                    </View>

                    <View style={styles.randomIconWrap}>
                      {loadingRandom ? (
                        <ActivityIndicator />
                      ) : (
                        <Ionicons
                          name="sparkles-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                      )}
                    </View>
                  </View>

                  <View style={styles.randomSummaryBox}>
                    <Text style={styles.randomSummaryLabel}>Using</Text>
                    <Text style={styles.randomHint}>{filterSummary}</Text>
                  </View>

                  <View style={styles.randomButton}>
                    <Text style={styles.randomButtonText}>
                      {loadingRandom ? "Finding a strong option..." : "Pick a trip for me"}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: 18,
  },

  hero: {
    marginTop: theme.spacing.lg,
    borderRadius: 26,
  },

  heroInner: {
    padding: 16,
    gap: 12,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.2,
  },

  title: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
  },

  heroFeaturePress: {
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 2,
  },

  heroFeatureImageWrap: {
    height: 178,
    position: "relative",
  },

  heroFeatureImage: {
    width: "100%",
    height: "100%",
  },

  heroFeatureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.42)",
  },

  heroFeatureBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(6,10,8,0.64)",
  },

  heroFeatureBadgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  heroFeatureBody: {
    padding: 14,
    gap: 7,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.05)",
  },

  heroFeatureTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  heroFeatureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  heroFeatureCtaInline: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  heroFeatureTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: theme.fontWeight.black,
  },

  heroFeatureMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  heroFeatureWhy: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  heroActionRow: {
    gap: 8,
    marginTop: 2,
  },

  heroActionPill: {
    alignSelf: "flex-start",
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  heroActionText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  heroMiniSummary: {
    alignSelf: "flex-start",
  },

  heroMiniSummaryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  section: {
    gap: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionHeaderText: {
    flex: 1,
    gap: 3,
  },

  sectionHeaderStack: {
    gap: 4,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  setupHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  collapsePill: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },

  loadingCard: {
    borderRadius: 20,
    padding: 6,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  panel: {
    borderRadius: 24,
  },

  panelInner: {
    padding: 14,
    gap: 14,
  },

  setupCollapsedCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.12)",
  },

  setupCollapsedInner: {
    padding: 14,
    gap: 10,
  },

  setupCollapsedTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  setupCollapsedBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  setupCollapsedBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedSummary: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  setupTinyChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  setupTinyChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  inputBlock: {
    gap: 7,
  },

  filterBlock: {
    gap: 8,
  },

  label: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  inlineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  labelHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingVertical: 8,
    paddingHorizontal: 11,
  },

  chipActive: {
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  chipTextActive: {
    color: theme.colors.text,
  },

  setupSummaryRow: {
    gap: 8,
    marginTop: 2,
  },

  setupSummaryPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  setupSummaryPillText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  setupSummaryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  sparkRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  sparkPress: {
    borderRadius: 999,
    overflow: "hidden",
  },

  sparkCard: {
    borderRadius: 999,
  },

  sparkInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  sparkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  sparkTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  multiRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  multiPress: {
    width: 296,
    borderRadius: 22,
    overflow: "hidden",
  },

  multiCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.16)",
  },

  multiImageWrap: {
    height: 132,
    position: "relative",
  },

  multiImage: {
    width: "100%",
    height: "100%",
  },

  multiOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.38)",
  },

  multiTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  multiRankPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(6,10,8,0.64)",
  },

  multiRankText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  multiBody: {
    padding: 14,
    gap: 8,
    minHeight: 190,
  },

  multiTitle: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: theme.fontWeight.black,
  },

  multiSubline: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  multiWhy: {
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
  },

  multiLabelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  multiLabelPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  multiLabelText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  multiMatchList: {
    gap: 4,
    marginTop: 2,
  },

  multiMatchLine: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  multiFooter: {
    marginTop: "auto",
    paddingTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  multiFooterText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  multiFooterArrow: {
    color: theme.colors.textTertiary,
    fontSize: 22,
    marginTop: -2,
  },

  noComboCard: {
    borderRadius: 20,
    padding: 16,
  },

  noComboTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  noComboText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  liveRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  livePress: {
    width: 250,
    borderRadius: 20,
    overflow: "hidden",
  },

  liveCard: {
    borderRadius: 20,
  },

  liveImageWrap: {
    height: 112,
    position: "relative",
  },

  liveImage: {
    width: "100%",
    height: "100%",
  },

  liveImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.40)",
  },

  liveTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  liveRankPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(6,10,8,0.60)",
  },

  liveRankText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  liveBody: {
    padding: 14,
    gap: 6,
    minHeight: 126,
  },

  liveTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },

  liveMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  liveWhy: {
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
    marginTop: 2,
  },

  trendingRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  trendingPress: {
    width: 278,
    borderRadius: 20,
    overflow: "hidden",
  },

  trendingCard: {
    borderRadius: 20,
  },

  trendingImageWrap: {
    height: 126,
    position: "relative",
  },

  trendingImage: {
    width: "100%",
    height: "100%",
  },

  trendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.34)",
  },

  trendingTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  trendingHotPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(8,10,10,0.70)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  trendingHotText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  trendingBody: {
    padding: 14,
    gap: 6,
    minHeight: 118,
  },

  trendingTitle: {
    color: theme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: theme.fontWeight.black,
  },

  trendingLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  trendingMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  inspirationRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  inspirationPress: {
    width: 220,
    borderRadius: 18,
    overflow: "hidden",
  },

  inspirationCard: {
    borderRadius: 18,
    minHeight: 116,
  },

  inspirationInner: {
    padding: 14,
    minHeight: 116,
    gap: 12,
    justifyContent: "space-between",
  },

  inspirationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  inspirationTextWrap: {
    gap: 6,
  },

  inspirationTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  inspirationSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  resetPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
  },

  resetPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  primaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },

  categoryPress: {
    width: "48.5%",
    borderRadius: 18,
    overflow: "hidden",
  },

  categoryPressCompact: {
    width: 214,
    borderRadius: 18,
    overflow: "hidden",
  },

  categoryCard: {
    borderRadius: 18,
    minHeight: 222,
  },

  categoryCardCompact: {
    borderRadius: 18,
    minHeight: 192,
  },

  categoryCardPrimary: {
    borderColor: "rgba(87,162,56,0.16)",
  },

  categoryImageWrap: {
    height: 96,
    position: "relative",
  },

  categoryImage: {
    width: "100%",
    height: "100%",
  },

  categoryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.36)",
  },

  categoryEyebrowPill: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,10,0.58)",
  },

  categoryEyebrowText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  categoryInner: {
    padding: 14,
    minHeight: 126,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryInnerCompact: {
    padding: 14,
    minHeight: 96,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  categoryIconWrapPrimary: {
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  categoryTextWrap: {
    gap: 6,
  },

  categoryTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  categorySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  secondaryRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  randomPress: {
    borderRadius: 22,
    overflow: "hidden",
  },

  randomCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.16)",
  },

  randomInner: {
    padding: 16,
    gap: 14,
  },

  randomTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  randomTopText: {
    flex: 1,
    gap: 4,
  },

  randomTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  randomSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  randomIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  randomSummaryBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },

  randomSummaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  randomHint: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  randomButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  randomButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
