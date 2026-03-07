// app/trip-finder.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import {
  LEAGUES,
  nextWeekendWindowIso,
  windowFromTomorrowIso,
} from "@/src/constants/football";

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip, TravelDifficulty } from "@/src/features/tripFinder/types";

type WindowKey = "wknd" | "d14" | "d30";
type FinderMode = "all" | "easy" | "big" | "hidden";

const CURATED_LEAGUE_IDS = new Set<number>([
  39, // Premier League
  140, // La Liga
  135, // Serie A
  78, // Bundesliga
  61, // Ligue 1
  88, // Eredivisie
  94, // Primeira Liga
  203, // Turkish Super Lig
  197, // Greek Super League
  179, // Scottish Premiership
  207, // Swiss Super League
  218, // Austrian Bundesliga
  119, // Danish Superliga
]);

const HIDDEN_GEM_CITY_KEYS = new Set<string>([
  "aarhus",
  "bern",
  "basel",
  "bruges",
  "ghent",
  "graz",
  "lausanne",
  "lecce",
  "lens",
  "lugano",
  "lucerne",
  "porto",
  "salzburg",
  "san-sebastian",
  "st-gallen",
  "thun",
  "trabzon",
  "utrecht",
  "verona",
]);

function toKey(input: string) {
  return String(input ?? "").trim().toLowerCase();
}

function labelForWindow(key: WindowKey) {
  if (key === "wknd") return "This Weekend";
  if (key === "d14") return "Next 14 Days";
  return "Next 30 Days";
}

function getWindow(key: WindowKey) {
  if (key === "wknd") return nextWeekendWindowIso();
  if (key === "d14") return windowFromTomorrowIso(14);
  return windowFromTomorrowIso(30);
}

function difficultyLabel(v: TravelDifficulty) {
  if (v === "easy") return "Easy";
  if (v === "moderate") return "Moderate";
  if (v === "hard") return "Hard";
  return "Complex";
}

function scoreTone(score: number) {
  if (score >= 85) return "Elite";
  if (score >= 74) return "Strong";
  if (score >= 62) return "Good";
  return "Decent";
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

function filterTripsByMode(trips: RankedTrip[], mode: FinderMode) {
  if (mode === "all") return trips;

  if (mode === "easy") {
    return trips.filter(
      (t) =>
        t.breakdown.travelDifficulty === "easy" ||
        t.breakdown.travelDifficulty === "moderate"
    );
  }

  if (mode === "big") {
    return trips.filter(
      (t) =>
        t.breakdown.atmosphereScore >= 78 ||
        t.breakdown.matchInterestScore >= 78
    );
  }

  return trips.filter((t) => {
    const city = toKey(t.city);
    if (!city) return false;
    if (HIDDEN_GEM_CITY_KEYS.has(city)) return true;

    return (
      t.breakdown.weekendTripScore >= 70 &&
      t.breakdown.atmosphereScore >= 60 &&
      t.breakdown.combinedScore >= 68
    );
  });
}

export default function TripFinderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const routeWindow = String((params as any)?.window ?? "").trim().toLowerCase();
  const initialWindow: WindowKey =
    routeWindow === "d14" || routeWindow === "d30" || routeWindow === "wknd"
      ? (routeWindow as WindowKey)
      : "wknd";

  const routeMode = String((params as any)?.mode ?? "").trim().toLowerCase();
  const initialMode: FinderMode =
    routeMode === "easy" ||
    routeMode === "big" ||
    routeMode === "hidden" ||
    routeMode === "all"
      ? (routeMode as FinderMode)
      : "all";

  const [windowKey, setWindowKey] = useState<WindowKey>(initialWindow);
  const [mode, setMode] = useState<FinderMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  const windowRange = useMemo(() => getWindow(windowKey), [windowKey]);

  const fetchLeagues = useMemo(() => {
    const list = LEAGUES.filter((l) => CURATED_LEAGUE_IDS.has(l.leagueId));
    return list.length ? list : LEAGUES.slice(0, 10);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRows([]);

      try {
        const batches = await mapLimit(fetchLeagues, 4, async (league) => {
          const res = await getFixtures({
            league: league.leagueId,
            season: league.season,
            from: windowRange.from,
            to: windowRange.to,
          });
          return Array.isArray(res) ? res : [];
        });

        if (cancelled) return;

        const flat = batches.flat().filter((r) => r?.fixture?.id != null);
        setRows(flat);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load trip finder.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchLeagues, windowRange.from, windowRange.to]);

  const rankedTrips = useMemo(() => rankTrips(rows), [rows]);

  const filteredTrips = useMemo(() => {
    const base = filterTripsByMode(rankedTrips, mode);
    return base.slice(0, 30);
  }, [rankedTrips, mode]);

  const topTrip = filteredTrips[0] ?? null;
  const nextTrips = filteredTrips.slice(1, 12);

  const goMatch = useCallback(
    (trip: RankedTrip) => {
      const fixtureId =
        trip?.fixture?.fixture?.id != null ? String(trip.fixture.fixture.id) : "";
      if (!fixtureId) return;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: fixtureId,
          from: windowRange.from,
          to: windowRange.to,
        },
      } as any);
    },
    [router, windowRange.from, windowRange.to]
  );

  const goBuildTrip = useCallback(
    (trip: RankedTrip) => {
      const fixtureId =
        trip?.fixture?.fixture?.id != null ? String(trip.fixture.fixture.id) : "";
      const leagueId =
        trip?.fixture?.league?.id != null ? String(trip.fixture.league.id) : "";
      const season =
        (trip?.fixture as any)?.league?.season != null
          ? String((trip.fixture as any).league.season)
          : "";

      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
          from: windowRange.from,
          to: windowRange.to,
        },
      } as any);
    },
    [router, windowRange.from, windowRange.to]
  );

  const bg = getBackground("home");
  const bgProps =
    typeof bg === "string"
      ? ({ imageUrl: bg } as const)
      : ({ imageSource: bg } as const);

  return (
    <Background {...bgProps} overlayOpacity={0.68}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Button label="Back" tone="secondary" size="sm" onPress={() => router.back()} />
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.heroKicker}>AWAY TRIP FINDER</Text>
              <Text style={styles.heroTitle}>Find the best football trips</Text>
              <Text style={styles.heroSub}>
                Ranked by weekend quality, match atmosphere, travel ease and overall trip value.
              </Text>

              <View style={styles.filterBlock}>
                <Text style={styles.filterLabel}>Date window</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {(["wknd", "d14", "d30"] as WindowKey[]).map((k) => {
                    const active = windowKey === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setWindowKey(k)}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            active && styles.filterPillTextActive,
                          ]}
                        >
                          {labelForWindow(k)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.filterLabel, { marginTop: 4 }]}>Mode</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {([
                    ["all", "All Trips"],
                    ["easy", "Easy Travel"],
                    ["big", "Big Matches"],
                    ["hidden", "Hidden Gems"],
                  ] as Array<[FinderMode, string]>).map(([k, label]) => {
                    const active = mode === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setMode(k)}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            active && styles.filterPillTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </GlassCard>

          {loading ? (
            <GlassCard strength="default" style={styles.sectionCard}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Ranking trips…</Text>
              </View>
            </GlassCard>
          ) : null}

          {!loading && error ? (
            <GlassCard strength="default" style={styles.sectionCard}>
              <EmptyState title="Trip Finder unavailable" message={error} />
            </GlassCard>
          ) : null}

          {!loading && !error && !topTrip ? (
            <GlassCard strength="default" style={styles.sectionCard}>
              <EmptyState
                title="No trips found"
                message="Try a wider date window or switch mode."
              />
            </GlassCard>
          ) : null}

          {!loading && !error && topTrip ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top ranked trip</Text>
                <Text style={styles.sectionMeta}>{filteredTrips.length} ranked results</Text>
              </View>

              <GlassCard strength="strong" style={styles.topCard} noPadding>
                <View style={styles.topCardInner}>
                  <View style={styles.scoreRow}>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>
                        {topTrip.breakdown.combinedScore}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.topTitle}>
                        {String(topTrip.fixture?.teams?.home?.name ?? "Home")} vs{" "}
                        {String(topTrip.fixture?.teams?.away?.name ?? "Away")}
                      </Text>

                      <Text style={styles.topMeta}>
                        {formatUkDateTimeMaybe(topTrip.kickoffIso)} •{" "}
                        {topTrip.stadiumName || "Venue TBC"}
                      </Text>

                      <Text style={styles.topMeta}>
                        {[topTrip.city, topTrip.country].filter(Boolean).join(", ") ||
                          "Location TBC"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricRow}>
                    <View style={styles.metricPill}>
                      <Text style={styles.metricLabel}>Trip</Text>
                      <Text style={styles.metricValue}>
                        {topTrip.breakdown.weekendTripScore}
                      </Text>
                    </View>

                    <View style={styles.metricPill}>
                      <Text style={styles.metricLabel}>Atmosphere</Text>
                      <Text style={styles.metricValue}>
                        {topTrip.breakdown.atmosphereScore}
                      </Text>
                    </View>

                    <View style={styles.metricPill}>
                      <Text style={styles.metricLabel}>Travel</Text>
                      <Text style={styles.metricValue}>
                        {difficultyLabel(topTrip.breakdown.travelDifficulty)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reasonBlock}>
                    <Text style={styles.reasonHeading}>
                      {scoreTone(topTrip.breakdown.combinedScore)} pick
                    </Text>

                    {topTrip.breakdown.reasonLines.map((line, idx) => (
                      <Text key={`${line}-${idx}`} style={styles.reasonText}>
                        • {line}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.actions}>
                    <Button
                      label="View match"
                      tone="secondary"
                      size="md"
                      onPress={() => goMatch(topTrip)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="Build trip"
                      tone="primary"
                      size="md"
                      glow
                      onPress={() => goBuildTrip(topTrip)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              </GlassCard>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>More ranked trips</Text>
                <Text style={styles.sectionMeta}>{labelForWindow(windowKey)}</Text>
              </View>

              <View style={styles.list}>
                {nextTrips.map((trip) => {
                  const fixtureId =
                    trip?.fixture?.fixture?.id != null
                      ? String(trip.fixture.fixture.id)
                      : "";

                  return (
                    <GlassCard
                      key={fixtureId || `${trip.city}-${trip.stadiumName}-${trip.kickoffIso}`}
                      strength="default"
                      style={styles.tripCard}
                      noPadding
                    >
                      <Pressable
                        onPress={() => goMatch(trip)}
                        style={({ pressed }) => [
                          styles.tripCardInner,
                          pressed && { opacity: 0.95 },
                        ]}
                      >
                        <View style={styles.tripTopRow}>
                          <View style={styles.tripScoreMini}>
                            <Text style={styles.tripScoreMiniText}>
                              {trip.breakdown.combinedScore}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.tripTitle} numberOfLines={1}>
                              {String(trip.fixture?.teams?.home?.name ?? "Home")} vs{" "}
                              {String(trip.fixture?.teams?.away?.name ?? "Away")}
                            </Text>

                            <Text style={styles.tripMeta} numberOfLines={1}>
                              {formatUkDateTimeMaybe(trip.kickoffIso)}
                            </Text>

                            <Text style={styles.tripMeta} numberOfLines={1}>
                              {[trip.city, trip.stadiumName].filter(Boolean).join(" • ")}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.tripSubMetrics}>
                          <Text style={styles.tripSubMetric}>
                            Trip {trip.breakdown.weekendTripScore}
                          </Text>
                          <Text style={styles.tripSubMetric}>
                            Atmosphere {trip.breakdown.atmosphereScore}
                          </Text>
                          <Text style={styles.tripSubMetric}>
                            {difficultyLabel(trip.breakdown.travelDifficulty)}
                          </Text>
                        </View>

                        <Text style={styles.tripReason} numberOfLines={2}>
                          {trip.breakdown.reasonLines.join(" • ")}
                        </Text>

                        <View style={styles.tripActions}>
                          <Button
                            label="Match"
                            tone="secondary"
                            size="sm"
                            onPress={() => goMatch(trip)}
                            style={{ flex: 1 }}
                          />
                          <Button
                            label="Trip"
                            tone="primary"
                            size="sm"
                            glow
                            onPress={() => goBuildTrip(trip)}
                            style={{ flex: 1 }}
                          />
                        </View>
                      </Pressable>
                    </GlassCard>
                  );
                })}
              </View>
            </>
          ) : null}
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
    gap: 14,
  },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  hero: {
    borderRadius: 24,
    marginTop: 4,
  },

  heroInner: {
    padding: 16,
    gap: 10,
  },

  heroKicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1,
  },

  heroTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: theme.fontWeight.black,
  },

  heroSub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
  },

  filterBlock: {
    marginTop: 4,
    gap: 6,
  },

  filterLabel: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  filterRow: {
    gap: 8,
    paddingRight: 12,
  },

  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(20,22,26,0.26)",
  },

  filterPillActive: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },

  filterPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  filterPillTextActive: {
    color: theme.colors.text,
  },

  sectionCard: {
    borderRadius: 20,
    padding: 14,
  },

  sectionHeader: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  sectionMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  center: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  topCard: {
    borderRadius: 22,
  },

  topCardInner: {
    padding: 16,
    gap: 14,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  scoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },

  scoreBadgeText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: theme.fontWeight.black,
  },

  topTitle: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
  },

  topMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  metricPill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(12,14,16,0.16)",
    minWidth: 88,
  },

  metricLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  metricValue: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  reasonBlock: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,12,14,0.14)",
    padding: 12,
    gap: 6,
  },

  reasonHeading: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  reasonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  list: {
    gap: 10,
  },

  tripCard: {
    borderRadius: 18,
  },

  tripCardInner: {
    padding: 14,
    gap: 10,
  },

  tripTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  tripScoreMini: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  tripScoreMiniText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  tripTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  tripMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  tripSubMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tripSubMetric: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  tripReason: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  tripActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
});
