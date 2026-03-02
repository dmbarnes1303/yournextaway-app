// app/match/[id].tsx
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const date = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Crest({ name, uri }: { name: string; uri?: string | null }) {
  return (
    <View style={styles.crestWrap}>
      {uri ? (
        <Image source={{ uri }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
    </View>
  );
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
    useCallback((s) => (tripId ? s.trips.find((t) => t.id === tripId) ?? null : null), [tripId])
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

  const kickoffText = useMemo(() => (kickoffIso ? formatKickoffLocal(kickoffIso) : "Kickoff TBC"), [kickoffIso]);

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

  const crestHome = useMemo(() => {
    const id = (trip as any)?.homeTeamId;
    if (typeof id === "number" && id > 0) return `https://media.api-sports.io/football/teams/${id}.png`;
    return (fixture as any)?.teams?.home?.logo ?? null;
  }, [trip, fixture]);

  const crestAway = useMemo(() => {
    const id = (trip as any)?.awayTeamId;
    if (typeof id === "number" && id > 0) return `https://media.api-sports.io/football/teams/${id}.png`;
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
    // Honest: if we don't have a kickoff timestamp, it’s TBC.
    if (!kickoffIso) return "tbc" as const;
    if ((trip as any)?.kickoffTbc) return "tbc" as const;
    return "confirmed" as const;
  }, [kickoffIso, trip]);

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
      Alert.alert("Open from a trip", "Open this match from a Trip Workspace so ticket clicks can be saved into Wallet.");
      return;
    }

    if (!homeName || !awayName || !kickoffIso) {
      Alert.alert("Tickets not ready", "Missing match details (teams/kickoff). Try again after the match loads.");
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
        se365EventId: typeof (trip as any)?.sportsevents365EventId === "number" ? (trip as any).sportsevents365EventId : undefined,
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
      <Background imageSource={typeof getBackground("match") === "string" ? undefined : (getBackground("match") as any)} imageUrl={typeof getBackground("match") === "string" ? (getBackground("match") as string) : null}>
        <SafeAreaView style={styles.safe}>
          <EmptyState title="Match not found" subtitle="Missing fixture ID." actionText="Go back" onAction={() => router.back()} />
        </SafeAreaView>
      </Background>
    );
  }

  const bg = getBackground("match");
  const imageUrl = typeof bg === "string" ? bg : null;
  const imageSource = typeof bg === "string" ? null : (bg as any);

  return (
    <Background imageUrl={imageUrl} imageSource={imageSource} overlayOpacity={0.10}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Button label="Back" tone="secondary" size="sm" onPress={goBack} />
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero card */}
          <GlassCard level="default" variant="matte" style={styles.heroCard} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.heroKicker}>MATCH</Text>

              <View style={styles.heroTopRow}>
                <Crest name={homeName || "Home"} uri={crestHome} />

                <View style={styles.heroCenter}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {title}
                  </Text>

                  <View style={styles.heroMetaRow}>
                    <FixtureCertaintyBadge state={certaintyState} variant="compact" />
                    {leagueName ? <Chip label={leagueName} variant="default" /> : null}
                  </View>
                </View>

                <Crest name={awayName || "Away"} uri={crestAway} />
              </View>

              <View style={styles.heroMetaBlock}>
                <Text style={styles.metaLine}>{kickoffText}</Text>
                <Text style={styles.metaLineMuted}>{venueText}</Text>
              </View>

              <View style={styles.heroHints}>
                <Chip label="Tickets: live price" variant="primary" />
                <Chip label="Hotels: live price" variant="default" />
                <Chip label="Travel: friction soon" variant="default" />
              </View>
            </View>
          </GlassCard>

          {/* Tickets */}
          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tickets</Text>
            <Text style={styles.sectionSub}>
              Use the partner flow so clicks can be tracked and saved (Pending → Booked → Wallet).
            </Text>

            <View style={styles.actions}>
              <Button
                label={openingTickets ? "Opening…" : "Open tickets"}
                tone="primary"
                loading={openingTickets}
                onPress={openTickets}
                glow
              />
              <Button label="Official club (search)" tone="secondary" onPress={openOfficialClub} />
              <Button label="Google tickets search" tone="secondary" onPress={openGoogleTicketsSearch} />
            </View>
          </GlassCard>

          {/* Logistics */}
          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Logistics</Text>
            <Text style={styles.sectionSub}>
              Keep it simple and useful: venue directions now; transport/areas/distances come in the Trip Workspace later.
            </Text>

            <View style={styles.actions}>
              <Button label="Directions to stadium" tone="secondary" onPress={openDirections} />
            </View>

            <View style={styles.miniInfo}>
              <Text style={styles.miniInfoLabel}>What we’ll add next</Text>
              <Text style={styles.miniInfoText}>
                Stadium distance to hotel areas, travel time to airport/station, “easy/awkward” late transport, and a
                quick “safe-to-book” signal based on kickoff certainty.
              </Text>
            </View>
          </GlassCard>

          {/* Loading hint */}
          {loading ? (
            <View style={{ paddingTop: 2 }}>
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
    gap: 12,
  },

  heroKicker: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  heroCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 10,
  },

  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
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
    paddingTop: 2,
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

  heroHints: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    paddingTop: 2,
  },

  crestWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: { width: 40, height: 40, opacity: 0.96 },

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

  actions: {
    marginTop: 12,
    gap: 10,
  },

  miniInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  miniInfoLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  miniInfoText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
    paddingTop: 8,
  },
});
