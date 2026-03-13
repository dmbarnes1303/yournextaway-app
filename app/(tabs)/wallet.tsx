// app/(tabs)/wallet.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import Background from "@/src/components/Background";
import EmptyState from "@/src/components/EmptyState";
import GlassCard from "@/src/components/GlassCard";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import identity from "@/src/services/identity";
import {
  walletDelete,
  walletList,
  walletOpenOrShare,
  walletUpload,
} from "@/src/services/walletApi";
import walletStore, {
  type WalletBooking,
  type WalletSummary,
  type WalletTripGroup,
} from "@/src/state/walletStore";
import savedItemsStore from "@/src/state/savedItems";
import { getSavedItemTypeLabel, type SavedItemType } from "@/src/core/savedItemTypes";
import { attachTicketProof } from "@/src/services/ticketAttachment";

type WalletDoc = {
  key: string;
  size: number;
  uploaded?: string;
};

type CategoryFilter = "all" | SavedItemType;
type UploadKind = "camera" | "photo" | "document";

const CATEGORY_FILTERS: Array<{ id: CategoryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "tickets", label: "Tickets" },
  { id: "hotel", label: "Hotels" },
  { id: "flight", label: "Flights" },
  { id: "train", label: "Rail / bus" },
  { id: "transfer", label: "Transfers" },
  { id: "things", label: "Experiences" },
  { id: "insurance", label: "Insurance" },
  { id: "claim", label: "Claims" },
  { id: "note", label: "Notes" },
  { id: "other", label: "Other" },
];

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
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatKickoff(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function iconForType(type: SavedItemType) {
  switch (type) {
    case "tickets":
      return "🎟️";
    case "hotel":
      return "🏨";
    case "flight":
      return "✈️";
    case "train":
      return "🚆";
    case "transfer":
      return "🚕";
    case "things":
      return "✨";
    case "insurance":
      return "🛡️";
    case "claim":
      return "💷";
    case "note":
      return "📝";
    case "other":
    default:
      return "📎";
  }
}

function statusLabel(status: WalletBooking["status"]) {
  switch (status) {
    case "booked":
      return "Booked";
    case "pending":
      return "Opened / not confirmed";
    case "saved":
      return "Saved shortlist";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

function defer(fn: () => void) {
  setTimeout(fn, 50);
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [groups, setGroups] = useState<WalletTripGroup[]>([]);
  const [remoteDocs, setRemoteDocs] = useState<WalletDoc[]>([]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [remoteOpen, setRemoteOpen] = useState(false);

  const loadUser = useCallback(async () => {
    const uid = await identity.getWalletUserId();
    setUserId(cleanString(uid));
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      await savedItemsStore.load();

      const [nextSummary, nextGroups] = await Promise.all([
        walletStore.getWalletSummary(),
        walletStore.getGroupedByTrip(),
      ]);

      setSummary(nextSummary);
      setGroups(nextGroups);
    } catch (e: any) {
      Alert.alert("Wallet", e?.message || "Failed to load bookings.");
      setSummary(null);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRemoteDocs = useCallback(async () => {
    if (!userId) {
      setRemoteDocs([]);
      return;
    }

    try {
      const res = await walletList({ prefix: `wallet/${userId}/`, limit: 250 });
      const items = (res.items || []).map((i) => ({
        key: i.key,
        size: i.size,
        uploaded: i.uploaded,
      }));

      items.sort((a, b) => (b.uploaded || "").localeCompare(a.uploaded || ""));
      setRemoteDocs(items);
    } catch {
      setRemoteDocs([]);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadWallet(), loadRemoteDocs()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadWallet, loadRemoteDocs]);

  useEffect(() => {
    loadUser().catch(() => null);
  }, [loadUser]);

  useEffect(() => {
    loadWallet().catch(() => null);
  }, [loadWallet]);

  useEffect(() => {
    if (!userId) return;
    loadRemoteDocs().catch(() => null);
  }, [userId, loadRemoteDocs]);

  useFocusEffect(
    useCallback(() => {
      refreshAll().catch(() => null);
    }, [refreshAll])
  );

  const filteredGroups = useMemo(() => {
    const q = cleanString(query).toLowerCase();

    return groups
      .map((group) => {
        const items = group.items.filter((item) => {
          if (category !== "all" && item.type !== category) return false;

          if (!q) return true;

          const haystack = [
            item.title,
            item.provider ?? "",
            item.home ?? "",
            item.away ?? "",
            item.tripId ?? "",
            getSavedItemTypeLabel(item.type),
            statusLabel(item.status),
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(q);
        });

        if (!items.length) return null;

        return {
          ...group,
          items,
          bookedCount: items.filter((x) => x.status === "booked").length,
          pendingCount: items.filter((x) => x.status === "pending").length,
          savedCount: items.filter((x) => x.status === "saved").length,
          proofCount: items.filter((x) => x.hasProof).length,
          updatedAt: Number(items[0]?.updatedAt ?? 0),
        } as WalletTripGroup;
      })
      .filter(Boolean) as WalletTripGroup[];
  }, [groups, category, query]);

  const visibleRemoteDocs = useMemo(() => {
    const q = cleanString(query).toLowerCase();
    if (!q) return remoteDocs;

    return remoteDocs.filter((d) => {
      const name = shortKeyName(d.key).toLowerCase();
      return name.includes(q);
    });
  }, [remoteDocs, query]);

  const totalRemoteSize = useMemo(() => {
    return remoteDocs.reduce((sum, d) => sum + (Number(d.size) || 0), 0);
  }, [remoteDocs]);

  const derivedCounts = useMemo(() => {
    const allItems = filteredGroups.flatMap((g) => g.items);

    return {
      total: allItems.length,
      booked: allItems.filter((x) => x.status === "booked").length,
      pending: allItems.filter((x) => x.status === "pending").length,
      saved: allItems.filter((x) => x.status === "saved").length,
      missingProof: allItems.filter((x) => x.status === "booked" && !x.hasProof).length,
    };
  }, [filteredGroups]);

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

    return {
      uri: asset.uri,
      name: asset.fileName || `photo_${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
    };
  }

  function chooseRemoteUploadSource() {
    if (!userId) {
      Alert.alert("Wallet", "Identity is still loading. Try again in a moment.");
      return;
    }

    Alert.alert("Upload backup document", "Choose what you want to upload.", [
      { text: "Cancel", style: "cancel" },
      { text: "Take photo", onPress: () => pickAndUploadRemote("camera").catch(() => null) },
      { text: "Choose photo", onPress: () => pickAndUploadRemote("photo").catch(() => null) },
      { text: "Choose document", onPress: () => pickAndUploadRemote("document").catch(() => null) },
    ]);
  }

  async function pickAndUploadRemote(kind: UploadKind) {
    if (!userId) return;

    try {
      setUploading(true);

      const asset = await pickAsset(kind);
      if (!asset) return;

      await walletUpload({
        fileUri: asset.uri,
        filename: asset.name,
        mimeType: asset.mimeType,
        userId,
        tripId: "unassigned",
        category: "misc",
      });

      await loadRemoteDocs();
      Alert.alert("Uploaded", "Backup document saved.");
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message || "Could not upload.");
    } finally {
      setUploading(false);
    }
  }

  async function onOpenTrip(tripId?: string) {
    const id = cleanString(tripId);
    if (!id) return;

    router.push({ pathname: "/trip/[id]", params: { id } });
  }

  async function onAddProof(itemId: string) {
    const ok = await attachTicketProof(itemId);
    if (ok) {
      await loadWallet();
    }
  }

  async function onArchive(itemId: string) {
    Alert.alert("Archive item?", "This will hide it from the main Wallet view.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: async () => {
          try {
            await savedItemsStore.transitionStatus(itemId, "archived");
            await loadWallet();
          } catch (e: any) {
            Alert.alert("Couldn’t archive", e?.message || "Try again.");
          }
        },
      },
    ]);
  }

  async function onMoveBackToSaved(itemId: string) {
    try {
      await savedItemsStore.transitionStatus(itemId, "saved");
      await loadWallet();
    } catch (e: any) {
      Alert.alert("Couldn’t update", e?.message || "Try again.");
    }
  }

  async function viewRemoteDoc(key: string) {
    try {
      await walletOpenOrShare({ key });
    } catch (e: any) {
      Alert.alert("Open failed", e?.message || "Could not open file.");
    }
  }

  async function deleteRemoteDoc(key: string) {
    Alert.alert("Delete document?", "This will permanently remove it from remote backup storage.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const prev = remoteDocs;
          setRemoteDocs((d) => d.filter((x) => x.key !== key));

          try {
            await walletDelete({ key });
            await loadRemoteDocs();
          } catch (e: any) {
            setRemoteDocs(prev);
            Alert.alert("Delete failed", e?.message || "Could not delete file.");
          }
        },
      },
    ]);
  }

  function FilterChip({ id, label }: { id: CategoryFilter; label: string }) {
    const active = id === category;
    const count =
      id === "all"
        ? derivedCounts.total
        : filteredGroups.flatMap((g) => g.items).filter((x) => x.type === id).length;

    return (
      <Pressable
        onPress={() => setCategory(id)}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        <View style={[styles.chipCount, active && styles.chipCountActive]}>
          <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
        </View>
      </Pressable>
    );
  }

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

  function BookingRow({ item }: { item: WalletBooking }) {
    const fixtureLine =
      item.home && item.away ? `${item.home} v ${item.away}` : null;

    const kickoff = formatKickoff(item.kickoffIso);
    const typeLabel = getSavedItemTypeLabel(item.type);

    return (
      <GlassCard style={styles.docCard}>
        <View style={styles.docRow}>
          <View style={styles.docIconWrap}>
            <Text style={styles.docIcon}>{iconForType(item.type)}</Text>
          </View>

          <View style={styles.docMain}>
            <Text style={styles.docTitle} numberOfLines={1}>
              {item.title}
            </Text>

            <Text style={styles.docMeta} numberOfLines={2}>
              {`${typeLabel} • ${statusLabel(item.status)}${
                item.provider ? ` • ${item.provider}` : ""
              }`}
            </Text>

            {fixtureLine ? (
              <Text style={styles.docSubMeta} numberOfLines={1}>
                {fixtureLine}
              </Text>
            ) : null}

            {kickoff ? (
              <Text style={styles.docSubMeta} numberOfLines={1}>
                {kickoff}
              </Text>
            ) : null}

            <Text style={styles.docSubMeta} numberOfLines={1}>
              {item.hasProof
                ? `${item.attachmentCount} proof file${item.attachmentCount === 1 ? "" : "s"} attached`
                : item.status === "booked"
                ? "No proof attached yet"
                : "No proof needed yet"}
            </Text>
          </View>

          <View style={styles.docActions}>
            {item.tripId ? (
              <Pressable style={styles.smallBtn} onPress={() => onOpenTrip(item.tripId)}>
                <Text style={styles.smallBtnText}>Trip</Text>
              </Pressable>
            ) : null}

            {item.status === "booked" && !item.hasProof ? (
              <Pressable style={styles.smallBtn} onPress={() => onAddProof(item.id)}>
                <Text style={styles.smallBtnText}>Add proof</Text>
              </Pressable>
            ) : null}

            {item.status === "pending" ? (
              <Pressable style={styles.smallBtn} onPress={() => onMoveBackToSaved(item.id)}>
                <Text style={styles.smallBtnText}>Mark saved</Text>
              </Pressable>
            ) : null}

            <Pressable style={[styles.smallBtn, styles.smallBtnDanger]} onPress={() => onArchive(item.id)}>
              <Text style={styles.smallBtnText}>Archive</Text>
            </Pressable>
          </View>
        </View>
      </GlassCard>
    );
  }

  function RemoteDocRow({ d }: { d: WalletDoc }) {
    const filename = shortKeyName(d.key);
    const date = formatDate(d.uploaded);
    const size = formatSize(d.size);

    return (
      <GlassCard style={styles.docCard}>
        <Pressable
          onPress={() => viewRemoteDoc(d.key)}
          style={({ pressed }) => [styles.docRow, pressed && { opacity: 0.92 }]}
          android_ripple={{ color: "rgba(255,255,255,0.05)" }}
        >
          <View style={styles.docIconWrap}>
            <Text style={styles.docIcon}>☁️</Text>
          </View>

          <View style={styles.docMain}>
            <Text style={styles.docTitle} numberOfLines={1}>
              {filename}
            </Text>

            <Text style={styles.docMeta} numberOfLines={1}>
              {`Backup document • ${size}${date ? ` • ${date}` : ""}`}
            </Text>
          </View>

          <View style={styles.docActions}>
            <Pressable style={styles.smallBtn} onPress={() => viewRemoteDoc(d.key)}>
              <Text style={styles.smallBtnText}>View</Text>
            </Pressable>

            <Pressable style={[styles.smallBtn, styles.smallBtnDanger]} onPress={() => deleteRemoteDoc(d.key)}>
              <Text style={styles.smallBtnText}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </GlassCard>
    );
  }

  return (
    <Background
  imageSource={getBackground("wallet")}
  overlayOpacity={0.03}
  topShadeOpacity={0.24}
  bottomShadeOpacity={0.30}
  centerShadeOpacity={0.02}
>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>WALLET</Text>
                <Text style={styles.h1}>Bookings & proofs</Text>
                <Text style={styles.h2}>
                  Your booked items, pending confirmations, and offline proof files in one place.
                </Text>
              </View>

              <Pressable
                style={[styles.uploadBtn, (uploading || !userId) && { opacity: 0.6 }]}
                onPress={chooseRemoteUploadSource}
                disabled={uploading || !userId}
              >
                {uploading ? <ActivityIndicator /> : <Text style={styles.uploadText}>Backup doc</Text>}
              </Pressable>
            </View>

            <View style={styles.metricsRow}>
              <Metric label="Booked" value={String(summary?.booked ?? 0)} />
              <Metric label="Pending" value={String(summary?.pending ?? 0)} />
              <Metric label="Proofs" value={String(summary?.withProof ?? 0)} />
            </View>

            <View style={styles.metricsRow}>
              <Metric label="Trips" value={String(groups.length)} />
              <Metric label="Missing proof" value={String(derivedCounts.missingProof)} />
              <Metric label="Backups" value={String(remoteDocs.length)} />
            </View>

            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search bookings, trips, teams, providers…"
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

          <View style={styles.chipsRow}>
            {CATEGORY_FILTERS.map((c) => (
              <FilterChip key={c.id} id={c.id} label={c.label} />
            ))}
          </View>

          {loading || refreshing ? (
            <GlassCard style={styles.stateCard}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading wallet…</Text>
              </View>
            </GlassCard>
          ) : filteredGroups.length === 0 ? (
            <GlassCard style={styles.stateCard}>
              <EmptyState
                title="No wallet items yet"
                message="Booked items and proof files will appear here. Right now there’s nothing trustworthy to show."
              />
            </GlassCard>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredGroups.map((group) => (
                <GlassCard key={group.tripId} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupTitle} numberOfLines={1}>
                        Trip {group.tripId}
                      </Text>
                      <Text style={styles.groupMeta}>
                        {`${group.bookedCount} booked • ${group.pendingCount} pending • ${group.proofCount} with proof`}
                      </Text>
                    </View>

                    <Pressable style={styles.groupBtn} onPress={() => onOpenTrip(group.tripId)}>
                      <Text style={styles.groupBtnText}>Open trip</Text>
                    </Pressable>
                  </View>

                  <View style={{ gap: 10 }}>
                    {group.items.map((item) => (
                      <BookingRow key={item.id} item={item} />
                    ))}
                  </View>
                </GlassCard>
              ))}
            </View>
          )}

          <GlassCard style={styles.remoteSection}>
            <View style={styles.remoteHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.remoteTitle}>Backup documents</Text>
                <Text style={styles.remoteMeta}>
                  Optional remote storage for extra files. This is secondary to your actual booked items.
                </Text>
              </View>

              <Pressable style={styles.groupBtn} onPress={() => setRemoteOpen((v) => !v)}>
                <Text style={styles.groupBtnText}>{remoteOpen ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>

            <View style={styles.metricsRow}>
              <Metric label="Files" value={String(remoteDocs.length)} />
              <Metric label="Storage" value={formatSize(totalRemoteSize)} />
              <Metric label="User" value={userId ? "Ready" : "Loading"} />
            </View>

            {remoteOpen ? (
              visibleRemoteDocs.length === 0 ? (
                <View style={{ marginTop: 12 }}>
                  <EmptyState
                    title="No backup documents"
                    message="You can still upload extra confirmations, screenshots, or receipts here if you want a remote backup."
                  />
                </View>
              ) : (
                <View style={{ gap: 10, marginTop: 12 }}>
                  {visibleRemoteDocs.map((d) => (
                    <RemoteDocRow key={d.key} d={d} />
                  ))}
                </View>
              )
            ) : null}
          </GlassCard>
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
    gap: theme.spacing.lg,
  },

  hero: { padding: theme.spacing.lg, borderRadius: 24 },

  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  kicker: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    letterSpacing: 1.2,
  },

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

  uploadText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },

  metricsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

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

  metricVal: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
  },

  metricKey: {
    marginTop: 3,
    color: theme.colors.textTertiary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

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

  clearBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

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

  chipText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  chipTextActive: {
    color: theme.colors.text,
  },

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

  chipCountText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 11,
  },

  chipCountTextActive: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  stateCard: {
    padding: theme.spacing.lg,
    borderRadius: 24,
  },

  center: {
    paddingVertical: 10,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "700",
  },

  groupCard: {
    padding: theme.spacing.lg,
    borderRadius: 22,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  groupTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },

  groupMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },

  groupBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  groupBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  remoteSection: {
    padding: theme.spacing.lg,
    borderRadius: 24,
  },

  remoteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  remoteTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },

  remoteMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 18,
  },

  docCard: {
    padding: 0,
    borderRadius: 18,
  },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },

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

  docIcon: {
    fontSize: 18,
  },

  docMain: {
    flex: 1,
    minWidth: 0,
  },

  docTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
  },

  docMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },

  docSubMeta: {
    marginTop: 4,
    color: theme.colors.textTertiary,
    fontWeight: "700",
    fontSize: 12,
  },

  docActions: {
    flexDirection: "column",
    gap: 8,
    alignItems: "stretch",
  },

  smallBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },

  smallBtnDanger: {
    borderColor: "rgba(255,80,80,0.30)",
    backgroundColor: "rgba(255,80,80,0.10)",
  },

  smallBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },
});
