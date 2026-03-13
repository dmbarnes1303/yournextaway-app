import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";

import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
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
  const hasManualLeagueSelection = selectedLeagueIds.length > 0;
  const regionLeagues = leaguesByRegion[activeRegion] ?? [];

  return (
    <View style={styles.headerListWrap}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>
            <Text style={styles.dateLine}>{headerDateLine}</Text>
          </View>

          <Button label="Calendar" tone="secondary" size="sm" onPress={openCalendar} />
        </View>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search team, city, venue, or league"
          leftIcon="search"
          variant="default"
          returnKeyType="search"
          allowClear
        />

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
                <Text style={[styles.dateTop, active && styles.dateTopActive]}>
                  {day.top}
                </Text>
                <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>
                  {day.bottom}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.scopeRow}>
          <Text style={styles.sectionLabel}>Featured leagues</Text>
          {hasManualLeagueSelection ? (
            <Button
              label="Reset to featured"
              tone="ghost"
              size="sm"
              onPress={resetToFeatured}
            />
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
              <Pressable
                key={`featured-${league.leagueId}`}
                onPress={() => selectSingleLeague(league.leagueId)}
                style={[styles.featuredLeagueCard, active && styles.featuredLeagueCardActive]}
              >
                <View style={styles.featuredLeagueTop}>
                  <LeagueFlag code={league.countryCode} size="md" />
                  <Text
                    style={[
                      styles.featuredLeagueText,
                      active && styles.featuredLeagueTextActive,
                    ]}
                  >
                    {league.label}
                  </Text>
                </View>

                <Text style={styles.featuredLeagueCountry}>{league.country}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.scopeRow}>
          <Text style={styles.sectionLabel}>Browse by region</Text>
        </View>

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
                    <LeagueFlag code={league.countryCode} size="md" />
                    <View style={styles.countryCardTextWrap}>
                      <Text style={styles.countryCardCountry}>{league.country}</Text>
                      <Text style={styles.countryCardLeague}>{league.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.countryCardClubs} numberOfLines={2}>
                    {featuredClubLine(league)}
                  </Text>

                  <View style={styles.countryCardFooter}>
                    <Text style={styles.countryCardHint}>Tap to view</Text>
                    <Text style={styles.countryCardHint}>Hold to multi-select</Text>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
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
                <Text style={[styles.leagueText, styles.leagueTextActive]}>{league.label}</Text>
                <LeagueFlag code={league.countryCode} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Text style={styles.helperLine}>{helperLineText}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.listWrap}>
          {!loading && !error && filteredCount > 0 ? (
            <Text style={styles.resultsLine}>
              {filteredCount} match{filteredCount === 1 ? "" : "es"} found
            </Text>
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
    gap: theme.spacing.sm,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },

  titleWrap: {
    flex: 1,
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h1,
    fontWeight: theme.fontWeight.semibold,
  },

  subtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
  },

  dateLine: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  helperLine: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    marginTop: 2,
  },

  sectionLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
  },

  scopeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginTop: 2,
  },

  horizontalScrollContent: {
    paddingRight: 12,
  },

  datePill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
  },

  datePillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  dateTop: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.semibold,
  },

  dateBottom: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
    marginTop: 2,
  },

  dateTopActive: {
    color: "rgba(87,162,56,0.95)",
  },

  dateBottomActive: {
    color: theme.colors.textPrimary,
  },

  featuredLeagueCard: {
    width: 160,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 8,
  },

  featuredLeagueCardActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  featuredLeagueTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  featuredLeagueText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.meta,
    flex: 1,
  },

  featuredLeagueTextActive: {
    color: theme.colors.textPrimary,
  },

  featuredLeagueCountry: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  regionPill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  regionPillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  regionPillText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.tiny,
  },

  regionPillTextActive: {
    color: theme.colors.textPrimary,
  },

  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  countryCardWrap: {
    width: "48.2%",
  },

  countryCardWrapActive: {
    transform: [{ scale: 0.99 }],
  },

  countryCard: {
    minHeight: 138,
    borderRadius: theme.borderRadius.sheet,
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  countryCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  countryCardTextWrap: {
    flex: 1,
  },

  countryCardCountry: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
  },

  countryCardLeague: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  countryCardClubs: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.tiny,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
    opacity: 0.96,
  },

  countryCardFooter: {
    gap: 2,
  },

  countryCardHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
  },

  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  leaguePillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  leagueText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.tiny,
  },

  leagueTextActive: {
    color: theme.colors.textPrimary,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
  },

  listWrap: {
    gap: 12,
  },

  resultsLine: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },
});
