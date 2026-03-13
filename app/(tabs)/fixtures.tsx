import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";

import { theme } from "@/src/constants/theme";
import { getBackground } from "@/src/constants/backgrounds";
import {
  LEAGUES,
  FEATURED_LEAGUES,
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
  resolveTripForFixture,
} from "@/src/features/fixtures/helpers";
import FixturesHeader from "@/src/features/fixtures/FixturesHeader";
import FixtureRowCard from "@/src/features/fixtures/FixtureRowCard";
import type { RankedFixtureRow } from "@/src/features/fixtures/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_MULTI_LEAGUES = 10;

/* -------------------------------------------------------------------------- */
/* Concurrency-limited fetch                                                  */
/* -------------------------------------------------------------------------- */

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length) as any;
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

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeFrom = useMemo(() => coerceString((params as any)?.from), [params]);
  const routeTo = useMemo(() => coerceString((params as any)?.to), [params]);
  const discoverCategory = useMemo(
    () => parseDiscoverCategory((params as any)?.discover),
    [params]
  );
  const discoverContext = useMemo(
    () =>
      buildDiscoverContext({
        discoverCategory,
        discoverFrom: (params as any)?.discoverFrom,
        discoverTripLength: (params as any)?.discoverTripLength,
        discoverVibes: (params as any)?.discoverVibes,
      }),
    [params, discoverCategory]
  );

  const routeSort = useMemo(
    () => coerceString((params as any)?.sort) ?? coerceString((params as any)?.mode),
    [params]
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

  const selectedLeagues = useMemo(() => {
    if (selectedLeagueIds.length === 0) return [] as LeagueOption[];
    const set = new Set(selectedLeagueIds);
    return LEAGUES.filter((l) => set.has(l.leagueId));
  }, [selectedLeagueIds]);

  const fetchLeagues = useMemo(() => {
    if (selectedLeagues.length > 0) return selectedLeagues;
    return FEATURED_LEAGUES;
  }, [selectedLeagues]);

  const leagueSubtitle = useMemo(
    () => leagueScopeSubtitle(selectedLeagues),
    [selectedLeagues]
  );

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
  const qNorm = query.trim().toLowerCase();

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

          const ranked: RankedFixtureRow[] = scored
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
              ...x.fixture,
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
  }, [
    fetchLeagues,
    fetchFrom,
    fetchTo,
    topPicksMode,
    discoverCategory,
    discoverContext,
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
        norm(r?.fixture?.venue?.name).includes(qNorm) ||
        norm(r?.fixture?.venue?.city).includes(qNorm) ||
        norm(r?.league?.name).includes(qNorm)
      );
    });
  }, [rows, isRange, effectiveRange.from, qNorm]);

  const goMatch = useCallback(
    (id: string, ctx?: { leagueId?: number | null; season?: number | null }) => {
      const fid = String(id ?? "").trim();
      if (!fid) return;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: fid,
          from: effectiveRange.from,
          to: effectiveRange.to,
          ...(ctx?.leagueId ? { leagueId: String(ctx.leagueId) } : {}),
          ...(ctx?.season ? { season: String(ctx.season) } : {}),
        },
      } as any);
    },
    [router, effectiveRange.from, effectiveRange.to]
  );

  const goTripOrBuild = useCallback(
    (fixtureId: string, ctx?: { leagueId?: number | null; season?: number | null }) => {
      const fid = String(fixtureId ?? "").trim();
      if (!fid) return;

      const existingTripId = resolveTripForFixture(fid);

      if (existingTripId) {
        router.push({ pathname: "/trip/[id]", params: { id: existingTripId } } as any);
        return;
      }

      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId: fid,
          from: effectiveRange.from,
          to: effectiveRange.to,
          ...(ctx?.leagueId ? { leagueId: String(ctx.leagueId) } : {}),
          ...(ctx?.season ? { season: String(ctx.season) } : {}),
        },
      } as any);
    },
    [router, effectiveRange.from, effectiveRange.to]
  );

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
    if (discoverCategory) {
      const base = DISCOVER_CATEGORY_META[discoverCategory].helper;
      const datePart = isRange
        ? `${effectiveRange.from} → ${effectiveRange.to}`
        : effectiveRange.from;
      const scopePart =
        selectedLeagueIds.length > 0
          ? `${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues`
          : "Featured scope";

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
      isRange
        ? `Range • ${effectiveRange.from} → ${effectiveRange.to}`
        : `Day • ${effectiveRange.from}`
    }${
      selectedLeagueIds.length > 0
        ? ` • ${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues`
        : " • Featured scope"
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
      const d = new Date(`${effectiveRange.from}T00:00:00.000Z`);
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return `${effectiveRange.from} → ${effectiveRange.to}`;
  }, [isRange, effectiveRange]);

  const bg = getBackground("fixtures");
  const bgProps =
    typeof bg === "string"
      ? ({ imageUrl: bg } as const)
      : ({ imageSource: bg } as const);

  return (
    <Background {...bgProps} overlayOpacity={0}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <FlatList
          data={loading || error ? [] : filtered}
          keyExtractor={(item, index) => {
            const fid =
              item?.fixture?.id != null ? String(item.fixture.id) : `row-${index}`;
            const lid = item?.league?.id != null ? String(item.league.id) : "L";
            return `${lid}-${fid}`;
          }}
          renderItem={({ item }) => {
            const fixtureId = item?.fixture?.id != null ? String(item.fixture.id) : "";
            const rowKey = `${String(item?.league?.id ?? "L")}-${fixtureId}`;
            const expanded = expandedKey === rowKey;
            const isFollowed = followedIdSet.has(fixtureId);

            return (
              <FixtureRowCard
                item={item}
                expanded={expanded}
                isFollowed={isFollowed}
                placeholderIds={placeholderIds}
                onToggleExpanded={() => setExpandedKey(expanded ? null : rowKey)}
                onToggleFollow={() => onToggleFollowFromRow(item)}
                onPressMatch={goMatch}
                onPressBuildTrip={goTripOrBuild}
              />
            );
          }}
          ListHeaderComponent={
            <FixturesHeader
              titleText={titleText}
              subtitleText={subtitleText}
              headerDateLine={headerDateLine}
              query={query}
              setQuery={setQuery}
              stripDays={stripDays}
              isRange={isRange}
              selectedDay={selectedDay}
              onTapStripDate={onTapStripDate}
              selectedLeagueIds={selectedLeagueIds}
              resetToFeatured={resetToFeatured}
              selectSingleLeague={selectSingleLeague}
              activeRegion={activeRegion}
              setActiveRegion={setActiveRegion}
              leaguesByRegion={leaguesByRegion}
              toggleLeague={toggleLeague}
              selectedLeagues={selectedLeagues}
              helperLineText={helperLineText}
              loading={loading}
              error={error}
              filteredCount={filtered.length}
              openCalendar={openCalendar}
            />
          }
          ListEmptyComponent={
            <View style={[styles.content, styles.listWrap]}>
              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!loading && error ? (
                <EmptyState title="Error" message={error} iconName="alert-circle" />
              ) : null}

              {!loading && !error ? (
                <EmptyState
                  title="No matches found"
                  message="Try another date, another region, or a different league selection."
                  iconName="search"
                />
              ) : null}
            </View>
          }
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        />

        <Modal
          visible={calendarOpen}
          animationType="fade"
          transparent
          onRequestClose={closeCalendar}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeCalendar} />
          <View style={styles.modalWrap} pointerEvents="box-none">
            <GlassCard level="strong" variant="glass" forceBlur style={styles.modalSheet}>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select dates</Text>
                  <Button label="Close" tone="ghost" size="sm" onPress={closeCalendar} />
                </View>

                <Text style={styles.modalSub}>
                  {calIsRange ? `Range: ${calNorm.from} → ${calNorm.to}` : `Day: ${calNorm.from}`}
                </Text>

                <View style={styles.calHeaderRow}>
                  <Pressable onPress={calPrevMonth} style={styles.calNavBtn} hitSlop={10}>
                    <Text style={styles.calNavText}>‹</Text>
                  </Pressable>

                  <Text style={styles.calMonthText}>
                    {monthLabel(calMonthYear.y, calMonthYear.m0)}
                  </Text>

                  <Pressable onPress={calNextMonth} style={styles.calNavBtn} hitSlop={10}>
                    <Text style={styles.calNavText}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.calWeekRow}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                    <Text key={w} style={styles.calWeekText}>
                      {w}
                    </Text>
                  ))}
                </View>

                <View style={styles.calGrid}>
                  {calGrid.map((c, idx) => {
                    if (!c.inMonth) {
                      return <View key={`e-${idx}`} style={styles.calCell} />;
                    }

                    const iso = c.iso;
                    const disabled = iso < minIso || iso > maxIso;
                    const inSel = !disabled && calInRange(iso);
                    const edge = !disabled && calIsEdge(iso);

                    return (
                      <Pressable
                        key={iso}
                        disabled={disabled}
                        onPress={() => onCalendarTapDay(iso)}
                        style={[
                          styles.calCell,
                          styles.calDayBtn,
                          inSel && styles.calDayInRange,
                          edge && styles.calDayEdge,
                          disabled && { opacity: 0.35 },
                        ]}
                      >
                        <Text style={[styles.calDayText, edge && styles.calDayTextEdge]}>
                          {c.day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.modalActions}>
                  <Button
                    label="Clear range"
                    tone="secondary"
                    size="md"
                    onPress={clearCalendarRange}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Apply"
                    tone="primary"
                    size="md"
                    glow
                    onPress={applyCalendar}
                    style={{ flex: 1 }}
                  />
                </View>

                <Text style={styles.modalFootnote}>
                  Tip: tap two different days to set a range. Tap again to reset back to a single day.
                </Text>
              </View>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  flatListContent: {
    paddingBottom: theme.spacing.xl,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
  },

  listWrap: {
    gap: 12,
  },

  center: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  modalWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalSheet: {
    borderRadius: 22,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  modalInner: {
    padding: 14,
    gap: 12,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h2,
    fontWeight: theme.fontWeight.semibold,
  },

  modalSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
  },

  calHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },

  calNavText: {
    color: theme.colors.textSecondary,
    fontSize: 20,
    fontWeight: theme.fontWeight.semibold,
    marginTop: -2,
  },

  calMonthText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
  },

  calWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },

  calWeekText: {
    width: "14.285%",
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
  },

  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  calCell: {
    width: "14.285%",
    aspectRatio: 1,
    padding: 4,
  },

  calDayBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },

  calDayInRange: {
    backgroundColor: "rgba(87,162,56,0.06)",
  },

  calDayEdge: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.12)",
  },

  calDayText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 12,
  },

  calDayTextEdge: {
    color: theme.colors.textPrimary,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  modalFootnote: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    lineHeight: 16,
  },
});
