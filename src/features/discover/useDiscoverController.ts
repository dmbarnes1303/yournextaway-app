import { useCallback, useEffect, useMemo, useState } from "react";
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

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function fixtureDateOnly(iso?: string | null): string {
  const value = cleanString(iso);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function inferTripWindowFromKickoff(kickoffIso?: string | null): { from?: string; to?: string } {
  const dateOnly = fixtureDateOnly(kickoffIso);
  if (!dateOnly) return {};

  const start = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const toIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`;

  return {
    from: dateOnly,
    to: toIso,
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

    if (discoverOrigin.trim()) parts.push(`From ${discoverOrigin.trim()}`);
    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, discoverOrigin]);

  const compactSummary = useMemo(() => {
    const parts = [
      shortLabelForKey(discoverWindowKey),
      shortLabelForTripLength(discoverTripLength),
      discoverVibes.length ? discoverVibes.map(shortLabelForVibe).join(" + ") : "Any vibe",
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
    currentWindow,
    discoverWindowKey,
    discoverOrigin,
    discoverTripLength,
    discoverVibes,
    seededCategory,
  ]);

  const rankedLive = useMemo<RankedDiscoverPick[]>(() => {
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
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
        },
      } as never);
    },
    [router, currentWindow, discoverOrigin, discoverTripLength, discoverVibes]
  );

  const goMatchFromRow = useCallback(
    (row: FixtureListRow | null | undefined) => {
      const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : "";
      if (!fixtureId) return;

      const leagueId = row?.league?.id != null ? String(row.league.id) : null;
      const season =
        typeof row?.league?.season === "number" ? String(row.league.season) : null;
      const city = cleanString(row?.fixture?.venue?.city) || null;
      const kickoffIso = cleanString(row?.fixture?.date) || null;

      const tripStartParams = buildCanonicalTripStartParams({
        fixtureId,
        leagueId,
        season,
        city,
        kickoffIso,
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
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
          comboMode: "1",
          comboTitle: trip.title,
          comboIds: trip.fixtureIds.join(","),
        },
      } as never);
    },
    [router, discoverOrigin, discoverTripLength, discoverVibes, discoverWindowKey]
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
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibes.join(","),
        },
      } as never);
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

      const nextWindow = windowForKey(nextWindowKey);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: nextWindow.from,
          to: nextWindow.to,
          discover: spark.category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibes.join(","),
        },
      } as never);
    },
    [router, discoverWindowKey, discoverOrigin, discoverTripLength, discoverVibes]
  );

  const goRandomTrip = useCallback(async () => {
    if (loadingRandom) return;

    setLoadingRandom(true);

    try {
      if (!liveRows.length) return;

      const scored = buildDiscoverScores(liveRows);

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
      const row = chosen?.item?.fixture ?? null;

      const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : "";
      if (!fixtureId) return;

      const leagueId = row?.league?.id != null ? String(row.league.id) : null;
      const season =
        typeof row?.league?.season === "number" ? String(row.league.season) : null;
      const city = cleanString(row?.fixture?.venue?.city) || null;
      const kickoffIso = cleanString(row?.fixture?.date) || null;

      const tripStartParams = buildCanonicalTripStartParams({
        fixtureId,
        leagueId,
        season,
        city,
        kickoffIso,
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
  }, [
    loadingRandom,
    liveRows,
    seededCategory,
    discoverOrigin,
    discoverTripLength,
    discoverVibes,
    router,
    currentWindow.from,
    currentWindow.to,
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
