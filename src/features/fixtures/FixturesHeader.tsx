import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

import { LeagueFlag, LeagueLogo, featuredClubLine } from "./helpers";

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

const UEFA_COMPETITION_IDS = new Set([2, 3, 848]);

function compactDateLine(headerDateLine: string, isRange: boolean) {
  if (!headerDateLine) return isRange ? "Date range" : "Select date";
  return headerDateLine;
}

function displayLeagueLabel(league: LeagueOption) {
  if (league.leagueId === 2) return "UEFA Champions League";
  if (league.leagueId === 3) return "UEFA Europa League";
  if (league.leagueId === 848) return "UEFA Conference League";
  return league.label;
}

function displayLeagueCountry(league: LeagueOption) {
  if (UEFA_COMPETITION_IDS.has(league.leagueId)) return "Europe";
  return league.country;
}

function isEuropeanLeague(league: LeagueOption) {
  return UEFA_COMPETITION_IDS.has(league.leagueId);
}

function CompactLeagueBadge({
  league,
  active,
  onPress,
}: {
  league: LeagueOption;
  active: boolean;
  onPress: () => void;
}) {
  const european = isEuropeanLeague(league);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.featuredChip,
        active && styles.featuredChipActive,
        european && styles.featuredChipEuropean,
      ]}
    >
      <View
        style={[
          styles.featuredChipLogoTile,
          european && styles.featuredChipLogoTileEuropean,
        ]}
      >
        <LeagueLogo logo={league.logo} size="md" />
      </View>

      <LeagueFlag code={league.countryCode} size="sm" />

      <View style={styles.featuredChipTextWrap}>
        <Text
          style={[styles.featuredChipTitle, active && styles.featuredChipTitleActive]}
          numberOfLines={1}
        >
          {displayLeagueLabel(league)}
        </Text>
        <Text style={styles.featuredChipSub} numberOfLines={1}>
          {displayLeagueCountry(league)}
        </Text>
      </View>
    </Pressable>
  );
}

function SelectedLeaguePill({
  league,
  onRemove,
}: {
  league: LeagueOption;
  onRemove: () => void;
}) {
  return (
    <Pressable onPress={onRemove} style={[styles.selectedPill, styles.selectedPillActive]}>
      <View style={styles.selectedLeagueLogoTile}>
        <LeagueLogo logo={league.logo} size="sm" />
      </View>
      <LeagueFlag code={league.countryCode} size="sm" />
      <Text style={styles.selectedPillText} numberOfLines={1}>
        {displayLeagueLabel(league)}
      </Text>
      <Ionicons name="close-outline" size={14} color={theme.colors.text} />
    </Pressable>
  );
}

function LeagueBrowserCard({
  league,
  active,
  onPress,
  onLongPress,
}: {
  league: LeagueOption;
  active: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const european = isEuropeanLeague(league);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.browserCardPress, active && styles.browserCardPressActive]}
    >
      <GlassCard
        style={[
          styles.browserCard,
          active && styles.browserCardActive,
          european && styles.browserCardEuropean,
        ]}
        level="default"
        variant="matte"
      >
        <View style={styles.browserCardTop}>
          <View
            style={[
              styles.browserCardLogoTile,
              european && styles.browserCardLogoTileEuropean,
            ]}
          >
            <LeagueLogo logo={league.logo} size="md" />
          </View>

          <View style={styles.browserCardTopRight}>
            {european ? (
              <View style={styles.browserTag}>
                <Text style={styles.browserTagText}>UEFA</Text>
              </View>
            ) : null}
            <LeagueFlag code={league.countryCode} size="sm" />
          </View>
        </View>

        <View style={styles.browserCardTextWrap}>
          <Text style={styles.browserCardCountry} numberOfLines={1}>
            {displayLeagueCountry(league)}
          </Text>
          <Text style={styles.browserCardLeague} numberOfLines={2}>
            {displayLeagueLabel(league)}
          </Text>
        </View>

        {!european ? (
          <Text style={styles.browserCardClubs} numberOfLines={2}>
            {featuredClubLine(league)}
          </Text>
        ) : (
          <Text style={styles.browserCardClubs} numberOfLines={2}>
            Continental competition
          </Text>
        )}
      </GlassCard>
    </Pressable>
  );
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
    if (selectedLeagues.length === 1) {
      return displayLeagueLabel(selectedLeagues[0] ?? FEATURED_LEAGUES[0]);
    }
    return `${selectedLeagues.length} leagues selected`;
  }, [hasManualLeagueSelection, selectedLeagues]);

  return (
    <View style={styles.headerListWrap}>
      <View style={styles.header}>
        <GlassCard strength="strong" style={styles.heroCard} noPadding>
          <View style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.kicker}>FIXTURES</Text>
                <Text style={styles.title}>{titleText}</Text>
                <Text style={styles.subtitle}>{subtitleText}</Text>
              </View>
            </View>

            <View style={styles.heroMetaRow}>
              <Pressable onPress={openCalendar} style={styles.heroMetaPill}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={15}
                  color={theme.colors.text}
                />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {compactDateLine(headerDateLine, isRange)}
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

        <View style={styles.compactSection}>
          <View style={styles.inlineRow}>
            <Text style={styles.sectionLabel}>Date</Text>
            <Pressable onPress={openCalendar} style={styles.inlineAction}>
              <Ionicons
                name="options-outline"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.inlineActionText}>Pick range</Text>
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

        <View style={styles.compactSection}>
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
              <SelectedLeaguePill
                key={`selected-${league.leagueId}`}
                league={league}
                onRemove={() => toggleLeague(league.leagueId)}
              />
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
                  <Ionicons name="globe-outline" size={17} color={theme.colors.text} />
                </View>
                <View style={styles.browserToggleTextWrap}>
                  <Text style={styles.browserToggleTitle}>Explore leagues</Text>
                  <Text style={styles.browserToggleSub}>
                    Broader league browsing
                  </Text>
                </View>
              </View>

              <View style={styles.browserToggleRight}>
                <Text style={styles.browserToggleState}>
                  {leagueBrowserOpen ? "Hide" : "Open"}
                </Text>
                <Ionicons
                  name={leagueBrowserOpen ? "chevron-up-outline" : "chevron-down-outline"}
                  size={16}
                  color={theme.colors.textSecondary}
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

              <View style={styles.browserGrid}>
                {regionLeagues.map((league) => {
                  const active = selectedLeagueIds.includes(league.leagueId);

                  return (
                    <LeagueBrowserCard
                      key={`browser-card-${league.leagueId}`}
                      league={league}
                      active={active}
                      onPress={() => selectSingleLeague(league.leagueId)}
                      onLongPress={() => toggleLeague(league.leagueId)}
                    />
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
    paddingBottom: theme.spacing.sm,
    gap: 10,
  },

  heroCard: {
    borderRadius: 24,
    borderColor: "rgba(87,162,56,0.14)",
  },

  heroInner: {
    padding: 14,
    gap: 10,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  heroTextWrap: {
    flex: 1,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.1,
  },

  title: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  heroMetaPill: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
    maxWidth: "100%",
  },

  heroMetaPillMuted: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
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

  compactSection: {
    gap: 6,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  inlineActionText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  horizontalScrollContent: {
    paddingRight: 10,
  },

  datePill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    minWidth: 78,
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
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  dateBottom: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    marginTop: 1,
  },

  dateTopActive: {
    color: theme.colors.primary,
  },

  dateBottomActive: {
    color: theme.colors.text,
  },

  featuredChip: {
    minWidth: 172,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginRight: 8,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  featuredChipEuropean: {
    borderColor: "rgba(87,162,56,0.18)",
  },

  featuredChipActive: {
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  featuredChipLogoTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
  },

  featuredChipLogoTileEuropean: {
    borderColor: "rgba(87,162,56,0.16)",
    backgroundColor: "rgba(87,162,56,0.06)",
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
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },

  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    maxWidth: 240,
  },

  selectedPillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  selectedLeagueLogoTile: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
  },

  selectedPillText: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  browserTogglePress: {
    borderRadius: 18,
    overflow: "hidden",
  },

  browserToggleCard: {
    borderRadius: 18,
  },

  browserToggleInner: {
    paddingHorizontal: 13,
    paddingVertical: 12,
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
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  browserToggleTextWrap: {
    flex: 1,
    gap: 1,
  },

  browserToggleTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  browserToggleSub: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  browserToggleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  browserToggleState: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  browserPanel: {
    borderRadius: 20,
  },

  browserPanelInner: {
    padding: 12,
    gap: 10,
  },

  regionPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
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

  browserGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  browserCardPress: {
    width: "48.2%",
  },

  browserCardPressActive: {
    transform: [{ scale: 0.99 }],
  },

  browserCard: {
    minHeight: 126,
    borderRadius: 18,
    padding: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  browserCardActive: {
    borderColor: "rgba(87,162,56,0.24)",
  },

  browserCardEuropean: {
    borderColor: "rgba(87,162,56,0.14)",
  },

  browserCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  browserCardLogoTile: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
  },

  browserCardLogoTileEuropean: {
    borderColor: "rgba(87,162,56,0.16)",
    backgroundColor: "rgba(87,162,56,0.06)",
  },

  browserCardTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  browserTag: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  browserTagText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  browserCardTextWrap: {
    marginTop: 8,
    gap: 1,
  },

  browserCardCountry: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  browserCardLeague: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  browserCardClubs: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
    opacity: 0.96,
  },

  helperLine: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
    marginTop: 1,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
  },

  resultsBar: {
    gap: 1,
    paddingBottom: 2,
  },

  resultsLine: {
    color: theme.colors.text,
    fontSize: 12,
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
