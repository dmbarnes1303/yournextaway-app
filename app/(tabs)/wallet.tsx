// app/(tabs)/wallet.tsx
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

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import type { SavedItem, WalletAttachment } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
import { getPartner } from "@/src/core/partners";
import { openPartnerUrl } from "@/src/services/partnerClicks";
import {
  pickAndStoreAttachmentForItem,
  openAttachment,
  deleteAttachmentFile,
} from "@/src/services/walletAttachments";

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */

type WalletMode = "booked" | "archived";

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

  const bits: string[] = [];
  if (item.priceText) bits.push(item.priceText);
  if (item.partnerUrl) bits.push(item.partnerUrl);
  return bits.join("\n") || "No extra details saved.";
}

function buildMeta(item: SavedItem) {
  const typeLabel = getSavedItemTypeLabel(item.type);
  const partnerName = safePartnerName(item.partnerId);
  const domain = item.partnerUrl ? shortDomain(item.partnerUrl) : "";

  const bits = [typeLabel];
  if (partnerName) bits.push(partnerName);
  if (domain) bits.push(domain);

  if (!item.partnerUrl && item.type === "note") bits.push("Notes");

  return bits.join(" • ");
}

function attachmentLabel(att: WalletAttachment) {
  const kind = att.kind === "pdf" ? "PDF" : att.kind === "image" ? "Image" : "File";
  const name = String(att.name ?? "").trim();
  return name ? `${kind}: ${name}` : `${kind} attachment`;
}

function getAttachments(item: SavedItem) {
  return Array.isArray(item.attachments) ? item.attachments : [];
}

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function WalletScreen() {
  const [mode, setMode] = useState<WalletMode>("booked");

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

  const tripById = useMemo(() => {
    const map = new Map<string, Trip>();
    for (const t of trips) map.set(String(t.id), t);
    return map;
  }, [trips]);

  const validTripIds = useMemo(() => {
    const s = new Set<string>();
    for (const t of trips) s.add(String(t.id));
    return s;
  }, [trips]);

  const visible = useMemo(() => {
    const base =
      mode === "archived"
        ? items.filter((i) => i.status === "archived")
        : items.filter((i) => i.status === "booked");

    // Hide ghost items if cascade deletion ever failed.
    return base.filter((i) => validTripIds.has(String(i.tripId)));
  }, [items, mode, validTripIds]);

  const grouped = useMemo(() => groupByTrip(visible), [visible]);

  const counts = useMemo(() => {
    let booked = 0;
    let archived = 0;
    for (const it of items) {
      if (!validTripIds.has(String(it.tripId))) continue;
      if (it.status === "booked") booked++;
      if (it.status === "archived") archived++;
    }
    return { booked, archived };
  }, [items, validTripIds]);

  const addAttachment = useCallback(async (item: SavedItem) => {
    try {
      const att = await pickAndStoreAttachmentForItem(item.id);
      await savedItemsStore.addAttachment(item.id, att);
      Alert.alert("Added", "Attachment saved to Wallet for offline access.");
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg === "cancelled") return;
      Alert.alert("Couldn’t add attachment", msg || "Try again.");
    }
  }, []);

  const openItemLink = useCallback(async (item: SavedItem) => {
    if (!item.partnerUrl) {
      Alert.alert(item.title || "Item", getItemDetailsText(item));
      return;
    }

    try {
      await openPartnerUrl(item.partnerUrl);
    } catch {
      Alert.alert("Couldn’t open link", "Your device could not open that link.");
    }
  }, []);

  const archiveItem = useCallback(async (item: SavedItem) => {
    try {
      await savedItemsStore.transitionStatus(item.id, "archived");
    } catch {
      Alert.alert("Couldn’t archive", "That item can’t be archived right now.");
    }
  }, []);

  const restoreItem = useCallback(async (item: SavedItem) => {
    try {
      await savedItemsStore.transitionStatus(item.id, "saved");
    } catch {
      Alert.alert("Couldn’t restore", "That item can’t be restored right now.");
    }
  }, []);

  const openAttachmentMenu = useCallback((item: SavedItem) => {
    const atts = getAttachments(item);

    if (atts.length === 0) {
      Alert.alert(
        "No attachments",
        "Add a PDF or screenshot to store booking proof offline.",
        [
          { text: "Close", style: "cancel" },
          { text: "Add attachment", onPress: () => addAttachment(item) },
        ]
      );
      return;
    }

    // Step 1: pick attachment to open or manage
    Alert.alert(
      "Attachments",
      "Pick one.",
      [
        { text: "Close", style: "cancel" },
        ...atts.slice(0, 8).map((a) => ({
          text: attachmentLabel(a),
          onPress: () => {
            // Step 2: action menu for that attachment
            Alert.alert(
              attachmentLabel(a),
              "What do you want to do?",
              [
                { text: "Close", style: "cancel" },
                {
                  text: "Open",
                  onPress: async () => {
                    try {
                      await openAttachment(a);
                    } catch {
                      Alert.alert("Couldn’t open", "Your device could not open that attachment.");
                    }
                  },
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await savedItemsStore.removeAttachment(item.id, a.id);
                      await deleteAttachmentFile(a);
                    } catch {
                      Alert.alert("Couldn’t delete", "Try again.");
                    }
                  },
                },
              ],
              { cancelable: true }
            );
          },
        })),
      ],
      { cancelable: true }
    );
  }, [addAttachment]);

  function openActions(item: SavedItem) {
    const details = getItemDetailsText(item);
    const atts = getAttachments(item);
    const attCount = atts.length;

    const attLine = attCount
      ? `\n\nAttachments: ${attCount}`
      : `\n\nAttachments: none`;

    // Android hard limit: keep the first menu SMALL and route to submenus.
    const showCoreMenu = () => {
      const common: any[] = [
        { text: "Close", style: "cancel" },
        item.partnerUrl ? { text: "Open link", onPress: () => openItemLink(item) } : undefined,
        { text: attCount ? `Attachments (${attCount})` : "Add attachment", onPress: () => openAttachmentMenu(item) },
      ].filter(Boolean);

      // Third actionable slot depends on mode
      if (mode === "archived") {
        common.push({ text: "Restore", onPress: () => restoreItem(item) });
      } else {
        common.push({ text: "Archive", style: "destructive", onPress: () => archiveItem(item) });
      }

      // On Android you’ll only reliably get 3 buttons — so we enforce a 3-button menu:
      if (Platform.OS === "android") {
        // Force: Close + (Open link or Attachments) + (Archive/Restore)
        const btns: any[] = [{ text: "Close", style: "cancel" }];

        if (item.partnerUrl) btns.push({ text: "Open link", onPress: () => openItemLink(item) });
        else btns.push({ text: attCount ? `Attachments (${attCount})` : "Add attachment", onPress: () => openAttachmentMenu(item) });

        if (mode === "archived") btns.push({ text: "Restore", onPress: () => restoreItem(item) });
        else btns.push({ text: "Archive", style: "destructive", onPress: () => archiveItem(item) });

        Alert.alert(item.title || "Wallet item", details + attLine, btns, { cancelable: true });
        return;
      }

      // iOS can show more; include all options.
      const iosButtons: any[] = [
        { text: "Close", style: "cancel" },
        item.partnerUrl ? { text: "Open link", onPress: () => openItemLink(item) } : undefined,
        { text: "Add attachment", onPress: () => addAttachment(item) },
        attCount ? { text: `Manage attachments (${attCount})`, onPress: () => openAttachmentMenu(item) } : undefined,
        mode === "archived"
          ? { text: "Restore", onPress: () => restoreItem(item) }
          : { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ].filter(Boolean);

      Alert.alert(item.title || "Wallet item", details + attLine, iosButtons, { cancelable: true });
    };

    showCoreMenu();
  }

  return (
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>Your confirmed bookings and stored essentials</Text>
          </View>

          <GlassCard style={styles.toggleCard} strength="subtle">
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setMode("booked")}
                style={[styles.toggleBtn, mode === "booked" && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, mode === "booked" && styles.toggleTextActive]}>
                  Booked ({counts.booked})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode("archived")}
                style={[styles.toggleBtn, mode === "archived" && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, mode === "archived" && styles.toggleTextActive]}>
                  Archived ({counts.archived})
                </Text>
              </Pressable>
            </View>
          </GlassCard>

          {loading && (
            <GlassCard style={styles.card}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading wallet…</Text>
              </View>
            </GlassCard>
          )}

          {!loading && visible.length === 0 && (
            <GlassCard style={styles.card}>
              <EmptyState
                title={mode === "archived" ? "No archived items" : "Nothing booked yet"}
                message={
                  mode === "archived"
                    ? "When you archive items, they’ll show up here."
                    : "When you confirm bookings in a trip, they appear here. Add a PDF or screenshot to store proof offline."
                }
              />
            </GlassCard>
          )}

          {!loading && visible.length > 0 && (
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
                          const attCount = getAttachments(it).length;

                          return (
                            <Pressable key={it.id} onPress={() => openActions(it)} style={styles.itemRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle} numberOfLines={1}>
                                  {it.title}
                                </Text>

                                <Text style={styles.itemMeta} numberOfLines={1}>
                                  {buildMeta(it)}
                                  {attCount ? ` • ${attCount} attachment${attCount === 1 ? "" : "s"}` : ""}
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

  toggleCard: { padding: 10 },

  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
  },

  toggleBtnActive: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,255,136,0.10)",
  },

  toggleText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
  },

  toggleTextActive: {
    color: theme.colors.text,
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
