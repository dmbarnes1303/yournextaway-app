// app/match/[id].tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";
import { getAffiliateLinks } from "@/src/services/affiliateLinks";

import tripsStore from "@/src/state/trips";
import fixturesStore from "@/src/state/fixtures";

import { resolveSe365Event, buildTicketsGoogleSearch } from "@/src/services/se365";

type MatchParams = {
  id?: string;
  fromTripId?: string;
};

function cleanString(v: any) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

async function safeOpenUrl(url: string) {
  const u = cleanString(url);
  if (!u || !/^https?:\/\//i.test(u)) return false;

  try {
    // canOpenURL is flaky on Android for some https links; openURL is enough
    await Linking.openURL(u);
    return true;
  } catch {
    return false;
  }
}

export default function MatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<MatchParams>();

  const fixtureId = useMemo(() => cleanString(params?.id), [params?.id]);
  const fromTripId = useMemo(() => cleanString(params?.fromTripId), [params?.fromTripId]);

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<any | null>(null);

  const [ticketsResolving, setTicketsResolving] = useState(false);
  const [se365Url, setSe365Url] = useState<string | null>(null);
  const [se365EventId, setSe365EventId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await fixturesStore.load();
        const f = fixturesStore.getFixtureById(fixtureId);
        if (!mounted) return;
        setRow(f ?? null);
      } catch {
        if (!mounted) return;
        setRow(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fixtureId]);

  const fixture = row?.fixture;
  const league = row?.league;
  const teams = row?.teams;
  const venue = row?.fixture?.venue;

  const homeName = teams?.home?.name || "";
  const awayName = teams?.away?.name || "";
  const kickoffIso = fixture?.date || fixture?.kickoff || fixture?.start || "";

  const { country, startDate, endDate, ticketsUrl, mapsUrl, transfersUrl } = useMemo(() => {
    // getAffiliateLinks expects country + dates.
    // We use venue city/country if available; otherwise blank.
    const c = league?.country || "";
    // if your date fields differ, we keep it safe.
    const sd = String(kickoffIso).slice(0, 10) || "";
    const ed = sd || "";
    return getAffiliateLinks({
      city: venue?.city || "",
      country: c,
      startDate: sd,
      endDate: ed,
    });
  }, [league?.country, venue?.city, kickoffIso]);

  const kickoffLabel = useMemo(() => {
    const d = fixture?.date;
    if (!d) return "—";
    try {
      const date = new Date(d);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return String(d);
    }
  }, [fixture?.date]);

  const resolveTickets = useCallback(async () => {
    if (!row) return;

    setTicketsResolving(true);
    try {
      // If we already have it on the trip snapshot, use that first.
      // Otherwise resolve from SE365 API.
      const tripId = fromTripId || tripsStore.getTripIdByMatchId(fixtureId) || "";
      const trip = tripId ? tripsStore.getState().trips.find((t: any) => t.id === tripId) : null;

      const snapEventId = trip?.sportsevents365EventId;
      // If snapshot has ID, we can still resolve URL by calling SE365 details, BUT
      // our resolver already handles fetching eventUrl when needed.
      const resolved = await resolveSe365Event({
        leagueId: league?.id,
        homeName,
        awayName,
        kickoffIso,
      });

      if (resolved?.eventUrl) {
        setSe365Url(resolved.eventUrl);
        setSe365EventId(resolved.eventId);

        // Persist eventId to trip snapshot so future opens are instant.
        if (tripId && (!snapEventId || Number(snapEventId) !== resolved.eventId)) {
          await tripsStore.updateTrip(tripId, {
            sportsevents365EventId: resolved.eventId,
          });
        }

        return resolved.eventUrl;
      }

      // If resolver failed, fallback to generic ticketsUrl (affiliate base) if present
      // or a Google search query.
      const google = buildTicketsGoogleSearch(homeName, awayName, kickoffIso);
      setSe365Url(null);
      setSe365EventId(snapEventId ? Number(snapEventId) : null);
      return ticketsUrl || google;
    } catch {
      const google = buildTicketsGoogleSearch(homeName, awayName, kickoffIso);
      setSe365Url(null);
      return ticketsUrl || google;
    } finally {
      setTicketsResolving(false);
    }
  }, [row, fixtureId, fromTripId, league?.id, homeName, awayName, kickoffIso, ticketsUrl]);

  const onOpenTickets = useCallback(async () => {
    if (!row) return;

    const url = se365Url || (await resolveTickets());
    const ok = await safeOpenUrl(url);

    if (!ok) {
      Alert.alert("Couldn't open tickets", "The tickets link couldn't be opened on this device.");
    } else {
      // Optional: you can add “Pending” save-to-trip logic here later.
    }
  }, [row, se365Url, resolveTickets]);

  const onOpenDirections = useCallback(async () => {
    const city = cleanString(venue?.city);
    const name = cleanString(venue?.name);
    const q = encodeURIComponent([name, city].filter(Boolean).join(" "));
    const url = q ? `https://www.google.com/maps/search/?api=1&query=${q}` : mapsUrl;

    const ok = await safeOpenUrl(url);
    if (!ok) Alert.alert("Couldn't open directions", "The directions link couldn't be opened.");
  }, [venue?.city, venue?.name, mapsUrl]);

  const onBackToTrip = useCallback(() => {
    if (fromTripId) {
      router.push({ pathname: "/trip/[id]", params: { id: fromTripId } });
      return;
    }
    const tripId = tripsStore.getTripIdByMatchId(fixtureId);
    if (tripId) router.push({ pathname: "/trip/[id]", params: { id: tripId } });
    else router.back();
  }, [fromTripId, fixtureId, router]);

  if (loading) {
    return (
      <Background>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  if (!row) {
    return (
      <Background>
        <SafeAreaView style={styles.safe}>
          <EmptyState
            title="Match not found"
            subtitle="We couldn't load this fixture."
            ctaLabel="Back"
            onCta={() => router.back()}
          />
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Tickets + logistics</Text>

          <GlassCard style={styles.card}>
            <Text style={styles.kicker}>MATCH (FROM TRIP)</Text>
            <Text style={styles.h1}>{homeName} vs {awayName}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Kickoff:</Text>
              <Text style={styles.metaValue}>{kickoffLabel}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Venue:</Text>
              <Text style={styles.metaValue}>
                {venue?.name || "—"}{venue?.city ? ` • ${venue.city}` : ""}
              </Text>
            </View>

            <Pressable style={styles.backBtn} onPress={onBackToTrip}>
              <Text style={styles.backBtnText}>Back to trip</Text>
            </Pressable>
          </GlassCard>

          <GlassCard style={styles.gridCard}>
            <Text style={styles.sectionTitle}>Tickets</Text>

            <View style={styles.grid}>
              <Pressable style={styles.tile} onPress={onOpenTickets} disabled={ticketsResolving}>
                <Text style={styles.tileTitle}>Tickets</Text>
                <Text style={styles.tileSub}>Sportsevents365</Text>
                {ticketsResolving ? <ActivityIndicator style={{ marginTop: 10 }} /> : null}
                {se365EventId ? (
                  <Text style={styles.hint}>Linked to event #{se365EventId}</Text>
                ) : null}
              </Pressable>

              <Pressable
                style={styles.tile}
                onPress={async () => {
                  const google = buildTicketsGoogleSearch(homeName, awayName, kickoffIso);
                  const ok = await safeOpenUrl(google);
                  if (!ok) Alert.alert("Couldn't open search", "The search link couldn't be opened.");
                }}
              >
                <Text style={styles.tileTitle}>Search tickets</Text>
                <Text style={styles.tileSub}>Google</Text>
              </Pressable>

              <Pressable style={styles.tile} onPress={onOpenDirections}>
                <Text style={styles.tileTitle}>Directions</Text>
                <Text style={styles.tileSub}>Google Maps</Text>
              </Pressable>

              <Pressable
                style={styles.tile}
                onPress={async () => {
                  const ok = await safeOpenUrl(transfersUrl);
                  if (!ok) Alert.alert("Couldn't open transfers", "The transfers link couldn't be opened.");
                }}
              >
                <Text style={styles.tileTitle}>Transfers</Text>
                <Text style={styles.tileSub}>Kiwitaxi</Text>
              </Pressable>
            </View>

            <Text style={styles.disclaimer}>
              Ticket links opened from here can be saved into your Trip Workspace later (Pending → Booked).
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  card: { padding: 16, marginBottom: 12 },
  kicker: { color: theme.colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 8 },
  h1: { color: theme.colors.text, fontSize: 18, fontWeight: "800", marginBottom: 10 },

  metaRow: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  metaLabel: { color: theme.colors.muted, fontWeight: "700" },
  metaValue: { color: theme.colors.text },

  backBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  backBtnText: { color: theme.colors.text, fontWeight: "800" },

  gridCard: { padding: 16 },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800", marginBottom: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "48%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tileTitle: { color: theme.colors.text, fontWeight: "800", fontSize: 14 },
  tileSub: { color: theme.colors.muted, marginTop: 4 },

  hint: { color: theme.colors.muted, marginTop: 10, fontSize: 12 },

  disclaimer: { color: theme.colors.muted, marginTop: 12, fontSize: 12, lineHeight: 16 },
});
