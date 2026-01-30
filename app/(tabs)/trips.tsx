// app/(tabs)/trips.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import { formatUkDateOnly } from "@/src/utils/formatters";

function toStartTs(t: Trip): number | null {
  if (!t.startDate) return null;
  const d = new Date(`${t.startDate}T00:00:00Z`);
  const ts = d && !Number.isNaN(d.getTime()) ? d.getTime() : null;
  return ts;
}

function isUpcoming(t: Trip, nowTs: number): boolean {
  const ts = toStartTs(t);
  if (ts == null) return false;
  return ts >= nowTs;
}

function tripDateLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  return `${a} → ${b}`;
}

function matchCount(t: Trip) {
  return t.matchIds?.length ?? 0;
}

function sortTripsUpcomingFirst(trips: Trip[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nowTs = now.getTime();

  return [...trips]
    .map((t) => ({ t, ts: toStartTs(t) }))
    .sort((a, b) => {
      const aUp = a.ts != null ? a.ts >= nowTs : false;
      const bUp = b.ts != null ? b.ts >= nowTs : false;

      if (aUp !== bUp) return aUp ? -1 : 1;

      if (a.ts != null && b.ts != null && a.ts !== b.ts) return a.ts - b.ts;

      const au = a.t.updatedAt ?? a.t.createdAt ?? 0;
      const bu = b.t.updatedAt ?? b.t.createdAt ?? 0;
      return bu - au;
    })
    .map((x) => x.t);
}

type StatPillProps = {
  label: string;
  value: string;
};

function StatPill({ label, value }: StatPillProps) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

type TripCardProps = {
  t: Trip;
  variant: "upcoming" | "past";
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function TripCard({ t, variant, onOpen, onEdit, onDelete }: TripCardProps) {
  const city = (t.cityId || "Trip").trim();
  const dates = tripDateLine(t);
  const n = matchCount(t);
  const nLabel = `${n} match${n === 1 ? "" : "es"}`;
  const hasNotes = Boolean(String(t.notes ?? "").trim());

  return (
    <GlassCard strength="subtle" style={styles.tripCard}>
      <Pressable onPress={onOpen} style={styles.tripMain}>
        <View style={styles.tripTopRow}>
          <Text style={styles.tripTitle} numberOfLines={1}>
            {city}
          </Text>

          <View style={[styles.badge, variant === "upcoming" ? styles.badgeUpcoming : styles.badgePast]}>
            <Text style={[styles.badgeText, variant === "upcoming" ? styles.badgeTextUpcoming : styles.badgeTextPast]}>
              {variant === "upcoming" ? "Upcoming" : "Past / Draft"}
            </Text>
          </View>
        </View>

        <Text style={styles.tripMeta}>{dates}</Text>

        <View style={styles.tripMetaRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{nLabel}</Text>
          </View>

          {t.startDate ? (
            <Text style={styles.tripMetaHint} numberOfLines={1}>
              Tap to open
            </Text>
          ) : (
            <Text style={styles.tripMetaHint} numberOfLines={1}>
              Add dates when ready
            </Text>
          )}
        </View>

        {hasNotes ? (
          <Text style={styles.tripNotes} numberOfLines={2}>
            {String(t.notes ?? "").trim()}
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.tripActions}>
        <Pressable onPress={onEdit} style={[styles.actionBtn, styles.actionGhost]}>
          <Text style={styles.actionGhostText}>Edit</Text>
        </Pressable>

        <Pressable onPress={onDelete} style={[styles.actionBtn, styles.actionDangerGhost]}>
          <Text style={styles.actionDangerText}>Delete</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

export default function TripsScreen() {
  const router = useRouter();

  const [loaded, setLoaded] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoaded(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) tripsStore.loadTrips();
    return unsub;
  }, []);

  const sorted = useMemo(() => sortTripsUpcomingFirst(trips), [trips]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nowTs = now.getTime();

    const up: Trip[] = [];
    const pa: Trip[] = [];

    for (const t of sorted) {
      if (isUpcoming(t, nowTs)) up.push(t);
      else pa.push(t);
    }

    return { upcoming: up, past: pa };
  }, [sorted]);

  const openTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/[id]", params: { id: t.id } } as any),
    [router]
  );

  const editTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/build", params: { tripId: t.id } } as any),
    [router]
  );

  const deleteTrip = useCallback((t: Trip) => {
    Alert.alert("Delete trip?", "This will remove the trip from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await tripsStore.removeTrip(t.id);
        },
      },
    ]);
  }, []);

  const goBuild = useCallback(() => router.push("/trip/build"), [router]);
  const goFixtures = useCallback(() => router.push("/(tabs)/fixtures"), [router]);

  const showEmpty = loaded && trips.length === 0;

  const stats = useMemo(() => {
    const total = trips.length;
    const up = upcoming.length;
    const pa = past.length;
    return { total, up, pa };
  }, [past.length, trips.length, upcoming.length]);

  return (
    <Background imageUrl={getBackground("trips")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Trips</Text>
            <Text style={styles.subtitle}>Saved plans, upcoming breaks, and drafts.</Text>

            <View style={styles.statsRow}>
              <StatPill label="Upcoming" value={String(stats.up)} />
              <StatPill label="Past" value={String(stats.pa)} />
              <StatPill label="Total" value={String(stats.total)} />
            </View>
          </View>

          {/* PRIMARY ACTION */}
          <GlassCard style={styles.primaryCard} strength="default">
            <View style={styles.primaryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.primaryTitle}>Build a new trip</Text>
                <Text style={styles.primarySub}>Start with a fixture. Save it. Build everything from one hub.</Text>
              </View>

              <Pressable onPress={goBuild} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Build trip</Text>
              </Pressable>
            </View>

            <Pressable onPress={goFixtures} style={styles.secondaryLink} hitSlop={10}>
              <Text style={styles.secondaryLinkText}>Browse fixtures instead</Text>
            </Pressable>
          </GlassCard>

          {/* LOADING */}
          {!loaded ? (
            <GlassCard style={styles.card} strength="default">
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trips…</Text>
              </View>
            </GlassCard>
          ) : null}

          {/* EMPTY */}
          {showEmpty ? (
            <GlassCard style={styles.card} strength="default">
              <EmptyState title="No trips yet" message="When you save a match as a trip, it appears here." />
              <View style={styles.emptyActions}>
                <Pressable onPress={goBuild} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Build trip</Text>
                </Pressable>

                <Pressable onPress={goFixtures} style={[styles.btn, styles.btnSecondary]}>
                  <Text style={styles.btnSecondaryText}>Browse fixtures</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : null}

          {/* UPCOMING */}
          {loaded && !showEmpty ? (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Upcoming</Text>
                  <Text style={styles.sectionMeta}>
                    {upcoming.length} trip{upcoming.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <GlassCard style={styles.card} strength="subtle">
                  {upcoming.length === 0 ? (
                    <View style={styles.bucketEmptyWrap}>
                      <Text style={styles.bucketEmptyTitle}>Nothing upcoming</Text>
                      <Text style={styles.bucketEmptyText}>When you save a new trip, it’ll show here.</Text>

                      <Pressable onPress={goFixtures} style={[styles.btn, styles.btnSecondary, { marginTop: 12 }]}>
                        <Text style={styles.btnSecondaryText}>Browse fixtures</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.list}>
                      {upcoming.map((t) => (
                        <TripCard
                          key={t.id}
                          t={t}
                          variant="upcoming"
                          onOpen={() => openTrip(t)}
                          onEdit={() => editTrip(t)}
                          onDelete={() => deleteTrip(t)}
                        />
                      ))}
                    </View>
                  )}
                </GlassCard>
              </View>

              {/* PAST & DRAFT */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Past & drafts</Text>
                  <Text style={styles.sectionMeta}>
                    {past.length} item{past.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <GlassCard style={styles.card} strength="subtle">
                  {past.length === 0 ? (
                    <Text style={styles.bucketEmptyText}>No past trips.</Text>
                  ) : (
                    <View style={styles.list}>
                      {past.slice(0, 20).map((t) => (
                        <TripCard
                          key={t.id}
                          t={t}
                          variant="past"
                          onOpen={() => openTrip(t)}
                          onEdit={() => editTrip(t)}
                          onDelete={() => deleteTrip(t)}
                        />
                      ))}

                      {past.length > 20 ? <Text style={styles.moreInline}>Showing the latest 20.</Text> : null}
                    </View>
                  )}
                </GlassCard>
              </View>
            </>
          ) : null}

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

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
    gap: 8,
  },

  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  statsRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 10,
  },

  statPill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 46,
    justifyContent: "center",
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    lineHeight: 14,
  },
  statValue: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  section: { marginTop: 2 },
  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  muted: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  /* PRIMARY ACTION CARD */
  primaryCard: { padding: theme.spacing.lg },
  primaryRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  primaryTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  primarySub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },

  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
    alignSelf: "flex-start",
  },
  primaryBtnText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  secondaryLink: { marginTop: 12, alignSelf: "flex-start" },
  secondaryLinkText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
    textDecorationLine: "underline",
  },

  /* SECTION HEADERS (inline, premium) */
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  sectionTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  sectionMeta: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: theme.fontSize.xs },

  /* EMPTY ACTIONS */
  emptyActions: { marginTop: 12, gap: 10 },

  /* BUTTONS (fallback) */
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  btnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.34)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },

  btnSecondary: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.18)" },
  btnSecondaryText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },

  /* BUCKET EMPTY */
  bucketEmptyWrap: { paddingVertical: 6 },
  bucketEmptyTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  bucketEmptyText: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  /* LISTS */
  list: { marginTop: 10, gap: 10 },

  /* TRIP CARD */
  tripCard: {
    padding: theme.spacing.md,
    borderRadius: 16,
  },
  tripMain: { flex: 1 },

  tripTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tripTitle: { flex: 1, color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.lg },

  tripMeta: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "800" },

  tripMetaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  chipText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.xs },

  tripMetaHint: { color: theme.colors.textTertiary, fontWeight: "800", fontSize: theme.fontSize.xs },

  tripNotes: { marginTop: 10, color: theme.colors.textTertiary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  badgeUpcoming: {
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },
  badgePast: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  badgeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black },
  badgeTextUpcoming: { color: "rgba(0,255,136,0.95)" },
  badgeTextPast: { color: theme.colors.textSecondary },

  tripActions: { marginTop: 12, flexDirection: "row", gap: 10 },

  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  actionGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  actionGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },

  // “Danger” but premium: less neon-red, still clear
  actionDangerGhost: {
    borderColor: "rgba(255,80,80,0.18)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  actionDangerText: { color: "rgba(255,120,120,0.90)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },

  moreInline: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },
});
