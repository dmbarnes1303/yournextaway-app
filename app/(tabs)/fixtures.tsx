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

import { LEAGUES, getRollingWindowIso, type LeagueOption } from "@/src/constants/football";
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
  return { fixtureId, home, away, line2 };
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Central rolling window defaults (single source of truth)
  const { from: defaultFrom, to: defaultTo } = useMemo(() => getRollingWindowIso(), []);

  // Params: allow Fixtures to be opened with a specific league/window
  const paramLeagueId = useMemo(() => coerceNumber(params.leagueId), [params.leagueId]);
  const paramSeason = useMemo(() => coerceNumber(params.season), [params.season]);

  const from = useMemo(() => coerceString(params.from) ?? defaultFrom, [params.from, defaultFrom]);
  const to = useMemo(() => coerceString(params.to) ?? defaultTo, [params.to, defaultTo]);

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

            {!loading && !error && rows.length === 0 ? (
              <EmptyState title="No fixtures found" message="Try a different league or date window." />
            ) : null}

            {!loading && !error && rows.length > 0 ? (
              <View style={styles.list}>
                {rows.map((r, idx) => {
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
