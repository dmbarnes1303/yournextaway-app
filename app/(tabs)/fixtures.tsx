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
const STRIP_DAYS = 7;
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
/* UTC-safe date helpers */
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

function isoToDate(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function formatHeaderDateLong(iso: string) {
  const d = isoToDate(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function formatStripTop(iso: string) {
  const d = isoToDate(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function formatStripBottom(iso: string) {
  const d = isoToDate(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/* -------------------------------------------------------------------------- */
/* Ticket badge helpers */
/* -------------------------------------------------------------------------- */

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
    case "unknown":
      return "Unknown";
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
/* Concurrency-limited fetch */
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
/* Calendar modal (simple, no deps) */
/* -------------------------------------------------------------------------- */

function monthLabel(y: number, m0: number) {
  const d = new Date(Date.UTC(y, m0, 1));
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function daysInMonth(y: number, m0: number) {
  // day 0 of next month
  return new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
}

function weekdayIndexMonFirst(y: number, m0: number, d: number) {
  // JS getUTCDay: 0 Sun .. 6 Sat
  const wd = new Date(Date.UTC(y, m0, d)).getUTCDay();
  // convert to Mon=0..Sun=6
  return (wd + 6) % 7;
}

type CalendarPick = { from: string; to: string };

function isIsoInRange(iso: string, r: CalendarPick) {
  const n = normalizeRange(r.from, r.to);
  return iso >= n.from && iso <= n.to;
}

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeFrom = useMemo(() => coerceString((params as any)?.from), [params]);
  const routeTo = useMemo(() => coerceString((params as any)?.to), [params]);

  const initialDay = useMemo(
    () => clampIsoToWindow(routeFrom ?? minIso, minIso, maxIso),
    [routeFrom, minIso, maxIso]
  );

  const initialRange = useMemo(() => {
    const f = clampIsoToWindow(routeFrom ?? initialDay, minIso, maxIso);
    const t = clampIsoToWindow(routeTo ?? f, minIso, maxIso);
    return normalizeRange(f, t);
  }, [routeFrom, routeTo, initialDay, minIso, maxIso]);

  // Selected day always exists; range is optional and only set via calendar modal
  const [selectedDayIso, setSelectedDayIso] = useState<string>(initialDay);
  const [range, setRange] = useState<CalendarPick | null>(() => {
    const n = initialRange;
    if (n.from !== n.to) return { from: n.from, to: n.to };
    return null;
  });

  const effectiveFrom = range ? normalizeRange(range.from, range.to).from : selectedDayIso;
  const effectiveTo = range ? normalizeRange(range.from, range.to).to : selectedDayIso;
  const isRange = effectiveFrom !== effectiveTo;

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

  // Date strip (Livescore feel): 7 days around selected day, clamped
  const dateStrip = useMemo(() => {
    const out: { iso: string; top: string; bottom: string }[] = [];
    const base = selectedDayIso;

    // aim: base centered
    const start = clampIsoToWindow(addDaysIsoUtc(base, -3), minIso, maxIso);
    for (let i = 0; i < STRIP_DAYS; i++) {
      const iso = clampIsoToWindow(addDaysIsoUtc(start, i), minIso, maxIso);
      if (out.length && out[out.length - 1].iso === iso) continue;
      out.push({ iso, top: formatStripTop(iso), bottom: formatStripBottom(iso) });
    }

    return out;
  }, [selectedDayIso, minIso, maxIso]);

  // Calendar modal state
  const [calOpen, setCalOpen] = useState(false);
  const [calPick, setCalPick] = useState<CalendarPick>(() => ({ from: effectiveFrom, to: effectiveTo }));

  const calMonthState = useMemo(() => {
    const d = isoToDate(selectedDayIso);
    return { y: d.getUTCFullYear(), m0: d.getUTCMonth() };
  }, [selectedDayIso]);

  const [calY, setCalY] = useState(calMonthState.y);
  const [calM0, setCalM0] = useState(calMonthState.m0);

  useEffect(() => {
    // keep month in sync when opening
    if (!calOpen) return;
    const d = isoToDate(selectedDayIso);
    setCalY(d.getUTCFullYear());
    setCalM0(d.getUTCMonth());
    setCalPick({ from: effectiveFrom, to: effectiveTo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calOpen]);

  function prevMonth() {
    const m = calM0 - 1;
    if (m >= 0) setCalM0(m);
    else {
      setCalM0(11);
      setCalY((y) => y - 1);
    }
  }

  function nextMonth() {
    const m = calM0 + 1;
    if (m <= 11) setCalM0(m);
    else {
      setCalM0(0);
      setCalY((y) => y + 1);
    }
  }

  function calTapDay(iso: string) {
    const d = clampIsoToWindow(iso, minIso, maxIso);

    // start → end → reset start
    const n = normalizeRange(calPick.from, calPick.to);
    const isSingle = n.from === n.to;

    if (isSingle) {
      if (d === n.from) return;
      setCalPick({ from: n.from, to: d });
      return;
    }

    // reset to single day
    setCalPick({ from: d, to: d });
  }

  const calendarCells = useMemo(() => {
    const firstWd = weekdayIndexMonFirst(calY, calM0, 1); // 0..6
    const dim = daysInMonth(calY, calM0);
    const cells: Array<{ iso: string; label: string; disabled: boolean }> = [];

    // pad
    for (let i = 0; i < firstWd; i++) {
      cells.push({ iso: "", label: "", disabled: true });
    }

    for (let d = 1; d <= dim; d++) {
      const iso = isoFromUtcParts(calY, calM0, d);
      const disabled = iso < minIso || iso > maxIso;
      cells.push({ iso, label: String(d), disabled });
    }

    return cells;
  }, [calY, calM0, minIso, maxIso]);

  // Fetch fixtures
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
            from: effectiveFrom,
            to: effectiveTo,
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
  }, [selectedLeagues, effectiveFrom, effectiveTo]);

  const filtered = useMemo(() => {
    const base = rows;

    // If not range, keep only selected day (defensive)
    const dayFiltered = !isRange ? base.filter((r) => fixtureIsoDateOnly(r) === selectedDayIso) : base;

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
  }, [rows, isRange, selectedDayIso, qNorm]);

  function goMatch(id: string, ctx?: { leagueId?: number | null; season?: number | null }) {
    const fid = String(id ?? "").trim();
    if (!fid) return;

    router.push({
      pathname: "/match/[id]",
      params: {
        id: fid,
        from: effectiveFrom,
        to: effectiveTo,
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
        from: effectiveFrom,
        to: effectiveTo,
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

    const kickoff = kickoffPresentation(r, placeholderIds);
    const isFollowed = followedIdSet.has(fixtureId);

    const ctxLeagueId = r?.league?.id != null ? Number(r.league.id) : null;
    const ctxSeason = (r as any)?.league?.season != null ? Number((r as any).league.season) : null;

    // Always show a value (unknown fallback)
    const difficulty = (home ? getTicketDifficultyBadge(home) : null) ?? "unknown";

    return (
      <View key={rowKey} style={styles.rowWrap}>
        <GlassCard noPadding style={styles.rowCard} strength="subtle">
          <Pressable
            onPress={() => setExpandedKey(expanded ? null : rowKey)}
            style={({ pressed }) => [styles.cardPress, pressed && { opacity: 0.96 }]}
            android_ripple={{ color: "rgba(255,255,255,0.06)" }}
          >
            <View style={styles.rowInner}>
              <View style={styles.topRow}>
                <TeamCrest name={home} logo={r?.teams?.home?.logo} />
                <View style={styles.centerCol}>
                  <Text style={styles.homeName} numberOfLines={2}>
                    {home}
                  </Text>
                  <Text style={styles.vs}>vs</Text>
                  <Text style={styles.awayName} numberOfLines={2}>
                    {away}
                  </Text>

                  <Text style={styles.kickoff} numberOfLines={2}>
                    {kickoff.primary}
                  </Text>

                  {(venue || city) ? (
                    <Text style={styles.venueLine} numberOfLines={3}>
                      {[venue, city].filter(Boolean).join(" • ")}
                    </Text>
                  ) : null}

                  {kickoff.secondary ? (
                    <Text style={styles.kickoffHint} numberOfLines={2}>
                      {kickoff.secondary}
                    </Text>
                  ) : null}

                  <View style={styles.badgeRow}>
                    {/* Confirmed / Likely TBC */}
                    {!kickoff.likelyTbc ? (
                      <View style={[styles.badge, styles.badgeGold]}>
                        <Text style={[styles.badgeText, styles.badgeTextGold]}>Confirmed</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, styles.badgeWarn]}>
                        <Text style={[styles.badgeText, styles.badgeTextWarn]}>Likely TBC</Text>
                      </View>
                    )}

                    {/* Always show home tickets */}
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Home tickets: {ticketDifficultyLabel(difficulty as any)}</Text>
                    </View>
                  </View>

                  <Text style={styles.tapHint}>Tap for actions</Text>
                </View>
                <TeamCrest name={away} logo={r?.teams?.away?.logo} />
              </View>

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
          </Pressable>

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

  const topDateLabel = useMemo(() => {
    if (isRange) return `${formatHeaderDateLong(effectiveFrom)} → ${formatHeaderDateLong(effectiveTo)}`;
    return formatHeaderDateLong(selectedDayIso);
  }, [isRange, effectiveFrom, effectiveTo, selectedDayIso]);

  const helperLine = useMemo(() => {
    if (isRange) return `Range • ${effectiveFrom} → ${effectiveTo}`;
    return `Day • ${selectedDayIso}`;
  }, [isRange, effectiveFrom, effectiveTo, selectedDayIso]);

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.82}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>{leagueSubtitle}</Text>
              <Text style={styles.dateLine}>{topDateLabel}</Text>
            </View>

            <Pressable
              onPress={() => setCalOpen(true)}
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

          {/* Date strip (single-day selection) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            {dateStrip.map((d) => {
              const active = d.iso === selectedDayIso && !range;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => {
                    setRange(null);
                    setSelectedDayIso(clampIsoToWindow(d.iso, minIso, maxIso));
                  }}
                  style={[styles.datePill, active && styles.datePillActive]}
                >
                  <Text style={styles.dateTop}>{d.top}</Text>
                  <Text style={styles.dateBottom}>{d.bottom}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Leagues */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            <Pressable onPress={setAllLeagues} style={[styles.leaguePill, selectedLeagueIds.length === 0 && styles.leaguePillActive]}>
              <Text style={styles.leagueText}>All leagues</Text>
            </Pressable>

            {LEAGUES.map((l) => {
              const selected = selectedLeagueIds.length === 0 ? false : selectedLeagueIds.includes(l.leagueId);
              return (
                <Pressable
                  key={`league-${l.leagueId}`}
                  onPress={() => toggleLeague(l.leagueId)}
                  style={[styles.leaguePill, selected && styles.leaguePillActive]}
                >
                  <Text style={styles.leagueText}>{l.label}</Text>
                  <LeagueFlag code={l.countryCode} />
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.helperLine}>
            {helperLine}
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
              <EmptyState title="No matches found" message="Try another date, range, or league selection." />
            )}

            {!loading && !error && filtered.map(renderRow)}
          </GlassCard>
        </ScrollView>

        {/* Calendar modal */}
        <Modal visible={calOpen} animationType="fade" transparent onRequestClose={() => setCalOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCalOpen(false)} />
          <View style={styles.modalWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select dates</Text>
                  <Pressable onPress={() => setCalOpen(false)} style={styles.modalClose} hitSlop={10}>
                    <Text style={styles.modalCloseText}>Done</Text>
                  </Pressable>
                </View>

                <View style={styles.monthRow}>
                  <Pressable onPress={prevMonth} style={styles.monthNav}>
                    <Text style={styles.monthNavText}>‹</Text>
                  </Pressable>
                  <Text style={styles.monthLabel}>{monthLabel(calY, calM0)}</Text>
                  <Pressable onPress={nextMonth} style={styles.monthNav}>
                    <Text style={styles.monthNavText}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.weekHeader}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                    <Text key={w} style={styles.weekDay}>
                      {w}
                    </Text>
                  ))}
                </View>

                <View style={styles.grid}>
                  {calendarCells.map((c, idx) => {
                    const inPick = c.iso && isIsoInRange(c.iso, calPick);
                    const edge = c.iso && (c.iso === normalizeRange(calPick.from, calPick.to).from || c.iso === normalizeRange(calPick.from, calPick.to).to);
                    const disabled = c.disabled || !c.iso;

                    return (
                      <Pressable
                        key={`${c.iso}-${idx}`}
                        disabled={disabled}
                        onPress={() => (c.iso ? calTapDay(c.iso) : null)}
                        style={[
                          styles.dayCell,
                          inPick && styles.dayCellInRange,
                          edge && styles.dayCellEdge,
                          disabled && { opacity: 0.35 },
                        ]}
                      >
                        <Text style={styles.dayText}>{c.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.modalHint}>
                  Tap once for a day. Tap again to set an end date for a range.
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      // clear to single day = selectedDay
                      setCalPick({ from: selectedDayIso, to: selectedDayIso });
                    }}
                    style={[styles.actionBtn, styles.actionGhost]}
                  >
                    <Text style={styles.actionGhostText}>Clear range</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      const n = normalizeRange(calPick.from, calPick.to);
                      setCalOpen(false);

                      if (n.from === n.to) {
                        setRange(null);
                        setSelectedDayIso(clampIsoToWindow(n.from, minIso, maxIso));
                        return;
                      }

                      setRange({ from: clampIsoToWindow(n.from, minIso, maxIso), to: clampIsoToWindow(n.to, minIso, maxIso) });
                    }}
                    style={[styles.actionBtn, styles.actionPrimary]}
                  >
                    <Text style={styles.actionPrimaryText}>Apply</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalFootnote}>Note: Date window is limited to the next {DAYS_AHEAD} days.</Text>
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

  headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },

  title: { color: theme.colors.text, fontSize: 22, fontWeight: theme.fontWeight.black },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },
  dateLine: { marginTop: 6, color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

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
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    fontWeight: theme.fontWeight.bold,
  },

  datePill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: Platform.OS === "android" ? "rgba(12,14,16,0.18)" : "rgba(12,14,16,0.14)",
    minWidth: 82,
    alignItems: "center",
  },
  datePillActive: {
    borderColor: "rgba(79,224,138,0.40)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  dateTop: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  dateBottom: { color: theme.colors.text, fontSize: 13, fontWeight: theme.fontWeight.black, marginTop: 4 },

  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leagueText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  content: { padding: theme.spacing.lg },
  card: { padding: theme.spacing.md },

  rowWrap: { marginBottom: 12 },
  rowCard: { borderRadius: 24 },
  cardPress: { borderRadius: 24, overflow: "hidden" },

  rowInner: { padding: 16, gap: 12 },

  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },

  crestWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestImg: { width: 38, height: 38, opacity: 0.98 },
  crestFallback: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black },

  centerCol: { flex: 1, alignItems: "center", gap: 6 },

  homeName: { color: theme.colors.text, fontSize: 17, fontWeight: theme.fontWeight.black, textAlign: "center" },
  awayName: { color: theme.colors.text, fontSize: 17, fontWeight: theme.fontWeight.black, textAlign: "center" },
  vs: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  kickoff: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, textAlign: "center", marginTop: 2 },
  venueLine: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, textAlign: "center" },
  kickoffHint: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, textAlign: "center" },

  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 },

  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  // subtle gold for confirmed (important)
  badgeGold: {
    borderColor: "rgba(255,210,77,0.30)",
    backgroundColor: "rgba(255,210,77,0.10)",
  },
  badgeText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 11 },
  badgeTextGold: { color: "rgba(255,210,77,0.92)" },

  badgeWarn: {
    borderColor: "rgba(255,210,77,0.30)",
    backgroundColor: "rgba(255,210,77,0.08)",
  },
  badgeTextWarn: { color: "rgba(255,210,77,0.92)" },

  tapHint: { color: theme.colors.textTertiary, fontSize: 11, fontWeight: theme.fontWeight.bold, opacity: 0.9 },

  followPill: {
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  followPillOn: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  followPillText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  followPillTextOn: { color: "rgba(79,224,138,0.92)" },

  expandArea: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },

  expandGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  expandGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black },

  expandPrimary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.28)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  expandPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  center: { paddingVertical: 20, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold },

  // Modal
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

  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthNav: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavText: { color: theme.colors.textSecondary, fontSize: 22, fontWeight: theme.fontWeight.black, marginTop: -2 },
  monthLabel: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },

  weekHeader: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 },
  weekDay: { width: "14.28%", textAlign: "center", color: theme.colors.textTertiary, fontSize: 11, fontWeight: theme.fontWeight.black },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: 6 },
  dayCell: {
    width: "13.35%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellInRange: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(79,224,138,0.06)" },
  dayCellEdge: { borderColor: "rgba(79,224,138,0.28)", backgroundColor: "rgba(79,224,138,0.10)" },
  dayText: { color: theme.colors.text, fontSize: 12, fontWeight: theme.fontWeight.black },

  modalHint: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16 },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  actionBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  actionGhost: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle },
  actionGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black },

  actionPrimary: { borderColor: "rgba(79,224,138,0.28)", backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default },
  actionPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  modalFootnote: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16, opacity: 0.9 },
});
