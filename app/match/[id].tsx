// app/match/[id].tsx

import React, { useCallback, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { useFixture } from "@/src/hooks/useFixtures";
import { useTripsStore } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import type { PartnerId } from "@/src/core/partners";
import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";
import { buildTicketLink } from "@/src/services/partnerLinks";

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

function mapsSearchUrl(query: string) {
  const q = encodeURIComponent(String(query ?? "").trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function googleSearchUrl(query: string) {
  const q = encodeURIComponent(String(query ?? "").trim());
  return `https://www.google.com/search?q=${q}`;
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
    () => String(trip?.homeName ?? fixture?.teams?.home?.name ?? "").trim(),
    [trip?.homeName, fixture?.teams?.home?.name]
  );

  const awayName = useMemo(
    () => String(trip?.awayName ?? fixture?.teams?.away?.name ?? "").trim(),
    [trip?.awayName, fixture?.teams?.away?.name]
  );

  const title = useMemo(() => {
    if (homeName && awayName) return `${homeName} vs ${awayName}`;
    return "Match";
  }, [homeName, awayName]);

  const kickoffIso = useMemo(() => {
    const k = String(trip?.kickoffIso ?? fixture?.fixture?.date ?? "").trim();
    return k || null;
  }, [trip?.kickoffIso, fixture?.fixture?.date]);

  const kickoffText = useMemo(
    () => (kickoffIso ? formatKickoffLocal(kickoffIso) : "Kickoff TBD"),
    [kickoffIso]
  );

  const venueText = useMemo(() => {
    const venueName = trip?.venueName ?? fixture?.fixture?.venue?.name;
    const venueCity = trip?.venueCity ?? fixture?.fixture?.venue?.city;
    if (!venueName && !venueCity) return "Venue TBD";
    return [venueName, venueCity].filter(Boolean).join(" • ");
  }, [trip?.venueName, trip?.venueCity, fixture?.fixture?.venue?.name, fixture?.fixture?.venue?.city]);

  const crestHome = useMemo(() => {
    if (trip?.homeTeamId) return `https://media.api-sports.io/football/teams/${trip.homeTeamId}.png`;
    return fixture?.teams?.home?.logo ?? null;
  }, [trip?.homeTeamId, fixture?.teams?.home?.logo]);

  const crestAway = useMemo(() => {
    if (trip?.awayTeamId) return `https://media.api-sports.io/football/teams/${trip.awayTeamId}.png`;
    return fixture?.teams?.away?.logo ?? null;
  }, [trip?.awayTeamId, fixture?.teams?.away?.logo]);

  const leagueId =
    (typeof (trip as any)?.leagueId === "number" ? (trip as any).leagueId : undefined) ??
    (typeof (fixture as any)?.league?.id === "number" ? (fixture as any).league.id : undefined);

  const dateIso = useMemo(() => {
    return (
      String((trip as any)?.startDate ?? "").trim() ||
      isoDateOnlyFromKickoffIso((trip as any)?.kickoffIso) ||
      isoDateOnlyFromKickoffIso((fixture as any)?.fixture?.date) ||
      null
    );
  }, [trip, fixture]);

  const goBackToTrip = useCallback(() => {
    if (tripId) {
      router.push({ pathname: "/trip/[id]", params: { id: tripId } } as any);
      return;
    }
    router.back();
  }, [router, tripId]);

  async function openTickets() {
    if (openingTickets) return;

    if (!fixtureId) {
      Alert.alert("Match not available", "Missing fixture ID.");
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
        se365EventId:
          typeof (trip as any)?.sportsevents365EventId === "number" ? (trip as any).sportsevents365EventId : undefined,
        se365EventUrl: (fixture as any)?.se365EventUrl ?? null,
      });

      if (!url) {
        Alert.alert("Tickets not found");
        return;
      }

      // Consistent tracking pipeline: creates Pending + tracks click when tripId exists.
      if (tripId) {
        await beginPartnerClick({
          tripId,
          partnerId: "sportsevents365" as PartnerId,
          url,
          savedItemType: "tickets",
          title: `Tickets: ${homeName} vs ${awayName}`,
          metadata: { fixtureId, leagueId, dateIso, kickoffIso, priceMode: "live" },
        });
      } else {
        await openUntrackedUrl(url);
      }
    } catch {
      Alert.alert("Couldn't open tickets");
    } finally {
      setOpeningTickets(false);
    }
  }

  const openOfficialClub = useCallback(async () => {
    const url = googleSearchUrl(`${homeName} vs ${awayName} official tickets`);
    try {
      if (tripId) {
        await savedItemsStore.add({
          tripId,
          type: "tickets",
          status: "pending",
          title: `Official club tickets: ${homeName} vs ${awayName}`,
          partnerId: "google",
          partnerUrl: url,
          priceText: "View live price",
          currency: "GBP",
          metadata: { fixtureId, dateIso, kickoffIso },
        } as any);
      }
    } catch {}
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn't open link");
    }
  }, [homeName, awayName, tripId, fixtureId, dateIso, kickoffIso]);

  const openGoogleTicketsSearch = useCallback(async () => {
    const url = googleSearchUrl(`${homeName} vs ${awayName} tickets`);
    try {
      if (tripId) {
        await savedItemsStore.add({
          tripId,
          type: "tickets",
          status: "pending",
          title: `Tickets search: ${homeName} vs ${awayName}`,
          partnerId: "google",
          partnerUrl: url,
          priceText: "View live price",
          currency: "GBP",
          metadata: { fixtureId, dateIso, kickoffIso },
        } as any);
      }
    } catch {}
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn't open link");
    }
  }, [homeName, awayName, tripId, fixtureId, dateIso, kickoffIso]);

  const openDirections = useCallback(async () => {
    const venueName = (trip as any)?.venueName ?? (fixture as any)?.fixture?.venue?.name;
    const venueCity = (trip as any)?.venueCity ?? (fixture as any)?.fixture?.venue?.city;
    const q = [venueName, venueCity].filter(Boolean).join(" ").trim() || venueText;
    const url = mapsSearchUrl(q);
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn't open maps");
    }
  }, [trip, fixture, venueText]);

  if (!fixtureId) {
    return (
      <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.safe}>
          <GlassCard style={{ padding: theme.spacing.lg }}>
            <EmptyState title="Match not found" message="Missing fixture ID." />
          </GlassCard>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Tickets + logistics",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
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
                    <Text style={styles.badgeText}>{(trip as any)?.kickoffTbc ? "TBC" : "Confirmed"}</Text>
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

            <Text style={styles.hintText}>
              Ticket links opened from here are saved into your Trip Workspace as Pending.
            </Text>

            {loading ? <Text style={styles.loadingText}>Loading match…</Text> : null}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  matchCard: { padding: theme.spacing.lg },
  actionsCard: { padding: theme.spacing.lg },

  smallLabel: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    letterSpacing: 0.4,
    fontWeight: "900",
    marginBottom: 10,
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
    borderColor: "rgba(255,255,255,0.14)",
  },
  badgeText: { color: theme.colors.text, fontSize: 12, fontWeight: "900" },

  metaText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: "center", fontWeight: "800" },

  primaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,160,0.25)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  primaryBtnText: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },

  sectionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900", marginBottom: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  gridBtn: {
    width: "48%",
    minHeight: 64,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
  },
  gridBtnDisabled: { opacity: 0.55 },

  gridTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  gridSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: "800" },

  hintText: { color: theme.colors.textTertiary, fontSize: 12, marginTop: 10, lineHeight: 16, fontWeight: "900" },
  loadingText: { marginTop: 10, color: theme.colors.textSecondary, fontWeight: "800" },
});
