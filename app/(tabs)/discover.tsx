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
import { getBackground } from "@/src/constants/backgrounds";
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

function SectionSpacer() {
  return <View style={styles.sectionSpacer} />;
}

function SectionShell({
  children,
  accent = "neutral",
}: {
  children: React.ReactNode;
  accent?: "green" | "gold" | "neutral";
}) {
  return (
    <View
      style={[
        styles.sectionShell,
        accent === "green"
          ? styles.sectionShellGreen
          : accent === "gold"
            ? styles.sectionShellGold
            : styles.sectionShellNeutral,
      ]}
    >
      {children}
    </View>
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

  return (
    <Background
      imageSource={getBackground("explore")}
      overlayOpacity={0.05}
      topShadeOpacity={0.32}
      bottomShadeOpacity={0.42}
      centerShadeOpacity={0.05}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 32 + insets.bottom },
          ]}
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

          <SectionShell accent="green">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Fast ways in"
                subtitle="Start with a trip type, not a blank search."
              />
              <DiscoverQuickSparks sparks={QUICK_SPARKS} onPressSpark={applyQuickSpark} />
            </View>
          </SectionShell>

          <SectionSpacer />

          <SectionShell accent="green">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Best live options"
                subtitle="Current fixtures that fit your setup now, not generic filler."
              />

              {loadingLive ? (
                <GlassCard style={styles.stateCard} variant="brand" level="default">
                  <Text style={styles.stateTitle}>Loading live routes</Text>
                  <Text style={styles.stateText}>
                    Pulling the strongest current football-trip options across your selected window.
                  </Text>
                </GlassCard>
              ) : liveError ? (
                <EmptyState title="Live previews unavailable" message={liveError} />
              ) : hasLiveRows ? (
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
              ) : (
                <GlassCard style={styles.stateCard} variant="matte" level="default">
                  <Text style={styles.stateTitle}>No live fits yet</Text>
                  <Text style={styles.stateText}>
                    Try widening the date window, switching trip length, or dropping one vibe so
                    Discover can surface more routes.
                  </Text>
                </GlassCard>
              )}
            </View>
          </SectionShell>

          <SectionSpacer />

          <SectionShell accent="gold">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Trending trips"
                subtitle="The louder, bigger, more travel-worthy fixtures in the current pool."
              />

              {loadingLive ? (
                <GlassCard style={styles.stateCardThin} variant="gold" level="default">
                  <Text style={styles.stateText}>Building trending football-trip picks…</Text>
                </GlassCard>
              ) : hasTrendingRows ? (
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
              ) : (
                <GlassCard style={styles.stateCardThin} variant="matte" level="default">
                  <Text style={styles.stateText}>
                    No trending routes surfaced from the current live pool.
                  </Text>
                </GlassCard>
              )}
            </View>
          </SectionShell>

          <SectionSpacer />

          <SectionShell accent="neutral">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Multi-match trips"
                subtitle="Stack more than one fixture into the same football break."
              />

              {loadingLive ? (
                <GlassCard style={styles.stateCardThin} variant="matte" level="default">
                  <Text style={styles.stateText}>Looking for stackable trip combinations…</Text>
                </GlassCard>
              ) : hasMultiMatchTrips ? (
                <DiscoverMultiMatchRow
                  loading={loadingLive}
                  error={liveError}
                  trips={multiMatchTrips}
                  onPressTrip={goMultiMatchTrip}
                />
              ) : (
                <GlassCard style={styles.stateCard} variant="matte" level="default">
                  <Text style={styles.stateTitle}>No strong combos yet</Text>
                  <Text style={styles.stateText}>
                    Your current setup is producing mainly single-match routes. Try a longer window
                    or 2–3 nights to unlock better stackable options.
                  </Text>
                </GlassCard>
              )}
            </View>
          </SectionShell>

          <SectionSpacer />

          <SectionShell accent="green">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Start from a mood"
                subtitle="Fast editorial routes for the kind of trip that already sounds right."
              />
              <DiscoverInspirationRow
                presets={INSPIRATION_PRESETS}
                onPressPreset={applyPreset}
              />
            </View>
          </SectionShell>

          <SectionSpacer />

          <SectionShell accent="gold">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Best browse route"
                subtitle={`Right now, ${browseModeLabel} is the strongest angle from your setup.`}
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
          </SectionShell>

          <SectionSpacer />

          <SectionShell accent="neutral">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Specialist browse angles"
                subtitle="Use narrower lenses when you care more about atmosphere, city pull, stakes or specific trip logic."
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
          </SectionShell>

          <SectionSpacer />

          <SectionShell accent="gold">
            <View style={styles.section}>
              <DiscoverSectionHeader
                title="Need one good answer?"
                subtitle="Let Discover stop browsing and just hand you one of the strongest live routes."
              />
              <DiscoverConciergeCard
                loading={loadingRandom}
                filterSummary={filterSummary}
                onPress={goRandomTrip}
              />
            </View>
          </SectionShell>

          <View style={styles.bottomActionWrap}>
            <GlassCard variant="brand" level="strong" style={styles.bottomActionCard}>
              <Text style={styles.bottomActionTitle}>Ready to browse properly?</Text>
              <Text style={styles.bottomActionText}>
                Open the strongest live Discover route from your current setup and keep moving.
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

  sectionSpacer: {
    height: 2,
  },

  sectionShell: {
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
  },

  sectionShellGreen: {
    borderColor: theme.colors.borderGreenSoft,
    backgroundColor: "rgba(34,197,94,0.035)",
  },

  sectionShellGold: {
    borderColor: theme.colors.borderGoldSoft,
    backgroundColor: "rgba(250,204,21,0.035)",
  },

  sectionShellNeutral: {
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  liveRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  trendingRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  bestFitBlock: {
    gap: 10,
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
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },

  stateCardThin: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
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
    paddingTop: 4,
  },

  bottomActionCard: {
    gap: 12,
    padding: 16,
    borderRadius: 22,
  },

  bottomActionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },

  bottomActionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
  },
});
