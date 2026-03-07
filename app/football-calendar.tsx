// app/football-calendar.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { LEAGUES, windowFromTomorrowIso } from "@/src/constants/football";

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import rankTrips from "@/src/features/tripFinder/rankTrips";
import groupTripsByWeekend from "@/src/features/tripFinder/groupTripsByWeekend";
import type { RankedTrip, WeekendBucket } from "@/src/features/tripFinder/types";

import { getCityImageUrl } from "@/src/data/cityImages";

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

type RangeKey = "d30" | "d60" | "d90";

function labelForRange(key: RangeKey) {
  if (key === "d30") return "Next 30 Days";
  if (key === "d60") return "Next 60 Days";
  return "Next 90 Days";
}

function daysForRange(key: RangeKey) {
  if (key === "d30") return 30;
  if (key === "d60") return 60;
  return 90;
}

function bucketStrengthLabel(bucket: WeekendBucket) {
  if (bucket.avgScore >= 84 || bucket.topScore >= 90) return "Elite weekend";
  if (bucket.avgScore >= 74 || bucket.topScore >= 84) return "Strong weekend";
  if (bucket.avgScore >= 64 || bucket.topScore >= 74) return "Good weekend";
  return "Decent weekend";
}

function difficultyShortLabel(v: RankedTrip["breakdown"]["travelDifficulty"]) {
  if (v === "easy") return "Easy";
  if (v === "moderate") return "Moderate";
  if (v === "hard") return "Hard";
  return "Complex";
}

function bucketToneKey(bucket: WeekendBucket): "elite" | "strong" | "good" | "decent" {
  if (bucket.avgScore >= 84 || bucket.topScore >= 90) return "elite";
  if (bucket.avgScore >= 74 || bucket.topScore >= 84) return "strong";
  if (bucket.avgScore >= 64 || bucket.topScore >= 74) return "good";
  return "decent";
}

function bucketToneStyle(bucket: WeekendBucket) {
  const tone = bucketToneKey(bucket);
  if (tone === "elite") return styles.strengthElite;
  if (tone === "strong") return styles.strengthStrong;
  if (tone === "good") return styles.strengthGood;
  return styles.strengthDecent;
}

function cityImageForTrip(trip?: RankedTrip | null) {
  const city = String(trip?.city ?? "").trim();
  return getCityImageUrl(city || "london");
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

export default function FootballCalendarScreen() {
  const router = useRouter();

  const [rangeKey, setRangeKey] = useState<RangeKey>("d60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  const range = useMemo(() => {
    return windowFromTomorrowIso(daysForRange(rangeKey));
  }, [rangeKey]);

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
            from: range.from,
            to: range.to,
          });
          return Array.isArray(res) ? res : [];
        });

        if (cancelled) return;

        const flat = batches.flat().filter((r) => r?.fixture?.id != null);
        setRows(flat);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load football calendar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchLeagues, range.from, range.to]);

  const rankedTrips = useMemo(() => {
    return rankTrips(rows);
  }, [rows]);

  const weekendBuckets = useMemo(() => {
    const grouped = groupTripsByWeekend(rankedTrips);

    return grouped
      .map((bucket) => ({
        ...bucket,
        trips: bucket.trips.slice(0, 6),
      }))
      .sort((a, b) => {
        if (b.topScore !== a.topScore) return b.topScore - a.topScore;
        if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
        return a.from.localeCompare(b.from);
      })
      .slice(0, 14);
  }, [rankedTrips]);

  const topWeekend = weekendBuckets[0] ?? null;
  const otherWeekends = weekendBuckets.slice(1);

  const topWeekendImage = useMemo(() => cityImageForTrip(topWeekend?.trips?.[0] ?? null), [topWeekend]);

  const goMatch = useCallback(
    (trip: RankedTrip, bucket?: WeekendBucket) => {
      const fixtureId =
        trip?.fixture?.fixture?.id != null ? String(trip.fixture.fixture.id) : "";
      if (!fixtureId) return;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: fixtureId,
          from: bucket?.from ?? range.from,
          to: bucket?.to ?? range.to,
        },
      } as any);
    },
    [router, range.from, range.to]
  );

  const goBuildTrip = useCallback(
    (trip: RankedTrip, bucket?: WeekendBucket) => {
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
          from: bucket?.from ?? range.from,
          to: bucket?.to ?? range.to,
        },
      } as any);
    },
    [router, range.from, range.to]
  );

  const goTripFinder = useCallback(() => {
    router.push({
      pathname: "/trip-finder",
      params: {
        window: rangeKey,
        mode: "all",
      },
    } as any);
  }, [router, rangeKey]);

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
          <Button label="Trip Finder" tone="ghost" size="sm" onPress={goTripFinder} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.heroKicker}>FOOTBALL TRIP CALENDAR</Text>
              <Text style={styles.heroTitle}>Find the strongest football weekends</Text>
              <Text style={styles.heroSub}>
                Ranked by overall trip quality, football atmosphere, travel ease and standout fixtures.
              </Text>

              <View style={styles.filterBlock}>
                <Text style={styles.filterLabel}>Calendar window</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {(["d30", "d60", "d90"] as RangeKey[]).map((key) => {
                    const active = rangeKey === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setRangeKey(key)}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            active && styles.filterPillTextActive,
                          ]}
                        >
                          {labelForRange(key)}
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
                <Text style={styles.muted}>Scanning football weekends…</Text>
              </View>
            </GlassCard>
          ) : null}

          {!loading && error ? (
            <GlassCard strength="default" style={styles.sectionCard}>
              <EmptyState title="Calendar unavailable" message={error} />
            </GlassCard>
          ) : null}

          {!loading && !error && !topWeekend ? (
            <GlassCard strength="default" style={styles.sectionCard}>
              <EmptyState
                title="No football weekends found"
                message="Try widening the calendar range."
              />
            </GlassCard>
          ) : null}

          {!loading && !error && topWeekend ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Best upcoming weekend</Text>
                <Text style={styles.sectionMeta}>{weekendBuckets.length} weekends ranked</Text>
              </View>

              <GlassCard strength="strong" style={styles.featuredCard} noPadding>
                <View style={styles.featuredImageWrap}>
                  <Image source={{ uri: topWeekendImage }} style={styles.featuredImage} resizeMode="cover" />
                  <View style={styles.featuredImageOverlay} />

                  <View style={styles.featuredCardInner}>
                    <View style={styles.featuredTop}>
                      <View style={[styles.strengthBadge, bucketToneStyle(topWeekend)]}>
                        <Text style={styles.strengthBadgeText}>{topWeekend.topScore}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.featuredTitle}>{topWeekend.label}</Text>
                        <Text style={styles.featuredMeta}>
                          {bucketStrengthLabel(topWeekend)} • Avg {topWeekend.avgScore}
                        </Text>
                        <Text style={styles.featuredMeta}>
                          {topWeekend.trips.length} standout trip
                          {topWeekend.trips.length === 1 ? "" : "s"}
                        </Text>
                      </View>
                    </View>

                    {topWeekend.trips.slice(0, 3).map((trip) => {
                      const fixtureId =
                        trip?.fixture?.fixture?.id != null
                          ? String(trip.fixture.fixture.id)
                          : "";

                      return (
                        <Pressable
                          key={`top-${fixtureId}`}
                          onPress={() => goMatch(trip, topWeekend)}
                          style={({ pressed }) => [
                            styles.topWeekendTripRow,
                            pressed && { opacity: 0.95 },
                          ]}
                        >
                          <View style={styles.tripMiniScore}>
                            <Text style={styles.tripMiniScoreText}>
                              {trip.breakdown.combinedScore}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.tripMiniTitle} numberOfLines={1}>
                              {String(trip.fixture?.teams?.home?.name ?? "Home")} vs{" "}
                              {String(trip.fixture?.teams?.away?.name ?? "Away")}
                            </Text>
                            <Text style={styles.tripMiniMeta} numberOfLines={1}>
                              {formatUkDateTimeMaybe(trip.kickoffIso)}
                            </Text>
                            <Text style={styles.tripMiniMeta} numberOfLines={1}>
                              {[trip.city, trip.stadiumName].filter(Boolean).join(" • ")}
                            </Text>
                          </View>

                          <Text style={styles.tripMiniDifficulty}>
                            {difficultyShortLabel(trip.breakdown.travelDifficulty)}
                          </Text>
                        </Pressable>
                      );
                    })}

                    {topWeekend.trips[0] ? (
                      <View style={styles.actions}>
                        <Button
                          label="View best match"
                          tone="secondary"
                          size="md"
                          onPress={() => goMatch(topWeekend.trips[0], topWeekend)}
                          style={{ flex: 1 }}
                        />
                        <Button
                          label="Build trip"
                          tone="primary"
                          size="md"
                          glow
                          onPress={() => goBuildTrip(topWeekend.trips[0], topWeekend)}
                          style={{ flex: 1 }}
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              </GlassCard>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>More football weekends</Text>
                <Text style={styles.sectionMeta}>Ranked by trip quality</Text>
              </View>

              <View style={styles.weekendList}>
                {otherWeekends.map((bucket) => {
                  const bestTrip = bucket.trips[0] ?? null;
                  const bucketImage = cityImageForTrip(bestTrip);

                  return (
                    <GlassCard
                      key={bucket.key}
                      strength="default"
                      style={styles.weekendCard}
                      noPadding
                    >
                      <View style={styles.weekendCardImageWrap}>
                        <Image source={{ uri: bucketImage }} style={styles.weekendCardImage} resizeMode="cover" />
                        <View style={styles.weekendCardImageOverlay} />

                        <View style={styles.weekendCardInner}>
                          <View style={styles.weekendHeaderRow}>
                            <View
                              style={[styles.weekendStrengthPill, bucketToneStyle(bucket)]}
                            >
                              <Text style={styles.weekendStrengthPillText}>
                                {bucket.topScore}
                              </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.weekendTitle}>{bucket.label}</Text>
                              <Text style={styles.weekendMeta}>
                                {bucketStrengthLabel(bucket)} • Avg {bucket.avgScore}
                              </Text>
                            </View>
                          </View>

                          {bucket.trips.slice(0, 3).map((trip) => {
                            const fixtureId =
                              trip?.fixture?.fixture?.id != null
                                ? String(trip.fixture.fixture.id)
                                : "";

                            return (
                              <Pressable
                                key={`${bucket.key}-${fixtureId}`}
                                onPress={() => goMatch(trip, bucket)}
                                style={({ pressed }) => [
                                  styles.weekendTripRow,
                                  pressed && { opacity: 0.95 },
                                ]}
                              >
                                <View style={styles.weekendTripScore}>
                                  <Text style={styles.weekendTripScoreText}>
                                    {trip.breakdown.combinedScore}
                                  </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                  <Text style={styles.weekendTripTitle} numberOfLines={1}>
                                    {String(trip.fixture?.teams?.home?.name ?? "Home")} vs{" "}
                                    {String(trip.fixture?.teams?.away?.name ?? "Away")}
                                  </Text>
                                  <Text style={styles.weekendTripMeta} numberOfLines={1}>
                                    {[
                                      trip.city,
                                      difficultyShortLabel(trip.breakdown.travelDifficulty),
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          })}

                          {bestTrip ? (
                            <View style={styles.weekendActions}>
                              <Button
                                label="Best match"
                                tone="secondary"
                                size="sm"
                                onPress={() => goMatch(bestTrip, bucket)}
                                style={{ flex: 1 }}
                              />
                              <Button
                                label="Trip"
                                tone="primary"
                                size="sm"
                                glow
                                onPress={() => goBuildTrip(bestTrip, bucket)}
                                style={{ flex: 1 }}
                              />
                            </View>
                          ) : null}
                        </View>
                      </View>
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

  featuredCard: {
    borderRadius: 22,
    overflow: "hidden",
  },

  featuredImageWrap: {
    position: "relative",
    minHeight: 320,
  },

  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,9,11,0.62)",
  },

  featuredCardInner: {
    padding: 16,
    gap: 12,
  },

  featuredTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  strengthBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  strengthElite: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: "rgba(79,224,138,0.12)",
  },

  strengthStrong: {
    borderColor: "rgba(255,210,90,0.28)",
    backgroundColor: "rgba(255,210,90,0.10)",
  },

  strengthGood: {
    borderColor: "rgba(110,170,255,0.28)",
    backgroundColor: "rgba(110,170,255,0.10)",
  },

  strengthDecent: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  strengthBadgeText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  featuredTitle: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
  },

  featuredMeta: {
    marginTop: 4,
    color: "rgba(242,244,246,0.82)",
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  topWeekendTripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(12,14,16,0.22)",
  },

  tripMiniScore: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  tripMiniScoreText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  tripMiniTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  tripMiniMeta: {
    marginTop: 3,
    color: "rgba(242,244,246,0.80)",
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  tripMiniDifficulty: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },

  weekendList: {
    gap: 10,
  },

  weekendCard: {
    borderRadius: 18,
    overflow: "hidden",
  },

  weekendCardImageWrap: {
    position: "relative",
    minHeight: 220,
  },

  weekendCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  weekendCardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,9,11,0.64)",
  },

  weekendCardInner: {
    padding: 14,
    gap: 10,
  },

  weekendHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  weekendStrengthPill: {
    minWidth: 42,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
  },

  weekendStrengthPillText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  weekendTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  weekendMeta: {
    marginTop: 4,
    color: "rgba(242,244,246,0.80)",
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  weekendTripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(10,12,14,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  weekendTripScore: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  weekendTripScoreText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  weekendTripTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  weekendTripMeta: {
    marginTop: 4,
    color: "rgba(242,244,246,0.80)",
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  weekendActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
});
