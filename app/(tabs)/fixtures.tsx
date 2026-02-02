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
  Platform,
  Keyboard,
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

import { LEAGUES, getRollingWindowIso, normalizeWindowIso, type LeagueOption } from "@/src/constants/football";
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getFlagImageUrl } from "@/src/utils/flagImages";

import authStore from "@/src/state/auth";
import { listWatchedFixtureIds, watchFixture, unwatchFixture } from "@/src/services/watchlist";

type LeagueMode = "single" | "multi";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function normalizeVenueKey(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[,/|].*$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function weekdayShort(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function dayMonth(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function rowTitle(r: FixtureListRow) {
  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  return `${home} vs ${away}`;
}

function rowMeta(r: FixtureListRow) {
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
  const venue = r?.fixture?.venue?.name ?? "";
  const city = r?.fixture?.venue?.city ?? "";
  const extra = [venue, city].filter(Boolean).join(" • ");
  return extra ? `${kickoff} • ${extra}` : kickoff;
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function resolveLeagueSelection(
  paramsLeagueId: unknown,
  paramsSeason: unknown
): {
  mode: LeagueMode;
  selected?: LeagueOption;
  selectedMany?: LeagueOption[];
} {
  const leagueIdStr = String(paramsLeagueId ?? "").trim().toLowerCase();
  const leagueIdNum = coerceNumber(paramsLeagueId);
  const seasonNum = coerceNumber(paramsSeason);

  if (leagueIdStr === "all") return { mode: "multi", selectedMany: LEAGUES };

  if (!leagueIdNum) return { mode: "multi", selectedMany: LEAGUES };

  const match = LEAGUES.find((l) => l.leagueId === leagueIdNum);
  if (!match) return { mode: "multi", selectedMany: LEAGUES };

  const season = seasonNum ?? match.season;
  return { mode: "single", selected: { ...match, season } };
}

function LeagueFlag({ code }: { code: string }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flag} />;
}

function CrestSquare({ r }: { r: FixtureListRow }) {
  const homeName = r?.teams?.home?.name ?? "";
  const logo = r?.teams?.home?.logo;

  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(homeName)}</Text>
      )}
      <View pointerEvents="none" style={styles.crestRing} />
    </View>
  );
}

// ------------------------
// Date model: upcoming weekend default
// + long horizontal strip (end of season)
// ------------------------

function tomorrowLocalMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

function nextWeekendStartLocal(): Date {
  const base = tomorrowLocalMidnight();
  const day = base.getDay(); // 0 Sun ... 6 Sat
  const daysUntilSat = (6 - day + 7) % 7;
  const sat = new Date(base);
  sat.setDate(sat.getDate() + daysUntilSat);
  sat.setHours(0, 0, 0, 0);
  return sat;
}

function buildDateStrip(fromIso: string, toIso: string) {
  const start = new Date(`${fromIso}T00:00:00`);
  const end = new Date(`${toIso}T00:00:00`);
  const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1);

  const out: { iso: string; labelTop: string; labelBottom: string }[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    out.push({ iso: isoDay(d), labelTop: weekdayShort(d), labelBottom: dayMonth(d) });
  }
  return out;
}

// ------------------------
// TBC detection (simple V1)
// If API gives placeholder times, we label them.
// This is intentionally conservative; you’ll refine per league later.
// ------------------------
function isKickoffTbc(r: FixtureListRow): boolean {
  const status = String(r?.fixture?.status?.short ?? "").toUpperCase();
  // common placeholders / not started markers can still be scheduled; don't treat all as tbc
  // "TBD/TBC" flags if provided
  if (status.includes("TBD") || status.includes("TBC")) return true;

  const iso = String(r?.fixture?.date ?? "").trim();
  if (!iso) return true;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return true;

  // Placeholder midnight is often used when time not set
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return true;

  return false;
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // boot auth (safe to call here even if you later centralize it)
  const booted = authStore((s) => s.booted);
  const user = authStore((s) => s.user);
  const initAuth = authStore((s) => s.init);
  useEffect(() => {
    if (!booted) initAuth().catch(() => null);
  }, [booted, initAuth]);

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => coerceString(params.from), [params.from]);
  const toParam = useMemo(() => coerceString(params.to), [params.to]);

  // Default: upcoming weekend window (but still respect route overrides)
  const weekendFrom = useMemo(() => isoDay(nextWeekendStartLocal()), []);
  const weekendTo = useMemo(() => isoDay(addDays(nextWeekendStartLocal(), 1)), []);

  const window = useMemo(() => {
    const rawFrom = fromParam ?? weekendFrom ?? rolling.from;
    const rawTo = toParam ?? weekendTo ?? rolling.to;
    return normalizeWindowIso({ from: rawFrom, to: rawTo }, 365);
  }, [fromParam, toParam, weekendFrom, weekendTo, rolling.from, rolling.to]);

  const from = window.from;
  const to = window.to;

  const selection = useMemo(() => resolveLeagueSelection(params.leagueId, params.season), [params.leagueId, params.season]);

  const [mode, setMode] = useState<LeagueMode>(selection.mode);
  const [selectedSingle, setSelectedSingle] = useState<LeagueOption>(selection.selected ?? LEAGUES[0]);
  const [selectedMany, setSelectedMany] = useState<LeagueOption[]>(selection.selectedMany ?? LEAGUES);

  useEffect(() => {
    setMode(selection.mode);
    if (selection.selected) setSelectedSingle(selection.selected);
    if (selection.selectedMany) setSelectedMany(selection.selectedMany);
  }, [selection.mode, selection.selected, selection.selectedMany]);

  const venueParamRaw = useMemo(() => coerceString((params as any).venue), [params]);
  const [query, setQuery] = useState<string>(venueParamRaw ?? "");
  const qNorm = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    setQuery(venueParamRaw ?? "");
  }, [venueParamRaw]);

  const dateStrip = useMemo(() => buildDateStrip(from, to), [from, to]);
  const [activeDay, setActiveDay] = useState<string>(dateStrip[0]?.iso ?? from);

  useEffect(() => {
    setActiveDay(dateStrip[0]?.iso ?? from);
  }, [from]);

  // Watched state
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [watchLoading, setWatchLoading] = useState(false);

  const refreshWatched = useCallback(async () => {
    if (!user) {
      setWatched(new Set());
      return;
    }
    try {
      setWatchLoading(true);
      const set = await listWatchedFixtureIds();
      setWatched(set);
    } catch {
      // ignore; don't block fixtures
    } finally {
      setWatchLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWatched();
  }, [refreshWatched]);

  const toggleWatch = useCallback(
    async (r: FixtureListRow, leagueId?: number, season?: number) => {
      const id = r?.fixture?.id != null ? String(r.fixture.id) : "";
      if (!id) return;

      if (!user) {
        Alert.alert("Sign in required", "Sign in to watch fixtures and get kickoff-change alerts later.");
        return;
      }

      const isWatchedNow = watched.has(id);

      try {
        const kickoffIso = r?.fixture?.date ? String(r.fixture.date) : null;
        const tbc = isKickoffTbc(r);

        if (isWatchedNow) {
          await unwatchFixture(id);
          setWatched((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        } else {
          await watchFixture({
            fixtureId: id,
            leagueId,
            season,
            lastKnownKickoffIso: kickoffIso,
            lastKnownIsTbc: tbc,
          });
          setWatched((prev) => new Set(prev).add(id));
        }
      } catch (e: any) {
        Alert.alert("Watch failed", e?.message ?? "Could not update watch status.");
      }
    },
    [user, watched]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rowsSingle, setRowsSingle] = useState<FixtureListRow[]>([]);
  const [rowsMulti, setRowsMulti] = useState<Record<number, FixtureListRow[]>>({});

  useEffect(() => {
    let cancelled = false;

    async function runSingle() {
      setError(null);
      setLoading(true);
      setRowsSingle([]);

      try {
        const res = await getFixtures({
          league: selectedSingle.leagueId,
          season: selectedSingle.season,
          from,
          to,
        });

        if (cancelled) return;
        setRowsSingle(Array.isArray(res) ? res : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function runMulti() {
      setError(null);
      setLoading(true);
      setRowsMulti({});

      try {
        const results = await Promise.all(
          selectedMany.map(async (l) => {
            const res = await getFixtures({
              league: l.leagueId,
              season: l.season,
              from,
              to,
            });
            return [l.leagueId, Array.isArray(res) ? res : []] as const;
          })
        );

        if (cancelled) return;

        const map: Record<number, FixtureListRow[]> = {};
        for (const [leagueId, rows] of results) map[leagueId] = rows;
        setRowsMulti(map);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (mode === "single") runSingle();
    else runMulti();

    return () => {
      cancelled = true;
    };
  }, [mode, selectedSingle, selectedMany, from, to]);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);
  const clearQuery = useCallback(() => {
    setQuery("");
    Keyboard.dismiss();
  }, []);

  const passesQuery = useCallback(
    (r: FixtureListRow) => {
      const q = qNorm.trim().toLowerCase();
      if (!q) return true;

      const home = norm(r?.teams?.home?.name);
      const away = norm(r?.teams?.away?.name);

      const venueName = String(r?.fixture?.venue?.name ?? "").trim();
      const venueCity = String(r?.fixture?.venue?.city ?? "").trim();

      const venue = norm(venueName);
      const city = norm(venueCity);

      if (home.includes(q) || away.includes(q) || venue.includes(q) || city.includes(q)) return true;

      const qKey = normalizeVenueKey(q);
      if (!qKey) return false;

      const venueKey = normalizeVenueKey(venueName);
      const cityKey = normalizeVenueKey(venueCity);

      return (
        venueKey === qKey ||
        venueKey.includes(qKey) ||
        qKey.includes(venueKey) ||
        cityKey === qKey ||
        cityKey.includes(qKey) ||
        qKey.includes(cityKey)
      );
    },
    [qNorm]
  );

  const isActiveDay = useCallback(
    (r: FixtureListRow) => {
      const d = fixtureIsoDateOnly(r);
      if (!d) return false;
      return d === activeDay;
    },
    [activeDay]
  );

  const filteredSingle = useMemo(() => rowsSingle.filter(passesQuery).filter(isActiveDay), [rowsSingle, passesQuery, isActiveDay]);

  const filteredMulti = useMemo(() => {
    const out: Record<number, FixtureListRow[]> = {};
    for (const l of selectedMany) {
      const rows = rowsMulti[l.leagueId] ?? [];
      out[l.leagueId] = rows.filter(passesQuery).filter(isActiveDay);
    }
    return out;
  }, [rowsMulti, selectedMany, passesQuery, isActiveDay]);

  const subtitle = useMemo(() => {
    const date = formatUkDateOnly(activeDay);
    if (mode === "single") return `${selectedSingle.label} • ${date}`;
    return `${selectedMany.length} leagues • ${date}`;
  }, [mode, selectedSingle.label, selectedMany.length, activeDay]);

  const goMatchWithContext = useCallback(
    (fixtureIdStr: string, leagueIdForRow?: number, seasonForRow?: number) => {
      const lid = mode === "single" ? selectedSingle.leagueId : leagueIdForRow ?? selectedSingle.leagueId;
      const sea = mode === "single" ? selectedSingle.season : seasonForRow ?? selectedSingle.season;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: fixtureIdStr,
          leagueId: String(lid),
          season: String(sea),
          from,
          to,
          ...(qNorm ? { venue: qNorm } : {}),
        },
      } as any);
    },
    [router, mode, selectedSingle.leagueId, selectedSingle.season, from, to, qNorm]
  );

  const emptyMessage = useMemo(() => {
    if (!qNorm) return "Try another day, or change leagues.";
    return "Try a different search term (team, city, or venue) or clear the filter.";
  }, [qNorm]);

  const toggleMode = useCallback(() => setMode((m) => (m === "single" ? "multi" : "single")), []);

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <Pressable onPress={toggleMode} style={styles.modePill} hitSlop={10}>
              <Text style={styles.modePillText}>{mode === "single" ? "One league" : "Top leagues"}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!user) {
                  Alert.alert("Sign in", "Use Match → Watch to start. We’ll add a dedicated sign-in screen next.");
                  return;
                }
                Alert.alert("Signed in", user.email ?? "Account");
              }}
              style={[styles.modePill, { borderColor: "rgba(79,224,138,0.22)" }]}
              hitSlop={10}
            >
              <Text style={styles.modePillText}>{user ? "Account" : "Sign in"}</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search team, city, or venue"
              placeholderTextColor={theme.colors.textTertiary}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={dismissKeyboard}
            />

            {qNorm.length > 0 ? (
              <Pressable onPress={clearQuery} style={styles.clearBtn} hitSlop={10}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Date strip: FULL WINDOW (to end of selected range) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateStrip.map((d) => {
              const active = d.iso === activeDay;
              return (
                <Pressable key={d.iso} onPress={() => setActiveDay(d.iso)} style={[styles.datePill, active && styles.datePillActive]}>
                  <Text style={[styles.dateTop, active && styles.dateTopActive]}>{d.labelTop}</Text>
                  <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>{d.labelBottom}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* League pills (single mode only) */}
          {mode === "single" ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
              {LEAGUES.map((l) => {
                const active = l.leagueId === selectedSingle.leagueId;
                return (
                  <Pressable
                    key={l.leagueId}
                    onPress={() => setSelectedSingle(l)}
                    style={[styles.leaguePill, active && styles.leaguePillActive]}
                  >
                    <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                    <LeagueFlag code={l.countryCode} />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        {/* BODY */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassCard strength="default" style={styles.card}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error ? (
              mode === "single" ? (
                filteredSingle.length === 0 ? (
                  <EmptyState title="No matches found" message={emptyMessage} />
                ) : (
                  <View style={styles.list}>
                    {filteredSingle.map((r, idx) => {
                      const id = r?.fixture?.id;
                      const fixtureIdStr = id ? String(id) : null;
                      const key = fixtureIdStr ?? `idx-${idx}`;
                      const watchedNow = fixtureIdStr ? watched.has(fixtureIdStr) : false;
                      const tbc = isKickoffTbc(r);

                      return (
                        <GlassCard key={key} strength="subtle" noPadding style={styles.rowCard}>
                          <Pressable
                            disabled={!fixtureIdStr}
                            onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr) : null)}
                            style={styles.rowMain}
                          >
                            <View style={styles.rowInner}>
                              <CrestSquare r={r} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>{rowTitle(r)}</Text>
                                <Text style={styles.rowMeta}>
                                  {tbc ? "TBC • " : ""}
                                  {rowMeta(r)}
                                </Text>
                              </View>

                              <Pressable
                                hitSlop={10}
                                onPress={() => (fixtureIdStr ? toggleWatch(r, selectedSingle.leagueId, selectedSingle.season) : null)}
                                style={[styles.watchBtn, watchedNow && styles.watchBtnActive]}
                              >
                                <Text style={[styles.watchText, watchedNow && styles.watchTextActive]}>
                                  {watchedNow ? "Watching" : "Watch"}
                                </Text>
                              </Pressable>

                              <Text style={styles.chev}>›</Text>
                            </View>
                          </Pressable>
                        </GlassCard>
                      );
                    })}
                  </View>
                )
              ) : selectedMany.every((l) => (filteredMulti[l.leagueId]?.length ?? 0) === 0) ? (
                <EmptyState title="No matches found" message={emptyMessage} />
              ) : (
                <View style={styles.multiWrap}>
                  {selectedMany.map((l) => {
                    const leagueRows = filteredMulti[l.leagueId] ?? [];
                    if (leagueRows.length === 0) return null;

                    return (
                      <View key={l.leagueId} style={styles.leagueGroup}>
                        <View style={styles.groupHeader}>
                          <View style={styles.groupTitleRow}>
                            <Text style={styles.groupTitle}>{l.label}</Text>
                            <LeagueFlag code={l.countryCode} />
                          </View>
                          <Text style={styles.groupMeta}>{formatUkDateOnly(activeDay)}</Text>
                        </View>

                        <View style={styles.list}>
                          {leagueRows.map((r, idx) => {
                            const id = r?.fixture?.id;
                            const fixtureIdStr = id ? String(id) : null;
                            const key = fixtureIdStr ?? `l-${l.leagueId}-${idx}`;
                            const watchedNow = fixtureIdStr ? watched.has(fixtureIdStr) : false;
                            const tbc = isKickoffTbc(r);

                            return (
                              <GlassCard key={key} strength="subtle" noPadding style={styles.rowCard}>
                                <Pressable
                                  disabled={!fixtureIdStr}
                                  onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr, l.leagueId, l.season) : null)}
                                  style={styles.rowMain}
                                >
                                  <View style={styles.rowInner}>
                                    <CrestSquare r={r} />
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.rowTitle}>{rowTitle(r)}</Text>
                                      <Text style={styles.rowMeta}>
                                        {tbc ? "TBC • " : ""}
                                        {rowMeta(r)}
                                      </Text>
                                    </View>

                                    <Pressable
                                      hitSlop={10}
                                      onPress={() => (fixtureIdStr ? toggleWatch(r, l.leagueId, l.season) : null)}
                                      style={[styles.watchBtn, watchedNow && styles.watchBtnActive]}
                                    >
                                      <Text style={[styles.watchText, watchedNow && styles.watchTextActive]}>
                                        {watchedNow ? "Watching" : "Watch"}
                                      </Text>
                                    </Pressable>

                                    <Text style={styles.chev}>›</Text>
                                  </View>
                                </Pressable>
                              </GlassCard>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )
            ) : null}

            {!loading && !error && user && watchLoading ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.muted}>Syncing watchlist…</Text>
              </View>
            ) : null}

            {!loading && !error && !user ? (
              <View style={styles.signInHint}>
                <Text style={styles.signInHintTitle}>Want kickoff-change alerts later?</Text>
                <Text style={styles.signInHintBody}>Sign in first, then tap “Watch” on any fixture.</Text>
              </View>
            ) : null}
          </GlassCard>

          <View style={{ height: 18 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: 12,
  },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  title: { color: theme.colors.text, fontSize: 22, fontWeight: theme.fontWeight.black },
  subtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  modePill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  modePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },

  // Search
  searchBox: {
    borderWidth: 1,
    borderColor: theme.glass.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 15, paddingVertical: Platform.OS === "ios" ? 6 : 4, fontWeight: theme.fontWeight.bold },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  clearBtnText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },

  // Date strip
  dateRow: { gap: 10, paddingRight: theme.spacing.lg },
  datePill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 74,
    alignItems: "center",
    overflow: "hidden",
  },
  datePillActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  dateTop: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },
  dateTopActive: { color: theme.colors.textSecondary },
  dateBottom: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  dateBottomActive: { color: theme.colors.text },

  // League pills (single only)
  leagueRow: { gap: 10, paddingRight: theme.spacing.lg },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  leaguePillTextActive: { color: theme.colors.text },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  // Body
  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  card: { padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // Lists
  list: { gap: 10 },
  rowCard: { borderRadius: 16, overflow: "hidden" },
  rowMain: { borderRadius: 16 },
  rowInner: { paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 },

  crestWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestRing: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: "rgba(79,224,138,0.10)", borderRadius: 12 },
  crestImg: { width: 30, height: 30, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.4 },

  rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },
  chev: { color: theme.colors.textTertiary, fontSize: 24, marginTop: -2 },

  watchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
    marginLeft: 4,
  },
  watchBtnActive: {
    borderColor: "rgba(79,224,138,0.30)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  watchText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  watchTextActive: { color: "rgba(79,224,138,0.92)" },

  // Multi grouping
  multiWrap: { gap: 18 },
  leagueGroup: { gap: 10 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  groupMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  signInHint: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  signInHintTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 13 },
  signInHintBody: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold, fontSize: 12, lineHeight: 16 },
});
