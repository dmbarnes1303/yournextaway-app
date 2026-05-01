// src/features/fixtures/FixtureRowCard.tsx
import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import Button from "@/src/components/Button";
import { theme } from "@/src/constants/theme";
import { getCountryBackdrop } from "@/src/constants/visualAssets";

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

function clean(v: unknown) {
  return String(v ?? "").trim();
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

  const leagueName = clean(item?.league?.name) || "Competition";
  const leagueLogo = (item?.league as any)?.logo;
  const countryCode = (item?.league as any)?.countryCode;
  const countryName = clean((item?.league as any)?.country);

  const kickoff = kickoffPresentation(item, new Set());
  const locationLine = getLocationLine(item);

  const routeCtx: FixtureRouteCtx = {
    leagueId: item?.league?.id ?? null,
    season: (item?.league as any)?.season ?? null,
  };

  const backdrop = getCountryBackdrop(countryCode);

  return (
    <View style={styles.wrap}>
      <GlassCard variant="glass" level="default" style={styles.card} padding={0}>
        {backdrop ? (
          <ImageBackground source={{ uri: backdrop }} style={styles.bg} imageStyle={styles.bgImg}>
            <View style={styles.bgOverlay} />
            <View style={styles.bgBottomShade} />
            <View style={styles.bgEmeraldWash} />
          </ImageBackground>
        ) : (
          <View pointerEvents="none" style={styles.fallbackBg} />
        )}

        <View style={styles.inner}>
          <View style={styles.topRow}>
            <View style={styles.leagueRow}>
              <View style={styles.logoCluster}>
                {leagueLogo ? (
                  <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} resizeMode="contain" />
                ) : null}
                {countryCode ? <LeagueFlag code={countryCode} size="sm" /> : null}
              </View>

              <View style={styles.leagueCopy}>
                <Text style={styles.leagueText} numberOfLines={1}>
                  {leagueName}
                </Text>
                <Text style={styles.countryText} numberOfLines={1}>
                  {countryName || "Football"}
                </Text>
              </View>
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
              <View style={styles.crestFrame}>
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

              <View style={styles.kickoffPlate}>
                <Text style={styles.kickoffTime}>{kickoff.time}</Text>
              </View>

              <View style={styles.vsPill}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            </View>

            <View style={styles.teamCol}>
              <View style={styles.crestFrame}>
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
              style={styles.primary}
              glow
            />
          </View>

          <View style={styles.secondaryActionRow}>
            <Button
              label="Details"
              onPress={() => onPressMatch(fixtureId, routeCtx)}
              tone="secondary"
              size="sm"
              style={styles.secondary}
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
    borderRadius: 26,
    overflow: "hidden",
    borderColor: theme.colors.borderSubtle,
  },

  bg: {
    ...StyleSheet.absoluteFillObject,
  },

  bgImg: {
    opacity: 0.3,
  },

  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.68)",
  },

  bgBottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "46%",
    backgroundColor: "rgba(0,0,0,0.34)",
  },

  bgEmeraldWash: {
    position: "absolute",
    right: -46,
    top: 34,
    bottom: 40,
    width: 110,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.glowEmerald,
    opacity: 0.42,
  },

  fallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
  },

  inner: {
    padding: 14,
    gap: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  leagueRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  logoCluster: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },

  leagueLogo: {
    width: 22,
    height: 22,
  },

  leagueCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },

  leagueText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    lineHeight: 15,
  },

  countryText: {
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },

  timeChip: {
    minHeight: 31,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },

  timeChipText: {
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
    minWidth: 0,
    alignItems: "center",
    gap: 7,
  },

  crestFrame: {
    width: 62,
    height: 62,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  teamName: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 18,
  },

  centerCol: {
    width: 88,
    alignItems: "center",
    gap: 7,
  },

  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  kickoffPlate: {
    minWidth: 76,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.30)" : "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
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
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  primaryActionRow: {
    flexDirection: "row",
  },

  primary: {
    flex: 1,
  },

  secondaryActionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },

  secondary: {
    flex: 1,
  },

  alertsButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.borderRadius.button,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor:
      Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
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
