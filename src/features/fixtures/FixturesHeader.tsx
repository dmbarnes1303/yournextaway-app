import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Input from "@/src/components/Input";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import {
  FEATURED_LEAGUES,
  type LeagueOption,
} from "@/src/constants/football";

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
}: Props) {
  const hasCustomLeagues = selectedLeagueIds.length > 0;

  return (
    <View style={styles.wrap}>
      {/* TITLE */}
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Fixtures</Text>
        <Text style={styles.subtitle}>
          Browse upcoming matches and start planning
        </Text>
      </View>

      {/* SEARCH */}
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search team, city, or country"
        leftIcon="search"
        variant="default"
        allowClear
      />

      {/* DATE STRIP */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Dates</Text>
          <Pressable onPress={openCalendar}>
            <Text style={styles.link}>Select range</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stripDays.map((d) => {
            const active = !isRange && d.iso === selectedDay;

            return (
              <Pressable
                key={d.iso}
                onPress={() => onTapStripDate(d.iso)}
                style={[styles.datePill, active && styles.datePillActive]}
              >
                <Text style={styles.dateTop}>{d.top}</Text>
                <Text style={styles.dateBottom}>{d.bottom}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* LEAGUES */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Leagues</Text>
          {hasCustomLeagues && (
            <Pressable onPress={resetToFeatured}>
              <Text style={styles.link}>Reset</Text>
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FEATURED_LEAGUES.map((l) => {
            const active =
              selectedLeagueIds.length === 1 &&
              selectedLeagueIds[0] === l.leagueId;

            return (
              <Pressable
                key={l.leagueId}
                onPress={() => selectSingleLeague(l.leagueId)}
                style={[styles.leagueChip, active && styles.leagueChipActive]}
              >
                <LeagueLogo logo={l.logo} size="sm" />
                <LeagueFlag code={l.countryCode} size="sm" />
                <Text style={styles.leagueText}>{l.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected multi */}
        {hasCustomLeagues && selectedLeagues.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedLeagues.map((l) => (
              <Pressable
                key={l.leagueId}
                onPress={() => toggleLeague(l.leagueId)}
                style={styles.selectedPill}
              >
                <LeagueLogo logo={l.logo} size="sm" />
                <Text style={styles.selectedText}>{l.label}</Text>
                <Ionicons name="close" size={12} color={theme.colors.text} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: 14,
  },

  titleWrap: {
    gap: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
  },

  section: {
    gap: 6,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  label: {
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },

  link: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },

  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  datePillActive: {
    backgroundColor: "rgba(87,162,56,0.12)",
  },

  dateTop: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },

  dateBottom: {
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },

  leagueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  leagueChipActive: {
    backgroundColor: "rgba(87,162,56,0.12)",
  },

  leagueText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },

  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: "rgba(87,162,56,0.12)",
  },

  selectedText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },
});
