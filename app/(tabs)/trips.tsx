// app/(tabs)/trips.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import { formatUkDateOnly } from "@/src/utils/formatters";

function tripSummaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} match${n === 1 ? "" : "es"}`;
}

function sortTripsUpcomingFirst(trips: Trip[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nowTs = now.getTime();

  return [...trips]
    .map((t) => {
      const start = t.startDate ? new Date(`${t.startDate}T00:00:00Z`) : null;
      const ts = start && !Number.isNaN(start.getTime()) ? start.getTime() : null;
      return { t, ts };
    })
    .sort((a, b) => {
      const aUpcoming = a.ts != null ? a.ts >= nowTs : false;
      const bUpcoming = b.ts != null ? b.ts >= nowTs : false;

      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

      if (a.ts != null && b.ts != null && a.ts !== b.ts) return a.ts - b.ts;

      const au = a.t.updatedAt ?? a.t.createdAt ?? 0;
      const bu = b.t.updatedAt ?? b.t.createdAt ?? 0;
      return bu - au;
    })
    .map((x) => x.t);
}

export default function TripsScreen() {
  const router = useRouter();

  const [loaded, setLoaded] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoaded(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) tripsStore.loadTrips();
    return unsub;
  }, []);

  const sorted = useMemo(() => sortTripsUpcomingFirst(trips), [trips]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nowTs = now.getTime();

    const up: Trip[] = [];
    const pa: Trip[] = [];

    for (const t of sorted) {
      if (!t.startDate) {
        pa.push(t);
        continue;
      }
      const d = new Date(`${t.startDate}T00:00:00Z`);
      const ts = !Number.isNaN(d.getTime()) ? d.getTime() : null;
      if (ts == null) pa.push(t);
      else if (ts >= nowTs) up.push(t);
      else pa.push(t);
    }

    return { upcoming: up, past: pa };
  }, [sorted]);

  const openTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/[id]", params: { id: t.id } } as any),
    [router]
  );

  const editTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/build", params: { tripId: t.id } } as any),
    [router]
  );

  const deleteTrip = useCallback((t: Trip) => {
    Alert.alert("Delete trip?", "This will remove the trip from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await tripsStore.removeTrip(t.id);
        },
      },
    ]);
  }, []);

  const goBuild = useCallback(() => router.push("/trip/build"), [router]);
  const goFixtures = useCallback(() => router.push("/(tabs)/fixtures"), [router]);

  const showEmpty = loaded && trips.length === 0;

  return (
    <Background imageUrl={getBackground("trips")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Trips</Text>
            <Text style={styles.subtitle}>Your saved plans and upcoming breaks</Text>
          </View>

          {/* LOADING */}
          {!loaded ? (
            <GlassCard style={styles.card} strength="default">
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trips…</Text>
              </View>
            </GlassCard>
          ) : null}

          {/* EMPTY STATE (single card, one primary + one secondary) */}
          {showEmpty ? (
            <GlassCard style={styles.card} strength="default">
              <EmptyState
                title="No trips yet"
                message="Start with a fixture, then build the break in one hub."
              />

              <View style={styles.emptyActions}>
                <Pressable onPress={goBuild} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Build trip</Text>
                </Pressable>

                <Pressable onPress={goFixtures} style={[styles.btn, styles.btnSecondary]}>
                  <Text style={styles.btnSecondaryText}>Browse fixtures</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : null}

          {/* HAS TRIPS */}
          {loaded && !showEmpty ? (
            <>
              <GlassCard style={styles.card} strength="default">
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h1}>Quick action</Text>
                    <Text style={styles.muted}>Build a new trip when you spot the right fixture.</Text>
                  </View>

                  <Pressable onPress={goBuild} style={styles.pillPrimary}>
                    <Text style={styles.pillPrimaryText}>Build trip</Text>
                  </Pressable>
                </View>
              </GlassCard>

              <View style={styles.section}>
                <SectionHeader title="Upcoming" subtitle={`${upcoming.length} trip${upcoming.length === 1 ? "" : "s"}`} />
                <GlassCard style={styles.card} strength="subtle">
                  {upcoming.length === 0 ? (
                    <View style={styles.bucketEmptyWrap}>
                      <Text style={styles.bucketEmptyTitle}>No upcoming trips</Text>
                      <Text style={styles.bucketEmptyText}>Build one from Fixtures in under a minute.</Text>

                      <Pressable onPress={goFixtures} style={[styles.btn, styles.btnSecondary, { marginTop: 12 }]}>
                        <Text style={styles.btnSecondaryText}>Browse fixtures</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.list}>
                      {upcoming.map((t) => (
                        <GlassCard key={t.id} style={styles.tripCard} strength="subtle">
                          <Pressable onPress={() => openTrip(t)} style={styles.tripMain}>
                            <Text style={styles.tripTitle} numberOfLines={1}>
                              {t.cityId || "Trip"}
                            </Text>
                            <Text style={styles.tripMeta}>{tripSummaryLine(t)}</Text>
                            {t.notes ? (
                              <Text style={styles.tripNotes} numberOfLines={2}>
                                {t.notes}
                              </Text>
                            ) : null}
                          </Pressable>

                          <View style={styles.tripActions}>
                            <Pressable onPress={() => editTrip(t)} style={[styles.btn, styles.btnSecondary, styles.actionBtn]}>
                              <Text style={styles.btnSecondaryText}>Edit</Text>
                            </Pressable>

                            <Pressable onPress={() => deleteTrip(t)} style={[styles.btn, styles.btnDanger, styles.actionBtn]}>
                              <Text style={styles.btnDangerText}>Delete</Text>
                            </Pressable>
                          </View>
                        </GlassCard>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </View>

              <View style={styles.section}>
                <SectionHeader title="Past & draft" subtitle={`${past.length} item${past.length === 1 ? "" : "s"}`} />
                <GlassCard style={styles.card} strength="subtle">
                  {past.length === 0 ? (
                    <Text style={styles.bucketEmptyText}>No past trips.</Text>
                  ) : (
                    <View style={styles.list}>
                      {past.slice(0, 20).map((t) => (
                        <GlassCard key={t.id} style={styles.tripCard} strength="subtle">
                          <Pressable onPress={() => openTrip(t)} style={styles.tripMain}>
                            <Text style={styles.tripTitle} numberOfLines={1}>
                              {t.cityId || "Trip"}
                            </Text>
                            <Text style={styles.tripMeta}>{tripSummaryLine(t)}</Text>
                            {t.notes ? (
                              <Text style={styles.tripNotes} numberOfLines={2}>
                                {t.notes}
                              </Text>
                            ) : null}
                          </Pressable>

                          <View style={styles.tripActions}>
                            <Pressable onPress={() => editTrip(t)} style={[styles.btn, styles.btnSecondary, styles.actionBtn]}>
                              <Text style={styles.btnSecondaryText}>Edit</Text>
                            </Pressable>

                            <Pressable onPress={() => deleteTrip(t)} style={[styles.btn, styles.btnDanger, styles.actionBtn]}>
                              <Text style={styles.btnDangerText}>Delete</Text>
                            </Pressable>
                          </View>
                        </GlassCard>
                      ))}

                      {past.length > 20 ? <Text style={styles.moreInline}>Showing the latest 20.</Text> : null}
                    </View>
                  )}
                </GlassCard>
              </View>
            </>
          ) : null}

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },

  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
  },

  section: { marginTop: 2 },
  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  muted: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  topRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  h1: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },

  /* EMPTY ACTIONS */
  emptyActions: { marginTop: 12, gap: 10 },

  /* BUTTONS */
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  btnSecondaryText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },

  btnDanger: {
    borderColor: "rgba(255, 80, 80, 0.30)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  btnDangerText: { color: "rgba(255, 120, 120, 0.95)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },

  pillPrimary: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
    alignSelf: "flex-start",
  },
  pillPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  /* BUCKET EMPTY */
  bucketEmptyWrap: { paddingVertical: 6 },
  bucketEmptyTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  bucketEmptyText: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  /* LISTS */
  list: { marginTop: 10, gap: 10 },

  tripCard: {
    padding: theme.spacing.md,
    borderRadius: 16,
  },

  tripMain: { flex: 1 },

  tripTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.lg },
  tripMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },
  tripNotes: { marginTop: 8, color: theme.colors.textTertiary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  tripActions: { marginTop: 12, flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12 },

  moreInline: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },
});
