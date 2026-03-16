import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
  LEAGUES,
  LEAGUE_BROWSE_REGION_ORDER,
  type LeagueOption,
  type LeagueBrowseRegion,
} from "@/src/constants/football";
import { getFixtures } from "@/src/services/apiFootball";
import useFollowStore from "@/src/state/followStore";
import {
  computeLikelyPlaceholderTbcIds,
  kickoffIsoOrNull,
} from "@/src/utils/kickoffTbc";
import {
  discoverScoreForCategory,
  baseFixtureScore,
} from "@/src/features/discover/discoverRanking";
import { DISCOVER_CATEGORY_META } from "@/src/features/discover/discoverCategories";
import { buildDiscoverScores } from "@/src/features/discover/discoverEngine";
import {
  DAYS_AHEAD,
  STRIP_DAYS,
  addDaysIsoUtc,
  buildMonthGrid,
  clampIsoToWindow,
  isValidIsoDateOnly,
  monthLabel,
  normalizeRange,
  parseIsoToUtcParts,
  tomorrowIsoUtc,
} from "@/src/features/fixtures/date";
import {
  buildDiscoverContext,
  coerceNumber,
  coerceString,
  isTopPicksMode,
  parseDiscoverCategory,
} from "@/src/features/fixtures/params";
import {
  fixtureIsoDateOnly,
  leagueScopeSubtitle,
  norm,
  formatFixtureDateDisplay,
} from "@/src/features/fixtures/helpers";
import type { RankedFixtureRow } from "@/src/features/fixtures/types";

const MAX_MULTI_LEAGUES = 10;

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length) as R[];
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }

  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }).map(worker));
  return results;
}

export function useFixturesScreenData() {
  const rawParams = useLocalSearchParams();

  const rawLeagueId = rawParams?.leagueId;
  const rawFrom = rawParams?.from;
  const rawTo = rawParams?.to;
  const rawDiscover = rawParams?.discover;
  const rawDiscoverFrom = rawParams?.discoverFrom;
  const rawDiscoverTripLength = rawParams?.discoverTripLength;
  const rawDiscoverVibes = rawParams?.discoverVibes;
  const rawSort = rawParams?.sort;
  const rawMode = rawParams?.mode;

  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  const routeLeagueId = useMemo(() => coerceNumber(rawLeagueId), [rawLeagueId]);
  const routeFrom = useMemo(() => coerceString(rawFrom), [rawFrom]);
  const routeTo = useMemo(() => coerceString(rawTo), [rawTo]);

  const discoverCategory = useMemo(
    () => parseDiscoverCategory(rawDiscover),
    [rawDiscover]
  );

  const discoverContext = useMemo(
    () =>
      buildDiscoverContext({
        discoverCategory,
        discoverFrom: rawDiscoverFrom,
        discoverTripLength: rawDiscoverTripLength,
        discoverVibes: rawDiscoverVibes,
      }),
    [discoverCategory, rawDiscoverFrom, rawDiscoverTripLength, rawDiscoverVibes]
  );

  const routeSort = useMemo(
    () => coerceString(rawSort) ?? coerceString(rawMode),
    [rawSort, rawMode]
  );

  const topPicksMode = useMemo(() => isTopPicksMode(routeSort), [routeSort]);

  const defaultTopFrom = useMemo(() => minIso, [minIso]);
  const defaultTopTo = useMemo(() => addDaysIsoUtc(minIso, 13), [minIso]);

  const defaultBrowseRange = useMemo(
    () => ({ from: minIso, to: addDaysIsoUtc(minIso, STRIP_DAYS - 1) }),
    [minIso]
  );

  const initialDay = useMemo(() => {
    const base =
      routeFrom && isValidIsoDateOnly(routeFrom)
        ? routeFrom
        : topPicksMode
          ? defaultTopFrom
          : minIso;

    return clampIsoToWindow(base, minIso, maxIso);
  }, [routeFrom, topPicksMode, defaultTopFrom, minIso, maxIso]);

  const initialRange = useMemo(() => {
    const a =
      routeFrom && isValidIsoDateOnly(routeFrom)
        ? clampIsoToWindow(routeFrom, minIso, maxIso)
        : null;

    const b =
      routeTo && isValidIsoDateOnly(routeTo)
        ? clampIsoToWindow(routeTo, minIso, maxIso)
        : null;

    if (a && b && a !== b) return normalizeRange(a, b);

    if (topPicksMode && !a && !b) {
      return { from: defaultTopFrom, to: defaultTopTo };
    }

    if (!topPicksMode && !a && !b) {
      return defaultBrowseRange;
    }

    return null;
  }, [
    routeFrom,
    routeTo,
    topPicksMode,
    defaultTopFrom,
    defaultTopTo,
    defaultBrowseRange,
    minIso,
    maxIso,
  ]);

  const [selectedDay, setSelectedDay] = useState<string>(initialDay);
  const [range, setRange] = useState<{ from: string; to: string } | null>(initialRange);

  useEffect(() => {
    setSelectedDay((prev) => (prev === initialDay ? prev : initialDay));
  }, [initialDay]);

  useEffect(() => {
    setRange((prev) => {
      const prevFrom = prev?.from ?? null;
      const prevTo = prev?.to ?? null;
      const nextFrom = initialRange?.from ?? null;
      const nextTo = initialRange?.to ?? null;

      if (prevFrom === nextFrom && prevTo === nextTo) return prev;
      return initialRange;
    });
  }, [initialRange]);

  const effectiveRange = useMemo(() => {
    return range
      ? normalizeRange(range.from, range.to)
      : { from: selectedDay, to: selectedDay };
  }, [range, selectedDay]);

  const isRange = useMemo(
    () => effectiveRange.from !== effectiveRange.to,
    [effectiveRange]
  );

  const stripDays = useMemo(() => {
    const start = clampIsoToWindow(selectedDay, minIso, maxIso);
    return Array.from({ length: STRIP_DAYS }).map((_, i) => {
      const iso = addDaysIsoUtc(start, i);
      const d = new Date(`${iso}T00:00:00.000Z`);
      return {
        iso,
        top: d.toLocaleDateString("en-GB", { weekday: "short" }),
        bottom: d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
      };
    });
  }, [selectedDay, minIso, maxIso]);

  const [selectedLeagueIds, setSelectedLeagueIds] = useState<number[]>(() => {
    if (routeLeagueId && Number.isFinite(routeLeagueId)) return [routeLeagueId];
    return [];
  });

  useEffect(() => {
    const nextIds =
      routeLeagueId && Number.isFinite(routeLeagueId) ? [routeLeagueId] : [];

    setSelectedLeagueIds((prev) => {
      if (prev.length === nextIds.length && prev.every((v, i) => v === nextIds[i])) {
        return prev;
      }
      return nextIds;
    });
  }, [routeLeagueId]);

  const selectedLeagues = useMemo(() => {
    if (selectedLeagueIds.length === 0) return [] as LeagueOption[];
    const set = new Set(selectedLeagueIds);
    return LEAGUES.filter((l) => set.has(l.leagueId));
  }, [selectedLeagueIds]);

  const fetchLeagues = useMemo(() => {
    if (selectedLeagues.length > 0) return selectedLeagues;
    return LEAGUES;
  }, [selectedLeagues]);

  const leagueSubtitle = useMemo(() => {
    if (selectedLeagues.length > 0) return leagueScopeSubtitle(selectedLeagues);
    return "All competitions";
  }, [selectedLeagues]);

  const [activeRegion, setActiveRegion] =
    useState<LeagueBrowseRegion>("featured-europe");

  const leaguesByRegion = useMemo(() => {
    const out: Record<LeagueBrowseRegion, LeagueOption[]> = {
      "featured-europe": [],
      "central-eastern-europe": [],
      nordics: [],
    };

    LEAGUES.forEach((league) => {
      if (!league.browseRegion) return;
      out[league.browseRegion].push(league);
    });

    LEAGUE_BROWSE_REGION_ORDER.forEach((region) => {
      out[region].sort(
        (a, b) => a.country.localeCompare(b.country) || a.label.localeCompare(b.label)
      );
    });

    return out;
  }, []);

  const toggleLeague = useCallback((leagueId: number) => {
    setSelectedLeagueIds((prev) => {
      const has = prev.includes(leagueId);

      if (has) return prev.filter((x) => x !== leagueId);

      if (prev.length >= MAX_MULTI_LEAGUES) {
        Alert.alert(
          "Max leagues reached",
          `You can select up to ${MAX_MULTI_LEAGUES} leagues at once.`
        );
        return prev;
      }

      return [...prev, leagueId];
    });
  }, []);

  const selectSingleLeague = useCallback((leagueId: number) => {
    setSelectedLeagueIds([leagueId]);
  }, []);

  const resetToFeatured = useCallback(() => {
    setSelectedLeagueIds([]);
  }, []);

  const [query, setQuery] = useState("");

  const qNorm = useMemo(() => query.trim().toLowerCase(), [query]);

  const followed = useFollowStore((s) => s.followed);
  const toggleFollow = useFollowStore((s) => s.toggle);

  const followedIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const f of followed) {
      const id = String(f.fixtureId ?? "").trim();
      if (id) set.add(id);
    }
    return set;
  }, [followed]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RankedFixtureRow[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const placeholderIds = useMemo(() => computeLikelyPlaceholderTbcIds(rows), [rows]);

  const fetchFrom = effectiveRange.from;
  const fetchTo = effectiveRange.to;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRows([]);
      setExpandedKey(null);

      try {
        const batches = await mapLimit(fetchLeagues, 4, async (l) => {
          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from: fetchFrom,
            to: fetchTo,
          });
          return Array.isArray(res) ? res : [];
        });

        if (cancelled) return;

        const flat = batches.flat().filter((r) => r?.fixture?.id != null);

        if (discoverCategory) {
          const scored = buildDiscoverScores(flat);

          const ranked = scored
            .map((item) => ({
              fixture: item.fixture,
              reasons: item.reasons,
              discoverScore: discoverScoreForCategory(
                discoverCategory,
                item,
                discoverContext
              ),
              kickoffIso: String(item.fixture?.fixture?.date ?? ""),
            }))
            .sort((a, b) => {
              if (b.discoverScore !== a.discoverScore) return b.discoverScore - a.discoverScore;
              return a.kickoffIso.localeCompare(b.kickoffIso);
            })
            .map((x) => ({
              ...(x.fixture as RankedFixtureRow),
              discoverReasons: x.reasons,
            }));

          setRows(ranked);
          return;
        }

        if (topPicksMode) {
          flat.sort((a, b) => {
            const sa = baseFixtureScore(a);
            const sb = baseFixtureScore(b);
            if (sb !== sa) return sb - sa;
            const da = String(a?.fixture?.date ?? "");
            const db = String(b?.fixture?.date ?? "");
            return da.localeCompare(db);
          });
        } else {
          flat.sort((a, b) => {
            const da = String(a?.fixture?.date ?? "");
            const db = String(b?.fixture?.date ?? "");
            return da.localeCompare(db);
          });
        }

        setRows(flat as RankedFixtureRow[]);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchLeagues, fetchFrom, fetchTo, topPicksMode, discoverCategory, discoverContext]);

  const filtered = useMemo(() => {
    const base = rows;

    const dayFiltered = !isRange
      ? base.filter((r) => fixtureIsoDateOnly(r) === effectiveRange.from)
      : base;

    if (!qNorm) return dayFiltered;

    return dayFiltered.filter((r) => {
      return (
        norm(r?.teams?.home?.name).includes(qNorm) ||
        norm(r?.teams?.away?.name).includes(qNorm) ||
        norm(r?.fixture?.venue?.city).includes(qNorm) ||
        norm((r?.league as any)?.country).includes(qNorm)
      );
    });
  }, [rows, isRange, effectiveRange.from, qNorm]);

  const onToggleFollowFromRow = useCallback(
    (r: RankedFixtureRow) => {
      const fixtureId = r?.fixture?.id != null ? String(r.fixture.id) : "";
      if (!fixtureId) return;

      const leagueId = r?.league?.id != null ? Number(r.league.id) : 0;
      const season = (r as any)?.league?.season != null ? Number((r as any).league.season) : 0;

      const homeTeamId = r?.teams?.home?.id != null ? Number(r.teams.home.id) : 0;
      const awayTeamId = r?.teams?.away?.id != null ? Number(r.teams.away.id) : 0;

      const homeName = r?.teams?.home?.name != null ? String(r.teams.home.name) : null;
      const awayName = r?.teams?.away?.name != null ? String(r.teams.away.name) : null;
      const leagueName = r?.league?.name != null ? String(r.league.name) : null;
      const round = r?.league?.round != null ? String(r.league.round) : null;

      toggleFollow({
        fixtureId,
        leagueId,
        season,
        homeTeamId,
        awayTeamId,
        homeName,
        awayName,
        leagueName,
        round,
        kickoffIso: kickoffIsoOrNull(r),
        venue: r?.fixture?.venue?.name != null ? String(r.fixture.venue.name) : null,
        city: r?.fixture?.venue?.city != null ? String(r.fixture.venue.city) : null,
      });
    },
    [toggleFollow]
  );

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [calMonthYear, setCalMonthYear] = useState(() => {
    const base =
      parseIsoToUtcParts(selectedDay) ??
      parseIsoToUtcParts(minIso) ?? { y: 2026, m0: 0, d: 1 };

    return { y: base.y, m0: base.m0 };
  });

  const [calPickA, setCalPickA] = useState<string>(selectedDay);
  const [calPickB, setCalPickB] = useState<string>(selectedDay);

  const calNorm = useMemo(() => normalizeRange(calPickA, calPickB), [calPickA, calPickB]);
  const calIsRange = useMemo(() => calNorm.from !== calNorm.to, [calNorm]);

  const openCalendar = useCallback(() => {
    if (range) {
      setCalPickA(range.from);
      setCalPickB(range.to);
      const parts = parseIsoToUtcParts(range.from) ?? parseIsoToUtcParts(selectedDay);
      if (parts) setCalMonthYear({ y: parts.y, m0: parts.m0 });
    } else {
      setCalPickA(selectedDay);
      setCalPickB(selectedDay);
      const parts = parseIsoToUtcParts(selectedDay);
      if (parts) setCalMonthYear({ y: parts.y, m0: parts.m0 });
    }
    setCalendarOpen(true);
  }, [range, selectedDay]);

  const closeCalendar = useCallback(() => setCalendarOpen(false), []);

  const calGrid = useMemo(
    () => buildMonthGrid(calMonthYear.y, calMonthYear.m0),
    [calMonthYear]
  );

  const calPrevMonth = useCallback(() => {
    setCalMonthYear((prev) => {
      const m0 = prev.m0 - 1;
      if (m0 < 0) return { y: prev.y - 1, m0: 11 };
      return { y: prev.y, m0 };
    });
  }, []);

  const calNextMonth = useCallback(() => {
    setCalMonthYear((prev) => {
      const m0 = prev.m0 + 1;
      if (m0 > 11) return { y: prev.y + 1, m0: 0 };
      return { y: prev.y, m0 };
    });
  }, []);

  const calInRange = useCallback(
    (iso: string) => {
      if (!iso) return false;
      return iso >= calNorm.from && iso <= calNorm.to;
    },
    [calNorm]
  );

  const calIsEdge = useCallback(
    (iso: string) => {
      if (!iso) return false;
      return iso === calNorm.from || iso === calNorm.to;
    },
    [calNorm]
  );

  const onCalendarTapDay = useCallback(
    (iso: string) => {
      if (!iso) return;

      const d = clampIsoToWindow(iso, minIso, maxIso);

      if (calPickA === calPickB) {
        if (d === calPickA) return;
        setCalPickB(d);
        return;
      }

      setCalPickA(d);
      setCalPickB(d);
    },
    [calPickA, calPickB, minIso, maxIso]
  );

  const applyCalendar = useCallback(() => {
    const a = clampIsoToWindow(calNorm.from, minIso, maxIso);
    const b = clampIsoToWindow(calNorm.to, minIso, maxIso);
    const n = normalizeRange(a, b);

    if (n.from === n.to) {
      setSelectedDay(n.from);
      setRange(null);
    } else {
      setRange({ from: n.from, to: n.to });
      setSelectedDay(n.from);
    }

    setCalendarOpen(false);
  }, [calNorm, minIso, maxIso]);

  const clearCalendarRange = useCallback(() => {
    setCalPickA(selectedDay);
    setCalPickB(selectedDay);
  }, [selectedDay]);

  const onTapStripDate = useCallback(
    (iso: string) => {
      const d = clampIsoToWindow(iso, minIso, maxIso);
      setSelectedDay(d);
      setRange(null);
    },
    [minIso, maxIso]
  );

  const titleText = useMemo(() => {
    if (discoverCategory) return DISCOVER_CATEGORY_META[discoverCategory].title;
    return topPicksMode ? "Top Picks" : "Fixtures";
  }, [discoverCategory, topPicksMode]);

  const subtitleText = useMemo(() => {
    if (discoverCategory) return DISCOVER_CATEGORY_META[discoverCategory].subtitle;
    return leagueSubtitle;
  }, [discoverCategory, leagueSubtitle]);

  const helperLineText = useMemo(() => {
    const readableFrom = formatFixtureDateDisplay(effectiveRange.from);
    const readableTo = formatFixtureDateDisplay(effectiveRange.to);

    if (discoverCategory) {
      const base = DISCOVER_CATEGORY_META[discoverCategory].helper;
      const datePart = isRange ? `${readableFrom} → ${readableTo}` : readableFrom;
      const scopePart =
        selectedLeagueIds.length > 0
          ? `${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues`
          : "All competitions";

      const extras: string[] = [];

      if (discoverContext?.tripLength) {
        if (discoverContext.tripLength === "day") extras.push("Day trip");
        if (discoverContext.tripLength === "1") extras.push("1 night");
        if (discoverContext.tripLength === "2") extras.push("2 nights");
        if (discoverContext.tripLength === "3") extras.push("3 nights");
      }

      if (discoverContext?.vibes?.length) {
        extras.push(discoverContext.vibes.join(", "));
      }

      if (discoverContext?.origin) {
        extras.push(`From ${discoverContext.origin}`);
      }

      return [base, datePart, scopePart, ...extras].join(" • ");
    }

    return `${
      isRange ? `Range • ${readableFrom} → ${readableTo}` : `Day • ${readableFrom}`
    }${
      selectedLeagueIds.length > 0
        ? ` • ${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues`
        : " • All competitions"
    }${topPicksMode ? " • Sorted by rating" : ""}`;
  }, [
    discoverCategory,
    isRange,
    effectiveRange,
    selectedLeagueIds.length,
    topPicksMode,
    discoverContext,
  ]);

  const headerDateLine = useMemo(() => {
    if (!isRange) {
      return formatFixtureDateDisplay(effectiveRange.from);
    }

    return `${formatFixtureDateDisplay(effectiveRange.from)} → ${formatFixtureDateDisplay(
      effectiveRange.to
    )}`;
  }, [isRange, effectiveRange]);

  return {
    discoverCategory,
    discoverContext,
    topPicksMode,

    selectedDay,
    range,
    effectiveRange,
    isRange,
    stripDays,

    selectedLeagueIds,
    selectedLeagues,
    activeRegion,
    setActiveRegion,
    leaguesByRegion,
    toggleLeague,
    selectSingleLeague,
    resetToFeatured,

    query,
    setQuery,

    followedIdSet,
    loading,
    error,
    rows,
    filtered,
    expandedKey,
    setExpandedKey,
    placeholderIds,
    onToggleFollowFromRow,

    calendarOpen,
    openCalendar,
    closeCalendar,
    calMonthYear,
    calGrid,
    calNorm,
    calIsRange,
    calPrevMonth,
    calNextMonth,
    calInRange,
    calIsEdge,
    onCalendarTapDay,
    applyCalendar,
    clearCalendarRange,

    onTapStripDate,

    titleText,
    subtitleText,
    helperLineText,
    headerDateLine,
    monthLabel,
  };
               }
