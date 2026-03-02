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
  TextInput,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function shortKeyName(key: string) {
  const parts = String(key || "").split("/").filter(Boolean);
  return parts[parts.length - 1] || key;
}

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
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function extractCategoryFromKey(key: string): CategoryId {
  // wallet/{userId}/{tripId}/{category}/...
  const parts = String(key || "").split("/").filter(Boolean);
  const raw = cleanString(parts[3] || "").toLowerCase();

  // tolerate aliases (future-proof)
  if (raw === "transfer") return "transfers";
  if (raw === "stay" || raw === "stays") return "hotel";

  const found = CATEGORIES.find((c) => c.id === raw);
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

function defer(fn: () => void) {
  setTimeout(fn, 50);
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState<string>("");
  const [tripId] = useState<string>("general"); // wire real trip ids later
  const [category, setCategory] = useState<CategoryId>("all");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<WalletDoc[]>([]);

  const [query, setQuery] = useState("");

  const prefix = useMemo(() => {
    const uid = userId || "anon";
    if (category === "all") return walletPrefixForTrip({ userId: uid, tripId });
    return walletPrefixForTrip({ userId: uid, tripId, category });
  }, [userId, tripId, category]);

  const loadUser = useCallback(async () => {
    const uid = await identity.getWalletUserId();
    setUserId(cleanString(uid));
  }, []);

  const loadDocs = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const res = await walletList({ prefix, limit: 250 });

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
    if (!userId) return;
    loadDocs().catch(() => null);
  }, [userId, loadDocs]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      loadDocs().catch(() => null);
    }, [userId, loadDocs])
  );

  /* ------------------------------ derived ------------------------------ */

  const countsByCategory = useMemo(() => {
    const base: Record<CategoryId, number> = {
      all: docs.length,
      tickets: 0,
      hotel: 0,
      flight: 0,
      insurance: 0,
      transfers: 0,
      misc: 0,
    };

    for (const d of docs) {
      const cat = extractCategoryFromKey(d.key);
      base[cat] = (base[cat] || 0) + 1;
    }

    base.all = docs.length;
    return base;
  }, [docs]);

  const visibleDocs = useMemo(() => {
    const q = cleanString(query).toLowerCase();
    if (!q) return docs;

    return docs.filter((d) => {
      const name = shortKeyName(d.key).toLowerCase();
      const cat = extractCategoryFromKey(d.key);
      return name.includes(q) || cat.includes(q);
    });
  }, [docs, query]);

  const totalSizeBytes = useMemo(() => {
    return docs.reduce((sum, d) => sum + (Number(d.size) || 0), 0);
  }, [docs]);

  const headerSubtitle = "Offline-friendly storage for confirmations, PDFs, and screenshots.";

  /* ------------------------------ upload ------------------------------ */

  async function pickAsset(kind: UploadKind): Promise<{ uri: string; name: string; mimeType: string } | null> {
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
      { text: "Take photo", onPress: () => pickAndUpload("camera").catch(() => null) },
      { text: "Choose photo", onPress: () => pickAndUpload("photo").catch(() => null) },
      { text: "Choose document", onPress: () => pickAndUpload("document").catch(() => null) },
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

  /* ------------------------------ actions ------------------------------ */

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

  /* ------------------------------ UI bits ------------------------------ */

  function Chip({ id, label }: { id: CategoryId; label: string }) {
    const active = id === category;
    const count = countsByCategory[id] ?? 0;

    return (
      <Pressable
        onPress={() => {
          setCategory(id);
          defer(() => loadDocs().catch(() => null)); // refresh because prefix changes
        }}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        <View style={[styles.chipCount, active && styles.chipCountActive]}>
          <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
        </View>
      </Pressable>
    );
  }

  function DocRow({ d }: { d: WalletDoc }) {
    const filename = shortKeyName(d.key);
    const cat = extractCategoryFromKey(d.key);
    const date = formatDate(d.uploaded);
    const size = formatSize(d.size);

    return (
      <GlassCard style={styles.docCard}>
        <Pressable
          onPress={() => viewDoc(d.key)}
          style={({ pressed }) => [styles.docRow, pressed && { opacity: 0.92 }]}
          android_ripple={{ color: "rgba(255,255,255,0.05)" }}
        >
          <View style={styles.docIconWrap}>
            <Text style={styles.docIcon}>{iconForCategory(cat)}</Text>
          </View>

          <View style={styles.docMain}>
            <Text style={styles.docTitle} numberOfLines={1}>
              {filename}
            </Text>

            <Text style={styles.docMeta} numberOfLines={1}>
              {`${CATEGORIES.find((c) => c.id === cat)?.label ?? "Misc"} • ${size}${
                date ? ` • ${date}` : ""
              }`}
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
        </Pressable>
      </GlassCard>
    );
  }

  /* -------------------------------- render -------------------------------- */

  return (
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.80}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO */}
          <GlassCard style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>WALLET</Text>
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

            <View style={styles.metricsRow}>
              <Metric label="Docs" value={String(docs.length)} />
              <Metric label="Storage" value={formatSize(totalSizeBytes)} />
              <Metric label="Trip" value={tripId === "general" ? "General" : tripId} />
            </View>

            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search documents…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {query ? (
                <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
          </GlassCard>

          {/* CHIPS */}
          <View style={styles.chipsRow}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} id={c.id} label={c.label} />
            ))}
          </View>

          {/* BODY */}
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
          ) : visibleDocs.length === 0 ? (
            <GlassCard style={styles.stateCard}>
              <EmptyState
                title={docs.length === 0 ? "No documents yet" : "Nothing matches your search"}
                message={
                  docs.length === 0
                    ? "Upload confirmations, tickets, receipts, or anything you want kept safe."
                    : "Try a different search term, or clear the filter."
                }
              />
              <View style={{ height: 10 }} />
              <Pressable style={styles.primaryCta} onPress={chooseUploadSource}>
                <Text style={styles.primaryCtaText}>Upload</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <View style={{ gap: 10 }}>
              {visibleDocs.map((d) => (
                <DocRow key={d.key} d={d} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------- UI atoms -------------------------------- */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricVal} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricKey}>{label}</Text>
    </View>
  );
}

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  hero: { padding: theme.spacing.lg, borderRadius: 24 },

  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  kicker: { color: theme.colors.primary, fontWeight: theme.fontWeight.black, fontSize: 11, letterSpacing: 1.2 },

  h1: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.3,
  },
  h2: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  uploadBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  metricsRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  metricVal: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 14 },
  metricKey: { marginTop: 3, color: theme.colors.textTertiary, fontWeight: theme.fontWeight.black, fontSize: 11 },

  searchRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clearBtnText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

  chipCount: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  chipCountActive: {
    backgroundColor: "rgba(0,0,0,0.22)",
    borderColor: "rgba(255,255,255,0.16)",
  },
  chipCountText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11 },
  chipCountTextActive: { color: theme.colors.text, fontWeight: "900" },

  stateCard: { padding: theme.spacing.lg, borderRadius: 24 },

  center: { paddingVertical: 10, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },

  primaryCta: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.26)",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryCtaText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  docCard: { padding: 0, borderRadius: 18 },

  docRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },

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
