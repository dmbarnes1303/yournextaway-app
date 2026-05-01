// src/features/fixtures/useFixturesScreenData.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const DEFAULT_FETCH_CONCURRENCY = 4;

const DEFAULT_PRIORITY_LEAGUE_IDS = new Set<number>([
  39, 140, 135, 78, 61, 88, 94, 203, 179, 2, 3, 848,
]);

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

function sortLeagueDefaults(leagues: LeagueOption[]): LeagueOption[] {
  return leagues
    .map((league, index) => {
      let score = 0;
      if (DEFAULT_PRIORITY_LEAGUE_IDS.has(league.leagueId)) score += 100;
      if (league.homeVisible) score += 18;
      if (league.featured) score += 12;
      if (league.browseRegion === "featured-europe") score += 8;
      return { league, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.league);
}

function dedupeByFixtureId(rows: RankedFixtureRow[]): RankedFixtureRow[] {
  const out = new Map<string, RankedFixtureRow>();

  for (const row of rows) {
    const id = row?.fixture?.id != null ? String(row.fixture.id) : "";
    if (id && !out.has(id)) out.set(id, row);
  }

  return Array.from(out.values());
}

function getCompetitionSummary(args: {
  selectedLeagueIds: number[];
  selectedLeagues: LeagueOption[];
  fetchLeagues: LeagueOption[];
}) {
  if (args.selectedLeagueIds.length === 0) {
    return `All ${args.fetchLeagues.length} competitions`;
  }

  if (args.selectedLeagueIds.length === 1) {
    return leagueScopeSubtitle(args.selectedLeagues);
  }

  return `${args.selectedLeagueIds.length} competitions selected`;
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

  const discoverCategory = useMemo(() => parseDiscoverCategory(rawDiscover), [rawDiscover]);

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
    if (topPicksMode && !a && !b) return { from: defaultTopFrom, to: defaultTopTo };
    if (!topPicksMode && !a && !b) return defaultBrowseRange;

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

  const effectiveRange = useMemo(
    () => (range ? normalizeRange(range.from, range.to) : { from: selectedDay, to: selectedDay }),
    [range, selectedDay]
  );

  const isRange = useMemo(() => effectiveRange.from !== effectiveRange.to, [effectiveRange]);

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
    const nextIds = routeLeagueId && Number.isFinite(routeLeagueId) ? [routeLeagueId] : [];

    setSelectedLeagueIds((prev) => {
      if (prev.length === nextIds.length && prev.every((v, i) => v === nextIds[i])) return prev;
      return nextIds;
    });
  }, [routeLeagueId]);

  const allLeagues = useMemo(() => sortLeagueDefaults(LEAGUES), []);

  const selectedLeagues = useMemo(() => {
    if (selectedLeagueIds.length === 0) return [] as LeagueOption[];
    const set = new Set(selectedLeagueIds);
    return allLeagues.filter((l) => set.has(l.leagueId));
  }, [selectedLeagueIds, allLeagues]);

  const fetchLeagues = useMemo(() => {
    if (selectedLeagues.length > 0) return selectedLeagues;
    return allLeagues;
  }, [selectedLeagues, allLeagues]);

  const competitionSummaryText = useMemo(
    () =>
      getCompetitionSummary({
        selectedLeagueIds,
        selectedLeagues,
        fetchLeagues,
      }),
    [selectedLeagueIds, selectedLeagues, fetchLeagues]
  );

  const leagueSubtitle = useMemo(() => competitionSummaryText, [competitionSummaryText]);

  const [activeRegion, setActiveRegion] =
    useState<LeagueBrowseRegion>("featured-europe");

  const leaguesByRegion = useMemo(() => {
    const out: Record<LeagueBrowseRegion, LeagueOption[]> = {
      "featured-europe": [],
      "central-eastern-europe": [],
      nordics: [],
    };

    allLeagues.forEach((league) => {
      if (!league.browseRegion) {
        out["featured-europe"].push(league);
        return;
      }
      out[league.browseRegion].push(league);
    });

    LEAGUE_BROWSE_REGION_ORDER.forEach((region) => {
      out[region].sort(
        (a, b) => a.country.localeCompare(b.country) || a.label.localeCompare(b.label)
      );
    });

    return out;
  }, [allLeagues]);

  const toggleLeague = useCallback((leagueId: number) => {
    setSelectedLeagueIds((prev) => {
      const has = prev.includes(leagueId);
      if (has) return prev.filter((x) => x !== leagueId);
      return [...prev, leagueId];
    });
  }, []);

  const selectSingleLeague = useCallback((leagueId: number) => {
    setSelectedLeagueIds([leagueId]);
  }, []);

  const resetToFeatured = useCallback(() => {
    setSelectedLeagueIds([]);
  }, []);

  const selectAllLeagues = useCallback(() => {
    setSelectedLeagueIds([]);
  }, []);

  const clearLeagues = useCallback(() => {
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
  const activeRequestRef = useRef(0);

  const placeholderIds = useMemo(() => computeLikelyPlaceholderTbcIds(rows), [rows]);

  const fetchFrom = effectiveRange.from;
  const fetchTo = effectiveRange.to;

  const fetchLeagueKey = useMemo(() => {
    return fetchLeagues.map((l) => `${l.leagueId}:${l.season}`).join("|");
  }, [fetchLeagues]);

  useEffect(() => {
    let cancelled = false;
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    async function run() {
      const hasExistingRows = rows.length > 0;

      setLoading(true);
      setError(null);
      if (!hasExistingRows) setExpandedKey(null);

      try {
        const batches = await mapLimit(fetchLeagues, DEFAULT_FETCH_CONCURRENCY, async (l) => {
          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from: fetchFrom,
            to: fetchTo,
          });
          return Array.isArray(res) ? res : [];
        });

        if (cancelled || activeRequestRef.current !== requestId) return;

        const flat = batches.flat().filter((r) => r?.fixture?.id != null);

        if (discoverCategory) {
          const scored = buildDiscoverScores(flat);

          const ranked = dedupeByFixtureId(
            scored
              .map((item) => ({
                fixture: item.fixture,
                reasons: item.reasons,
                discoverScore: discoverScoreForCategory(discoverCategory, item, discoverContext),
                kickoffIso: String(item.fixture?.fixture?.date ?? ""),
              }))
              .sort((a, b) => {
                if (b.discoverScore !== a.discoverScore) return b.discoverScore - a.discoverScore;
                return a.kickoffIso.localeCompare(b.kickoffIso);
              })
              .map((x) => ({
                ...(x.fixture as RankedFixtureRow),
                discoverReasons: x.reasons,
              }))
          );

          setRows(ranked);
          return;
        }

        const ranked = dedupeByFixtureId(flat as RankedFixtureRow[]);

        if (topPicksMode) {
          ranked.sort((a, b) => {
            const sa = baseFixtureScore(a);
            const sb = baseFixtureScore(b);
            if (sb !== sa) return sb - sa;
            return String(a?.fixture?.date ?? "").localeCompare(String(b?.fixture?.date ?? ""));
          });
        } else {
          ranked.sort((a, b) =>
            String(a?.fixture?.date ?? "").localeCompare(String(b?.fixture?.date ?? ""))
          );
        }

        setRows(ranked);
      } catch (e: any) {
        if (cancelled || activeRequestRef.current !== requestId) return;
        if (rows.length === 0) setError(e?.message ?? "Failed to load fixtures.");
        else setError(null);
      } finally {
        if (!cancelled && activeRequestRef.current === requestId) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    fetchLeagueKey,
    fetchLeagues,
    fetchFrom,
    fetchTo,
    topPicksMode,
    discoverCategory,
    discoverContext,
    rows.length,
  ]);

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
        norm(r?.fixture?.venue?.name).includes(qNorm) ||
        norm(r?.league?.name).includes(qNorm) ||
        norm((r?.league as any)?.country).includes(qNorm)
      );
    });
  }, [rows, isRange, effectiveRange.from, qNorm]);

  const onToggleFollowFromRow = useCallback(
    (r: RankedFixtureRow) => {
      const fixtureId = r?.fixture?.id != null ? String(r.fixture.id) : "";
      if (!fixtureId) return;

      toggleFollow({
        fixtureId,
        leagueId: r?.league?.id != null ? Number(r.league.id) : 0,
        season: (r as any)?.league?.season != null ? Number((r as any).league.season) : 0,
        homeTeamId: r?.teams?.home?.id != null ? Number(r.teams.home.id) : 0,
        awayTeamId: r?.teams?.away?.id != null ? Number(r.teams.away.id) : 0,
        homeName: r?.teams?.home?.name != null ? String(r.teams.home.name) : null,
        awayName: r?.teams?.away?.name != null ? String(r.teams.away.name) : null,
        leagueName: r?.league?.name != null ? String(r.league.name) : null,
        round: r?.league?.round != null ? String(r.league.round) : null,
        kickoffIso: kickoffIsoOrNull(r),
        venue: r?.fixture?.venue?.name != null ? String(r.fixture.venue.name) : null,
        city: r?.fixture?.venue?.city != null ? String(r.fixture.venue.city) : null,
      });
    },
    [toggleFollow]
  );

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [calMonthYear, setCalMonthYear] = useState(() => {
    const base = parseIsoToUtcParts(selectedDay) ?? parseIsoToUtcParts(minIso) ?? {
      y: 2026,
      m0: 0,
      d: 1,
    };

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
    (iso: string) => !!iso && iso >= calNorm.from && iso <= calNorm.to,
    [calNorm]
  );

  const calIsEdge = useCallback(
    (iso: string) => !!iso && (iso === calNorm.from || iso === calNorm.to),
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
    return "Fixtures";
  }, [discoverCategory]);

  const subtitleText = useMemo(() => {
    if (discoverCategory) return DISCOVER_CATEGORY_META[discoverCategory].subtitle;
    return "Find matches by date, competition or destination.";
  }, [discoverCategory]);

  const helperLineText = useMemo(() => {
    const readableFrom = formatFixtureDateDisplay(effectiveRange.from);
    const readableTo = formatFixtureDateDisplay(effectiveRange.to);
    const datePart = isRange ? `${readableFrom} → ${readableTo}` : readableFrom;

    if (discoverCategory) {
      const base = DISCOVER_CATEGORY_META[discoverCategory].helper;
      const extras: string[] = [];

      if (discoverContext?.tripLength) {
        if (discoverContext.tripLength === "day") extras.push("Day trip");
        if (discoverContext.tripLength === "1") extras.push("1 night");
        if (discoverContext.tripLength === "2") extras.push("2 nights");
        if (discoverContext.tripLength === "3") extras.push("3 nights");
      }

      if (discoverContext?.vibes?.length) extras.push(discoverContext.vibes.join(", "));
      if (discoverContext?.origin) extras.push(`From ${discoverContext.origin}`);

      return [base, datePart, competitionSummaryText, ...extras].join(" • ");
    }

    return `${datePart} • ${competitionSummaryText}`;
  }, [
    discoverCategory,
    isRange,
    effectiveRange,
    discoverContext,
    competitionSummaryText,
  ]);

  const headerDateLine = useMemo(() => {
    if (!isRange) return formatFixtureDateDisplay(effectiveRange.from);
    return `${formatFixtureDateDisplay(effectiveRange.from)} → ${formatFixtureDateDisplay(
      effectiveRange.to
    )}`;
  }, [isRange, effectiveRange]);

  const matchesSummaryTitle = useMemo(() => {
    return `${filtered.length} match${filtered.length === 1 ? "" : "es"} found`;
  }, [filtered.length]);

  const matchesSummaryLine = useMemo(() => {
    return `${headerDateLine} • ${competitionSummaryText}`;
  }, [headerDateLine, competitionSummaryText]);

  return {
    discoverCategory,
    discoverContext,
    topPicksMode,

    selectedDay,
    range,
    effectiveRange,
    isRange,
    stripDays,

    allLeagues,
    selectedLeagueIds,
    selectedLeagues,
    activeRegion,
    setActiveRegion,
    leaguesByRegion,
    toggleLeague,
    selectSingleLeague,
    selectAllLeagues,
    clearLeagues,
    resetToFeatured,
    competitionSummaryText,

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
    matchesSummaryTitle,
    matchesSummaryLine,
    monthLabel,
  };
    }
