// src/features/fixtures/FixtureRowCard.tsx
import React, { memo } from "react";
import { View, Text, StyleSheet, Image, Pressable, Platform } from "react-native";

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

type RecommendationTone = "top" | "strong" | "good";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function includesAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(term));
}

function hasRivalryBoost(home: string, away: string) {
  const pairs: Array<readonly [string, string]> = [
    ["arsenal", "tottenham"],
    ["barcelona", "real madrid"],
    ["bayern", "dortmund"],
    ["celtic", "rangers"],
    ["chelsea", "arsenal"],
    ["chelsea", "tottenham"],
    ["everton", "liverpool"],
    ["inter", "milan"],
    ["lazio", "roma"],
    ["manchester city", "manchester united"],
    ["real madrid", "atletico"],
    ["roma", "napoli"],
    ["tottenham", "west ham"],
  ];

  const h = home.toLowerCase();
  const a = away.toLowerCase();

  return pairs.some(([x, y]) => {
    return (h.includes(x) && a.includes(y)) || (h.includes(y) && a.includes(x));
  });
}

function leagueBaseScore(leagueId?: number | null) {
  if (leagueId === 39) return 130;
  if (leagueId === 140) return 116;
  if (leagueId === 135) return 112;
  if (leagueId === 78) return 104;
  if (leagueId === 61) return 98;
  if (leagueId === 88) return 92;
  if (leagueId === 94) return 90;
  return 68;
}

function kickoffTimingScore(dt: Date) {
  const day = dt.getDay();
  const hr = dt.getHours();

  let s = 0;

  if (day === 6) s += 22;
  else if (day === 0) s += 18;
  else if (day === 5) s += 14;
  else if (day === 3 || day === 2) s += 6;
  else if (day === 1 || day === 4) s += 2;

  if (day === 6 && hr >= 14 && hr <= 20) s += 12;
  else if (day === 0 && hr >= 13 && hr <= 19) s += 9;
  else if (day === 5 && hr >= 18 && hr <= 21) s += 8;
  else if (hr >= 17 && hr <= 21) s += 7;
  else if (hr >= 12 && hr <= 16) s += 3;

  return s;
}

const MARQUEE_TEAM_TERMS = [
  "arsenal",
  "aston villa",
  "atletico",
  "atlético",
  "ajax",
  "bayern",
  "benfica",
  "borussia dortmund",
  "barcelona",
  "celtic",
  "chelsea",
  "dortmund",
  "fenerbahce",
  "fenerbahçe",
  "galatasaray",
  "inter",
  "juventus",
  "lazio",
  "liverpool",
  "manchester city",
  "manchester united",
  "milan",
  "napoli",
  "newcastle",
  "olympiacos",
  "porto",
  "psg",
  "paris saint-germain",
  "real madrid",
  "roma",
  "rangers",
  "sl benfica",
  "sporting",
  "tottenham",
  "tottenham hotspur",
  "west ham",
] as const;

const DESTINATION_CITY_TERMS = [
  "amsterdam",
  "barcelona",
  "berlin",
  "bilbao",
  "dortmund",
  "florence",
  "glasgow",
  "istanbul",
  "lisbon",
  "liverpool",
  "london",
  "madrid",
  "manchester",
  "milan",
  "munich",
  "naples",
  "napoli",
  "porto",
  "prague",
  "rome",
  "san sebastian",
  "seville",
  "turin",
  "valencia",
  "vienna",
] as const;

const ICONIC_VENUE_TERMS = [
  "allianz arena",
  "anfield",
  "bernabeu",
  "camp nou",
  "celtic park",
  "emirates",
  "estadio da luz",
  "ibrox",
  "johan cruijff arena",
  "mestalla",
  "old trafford",
  "olympico",
  "san siro",
  "signal iduna park",
  "stamford bridge",
  "tottenham hotspur stadium",
  "wanda metropolitano",
  "wembley",
] as const;

function scoreFixture(item: RankedFixtureRow): number {
  let s = 0;

  const leagueId = item?.league?.id;
  const home = clean(item?.teams?.home?.name);
  const away = clean(item?.teams?.away?.name);
  const venue = clean(item?.fixture?.venue?.name);
  const city = clean(item?.fixture?.venue?.city);

  const teamsText = `${home} ${away}`.toLowerCase();
  const locationText = `${venue} ${city}`.toLowerCase();

  s += leagueBaseScore(leagueId);

  if (venue) s += 10;
  if (city) s += 8;
  if (includesAny(teamsText, MARQUEE_TEAM_TERMS)) s += 18;
  if (includesAny(city.toLowerCase(), DESTINATION_CITY_TERMS)) s += 16;
  if (includesAny(locationText, ICONIC_VENUE_TERMS)) s += 14;
  if (hasRivalryBoost(home, away)) s += 26;

  const dt = item?.fixture?.date ? new Date(item.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) s += kickoffTimingScore(dt);

  if (home && away) {
    const longNames = (home.length >= 8 ? 1 : 0) + (away.length >= 8 ? 1 : 0);
    if (longNames === 2) s += 4;
  }

  return s;
}

function getRecommendationTone(item: RankedFixtureRow): RecommendationTone {
  const score = scoreFixture(item);
  if (score >= 150) return "top";
  if (score >= 110) return "strong";
  return "good";
}

function getRecommendationCopy(tone: RecommendationTone) {
  if (tone === "top") return { label: "Top Pick", sublabel: "Best travel angle" };
  if (tone === "strong") return { label: "Strong Pick", sublabel: "Great weekend option" };
  return { label: "Good Option", sublabel: "Worth a closer look" };
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

  const tone = getRecommendationTone(item);
  const recommendation = getRecommendationCopy(tone);

  return (
    <View style={styles.wrap}>
      <GlassCard variant="glass" level="default" style={styles.card} padding={15}>
        <View style={styles.topGlow} pointerEvents="none" />
        <View style={styles.bottomGlow} pointerEvents="none" />

        <View style={styles.topRow}>
          <View style={styles.leagueRow}>
            {leagueLogo ? <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} /> : null}
            {countryCode ? <LeagueFlag code={countryCode} size="sm" /> : null}
            <Text style={styles.leagueText} numberOfLines={1}>
              {leagueName || "League"}
            </Text>
          </View>

          <View
            style={[
              styles.recommendationPill,
              tone === "top"
                ? styles.recommendationPillTop
                : tone === "strong"
                  ? styles.recommendationPillStrong
                  : styles.recommendationPillGood,
            ]}
          >
            <Text
              style={[
                styles.recommendationPillText,
                tone === "top"
                  ? styles.recommendationPillTextTop
                  : tone === "strong"
                    ? styles.recommendationPillTextStrong
                    : styles.recommendationPillTextGood,
              ]}
            >
              {recommendation.label}
            </Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          <View style={styles.teamCol}>
            <View style={styles.crestShell}>
              <TeamCrest name={home} logo={item?.teams?.home?.logo} />
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {home}
            </Text>
          </View>

          <View style={styles.centerCol}>
            <View style={styles.vsLine} />
            <View style={styles.kickoffPill}>
              <Text style={styles.kickoffText}>{kickoff.primary}</Text>
            </View>
            <Text style={styles.sublabel}>{recommendation.sublabel}</Text>
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

        {locationLine ? <Text style={styles.location}>{locationLine}</Text> : null}

        <View style={styles.actionsRow}>
          <Button
            label="View match"
            onPress={() => onPressMatch(fixtureId, routeCtx)}
            tone="primary"
            size="sm"
            style={styles.primaryButton}
          />

          <Button
            label="Plan trip"
            onPress={() => onPressBuildTrip(fixtureId, routeCtx)}
            tone="secondary"
            size="sm"
            style={styles.secondaryButton}
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
            <Text style={[styles.followText, isFollowed && styles.followTextActive]}>
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
    left: -40,
    right: -40,
    top: -80,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  bottomGlow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: -18,
    height: 58,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.glowEmerald,
    opacity: 0.52,
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
    fontWeight: theme.fontWeight.black,
  },

  recommendationPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
  },

  recommendationPillTop: {
    backgroundColor: theme.badge.bgGold,
    borderColor: theme.badge.borderGold,
  },

  recommendationPillStrong: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },

  recommendationPillGood: {
    backgroundColor: theme.badge.bgNeutral,
    borderColor: theme.badge.borderNeutral,
  },

  recommendationPillText: {
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
  },

  recommendationPillTextTop: {
    color: theme.badge.textGold,
  },

  recommendationPillTextStrong: {
    color: theme.badge.textEmerald,
  },

  recommendationPillTextGood: {
    color: theme.badge.textNeutral,
  },

  mainRow: {
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
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.04)",
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
    width: 104,
    alignItems: "center",
    gap: 6,
  },

  vsLine: {
    width: 34,
    height: 2,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.borderStrong,
  },

  kickoffPill: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.subtle : theme.glass.bg.subtle,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },

  kickoffText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  sublabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },

  location: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },

  primaryButton: {
    flex: 1.15,
  },

  secondaryButton: {
    flex: 1,
  },

  followPill: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
