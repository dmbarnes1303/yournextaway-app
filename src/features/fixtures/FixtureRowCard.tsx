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

  const leagueName = clean(item?.league?.name);
  const leagueLogo = (item?.league as any)?.logo;
  const countryCode = (item?.league as any)?.countryCode;

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
        {/* BACKDROP */}
        {backdrop ? (
          <ImageBackground source={{ uri: backdrop }} style={styles.bg} imageStyle={styles.bgImg}>
            <View style={styles.bgOverlay} />
          </ImageBackground>
        ) : null}

        <View style={styles.inner}>
          {/* TOP ROW */}
          <View style={styles.topRow}>
            <View style={styles.leagueRow}>
              {leagueLogo ? <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} /> : null}
              {countryCode ? <LeagueFlag code={countryCode} size="sm" /> : null}
              <Text style={styles.leagueText}>{leagueName}</Text>
            </View>

            <View style={styles.timeChip}>
              <Ionicons name="time-outline" size={13} color={theme.colors.emeraldSoft} />
              <Text style={styles.timeChipText}>{kickoff.time}</Text>
            </View>
          </View>

          {/* MATCH */}
          <View style={styles.matchRow}>
            <View style={styles.teamCol}>
              <TeamCrest name={home} logo={item?.teams?.home?.logo} />
              <Text style={styles.teamName}>{home}</Text>
            </View>

            <View style={styles.centerCol}>
              <Text style={styles.dateText}>{kickoff.date}</Text>
              <Text style={styles.kickoffTime}>{kickoff.time}</Text>
            </View>

            <View style={styles.teamCol}>
              <TeamCrest name={away} logo={item?.teams?.away?.logo} />
              <Text style={styles.teamName}>{away}</Text>
            </View>
          </View>

          {locationLine ? (
            <Text style={styles.location}>{locationLine}</Text>
          ) : null}

          {/* ACTIONS */}
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

            <Pressable onPress={onToggleFollow} style={styles.follow}>
              <Ionicons
                name={isFollowed ? "notifications" : "notifications-outline"}
                size={16}
                color={theme.colors.textSecondary}
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
  },

  bg: {
    ...StyleSheet.absoluteFillObject,
  },

  bgImg: {
    opacity: 0.25,
  },

  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  inner: {
    padding: 14,
    gap: 12,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  leagueRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  leagueLogo: {
    width: 20,
    height: 20,
  },

  leagueText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 11,
  },

  timeChip: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.badge.bgEmerald,
  },

  timeChipText: {
    color: theme.badge.textEmerald,
    fontSize: 11,
    fontWeight: "900",
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  teamCol: {
    flex: 1,
    alignItems: "center",
  },

  teamName: {
    color: theme.colors.textPrimary,
    fontWeight: "900",
    textAlign: "center",
  },

  centerCol: {
    width: 80,
    alignItems: "center",
  },

  dateText: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },

  kickoffTime: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },

  location: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 12,
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
    width: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
});
