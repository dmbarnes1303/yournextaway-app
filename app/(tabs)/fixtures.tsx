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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import {
  LEAGUES,
  getRollingWindowIso,
  normalizeWindowIso,
  type LeagueOption,
} from "@/src/constants/football";
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

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

function pickDateStrip(fromIso: string, days = 7) {
  // fromIso is YYYY-MM-DD
  const base = new Date(`${fromIso}T00:00:00Z`);
  const out: { iso: string; labelTop: string; labelBottom: string }[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(base, i);
    out.push({
      iso: isoDay(d),
      labelTop: weekdayShort(d),
      labelBottom: dayMonth(d),
    });
  }
  return out;
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

  // Explicit multi: leagueId=all
  if (leagueIdStr === "all") {
    return { mode: "multi", selectedMany: LEAGUES };
  }

  // Single by default; if leagueId is missing, use first league
  if (!leagueIdNum) {
    return { mode: "single", selected: LEAGUES[0] };
  }

  const match = LEAGUES.find((l) => l.leagueId === leagueIdNum);
  if (!match) return { mode: "single", selected: LEAGUES[0] };

  const season = seasonNum ?? match.season;
  return { mode: "single", selected: { ...match, season } };
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Window defaults (tomorrow onwards; still supports from/to params)
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => coerceString(params.from), [params.from]);
  const toParam = useMemo(() => coerceString(params.to), [params.to]);

  const window = useMemo(
    () =>
      normalizeWindowIso(
        {
          from: fromParam ?? rolling.from,
          to: toParam ?? rolling.to,
        },
        30
      ),
    [fromParam, toParam, rolling.from, rolling.to]
  );

  const from = window.from;
  const to = window.to;

  // Filters
  const venueParamRaw = useMemo(
    () => coerceString((params as any).venue),
    [params]
  );
  const [query, setQuery] = useState<string>(venueParamRaw ?? "");
  const qNorm = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    // If a deep link sets venue, reflect it in search bar
    setQuery(venueParamRaw ?? "");
  }, [venueParamRaw]);

  // League selection: single vs multi
  const selection = useMemo(
    () => resolveLeagueSelection(params.leagueId, params.season),
    [params.leagueId, params.season]
  );

  const [mode, setMode] = useState<LeagueMode>(selection.mode);
  const [selectedSingle, setSelectedSingle] = useState<LeagueOption>(
    selection.selected ?? LEAGUES[0]
  );
  const [selectedMany, setSelectedMany] = useState<LeagueOption[]>(
    selection.selectedMany ?? LEAGUES
  );

  useEffect(() => {
    setMode(selection.mode);
    if (selection.selected) setSelectedSingle(selection.selected);
    if (selection.selectedMany) setSelectedMany(selection.selectedMany);
  }, [selection.mode, selection.selected, selection.selectedMany]);

  // Date strip (7 days) anchored to "from"
  const dateStrip = useMemo(() => pickDateStrip(from, 7), [from]);
  const [activeDay, setActiveDay] = useState<string>(dateStrip[0]?.iso ?? from);

  useEffect(() => {
    setActiveDay(dateStrip[0]?.iso ?? from);
  }, [from]);

  // Fetch fixtures:
  // - single => one call
  // - multi  => parallel calls, then merge
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rowsSingle, setRowsSingle] = useState<FixtureListRow[]>([]);
  const [rowsMulti, setRowsMulti] = useState<Record<number, FixtureListRow[]>>(
    {}
  );

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

  // Filter rows by query (team/city/venue). Also supports slug-like matching.
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

      if (
        home.includes(q) ||
        away.includes(q) ||
        venue.includes(q) ||
        city.includes(q)
      )
        return true;

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

  // Filter to active day (7-day strip)
  const isActiveDay = useCallback(
    (r: FixtureListRow) => {
      const d = fixtureIsoDateOnly(r);
      if (!d) return false;
      return d === activeDay;
    },
    [activeDay]
  );

  const filteredSingle = useMemo(() => {
    return rowsSingle.filter((r) => passesQuery(r)).filter((r) => isActiveDay(r));
  }, [rowsSingle, passesQuery, isActiveDay]);

  const filteredMulti = useMemo(() => {
    const out: Record<number, FixtureListRow[]> = {};
    for (const l of selectedMany) {
      const rows = rowsMulti[l.leagueId] ?? [];
      out[l.leagueId] = rows
        .filter((r) => passesQuery(r))
        .filter((r) => isActiveDay(r));
    }
    return out;
  }, [rowsMulti, selectedMany, passesQuery, isActiveDay]);

  const subtitle = useMemo(() => {
    const base = `${formatUkDateOnly(from)} → ${formatUkDateOnly(to)}`;
    if (mode === "single") return `${selectedSingle.label} • ${base}`;
    return `Top leagues • ${base}`;
  }, [from, to, mode, selectedSingle.label]);

  const goMatchWithContext = useCallback(
    (fixtureIdStr: string, leagueIdForRow?: number, seasonForRow?: number) => {
      const lid =
        mode === "single"
          ? selectedSingle.leagueId
          : leagueIdForRow ?? selectedSingle.leagueId;
      const sea =
        mode === "single"
          ? selectedSingle.season
          : seasonForRow ?? selectedSingle.season;

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

  const goBuildTripWithContext = useCallback(
    (fixtureIdStr: string, leagueIdForRow?: number, seasonForRow?: number) => {
      const lid =
        mode === "single"
          ? selectedSingle.leagueId
          : leagueIdForRow ?? selectedSingle.leagueId;
      const sea =
        mode === "single"
          ? selectedSingle.season
          : seasonForRow ?? selectedSingle.season;

      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId: fixtureIdStr,
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

  const showClear = qNorm.length > 0;

  const emptyMessage = useMemo(() => {
    if (!qNorm) return "Try a different day or switch leagues.";
    return "Try a different search term (team, city, or venue) or clear the filter.";
  }, [qNorm]);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "single" ? "multi" : "single"));
  }, []);

  return (
    <Background
      imageSource={getBackground("fixtures")}
      overlayOpacity={0.86}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <Pressable onPress={toggleMode} style={styles.modePill} hitSlop={10}>
              <Text style={styles.modePillText}>
                {mode === "single" ? "One league" : "Top leagues"}
              </Text>
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

            {showClear ? (
              <Pressable onPress={clearQuery} style={styles.clearBtn} hitSlop={10}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Date strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {dateStrip.map((d) => {
              const active = d.iso === activeDay;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => setActiveDay(d.iso)}
                  style={[styles.datePill, active && styles.datePillActive]}
                >
                  <Text style={[styles.dateTop, active && styles.dateTopActive]}>
                    {d.labelTop}
                  </Text>
                  <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>
                    {d.labelBottom}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* League pills (single mode only) */}
          {mode === "single" ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.leagueRow}
            >
              {LEAGUES.map((l) => {
                const active = l.leagueId === selectedSingle.leagueId;
                return (
                  <Pressable
                    key={l.leagueId}
                    onPress={() => setSelectedSingle(l)}
                    style={[styles.leaguePill, active && styles.leaguePillActive]}
                  >
                    <Text
                      style={[
                        styles.leaguePillText,
                        active && styles.leaguePillTextActive,
                      ]}
                    >
                      {l.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        {/* BODY */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard strength="default" style={styles.card}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <EmptyState title="Couldn’t load fixtures" message={error} />
            ) : null}

            {!loading && !error ? (
              mode === "single" ? (
                <>
                  {filteredSingle.length === 0 ? (
                    <EmptyState title="No matches found" message={emptyMessage} />
                  ) : (
                    <View style={styles.list}>
                      {filteredSingle.map((r, idx) => {
                        const id = r?.fixture?.id;
                        const fixtureIdStr = id ? String(id) : null;
                        const key = fixtureIdStr ?? `idx-${idx}`;

                        return (
                          <GlassCard key={key} strength="subtle" noPadding style={styles.rowCard}>
                            <Pressable
                              disabled={!fixtureIdStr}
                              onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr) : null)}
                              style={styles.rowMain}
                            >
                              <View style={styles.rowInner}>
                                <View style={styles.thumb} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.rowTitle}>{rowTitle(r)}</Text>
                                  <Text style={styles.rowMeta}>{rowMeta(r)}</Text>
                                </View>
                                <Text style={styles.chev}>›</Text>
                              </View>
                            </Pressable>

                            <View style={styles.actionsRow}>
                              <Pressable
                                disabled={!fixtureIdStr}
                                onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr) : null)}
                                style={[
                                  styles.smallBtn,
                                  styles.smallGhost,
                                  !fixtureIdStr && styles.disabled,
                                ]}
                              >
                                <Text style={styles.smallGhostText}>View match</Text>
                              </Pressable>

                              <Pressable
                                disabled={!fixtureIdStr}
                                onPress={() => (fixtureIdStr ? goBuildTripWithContext(fixtureIdStr) : null)}
                                style={[
                                  styles.smallBtn,
                                  styles.smallPrimary,
                                  !fixtureIdStr && styles.disabled,
                                ]}
                              >
                                <Text style={styles.smallPrimaryText}>Plan trip</Text>
                              </Pressable>
                            </View>
                          </GlassCard>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : (
                <>
                  {selectedMany.every((l) => (filteredMulti[l.leagueId]?.length ?? 0) === 0) ? (
                    <EmptyState title="No matches found" message={emptyMessage} />
                  ) : (
                    <View style={styles.multiWrap}>
                      {selectedMany.map((l) => {
                        const leagueRows = filteredMulti[l.leagueId] ?? [];
                        if (leagueRows.length === 0) return null;

                        return (
                          <View key={l.leagueId} style={styles.leagueGroup}>
                            <View style={styles.groupHeader}>
                              <Text style={styles.groupTitle}>{l.label}</Text>
                              <Text style={styles.groupMeta}>{formatUkDateOnly(activeDay)}</Text>
                            </View>

                            <View style={styles.list}>
                              {leagueRows.map((r, idx) => {
                                const id = r?.fixture?.id;
                                const fixtureIdStr = id ? String(id) : null;
                                const key = fixtureIdStr ?? `l-${l.leagueId}-${idx}`;

                                return (
                                  <GlassCard key={key} strength="subtle" noPadding style={styles.rowCard}>
                                    <Pressable
                                      disabled={!fixtureIdStr}
                                      onPress={() =>
                                        fixtureIdStr
                                          ? goMatchWithContext(fixtureIdStr, l.leagueId, l.season)
                                          : null
                                      }
                                      style={styles.rowMain}
                                    >
                                      <View style={styles.rowInner}>
                                        <View style={styles.thumb} />
                                        <View style={{ flex: 1 }}>
                                          <Text style={styles.rowTitle}>{rowTitle(r)}</Text>
                                          <Text style={styles.rowMeta}>{rowMeta(r)}</Text>
                                        </View>
                                        <Text style={styles.chev}>›</Text>
                                      </View>
                                    </Pressable>

                                    <View style={styles.actionsRow}>
                                      <Pressable
                                        disabled={!fixtureIdStr}
                                        onPress={() =>
                                          fixtureIdStr
                                            ? goMatchWithContext(fixtureIdStr, l.leagueId, l.season)
                                            : null
                                        }
                                        style={[
                                          styles.smallBtn,
                                          styles.smallGhost,
                                          !fixtureIdStr && styles.disabled,
                                        ]}
                                      >
                                        <Text style={styles.smallGhostText}>View match</Text>
                                      </Pressable>

                                      <Pressable
                                        disabled={!fixtureIdStr}
                                        onPress={() =>
                                          fixtureIdStr
                                            ? goBuildTripWithContext(fixtureIdStr, l.leagueId, l.season)
                                            : null
                                        }
                                        style={[
                                          styles.smallBtn,
                                          styles.smallPrimary,
                                          !fixtureIdStr && styles.disabled,
                                        ]}
                                      >
                                        <Text style={styles.smallPrimaryText}>Plan trip</Text>
                                      </Pressable>
                                    </View>
                                  </GlassCard>
                                );
                              })}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )
            ) : null}
          </GlassCard>

          <View style={{ height: 10 }} />
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

  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: theme.fontWeight.medium,
  },

  subtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.regular,
  },

  modePill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.subtle
        : theme.glass.iosBg.subtle,
  },
  modePillText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
  },

  // Search
  searchBox: {
    borderWidth: 1,
    borderColor: theme.glass.border,
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.subtle
        : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.subtle
        : theme.glass.iosBg.subtle,
  },
  clearBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 13,
  },

  // Date strip
  dateRow: { gap: 10, paddingRight: theme.spacing.lg },
  datePill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.subtle
        : theme.glass.iosBg.subtle,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 74,
    alignItems: "center",
  },
  datePillActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.default
        : theme.glass.iosBg.default,
  },
  dateTop: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.medium,
  },
  dateTopActive: { color: theme.colors.textSecondary },
  dateBottom: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
  },
  dateBottomActive: { color: theme.colors.text },

  // League pills (single only)
  leagueRow: { gap: 10, paddingRight: theme.spacing.lg },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.subtle
        : theme.glass.iosBg.subtle,
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.default
        : theme.glass.iosBg.default,
  },
  leaguePillText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
  },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.medium },

  // Body
  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  card: { minHeight: 260, padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.medium },

  // Lists
  list: { gap: 10 },
  rowCard: { borderRadius: 16 },
  rowMain: { borderRadius: 16 },
  rowInner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.medium },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.regular },
  chev: { color: theme.colors.textTertiary, fontSize: 24, marginTop: -2 },

  actionsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingBottom: 12 },

  smallBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  smallPrimary: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.default
        : theme.glass.iosBg.default,
  },
  smallPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.medium, fontSize: 14 },

  smallGhost: {
    borderColor: theme.colors.border,
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.subtle
        : theme.glass.iosBg.subtle,
  },
  smallGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium, fontSize: 14 },

  disabled: { opacity: 0.55 },

  // Multi grouping
  multiWrap: { gap: 18 },
  leagueGroup: { gap: 10 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  groupTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.medium },
  groupMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.regular },
});
