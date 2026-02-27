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
  Platform,
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

// Livescore-style strip: show a short, simple run of days (single-date only).
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
  // month0: 0-11
  // Day 0 of next month = last day of current month
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

function firstWeekdayUtc(year: number, month0: number) {
  // 0=Sun ... 6=Sat
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
  const firstW = firstWeekdayUtc(year, month0); // Sun start
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

  // pad before
  for (let i = 0; i < firstW; i++) {
    cells.push({ iso: "", day: 0, inMonth: false });
  }

  for (let day = 1; day <= dim; day++) {
    const iso = isoFromUtcParts(year, month0, day);
    cells.push({ iso, day, inMonth: true });
  }

  // pad after to complete weeks (6 rows max, but keep simple)
  while (cells.length % 7 !== 0) {
    cells.push({ iso: "", day: 0, inMonth: false });
  }

  return cells;
}

/* -------------------------------------------------------------------------- */
/* Screen
 * -------------------------------------------------------------------------- */

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 365-day window starting TOMORROW (never show today)
  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  // Route overrides (optional): leagueId, from, to
  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeFrom = useMemo(() => coerceString((params as any)?.from), [params]);
  const routeTo = useMemo(() => coerceString((params as any)?.to), [params]);

  // Single-day selection (Livescore-style)
  const initialDay = useMemo(() => {
    const base = routeFrom && isValidIsoDateOnly(routeFrom) ? routeFrom : minIso;
    return clampIsoToWindow(base, minIso, maxIso);
  }, [routeFrom, minIso, maxIso]);

  // Optional calendar range
  const initialRange = useMemo(() => {
    const a = routeFrom && isValidIsoDateOnly(routeFrom) ? clampIsoToWindow(routeFrom, minIso, maxIso) : null;
    const b = routeTo && isValidIsoDateOnly(routeTo) ? clampIsoToWindow(routeTo, minIso, maxIso) : null;
    if (a && b && a !== b) return normalizeRange(a, b);
    return null;
  }, [routeFrom, routeTo, minIso, maxIso]);

  const [selectedDay, setSelectedDay] = useState<string>(initialDay);
  const [range, setRange] = useState<{ from: string; to: string } | null>(initialRange);

  const effectiveRange = useMemo(() => {
    return range ? normalizeRange(range.from, range.to) : { from: selectedDay, to: selectedDay };
  }, [range, selectedDay]);

  const isRange = useMemo(() => effectiveRange.from !== effectiveRange.to, [effectiveRange]);

  // Date strip: simple, single-day only
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

  // Search
  const [query, setQuery] = useState("");
  const qNorm = query.trim().toLowerCase();

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

  // Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Placeholder ids from the fetched set (works for single day or ranges)
  const placeholderIds = useMemo(() => computeLikelyPlaceholderTbcIds(rows), [rows]);

  // Fetch only for selected day or calendar range
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

    // Defensive: if not range, keep only that day
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
    // Seed with current selection
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

      // start → end → reset (inside modal only)
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

      // Keep strip anchored to range start so it feels deterministic.
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
      setRange(null); // strip is single-date only (range happens in calendar)
    },
    [minIso, maxIso]
  );

  /* ----------------------------- Row rendering ---------------------------- */

  const renderRow = (r: FixtureListRow) => {
    const fixtureId = r?.fixture?.id != null ? String(r.fixture.id) : "";
    if (!fixtureId) return null;

    // Bulletproof keys across multi-league merges
    const leagueIdStr = r?.league?.id != null ? String(r.league.id) : "L";
    const rowKey = `${leagueIdStr}-${fixtureId}`;
    const expanded = expandedKey === rowKey;

    const home = String(r?.teams?.home?.name ?? "Home");
    const away = String(r?.teams?.away?.name ?? "Away");

    const venue = String(r?.fixture?.venue?.name ?? "").trim();
    const city = String(r?.fixture?.venue?.city ?? "").trim();

    const kickoff = kickoffPresentation(r, placeholderIds);
    const isFollowed = followedIdSet.has(fixtureId);

    const ctxLeagueId = r?.league?.id != null ? Number(r.league.id) : null;
    const ctxSeason = (r as any)?.league?.season != null ? Number((r as any).league.season) : null;

    // IMPORTANT: home-club difficulty only (no away ticket messaging anywhere).
    const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
    const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";

    return (
      <View key={rowKey} style={styles.rowWrap}>
        <GlassCard noPadding style={styles.rowCard} strength="subtle">
          {/* Main tappable area */}
          <Pressable
            onPress={() => setExpandedKey(expanded ? null : rowKey)}
            style={({ pressed }) => [styles.rowMainPress, pressed && { opacity: 0.92 }]}
            android_ripple={{ color: "rgba(255,255,255,0.05)" }}
          >
            <View style={styles.rowInner}>
              {/* Top: crests + names */}
              <View style={styles.topRow}>
                <TeamCrest name={home} logo={r?.teams?.home?.logo} />

                <View style={styles.centerCol}>
                  <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                    {home}
                  </Text>
                  <Text style={styles.vs}>vs</Text>
                  <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                    {away}
                  </Text>
                </View>

                <TeamCrest name={away} logo={r?.teams?.away?.logo} />
              </View>

              {/* Meta (NO truncation: allow wrap) */}
              <View style={styles.metaBlock}>
                <Text style={styles.metaPrimary}>{kickoff.primary}</Text>

                {(venue || city) ? (
                  <Text style={styles.metaVenue}>
                    {[venue, city].filter(Boolean).join(" • ")}
                  </Text>
                ) : null}

                {kickoff.secondary ? <Text style={styles.metaSecondary}>{kickoff.secondary}</Text> : null}
              </View>

              {/* Badges */}
              <View style={styles.badgeRow}>
                {/* Confirmed / Likely TBC */}
                {kickoff.likelyTbc ? (
                  <View style={[styles.badge, styles.badgeWarn]}>
                    <Text style={[styles.badgeText, styles.badgeTextWarn]}>Likely TBC</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.badgeConfirmed]}>
                    <Text style={[styles.badgeText, styles.badgeTextConfirmed]}>Confirmed</Text>
                  </View>
                )}

                {/* Tickets badge (ALWAYS visible) */}
                <View
                  style={[
                    styles.badge,
                    difficulty === "easy" && styles.badgeEasy,
                    difficulty === "medium" && styles.badgeMedium,
                    (difficulty === "hard" || difficulty === "very_hard") && styles.badgeHard,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      difficulty === "easy" && styles.badgeTextEasy,
                      difficulty === "medium" && styles.badgeTextMedium,
                      (difficulty === "hard" || difficulty === "very_hard") && styles.badgeTextHard,
                    ]}
                  >
                    Home tickets: {ticketDifficultyLabel(difficulty)}
                  </Text>
                </View>
              </View>

              {/* Follow pill (CENTERED, not lifting crests) */}
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

              <Text style={styles.tapHint}>Tap for actions</Text>
            </View>
          </Pressable>

          {/* Expanded actions */}
          {expanded ? (
            <View style={styles.expandArea}>
              <Pressable
                onPress={() => goMatch(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })}
                style={styles.expandGhost}
              >
                <Text style={styles.expandGhostText}>Match</Text>
              </Pressable>

              <Pressable
                onPress={() => goTripOrBuild(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })}
                style={styles.expandPrimary}
              >
                <Text style={styles.expandPrimaryText}>Build trip</Text>
              </Pressable>
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

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.82}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>{leagueSubtitle}</Text>
              <Text style={styles.dateLine}>{headerDateLine}</Text>
            </View>

            <Pressable
              onPress={openCalendar}
              style={({ pressed }) => [styles.calendarBtn, pressed && { opacity: 0.92 }]}
              android_ripple={{ color: "rgba(255,255,255,0.06)" }}
            >
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

          {/* Date strip (Livescore style): single day only */}
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

          {/* Leagues: All + multi-select */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            <Pressable
              onPress={setAllLeagues}
              style={[styles.leaguePill, selectedLeagueIds.length === 0 && styles.leaguePillActive]}
            >
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
          </Text>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.card} strength="default">
            {loading && (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            )}

            {!loading && error && <EmptyState title="Error" message={error} />}

            {!loading && !error && filtered.length === 0 && (
              <EmptyState title="No matches found" message="Try another date, calendar range, or league selection." />
            )}

            {!loading && !error && filtered.map(renderRow)}
          </GlassCard>
        </ScrollView>

        {/* Calendar Modal */}
        <Modal visible={calendarOpen} animationType="fade" transparent onRequestClose={closeCalendar}>
          <Pressable style={styles.modalBackdrop} onPress={closeCalendar} />
          <View style={styles.modalWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select dates</Text>
                  <Pressable onPress={closeCalendar} style={styles.modalClose} hitSlop={10}>
                    <Text style={styles.modalCloseText}>Done</Text>
                  </Pressable>
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
                  <Pressable onPress={clearCalendarRange} style={[styles.modalBtn, styles.modalBtnGhost]}>
                    <Text style={styles.modalBtnGhostText}>Clear range</Text>
                  </Pressable>

                  <Pressable onPress={applyCalendar} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                    <Text style={styles.modalBtnPrimaryText}>Apply</Text>
                  </Pressable>
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
    padding: theme.spacing.lg,
    gap: 12,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  title: { color: theme.colors.text, fontSize: 22, fontWeight: theme.fontWeight.black },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, marginTop: 2 },
  dateLine: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, marginTop: 6 },

  calendarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  calendarIcon: { fontSize: 14, opacity: 0.95 },
  calendarText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  helperLine: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    marginTop: -4,
    fontWeight: theme.fontWeight.bold,
  },

  search: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    fontWeight: theme.fontWeight.bold,
  },

  /* Date strip */
  datePill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  datePillActive: {
    borderColor: "rgba(79,224,138,0.34)",
    backgroundColor: Platform.OS === "android" ? "rgba(79,224,138,0.10)" : "rgba(79,224,138,0.08)",
  },
  dateTop: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  dateBottom: { color: theme.colors.text, fontSize: 13, fontWeight: theme.fontWeight.black, marginTop: 2 },
  dateTopActive: { color: "rgba(79,224,138,0.95)" },
  dateBottomActive: { color: theme.colors.text },

  /* Leagues */
  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.34)",
    backgroundColor: Platform.OS === "android" ? "rgba(79,224,138,0.10)" : "rgba(79,224,138,0.08)",
  },
  leagueText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  leagueTextActive: { color: theme.colors.text },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  /* Content */
  content: { padding: theme.spacing.lg, paddingTop: 0 },
  card: { padding: theme.spacing.md },

  center: { paddingVertical: 20, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold },

  /* Rows */
  rowWrap: { marginBottom: 12 },
  rowCard: { borderRadius: 24 },
  rowMainPress: { borderRadius: 24, overflow: "hidden" },

  rowInner: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 12,
    alignItems: "center",
  },

  topRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  crestWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestImg: { width: 36, height: 36, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black },

  centerCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
  },

  // Names are 1 line (pro look). If they truly overflow, tail ellipsis is acceptable.
  teamName: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: theme.fontWeight.black,
    width: "100%",
    textAlign: "center",
  },

  vs: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  metaBlock: { width: "100%", alignItems: "center", gap: 4 },
  metaPrimary: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold, textAlign: "center" },

  // NO truncation: let venue/city wrap naturally to avoid missing text.
  metaVenue: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    opacity: 0.9,
  },

  metaSecondary: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    textAlign: "center",
    fontWeight: theme.fontWeight.black,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    paddingTop: 2,
  },

  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  /* Confirmed = subtle gold (flag it) */
  badgeConfirmed: {
    borderColor: "rgba(214,178,92,0.35)",
    backgroundColor: "rgba(214,178,92,0.10)",
  },
  badgeTextConfirmed: { color: "rgba(214,178,92,0.95)" },

  /* Likely TBC = amber warn */
  badgeWarn: {
    borderColor: "rgba(255,210,77,0.30)",
    backgroundColor: "rgba(255,210,77,0.10)",
  },
  badgeTextWarn: { color: "rgba(255,210,77,0.92)" },

  badgeText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 11 },

  /* Ticket difficulty colors */
  badgeEasy: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  badgeTextEasy: { color: "rgba(79,224,138,0.95)" },

  badgeMedium: {
    borderColor: "rgba(255,184,77,0.35)",
    backgroundColor: "rgba(255,184,77,0.10)",
  },
  badgeTextMedium: { color: "rgba(255,184,77,0.95)" },

  badgeHard: {
    borderColor: "rgba(255,90,90,0.35)",
    backgroundColor: "rgba(255,90,90,0.10)",
  },
  badgeTextHard: { color: "rgba(255,90,90,0.95)" },

  /* Follow */
  followPill: {
    marginTop: 4,
    alignSelf: "stretch",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  followPillOn: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  followPillText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  followPillTextOn: { color: "rgba(79,224,138,0.92)" },

  tapHint: { marginTop: -2, color: theme.colors.textTertiary, fontSize: 11, fontWeight: theme.fontWeight.bold },

  /* Expanded actions */
  expandArea: { flexDirection: "row", gap: 10, padding: 12, paddingTop: 0 },

  expandGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.12)" : "rgba(10,12,14,0.10)",
  },
  expandGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black },

  expandPrimary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.34)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Platform.OS === "android" ? "rgba(79,224,138,0.10)" : "rgba(79,224,138,0.08)",
  },
  expandPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  /* Modal */
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  modalWrap: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderRadius: 22, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, overflow: "hidden" },
  modalInner: { padding: 14, gap: 12 },

  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: theme.fontWeight.black },
  modalClose: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  modalCloseText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  modalSub: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  calHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  calNavText: { color: theme.colors.textSecondary, fontSize: 20, fontWeight: theme.fontWeight.black, marginTop: -2 },
  calMonthText: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },

  calWeekRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  calWeekText: { width: "14.285%", textAlign: "center", color: theme.colors.textTertiary, fontSize: 11, fontWeight: theme.fontWeight.black },

  calGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  calCell: { width: "14.285%", aspectRatio: 1, padding: 4 },
  calDayBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  calDayInRange: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(79,224,138,0.06)",
  },
  calDayEdge: {
    borderColor: "rgba(79,224,138,0.34)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  calDayText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  calDayTextEdge: { color: theme.colors.text },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },

  modalBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  modalBtnPrimary: {
    borderColor: "rgba(79,224,138,0.34)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  modalBtnPrimaryText: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  modalBtnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  modalBtnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  modalFootnote: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16 },
});
