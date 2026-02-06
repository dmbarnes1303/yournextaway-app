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

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import type { SavedItem } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
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
    return "";
  }
}

function safePartnerName(partnerId?: string) {
  if (!partnerId) return null;
  try {
    return getPartner(partnerId).name;
  } catch {
    return null;
  }
}

function getItemDetailsText(item: SavedItem) {
  const metaText = typeof item.metadata?.text === "string" ? item.metadata.text.trim() : "";
  if (metaText) return metaText;

  // fallback: show something useful instead of “No link”
  const bits: string[] = [];
  if (item.priceText) bits.push(item.priceText);
  if (item.partnerUrl) bits.push(item.partnerUrl);
  return bits.join("\n") || "No extra details saved.";
}

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function WalletScreen() {
  const [tripsLoaded, setTripsLoaded] = useState(tripsStore.getState().loaded);
  const [savedLoaded, setSavedLoaded] = useState(savedItemsStore.getState().loaded);

  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);
  const [items, setItems] = useState<SavedItem[]>(savedItemsStore.getState().items);

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

  const loading = !tripsLoaded || !savedLoaded;

  const booked = useMemo(() => items.filter((i) => i.status === "booked"), [items]);

  const grouped = useMemo(() => {
    // keep ordering stable: items already sorted in store, but groupByTrip loses map order;
    // we’ll just accept Map insertion order based on first appearance in booked[]
    return groupByTrip(booked);
  }, [booked]);

  const tripById = useMemo(() => {
    const map = new Map<string, Trip>();
    for (const t of trips) map.set(String(t.id), t);
    return map;
  }, [trips]);

  async function openItemLink(item: SavedItem) {
    if (!item.partnerUrl) {
      Alert.alert(item.title || "Item", getItemDetailsText(item));
      return;
    }

    try {
      await openPartnerUrl(item.partnerUrl);
    } catch {
      Alert.alert("Couldn’t open link", "Your device could not open that link.");
    }
  }

  async function archiveItem(item: SavedItem) {
    try {
      await savedItemsStore.transitionStatus(item.id, "archived");
    } catch {
      Alert.alert("Couldn’t archive", "That item can’t be archived right now.");
    }
  }

  function openActions(item: SavedItem) {
    const hasLink = Boolean(item.partnerUrl);
    const details = getItemDetailsText(item);

    Alert.alert(
      item.title || "Wallet item",
      details,
      [
        { text: "Close", style: "cancel" },
        hasLink
          ? { text: "Open link", style: "default", onPress: () => openItemLink(item) }
          : { text: "View details", style: "default" },
        { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ].filter(Boolean) as any,
      { cancelable: true }
    );
  }

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
            <Text style={styles.subtitle}>Your confirmed bookings and saved essentials</Text>
          </View>

          {loading && (
            <GlassCard style={styles.card}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading wallet…</Text>
              </View>
            </GlassCard>
          )}

          {!loading && booked.length === 0 && (
            <GlassCard style={styles.card}>
              <EmptyState
                title="Nothing booked yet"
                message="When you confirm bookings in a trip, they appear here."
              />
            </GlassCard>
          )}

          {!loading && booked.length > 0 && (
            <>
              {[...grouped.entries()].map(([tripId, tripItems]) => {
                const trip = tripById.get(tripId);
                const title = (trip?.cityId || "").trim() || "Trip";

                return (
                  <View key={tripId} style={styles.section}>
                    <Text style={styles.sectionTitle}>{title}</Text>

                    <GlassCard style={styles.card} strength="subtle">
                      <View style={{ gap: 10 }}>
                        {tripItems.map((it) => {
                          const partnerName = safePartnerName(it.partnerId);
                          const typeLabel = getSavedItemTypeLabel(it.type);
                          const domain = it.partnerUrl ? shortDomain(it.partnerUrl) : "";

                          const meta =
                            typeLabel +
                            (partnerName ? ` • ${partnerName}` : "") +
                            (domain ? ` • ${domain}` : "") +
                            (!it.partnerUrl && it.type === "note" ? ` • Notes` : "");

                          return (
                            <Pressable
                              key={it.id}
                              onPress={() => openActions(it)}
                              style={styles.itemRow}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle} numberOfLines={1}>
                                  {it.title}
                                </Text>

                                <Text style={styles.itemMeta} numberOfLines={1}>
                                  {meta}
                                </Text>

                                {it.priceText ? (
                                  <Text style={styles.priceLine} numberOfLines={1}>
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
            </>
          )}

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* styles */
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

  section: { marginTop: 2 },

  sectionTitle: {
    marginBottom: 8,
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
