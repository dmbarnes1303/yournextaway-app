// src/features/home/UpcomingMatches.tsx

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  ImageSourcePropType,
} from "react-native";

import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { LeagueOption } from "@/src/constants/football";

const YNA_LOGO = require("../../../assets/images/YNAlogo.png") as ImageSourcePropType;

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

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
  if (leagueId === 140) return 124;
  if (leagueId === 135) return 120;
  if (leagueId === 78) return 116;
  if (leagueId === 2) return 118;
  if (leagueId === 61) return 108;
  if (leagueId === 3) return 104;
  if (leagueId === 88) return 102;
  if (leagueId === 94) return 100;
  if (leagueId === 848) return 94;
  if (leagueId === 39) return 96;
  return 72;
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
  "arsenal", "aston villa", "atletico", "atlético", "ajax", "bayern", "benfica",
  "borussia dortmund", "barcelona", "celtic", "chelsea", "dortmund", "fenerbahce",
  "fenerbahçe", "galatasaray", "inter", "juventus", "lazio", "liverpool",
  "manchester city", "manchester united", "milan", "napoli", "newcastle",
  "olympiacos", "porto", "psg", "paris saint-germain", "real madrid", "roma",
  "rangers", "sl benfica", "sporting", "tottenham", "tottenham hotspur", "west ham",
] as const;

const DESTINATION_CITY_TERMS = [
  "amsterdam", "barcelona", "berlin", "bilbao", "dortmund", "florence", "glasgow",
  "istanbul", "lisbon", "liverpool", "london", "madrid", "manchester", "milan",
  "munich", "naples", "napoli", "porto", "prague", "rome", "san sebastian",
  "seville", "turin", "valencia", "vienna",
] as const;

const ICONIC_VENUE_TERMS = [
  "allianz arena", "anfield", "bernabeu", "camp nou", "celtic park", "emirates",
  "estadio da luz", "ibrox", "johan cruijff arena", "mestalla", "old trafford",
  "olympico", "san siro", "signal iduna park", "stamford bridge",
  "tottenham hotspur stadium", "wanda metropolitano", "wembley",
] as const;

type ConfidenceTier = "top" | "strong" | "good";

function scoreFixture(row: FixtureListRow): number {
  let s = 0;

  const leagueId = row?.league?.id;
  const home = clean(row?.teams?.home?.name);
  const away = clean(row?.teams?.away?.name);
  const venue = clean(row?.fixture?.venue?.name);
  const city = clean(row?.fixture?.venue?.city);

  const teamsText = `${home} ${away}`.toLowerCase();
  const locationText = `${venue} ${city}`.toLowerCase();

  s += leagueBaseScore(leagueId);

  if (venue) s += 10;
  if (city) s += 10;
  if (includesAny(teamsText, MARQUEE_TEAM_TERMS)) s += 18;
  if (includesAny(city.toLowerCase(), DESTINATION_CITY_TERMS)) s += 22;
  if (includesAny(locationText, ICONIC_VENUE_TERMS)) s += 16;
  if (hasRivalryBoost(home, away)) s += 28;

  const dt = row?.fixture?.date ? new Date(row.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) s += kickoffTimingScore(dt);

  if (home && away) {
    const longNames = (home.length >= 8 ? 1 : 0) + (away.length >= 8 ? 1 : 0);
    if (longNames === 2) s += 4;
  }

  return s;
}

function getConfidenceTier(row: FixtureListRow): ConfidenceTier {
  const score = scoreFixture(row);
  if (score >= 150) return "top";
  if (score >= 110) return "strong";
  return "good";
}

function getConfidenceCopy(tier: ConfidenceTier) {
  if (tier === "top") return { label: "Top Pick" };
  if (tier === "strong") return { label: "Strong Pick" };
  return { label: "Good Option" };
}

function CrestSquare({ row }: { row: FixtureListRow }) {
  const homeName = row?.teams?.home?.name ?? "";
  const logo = row?.teams?.home?.logo;

  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(homeName)}</Text>
      )}
    </View>
  );
}

function LeagueStrip({
  leagues,
  activeLeagueId,
  allCompetitionsLeagueId,
  onSelect,
}: {
  leagues: LeagueOption[];
  activeLeagueId: number;
  allCompetitionsLeagueId: number;
  onSelect: (league: LeagueOption) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.leagueStripRow}
    >
      {leagues.map((league) => {
        const active = league.leagueId === activeLeagueId;
        const isAll = league.leagueId === allCompetitionsLeagueId;
        const label = String(league.label ?? "").toLowerCase();
        const isLigue1 = label.includes("ligue 1");

        return (
          <Pressable
            key={`${league.leagueId}-${league.slug}`}
            onPress={() => onSelect(league)}
            style={({ pressed }) => [
              styles.leagueStripItem,
              active && styles.leagueStripItemActive,
              isAll && styles.leagueStripItemBrand,
              pressed && styles.pressedPill,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.08)" }}
          >
            <View
              style={[
                styles.leagueLogoDisc,
                active && styles.leagueLogoDiscActive,
                isLigue1 && styles.leagueLogoDiscLight,
                isAll && styles.brandLogoDisc,
              ]}
            >
              {isAll ? (
                <Image source={YNA_LOGO} style={styles.brandLogo} resizeMode="contain" />
              ) : (
                <Image
                  source={{ uri: league.logo }}
                  style={styles.leagueStripLogo}
                  resizeMode="contain"
                />
              )}
            </View>

            {active ? <View style={styles.leagueActiveGlow} pointerEvents="none" /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type Props = {
  homeTopLeagues: LeagueOption[];
  league: LeagueOption;
  setLeague: (league: LeagueOption) => void;
  upcomingWindow: { from: string; to: string };
  fxLoading: boolean;
  fxRefreshing?: boolean;
  fxError: string | null;
  featured: FixtureListRow | null;
  list: FixtureListRow[];
  featuredCityImage: string;
  fixtureLine: (row: FixtureListRow) => { title: string; meta: string };
  goFixtures: (opts?: {
    window?: { from: string; to: string };
    leagueId?: number;
    season?: number;
    sort?: "rating" | "date";
    venue?: string;
  }) => void;
  goFixturesHub: () => void;
  goMatch: (fixtureId: string) => void;
  allCompetitionsLeagueId?: number;
};

export default function UpcomingMatches(props: Props) {
  const {
    homeTopLeagues,
    league,
    setLeague,
    upcomingWindow,
    fxLoading,
    fxRefreshing = false,
    fxError,
    featured,
    list,
    featuredCityImage,
    fixtureLine,
    goFixtures,
    goFixturesHub,
    goMatch,
    allCompetitionsLeagueId = 0,
  } = props;

  const isAllCompetitions = league.leagueId === allCompetitionsLeagueId;

  const featuredTier = useMemo(
    () => (featured ? getConfidenceTier(featured) : null),
    [featured]
  );

  const featuredConfidence = useMemo(
    () => (featuredTier ? getConfidenceCopy(featuredTier) : null),
    [featuredTier]
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Best Upcoming Matches</Text>
          <Text style={styles.sectionSubtitle}>
            {isAllCompetitions
              ? "Across YourNextAway’s European coverage"
              : `Best from ${league.label}`}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            if (isAllCompetitions) {
              goFixturesHub();
              return;
            }

            goFixtures({
              window: upcomingWindow,
              leagueId: league.leagueId,
              season: league.season,
            });
          }}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressedLite]}
          hitSlop={10}
        >
          <Text style={styles.headerActionText}>View all ›</Text>
        </Pressable>
      </View>

      <LeagueStrip
        leagues={homeTopLeagues}
        activeLeagueId={league.leagueId}
        allCompetitionsLeagueId={allCompetitionsLeagueId}
        onSelect={setLeague}
      />

      {fxRefreshing ? (
        <View style={styles.refreshingBadge}>
          <ActivityIndicator size="small" color={theme.colors.textSecondary} />
          <Text style={styles.refreshingText}>
            Adding more fixtures in the background…
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        {fxLoading ? (
          <View style={styles.stateCard}>
            <View style={styles.stateBadge}>
              <Text style={styles.stateBadgeText}>
                {isAllCompetitions ? "Fast scan" : "Live scan"}
              </Text>
            </View>
            <ActivityIndicator color={theme.colors.textSecondary} />
            <Text style={styles.stateText}>
              {isAllCompetitions
                ? "Finding the strongest matches across Europe…"
                : "Checking the best upcoming fixtures…"}
            </Text>
          </View>
        ) : null}

        {!fxLoading && fxError ? (
          <View style={styles.stateCard}>
            <View style={styles.stateBadge}>
              <Text style={styles.stateBadgeText}>Live data</Text>
            </View>
            <EmptyState title="Fixtures unavailable" message={fxError} />
          </View>
        ) : null}

        {!fxLoading && !fxError && !featured ? (
          <View style={styles.stateCard}>
            <EmptyState
              title="No fixtures found"
              message="Try another league or open the full fixtures view."
            />
          </View>
        ) : null}

        {!fxLoading && !fxError && featured ? (
          <>
            <View style={styles.panelTopRow}>
              <Text style={styles.panelTag}>
                {isAllCompetitions ? "YourNextAway pick" : "Top pick"}
              </Text>
              <Text style={styles.panelHint}>Best trip-worthy option</Text>
            </View>

            <Pressable
              onPress={() => goMatch(String(featured.fixture.id))}
              style={({ pressed }) => [styles.featuredCard, pressed && styles.pressedCard]}
              android_ripple={{ color: "rgba(87,162,56,0.08)" }}
            >
              <Image
                source={{ uri: featuredCityImage }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
              <View style={styles.featuredImageOverlay} pointerEvents="none" />
              <View style={styles.featuredBottomFade} pointerEvents="none" />
              <View style={styles.featuredGlow} pointerEvents="none" />

              <View style={styles.featuredInner}>
                <View style={styles.featuredTopRow}>
                  <CrestSquare row={featured} />

                  <View style={styles.featuredPills}>
                    <View style={styles.featuredPillPrimary}>
                      <Text style={styles.featuredPillPrimaryText}>
                        {clean(featured?.league?.name) || "Featured"}
                      </Text>
                    </View>

                    {featuredConfidence ? (
                      <View
                        style={[
                          styles.featuredPillSecondary,
                          featuredTier === "top"
                            ? styles.confidencePillTop
                            : featuredTier === "strong"
                              ? styles.confidencePillStrong
                              : styles.confidencePillGood,
                        ]}
                      >
                        <Text
                          style={[
                            styles.featuredPillSecondaryText,
                            featuredTier === "top"
                              ? styles.confidencePillTextTop
                              : featuredTier === "strong"
                                ? styles.confidencePillTextStrong
                                : styles.confidencePillTextGood,
                          ]}
                        >
                          {featuredConfidence.label}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.featuredTextWrap}>
                  <Text style={styles.featuredTitle} numberOfLines={2} ellipsizeMode="tail">
                    {fixtureLine(featured).title}
                  </Text>
                  <Text style={styles.featuredMeta} numberOfLines={2} ellipsizeMode="tail">
                    {fixtureLine(featured).meta}
                  </Text>
                </View>

                <View style={styles.featuredFooter}>
                  <View style={styles.featuredCta}>
                    <Text style={styles.featuredCtaText}>Open match</Text>
                  </View>

                  <Text style={styles.featuredFooterLink}>Plan around this ›</Text>
                </View>
              </View>
            </Pressable>

            {list.length > 0 ? (
              <View style={styles.listWrap}>
                <Text style={styles.listLabel}>More strong picks</Text>

                <View style={styles.list}>
                  {list.map((r, idx) => {
                    const id = r?.fixture?.id ? String(r.fixture.id) : null;
                    const line = fixtureLine(r);
                    const homeLogo = r?.teams?.home?.logo;
                    const awayLogo = r?.teams?.away?.logo;
                    const tier = getConfidenceTier(r);
                    const confidence = getConfidenceCopy(tier);

                    return (
                      <Pressable
                        key={id ?? `l-${idx}`}
                        onPress={() => (id ? goMatch(id) : null)}
                        disabled={!id}
                        style={({ pressed }) => [styles.listRow, pressed && styles.pressedRow]}
                        android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                      >
                        <View style={styles.listRowTop}>
                          <View style={styles.smallCrests}>
                            <View style={styles.smallCrest}>
                              {homeLogo ? (
                                <Image
                                  source={{ uri: homeLogo }}
                                  style={styles.smallCrestImg}
                                  resizeMode="contain"
                                />
                              ) : null}
                            </View>

                            <View style={styles.smallCrest}>
                              {awayLogo ? (
                                <Image
                                  source={{ uri: awayLogo }}
                                  style={styles.smallCrestImg}
                                  resizeMode="contain"
                                />
                              ) : null}
                            </View>
                          </View>

                          <Text style={styles.listTitle} numberOfLines={1} ellipsizeMode="tail">
                            {line.title}
                          </Text>

                          <Text style={styles.rowChevron}>›</Text>
                        </View>

                        <View style={styles.listMetaRow}>
                          <Text style={styles.listMeta} numberOfLines={1} ellipsizeMode="tail">
                            {line.meta}
                          </Text>

                          <View
                            style={[
                              styles.inlineConfidencePill,
                              tier === "top"
                                ? styles.confidencePillTop
                                : tier === "strong"
                                  ? styles.confidencePillStrong
                                  : styles.confidencePillGood,
                            ]}
                          >
                            <Text
                              style={[
                                styles.inlineConfidencePillText,
                                tier === "top"
                                  ? styles.confidencePillTextTop
                                  : tier === "strong"
                                    ? styles.confidencePillTextStrong
                                    : styles.confidencePillTextGood,
                              ]}
                            >
                              {confidence.label}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
  },

  sectionSubtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  headerAction: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },

  headerActionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  leagueStripRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
    marginTop: 2,
  },

  leagueStripItem: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor:
      Platform.OS === "android" ? "rgba(8,11,14,0.46)" : "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  leagueStripItemActive: {
    backgroundColor:
      Platform.OS === "android" ? "rgba(17,36,24,0.76)" : "rgba(18,103,49,0.10)",
  },

  leagueStripItemBrand: {
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.18)",
  },

  leagueLogoDisc: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },

  leagueLogoDiscActive: {
    backgroundColor: "#FFFFFF",
  },

  leagueLogoDiscLight: {
    backgroundColor: "#FFFFFF",
  },

  leagueStripLogo: {
    width: 29,
    height: 29,
    opacity: 0.98,
  },

  brandLogoDisc: {
    width: 46,
    height: 46,
    backgroundColor: "#FFFFFF",
  },

  brandLogo: {
    width: 43,
    height: 43,
    borderRadius: 999,
  },

  leagueActiveGlow: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: -10,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.18)",
  },

  refreshingBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  refreshingText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  panel: {
    gap: 12,
  },

  panelTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  panelTag: {
    color: "#8EF2A5",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  panelHint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  stateCard: {
    minHeight: 176,
    borderRadius: 26,
    backgroundColor:
      Platform.OS === "android" ? "rgba(9,12,14,0.52)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  stateBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,204,87,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.16)",
  },

  stateBadgeText: {
    color: "#F5CC57",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  stateText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },

  featuredCard: {
    minHeight: 198,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0A0F12",
  },

  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,10,12,0.40)",
  },

  featuredBottomFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,7,9,0.26)",
  },

  featuredGlow: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: -14,
    height: 70,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.10)",
  },

  featuredInner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },

  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  featuredPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },

  featuredPillPrimary: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,204,87,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.18)",
  },

  featuredPillPrimaryText: {
    color: "#F5CC57",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  featuredPillSecondary: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },

  featuredPillSecondaryText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  confidencePillTop: {
    backgroundColor: "rgba(245,204,87,0.10)",
    borderColor: "rgba(245,204,87,0.18)",
  },

  confidencePillStrong: {
    backgroundColor: "rgba(34,197,94,0.10)",
    borderColor: "rgba(104,241,138,0.18)",
  },

  confidencePillGood: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.10)",
  },

  confidencePillTextTop: {
    color: "#F5CC57",
  },

  confidencePillTextStrong: {
    color: "#8EF2A5",
  },

  confidencePillTextGood: {
    color: "rgba(255,255,255,0.88)",
  },

  featuredTextWrap: {
    gap: 6,
  },

  featuredTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
    maxWidth: "92%",
  },

  featuredMeta: {
    color: "rgba(242,244,246,0.86)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "94%",
  },

  featuredFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  featuredCta: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(18,103,49,0.28)",
    borderWidth: 1,
    borderColor: "rgba(104,241,138,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  featuredCtaText: {
    color: "#8EF2A5",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  featuredFooterLink: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  crestWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 32,
    height: 32,
    opacity: 0.96,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  listWrap: {
    gap: 10,
  },

  listLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },

  list: {
    gap: 8,
  },

  listRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor:
      Platform.OS === "android" ? "rgba(8,11,14,0.44)" : "rgba(255,255,255,0.04)",
  },

  listRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  smallCrests: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  smallCrest: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  smallCrestImg: {
    width: 14,
    height: 14,
    opacity: 0.95,
  },

  listTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  rowChevron: {
    color: theme.colors.textTertiary,
    fontSize: 18,
    marginTop: -1,
  },

  listMetaRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  listMeta: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  inlineConfidencePill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  inlineConfidencePillText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  pressedRow: {
    opacity: 0.94,
  },

  pressedCard: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },

  pressedPill: {
    opacity: 0.92,
  },

  pressedLite: {
    opacity: 0.9,
  },
});
