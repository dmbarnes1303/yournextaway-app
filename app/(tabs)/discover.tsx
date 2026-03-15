import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
  LayoutAnimation,
  UIManager,
  Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { type FixtureListRow } from "@/src/services/apiFootball";

import {
  DISCOVER_PRIMARY_CATEGORIES,
  DISCOVER_SECONDARY_CATEGORIES,
  DISCOVER_CATEGORY_META,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";
import {
  buildDiscoverScores,
  type DiscoverTripLength,
  type DiscoverVibe,
} from "@/src/features/discover/discoverEngine";
import { discoverScoreForCategory } from "@/src/features/discover/discoverRanking";
import {
  INSPIRATION_PRESETS,
  PLACEHOLDER_DISCOVER_IMAGE,
  QUICK_SPARKS,
} from "@/src/features/discover/discoverPresets";
import {
  buildMultiMatchTrips,
  categorySeedFromFilters,
  clampVibes,
  comboWhy,
  fetchDiscoverPool,
  fixtureMeta,
  fixtureTitle,
  labelForKey,
  labelForTripLength,
  labelForVibe,
  pickRandom,
  prioritiseCategories,
  rankLabel,
  shortLabelForKey,
  shortLabelForTripLength,
  shortLabelForVibe,
  trendingLabelForFixture,
  trendingScore,
  whyThisFits,
  windowForKey,
} from "@/src/features/discover/discoverUtils";
import type {
  DiscoverWindowKey,
  InspirationPreset,
  MultiMatchTrip,
  QuickSpark,
  RankedDiscoverPick,
} from "@/src/features/discover/types";

import DiscoverCategoryCard from "@/src/features/discover/components/DiscoverCategoryCard";
import DiscoverFixtureCard from "@/src/features/discover/components/DiscoverFixtureCard";
import DiscoverSectionHeader from "@/src/features/discover/components/DiscoverSectionHeader";
import DiscoverTripSetup from "@/src/features/discover/components/DiscoverTripSetup";
import DiscoverHero from "@/src/features/discover/components/DiscoverHero";
import DiscoverQuickSparks from "@/src/features/discover/components/DiscoverQuickSparks";
import DiscoverInspirationRow from "@/src/features/discover/components/DiscoverInspirationRow";
import DiscoverConciergeCard from "@/src/features/discover/components/DiscoverConciergeCard";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function getDiscoverCardImage() {
  return PLACEHOLDER_DISCOVER_IMAGE;
}

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("d30");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverOrigin, setDiscoverOrigin] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [setupExpanded, setSetupExpanded] = useState(false);

  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveRows, setLiveRows] = useState<FixtureListRow[]>([]);

  const toggleSetup = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSetupExpanded((prev) => !prev);
  }, []);

  const toggleVibe = useCallback((vibe: DiscoverVibe) => {
    setDiscoverVibes((prev) => {
      const has = prev.includes(vibe);
      const next = has ? prev.filter((value) => value !== vibe) : [...prev, vibe];
      return clampVibes(next);
    });
  }, []);

  const resetFilters = useCallback(() => {
    setDiscoverWindowKey("d30");
    setDiscoverTripLength("2");
    setDiscoverVibes(["easy"]);
    setDiscoverOrigin("");
  }, []);

  const currentWindow = useMemo(
    () => windowForKey(discoverWindowKey),
    [discoverWindowKey]
  );

  const seededCategory = useMemo(
    () =>
      categorySeedFromFilters({
        vibes: discoverVibes,
        windowKey: discoverWindowKey,
        tripLength: discoverTripLength,
      }),
    [discoverVibes, discoverWindowKey, discoverTripLength]
  );

  const prioritisedPrimaryCategories = useMemo(
    () => prioritiseCategories(DISCOVER_PRIMARY_CATEGORIES, seededCategory),
    [seededCategory]
  );

  const prioritisedSecondaryCategories = useMemo(() => {
    const primarySet = new Set(prioritisedPrimaryCategories);
    return prioritiseCategories(
      DISCOVER_SECONDARY_CATEGORIES.filter((category) => !primarySet.has(category)),
      seededCategory
    );
  }, [prioritisedPrimaryCategories, seededCategory]);

  const leadCategory = prioritisedPrimaryCategories[0];
  const remainingPrimaryCategories = prioritisedPrimaryCategories.slice(1);

  const filterSummary = useMemo(() => {
    const parts = [
      labelForKey(discoverWindowKey),
      labelForTripLength(discoverTripLength),
      discoverVibes.length ? discoverVibes.map(labelForVibe).join(" • ") : "Any vibe",
    ];

    if (discoverOrigin.trim()) parts.push(`From ${discoverOrigin.trim()}`);

    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, discoverOrigin]);

  const compactSummary = useMemo(() => {
    const parts = [
      shortLabelForKey(discoverWindowKey),
      shortLabelForTripLength(discoverTripLength),
      discoverVibes.length
        ? discoverVibes.map(shortLabelForVibe).join(" + ")
        : "Any vibe",
    ];

    if (discoverOrigin.trim()) parts.push(discoverOrigin.trim());

    return parts.join(" • ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, discoverOrigin]);

  const browseModeLabel = useMemo(() => {
    const meta = DISCOVER_CATEGORY_META[seededCategory];
    return meta?.title ?? "Best-fit routes";
  }, [seededCategory]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingLive(true);
      setLiveError(null);

      try {
        const pool = await fetchDiscoverPool({
          window: currentWindow,
          windowKey: discoverWindowKey,
          origin: discoverOrigin,
          tripLength: discoverTripLength,
          vibes: discoverVibes,
          category: seededCategory,
        });

        if (cancelled) return;
        setLiveRows(pool);
      } catch (e: any) {
        if (cancelled) return;
        setLiveRows([]);
        setLiveError(e?.message ?? "Failed to load live route previews.");
      } finally {
        if (!cancelled) setLoadingLive(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    currentWindow.from,
    currentWindow.to,
    discoverWindowKey,
    discoverOrigin,
    discoverTripLength,
    discoverVibes,
    seededCategory,
  ]);

  const rankedLive = useMemo<RankedDiscoverPick[]>(() => {
    if (!liveRows.length) return [];

    const scored = buildDiscoverScores(liveRows);

    return scored
      .map((item) => ({
        item,
        score: discoverScoreForCategory(seededCategory, item, {
          origin: discoverOrigin.trim() || null,
          tripLength: discoverTripLength,
          vibes: discoverVibes,
        }),
      }))
      .sort((a, b) => b.score - a.score);
  }, [liveRows, seededCategory, discoverOrigin, discoverTripLength, discoverVibes]);

  const featuredLive = useMemo(() => rankedLive[0] ?? null, [rankedLive]);
  const previewLive = useMemo(() => rankedLive.slice(0, 6), [rankedLive]);

  const trendingTrips = useMemo(() => {
    return [...rankedLive]
      .sort((a, b) => {
        const aRow = a.item.fixture;
        const bRow = b.item.fixture;
        return trendingScore(bRow, b.score) - trendingScore(aRow, a.score);
      })
      .slice(0, 6);
  }, [rankedLive]);

  const multiMatchTrips = useMemo(
    () =>
      buildMultiMatchTrips(rankedLive, {
        vibes: discoverVibes,
        tripLength: discoverTripLength,
        windowKey: discoverWindowKey,
      }),
    [rankedLive, discoverVibes, discoverTripLength, discoverWindowKey]
  );

  const goFixturesCategory = useCallback(
    (category: DiscoverCategory) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: currentWindow.from,
          to: currentWindow.to,
          discover: category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
        },
      } as any);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      discoverOrigin,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const goMatchFromRow = useCallback(
    (row: FixtureListRow | null | undefined) => {
      const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : null;
      const leagueId = row?.league?.id != null ? String(row.league.id) : null;
      const season =
        (row as any)?.league?.season != null ? String((row as any).league.season) : null;

      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          fixtureId,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
          from: currentWindow.from,
          to: currentWindow.to,
          prefMode: "discover",
          prefFrom: discoverOrigin.trim() ? discoverOrigin.trim() : undefined,
          prefWindow: discoverWindowKey,
          prefLength: discoverTripLength,
          prefVibes: discoverVibes.join(","),
        },
      } as any);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      discoverOrigin,
      discoverWindowKey,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const goMultiMatchTrip = useCallback(
    (trip: MultiMatchTrip) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: trip.from,
          to: trip.to,
          discover: discoverWindowKey === "wknd" ? "weekendTrips" : "multiMatchTrips",
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
          comboMode: "1",
          comboTitle: trip.title,
          comboIds: trip.fixtureIds.join(","),
        },
      } as any);
    },
    [router, discoverOrigin, discoverTripLength, discoverVibes, discoverWindowKey]
  );

  const applyPreset = useCallback(
    (preset: InspirationPreset) => {
      const nextWindowKey = preset.windowKey ?? discoverWindowKey;
      const nextTripLength = preset.tripLength ?? discoverTripLength;
      const nextVibes = preset.vibe ? [preset.vibe] : discoverVibes;

      if (preset.windowKey) setDiscoverWindowKey(preset.windowKey);
      if (preset.tripLength) setDiscoverTripLength(preset.tripLength);
      if (preset.vibe) setDiscoverVibes([preset.vibe]);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: windowForKey(nextWindowKey).from,
          to: windowForKey(nextWindowKey).to,
          discover: preset.category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibes.join(","),
        },
      } as any);
    },
    [router, discoverWindowKey, discoverOrigin, discoverTripLength, discoverVibes]
  );

  const applyQuickSpark = useCallback(
    (spark: QuickSpark) => {
      const nextWindowKey = spark.windowKey ?? discoverWindowKey;
      const nextTripLength = spark.tripLength ?? discoverTripLength;
      const nextVibes = spark.vibe ? [spark.vibe] : discoverVibes;

      if (spark.windowKey) setDiscoverWindowKey(spark.windowKey);
      if (spark.tripLength) setDiscoverTripLength(spark.tripLength);
      if (spark.vibe) setDiscoverVibes([spark.vibe]);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: windowForKey(nextWindowKey).from,
          to: windowForKey(nextWindowKey).to,
          discover: spark.category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength: nextTripLength,
          discoverVibes: nextVibes.join(","),
        },
      } as any);
    },
    [router, discoverWindowKey, discoverOrigin, discoverTripLength, discoverVibes]
  );

  const goRandomTrip = useCallback(async () => {
    if (loadingRandom) return;

    setLoadingRandom(true);

    try {
      if (!liveRows.length) return;

      const scored = buildDiscoverScores(liveRows);

      const ranked: RankedDiscoverPick[] = scored
        .map((item) => ({
          item,
          score: discoverScoreForCategory(seededCategory, item, {
            origin: discoverOrigin.trim() || null,
            tripLength: discoverTripLength,
            vibes: discoverVibes,
          }),
        }))
        .sort((a, b) => b.score - a.score);

      const poolTop = ranked.slice(0, Math.min(12, ranked.length));
      const chosen = pickRandom(poolTop);
      const row = chosen?.item?.fixture ?? null;

      const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : null;
      const leagueId = row?.league?.id != null ? String(row.league.id) : null;
      const season =
        (row as any)?.league?.season != null
          ? String((row as any).league.season)
          : null;

      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          fixtureId,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
          from: currentWindow.from,
          to: currentWindow.to,
          prefMode: "random",
          prefFrom: discoverOrigin.trim() ? discoverOrigin.trim() : undefined,
          prefWindow: discoverWindowKey,
          prefLength: discoverTripLength,
          prefVibes: discoverVibes.join(","),
        },
      } as any);
    } finally {
      setLoadingRandom(false);
    }
  }, [
    loadingRandom,
    liveRows,
    seededCategory,
    discoverOrigin,
    discoverTripLength,
    discoverVibes,
    router,
    currentWindow.from,
    currentWindow.to,
    discoverWindowKey,
  ]);

  return (
    <Background
      imageSource={getBackground("explore")}
      overlayOpacity={0.04}
      topShadeOpacity={0.3}
      bottomShadeOpacity={0.36}
      centerShadeOpacity={0.03}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <DiscoverHero
            compactSummary={compactSummary}
            setupExpanded={setupExpanded}
            onToggleSetup={toggleSetup}
            featuredTitle={featuredLive ? fixtureTitle(featuredLive.item.fixture) : null}
            featuredMeta={featuredLive ? fixtureMeta(featuredLive.item.fixture) : null}
            featuredWhy={
              featuredLive
                ? whyThisFits(
                    featuredLive.item.fixture,
                    seededCategory,
                    discoverVibes,
                    discoverTripLength
                  )
                : null
            }
            featuredIcon={DISCOVER_CATEGORY_META[seededCategory].icon}
            onPressFeatured={
              featuredLive ? () => goMatchFromRow(featuredLive.item.fixture) : undefined
            }
          />

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="Explore now"
              subtitle="Fast entry points so the screen feels alive straight away."
            />
            <DiscoverQuickSparks sparks={QUICK_SPARKS} onPressSpark={applyQuickSpark} />
          </View>

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="Multi-match trips"
              subtitle="Stack more than one match into the same trip."
            />

            {loadingLive ? (
              <GlassCard strength="default" style={styles.loadingCard}>
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Building multi-match routes…</Text>
                </View>
              </GlassCard>
            ) : null}

            {!loadingLive && !liveError && multiMatchTrips.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.multiRow}
              >
                {multiMatchTrips.map((trip, index) => (
                  <Pressable
                    key={trip.id}
                    onPress={() => goMultiMatchTrip(trip)}
                    style={({ pressed }) => [styles.multiPress, pressed && styles.pressed]}
                  >
                    <GlassCard strength="default" style={styles.multiCard} noPadding>
                      <View style={styles.multiImageWrap}>
                        <Image
                          source={{ uri: getDiscoverCardImage() }}
                          style={styles.multiImage}
                          resizeMode="cover"
                        />
                        <View style={styles.multiOverlay} />

                        <View style={styles.multiTopBar}>
                          <View style={styles.multiRankPill}>
                            <Text style={styles.multiRankText}>
                              {index === 0 ? "Best combo" : `${trip.matchCount} matches`}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.multiBody}>
                        <Text style={styles.multiTitle} numberOfLines={2}>
                          {trip.title}
                        </Text>

                        <Text style={styles.multiSubline} numberOfLines={1}>
                          {trip.subtitle}
                        </Text>

                        <Text style={styles.multiWhy} numberOfLines={2}>
                          {comboWhy(trip)}
                        </Text>

                        <View style={styles.multiLabelRow}>
                          {trip.labels.slice(0, 3).map((label) => (
                            <View key={`${trip.id}-${label}`} style={styles.multiLabelPill}>
                              <Text style={styles.multiLabelText}>{label}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.multiMatchList}>
                          {trip.rows.slice(0, 2).map((row, rowIndex) => (
                            <Text
                              key={`${trip.id}-${String(row?.fixture?.id ?? rowIndex)}`}
                              style={styles.multiMatchLine}
                              numberOfLines={1}
                            >
                              {`${rowIndex + 1}. ${fixtureTitle(row)}`}
                            </Text>
                          ))}
                        </View>

                        <View style={styles.multiFooter}>
                          <Text style={styles.multiFooterText}>
                            {`${trip.matchCount} matches in ${trip.daysSpan} days`}
                          </Text>
                          <Text style={styles.multiFooterArrow}>›</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {!loadingLive && !liveError && multiMatchTrips.length === 0 ? (
              <GlassCard strength="default" style={styles.noComboCard}>
                <Text style={styles.noComboTitle}>No strong combos yet</Text>
                <Text style={styles.noComboText}>
                  Widen the date window or ease the vibe filters and the app will surface stacked trips.
                </Text>
              </GlassCard>
            ) : null}
          </View>

          <DiscoverTripSetup
            setupExpanded={setupExpanded}
            onToggleSetup={toggleSetup}
            onReset={resetFilters}
            browseModeLabel={browseModeLabel}
            filterSummary={filterSummary}
            discoverOrigin={discoverOrigin}
            setDiscoverOrigin={setDiscoverOrigin}
            discoverWindowKey={discoverWindowKey}
            setDiscoverWindowKey={setDiscoverWindowKey}
            discoverTripLength={discoverTripLength}
            setDiscoverTripLength={setDiscoverTripLength}
            discoverVibes={discoverVibes}
            onToggleVibe={toggleVibe}
          />

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="Live now"
              subtitle="Strong current options based on your setup, not generic filler."
            />

            {loadingLive ? (
              <GlassCard strength="default" style={styles.loadingCard}>
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Loading live route previews…</Text>
                </View>
              </GlassCard>
            ) : null}

            {!loadingLive && liveError ? (
              <EmptyState title="Live previews unavailable" message={liveError} />
            ) : null}

            {!loadingLive && !liveError && previewLive.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.liveRow}
              >
                {previewLive.map((entry, index) => (
                  <DiscoverFixtureCard
                    key={String(entry.item.fixture?.fixture?.id ?? index)}
                    variant="live"
                    title={fixtureTitle(entry.item.fixture)}
                    meta={fixtureMeta(entry.item.fixture)}
                    subtitle={whyThisFits(
                      entry.item.fixture,
                      seededCategory,
                      discoverVibes,
                      discoverTripLength
                    )}
                    badge={rankLabel(index)}
                    onPress={() => goMatchFromRow(entry.item.fixture)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="Trending football trips"
              subtitle="Big fixtures and city pulls people would actually travel for."
            />

            {loadingLive ? (
              <GlassCard strength="default" style={styles.loadingCard}>
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Finding trending trips…</Text>
                </View>
              </GlassCard>
            ) : null}

            {!loadingLive && !liveError && trendingTrips.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingRow}
              >
                {trendingTrips.map((entry, index) => (
                  <DiscoverFixtureCard
                    key={`trend-${String(entry.item.fixture?.fixture?.id ?? index)}`}
                    variant="trending"
                    title={fixtureTitle(entry.item.fixture)}
                    subtitle={trendingLabelForFixture(entry.item.fixture)}
                    meta={fixtureMeta(entry.item.fixture)}
                    badge="🔥 Trending"
                    onPress={() => goMatchFromRow(entry.item.fixture)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="Start with a mood"
              subtitle="Fast entry points for the kind of trip that already sounds good."
            />
            <DiscoverInspirationRow
              presets={INSPIRATION_PRESETS}
              onPressPreset={applyPreset}
            />
          </View>

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="Best fit right now"
              subtitle={`Based on your current setup, ${browseModeLabel} is the best place to start.`}
            />

            {!featuredLive && leadCategory ? (
              <DiscoverCategoryCard
                category={leadCategory}
                compact={false}
                onPress={goFixturesCategory}
              />
            ) : null}

            <View style={styles.primaryGrid}>
              {remainingPrimaryCategories.map((category) => (
                <DiscoverCategoryCard
                  key={category}
                  category={category}
                  compact={false}
                  onPress={goFixturesCategory}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="More ways to browse"
              subtitle="Narrower angles when you want city pull, atmosphere, or more specific trip types."
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryRow}
            >
              {prioritisedSecondaryCategories.map((category) => (
                <DiscoverCategoryCard
                  key={category}
                  category={category}
                  compact
                  onPress={goFixturesCategory}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="Concierge pick"
              subtitle="Give the app your setup and let it surface one of the stronger live options."
            />
            <DiscoverConciergeCard
              loading={loadingRandom}
              filterSummary={filterSummary}
              onPress={goRandomTrip}
            />
          </View>
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
    gap: 16,
  },

  section: {
    gap: 10,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },

  loadingCard: {
    borderRadius: 20,
    padding: 6,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  multiRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  multiPress: {
    width: 292,
    borderRadius: 22,
    overflow: "hidden",
  },

  multiCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.16)",
  },

  multiImageWrap: {
    height: 126,
    position: "relative",
  },

  multiImage: {
    width: "100%",
    height: "100%",
  },

  multiOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.38)",
  },

  multiTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  multiRankPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(6,10,8,0.64)",
  },

  multiRankText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  multiBody: {
    padding: 14,
    gap: 8,
    minHeight: 184,
  },

  multiTitle: {
    color: theme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: theme.fontWeight.black,
  },

  multiSubline: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  multiWhy: {
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
  },

  multiLabelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  multiLabelPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  multiLabelText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  multiMatchList: {
    gap: 4,
    marginTop: 2,
  },

  multiMatchLine: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  multiFooter: {
    marginTop: "auto",
    paddingTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  multiFooterText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  multiFooterArrow: {
    color: theme.colors.textTertiary,
    fontSize: 22,
    marginTop: -2,
  },

  noComboCard: {
    borderRadius: 20,
    padding: 16,
  },

  noComboTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  noComboText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  liveRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  trendingRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  primaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },

  secondaryRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
