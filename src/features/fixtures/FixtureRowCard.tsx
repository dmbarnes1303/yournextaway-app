import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

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

  const leagueCode =
    String((item?.league as any)?.country ?? "").trim() ||
    LEAGUES.find((l) => l.leagueId === ctxLeagueId)?.countryCode ||
    "";

  const discoverReasons = Array.isArray(item.discoverReasons) ? item.discoverReasons : [];

  return (
    <View style={styles.rowWrap}>
      <GlassCard style={styles.rowCard} level="default" variant="matte">
        <Pressable
          onPress={onToggleExpanded}
          style={({ pressed }) => [styles.rowMainPress, pressed && { opacity: 0.96 }]}
          android_ripple={{ color: "rgba(255,255,255,0.04)" }}
        >
          <View style={styles.rowInner}>
            <View style={styles.fixtureLeagueLine}>
              {leagueCode ? <LeagueFlag code={leagueCode} /> : null}
              <Text style={styles.fixtureLeagueText}>{String(item?.league?.name ?? "")}</Text>
            </View>

            <View style={styles.topRow}>
              <TeamCrest name={home} logo={item?.teams?.home?.logo} />

              <View style={styles.centerCol}>
                <Text style={styles.teamName} numberOfLines={2}>
                  {home}
                </Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.teamName} numberOfLines={2}>
                  {away}
                </Text>
              </View>

              <TeamCrest name={away} logo={item?.teams?.away?.logo} />
            </View>

            <View style={styles.metaBlock}>
              <Text style={styles.metaPrimary}>{kickoff.primary}</Text>

              {venue || city ? (
                <Text style={styles.metaVenue}>
                  {[venue, city].filter(Boolean).join(" • ")}
                </Text>
              ) : null}

              {kickoff.secondary ? (
                <Text style={styles.metaSecondary}>{kickoff.secondary}</Text>
              ) : null}
            </View>

            <View style={styles.badgeRow}>
              <FixtureCertaintyBadge state={certainty} variant="compact" />

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
                  Home tickets: {ticketDifficultyLabel(difficulty)}
                </Text>
              </View>
            </View>

            {discoverReasons.length > 0 ? (
              <View style={styles.discoverReasonRow}>
                {discoverReasons.slice(0, 3).map((reason) => (
                  <View key={reason} style={styles.discoverReasonPill}>
                    <Text style={styles.discoverReasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.followRow}>
              <Button
                label={isFollowed ? "Following" : "Follow"}
                onPress={onToggleFollow}
                tone={isFollowed ? "secondary" : "primary"}
                size="sm"
                glow={!isFollowed}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={styles.tapHint}>Tap for actions</Text>
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
    borderRadius: theme.borderRadius.sheet,
    padding: 0,
  },

  rowMainPress: {
    borderRadius: theme.borderRadius.sheet,
    overflow: "hidden",
  },

  rowInner: {
    padding: 16,
    gap: 12,
  },

  fixtureLeagueLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  fixtureLeagueText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  centerCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },

  teamName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.body,
    lineHeight: 20,
    fontWeight: theme.fontWeight.semibold,
    width: "100%",
    textAlign: "center",
  },

  vs: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  metaBlock: {
    width: "100%",
    alignItems: "center",
    gap: 4,
  },

  metaPrimary: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
  },

  metaVenue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
    opacity: 0.95,
  },

  metaSecondary: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    textAlign: "center",
    fontWeight: theme.fontWeight.medium,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  discoverReasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },

  discoverReasonPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  discoverReasonText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },

  ticketPill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
  },

  ticketText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
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

  followRow: {
    marginTop: 2,
    flexDirection: "row",
    gap: 10,
  },

  tapHint: {
    marginTop: -2,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
  },

  expandArea: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingTop: 0,
  },
});
