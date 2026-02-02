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
import { computeLikelyPlaceholderTbcIds, kickoffIsoOrNull } from "@/src/utils/kickoffTbc";

type LeagueMode = "single" | "multi";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function fixtureIdStrOf(r: FixtureListRow): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
}

function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
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
  if (!leagueIdNum) return { mode: "single", selected: LEAGUES[0] };

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

function TeamCrest({ name, logo, side }: { name: string; logo?: string | null; side: "home" | "away" }) {
  const ring = side === "home" ? styles.crestRingHome : styles.crestRingAway;

  return (
    <View style={styles.crestWrap}>
      {logo ? <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" /> : <Text style={styles.crestFallback}>{initials(name)}</Text>}
      <View pointerEvents="none" style={[styles.crestRing, ring]} />
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

function kickoffLabel(r: FixtureListRow, placeholderIds?: Set<string>) {
  const iso = kickoffIsoOrNull(r, placeholderIds);
  if (!iso) return "TBC";
  const pretty = formatUkDateTimeMaybe(iso);
  return pretty || "TBC";
}

type FollowPillProps = {
  fixtureId: string;
  leagueId: number;
  season: number;
  row: FixtureListRow;
  placeholderIds?: Set<string>;
};

function FollowPill({ fixtureId, leagueId, season, row, placeholderIds }: FollowPillProps) {
  const isFollowing = useFollowStore((s) => s.isFollowing(fixtureId));
  const toggle = useFollowStore((s) => s.toggle);

  const homeTeamId = row?.teams?.home?.id ?? 0;
  const awayTeamId = row?.teams?.away?.id ?? 0;

  const kickoffIso = kickoffIsoOrNull(row, placeholderIds);
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
          kickoffIso, // null when TBC
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
      <Text style={[styles.followPillText, isFollowing && styles.followPillTextActive]}>{isFollowing ? "Following" : "Follow"}</Text>
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

  const dateStrip = useMemo(() => pickDateStrip(from, 10), [from]);
  const [activeDay, setActiveDay] = useState<string>(dateStrip[0]?.iso ?? from);

  useEffect(() => {
    setActiveDay(dateStrip[0]?.iso ?? from);
  }, [from, dateStrip]);

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rowsSingle, setRowsSingle] = useState<FixtureListRow[]>([]);
  const [rowsMulti, setRowsMulti] = useState<Record<number, FixtureListRow[]>>({});

  // TBC placeholder detection per fetch result-set
  const [placeholderIdsSingle, setPlaceholderIdsSingle] = useState<Set<string>>(new Set());
  const [placeholderIdsMulti, setPlaceholderIdsMulti] = useState<Record<number, Set<string>>>({});

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedId(null);
  }, [activeDay, mode, selectedSingle.leagueId, selectedSingle.season, from, to, qNorm]);

  const upsertLatestSnapshot = useFollowStore((s) => s.upsertLatestSnapshot);
  const followedIdsSet = useFollowStore(
    useCallback((s) => new Set(s.followed.map((f) => f.fixtureId)), [])
  );

  useEffect(() => {
    let cancelled = false;

    function snapshotFromRow(r: FixtureListRow, placeholderIds?: Set<string>) {
      return {
        kickoffIso: kickoffIsoOrNull(r, placeholderIds), // null when TBC
        venue: r?.fixture?.venue?.name ? String(r.fixture.venue.name) : null,
        city: r?.fixture?.venue?.city ? String(r.fixture.venue.city) : null,
        homeTeamId: r?.teams?.home?.id != null ? Number(r.teams.home.id) : undefined,
        awayTeamId: r?.teams?.away?.id != null ? Number(r.teams.away.id) : undefined,
        leagueId: r?.league?.id != null ? Number(r.league.id) : undefined,
        season: (r as any)?.league?.season != null ? Number((r as any).league.season) : undefined,
      };
    }

    async function runSingle() {
      setError(null);
      setLoading(true);
      setRowsSingle([]);
      setPlaceholderIdsSingle(new Set());

      try {
        const res = await getFixtures({
          league: selectedSingle.leagueId,
          season: selectedSingle.season,
          from,
          to,
        });

        if (cancelled) return;

        const rows = Array.isArray(res) ? res : [];
        setRowsSingle(rows);

        const placeholders = computeLikelyPlaceholderTbcIds(rows);
        setPlaceholderIdsSingle(placeholders);

        // Keep followed matches fresh (only for those already followed)
        for (const r of rows) {
          const fid = fixtureIdStrOf(r);
          if (!fid) continue;
          if (!followedIdsSet.has(fid)) continue;
          upsertLatestSnapshot(fid, snapshotFromRow(r, placeholders));
        }
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
      setPlaceholderIdsMulti({});

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
        const pmap: Record<number, Set<string>> = {};

        for (const [leagueId, rows] of results) {
          map[leagueId] = rows;
          pmap[leagueId] = computeLikelyPlaceholderTbcIds(rows);

          // snapshot refresh for followed fixtures
          const placeholders = pmap[leagueId];
          for (const r of rows) {
            const fid = fixtureIdStrOf(r);
            if (!fid) continue;
            if (!followedIdsSet.has(fid)) continue;
            upsertLatestSnapshot(fid, snapshotFromRow(r, placeholders));
          }
        }

        setRowsMulti(map);
        setPlaceholderIdsMulti(pmap);
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
  }, [mode, selectedSingle.leagueId, selectedSingle.season, selectedMany, from, to, upsertLatestSnapshot, followedIdsSet]);

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
    (
      r: FixtureListRow,
      ctx: { leagueId: number; season: number; placeholderIds?: Set<string> }
    ) => {
      const fixtureIdStr = fixtureIdStrOf(r);

      const expanded = fixtureIdStr && expandedId === fixtureIdStr;

      // HARD GUARANTEE: always show both names
      const homeName = String(r?.teams?.home?.name ?? "").trim() || "Home";
      const awayName = String(r?.teams?.away?.name ?? "").trim() || "Away";

      const homeLogo = r?.teams?.home?.logo ? String(r.teams.home.logo) : null;
      const awayLogo = r?.teams?.away?.logo ? String(r.teams.away.logo) : null;

      const kickoff = kickoffLabel(r, ctx.placeholderIds);

      const venue = r?.fixture?.venue?.name ? String(r.fixture.venue.name) : "";
      const city = r?.fixture?.venue?.city ? String(r.fixture.venue.city) : "";
      const location = venue && city ? `${venue} • ${city}` : venue || city || "";

      return (
        <View key={fixtureIdStr || `${homeName}-${awayName}-${kickoff}`} style={styles.rowWrap}>
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
                <TeamCrest name={homeName} logo={homeLogo} side="home" />

                <View style={styles.centerBlock}>
                  <Text style={styles.teamLineTop} numberOfLines={1}>
                    {homeName}
                  </Text>

                  <View style={styles.vsRow}>
                    <View style={styles.vsHairline} />
                    <Text style={styles.vsText}>vs</Text>
                    <View style={styles.vsHairline} />
                  </View>

                  <Text style={styles.teamLineBottom} numberOfLines={1}>
                    {awayName}
                  </Text>

                  <Text style={styles.metaLine} numberOfLines={1}>
                    {kickoff}
                    {location ? ` • ${location}` : ""}
                  </Text>

                  {fixtureIdStr ? (
                    <View style={styles.followRow}>
                      <FollowPill
                        fixtureId={fixtureIdStr}
                        leagueId={ctx.leagueId}
                        season={ctx.season}
                        row={r}
                        placeholderIds={ctx.placeholderIds}
                      />
                    </View>
                  ) : null}

                  <Text style={styles.tapHint} numberOfLines={1}>
                    Tap for actions
                  </Text>
                </View>

                <TeamCrest name={awayName} logo={awayLogo} side="away" />
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

  const nothingInMulti = useMemo(() => selectedMany.every((l) => (filteredMulti[l.leagueId]?.length ?? 0) === 0), [selectedMany, filteredMulti]);

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
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
              onSubmitEditing={() => dismissKeyboard()}
            />

            {qNorm.length > 0 ? (
              <Pressable onPress={clearQuery} style={styles.clearBtn} hitSlop={10} android_ripple={{ color: "rgba(79,224,138,0.10)" }}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

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
                      renderFixtureRow(r, {
                        leagueId: selectedSingle.leagueId,
                        season: selectedSingle.season,
                        placeholderIds: placeholderIdsSingle,
                      })
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

                    const placeholders = placeholderIdsMulti[l.leagueId] ?? new Set<string>();

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
                          {leagueRows.map((r) =>
                            renderFixtureRow(r, { leagueId: l.leagueId, season: l.season, placeholderIds: placeholders })
                          )}
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

  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  card: { minHeight: 260, padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.medium },

  list: { gap: 10 },

  rowWrap: { borderRadius: 18, overflow: "hidden" },
  rowCard: { borderRadius: 18 },
  rowMain: { borderRadius: 18 },

  rowInner: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  crestWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    borderRadius: 14,
  },
  crestRingHome: { borderColor: "rgba(79,224,138,0.14)" },
  crestRingAway: { borderColor: "rgba(79,224,138,0.10)" },
  crestImg: { width: 30, height: 30, opacity: 0.95 },
  crestFallback: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 0.4,
  },

  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 86,
  },

  teamLineTop: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
    maxWidth: "100%",
  },
  teamLineBottom: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
    maxWidth: "100%",
  },

  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    opacity: 0.9,
  },
  vsText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  vsHairline: {
    height: 1,
    width: 26,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  metaLine: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.regular,
    textAlign: "center",
  },

  followRow: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  tapHint: {
    marginTop: 2,
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.regular,
    opacity: 0.75,
    textAlign: "center",
  },

  followPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.55)" : "rgba(22,25,29,0.48)",
    overflow: "hidden",
    minWidth: 96,
    alignItems: "center",
  },
  followPillActive: {
    borderColor: "rgba(79,224,138,0.30)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.65)" : "rgba(22,25,29,0.56)",
  },
  followPillText: {
    color: "rgba(242,244,246,0.72)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },
  followPillTextActive: { color: "rgba(79,224,138,0.95)" },

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

  multiWrap: { gap: 18 },
  leagueGroup: { gap: 10 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.medium },
  groupMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.regular },
});
