import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as DocumentPicker from "expo-document-picker";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import walletStore, { WalletTicket } from "@/src/state/walletStore";
import storage from "@/src/services/storage";

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

export default function WalletScreen() {
  // tickets (existing)
  const [pending, setPending] = useState<WalletTicket[]>([]);
  const [booked, setBooked] = useState<WalletTicket[]>([]);

  // R2 docs (new)
  const [userId, setUserId] = useState<string>("anon");
  const [tripId] = useState<string>("general"); // wire real trip ids later
  const [category, setCategory] = useState<CategoryId>("all");

  const [docsLoading, setDocsLoading] = useState(false);
  const [docsUploading, setDocsUploading] = useState(false);
  const [docs, setDocs] = useState<WalletDoc[]>([]);

  const docsPrefix = useMemo(() => {
    if (category === "all") {
      return walletPrefixForTrip({ userId, tripId });
    }
    return walletPrefixForTrip({ userId, tripId, category });
  }, [userId, tripId, category]);

  const loadTickets = useCallback(async () => {
    const p = await walletStore.getPendingTickets();
    const b = await walletStore.getBookedTickets();
    setPending(p);
    setBooked(b);
  }, []);

  const loadUser = useCallback(async () => {
    // Keep it simple: if you already store a user id somewhere else, change THIS ONE LINE.
    const stored = await storage.getString("userId");
    setUserId((stored || "anon").trim() || "anon");
  }, []);

  const loadDocs = useCallback(async () => {
    try {
      setDocsLoading(true);
      const res = await walletList({ prefix: docsPrefix, limit: 200 });
      const items = (res.items || []).map((i) => ({
        key: i.key,
        size: i.size,
        uploaded: i.uploaded,
      }));
      // newest first (best-effort)
      items.sort((a, b) => (b.uploaded || "").localeCompare(a.uploaded || ""));
      setDocs(items);
    } catch (e: any) {
      setDocs([]);
      Alert.alert("Wallet", e?.message || "Failed to load wallet documents.");
    } finally {
      setDocsLoading(false);
    }
  }, [docsPrefix]);

  useEffect(() => {
    loadTickets();
    loadUser();
  }, [loadTickets, loadUser]);

  useEffect(() => {
    // once user is known OR category changes
    loadDocs();
  }, [loadDocs]);

  function open(url?: string | null) {
    if (!url) return;
    Linking.openURL(url);
  }

  async function pickAndUpload() {
    try {
      setDocsUploading(true);

      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
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
      Alert.alert("Uploaded", "Saved to Wallet.");
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message || "Could not upload.");
    } finally {
      setDocsUploading(false);
    }
  }

  async function viewDoc(key: string) {
    try {
      await walletOpenOrShare({ key });
    } catch (e: any) {
      Alert.alert("Open failed", e?.message || "Could not open file.");
    }
  }

  async function deleteDoc(key: string) {
    Alert.alert("Delete file?", "This will permanently remove it from your Wallet.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await walletDelete({ key });
            await loadDocs();
          } catch (e: any) {
            Alert.alert("Delete failed", e?.message || "Could not delete file.");
          }
        },
      },
    ]);
  }

  function TicketCard({ t }: { t: WalletTicket }) {
    return (
      <GlassCard style={styles.card}>
        <Text style={styles.title}>{t.title}</Text>

        <Text style={styles.meta}>
          {t.home} vs {t.away}
        </Text>

        {t.kickoffIso ? <Text style={styles.meta}>{new Date(t.kickoffIso).toLocaleString()}</Text> : null}

        <Text style={styles.provider}>{t.provider ?? "provider"}</Text>

        <View style={styles.row}>
          {t.url ? (
            <Pressable style={styles.btn} onPress={() => open(t.url)}>
              <Text style={styles.btnText}>Open</Text>
            </Pressable>
          ) : (
            <View />
          )}

          {t.status === "pending" ? (
            <View style={styles.pending}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          ) : (
            <View style={styles.booked}>
              <Text style={styles.bookedText}>Booked</Text>
            </View>
          )}
        </View>
      </GlassCard>
    );
  }

  function DocCard({ d }: { d: WalletDoc }) {
    const filename = d.key.split("/").pop() || d.key;
    const sizeKb = Math.max(1, Math.round((d.size || 0) / 1024));
    const uploaded = d.uploaded ? new Date(d.uploaded).toLocaleString() : null;

    return (
      <GlassCard style={styles.card}>
        <Text style={styles.title} numberOfLines={1}>
          {filename}
        </Text>

        <Text style={styles.meta}>
          {sizeKb} KB{uploaded ? ` • ${uploaded}` : ""}
        </Text>

        <Text style={styles.metaSmall} numberOfLines={1}>
          {d.key}
        </Text>

        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={() => viewDoc(d.key)}>
            <Text style={styles.btnText}>View</Text>
          </Pressable>

          <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => deleteDoc(d.key)}>
            <Text style={styles.btnText}>Delete</Text>
          </Pressable>
        </View>
      </GlassCard>
    );
  }

  return (
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.9}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
            paddingBottom: 110,
          }}
        >
          {/* Tickets */}
          <Text style={styles.section}>Pending tickets</Text>
          {pending.length === 0 ? (
            <Text style={styles.empty}>No pending tickets</Text>
          ) : (
            pending.map((t) => <TicketCard key={t.id} t={t} />)
          )}

          <Text style={styles.section}>Booked tickets</Text>
          {booked.length === 0 ? (
            <Text style={styles.empty}>No booked tickets</Text>
          ) : (
            booked.map((t) => <TicketCard key={t.id} t={t} />)
          )}

          {/* Wallet docs (R2) */}
          <View style={styles.docsHeader}>
            <Text style={styles.section}>Wallet documents</Text>

            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={pickAndUpload} disabled={docsUploading}>
              {docsUploading ? <ActivityIndicator /> : <Text style={styles.btnText}>Upload</Text>}
            </Pressable>
          </View>

          <Text style={styles.subtle}>
            User: <Text style={styles.subtleStrong}>{userId}</Text> • Trip:{" "}
            <Text style={styles.subtleStrong}>{tripId}</Text>
          </Text>

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

          {docsLoading ? (
            <Text style={styles.empty}>Loading documents…</Text>
          ) : docs.length === 0 ? (
            <Text style={styles.empty}>No documents yet. Upload your first receipt/confirmation.</Text>
          ) : (
            docs.map((d) => <DocCard key={d.key} d={d} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  section: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  empty: {
    color: theme.colors.textSecondary,
  },
  card: {
    gap: 6,
  },
  title: {
    color: theme.colors.text,
    fontWeight: "900",
  },
  meta: {
    color: theme.colors.textSecondary,
  },
  metaSmall: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  provider: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 10,
  },
  btn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  btnPrimary: {
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  btnDanger: {
    borderColor: "rgba(255,80,80,0.35)",
    backgroundColor: "rgba(255,80,80,0.08)",
  },
  pending: {
    backgroundColor: "rgba(255,200,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "center",
  },
  pendingText: {
    color: "#FFD54A",
    fontWeight: "900",
  },
  booked: {
    backgroundColor: "rgba(0,255,136,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "center",
  },
  bookedText: {
    color: "#00FF88",
    fontWeight: "900",
  },
  docsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  subtle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  subtleStrong: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.25)",
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },
  chipTextActive: {
    color: theme.colors.text,
  },
});
