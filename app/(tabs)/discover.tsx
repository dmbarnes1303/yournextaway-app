// app/(tabs)/discover.tsx

import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  UIManager,
  Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import EmptyState from "@/src/components/EmptyState";
import GlassCard from "@/src/components/GlassCard";
import Button from "@/src/components/Button";
import { theme } from "@/src/constants/theme";

import { DISCOVER_CATEGORY_META } from "@/src/features/discover/discoverCategories";
import {
  INSPIRATION_PRESETS,
  QUICK_SPARKS,
} from "@/src/features/discover/discoverPresets";

import DiscoverCategoryCard from "@/src/features/discover/components/DiscoverCategoryCard";
import DiscoverFixtureCard from "@/src/features/discover/components/DiscoverFixtureCard";
import DiscoverSectionHeader from "@/src/features/discover/components/DiscoverSectionHeader";
import DiscoverTripSetup from "@/src/features/discover/components/DiscoverTripSetup";
import DiscoverHero from "@/src/features/discover/components/DiscoverHero";
import DiscoverQuickSparks from "@/src/features/discover/components/DiscoverQuickSparks";
import DiscoverInspirationRow from "@/src/features/discover/components/DiscoverInspirationRow";
import DiscoverConciergeCard from "@/src/features/discover/components/DiscoverConciergeCard";
import DiscoverMultiMatchRow from "@/src/features/discover/components/DiscoverMultiMatchRow";
import useDiscoverController from "@/src/features/discover/useDiscoverController";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SurfaceTone = "green" | "gold" | "neutral";

function Surface({
  children,
  tone = "neutral",
  padded = true,
}: {
  children: React.ReactNode;
  tone?: SurfaceTone;
  padded?: boolean;
}) {
  return (
    <View
      style={[
        styles.surface,
        padded && styles.surfacePadded,
        tone === "green"
          ? styles.surfaceGreen
          : tone === "gold"
            ? styles.surfaceGold
            : styles.surfaceNeutral,
      ]}
    >
      {children}
    </View>
  );
}

function LoadingState({
  eyebrow = "Live scan",
  title,
  message,
  tone = "green",
}: {
  eyebrow?: string;
  title: string;
  message: string;
  tone?: SurfaceTone;
}) {
  return (
    <GlassCard
      style={styles.stateCard}
      variant={tone === "gold" ? "gold" : "brand"}
      level="default"
    >
      <Text style={tone === "gold" ? styles.stateEyebrowGold : styles.stateEyebrow}>
        {eyebrow}
      </Text>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{message}</Text>
    </GlassCard>
  );
}

function QuietState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <GlassCard style={styles.stateCard} variant="matte" level="default">
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{message}</Text>
    </GlassCard>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();

  const {
    discoverWindowKey,
    setDiscoverWindowKey,
    discoverTripLength,
    setDiscoverTripLength,
    discoverVibes,
    discoverOrigin,
    setDiscoverOrigin,
    setupExpanded,
    loadingRandom,
    loadingLive,
    liveError,

    compactSummary,
    filterSummary,
    browseModeLabel,

    featuredLive,
    previewLive,
    trendingTrips,
    multiMatchTrips,

    leadCategory,
    remainingPrimaryCategories,
    prioritisedSecondaryCategories,

    seededCategory,

    toggleSetup,
    toggleVibe,
    resetFilters,

    goFixturesCategory,
    goMatchFromRow,
    goMultiMatchTrip,
    applyPreset,
    applyQuickSpark,
    goRandomTrip,

    helpers,
  } = useDiscoverController();

  const hasLiveRows = previewLive.length > 0;
  const hasTrendingRows = trendingTrips.length > 0;
  const hasMultiMatchTrips = multiMatchTrips.length > 0;

  const featuredTitle = featuredLive ? helpers.fixtureTitle(featuredLive.item.fixture) : null;
  const featuredMeta = featuredLive ? helpers.fixtureMeta(featuredLive.item.fixture) : null;
  const featuredWhy = featuredLive
    ? helpers.whyThisFits(
        featuredLive.item.fixture,
        seededCategory,
        discoverVibes,
        discoverTripLength
      )
    : null;

  return (
    <Background mode="solid" solidColor="#050708">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 34 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <DiscoverHero
            compactSummary={compactSummary}
            setupExpanded={setupExpanded}
            onToggleSetup={toggleSetup}
            featuredTitle={featuredTitle}
            featuredMeta={featuredMeta}
            featuredWhy={featuredWhy}
            featuredIcon={DISCOVER_CATEGORY_META[seededCategory].icon}
            onPressFeatured={
              featuredLive ? () => goMatchFromRow(featuredLive.item.fixture) : undefined
            }
          />

          <Surface tone="green">
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
          </Surface>

          <Surface tone="green">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Fast ways in"
                subtitle="Pick the kind of football break you want. Discover will handle the filtering."
              />
              <DiscoverQuickSparks sparks={QUICK_SPARKS} onPressSpark={applyQuickSpark} />
            </View>
          </Surface>

          <Surface tone="green">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Best live options"
                subtitle="The strongest current fixtures for your setup."
              />

              {loadingLive ? (
                <LoadingState
                  title="Loading live routes"
                  message="Checking the current fixture pool and ranking the best football-trip options."
                />
              ) : liveError ? (
                <GlassCard style={styles.stateCard} variant="matte" level="default">
                  <Text style={styles.stateEyebrowMuted}>Live data</Text>
                  <EmptyState title="Live previews unavailable" message={liveError} />
                </GlassCard>
              ) : hasLiveRows ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalRow}
                >
                  {previewLive.map((entry, index) => (
                    <DiscoverFixtureCard
                      key={String(entry.item.fixture?.fixture?.id ?? index)}
                      row={entry.item.fixture}
                      variant="live"
                      title={helpers.fixtureTitle(entry.item.fixture)}
                      meta={helpers.fixtureMeta(entry.item.fixture)}
                      subtitle={helpers.whyThisFits(
                        entry.item.fixture,
                        seededCategory,
                        discoverVibes,
                        discoverTripLength
                      )}
                      badge={helpers.rankLabel(index)}
                      onPress={() => goMatchFromRow(entry.item.fixture)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <QuietState
                  title="No live fits yet"
                  message="Widen the date window, switch trip length, or remove one vibe filter."
                />
              )}
            </View>
          </Surface>

          <Surface tone="gold">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Trending trips"
                subtitle="Bigger fixtures with stronger travel pull from the current pool."
              />

              {loadingLive ? (
                <LoadingState
                  tone="gold"
                  eyebrow="Trending scan"
                  title="Building trending picks"
                  message="Looking for the louder, more travel-worthy fixtures."
                />
              ) : hasTrendingRows ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalRow}
                >
                  {trendingTrips.map((entry, index) => (
                    <DiscoverFixtureCard
                      key={`trend-${String(entry.item.fixture?.fixture?.id ?? index)}`}
                      row={entry.item.fixture}
                      variant="trending"
                      title={helpers.fixtureTitle(entry.item.fixture)}
                      meta={helpers.fixtureMeta(entry.item.fixture)}
                      subtitle={helpers.trendingLabelForFixture(entry.item.fixture)}
                      badge="🔥 Trending"
                      onPress={() => goMatchFromRow(entry.item.fixture)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <QuietState
                  title="No trending routes yet"
                  message="The current live pool is thin. Try a wider window."
                />
              )}
            </View>
          </Surface>

          <Surface tone="neutral">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Multi-match trips"
                subtitle="Stack two or more fixtures into one football break."
              />

              {loadingLive ? (
                <LoadingState
                  eyebrow="Stack scan"
                  title="Looking for combinations"
                  message="Checking same-city, nearby-city and country-run options."
                />
              ) : hasMultiMatchTrips ? (
                <DiscoverMultiMatchRow
                  loading={loadingLive}
                  error={liveError}
                  trips={multiMatchTrips}
                  onPressTrip={goMultiMatchTrip}
                />
              ) : (
                <QuietState
                  title="No strong combos yet"
                  message="Use a longer window or choose 2–3 nights to unlock better stackable options."
                />
              )}
            </View>
          </Surface>

          <Surface tone="green">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Start from a mood"
                subtitle="Useful presets when you know the feel of the trip before the fixture."
              />
              <DiscoverInspirationRow
                presets={INSPIRATION_PRESETS}
                onPressPreset={applyPreset}
              />
            </View>
          </Surface>

          <Surface tone="gold">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Best browse route"
                subtitle={`Right now, ${browseModeLabel} is the strongest browse angle.`}
              />

              <View style={styles.bestFitBlock}>
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
            </View>
          </Surface>

          <Surface tone="neutral">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Specialist browse angles"
                subtitle="Narrow the search by atmosphere, city pull, match stakes or trip logic."
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
          </Surface>

          <Surface tone="gold">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Need one good answer?"
                subtitle="Let Discover choose one strong live route from your current setup."
              />
              <DiscoverConciergeCard
                loading={loadingRandom}
                filterSummary={filterSummary}
                onPress={goRandomTrip}
              />
            </View>
          </Surface>

          <View style={styles.bottomActionWrap}>
            <GlassCard variant="brand" level="strong" style={styles.bottomActionCard}>
              <Text style={styles.bottomActionTitle}>Browse the full live pool</Text>
              <Text style={styles.bottomActionText}>
                Open every live fixture that matches this setup and keep filtering from there.
              </Text>

              <Button
                label="Browse all live fits"
                onPress={() => goFixturesCategory(seededCategory)}
                tone="gold"
                glow
              />
            </GlassCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: 18,
  },

  section: {
    gap: 12,
  },

  surface: {
    borderRadius: 28,
    overflow: "hidden",
  },

  surfacePadded: {
    padding: 14,
  },

  surfaceGreen: {
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.20)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(9,18,13,0.74)" : "rgba(9,18,13,0.68)",
  },

  surfaceGold: {
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.18)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(24,18,6,0.56)" : "rgba(24,18,6,0.48)",
  },

  surfaceNeutral: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(8,11,14,0.58)" : "rgba(255,255,255,0.04)",
  },

  horizontalRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  bestFitBlock: {
    gap: 12,
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

  stateCard: {
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },

  stateEyebrow: {
    color: "#8EF2A5",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  stateEyebrowGold: {
    color: "#F5CC57",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  stateEyebrowMuted: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  stateTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  stateText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  bottomActionWrap: {
    paddingTop: 6,
  },

  bottomActionCard: {
    gap: 12,
    padding: 18,
    borderRadius: 24,
  },

  bottomActionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: theme.fontWeight.black,
  },

  bottomActionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
  },
});
