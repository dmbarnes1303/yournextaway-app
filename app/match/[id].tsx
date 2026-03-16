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

import { getAllStadiums, getStadiumByTeamFromRegistry } from "@/src/data/stadiumRegistry";
import type { StadiumRecord } from "@/src/data/stadiums/types";
import { normalizeTeamKey } from "@/src/data/teams";
import type { PartnerId } from "@/src/core/partners";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function isoDateOnlyFromKickoffIso(kickoffIso?: string | null): string | null {
  const raw = clean(kickoffIso);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatKickoffLocal(kickoffIso?: string | null): string {
  const raw = clean(kickoffIso);
  if (!raw) return "Kickoff time TBC";

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "Kickoff time TBC";

  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} • ${time}`;
}

function initials(name: string) {
  const value = clean(name);
  if (!value) return "—";
  const parts = value.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Crest({
  name,
  uri,
  size = "md",
  emphasize = false,
}: {
  name: string;
  uri?: string | null;
  size?: "sm" | "md" | "lg";
  emphasize?: boolean;
}) {
  const dimensions =
    size === "lg"
      ? { outer: 84, inner: 58, radius: 24 }
      : size === "sm"
      ? { outer: 52, inner: 34, radius: 16 }
      : { outer: 64, inner: 44, radius: 20 };

  return (
    <View
      style={[
        styles.crestWrap,
        {
          width: dimensions.outer,
          height: dimensions.outer,
          borderRadius: dimensions.radius,
        },
        emphasize && styles.crestWrapPrimary,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dimensions.inner, height: dimensions.inner, opacity: 0.97 }}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
    </View>
  );
}

function stripDiacritics(input: string): string {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

function normalizeValue(input: string): string {
  return stripDiacritics(clean(input))
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const VENUE_ALIASES: Record<string, string[]> = {
  "estadio-do-sport-lisboa-e-benfica": ["estadio-da-luz"],
  "estadio-do-fc-porto": ["estadio-do-dragao"],
  "estadio-jose-alvalade-xxi": ["estadio-jose-alvalade"],
  "allianz-arena-munchen": ["allianz-arena"],
  "signal-iduna-park-dortmund": ["signal-iduna-park"],
  "parc-des-princes-paris": ["parc-des-princes"],
  "stade-velodrome-marseille": ["velodrome"],
  "san-siro": ["giuseppe-meazza", "san-siro"],
};

function resolveStadiumFromVenueOrTeam(args: {
  venueName?: string | null;
  homeTeamName?: string | null;
}): StadiumRecord | null {
  const rawVenue = clean(args.venueName);
  const rawHome = clean(args.homeTeamName);

  const all = getAllStadiums();
  const venueKey = normalizeValue(rawVenue);
  const homeTeamKey = normalizeTeamKey(rawHome);

  if (rawVenue) {
    const exactKeyHit = all.find((s) => normalizeValue(s.stadiumKey) === venueKey) ?? null;
    if (exactKeyHit) return exactKeyHit;

    const exactNameHit = all.find((s) => normalizeValue(s.name) === venueKey) ?? null;
    if (exactNameHit) return exactNameHit;

    const aliases = VENUE_ALIASES[venueKey] ?? [];
    if (aliases.length > 0) {
      const aliasHit =
        all.find((s) =>
          aliases.some((alias) => normalizeValue(s.stadiumKey) === normalizeValue(alias))
        ) ?? null;
      if (aliasHit) return aliasHit;
    }
  }

  if (rawHome) {
    const teamHit = getStadiumByTeamFromRegistry(homeTeamKey);
    if (teamHit) return teamHit;
  }

  return null;
}

function mapTicketProviderToPartnerId(provider?: string | null): PartnerId {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") return "footballticketsnet" as PartnerId;
  if (raw === "gigsberg") return "gigsberg" as PartnerId;
  return "sportsevents365" as PartnerId;
}

function providerLabel(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();
  if (raw === "footballticketsnet") return "FootballTicketNet";
  if (raw === "sportsevents365") return "SportsEvents365";
  if (raw === "gigsberg") return "Gigsberg";
  return provider || "Provider";
}

function providerShort(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();
  if (raw === "footballticketsnet") return "FTN";
  if (raw === "sportsevents365") return "365";
  if (raw === "gigsberg") return "G";
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

  return {
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.06)",
    textColor: theme.colors.textPrimary,
  };
}

function confidenceLabel(score?: number | null): string {
  const value = typeof score === "number" ? score : 0;
  if (value >= 90) return "High confidence";
  if (value >= 75) return "Strong match";
  if (value >= 60) return "Good match";
  return "Fallback";
}

function optionReasonLabel(reason?: TicketResolutionOption["reason"] | string | null) {
  if (reason === "exact_event") return "Direct match";
  if (reason === "partial_match") return "Close match";
  return "Search result";
}

function dedupeOptions(result: TicketResolutionResult | null): TicketResolutionOption[] {
  if (!result) return [];

  const input = Array.isArray(result.options) ? result.options : [];
  const cleaned = input.filter((x) => clean(x?.provider) && clean(x?.url) && clean(x?.title));

  const map = new Map<string, TicketResolutionOption>();
  for (const option of cleaned) {
    const key = `${clean(option.provider).toLowerCase()}|${clean(option.url)}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        provider: clean(option.provider),
        exact: Boolean(option.exact),
        score: typeof option.score === "number" ? option.score : 0,
        url: clean(option.url),
        title: clean(option.title),
        priceText: clean(option.priceText) || null,
        reason:
          option.reason === "exact_event" || option.reason === "partial_match"
            ? option.reason
            : "search_fallback",
      });
      continue;
    }

    const nextScore = typeof option.score === "number" ? option.score : 0;
    const existingScore = typeof existing.score === "number" ? existing.score : 0;

    if (Boolean(option.exact) && !existing.exact) {
      map.set(key, {
        provider: clean(option.provider),
        exact: true,
        score: nextScore,
        url: clean(option.url),
        title: clean(option.title),
        priceText: clean(option.priceText) || null,
        reason:
          option.reason === "exact_event" || option.reason === "partial_match"
            ? option.reason
            : "search_fallback",
      });
      continue;
    }

    if (nextScore > existingScore) {
      map.set(key, {
        provider: clean(option.provider),
        exact: Boolean(option.exact),
        score: nextScore,
        url: clean(option.url),
        title: clean(option.title),
        priceText: clean(option.priceText) || null,
        reason:
          option.reason === "exact_event" || option.reason === "partial_match"
            ? option.reason
            : "search_fallback",
      });
    }
  }

  const values = Array.from(map.values()).sort((a, b) => {
    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;
    if (b.score !== a.score) return b.score - a.score;

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return providerLabel(a.provider).localeCompare(providerLabel(b.provider));
  });

  if (values.length > 0) return values;

  if (result.ok && clean(result.url) && clean(result.provider) && clean(result.title)) {
    return [
      {
        provider: clean(result.provider),
        exact: Boolean(result.exact),
        score: typeof result.score === "number" ? result.score : 0,
        url: clean(result.url),
        title: clean(result.title),
        priceText: clean(result.priceText) || null,
        reason:
          result.reason === "exact_event"
            ? "exact_event"
            : result.reason === "partial_match"
            ? "partial_match"
            : "search_fallback",
      },
    ];
  }

  return [];
}

function openFailureMessage(result: TicketResolutionResult | null): string {
  if (!result) return "Ticket options could not be loaded.";

  const providers = Array.isArray(result.checkedProviders)
    ? result.checkedProviders.filter(Boolean).join(", ")
    : "";

  if ((result as any).error === "network_error") {
    return "Couldn’t reach the ticket service.";
  }

  if ((result as any).error === "invalid_backend_json") {
    return "Ticket service returned invalid data.";
  }

  if ((result as any).error && String((result as any).error).startsWith("http_")) {
    return providers
      ? `No suitable ticket option found. Checked: ${providers}.`
      : "No suitable ticket option found.";
  }

  return providers
    ? `No suitable ticket option found. Checked: ${providers}.`
    : "No suitable ticket option found.";
}

function isBestOption(index: number) {
  return index === 0;
}

function ProviderBadge({
  provider,
  size = "md",
  showLabel = false,
}: {
  provider?: string | null;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const badge = providerBadgeStyle(provider);
  const short = providerShort(provider);
  const label = providerLabel(provider);

  const circleSize = size === "sm" ? 24 : 30;
  const fontSize = size === "sm" ? 11 : 12;

  return (
    <View style={[styles.providerBadgeWrap, showLabel && styles.providerBadgeWrapLabeled]}>
      <View
        style={[
          styles.providerBadgeCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderColor: badge.borderColor,
            backgroundColor: badge.backgroundColor,
          },
        ]}
      >
        <Text style={[styles.providerBadgeCircleText, { color: badge.textColor, fontSize }]}>
          {short}
        </Text>
      </View>

      {showLabel ? <Text style={styles.providerBadgeLabel}>{label}</Text> : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export default function MatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fixtureId = clean((params as any)?.id);
  const tripId = clean((params as any)?.tripId);

  const { fixture, loading } = useFixture(fixtureId);

  const trip = useTripsStore(
    useCallback(
      (s) => (tripId ? s.trips.find((t) => t.id === tripId) ?? null : null),
      [tripId]
    )
  );

  const [openingTickets, setOpeningTickets] = useState(false);
  const [ticketResult, setTicketResult] = useState<TicketResolutionResult | null>(null);
  const [activeProviderUrl, setActiveProviderUrl] = useState<string | null>(null);

  const homeName = useMemo(
    () => clean((trip as any)?.homeName ?? (fixture as any)?.teams?.home?.name),
    [trip, fixture]
  );

  const awayName = useMemo(
    () => clean((trip as any)?.awayName ?? (fixture as any)?.teams?.away?.name),
    [trip, fixture]
  );

  const title = useMemo(() => {
    if (homeName && awayName) return `${homeName} vs ${awayName}`;
    return "Match";
  }, [homeName, awayName]);

  const kickoffIso = useMemo(() => {
    const value = clean((trip as any)?.kickoffIso ?? (fixture as any)?.fixture?.date);
    return value || null;
  }, [trip, fixture]);

  const kickoffText = useMemo(
    () => (kickoffIso ? formatKickoffLocal(kickoffIso) : "Kickoff time TBC"),
    [kickoffIso]
  );

  const venueName = useMemo(
    () => clean((trip as any)?.venueName ?? (fixture as any)?.fixture?.venue?.name),
    [trip, fixture]
  );

  const venueCity = useMemo(
    () => clean((trip as any)?.venueCity ?? (fixture as any)?.fixture?.venue?.city),
    [trip, fixture]
  );

  const venueText = useMemo(() => {
    if (!venueName && !venueCity) return "Venue TBC";
    return [venueName, venueCity].filter(Boolean).join(" • ");
  }, [venueName, venueCity]);

  const resolvedStadium = useMemo(
    () =>
      resolveStadiumFromVenueOrTeam({
        venueName,
        homeTeamName: homeName,
      }),
    [venueName, homeName]
  );

  const crestHome = useMemo(() => {
    const id = (trip as any)?.homeTeamId;
    if (typeof id === "number" && id > 0) {
      return `https://media.api-sports.io/football/teams/${id}.png`;
    }
    return (fixture as any)?.teams?.home?.logo ?? null;
  }, [trip, fixture]);

  const crestAway = useMemo(() => {
    const id = (trip as any)?.awayTeamId;
    if (typeof id === "number" && id > 0) {
      return `https://media.api-sports.io/football/teams/${id}.png`;
    }
    return (fixture as any)?.teams?.away?.logo ?? null;
  }, [trip, fixture]);

  const leagueId =
    (typeof (trip as any)?.leagueId === "number" ? (trip as any).leagueId : undefined) ??
    (typeof (fixture as any)?.league?.id === "number" ? (fixture as any).league.id : undefined);

  const leagueName = useMemo(
    () => clean((trip as any)?.leagueName ?? (fixture as any)?.league?.name) || null,
    [trip, fixture]
  );

  const leagueSeason =
    (typeof (fixture as any)?.league?.season === "number"
      ? (fixture as any).league.season
      : undefined) ??
    undefined;

  const dateIso = useMemo(() => {
    return (
      clean((trip as any)?.startDate) ||
      isoDateOnlyFromKickoffIso((trip as any)?.kickoffIso) ||
      isoDateOnlyFromKickoffIso((fixture as any)?.fixture?.date) ||
      null
    );
  }, [trip, fixture]);

  const kickoffConfirmed = useMemo(() => {
    if (!kickoffIso) return false;
    if ((trip as any)?.kickoffTbc) return false;
    return true;
  }, [kickoffIso, trip]);

  const airportLine = useMemo(() => {
    if (!resolvedStadium?.airport) return null;
    if (typeof resolvedStadium.distanceFromAirportKm === "number") {
      return `${resolvedStadium.airport} • ${resolvedStadium.distanceFromAirportKm} km`;
    }
    return resolvedStadium.airport;
  }, [resolvedStadium]);

  const transitItems = useMemo(() => resolvedStadium?.transit ?? [], [resolvedStadium]);
  const stayItems = useMemo(() => resolvedStadium?.stayAreas ?? [], [resolvedStadium]);
  const tipItems = useMemo(() => resolvedStadium?.tips ?? [], [resolvedStadium]);

  const ticketOptions = useMemo(() => dedupeOptions(ticketResult), [ticketResult]);
  const bestOption = ticketOptions[0] ?? null;
  const checkedProviders = useMemo(
    () =>
      Array.isArray(ticketResult?.checkedProviders)
        ? ticketResult!.checkedProviders!.map((x) => clean(x)).filter(Boolean)
        : [],
    [ticketResult]
  );

  const goBack = useCallback(() => {
    if (tripId) {
      router.push({ pathname: "/trip/[id]", params: { id: tripId } } as any);
      return;
    }
    router.back();
  }, [router, tripId]);

  const goBuildTrip = useCallback(() => {
    if (!fixtureId) return;

    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        ...(leagueId ? { leagueId: String(leagueId) } : {}),
        ...(leagueSeason ? { season: String(leagueSeason) } : {}),
      },
    } as any);
  }, [router, fixtureId, leagueId, leagueSeason]);

  const openDirections = useCallback(async () => {
    const q = encodeURIComponent([venueName, venueCity].filter(Boolean).join(" ") || venueText);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;

    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open maps");
    }
  }, [venueName, venueCity, venueText]);

  async function openTicketOption(option: TicketResolutionOption) {
    const url = clean(option.url);
    if (!url) {
      Alert.alert("Couldn’t open tickets");
      return;
    }

    setActiveProviderUrl(url);

    try {
      if (tripId) {
        await beginPartnerClick({
          tripId,
          partnerId: mapTicketProviderToPartnerId(option.provider),
          url,
          savedItemType: "tickets",
          title: clean(option.title) || `Tickets: ${homeName} vs ${awayName}`,
          metadata: {
            fixtureId,
            leagueId,
            leagueName,
            dateIso,
            kickoffIso,
            homeName,
            awayName,
            priceMode: "live",
            ticketProvider: clean(option.provider) || null,
            resolvedPriceText: clean(option.priceText) || null,
            resolutionReason: option.reason ?? null,
            exactMatch: Boolean(option.exact),
            score: option.score,
            checkedProviders: checkedProviders.length > 0 ? checkedProviders : undefined,
            optionCount: ticketOptions.length,
          },
        });
      } else {
        await openUntrackedUrl(url);
      }
    } catch {
      Alert.alert("Couldn’t open tickets");
    } finally {
      setActiveProviderUrl(null);
    }
  }

  async function openTickets() {
    if (openingTickets) return;

    if (!homeName || !awayName || !kickoffIso) {
      Alert.alert(
        "Tickets not ready",
        "This match is missing some key details. Try again once it has fully loaded."
      );
      return;
    }

    setOpeningTickets(true);

    try {
      const resolved = await resolveTicketForFixture({
        fixtureId,
        homeName,
        awayName,
        kickoffIso,
        leagueName: leagueName ?? undefined,
        leagueId,
      });

      setTicketResult(resolved);

      const options = dedupeOptions(resolved);

      if (!resolved?.ok || options.length === 0) {
        Alert.alert("No ticket options found", openFailureMessage(resolved));
        return;
      }

      if (options.length === 1) {
        await openTicketOption(options[0]);
        return;
      }
    } catch {
      Alert.alert("Couldn’t load ticket options");
    } finally {
      setOpeningTickets(false);
    }
  }

  const openOfficialClub = useCallback(async () => {
    const q = encodeURIComponent(`${homeName} official tickets ${homeName} vs ${awayName}`);
    const url = `https://www.google.com/search?q=${q}`;

    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open official club page");
    }
  }, [homeName, awayName]);

  if (!fixtureId) {
    return (
      <Background
        imageSource={
          typeof getBackground("match") === "string" ? undefined : (getBackground("match") as any)
        }
        imageUrl={
          typeof getBackground("match") === "string" ? (getBackground("match") as string) : null
        }
      >
        <SafeAreaView style={styles.safe}>
          <EmptyState
            title="Match not found"
            message="Missing fixture ID."
            primaryAction={{ label: "Go back", onPress: () => router.back() }}
          />
        </SafeAreaView>
      </Background>
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
            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroKicker}>MATCH</Text>
                {leagueName ? <Chip label={leagueName} variant="default" /> : null}
              </View>

              <View style={styles.teamsRow}>
                <View style={styles.teamCol}>
                  <Crest name={homeName || "Home"} uri={crestHome} size="lg" emphasize />
                  <Text style={styles.teamLabel} numberOfLines={2}>
                    {homeName || "Home"}
                  </Text>
                </View>

                <View style={styles.vsCol}>
                  <Text style={styles.vsText}>vs</Text>
                </View>

                <View style={styles.teamCol}>
                  <Crest name={awayName || "Away"} uri={crestAway} size="lg" />
                  <Text style={styles.teamLabel} numberOfLines={2}>
                    {awayName || "Away"}
                  </Text>
                </View>
              </View>

              <View style={styles.heroInfoBlock}>
                <Text style={styles.heroTitle}>{title}</Text>
                <Text style={styles.metaLine}>{kickoffText}</Text>
                <Text style={styles.metaLineMuted}>{venueText}</Text>
              </View>

              <View style={styles.statusRow}>
                <Chip
                  label={kickoffConfirmed ? "Kickoff confirmed" : "Kickoff time TBC"}
                  variant={kickoffConfirmed ? "primary" : "default"}
                />
                {ticketOptions.length > 0 ? (
                  <Chip
                    label={
                      ticketOptions.length === 1
                        ? "1 ticket option found"
                        : `${ticketOptions.length} ticket options found`
                    }
                    variant="default"
                  />
                ) : null}
              </View>

              <View style={styles.heroActions}>
                <Button
                  label={
                    openingTickets
                      ? "Finding tickets…"
                      : ticketOptions.length > 1
                      ? "Refresh ticket options"
                      : "View ticket options"
                  }
                  tone="primary"
                  loading={openingTickets}
                  onPress={openTickets}
                  glow
                />
                <Button label="Build trip around this match" tone="secondary" onPress={goBuildTrip} />
              </View>

              {!tripId ? (
                <View style={styles.helperBox}>
                  <Text style={styles.helperText}>
                    You can check ticket options now. Build a trip if you want to save bookings and keep everything in Wallet.
                  </Text>
                </View>
              ) : null}
            </View>
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tickets</Text>
            <Text style={styles.sectionSub}>
              See the best available ticket routes for this match, then open the one you want.
            </Text>

            {bestOption ? (
              <View style={styles.bestOptionBox}>
                <View style={styles.bestOptionTopRow}>
                  <View style={styles.bestOptionPriceBlock}>
                    <Text style={styles.bestOptionLabel}>Best option right now</Text>
                    <Text style={styles.bestOptionPrice}>
                      {clean(bestOption.priceText) || "Live price"}
                    </Text>
                  </View>

                  <ProviderBadge provider={bestOption.provider} showLabel />
                </View>

                <Text style={styles.bestOptionSub}>
                  {confidenceLabel(bestOption.score)}
                  {bestOption.exact ? " • Exact event match" : " • Best available result"}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyInfoCard}>
                <Text style={styles.emptyInfoLabel}>No ticket options loaded yet</Text>
                <Text style={styles.emptyInfoText}>
                  Tap “View ticket options” to load live ticket routes for this fixture.
                </Text>
              </View>
            )}

            {checkedProviders.length > 0 ? (
              <View style={styles.providersWrap}>
                {checkedProviders.map((provider) => (
                  <View key={provider} style={styles.providerMiniItem}>
                    <ProviderBadge provider={provider} size="sm" />
                    <Text style={styles.providerMiniLabel}>{providerLabel(provider)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {ticketOptions.length > 0 ? (
              <View style={styles.optionsList}>
                {ticketOptions.map((option, index) => {
                  const isOpening = activeProviderUrl === clean(option.url);

                  return (
                    <Pressable
                      key={`${clean(option.provider)}-${clean(option.url)}-${index}`}
                      style={[styles.optionCard, isBestOption(index) && styles.optionCardBest]}
                      onPress={() => openTicketOption(option)}
                    >
                      <View style={styles.optionTopRow}>
                        <View style={styles.optionPriceHero}>
                          <Text style={styles.optionPrice}>
                            {clean(option.priceText) || "Live price"}
                          </Text>
                          <Text style={styles.optionConfidence}>
                            {confidenceLabel(option.score)}
                            {option.exact ? " • Exact match" : ""}
                          </Text>
                        </View>

                        <View style={styles.optionRightStack}>
                          <ProviderBadge provider={option.provider} showLabel />
                          <View style={styles.optionTagRow}>
                            {isBestOption(index) ? (
                              <View style={styles.bestBadge}>
                                <Text style={styles.bestBadgeText}>Best</Text>
                              </View>
                            ) : null}
                            {option.exact ? (
                              <View style={styles.exactBadge}>
                                <Text style={styles.exactBadgeText}>Exact</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      <Text style={styles.optionReason}>{optionReasonLabel(option.reason)}</Text>

                      <View style={styles.optionActionRow}>
                        <Text style={styles.optionActionText}>
                          {isOpening ? "Opening…" : "Open ticket option"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.actions}>
              <Button
                label="Official club website"
                tone="secondary"
                onPress={openOfficialClub}
              />
            </View>
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Stadium & local info</Text>
            <Text style={styles.sectionSub}>
              Useful basics for getting there and choosing where to stay.
            </Text>

            <View style={styles.primaryActionWrap}>
              <Button label="Directions to stadium" tone="secondary" onPress={openDirections} />
            </View>

            {resolvedStadium ? (
              <View style={styles.infoGrid}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoBlockLabel}>Nearest airport</Text>
                  <Text style={styles.infoBlockText}>
                    {airportLine ?? "Airport detail not added yet"}
                  </Text>
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.infoBlockLabel}>Getting there</Text>
                  {transitItems.length > 0 ? (
                    transitItems.map((item, index) => {
                      const suffix =
                        typeof item.minutes === "number" ? ` • ${item.minutes} min walk` : "";
                      const note = item.note ? ` • ${item.note}` : "";
                      return (
                        <Text key={`${item.label}-${index}`} style={styles.infoBlockText}>
                          {item.label}
                          {suffix}
                          {note}
                        </Text>
                      );
                    })
                  ) : (
                    <Text style={styles.infoBlockText}>Transport guidance not added yet.</Text>
                  )}
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.infoBlockLabel}>Best areas to stay</Text>
                  {stayItems.length > 0 ? (
                    stayItems.map((item, index) => (
                      <Text key={`${item.area}-${index}`} style={styles.infoBlockText}>
                        {item.area} — {item.why}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.infoBlockText}>Stay-area guidance not added yet.</Text>
                  )}
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.infoBlockLabel}>Matchday tips</Text>
                  {tipItems.length > 0 ? (
                    tipItems.map((tip, index) => (
                      <Text key={`tip-${index}`} style={styles.infoBlockText}>
                        {tip}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.infoBlockText}>Matchday tips not added yet.</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.emptyInfoCard}>
                <Text style={styles.emptyInfoLabel}>Venue guide not mapped yet</Text>
                <Text style={styles.emptyInfoText}>
                  Directions still work, but airport, transport and stay-area guidance have not been added for this stadium yet.
                </Text>
              </View>
            )}
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Build around this match</Text>
            <Text style={styles.sectionSub}>
              Save this fixture into a trip workspace and then sort tickets, travel, hotel and everything else around it.
            </Text>

            <View style={styles.nextStepsList}>
              <View style={styles.nextStepRow}>
                <Text style={styles.nextStepNumber}>1</Text>
                <Text style={styles.nextStepText}>Choose your ticket route</Text>
              </View>
              <View style={styles.nextStepRow}>
                <Text style={styles.nextStepNumber}>2</Text>
                <Text style={styles.nextStepText}>Save the match into a trip</Text>
              </View>
              <View style={styles.nextStepRow}>
                <Text style={styles.nextStepNumber}>3</Text>
                <Text style={styles.nextStepText}>
                  Add flights, hotel and extras in the trip workspace
                </Text>
              </View>
            </View>

            <View style={styles.primaryActionWrap}>
              <Button label="Build trip around this match" tone="primary" onPress={goBuildTrip} glow />
            </View>
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
    gap: 12,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 12,
  },

  heroCard: {
    borderRadius: theme.borderRadius.sheet,
  },

  heroInner: {
    padding: 14,
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
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.7,
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
    fontSize: 16,
    fontWeight: theme.fontWeight.black,
  },

  teamLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  heroInfoBlock: {
    alignItems: "center",
    gap: 4,
  },

  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },

  heroActions: {
    gap: 10,
  },

  helperBox: {
    padding: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  helperText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.medium,
  },

  metaLine: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
  },

  metaLineMuted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
  },

  crestWrap: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestWrapPrimary: {
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
  },

  sectionCard: {
    padding: 14,
    borderRadius: theme.borderRadius.sheet,
  },

  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  sectionSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  primaryActionWrap: {
    marginTop: 12,
  },

  providersWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  providerMiniItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  providerMiniLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
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

  bestOptionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.2)",
    backgroundColor: "rgba(87,162,56,0.08)",
    gap: 6,
  },

  bestOptionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  bestOptionPriceBlock: {
    flex: 1,
    gap: 2,
  },

  bestOptionLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
  },

  bestOptionPrice: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
  },

  bestOptionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.medium,
  },

  optionsList: {
    marginTop: 10,
    gap: 10,
  },

  optionCard: {
    padding: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 8,
  },

  optionCardBest: {
    borderColor: "rgba(87,162,56,0.25)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  optionTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  optionPriceHero: {
    flex: 1,
    minWidth: 0,
  },

  optionRightStack: {
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "45%",
  },

  optionTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },

  optionConfidence: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.medium,
  },

  optionPrice: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
  },

  optionReason: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.medium,
  },

  optionActionRow: {
    marginTop: 2,
  },

  optionActionText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  bestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(87,162,56,0.18)",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.3)",
  },

  bestBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  exactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(120,170,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(120,170,255,0.28)",
  },

  exactBadgeText: {
    color: "rgba(190,215,255,1)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  actions: {
    marginTop: 10,
    gap: 10,
  },

  infoGrid: {
    marginTop: 12,
    gap: 10,
  },

  infoBlock: {
    padding: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 5,
  },

  infoBlockLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  infoBlockText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  emptyInfoCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 6,
  },

  emptyInfoLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  emptyInfoText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  nextStepsList: {
    marginTop: 12,
    gap: 10,
  },

  nextStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  nextStepNumber: {
    width: 22,
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  nextStepText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
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
