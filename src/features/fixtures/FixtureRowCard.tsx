import React, { memo } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";

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

function Row({ item, isFollowed, onToggleFollow, onPressMatch, onPressBuildTrip }: Props) {
  const fixtureId = String(item.fixture?.id ?? "");

  const home = item.teams?.home?.name || "Home";
  const away = item.teams?.away?.name || "Away";

  const leagueName = item.league?.name || "";
  const leagueLogo = (item.league as any)?.logo;
  const countryCode = (item.league as any)?.countryCode;

  const kickoff = kickoffPresentation(item, new Set());

  const city = item.fixture?.venue?.city || "";
  const venue = item.fixture?.venue?.name || "";

  const routeCtx: FixtureRouteCtx = {
    leagueId: item.league?.id ?? null,
    season: (item as any)?.league?.season ?? null,
  };

  return (
    <View style={styles.wrap}>
      <GlassCard style={styles.card}>

        {/* LEAGUE */}
        <View style={styles.leagueRow}>
          {leagueLogo && (
            <Image source={{ uri: leagueLogo }} style={styles.logo} />
          )}
          {countryCode && <LeagueFlag code={countryCode} size="sm" />}
          <Text style={styles.leagueText}>{leagueName}</Text>
        </View>

        {/* TEAMS */}
        <View style={styles.teamsRow}>
          <View style={styles.team}>
            <TeamCrest name={home} logo={item.teams?.home?.logo} />
            <Text style={styles.teamName}>{home}</Text>
          </View>

          <View style={styles.center}>
            <Text style={styles.kickoff}>{kickoff.primary}</Text>
          </View>

          <View style={styles.team}>
            <TeamCrest name={away} logo={item.teams?.away?.logo} />
            <Text style={styles.teamName}>{away}</Text>
          </View>
        </View>

        {/* LOCATION */}
        {(city || venue) && (
          <Text style={styles.location}>
            {[city, venue].filter(Boolean).join(" • ")}
          </Text>
        )}

        {/* CTA */}
        <View style={styles.ctaRow}>
          <Button
            label="View match"
            onPress={() => onPressMatch(fixtureId, routeCtx)}
            tone="primary"
            size="sm"
            style={styles.primary}
          />

          <Button
            label="Plan trip"
            onPress={() => onPressBuildTrip(fixtureId, routeCtx)}
            tone="secondary"
            size="sm"
            style={styles.secondary}
          />

          <Pressable onPress={onToggleFollow} style={styles.follow}>
            <Text style={styles.followText}>
              {isFollowed ? "Following" : "Follow"}
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
    marginBottom: 10,
  },

  card: {
    padding: 14,
    borderRadius: 20,
  },

  leagueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  logo: {
    width: 20,
    height: 20,
  },

  leagueText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
  },

  teamsRow: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },

  team: {
    flex: 1,
    alignItems: "center",
  },

  teamName: {
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    color: theme.colors.text,
  },

  center: {
    width: 80,
    alignItems: "center",
  },

  kickoff: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
  },

  location: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    color: theme.colors.text,
  },

  ctaRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },

  primary: {
    flex: 1.2,
  },

  secondary: {
    flex: 1,
  },

  follow: {
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  followText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});
