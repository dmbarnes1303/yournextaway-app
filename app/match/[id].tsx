// app/match/[id].tsx
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";
import Button from "@/src/components/Button";
import Chip from "@/src/components/Chip";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { useFixture } from "@/src/hooks/useFixtures";
import { useTripsStore } from "@/src/state/trips";

import { buildTicketLink } from "@/src/services/partnerLinks";
import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";

import { getAllStadiums, getStadiumByTeamFromRegistry } from "@/src/data/stadiumRegistry";
import type { StadiumRecord } from "@/src/data/stadiums/types";
import { normalizeTeamKey } from "@/src/data/teams";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isoDateOnlyFromKickoffIso(kickoffIso?: string | null): string | null {
  const raw = String(kickoffIso ?? "").trim();
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
  const raw = String(kickoffIso ?? "").trim();
  if (!raw) return "TBC";

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "TBC";

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
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
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
  return stripDiacritics(String(input ?? ""))
    .trim()
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
  const rawVenue = String(args.venueName ?? "").trim();
  const rawHome = String(args.homeTeamName ?? "").trim();

  const all = getAllStadiums();
  const venueKey = normalizeValue(rawVenue);
  const homeTeamKey = normalizeTeamKey(rawHome);

  if (rawVenue) {
    const exactKeyHit =
      all.find((s) => normalizeValue(s.stadiumKey) === venueKey) ?? null;
    if (exactKeyHit) return exactKeyHit;

    const exactNameHit =
      all.find((s) => normalizeValue(s.name) === venueKey) ?? null;
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

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export default function MatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fixtureId = String((params as any)?.id ?? "").trim();
  const tripId = String((params as any)?.tripId ?? "").trim();

  const { fixture, loading } = useFixture(fixtureId);

  const trip = useTripsStore(
    useCallback(
      (s) => (tripId ? s.trips.find((t) => t.id === tripId) ?? null : null),
      [tripId]
    )
  );

  const [openingTickets, setOpeningTickets] = useState(false);

  const homeName = useMemo(
    () => String((trip as any)?.homeName ?? (fixture as any)?.teams?.home?.name ?? "").trim(),
    [trip, fixture]
  );

  const awayName = useMemo(
    () => String((trip as any)?.awayName ?? (fixture as any)?.teams?.away?.name ?? "").trim(),
    [trip, fixture]
  );

  const title = useMemo(() => {
    if (homeName && awayName) return `${homeName} vs ${awayName}`;
    return "Match";
  }, [homeName, awayName]);

  const kickoffIso = useMemo(() => {
    const k = String((trip as any)?.kickoffIso ?? (fixture as any)?.fixture?.date ?? "").trim();
    return k || null;
  }, [trip, fixture]);

  const kickoffText = useMemo(
    () => (kickoffIso ? formatKickoffLocal(kickoffIso) : "Kickoff TBC"),
    [kickoffIso]
  );

  const venueName = useMemo(
    () => String((trip as any)?.venueName ?? (fixture as any)?.fixture?.venue?.name ?? "").trim(),
    [trip, fixture]
  );

  const venueCity = useMemo(
    () => String((trip as any)?.venueCity ?? (fixture as any)?.fixture?.venue?.city ?? "").trim(),
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
    () => String((trip as any)?.leagueName ?? (fixture as any)?.league?.name ?? "").trim() || null,
    [trip, fixture]
  );

  const dateIso = useMemo(() => {
    return (
      String((trip as any)?.startDate ?? "").trim() ||
      isoDateOnlyFromKickoffIso((trip as any)?.kickoffIso) ||
      isoDateOnlyFromKickoffIso((fixture as any)?.fixture?.date) ||
      null
    );
  }, [trip, fixture]);

  const certaintyState = useMemo(() => {
    if (!kickoffIso) return "tbc" as const;
    if ((trip as any)?.kickoffTbc) return "tbc" as const;
    return "confirmed" as const;
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

  const homeSupportNote = useMemo(() => {
    if (!homeName) return "Plan the match around the host city and home club.";
    return `This trip is built around ${homeName} at home — host city, host stadium, home-side planning.`;
  }, [homeName]);

  const goBack = useCallback(() => {
    if (tripId) {
      router.push({ pathname: "/trip/[id]", params: { id: tripId } } as any);
      return;
    }
    router.back();
  }, [router, tripId]);

  const openDirections = useCallback(async () => {
    const q = encodeURIComponent([venueName, venueCity].filter(Boolean).join(" ") || venueText);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open maps");
    }
  }, [venueName, venueCity, venueText]);

  async function openTickets() {
    if (openingTickets) return;

    if (!tripId) {
      Alert.alert(
        "Open from a trip",
        "Open this match from a Trip Workspace so ticket clicks can be saved into Wallet."
      );
      return;
    }

    if (!homeName || !awayName || !kickoffIso) {
      Alert.alert(
        "Tickets not ready",
        "Missing match details (teams/kickoff). Try again after the match loads."
      );
      return;
    }

    setOpeningTickets(true);

    try {
      const url = await buildTicketLink({
        fixtureId,
        home: homeName,
        away: awayName,
        kickoffIso,
        leagueId,
        leagueName,
        se365EventId:
          typeof (trip as any)?.sportsevents365EventId === "number"
            ? (trip as any).sportsevents365EventId
            : undefined,
        se365EventUrl: (fixture as any)?.se365EventUrl ?? null,
      });

      if (!url) {
        Alert.alert("Tickets not found");
        return;
      }

      await beginPartnerClick({
        tripId,
        partnerId: "sportsevents365",
        url,
        savedItemType: "tickets",
        title: `Tickets: ${homeName} vs ${awayName}`,
        metadata: { fixtureId, leagueId, dateIso, kickoffIso, priceMode: "live" },
      });
    } catch {
      Alert.alert("Couldn’t open tickets");
    } finally {
      setOpeningTickets(false);
    }
  }

  const openOfficialClub = useCallback(async () => {
    const q = encodeURIComponent(`${homeName} vs ${awayName} official tickets`);
    const url = `https://www.google.com/search?q=${q}`;
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open link");
    }
  }, [homeName, awayName]);

  const openGoogleTicketsSearch = useCallback(async () => {
    const q = encodeURIComponent(`${homeName} vs ${awayName} tickets`);
    const url = `https://www.google.com/search?q=${q}`;
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open link");
    }
  }, [homeName, awayName]);

  if (!fixtureId) {
    return (
      <Background
        imageSource={typeof getBackground("match") === "string" ? undefined : (getBackground("match") as any)}
        imageUrl={typeof getBackground("match") === "string" ? (getBackground("match") as string) : null}
      >
        <SafeAreaView style={styles.safe}>
          <EmptyState
            title="Match not found"
            subtitle="Missing fixture ID."
            actionText="Go back"
            onAction={() => router.back()}
          />
        </SafeAreaView>
      </Background>
    );
  }

  const bg = getBackground("match");
  const imageUrl = typeof bg === "string" ? bg : null;
  const imageSource = typeof bg === "string" ? null : (bg as any);

  return (
    <Background imageUrl={imageUrl} imageSource={imageSource} overlayOpacity={0.12}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Button label="Back" tone="secondary" size="sm" onPress={goBack} />
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard level="default" variant="matte" style={styles.heroCard} noPadding>
            <View style={styles.heroInner}>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroKicker}>MATCH DAY</Text>
                {leagueName ? <Chip label={leagueName} variant="default" /> : null}
              </View>

              <View style={styles.heroCrestsRow}>
                <View style={styles.homeClubCol}>
                  <Crest name={homeName || "Home"} uri={crestHome} size="lg" emphasize />
                  <Text style={styles.homeClubTag}>Host club</Text>
                </View>

                <View style={styles.heroCenter}>
                  <Text style={styles.heroTitle} numberOfLines={3}>
                    {title}
                  </Text>

                  <View style={styles.heroMetaRow}>
                    <FixtureCertaintyBadge state={certaintyState} variant="compact" />
                    <Chip label="Home-side trip" variant="primary" />
                  </View>
                </View>

                <View style={styles.awayClubCol}>
                  <Crest name={awayName || "Away"} uri={crestAway} size="sm" />
                  <Text style={styles.awayClubTag}>Visitors</Text>
                </View>
              </View>

              <View style={styles.heroMetaBlock}>
                <Text style={styles.metaLine}>{kickoffText}</Text>
                <Text style={styles.metaLineMuted}>{venueText}</Text>
              </View>

              <View style={styles.homeFocusBox}>
                <Text style={styles.homeFocusLabel}>Home focus</Text>
                <Text style={styles.homeFocusText}>{homeSupportNote}</Text>
              </View>

              <View style={styles.heroHints}>
                <Chip label="Tickets: live price" variant="primary" />
                <Chip label="Hotels: live price" variant="default" />
                <Chip
                  label={resolvedStadium ? "Travel: mapped" : "Travel: limited"}
                  variant="default"
                />
              </View>
            </View>
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tickets</Text>
            <Text style={styles.sectionSub}>
              Use the tracked partner flow so the click can move through Pending, Booked and into Wallet.
            </Text>

            <View style={styles.primaryActionWrap}>
              <Button
                label={openingTickets ? "Opening…" : "Open tickets"}
                tone="primary"
                loading={openingTickets}
                onPress={openTickets}
                glow
              />
            </View>

            <View style={styles.actions}>
              <Button label="Official club (search)" tone="secondary" onPress={openOfficialClub} />
              <Button label="Google tickets search" tone="secondary" onPress={openGoogleTicketsSearch} />
            </View>
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Stadium & logistics</Text>
            <Text style={styles.sectionSub}>
              Host-stadium intelligence: airport, transport, stay areas and matchday tips.
            </Text>

            <View style={styles.primaryActionWrap}>
              <Button label="Directions to stadium" tone="secondary" onPress={openDirections} />
            </View>

            {resolvedStadium ? (
              <View style={styles.infoGrid}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoBlockLabel}>Airport</Text>
                  <Text style={styles.infoBlockText}>
                    {airportLine ?? "Airport detail not added yet"}
                  </Text>
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.infoBlockLabel}>Transport</Text>
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
                <Text style={styles.emptyInfoLabel}>Travel intelligence</Text>
                <Text style={styles.emptyInfoText}>
                  This venue is not mapped yet. Directions still work, but airport, transport and stay-area guidance are not available yet.
                </Text>
              </View>
            )}
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Next best action</Text>
            <Text style={styles.sectionSub}>
              Don’t overcomplicate it. Lock the match first, then move into the trip workspace and fill the rest around it.
            </Text>

            <View style={styles.nextStepsList}>
              <View style={styles.nextStepRow}>
                <Text style={styles.nextStepNumber}>1</Text>
                <Text style={styles.nextStepText}>Open tracked tickets</Text>
              </View>
              <View style={styles.nextStepRow}>
                <Text style={styles.nextStepNumber}>2</Text>
                <Text style={styles.nextStepText}>Check stadium logistics</Text>
              </View>
              <View style={styles.nextStepRow}>
                <Text style={styles.nextStepNumber}>3</Text>
                <Text style={styles.nextStepText}>Return to your trip workspace and build around this match</Text>
              </View>
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

  heroLabelRow: {
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

  heroCrestsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  homeClubCol: {
    alignItems: "center",
    gap: 8,
  },

  awayClubCol: {
    alignItems: "center",
    gap: 8,
  },

  homeClubTag: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  awayClubTag: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  heroCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 10,
  },

  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },

  heroMetaBlock: {
    alignItems: "center",
    gap: 4,
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

  homeFocusBox: {
    padding: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
    gap: 4,
  },

  homeFocusLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
  },

  homeFocusText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  heroHints: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
