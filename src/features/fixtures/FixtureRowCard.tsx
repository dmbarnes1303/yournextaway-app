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

function getCountry(item: RankedFixtureRow) {
  return clean((item?.league as any)?.country);
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

  const leagueName = clean(item?.league?.name) || "Competition";
  const leagueLogo = (item?.league as any)?.logo;
  const countryCode = (item?.league as any)?.countryCode;
  const country = getCountry(item);

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
        <View style={styles.goldGlint} pointerEvents="none" />
        <View style={styles.sideGlow} pointerEvents="none" />

        <View style={styles.identityRow}>
          <View style={styles.competitionWrap}>
            <View style={styles.logoStack}>
              {leagueLogo ? <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} /> : null}
              {countryCode ? <LeagueFlag code={countryCode} size="sm" /> : null}
            </View>

            <View style={styles.competitionTextWrap}>
              <Text style={styles.leagueText} numberOfLines={1}>
                {leagueName}
              </Text>
              <Text style={styles.countryText} numberOfLines={1}>
                {country || "Football trip"}
              </Text>
            </View>
          </View>

          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={13} color={theme.colors.emeraldSoft} />
            <Text style={styles.timeBadgeText} numberOfLines={1}>
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

        <View style={styles.primaryActionRow}>
          <Button
            label="Start trip"
            onPress={() => onPressBuildTrip(fixtureId, routeCtx)}
            tone="primary"
            size="sm"
            glow
            style={styles.startTripButton}
          />
        </View>

        <View style={styles.secondaryActionRow}>
          <Button
            label="Details"
            onPress={() => onPressMatch(fixtureId, routeCtx)}
            tone="secondary"
            size="sm"
            style={styles.secondaryButton}
          />

          <Pressable
            onPress={onToggleFollow}
            style={({ pressed }) => [
              styles.alertsButton,
              isFollowed && styles.alertsButtonActive,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={isFollowed ? "notifications" : "notifications-outline"}
              size={15}
              color={isFollowed ? theme.badge.textEmerald : theme.colors.textSecondary}
            />
            <Text style={[styles.alertsText, isFollowed && styles.alertsTextActive]}>
              {isFollowed ? "Alerts on" : "Alerts"}
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
    marginBottom: 14,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 26,
    gap: 14,
    borderColor: theme.colors.borderSubtle,
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
  },

  topGlow: {
    position: "absolute",
    left: -40,
    right: -40,
    top: -92,
    height: 132,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  goldGlint: {
    position: "absolute",
    left: 24,
    top: 0,
    width: 90,
    height: 1,
    backgroundColor: theme.colors.glowGold,
  },

  sideGlow: {
    position: "absolute",
    right: -50,
    top: 42,
    bottom: 34,
    width: 104,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.glowEmerald,
    opacity: 0.38,
  },

  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  competitionWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  logoStack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  leagueLogo: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },

  competitionTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },

  leagueText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: theme.fontWeight.black,
  },

  countryText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: theme.fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },

  timeBadge: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },

  timeBadgeText: {
    color: theme.badge.textEmerald,
    fontSize: 12,
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
    gap: 8,
    minWidth: 0,
  },

  crestShell: {
    width: 62,
    height: 62,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.045)",
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
    width: 94,
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
    minWidth: 78,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  kickoffTime: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 21,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.1,
  },

  vsPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
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
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
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

  primaryActionRow: {
    flexDirection: "row",
  },

  startTripButton: {
    flex: 1,
  },

  secondaryActionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },

  secondaryButton: {
    flex: 1,
  },

  alertsButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.button,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  alertsButtonActive: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },

  alertsText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  alertsTextActive: {
    color: theme.badge.textEmerald,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
