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

function TeamCrest({ name, logo, large }: { name: string; logo?: string | null; large?: boolean }) {
  return (
    <View style={[styles.crestWrap, large && styles.crestWrapLarge]}>
      {logo ? (
        <Image
          source={{ uri: logo }}
          style={[styles.crestImg, large && styles.crestImgLarge]}
          resizeMode="contain"
        />
      ) : (
        <Text style={[styles.crestFallback, large && styles.crestFallbackLarge]}>
          {initials(name)}
        </Text>
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
  if (typeof score !== "number" || !Number.isFinite(score)) return "Confidence unknown";
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
    return provider ? `Opened with ${provider}` : "Booking flow opened";
  }

  if (ticketItem.status === "saved") {
    return provider ? `Saved from ${provider}` : "Ticket option saved";
  }

  return "Archived ticket route";
}

function ticketQualityLine(args: {
  ticketItem: SavedItem | null;
  provider: string | null;
  score: number | null;
}) {
  const { ticketItem, provider, score } = args;

  if (!ticketItem) return "Compare live ticket providers";

  if (ticketItem.status === "archived") return "Archived route";

  const confidence = ticketConfidenceLabel(score);
  if (provider && score != null) return `${confidence} • ${provider}`;
  if (provider) return provider;
  if (score != null) return confidence;

  return "Ticket route saved";
}

function primaryActionLabel(ticketItem: SavedItem | null) {
  if (!ticketItem) return "Find tickets";
  if (ticketItem.status === "booked") return "Open ticket";
  if (ticketItem.status === "pending") return "Resume";
  if (ticketItem.status === "saved") return "View ticket";
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

function MatchRouteCard({
  trip,
  matchId,
  fixture,
  ticketItem,
  isPrimary,
  onOpenTicketsForMatch,
  onOpenMatchActions,
  onSetPrimaryMatch,
  onRemoveMatch,
  getTicketProviderFromItem,
  getTicketScoreFromItem,
  getLivePriceLine,
}: {
  trip: Trip;
  matchId: string;
  fixture: FixtureListRow | undefined;
  ticketItem: SavedItem | null;
  isPrimary: boolean;
  onOpenTicketsForMatch: (matchId: string) => void;
  onOpenMatchActions: (matchId: string) => void;
  onSetPrimaryMatch: (matchId: string) => void;
  onRemoveMatch: (matchId: string) => void;
  getTicketProviderFromItem: (item: SavedItem | null) => string | null;
  getTicketScoreFromItem: (item: SavedItem | null) => number | null;
  getLivePriceLine: (item: SavedItem) => string | null;
}) {
  const ticketProviderRaw = getTicketProviderFromItem(ticketItem);
  const ticketProvider = ticketProviderRaw ? providerLabel(ticketProviderRaw) : null;
  const ticketScore = getTicketScoreFromItem(ticketItem);

  const livePrice =
    ticketItem && ticketItem.status === "booked" ? getLivePriceLine(ticketItem) : null;

  const data = buildMatchCardData(trip, matchId, fixture);

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

  const cta = primaryActionLabel(ticketItem);

  return (
    <View style={styles.matchRowWrap}>
      <Pressable
        onPress={() => onOpenTicketsForMatch(matchId)}
        onLongPress={() => onOpenMatchActions(matchId)}
        style={[styles.matchCard, isPrimary && styles.matchCardPrimary]}
      >
        <View style={styles.matchTopRow}>
          <View style={styles.matchTopLeft}>
            {isPrimary ? (
              <View style={[styles.badge, styles.badgePrimary]}>
                <Text style={styles.badgeText}>Primary trip match</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeText}>Extra match</Text>
              </View>
            )}

            {ticketItem ? <StatusBadge status={ticketItem.status} /> : null}
          </View>

          <FixtureCertaintyBadge state={data.certainty} />
        </View>

        <View style={[styles.teamsRow, isPrimary && styles.teamsRowPrimary]}>
          <View style={styles.teamCol}>
            <TeamCrest name={data.homeName} logo={data.homeLogo} large={isPrimary} />
            <Text style={[styles.teamName, isPrimary && styles.teamNamePrimary]} numberOfLines={2}>
              {data.homeName}
            </Text>
          </View>

          <View style={styles.centerCol}>
            <Text style={[styles.vsText, isPrimary && styles.vsTextPrimary]}>VS</Text>
            <Text style={styles.kickoffLine} numberOfLines={2}>
              {data.kickoff.line}
            </Text>
          </View>

          <View style={styles.teamCol}>
            <TeamCrest name={data.awayName} logo={data.awayLogo} large={isPrimary} />
            <Text style={[styles.teamName, isPrimary && styles.teamNamePrimary]} numberOfLines={2}>
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

        <View style={[styles.ticketPanel, !ticketItem && styles.ticketPanelEmpty]}>
          <View style={styles.ticketPanelCopy}>
            <Text style={styles.ticketState} numberOfLines={1}>
              {ticketState}
            </Text>
            <Text
              style={ticketItem ? styles.ticketQualityMeta : styles.ticketQualityMetaMuted}
              numberOfLines={1}
            >
              {ticketQuality}
            </Text>
          </View>

          <Text style={styles.ticketArrow}>›</Text>
        </View>
      </Pressable>

      <View style={styles.actionBar}>
        <Pressable
          onPress={() => onOpenTicketsForMatch(matchId)}
          style={[styles.primaryBtn, isPrimary && styles.primaryBtnFeatured]}
        >
          <Text style={styles.primaryBtnText}>{cta}</Text>
        </Pressable>

        {!isPrimary ? (
          <Pressable onPress={() => onSetPrimaryMatch(matchId)} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Set primary</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => onOpenMatchActions(matchId)} style={styles.moreBtn}>
          <Text style={styles.moreBtnText}>More</Text>
        </Pressable>

        {!isPrimary ? (
          <Pressable onPress={() => onRemoveMatch(matchId)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
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
    <GlassCard style={styles.card} variant="brand" level="strong">
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionEyebrow}>Match anchor</Text>
          <Text style={styles.sectionTitle}>Tickets & matches</Text>
          <Text style={styles.sectionSub}>
            Pick the match that anchors the trip, then compare ticket routes.
          </Text>
        </View>

        <Pressable onPress={onAddMatch} style={styles.inlineLinkBtn}>
          <Text style={styles.inlineLinkText}>Add match</Text>
        </Pressable>
      </View>

      {numericMatchIds.length === 0 ? (
        <EmptyState
          title="No matches added"
          message="Add a match first. Tickets, hotels and travel should all build around the fixture."
        />
      ) : (
        <View style={styles.list}>
          {orderedMatchIds.map((matchId) => {
            const fixture = fixturesById[String(matchId)];
            const ticketItem = ticketsByMatchId[String(matchId)] ?? null;
            const isPrimary = String(primaryMatchId ?? "") === String(matchId);

            return (
              <MatchRouteCard
                key={matchId}
                trip={trip}
                matchId={matchId}
                fixture={fixture}
                ticketItem={ticketItem}
                isPrimary={isPrimary}
                onOpenTicketsForMatch={onOpenTicketsForMatch}
                onOpenMatchActions={onOpenMatchActions}
                onSetPrimaryMatch={onSetPrimaryMatch}
                onRemoveMatch={onRemoveMatch}
                getTicketProviderFromItem={getTicketProviderFromItem}
                getTicketScoreFromItem={getTicketScoreFromItem}
                getLivePriceLine={getLivePriceLine}
              />
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
    borderRadius: 28,
  },

  list: {
    gap: 18,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },

  sectionHeadingWrap: {
    flex: 1,
  },

  sectionEyebrow: {
    color: theme.colors.accentGoldSoft,
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 5,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 24,
    lineHeight: 29,
    marginBottom: 5,
    letterSpacing: -0.35,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontWeight: "750",
    fontSize: 13,
    lineHeight: 18,
  },

  inlineLinkBtn: {
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.28)",
    backgroundColor: "rgba(250,204,21,0.10)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },

  inlineLinkText: {
    color: theme.colors.accentGoldSoft,
    fontWeight: "900",
    fontSize: 12,
  },

  mutedInline: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "800",
  },

  matchRowWrap: {
    gap: 10,
  },

  matchCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(245,247,246,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.26)" : "rgba(255,255,255,0.045)",
    padding: 14,
    gap: 14,
    overflow: "hidden",
  },

  matchCardPrimary: {
    borderColor: "rgba(34,197,94,0.42)",
    backgroundColor: "rgba(34,197,94,0.095)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
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

  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  teamsRowPrimary: {
    paddingVertical: 4,
  },

  teamCol: {
    flex: 1,
    alignItems: "center",
    gap: 7,
  },

  centerCol: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  crestWrap: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.34)",
    borderWidth: 1,
    borderColor: "rgba(245,247,246,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  crestWrapLarge: {
    width: 60,
    height: 60,
    borderRadius: 21,
    borderColor: "rgba(250,204,21,0.20)",
    backgroundColor: "rgba(0,0,0,0.40)",
  },

  crestImg: {
    width: 30,
    height: 30,
  },

  crestImgLarge: {
    width: 40,
    height: 40,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 13,
  },

  crestFallbackLarge: {
    color: theme.colors.text,
    fontSize: 15,
  },

  teamName: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
    lineHeight: 16,
    textAlign: "center",
  },

  teamNamePrimary: {
    fontSize: 14,
    lineHeight: 17,
  },

  vsText: {
    color: theme.colors.accentGoldSoft,
    fontWeight: "950",
    fontSize: 13,
    letterSpacing: 1.1,
  },

  vsTextPrimary: {
    fontSize: 15,
  },

  kickoffLine: {
    color: theme.colors.textSecondary,
    fontWeight: "850",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
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
    color: theme.colors.textMuted,
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 16,
  },

  ticketPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
    backgroundColor: "rgba(34,197,94,0.08)",
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  ticketPanelEmpty: {
    borderColor: "rgba(250,204,21,0.24)",
    backgroundColor: "rgba(250,204,21,0.085)",
  },

  ticketPanelCopy: {
    flex: 1,
    gap: 3,
  },

  ticketState: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
    lineHeight: 17,
  },

  ticketQualityMeta: {
    color: theme.colors.accentGreenSoft,
    fontWeight: "850",
    fontSize: 11,
  },

  ticketQualityMetaMuted: {
    color: theme.colors.accentGoldSoft,
    fontWeight: "850",
    fontSize: 11,
  },

  ticketArrow: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: -2,
  },

  actionBar: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  primaryBtn: {
    flex: 1.25,
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentGold,
    paddingHorizontal: 12,
  },

  primaryBtnFeatured: {
    backgroundColor: theme.colors.accentGreen,
  },

  primaryBtnText: {
    color: "#07100A",
    fontWeight: "950",
    fontSize: 13,
  },

  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.08)",
    paddingHorizontal: 10,
  },

  secondaryBtnText: {
    color: theme.colors.accentGreenSoft,
    fontWeight: "900",
    fontSize: 12,
  },

  moreBtn: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245,247,246,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 13,
  },

  moreBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  removeBtn: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(224,82,82,0.30)",
    backgroundColor: "rgba(224,82,82,0.08)",
    paddingHorizontal: 12,
  },

  removeBtnText: {
    color: "#FF9A9A",
    fontWeight: "900",
    fontSize: 12,
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  badgeText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  badgePrimary: {
    borderColor: "rgba(34,197,94,0.45)",
    backgroundColor: "rgba(34,197,94,0.13)",
  },

  badgeSecondary: {
    borderColor: "rgba(245,247,246,0.14)",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  badgePending: {
    borderColor: "rgba(250,204,21,0.40)",
    backgroundColor: "rgba(250,204,21,0.11)",
  },

  badgeSaved: {
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.09)",
  },

  badgeBooked: {
    borderColor: "rgba(134,239,172,0.44)",
    backgroundColor: "rgba(34,197,94,0.14)",
  },

  badgeArchived: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
