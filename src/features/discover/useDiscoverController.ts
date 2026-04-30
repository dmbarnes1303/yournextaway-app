// src/features/discover/useDiscoverController.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutAnimation } from "react-native";
import { useRouter } from "expo-router";

import { type FixtureListRow } from "@/src/services/apiFootball";
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
import {
  buildMultiMatchTrips,
  categorySeedFromFilters,
  clampVibes,
  fetchDiscoverPool,
  fixtureMeta,
  fixtureTitle,
  labelForKey,
  labelForTripLength,
  labelForVibe,
  pickRandom,
  prioritiseCategories,
  rankLabel,
  shortLabelForKey,
  shortLabelForTripLength,
  shortLabelForVibe,
  trendingLabelForFixture,
  trendingScore,
  whyThisFits,
  windowForKey,
} from "@/src/features/discover/discoverUtils";
import type {
  DiscoverWindowKey,
  InspirationPreset,
  MultiMatchTrip,
  QuickSpark,
  RankedDiscoverPick,
} from "@/src/features/discover/types";

export type UseDiscoverControllerReturn = {
  discoverWindowKey: DiscoverWindowKey;
  setDiscoverWindowKey: (value: DiscoverWindowKey) => void;
  discoverTripLength: DiscoverTripLength;
  setDiscoverTripLength: (value: DiscoverTripLength) => void;
  discoverVibes: DiscoverVibe[];
  discoverOrigin: string;
  setDiscoverOrigin: (value: string) => void;
  setupExpanded: boolean;
  loadingRandom: boolean;
  loadingLive: boolean;
  liveError: string | null;

  compactSummary: string;
  filterSummary: string;
  browseModeLabel: string;

  featuredLive: RankedDiscoverPick | null;
  previewLive: RankedDiscoverPick[];
  trendingTrips: RankedDiscoverPick[];
  multiMatchTrips: MultiMatchTrip[];

  leadCategory: DiscoverCategory | undefined;
  remainingPrimaryCategories: DiscoverCategory[];
  prioritisedSecondaryCategories: DiscoverCategory[];

  seededCategory: DiscoverCategory;

  toggleSetup: () => void;
  toggleVibe: (vibe: DiscoverVibe) => void;
  resetFilters: () => void;

  goFixturesCategory: (category: DiscoverCategory) => void;
  goMatchFromRow: (row: FixtureListRow | null | undefined) => void;
  goMultiMatchTrip: (trip: MultiMatchTrip) => void;
  applyPreset: (preset: InspirationPreset) => void;
  applyQuickSpark: (spark: QuickSpark) => void;
  goRandomTrip: () => Promise<void>;

  helpers: {
    fixtureTitle: typeof fixtureTitle;
    fixtureMeta: typeof fixtureMeta;
    whyThisFits: typeof whyThisFits;
    trendingLabelForFixture: typeof trendingLabelForFixture;
    rankLabel: typeof rankLabel;
  };
};

const LIVE_POOL_CACHE_TTL_MS = 5 * 60 * 1000;
const PREVIEW_LIMIT = 6;
const TRENDING_LIMIT = 6;
const RANDOM_POOL_LIMIT = 12;

type LivePoolCacheValue = {
  ts: number;
  rows: FixtureListRow[];
};

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function normaliseOrigin(value: string): string {
  return cleanString(value).replace(/\s+/g, " ");
}

function fixtureDateOnly(iso?: string | null): string {
  const value = cleanString(iso);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function toIsoDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function inferTripWindowFromKickoff(kickoffIso?: string | null): { from?: string; to?: string } {
  const dateOnly = fixtureDateOnly(kickoffIso);
  if (!dateOnly) return {};

  const start = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  return {
    from: dateOnly,
    to: toIsoDateOnly(end),
  };
}

function buildCanonicalTripStartParams(args: {
  fixtureId: string;
  leagueId?: number | string | null;
  season?: number | string | null;
  city?: string | null;
  kickoffIso?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const fallbackWindow = inferTripWindowFromKickoff(args.kickoffIso);

  return {
    fixtureId: cleanString(args.fixtureId),
    ...(cleanString(args.from)
      ? { from: cleanString(args.from) }
      : fallbackWindow.from
        ? { from: fallbackWindow.from }
        : {}),
    ...(cleanString(args.to)
      ? { to: cleanString(args.to) }
      : fallbackWindow.to
        ? { to: fallbackWindow.to }
        : {}),
    ...(cleanString(args.leagueId) ? { leagueId: cleanString(args.leagueId) } : {}),
    ...(cleanString(args.season) ? { season: cleanString(args.season) } : {}),
    ...(cleanString(args.city) ? { city: cleanString(args.city) } : {}),
  };
}

function fixtureId(row: FixtureListRow | null | undefined): string {
  return row?.fixture?.id != null ? String(row.fixture.id) : "";
}

function fixtureLeagueId(row: FixtureListRow | null | undefined): string | null {
  return row?.league?.id != null ? String(row.league.id) : null;
}

function fixtureSeason(row: FixtureListRow | null | undefined): string | null {
  return typeof row?.league?.season === "number" ? String(row.league.season) : null;
}

function fixtureCity(row: FixtureListRow | null | undefined): string | null {
  return cleanString(row?.fixture?.venue?.city) || null;
}

function fixtureKickoff(row: FixtureListRow | null | undefined): string | null {
  return cleanString(row?.fixture?.date) || null;
}

function uniqueRows(rows: FixtureListRow[]): FixtureListRow[] {
  const map = new Map<string, FixtureListRow>();

  for (const row of rows) {
    const id = fixtureId(row);
    if (!id) continue;
    map.set(id, row);
  }

  return Array.from(map.values());
}

function sortedVibesKey(vibes: DiscoverVibe[]): string {
  return [...vibes].sort().join(",");
}

function cacheKeyForDiscover(args: {
  from: string;
  to: string;
  windowKey: DiscoverWindowKey;
  origin: string;
  tripLength: DiscoverTripLength;
  vibesKey: string;
  category: DiscoverCategory;
}) {
  return [
    args.from,
    args.to,
    args.windowKey,
    normaliseOrigin(args.origin).toLowerCase(),
    args.tripLength,
    args.vibesKey,
    args.category,
  ].join("|");
}

export default function useDiscoverController(): UseDiscoverControllerReturn {
  const router = useRouter();

  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("d30");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverOrigin, setDiscoverOrigin] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [setupExpanded, setSetupExpanded] = useState(false);

  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveRows, setLiveRows] = useState<FixtureListRow[]>([]);

  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map<string, LivePoolCacheValue>());

  const currentWindow = useMemo(() => windowForKey(discoverWindowKey), [discoverWindowKey]);
  const normalisedOrigin = useMemo(() => normaliseOrigin(discoverOrigin), [discoverOrigin]);
  const vibesKey = useMemo(() => sortedVibesKey(discoverVibes), [discoverVibes]);

  const seededCategory = useMemo(() => {
    return categorySeedFromFilters({
      vibes: discoverVibes,
      windowKey: discoverWindowKey,
      tripLength: discoverTripLength,
    });
  }, [discoverVibes, discoverWindowKey, discoverTripLength]);

  const liveCacheKey = useMemo(() => {
    return cacheKeyForDiscover({
      from: currentWindow.from,
      to: currentWindow.to,
      windowKey: discoverWindowKey,
      origin: normalisedOrigin,
      tripLength: discoverTripLength,
      vibesKey,
      category: seededCategory,
    });
  }, [
    currentWindow.from,
    currentWindow.to,
    discoverWindowKey,
    normalisedOrigin,
    discoverTripLength,
    vibesKey,
    seededCategory,
  ]);

  const prioritisedPrimaryCategories = useMemo(() => {
    return prioritiseCategories(DISCOVER_PRIMARY_CATEGORIES, seededCategory);
  }, [seededCategory]);

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

    if (normalisedOrigin) parts.push(`From ${normalisedOrigin}`);
    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, normalisedOrigin]);

  const compactSummary = useMemo(() => {
    const parts = [
      shortLabelForKey(discoverWindowKey),
      shortLabelForTripLength(discoverTripLength),
      discoverVibes.length ? discoverVibes.map(shortLabelForVibe).join(" + ") : "Any vibe",
    ];

    if (normalisedOrigin) parts.push(normalisedOrigin);
    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, normalisedOrigin]);

  const browseModeLabel = useMemo(() => {
    return DISCOVER_CATEGORY_META[seededCategory]?.title ?? "Best-fit routes";
  }, [seededCategory]);

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

  useEffect(() => {
    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    async function run() {
      const cached = cacheRef.current.get(liveCacheKey);
      const now = Date.now();

      if (cached && now - cached.ts < LIVE_POOL_CACHE_TTL_MS) {
        setLiveRows(cached.rows);
        setLiveError(null);
        setLoadingLive(false);
        return;
      }

      setLoadingLive(true);
      setLiveError(null);

      try {
        const pool = await fetchDiscoverPool({
          window: currentWindow,
          windowKey: discoverWindowKey,
          origin: normalisedOrigin,
          tripLength: discoverTripLength,
          vibes: discoverVibes,
          category: seededCategory,
        });

        if (cancelled || requestIdRef.current !== requestId) return;

        const safePool = uniqueRows(Array.isArray(pool) ? pool : []);
        cacheRef.current.set(liveCacheKey, { ts: Date.now(), rows: safePool });

        setLiveRows(safePool);
        setLiveError(null);
      } catch (e: any) {
        if (cancelled || requestIdRef.current !== requestId) return;

        const staleFallback = cacheRef.current.get(liveCacheKey);
        if (staleFallback?.rows?.length) {
          setLiveRows(staleFallback.rows);
          setLiveError(null);
          return;
        }

        setLiveRows([]);
        setLiveError(e?.message ?? "Failed to load live route previews.");
      } finally {
        if (!cancelled && requestIdRef.current === requestId) {
          setLoadingLive(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    liveCacheKey,
    currentWindow,
    discoverWindowKey,
    normalisedOrigin,
    discoverTripLength,
    vibesKey,
    seededCategory,
  ]);

  const rankedLive = useMemo<RankedDiscoverPick[]>(() => {
    if (!liveRows.length) return [];

    const scored = buildDiscoverScores(liveRows);

    return scored
      .map((item) => ({
        item,
        score: discoverScoreForCategory(seededCategory, item, {
          origin: normalisedOrigin || null,
          tripLength: discoverTripLength,
          vibes: discoverVibes,
        }),
      }))
      .filter((entry) => fixtureId(entry.item.fixture))
      .sort((a, b) => b.score - a.score);
  }, [liveRows, seededCategory, normalisedOrigin, discoverTripLength, discoverVibes]);

  const featuredLive = useMemo(() => rankedLive[0] ?? null, [rankedLive]);
  const previewLive = useMemo(() => rankedLive.slice(0, PREVIEW_LIMIT), [rankedLive]);

  const trendingTrips = useMemo(() => {
    return [...rankedLive]
      .sort((a, b) => {
        return trendingScore(b.item.fixture, b.score) - trendingScore(a.item.fixture, a.score);
      })
      .slice(0, TRENDING_LIMIT);
  }, [rankedLive]);

  const multiMatchTrips = useMemo(() => {
    return buildMultiMatchTrips(rankedLive, {
      vibes: discoverVibes,
      tripLength: discoverTripLength,
      windowKey: discoverWindowKey,
    });
  }, [rankedLive, discoverVibes, discoverTripLength, discoverWindowKey]);

  const goFixturesCategory = useCallback(
    (category: DiscoverCategory) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: currentWindow.from,
          to: currentWindow.to,
          discover: category,
          ...(normalisedOrigin ? { discoverFrom: normalisedOrigin } : {}),
          discoverTripLength,
          discoverVibes: vibesKey,
        },
      } as never);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      normalisedOrigin,
      discoverTripLength,
      vibesKey,
    ]
  );

  const goMatchFromRow = useCallback(
    (row: FixtureListRow | null | undefined) => {
      const id = fixtureId(row);
      if (!id) return;

      const tripStartParams = buildCanonicalTripStartParams({
        fixtureId: id,
        leagueId: fixtureLeagueId(row),
        season: fixtureSeason(row),
        city: fixtureCity(row),
        kickoffIso: fixtureKickoff(row),
        from: currentWindow.from,
        to: currentWindow.to,
      });

      router.push({
        pathname: "/trip/build",
        params: tripStartParams,
      } as never);
    },
    [router, currentWindow.from, currentWindow.to]
  );

  const goMultiMatchTrip = useCallback(
    (trip: MultiMatchTrip) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: trip.from,
          to: trip.to,
          discover: discoverWindowKey === "wknd" ? "weekendTrips" : "multiMatchTrips",
          ...(normalisedOrigin ? { discoverFrom: normalisedOrigin } : {}),
          discoverTripLength,
          discoverVibes: vibesKey,
          comboMode: "1",
          comboTitle: trip.title,
          comboIds: trip.fixtureIds.join(","),
        },
      } as never);
    },
    [router, normalisedOrigin, discoverTripLength, vibesKey, discoverWindowKey]
  );

  const applyPreset = useCallback(
    (preset: InspirationPreset) => {
      const nextWindowKey = preset.windowKey ?? discoverWindowKey;
      const nextTripLength = preset.tripLength ?? discoverTripLength;
      const nextVibes = preset.vibe ? [preset.vibe] : discoverVibes;
      const nextVibesKey = sortedVibesKey(nextVibes);
      const nextWindow = windowForKey(nextWindowKey);

      if (preset.windowKey && preset.windowKey !== discoverWindowKey) {
        setDiscoverWindowKey(preset.windowKey);
      }

      if (preset.tripLength && preset.tripLength !== discoverTripLength) {
        setDiscoverTripLength(preset.tripLength);
      }

      if (preset.vibe) {
        setDiscoverVibes([preset.vibe]);
      }

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: nextWindow.from,
          to: nextWindow.to,
          discover: preset.category,
          ...(normalisedOrigin ? { discoverFrom: normalisedOrigin } : {}),
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibesKey,
        },
      } as never);
    },
    [router, discoverWindowKey, normalisedOrigin, discoverTripLength, discoverVibes]
  );

  const applyQuickSpark = useCallback(
    (spark: QuickSpark) => {
      const nextWindowKey = spark.windowKey ?? discoverWindowKey;
      const nextTripLength = spark.tripLength ?? discoverTripLength;
      const nextVibes = spark.vibe ? [spark.vibe] : discoverVibes;
      const nextVibesKey = sortedVibesKey(nextVibes);
      const nextWindow = windowForKey(nextWindowKey);

      if (spark.windowKey && spark.windowKey !== discoverWindowKey) {
        setDiscoverWindowKey(spark.windowKey);
      }

      if (spark.tripLength && spark.tripLength !== discoverTripLength) {
        setDiscoverTripLength(spark.tripLength);
      }

      if (spark.vibe) {
        setDiscoverVibes([spark.vibe]);
      }

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: nextWindow.from,
          to: nextWindow.to,
          discover: spark.category,
          ...(normalisedOrigin ? { discoverFrom: normalisedOrigin } : {}),
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibesKey,
        },
      } as never);
    },
    [router, discoverWindowKey, normalisedOrigin, discoverTripLength, discoverVibes]
  );

  const goRandomTrip = useCallback(async () => {
    if (loadingRandom) return;

    setLoadingRandom(true);

    try {
      if (!rankedLive.length) return;

      const poolTop = rankedLive.slice(0, Math.min(RANDOM_POOL_LIMIT, rankedLive.length));
      const chosen = pickRandom(poolTop);
      const row = chosen?.item?.fixture ?? null;
      const id = fixtureId(row);

      if (!id) return;

      const tripStartParams = buildCanonicalTripStartParams({
        fixtureId: id,
        leagueId: fixtureLeagueId(row),
        season: fixtureSeason(row),
        city: fixtureCity(row),
        kickoffIso: fixtureKickoff(row),
        from: currentWindow.from,
        to: currentWindow.to,
      });

      router.push({
        pathname: "/trip/build",
        params: tripStartParams,
      } as never);
    } finally {
      setLoadingRandom(false);
    }
  }, [loadingRandom, rankedLive, router, currentWindow.from, currentWindow.to]);

  return {
    discoverWindowKey,
    setDiscoverWindowKey,
    discoverTripLength,
    setDiscoverTripLength,
    discoverVibes,
    discoverOrigin,
    setDiscoverOrigin,
    setupExpanded,
    loadingRandom,
    loadingLive,
    liveError,

    compactSummary,
    filterSummary,
    browseModeLabel,

    featuredLive,
    previewLive,
    trendingTrips,
    multiMatchTrips,

    leadCategory,
    remainingPrimaryCategories,
    prioritisedSecondaryCategories,

    seededCategory,

    toggleSetup,
    toggleVibe,
    resetFilters,

    goFixturesCategory,
    goMatchFromRow,
    goMultiMatchTrip,
    applyPreset,
    applyQuickSpark,
    goRandomTrip,

    helpers: {
      fixtureTitle,
      fixtureMeta,
      whyThisFits,
      trendingLabelForFixture,
      rankLabel,
    },
  };
     }
