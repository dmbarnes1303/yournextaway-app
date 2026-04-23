import React from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";

import { theme } from "@/src/constants/theme";
import type { Trip } from "@/src/state/trips";
import type { SavedItem } from "@/src/core/savedItemTypes";
import type { FixtureListRow } from "@/src/services/apiFootball";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import {
  getMatchdayLogistics,
  buildLogisticsSnippet,
} from "@/src/data/matchdayLogistics";
import {
  clean,
  safeUri,
  initials,
  safeFixtureTitle,
  formatKickoffMeta,
  statusLabel,
  providerLabel,
} from "@/src/components/trip/tripUi";

type Props = {
  trip: Trip;
  numericMatchIds: string[];
  primaryMatchId: string | null;
  fixturesById: Record<string, FixtureListRow>;
  ticketsByMatchId: Record<string, SavedItem | null>;
  fxLoading: boolean;
  onAddMatch: () => void;
  onOpenTicketsForMatch: (matchId: string) => void;
  onOpenMatchActions: (matchId: string) => void;
  onSetPrimaryMatch: (matchId: string) => void;
  onRemoveMatch: (matchId: string) => void;
  getTicketProviderFromItem: (item: SavedItem | null) => string | null;
  getTicketScoreFromItem: (item: SavedItem | null) => number | null;
  getLivePriceLine: (item: SavedItem) => string | null;
};

function TeamCrest({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: SavedItem["status"] }) {
  const style =
    status === "pending"
      ? styles.badgePending
      : status === "saved"
        ? styles.badgeSaved
        : status === "booked"
          ? styles.badgeBooked
          : styles.badgeArchived;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{statusLabel(status)}</Text>
    </View>
  );
}

function ticketConfidenceLabel(score: number | null | undefined): string {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return "Route confidence unknown";
  }

  if (score >= 90) return "Very strong route";
  if (score >= 75) return "Strong route";
  if (score >= 60) return "Usable route";
  if (score >= 40) return "Weak route";
  return "Low-confidence route";
}

function ticketStateLine(args: {
  ticketItem: SavedItem | null;
  livePrice: string | null;
  provider: string | null;
}) {
  const { ticketItem, livePrice, provider } = args;

  if (!ticketItem) return "No ticket route saved yet";

  if (ticketItem.status === "booked") {
    return livePrice || (provider ? `Booked via ${provider}` : "Ticket booked");
  }

  if (ticketItem.status === "pending") {
    return provider
      ? `Booking flow opened with ${provider}`
      : "Booking flow opened — confirm if you completed it";
  }

  if (ticketItem.status === "saved") {
    return provider ? `Saved option from ${provider}` : "Ticket option saved";
  }

  return "Archived ticket route";
}

function ticketQualityLine(args: {
  ticketItem: SavedItem | null;
  provider: string | null;
  score: number | null;
}) {
  const { ticketItem, provider, score } = args;

  if (!ticketItem) {
    return "Tap to compare live ticket options";
  }

  if (ticketItem.status === "archived") {
    return "Archived route";
  }

  if (ticketItem.status === "booked") {
    if (provider && score != null) return `${ticketConfidenceLabel(score)} • ${provider}`;
    if (provider) return `Booked provider: ${provider}`;
    if (score != null) return ticketConfidenceLabel(score);
    return "Booked route saved";
  }

  if (ticketItem.status === "pending") {
    if (provider && score != null) return `${ticketConfidenceLabel(score)} • ${provider}`;
    if (provider) return `Pending with ${provider}`;
    if (score != null) return ticketConfidenceLabel(score);
    return "Pending ticket route";
  }

  if (provider && score != null) return `${ticketConfidenceLabel(score)} • ${provider}`;
  if (provider) return `Saved from ${provider}`;
  if (score != null) return ticketConfidenceLabel(score);

  return "Saved route";
}

function urgencyLine(args: {
  isPrimary: boolean;
  ticketItem: SavedItem | null;
  certaintyLine: string;
}) {
  const { isPrimary, ticketItem, certaintyLine } = args;

  if (isPrimary && !ticketItem) return "Primary match not ticketed yet";
  if (isPrimary && ticketItem?.status === "pending") return "Primary match still needs booking confirmation";
  if (isPrimary && ticketItem?.status === "saved") return "Primary match has ticket routes saved";
  if (isPrimary && ticketItem?.status === "booked") return "Primary match anchored";

  return certaintyLine;
}

function primaryActionLabel(ticketItem: SavedItem | null) {
  if (!ticketItem) return "Find tickets";
  if (ticketItem.status === "booked") return "Open booked ticket";
  if (ticketItem.status === "pending") return "Resume ticket route";
  if (ticketItem.status === "saved") return "View saved ticket";
  return "Find tickets";
}

function buildMatchCardData(
  trip: Trip,
  matchId: string,
  fixture: FixtureListRow | undefined
) {
  const title = safeFixtureTitle(fixture, matchId, trip);

  const leagueName = clean((fixture as any)?.league?.name ?? (trip as any)?.leagueName);
  const round = clean((fixture as any)?.league?.round);
  const venue = clean((fixture as any)?.fixture?.venue?.name ?? (trip as any)?.venueName);
  const city = clean((fixture as any)?.fixture?.venue?.city ?? (trip as any)?.displayCity);

  const kickoff = formatKickoffMeta(fixture, trip);

  const homeName = clean(
    (fixture as any)?.teams?.home?.name ?? (trip as any)?.homeName ?? "Home"
  );
  const awayName = clean(
    (fixture as any)?.teams?.away?.name ?? (trip as any)?.awayName ?? "Away"
  );

  const homeLogo = safeUri((fixture as any)?.teams?.home?.logo);
  const awayLogo = safeUri((fixture as any)?.teams?.away?.logo);

  const metaTop = [leagueName || null, round || null].filter(Boolean).join(" • ");
  const metaBottom = [venue || null, city || null].filter(Boolean).join(" • ");

  const logistics = getMatchdayLogistics({ homeTeamName: homeName, leagueName });
  const logisticsLine = logistics ? buildLogisticsSnippet(logistics) : "";

  const certainty = getFixtureCertainty(fixture as any, {
    previousKickoffIso: (trip as any)?.kickoffIso ?? null,
  });

  return {
    title,
    kickoff,
    homeName,
    awayName,
    homeLogo,
    awayLogo,
    metaTop,
    metaBottom,
    logisticsLine,
    certainty,
  };
}

function sortMatchIds(matchIds: string[], primaryMatchId: string | null) {
  const primary = String(primaryMatchId ?? "").trim();
  if (!primary) return matchIds;

  return [...matchIds].sort((a, b) => {
    if (a === primary) return -1;
    if (b === primary) return 1;
    return 0;
  });
}

export default function TripMatchesCard({
  trip,
  numericMatchIds,
  primaryMatchId,
  fixturesById,
  ticketsByMatchId,
  fxLoading,
  onAddMatch,
  onOpenTicketsForMatch,
  onOpenMatchActions,
  onSetPrimaryMatch,
  onRemoveMatch,
  getTicketProviderFromItem,
  getTicketScoreFromItem,
  getLivePriceLine,
}: Props) {
  const orderedMatchIds = sortMatchIds(numericMatchIds, primaryMatchId);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionEyebrow}>Trip structure</Text>
          <Text style={styles.sectionTitle}>Matches</Text>
          <Text style={styles.sectionSub}>
            The primary match should drive the trip. Everything else supports it.
          </Text>
        </View>

        <Pressable onPress={onAddMatch} style={styles.inlineLinkBtn}>
          <Text style={styles.inlineLinkText}>Add match ›</Text>
        </Pressable>
      </View>

      {numericMatchIds.length === 0 ? (
        <EmptyState
          title="No matches added"
          message="Add a match to unlock ticket-first planning and make this trip actually usable."
        />
      ) : (
        <View style={styles.list}>
          {orderedMatchIds.map((matchId) => {
            const fixture = fixturesById[String(matchId)];
            const ticketItem = ticketsByMatchId[String(matchId)] ?? null;
            const isPrimary = String(primaryMatchId ?? "") === String(matchId);

            const ticketProviderRaw = getTicketProviderFromItem(ticketItem);
            const ticketProvider = ticketProviderRaw ? providerLabel(ticketProviderRaw) : null;

            const ticketScore = getTicketScoreFromItem(ticketItem);
            const livePrice =
              ticketItem && ticketItem.status === "booked"
                ? getLivePriceLine(ticketItem)
                : null;

            const data = buildMatchCardData(trip, matchId, fixture);
            const urgency = urgencyLine({
              isPrimary,
              ticketItem,
              certaintyLine: data.kickoff.line,
            });

            const ticketState = ticketStateLine({
              ticketItem,
              livePrice,
              provider: ticketProvider,
            });

            const ticketQuality = ticketQualityLine({
              ticketItem,
              provider: ticketProvider,
              score: ticketScore,
            });

            return (
              <View key={matchId} style={styles.matchRowWrap}>
                <Pressable
                  onPress={() => onOpenTicketsForMatch(matchId)}
                  onLongPress={() => onOpenMatchActions(matchId)}
                  style={[styles.matchCard, isPrimary && styles.matchCardPrimary]}
                >
                  <View style={styles.matchTopRow}>
                    <View style={styles.matchTopLeft}>
                      {isPrimary ? (
                        <View style={[styles.badge, styles.badgePrimary]}>
                          <Text style={styles.badgeText}>Primary</Text>
                        </View>
                      ) : null}

                      {ticketItem ? <StatusBadge status={ticketItem.status} /> : null}
                    </View>

                    <View style={styles.certaintyWrap}>
                      <FixtureCertaintyBadge state={data.certainty} />
                    </View>
                  </View>

                  <View style={styles.teamsRow}>
                    <View style={styles.teamCol}>
                      <TeamCrest name={data.homeName} logo={data.homeLogo} />
                      <Text style={styles.teamName} numberOfLines={2}>
                        {data.homeName}
                      </Text>
                    </View>

                    <View style={styles.centerCol}>
                      <Text
                        style={[styles.matchUrgency, isPrimary && styles.matchUrgencyPrimary]}
                        numberOfLines={2}
                      >
                        {urgency}
                      </Text>
                    </View>

                    <View style={styles.teamCol}>
                      <TeamCrest name={data.awayName} logo={data.awayLogo} />
                      <Text style={styles.teamName} numberOfLines={2}>
                        {data.awayName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.matchInfoBlock}>
                    <Text style={styles.matchTitle} numberOfLines={1}>
                      {data.title}
                    </Text>

                    {data.metaTop ? (
                      <Text style={styles.matchMeta} numberOfLines={1}>
                        {data.metaTop}
                      </Text>
                    ) : null}

                    {data.metaBottom ? (
                      <Text style={styles.matchMeta} numberOfLines={1}>
                        {data.metaBottom}
                      </Text>
                    ) : null}

                    {data.logisticsLine ? (
                      <Text style={styles.logisticsMeta} numberOfLines={1}>
                        {data.logisticsLine}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.ticketPanel}>
                    <Text style={styles.ticketState} numberOfLines={1}>
                      {ticketState}
                    </Text>
                    <Text
                      style={
                        ticketItem ? styles.ticketQualityMeta : styles.ticketQualityMetaMuted
                      }
                      numberOfLines={1}
                    >
                      {ticketQuality}
                    </Text>
                  </View>

                  <View style={styles.tapHintRow}>
                    <Text style={styles.tapHint}>Tap for ticket routes • hold for match actions</Text>
                    <Text style={styles.chev}>›</Text>
                  </View>
                </Pressable>

                <View style={styles.matchActionsRow}>
                  <Pressable
                    onPress={() => onOpenTicketsForMatch(matchId)}
                    style={[
                      styles.smallBtn,
                      styles.smallBtnWide,
                      isPrimary && styles.smallBtnPrimaryStrong,
                    ]}
                  >
                    <Text style={styles.smallBtnText}>{primaryActionLabel(ticketItem)}</Text>
                  </Pressable>

                  {!isPrimary ? (
                    <Pressable
                      onPress={() => onSetPrimaryMatch(matchId)}
                      style={[styles.smallBtn, styles.smallBtnWide, styles.smallBtnPrimary]}
                    >
                      <Text style={styles.smallBtnText}>Set primary</Text>
                    </Pressable>
                  ) : (
                    <View style={[styles.smallBtn, styles.smallBtnWide, styles.smallBtnDisabled]}>
                      <Text style={styles.smallBtnText}>Trip anchor</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => onRemoveMatch(matchId)}
                    style={[styles.smallBtn, styles.smallBtnWide, styles.smallBtnDanger]}
                  >
                    <Text style={styles.smallBtnText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {fxLoading ? <Text style={styles.mutedInline}>Loading match details…</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
  },

  list: {
    gap: 14,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },

  sectionHeadingWrap: {
    flex: 1,
  },

  sectionEyebrow: {
    color: "#8EF2A5",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 4,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  inlineLinkBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },

  inlineLinkText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  mutedInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "800",
  },

  matchRowWrap: {
    gap: 8,
  },

  matchCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.035)",
    padding: 14,
    gap: 12,
  },

  matchCardPrimary: {
    borderColor: "rgba(0,255,136,0.30)",
    backgroundColor: "rgba(0,255,136,0.06)",
  },

  matchTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  matchTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },

  certaintyWrap: {
    alignItems: "flex-end",
  },

  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  teamCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },

  centerCol: {
    width: 104,
    alignItems: "center",
    justifyContent: "center",
  },

  teamName: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
    textAlign: "center",
  },

  matchUrgency: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },

  matchUrgencyPrimary: {
    color: theme.colors.primary,
  },

  matchInfoBlock: {
    gap: 4,
  },

  matchTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 20,
  },

  matchMeta: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  logisticsMeta: {
    marginTop: 2,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 16,
  },

  ticketPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },

  ticketState: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  ticketQualityMeta: {
    color: "rgba(160,195,255,1)",
    fontWeight: "900",
    fontSize: 11,
  },

  ticketQualityMetaMuted: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 11,
  },

  tapHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  tapHint: {
    flex: 1,
    color: theme.colors.textTertiary,
    fontWeight: "800",
    fontSize: 11,
  },

  matchActionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  crestWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  crestImg: {
    width: 28,
    height: 28,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
  },

  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  smallBtnWide: {
    flex: 1,
    alignItems: "center",
  },

  smallBtnPrimary: {
    borderColor: "rgba(0,255,136,0.35)",
  },

  smallBtnPrimaryStrong: {
    borderColor: "rgba(0,255,136,0.48)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },

  smallBtnDisabled: {
    opacity: 0.65,
  },

  smallBtnDanger: {
    borderColor: "rgba(255,80,80,0.35)",
  },

  smallBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  badgePrimary: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,255,136,0.10)",
  },

  badgePending: {
    borderColor: "rgba(255,200,80,0.40)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },

  badgeSaved: {
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },

  badgeBooked: {
    borderColor: "rgba(120,170,255,0.45)",
    backgroundColor: "rgba(120,170,255,0.10)",
  },

  badgeArchived: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  chev: {
    color: theme.colors.textSecondary,
    fontSize: 20,
    marginTop: -1,
  },
});
