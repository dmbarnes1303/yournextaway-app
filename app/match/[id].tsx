// app/match/[id].tsx

import React, { useCallback, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
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
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
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
    const h = trip?.homeName ?? (fixture as any)?.teams?.home?.name;
    const a = trip?.awayName ?? (fixture as any)?.teams?.away?.name;
    return h && a ? `${h} vs ${a}` : "Match";
  }, [trip?.homeName, trip?.awayName, (fixture as any)?.teams?.home?.name, (fixture as any)?.teams?.away?.name]);

  const kickoffIso = useMemo(() => {
    const k = String(trip?.kickoffIso ?? (fixture as any)?.fixture?.date ?? "").trim();
    return k || null;
  }, [trip?.kickoffIso, (fixture as any)?.fixture?.date]);

  const kickoffText = useMemo(() => (kickoffIso ? formatKickoffLocal(kickoffIso) : "Kickoff TBD"), [kickoffIso]);

  const venueText = useMemo(() => {
    const venueName = (trip as any)?.venueName ?? (fixture as any)?.fixture?.venue?.name;
    const venueCity = (trip as any)?.venueCity ?? (fixture as any)?.fixture?.venue?.city;
    if (!venueName && !venueCity) return "Venue TBD";
    return [venueName, venueCity].filter(Boolean).join(" • ");
  }, [(trip as any)?.venueName, (trip as any)?.venueCity, (fixture as any)?.fixture?.venue?.name, (fixture as any)?.fixture?.venue?.city]);

  const crestHome = (trip as any)?.homeTeamId
    ? `https://media.api-sports.io/football/teams/${(trip as any).homeTeamId}.png`
    : (fixture as any)?.teams?.home?.logo;

  const crestAway = (trip as any)?.awayTeamId
    ? `https://media.api-sports.io/football/teams/${(trip as any).awayTeamId}.png`
    : (fixture as any)?.teams?.away?.logo;

  const leagueId =
    (typeof (trip as any)?.leagueId === "number" ? (trip as any).leagueId : undefined) ??
    (typeof (fixture as any)?.league?.id === "number" ? (fixture as any).league.id : undefined);

  const homeName = String((trip as any)?.homeName ?? (fixture as any)?.teams?.home?.name ?? "").trim();
  const awayName = String((trip as any)?.awayName ?? (fixture as any)?.teams?.away?.name ?? "").trim();

  const dateIso = useMemo(() => {
    return (
      String((trip as any)?.startDate ?? "").trim() ||
      isoDateOnlyFromKickoffIso((trip as any)?.kickoffIso) ||
      isoDateOnlyFromKickoffIso((fixture as any)?.fixture?.date) ||
      null
    );
  }, [(trip as any)?.startDate, (trip as any)?.kickoffIso, (fixture as any)?.fixture?.date]);

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
      Alert.alert("Open from a trip", "Open this match from a Trip Workspace so we can save it into Wallet.");
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
        leagueName: (trip as any)?.leagueName ?? (fixture as any)?.league?.name,
        se365EventId: typeof (trip as any)?.sportsevents365EventId === "number" ? (trip as any).sportsevents365EventId : undefined,
        se365EventUrl: (fixture as any)?.se365EventUrl ?? null,
      });

      if (!url) {
        Alert.alert("Tickets not found");
        return;
      }

      // LIVE-WIRING: partner click pipeline owns:
      // - creating Pending saved item
      // - opening partner
      // - handling return prompts / booking proof
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

  const openDirections = useCallback(async () => {
    const venueName = (trip as any)?.venueName ?? (fixture as any)?.fixture?.venue?.name;
    const venueCity = (trip as any)?.venueCity ?? (fixture as any)?.fixture?.venue?.city;
    const q = encodeURIComponent([venueName, venueCity].filter(Boolean).join(" ") || venueText);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open maps");
    }
  }, [(trip as any)?.venueName, (trip as any)?.venueCity, (fixture as any)?.fixture?.venue?.name, (fixture as any)?.fixture?.venue?.city, venueText]);

  if (!fixtureId) {
    return (
      <Background>
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
              <View style={styles.teamCol}>
                {!!crestHome && <Image source={{ uri: crestHome }} style={styles.crest} />}
              </View>

              <View style={styles.teamMid}>
                <Text style={styles.matchTitle} numberOfLines={2}>
                  {title}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{(trip as any)?.kickoffTbc ? "TBC" : "Confirmed"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.teamCol}>
                {!!crestAway && <Image source={{ uri: crestAway }} style={styles.crest} />}
              </View>
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
                <Text style={styles.gridSub}>SportsEvents365</Text>
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

            <Text style={styles.hintText}>
              Ticket links opened from here go through the Partner pipeline: Pending → (you return) → Booked → Wallet.
            </Text>

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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: theme.colors.text,
    fontSize: 18,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    padding: 14,
    paddingBottom: 24,
    gap: 12,
  },
  matchCard: { padding: 14 },
  smallLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    letterSpacing: 0.4,
    marginBottom: 10,
    fontWeight: "900",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  teamCol: { width: 54, alignItems: "center" },
  teamMid: { flex: 1, alignItems: "center" },
  crest: { width: 44, height: 44, borderRadius: 22 },
  matchTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  badgeRow: { flexDirection: "row", marginTop: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  badgeText: { color: theme.colors.text, fontSize: 12, fontWeight: "900" },
  metaText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: "center", fontWeight: "800" },
  primaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  primaryBtnText: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  actionsCard: { padding: 14 },
  sectionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900", marginBottom: 10 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
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
  gridTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  gridSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: "800" },
  hintText: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 16, fontWeight: "800" },
});
