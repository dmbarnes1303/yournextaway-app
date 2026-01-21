// app/match/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

type LeagueOption = { label: string; leagueId: number; season: number };

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysIso(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function coerceString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return v[0].trim();
  return null;
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

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fixtureId = useMemo(() => coerceString(params.id), [params.id]);

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

  // We need a window to search in. Keep it consistent with Home/Fixtures/Build (next 30 days).
  const fromIso = useMemo(() => toIsoDate(new Date()), []);
  const toIso = useMemo(() => addDaysIso(new Date(), 30), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<FixtureListRow | null>(null);
  const [matchLeague, setMatchLeague] = useState<LeagueOption | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!fixtureId) {
        setError("Missing match id.");
        return;
      }

      setLoading(true);
      setError(null);
      setMatch(null);
      setMatchLeague(null);

      try {
        // Pragmatic approach: fetch within the next-30-days window for each league,
        // then locate the fixture by ID. This keeps the app working without
        // requiring a new API method.
        for (const l of leagues) {
          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from: fromIso,
            to: toIso,
          });

          if (cancelled) return;

          const arr = Array.isArray(res) ? res : [];
          const found = arr.find((r) => String(r?.fixture?.id ?? "") === String(fixtureId));
          if (found) {
            setMatch(found);
            setMatchLeague(l);
            setLoading(false);
            return;
          }
        }

        if (cancelled) return;
        setError("That match isn’t available in the current 30-day window. Try Fixtures and search, or widen the window later.");
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load match details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [fixtureId, leagues, fromIso, toIso]);

  const home = match?.teams?.home?.name ?? "";
  const away = match?.teams?.away?.name ?? "";
  const kickoff = formatUkDateTimeMaybe(match?.fixture?.date);
  const venue = match?.fixture?.venue?.name ?? "";
  const city = match?.fixture?.venue?.city ?? "";
  const leagueLabel = matchLeague?.label ?? match?.league?.name ?? "";

  function onPlanTrip() {
    if (!fixtureId) return;

    const leagueId = matchLeague?.leagueId ?? undefined;
    const season = matchLeague?.season ?? undefined;

    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        ...(leagueId ? { leagueId: String(leagueId) } : {}),
        ...(season ? { season: String(season) } : {}),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  function onOpenFixtures() {
    const leagueId = matchLeague?.leagueId ?? undefined;
    const season = matchLeague?.season ?? undefined;

    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        ...(leagueId ? { leagueId: String(leagueId) } : {}),
        ...(season ? { season: String(season) } : {}),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  return (
    <Background imageUrl={getBackground("fixtures")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Match",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card} intensity={26}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading match…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Match unavailable" message={error} /> : null}

            {!loading && !error && match ? (
              <>
                <Text style={styles.kicker}>{leagueLabel || "Match details"}</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {home && away ? `${home} vs ${away}` : `Match ${fixtureId}`}
                </Text>

                <View style={styles.metaBlock}>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Kickoff: </Text>
                    {kickoff}
                  </Text>

                  {(venue || city) ? (
                    <Text style={styles.metaLine}>
                      <Text style={styles.metaLabel}>Venue: </Text>
                      {[venue, city].filter(Boolean).join(" • ")}
                    </Text>
                  ) : null}

                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Match ID: </Text>
                    {fixtureId}
                  </Text>
                </View>

                <View style={styles.ctaRow}>
                  <Pressable onPress={onPlanTrip} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Plan Trip</Text>
                    <Text style={styles.btnPrimaryMeta}>Pre-fills this match</Text>
                  </Pressable>

                  <Pressable onPress={onOpenFixtures} style={[styles.btn, styles.btnSecondary]}>
                    <Text style={styles.btnSecondaryText}>Open Fixtures</Text>
                  </Pressable>
                </View>

                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Next step</Text>
                  <Text style={styles.noteText}>
                    This page is now a real bridge into Trip Build. When you later add a dedicated “getFixtureById”
                    service method, replace the multi-league scan and this becomes instant.
                  </Text>
                </View>
              </>
            ) : null}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: theme.spacing.xl, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary },

  kicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 8,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 30,
  },

  metaBlock: { marginTop: 12, gap: 6 },
  metaLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  metaLabel: { color: theme.colors.text, fontWeight: "900" },

  ctaRow: { marginTop: 14, gap: 10 },

  btn: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    paddingVertical: 14,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  btnPrimaryMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "700" },

  btnSecondary: {
    paddingVertical: 12,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  btnSecondaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  noteBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  noteTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  noteText: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
