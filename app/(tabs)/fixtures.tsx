// app/(tabs)/fixtures.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

type LeagueOption = { label: string; leagueId: number; season: number };

function toIsoDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatUkDateTimeMaybe(iso: string | undefined): string {
  if (!iso) return "TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function mapRow(r: FixtureListRow) {
  const fixtureId = r?.fixture?.id;
  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
  const venue = r?.fixture?.venue?.name ?? "";
  const line2 = venue ? `${kickoff} • ${venue}` : kickoff;

  return { fixtureId, home, away, line2 };
}

export default function FixturesScreen() {
  const router = useRouter();

  const leagues: LeagueOption[] = useMemo(
    () => [
      { label: "Premier League", leagueId: 39, season: 2025 },
      { label: "La Liga", leagueId: 140, season: 2025 },
      { label: "Serie A", leagueId: 135, season: 2025 },
      { label: "Bundesliga", leagueId: 78, season: 2025 },
      { label: "Ligue 1", leagueId: 61, season: 2025 },
    ],
    []
  );

  const [selected, setSelected] = useState<LeagueOption>(leagues[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  const from = useMemo(() => toIsoDateInput(new Date()), []);
  const to = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toIsoDateInput(d);
  }, []);

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

  return (
    <Background imageUrl={getBackground("fixtures")}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Fixtures</Text>
          <Text style={styles.subtitle}>
            {selected.label} • {from} → {to}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
            {leagues.map((l) => {
              const active = l.leagueId === selected.leagueId;
              return (
                <Pressable
                  key={l.leagueId}
                  onPress={() => setSelected(l)}
                  style={[styles.leaguePill, active && styles.leaguePillActive]}
                >
                  <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>
                    {l.label}
                  </Text>
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

            {!loading && error ? (
              <EmptyState title="Couldn’t load fixtures" message={error} />
            ) : null}

            {!loading && !error && rows.length === 0 ? (
              <EmptyState title="No fixtures found" message="Try a different league or date window." />
            ) : null}

            {!loading && !error && rows.length > 0 ? (
              <View style={styles.list}>
                {rows.map((r, idx) => {
                  const m = mapRow(r);
                  const key = m.fixtureId ? String(m.fixtureId) : `idx-${idx}`;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        if (!m.fixtureId) return;
                        router.push({ pathname: "/match/[id]", params: { id: String(m.fixtureId) } });
                      }}
                      style={styles.row}
                    >
                      <Text style={styles.rowTitle}>
                        {m.home} vs {m.away}
                      </Text>
                      <Text style={styles.rowMeta}>{m.line2}</Text>
                    </Pressable>
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
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowTitle: { color: theme.colors.text, fontWeight: "800" as any, fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
});
