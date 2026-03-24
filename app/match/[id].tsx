// app/match/[id].tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";
import Chip from "@/src/components/Chip";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { useFixture } from "@/src/hooks/useFixtures";
import { useTripsStore } from "@/src/state/trips";

import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";
import {
  resolveTicketForFixture,
  type TicketResolutionOption,
  type TicketResolutionResult,
} from "@/src/services/ticketResolver";

import { getStadiumByTeamFromRegistry } from "@/src/data/stadiumRegistry";
import { normalizeTeamKey } from "@/src/data/teams";

/* -------------------------------------------------------------------------- */
/* CORE HELPERS (STRIPPED BACK)                                               */
/* -------------------------------------------------------------------------- */

const clean = (v: unknown) => String(v ?? "").trim();

const formatKickoff = (iso?: string | null) => {
  if (!iso) return "Kick-off TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Kick-off TBC";

  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price?: string | null) => {
  const p = clean(price);
  if (!p) return "View price";
  if (/^[£€$]/.test(p)) return `From ${p}`;
  return p;
};

/* -------------------------------------------------------------------------- */
/* UI COMPONENTS                                                              */
/* -------------------------------------------------------------------------- */

function Crest({ name, uri }: { name: string; uri?: string | null }) {
  return (
    <View style={styles.crest}>
      {uri ? (
        <Image source={{ uri }} style={styles.crestImg} />
      ) : (
        <Text style={styles.crestFallback}>{name.slice(0, 2)}</Text>
      )}
    </View>
  );
}

function TicketCard({
  option,
  isBest,
  onPress,
  loading,
}: {
  option: TicketResolutionOption;
  isBest: boolean;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable
      style={[styles.ticketCard, isBest && styles.ticketBest]}
      onPress={onPress}
    >
      <Text style={styles.ticketPrice}>{formatPrice(option.priceText)}</Text>

      <Text style={styles.ticketMeta}>
        {option.exact ? "Exact match" : "Live availability"}
      </Text>

      <Text style={styles.ticketProvider}>{option.provider}</Text>

      <Text style={styles.ticketCTA}>
        {loading ? "Opening…" : "View tickets"}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fixtureId = clean((params as any)?.id);
  const tripId = clean((params as any)?.tripId);

  const { fixture, loading } = useFixture(fixtureId);

  const trip = useTripsStore((s) =>
    tripId ? s.trips.find((t) => t.id === tripId) : null
  );

  const [ticketResult, setTicketResult] =
    useState<TicketResolutionResult | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [openingUrl, setOpeningUrl] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* DATA                                                               */
  /* ------------------------------------------------------------------ */

  const home = clean(trip?.homeName ?? fixture?.teams?.home?.name);
  const away = clean(trip?.awayName ?? fixture?.teams?.away?.name);

  const kickoffIso = clean(trip?.kickoffIso ?? fixture?.fixture?.date);
  const kickoffText = formatKickoff(kickoffIso);

  const venue = clean(
    `${fixture?.fixture?.venue?.name ?? ""} ${fixture?.fixture?.venue?.city ?? ""}`
  );

  const crestHome = fixture?.teams?.home?.logo;
  const crestAway = fixture?.teams?.away?.logo;

  const stadium = useMemo(() => {
    return getStadiumByTeamFromRegistry(normalizeTeamKey(home));
  }, [home]);

  /* ------------------------------------------------------------------ */
  /* TICKETS                                                            */
  /* ------------------------------------------------------------------ */

  const options = useMemo(
    () => (ticketResult?.options ?? []).slice(0, 3),
    [ticketResult]
  );

  async function loadTickets() {
    if (loadingTickets) return;

    if (!home || !away || !kickoffIso) {
      Alert.alert("Match data not ready yet");
      return;
    }

    setLoadingTickets(true);

    try {
      const res = await resolveTicketForFixture({
        fixtureId,
        homeName: home,
        awayName: away,
        kickoffIso,
      });

      setTicketResult(res);
    } catch {
      Alert.alert("Couldn’t load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }

  async function openTicket(option: TicketResolutionOption) {
    if (!option.url) return;

    setOpeningUrl(option.url);

    try {
      if (tripId) {
        await beginPartnerClick({
          tripId,
          partnerId: option.provider as any,
          url: option.url,
          savedItemType: "tickets",
        });
      } else {
        await openUntrackedUrl(option.url);
      }
    } catch {
      Alert.alert("Couldn’t open");
    } finally {
      setOpeningUrl(null);
    }
  }

  /* ------------------------------------------------------------------ */
  /* NAV                                                                */
  /* ------------------------------------------------------------------ */

  const goBack = () => (tripId ? router.push(`/trip/${tripId}`) : router.back());

  const buildTrip = () => {
    router.push({
      pathname: "/trip/build",
      params: { fixtureId },
    });
  };

  /* ------------------------------------------------------------------ */
  /* GUARD                                                              */
  /* ------------------------------------------------------------------ */

  if (!fixtureId) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState title="Match not found" />
      </SafeAreaView>
    );
  }

const bg = getBackground("match");
  const imageUrl = typeof bg === "string" ? bg : null;
  const imageSource = typeof bg === "string" ? null : (bg as any);

  return (
    <Background imageUrl={imageUrl} imageSource={imageSource} overlayOpacity={0.14}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Button label="Back" tone="secondary" size="sm" onPress={goBack} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard level="default" variant="matte" style={styles.heroCard} noPadding>
            <View style={styles.heroGlow} pointerEvents="none" />
            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroKicker}>Match</Text>
                {fixture?.league?.name ? (
                  <Chip label={fixture.league.name} variant="default" />
                ) : null}
              </View>

              <View style={styles.teamsRow}>
                <View style={styles.teamCol}>
                  <Crest name={home || "Home"} uri={crestHome} />
                  <Text style={styles.teamLabel} numberOfLines={2}>
                    {home || "Home"}
                  </Text>
                </View>

                <View style={styles.vsCol}>
                  <Text style={styles.vsText}>vs</Text>
                </View>

                <View style={styles.teamCol}>
                  <Crest name={away || "Away"} uri={crestAway} />
                  <Text style={styles.teamLabel} numberOfLines={2}>
                    {away || "Away"}
                  </Text>
                </View>
              </View>

              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>{home && away ? `${home} vs ${away}` : "Match"}</Text>
                <Text style={styles.heroMeta}>{kickoffText}</Text>
                {!!venue && <Text style={styles.heroSub}>{venue}</Text>}
              </View>

              <View style={styles.heroActions}>
                <Button
                  label={loadingTickets ? "Checking tickets…" : "Compare tickets"}
                  tone="primary"
                  loading={loadingTickets}
                  onPress={loadTickets}
                  glow
                />
                <Button label="Plan trip from this match" tone="secondary" onPress={buildTrip} />
              </View>
            </View>
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Tickets</Text>
                <Text style={styles.sectionSub}>Start with the strongest current option.</Text>
              </View>
            </View>

            {options.length > 0 ? (
              <View style={styles.ticketList}>
                {options.map((option, index) => (
                  <TicketCard
                    key={`${option.provider}-${option.url}-${index}`}
                    option={option}
                    isBest={index === 0}
                    loading={openingUrl === option.url}
                    onPress={() => openTicket(option)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No ticket options loaded yet</Text>
                <Text style={styles.emptyText}>
                  Tap “Compare tickets” and the best live options will appear here.
                </Text>
              </View>
            )}
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Quick local info</Text>
                <Text style={styles.sectionSub}>Only the basics you actually need.</Text>
              </View>
            </View>

            {stadium ? (
              <View style={styles.quickInfo}>
                {!!stadium.airport && (
                  <Text style={styles.quickLine}>Airport: {stadium.airport}</Text>
                )}

                {Array.isArray(stadium.transit) && stadium.transit.length > 0 ? (
                  <Text style={styles.quickLine}>
                    Getting there: {stadium.transit[0].label}
                    {typeof stadium.transit[0].minutes === "number"
                      ? ` • ${stadium.transit[0].minutes} min walk`
                      : ""}
                  </Text>
                ) : null}

                {Array.isArray(stadium.stayAreas) && stadium.stayAreas.length > 0 ? (
                  <Text style={styles.quickLine}>
                    Stay area: {stadium.stayAreas[0].area}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No local guide yet</Text>
                <Text style={styles.emptyText}>
                  You can still plan from this match and check directions later.
                </Text>
              </View>
            )}
          </GlassCard>

          <GlassCard level="default" variant="brand" style={styles.ctaCard}>
            <Text style={styles.ctaKicker}>Next step</Text>
            <Text style={styles.ctaTitle}>Turn this into a trip</Text>
            <Text style={styles.ctaText}>
              Once the match looks right, build the rest around it and keep everything together.
            </Text>

            <Button
              label="Plan trip from this match"
              tone="gold"
              onPress={buildTrip}
              glow
            />
          </GlassCard>

          {loading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>Loading match details…</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 14,
  },

  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
  },

  heroGlow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: -12,
    height: 68,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.10)",
  },

  heroInner: {
    padding: 16,
    gap: 14,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  heroKicker: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.75,
    textTransform: "uppercase",
  },

  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  teamCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },

  vsCol: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  vsText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  teamLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  heroInfo: {
    alignItems: "center",
    gap: 4,
  },

  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  heroMeta: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
  },

  heroSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
  },

  heroActions: {
    gap: 10,
  },

  crest: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 58,
    height: 58,
    opacity: 0.98,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
  },

  sectionCard: {
    padding: 16,
    borderRadius: 24,
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitleWrap: {
    flex: 1,
    gap: 4,
  },

  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  ticketList: {
    gap: 10,
  },

  ticketCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 6,
  },

  ticketBest: {
    borderColor: "rgba(87,162,56,0.25)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  ticketPrice: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
  },

  ticketMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.medium,
  },

  ticketProvider: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.medium,
  },

  ticketCTA: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  emptyBox: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 6,
  },

  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  quickInfo: {
    gap: 10,
  },

  quickLine: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  providerBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  providerBadgeWrapLabeled: {
    maxWidth: 180,
  },

  providerBadgeCircle: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  providerBadgeCircleText: {
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  providerBadgeLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  ctaCard: {
    padding: 16,
    borderRadius: 24,
    gap: 12,
  },

  ctaKicker: {
    color: "#8EF2A5",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  ctaTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: theme.fontWeight.black,
  },

  ctaText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.medium,
  },

  loadingWrap: {
    paddingTop: 2,
  },

  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
    paddingTop: 8,
  },
});
