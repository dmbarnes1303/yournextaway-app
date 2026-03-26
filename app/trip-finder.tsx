import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
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

import { getCityImageUrl } from "@/src/data/cityImages";

type WindowKey = "wknd" | "d14" | "d30";
type FinderMode = "all" | "easy" | "big" | "hidden";

const CURATED_LEAGUE_IDS = new Set<number>([
  39,
  140,
  135,
  78,
  61,
  88,
  94,
  203,
  197,
  179,
  207,
  218,
  119,
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

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function fixtureDateOnly(iso?: string | null): string {
  const value = cleanString(iso);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function inferTripWindowFromKickoff(
  kickoffIso?: string | null
): { from?: string; to?: string } {
  const dateOnly = fixtureDateOnly(kickoffIso);
  if (!dateOnly) return {};

  const start = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const toIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`;

  return {
    from: dateOnly,
    to: toIso,
  };
}

function buildCanonicalTripStartParams(args: {
  fixtureId: string;
  leagueId?: string | number | null;
  season?: string | number | null;
  city?: string | null;
  kickoffIso?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const fallbackWindow = inferTripWindowFromKickoff(args.kickoffIso);

  return {
    fixtureId: cleanString(args.fixtureId),
    ...(cleanString(args.leagueId) ? { leagueId: cleanString(args.leagueId) } : {}),
    ...(cleanString(args.season) ? { season: cleanString(args.season) } : {}),
    ...(cleanString(args.city) ? { city: cleanString(args.city) } : {}),
    ...(cleanString(args.from)
      ? { from: cleanString(args.from) }
      : fallbackWindow.from
        ? { from: fallbackWindow.from }
        : {}),
    ...(cleanString(args.to)
      ? { to: cleanString(args.to) }
      : fallbackWindow.to
        ? { to: fallbackWindow.to }
        : {}),
  };
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

function scoreToneKey(score: number): "elite" | "strong" | "good" | "decent" {
  if (score >= 85) return "elite";
  if (score >= 74) return "strong";
  if (score >= 62) return "good";
  return "decent";
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

function LeagueCrestStrip({
  activeLeagueIds,
}: {
  activeLeagueIds: number[];
}) {
  const leagues = useMemo(() => {
    const filtered = LEAGUES.filter((l) => CURATED_LEAGUE_IDS.has(l.leagueId));
    return filtered.slice(0, 13);
  }, []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.leagueStripRow}
    >
      {leagues.map((league) => {
        const active = activeLeagueIds.includes(league.leagueId);
        const logo = (league as any)?.logo ? String((league as any).logo) : "";

        return (
          <View
            key={league.leagueId}
            style={[
              styles.leagueStripItem,
              active && styles.leagueStripItemActive,
            ]}
          >
            {logo ? (
              <Image
                source={{ uri: logo }}
                style={styles.leagueStripLogo}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.leagueStripFallback}>
                {league.label.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
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
  const topTripImage = useMemo(() => cityImageForTrip(topTrip), [topTrip]);

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
        trip?.fixture?.league?.season != null
          ? String(trip.fixture.league.season)
          : "";
      const city = cleanString(trip?.city || trip?.fixture?.fixture?.venue?.city);
      const kickoffIso = cleanString(trip?.kickoffIso || trip?.fixture?.fixture?.date);

      if (!fixtureId) return;

      const canonicalParams = buildCanonicalTripStartParams({
        fixtureId,
        leagueId: leagueId || undefined,
        season: season || undefined,
        city: city || undefined,
        kickoffIso: kickoffIso || undefined,
        from: windowRange.from,
        to: windowRange.to,
      });

      router.push({
        pathname: "/trip/build",
        params: canonicalParams,
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
          <Button
            label="Back"
            tone="secondary"
            size="sm"
            onPress={() => router.back()}
          />
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.heroBrand}>YOURNEXTAWAY</Text>
              <Text style={styles.heroKicker}>TRIP FINDER</Text>
              <Text style={styles.heroTitle}>Find the best football trips</Text>
              <Text style={styles.heroSub}>
                Ranked by weekend quality, match atmosphere, travel ease and
                overall trip value.
              </Text>

              <LeagueCrestStrip
                activeLeagueIds={fetchLeagues.map((l) => l.leagueId)}
              />

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
                        style={[
                          styles.filterPill,
                          active && styles.filterPillActive,
                        ]}
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
                  ] as [FinderMode, string][]).map(([k, label]) => {
                    const active = mode === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setMode(k)}
                        style={[
                          styles.filterPill,
                          active && styles.filterPillActive,
                        ]}
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
                <Text style={styles.sectionMeta}>
                  {filteredTrips.length} ranked results
                </Text>
              </View>

              <GlassCard strength="strong" style={styles.topCard} noPadding>
                <View style={styles.topImageWrap}>
                  <Image
                    source={{ uri: topTripImage }}
                    style={styles.topImage}
                    resizeMode="cover"
                  />
                  <View style={styles.topImageOverlay} />

                  <View style={styles.topCardInner}>
                    <View style={styles.scoreRow}>
                      <View
                        style={[
                          styles.scoreBadge,
                          scoreToneKey(topTrip.breakdown.combinedScore) === "elite" &&
                            styles.scoreBadgeElite,
                          scoreToneKey(topTrip.breakdown.combinedScore) === "strong" &&
                            styles.scoreBadgeStrong,
                          scoreToneKey(topTrip.breakdown.combinedScore) === "good" &&
                            styles.scoreBadgeGood,
                        ]}
                      >
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
                  const tripImage = cityImageForTrip(trip);

                  return (
                    <GlassCard
                      key={
                        fixtureId ||
                        `${trip.city}-${trip.stadiumName}-${trip.kickoffIso}`
                      }
                      strength="default"
                      style={styles.tripCard}
                      noPadding
                    >
                      <View style={styles.tripCardImageWrap}>
                        <Image
                          source={{ uri: tripImage }}
                          style={styles.tripCardImage}
                          resizeMode="cover"
                        />
                        <View style={styles.tripCardImageOverlay} />

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

  heroBrand: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.2,
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

  leagueStripRow: {
    gap: 10,
    paddingRight: 12,
    paddingVertical: 2,
  },

  leagueStripItem: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.subtle
        : theme.glass.iosBg.subtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  leagueStripItemActive: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.default
        : theme.glass.iosBg.default,
  },

  leagueStripLogo: {
    width: 30,
    height: 30,
    opacity: 0.98,
  },

  leagueStripFallback: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
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
    overflow: "hidden",
  },

  topImageWrap: {
    position: "relative",
    minHeight: 320,
  },

  topImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  topImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,9,11,0.62)",
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

  scoreBadgeElite: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },

  scoreBadgeStrong: {
    borderColor: "rgba(255,210,90,0.24)",
    backgroundColor: "rgba(255,210,90,0.10)",
  },

  scoreBadgeGood: {
    borderColor: "rgba(110,170,255,0.24)",
    backgroundColor: "rgba(110,170,255,0.10)",
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
    color: "rgba(242,244,246,0.82)",
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
    backgroundColor: "rgba(12,14,16,0.18)",
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
    backgroundColor: "rgba(10,12,14,0.18)",
    padding: 12,
    gap: 6,
  },

  reasonHeading: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  reasonText: {
    color: "rgba(242,244,246,0.82)",
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
    overflow: "hidden",
  },

  tripCardImageWrap: {
    position: "relative",
    minHeight: 220,
  },

  tripCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  tripCardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,9,11,0.64)",
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
    backgroundColor: "rgba(255,255,255,0.06)",
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
    color: "rgba(242,244,246,0.82)",
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
    color: "rgba(242,244,246,0.82)",
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
