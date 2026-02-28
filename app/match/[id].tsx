// app/match/[id].tsx

import React, { useCallback, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";

import { useFixture } from "@/src/hooks/useFixtures";
import { useTripsStore } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import { buildTicketLink } from "@/src/services/partnerLinks";
import { beginPartnerClick } from "@/src/services/partnerClicks";

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

  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

async function openExternalUrl(url: string) {
  const clean = String(url ?? "").trim();
  if (!clean) throw new Error("Missing URL");
  await Linking.openURL(clean);
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export default function MatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fixtureId = String(params.id ?? "").trim();
  const tripId = String(params.tripId ?? "").trim();

  const { fixture, loading } = useFixture(fixtureId);

  const trip = useTripsStore(
    useCallback((s) => (tripId ? s.trips.find((t) => t.id === tripId) ?? null : null), [tripId])
  );

  const [openingTickets, setOpeningTickets] = useState(false);

  const title = useMemo(() => {
    const h = trip?.homeName ?? fixture?.teams?.home?.name;
    const a = trip?.awayName ?? fixture?.teams?.away?.name;
    return h && a ? `${h} vs ${a}` : "Match";
  }, [trip?.homeName, trip?.awayName, fixture?.teams?.home?.name, fixture?.teams?.away?.name]);

  const kickoffIso = useMemo(() => {
    const k = String(trip?.kickoffIso ?? fixture?.fixture?.date ?? "").trim();
    return k || null;
  }, [trip?.kickoffIso, fixture?.fixture?.date]);

  const kickoffText = useMemo(() => (kickoffIso ? formatKickoffLocal(kickoffIso) : "Kickoff TBD"), [kickoffIso]);

  const venueText = useMemo(() => {
    const venueName = trip?.venueName ?? fixture?.fixture?.venue?.name;
    const venueCity = trip?.venueCity ?? fixture?.fixture?.venue?.city;
    if (!venueName && !venueCity) return "Venue TBD";
    return [venueName, venueCity].filter(Boolean).join(" • ");
  }, [trip?.venueName, trip?.venueCity, fixture?.fixture?.venue?.name, fixture?.fixture?.venue?.city]);

  const crestHome = trip?.homeTeamId
    ? `https://media.api-sports.io/football/teams/${trip.homeTeamId}.png`
    : fixture?.teams?.home?.logo;

  const crestAway = trip?.awayTeamId
    ? `https://media.api-sports.io/football/teams/${trip.awayTeamId}.png`
    : fixture?.teams?.away?.logo;

  const leagueId =
    (typeof trip?.leagueId === "number" ? trip.leagueId : undefined) ??
    (typeof fixture?.league?.id === "number" ? fixture.league.id : undefined);

  const homeName = String(trip?.homeName ?? fixture?.teams?.home?.name ?? "").trim();
  const awayName = String(trip?.awayName ?? fixture?.teams?.away?.name ?? "").trim();

  const dateIso = useMemo(() => {
    return (
      String(trip?.startDate ?? "").trim() ||
      isoDateOnlyFromKickoffIso(trip?.kickoffIso) ||
      isoDateOnlyFromKickoffIso(fixture?.fixture?.date) ||
      null
    );
  }, [trip?.startDate, trip?.kickoffIso, fixture?.fixture?.date]);

  const goBackToTrip = useCallback(() => {
    if (tripId) {
      router.push({ pathname: "/trip/[id]", params: { id: tripId } } as any);
      return;
    }
    router.back();
  }, [router, tripId]);

  async function openTickets() {
    if (openingTickets) return;

    if (!tripId) {
      Alert.alert("Open this from a trip", "Tickets are tracked when opened from a Trip Workspace.");
      return;
    }

    if (!homeName || !awayName || !kickoffIso) {
      Alert.alert("Tickets not available", "Missing match details (teams/kickoff). Try again after the match loads.");
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
        leagueName: trip?.leagueName ?? fixture?.league?.name,
        se365EventId: typeof trip?.sportsevents365EventId === "number" ? trip.sportsevents365EventId : undefined,
        se365EventUrl: (fixture as any)?.se365EventUrl ?? null,
      });

      if (!url) {
        Alert.alert("Tickets not found");
        return;
      }

      // Use the same tracked pipeline as the rest of the app:
      // - creates Pending saved item
      // - records click
      // - opens partner URL
      await beginPartnerClick({
        tripId,
        partnerId: "sportsevents365",
        url,
        savedItemType: "tickets",
        title: `Tickets: ${homeName} vs ${awayName}`,
        metadata: { fixtureId, leagueId, dateIso, kickoffIso, priceMode: "live" },
      });
    } catch {
      Alert.alert("Couldn't open tickets");
    } finally {
      setOpeningTickets(false);
    }
  }

  const openOfficialClub = useCallback(async () => {
    const q = encodeURIComponent(`${homeName} vs ${awayName} official tickets`);
    const url = `https://www.google.com/search?q=${q}`;

    try {
      if (tripId) {
        await savedItemsStore.add({
          tripId,
          type: "tickets",
          status: "pending",
          title: `Official club tickets: ${homeName} vs ${awayName}`,
          partnerUrl: url,
          priceText: "View live price",
          currency: "GBP",
          metadata: { fixtureId, dateIso, kickoffIso },
        } as any);
      }
    } catch {}

    await openExternalUrl(url);
  }, [homeName, awayName, tripId, fixtureId, dateIso, kickoffIso]);

  const openGoogleTicketsSearch = useCallback(async () => {
    const q = encodeURIComponent(`${homeName} vs ${awayName} tickets`);
    const url = `https://www.google.com/search?q=${q}`;

    try {
      if (tripId) {
        await savedItemsStore.add({
          tripId,
          type: "tickets",
          status: "pending",
          title: `Tickets search: ${homeName} vs ${awayName}`,
          partnerUrl: url,
          priceText: "View live price",
          currency: "GBP",
          metadata: { fixtureId, dateIso, kickoffIso },
        } as any);
      }
    } catch {}

    await openExternalUrl(url);
  }, [homeName, awayName, tripId, fixtureId, dateIso, kickoffIso]);

  const openDirections = useCallback(async () => {
    const venueName = trip?.venueName ?? fixture?.fixture?.venue?.name;
    const venueCity = trip?.venueCity ?? fixture?.fixture?.venue?.city;
    const q = encodeURIComponent([venueName, venueCity].filter(Boolean).join(" ") || venueText);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    await openExternalUrl(url);
  }, [trip?.venueName, trip?.venueCity, fixture?.fixture?.venue?.name, fixture?.fixture?.venue?.city, venueText]);

  if (!fixtureId) {
    return (
      <Background>
        <SafeAreaView style={styles.safe}>
          <EmptyState title="Match not found" subtitle="Missing fixture ID." actionText="Go back" onAction={() => router.back()} />
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Tickets + logistics</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard style={styles.matchCard}>
            <Text style={styles.smallLabel}>MATCH</Text>

            <View style={styles.teamRow}>
              <View style={styles.teamCol}>{!!crestHome && <Image source={{ uri: crestHome }} style={styles.crest} />}</View>

              <View style={styles.teamMid}>
                <Text style={styles.matchTitle} numberOfLines={2}>
                  {title}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{trip?.kickoffTbc ? "TBC" : "Confirmed"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.teamCol}>{!!crestAway && <Image source={{ uri: crestAway }} style={styles.crest} />}</View>
            </View>

            <Text style={styles.metaText}>Kickoff: {kickoffText}</Text>
            <Text style={styles.metaText}>Venue: {venueText}</Text>

            <Pressable onPress={goBackToTrip} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Back to trip</Text>
            </Pressable>
          </GlassCard>

          <GlassCard style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Tickets</Text>

            <View style={styles.grid}>
              <Pressable onPress={openTickets} style={[styles.gridBtn, openingTickets && styles.gridBtnDisabled]}>
                <Text style={styles.gridTitle}>{openingTickets ? "Opening…" : "Tickets"}</Text>
                <Text style={styles.gridSub}>Sportsevents365</Text>
              </Pressable>

              <Pressable onPress={openOfficialClub} style={styles.gridBtn}>
                <Text style={styles.gridTitle}>Official club</Text>
                <Text style={styles.gridSub}>Search</Text>
              </Pressable>

              <Pressable onPress={openGoogleTicketsSearch} style={styles.gridBtn}>
                <Text style={styles.gridTitle}>Search tickets</Text>
                <Text style={styles.gridSub}>Google</Text>
              </Pressable>

              <Pressable onPress={openDirections} style={styles.gridBtn}>
                <Text style={styles.gridTitle}>Directions</Text>
                <Text style={styles.gridSub}>Google Maps</Text>
              </Pressable>
            </View>

            <Text style={styles.hintText}>Ticket links opened here are tracked and saved into your Trip Workspace as Pending.</Text>

            {loading ? <View style={{ height: 20 }} /> : null}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  backText: { color: theme.colors.text, fontSize: 18 },
  headerTitle: { flex: 1, textAlign: "center", color: theme.colors.text, fontSize: 16, fontWeight: "700" },

  content: { padding: 14, paddingBottom: 24, gap: 12 },

  matchCard: { padding: 14 },
  smallLabel: { color: theme.colors.textTertiary, fontSize: 12, letterSpacing: 0.4, marginBottom: 10 },

  teamRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  teamCol: { width: 54, alignItems: "center" },
  teamMid: { flex: 1, alignItems: "center" },

  crest: { width: 44, height: 44, borderRadius: 22 },

  matchTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800", textAlign: "center" },

  badgeRow: { flexDirection: "row", marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.10)" },
  badgeText: { color: theme.colors.text, fontSize: 12, fontWeight: "700" },

  metaText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: "center" },

  primaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  primaryBtnText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },

  actionsCard: { padding: 14 },
  sectionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "800", marginBottom: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridBtn: {
    width: "48%",
    minHeight: 64,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
  },
  gridBtnDisabled: { opacity: 0.5 },
  gridTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "800" },
  gridSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },

  hintText: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 16 },
});
