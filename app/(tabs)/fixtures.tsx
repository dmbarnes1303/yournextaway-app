// app/(tabs)/fixtures.tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
  Keyboard,
  Image,
  Modal,
  FlatList,
  ListRenderItemInfo,
  Alert,
  ScrollView,
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
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateOnly } from "@/src/utils/formatters";
import { getFlagImageUrl } from "@/src/utils/flagImages";

type Mode = "browse" | "plan";

type DateChip = {
  iso: string; // YYYY-MM-DD
  top: string; // weekday short
  bottom: string; // dd MMM
};

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function parseIsoToLocalMidnight(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  const dt = new Date();
  dt.setFullYear(y, (m ?? 1) - 1, d ?? 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function weekdayShort(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}
function dayMonth(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function nextSaturdayIso(from?: Date) {
  const base = from ? new Date(from) : new Date();
  base.setHours(0, 0, 0, 0);
  const day = base.getDay(); // 0 Sun ... 6 Sat
  const daysUntilSat = (6 - day + 7) % 7;
  const sat = addDays(base, daysUntilSat === 0 ? 7 : daysUntilSat);
  return isoDate(sat);
}

function seasonEndIso(season: number) {
  return `${season + 1}-06-30`;
}

function buildDateChips(fromIso: string, toIso: string): DateChip[] {
  const from = parseIsoToLocalMidnight(fromIso);
  const to = parseIsoToLocalMidnight(toIso);
  const days = Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));

  const out: DateChip[] = [];
  for (let i = 0; i <= days; i++) {
    const d = addDays(from, i);
    out.push({
      iso: isoDate(d),
      top: weekdayShort(d),
      bottom: dayMonth(d),
    });
  }
  return out;
}

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function kickoffStatusShort(r: FixtureListRow) {
  return String(r?.fixture?.status?.short ?? "").trim().toUpperCase();
}

function kickoffStatusLong(r: FixtureListRow) {
  return String(r?.fixture?.status?.long ?? "").trim().toLowerCase();
}

function parseKickoffDate(r: FixtureListRow): Date | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const dt = new Date(String(raw));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

/**
 * Kickoff is considered "TBC" if:
 * - API status says TBD/TBC
 * - or status.long implies time not defined
 * - or kickoff time resolves to 00:00 (common placeholder)
 *
 * Conservative by design: better to label TBC than mislead users.
 */
function isKickoffTBC(r: FixtureListRow): boolean {
  const s = kickoffStatusShort(r);
  if (s === "TBD" || s === "TBC") return true;

  const long = kickoffStatusLong(r);
  if (long.includes("to be defined") || long.includes("time to be defined") || long.includes("tbd")) return true;

  const dt = parseKickoffDate(r);
  if (!dt) return true; // no date -> treat as not confirmed for UI
  const hh = dt.getHours();
  const mm = dt.getMinutes();
  if (hh === 0 && mm === 0) return true;

  return false;
}

function rowTimeLabel(r: FixtureListRow) {
  if (isKickoffTBC(r)) return "TBC";

  const dt = parseKickoffDate(r);
  if (!dt) return "--:--";
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function rowHome(r: FixtureListRow) {
  return r?.teams?.home?.name ?? "Home";
}
function rowAway(r: FixtureListRow) {
  return r?.teams?.away?.name ?? "Away";
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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

function LeagueFlag({ code }: { code: string }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flag} />;
}

function resolveInitialLeagues(paramsLeagueId: unknown, paramsSeason: unknown) {
  const leagueIdStr = String(paramsLeagueId ?? "").trim().toLowerCase();
  const leagueIdNum = coerceNumber(paramsLeagueId);
  const seasonNum = coerceNumber(paramsSeason);

  if (leagueIdStr === "all") {
    return { selected: LEAGUES.slice(0, 10), season: seasonNum ?? (LEAGUES[0]?.season ?? new Date().getFullYear()) };
  }

  if (!leagueIdNum) {
    const s = seasonNum ?? (LEAGUES[0]?.season ?? new Date().getFullYear());
    return { selected: [LEAGUES[0]], season: s };
  }

  const match = LEAGUES.find((l) => l.leagueId === leagueIdNum) ?? LEAGUES[0];
  const s = seasonNum ?? match.season;
  return { selected: [{ ...match, season: s }], season: s };
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Prefill search from params (session-only)
  const venueParamRaw = useMemo(() => coerceString((params as any).venue), [params]);
  const [query, setQuery] = useState<string>(venueParamRaw ?? "");
  const qNorm = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    setQuery(venueParamRaw ?? "");
  }, [venueParamRaw]);

  const initial = useMemo(() => resolveInitialLeagues(params.leagueId, params.season), [params.leagueId, params.season]);
  const [selectedLeagues, setSelectedLeagues] = useState<LeagueOption[]>(initial.selected);

  // Mode
  const [mode, setMode] = useState<Mode>("plan");

  const season = useMemo(() => {
    return selectedLeagues?.[0]?.season ?? initial.season ?? new Date().getFullYear();
  }, [selectedLeagues, initial.season]);

  // Date strip range: today -> end of season
  const todayIso = useMemo(() => isoDate(new Date()), []);
  const endIso = useMemo(() => seasonEndIso(season), [season]);
  const dates = useMemo(() => buildDateChips(todayIso, endIso), [todayIso, endIso]);

  // Default active: upcoming weekend
  const [activeDay, setActiveDay] = useState<string>(() => nextSaturdayIso(new Date()));

  useEffect(() => {
    const exists = dates.some((d) => d.iso === activeDay);
    if (!exists) setActiveDay(nextSaturdayIso(new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.length]);

  // Scroll date strip to active
  const dateListRef = useRef<FlatList<DateChip>>(null);
  useEffect(() => {
    const idx = dates.findIndex((d) => d.iso === activeDay);
    if (idx >= 0) {
      requestAnimationFrame(() => {
        dateListRef.current?.scrollToIndex({ index: Math.max(0, idx - 2), animated: true });
      });
    }
  }, [activeDay, dates]);

  // Filters modal
  const [filtersOpen, setFiltersOpen] = useState(false);
  const openFilters = useCallback(() => setFiltersOpen(true), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const [draftLeagues, setDraftLeagues] = useState<LeagueOption[]>(selectedLeagues);
  useEffect(() => setDraftLeagues(selectedLeagues), [selectedLeagues, filtersOpen]);

  const toggleLeague = useCallback((l: LeagueOption) => {
    setDraftLeagues((prev) => {
      const has = prev.some((x) => x.leagueId === l.leagueId);
      if (has) return prev.filter((x) => x.leagueId !== l.leagueId);
      if (prev.length >= 10) return prev;
      return [...prev, l];
    });
  }, []);

  const applyFilters = useCallback(() => {
    if (draftLeagues.length === 0) {
      Alert.alert("Pick at least one league", "Select 1–10 leagues to view fixtures.");
      return;
    }
    setSelectedLeagues(draftLeagues);
    closeFilters();
  }, [draftLeagues, closeFilters]);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "plan" ? "browse" : "plan"));
  }, []);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);
  const clearQuery = useCallback(() => {
    setQuery("");
    Keyboard.dismiss();
  }, []);

  // Data (single day only)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowsByLeague, setRowsByLeague] = useState<Record<number, FixtureListRow[]>>({});

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRowsByLeague({});

      try {
        const leagues = selectedLeagues.slice(0, 10);
        const results = await Promise.all(
          leagues.map(async (l) => {
            const res = await getFixtures({
              league: l.leagueId,
              season: l.season,
              from: activeDay,
              to: activeDay,
            });
            return [l.leagueId, Array.isArray(res) ? res : []] as const;
          })
        );

        if (cancelled) return;

        const map: Record<number, FixtureListRow[]> = {};
        for (const [leagueId, rows] of results) map[leagueId] = rows;
        setRowsByLeague(map);
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
  }, [selectedLeagues, activeDay]);

  // Search filter
  const passesQuery = useCallback(
    (r: FixtureListRow) => {
      const q = qNorm.toLowerCase();
      if (!q) return true;

      const home = norm(r?.teams?.home?.name);
      const away = norm(r?.teams?.away?.name);
      const venue = norm(r?.fixture?.venue?.name);
      const city = norm(r?.fixture?.venue?.city);

      return home.includes(q) || away.includes(q) || venue.includes(q) || city.includes(q);
    },
    [qNorm]
  );

  const grouped = useMemo(() => {
    const leagues = selectedLeagues.slice(0, 10);
    return leagues
      .map((l) => {
        const raw = rowsByLeague[l.leagueId] ?? [];
        const filtered = raw.filter(passesQuery).filter((r) => r?.fixture?.id != null);

        filtered.sort((a, b) => {
          const ta = a?.fixture?.date ? new Date(String(a.fixture.date)).getTime() : 0;
          const tb = b?.fixture?.date ? new Date(String(b.fixture.date)).getTime() : 0;
          return ta - tb;
        });

        return { league: l, rows: filtered };
      })
      .filter((g) => g.rows.length > 0);
  }, [selectedLeagues, rowsByLeague, passesQuery]);

  const totalMatches = useMemo(() => grouped.reduce((acc, g) => acc + g.rows.length, 0), [grouped]);

  const subtitle = useMemo(() => {
    const n = selectedLeagues.length;
    if (n === 1) return selectedLeagues[0]?.label ?? "League";
    return `${n} leagues`;
  }, [selectedLeagues]);

  const goRow = useCallback(
    (r: FixtureListRow, league: LeagueOption) => {
      const id = r?.fixture?.id;
      if (!id) return;
      const fixtureId = String(id);

      const baseParams: any = {
        leagueId: String(league.leagueId),
        season: String(league.season),
        from: activeDay,
        to: activeDay,
        ...(qNorm ? { venue: qNorm } : {}),
      };

      if (mode === "plan") {
        router.push({ pathname: "/trip/build", params: { ...baseParams, fixtureId } } as any);
        return;
      }

      router.push({ pathname: "/match/[id]", params: { ...baseParams, id: fixtureId } } as any);
    },
    [router, mode, activeDay, qNorm]
  );

  const emptyMessage = useMemo(() => {
    if (!qNorm) return "Try a different day or adjust leagues.";
    return "No matches match that filter. Try another term or clear search.";
  }, [qNorm]);

  const renderDateChip = useCallback(
    ({ item }: ListRenderItemInfo<DateChip>) => {
      const active = item.iso === activeDay;
      return (
        <Pressable
          onPress={() => setActiveDay(item.iso)}
          style={({ pressed }) => [
            styles.datePill,
            active && styles.datePillActive,
            pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
          ]}
          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
        >
          <Text style={[styles.dateTop, active && styles.dateTopActive]}>{item.top}</Text>
          <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>{item.bottom}</Text>
        </Pressable>
      );
    },
    [activeDay]
  );

  const getDateItemLayout = useCallback((_: any, index: number) => {
    const ITEM_W = 78;
    const GAP = 10;
    const len = ITEM_W + GAP;
    return { length: len, offset: len * index, index };
  }, []);

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>
                {subtitle} • {formatUkDateOnly(activeDay)}
              </Text>
            </View>

            <Pressable
              onPress={toggleMode}
              style={({ pressed }) => [styles.modePill, pressed && { opacity: 0.94 }]}
              hitSlop={10}
              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
            >
              <Text style={styles.modePillText}>{mode === "plan" ? "Plan" : "Browse"}</Text>
            </Pressable>

            <Pressable
              onPress={openFilters}
              style={({ pressed }) => [styles.filtersPill, pressed && { opacity: 0.94 }]}
              hitSlop={10}
              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
            >
              <Text style={styles.filtersPillText}>Filters</Text>
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

          {/* DATE STRIP */}
          <FlatList
            ref={dateListRef}
            horizontal
            data={dates}
            keyExtractor={(d) => d.iso}
            renderItem={renderDateChip}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
            getItemLayout={getDateItemLayout}
            initialNumToRender={20}
            windowSize={10}
            removeClippedSubviews={true}
          />
        </View>

        {/* BODY (SCROLLABLE) */}
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="default" style={styles.card}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && totalMatches === 0 ? <EmptyState title="No matches found" message={emptyMessage} /> : null}

            {!loading && !error && totalMatches > 0 ? (
              <View style={styles.groups}>
                {grouped.map((g) => (
                  <View key={g.league.leagueId} style={styles.group}>
                    <View style={styles.groupHeader}>
                      <View style={styles.groupTitleRow}>
                        <Text style={styles.groupTitle}>{g.league.label}</Text>
                        <LeagueFlag code={g.league.countryCode} />
                      </View>
                      <Text style={styles.groupMeta}>{g.rows.length} match{g.rows.length === 1 ? "" : "es"}</Text>
                    </View>

                    <View style={styles.list}>
                      {g.rows.map((r, idx) => {
                        const id = r?.fixture?.id;
                        const key = id ? String(id) : `idx-${idx}`;
                        const tbc = isKickoffTBC(r);

                        return (
                          <Pressable
                            key={key}
                            onPress={() => goRow(r, g.league)}
                            style={({ pressed }) => [styles.rowPress, pressed && { opacity: 0.94 }]}
                            android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                          >
                            <GlassCard strength="subtle" noPadding style={styles.rowCard}>
                              <View style={styles.rowInner}>
                                <View style={styles.kickoffCol}>
                                  <Text style={[styles.kickoff, tbc && styles.kickoffTbc]}>{rowTimeLabel(r)}</Text>
                                  {tbc ? (
                                    <View style={styles.tbcPill}>
                                      <Text style={styles.tbcText}>TBC</Text>
                                    </View>
                                  ) : null}
                                </View>

                                <View style={styles.crestCol}>
                                  <CrestSquare r={r} />
                                </View>

                                <View style={styles.teamsCol}>
                                  <Text style={styles.home} numberOfLines={1}>
                                    {rowHome(r)}
                                  </Text>
                                  <Text style={styles.away} numberOfLines={1}>
                                    {rowAway(r)}
                                  </Text>
                                  {tbc ? (
                                    <Text style={styles.tbcHint} numberOfLines={1}>
                                      Kickoff time not confirmed yet
                                    </Text>
                                  ) : null}
                                </View>

                                <Text style={styles.chev}>›</Text>
                              </View>
                            </GlassCard>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </GlassCard>

          <View style={{ height: 14 }} />
        </ScrollView>

        {/* FILTERS MODAL */}
        <Modal visible={filtersOpen} animationType="fade" transparent onRequestClose={closeFilters}>
          <Pressable style={styles.modalBackdrop} onPress={closeFilters} />

          <View style={styles.modalWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filters</Text>

                  <Pressable onPress={closeFilters} hitSlop={10} style={styles.modalClose}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalKicker}>Leagues (1–10)</Text>

                <View style={styles.leagueList}>
                  {LEAGUES.map((l) => {
                    const active = draftLeagues.some((x) => x.leagueId === l.leagueId);
                    const disabled = !active && draftLeagues.length >= 10;

                    return (
                      <Pressable
                        key={l.leagueId}
                        onPress={() => (disabled ? null : toggleLeague(l))}
                        style={({ pressed }) => [
                          styles.leagueRowItem,
                          active && styles.leagueRowItemActive,
                          disabled && { opacity: 0.55 },
                          pressed && !disabled && { opacity: 0.94 },
                        ]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <View style={styles.checkbox}>
                          <View style={[styles.checkboxInner, active && styles.checkboxInnerOn]} />
                        </View>

                        <Text style={styles.leagueRowItemText}>{l.label}</Text>
                        <LeagueFlag code={l.countryCode} />
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => setDraftLeagues(LEAGUES.slice(0, 10))}
                    style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.94 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={styles.btnGhostText}>Top 10</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setDraftLeagues([LEAGUES[0]])}
                    style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.94 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={styles.btnGhostText}>Reset</Text>
                  </Pressable>

                  <Pressable
                    onPress={applyFilters}
                    style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.94 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                  >
                    <Text style={styles.btnPrimaryText}>Apply</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalFootnote}>
                  Browse opens match details. Plan jumps straight into building a trip hub.
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
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  modePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },

  filtersPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.20)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  filtersPillText: { color: "rgba(79,224,138,0.85)", fontSize: 13, fontWeight: theme.fontWeight.black },

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
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
    fontWeight: theme.fontWeight.bold,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  clearBtnText: { color: "rgba(242,244,246,0.72)", fontWeight: theme.fontWeight.black, fontSize: 12, letterSpacing: 0.3 },

  // Date strip
  dateRow: { gap: 10, paddingRight: theme.spacing.lg },
  datePill: {
    width: 78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    paddingVertical: 10,
    paddingHorizontal: 12,
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

  // Body scroll
  bodyScroll: { flex: 1, paddingHorizontal: theme.spacing.lg },
  bodyContent: { paddingBottom: theme.spacing.xxl },

  card: { minHeight: 260, padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // Grouping
  groups: { gap: 18 },
  group: { gap: 10 },

  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  groupMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  // Rows
  list: { gap: 10 },
  rowPress: { borderRadius: 16, overflow: "hidden" },
  rowCard: { borderRadius: 16 },

  rowInner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  kickoffCol: { width: 64, alignItems: "flex-start", gap: 6 },
  kickoff: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },
  kickoffTbc: { color: "rgba(242,244,246,0.70)" },

  tbcPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  tbcText: { color: "rgba(242,244,246,0.72)", fontSize: 11, fontWeight: theme.fontWeight.black, letterSpacing: 0.3 },

  crestCol: { width: 46, alignItems: "center", justifyContent: "center" },

  crestWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.10)",
    borderRadius: 12,
  },
  crestImg: { width: 26, height: 26, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.4 },

  teamsCol: { flex: 1, gap: 2 },
  home: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  away: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.bold },

  tbcHint: { marginTop: 2, color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, opacity: 0.85 },

  chev: { color: theme.colors.textTertiary, fontSize: 24, marginTop: -2 },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
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

  modalKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },

  leagueList: { gap: 10, maxHeight: 340 },
  leagueRowItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.55)" : "rgba(22,25,29,0.48)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  leagueRowItemActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.62)" : "rgba(22,25,29,0.54)",
  },
  leagueRowItemText: { flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: { width: 10, height: 10, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.10)" },
  checkboxInnerOn: { backgroundColor: "rgba(79,224,138,0.85)" },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  btnPrimary: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 15, fontWeight: theme.fontWeight.black },

  modalFootnote: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16 },
});
