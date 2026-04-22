import React, { memo, useMemo } from "react";
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

type ConfidenceTier = "top" | "strong" | "good";

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
  if (dt && !Number.isNaN(dt.getTime())) {
    s += kickoffTimingScore(dt);
  }

  if (home && away) {
    const longNames = (home.length >= 8 ? 1 : 0) + (away.length >= 8 ? 1 : 0);
    if (longNames === 2) s += 4;
  }

  return s;
}

function getConfidenceTier(item: RankedFixtureRow): ConfidenceTier {
  const score = scoreFixture(item);
  if (score >= 150) return "top";
  if (score >= 110) return "strong";
  return "good";
}

function getConfidenceCopy(tier: ConfidenceTier) {
  if (tier === "top") {
    return {
      label: "Top Pick",
      sublabel: "Best travel angle",
    };
  }

  if (tier === "strong") {
    return {
      label: "Strong Pick",
      sublabel: "Very solid weekend option",
    };
  }

  return {
    label: "Good Option",
    sublabel: "Worth a look",
  };
}

function Row({
  item,
  isFollowed,
  onToggleFollow,
  onPressMatch,
  onPressBuildTrip,
}: Props) {
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

  const tier = useMemo(() => getConfidenceTier(item), [item]);
  const confidence = useMemo(() => getConfidenceCopy(tier), [tier]);

  return (
    <View style={styles.wrap}>
      <GlassCard style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.leagueRow}>
            {leagueLogo ? <Image source={{ uri: leagueLogo }} style={styles.logo} /> : null}
            {countryCode ? <LeagueFlag code={countryCode} size="sm" /> : null}
            <Text style={styles.leagueText} numberOfLines={1}>
              {leagueName}
            </Text>
          </View>

          <View
            style={[
              styles.recommendationPill,
              tier === "top"
                ? styles.recommendationPillTop
                : tier === "strong"
                  ? styles.recommendationPillStrong
                  : styles.recommendationPillGood,
            ]}
          >
            <Text
              style={[
                styles.recommendationPillText,
                tier === "top"
                  ? styles.recommendationPillTextTop
                  : tier === "strong"
                    ? styles.recommendationPillTextStrong
                    : styles.recommendationPillTextGood,
              ]}
            >
              {confidence.label}
            </Text>
          </View>
        </View>

        <View style={styles.teamsRow}>
          <View style={styles.team}>
            <TeamCrest name={home} logo={item.teams?.home?.logo} />
            <Text style={styles.teamName}>{home}</Text>
          </View>

          <View style={styles.center}>
            <Text style={styles.kickoff}>{kickoff.primary}</Text>
            <Text style={styles.sublabel}>{confidence.sublabel}</Text>
          </View>

          <View style={styles.team}>
            <TeamCrest name={away} logo={item.teams?.away?.logo} />
            <Text style={styles.teamName}>{away}</Text>
          </View>
        </View>

        {(city || venue) ? (
          <Text style={styles.location}>
            {[city, venue].filter(Boolean).join(" • ")}
          </Text>
        ) : null}

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
            <Text style={styles.followText}>{isFollowed ? "Following" : "Follow"}</Text>
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.05)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(7,10,12,0.52)" : "rgba(255,255,255,0.035)",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  leagueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  logo: {
    width: 20,
    height: 20,
  },

  leagueText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    flexShrink: 1,
  },

  recommendationPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },

  recommendationPillTop: {
    backgroundColor: "rgba(245,204,87,0.10)",
    borderColor: "rgba(245,204,87,0.18)",
  },

  recommendationPillStrong: {
    backgroundColor: "rgba(34,197,94,0.10)",
    borderColor: "rgba(104,241,138,0.18)",
  },

  recommendationPillGood: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.10)",
  },

  recommendationPillText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  recommendationPillTextTop: {
    color: "#F5CC57",
  },

  recommendationPillTextStrong: {
    color: "#8EF2A5",
  },

  recommendationPillTextGood: {
    color: "rgba(255,255,255,0.88)",
  },

  teamsRow: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "center",
  },

  team: {
    flex: 1,
    alignItems: "center",
  },

  teamName: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    color: theme.colors.text,
  },

  center: {
    width: 96,
    alignItems: "center",
    gap: 4,
  },

  kickoff: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  sublabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.68)",
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },

  location: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    color: theme.colors.text,
  },

  ctaRow: {
    marginTop: 14,
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
    fontWeight: theme.fontWeight.black,
  },
});
