// app/(tabs)/fixtures.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import { LEAGUES, type LeagueOption } from "@/src/constants/football";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getFlagImageUrl } from "@/src/utils/flagImages";

import tripsStore from "@/src/state/trips";
import useFollowStore from "@/src/state/followStore";
import { computeLikelyPlaceholderTbcIds, isKickoffTbc, kickoffIsoOrNull } from "@/src/utils/kickoffTbc";

import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";

/* -------------------------------------------------------------------------- */
/* Constants */
/* -------------------------------------------------------------------------- */

const DAYS_AHEAD = 365;
const MAX_MULTI_LEAGUES = 10;

/* -------------------------------------------------------------------------- */
/* Param helpers */
/* -------------------------------------------------------------------------- */

function coerceString(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function coerceNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* -------------------------------------------------------------------------- */
/* UTC-safe date helpers (prevents DST duplication) */
/* -------------------------------------------------------------------------- */

function isoFromUtcParts(y: number, m0: number, d: number) {
  const ms = Date.UTC(y, m0, d, 0, 0, 0, 0);
  return new Date(ms).toISOString().slice(0, 10);
}

function utcTodayIso() {
  const now = new Date();
  return isoFromUtcParts(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function addDaysIsoUtc(iso: string, days: number) {
  const base = new Date(`${iso}T00:00:00.000Z`);
  const ms = base.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function tomorrowIsoUtc() {
  return addDaysIsoUtc(utcTodayIso(), 1);
}

function clampIsoToWindow(iso: string, minIso: string, maxIso: string) {
  const s = String(iso ?? "").trim();
  if (!s) return minIso;
  if (s < minIso) return minIso;
  if (s > maxIso) return maxIso;
  return s;
}

function normalizeRange(fromIso: string, toIso: string) {
  const a = String(fromIso ?? "").trim();
  const b = String(toIso ?? "").trim();
  if (!a) return { from: b, to: b };
  if (!b) return { from: a, to: a };
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

function formatIsoForHeader(iso: string) {
  // iso: YYYY-MM-DD (UTC)
  const d = new Date(`${iso}T00:00:00.000Z`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function monthTitle(y: number, m0: number) {
  const d = new Date(Date.UTC(y, m0, 1));
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function daysInMonthUtc(y: number, m0: number) {
  // day 0 of next month is last day of this month
  return new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
}

function weekdayMon0Utc(y: number, m0: number, d: number) {
  // JS: 0=Sun..6=Sat; we want Mon=0..Sun=6
  const js = new Date(Date.UTC(y, m0, d)).getUTCDay();
  return (js + 6) % 7;
}

/* -------------------------------------------------------------------------- */
/* Ticket badge helpers */
/* -------------------------------------------------------------------------- */

function ticketDifficultyLabel(d: TicketDifficulty) {
  switch (d) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "very_hard":
      return "Very hard";
  }
}

/* -------------------------------------------------------------------------- */
/* Fixture helpers */
/* -------------------------------------------------------------------------- */

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const iso = kickoffIsoOrNull(r);
  if (!iso) return null;
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

/**
 * UI label:
 * - If likely placeholder (clustered), show "Likely TBC" but keep the provisional time as secondary text.
 * - If no kickoff, show "TBC".
 * - Else show the formatted kickoff.
 */
function kickoffPresentation(r: FixtureListRow, placeholderIds?: Set<string>) {
  const likelyTbc = isKickoffTbc(r, placeholderIds);
  const iso = kickoffIsoOrNull(r);

  if (!iso) {
    return { primary: "TBC", secondary: "Kickoff time not set yet", likelyTbc: true };
  }

  const formatted = formatUkDateTimeMaybe(iso) || "TBC";

  if (likelyTbc) {
    return {
      primary: formatted,
      secondary: "Likely placeholder (TV schedule not confirmed)",
      likelyTbc: true,
    };
  }

  return { primary: formatted, secondary: null as string | null, likelyTbc: false };
}

/**
 * If a fixture already belongs to an existing trip, route to that trip workspace.
 */
function resolveTripForFixture(fixtureId: string): string | null {
  const trips = tripsStore.getState().trips;
  const hit = trips.find((t) => (t.matchIds ?? []).includes(String(fixtureId)));
  return hit ? String(hit.id) : null;
}

/* -------------------------------------------------------------------------- */
/* League UI helpers */
/* -------------------------------------------------------------------------- */

function LeagueFlag({ code }: { code: string }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flag} />;
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function TeamCrest({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Concurrency-limited fetch (protects perf + rate limits) */
/* -------------------------------------------------------------------------- */

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
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

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 365-day strip starting TOMORROW (never show today)
  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  // Optional route overrides: leagueId, from, to
  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeFrom = useMemo(() => coerceString((params as any)?.from), [params]);
  const routeTo = useMemo(() => coerceString((params as any)?.to), [params]);

  // LiveScore-style: strip selects a SINGLE date only.
  // Range exists only if user applies it from the calendar modal.
  const initialDay = useMemo(() => clampIsoToWindow(routeFrom ?? minIso, minIso, maxIso), [routeFrom, minIso, maxIso]);

  const [selectedDayIso, setSelectedDayIso] = useState<string>(initialDay);

  // Applied range (calendar only). Empty => no range.
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(() => {
    const rf = routeFrom ? clampIsoToWindow(routeFrom, minIso, maxIso) : null;
    const rt = routeTo ? clampIsoToWindow(routeTo, minIso, maxIso) : null;
    if (rf && rt && rf !== rt) return normalizeRange(rf, rt);
    return null;
  });

  // Build the 365-day strip
  const dateStrip = useMemo(() => {
    return Array.from({ length: DAYS_AHEAD }).map((_, i) => {
      const iso = addDaysIsoUtc(minIso, i);
      const d = new Date(`${iso}T00:00:00.000Z`);
      return {
        iso,
        labelTop: d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
        labelBottom: d.toLocaleDateString("en-GB", { day: "2-digit" }),
      };
    });
  }, [minIso]);

  // Leagues: multi-select up to 10, default = All (empty array => all leagues)
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<number[]>(() => {
    if (routeLeagueId && Number.isFinite(routeLeagueId)) return [routeLeagueId];
    return [];
  });

  const leagueSubtitle = useMemo(() => {
    if (selectedLeagueIds.length === 0) return "All leagues";
    if (selectedLeagueIds.length === 1) {
      const one = LEAGUES.find((l) => l.leagueId === selectedLeagueIds[0]);
      return one?.label ?? "1 league selected";
    }
    return `${selectedLeagueIds.length} leagues selected`;
  }, [selectedLeagueIds]);

  const selectedLeagues: LeagueOption[] = useMemo(() => {
    if (selectedLeagueIds.length === 0) return LEAGUES;
    const set = new Set(selectedLeagueIds);
    return LEAGUES.filter((l) => set.has(l.leagueId));
  }, [selectedLeagueIds]);

  const toggleLeague = useCallback((leagueId: number) => {
    setSelectedLeagueIds((prev) => {
      const has = prev.includes(leagueId);
      if (has) return prev.filter((x) => x !== leagueId);

      if (prev.length >= MAX_MULTI_LEAGUES) {
        Alert.alert("Max leagues reached", `You can select up to ${MAX_MULTI_LEAGUES} leagues at once.`);
        return prev;
      }

      return [...prev, leagueId];
    });
  }, []);

  const setAllLeagues = useCallback(() => {
    setSelectedLeagueIds([]);
  }, []);

  // Follow state (fast lookup)
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

  // Search
  const [query, setQuery] = useState("");
  const qNorm = query.trim().toLowerCase();

  // Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Calendar modal state (selection happens here, applied only when user taps Apply)
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState<number>(() => new Date(`${selectedDayIso}T00:00:00.000Z`).getUTCFullYear());
  const [calMonth0, setCalMonth0] = useState<number>(() => new Date(`${selectedDayIso}T00:00:00.000Z`).getUTCMonth());

  const [calDraftStart, setCalDraftStart] = useState<string>(() => selectedDayIso);
  const [calDraftEnd, setCalDraftEnd] = useState<string>(() => selectedDayIso);

  const calDraftNorm = useMemo(() => normalizeRange(calDraftStart, calDraftEnd), [calDraftStart, calDraftEnd]);
  const calIsRangeDraft = useMemo(() => calDraftNorm.from !== calDraftNorm.to, [calDraftNorm]);

  const openCalendar = useCallback(() => {
    const anchorIso = appliedRange?.from ?? selectedDayIso;
    const d = new Date(`${anchorIso}T00:00:00.000Z`);
    setCalYear(d.getUTCFullYear());
    setCalMonth0(d.getUTCMonth());

    if (appliedRange) {
      setCalDraftStart(appliedRange.from);
      setCalDraftEnd(appliedRange.to);
    } else {
      setCalDraftStart(selectedDayIso);
      setCalDraftEnd(selectedDayIso);
    }

    setCalendarOpen(true);
  }, [appliedRange, selectedDayIso]);

  const calCells = useMemo(() => {
    const firstW = weekdayMon0Utc(calYear, calMonth0, 1); // 0..6 (Mon..Sun)
    const dim = daysInMonthUtc(calYear, calMonth0);

    const cells: Array<{ iso: string | null; day: number | null }> = [];
    for (let i = 0; i < firstW; i++) cells.push({ iso: null, day: null });
    for (let day = 1; day <= dim; day++) {
      const iso = isoFromUtcParts(calYear, calMonth0, day);
      cells.push({ iso, day });
    }
    while (cells.length % 7 !== 0) cells.push({ iso: null, day: null });
    return cells;
  }, [calYear, calMonth0]);

  const calInDraftRange = useCallback(
    (iso: string) => {
      const a = calDraftNorm.from;
      const b = calDraftNorm.to;
      return iso >= a && iso <= b;
    },
    [calDraftNorm.from, calDraftNorm.to]
  );

  const calIsDraftEdge = useCallback(
    (iso: string) => iso === calDraftNorm.from || iso === calDraftNorm.to,
    [calDraftNorm.from, calDraftNorm.to]
  );

  const onCalDayPress = useCallback(
    (iso: string) => {
      const d = clampIsoToWindow(iso, minIso, maxIso);

      // Draft selection logic:
      // - If start=end (single selected), next tap sets end (range).
      // - If already a range, next tap starts a new selection (single).
      if (calDraftStart === calDraftEnd) {
        setCalDraftEnd(d);
        return;
      }

      setCalDraftStart(d);
      setCalDraftEnd(d);
    },
    [calDraftStart, calDraftEnd, minIso, maxIso]
  );

  const applyCalendarSelection = useCallback(() => {
    const normed = normalizeRange(calDraftStart, calDraftEnd);
    const isRange = normed.from !== normed.to;

    if (isRange) {
      setAppliedRange({ from: normed.from, to: normed.to });
      // Keep strip in a sane place: set selected day to start of range
      setSelectedDayIso(normed.from);
    } else {
      setAppliedRange(null);
      setSelectedDayIso(normed.from);
    }

    setCalendarOpen(false);
  }, [calDraftStart, calDraftEnd]);

  const clearAppliedRange = useCallback(() => {
    setAppliedRange(null);
  }, []);

  const prevMonth = useCallback(() => {
    let y = calYear;
    let m = calMonth0 - 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    setCalYear(y);
    setCalMonth0(m);
  }, [calYear, calMonth0]);

  const nextMonth = useCallback(() => {
    let y = calYear;
    let m = calMonth0 + 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalYear(y);
    setCalMonth0(m);
  }, [calYear, calMonth0]);

  // Compute fetch window (range if applied, else single day)
  const fetchFrom = appliedRange?.from ?? selectedDayIso;
  const fetchTo = appliedRange?.to ?? selectedDayIso;
  const isRangeApplied = useMemo(() => !!appliedRange && appliedRange.from !== appliedRange.to, [appliedRange]);

  // Compute placeholder ids from the fetched set (works for single day or ranges)
  const placeholderIds = useMemo(() => computeLikelyPlaceholderTbcIds(rows), [rows]);

  // Fetch whenever leagues or window changes
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRows([]);
      setExpandedKey(null);

      try {
        const batches = await mapLimit(selectedLeagues, 4, async (l) => {
          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from: fetchFrom,
            to: fetchTo,
          });
          return Array.isArray(res) ? res : [];
        });

        if (cancelled) return;

        const flat = batches.flat();

        flat.sort((a, b) => {
          const da = String(a?.fixture?.date ?? "");
          const db = String(b?.fixture?.date ?? "");
          return da.localeCompare(db);
        });

        setRows(flat);
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
  }, [selectedLeagues, fetchFrom, fetchTo]);

  const filtered = useMemo(() => {
    const base = rows;

    // Defensive: if NOT range mode, only keep selected day
    const dayFiltered = !isRangeApplied ? base.filter((r) => fixtureIsoDateOnly(r) === selectedDayIso) : base;

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
  }, [rows, isRangeApplied, selectedDayIso, qNorm]);

  const onToggleFollowFromRow = useCallback(
    (r: FixtureListRow) => {
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

  function goMatch(id: string, ctx?: { leagueId?: number | null; season?: number | null }) {
    const fid = String(id ?? "").trim();
    if (!fid) return;

    router.push({
      pathname: "/match/[id]",
      params: {
        id: fid,
        from: fetchFrom,
        to: fetchTo,
        ...(ctx?.leagueId ? { leagueId: String(ctx.leagueId) } : {}),
        ...(ctx?.season ? { season: String(ctx.season) } : {}),
      },
    } as any);
  }

  function goTripOrBuild(fixtureId: string, ctx?: { leagueId?: number | null; season?: number | null }) {
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
        from: fetchFrom,
        to: fetchTo,
        ...(ctx?.leagueId ? { leagueId: String(ctx.leagueId) } : {}),
        ...(ctx?.season ? { season: String(ctx.season) } : {}),
      },
    } as any);
  }

  const renderRow = (r: FixtureListRow) => {
    const fixtureId = r?.fixture?.id != null ? String(r.fixture.id) : "";
    if (!fixtureId) return null;

    const leagueIdStr = r?.league?.id != null ? String(r.league.id) : "L";
    const rowKey = `${leagueIdStr}-${fixtureId}`;
    const expanded = expandedKey === rowKey;

    const home = String(r?.teams?.home?.name ?? "Home");
    const away = String(r?.teams?.away?.name ?? "Away");

    const venue = r?.fixture?.venue?.name ?? "";
    const city = r?.fixture?.venue?.city ?? "";

    const kickoff = kickoffPresentation(r, placeholderIds);
    const isFollowed = followedIdSet.has(fixtureId);

    const ctxLeagueId = r?.league?.id != null ? Number(r.league.id) : null;
    const ctxSeason = (r as any)?.league?.season != null ? Number((r as any).league.season) : null;

    // IMPORTANT: home-club difficulty only (no away ticket messaging)
    const ticketDifficulty = home ? getTicketDifficultyBadge(home) : null;

    return (
      <View key={rowKey} style={styles.rowWrap}>
        <GlassCard noPadding style={styles.rowCard} strength="subtle">
          <View style={styles.rowMain}>
            <View style={styles.rowInner}>
              <TeamCrest name={home} logo={r?.teams?.home?.logo} />

              <Pressable
                onPress={() => setExpandedKey(expanded ? null : rowKey)}
                style={({ pressed }) => [styles.centerPress, { opacity: pressed ? 0.88 : 1 }]}
              >
                <View style={styles.centerBlock}>
                  <Text style={styles.teamLine} numberOfLines={1}>
                    {home}
                  </Text>
                  <Text style={styles.vs}>vs</Text>
                  <Text style={styles.teamLine} numberOfLines={1}>
                    {away}
                  </Text>

                  <View style={styles.metaStack}>
                    <Text style={styles.meta} numberOfLines={2}>
                      {kickoff.primary}
                      {venue || city ? ` • ${[venue, city].filter(Boolean).join(" • ")}` : ""}
                    </Text>

                    {kickoff.secondary ? (
                      <Text style={styles.metaSecondary} numberOfLines={1}>
                        {kickoff.secondary}
                      </Text>
                    ) : null}

                    <View style={styles.badgeRow}>
                      {kickoff.likelyTbc ? (
                        <View style={[styles.badge, styles.badgeWarn]}>
                          <Text style={[styles.badgeText, styles.badgeTextWarn]}>Likely TBC</Text>
                        </View>
                      ) : (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Confirmed</Text>
                        </View>
                      )}

                      {ticketDifficulty ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Home tickets: {ticketDifficultyLabel(ticketDifficulty)}</Text>
                        </View>
                      ) : null}

                      <Text style={styles.tapHint}>Tap for actions</Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              <View style={styles.rightCol}>
                <TeamCrest name={away} logo={r?.teams?.away?.logo} />

                <Pressable
                  onPress={() => onToggleFollowFromRow(r)}
                  style={({ pressed }) => [
                    styles.followPill,
                    isFollowed && styles.followPillOn,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={[styles.followPillText, isFollowed && styles.followPillTextOn]}>
                    {isFollowed ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {expanded ? (
            <View style={styles.expandArea}>
              <Pressable onPress={() => goMatch(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })} style={styles.expandGhost}>
                <Text style={styles.expandGhostText}>Match</Text>
              </Pressable>

              <Pressable onPress={() => goTripOrBuild(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })} style={styles.expandPrimary}>
                <Text style={styles.expandPrimaryText}>Build trip</Text>
              </Pressable>
            </View>
          ) : null}
        </GlassCard>
      </View>
    );
  };

  const headerWindowLabel = useMemo(() => {
    if (isRangeApplied && appliedRange) return `${formatIsoForHeader(appliedRange.from)} → ${formatIsoForHeader(appliedRange.to)}`;
    return formatIsoForHeader(selectedDayIso);
  }, [isRangeApplied, appliedRange, selectedDayIso]);

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.82}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>{leagueSubtitle}</Text>
            </View>

            <Pressable onPress={openCalendar} style={({ pressed }) => [styles.calBtn, pressed && { opacity: 0.9 }]}>
              <Text style={styles.calIcon}>📅</Text>
              <Text style={styles.calBtnText}>Calendar</Text>
            </Pressable>
          </View>

          <Text style={styles.windowLine}>{headerWindowLabel}</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search team, city, venue, or league"
            placeholderTextColor={theme.colors.textTertiary}
            style={styles.search}
          />

          {/* Date strip: SINGLE DATE ONLY */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            {dateStrip.map((d, i) => {
              const active = d.iso === selectedDayIso;
              return (
                <Pressable
                  key={`${d.iso}-${i}`}
                  onPress={() => setSelectedDayIso(d.iso)}
                  style={[styles.datePill, active && styles.datePillActive]}
                >
                  <Text style={[styles.dateTop, active && styles.dateTopActive]}>{d.labelTop}</Text>
                  <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>{d.labelBottom}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Leagues: All + multi-select */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            <Pressable onPress={setAllLeagues} style={[styles.leaguePill, selectedLeagueIds.length === 0 && styles.leaguePillActive]}>
              <Text style={[styles.leagueText, selectedLeagueIds.length === 0 && styles.leagueTextActive]}>All leagues</Text>
            </Pressable>

            {LEAGUES.map((l) => {
              const selected = selectedLeagueIds.length === 0 ? false : selectedLeagueIds.includes(l.leagueId);
              return (
                <Pressable
                  key={`league-${l.leagueId}`}
                  onPress={() => toggleLeague(l.leagueId)}
                  style={[styles.leaguePill, selected && styles.leaguePillActive]}
                >
                  <Text style={[styles.leagueText, selected && styles.leagueTextActive]}>{l.label}</Text>
                  <LeagueFlag code={l.countryCode} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.helperRow}>
            <Text style={styles.helperLine}>
              {isRangeApplied ? `Range active • ${fetchFrom} → ${fetchTo}` : `Day • ${selectedDayIso}`}
              {selectedLeagueIds.length ? ` • ${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues` : ""}
            </Text>

            {isRangeApplied ? (
              <Pressable onPress={clearAppliedRange} style={({ pressed }) => [styles.clearRange, pressed && { opacity: 0.9 }]}>
                <Text style={styles.clearRangeText}>Clear range</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassCard style={styles.card} strength="default">
            {loading && (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            )}

            {!loading && error && <EmptyState title="Error" message={error} />}

            {!loading && !error && filtered.length === 0 && (
              <EmptyState title="No matches found" message="Try another date, open Calendar for a range, or change league selection." />
            )}

            {!loading && !error && filtered.map(renderRow)}
          </GlassCard>
        </ScrollView>

        {/* Calendar modal (range selection lives here) */}
        <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCalendarOpen(false)} />
          <View style={styles.modalSheetWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select dates</Text>
                  <Pressable onPress={() => setCalendarOpen(false)} style={styles.modalClose} hitSlop={10}>
                    <Text style={styles.modalCloseText}>Done</Text>
                  </Pressable>
                </View>

                <View style={styles.calHeaderRow}>
                  <Pressable onPress={prevMonth} style={styles.navBtn}>
                    <Text style={styles.navBtnText}>‹</Text>
                  </Pressable>

                  <Text style={styles.calMonthTitle}>{monthTitle(calYear, calMonth0)}</Text>

                  <Pressable onPress={nextMonth} style={styles.navBtn}>
                    <Text style={styles.navBtnText}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.weekRow}>
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((w) => (
                    <Text key={w} style={styles.weekCell}>
                      {w}
                    </Text>
                  ))}
                </View>

                <View style={styles.grid}>
                  {calCells.map((c, idx) => {
                    if (!c.iso) return <View key={`e-${idx}`} style={styles.dayCellEmpty} />;

                    const disabled = c.iso < minIso || c.iso > maxIso;
                    const inRange = !disabled && calInDraftRange(c.iso);
                    const edge = !disabled && calIsDraftEdge(c.iso);

                    return (
                      <Pressable
                        key={c.iso}
                        disabled={disabled}
                        onPress={() => onCalDayPress(c.iso!)}
                        style={[
                          styles.dayCell,
                          inRange && styles.dayCellInRange,
                          edge && styles.dayCellEdge,
                          disabled && { opacity: 0.35 },
                        ]}
                      >
                        <Text style={styles.dayText}>{String(c.day)}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.rangeSummary}>
                  <Text style={styles.rangeSummaryText}>
                    {calIsRangeDraft
                      ? `Draft range: ${calDraftNorm.from} → ${calDraftNorm.to}`
                      : `Draft day: ${calDraftNorm.from}`}
                  </Text>
                  <Text style={styles.rangeSummaryHint}>Tap once for a day. Tap again to set an end date.</Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      setCalDraftStart(selectedDayIso);
                      setCalDraftEnd(selectedDayIso);
                    }}
                    style={[styles.btn, styles.btnGhost]}
                  >
                    <Text style={styles.btnGhostText}>Reset</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setCalDraftStart(selectedDayIso);
                      setCalDraftEnd(selectedDayIso);
                      setAppliedRange(null);
                      setCalendarOpen(false);
                    }}
                    style={[styles.btn, styles.btnGhost]}
                  >
                    <Text style={styles.btnGhostText}>Single day</Text>
                  </Pressable>

                  <Pressable onPress={applyCalendarSelection} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Apply</Text>
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    padding: theme.spacing.lg,
    gap: 12,
  },

  headerTop: { flexDirection: "row", alignItems: "center", gap: 10 },

  title: { color: theme.colors.text, fontSize: 22, fontWeight: "800" },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: "700" },

  windowLine: { color: theme.colors.textTertiary, fontSize: 12, marginTop: -6, fontWeight: "800" },

  calBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  calIcon: { fontSize: 14, opacity: 0.95 },
  calBtnText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  helperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  helperLine: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: "800", flex: 1 },

  clearRange: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  clearRangeText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  search: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    backgroundColor: "rgba(0,0,0,0.14)",
    fontWeight: "800",
  },

  // LiveScore-ish date pill
  datePill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    minWidth: 58,
  },
  datePillActive: {
    borderColor: "rgba(79,224,138,0.40)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },

  dateTop: { color: theme.colors.textTertiary, fontSize: 11, fontWeight: "900" },
  dateTopActive: { color: "rgba(79,224,138,0.88)" },
  dateBottom: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },
  dateBottomActive: { color: theme.colors.text },

  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.08)",
  },
  leagueText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  leagueTextActive: { color: theme.colors.text },

  content: { padding: theme.spacing.lg },
  card: { padding: theme.spacing.md },

  rowWrap: { marginBottom: 10 },
  rowCard: { borderRadius: 18 },

  rowInner: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  crestWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestImg: { width: 30, height: 30, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontWeight: "900" },

  centerPress: { flex: 1 },
  centerBlock: { alignItems: "center", gap: 6 },

  teamLine: { color: theme.colors.text, fontSize: 15, fontWeight: "900" },
  vs: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "900" },

  metaStack: { alignItems: "center", gap: 6 },
  meta: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "center", fontWeight: "800" },
  metaSecondary: { color: theme.colors.textTertiary, fontSize: 11, textAlign: "center", fontWeight: "900" },

  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  badgeWarn: {
    borderColor: "rgba(255,210,77,0.30)",
    backgroundColor: "rgba(255,210,77,0.10)",
  },
  badgeText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11 },
  badgeTextWarn: { color: "rgba(255,210,77,0.92)" },

  tapHint: { color: theme.colors.textTertiary, fontSize: 11, fontWeight: "900" },

  rightCol: { alignItems: "center", gap: 8 },

  followPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
  },
  followPillOn: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  followPillText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11 },
  followPillTextOn: { color: "rgba(79,224,138,0.92)" },

  expandArea: { flexDirection: "row", gap: 10, padding: 12 },

  expandGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  expandGhostText: { color: theme.colors.textSecondary, fontWeight: "900" },

  expandPrimary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.40)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  expandPrimaryText: { color: theme.colors.text, fontWeight: "900" },

  center: { paddingVertical: 20, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: "800" },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  // Modal / calendar
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  modalSheetWrap: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderRadius: 22, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, overflow: "hidden" },
  modalInner: { padding: 14, gap: 12 },

  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },
  modalClose: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  modalCloseText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "900" },

  calHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calMonthTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },

  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  navBtnText: { color: theme.colors.textSecondary, fontSize: 20, fontWeight: "900", marginTop: -2 },

  weekRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 },
  weekCell: { width: "14.28%", textAlign: "center", color: theme.colors.textTertiary, fontWeight: "900", fontSize: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCellEmpty: { width: "14.28%", aspectRatio: 1, marginVertical: 2 },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    marginVertical: 2,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  dayCellInRange: {
    borderColor: "rgba(79,224,138,0.22)",
    backgroundColor: "rgba(79,224,138,0.08)",
  },
  dayCellEdge: {
    borderColor: "rgba(79,224,138,0.45)",
    backgroundColor: "rgba(79,224,138,0.12)",
  },
  dayText: { color: theme.colors.text, fontWeight: "900" },

  rangeSummary: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  rangeSummaryText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  rangeSummaryHint: { color: theme.colors.textTertiary, fontWeight: "800", fontSize: 12 },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  btnPrimary: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.12)",
  },
  btnPrimaryText: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: "900" },
});
