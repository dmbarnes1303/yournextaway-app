// app/(tabs)/fixtures.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import { LEAGUES, getRollingWindowIso, parseIsoDateOnly, toIsoDate, type LeagueOption } from "@/src/constants/football";
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

function mapRow(r: FixtureListRow) {
  const fixtureId = r?.fixture?.id;
  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
  const venue = r?.fixture?.venue?.name ?? "";
  const city = r?.fixture?.venue?.city ?? "";
  const extra = [venue, city].filter(Boolean).join(" • ");
  const line2 = extra ? `${kickoff} • ${extra}` : kickoff;
  return { fixtureId, home, away, venue, city, line2 };
}

function tomorrowIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return toIsoDate(d);
}

function clampFromToTomorrow(fromIso: string): string {
  const tmr = tomorrowIso();
  const fromDate = parseIsoDateOnly(fromIso);
  const tmrDate = parseIsoDateOnly(tmr);
  if (!fromDate || !tmrDate) return tmr;
  return fromDate.getTime() < tmrDate.getTime() ? tmr : fromIso;
}

function norm(s: string) {
  return String(s ?? "").toLowerCase().trim();
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Central rolling window defaults (single source of truth; tomorrow onwards)
  const { from: defaultFromRaw, to: defaultTo } = useMemo(() => getRollingWindowIso(), []);
  const defaultFrom = useMemo(() => clampFromToTomorrow(defaultFromRaw), [defaultFromRaw]);

  // Params: allow Fixtures to be opened with a specific league/window
  const paramLeagueId = useMemo(() => coerceNumber(params.leagueId), [params.leagueId]);
  const paramSeason = useMemo(() => coerceNumber(params.season), [params.season]);

  const fromParam = useMemo(() => coerceString(params.from), [params.from]);
  const toParam = useMemo(() => coerceString(params.to), [params.to]);

  // Optional filters (v1 search routing)
  const qParam = useMemo(() => coerceString(params.q), [params.q]);
  const teamParam = useMemo(() => coerceString(params.team), [params.team]);
  const venueParam = useMemo(() => coerceString(params.venue), [params.venue]);
  const cityKeyParam = useMemo(() => coerceString(params.city), [params.city]);
  const cityNameParam = useMemo(() => coerceString(params.cityName), [params.cityName]);

  // Enforce "tomorrow onwards" even if params try to pass today/past
  const from = useMemo(() => clampFromToTomorrow(fromParam ?? defaultFrom), [fromParam, defaultFrom]);
  const to = useMemo(() => toParam ?? defaultTo, [toParam, defaultTo]);

  // Selected league state (can be overridden by params)
  const [selected, setSelected] = useState<LeagueOption>(LEAGUES[0]);

  // Apply param league/season when present
  useEffect(() => {
    if (!paramLeagueId) return;

    const match = LEAGUES.find((l) => l.leagueId === paramLeagueId);
    if (!match) return;

    const season = paramSeason ?? match.season;

    setSelected((cur) => {
      if (cur.leagueId === match.leagueId && cur.season === season) return cur;
      return { ...match, season };
    });
  }, [paramLeagueId, paramSeason]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setLoading(true);
      setRows([]);

      try {
        const res = await getFixtures({
          league: selected.leagueId,
          season: selected.season,
          from,
          to,
        });

        if (cancelled) return;
        setRows(Array.isArray(res) ? res : []);
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
  }, [selected, from, to]);

  const filterLabel = useMemo(() => {
    if (teamParam) return `Team: ${teamParam}`;
    if (venueParam) return `Venue: ${venueParam}`;
    if (cityNameParam) return `City: ${cityNameParam}`;
    if (cityKeyParam) return `City: ${cityKeyParam}`;
    if (qParam) return `Search: ${qParam}`;
    return null;
  }, [teamParam, venueParam, cityNameParam, cityKeyParam, qParam]);

  const filteredRows = useMemo(() => {
    if (!rows.length) return [];

    const q = norm(qParam ?? "");
    const team = norm(teamParam ?? "");
    const venue = norm(venueParam ?? "");
    const cityName = norm(cityNameParam ?? "");
    const cityKey = norm(cityKeyParam ?? "");

    if (!q && !team && !venue && !cityName && !cityKey) return rows;

    return rows.filter((r) => {
      const m = mapRow(r);
      const home = norm(m.home);
      const away = norm(m.away);
      const v = norm(m.venue);
      const c = norm(m.city);

      // entity filters first (deterministic)
      if (team && !(home.includes(team) || away.includes(team))) return false;
      if (venue && !v.includes(venue)) return false;

      // city can come from guide key or display name; we match against fixture city name
      if (cityName && !c.includes(cityName)) return false;
      if (cityKey && !c.includes(cityKey) && !norm(cityKey.replace(/-/g, " ")).includes(c)) {
        // fallback: allow key to match city name when key is "madrid" etc.
        const cityKeyAsWords = norm(cityKey.replace(/-/g, " "));
        if (!c.includes(cityKey) && !c.includes(cityKeyAsWords)) return false;
      }

      // free-text q last
      if (q) {
        return home.includes(q) || away.includes(q) || v.includes(q) || c.includes(q);
      }

      return true;
    });
  }, [rows, qParam, teamParam, venueParam, cityNameParam, cityKeyParam]);

  function goBuildTripWithContext(fixtureIdStr: string) {
    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId: fixtureIdStr,
        leagueId: String(selected.leagueId),
        season: String(selected.season),
        from,
        to,
      },
    } as any);
  }

  return (
    <Background imageUrl={getBackground("fixtures")}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Fixtures</Text>
          <Text style={styles.subtitle}>
            {selected.label} • {formatUkDateOnly(from)} → {formatUkDateOnly(to)}
          </Text>

          {filterLabel ? (
            <View style={styles.filterPill}>
              <Text style={styles.filterText}>{filterLabel}</Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/fixtures",
                    params: { leagueId: String(selected.leagueId), season: String(selected.season), from, to },
                  } as any)
                }
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
            {LEAGUES.map((l) => {
              const active = l.leagueId === selected.leagueId;
              return (
                <Pressable
                  key={l.leagueId}
                  onPress={() => setSelected(l)}
                  style={[styles.leaguePill, active && styles.leaguePillActive]}
                >
                  <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && filteredRows.length === 0 ? (
              <EmptyState title="No fixtures found" message="Try a different league or clear filters." />
            ) : null}

            {!loading && !error && filteredRows.length > 0 ? (
              <View style={styles.list}>
                {filteredRows.map((r, idx) => {
                  const m = mapRow(r);
                  const fixtureIdStr = m.fixtureId ? String(m.fixtureId) : null;
                  const key = fixtureIdStr ?? `idx-${idx}`;

                  return (
                    <View key={key} style={styles.rowWrap}>
                      <Pressable
                        onPress={() => {
                          if (!fixtureIdStr) return;
                          router.push({ pathname: "/match/[id]", params: { id: fixtureIdStr } });
                        }}
                        style={styles.rowMain}
                      >
                        <Text style={styles.rowTitle}>
                          {m.home} vs {m.away}
                        </Text>
                        <Text style={styles.rowMeta}>{m.line2}</Text>
                      </Pressable>

                      <Pressable
                        disabled={!fixtureIdStr}
                        onPress={() => {
                          if (!fixtureIdStr) return;
                          goBuildTripWithContext(fixtureIdStr);
                        }}
                        style={[styles.planBtn, !fixtureIdStr && { opacity: 0.5 }]}
                      >
                        <Text style={styles.planBtnText}>Plan Trip</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </GlassCard>
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
  },

  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },

  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.28)",
    marginBottom: theme.spacing.md,
  },
  filterText: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "800" as any },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  clearText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.xs },

  leagueRow: { gap: 10, paddingRight: theme.spacing.lg },

  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  leaguePillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  leaguePillText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" as any },
  leaguePillTextActive: { color: theme.colors.text },

  scrollView: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },

  card: { minHeight: 240 },

  center: { paddingVertical: theme.spacing.xl, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary },

  list: { gap: 10 },

  rowWrap: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  rowMain: { flex: 1 },

  rowTitle: { color: theme.colors.text, fontWeight: "800" as any, fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  planBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  planBtnText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.xs },
});
