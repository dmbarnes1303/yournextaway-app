// app/(tabs)/wallet.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

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
type UploadKind = "camera" | "photo" | "document";

export default function WalletScreen() {
  const [userId, setUserId] = useState<string>("");
  const [tripId] = useState<string>("general"); // wire real trip ids later
  const [category, setCategory] = useState<CategoryId>("all");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<WalletDoc[]>([]);

  const prefix = useMemo(() => {
    if (!userId) return walletPrefixForTrip({ userId: "anon", tripId });
    if (category === "all") return walletPrefixForTrip({ userId, tripId });
    return walletPrefixForTrip({ userId, tripId, category });
  }, [userId, tripId, category]);

  const loadUser = useCallback(async () => {
    const uid = await identity.getWalletUserId();
    setUserId(uid);
  }, []);

  const loadDocs = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const res = await walletList({ prefix, limit: 200 });
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
      Alert.alert("Travel Wallet", e?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [prefix, userId]);

  useEffect(() => {
    loadUser().catch(() => null);
  }, [loadUser]);

  useEffect(() => {
    loadDocs().catch(() => null);
  }, [loadDocs]);

  useFocusEffect(
    useCallback(() => {
      loadDocs().catch(() => null);
    }, [loadDocs])
  );

  function formatSize(bytes: number) {
    const b = Number(bytes || 0);
    if (!Number.isFinite(b) || b <= 0) return "—";
    const kb = b / 1024;
    if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  function formatDate(uploaded?: string) {
    if (!uploaded) return null;
    const d = new Date(uploaded);
    if (Number.isNaN(d.getTime())) return null;
    // Keep it simple + consistent; you can later add a proper formatter util.
    return d.toLocaleDateString();
  }

  function extractCategoryFromKey(key: string): CategoryId {
    // wallet/{userId}/{tripId}/{category}/...
    const parts = String(key || "").split("/").filter(Boolean);
    const cat = parts[3] || "";
    const found = CATEGORIES.find((c) => c.id === cat);
    return (found?.id as CategoryId) || "misc";
  }

  function iconForCategory(cat: CategoryId) {
    switch (cat) {
      case "tickets":
        return "🎟️";
      case "hotel":
        return "🏨";
      case "flight":
        return "✈️";
      case "insurance":
        return "🛡️";
      case "transfers":
        return "🚕";
      case "misc":
      default:
        return "📎";
    }
  }

  async function pickAsset(kind: UploadKind): Promise<{
    uri: string;
    name: string;
    mimeType: string;
  } | null> {
    if (kind === "document") {
      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: "*/*",
      });
      if (picked.canceled) return null;

      const file = picked.assets?.[0];
      if (!file?.uri) return null;

      return {
        uri: file.uri,
        name: file.name || "document",
        mimeType: file.mimeType || "application/octet-stream",
      };
    }

    // Photos (camera or library)
    const needsCamera = kind === "camera";
    if (needsCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required to take a photo.");
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo permission is required to choose a photo.");
        return null;
      }
    }

    const res = needsCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.9,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.9,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

    if (res.canceled) return null;

    const asset = res.assets?.[0];
    if (!asset?.uri) return null;

    const name = asset.fileName || `photo_${Date.now()}.jpg`;
    const mimeType = asset.mimeType || "image/jpeg";

    return { uri: asset.uri, name, mimeType };
  }

  function chooseUploadSource() {
    if (!userId) {
      Alert.alert("Travel Wallet", "Identity is still loading. Try again in a moment.");
      return;
    }

    Alert.alert("Upload to Travel Wallet", "Choose what you want to upload.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Take photo",
        onPress: () => pickAndUpload("camera").catch(() => null),
      },
      {
        text: "Choose photo",
        onPress: () => pickAndUpload("photo").catch(() => null),
      },
      {
        text: "Choose document",
        onPress: () => pickAndUpload("document").catch(() => null),
      },
    ]);
  }

  async function pickAndUpload(kind: UploadKind) {
    if (!userId) return;

    try {
      setUploading(true);

      const asset = await pickAsset(kind);
      if (!asset) return;

      const uploadCategory = category === "all" ? "misc" : category;

      await walletUpload({
        fileUri: asset.uri,
        filename: asset.name,
        mimeType: asset.mimeType,
        userId,
        tripId,
        category: uploadCategory,
      });

      await loadDocs();
      Alert.alert("Uploaded", "Saved to Travel Wallet.");
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message || "Could not upload.");
    } finally {
      setUploading(false);
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
    Alert.alert("Delete document?", "This will permanently remove it from your Travel Wallet.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Optimistic remove (keeps UI snappy even if list refresh is slow)
          const prev = docs;
          setDocs((d) => d.filter((x) => x.key !== key));

          try {
            await walletDelete({ key });
            await loadDocs();
          } catch (e: any) {
            setDocs(prev);
            Alert.alert("Delete failed", e?.message || "Could not delete file.");
          }
        },
      },
    ]);
  }

  function DocRow({ d }: { d: WalletDoc }) {
    const filename = d.key.split("/").pop() || d.key;
    const cat = extractCategoryFromKey(d.key);
    const date = formatDate(d.uploaded);
    const size = formatSize(d.size);

    return (
      <GlassCard style={styles.docCard}>
        <View style={styles.docRow}>
          <View style={styles.docIconWrap}>
            <Text style={styles.docIcon}>{iconForCategory(cat)}</Text>
          </View>

          <View style={styles.docMain}>
            <Text style={styles.docTitle} numberOfLines={1}>
              {filename}
            </Text>
            <Text style={styles.docMeta} numberOfLines={1}>
              {(date ? `${date} • ` : "") + size}
            </Text>
          </View>

          <View style={styles.docActions}>
            <Pressable style={styles.smallBtn} onPress={() => viewDoc(d.key)}>
              <Text style={styles.smallBtnText}>View</Text>
            </Pressable>

            <Pressable style={[styles.smallBtn, styles.smallBtnDanger]} onPress={() => deleteDoc(d.key)}>
              <Text style={styles.smallBtnText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </GlassCard>
    );
  }

  const headerSubtitle = "Store confirmations and documents in one place.";

  return (
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.78}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>Travel Wallet</Text>
              <Text style={styles.h2}>{headerSubtitle}</Text>
            </View>

            <Pressable
              style={[styles.uploadBtn, (uploading || !userId) && { opacity: 0.6 }]}
              onPress={chooseUploadSource}
              disabled={uploading || !userId}
            >
              {uploading ? <ActivityIndicator /> : <Text style={styles.uploadText}>Upload</Text>}
            </Pressable>
          </View>

          {/* Chips */}
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

          {/* Body */}
          {!userId ? (
            <GlassCard style={styles.stateCard}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Preparing wallet…</Text>
              </View>
            </GlassCard>
          ) : loading ? (
            <GlassCard style={styles.stateCard}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading documents…</Text>
              </View>
            </GlassCard>
          ) : docs.length === 0 ? (
            <GlassCard style={styles.stateCard}>
              <EmptyState
                title="No documents yet"
                message="Upload confirmations, tickets, receipts, or anything you want kept safe for the trip."
              />
              <View style={{ height: 10 }} />
              <Pressable style={styles.primaryCta} onPress={chooseUploadSource}>
                <Text style={styles.primaryCtaText}>Upload</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <View style={{ gap: 10 }}>
              {docs.map((d) => (
                <DocRow key={d.key} d={d} />
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
  scroll: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 110,
    gap: theme.spacing.lg,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  h1: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.3,
  },
  h2: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "700",
  },

  uploadBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {
    borderColor: "rgba(255,255,255,0.26)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chipText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  chipTextActive: { color: theme.colors.text },

  stateCard: { padding: theme.spacing.lg },

  center: { paddingVertical: 10, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },

  primaryCta: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryCtaText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  docCard: { padding: 14 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  docIcon: { fontSize: 18 },

  docMain: { flex: 1, minWidth: 0 },
  docTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
  docMeta: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },

  docActions: { flexDirection: "column", gap: 8, alignItems: "stretch" },
  smallBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtnDanger: {
    borderColor: "rgba(255,80,80,0.30)",
    backgroundColor: "rgba(255,80,80,0.10)",
  },
  smallBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
});
