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
import { getPartner, isPartnerId } from "@/src/core/partners";

import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";
import {
  pickAndStoreAttachmentForItem,
  openAttachment,
  deleteAttachmentFile,
} from "@/src/services/walletAttachments";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */

type WalletMode = "booked" | "saved" | "archived";

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

function getAttachments(item: SavedItem) {
  return Array.isArray(item.attachments) ? item.attachments : [];
}

function attachmentLabel(att: WalletAttachment) {
  const kind = att.kind === "pdf" ? "PDF" : att.kind === "image" ? "Image" : "File";
  const name = String(att.name ?? "").trim();
  return name ? `${kind}: ${name}` : `${kind} attachment`;
}

function defer(fn: () => void) {
  setTimeout(fn, 60);
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

  // Attachment manager UI state (single item at a time)
  const [manageItemId, setManageItemId] = useState<string | null>(null);

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
        : mode === "saved"
        ? items.filter((i) => i.status === "saved")
        : items.filter((i) => i.status === "booked");

    // Hide ghost items if cascade deletion ever failed.
    return base.filter((i) => validTripIds.has(String(i.tripId)));
  }, [items, mode, validTripIds]);

  const grouped = useMemo(() => groupByTrip(visible), [visible]);

  const counts = useMemo(() => {
    let booked = 0;
    let saved = 0;
    let archived = 0;
    for (const it of items) {
      if (!validTripIds.has(String(it.tripId))) continue;
      if (it.status === "booked") booked++;
      if (it.status === "saved") saved++;
      if (it.status === "archived") archived++;
    }
    return { booked, saved, archived };
  }, [items, validTripIds]);

  const managingItem = useMemo(() => {
    if (!manageItemId) return null;
    return items.find((x) => x.id === manageItemId) ?? null;
  }, [manageItemId, items]);

  const managingAttachments = useMemo(() => {
    return managingItem ? getAttachments(managingItem) : [];
  }, [managingItem]);

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

  /**
   * IMPORTANT UX FIX:
   * - If item is saved/pending and has a valid partnerId+url, opening it should be TRACKED
   *   so we can re-prompt on return (user may now have booked).
   * - If item is booked/archived, open UNTRACKED (no prompt needed).
   */
  const openItemLink = useCallback(async (item: SavedItem) => {
    if (!item.partnerUrl) {
      Alert.alert(item.title || "Item", getItemDetailsText(item));
      return;
    }

    const canPrompt =
      (item.status === "saved" || item.status === "pending") &&
      typeof item.partnerId === "string" &&
      isPartnerId(item.partnerId);

    if (canPrompt) {
      try {
        await beginPartnerClick({
          tripId: String(item.tripId),
          partnerId: item.partnerId as any,
          url: item.partnerUrl,
          savedItemType: item.type,
          title: item.title,
          metadata: item.metadata,
        });
        return;
      } catch {
        // fall through to untracked open
      }
    }

    try {
      await openUntrackedUrl(item.partnerUrl);
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

  const markBookedFromWallet = useCallback(async (item: SavedItem) => {
    try {
      await savedItemsStore.transitionStatus(item.id, "booked");

      // Keep UX consistent everywhere: confirm + offer proof upload
      defer(() => {
        confirmBookedAndOfferProof(item.id).catch(() => null);
      });
    } catch {
      Alert.alert("Couldn’t mark booked", "Try again.");
    }
  }, []);

  const openCoreActions = useCallback(
    (item: SavedItem) => {
      const details = getItemDetailsText(item);
      const attCount = getAttachments(item).length;
      const attLine = attCount ? `\n\nAttachments: ${attCount}` : `\n\nAttachments: none`;

      const actions: any[] = [];
      actions.push({ text: "Close", style: "cancel" });

      if (item.partnerUrl) {
        actions.push({ text: "Open link", onPress: () => openItemLink(item) });
      }

      actions.push({
        text: attCount ? `Manage attachments (${attCount})` : "Add attachment",
        onPress: () => {
          if (attCount) setManageItemId(item.id);
          else addAttachment(item);
        },
      });

      // Only show "Mark booked" if not archived
      if (mode !== "archived") {
        actions.push({ text: "Mark booked", onPress: () => markBookedFromWallet(item) });
      }

      if (mode === "archived") {
        actions.push({ text: "Restore", onPress: () => restoreItem(item) });
      } else {
        actions.push({ text: "Archive", style: "destructive", onPress: () => archiveItem(item) });
      }

      // Android reliability: keep <= 3 buttons
      const maxButtons = Platform.OS === "android" ? 3 : 5;

      Alert.alert(item.title || "Wallet item", details + attLine, actions.slice(0, maxButtons), {
        cancelable: true,
      });
    },
    [mode, openItemLink, addAttachment, archiveItem, restoreItem, markBookedFromWallet]
  );

  const openAttachmentRow = useCallback(async (att: WalletAttachment) => {
    try {
      await openAttachment(att);
    } catch (e: any) {
      Alert.alert("Couldn’t open", String(e?.message ?? "Your device could not open that attachment."));
    }
  }, []);

  const deleteAttachmentRow = useCallback(async (item: SavedItem, att: WalletAttachment) => {
    Alert.alert("Delete attachment?", "This removes the stored file from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await savedItemsStore.removeAttachment(item.id, att.id);
            await deleteAttachmentFile(att);
          } catch {
            Alert.alert("Couldn’t delete", "Try again.");
          }
        },
      },
    ]);
  }, []);

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
            <Text style={styles.subtitle}>Your bookings, saved links, and stored proof</Text>
          </View>

          {/* Attachment manager (reliable; avoids nested alerts) */}
          {managingItem && (
            <GlassCard style={styles.managerCard} strength="subtle">
              <View style={styles.managerHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.managerTitle} numberOfLines={1}>
                    Attachments
                  </Text>
                  <Text style={styles.managerSub} numberOfLines={1}>
                    {managingItem.title || "Item"} • {managingAttachments.length} file
                    {managingAttachments.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <Pressable onPress={() => setManageItemId(null)} style={styles.managerClose}>
                  <Text style={styles.managerCloseText}>Close</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10 }}>
                <Pressable onPress={() => addAttachment(managingItem)} style={styles.managerAddBtn}>
                  <Text style={styles.managerAddText}>Add attachment</Text>
                </Pressable>

                {managingAttachments.length === 0 ? (
                  <View style={{ paddingVertical: 6 }}>
                    <Text style={styles.muted}>No attachments yet.</Text>
                  </View>
                ) : (
                  managingAttachments.map((a) => (
                    <View key={a.id} style={styles.attRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attTitle} numberOfLines={1}>
                          {attachmentLabel(a)}
                        </Text>
                        <Text style={styles.attMeta} numberOfLines={1}>
                          Stored offline
                        </Text>
                      </View>

                      <Pressable onPress={() => openAttachmentRow(a)} style={styles.attBtn}>
                        <Text style={styles.attBtnText}>Open</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => deleteAttachmentRow(managingItem, a)}
                        style={[styles.attBtn, styles.attBtnDanger]}
                      >
                        <Text style={styles.attBtnText}>Delete</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </GlassCard>
          )}

          {/* Mode toggle */}
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
                onPress={() => setMode("saved")}
                style={[styles.toggleBtn, mode === "saved" && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, mode === "saved" && styles.toggleTextActive]}>
                  Saved ({counts.saved})
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
                title={
                  mode === "archived"
                    ? "No archived items"
                    : mode === "saved"
                    ? "No saved items"
                    : "Nothing booked yet"
                }
                message={
                  mode === "archived"
                    ? "When you archive items, they’ll show up here."
                    : mode === "saved"
                    ? "Saved items are links you kept without confirming a booking yet."
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
                            <Pressable
                              key={it.id}
                              onPress={() => openCoreActions(it)}
                              style={styles.itemRow}
                            >
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

                              {attCount ? (
                                <Pressable onPress={() => setManageItemId(it.id)} style={styles.managePill}>
                                  <Text style={styles.managePillText}>Manage</Text>
                                </Pressable>
                              ) : null}

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

  managerCard: { padding: theme.spacing.lg },
  managerHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  managerTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  managerSub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  managerClose: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  managerCloseText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  managerAddBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
  },
  managerAddText: { color: theme.colors.text, fontWeight: "900" },

  attRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  attTitle: { color: theme.colors.text, fontWeight: "900" },
  attMeta: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  attBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  attBtnDanger: { borderColor: "rgba(255,80,80,0.35)" },
  attBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  toggleCard: { padding: 10 },
  toggleRow: { flexDirection: "row", gap: 10 },

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

  toggleTextActive: { color: theme.colors.text },

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

  managePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },
  managePillText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  chev: { color: theme.colors.textSecondary, fontSize: 24, marginTop: -2 },
});
