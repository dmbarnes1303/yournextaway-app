// app/(tabs)/trips.tsx
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { parseIsoDateOnly, toIsoDate } from "@/src/constants/football";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";

import { formatUkDateOnly } from "@/src/utils/formatters";

/* -------------------------------- Helpers -------------------------------- */

function titleCase(input: string) {
  const s = String(input ?? "").trim();
  if (!s) return "Trip";
  const cleaned = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function cityLabel(t: Trip) {
  const raw = String((t as any)?.displayCity ?? t.cityId ?? "").trim();
  return titleCase(raw || "Trip");
}

function tripSummaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} match${n === 1 ? "" : "es"}`;
}

function isUpcoming(t: Trip) {
  const start = t.startDate ? parseIsoDateOnly(t.startDate) : null;
  if (!start) return false;

  const today = parseIsoDateOnly(toIsoDate(new Date()));
  if (!today) return true;

  return start.getTime() >= today.getTime();
}

function buildCountsIndex(items: SavedItem[]) {
  const byTrip: Record<
    string,
    {
      total: number;
      pending: number;
      booked: number;
      saved: number;
    }
  > = {};

  for (const it of items) {
    const tid = String(it.tripId ?? "").trim();
    if (!tid) continue;

    if (!byTrip[tid]) byTrip[tid] = { total: 0, pending: 0, booked: 0, saved: 0 };

    const c = byTrip[tid];
    c.total += 1;
    if (it.status === "pending") c.pending += 1;
    else if (it.status === "booked") c.booked += 1;
    else if (it.status === "saved") c.saved += 1;
  }

  return byTrip;
}

function badgeLabel(t: Trip, counts?: { pending: number; booked: number }) {
  const pending = counts?.pending ?? 0;
  const booked = counts?.booked ?? 0;

  if (pending > 0) return { text: `${pending} pending`, kind: "pending" as const };
  if (booked > 0) return { text: `${booked} booked`, kind: "booked" as const };

  // Draft heuristic: no items + no dates
  const noDates = !t.startDate || !t.endDate;
  if (noDates) return { text: "Draft", kind: "draft" as const };

  return { text: "Ready", kind: "ready" as const };
}

function clamp2(n: number) {
  return Math.max(0, Math.min(99, n));
}

/* -------------------------------- Screen -------------------------------- */

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  const [loadedItems, setLoadedItems] = useState(savedItemsStore.getState().loaded);
  const [items, setItems] = useState<SavedItem[]>(savedItemsStore.getState().items);

  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  /* --------------------------- subscriptions --------------------------- */

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoadedTrips(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().catch(() => {});
    }

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = savedItemsStore.subscribe((s) => {
      setLoadedItems(s.loaded);
      setItems(s.items);
    });

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().catch(() => {});
    }

    return unsub;
  }, []);

  /* ------------------------------ derived ------------------------------ */

  const loading = !loadedTrips || !loadedItems;

  const countsIndex = useMemo(() => buildCountsIndex(items), [items]);

  const upcoming = useMemo(() => trips.filter(isUpcoming), [trips]);
  const past = useMemo(() => trips.filter((t) => !isUpcoming(t)), [trips]);

  const totals = useMemo(() => {
    const tripCount = trips.length;
    const pending = items.filter((x) => x.status === "pending").length;
    const booked = items.filter((x) => x.status === "booked").length;
    return { tripCount, pending, booked };
  }, [trips.length, items]);

  const showEmpty = !loading && trips.length === 0;

  /* ------------------------------ actions ------------------------------ */

  const openTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/[id]", params: { id: t.id } } as any),
    [router]
  );

  const editTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/build", params: { tripId: t.id } } as any),
    [router]
  );

  const goBuild = useCallback(() => router.push("/trip/build"), [router]);
  const goFixtures = useCallback(() => router.push("/(tabs)/fixtures" as any), [router]);

  const actuallyDeleteTrip = useCallback(
    async (t: Trip) => {
      if (deletingTripId) return;

      setDeletingTripId(t.id);
      try {
        await tripsStore.deleteTripCascade(t.id);
      } catch {
        Alert.alert("Couldn’t delete", "Try again.");
      } finally {
        setDeletingTripId(null);
      }
    },
    [deletingTripId]
  );

  const deleteTrip = useCallback(
    (t: Trip) => {
      const c = countsIndex[t.id] ?? { total: 0, pending: 0, booked: 0, saved: 0 };
      const name = cityLabel(t);

      Alert.alert(
        "Delete trip?",
        `"${name}" will be removed from this device.\n\nItems: ${c.total} • Pending: ${c.pending} • Booked: ${c.booked}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            style: "destructive",
            onPress: () => {
              const msg =
                `This cannot be undone.\n\n` +
                `Deleting this trip will also remove ALL saved links, pending items, booked items, and any Wallet attachments for this trip from this device.`;

              Alert.alert("Confirm delete", msg, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete trip",
                  style: "destructive",
                  onPress: () => {
                    actuallyDeleteTrip(t).catch(() => null);
                  },
                },
              ]);
            },
          },
        ]
      );
    },
    [countsIndex, actuallyDeleteTrip]
  );

  /* -------------------------------- render -------------------------------- */

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.84}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.xxl + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <GlassCard style={styles.hero} strength="default">
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>WORKSPACES</Text>
                <Text style={styles.title}>Trips</Text>
                <Text style={styles.subtitle}>Everything you’re planning — tickets, travel, notes, Wallet.</Text>
              </View>

              <View style={styles.metricsCol}>
                <Metric label="Trips" value={String(clamp2(totals.tripCount))} />
                <Metric label="Pending" value={String(clamp2(totals.pending))} />
                <Metric label="Booked" value={String(clamp2(totals.booked))} />
              </View>
            </View>

            <View style={styles.heroActions}>
              <Pressable onPress={goBuild} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Build a trip</Text>
                <Text style={styles.btnSub}>Create a new workspace</Text>
              </Pressable>

              <Pressable onPress={goFixtures} style={[styles.btn, styles.btnSecondary]}>
                <Text style={styles.btnSecondaryText}>Browse fixtures</Text>
                <Text style={styles.btnSub}>Start from a match</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.heroLoadingRow}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading your trips…</Text>
              </View>
            ) : null}
          </GlassCard>

          {/* EMPTY */}
          {showEmpty ? (
            <GlassCard style={styles.card} strength="default">
              <EmptyState
                title="No trips yet"
                message="Start from a fixture, then build your trip workspace around tickets + travel."
              />
            </GlassCard>
          ) : null}

          {/* UPCOMING */}
          {!loading && upcoming.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Upcoming" subtitle={`${upcoming.length}`} />
              <View style={styles.list}>
                {upcoming.map((t) => (
                  <TripCard
                    key={t.id}
                    t={t}
                    counts={countsIndex[t.id]}
                    deletingTripId={deletingTripId}
                    onOpen={openTrip}
                    onEdit={editTrip}
                    onDelete={deleteTrip}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* PAST / DRAFT */}
          {!loading && past.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Past & draft" subtitle={`${past.length}`} />
              <View style={styles.list}>
                {past.map((t) => (
                  <TripCard
                    key={t.id}
                    t={t}
                    counts={countsIndex[t.id]}
                    deletingTripId={deletingTripId}
                    onOpen={openTrip}
                    onEdit={editTrip}
                    onDelete={deleteTrip}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* ------------------------------ Bits ------------------------------ */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricKey}>{label}</Text>
    </View>
  );
}

function StatusChip({
  kind,
  text,
}: {
  kind: "pending" | "booked" | "draft" | "ready";
  text: string;
}) {
  const style =
    kind === "pending"
      ? styles.chipPending
      : kind === "booked"
      ? styles.chipBooked
      : kind === "draft"
      ? styles.chipDraft
      : styles.chipReady;

  return (
    <View style={[styles.chip, style]}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

/* ------------------------------ Trip Card ------------------------------ */

function TripCard({
  t,
  counts,
  deletingTripId,
  onOpen,
  onEdit,
  onDelete,
}: {
  t: Trip;
  counts?: { total: number; pending: number; booked: number; saved: number };
  deletingTripId: string | null;
  onOpen: (t: Trip) => void;
  onEdit: (t: Trip) => void;
  onDelete: (t: Trip) => void;
}) {
  const c = counts ?? { total: 0, pending: 0, booked: 0, saved: 0 };
  const isDeleting = deletingTripId === t.id;

  const badge = badgeLabel(t, c);

  return (
    <GlassCard style={styles.tripCard} strength="subtle" noPadding>
      <Pressable
        onPress={() => onOpen(t)}
        disabled={isDeleting}
        style={({ pressed }) => [styles.tripPress, pressed && { opacity: 0.92 }]}
        android_ripple={{ color: "rgba(255,255,255,0.06)" }}
      >
        <View style={styles.tripTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.tripTitleRow}>
              <Text style={styles.tripTitle} numberOfLines={1}>
                {cityLabel(t)}
              </Text>
              <StatusChip kind={badge.kind} text={badge.text} />
            </View>

            <Text style={styles.tripMeta} numberOfLines={1}>
              {tripSummaryLine(t)}
            </Text>
          </View>

          <Text style={styles.chev}>›</Text>
        </View>

        <View style={styles.pillRow}>
          <Pill label="Items" value={c.total} />
          <Pill label="Pending" value={c.pending} />
          <Pill label="Booked" value={c.booked} />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => onEdit(t)}
            disabled={isDeleting}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionGhost,
              pressed && { opacity: 0.92 },
              isDeleting && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.actionGhostText}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(t)}
            disabled={isDeleting}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionDanger,
              pressed && { opacity: 0.92 },
              isDeleting && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.actionDangerText}>{isDeleting ? "Deleting…" : "Delete"}</Text>
          </Pressable>
        </View>
      </Pressable>
    </GlassCard>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillKey}>{label}</Text>
      <Text style={styles.pillVal}>{String(clamp2(value))}</Text>
    </View>
  );
}

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  /* HERO */
  hero: { padding: theme.spacing.lg, borderRadius: 24 },

  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

  kicker: { color: theme.colors.primary, fontWeight: theme.fontWeight.black, fontSize: 11, letterSpacing: 1.2 },

  title: { marginTop: 6, color: theme.colors.text, fontSize: 28, fontWeight: theme.fontWeight.black },

  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  metricsCol: { gap: 8, alignItems: "flex-end" },
  metric: {
    minWidth: 78,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  metricVal: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 16 },
  metricKey: { marginTop: 3, color: theme.colors.textTertiary, fontWeight: theme.fontWeight.black, fontSize: 11 },

  heroActions: { marginTop: 14, flexDirection: "row", gap: 10 },

  heroLoadingRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },

  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  btnPrimary: {
    borderColor: "rgba(79,224,138,0.34)",
    backgroundColor: Platform.OS === "android" ? "rgba(79,224,138,0.10)" : "rgba(79,224,138,0.08)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 14 },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
  },
  btnSecondaryText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 14 },

  btnSub: { marginTop: 4, color: theme.colors.textTertiary, fontWeight: theme.fontWeight.black, fontSize: 11 },

  /* BODY */
  section: { gap: 10 },
  list: { gap: 12 },

  card: { padding: theme.spacing.lg, borderRadius: 24 },

  /* TRIP CARD */
  tripCard: { borderRadius: 24 },
  tripPress: { padding: 14 },

  tripTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  tripTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tripTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black, flexShrink: 1 },

  tripMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  chev: { color: theme.colors.textTertiary, fontSize: 26, fontWeight: theme.fontWeight.black, marginTop: -2 },

  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 11 },

  chipPending: { borderColor: "rgba(255,200,80,0.40)", backgroundColor: "rgba(255,200,80,0.10)" },
  chipBooked: { borderColor: "rgba(120,170,255,0.45)", backgroundColor: "rgba(120,170,255,0.10)" },
  chipDraft: { borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(255,255,255,0.06)" },
  chipReady: { borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,255,136,0.08)" },

  pillRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pillKey: { color: theme.colors.textTertiary, fontSize: 11, fontWeight: theme.fontWeight.black },
  pillVal: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },

  actionsRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  actionBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  actionGhost: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
  },
  actionGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 13 },

  actionDanger: {
    borderColor: "rgba(255,90,90,0.32)",
    backgroundColor: Platform.OS === "android" ? "rgba(255,90,90,0.06)" : "rgba(255,90,90,0.05)",
  },
  actionDangerText: { color: "rgba(255,120,120,0.95)", fontWeight: theme.fontWeight.black, fontSize: 13 },
});
