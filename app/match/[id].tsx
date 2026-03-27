import React, { useMemo, useState } from "react";
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

import { beginPartnerClick } from "@/src/services/partnerClicks";
import {
  resolveTicketForFixture,
  type TicketResolutionOption,
  type TicketResolutionResult,
} from "@/src/services/ticketResolver";

import { getStadiumByTeamFromRegistry } from "@/src/data/stadiumRegistry";
import { normalizeTeamKey } from "@/src/data/teams";
import { normalizeCityKey } from "@/src/utils/city";

import { mapTicketProviderToPartnerId } from "@/src/features/tripDetail/helpers";
import type { PartnerId } from "@/src/core/partners";

type RouteParams = Record<string, string | string[] | undefined>;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function getParam(params: RouteParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return clean(value[0]);
  return clean(value);
}

function formatKickoff(iso?: string | null): string {
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
}

function formatTicketPrice(price?: string | null): string {
  const p = clean(price);
  if (!p) return "View price";
  if (/^[£€$]/.test(p)) return `From ${p}`;
  return p;
}

function fixtureDateOnly(iso?: string | null): string {
  const value = clean(iso);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function inferTripWindowFromKickoff(kickoffIso?: string | null): { from?: string; to?: string } {
  const dateOnly = fixtureDateOnly(kickoffIso);
  if (!dateOnly) return {};

  const start = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const toIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`;

  return {
    from: dateOnly,
    to: toIso,
  };
}

function buildCanonicalTripBuildParams(args: {
  fixtureId: string;
  leagueId?: string;
  season?: string;
  city?: string;
  kickoffIso?: string;
  from?: string;
  to?: string;
}) {
  const fallbackWindow = inferTripWindowFromKickoff(args.kickoffIso);

  return {
    fixtureId: args.fixtureId,
    ...(clean(args.leagueId) ? { leagueId: clean(args.leagueId) } : {}),
    ...(clean(args.season) ? { season: clean(args.season) } : {}),
    ...(clean(args.city) ? { city: clean(args.city) } : {}),
    ...(clean(args.from)
      ? { from: clean(args.from) }
      : fallbackWindow.from
        ? { from: fallbackWindow.from }
        : {}),
    ...(clean(args.to)
      ? { to: clean(args.to) }
      : fallbackWindow.to
        ? { to: fallbackWindow.to }
        : {}),
  };
}

function Crest({ name, uri }: { name: string; uri?: string | null }) {
  return (
    <View style={styles.crest}>
      {uri ? (
        <Image source={{ uri }} style={styles.crestImg} />
      ) : (
        <Text style={styles.crestFallback}>{name.slice(0, 2).toUpperCase()}</Text>
      )}
    </View>
  );
}

function GuideCard({
  title,
  subtitle,
  buttonLabel,
  onPress,
  disabled,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.guideCard, disabled && styles.guideCardDisabled]}>
      <View style={styles.guideCardTextWrap}>
        <Text style={styles.guideCardTitle}>{title}</Text>
        <Text style={styles.guideCardText}>{subtitle}</Text>
      </View>

      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.guideButton, disabled && styles.guideButtonDisabled]}
      >
        <Text style={styles.guideButtonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

function TicketCard({
  option,
  isBest,
  onPress,
  loading,
  locked,
}: {
  option: TicketResolutionOption;
  isBest: boolean;
  onPress: () => void;
  loading: boolean;
  locked: boolean;
}) {
  return (
    <Pressable style={[styles.ticketCard, isBest && styles.ticketBest]} onPress={onPress}>
      <Text style={styles.ticketPrice}>{formatTicketPrice(option.priceText)}</Text>

      <Text style={styles.ticketMeta}>
        {option.exact ? "Exact fixture match" : "Current ticket option"}
      </Text>

      <Text style={styles.ticketProvider}>{option.provider}</Text>

      <Text style={styles.ticketCTA}>
        {loading ? "Opening…" : locked ? "Start trip to open" : "View tickets"}
      </Text>
    </Pressable>
  );
}

export default function MatchScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams() as RouteParams;

  const fixtureId = getParam(rawParams, "id");
  const tripId = getParam(rawParams, "tripId");
  const routeFrom = getParam(rawParams, "from");
  const routeTo = getParam(rawParams, "to");
  const routeLeagueId = getParam(rawParams, "leagueId");
  const routeSeason = getParam(rawParams, "season");

  const { fixture, loading } = useFixture(fixtureId);

  const trip = useTripsStore((s) =>
    tripId ? s.trips.find((t) => t.id === tripId) ?? null : null
  );

  const [ticketResult, setTicketResult] = useState<TicketResolutionResult | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [openingUrl, setOpeningUrl] = useState<string | null>(null);

  const home = clean(trip?.homeName ?? fixture?.teams?.home?.name);
  const away = clean(trip?.awayName ?? fixture?.teams?.away?.name);

  const kickoffIso = clean(trip?.kickoffIso ?? fixture?.fixture?.date);
  const kickoffText = formatKickoff(kickoffIso);

  const venueName = clean(fixture?.fixture?.venue?.name);
  const venueCity = clean(fixture?.fixture?.venue?.city);
  const venueLine = [venueName, venueCity].filter(Boolean).join(" • ");

  const crestHome = fixture?.teams?.home?.logo;
  const crestAway = fixture?.teams?.away?.logo;

  const effectiveLeagueId = clean(trip?.leagueId) || clean(fixture?.league?.id) || routeLeagueId;

  const effectiveSeason =
    routeSeason || clean((fixture?.league as { season?: unknown } | undefined)?.season);

  const stadium = useMemo(() => {
    return home ? getStadiumByTeamFromRegistry(normalizeTeamKey(home)) : null;
  }, [home]);

  const teamGuideKey = useMemo(() => {
    return home ? normalizeTeamKey(home) : "";
  }, [home]);

  const cityGuideKey = useMemo(() => {
    return venueCity ? normalizeCityKey(venueCity) : "";
  }, [venueCity]);

  const tripBuildParams = useMemo(
    () =>
      buildCanonicalTripBuildParams({
        fixtureId,
        leagueId: effectiveLeagueId,
        season: effectiveSeason,
        city: venueCity || trip?.displayCity,
        kickoffIso,
        from: routeFrom,
        to: routeTo,
      }),
    [
      fixtureId,
      effectiveLeagueId,
      effectiveSeason,
      venueCity,
      trip?.displayCity,
      kickoffIso,
      routeFrom,
      routeTo,
    ]
  );

  const options = useMemo(() => (ticketResult?.options ?? []).slice(0, 3), [ticketResult]);

  const ticketsLocked = !clean(tripId);

  async function loadTickets() {
    if (loadingTickets) return;

    if (!fixtureId || !home || !away || !kickoffIso) {
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
        leagueId: effectiveLeagueId || undefined,
        leagueName: clean(trip?.leagueName ?? fixture?.league?.name) || undefined,
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

    if (!tripId) {
      Alert.alert(
        "Start a trip first",
        "To open ticket partners and track bookings in Wallet, start a trip from this match first."
      );
      buildTrip();
      return;
    }

    let partnerId: PartnerId;
    try {
      partnerId = mapTicketProviderToPartnerId(option.provider);
    } catch {
      Alert.alert("Provider unsupported", "This ticket provider is not mapped yet.");
      return;
    }

    setOpeningUrl(option.url);

    try {
      await beginPartnerClick({
        tripId,
        partnerId,
        url: option.url,
        savedItemType: "tickets",
        title: option.title || `Tickets: ${home} vs ${away}`,
        metadata: {
          fixtureId,
          leagueId: effectiveLeagueId || undefined,
          leagueName: clean(trip?.leagueName ?? fixture?.league?.name) || undefined,
          kickoffIso,
          homeName: home || undefined,
          awayName: away || undefined,
          venueName: venueName || undefined,
          venueCity: venueCity || undefined,
          resolvedPriceText: option.priceText ?? null,
          ticketProvider: option.provider ?? null,
          exactMatch: Boolean(option.exact),
          score: option.score,
          sourceSurface: "match_screen",
          sourceSection: "tickets",
        },
      });
    } catch {
      Alert.alert("Couldn’t open", "Try again in a moment.");
    } finally {
      setOpeningUrl(null);
    }
  }

  function goBack() {
    if (tripId) {
      router.push({ pathname: "/trip/[id]", params: { id: tripId } } as never);
      return;
    }
    router.back();
  }

  function buildTrip() {
    router.push({
      pathname: "/trip/build",
      params: tripBuildParams,
    } as never);
  }

  function openTeamGuide() {
    if (!teamGuideKey) {
      Alert.alert("Guide unavailable", "No team guide is available for this match yet.");
      return;
    }

    router.push({
      pathname: "/team/[teamKey]",
      params: {
        teamKey: teamGuideKey,
        from: routeFrom || tripBuildParams.from,
        to: routeTo || tripBuildParams.to,
      },
    } as never);
  }

  function openCityGuide() {
    if (!cityGuideKey) {
      Alert.alert("Guide unavailable", "No city guide is available for this match yet.");
      return;
    }

    router.push({
      pathname: "/city/key/[cityKey]",
      params: {
        cityKey: cityGuideKey,
        from: routeFrom || tripBuildParams.from,
        to: routeTo || tripBuildParams.to,
      },
    } as never);
  }

  if (!fixtureId) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState title="Match not found" />
      </SafeAreaView>
    );
  }

  const bg = getBackground("match");
  const imageUrl = typeof bg === "string" ? bg : null;
  const imageSource = typeof bg === "string" ? null : bg;

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
                {fixture?.league?.name ? <Chip label={fixture.league.name} variant="default" /> : null}
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
                <Text style={styles.heroTitle}>
                  {home && away ? `${home} vs ${away}` : "Match"}
                </Text>
                <Text style={styles.heroMeta}>{kickoffText}</Text>
                {!!venueLine && <Text style={styles.heroSub}>{venueLine}</Text>}
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
                <Text style={styles.sectionSub}>
                  {ticketsLocked
                    ? "Compare current ticket options here. To open a ticket partner and track the booking, start a trip from this match first."
                    : "Compare current ticket options and choose the route that makes most sense."}
                </Text>
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
                    locked={ticketsLocked}
                    onPress={() => openTicket(option)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No ticket options loaded yet</Text>
                <Text style={styles.emptyText}>
                  Tap “Compare tickets” and the best current options will appear here.
                </Text>
              </View>
            )}
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>About this trip</Text>
                <Text style={styles.sectionSub}>
                  A few useful planning links before you commit.
                </Text>
              </View>
            </View>

            <View style={styles.guideList}>
              <GuideCard
                title="Home team guide"
                subtitle={
                  home
                    ? `Matchday feel, stadium context and planning notes for ${home}.`
                    : "Open the home team guide."
                }
                buttonLabel="Open guide"
                onPress={openTeamGuide}
                disabled={!teamGuideKey}
              />

              <GuideCard
                title="City guide"
                subtitle={
                  venueCity
                    ? `Stay areas, getting around and city-break context for ${venueCity}.`
                    : "Open the city guide."
                }
                buttonLabel="Open guide"
                onPress={openCityGuide}
                disabled={!cityGuideKey}
              />
            </View>

            {stadium ? (
              <View style={styles.localInfoWrap}>
                {!!stadium.airport ? (
                  <Text style={styles.localInfoLine}>Airport: {stadium.airport}</Text>
                ) : null}

                {Array.isArray(stadium.transit) && stadium.transit.length > 0 ? (
                  <Text style={styles.localInfoLine}>
                    Getting there: {stadium.transit[0].label}
                    {typeof stadium.transit[0].minutes === "number"
                      ? ` • ${stadium.transit[0].minutes} min`
                      : ""}
                  </Text>
                ) : null}

                {Array.isArray(stadium.stayAreas) && stadium.stayAreas.length > 0 ? (
                  <Text style={styles.localInfoLine}>
                    Best area to stay: {stadium.stayAreas[0].area}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Local basics not available yet</Text>
                <Text style={styles.emptyText}>
                  You can still compare tickets and build the trip from this match.
                </Text>
              </View>
            )}
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

  guideList: {
    gap: 10,
  },

  guideCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 10,
  },

  guideCardDisabled: {
    opacity: 0.65,
  },

  guideCardTextWrap: {
    gap: 4,
  },

  guideCardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  guideCardText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  guideButton: {
    alignSelf: "flex-start",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  guideButtonDisabled: {
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  guideButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  localInfoWrap: {
    gap: 10,
  },

  localInfoLine: {
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
