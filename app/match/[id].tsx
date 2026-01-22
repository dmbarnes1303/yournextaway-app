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

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";

import { getRollingWindowIso, toIsoDate, addDaysIso } from "@/src/constants/football";
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

function currentFootballSeasonStartYear(now = new Date()): number {
  // Typical European season starts around July/August.
  // Jan 2026 => season "2025" (i.e. 2025/26)
  const y = now.getFullYear();
  const m = now.getMonth(); // 0=Jan
  return m >= 6 ? y : y - 1;
}

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const id = useMemo(() => coerceString((params as any)?.id), [params]);

  // Prefer passed context, else fall back to a safe rolling window.
  // (Match screen itself doesn't load a list; this is just for routing context.)
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const fallbackFrom = useMemo(() => todayIso ?? rolling.from, [todayIso, rolling.from]);
  const fallbackTo = useMemo(() => rolling.to ?? addDaysIso(fallbackFrom, 30), [rolling.to, fallbackFrom]);

  const fromIso = useMemo(() => coerceString((params as any)?.from) ?? fallbackFrom, [params, fallbackFrom]);
  const toIso = useMemo(() => coerceString((params as any)?.to) ?? fallbackTo, [params, fallbackTo]);

  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeSeason = useMemo(() => coerceNumber((params as any)?.season), [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<FixtureListRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) {
        setError("Missing match id.");
        return;
      }

      setLoading(true);
      setError(null);
      setRow(null);

      try {
        const r = await getFixtureById(id);
        if (cancelled) return;

        if (!r) {
          setError("Match not found.");
          return;
        }

        setRow(r);
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
  }, [id]);

  const fixtureId = useMemo(() => {
    const apiId = row?.fixture?.id;
    if (apiId != null) return String(apiId);
    return id ?? "";
  }, [row, id]);

  const home = row?.teams?.home?.name ?? "Home";
  const away = row?.teams?.away?.name ?? "Away";
  const kickoff = formatUkDateTimeMaybe(row?.fixture?.date);

  const venue = row?.fixture?.venue?.name ?? "";
  const city = row?.fixture?.venue?.city ?? "";
  const place = [venue, city].filter(Boolean).join(" • ");

  const leagueName = row?.league?.name ?? "League";
  const apiLeagueId = row?.league?.id ?? null;

  const effectiveLeagueId = apiLeagueId ?? routeLeagueId ?? null;

  // Prefer explicit season param, else API response, else computed season-start-year
  const apiSeason = (row as any)?.league?.season;
  const effectiveSeason =
    routeSeason ?? (typeof apiSeason === "number" ? apiSeason : null) ?? currentFootballSeasonStartYear();

  function onPlanTrip() {
    if (!fixtureId) return;

    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        ...(effectiveLeagueId ? { leagueId: String(effectiveLeagueId) } : {}),
        ...(effectiveSeason ? { season: String(effectiveSeason) } : {}),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  function onOpenFixtures() {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        ...(effectiveLeagueId ? { leagueId: String(effectiveLeagueId) } : {}),
        ...(effectiveSeason ? { season: String(effectiveSeason) } : {}),
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

            {!loading && !error && row ? (
              <>
                <Text style={styles.kicker}>{leagueName}</Text>

                <Text style={styles.title} numberOfLines={2}>
                  {home} vs {away}
                </Text>

                <View style={styles.metaBlock}>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Kickoff: </Text>
                    {kickoff}
                  </Text>

                  {place ? (
                    <Text style={styles.metaLine}>
                      <Text style={styles.metaLabel}>Venue: </Text>
                      {place}
                    </Text>
                  ) : null}

                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Season: </Text>
                    {String(effectiveSeason)}
                  </Text>

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
});
