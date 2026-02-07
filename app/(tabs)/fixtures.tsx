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
/* Screen
 * -------------------------------------------------------------------------- */

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 365-day strip starting TOMORROW (never show today)
  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  // Route overrides (optional): leagueId, from, to
  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeFrom = useMemo(() => coerceString((params as any)?.from), [params]);
  const routeTo = useMemo(() => coerceString((params as any)?.to), [params]);

  const initialFrom = useMemo(() => clampIsoToWindow(routeFrom ?? minIso, minIso, maxIso), [routeFrom, minIso, maxIso]);
  const initialTo = useMemo(() => clampIsoToWindow(routeTo ?? initialFrom, minIso, maxIso), [routeTo, initialFrom, minIso, maxIso]);

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

  // Range selection: start → end → reset
  const [rangeFrom, setRangeFrom] = useState<string>(initialFrom);
  const [rangeTo, setRangeTo] = useState<string>(initialTo);

  const normalizedRange = useMemo(() => normalizeRange(rangeFrom, rangeTo), [rangeFrom, rangeTo]);
  const isRange = useMemo(() => normalizedRange.from !== normalizedRange.to, [normalizedRange]);

  // Leagues: multi-select up to 10, default = All (empty array => all leagues)
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<number[]>(() => {
    if (routeLeagueId && Number.isFinite(routeLeagueId)) return [routeLeagueId];
    return [];
  });

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

  // Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Compute placeholder ids from the fetched set (works for single day or ranges)
  const placeholderIds = useMemo(() => computeLikelyPlaceholderTbcIds(rows), [rows]);

  // Fetch only for selected day/range
  const fetchFrom = normalizedRange.from;
  const fetchTo = normalizedRange.to;

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

    // If single-day mode, keep only that day (defensive)
    const dayFiltered = !isRange ? base.filter((r) => fixtureIsoDateOnly(r) === normalizedRange.from) : base;

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
  }, [rows, isRange, normalizedRange.from, qNorm]);

  function handleDateTap(iso: string) {
    const d = clampIsoToWindow(iso, minIso, maxIso);

    // start → end → reset
    if (rangeFrom === rangeTo) {
      if (d === rangeFrom) return;
      setRangeTo(d);
      return;
    }

    setRangeFrom(d);
    setRangeTo(d);
  }

  function isInSelectedRange(iso: string) {
    const { from, to } = normalizedRange;
    return iso >= from && iso <= to;
  }

  function isRangeEdge(iso: string) {
    const { from, to } = normalizedRange;
    return iso === from || iso === to;
  }

  function goMatch(id: string, ctx?: { leagueId?: number | null; season?: number | null }) {
    const fid = String(id ?? "").trim();
    if (!fid) return;

    router.push({
      pathname: "/match/[id]",
      params: {
        id: fid,
        from: normalizedRange.from,
        to: normalizedRange.to,
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
        from: normalizedRange.from,
        to: normalizedRange.to,
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

    // Make row keys bulletproof across multi-league merges
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

  return (
    <Background imageUrl={getBackground("fixtures")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Fixtures</Text>
          <Text style={styles.subtitle}>{leagueSubtitle}</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search team, city, venue, or league"
            placeholderTextColor={theme.colors.textTertiary}
            style={styles.search}
          />

          {/* Date strip (tomorrow -> +365) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
            {dateStrip.map((d, i) => {
              const inRange = isInSelectedRange(d.iso);
              const edge = isRangeEdge(d.iso);
              const active = !isRange && d.iso === normalizedRange.from;

              return (
                <Pressable
                  key={`${d.iso}-${i}`}
                  onPress={() => handleDateTap(d.iso)}
                  style={[
                    styles.datePill,
                    inRange && styles.datePillInRange,
                    edge && styles.datePillEdge,
                    active && styles.datePillActive,
                  ]}
                >
                  <Text style={styles.dateTop}>{d.labelTop}</Text>
                  <Text style={styles.dateBottom}>{d.labelBottom}</Text>
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
            {isRange ? `Showing ${normalizedRange.from} → ${normalizedRange.to}` : `Showing ${normalizedRange.from}`}
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

  title: { color: theme.colors.text, fontSize: 22, fontWeight: "700" },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13 },

  helperLine: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    marginTop: -4,
  },

  search: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
  },

  datePill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 10,
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  datePillActive: {
    borderColor: "rgba(79,224,138,0.55)",
    backgroundColor: "rgba(79,224,138,0.08)",
  },
  datePillInRange: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(79,224,138,0.05)",
  },
  datePillEdge: {
    borderColor: "rgba(79,224,138,0.55)",
    backgroundColor: "rgba(79,224,138,0.08)",
  },

  dateTop: { color: theme.colors.textSecondary, fontSize: 12 },
  dateBottom: { color: theme.colors.text },

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
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.55)",
    backgroundColor: "rgba(79,224,138,0.08)",
  },
  leagueText: { color: theme.colors.textSecondary, fontWeight: "700" },

  content: { padding: theme.spacing.lg },
  card: { padding: theme.spacing.md },

  rowWrap: { marginBottom: 10 },
  rowCard: { borderRadius: 18 },

  rowMain: {},
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
  },
  crestImg: { width: 30, height: 30 },
  crestFallback: { color: theme.colors.textSecondary, fontWeight: "900" },

  centerPress: { flex: 1 },
  centerBlock: { alignItems: "center", gap: 6 },

  teamLine: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  vs: { color: theme.colors.textSecondary, fontSize: 12 },

  metaStack: { alignItems: "center", gap: 6 },
  meta: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "center" },
  metaSecondary: { color: theme.colors.textTertiary, fontSize: 11, textAlign: "center", fontWeight: "800" },

  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
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

  tapHint: { color: theme.colors.textTertiary, fontSize: 11, fontWeight: "800" },

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
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
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
});
