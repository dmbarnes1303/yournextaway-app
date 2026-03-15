import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  LayoutAnimation,
  UIManager,
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
  isEuropeanCompetition,
  isLateKickoff,
  isMidweekFixture,
  isWeekendFixture,
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

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function getDiscoverCardImage() {
  return PLACEHOLDER_DISCOVER_IMAGE;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeaderStack}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  );
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
    [
      router,
      discoverWindowKey,
      discoverOrigin,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const goRandomTrip = useCallback(async () => {
    if (loadingRandom) return;

    setLoadingRandom(true);

    try {
      const window = windowForKey(discoverWindowKey);

      const pool = await fetchDiscoverPool({
        window,
        windowKey: discoverWindowKey,
        origin: discoverOrigin,
        tripLength: discoverTripLength,
        vibes: discoverVibes,
        category: seededCategory,
      });

      if (!pool.length) return;

      const scored = buildDiscoverScores(pool);

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
      const fixture = chosen?.item?.fixture ?? null;

      const fixtureId =
        fixture?.fixture?.id != null ? String(fixture.fixture.id) : null;
      const leagueId =
        fixture?.league?.id != null ? String(fixture.league.id) : null;
      const season =
        (fixture as any)?.league?.season != null
          ? String((fixture as any).league.season)
          : null;

      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          fixtureId,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
          from: window.from,
          to: window.to,
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
    discoverWindowKey,
    discoverOrigin,
    discoverTripLength,
    discoverVibes,
    seededCategory,
    router,
  ]);

  const renderCategoryCard = useCallback(
    (category: DiscoverCategory, compact = false) => {
      const meta = DISCOVER_CATEGORY_META[category];
      const primary = meta.emphasis === "primary";

      return (
        <Pressable
          key={category}
          onPress={() => goFixturesCategory(category)}
          style={({ pressed }) => [
            compact ? styles.categoryPressCompact : styles.categoryPress,
            pressed && styles.pressed,
          ]}
        >
          <GlassCard
            strength="default"
            style={[
              compact ? styles.categoryCardCompact : styles.categoryCard,
              primary && !compact ? styles.categoryCardPrimary : null,
            ]}
            noPadding
          >
            <View style={styles.categoryImageWrap}>
              <Image
                source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
                style={styles.categoryImage}
                resizeMode="cover"
              />
              <View style={styles.categoryImageOverlay} />
              <View style={styles.categoryEyebrowPill}>
                <Text style={styles.categoryEyebrowText}>
                  {compact ? "Browse" : "Discover"}
                </Text>
              </View>
            </View>

            <View style={compact ? styles.categoryInnerCompact : styles.categoryInner}>
              <View style={styles.categoryTopRow}>
                <View
                  style={[
                    styles.categoryIconWrap,
                    primary && !compact ? styles.categoryIconWrapPrimary : null,
                  ]}
                >
                  <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
                </View>
              </View>

              <View style={styles.categoryTextWrap}>
                <Text style={styles.categoryTitle}>{meta.title}</Text>
                <Text style={styles.categorySubtitle}>{meta.subtitle}</Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      );
    },
    [goFixturesCategory]
  );

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
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>DISCOVER</Text>
              <Text style={styles.title}>Find your next football trip</Text>
              <Text style={styles.sub}>
                Big atmospheres, city breaks, European nights, and stacked football weekends.
              </Text>

              {featuredLive ? (
                <Pressable
                  onPress={() => goMatchFromRow(featuredLive.item.fixture)}
                  style={({ pressed }) => [styles.heroFeaturePress, pressed && styles.pressed]}
                >
                  <View style={styles.heroFeatureImageWrap}>
                    <Image
                      source={{ uri: getDiscoverCardImage() }}
                      style={styles.heroFeatureImage}
                      resizeMode="cover"
                    />
                    <View style={styles.heroFeatureOverlay} />
                    <View style={styles.heroFeatureBadge}>
                      <Text style={styles.heroFeatureBadgeText}>Top pick for your setup</Text>
                    </View>
                  </View>

                  <View style={styles.heroFeatureBody}>
                    <View style={styles.heroFeatureTopRow}>
                      <View style={styles.heroFeatureIconWrap}>
                        <Ionicons
                          name={DISCOVER_CATEGORY_META[seededCategory].icon}
                          size={18}
                          color={theme.colors.text}
                        />
                      </View>
                      <Text style={styles.heroFeatureCtaInline}>Open route</Text>
                    </View>

                    <Text style={styles.heroFeatureTitle} numberOfLines={2}>
                      {fixtureTitle(featuredLive.item.fixture)}
                    </Text>

                    <Text style={styles.heroFeatureMeta} numberOfLines={2}>
                      {fixtureMeta(featuredLive.item.fixture)}
                    </Text>

                    <Text style={styles.heroFeatureWhy} numberOfLines={2}>
                      {whyThisFits(
                        featuredLive.item.fixture,
                        seededCategory,
                        discoverVibes,
                        discoverTripLength
                      )}
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              <Pressable onPress={toggleSetup} style={styles.heroActionRow}>
                <View style={styles.heroActionPill}>
                  <Ionicons
                    name={setupExpanded ? "chevron-up-outline" : "options-outline"}
                    size={16}
                    color={theme.colors.text}
                  />
                  <Text style={styles.heroActionText}>
                    {setupExpanded ? "Hide trip setup" : "Edit trip setup"}
                  </Text>
                </View>

                <View style={styles.heroMiniSummary}>
                  <Text style={styles.heroMiniSummaryText}>{compactSummary}</Text>
                </View>
              </Pressable>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <SectionHeader
              title="Explore now"
              subtitle="Fast entry points so the screen feels alive straight away."
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sparkRow}
            >
              {QUICK_SPARKS.map((spark) => (
                <Pressable
                  key={spark.id}
                  onPress={() => applyQuickSpark(spark)}
                  style={({ pressed }) => [styles.sparkPress, pressed && styles.pressed]}
                >
                  <GlassCard strength="default" style={styles.sparkCard} noPadding>
                    <View style={styles.sparkInner}>
                      <View style={styles.sparkIconWrap}>
                        <Ionicons name={spark.icon} size={17} color={theme.colors.text} />
                      </View>
                      <Text style={styles.sparkTitle}>{spark.title}</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Trip setup</Text>
                <Text style={styles.sectionSub}>
                  Edit your setup here, then let discovery rank the right routes.
                </Text>
              </View>

              <View style={styles.setupHeaderActions}>
                <Pressable onPress={resetFilters} style={styles.resetPill}>
                  <Text style={styles.resetPillText}>Reset</Text>
                </Pressable>

                <Pressable onPress={toggleSetup} style={styles.collapsePill}>
                  <Ionicons
                    name={setupExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {!setupExpanded ? (
              <Pressable onPress={toggleSetup} style={({ pressed }) => [pressed && styles.pressed]}>
                <GlassCard strength="default" style={styles.setupCollapsedCard} noPadding>
                  <View style={styles.setupCollapsedInner}>
                    <View style={styles.setupCollapsedTop}>
                      <View style={styles.setupCollapsedBadge}>
                        <Text style={styles.setupCollapsedBadgeText}>{browseModeLabel}</Text>
                      </View>
                      <Text style={styles.setupCollapsedLink}>Open</Text>
                    </View>

                    <Text style={styles.setupCollapsedSummary}>{filterSummary}</Text>

                    <View style={styles.setupCollapsedChips}>
                      <View style={styles.setupTinyChip}>
                        <Text style={styles.setupTinyChipText}>
                          {shortLabelForKey(discoverWindowKey)}
                        </Text>
                      </View>
                      <View style={styles.setupTinyChip}>
                        <Text style={styles.setupTinyChipText}>
                          {shortLabelForTripLength(discoverTripLength)}
                        </Text>
                      </View>
                      {discoverVibes.slice(0, 2).map((vibe) => (
                        <View key={vibe} style={styles.setupTinyChip}>
                          <Text style={styles.setupTinyChipText}>
                            {shortLabelForVibe(vibe)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ) : (
              <GlassCard strength="default" style={styles.panel} noPadding>
                <View style={styles.panelInner}>
                  <View style={styles.inputBlock}>
                    <Text style={styles.label}>Flying from</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons
                        name="airplane-outline"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                      <TextInput
                        value={discoverOrigin}
                        onChangeText={setDiscoverOrigin}
                        placeholder="Optional: London, LGW, MAN"
                        placeholderTextColor={theme.colors.textTertiary}
                        style={styles.input}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <Text style={styles.label}>Date window</Text>
                    <View style={styles.chipsRow}>
                      {(["wknd", "d7", "d14", "d30", "d60", "d90"] as DiscoverWindowKey[]).map(
                        (key) => (
                          <FilterChip
                            key={key}
                            label={shortLabelForKey(key)}
                            active={discoverWindowKey === key}
                            onPress={() => setDiscoverWindowKey(key)}
                          />
                        )
                      )}
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <Text style={styles.label}>Trip length</Text>
                    <View style={styles.chipsRow}>
                      {(["day", "1", "2", "3"] as DiscoverTripLength[]).map((length) => (
                        <FilterChip
                          key={length}
                          label={labelForTripLength(length)}
                          active={discoverTripLength === length}
                          onPress={() => setDiscoverTripLength(length)}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <View style={styles.inlineLabelRow}>
                      <Text style={styles.label}>Vibe</Text>
                      <Text style={styles.labelHint}>Pick up to 3</Text>
                    </View>

                    <View style={styles.chipsRow}>
                      {(["easy", "big", "nightlife", "culture", "warm"] as DiscoverVibe[]).map(
                        (vibe) => (
                          <FilterChip
                            key={vibe}
                            label={labelForVibe(vibe)}
                            active={discoverVibes.includes(vibe)}
                            onPress={() => toggleVibe(vibe)}
                          />
                        )
                      )}
                    </View>
                  </View>

                  <View style={styles.setupSummaryRow}>
                    <View style={styles.setupSummaryPill}>
                      <Text style={styles.setupSummaryPillText}>{browseModeLabel}</Text>
                    </View>
                    <Text style={styles.setupSummaryText}>{filterSummary}</Text>
                  </View>
                </View>
              </GlassCard>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
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
                {previewLive.map((entry, index) => {
                  const row = entry.item.fixture;

                  return (
                    <Pressable
                      key={String(row?.fixture?.id ?? index)}
                      onPress={() => goMatchFromRow(row)}
                      style={({ pressed }) => [styles.livePress, pressed && styles.pressed]}
                    >
                      <GlassCard strength="default" style={styles.liveCard} noPadding>
                        <View style={styles.liveImageWrap}>
                          <Image
                            source={{ uri: getDiscoverCardImage() }}
                            style={styles.liveImage}
                            resizeMode="cover"
                          />
                          <View style={styles.liveImageOverlay} />
                          <View style={styles.liveTopBar}>
                            <View style={styles.liveRankPill}>
                              <Text style={styles.liveRankText}>{rankLabel(index)}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.liveBody}>
                          <Text style={styles.liveTitle} numberOfLines={2}>
                            {fixtureTitle(row)}
                          </Text>
                          <Text style={styles.liveMeta} numberOfLines={2}>
                            {fixtureMeta(row)}
                          </Text>
                          <Text style={styles.liveWhy} numberOfLines={2}>
                            {whyThisFits(row, seededCategory, discoverVibes, discoverTripLength)}
                          </Text>
                        </View>
                      </GlassCard>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionHeader
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
                {trendingTrips.map((entry, index) => {
                  const row = entry.item.fixture;

                  return (
                    <Pressable
                      key={`trend-${String(row?.fixture?.id ?? index)}`}
                      onPress={() => goMatchFromRow(row)}
                      style={({ pressed }) => [styles.trendingPress, pressed && styles.pressed]}
                    >
                      <GlassCard strength="default" style={styles.trendingCard} noPadding>
                        <View style={styles.trendingImageWrap}>
                          <Image
                            source={{ uri: getDiscoverCardImage() }}
                            style={styles.trendingImage}
                            resizeMode="cover"
                          />
                          <View style={styles.trendingOverlay} />
                          <View style={styles.trendingTopBar}>
                            <View style={styles.trendingHotPill}>
                              <Text style={styles.trendingHotText}>🔥 Trending</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.trendingBody}>
                          <Text style={styles.trendingTitle} numberOfLines={2}>
                            {fixtureTitle(row)}
                          </Text>
                          <Text style={styles.trendingLabel} numberOfLines={1}>
                            {trendingLabelForFixture(row)}
                          </Text>
                          <Text style={styles.trendingMeta} numberOfLines={2}>
                            {fixtureMeta(row)}
                          </Text>
                        </View>
                      </GlassCard>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Start with a mood"
              subtitle="Fast entry points for the kind of trip that already sounds good."
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inspirationRow}
            >
              {INSPIRATION_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => applyPreset(preset)}
                  style={({ pressed }) => [styles.inspirationPress, pressed && styles.pressed]}
                >
                  <GlassCard strength="default" style={styles.inspirationCard} noPadding>
                    <View style={styles.inspirationInner}>
                      <View style={styles.inspirationIconWrap}>
                        <Ionicons name={preset.icon} size={18} color={theme.colors.text} />
                      </View>

                      <View style={styles.inspirationTextWrap}>
                        <Text style={styles.inspirationTitle}>{preset.title}</Text>
                        <Text style={styles.inspirationSub}>{preset.subtitle}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Best fit right now"
              subtitle={`Based on your current setup, ${browseModeLabel} is the best place to start.`}
            />

            {!featuredLive && leadCategory ? renderCategoryCard(leadCategory) : null}

            <View style={styles.primaryGrid}>
              {remainingPrimaryCategories.map((category) => renderCategoryCard(category))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="More ways to browse"
              subtitle="Narrower angles when you want city pull, atmosphere, or more specific trip types."
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryRow}
            >
              {prioritisedSecondaryCategories.map((category) =>
                renderCategoryCard(category, true)
              )}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Concierge pick"
              subtitle="Give the app your setup and let it surface one of the stronger live options."
            />

            <Pressable
              onPress={goRandomTrip}
              disabled={loadingRandom}
              style={({ pressed }) => [
                styles.randomPress,
                (pressed || loadingRandom) && styles.pressed,
              ]}
            >
              <GlassCard strength="default" style={styles.randomCard} noPadding>
                <View style={styles.randomInner}>
                  <View style={styles.randomTop}>
                    <View style={styles.randomTopText}>
                      <Text style={styles.randomTitle}>Let the app choose</Text>
                      <Text style={styles.randomSub}>
                        We rank a live pool against your setup before making the pick.
                      </Text>
                    </View>

                    <View style={styles.randomIconWrap}>
                      {loadingRandom ? (
                        <ActivityIndicator />
                      ) : (
                        <Ionicons
                          name="sparkles-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                      )}
                    </View>
                  </View>

                  <View style={styles.randomSummaryBox}>
                    <Text style={styles.randomSummaryLabel}>Using</Text>
                    <Text style={styles.randomHint}>{filterSummary}</Text>
                  </View>

                  <View style={styles.randomButton}>
                    <Text style={styles.randomButtonText}>
                      {loadingRandom ? "Finding a strong option..." : "Pick a trip for me"}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
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

  hero: {
    marginTop: theme.spacing.lg,
    borderRadius: 24,
  },

  heroInner: {
    padding: 15,
    gap: 10,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.1,
  },

  title: {
    color: theme.colors.text,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: theme.fontWeight.black,
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  heroFeaturePress: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 2,
  },

  heroFeatureImageWrap: {
    height: 170,
    position: "relative",
  },

  heroFeatureImage: {
    width: "100%",
    height: "100%",
  },

  heroFeatureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.42)",
  },

  heroFeatureBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(6,10,8,0.64)",
  },

  heroFeatureBadgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  heroFeatureBody: {
    padding: 14,
    gap: 7,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.05)",
  },

  heroFeatureTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  heroFeatureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  heroFeatureCtaInline: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  heroFeatureTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: theme.fontWeight.black,
  },

  heroFeatureMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  heroFeatureWhy: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  heroActionRow: {
    gap: 8,
    marginTop: 2,
  },

  heroActionPill: {
    alignSelf: "flex-start",
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  heroActionText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  heroMiniSummary: {
    alignSelf: "flex-start",
  },

  heroMiniSummaryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  section: {
    gap: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionHeaderText: {
    flex: 1,
    gap: 3,
  },

  sectionHeaderStack: {
    gap: 4,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: theme.fontWeight.black,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  setupHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  collapsePill: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
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

  panel: {
    borderRadius: 22,
  },

  panelInner: {
    padding: 14,
    gap: 14,
  },

  setupCollapsedCard: {
    borderRadius: 20,
    borderColor: "rgba(87,162,56,0.12)",
  },

  setupCollapsedInner: {
    padding: 14,
    gap: 10,
  },

  setupCollapsedTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  setupCollapsedBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  setupCollapsedBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedSummary: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  setupTinyChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  setupTinyChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  inputBlock: {
    gap: 7,
  },

  filterBlock: {
    gap: 8,
  },

  label: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  inlineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  labelHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingVertical: 8,
    paddingHorizontal: 11,
  },

  chipActive: {
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  chipTextActive: {
    color: theme.colors.text,
  },

  setupSummaryRow: {
    gap: 8,
    marginTop: 2,
  },

  setupSummaryPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  setupSummaryPillText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  setupSummaryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  sparkRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  sparkPress: {
    borderRadius: 999,
    overflow: "hidden",
  },

  sparkCard: {
    borderRadius: 999,
  },

  sparkInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  sparkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  sparkTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
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

  livePress: {
    width: 246,
    borderRadius: 20,
    overflow: "hidden",
  },

  liveCard: {
    borderRadius: 20,
  },

  liveImageWrap: {
    height: 108,
    position: "relative",
  },

  liveImage: {
    width: "100%",
    height: "100%",
  },

  liveImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.40)",
  },

  liveTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  liveRankPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(6,10,8,0.60)",
  },

  liveRankText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  liveBody: {
    padding: 14,
    gap: 6,
    minHeight: 124,
  },

  liveTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },

  liveMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  liveWhy: {
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
    marginTop: 2,
  },

  trendingRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  trendingPress: {
    width: 274,
    borderRadius: 20,
    overflow: "hidden",
  },

  trendingCard: {
    borderRadius: 20,
  },

  trendingImageWrap: {
    height: 122,
    position: "relative",
  },

  trendingImage: {
    width: "100%",
    height: "100%",
  },

  trendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.34)",
  },

  trendingTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  trendingHotPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(8,10,10,0.70)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  trendingHotText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  trendingBody: {
    padding: 14,
    gap: 6,
    minHeight: 116,
  },

  trendingTitle: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: theme.fontWeight.black,
  },

  trendingLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  trendingMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  inspirationRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  inspirationPress: {
    width: 216,
    borderRadius: 18,
    overflow: "hidden",
  },

  inspirationCard: {
    borderRadius: 18,
    minHeight: 112,
  },

  inspirationInner: {
    padding: 14,
    minHeight: 112,
    gap: 12,
    justifyContent: "space-between",
  },

  inspirationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  inspirationTextWrap: {
    gap: 6,
  },

  inspirationTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  inspirationSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  resetPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
  },

  resetPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  primaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },

  categoryPress: {
    width: "48.5%",
    borderRadius: 18,
    overflow: "hidden",
  },

  categoryPressCompact: {
    width: 212,
    borderRadius: 18,
    overflow: "hidden",
  },

  categoryCard: {
    borderRadius: 18,
    minHeight: 214,
  },

  categoryCardCompact: {
    borderRadius: 18,
    minHeight: 184,
  },

  categoryCardPrimary: {
    borderColor: "rgba(87,162,56,0.16)",
  },

  categoryImageWrap: {
    height: 92,
    position: "relative",
  },

  categoryImage: {
    width: "100%",
    height: "100%",
  },

  categoryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.36)",
  },

  categoryEyebrowPill: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,10,0.58)",
  },

  categoryEyebrowText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  categoryInner: {
    padding: 14,
    minHeight: 120,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryInnerCompact: {
    padding: 14,
    minHeight: 92,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  categoryIconWrapPrimary: {
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  categoryTextWrap: {
    gap: 6,
  },

  categoryTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  categorySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  secondaryRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  randomPress: {
    borderRadius: 22,
    overflow: "hidden",
  },

  randomCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.16)",
  },

  randomInner: {
    padding: 16,
    gap: 14,
  },

  randomTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  randomTopText: {
    flex: 1,
    gap: 4,
  },

  randomTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  randomSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  randomIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  randomSummaryBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },

  randomSummaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  randomHint: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  randomButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  randomButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
