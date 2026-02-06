// app/(tabs)/wallet.tsx
import React, { useEffect, useMemo, useState } from "react";
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
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import type { SavedItem } from "@/src/core/savedItemTypes";
import { getPartner } from "@/src/core/partners";
import { openPartnerUrl } from "@/src/services/partnerClicks";

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */

function groupByTrip(items: SavedItem[]) {
  const map = new Map<string, SavedItem[]>();
  for (const it of items) {
    const arr = map.get(it.tripId) ?? [];
    arr.push(it);
    map.set(it.tripId, arr);
  }
  return map;
}

function shortDomain(url?: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function partnerName(id?: string) {
  if (!id) return null;
  try {
    return getPartner(id as any)?.name ?? null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function WalletScreen() {
  const router = useRouter();

  const [tripsLoaded, setTripsLoaded] = useState(tripsStore.getState().loaded);
  const [savedLoaded, setSavedLoaded] = useState(savedItemsStore.getState().loaded);

  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);
  const [items, setItems] = useState<SavedItem[]>(savedItemsStore.getState().items);

  /* ----------------------------- Subscriptions ----------------------------- */

  useEffect(() => {
    const unsubTrips = tripsStore.subscribe((s) => {
      setTripsLoaded(s.loaded);
      setTrips(s.trips);
    });

    const unsubSaved = savedItemsStore.subscribe((s) => {
      setSavedLoaded(s.loaded);
      setItems(s.items);
    });

    if (!tripsStore.getState().loaded) tripsStore.loadTrips();
    if (!savedItemsStore.getState().loaded) savedItemsStore.load();

    return () => {
      unsubTrips();
      unsubSaved();
    };
  }, []);

  /* ------------------------------- Selectors -------------------------------- */

  const pending = useMemo(
    () => items.filter((i) => i.status === "pending"),
    [items]
  );

  const booked = useMemo(
    () => items.filter((i) => i.status === "booked"),
    [items]
  );

  const pendingByTrip = useMemo(() => groupByTrip(pending), [pending]);
  const bookedByTrip = useMemo(() => groupByTrip(booked), [booked]);

  const tripById = useMemo(() => {
    const map = new Map<string, Trip>();
    for (const t of trips) map.set(String(t.id), t);
    return map;
  }, [trips]);

  const loading = !tripsLoaded || !savedLoaded;

  /* -------------------------------------------------------------------------- */

  async function openItem(item: SavedItem) {
    if (!item.partnerUrl) {
      Alert.alert("No link", "This item has no saved link.");
      return;
    }

    try {
      await openPartnerUrl(item.partnerUrl);
    } catch {
      Alert.alert("Couldn’t open link", "Your device could not open that link.");
    }
  }

  function goTrip(tripId: string) {
    router.push({ pathname: "/trip/[id]", params: { id: tripId } } as any);
  }

  /* -------------------------------------------------------------------------- */

  function Section({
    title,
    grouped,
  }: {
    title: string;
    grouped: Map<string, SavedItem[]>;
  }) {
    if (grouped.size === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {[...grouped.entries()].map(([tripId, tripItems]) => {
          const trip = tripById.get(tripId);
          const tripTitle = trip?.cityId || "Trip";

          return (
            <View key={tripId} style={{ gap: 8 }}>
              <Pressable onPress={() => goTrip(tripId)}>
                <Text style={styles.tripTitle}>{tripTitle}</Text>
              </Pressable>

              <GlassCard style={styles.card} strength="subtle">
                <View style={{ gap: 10 }}>
                  {tripItems.map((it) => {
                    const pName = partnerName(it.partnerId);
                    const domain = shortDomain(it.partnerUrl);

                    return (
                      <Pressable
                        key={it.id}
                        onPress={() => openItem(it)}
                        style={styles.itemRow}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {it.title}
                          </Text>

                          <Text style={styles.itemMeta} numberOfLines={1}>
                            {it.type.toUpperCase()}
                            {pName ? ` • ${pName}` : ""}
                            {domain ? ` • ${domain}` : ""}
                          </Text>

                          {it.priceText ? (
                            <Text style={styles.priceLine}>
                              {it.priceText}
                            </Text>
                          ) : null}
                        </View>

                        <Text style={styles.chev}>›</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </GlassCard>
            </View>
          );
        })}
      </View>
    );
  }

  /* -------------------------------------------------------------------------- */

  return (
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>
              Your booking confirmations & pending items
            </Text>
          </View>

          {/* LOADING */}
          {loading && (
            <GlassCard style={styles.card}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading wallet…</Text>
              </View>
            </GlassCard>
          )}

          {/* EMPTY */}
          {!loading && pending.length === 0 && booked.length === 0 && (
            <GlassCard style={styles.card}>
              <EmptyState
                title="Wallet empty"
                message="When you start booking trips, items appear here."
              />
            </GlassCard>
          )}

          {!loading && (
            <>
              <Section title="Pending" grouped={pendingByTrip} />
              <Section title="Booked" grouped={bookedByTrip} />
            </>
          )}

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

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
  },

  subtitle: {
    marginTop: 4,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
  },

  section: { gap: 12 },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
  },

  tripTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
  },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  itemTitle: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  itemMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  priceLine: {
    marginTop: 6,
    color: "rgba(242,244,246,0.92)",
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  chev: {
    color: theme.colors.textSecondary,
    fontSize: 24,
    marginTop: -2,
  },
});
