// app/(tabs)/home.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import tripsStore, { type Trip } from "@/src/state/trips";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

function toIsoDate(date: Date): string {
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

export default function HomeScreen() {
  const router = useRouter();

  // Trips
  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoadedTrips(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) tripsStore.loadTrips();
    return unsub;
  }, []);

  const topTrips = useMemo(() => trips.slice(0, 3), [trips]);

  // Fixtures preview (default PL)
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setFxLoading(true);
      setFxError(null);
      setFxRows([]);

      try {
        const from = toIsoDate(new Date());
        const to = toIsoDate(new Date(Date.now() + 1000 * 60 * 60 * 24 * 30));

        const rows = await getFixtures({
          league: 39,   // Premier League
          season: 2025, // your current choice
          from,
          to,
        });

        if (cancelled) return;
        setFxRows(Array.isArray(rows) ? rows.slice(0, 5) : []);
      } catch (e: any) {
        if (cancelled) return;
        setFxError(e?.message ?? "Failed to load fixtures preview.");
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Background imageUrl={getBackground("home")}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>YourNextAway</Text>
            <Text style={styles.subtitle}>Plan your next football trip</Text>
          </View>

          <GlassCard style={styles.quickCard} intensity={24}>
            <Text style={styles.quickTitle}>Quick actions</Text>

            <View style={styles.quickRow}>
              <Pressable onPress={() => router.push("/trip/build")} style={[styles.quickBtn, styles.quickBtnPrimary]}>
                <Text style={styles.quickBtnPrimaryText}>Build Trip</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/(tabs)/fixtures")} style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>Fixtures</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/(tabs)/trips")} style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>Trips</Text>
              </Pressable>
            </View>

            <Text style={styles.quickNote}>
              Tip: Pick a match → save trip → open the trip for match details.
            </Text>
          </GlassCard>

          <View style={styles.section}>
            <SectionHeader title="Next fixtures" subtitle="Premier League preview" />
            <GlassCard style={styles.card} intensity={22}>
              {fxLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!fxLoading && fxError ? <EmptyState title="Couldn’t load fixtures" message={fxError} /> : null}

              {!fxLoading && !fxError && fxRows.length === 0 ? (
                <EmptyState title="No fixtures found" message="Try again later." />
              ) : null}

              {!fxLoading && !fxError && fxRows.length > 0 ? (
                <View style={styles.list}>
                  {fxRows.map((r, idx) => {
                    const id = r?.fixture?.id;
                    const home = r?.teams?.home?.name ?? "Home";
                    const away = r?.teams?.away?.name ?? "Away";
                    const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
                    const venue = r?.fixture?.venue?.name ?? "";
                    const line2 = venue ? `${kickoff} • ${venue}` : kickoff;

                    return (
                      <Pressable
                        key={String(id ?? idx)}
                        onPress={() => (id ? router.push({ pathname: "/match/[id]", params: { id: String(id) } }) : null)}
                        style={styles.row}
                      >
                        <Text style={styles.rowTitle}>{home} vs {away}</Text>
                        <Text style={styles.rowMeta}>{line2}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <Pressable onPress={() => router.push("/(tabs)/fixtures")} style={styles.linkBtn}>
                <Text style={styles.linkText}>See all fixtures</Text>
              </Pressable>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Your trips" subtitle="Your saved plans" />
            <GlassCard style={styles.card} intensity={22}>
              {!loadedTrips ? <EmptyState title="Loading trips" message="One moment…" /> : null}

              {loadedTrips && trips.length === 0 ? (
                <EmptyState title="No trips yet" message="Build your first away day in 30 seconds." />
              ) : null}

              {loadedTrips && trips.length > 0 ? (
                <View style={styles.list}>
                  {topTrips.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })}
                      style={styles.row}
                    >
                      <Text style={styles.rowTitle}>{t.cityId || "Trip"}</Text>
                      <Text style={styles.rowMeta}>
                        {t.startDate || "TBC"} → {t.endDate || "TBC"} • {t.matchIds?.length ?? 0} match
                        {(t.matchIds?.length ?? 0) === 1 ? "" : "es"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Pressable onPress={() => router.push("/(tabs)/trips")} style={styles.linkBtn}>
                <Text style={styles.linkText}>Open Trips</Text>
              </Pressable>
            </GlassCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },

  section: { marginTop: theme.spacing.lg },

  card: { padding: theme.spacing.md },
  muted: { marginTop: 8, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },

  list: { marginTop: 10, gap: 10 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowTitle: { color: theme.colors.text, fontWeight: "800", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  linkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
  },
  linkText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  quickCard: { padding: theme.spacing.md, marginTop: theme.spacing.sm },
  quickTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  quickRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
  },
  quickBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  quickBtnPrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.40)",
  },
  quickBtnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  quickNote: { marginTop: 12, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
