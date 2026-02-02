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

import useFollowStore from "@/src/state/followStore";

type LeagueMode = "single" | "multi";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
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

/**
 * Kickoff label: keep it simple + honest.
 * - If we have a datetime: show it
 * - Else: "TBC"
 *
 * NOTE: Later you'll improve TBC detection (e.g. league quirks, placeholder times).
 */
function kickoffLabel(r: FixtureListRow) {
  const raw = r?.fixture?.date;
  if (!raw) return "TBC";
  const pretty = formatUkDateTimeMaybe(raw);
  return pretty || "TBC";
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

  if (leagueIdStr === "all") {
    return { mode: "multi", selectedMany: LEAGUES };
  }

  if (!leagueIdNum) {
    return { mode: "single", selected: LEAGUES[0] };
  }

  const match = LEAGUES.find((l) => l.leagueId === leagueIdNum);
  if (!match) return { mode: "single", selected: LEAGUES[0] };

  const season = seasonNum ?? match.season;
  return { mode: "single", selected: { ...match, season } };
}

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

function pickDateStrip(fromIso: string, days = 10) {
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

type FollowPillProps = {
  fixtureId: string;
  leagueId: number;
  season: number;
  row: FixtureListRow;
};

function FollowPill({ fixtureId, leagueId, season, row }: FollowPillProps) {
  const isFollowing = useFollowStore((s) => s.isFollowing(fixtureId));
  const toggle = useFollowStore((s) => s.toggle);

  const homeTeamId = row?.teams?.home?.id ?? 0;
  const awayTeamId = row?.teams?.away?.id ?? 0;

  const kickoffIso = row?.fixture?.date ? String(row.fixture.date) : null;
  const venue = row?.fixture?.venue?.name ? String(row.fixture.venue.name) : null;
  const city = row?.fixture?.venue?.city ? String(row.fixture.venue.city) : null;

  const disabled = !fixtureId || !leagueId || !season || !homeTeamId || !awayTeamId;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        toggle({
          fixtureId,
          leagueId,
          season,
          homeTeamId,
          awayTeamId,
          kickoffIso,
          venue,
          city,
        });
      }}
      style={({ pressed }) => [
        styles.followPill,
        isFollowing && styles.followPillActive,
        pressed && !disabled && { opacity: 0.92 },
        disabled && { opacity: 0.55 },
      ]}
      hitSlop={10}
    >
      <Text style={[styles.followPillText, isFollowing && styles.followPillTextActive]}>
        {isFollowing ? "Following" : "Follow"}
      </Text>
    </Pressable>
  );
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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
        90
      ),
    [fromParam, toParam, rolling.from, rolling.to]
  );

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

  // Horizontal date strip (livescore-style)
  const dateStrip = useMemo(() => pickDateStrip(from, 10), [from]);
  const [activeDay, setActiveDay] = useState<string>(dateStrip[0]?.iso ?? from);

  useEffect(() => {
    setActiveDay(dateStrip[0]?.iso ?? from);
  }, [from, dateStrip]);

  // Search (light filter)
  const venueParamRaw = useMemo(() => coerceString((params as any).venue), [params]);
  const [query, setQuery] = useState<string>(venueParamRaw ?? "");
  const qNorm = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    setQuery(venueParamRaw ?? "");
  }, [venueParamRaw]);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);
  const clearQuery = useCallback(() => {
    setQuery("");
    Keyboard.dismiss();
  }, []);

  // Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rowsSingle, setRowsSingle] = useState<FixtureListRow[]>([]);
  const [rowsMulti, setRowsMulti] = useState<Record<number, FixtureListRow[]>>({});

  // Expanded row (keeps UI clean)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Collapse expansion when you change date/league/mode/search window
    setExpandedId(null);
  }, [activeDay, mode, selectedSingle.leagueId, selectedSingle.season, from, to, qNorm]);

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

  const passesQuery = useCallback(
    (r: FixtureListRow) => {
      const q = qNorm.trim().toLowerCase();
      if (!q) return true;

      const home = norm(r?.teams?.home?.name);
      const away = norm(r?.teams?.away?.name);

      const venueName = norm(r?.fixture?.venue?.name);
      const venueCity = norm(r?.fixture?.venue?.city);

      return home.includes(q) || away.includes(q) || venueName.includes(q) || venueCity.includes(q);
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

  const filteredSingle = useMemo(() => rowsSingle.filter((r) => passesQuery(r)).filter((r) => isActiveDay(r)), [rowsSingle, passesQuery, isActiveDay]);

  const filteredMulti = useMemo(() => {
    const out: Record<number, FixtureListRow[]> = {};
    for (const l of selectedMany) {
      const rows = rowsMulti[l.leagueId] ?? [];
      out[l.leagueId] = rows.filter((r) => passesQuery(r)).filter((r) => isActiveDay(r));
    }
    return out;
  }, [rowsMulti, selectedMany, passesQuery, isActiveDay]);

  const subtitle = useMemo(() => {
    if (mode === "single") return selectedSingle.label;
    return "Top leagues";
  }, [mode, selectedSingle.label]);

  const toggleMode = useCallback(() => setMode((m) => (m === "single" ? "multi" : "single")), []);

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

  const goBuildTripWithContext = useCallback(
    (fixtureIdStr: string, leagueIdForRow?: number, seasonForRow?: number) => {
      const lid = mode === "single" ? selectedSingle.leagueId : leagueIdForRow ?? selectedSingle.leagueId;
      const sea = mode === "single" ? selectedSingle.season : seasonForRow ?? selectedSingle.season;

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

  const emptyMessage = useMemo(() => {
    if (!qNorm) return "Try a different day or switch leagues.";
    return "Try a different search term (team, city, or venue) or clear the filter.";
  }, [qNorm]);

  const renderFixtureRow = useCallback(
    (r: FixtureListRow, ctx: { leagueId: number; season: number }) => {
      const id = r?.fixture?.id;
      const fixtureIdStr = id ? String(id) : "";
      const expanded = fixtureIdStr && expandedId === fixtureIdStr;

      const title = rowTitle(r);
      const kickoff = kickoffLabel(r);

      return (
        <View key={fixtureIdStr || `${title}-${kickoff}`} style={styles.rowWrap}>
          <GlassCard strength="subtle" noPadding style={styles.rowCard}>
            <Pressable
              disabled={!fixtureIdStr}
              onPress={() => {
                if (!fixtureIdStr) return;
                setExpandedId((prev) => (prev === fixtureIdStr ? null : fixtureIdStr));
              }}
              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              style={({ pressed }) => [styles.rowMain, pressed && fixtureIdStr ? { opacity: 0.94 } : null]}
            >
              <View style={styles.rowInner}>
                <CrestSquare r={r} />

                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {kickoff}
                  </Text>
                </View>

                <View style={styles.rowRight}>
                  {fixtureIdStr ? (
                    <FollowPill fixtureId={fixtureIdStr} leagueId={ctx.leagueId} season={ctx.season} row={r} />
                  ) : null}
                  <Text style={[styles.chev, expanded && styles.chevOpen]}>›</Text>
                </View>
              </View>
            </Pressable>

            {expanded && fixtureIdStr ? (
              <View style={styles.expandArea}>
                <Pressable
                  onPress={() => goMatchWithContext(fixtureIdStr, ctx.leagueId, ctx.season)}
                  style={({ pressed }) => [styles.expandBtn, styles.expandBtnGhost, pressed && { opacity: 0.92 }]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.expandBtnGhostText}>Match</Text>
                </Pressable>

                <Pressable
                  onPress={() => goBuildTripWithContext(fixtureIdStr, ctx.leagueId, ctx.season)}
                  style={({ pressed }) => [styles.expandBtn, styles.expandBtnPrimary, pressed && { opacity: 0.92 }]}
                  android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                >
                  <Text style={styles.expandBtnPrimaryText}>Build trip</Text>
                </Pressable>
              </View>
            ) : null}
          </GlassCard>
        </View>
      );
    },
    [expandedId, goBuildTripWithContext, goMatchWithContext]
  );

  const nothingInMulti = useMemo(() => {
    return selectedMany.every((l) => (filteredMulti[l.leagueId]?.length ?? 0) === 0);
  }, [selectedMany, filteredMulti]);

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

            <Pressable onPress={toggleMode} style={styles.modePill} hitSlop={10} android_ripple={{ color: "rgba(79,224,138,0.10)" }}>
              <Text style={styles.modePillText}>{mode === "single" ? "One league" : "Top leagues"}</Text>
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
              <Pressable onPress={clearQuery} style={styles.clearBtn} hitSlop={10} android_ripple={{ color: "rgba(79,224,138,0.10)" }}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Date strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateStrip.map((d) => {
              const active = d.iso === activeDay;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => setActiveDay(d.iso)}
                  style={({ pressed }) => [styles.datePill, active && styles.datePillActive, pressed && { opacity: 0.94 }]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
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
                    style={({ pressed }) => [styles.leaguePill, active && styles.leaguePillActive, pressed && { opacity: 0.94 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
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
                    {filteredSingle.map((r) =>
                      renderFixtureRow(r, { leagueId: selectedSingle.leagueId, season: selectedSingle.season })
                    )}
                  </View>
                )
              ) : nothingInMulti ? (
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
                          {leagueRows.map((r) => renderFixtureRow(r, { leagueId: l.leagueId, season: l.season }))}
                        </View>
                      </View>
                    );
                  })}
                </View>
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

  title: { color: theme.colors.text, fontSize: 22, fontWeight: theme.fontWeight.medium },
  subtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.regular },

  modePill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  modePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.medium },

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
  },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 15, paddingVertical: Platform.OS === "ios" ? 6 : 4 },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  clearBtnText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold, fontSize: 13 },

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
  dateTop: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.medium },
  dateTopActive: { color: theme.colors.textSecondary },
  dateBottom: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.medium },
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
  leaguePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.medium },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.medium },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  // Body
  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  card: { minHeight: 260, padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.medium },

  list: { gap: 10 },

  rowWrap: { borderRadius: 16, overflow: "hidden" },
  rowCard: { borderRadius: 16 },
  rowMain: { borderRadius: 16 },

  rowInner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

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
  crestRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.12)",
    borderRadius: 12,
  },
  crestImg: { width: 30, height: 30, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.medium, letterSpacing: 0.4 },

  rowText: { flex: 1, gap: 4 },
  rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.medium },
  rowMeta: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.regular },

  rowRight: { alignItems: "flex-end", gap: 8 },
  chev: { color: theme.colors.textTertiary, fontSize: 24, marginTop: -2, transform: [{ rotate: "0deg" }] },
  chevOpen: { transform: [{ rotate: "90deg" }] },

  // Follow pill
  followPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.55)" : "rgba(22,25,29,0.48)",
    overflow: "hidden",
  },
  followPillActive: {
    borderColor: "rgba(79,224,138,0.30)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.65)" : "rgba(22,25,29,0.56)",
  },
  followPillText: { color: "rgba(242,244,246,0.70)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },
  followPillTextActive: { color: "rgba(79,224,138,0.95)" },

  // Expanded area (kept minimal on purpose)
  expandArea: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  expandBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  expandBtnPrimary: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  expandBtnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.medium, fontSize: 14 },
  expandBtnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  expandBtnGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium, fontSize: 14 },

  // Multi grouping
  multiWrap: { gap: 18 },
  leagueGroup: { gap: 10 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.medium },
  groupMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.regular },
});
