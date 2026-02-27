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
/* Param helpers
 * -------------------------------------------------------------------------- */

function coerceString(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function coerceNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* -------------------------------------------------------------------------- */
/* UTC-safe ISO helpers
 * -------------------------------------------------------------------------- */

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

function formatIsoHuman(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

/* -------------------------------------------------------------------------- */
/* Ticket badge helpers
 * -------------------------------------------------------------------------- */

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
/* Fixture helpers
 * -------------------------------------------------------------------------- */

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const iso = kickoffIsoOrNull(r);
  if (!iso) return null;
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

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

function resolveTripForFixture(fixtureId: string): string | null {
  const trips = tripsStore.getState().trips;
  const hit = trips.find((t) => (t.matchIds ?? []).includes(String(fixtureId)));
  return hit ? String(hit.id) : null;
}

/* -------------------------------------------------------------------------- */
/* League UI helpers
 * -------------------------------------------------------------------------- */

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
/* Concurrency-limited fetch
 * -------------------------------------------------------------------------- */

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
/* Calendar helpers (UTC month grid)
 * -------------------------------------------------------------------------- */

function isoToUtcDate(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function utcPartsFromIso(iso: string) {
  const d = isoToUtcDate(iso);
  return { y: d.getUTCFullYear(), m0: d.getUTCMonth(), day: d.getUTCDate() };
}

function daysInUtcMonth(y: number, m0: number) {
  // day 0 of next month = last day of this month
  return new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
}

function utcWeekdayMon0(y: number, m0: number, day: number) {
  // JS: 0=Sun..6=Sat. We want 0=Mon..6=Sun
  const js = new Date(Date.UTC(y, m0, day)).getUTCDay();
  return (js + 6) % 7;
}

type CalCell = { iso: string; day: number; inMonth: boolean };

function buildMonthGrid(y: number, m0: number): CalCell[] {
  const firstWeekday = utcWeekdayMon0(y, m0, 1);
  const dim = daysInUtcMonth(y, m0);

  const prevM0 = m0 === 0 ? 11 : m0 - 1;
  const prevY = m0 === 0 ? y - 1 : y;
  const prevDim = daysInUtcMonth(prevY, prevM0);

  const cells: CalCell[] = [];

  // leading
  for (let i = 0; i < firstWeekday; i++) {
    const day = prevDim - (firstWeekday - 1 - i);
    const iso = isoFromUtcParts(prevY, prevM0, day);
    cells.push({ iso, day, inMonth: false });
  }

  // current
  for (let d = 1; d <= dim; d++) {
    const iso = isoFromUtcParts(y, m0, d);
    cells.push({ iso, day: d, inMonth: true });
  }

  // trailing to fill 6 rows (42)
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    const next = addDaysIsoUtc(last.iso, 1);
    const np = utcPartsFromIso(next);
    cells.push({ iso: next, day: np.day, inMonth: false });
  }

  return cells;
}

/* -------------------------------------------------------------------------- */
/* Screen
 * -------------------------------------------------------------------------- */

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeFrom = useMemo(() => coerceString((params as any)?.from), [params]);
  const routeTo = useMemo(() => coerceString((params as any)?.to), [params]);

  const initialDay = useMemo(() => clampIsoToWindow(routeFrom ?? minIso, minIso, maxIso), [routeFrom, minIso, maxIso]);
  const initialTo = useMemo(() => clampIsoToWindow(routeTo ?? initialDay, minIso, maxIso), [routeTo, initialDay, minIso, maxIso]);

  // Date strip is ALWAYS single-date selection
  const dateStrip = useMemo(() => {
    return Array.from({ length: DAYS_AHEAD }).map((_, i) => {
      const iso = addDaysIsoUtc(minIso, i);
      const d = new Date(`${iso}T00:00:00.000Z`);
      return {
        iso,
        labelTop: d.toLocaleDateString("en-GB", { weekday: "short" }),
        labelBottom: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      };
    });
  }, [minIso]);

  const [selectedDay, setSelectedDay] = useState<string>(initialDay);

  // Range only exists via calendar modal (as requested)
  const [rangeFrom, setRangeFrom] = useState<string>(initialDay);
  const [rangeTo, setRangeTo] = useState<string>(initialTo);
  const normalizedRange = useMemo(() => normalizeRange(rangeFrom, rangeTo), [rangeFrom, rangeTo]);
  const isRange = useMemo(() => normalizedRange.from !== normalizedRange.to, [normalizedRange]);

  // Calendar modal state
  const [calendarOpen, setCalendarOpen] = useState(false);

  const initMonth = useMemo(() => utcPartsFromIso(selectedDay), [selectedDay]);
  const [calY, setCalY] = useState(initMonth.y);
  const [calM0, setCalM0] = useState(initMonth.m0);

  // Calendar selection staging (so Cancel doesn’t wreck state)
  const [draftFrom, setDraftFrom] = useState<string>(normalizedRange.from);
  const [draftTo, setDraftTo] = useState<string>(normalizedRange.to);

  useEffect(() => {
    // Keep draft in sync when range changes elsewhere
    setDraftFrom(normalizedRange.from);
    setDraftTo(normalizedRange.to);
  }, [normalizedRange.from, normalizedRange.to]);

  const monthGrid = useMemo(() => buildMonthGrid(calY, calM0), [calY, calM0]);

  function openCalendar() {
    const p = utcPartsFromIso(selectedDay);
    setCalY(p.y);
    setCalM0(p.m0);
    setDraftFrom(normalizedRange.from);
    setDraftTo(normalizedRange.to);
    setCalendarOpen(true);
  }

  function moveMonth(dir: -1 | 1) {
    let y = calY;
    let m = calM0 + dir;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalY(y);
    setCalM0(m);
  }

  function draftNormalized() {
    return normalizeRange(draftFrom, draftTo);
  }

  function isDraftInRange(iso: string) {
    const { from, to } = draftNormalized();
    return iso >= from && iso <= to;
  }

  function isDraftEdge(iso: string) {
    const { from, to } = draftNormalized();
    return iso === from || iso === to;
  }

  function tapCalendarDay(iso: string) {
    const d = clampIsoToWindow(iso, minIso, maxIso);

    // start → end → reset (inside calendar only)
    if (draftFrom === draftTo) {
      if (d === draftFrom) return;
      setDraftTo(d);
      return;
    }
    setDraftFrom(d);
    setDraftTo(d);
  }

  function applyCalendar() {
    const { from, to } = draftNormalized();
    setRangeFrom(from);
    setRangeTo(to);

    // Keep strip highlight anchored to FROM
    setSelectedDay(from);

    setCalendarOpen(false);
  }

  // Leagues
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

  const setAllLeagues = useCallback(() => setSelectedLeagueIds([]), []);

  // Follow state
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

  const placeholderIds = useMemo(() => computeLikelyPlaceholderTbcIds(rows), [rows]);

  // Fetch window: single day OR calendar range
  const fetchFrom = isRange ? normalizedRange.from : selectedDay;
  const fetchTo = isRange ? normalizedRange.to : selectedDay;

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

    // If NOT in range mode, keep only selected day (defensive)
    const dayFiltered = !isRange ? base.filter((r) => fixtureIsoDateOnly(r) === selectedDay) : base;

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
  }, [rows, isRange, selectedDay, qNorm]);

  function handleStripDateTap(iso: string) {
    const d = clampIsoToWindow(iso, minIso, maxIso);
    setSelectedDay(d);
    // strip selection cancels any prior range (keeps behavior obvious)
    setRangeFrom(d);
    setRangeTo(d);
  }

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

  const renderRow = (r: FixtureListRow) => {
    const fixtureId = r?.fixture?.id != null ? String(r.fixture.id) : "";
    if (!fixtureId) return null;

    const leagueIdStr = r?.league?.id != null ? String(r.league.id) : "L";
    const rowKey = `${leagueIdStr}-${fixtureId}`;
    const expanded = expandedKey === rowKey;

    const home = String(r?.teams?.home?.name ?? "Home");
    const away = String(r?.teams?.away?.name ?? "Away");

    const venue = String(r?.fixture?.venue?.name ?? "").trim();
    const city = String(r?.fixture?.venue?.city ?? "").trim();
    const venueLine = [venue, city].filter(Boolean).join(" • ");

    const kickoff = kickoffPresentation(r, placeholderIds);
    const isFollowed = followedIdSet.has(fixtureId);

    const ctxLeagueId = r?.league?.id != null ? Number(r.league.id) : null;
    const ctxSeason = (r as any)?.league?.season != null ? Number((r as any).league.season) : null;

    const ticketDifficulty = home ? getTicketDifficultyBadge(home) : null;

    return (
      <View key={rowKey} style={styles.rowWrap}>
        <GlassCard noPadding style={styles.rowCard} strength="subtle">
          {/* Top row: crests + wide center (fixes horrific skinny wraps) */}
          <View style={styles.rowTop}>
            <TeamCrest name={home} logo={r?.teams?.home?.logo} />

            <Pressable
              onPress={() => setExpandedKey(expanded ? null : rowKey)}
              style={({ pressed }) => [styles.centerPress, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={styles.centerBlock}>
                <Text style={styles.teamLine}>{home}</Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.teamLine}>{away}</Text>
              </View>
            </Pressable>

            <TeamCrest name={away} logo={r?.teams?.away?.logo} />
          </View>

          {/* Meta row: full width, wraps cleanly */}
          <Pressable
            onPress={() => setExpandedKey(expanded ? null : rowKey)}
            style={({ pressed }) => [styles.metaWrap, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={styles.metaPrimary}>{kickoff.primary}</Text>
            {venueLine ? <Text style={styles.metaVenue}>{venueLine}</Text> : null}
            {kickoff.secondary ? <Text style={styles.metaSecondary}>{kickoff.secondary}</Text> : null}

            <View style={styles.badgeRow}>
              {!kickoff.likelyTbc ? (
                <View style={[styles.badge, styles.badgeGold]}>
                  <Text style={[styles.badgeText, styles.badgeGoldText]}>Confirmed</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgeNeutral]}>
                  <Text style={[styles.badgeText, styles.badgeNeutralText]}>Likely TBC</Text>
                </View>
              )}

              {ticketDifficulty ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Home tickets: {ticketDifficultyLabel(ticketDifficulty)}</Text>
                </View>
              ) : null}

              <Text style={styles.tapHint}>Tap for actions</Text>
            </View>
          </Pressable>

          {/* Actions row: follow sits here, not “lifting” a crest */}
          <View style={styles.actionsRow}>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => onToggleFollowFromRow(r)}
              style={({ pressed }) => [
                styles.followPill,
                isFollowed && styles.followPillOn,
                { opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <Text style={[styles.followPillText, isFollowed && styles.followPillTextOn]}>
                {isFollowed ? "Following" : "Follow"}
              </Text>
            </Pressable>
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

  const headerDateLabel = useMemo(() => {
    if (isRange) return `${formatIsoHuman(normalizedRange.from)} → ${formatIsoHuman(normalizedRange.to)}`;
    return formatIsoHuman(selectedDay);
  }, [isRange, normalizedRange.from, normalizedRange.to, selectedDay]);

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.82}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>{leagueSubtitle}</Text>
              <Text style={styles.dayLine}>{headerDateLabel}</Text>
            </View>

            <Pressable onPress={openCalendar} style={({ pressed }) => [styles.calendarBtn, pressed && { opacity: 0.92 }]}>
              <Text style={styles.calendarIcon}>📅</Text>
              <Text style={styles.calendarText}>Calendar</Text>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search team, city, venue, or league"
            placeholderTextColor={theme.colors.textTertiary}
            style={styles.search}
          />

          {/* Date strip: single-date only */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            {dateStrip.map((d, i) => {
              const active = d.iso === selectedDay && !isRange; // strip highlights only in day mode
              return (
                <Pressable
                  key={`${d.iso}-${i}`}
                  onPress={() => handleStripDateTap(d.iso)}
                  style={[styles.datePill, active && styles.datePillActive]}
                >
                  <Text style={[styles.dateTop, active && styles.dateTopActive]}>{d.labelTop}</Text>
                  <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>{d.labelBottom}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Leagues */}
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

          <Text style={styles.helperLine}>
            {isRange ? `Range • ${normalizedRange.from} → ${normalizedRange.to}` : `Day • ${selectedDay}`}
            {selectedLeagueIds.length ? ` • ${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues` : ""}
          </Text>
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
              <EmptyState title="No matches found" message="Try another date, range (Calendar), or league selection." />
            )}

            {!loading && !error && filtered.map(renderRow)}
          </GlassCard>
        </ScrollView>

        {/* Calendar modal */}
        <Modal visible={calendarOpen} animationType="fade" transparent onRequestClose={() => setCalendarOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCalendarOpen(false)} />
          <View style={styles.modalSheetWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select date</Text>

                  <View style={styles.modalHeaderRight}>
                    <Pressable onPress={() => moveMonth(-1)} style={styles.monthBtn}>
                      <Text style={styles.monthBtnText}>‹</Text>
                    </Pressable>

                    <Text style={styles.monthTitle}>
                      {new Date(Date.UTC(calY, calM0, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </Text>

                    <Pressable onPress={() => moveMonth(1)} style={styles.monthBtn}>
                      <Text style={styles.monthBtnText}>›</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.modalHint}>
                  Tap once for a day. Tap a second date to set a range. Tap a third time to reset.
                </Text>

                <View style={styles.dowRow}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <Text key={d} style={styles.dowText}>
                      {d}
                    </Text>
                  ))}
                </View>

                <View style={styles.grid}>
                  {monthGrid.map((c, idx) => {
                    const inRange = isDraftInRange(c.iso);
                    const edge = isDraftEdge(c.iso);
                    const disabled = c.iso < minIso || c.iso > maxIso;
                    return (
                      <Pressable
                        key={`${c.iso}-${idx}`}
                        disabled={disabled}
                        onPress={() => tapCalendarDay(c.iso)}
                        style={[
                          styles.cell,
                          !c.inMonth && styles.cellOutside,
                          inRange && styles.cellInRange,
                          edge && styles.cellEdge,
                          disabled && styles.cellDisabled,
                        ]}
                      >
                        <Text style={[styles.cellText, !c.inMonth && styles.cellTextOutside, disabled && styles.cellTextDisabled]}>
                          {c.day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.modalRangeLine}>
                  {draftNormalized().from === draftNormalized().to
                    ? `Day • ${draftNormalized().from}`
                    : `Range • ${draftNormalized().from} → ${draftNormalized().to}`}
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      setDraftFrom(selectedDay);
                      setDraftTo(selectedDay);
                    }}
                    style={[styles.modalBtn, styles.modalBtnGhost]}
                  >
                    <Text style={styles.modalBtnGhostText}>Reset</Text>
                  </Pressable>

                  <Pressable onPress={applyCalendar} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                    <Text style={styles.modalBtnPrimaryText}>Apply</Text>
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
/* Styles
 * -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    padding: theme.spacing.lg,
    gap: 10,
  },

  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },

  title: { color: theme.colors.text, fontSize: 22, fontWeight: "700" },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13 },
  dayLine: { color: theme.colors.textTertiary, fontSize: 12, marginTop: 2 },

  calendarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.12)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  calendarIcon: { fontSize: 14, opacity: 0.9 },
  calendarText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "900" },

  helperLine: { color: theme.colors.textTertiary, fontSize: 12, marginTop: -2 },

  search: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  datePill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.12)",
    minWidth: 62,
    alignItems: "center",
  },
  datePillActive: { borderColor: "rgba(79,224,138,0.55)", backgroundColor: "rgba(79,224,138,0.08)" },
  dateTop: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "800" },
  dateBottom: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  dateTopActive: { color: "rgba(79,224,138,0.92)" },
  dateBottomActive: { color: theme.colors.text },

  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  leaguePillActive: { borderColor: "rgba(79,224,138,0.55)", backgroundColor: "rgba(79,224,138,0.08)" },
  leagueText: { color: theme.colors.textSecondary, fontWeight: "800" },
  leagueTextActive: { color: theme.colors.text, fontWeight: "900" },

  content: { padding: theme.spacing.lg },
  card: { padding: theme.spacing.md },

  rowWrap: { marginBottom: 12 },
  rowCard: { borderRadius: 18 },

  // Card layout: give center real width (fixes awful word wraps)
  rowTop: {
    paddingTop: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  centerPress: { flex: 1 },
  centerBlock: { alignItems: "center", gap: 6 },

  teamLine: { color: theme.colors.text, fontSize: 16, fontWeight: "900", textAlign: "center" },
  vs: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "800" },

  metaWrap: {
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
    alignItems: "center",
  },

  metaPrimary: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "center", fontWeight: "800" },
  metaVenue: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "center" },
  metaSecondary: { color: theme.colors.textTertiary, fontSize: 11, textAlign: "center", fontWeight: "800" },

  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  badgeText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11 },

  badgeGold: { borderColor: "rgba(255,210,77,0.32)", backgroundColor: "rgba(255,210,77,0.10)" },
  badgeGoldText: { color: "rgba(255,210,77,0.92)" },

  badgeNeutral: { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(0,0,0,0.14)" },
  badgeNeutralText: { color: theme.colors.textSecondary },

  tapHint: { color: theme.colors.textTertiary, fontSize: 11, fontWeight: "800" },

  actionsRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  // Bigger crests
  crestWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  crestImg: { width: 36, height: 36, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontWeight: "900" },

  followPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  followPillOn: { borderColor: "rgba(79,224,138,0.35)", backgroundColor: "rgba(79,224,138,0.10)" },
  followPillText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11 },
  followPillTextOn: { color: "rgba(79,224,138,0.92)" },

  expandArea: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingBottom: 14 },

  expandGhost: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  expandGhostText: { color: theme.colors.textSecondary, fontWeight: "900" },

  expandPrimary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.55)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  expandPrimaryText: { color: theme.colors.text, fontWeight: "900" },

  center: { paddingVertical: 20, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary },

  flag: { width: 18, height: 13, borderRadius: 3 },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  modalSheetWrap: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderRadius: 22, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, overflow: "hidden" },
  modalInner: { padding: 14, gap: 12 },

  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },

  modalHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthBtnText: { color: theme.colors.textSecondary, fontSize: 18, fontWeight: "900", marginTop: -2 },
  monthTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "900" },

  modalHint: { color: theme.colors.textTertiary, fontSize: 12, lineHeight: 16, fontWeight: "800" },

  dowRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  dowText: { width: "14.28%", textAlign: "center", color: theme.colors.textTertiary, fontSize: 11, fontWeight: "900" },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.28%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  cellOutside: { opacity: 0.55 },
  cellInRange: { backgroundColor: "rgba(79,224,138,0.08)" },
  cellEdge: { backgroundColor: "rgba(79,224,138,0.14)" },
  cellDisabled: { opacity: 0.25 },
  cellText: { color: theme.colors.text, fontWeight: "900" },
  cellTextOutside: { color: theme.colors.textSecondary },
  cellTextDisabled: { color: theme.colors.textTertiary },

  modalRangeLine: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "900" },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },

  modalBtnPrimary: {
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  modalBtnPrimaryText: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },

  modalBtnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  modalBtnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: "900" },
});
