// app/(tabs)/trips.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import SectionHeader from "@/src/components/SectionHeader";
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
      // Upcoming first, then by start date, then updatedAt
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

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips();
    }

    return unsub;
  }, []);

  const sorted = useMemo(() => sortTripsUpcomingFirst(trips), [trips]);

  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nowTs = now.getTime();

    return sorted.filter((t) => {
      if (!t.startDate) return false;
      const d = new Date(`${t.startDate}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.getTime() >= nowTs;
    });
  }, [sorted]);

  const past = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nowTs = now.getTime();

    return sorted.filter((t) => {
      if (!t.startDate) return true; // unknown dates go to past bucket
      const d = new Date(`${t.startDate}T00:00:00Z`);
      return Number.isNaN(d.getTime()) || d.getTime() < nowTs;
    });
  }, [sorted]);

  function openTrip(t: Trip) {
    router.push({ pathname: "/trip/[id]", params: { id: t.id } } as any);
  }

  function editTrip(t: Trip) {
    router.push({ pathname: "/trip/build", params: { tripId: t.id } } as any);
  }

  async function deleteTrip(t: Trip) {
    // Keep it simple: soft confirm via 2-step UX (tap twice)
    // If you want a native Alert confirm later, add it here.
    await tripsStore.removeTrip(t.id);
  }

  return (
    <Background imageUrl={getBackground("trips")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Trips</Text>
            <Text style={styles.subtitle}>Your saved plans and upcoming breaks</Text>
          </View>

          <GlassCard style={styles.card} intensity={24}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.h1}>Quick actions</Text>
                <Text style={styles.muted}>Build a new trip or jump back into an existing plan.</Text>
              </View>

              <Pressable onPress={() => router.push("/trip/build")} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Build trip</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            {!loaded ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trips…</Text>
              </View>
            ) : null}

            {loaded && trips.length === 0 ? (
              <EmptyState title="No trips yet" message="Build your first trip from Home or Fixtures." />
            ) : null}

            {loaded && trips.length > 0 ? (
              <>
                <SectionHeader title="Upcoming" subtitle={`${upcoming.length} trip${upcoming.length === 1 ? "" : "s"}`} />
                {upcoming.length === 0 ? (
                  <Text style={styles.bucketEmpty}>No upcoming trips.</Text>
                ) : (
                  <View style={styles.list}>
                    {upcoming.map((t) => (
                      <GlassCard key={t.id} style={styles.tripCard} intensity={22}>
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
                          <Pressable onPress={() => editTrip(t)} style={styles.actionBtn}>
                            <Text style={styles.actionBtnText}>Edit</Text>
                          </Pressable>
                          <Pressable onPress={() => deleteTrip(t)} style={[styles.actionBtn, styles.dangerBtn]}>
                            <Text style={styles.dangerText}>Delete</Text>
                          </Pressable>
                        </View>
                      </GlassCard>
                    ))}
                  </View>
                )}

                <View style={{ height: 14 }} />

                <SectionHeader title="Past & draft" subtitle={`${past.length} item${past.length === 1 ? "" : "s"}`} />
                {past.length === 0 ? (
                  <Text style={styles.bucketEmpty}>No past trips.</Text>
                ) : (
                  <View style={styles.list}>
                    {past.slice(0, 20).map((t) => (
                      <GlassCard key={t.id} style={styles.tripCard} intensity={22}>
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
                          <Pressable onPress={() => editTrip(t)} style={styles.actionBtn}>
                            <Text style={styles.actionBtnText}>Edit</Text>
                          </Pressable>
                          <Pressable onPress={() => deleteTrip(t)} style={[styles.actionBtn, styles.dangerBtn]}>
                            <Text style={styles.dangerText}>Delete</Text>
                          </Pressable>
                        </View>
                      </GlassCard>
                    ))}
                    {past.length > 20 ? <Text style={styles.moreInline}>Showing the latest 20.</Text> : null}
                  </View>
                )}
              </>
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

  card: { padding: theme.spacing.lg },

  topRow: { flexDirection: "row", gap: 12, alignItems: "center" },

  h1: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  muted: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
    alignSelf: "flex-start",
  },
  primaryBtnText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  divider: {
    marginTop: 14,
    marginBottom: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },

  bucketEmpty: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  list: { marginTop: 10, gap: 10 },

  tripCard: {
    padding: theme.spacing.md,
    borderRadius: 16,
  },

  tripMain: { flex: 1 },

  tripTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.lg },
  tripMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  tripNotes: { marginTop: 8, color: theme.colors.textTertiary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  tripActions: { marginTop: 12, flexDirection: "row", gap: 10 },

  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  actionBtnText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  dangerBtn: {
    borderColor: "rgba(255, 80, 80, 0.30)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  dangerText: { color: "rgba(255, 120, 120, 0.95)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  moreInline: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
});
