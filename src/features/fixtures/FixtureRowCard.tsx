import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, Platform, Pressable } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import Button from "@/src/components/Button";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";
import { theme } from "@/src/constants/theme";
import { LEAGUES } from "@/src/constants/football";
import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
import { estimateFixturePricing } from "@/src/features/discover/discoverPrice";
import { resolveAffiliateUrl } from "@/src/services/partnerLinks";

import {
  LeagueFlag,
  TeamCrest,
  kickoffPresentation,
  ticketDifficultyLabel,
} from "./helpers";
import type { RankedFixtureRow, FixtureRouteCtx } from "./types";

const UEFA_COMPETITION_IDS = new Set([2, 3, 848, 244, 286, 357]);

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function displayLeagueName(leagueId: number | null, leagueName: string) {
  if (leagueId === 2 || leagueId === 286) return "UEFA Champions League";
  if (leagueId === 3 || leagueId === 244) return "UEFA Europa League";
  if (leagueId === 848 || leagueId === 357) return "UEFA Conference League";
  return leagueName;
}

function isEuropeanCompetition(leagueId: number | null) {
  if (leagueId == null) return false;
  return UEFA_COMPETITION_IDS.has(leagueId);
}

function difficultyTone(difficulty: TicketDifficulty | "unknown") {
  if (difficulty === "easy") return styles.signalEasy;
  if (difficulty === "medium") return styles.signalMedium;
  if (difficulty === "hard" || difficulty === "very_hard") return styles.signalHard;
  return styles.signalNeutral;
}

function difficultyTextTone(difficulty: TicketDifficulty | "unknown") {
  if (difficulty === "easy") return styles.signalTextEasy;
  if (difficulty === "medium") return styles.signalTextMedium;
  if (difficulty === "hard" || difficulty === "very_hard") return styles.signalTextHard;
  return styles.signalTextNeutral;
}

function tripScoreTone(score?: number | null) {
  const value = typeof score === "number" ? score : 0;
  if (value >= 78) return styles.scoreStrong;
  if (value >= 62) return styles.scoreOkay;
  return styles.scoreWeak;
}

function tripAngleLabel(item: RankedFixtureRow, difficulty: TicketDifficulty | "unknown") {
  const reasons = Array.isArray(item.discoverReasons) ? item.discoverReasons : [];
  if (reasons.length > 0) return reasons[0];

  if (difficulty === "easy") return "Easier ticket route";
  if (difficulty === "medium") return "Solid trip option";
  if (difficulty === "hard" || difficulty === "very_hard") return "Big-demand fixture";

  return "Trip planner ready";
}

function cityVenueLine(city: string, venue: string) {
  const parts = [city, venue].filter(Boolean);
  return parts.join(" • ");
}

function kickoffIsoDateOnly(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;
  return raw.slice(0, 10) || null;
}

function estimatedLabel(value: string | null, suffix?: string) {
  if (!value) return null;
  return suffix ? `Est. ${value.slice(5)} ${suffix}` : `Est. ${value.slice(5)}`;
}

function bookingSummaryLine(params: {
  difficulty: TicketDifficulty | "unknown";
  followed: boolean;
  tripEstimate: string | null;
  ticketEstimate: string | null;
  hasTicketPartner: boolean;
  hasFlightPartner: boolean;
  hasHotelPartner: boolean;
}) {
  const ticketPart = params.ticketEstimate
    ? params.ticketEstimate
    : params.hasTicketPartner
      ? "Ticket options available"
      : params.difficulty === "unknown"
        ? "Ticket route unclear"
        : `Tickets ${ticketDifficultyLabel(params.difficulty)}`;

  const travelParts = [
    params.hasFlightPartner ? "Flights linked" : null,
    params.hasHotelPartner ? "Hotels linked" : null,
  ].filter(Boolean);

  const travelPart = params.tripEstimate
    ? params.tripEstimate
    : travelParts.length > 0
      ? travelParts.join(" • ")
      : "Travel links vary";

  const followPart = params.followed ? "Following" : "Build trip now";

  return `${ticketPart} • ${travelPart} • ${followPart}`;
}

export default function FixtureRowCard({
  item,
  expanded,
  isFollowed,
  placeholderIds,
  onToggleExpanded,
  onToggleFollow,
  onPressMatch,
  onPressBuildTrip,
}: {
  item: RankedFixtureRow;
  expanded: boolean;
  isFollowed: boolean;
  placeholderIds: Set<string>;
  onToggleExpanded: () => void;
  onToggleFollow: () => void;
  onPressMatch: (fixtureId: string, ctx?: FixtureRouteCtx) => void;
  onPressBuildTrip: (fixtureId: string, ctx?: FixtureRouteCtx) => void;
}) {
  const fixtureId = item?.fixture?.id != null ? String(item.fixture.id) : "";
  if (!fixtureId) return null;

  const home = clean(item?.teams?.home?.name) || "Home";
  const away = clean(item?.teams?.away?.name) || "Away";

  const venue = clean(item?.fixture?.venue?.name);
  const city = clean(item?.fixture?.venue?.city);

  const kickoff = kickoffPresentation(item, placeholderIds);
  const certainty = kickoff.certainty;

  const ctxLeagueId = item?.league?.id != null ? Number(item.league.id) : null;
  const ctxSeason =
    (item as any)?.league?.season != null ? Number((item as any).league.season) : null;

  const rawDifficulty = home ? getTicketDifficultyBadge(home, ctxLeagueId) : null;
  const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";

  const leagueMeta = LEAGUES.find((l) => l.leagueId === ctxLeagueId) ?? null;
  const leagueCode = leagueMeta?.countryCode || clean((item?.league as any)?.country) || "";
  const leagueLogo = leagueMeta?.logo ?? null;
  const leagueName = displayLeagueName(ctxLeagueId, clean(item?.league?.name) || "League");
  const european = isEuropeanCompetition(ctxLeagueId);

  const discoverReasons = Array.isArray(item.discoverReasons) ? item.discoverReasons : [];
  const combinedScore =
    typeof (item as any)?.breakdown?.combinedScore === "number"
      ? (item as any).breakdown.combinedScore
      : null;

  const pricing = useMemo(() => estimateFixturePricing(item), [item]);
  const tripEstimate = estimatedLabel(pricing.tripLabel, "trip");
  const ticketEstimate = estimatedLabel(pricing.ticketLabel, "ticket");

  const startDate = kickoffIsoDateOnly(item?.fixture?.date);
  const endDate = kickoffIsoDateOnly(item?.fixture?.date);

  const flightsUrl = resolveAffiliateUrl("aviasales", {
    city,
    startDate,
    endDate,
  });

  const hotelsUrl = resolveAffiliateUrl("expedia", {
    city,
    startDate,
    endDate,
  });

  const ticketsUrl = resolveAffiliateUrl("sportsevents365", {
    city,
    startDate,
    endDate,
  });

  const hasFlightPartner = Boolean(flightsUrl);
  const hasHotelPartner = Boolean(hotelsUrl);
  const hasTicketPartner = Boolean(ticketsUrl);

  const tripAngle = tripAngleLabel(item, difficulty);
  const bookingLine = bookingSummaryLine({
    difficulty,
    followed: isFollowed,
    tripEstimate,
    ticketEstimate,
    hasTicketPartner,
    hasFlightPartner,
    hasHotelPartner,
  });

  const placeLine = cityVenueLine(city, venue);

  const routeCtx: FixtureRouteCtx = {
    leagueId: ctxLeagueId,
    season: ctxSeason,
  };

  return (
    <View style={styles.rowWrap}>
      <GlassCard style={styles.rowCard} level="default" variant="matte" noPadding>
        <View style={styles.rowInner}>
          <View style={styles.headerRow}>
            <View style={styles.leagueCluster}>
              {leagueLogo ? (
                <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} resizeMode="contain" />
              ) : null}
              {leagueCode ? <LeagueFlag code={leagueCode} size="sm" /> : null}
              <Text style={styles.fixtureLeagueText} numberOfLines={1}>
                {leagueName}
              </Text>
            </View>

            <View style={styles.headerRight}>
              {combinedScore != null ? (
                <View style={[styles.scorePill, tripScoreTone(combinedScore)]}>
                  <Text style={styles.scorePillValue}>{combinedScore}</Text>
                </View>
              ) : null}
              <FixtureCertaintyBadge state={certainty} variant="compact" />
            </View>
          </View>

          <Pressable
            onPress={() => onPressBuildTrip(fixtureId, routeCtx)}
            style={({ pressed }) => [styles.mainPressArea, pressed && styles.pressed]}
            android_ripple={{ color: "rgba(255,255,255,0.04)" }}
          >
            <View style={styles.topRow}>
              <View style={styles.teamSide}>
                <TeamCrest name={home} logo={item?.teams?.home?.logo} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {home}
                </Text>
              </View>

              <View style={styles.centerCol}>
                <Text style={styles.kicker}>TRIP ENTRY</Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.metaPrimary}>{kickoff.primary}</Text>
              </View>

              <View style={styles.teamSide}>
                <TeamCrest name={away} logo={item?.teams?.away?.logo} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {away}
                </Text>
              </View>
            </View>

            <View style={styles.metaBlock}>
              {placeLine ? (
                <Text style={styles.metaVenue} numberOfLines={2}>
                  {placeLine}
                </Text>
              ) : null}

              <Text style={styles.tripAngleLine} numberOfLines={1}>
                {tripAngle}
              </Text>

              {kickoff.secondary ? (
                <Text style={styles.metaSecondary} numberOfLines={1}>
                  {kickoff.secondary}
                </Text>
              ) : european ? (
                <Text style={styles.metaSecondary} numberOfLines={1}>
                  European night
                </Text>
              ) : null}
            </View>

            {tripEstimate || ticketEstimate ? (
              <View style={styles.priceRow}>
                {tripEstimate ? (
                  <View style={styles.pricePillStrong}>
                    <Text style={styles.pricePillStrongText}>{tripEstimate}</Text>
                  </View>
                ) : null}

                {ticketEstimate ? (
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>{ticketEstimate}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.signalRow}>
              <View style={[styles.signalPill, difficultyTone(difficulty)]}>
                <Text style={[styles.signalText, difficultyTextTone(difficulty)]}>
                  {difficulty === "unknown"
                    ? hasTicketPartner
                      ? "Ticket options"
                      : "Ticket route unclear"
                    : `Tickets ${ticketDifficultyLabel(difficulty)}`}
                </Text>
              </View>

              <View
                style={[
                  styles.signalPill,
                  hasFlightPartner ? styles.signalEasy : styles.signalNeutral,
                ]}
              >
                <Text
                  style={[
                    styles.signalText,
                    hasFlightPartner ? styles.signalTextEasy : styles.signalTextNeutral,
                  ]}
                >
                  {hasFlightPartner ? "Flights linked" : "Flights vary"}
                </Text>
              </View>

              <View
                style={[
                  styles.signalPill,
                  hasHotelPartner ? styles.signalEasy : styles.signalNeutral,
                ]}
              >
                <Text
                  style={[
                    styles.signalText,
                    hasHotelPartner ? styles.signalTextEasy : styles.signalTextNeutral,
                  ]}
                >
                  {hasHotelPartner ? "Hotels linked" : "Hotels vary"}
                </Text>
              </View>
            </View>

            <View style={styles.bookingSummaryBox}>
              <Text style={styles.bookingSummaryText} numberOfLines={2}>
                {bookingLine}
              </Text>
            </View>
          </Pressable>

          <View style={styles.ctaRow}>
            <Button
              label="Build trip"
              onPress={() => onPressBuildTrip(fixtureId, routeCtx)}
              tone="primary"
              size="sm"
              glow
              style={{ flex: 1.2 }}
            />

            <Button
              label="Match"
              onPress={() => onPressMatch(fixtureId, routeCtx)}
              tone="secondary"
              size="sm"
              style={{ flex: 0.95 }}
            />

            <Pressable
              onPress={onToggleFollow}
              style={[styles.followButton, isFollowed && styles.followButtonActive]}
            >
              <Text style={[styles.followButtonText, isFollowed && styles.followButtonTextActive]}>
                {isFollowed ? "Following" : "Follow"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onToggleExpanded}
            style={[styles.moreRow, expanded && styles.moreRowActive]}
          >
            <Text style={[styles.moreRowText, expanded && styles.moreRowTextActive]}>
              {expanded ? "Hide trip details" : "More trip context"}
            </Text>
          </Pressable>

          {expanded ? (
            <View style={styles.expandArea}>
              <View style={styles.expandGrid}>
                {combinedScore != null ? (
                  <View style={styles.expandCard}>
                    <Text style={styles.expandKicker}>Trip score</Text>
                    <Text style={styles.expandValue}>{combinedScore}</Text>
                  </View>
                ) : null}

                <View style={styles.expandCard}>
                  <Text style={styles.expandKicker}>Ticket route</Text>
                  <Text style={styles.expandValueSmall}>
                    {difficulty === "unknown"
                      ? hasTicketPartner
                        ? "Partner options available"
                        : "Needs live checking"
                      : ticketDifficultyLabel(difficulty)}
                  </Text>
                </View>

                <View style={styles.expandCard}>
                  <Text style={styles.expandKicker}>Price guide</Text>
                  <Text style={styles.expandValueSmall}>
                    {tripEstimate || ticketEstimate || "Estimated at open"}
                  </Text>
                </View>
              </View>

              {discoverReasons.length > 0 ? (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonTitle}>Why it stands out</Text>
                  <Text style={styles.reasonText}>
                    {discoverReasons.slice(0, 3).join(" • ")}
                  </Text>
                </View>
              ) : null}

              <View style={styles.expandHintBox}>
                <Text style={styles.expandHintText}>
                  Build Trip opens the match-led booking flow with linked partner options where
                  available, plus estimated pricing guidance and Wallet saving after booking.
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    width: "100%",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 10,
  },

  rowCard: {
    borderRadius: 22,
    borderColor: "rgba(255,255,255,0.06)",
  },

  rowInner: {
    padding: 14,
    gap: 10,
  },

  mainPressArea: {
    borderRadius: 18,
    overflow: "hidden",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  leagueCluster: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  leagueLogo: {
    width: 24,
    height: 24,
  },

  fixtureLeagueText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    flexShrink: 1,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  scorePill: {
    minWidth: 34,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  scoreStrong: {
    borderColor: "rgba(87,162,56,0.35)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  scoreOkay: {
    borderColor: "rgba(242,201,76,0.30)",
    backgroundColor: "rgba(242,201,76,0.10)",
  },

  scoreWeak: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
  },

  scorePillValue: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 2,
  },

  teamSide: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },

  centerCol: {
    width: 86,
    alignItems: "center",
    gap: 5,
    paddingTop: 7,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.7,
  },

  teamName: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
    width: "100%",
    textAlign: "center",
  },

  vs: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  metaBlock: {
    width: "100%",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
  },

  metaPrimary: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  metaVenue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    opacity: 0.96,
    lineHeight: 17,
  },

  tripAngleLine: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  metaSecondary: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textAlign: "center",
    fontWeight: theme.fontWeight.bold,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
  },

  pricePill: {
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.03)",
  },

  pricePillText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 10,
  },

  pricePillStrong: {
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  pricePillStrongText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 10,
  },

  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
  },

  signalPill: {
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
  },

  signalText: {
    fontWeight: theme.fontWeight.black,
    fontSize: 10,
  },

  signalEasy: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  signalTextEasy: {
    color: "rgba(87,162,56,0.95)",
  },

  signalMedium: {
    borderColor: "rgba(242,201,76,0.30)",
    backgroundColor: "rgba(242,201,76,0.10)",
  },

  signalTextMedium: {
    color: "rgba(242,201,76,0.95)",
  },

  signalHard: {
    borderColor: "rgba(214,69,69,0.30)",
    backgroundColor: "rgba(214,69,69,0.10)",
  },

  signalTextHard: {
    color: "rgba(214,69,69,0.95)",
  },

  signalNeutral: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.03)",
  },

  signalTextNeutral: {
    color: theme.colors.textSecondary,
  },

  bookingSummaryBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },

  bookingSummaryText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },

  ctaRow: {
    marginTop: 2,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  followButton: {
    minWidth: 78,
    minHeight: 34,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  followButtonActive: {
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  followButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  followButtonTextActive: {
    color: theme.colors.text,
  },

  moreRow: {
    marginTop: 2,
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  moreRowActive: {
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  moreRowText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  moreRowTextActive: {
    color: theme.colors.text,
  },

  expandArea: {
    gap: 10,
    paddingTop: 2,
  },

  expandGrid: {
    flexDirection: "row",
    gap: 8,
  },

  expandCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 68,
  },

  expandKicker: {
    color: theme.colors.textTertiary,
    fontWeight: theme.fontWeight.black,
    fontSize: 10,
  },

  expandValue: {
    marginTop: 6,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 20,
    lineHeight: 22,
  },

  expandValueSmall: {
    marginTop: 6,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    lineHeight: 16,
  },

  reasonBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 6,
  },

  reasonTitle: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
  },

  reasonText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    lineHeight: 15,
  },

  expandHintBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  expandHintText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    lineHeight: 15,
  },

  pressed: {
    opacity: 0.96,
  },
});
