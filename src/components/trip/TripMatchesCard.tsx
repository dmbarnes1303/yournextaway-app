import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";

import { theme } from "@/src/constants/theme";
import type { Trip } from "@/src/state/trips";
import type { SavedItem } from "@/src/core/savedItemTypes";
import type { FixtureListRow } from "@/src/services/apiFootball";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import { getMatchdayLogistics, buildLogisticsSnippet } from "@/src/data/matchdayLogistics";
import {
  clean,
  safeUri,
  initials,
  safeFixtureTitle,
  formatKickoffMeta,
  providerShort,
  providerBadgeStyle,
  statusLabel,
  ticketConfidenceLabel,
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

function ProviderBadge({ provider }: { provider?: string | null }) {
  const badge = providerBadgeStyle(provider);
  const short = providerShort(provider);

  return (
    <View style={styles.providerBadgeWrap}>
      <View
        style={[
          styles.providerBadgeCircle,
          {
            borderColor: badge.borderColor,
            backgroundColor: badge.backgroundColor,
          },
        ]}
      >
        <Text style={[styles.providerBadgeCircleText, { color: badge.textColor }]}>{short}</Text>
      </View>
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

  const homeName = clean((fixture as any)?.teams?.home?.name ?? (trip as any)?.homeName ?? "Home");
  const awayName = clean((fixture as any)?.teams?.away?.name ?? (trip as any)?.awayName ?? "Away");

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
  return (
    <GlassCard style={styles.card}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Matches</Text>

        <Pressable onPress={onAddMatch} style={styles.inlineLinkBtn}>
          <Text style={styles.inlineLinkText}>Add match ›</Text>
        </Pressable>
      </View>

      {numericMatchIds.length === 0 ? (
        <EmptyState title="No matches added" message="Add a match to unlock match-specific planning." />
      ) : (
        <View style={styles.list}>
          {numericMatchIds.map((matchId) => {
            const fixture = fixturesById[String(matchId)];
            const ticketItem = ticketsByMatchId[String(matchId)] ?? null;
            const isPrimary = String(primaryMatchId ?? "") === String(matchId);
            const ticketProvider = getTicketProviderFromItem(ticketItem);
            const ticketScore = getTicketScoreFromItem(ticketItem);

            const data = buildMatchCardData(trip, matchId, fixture);

            return (
              <View key={matchId} style={styles.matchRowWrap}>
                <Pressable
                  onPress={() => onOpenTicketsForMatch(matchId)}
                  onLongPress={() => onOpenMatchActions(matchId)}
                  style={styles.matchRow}
                >
                  <TeamCrest name={data.homeName} logo={data.homeLogo} />

                  <View style={styles.matchContent}>
                    <View style={styles.matchTitleRow}>
                      <Text style={styles.matchTitle} numberOfLines={1}>
                        {data.title}
                      </Text>

                      {isPrimary ? (
                        <View style={[styles.badge, styles.badgePrimary]}>
                          <Text style={styles.badgeText}>Primary</Text>
                        </View>
                      ) : null}

                      {ticketItem ? <StatusBadge status={ticketItem.status} /> : null}
                    </View>

                    <Text style={styles.matchMeta} numberOfLines={1}>
                      {data.kickoff.line}
                    </Text>

                    <View style={styles.certaintyWrap}>
                      <FixtureCertaintyBadge state={data.certainty} />
                    </View>

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

                    {ticketItem ? (
                      <View style={styles.ticketSignalRow}>
                        {ticketProvider ? <ProviderBadge provider={ticketProvider} /> : null}
                        <Text style={styles.matchHint} numberOfLines={1}>
                          {getLivePriceLine(ticketItem) || `Tap to open tickets (${statusLabel(ticketItem.status)})`}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.matchHint} numberOfLines={1}>
                        Tap to compare live ticket options • Hold for options
                      </Text>
                    )}

                    {ticketScore != null ? (
                      <Text style={styles.ticketQualityMeta} numberOfLines={1}>
                        {ticketConfidenceLabel(ticketScore)}
                      </Text>
                    ) : null}
                  </View>

                  <TeamCrest name={data.awayName} logo={data.awayLogo} />
                  <Text style={styles.chev}>›</Text>
                </Pressable>

                <View style={styles.matchActionsRow}>
                  <Pressable
                    onPress={() => onOpenTicketsForMatch(matchId)}
                    style={[styles.smallBtn, styles.smallBtnWide]}
                  >
                    <Text style={styles.smallBtnText}>Tickets</Text>
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
                      <Text style={styles.smallBtnText}>Primary</Text>
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
    gap: 10,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
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

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  matchContent: {
    flex: 1,
    minWidth: 0,
  },

  matchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  matchTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    flexShrink: 1,
  },

  matchMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  certaintyWrap: {
    marginTop: 6,
  },

  logisticsMeta: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 16,
  },

  ticketSignalRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },

  matchHint: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
    flex: 1,
  },

  ticketQualityMeta: {
    marginTop: 4,
    color: "rgba(160,195,255,1)",
    fontWeight: "900",
    fontSize: 11,
  },

  matchActionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  crestWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  crestImg: {
    width: 26,
    height: 26,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
  },

  providerBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  providerBadgeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  providerBadgeCircleText: {
    fontWeight: "900",
    letterSpacing: 0.4,
    fontSize: 11,
  },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
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
    fontSize: 22,
    marginTop: -2,
  },
});
