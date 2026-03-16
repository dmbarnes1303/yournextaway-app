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
  type DiscoverContext,
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

function safeTrim(value: unknown) {
  return String(value ?? "").trim();
}

function buildRouteParamsFromRow(
  row: FixtureListRow | null | undefined,
  extra: Record<string, string | undefined>
) {
  const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : null;
  if (!fixtureId) return null;

  const leagueId = row?.league?.id != null ? String(row.league.id) : undefined;
  const season =
    (row as any)?.league?.season != null ? String((row as any).league.season) : undefined;

  return {
    fixtureId,
    ...(leagueId ? { leagueId } : {}),
    ...(season ? { season } : {}),
    ...extra,
  };
}

export default function useDiscoverController(): UseDiscoverControllerReturn {
  const router = useRouter();
  const liveRequestIdRef = useRef(0);

  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("d30");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverOrigin, setDiscoverOrigin] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [setupExpanded, setSetupExpanded] = useState(false);

  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveRows, setLiveRows] = useState<FixtureListRow[]>([]);

  const originTrimmed = useMemo(() => safeTrim(discoverOrigin), [discoverOrigin]);

  const currentWindow = useMemo(() => {
    return windowForKey(discoverWindowKey);
  }, [discoverWindowKey]);

  const seededCategory = useMemo(() => {
    return categorySeedFromFilters({
      vibes: discoverVibes,
      windowKey: discoverWindowKey,
      tripLength: discoverTripLength,
    });
  }, [discoverVibes, discoverWindowKey, discoverTripLength]);

  const discoverContext = useMemo<DiscoverContext>(
    () => ({
      origin: originTrimmed || null,
      tripLength: discoverTripLength,
      vibes: discoverVibes,
    }),
    [originTrimmed, discoverTripLength, discoverVibes]
  );

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

    if (originTrimmed) parts.push(`From ${originTrimmed}`);
    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, originTrimmed]);

  const compactSummary = useMemo(() => {
    const parts = [
      shortLabelForKey(discoverWindowKey),
      shortLabelForTripLength(discoverTripLength),
      discoverVibes.length
        ? discoverVibes.map(shortLabelForVibe).join(" + ")
        : "Any vibe",
    ];

    if (originTrimmed) parts.push(originTrimmed);
    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, originTrimmed]);

  const browseModeLabel = useMemo(() => {
    const meta = DISCOVER_CATEGORY_META[seededCategory];
    return meta?.title ?? "Best-fit routes";
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
    const requestId = ++liveRequestIdRef.current;
    let active = true;

    async function run() {
      setLoadingLive(true);
      setLiveError(null);

      try {
        const pool = await fetchDiscoverPool({
          window: currentWindow,
          windowKey: discoverWindowKey,
          origin: originTrimmed,
          tripLength: discoverTripLength,
          vibes: discoverVibes,
          category: seededCategory,
        });

        if (!active || requestId !== liveRequestIdRef.current) return;
        setLiveRows(pool);
      } catch (e: any) {
        if (!active || requestId !== liveRequestIdRef.current) return;
        setLiveRows([]);
        setLiveError(e?.message ?? "Failed to load live route previews.");
      } finally {
        if (active && requestId === liveRequestIdRef.current) {
          setLoadingLive(false);
        }
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [
    currentWindow,
    discoverWindowKey,
    originTrimmed,
    discoverTripLength,
    discoverVibes,
    seededCategory,
  ]);

  const scoredLive = useMemo(() => {
    if (!liveRows.length) return [];
    return buildDiscoverScores(liveRows);
  }, [liveRows]);

  const rankedLive = useMemo<RankedDiscoverPick[]>(() => {
    if (!scoredLive.length) return [];

    return scoredLive
      .map((item) => ({
        item,
        score: discoverScoreForCategory(seededCategory, item, discoverContext),
      }))
      .sort((a, b) => b.score - a.score);
  }, [scoredLive, seededCategory, discoverContext]);

  const featuredLive = useMemo(() => rankedLive[0] ?? null, [rankedLive]);

  const previewLive = useMemo(() => {
    return rankedLive.slice(0, 6);
  }, [rankedLive]);

  const trendingTrips = useMemo(() => {
    return [...rankedLive]
      .sort((a, b) => {
        const aRow = a.item.fixture;
        const bRow = b.item.fixture;
        return trendingScore(bRow, b.score) - trendingScore(aRow, a.score);
      })
      .slice(0, 6);
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
          discoverFrom: originTrimmed || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
        },
      } as any);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      originTrimmed,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const goMatchFromRow = useCallback(
    (row: FixtureListRow | null | undefined) => {
      const params = buildRouteParamsFromRow(row, {
        global: "1",
        from: currentWindow.from,
        to: currentWindow.to,
        prefMode: "discover",
        prefFrom: originTrimmed || undefined,
        prefWindow: discoverWindowKey,
        prefLength: discoverTripLength,
        prefVibes: discoverVibes.join(","),
      });

      if (!params) return;

      router.push({
        pathname: "/trip/build",
        params,
      } as any);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      originTrimmed,
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
          discover: discoverWindowKey === "wknd" ? "weekendTrips" : "multiMatchTrips",
          discoverFrom: originTrimmed || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
          comboMode: "1",
          comboTitle: trip.title,
          comboIds: trip.fixtureIds.join(","),
        },
      } as any);
    },
    [router, originTrimmed, discoverTripLength, discoverVibes, discoverWindowKey]
  );

  const applyPreset = useCallback(
    (preset: InspirationPreset) => {
      const nextWindowKey = preset.windowKey ?? discoverWindowKey;
      const nextTripLength = preset.tripLength ?? discoverTripLength;
      const nextVibes = preset.vibe ? [preset.vibe] : discoverVibes;

      if (preset.windowKey) setDiscoverWindowKey(preset.windowKey);
      if (preset.tripLength) setDiscoverTripLength(preset.tripLength);
      if (preset.vibe) setDiscoverVibes([preset.vibe]);

      const nextWindow = windowForKey(nextWindowKey);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: nextWindow.from,
          to: nextWindow.to,
          discover: preset.category,
          discoverFrom: originTrimmed || undefined,
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibes.join(","),
        },
      } as any);
    },
    [
      router,
      discoverWindowKey,
      discoverTripLength,
      discoverVibes,
      originTrimmed,
    ]
  );

  const applyQuickSpark = useCallback(
    (spark: QuickSpark) => {
      const nextWindowKey = spark.windowKey ?? discoverWindowKey;
      const nextTripLength = spark.tripLength ?? discoverTripLength;
      const nextVibes = spark.vibe ? [spark.vibe] : discoverVibes;

      if (spark.windowKey) setDiscoverWindowKey(spark.windowKey);
      if (spark.tripLength) setDiscoverTripLength(spark.tripLength);
      if (spark.vibe) setDiscoverVibes([spark.vibe]);

      const nextWindow = windowForKey(nextWindowKey);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: nextWindow.from,
          to: nextWindow.to,
          discover: spark.category,
          discoverFrom: originTrimmed || undefined,
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibes.join(","),
        },
      } as any);
    },
    [
      router,
      discoverWindowKey,
      discoverTripLength,
      discoverVibes,
      originTrimmed,
    ]
  );

  const goRandomTrip = useCallback(async () => {
    if (loadingRandom || !rankedLive.length) return;

    setLoadingRandom(true);

    try {
      const poolTop = rankedLive.slice(0, Math.min(12, rankedLive.length));
      const chosen = pickRandom(poolTop);
      const row = chosen?.item?.fixture ?? null;

      const params = buildRouteParamsFromRow(row, {
        global: "1",
        from: currentWindow.from,
        to: currentWindow.to,
        prefMode: "random",
        prefFrom: originTrimmed || undefined,
        prefWindow: discoverWindowKey,
        prefLength: discoverTripLength,
        prefVibes: discoverVibes.join(","),
      });

      if (!params) return;

      router.push({
        pathname: "/trip/build",
        params,
      } as any);
    } finally {
      setLoadingRandom(false);
    }
  }, [
    loadingRandom,
    rankedLive,
    router,
    currentWindow.from,
    currentWindow.to,
    originTrimmed,
    discoverWindowKey,
    discoverTripLength,
    discoverVibes,
  ]);

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
