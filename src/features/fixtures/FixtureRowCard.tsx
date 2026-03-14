import React from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import Button from "@/src/components/Button";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";
import { theme } from "@/src/constants/theme";
import { LEAGUES } from "@/src/constants/football";
import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";

import {
  LeagueFlag,
  TeamCrest,
  kickoffPresentation,
  ticketDifficultyLabel,
} from "./helpers";
import type { RankedFixtureRow, FixtureRouteCtx } from "./types";

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

  const home = String(item?.teams?.home?.name ?? "Home");
  const away = String(item?.teams?.away?.name ?? "Away");

  const venue = String(item?.fixture?.venue?.name ?? "").trim();
  const city = String(item?.fixture?.venue?.city ?? "").trim();

  const kickoff = kickoffPresentation(item, placeholderIds);
  const certainty = kickoff.certainty;

  const ctxLeagueId = item?.league?.id != null ? Number(item.league.id) : null;
  const ctxSeason =
    (item as any)?.league?.season != null ? Number((item as any).league.season) : null;

  const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
  const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";

  const leagueMeta = LEAGUES.find((l) => l.leagueId === ctxLeagueId) ?? null;
  const leagueCode =
    leagueMeta?.countryCode ||
    String((item?.league as any)?.country ?? "").trim() ||
    "";

  const leagueLogo = leagueMeta?.logo ?? null;
  const discoverReasons = Array.isArray(item.discoverReasons) ? item.discoverReasons : [];

  return (
    <View style={styles.rowWrap}>
      <GlassCard style={styles.rowCard} level="default" variant="matte" noPadding>
        <Pressable
          onPress={onToggleExpanded}
          style={({ pressed }) => [styles.rowMainPress, pressed && styles.pressed]}
          android_ripple={{ color: "rgba(255,255,255,0.04)" }}
        >
          <View style={styles.rowInner}>
            <View style={styles.headerRow}>
              <View style={styles.leagueCluster}>
                {leagueLogo ? (
                  <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} resizeMode="contain" />
                ) : null}
                {leagueCode ? <LeagueFlag code={leagueCode} size="sm" /> : null}
                <Text style={styles.fixtureLeagueText} numberOfLines={1}>
                  {String(item?.league?.name ?? "")}
                </Text>
              </View>

              <View style={styles.headerRight}>
                <FixtureCertaintyBadge state={certainty} variant="compact" />
              </View>
            </View>

            <View style={styles.topRow}>
              <View style={styles.teamSide}>
                <TeamCrest name={home} logo={item?.teams?.home?.logo} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {home}
                </Text>
              </View>

              <View style={styles.centerCol}>
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
              {venue || city ? (
                <Text style={styles.metaVenue} numberOfLines={2}>
                  {[venue, city].filter(Boolean).join(" • ")}
                </Text>
              ) : null}

              {kickoff.secondary ? (
                <Text style={styles.metaSecondary} numberOfLines={1}>
                  {kickoff.secondary}
                </Text>
              ) : null}
            </View>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.ticketPill,
                  difficulty === "easy" && styles.ticketEasy,
                  difficulty === "medium" && styles.ticketMedium,
                  (difficulty === "hard" || difficulty === "very_hard") && styles.ticketHard,
                ]}
              >
                <Text
                  style={[
                    styles.ticketText,
                    difficulty === "easy" && styles.ticketTextEasy,
                    difficulty === "medium" && styles.ticketTextMedium,
                    (difficulty === "hard" || difficulty === "very_hard") && styles.ticketTextHard,
                  ]}
                >
                  {ticketDifficultyLabel(difficulty)}
                </Text>
              </View>

              {discoverReasons.length > 0 ? (
                discoverReasons.slice(0, 2).map((reason) => (
                  <View key={reason} style={styles.discoverReasonPill}>
                    <Text style={styles.discoverReasonText}>{reason}</Text>
                  </View>
                ))
              ) : null}
            </View>

            <View style={styles.ctaRow}>
              <Button
                label={isFollowed ? "Following" : "Follow"}
                onPress={onToggleFollow}
                tone={isFollowed ? "secondary" : "primary"}
                size="sm"
                glow={!isFollowed}
                style={{ flex: 1 }}
              />

              <Pressable
                onPress={onToggleExpanded}
                style={[styles.moreButton, expanded && styles.moreButtonActive]}
              >
                <Text style={[styles.moreButtonText, expanded && styles.moreButtonTextActive]}>
                  {expanded ? "Hide" : "More"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>

        {expanded ? (
          <View style={styles.expandArea}>
            <Button
              label="Match"
              onPress={() =>
                onPressMatch(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })
              }
              tone="secondary"
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              label="Build trip"
              onPress={() =>
                onPressBuildTrip(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })
              }
              tone="primary"
              size="md"
              glow
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    width: "100%",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 12,
  },

  rowCard: {
    borderRadius: 24,
    borderColor: "rgba(255,255,255,0.06)",
  },

  rowMainPress: {
    borderRadius: 24,
    overflow: "hidden",
  },

  rowInner: {
    padding: 16,
    gap: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  leagueCluster: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  leagueLogo: {
    width: 18,
    height: 18,
  },

  fixtureLeagueText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    flexShrink: 1,
  },

  headerRight: {
    alignItems: "flex-end",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  teamSide: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },

  centerCol: {
    width: 76,
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
  },

  teamName: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: theme.fontWeight.black,
    width: "100%",
    textAlign: "center",
  },

  vs: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  metaBlock: {
    width: "100%",
    alignItems: "center",
    gap: 4,
  },

  metaPrimary: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  metaVenue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    opacity: 0.96,
    lineHeight: 18,
  },

  metaSecondary: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    fontWeight: theme.fontWeight.bold,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  discoverReasonPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  discoverReasonText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textSecondary,
  },

  ticketPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  ticketText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  ticketEasy: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  ticketTextEasy: {
    color: "rgba(87,162,56,0.95)",
  },

  ticketMedium: {
    borderColor: "rgba(242,201,76,0.30)",
    backgroundColor: "rgba(242,201,76,0.10)",
  },

  ticketTextMedium: {
    color: "rgba(242,201,76,0.95)",
  },

  ticketHard: {
    borderColor: "rgba(214,69,69,0.30)",
    backgroundColor: "rgba(214,69,69,0.10)",
  },

  ticketTextHard: {
    color: "rgba(214,69,69,0.95)",
  },

  ctaRow: {
    marginTop: 2,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  moreButton: {
    minWidth: 78,
    minHeight: 36,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  moreButtonActive: {
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  moreButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  moreButtonTextActive: {
    color: theme.colors.text,
  },

  expandArea: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingTop: 0,
  },

  pressed: {
    opacity: 0.96,
  },
});
