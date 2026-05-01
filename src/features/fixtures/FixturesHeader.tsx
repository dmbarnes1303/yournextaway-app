// src/features/fixtures/FixturesHeader.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Input from "@/src/components/Input";
import { theme } from "@/src/constants/theme";
import { FEATURED_LEAGUES, type LeagueOption } from "@/src/constants/football";

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
  selectedLeagueIds: number[];
  selectedLeagues: LeagueOption[];
  toggleLeague: (id: number) => void;
  selectSingleLeague: (id: number) => void;
  resetToFeatured: () => void;
  titleText?: string;
  subtitleText?: string;
  helperLineText?: string;
  headerDateLine?: string;
  loading?: boolean;
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
  selectedLeagueIds,
  selectedLeagues,
  toggleLeague,
  selectSingleLeague,
  resetToFeatured,
  titleText,
  subtitleText,
  helperLineText,
  headerDateLine,
  loading = false,
  error = null,
  filteredCount,
}: Props) {
  const hasCustomLeagues = selectedLeagueIds.length > 0;
  const hasMultiLeagueSelection = hasCustomLeagues && selectedLeagues.length > 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.heroBlock}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTag}>
            <Text style={styles.heroTagText}>Fixtures</Text>
          </View>

          {typeof filteredCount === "number" ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {filteredCount} match{filteredCount === 1 ? "" : "es"}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{titleText || "Fixtures"}</Text>

        <Text style={styles.subtitle}>
          {subtitleText || "Browse upcoming matches and start planning"}
        </Text>

        {headerDateLine ? <Text style={styles.dateLine}>{headerDateLine}</Text> : null}
        {helperLineText ? <Text style={styles.helperLine}>{helperLineText}</Text> : null}

        {loading ? (
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Refreshing live fixtures</Text>
            </View>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={[styles.statusRow, styles.statusRowError]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.searchBlock}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search team, city or country"
          leftIcon="search"
          variant="default"
          allowClear
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionLabel}>Dates</Text>
            <Text style={styles.sectionHint}>
              {isRange ? "Custom range active" : "Tap a day or choose a range"}
            </Text>
          </View>

          <Pressable
            onPress={openCalendar}
            style={({ pressed }) => [styles.actionPillGold, pressed && styles.pressedLite]}
            hitSlop={10}
          >
            <Ionicons name="calendar-outline" size={14} color={theme.colors.goldSoft} />
            <Text style={styles.actionPillGoldText}>Calendar</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowScroll}>
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
                <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>{d.bottom}</Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={openCalendar}
            style={({ pressed }) => [styles.datePillGhost, pressed && styles.pressedCard]}
            android_ripple={{ color: "rgba(255,255,255,0.06)" }}
          >
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.dateGhostText}>Range</Text>
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionLabel}>Top leagues</Text>
            <Text style={styles.sectionHint}>
              Tap one for a clean view. Remove pills below for multi-select.
            </Text>
          </View>

          {hasCustomLeagues ? (
            <Pressable
              onPress={resetToFeatured}
              style={({ pressed }) => [styles.actionPillMuted, pressed && styles.pressedLite]}
              hitSlop={10}
            >
              <Text style={styles.actionPillMutedText}>Reset</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowScroll}>
          {FEATURED_LEAGUES.map((l) => {
            const active = selectedLeagueIds.length === 1 && selectedLeagueIds[0] === l.leagueId;

            return (
              <Pressable
                key={l.leagueId}
                onPress={() => selectSingleLeague(l.leagueId)}
                style={({ pressed }) => [
                  styles.leagueChip,
                  active && styles.leagueChipActive,
                  pressed && styles.pressedCard,
                ]}
                android_ripple={{ color: "rgba(255,255,255,0.06)" }}
              >
                <View style={styles.leagueIdentity}>
                  <LeagueLogo logo={l.logo} size="sm" />
                  <LeagueFlag code={l.countryCode} size="sm" />
                </View>

                <Text style={[styles.leagueText, active && styles.leagueTextActive]}>{l.label}</Text>

                {active ? <View style={styles.leagueActiveGlow} pointerEvents="none" /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {hasMultiLeagueSelection ? (
          <View style={styles.selectedWrap}>
            <Text style={styles.selectedLabel}>Selected leagues</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowScroll}>
              {selectedLeagues.map((l) => (
                <Pressable
                  key={l.leagueId}
                  onPress={() => toggleLeague(l.leagueId)}
                  style={({ pressed }) => [styles.selectedPill, pressed && styles.pressedCard]}
                  android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                >
                  <LeagueLogo logo={l.logo} size="sm" />
                  <Text style={styles.selectedText}>{l.label}</Text>
                  <Ionicons name="close" size={12} color={theme.colors.textPrimary} style={styles.selectedClose} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  heroBlock: { gap: 8 },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heroTag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgGold,
    borderWidth: 1,
    borderColor: theme.badge.borderGold,
    alignSelf: "flex-start",
  },
  heroTagText: {
    color: theme.badge.textGold,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },
  countPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  countPillText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.hero,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "92%",
  },
  dateLine: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },
  helperLine: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },
  statusRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statusRowError: { marginTop: 4 },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },
  statusPillText: {
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
  searchBlock: { marginTop: 2 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitleWrap: { flex: 1, gap: 3 },
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
  },
  actionPillGold: {
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
  actionPillGoldText: {
    color: theme.badge.textGold,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },
  actionPillMuted: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: theme.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  actionPillMutedText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },
  rowScroll: {
    gap: 10,
    paddingRight: 8,
  },
  datePill: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  datePillActive: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },
  dateTop: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  dateTopActive: { color: theme.badge.textEmerald },
  dateBottom: {
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
  },
  dateBottomActive: { color: theme.colors.textPrimary },
  datePillGhost: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
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
  leagueChip: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    overflow: "hidden",
  },
  leagueChipActive: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },
  leagueIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  leagueText: {
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
  },
  leagueTextActive: { color: theme.colors.textPrimary },
  leagueActiveGlow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: -11,
    height: 24,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.glowEmerald,
  },
  selectedWrap: {
    gap: 8,
    marginTop: 2,
  },
  selectedLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },
  selectedText: {
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
  },
  selectedClose: { opacity: 0.9 },
  pressedCard: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  pressedLite: { opacity: 0.9 },
});
