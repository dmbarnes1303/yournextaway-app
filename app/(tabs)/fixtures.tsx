// app/(tabs)/fixtures.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import { LEAGUES, type LeagueOption } from "@/src/constants/football";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getFlagImageUrl } from "@/src/utils/flagImages";

import tripsStore from "@/src/state/trips";
import useFollowStore from "@/src/state/followStore";

import { computeLikelyPlaceholderTbcIds, kickoffIsoOrNull } from "@/src/utils/kickoffTbc";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";

import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
import { POPULAR_TEAM_IDS } from "@/src/data/teams";

/* -------------------------------------------------------------------------- */
/* Constants */
/* -------------------------------------------------------------------------- */

const DAYS_AHEAD = 365;
const MAX_MULTI_LEAGUES = 10;
const STRIP_DAYS = 7;

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
/* UTC-safe date helpers (prevents DST duplication)
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

function isValidIsoDateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? "").trim());
}

/* -------------------------------------------------------------------------- */
/* Ticket badge helpers
 * -------------------------------------------------------------------------- */

function ticketDifficultyLabel(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "very_hard":
      return "Very hard";
    default:
      return "Unknown";
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
  const certainty = getFixtureCertainty(r, { placeholderIds });
  const iso = kickoffIsoOrNull(r);

  if (!iso) {
    return { primary: "TBC", secondary: "Kickoff time not set yet", certainty };
  }

  const formatted = formatUkDateTimeMaybe(iso) || "TBC";

  if (certainty === "likely_tbc") {
    return {
      primary: formatted,
      secondary: "Likely placeholder (TV schedule not confirmed)",
      certainty,
    };
  }

  if (certainty === "tbc") {
    return {
      primary: formatted,
      secondary: "Kickoff time not confirmed",
      certainty,
    };
  }

  return { primary: formatted, secondary: null as string | null, certainty };
}

function resolveTripForFixture(fixtureId: string): string | null {
  const trips = tripsStore.getState().trips;
  const hit = trips.find((t) => (t.matchIds ?? []).includes(String(fixtureId)));
  return hit ? String(hit.id) : null;
}

/* -------------------------------------------------------------------------- */
/* Top-picks scoring (lightweight, honest)
 * -------------------------------------------------------------------------- */

function leagueWeight(leagueId: number | null): number {
  if (leagueId === 39) return 120;
  if (leagueId === 140) return 105;
  if (leagueId === 135) return 100;
  if (leagueId === 78) return 95;
  if (leagueId === 61) return 90;
  return 60;
}

function scoreFixture(r: FixtureListRow): number {
  const lid = r?.league?.id != null ? Number(r.league.id) : null;
  let s = leagueWeight(lid);

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;

  if (typeof homeId === "number" && POPULAR_TEAM_IDS.has(homeId)) s += 60;
  if (typeof awayId === "number" && POPULAR_TEAM_IDS.has(awayId)) s += 60;

  const venue = String(r?.fixture?.venue?.name ?? "").trim();
  const city = String(r?.fixture?.venue?.city ?? "").trim();
  if (venue) s += 10;
  if (city) s += 6;

  const dt = r?.fixture?.date ? new Date(r.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) {
    const day = dt.getDay();
    if (day === 5 || day === 6 || day === 0) s += 12; // Fri/Sat/Sun
    const hr = dt.getHours();
    if (hr >= 17 && hr <= 21) s += 8; // evening
  }

  const iso = kickoffIsoOrNull(r);
  if (!iso) s -= 8;

  return s;
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
/* Concurrency-limited fetch (protects perf + rate limits)
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
/* Calendar (simple, built-in, range capable)
 * -------------------------------------------------------------------------- */

function daysInMonthUtc(year: number, month0: number) {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

function firstWeekdayUtc(year: number, month0: number) {
  return new Date(Date.UTC(year, month0, 1)).getUTCDay();
}

function monthLabel(year: number, month0: number) {
  const d = new Date(Date.UTC(year, month0, 1));
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function parseIsoToUtcParts(iso: string) {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: Number(m[1]), m0: Number(m[2]) - 1, d: Number(m[3]) };
}

function buildMonthGrid(year: number, month0: number) {
  const dim = daysInMonthUtc(year, month0);
  const firstW = firstWeekdayUtc(year, month0);
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < firstW; i++) cells.push({ iso: "", day: 0, inMonth: false });
  for (let day = 1; day <= dim; day++) cells.push({ iso: isoFromUtcParts(year, month0, day), day, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ iso: "", day: 0, inMonth: false });

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

  const routeSort = useMemo(() => coerceString((params as any)?.sort) ?? coerceString((params as any)?.mode), [params]);
  const isTopPicksMode = useMemo(() => {
    const s = String(routeSort ?? "").toLowerCase();
    return s === "rating" || s === "toppicks" || s === "top_picks" || s === "top-picks";
  }, [routeSort]);

  const defaultTopFrom = useMemo(() => minIso, [minIso]);
  const defaultTopTo = useMemo(() => addDaysIsoUtc(minIso, 13), [minIso]);

  const initialDay = useMemo(() => {
    const base =
      routeFrom && isValidIsoDateOnly(routeFrom)
        ? routeFrom
        : isTopPicksMode
          ? defaultTopFrom
          : minIso;
    return clampIsoToWindow(base, minIso, maxIso);
  }, [routeFrom, isTopPicksMode, defaultTopFrom, minIso, maxIso]);

  const initialRange = useMemo(() => {
    const a = routeFrom && isValidIsoDateOnly(routeFrom) ? clampIsoToWindow(routeFrom, minIso, maxIso) : null;
    const b = routeTo && isValidIsoDateOnly(routeTo) ? clampIsoToWindow(routeTo, minIso, maxIso) : null;

    if (a && b && a !== b) return normalizeRange(a, b);

    if (isTopPicksMode && !a && !b) return { from: defaultTopFrom, to: defaultTopTo };

    return null;
  }, [routeFrom, routeTo, isTopPicksMode, defaultTopFrom, defaultTopTo, minIso, maxIso]);

  const [selectedDay, setSelectedDay] = useState<string>(initialDay);
  const [range, setRange] = useState<{ from: string; to: string } | null>(initialRange);

  const effectiveRange = useMemo(() => {
    return range ? normalizeRange(range.from, range.to) : { from: selectedDay, to: selectedDay };
  }, [range, selectedDay]);

  const isRange = useMemo(() => effectiveRange.from !== effectiveRange.to, [effectiveRange]);

  const stripDays = useMemo(() => {
    const start = clampIsoToWindow(selectedDay, minIso, maxIso);
    return Array.from({ length: STRIP_DAYS }).map((_, i) => {
      const iso = addDaysIsoUtc(start, i);
      const d = new Date(`${iso}T00:00:00.000Z`);
      return {
        iso,
        top: d.toLocaleDateString("en-GB", { weekday: "short" }),
        bottom: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      };
    });
  }, [selectedDay, minIso, maxIso]);

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
  const [rows, setRows] = useState<FixtureListRow[]>([]);
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

        if (isTopPicksMode) {
          flat.sort((a, b) => {
            const sa = scoreFixture(a);
            const sb = scoreFixture(b);
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
  }, [selectedLeagues, fetchFrom, fetchTo, isTopPicksMode]);

  const filtered = useMemo(() => {
    const base = rows;
    const dayFiltered = !isRange ? base.filter((r) => fixtureIsoDateOnly(r) === effectiveRange.from) : base;

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

  function goMatch(id: string, ctx?: { leagueId?: number | null; season?: number | null }) {
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
        from: effectiveRange.from,
        to: effectiveRange.to,
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

  /* ----------------------------- Calendar modal ---------------------------- */

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [calMonthYear, setCalMonthYear] = useState(() => {
    const base = parseIsoToUtcParts(selectedDay) ?? parseIsoToUtcParts(minIso) ?? { y: 2026, m0: 0, d: 1 };
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

  const calGrid = useMemo(() => buildMonthGrid(calMonthYear.y, calMonthYear.m0), [calMonthYear]);

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

  /* ----------------------------- Date strip tap ---------------------------- */

  const onTapStripDate = useCallback(
    (iso: string) => {
      const d = clampIsoToWindow(iso, minIso, maxIso);
      setSelectedDay(d);
      setRange(null);
    },
    [minIso, maxIso]
  );

  /* ----------------------------- Row rendering ---------------------------- */

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

    const kickoff = kickoffPresentation(r, placeholderIds);
    const certainty = kickoff.certainty;

    const isFollowed = followedIdSet.has(fixtureId);

    const ctxLeagueId = r?.league?.id != null ? Number(r.league.id) : null;
    const ctxSeason = (r as any)?.league?.season != null ? Number((r as any).league.season) : null;

    const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
    const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";

    return (
      <View key={rowKey} style={styles.rowWrap}>
        <GlassCard style={styles.rowCard} level="default" variant="matte">
          <Pressable
            onPress={() => setExpandedKey(expanded ? null : rowKey)}
            style={({ pressed }) => [styles.rowMainPress, pressed && { opacity: 0.96 }]}
            android_ripple={{ color: "rgba(255,255,255,0.04)" }}
          >
            <View style={styles.rowInner}>
              <View style={styles.topRow}>
                <TeamCrest name={home} logo={r?.teams?.home?.logo} />

                <View style={styles.centerCol}>
                  <Text style={styles.teamName} numberOfLines={2}>
                    {home}
                  </Text>
                  <Text style={styles.vs}>vs</Text>
                  <Text style={styles.teamName} numberOfLines={2}>
                    {away}
                  </Text>
                </View>

                <TeamCrest name={away} logo={r?.teams?.away?.logo} />
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaPrimary}>{kickoff.primary}</Text>

                {venue || city ? (
                  <Text style={styles.metaVenue}>{[venue, city].filter(Boolean).join(" • ")}</Text>
                ) : null}

                {kickoff.secondary ? <Text style={styles.metaSecondary}>{kickoff.secondary}</Text> : null}
              </View>

              <View style={styles.badgeRow}>
                <FixtureCertaintyBadge state={certainty} variant="compact" />

                <View
                  style={[
                    styles.ticketPill,
                    difficulty === "easy" && styles.ticketEasy,
                    difficulty === "medium" && styles.ticketMedium,
                    (difficulty === "hard" || difficulty === "very_hard") && styles.ticketHard,
                  ]}
                >
                  <Text
                    style={[
                      styles.ticketText,
                      difficulty === "easy" && styles.ticketTextEasy,
                      difficulty === "medium" && styles.ticketTextMedium,
                      (difficulty === "hard" || difficulty === "very_hard") && styles.ticketTextHard,
                    ]}
                  >
                    Home tickets: {ticketDifficultyLabel(difficulty)}
                  </Text>
                </View>
              </View>

              <View style={styles.followRow}>
                <Button
                  label={isFollowed ? "Following" : "Follow"}
                  onPress={() => onToggleFollowFromRow(r)}
                  tone={isFollowed ? "secondary" : "primary"}
                  size="sm"
                  glow={!isFollowed}
                  style={{ flex: 1 }}
                />
              </View>

              <Text style={styles.tapHint}>Tap for actions</Text>
            </View>
          </Pressable>

          {expanded ? (
            <View style={styles.expandArea}>
              <Button
                label="Match"
                onPress={() => goMatch(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })}
                tone="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                label="Build trip"
                onPress={() => goTripOrBuild(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })}
                tone="primary"
                size="md"
                glow
                style={{ flex: 1 }}
              />
            </View>
          ) : null}
        </GlassCard>
      </View>
    );
  };

  const headerDateLine = useMemo(() => {
    if (!isRange) {
      const d = new Date(`${effectiveRange.from}T00:00:00.000Z`);
      return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    }
    return `${effectiveRange.from} → ${effectiveRange.to}`;
  }, [isRange, effectiveRange]);

  const titleText = isTopPicksMode ? "Top Picks" : "Fixtures";

  const bg = getBackground("fixtures");
  const bgProps =
    typeof bg === "string" ? ({ imageUrl: bg } as const) : ({ imageSource: bg } as const);

  return (
    <Background {...bgProps} overlayOpacity={0}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{titleText}</Text>
              <Text style={styles.subtitle}>{leagueSubtitle}</Text>
              <Text style={styles.dateLine}>{headerDateLine}</Text>
            </View>

            <Button label="Calendar" tone="secondary" size="sm" onPress={openCalendar} />
          </View>

          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search team, city, venue, or league"
            leftIcon="search"
            variant="default"
            returnKeyType="search"
            allowClear
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            {stripDays.map((d, i) => {
              const active = !isRange && d.iso === selectedDay;

              return (
                <Pressable
                  key={`${d.iso}-${i}`}
                  onPress={() => onTapStripDate(d.iso)}
                  style={[styles.datePill, active && styles.datePillActive]}
                >
                  <Text style={[styles.dateTop, active && styles.dateTopActive]}>{d.top}</Text>
                  <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>{d.bottom}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            <Pressable onPress={setAllLeagues} style={[styles.leaguePill, selectedLeagueIds.length === 0 && styles.leaguePillActive]}>
              <Text style={[styles.leagueText, selectedLeagueIds.length === 0 && styles.leagueTextActive]}>
                All leagues
              </Text>
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
            {isRange ? `Range • ${effectiveRange.from} → ${effectiveRange.to}` : `Day • ${effectiveRange.from}`}
            {selectedLeagueIds.length ? ` • ${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues` : ""}
            {isTopPicksMode ? " • Sorted by rating" : ""}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.listWrap}>
            {loading && (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            )}

            {!loading && error && <EmptyState title="Error" message={error} iconName="alert-circle" />}

            {!loading && !error && filtered.length === 0 && (
              <EmptyState
                title="No matches found"
                message="Try another date, calendar range, or league selection."
                iconName="search"
              />
            )}

            {!loading && !error && filtered.map(renderRow)}
          </View>
        </ScrollView>

        <Modal visible={calendarOpen} animationType="fade" transparent onRequestClose={closeCalendar}>
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

                  <Text style={styles.calMonthText}>{monthLabel(calMonthYear.y, calMonthYear.m0)}</Text>

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
                    if (!c.inMonth) return <View key={`e-${idx}`} style={styles.calCell} />;

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
                        <Text style={[styles.calDayText, edge && styles.calDayTextEdge]}>{c.day}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.modalActions}>
                  <Button label="Clear range" tone="secondary" size="md" onPress={clearCalendarRange} style={{ flex: 1 }} />
                  <Button label="Apply" tone="primary" size="md" glow onPress={applyCalendar} style={{ flex: 1 }} />
                </View>

                <Text style={styles.modalFootnote}>
                  Tip: Tap two different days to set a range. Tap again to reset back to a single day.
                </Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h1,
    fontWeight: theme.fontWeight.semibold,
  },

  subtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
  },

  dateLine: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  helperLine: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    marginTop: 2,
  },

  datePill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
  },

  datePillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  dateTop: { color: theme.colors.textSecondary, fontSize: theme.fontSize.tiny, fontWeight: theme.fontWeight.semibold },
  dateBottom: { color: theme.colors.textPrimary, fontSize: theme.fontSize.meta, fontWeight: theme.fontWeight.semibold, marginTop: 2 },
  dateTopActive: { color: "rgba(87,162,56,0.95)" },
  dateBottomActive: { color: theme.colors.textPrimary },

  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  leaguePillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  leagueText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.tiny },
  leagueTextActive: { color: theme.colors.textPrimary },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  listWrap: { gap: 12 },

  center: { paddingVertical: 24, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },

  rowWrap: { width: "100%" },
  rowCard: { borderRadius: theme.borderRadius.sheet, padding: 0 },
  rowMainPress: { borderRadius: theme.borderRadius.sheet, overflow: "hidden" },

  rowInner: { padding: 16, gap: 12 },

  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

  crestWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestImg: { width: 38, height: 38, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold },

  centerCol: { flex: 1, alignItems: "center", gap: 6, paddingHorizontal: 2 },

  teamName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.body,
    lineHeight: 20,
    fontWeight: theme.fontWeight.semibold,
    width: "100%",
    textAlign: "center",
  },

  vs: { color: theme.colors.textMuted, fontSize: theme.fontSize.tiny, fontWeight: theme.fontWeight.medium },

  metaBlock: { width: "100%", alignItems: "center", gap: 4 },
  metaPrimary: { color: theme.colors.textSecondary, fontSize: theme.fontSize.tiny, fontWeight: theme.fontWeight.semibold, textAlign: "center" },

  metaVenue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
    opacity: 0.95,
  },

  metaSecondary: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    textAlign: "center",
    fontWeight: theme.fontWeight.medium,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  ticketPill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
  },

  ticketText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold, fontSize: 11 },

  ticketEasy: { borderColor: "rgba(87,162,56,0.30)", backgroundColor: "rgba(87,162,56,0.10)" },
  ticketTextEasy: { color: "rgba(87,162,56,0.95)" },

  ticketMedium: { borderColor: "rgba(242,201,76,0.30)", backgroundColor: "rgba(242,201,76,0.10)" },
  ticketTextMedium: { color: "rgba(242,201,76,0.95)" },

  ticketHard: { borderColor: "rgba(214,69,69,0.30)", backgroundColor: "rgba(214,69,69,0.10)" },
  ticketTextHard: { color: "rgba(214,69,69,0.95)" },

  followRow: { marginTop: 2, flexDirection: "row", gap: 10 },

  tapHint: { marginTop: -2, color: theme.colors.textMuted, fontSize: theme.fontSize.tiny, fontWeight: theme.fontWeight.medium, textAlign: "center" },

  expandArea: { flexDirection: "row", gap: 10, padding: 16, paddingTop: 0 },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  modalWrap: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderRadius: 22, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg },
  modalInner: { padding: 14, gap: 12 },

  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.h2, fontWeight: theme.fontWeight.semibold },
  modalSub: { color: theme.colors.textSecondary, fontSize: theme.fontSize.meta, fontWeight: theme.fontWeight.medium },

  calHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
  calNavText: { color: theme.colors.textSecondary, fontSize: 20, fontWeight: theme.fontWeight.semibold, marginTop: -2 },
  calMonthText: { color: theme.colors.textPrimary, fontSize: theme.fontSize.meta, fontWeight: theme.fontWeight.semibold },

  calWeekRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  calWeekText: { width: "14.285%", textAlign: "center", color: theme.colors.textMuted, fontSize: 11, fontWeight: theme.fontWeight.medium },

  calGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  calCell: { width: "14.285%", aspectRatio: 1, padding: 4 },
  calDayBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  calDayInRange: { backgroundColor: "rgba(87,162,56,0.06)" },
  calDayEdge: { borderColor: "rgba(87,162,56,0.30)", backgroundColor: "rgba(87,162,56,0.12)" },
  calDayText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold, fontSize: 12 },
  calDayTextEdge: { color: theme.colors.textPrimary },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },

  modalFootnote: { color: theme.colors.textMuted, fontSize: theme.fontSize.tiny, fontWeight: theme.fontWeight.medium, lineHeight: 16 },
});
