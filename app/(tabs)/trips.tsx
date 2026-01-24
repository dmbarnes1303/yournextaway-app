// app/(tabs)/trips.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import tripsStore, { type Trip } from "@/src/state/trips";

import { formatUkDateRange } from "@/src/utils/formatters";

export default function TripsScreen() {
  const router = useRouter();

  const [loaded, setLoaded] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoaded(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips();
    }

    return unsub;
  }, []);

  const hasTrips = useMemo(() => trips.length > 0, [trips]);

  return (
    <Background imageUrl={getBackground("trips")}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>My Trips</Text>
              <Text style={styles.subtitle}>Your saved match trips</Text>
            </View>

            <Pressable onPress={() => router.push("/trip/build")} style={styles.cta}>
              <Text style={styles.ctaText}>Build Trip</Text>
            </Pressable>
          </View>

          <Text style={styles.meta}>
            {loaded ? `${trips.length} trip${trips.length === 1 ? "" : "s"}` : "Loading…"}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card}>
            {!loaded ? <EmptyState title="Loading trips" message="One moment…" /> : null}

            {loaded && !hasTrips ? (
              <View style={{ gap: 12 }}>
                <EmptyState title="No trips planned" message="Pick a fixture and save a simple 2-night trip." />

                <View style={styles.emptyActions}>
                  <Pressable onPress={() => router.push("/(tabs)/fixtures")} style={[styles.emptyBtn, styles.emptyBtnPrimary]}>
                    <Text style={styles.emptyBtnText}>Browse fixtures</Text>
                  </Pressable>

                  <Pressable onPress={() => router.push("/trip/build")} style={styles.emptyBtn}>
                    <Text style={styles.emptyBtnText}>Build trip</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {loaded && hasTrips ? (
              <View style={styles.list}>
                {trips.map((t) => {
                  const matchCount = t.matchIds?.length ?? 0;

                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })}
                      style={styles.row}
                    >
                      <Text style={styles.rowTitle}>{t.cityId || "Trip"}</Text>
                      <Text style={styles.rowMeta}>
                        {formatUkDateRange(t.startDate, t.endDate)} • {matchCount} match{matchCount === 1 ? "" : "es"}
                      </Text>

                      {t.notes?.trim() ? (
                        <Text style={styles.rowNotes} numberOfLines={2}>
                          {t.notes.trim()}
                        </Text>
                      ) : null}
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
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.md,
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
  meta: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  cta: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  ctaText: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: theme.fontSize.sm,
  },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  card: { minHeight: 240 },

  emptyActions: { flexDirection: "row", gap: 10 },
  emptyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
  },
  emptyBtnPrimary: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  emptyBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  list: { gap: 10 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },
  rowMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  rowNotes: {
    marginTop: 6,
    color: theme.colors.text,
    opacity: 0.9,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
});
