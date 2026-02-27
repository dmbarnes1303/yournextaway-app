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
  Platform,
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

function titleCase(input: string) {
  const s = String(input ?? "").trim();
  if (!s) return "Trip";

  // Handle kebab/snake, preserve accents, clean repeated spaces.
  const cleaned = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

  return cleaned
    .split(" ")
    .map((w) => {
      const lower = w.toLowerCase();
      // Keep common short words lower unless it's the first word.
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function cityLabel(t: Trip) {
  const raw = String(t.cityId ?? "").trim();
  return titleCase(raw || "Trip");
}

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

function countsFor(items: SavedItem[]) {
  const total = items.length;
  const pending = items.filter((x) => x.status === "pending").length;
  const booked = items.filter((x) => x.status === "booked").length;
  return { total, pending, booked };
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

  const getCounts = useCallback(
    (tripId: string) => countsFor(itemsByTrip[tripId] ?? []),
    [itemsByTrip]
  );

  const loading = !loadedTrips || !loadedItems;
  const showEmpty = !loading && trips.length === 0;

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

  const deleteTrip = useCallback(
    (t: Trip) => {
      const c = getCounts(t.id);
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
              const msg =
                `This cannot be undone.\n\n` +
                `Deleting this trip will also remove ALL saved links, pending items, booked items, and any Wallet attachments for this trip from this device.`;

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
    [getCounts, actuallyDeleteTrip]
  );

  const goBuild = () => router.push("/trip/build");
  const goFixtures = () => router.push("/(tabs)/fixtures");

  /* -------------------------------- render -------------------------------- */

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.82}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Trips</Text>
            <Text style={styles.subtitle}>Your travel workspaces</Text>
          </View>

          {loading ? (
            <GlassCard style={styles.card} strength="default">
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trips…</Text>
              </View>
            </GlassCard>
          ) : null}

          {showEmpty ? (
            <GlassCard style={styles.card} strength="default">
              <EmptyState title="No trips yet" message="Start from a fixture and build your trip workspace." />
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

          {!loading && upcoming.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Upcoming" subtitle={`${upcoming.length}`} />
              <View style={styles.list}>
                {upcoming.map((t) => (
                  <TripCard
                    key={t.id}
                    t={t}
                    getCounts={getCounts}
                    deletingTripId={deletingTripId}
                    onOpen={openTrip}
                    onEdit={editTrip}
                    onDelete={deleteTrip}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {!loading && past.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Past & draft" subtitle={`${past.length}`} />
              <View style={styles.list}>
                {past.map((t) => (
                  <TripCard
                    key={t.id}
                    t={t}
                    getCounts={getCounts}
                    deletingTripId={deletingTripId}
                    onOpen={openTrip}
                    onEdit={editTrip}
                    onDelete={deleteTrip}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ height: 18 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* ------------------------------ Trip Card ------------------------------ */

function TripCard({
  t,
  getCounts,
  deletingTripId,
  onOpen,
  onEdit,
  onDelete,
}: {
  t: Trip;
  getCounts: (tripId: string) => { total: number; pending: number; booked: number };
  deletingTripId: string | null;
  onOpen: (t: Trip) => void;
  onEdit: (t: Trip) => void;
  onDelete: (t: Trip) => void;
}) {
  const c = getCounts(t.id);
  const isDeleting = deletingTripId === t.id;

  return (
    <GlassCard style={styles.tripCard} strength="subtle" noPadding>
      <Pressable
        onPress={() => onOpen(t)}
        disabled={isDeleting}
        style={({ pressed }) => [styles.tripPress, pressed && { opacity: 0.92 }]}
        android_ripple={{ color: "rgba(255,255,255,0.05)" }}
      >
        <View style={styles.tripTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tripTitle}>{cityLabel(t)}</Text>
            <Text style={styles.tripMeta}>{tripSummaryLine(t)}</Text>
          </View>

          <Text style={styles.chev}>›</Text>
        </View>

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillKey}>Items</Text>
            <Text style={styles.pillVal}>{c.total}</Text>
          </View>

          <View style={styles.pill}>
            <Text style={styles.pillKey}>Pending</Text>
            <Text style={styles.pillVal}>{c.pending}</Text>
          </View>

          <View style={styles.pill}>
            <Text style={styles.pillKey}>Booked</Text>
            <Text style={styles.pillVal}>{c.booked}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => onEdit(t)}
            disabled={isDeleting}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionGhost,
              pressed && { opacity: 0.92 },
              isDeleting && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.actionGhostText}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(t)}
            disabled={isDeleting}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionDanger,
              pressed && { opacity: 0.92 },
              isDeleting && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.actionDangerText}>{isDeleting ? "Deleting…" : "Delete"}</Text>
          </Pressable>
        </View>
      </Pressable>
    </GlassCard>
  );
}

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  header: { gap: 6 },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: theme.fontWeight.black },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  section: { gap: 10 },
  list: { gap: 12 },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  btn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  btnPrimary: {
    borderColor: "rgba(79,224,138,0.34)",
    backgroundColor: Platform.OS === "android" ? "rgba(79,224,138,0.10)" : "rgba(79,224,138,0.08)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 14 },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
  },
  btnSecondaryText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 14 },

  tripCard: { borderRadius: 24 },
  tripPress: { padding: 14 },

  tripTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tripTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  tripMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  chev: { color: theme.colors.textTertiary, fontSize: 26, fontWeight: theme.fontWeight.black, marginTop: -2 },

  pillRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pillKey: { color: theme.colors.textTertiary, fontSize: 11, fontWeight: theme.fontWeight.black },
  pillVal: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },

  actionsRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  actionBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  actionGhost: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
  },
  actionGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 13 },

  actionDanger: {
    borderColor: "rgba(255,90,90,0.32)",
    backgroundColor: Platform.OS === "android" ? "rgba(255,90,90,0.06)" : "rgba(255,90,90,0.05)",
  },
  actionDangerText: { color: "rgba(255,120,120,0.95)", fontWeight: theme.fontWeight.black, fontSize: 13 },
});
