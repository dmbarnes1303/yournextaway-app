import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import {
  DISCOVER_CATEGORY_META,
} from "@/src/features/discover/discoverCategories";
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
            featuredTitle={featuredLive ? helpers.fixtureTitle(featuredLive.item.fixture) : null}
            featuredMeta={featuredLive ? helpers.fixtureMeta(featuredLive.item.fixture) : null}
            featuredWhy={
              featuredLive
                ? helpers.whyThisFits(
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
            <DiscoverMultiMatchRow
              loading={loadingLive}
              error={liveError}
              trips={multiMatchTrips}
              onPressTrip={goMultiMatchTrip}
            />
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

            {loadingLive ? null : liveError ? (
              <EmptyState title="Live previews unavailable" message={liveError} />
            ) : previewLive.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.liveRow}
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
            ) : null}
          </View>

          <View style={styles.section}>
            <DiscoverSectionHeader
              title="Trending football trips"
              subtitle="Big fixtures and city pulls people would actually travel for."
            />

            {loadingLive ? null : !liveError && trendingTrips.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingRow}
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
});
