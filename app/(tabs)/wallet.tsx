// app/(tabs)/wallet.tsx

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
import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";

/* -------------------------------- Helpers -------------------------------- */

const TYPE_LABEL: Record<string, string> = {
  tickets: "Tickets",
  hotel: "Stay",
  flight: "Flights",
  train: "Trains",
  transfer: "Transfers",
  things: "Things",
  insurance: "Insurance",
  claim: "Claim",
  note: "Note",
  other: "Other",
};

function groupByTrip(items: SavedItem[]) {
  const map: Record<string, SavedItem[]> = {};
  for (const it of items) {
    if (!map[it.tripId]) map[it.tripId] = [];
    map[it.tripId].push(it);
  }
  return map;
}

/* -------------------------------- Screen -------------------------------- */

export default function WalletScreen() {
  const router = useRouter();

  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [loadedItems, setLoadedItems] = useState(savedItemsStore.getState().loaded);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [booked, setBooked] = useState<SavedItem[]>([]);

  /* ----------------------------- subscriptions ---------------------------- */

  useEffect(() => {
    const sync = () => {
      const t = tripsStore.getState();
      setLoadedTrips(t.loaded);
      setTrips(t.trips);
    };

    const unsub = tripsStore.subscribe(sync);
    sync();

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().catch(() => {});
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    const sync = () => {
      const s = savedItemsStore.getState();
      setLoadedItems(s.loaded);
      setBooked(s.items.filter((x) => x.status === "booked"));
    };

    const unsub = savedItemsStore.subscribe(sync);
    sync();

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().catch(() => {});
    }

    return () => unsub();
  }, []);

  /* ------------------------------ derived -------------------------------- */

  const byTrip = useMemo(() => groupByTrip(booked), [booked]);

  const orderedTrips = useMemo(() => {
    return trips
      .filter((t) => byTrip[t.id]?.length)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [trips, byTrip]);

  function openTrip(tripId: string) {
    router.push({ pathname: "/trip/[id]", params: { id: tripId } } as any);
  }

  /* -------------------------------- render -------------------------------- */

  return (
    <Background imageUrl={getBackground("wallet")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>Your booked items, stored offline</Text>
          </View>

          {!loadedTrips || !loadedItems ? (
            <GlassCard style={styles.card} strength="default">
              <Text style={styles.muted}>Loading wallet…</Text>
            </GlassCard>
          ) : orderedTrips.length === 0 ? (
            <GlassCard style={styles.card} strength="default">
              <EmptyState
                title="No bookings yet"
                message="When you confirm bookings inside trips, they appear here."
              />
            </GlassCard>
          ) : (
            orderedTrips.map((trip) => {
              const items = byTrip[trip.id] ?? [];

              return (
                <View key={trip.id} style={styles.section}>
                  <Pressable onPress={() => openTrip(trip.id)}>
                    <Text style={styles.tripTitle}>
                      {trip.cityId || "Trip"}
                    </Text>
                    <Text style={styles.tripMeta}>
                      {trip.startDate} → {trip.endDate}
                    </Text>
                  </Pressable>

                  <GlassCard style={styles.card} strength="default">
                    <View style={{ gap: 10 }}>
                      {items.map((it) => (
                        <View key={it.id} style={styles.row}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle} numberOfLines={1}>
                              {it.title}
                            </Text>
                            <Text style={styles.rowMeta}>
                              {TYPE_LABEL[it.type] || it.type}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => openTrip(trip.id)}
                            style={styles.openBtn}
                          >
                            <Text style={styles.openText}>View</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </View>
              );
            })
          )}

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

  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },

  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  section: { gap: 8 },

  tripTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
  },

  tripMeta: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  card: { padding: theme.spacing.lg },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  rowTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
  },

  rowMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  openBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  openText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.xs,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
});
