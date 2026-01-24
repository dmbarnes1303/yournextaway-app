// app/(tabs)/trips.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import tripsStore, { type Trip } from "@/src/state/trips";
import { getFixtureById } from "@/src/services/apiFootball";

import { formatUkDateRange } from "@/src/utils/formatters";
import { parseIsoDateOnly, toIsoDate } from "@/src/constants/football";

type MatchSummary = {
  fixtureId?: string;
  home?: string;
  away?: string;
  kickoff?: string;
};

function isUpcomingTrip(t: Trip, todayIso: string) {
  const end = parseIsoDateOnly(t.endDate);
  const today = parseIsoDateOnly(todayIso);
  if (!end || !today) return true;
  return end.getTime() >= today.getTime();
}

export default function TripsScreen() {
  const router = useRouter();

  const [loaded, setLoaded] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  // Match summaries for nicer list rows (best-effort; never blocks rendering)
  const [matchByTripId, setMatchByTripId] = useState<Record<string, MatchSummary>>({});
  const [matchLoading, setMatchLoading] = useState(false);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoaded(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips();
    }

    return unsub;
  }, []);

  const sortedTrips = useMemo(() => {
    const list = [...trips];

    list.sort((a, b) => {
      const aUpcoming = isUpcomingTrip(a, todayIso);
      const bUpcoming = isUpcomingTrip(b, todayIso);

      // Upcoming first
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

      const aStart = parseIsoDateOnly(a.startDate)?.getTime() ?? 0;
      const bStart = parseIsoDateOnly(b.startDate)?.getTime() ?? 0;

      // Upcoming: earliest first
      if (aUpcoming && bUpcoming) return aStart - bStart;

      // Past: most recent first
      return bStart - aStart;
    });

    return list;
  }, [trips, todayIso]);

  const hasTrips = useMemo(() => sortedTrips.length > 0, [sortedTrips]);

  // Best-effort fetch of first match per trip so the list feels “finished”.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!loaded) return;
      if (!hasTrips) {
        setMatchByTripId({});
        return;
      }

      setMatchLoading(true);

      try {
        const next: Record<string, MatchSummary> = {};

        await Promise.all(
          sortedTrips.map(async (t) => {
            const mid = t.matchIds?.[0];
            if (!mid) return;

            try {
              const row: any = await getFixtureById(mid);
              if (!row) return;

              const home = row?.teams?.home?.name ?? "";
              const away = row?.teams?.away?.name ?? "";
              const kickoff = row?.fixture?.date ?? "";

              next[t.id] = {
                fixtureId: String(row?.fixture?.id ?? mid),
                home,
                away,
                kickoff,
              };
            } catch {
              // ignore
            }
          })
        );

        if (cancelled) return;

        // Merge to avoid flicker if some rows fail
        setMatchByTripId((cur) => ({ ...cur, ...next }));
      } finally {
        if (!cancelled) setMatchLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [loaded, hasTrips, sortedTrips]);

  return (
    <Background imageUrl={getBackground("trips")}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>My Trips</Text>
              <Text style={styles.subtitle}>Plan mini-breaks around football fixtures.</Text>
            </View>

            <Pressable onPress={() => router.push("/trip/build")} style={styles.cta}>
              <Text style={styles.ctaText}>Build Trip</Text>
            </Pressable>
          </View>

          <Text style={styles.meta}>
            {loaded ? `${sortedTrips.length} trip${sortedTrips.length === 1 ? "" : "s"}` : "Loading…"}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card} intensity={24}>
            {!loaded ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trips…</Text>
              </View>
            ) : null}

            {loaded && !hasTrips ? (
              <View style={{ gap: 12 }}>
                <EmptyState title="No trips yet" message="Build your first trip from a match in Fixtures." />
                <Pressable onPress={() => router.push("/trip/build")} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Build a trip</Text>
                </Pressable>
              </View>
            ) : null}

            {loaded && hasTrips ? (
              <View style={styles.list}>
                {sortedTrips.map((t) => {
                  const matchCount = t.matchIds?.length ?? 0;
                  const upcoming = isUpcomingTrip(t, todayIso);

                  const match = matchByTripId[t.id];
                  const hasTeams = !!(match?.home && match?.away);

                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })}
                      style={styles.rowCard}
                    >
                      <View style={styles.rowTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {t.cityId || "Trip"}
                          </Text>
                          <Text style={styles.rowMeta} numberOfLines={1}>
                            {formatUkDateRange(t.startDate, t.endDate)} • {matchCount} match{matchCount === 1 ? "" : "es"}
                          </Text>
                        </View>

                        <View style={[styles.statusPill, upcoming ? styles.statusUpcoming : styles.statusPast]}>
                          <Text style={styles.statusText}>{upcoming ? "Upcoming" : "Past"}</Text>
                        </View>
                      </View>

                      <View style={styles.rowDivider} />

                      <View style={styles.rowBottom}>
                        <Text style={styles.matchLine} numberOfLines={1}>
                          {hasTeams ? `${match!.home} vs ${match!.away}` : matchLoading ? "Loading match…" : "Match selected"}
                        </Text>

                        {t.notes?.trim() ? (
                          <Text style={styles.rowNotes} numberOfLines={2}>
                            {t.notes.trim()}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  meta: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  cta: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  ctaText: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: theme.fontSize.sm,
  },

  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  card: { minHeight: 240, padding: theme.spacing.lg },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  primaryBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  list: { gap: 12 },

  rowCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
    padding: 12,
  },

  rowTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  rowTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusUpcoming: {
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  statusPast: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  statusText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  rowDivider: {
    marginTop: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  rowBottom: { marginTop: 10, gap: 6 },
  matchLine: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  rowNotes: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
});
