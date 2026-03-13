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
import { getCityImageUrl } from "@/src/data/cityImages";

type ShortcutWindow = { from: string; to: string };
type DiscoverWindowKey = "wknd" | "d7" | "d14" | "d30";

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

const INSPIRATION_PRESETS: InspirationPreset[] = [
  {
    id: "best-now",
    title: "Best trips right now",
    subtitle: "Strong live options for a football trip soon",
    icon: "flash-outline",
    category: "perfectTrips",
    windowKey: "d14",
  },
  {
    id: "easy",
    title: "Easy city breaks",
    subtitle: "Lower-friction trips with cleaner planning potential",
    icon: "navigate-outline",
    vibe: "easy",
    category: "easyTickets",
  },
  {
    id: "big",
    title: "Big atmospheres",
    subtitle: "Louder fixtures worth travelling for",
    icon: "megaphone-outline",
    vibe: "big",
    category: "bigMatches",
  },
  {
    id: "night",
    title: "Night game energy",
    subtitle: "Late kick-offs, lights, and stronger occasion feel",
    icon: "moon-outline",
    vibe: "nightlife",
    category: "nightMatches",
  },
  {
    id: "culture",
    title: "City + match trips",
    subtitle: "Trips where the place matters as much as the game",
    icon: "business-outline",
    vibe: "culture",
    category: "matchdayCulture",
  },
  {
    id: "warm",
    title: "Warmer escapes",
    subtitle: "Football trips with a softer climate pull",
    icon: "sunny-outline",
    vibe: "warm",
    category: "iconicCities",
  },
];

const QUICK_SPARKS: QuickSpark[] = [
  {
    id: "derby-nights",
    title: "Big derby nights",
    icon: "flame-outline",
    category: "bigMatches",
    vibe: "big",
    windowKey: "d30",
  },
  {
    id: "midweek-europe",
    title: "Midweek football trips",
    icon: "calendar-outline",
    category: "nightMatches",
    vibe: "nightlife",
    windowKey: "d14",
  },
  {
    id: "easy-two-night",
    title: "Easy 2-night trips",
    icon: "navigate-outline",
    category: "easyTickets",
    vibe: "easy",
    tripLength: "2",
    windowKey: "d14",
  },
  {
    id: "scenic-cities",
    title: "Scenic football cities",
    icon: "earth-outline",
    category: "iconicCities",
    vibe: "culture",
    tripLength: "2",
    windowKey: "d30",
  },
  {
    id: "best-value",
    title: "Best value trips",
    icon: "cash-outline",
    category: "easyTickets",
    vibe: "easy",
    windowKey: "d30",
  },
  {
    id: "loud-atmospheres",
    title: "Loudest atmospheres",
    icon: "volume-high-outline",
    category: "bigMatches",
    vibe: "big",
    windowKey: "d14",
  },
];

const DISCOVER_NEUTRAL_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1600&h=1000&fm=jpg&q=82";

function labelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "This Weekend";
  if (key === "d7") return "Next 7 Days";
  if (key === "d14") return "Next 14 Days";
  return "Next 30 Days";
}

function labelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day Trip";
  if (v === "1") return "1 Night";
  if (v === "2") return "2 Nights";
  return "3 Nights";
}

function labelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy Travel";
  if (v === "big") return "Big Match";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  return "Warm-ish";
}

function windowForKey(key: DiscoverWindowKey): ShortcutWindow {
  if (key === "wknd") return nextWeekendWindowIso();
  if (key === "d7") return windowFromTomorrowIso(7);
  if (key === "d14") return windowFromTomorrowIso(14);
  return windowFromTomorrowIso(30);
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

function fixtureCity(row: FixtureListRow) {
  return String(row?.fixture?.venue?.city ?? "").trim() || "";
}

function getDiscoverCardImage(row: FixtureListRow) {
  const city = fixtureCity(row);
  if (city) {
    const cityImage = getCityImageUrl(city);
    if (cityImage) return cityImage;
  }
  return DISCOVER_NEUTRAL_FALLBACK_IMAGE;
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
  const city = fixtureCity(row);

  const labels: Record<string, string> = {
    "ajax|feyenoord": "De Klassieker",
    "celtic|rangers": "Old Firm",
    "fenerbahce|galatasaray": "Intercontinental Derby",
    "inter|milan": "Derby della Madonnina",
    "lazio|roma": "Rome Derby",
    "manchester-city|manchester-united": "Manchester Derby",
    "marseille|paris-saint-germain": "Le Classique",
    "olympiacos|panathinaikos": "Derby of the Eternal Enemies",
    "real-madrid|atletico-madrid": "Madrid Derby",
    "real-betis|sevilla": "Seville Derby",
    "tottenham|arsenal": "North London Derby",
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
  if (category === "nightMatches") {
    if (isLateKickoff(row)) return "Later kick-off gives it bigger lights-on energy";
    return "Good fit for a later, occasion-led football trip";
  }
  if (category === "matchdayCulture") return "Better city + match balance for a fuller trip";
  if (category === "iconicCities") return "The city itself adds real pull beyond the fixture";
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
    "celtic|rangers",
    "fenerbahce|galatasaray",
    "inter|milan",
    "lazio|roma",
    "manchester-city|manchester-united",
    "marseille|paris-saint-germain",
    "olympiacos|panathinaikos",
    "real-madrid|atletico-madrid",
    "real-betis|sevilla",
    "tottenham|arsenal",
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

function FilterChip({
  label,
  active,
  onPress,
  compact = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        active && styles.chipActive,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          compact && styles.chipTextCompact,
          active && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("wknd");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverOrigin, setDiscoverOrigin] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);

  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveRows, setLiveRows] = useState<FixtureListRow[]>([]);

  const toggleVibe = useCallback((vibe: DiscoverVibe) => {
    setDiscoverVibes((prev) => {
      const has = prev.includes(vibe);
      const next = has ? prev.filter((value) => value !== vibe) : [...prev, vibe];
      return clampVibes(next);
    });
  }, []);

  const resetFilters = useCallback(() => {
    setDiscoverWindowKey("wknd");
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

    return parts.join("  •  ");
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
    currentWindow,
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

  const renderLeadCategoryCard = useCallback(
    (category: DiscoverCategory) => {
      const meta = DISCOVER_CATEGORY_META[category];

      return (
        <Pressable
          key={category}
          onPress={() => goFixturesCategory(category)}
          style={({ pressed }) => [styles.leadPress, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.leadCard} noPadding>
            <View style={styles.leadInner}>
              <View style={styles.leadTopRow}>
                <View style={styles.leadIconWrap}>
                  <Ionicons name={meta.icon} size={20} color={theme.colors.text} />
                </View>

                <View style={styles.bestFitPill}>
                  <Text style={styles.bestFitPillText}>Best fit</Text>
                </View>
              </View>

              <View style={styles.leadTextWrap}>
                <Text style={styles.leadTitle}>{meta.title}</Text>
                <Text style={styles.leadSubtitle}>{meta.subtitle}</Text>
              </View>

              <View style={styles.leadBottomRow}>
                <Text style={styles.leadHint}>See best options</Text>
                <Text style={styles.leadArrow}>›</Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      );
    },
    [goFixturesCategory]
  );

  const renderPrimaryCategoryCard = useCallback(
    (category: DiscoverCategory) => {
      const meta = DISCOVER_CATEGORY_META[category];
      const primary = meta.emphasis === "primary";

      return (
        <Pressable
          key={category}
          onPress={() => goFixturesCategory(category)}
          style={({ pressed }) => [styles.categoryPress, pressed && styles.pressed]}
        >
          <GlassCard
            strength="default"
            style={[styles.categoryCard, primary && styles.categoryCardPrimary]}
            noPadding
          >
            <View style={styles.categoryInner}>
              <View style={styles.categoryTopRow}>
                <View
                  style={[
                    styles.categoryIconWrap,
                    primary && styles.categoryIconWrapPrimary,
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

  const renderSecondaryCategoryCard = useCallback(
    (category: DiscoverCategory) => {
      const meta = DISCOVER_CATEGORY_META[category];

      return (
        <Pressable
          key={category}
          onPress={() => goFixturesCategory(category)}
          style={({ pressed }) => [styles.categoryPressCompact, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.categoryCardCompact} noPadding>
            <View style={styles.categoryInnerCompact}>
              <View style={styles.secondaryIconWrap}>
                <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
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
      topShadeOpacity={0.30}
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

              <View style={styles.heroSummaryBox}>
                <Text style={styles.heroSummaryLabel}>Current setup</Text>
                <Text style={styles.heroSummaryText}>{filterSummary}</Text>
              </View>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Live now</Text>
              <Text style={styles.sectionSub}>
                Strong current options based on your setup, not generic filler.
              </Text>
            </View>

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
                  const image = getDiscoverCardImage(row);

                  return (
                    <Pressable
                      key={String(row?.fixture?.id ?? index)}
                      onPress={() => goMatchFromRow(row)}
                      style={({ pressed }) => [styles.livePress, pressed && styles.pressed]}
                    >
                      <GlassCard strength="default" style={styles.liveCard} noPadding>
                        <View style={styles.liveImageWrap}>
                          <Image source={{ uri: image }} style={styles.liveImage} resizeMode="cover" />
                          <View style={styles.liveImageOverlay} />
                          <View style={styles.liveRankPill}>
                            <Text style={styles.liveRankText}>{rankLabel(index)}</Text>
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
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Trending football trips</Text>
              <Text style={styles.sectionSub}>
                Big fixtures and city pulls people would actually travel for.
              </Text>
            </View>

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
                  const image = getDiscoverCardImage(row);

                  return (
                    <Pressable
                      key={`trend-${String(row?.fixture?.id ?? index)}`}
                      onPress={() => goMatchFromRow(row)}
                      style={({ pressed }) => [styles.trendingPress, pressed && styles.pressed]}
                    >
                      <GlassCard strength="default" style={styles.trendingCard} noPadding>
                        <View style={styles.trendingImageWrap}>
                          <Image
                            source={{ uri: image }}
                            style={styles.trendingImage}
                            resizeMode="cover"
                          />
                          <View style={styles.trendingOverlay} />
                          <View style={styles.trendingHotPill}>
                            <Text style={styles.trendingHotText}>🔥 Trending</Text>
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
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Quick trip sparks</Text>
              <Text style={styles.sectionSub}>
                One-tap routes into the strongest discovery angles.
              </Text>
            </View>

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
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Start with a mood</Text>
              <Text style={styles.sectionSub}>
                Fast entry points for the kind of trip that already sounds good.
              </Text>
            </View>

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
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Trip setup</Text>
                <Text style={styles.sectionSub}>
                  Tighten the search before you browse.
                </Text>
              </View>

              <Pressable onPress={resetFilters} style={styles.resetPill}>
                <Text style={styles.resetPillText}>Reset</Text>
              </Pressable>
            </View>

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
                    {(["wknd", "d7", "d14", "d30"] as DiscoverWindowKey[]).map((key) => (
                      <FilterChip
                        key={key}
                        label={labelForKey(key)}
                        active={discoverWindowKey === key}
                        onPress={() => setDiscoverWindowKey(key)}
                      />
                    ))}
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
              </View>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Best fit right now</Text>
              <Text style={styles.sectionSub}>
                Based on your current setup,{" "}
                <Text style={styles.sectionSubStrong}>{browseModeLabel}</Text> is the best
                place to start.
              </Text>
            </View>

            {featuredLive ? (
              <Pressable
                onPress={() => goMatchFromRow(featuredLive.item.fixture)}
                style={({ pressed }) => [styles.featuredPress, pressed && styles.pressed]}
              >
                <GlassCard strength="default" style={styles.featuredLiveCard} noPadding>
                  <View style={styles.featuredLiveImageWrap}>
                    <Image
                      source={{ uri: getDiscoverCardImage(featuredLive.item.fixture) }}
                      style={styles.featuredLiveImage}
                      resizeMode="cover"
                    />
                    <View style={styles.featuredLiveOverlay} />
                  </View>

                  <View style={styles.featuredLiveBody}>
                    <View style={styles.featuredLiveTopRow}>
                      <View style={styles.featuredLiveIconWrap}>
                        <Ionicons
                          name={DISCOVER_CATEGORY_META[seededCategory].icon}
                          size={18}
                          color={theme.colors.text}
                        />
                      </View>
                      <View style={styles.bestFitPill}>
                        <Text style={styles.bestFitPillText}>Top live option</Text>
                      </View>
                    </View>

                    <Text style={styles.featuredLiveTitle}>
                      {fixtureTitle(featuredLive.item.fixture)}
                    </Text>

                    <Text style={styles.featuredLiveMeta}>
                      {fixtureMeta(featuredLive.item.fixture)}
                    </Text>

                    <Text style={styles.featuredLiveWhy}>
                      {whyThisFits(
                        featuredLive.item.fixture,
                        seededCategory,
                        discoverVibes,
                        discoverTripLength
                      )}
                    </Text>

                    <View style={styles.featuredLiveBottomRow}>
                      <Text style={styles.featuredLiveCta}>Open this route</Text>
                      <Text style={styles.leadArrow}>›</Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ) : leadCategory ? (
              renderLeadCategoryCard(leadCategory)
            ) : null}

            <View style={styles.primaryGrid}>
              {remainingPrimaryCategories.map((category) =>
                renderPrimaryCategoryCard(category)
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>More ways to browse</Text>
              <Text style={styles.sectionSub}>
                Narrower angles when you want city pull, atmosphere, or more specific trip types.
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryRow}
            >
              {prioritisedSecondaryCategories.map((category) =>
                renderSecondaryCategoryCard(category)
              )}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Concierge pick</Text>
              <Text style={styles.sectionSub}>
                Give the app your setup and let it surface one of the stronger live options.
              </Text>
            </View>

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

          <GlassCard strength="default" style={styles.modeCard} noPadding>
            <View style={styles.modeInner}>
              <View style={styles.modeBlock}>
                <Text style={styles.modeTitle}>Use Discover</Text>
                <Text style={styles.modeText}>
                  When you know the type of trip you want, but not the exact fixture yet.
                </Text>
              </View>

              <View style={styles.modeDivider} />

              <View style={styles.modeBlock}>
                <Text style={styles.modeTitle}>Use Fixtures</Text>
                <Text style={styles.modeText}>
                  When you already want a direct match browse without discovery leading.
                </Text>
              </View>
            </View>
          </GlassCard>
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
    gap: 10,
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

  heroSummaryBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },

  heroSummaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  heroSummaryText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
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

  sectionSubStrong: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
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

  liveRankPill: {
    position: "absolute",
    top: 10,
    left: 10,
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

  trendingHotPill: {
    position: "absolute",
    top: 10,
    left: 10,
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

  panel: {
    borderRadius: 24,
  },

  panelInner: {
    padding: 14,
    gap: 14,
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

  chipCompact: {
    paddingVertical: 7,
    paddingHorizontal: 10,
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

  chipTextCompact: {
    fontSize: 11,
  },

  chipTextActive: {
    color: theme.colors.text,
  },

  featuredPress: {
    borderRadius: 22,
    overflow: "hidden",
  },

  featuredLiveCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.22)",
  },

  featuredLiveImageWrap: {
    height: 152,
    position: "relative",
  },

  featuredLiveImage: {
    width: "100%",
    height: "100%",
  },

  featuredLiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.42)",
  },

  featuredLiveBody: {
    padding: 16,
    gap: 8,
  },

  featuredLiveTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  featuredLiveIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  featuredLiveTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: theme.fontWeight.black,
  },

  featuredLiveMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  featuredLiveWhy: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  featuredLiveBottomRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  featuredLiveCta: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  leadPress: {
    borderRadius: 22,
    overflow: "hidden",
  },

  leadCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.22)",
  },

  leadInner: {
    padding: 16,
    gap: 14,
    minHeight: 156,
  },

  leadTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leadIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  bestFitPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  bestFitPillText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  leadTextWrap: {
    gap: 6,
  },

  leadTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
  },

  leadSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  leadBottomRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leadHint: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  leadArrow: {
    color: theme.colors.textTertiary,
    fontSize: 22,
    marginTop: -2,
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

  categoryCard: {
    borderRadius: 18,
    minHeight: 128,
  },

  categoryCardPrimary: {
    borderColor: "rgba(87,162,56,0.16)",
  },

  categoryInner: {
    padding: 14,
    minHeight: 128,
    gap: 14,
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

  categoryPressCompact: {
    width: 192,
    borderRadius: 18,
    overflow: "hidden",
  },

  categoryCardCompact: {
    borderRadius: 18,
    minHeight: 116,
  },

  categoryInnerCompact: {
    padding: 14,
    minHeight: 116,
    gap: 12,
    justifyContent: "space-between",
  },

  secondaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
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

  modeCard: {
    borderRadius: 22,
    marginBottom: 4,
  },

  modeInner: {
    padding: 14,
    gap: 12,
  },

  modeBlock: {
    gap: 6,
  },

  modeDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  modeTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  modeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
