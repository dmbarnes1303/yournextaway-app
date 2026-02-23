// app/(tabs)/trips.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";

import { formatUkDateOnly } from "@/src/utils/formatters";

/* -------------------------------- Helpers -------------------------------- */

function tripSummaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} match${n === 1 ? "" : "es"}`;
}

function isUpcoming(t: Trip) {
  if (!t.startDate) return false;
  const d = new Date(`${t.startDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}

function groupItemsByTrip(items: SavedItem[]) {
  const map: Record<string, SavedItem[]> = {};
  for (const it of items) {
    if (!map[it.tripId]) map[it.tripId] = [];
    map[it.tripId].push(it);
  }
  return map;
}

function cityLabel(t: Trip) {
  return String(t.cityId ?? "").trim() || "Trip";
}

/* -------------------------------- Screen -------------------------------- */

export default function TripsScreen() {
  const router = useRouter();

  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  const [loadedItems, setLoadedItems] = useState(savedItemsStore.getState().loaded);
  const [items, setItems] = useState<SavedItem[]>(savedItemsStore.getState().items);

  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  /* --------------------------- subscriptions --------------------------- */

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoadedTrips(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().catch(() => {});
    }

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = savedItemsStore.subscribe((s) => {
      setLoadedItems(s.loaded);
      setItems(s.items);
    });

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().catch(() => {});
    }

    return unsub;
  }, []);

  /* ------------------------------ derived ------------------------------ */

  const itemsByTrip = useMemo(() => groupItemsByTrip(items), [items]);

  const upcoming = useMemo(() => trips.filter(isUpcoming), [trips]);
  const past = useMemo(() => trips.filter((t) => !isUpcoming(t)), [trips]);

  const counts = useCallback(
    (tripId: string) => {
      const arr = itemsByTrip[tripId] ?? [];
      return {
        total: arr.length,
        pending: arr.filter((x) => x.status === "pending").length,
        booked: arr.filter((x) => x.status === "booked").length,
      };
    },
    [itemsByTrip]
  );

  /* ------------------------------ actions ------------------------------ */

  const openTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/[id]", params: { id: t.id } } as any),
    [router]
  );

  const editTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/build", params: { tripId: t.id } } as any),
    [router]
  );

  const actuallyDeleteTrip = useCallback(
    async (t: Trip) => {
      // Hard guard against double taps / repeated confirms.
      if (deletingTripId) return;

      setDeletingTripId(t.id);
      try {
        await tripsStore.deleteTripCascade(t.id);
      } catch {
        Alert.alert("Couldn’t delete", "Try again.");
      } finally {
        setDeletingTripId(null);
      }
    },
    [deletingTripId]
  );

  // Two-step confirmation, because deleting a trip nukes its whole workspace.
  const deleteTrip = useCallback(
    (t: Trip) => {
      const c = counts(t.id);
      const name = cityLabel(t);

      Alert.alert(
        "Delete trip?",
        `"${name}" will be removed from this device.\n\nItems: ${c.total} • Pending: ${c.pending} • Booked: ${c.booked}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            style: "destructive",
            onPress: () => {
              // Second prompt: explicit irreversible warning.
              const msg =
                `This cannot be undone.\n\n` +
                `Deleting this trip will also remove ALL saved links, pending items, booked items, and any Wallet attachments for this trip from this device.\n\n` +
                `If you want to keep the workspace, archive items instead.`;

              Alert.alert("Confirm delete", msg, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete trip",
                  style: "destructive",
                  onPress: () => {
                    actuallyDeleteTrip(t).catch(() => null);
                  },
                },
              ]);
            },
          },
        ]
      );
    },
    [counts, actuallyDeleteTrip]
  );

  const goBuild = () => router.push("/trip/build");
  const goFixtures = () => router.push("/(tabs)/fixtures");

  const showEmpty = loadedTrips && trips.length === 0;

  /* -------------------------------- render -------------------------------- */

  return (
    <Background imageUrl={getBackground("trips")} overlayOpacity={0.5}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Trips</Text>
            <Text style={styles.subtitle}>Your travel workspaces</Text>
          </View>

          {!loadedTrips || !loadedItems ? (
            <GlassCard style={styles.card}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trips…</Text>
              </View>
            </GlassCard>
          ) : null}

          {showEmpty ? (
            <GlassCard style={styles.card}>
              <EmptyState title="No trips yet" message="Start from a fixture and build the trip." />
              <View style={{ gap: 10 }}>
                <Pressable onPress={goBuild} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Build trip</Text>
                </Pressable>
                <Pressable onPress={goFixtures} style={[styles.btn, styles.btnSecondary]}>
                  <Text style={styles.btnSecondaryText}>Browse fixtures</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : null}

          {upcoming.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Upcoming" subtitle={`${upcoming.length}`} />
              <View style={styles.list}>
                {upcoming.map((t) => {
                  const c = counts(t.id);
                  const isDeleting = deletingTripId === t.id;

                  return (
                    <GlassCard key={t.id} style={styles.tripCard}>
                      <Pressable onPress={() => openTrip(t)} disabled={isDeleting}>
                        <Text style={styles.tripTitle}>{cityLabel(t)}</Text>
                        <Text style={styles.tripMeta}>{tripSummaryLine(t)}</Text>

                        <View style={styles.countRow}>
                          <Text style={styles.count}>Items {c.total}</Text>
                          <Text style={styles.count}>Pending {c.pending}</Text>
                          <Text style={styles.count}>Booked {c.booked}</Text>
                        </View>
                      </Pressable>

                      <View style={styles.actions}>
                        <Pressable
                          onPress={() => editTrip(t)}
                          disabled={isDeleting}
                          style={[
                            styles.actionBtn,
                            styles.btnSecondary,
                            isDeleting && { opacity: 0.5 },
                          ]}
                        >
                          <Text style={styles.btnSecondaryText}>Edit</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => deleteTrip(t)}
                          disabled={isDeleting}
                          style={[
                            styles.actionBtn,
                            styles.btnDanger,
                            isDeleting && { opacity: 0.5 },
                          ]}
                        >
                          <Text style={styles.btnDangerText}>{isDeleting ? "Deleting…" : "Delete"}</Text>
                        </Pressable>
                      </View>
                    </GlassCard>
                  );
                })}
              </View>
            </View>
          ) : null}

          {past.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Past & draft" subtitle={`${past.length}`} />
              <View style={styles.list}>
                {past.map((t) => {
                  const c = counts(t.id);
                  const isDeleting = deletingTripId === t.id;

                  return (
                    <GlassCard key={t.id} style={styles.tripCard}>
                      <Pressable onPress={() => openTrip(t)} disabled={isDeleting}>
                        <Text style={styles.tripTitle}>{cityLabel(t)}</Text>
                        <Text style={styles.tripMeta}>{tripSummaryLine(t)}</Text>

                        <View style={styles.countRow}>
                          <Text style={styles.count}>Items {c.total}</Text>
                          <Text style={styles.count}>Pending {c.pending}</Text>
                          <Text style={styles.count}>Booked {c.booked}</Text>
                        </View>
                      </Pressable>

                      <View style={styles.actions}>
                        <Pressable
                          onPress={() => editTrip(t)}
                          disabled={isDeleting}
                          style={[
                            styles.actionBtn,
                            styles.btnSecondary,
                            isDeleting && { opacity: 0.5 },
                          ]}
                        >
                          <Text style={styles.btnSecondaryText}>Edit</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => deleteTrip(t)}
                          disabled={isDeleting}
                          style={[
                            styles.actionBtn,
                            styles.btnDanger,
                            isDeleting && { opacity: 0.5 },
                          ]}
                        >
                          <Text style={styles.btnDangerText}>{isDeleting ? "Deleting…" : "Delete"}</Text>
                        </Pressable>
                      </View>
                    </GlassCard>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  header: { paddingTop: theme.spacing.lg },
  title: { color: theme.colors.text, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.black },
  subtitle: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },

  section: { gap: 10 },
  list: { gap: 10 },

  card: { padding: theme.spacing.lg },
  tripCard: { padding: theme.spacing.md },

  tripTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.black },
  tripMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },

  countRow: { marginTop: 8, flexDirection: "row", gap: 14 },
  count: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "800" },

  actions: { marginTop: 12, flexDirection: "row", gap: 10 },

  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1 },

  btnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.34)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  btnSecondary: { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.18)" },
  btnSecondaryText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.sm },

  btnDanger: { borderColor: "rgba(255,80,80,0.35)", backgroundColor: "rgba(0,0,0,0.18)" },
  btnDangerText: { color: "rgba(255,120,120,0.95)", fontWeight: "900", fontSize: theme.fontSize.sm },

  // used for empty-state buttons
  btn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1 },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },
});
