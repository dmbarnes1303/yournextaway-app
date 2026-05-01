// src/features/fixtures/FixtureRowCard.tsx
import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import Button from "@/src/components/Button";
import { theme } from "@/src/constants/theme";
import { getFixtureBackdrop } from "@/src/constants/visualAssets";

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

  const leagueId = item?.league?.id ?? null;
  const leagueName = clean(item?.league?.name) || "Competition";
  const leagueLogo = (item?.league as any)?.logo;
  const countryCode = (item?.league as any)?.countryCode;

  const kickoff = kickoffPresentation(item, new Set());
  const locationLine = getLocationLine(item);

  const routeCtx: FixtureRouteCtx = {
    leagueId,
    season: (item?.league as any)?.season ?? null,
  };

  const backdrop = getFixtureBackdrop({
    leagueId,
    countryCode,
  });

  return (
    <View style={styles.wrap}>
      <GlassCard variant="glass" level="default" style={styles.card} padding={0}>
        {backdrop ? (
          <ImageBackground
            source={{ uri: backdrop }}
            style={styles.bg}
            imageStyle={styles.bgImg}
            resizeMode="cover"
          >
            <View style={styles.bgOverlay} />
            <View style={styles.bottomShade} />
          </ImageBackground>
        ) : (
          <View style={styles.fallbackBg} />
        )}

        <View style={styles.inner}>
          <View style={styles.topRow}>
            <View style={styles.leagueRow}>
              {leagueLogo ? (
                <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} resizeMode="contain" />
              ) : null}

              {countryCode ? <LeagueFlag code={countryCode} size="sm" /> : null}

              <Text style={styles.leagueText} numberOfLines={1}>
                {leagueName}
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
              <TeamCrest name={home} logo={item?.teams?.home?.logo} />
              <Text style={styles.teamName} numberOfLines={2}>
                {home}
              </Text>
            </View>

            <View style={styles.centerCol}>
              <Text style={styles.dateText} numberOfLines={1}>
                {kickoff.date}
              </Text>

              <View style={styles.kickoffBox}>
                <Text style={styles.kickoffTime} numberOfLines={1}>
                  {kickoff.time}
                </Text>
              </View>

              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.teamCol}>
              <TeamCrest name={away} logo={item?.teams?.away?.logo} />
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
              label="Start trip"
              onPress={() => onPressBuildTrip(fixtureId, routeCtx)}
              tone="primary"
              size="sm"
              style={styles.primary}
              glow
            />

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
                styles.follow,
                isFollowed && styles.followActive,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Ionicons
                name={isFollowed ? "notifications" : "notifications-outline"}
                size={16}
                color={isFollowed ? theme.badge.textEmerald : theme.colors.textSecondary}
              />
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
    marginBottom: 12,
  },

  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderColor: theme.colors.borderSubtle,
  },

  bg: {
    ...StyleSheet.absoluteFillObject,
  },

  bgImg: {
    opacity: 0.34,
  },

  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.66)",
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "46%",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  fallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgSurface,
  },

  inner: {
    padding: 14,
    gap: 12,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  leagueRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  leagueLogo: {
    width: 20,
    height: 20,
  },

  leagueText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },

  timeChipText: {
    color: theme.badge.textEmerald,
    fontSize: 11,
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

  teamName: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 18,
  },

  centerCol: {
    width: 84,
    alignItems: "center",
    gap: 6,
  },

  dateText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  kickoffBox: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.34)",
  },

  kickoffTime: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  vsText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  locationRow: {
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  location: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  primary: {
    flex: 1.4,
  },

  secondary: {
    flex: 1,
  },

  follow: {
    width: 42,
    borderRadius: theme.borderRadius.button,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.24)",
  },

  followActive: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
