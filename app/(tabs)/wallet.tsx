// app/(tabs)/wallet.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import * as DocumentPicker from "expo-document-picker";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import walletStore, { type WalletTicket } from "@/src/state/walletStore";
import identity from "@/src/services/identity";

import {
  walletList,
  walletUpload,
  walletOpenOrShare,
  walletDelete,
  walletPrefixForTrip,
} from "@/src/services/walletApi";

type WalletDoc = {
  key: string;
  size: number;
  uploaded?: string;
};

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tickets", label: "Tickets" },
  { id: "hotel", label: "Hotel" },
  { id: "flight", label: "Flight" },
  { id: "insurance", label: "Insurance" },
  { id: "transfers", label: "Transfers" },
  { id: "misc", label: "Misc" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

/**
 * Wallet principles:
 * - Calm, TUI-like: one primary Upload entrypoint, simple category tabs, clean list.
 * - No debug IDs, no raw storage paths shown to users.
 * - Delete must be obvious + reliable with optimistic UI.
 * - Tickets section is compact (not the main event of Wallet).
 */
export default function WalletScreen() {
  // Tickets (from saved items)
  const [pending, setPending] = useState<WalletTicket[]>([]);
  const [booked, setBooked] = useState<WalletTicket[]>([]);

  // R2 / remote docs
  const [userId, setUserId] = useState<string>("");
  const [tripId] = useState<string>("general"); // phase-1 default; wire real trip later
  const [category, setCategory] = useState<CategoryId>("all");

  const [docsLoading, setDocsLoading] = useState(false);
  const [docsUploading, setDocsUploading] = useState(false);
  const [docs, setDocs] = useState<WalletDoc[]>([]);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const docsPrefix = useMemo(() => {
    if (!userId) return walletPrefixForTrip({ userId: "anon", tripId });
    if (category === "all") return walletPrefixForTrip({ userId, tripId });
    return walletPrefixForTrip({ userId, tripId, category });
  }, [userId, tripId, category]);

  const loadTickets = useCallback(async () => {
    const p = await walletStore.getPendingTickets();
    const b = await walletStore.getBookedTickets();
    setPending(p);
    setBooked(b);
  }, []);

  const loadUser = useCallback(async () => {
    const uid = await identity.getWalletUserId();
    setUserId(uid);
  }, []);

  const loadDocs = useCallback(async () => {
    if (!userId) return;
    try {
      setDocsLoading(true);
      const res = await walletList({ prefix: docsPrefix, limit: 200 });
      const items = (res.items || []).map((i) => ({
        key: i.key,
        size: i.size,
        uploaded: i.uploaded,
      }));

      // newest first (best effort)
      items.sort((a, b) => (b.uploaded || "").localeCompare(a.uploaded || ""));
      setDocs(items);
    } catch (e: any) {
      setDocs([]);
      Alert.alert("Travel Wallet", e?.message || "Failed to load documents.");
    } finally {
      setDocsLoading(false);
    }
  }, [docsPrefix, userId]);

  // boot
  useEffect(() => {
    loadUser().catch(() => null);
    loadTickets().catch(() => null);
  }, [loadUser, loadTickets]);

  useEffect(() => {
    loadDocs().catch(() => null);
  }, [loadDocs]);

  useFocusEffect(
    useCallback(() => {
      loadTickets().catch(() => null);
      loadDocs().catch(() => null);
    }, [loadTickets, loadDocs])
  );

  const ticketsCount = pending.length + booked.length;

  const prettyName = (key: string) => {
    const last = decodeURIComponent(key.split("/").pop() || key);
    // Trim leading timestamps if you prefix uploads like "1700000000-filename.pdf"
    const cleaned = last.replace(/^\d{10,16}[-_]/, "");
    return cleaned || last;
  };

  const prettyMeta = (d: WalletDoc) => {
    const sizeKb = Math.max(1, Math.round((d.size || 0) / 1024));
    const uploaded = d.uploaded ? new Date(d.uploaded).toLocaleDateString() : null;
    return uploaded ? `${sizeKb} KB • ${uploaded}` : `${sizeKb} KB`;
  };

  async function pickAndUploadDocument() {
    if (!userId) {
      Alert.alert("Travel Wallet", "Identity isn’t ready yet. Try again in a moment.");
      return;
    }

    try {
      setDocsUploading(true);

      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: "*/*",
      });

      if (picked.canceled) return;

      const file = picked.assets?.[0];
      if (!file?.uri) {
        Alert.alert("Upload", "No file selected.");
        return;
      }

      const filename = file.name || "upload";
      const mimeType = file.mimeType || "application/octet-stream";
      const uploadCategory = category === "all" ? "misc" : category;

      await walletUpload({
        fileUri: file.uri,
        filename,
        mimeType,
        userId,
        tripId,
        category: uploadCategory,
      });

      await loadDocs();
      Alert.alert("Saved", "Added to your Travel Wallet.");
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message || "Could not upload.");
    } finally {
      setDocsUploading(false);
      setUploadSheetOpen(false);
    }
  }

  async function viewDoc(key: string) {
    try {
      await walletOpenOrShare({ key });
    } catch (e: any) {
      Alert.alert("Open failed", e?.message || "Could not open file.");
    }
  }

  function confirmDeleteDoc(key: string) {
    Alert.alert("Delete document?", "This will permanently remove it from your Travel Wallet.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Optimistic UI removal (feels instant)
          const prev = docs;
          setDeletingKey(key);
          setDocs((cur) => cur.filter((d) => d.key !== key));

          try {
            await walletDelete({ key });
            // hard refresh to stay truthful
            await loadDocs();
          } catch (e: any) {
            // revert
            setDocs(prev);
            Alert.alert("Delete failed", e?.message || "Could not delete file.");
          } finally {
            setDeletingKey(null);
          }
        },
      },
    ]);
  }

  const UploadSheet = () => (
    <Modal
      visible={uploadSheetOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setUploadSheetOpen(false)}
    >
      <Pressable style={styles.sheetBackdrop} onPress={() => setUploadSheetOpen(false)} />
      <View style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Upload</Text>
          <Text style={styles.sheetSub}>Add a confirmation, ticket, or document.</Text>

          {/* TUI-like options (Phase 1: document picker only; camera later) */}
          <Pressable
            style={[styles.sheetBtn, docsUploading && { opacity: 0.6 }]}
            disabled={docsUploading}
            onPress={pickAndUploadDocument}
          >
            {docsUploading ? <ActivityIndicator /> : <Text style={styles.sheetBtnText}>Document</Text>}
          </Pressable>

          <Pressable
            style={[styles.sheetBtn, styles.sheetBtnSecondary]}
            onPress={() => {
              Alert.alert(
                "Coming next",
                "Camera + photo library upload will be added next. For now, upload via Document."
              );
            }}
          >
            <Text style={styles.sheetBtnText}>Take photo</Text>
          </Pressable>

          <Pressable
            style={[styles.sheetBtn, styles.sheetBtnSecondary]}
            onPress={() => {
              Alert.alert(
                "Coming next",
                "Photo library upload will be added next. For now, upload via Document."
              );
            }}
          >
            <Text style={styles.sheetBtnText}>Choose photo</Text>
          </Pressable>

          <Pressable style={[styles.sheetBtn, styles.sheetBtnSecondary]} onPress={() => setUploadSheetOpen(false)}>
            <Text style={styles.sheetBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  const TicketStrip = () => {
    if (ticketsCount === 0) return null;

    return (
      <GlassCard style={styles.ticketStrip}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.ticketTitle}>Tickets</Text>
          <Text style={styles.ticketMeta}>
            Pending {pending.length} • Booked {booked.length}
          </Text>
        </View>

        {/* Keep it simple: tickets open their provider url if present */}
        <Pressable
          style={[styles.pillBtn, { minWidth: 96 }]}
          onPress={() => {
            // Basic behaviour: if you want, later route into dedicated tickets list
            Alert.alert(
              "Tickets",
              "Tickets are currently saved as links (provider URLs) inside trips. A dedicated ticket list can be added next."
            );
          }}
        >
          <Text style={styles.pillBtnText}>Manage</Text>
        </Pressable>
      </GlassCard>
    );
  };

  return (
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.7}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <UploadSheet />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>Travel Wallet</Text>
              <Text style={styles.h2}>Store confirmations and documents in one place.</Text>
            </View>

            <Pressable
              style={[styles.uploadBtn, (!userId || docsUploading) && { opacity: 0.6 }]}
              disabled={!userId || docsUploading}
              onPress={() => setUploadSheetOpen(true)}
            >
              {docsUploading ? <ActivityIndicator /> : <Text style={styles.uploadBtnText}>Upload</Text>}
            </Pressable>
          </View>

          {/* Compact tickets strip (not spammy sections) */}
          <TicketStrip />

          {/* Category tabs */}
          <View style={styles.chipsRow}>
            {CATEGORIES.map((c) => {
              const active = c.id === category;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* List */}
          {!userId ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Preparing Wallet…</Text>
              <Text style={styles.emptyText}>Setting up your secure storage.</Text>
            </GlassCard>
          ) : docsLoading ? (
            <GlassCard style={styles.emptyCard}>
              <ActivityIndicator />
              <Text style={styles.emptyText}>Loading documents…</Text>
            </GlassCard>
          ) : docs.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptyText}>Upload your first booking confirmation, ticket, or receipt.</Text>

              <Pressable style={[styles.uploadBtnWide]} onPress={() => setUploadSheetOpen(true)}>
                <Text style={styles.uploadBtnText}>Upload</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <View style={{ gap: 10 }}>
              {docs.map((d) => (
                <GlassCard key={d.key} style={styles.docRow}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.docTitle} numberOfLines={2}>
                      {prettyName(d.key)}
                    </Text>
                    <Text style={styles.docMeta}>{prettyMeta(d)}</Text>
                  </View>

                  <View style={styles.docActions}>
                    <Pressable style={styles.pillBtn} onPress={() => viewDoc(d.key)}>
                      <Text style={styles.pillBtnText}>View</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.pillBtn, styles.pillDanger, deletingKey === d.key && { opacity: 0.6 }]}
                      disabled={deletingKey === d.key}
                      onPress={() => confirmDeleteDoc(d.key)}
                    >
                      <Text style={styles.pillBtnText}>{deletingKey === d.key ? "…" : "Delete"}</Text>
                    </Pressable>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}

          <View style={{ height: 18 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
    gap: theme.spacing.lg,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  h1: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  h2: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },

  uploadBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnWide: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnText: { color: theme.colors.text, fontWeight: "900" },

  ticketStrip: {
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ticketTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
  ticketMeta: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  chipActive: { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.22)" },
  chipText: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },
  chipTextActive: { color: theme.colors.text },

  emptyCard: { padding: theme.spacing.lg, alignItems: "center", gap: 10 },
  emptyTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16, textAlign: "center" },
  emptyText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, textAlign: "center" },

  docRow: {
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  docTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
  docMeta: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  docActions: { flexDirection: "column", gap: 8, alignItems: "stretch" },
  pillBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  pillDanger: {
    borderColor: "rgba(255,80,80,0.30)",
    backgroundColor: "rgba(255,80,80,0.08)",
  },
  pillBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  // Upload sheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    backgroundColor: "rgba(18,18,18,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 10,
  },
  sheetTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  sheetSub: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, marginBottom: 6 },
  sheetBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnSecondary: {
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  sheetBtnText: { color: theme.colors.text, fontWeight: "900" },
});
