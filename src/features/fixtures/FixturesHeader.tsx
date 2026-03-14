import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
} from "react-native";

import Input from "@/src/components/Input";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import {
  FEATURED_LEAGUES,
  LEAGUE_BROWSE_REGION_LABELS,
  LEAGUE_BROWSE_REGION_ORDER,
  type LeagueOption,
  type LeagueBrowseRegion,
} from "@/src/constants/football";

import { LeagueFlag, featuredClubLine } from "./helpers";

type StripDay = {
  iso: string;
  top: string;
  bottom: string;
};

type FixturesHeaderProps = {
  titleText: string;
  subtitleText: string;
  headerDateLine: string;
  query: string;
  setQuery: (value: string) => void;
  stripDays: StripDay[];
  isRange: boolean;
  selectedDay: string;
  onTapStripDate: (iso: string) => void;
  selectedLeagueIds: number[];
  resetToFeatured: () => void;
  selectSingleLeague: (leagueId: number) => void;
  activeRegion: LeagueBrowseRegion;
  setActiveRegion: (region: LeagueBrowseRegion) => void;
  leaguesByRegion: Record<LeagueBrowseRegion, LeagueOption[]>;
  toggleLeague: (leagueId: number) => void;
  selectedLeagues: LeagueOption[];
  helperLineText: string;
  loading: boolean;
  error: string | null;
  filteredCount: number;
  openCalendar: () => void;
};

function CompactLeagueBadge({
  league,
  active,
  onPress,
}: {
  league: LeagueOption;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.featuredChip, active && styles.featuredChipActive]}>
      <Image source={{ uri: league.logo }} style={styles.featuredChipLogo} resizeMode="contain" />
      <LeagueFlag code={league.countryCode} size="sm" />
      <View style={styles.featuredChipTextWrap}>
        <Text
          style={[styles.featuredChipTitle, active && styles.featuredChipTitleActive]}
          numberOfLines={1}
        >
          {league.label}
        </Text>
        <Text style={styles.featuredChipSub} numberOfLines={1}>
          {league.country}
        </Text>
      </View>
    </Pressable>
  );
}

function IonWrap({
  name,
  small = false,
}: {
  name: React.ComponentProps<typeof import("@expo/vector-icons").Ionicons>["name"];
  small?: boolean;
}) {
  const { Ionicons } = require("@expo/vector-icons");
  return <Ionicons name={name} size={small ? 15 : 18} color={theme.colors.text} />;
}

export default function FixturesHeader({
  titleText,
  subtitleText,
  headerDateLine,
  query,
  setQuery,
  stripDays,
  isRange,
  selectedDay,
  onTapStripDate,
  selectedLeagueIds,
  resetToFeatured,
  selectSingleLeague,
  activeRegion,
  setActiveRegion,
  leaguesByRegion,
  toggleLeague,
  selectedLeagues,
  helperLineText,
  loading,
  error,
  filteredCount,
  openCalendar,
}: FixturesHeaderProps) {
  const [leagueBrowserOpen, setLeagueBrowserOpen] = useState(false);

  const hasManualLeagueSelection = selectedLeagueIds.length > 0;
  const regionLeagues = leaguesByRegion[activeRegion] ?? [];

  const resultsText = useMemo(() => {
    if (loading) return "Loading fixtures...";
    if (error) return "Could not load fixtures";
    return `${filteredCount} fixture${filteredCount === 1 ? "" : "s"}`;
  }, [loading, error, filteredCount]);

  const scopeText = useMemo(() => {
    if (!hasManualLeagueSelection) return "Featured leagues";
    if (selectedLeagues.length === 1) return selectedLeagues[0]?.label ?? "1 league selected";
    return `${selectedLeagues.length} leagues selected`;
  }, [hasManualLeagueSelection, selectedLeagues]);

  return (
    <View style={styles.headerListWrap}>
      <View style={styles.header}>
        <GlassCard strength="strong" style={styles.heroCard} noPadding>
          <View style={styles.heroInner}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.kicker}>FIXTURES</Text>
              <Text style={styles.title}>{titleText}</Text>
              <Text style={styles.subtitle}>{subtitleText}</Text>
            </View>

            <View style={styles.heroMetaRow}>
              <Pressable onPress={openCalendar} style={styles.heroMetaPill}>
                <IonWrap name="calendar-clear-outline" small />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {headerDateLine}
                </Text>
              </Pressable>

              <View style={styles.heroMetaPillMuted}>
                <Text style={styles.heroMetaMutedText} numberOfLines={1}>
                  {scopeText}
                </Text>
              </View>
            </View>

            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search team, city, or country"
              leftIcon="search"
              variant="default"
              returnKeyType="search"
              allowClear
            />
          </View>
        </GlassCard>

        <View style={styles.quickBlock}>
          <View style={styles.inlineRow}>
            <Text style={styles.sectionLabel}>Date</Text>

            <Pressable onPress={openCalendar} style={styles.inlineAction}>
              <IonWrap name="options-outline" small />
              <Text style={styles.inlineActionText}>{isRange ? "Change range" : "Pick range"}</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {stripDays.map((day) => {
              const active = !isRange && day.iso === selectedDay;

              return (
                <Pressable
                  key={day.iso}
                  onPress={() => onTapStripDate(day.iso)}
                  style={[styles.datePill, active && styles.datePillActive]}
                >
                  <Text style={[styles.dateTop, active && styles.dateTopActive]}>{day.top}</Text>
                  <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>
                    {day.bottom}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.quickBlock}>
          <View style={styles.inlineRow}>
            <Text style={styles.sectionLabel}>Featured leagues</Text>
            {hasManualLeagueSelection ? (
              <Pressable onPress={resetToFeatured} style={styles.inlineAction}>
                <Text style={styles.inlineActionText}>Reset</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {FEATURED_LEAGUES.map((league) => {
              const active =
                selectedLeagueIds.length === 1 && selectedLeagueIds[0] === league.leagueId;

              return (
                <CompactLeagueBadge
                  key={`featured-${league.leagueId}`}
                  league={league}
                  active={active}
                  onPress={() => selectSingleLeague(league.leagueId)}
                />
              );
            })}
          </ScrollView>
        </View>

        {hasManualLeagueSelection ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {selectedLeagues.map((league) => (
              <Pressable
                key={`selected-${league.leagueId}`}
                onPress={() => toggleLeague(league.leagueId)}
                style={[styles.leaguePill, styles.leaguePillActive]}
              >
                <Image
                  source={{ uri: league.logo }}
                  style={styles.selectedLeagueLogo}
                  resizeMode="contain"
                />
                <LeagueFlag code={league.countryCode} size="sm" />
                <Text style={[styles.leagueText, styles.leagueTextActive]} numberOfLines={1}>
                  {league.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Pressable
          onPress={() => setLeagueBrowserOpen((prev) => !prev)}
          style={({ pressed }) => [styles.browserTogglePress, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.browserToggleCard} noPadding>
            <View style={styles.browserToggleInner}>
              <View style={styles.browserToggleLeft}>
                <View style={styles.browserToggleIcon}>
                  <IonWrap name="globe-outline" />
                </View>

                <View style={styles.browserToggleTextWrap}>
                  <Text style={styles.browserToggleTitle}>Explore leagues</Text>
                  <Text style={styles.browserToggleSub}>
                    Region browser for broader league discovery
                  </Text>
                </View>
              </View>

              <View style={styles.browserToggleRight}>
                <Text style={styles.browserToggleState}>
                  {leagueBrowserOpen ? "Hide" : "Open"}
                </Text>
                <IonWrap
                  name={leagueBrowserOpen ? "chevron-up-outline" : "chevron-down-outline"}
                  small
                />
              </View>
            </View>
          </GlassCard>
        </Pressable>

        {leagueBrowserOpen ? (
          <GlassCard strength="default" style={styles.browserPanel} noPadding>
            <View style={styles.browserPanelInner}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {LEAGUE_BROWSE_REGION_ORDER.map((region) => {
                  const active = region === activeRegion;

                  return (
                    <Pressable
                      key={region}
                      onPress={() => setActiveRegion(region)}
                      style={[styles.regionPill, active && styles.regionPillActive]}
                    >
                      <Text style={[styles.regionPillText, active && styles.regionPillTextActive]}>
                        {LEAGUE_BROWSE_REGION_LABELS[region]}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.countryGrid}>
                {regionLeagues.map((league) => {
                  const active = selectedLeagueIds.includes(league.leagueId);

                  return (
                    <Pressable
                      key={`country-card-${league.leagueId}`}
                      onPress={() => selectSingleLeague(league.leagueId)}
                      onLongPress={() => toggleLeague(league.leagueId)}
                      style={[styles.countryCardWrap, active && styles.countryCardWrapActive]}
                    >
                      <GlassCard style={styles.countryCard} level="default" variant="matte">
                        <View style={styles.countryCardHeader}>
                          <Image
                            source={{ uri: league.logo }}
                            style={styles.countryCardLogo}
                            resizeMode="contain"
                          />
                          <LeagueFlag code={league.countryCode} size="md" />
                        </View>

                        <View style={styles.countryCardTextWrap}>
                          <Text style={styles.countryCardCountry}>{league.country}</Text>
                          <Text style={styles.countryCardLeague}>{league.label}</Text>
                        </View>

                        <Text style={styles.countryCardClubs} numberOfLines={2}>
                          {featuredClubLine(league)}
                        </Text>

                        <View style={styles.countryCardFooter}>
                          <Text style={styles.countryCardHint}>Tap = single league</Text>
                          <Text style={styles.countryCardHint}>Hold = multi-select</Text>
                        </View>
                      </GlassCard>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </GlassCard>
        ) : null}

        <Text style={styles.helperLine} numberOfLines={2}>
          {helperLineText}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.resultsBar}>
          <Text style={styles.resultsLine}>{resultsText}</Text>
          {!loading && !error && filteredCount > 0 ? (
            <Text style={styles.resultsHint}>Showing strongest current matches first</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerListWrap: {
    width: "100%",
  },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: 10,
  },

  heroCard: {
    borderRadius: 26,
    borderColor: "rgba(87,162,56,0.14)",
  },

  heroInner: {
    padding: 16,
    gap: 12,
  },

  heroTextWrap: {
    gap: 0,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.1,
  },

  title: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  heroMetaPill: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
    maxWidth: "100%",
  },

  heroMetaPillMuted: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.03)",
    maxWidth: "100%",
  },

  heroMetaText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    flexShrink: 1,
  },

  heroMetaMutedText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    flexShrink: 1,
  },

  quickBlock: {
    gap: 8,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  inlineActionText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  horizontalScrollContent: {
    paddingRight: 12,
  },

  datePill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    minWidth: 82,
    alignItems: "center",
    justifyContent: "center",
  },

  datePillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  dateTop: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  dateBottom: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    marginTop: 2,
  },

  dateTopActive: {
    color: theme.colors.primary,
  },

  dateBottomActive: {
    color: theme.colors.text,
  },

  featuredChip: {
    minWidth: 182,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  featuredChipActive: {
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  featuredChipLogo: {
    width: 24,
    height: 24,
  },

  featuredChipTextWrap: {
    flex: 1,
  },

  featuredChipTitle: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  featuredChipTitleActive: {
    color: theme.colors.text,
  },

  featuredChipSub: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    maxWidth: 220,
  },

  leaguePillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  selectedLeagueLogo: {
    width: 18,
    height: 18,
  },

  leagueText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    flexShrink: 1,
  },

  leagueTextActive: {
    color: theme.colors.text,
  },

  browserTogglePress: {
    borderRadius: 20,
    overflow: "hidden",
  },

  browserToggleCard: {
    borderRadius: 20,
  },

  browserToggleInner: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  browserToggleLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  browserToggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  browserToggleTextWrap: {
    flex: 1,
    gap: 2,
  },

  browserToggleTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  browserToggleSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  browserToggleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  browserToggleState: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  browserPanel: {
    borderRadius: 22,
  },

  browserPanelInner: {
    padding: 14,
    gap: 12,
  },

  regionPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
  },

  regionPillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  regionPillText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  regionPillTextActive: {
    color: theme.colors.text,
  },

  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },

  countryCardWrap: {
    width: "48.2%",
  },

  countryCardWrapActive: {
    transform: [{ scale: 0.99 }],
  },

  countryCard: {
    minHeight: 138,
    borderRadius: 22,
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  countryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  countryCardLogo: {
    width: 28,
    height: 28,
  },

  countryCardTextWrap: {
    marginTop: 8,
    gap: 2,
  },

  countryCardCountry: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  countryCardLeague: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  countryCardClubs: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
    opacity: 0.96,
  },

  countryCardFooter: {
    gap: 2,
  },

  countryCardHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  helperLine: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
  },

  resultsBar: {
    gap: 2,
    paddingBottom: 2,
  },

  resultsLine: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  resultsHint: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
