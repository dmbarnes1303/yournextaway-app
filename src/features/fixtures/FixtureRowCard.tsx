// src/features/fixtures/FixtureRowCard.tsx
import React, { memo } from "react";
import { View, Text, StyleSheet, Image, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import Button from "@/src/components/Button";
import { theme } from "@/src/constants/theme";

import { LeagueFlag, TeamCrest, kickoffPresentation } from "./helpers";
import type { RankedFixtureRow, FixtureRouteCtx } from "./types";

type Props = {
  item: RankedFixtureRow;
  expanded: boolean;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onPressMatch: (id: string, ctx?: FixtureRouteCtx) => void;
  onPressBuildTrip: (id: string, ctx?: FixtureRouteCtx) => void;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function getLocationLine(item: RankedFixtureRow) {
  const city = clean(item?.fixture?.venue?.city);
  const venue = clean(item?.fixture?.venue?.name);
  return [city, venue].filter(Boolean).join(" • ");
}

function Row({
  item,
  isFollowed,
  onToggleFollow,
  onPressMatch,
  onPressBuildTrip,
}: Props) {
  const fixtureId = String(item?.fixture?.id ?? "");

  const home = clean(item?.teams?.home?.name) || "Home";
  const away = clean(item?.teams?.away?.name) || "Away";

  const leagueName = clean(item?.league?.name);
  const leagueLogo = (item?.league as any)?.logo;
  const countryCode = (item?.league as any)?.countryCode;

  const kickoff = kickoffPresentation(item, new Set());
  const locationLine = getLocationLine(item);

  const routeCtx: FixtureRouteCtx = {
    leagueId: item?.league?.id ?? null,
    season: (item?.league as any)?.season ?? null,
  };

  return (
    <View style={styles.wrap}>
      <GlassCard variant="glass" level="default" style={styles.card} padding={14}>
        <View style={styles.topGlow} pointerEvents="none" />
        <View style={styles.sideGlow} pointerEvents="none" />

        <View style={styles.topRow}>
          <View style={styles.leagueRow}>
            {leagueLogo ? <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} /> : null}
            {countryCode ? <LeagueFlag code={countryCode} size="sm" /> : null}
            <Text style={styles.leagueText} numberOfLines={1}>
              {leagueName || "Competition"}
            </Text>
          </View>

          <View style={styles.timeChip}>
            <Ionicons name="time-outline" size={13} color={theme.colors.emeraldSoft} />
            <Text style={styles.timeChipText} numberOfLines={1}>
              {kickoff.time}
            </Text>
          </View>
        </View>

        <View style={styles.matchRow}>
          <View style={styles.teamCol}>
            <View style={styles.crestShell}>
              <TeamCrest name={home} logo={item?.teams?.home?.logo} />
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {home}
            </Text>
          </View>

          <View style={styles.centerCol}>
            <Text style={styles.dateText} numberOfLines={1}>
              {kickoff.date}
            </Text>

            <View style={styles.kickoffBox}>
              <Text style={styles.kickoffTime}>{kickoff.time}</Text>
              <Text style={styles.kickoffLabel}>local</Text>
            </View>

            <View style={styles.vsPill}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          </View>

          <View style={styles.teamCol}>
            <View style={styles.crestShell}>
              <TeamCrest name={away} logo={item?.teams?.away?.logo} />
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {away}
            </Text>
          </View>
        </View>

        {locationLine ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {locationLine}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Button
            label="Match"
            onPress={() => onPressMatch(fixtureId, routeCtx)}
            tone="primary"
            size="sm"
            style={styles.actionButton}
          />

          <Button
            label="Trip"
            onPress={() => onPressBuildTrip(fixtureId, routeCtx)}
            tone="secondary"
            size="sm"
            style={styles.actionButton}
          />

          <Pressable
            onPress={onToggleFollow}
            style={({ pressed }) => [
              styles.followPill,
              isFollowed && styles.followPillActive,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={isFollowed ? "notifications" : "notifications-outline"}
              size={14}
              color={isFollowed ? theme.badge.textEmerald : theme.colors.textSecondary}
            />
            <Text style={[styles.followText, isFollowed && styles.followTextActive]}>
              Follow
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
}

export default memo(Row);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 12,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    gap: 14,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
  },

  topGlow: {
    position: "absolute",
    left: -24,
    right: -24,
    top: -82,
    height: 116,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: "rgba(255,255,255,0.028)",
  },

  sideGlow: {
    position: "absolute",
    right: -38,
    top: 34,
    bottom: 34,
    width: 84,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.glowEmerald,
    opacity: 0.35,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  leagueRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },

  leagueLogo: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },

  leagueText: {
    flexShrink: 1,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
  },

  timeChip: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: theme.borderRadius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },

  timeChipText: {
    color: theme.badge.textEmerald,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  teamCol: {
    flex: 1,
    alignItems: "center",
    gap: 7,
    minWidth: 0,
  },

  crestShell: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.24)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  teamName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  centerCol: {
    width: 96,
    alignItems: "center",
    gap: 7,
  },

  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.25,
  },

  kickoffBox: {
    minWidth: 74,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.24)" : "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  kickoffTime: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.1,
  },

  kickoffLabel: {
    color: theme.colors.textMuted,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },

  vsPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgNeutral,
    borderWidth: 1,
    borderColor: theme.badge.borderNeutral,
  },

  vsText: {
    color: theme.colors.textMuted,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
  },

  locationRow: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  location: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },

  actionButton: {
    flex: 1,
    minWidth: 0,
  },

  followPill: {
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.button,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  followPillActive: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },

  followText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },

  followTextActive: {
    color: theme.badge.textEmerald,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
