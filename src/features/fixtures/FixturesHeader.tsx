// src/features/fixtures/FixturesHeader.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Input from "@/src/components/Input";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import type { LeagueOption } from "@/src/constants/football";

import { LeagueFlag, LeagueLogo } from "./helpers";

type StripDay = {
  iso: string;
  top: string;
  bottom: string;
};

type Props = {
  query: string;
  setQuery: (v: string) => void;

  stripDays: StripDay[];
  selectedDay: string;
  isRange: boolean;
  onTapStripDate: (iso: string) => void;
  openCalendar: () => void;

  allLeagues?: LeagueOption[];
  selectedLeagueIds: number[];
  selectedLeagues: LeagueOption[];
  toggleLeague: (id: number) => void;
  selectSingleLeague: (id: number) => void;
  selectAllLeagues?: () => void;
  clearLeagues?: () => void;
  resetToFeatured: () => void;
  competitionSummaryText?: string;

  titleText?: string;
  subtitleText?: string;
  helperLineText?: string;
  headerDateLine?: string;
  loading?: boolean;
  backgroundLoading?: boolean;
  loadedLeagueCount?: number;
  totalLeagueCount?: number;
  error?: string | null;
  filteredCount?: number;
};

export default function FixturesHeader({
  query,
  setQuery,
  stripDays,
  selectedDay,
  isRange,
  onTapStripDate,
  openCalendar,
  allLeagues = [],
  selectedLeagueIds,
  selectedLeagues,
  toggleLeague,
  selectSingleLeague,
  selectAllLeagues,
  clearLeagues,
  resetToFeatured,
  competitionSummaryText,
  titleText,
  subtitleText,
  loading = false,
  backgroundLoading = false,
  loadedLeagueCount = 0,
  totalLeagueCount = 0,
  error = null,
  filteredCount,
}: Props) {
  const [competitionsOpen, setCompetitionsOpen] = useState(false);

  const hasSelectedLeagues = selectedLeagueIds.length > 0;

  const selectedLeagueSet = useMemo(
    () => new Set(selectedLeagueIds),
    [selectedLeagueIds]
  );

  const visibleLeagues = allLeagues.length > 0 ? allLeagues : selectedLeagues;

  const loadingLine = useMemo(() => {
    if (backgroundLoading && totalLeagueCount > 0) {
      return `Adding leagues ${Math.min(loadedLeagueCount, totalLeagueCount)}/${totalLeagueCount}`;
    }

    if (loading) return "Finding priority fixtures";

    return null;
  }, [backgroundLoading, loadedLeagueCount, loading, totalLeagueCount]);

  const countText =
    typeof filteredCount === "number"
      ? `${filteredCount} match${filteredCount === 1 ? "" : "es"}`
      : "Matches";

  return (
    <View style={styles.wrap}>
      <View style={styles.heroPanel}>
        <View pointerEvents="none" style={styles.heroGlowOne} />
        <View pointerEvents="none" style={styles.heroGlowTwo} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.title}>{titleText || "Fixtures"}</Text>
            <Text style={styles.subtitle}>
              {subtitleText || "Find matches by date, competition or destination."}
            </Text>
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countNumber}>{countText.split(" ")[0]}</Text>
            <Text style={styles.countLabel}>
              {filteredCount === 1 ? "match" : "matches"}
            </Text>
          </View>
        </View>

        {loadingLine ? (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText} numberOfLines={1}>
              {loadingLine}
            </Text>
          </View>
        ) : null}

        {!loading && !backgroundLoading && error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={styles.dateHeroRow}>
          <View>
            <Text style={styles.sectionLabel}>Dates</Text>
            <Text style={styles.sectionHint}>
              {isRange ? "Range active" : "Tap a day or use range"}
            </Text>
          </View>

          <Pressable
            onPress={openCalendar}
            style={({ pressed }) => [styles.rangeButton, pressed && styles.pressedLite]}
            hitSlop={10}
          >
            <Ionicons name="calendar-outline" size={14} color={theme.badge.textGold} />
            <Text style={styles.rangeButtonText}>Date range</Text>
          </Pressable>
        </View>

        <View style={styles.dateStripShell}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowScroll}
          >
            {stripDays.map((d) => {
              const active = !isRange && d.iso === selectedDay;

              return (
                <Pressable
                  key={d.iso}
                  onPress={() => onTapStripDate(d.iso)}
                  style={({ pressed }) => [
                    styles.datePill,
                    active && styles.datePillActive,
                    pressed && styles.pressedCard,
                  ]}
                  android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                >
                  <Text style={[styles.dateTop, active && styles.dateTopActive]}>{d.top}</Text>
                  <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>
                    {d.bottom}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={openCalendar}
              style={({ pressed }) => [styles.datePillGhost, pressed && styles.pressedCard]}
              android_ripple={{ color: "rgba(255,255,255,0.06)" }}
            >
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.dateGhostText}>More</Text>
            </Pressable>
          </ScrollView>

          <View pointerEvents="none" style={styles.scrollFadeRight} />
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            onPress={() => setCompetitionsOpen((v) => !v)}
            style={({ pressed }) => [styles.competitionSelector, pressed && styles.pressedCard]}
            android_ripple={{ color: "rgba(255,255,255,0.06)" }}
          >
            <View style={styles.competitionTextWrap}>
              <Text style={styles.controlLabel}>Competitions</Text>
              <Text style={styles.competitionSummary} numberOfLines={1}>
                {competitionSummaryText ||
                  (hasSelectedLeagues
                    ? `${selectedLeagueIds.length} selected`
                    : `All ${visibleLeagues.length} competitions`)}
              </Text>
            </View>

            <View style={styles.competitionRight}>
              {hasSelectedLeagues ? (
                <View style={styles.selectedCountPill}>
                  <Text style={styles.selectedCountText}>{selectedLeagueIds.length}</Text>
                </View>
              ) : null}
              <Ionicons
                name={competitionsOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
          </Pressable>

          <View style={styles.searchBlock}>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search team, stadium or city"
              leftIcon="search"
              variant="default"
              allowClear
            />
          </View>
        </View>
      </View>

      {competitionsOpen ? (
        <GlassCard variant="glass" level="default" style={styles.competitionPanel} padding={12}>
          <View style={styles.quickActions}>
            <Pressable
              onPress={selectAllLeagues || resetToFeatured}
              style={({ pressed }) => [
                styles.quickAction,
                !hasSelectedLeagues && styles.quickActionActive,
                pressed && styles.pressedLite,
              ]}
            >
              <Text
                style={[
                  styles.quickActionText,
                  !hasSelectedLeagues && styles.quickActionTextActive,
                ]}
              >
                All competitions
              </Text>
            </Pressable>

            {hasSelectedLeagues ? (
              <Pressable
                onPress={clearLeagues || resetToFeatured}
                style={({ pressed }) => [styles.quickActionMuted, pressed && styles.pressedLite]}
              >
                <Text style={styles.quickActionMutedText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            style={styles.competitionList}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {visibleLeagues.map((league) => {
              const active = selectedLeagueSet.has(league.leagueId);

              return (
                <Pressable
                  key={`${league.leagueId}-${league.slug}`}
                  onPress={() => toggleLeague(league.leagueId)}
                  onLongPress={() => selectSingleLeague(league.leagueId)}
                  style={({ pressed }) => [
                    styles.competitionRow,
                    active && styles.competitionRowActive,
                    pressed && styles.pressedLite,
                  ]}
                >
                  <View style={styles.leagueIdentity}>
                    <LeagueLogo logo={league.logo} size="sm" />
                    <LeagueFlag code={league.countryCode} size="sm" />
                  </View>

                  <View style={styles.leagueCopy}>
                    <Text style={styles.leagueText} numberOfLines={1}>
                      {league.label}
                    </Text>
                    <Text style={styles.leagueCountry} numberOfLines={1}>
                      {league.country}
                    </Text>
                  </View>

                  <Ionicons
                    name={active ? "checkmark-circle" : "add-circle-outline"}
                    size={19}
                    color={active ? theme.colors.emeraldSoft : theme.colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.competitionHelp}>
            Tap to add or remove. Long-press a competition to view only that one.
          </Text>
        </GlassCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },

  heroPanel: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
    padding: 16,
    gap: 14,
  },

  heroGlowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    right: -72,
    top: -86,
    backgroundColor: theme.colors.glowEmerald,
    opacity: 0.62,
  },

  heroGlowTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 999,
    left: -76,
    bottom: -88,
    backgroundColor: theme.colors.glowGold,
    opacity: 0.24,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.hero,
    lineHeight: 36,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.45,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "96%",
  },

  countPill: {
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },

  countNumber: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 21,
    fontWeight: theme.fontWeight.black,
  },

  countLabel: {
    color: theme.badge.textEmerald,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },

  livePill: {
    alignSelf: "flex-start",
    minHeight: 28,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: theme.colors.emeraldSoft,
  },

  livePillText: {
    color: theme.badge.textEmerald,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },

  errorText: {
    color: theme.colors.goldSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  dateHeroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  sectionHint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
    marginTop: 3,
  },

  rangeButton: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: theme.borderRadius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.badge.bgGold,
    borderWidth: 1,
    borderColor: theme.badge.borderGold,
  },

  rangeButtonText: {
    color: theme.badge.textGold,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },

  dateStripShell: {
    position: "relative",
  },

  rowScroll: {
    gap: 10,
    paddingRight: 26,
  },

  scrollFadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: "rgba(5,5,5,0.26)",
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },

  datePill: {
    minWidth: 78,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  datePillActive: {
    backgroundColor: theme.colors.emerald,
    borderColor: theme.colors.borderEmerald,
  },

  dateTop: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },

  dateTopActive: {
    color: theme.colors.textOnBrand,
  },

  dateBottom: {
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
  },

  dateBottomActive: {
    color: theme.colors.textOnBrand,
  },

  datePillGhost: {
    minHeight: 58,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  dateGhostText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  controlsRow: {
    gap: 10,
  },

  competitionSelector: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  competitionTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  controlLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  competitionSummary: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
  },

  competitionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  selectedCountPill: {
    minWidth: 26,
    height: 26,
    borderRadius: theme.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },

  selectedCountText: {
    color: theme.badge.textEmerald,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },

  searchBlock: {
    marginTop: 0,
  },

  competitionPanel: {
    borderRadius: 18,
    maxHeight: 340,
  },

  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  quickAction: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.badge.bgNeutral,
    borderWidth: 1,
    borderColor: theme.badge.borderNeutral,
  },

  quickActionActive: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },

  quickActionText: {
    color: theme.badge.textNeutral,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },

  quickActionTextActive: {
    color: theme.badge.textEmerald,
  },

  quickActionMuted: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  quickActionMutedText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },

  competitionList: {
    maxHeight: 250,
  },

  competitionRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "transparent",
  },

  competitionRowActive: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },

  leagueIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 44,
  },

  leagueCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  leagueText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
  },

  leagueCountry: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: theme.fontWeight.bold,
  },

  competitionHelp: {
    marginTop: 10,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  pressedCard: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },

  pressedLite: {
    opacity: 0.9,
  },
});
