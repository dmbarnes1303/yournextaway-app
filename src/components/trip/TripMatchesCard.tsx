import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";

import { theme } from "@/src/constants/theme";
import type { Trip } from "@/src/state/trips";
import type { SavedItem } from "@/src/core/savedItemTypes";
import type { FixtureListRow } from "@/src/services/apiFootball";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import { getMatchdayLogistics, buildLogisticsSnippet } from "@/src/data/matchdayLogistics";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function safeUri(u: unknown): string | null {
  const s = clean(u);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

function initials(name: string) {
  const cleanName = clean(name);
  if (!cleanName) return "—";
  const parts = cleanName.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function safeFixtureTitle(r: FixtureListRow | null | undefined, fallbackId: string, trip?: Trip | null) {
  const home = clean((r as any)?.teams?.home?.name) || clean((trip as any)?.homeName);
  const away = clean((r as any)?.teams?.away?.name) || clean((trip as any)?.awayName);
  if (home && away) return `${home} vs ${away}`;
  if (home) return `${home} match`;
  if (away) return `${away} match`;
  return `Match ${fallbackId}`;
}

function parseIsoToDate(iso?: string | null): Date | null {
  const s = clean(iso);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatKickoffMeta(
  row?: FixtureListRow | null,
  trip?: Trip | null
): { line: string; tbc: boolean; iso: string | null } {
  const isoRaw = (row as any)?.fixture?.date ?? (trip as any)?.kickoffIso;
  const iso = clean(isoRaw) || null;

  const d = parseIsoToDate(iso);
  const short = clean((row as any)?.fixture?.status?.short).toUpperCase();
  const long = clean((row as any)?.fixture?.status?.long);

  const looksTbc = short === "TBD" || short === "TBA" || short === "NS" || short === "PST";
  const snapTbc = Boolean((trip as any)?.kickoffTbc);

  if (!d) {
    const tbc = looksTbc || snapTbc;
    return { line: tbc ? "Kickoff: TBC" : "Kickoff: —", tbc: true, iso };
  }

  const datePart = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const midnight = d.getHours() === 0 && d.getMinutes() === 0;
  const tbc = looksTbc || snapTbc || midnight;

  if (tbc) return { line: `Kickoff: ${datePart} • TBC`, tbc: true, iso };

  const statusHint = long ? ` • ${long}` : "";
  return { line: `Kickoff: ${datePart} • ${timePart}${statusHint}`, tbc: false, iso };
}

function providerLabel(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();
  if (raw === "footballticketsnet") return "FootballTicketNet";
  if (raw === "sportsevents365") return "SportsEvents365";
  if (raw === "gigsberg") return "Gigsberg";
  if (raw === "aviasales") return "Aviasales";
  if (raw === "expedia" || raw === "expedia_stays") return "Expedia";
  if (raw === "kiwitaxi") return "KiwiTaxi";
  if (raw === "omio") return "Omio";
  if (raw === "getyourguide") return "GetYourGuide";
  return provider || "Provider";
}

function providerShort(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();
  if (raw === "footballticketsnet") return "FTN";
  if (raw === "sportsevents365") return "365";
  if (raw === "gigsberg") return "G";
  if (raw === "aviasales") return "AV";
  if (raw === "expedia" || raw === "expedia_stays") return "EX";
  if (raw === "kiwitaxi") return "KT";
  if (raw === "omio") return "OM";
  if (raw === "getyourguide") return "GYG";
  return "P";
}

function providerBadgeStyle(provider?: string | null) {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") {
    return {
      borderColor: "rgba(120,170,255,0.35)",
      backgroundColor: "rgba(120,170,255,0.12)",
      textColor: "rgba(205,225,255,1)",
    };
  }

  if (raw === "sportsevents365") {
    return {
      borderColor: "rgba(87,162,56,0.35)",
      backgroundColor: "rgba(87,162,56,0.12)",
      textColor: "rgba(208,240,192,1)",
    };
  }

  if (raw === "gigsberg") {
    return {
      borderColor: "rgba(255,200,80,0.35)",
      backgroundColor: "rgba(255,200,80,0.12)",
      textColor: "rgba(255,226,160,1)",
    };
  }

  if (raw === "aviasales") {
    return {
      borderColor: "rgba(120,170,255,0.30)",
      backgroundColor: "rgba(120,170,255,0.10)",
      textColor: "rgba(210,225,255,1)",
    };
  }

  if (raw === "expedia" || raw === "expedia_stays") {
    return {
      borderColor: "rgba(87,162,56,0.30)",
      backgroundColor: "rgba(87,162,56,0.10)",
      textColor: "rgba(210,240,205,1)",
    };
  }

  if (raw === "kiwitaxi") {
    return {
      borderColor: "rgba(255,160,120,0.30)",
      backgroundColor: "rgba(255,160,120,0.10)",
      textColor: "rgba(255,220,205,1)",
    };
  }

  if (raw === "omio") {
    return {
      borderColor: "rgba(200,120,255,0.30)",
      backgroundColor: "rgba(200,120,255,0.10)",
      textColor: "rgba(235,210,255,1)",
    };
  }

  if (raw === "getyourguide") {
    return {
      borderColor: "rgba(255,90,120,0.30)",
      backgroundColor: "rgba(255,90,120,0.10)",
      textColor: "rgba(255,215,225,1)",
    };
  }

  return {
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    textColor: theme.colors.text,
  };
}

function statusLabel(s: SavedItem["status"]) {
  if (s === "pending") return "Pending";
  if (s === "saved") return "Saved";
  if (s === "booked") return "Booked";
  return "Archived";
}

function ticketConfidenceLabel(score?: number | null): string {
  const value = typeof score === "number" ? score : 0;
  if (value >= 90) return "High confidence";
  if (value >= 75) return "Strong match";
  if (value >= 60) return "Good match";
  return "Fallback";
}

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

function StatusBadge({ s }: { s: SavedItem["status"] }) {
  const label = statusLabel(s);
  const style =
    s === "pending"
      ? styles.badgePending
      : s === "saved"
        ? styles.badgeSaved
        : s === "booked"
          ? styles.badgeBooked
          : styles.badgeArchived;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

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
        <View style={{ gap: 10 }}>
          {numericMatchIds.map((mid) => {
            const r = fixturesById[String(mid)];
            const title = safeFixtureTitle(r, mid, trip);

            const leagueName = clean((r as any)?.league?.name ?? (trip as any)?.leagueName);
            const round = clean((r as any)?.league?.round);
            const venue = clean((r as any)?.fixture?.venue?.name ?? (trip as any)?.venueName);
            const city = clean((r as any)?.fixture?.venue?.city ?? (trip as any)?.displayCity);
            const kickoff = formatKickoffMeta(r, trip);

            const meta1 = [leagueName || null, round || null].filter(Boolean).join(" • ");
            const meta2 = [venue || null, city || null].filter(Boolean).join(" • ");

            const homeName = clean((r as any)?.teams?.home?.name ?? (trip as any)?.homeName ?? "Home");
            const awayName = clean((r as any)?.teams?.away?.name ?? (trip as any)?.awayName ?? "Away");

            const homeLogo = safeUri((r as any)?.teams?.home?.logo);
            const awayLogo = safeUri((r as any)?.teams?.away?.logo);

            const logistics = getMatchdayLogistics({ homeTeamName: homeName, leagueName });
            const logisticsLine = logistics ? buildLogisticsSnippet(logistics) : "";

            const certainty = getFixtureCertainty(r as any, {
              previousKickoffIso: (trip as any)?.kickoffIso ?? null,
            });

            const ticketItem = ticketsByMatchId[String(mid)];
            const isPrimary = String(primaryMatchId ?? "") === String(mid);
            const ticketScore = getTicketScoreFromItem(ticketItem);
            const ticketProvider = getTicketProviderFromItem(ticketItem);

            return (
              <View key={mid} style={styles.matchRowWrap}>
                <Pressable
                  onPress={() => onOpenTicketsForMatch(mid)}
                  onLongPress={() => onOpenMatchActions(mid)}
                  style={styles.matchRow}
                >
                  <TeamCrest name={homeName} logo={homeLogo} />

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.matchTitleRow}>
                      <Text style={styles.matchTitle} numberOfLines={1}>
                        {title}
                      </Text>

                      {isPrimary ? (
                        <View style={[styles.badge, styles.badgePrimary]}>
                          <Text style={styles.badgeText}>Primary</Text>
                        </View>
                      ) : null}

                      {ticketItem ? <StatusBadge s={ticketItem.status} /> : null}
                    </View>

                    <Text style={styles.matchMeta} numberOfLines={1}>
                      {kickoff.line}
                    </Text>

                    <View style={{ marginTop: 6 }}>
                      <FixtureCertaintyBadge state={certainty} />
                    </View>

                    {meta1 ? (
                      <Text style={styles.matchMeta} numberOfLines={1}>
                        {meta1}
                      </Text>
                    ) : null}

                    {meta2 ? (
                      <Text style={styles.matchMeta} numberOfLines={1}>
                        {meta2}
                      </Text>
                    ) : null}

                    {logisticsLine ? (
                      <Text style={styles.logisticsMeta} numberOfLines={1}>
                        {logisticsLine}
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

                  <TeamCrest name={awayName} logo={awayLogo} />
                  <Text style={styles.chev}>›</Text>
                </Pressable>

                <View style={styles.matchActionsRow}>
                  <Pressable onPress={() => onOpenTicketsForMatch(mid)} style={[styles.smallBtn, styles.smallBtnWide]}>
                    <Text style={styles.smallBtnText}>Tickets</Text>
                  </Pressable>

                  {!isPrimary ? (
                    <Pressable
                      onPress={() => onSetPrimaryMatch(mid)}
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
                    onPress={() => onRemoveMatch(mid)}
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
  card: { padding: theme.spacing.lg },

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

  inlineLinkText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  mutedInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "800",
  },

  matchRowWrap: { gap: 8 },

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

  matchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  matchTitle: { color: theme.colors.text, fontWeight: "900", flexShrink: 1 },

  matchMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
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

  matchActionsRow: { flexDirection: "row", gap: 8 },

  crestWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  crestImg: { width: 26, height: 26 },

  crestFallback: { color: theme.colors.textSecondary, fontWeight: "900" },

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

  smallBtnWide: { flex: 1, alignItems: "center" },

  smallBtnPrimary: { borderColor: "rgba(0,255,136,0.35)" },

  smallBtnDisabled: { opacity: 0.65 },

  smallBtnDanger: { borderColor: "rgba(255,80,80,0.35)" },

  smallBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },

  badgeText: { color: theme.colors.text, fontWeight: "900", fontSize: 11 },

  badgePrimary: { borderColor: "rgba(0,255,136,0.45)", backgroundColor: "rgba(0,255,136,0.10)" },

  badgePending: { borderColor: "rgba(255,200,80,0.40)", backgroundColor: "rgba(255,200,80,0.10)" },

  badgeSaved: { borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,255,136,0.08)" },

  badgeBooked: { borderColor: "rgba(120,170,255,0.45)", backgroundColor: "rgba(120,170,255,0.10)" },

  badgeArchived: { borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(255,255,255,0.06)" },

  chev: { color: theme.colors.textSecondary, fontSize: 22, marginTop: -2 },
});
