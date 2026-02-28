// app/match/[id].tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";

import fixturesStore from "@/src/state/fixtures";
import tripsStore from "@/src/state/trips";

import { resolveSe365EventForFixture } from "@/src/services/se365";

function enc(s: string) {
  return encodeURIComponent(String(s ?? ""));
}

async function safeOpenUrl(url: string): Promise<boolean> {
  const u = String(url ?? "").trim();
  if (!u) return false;

  try {
    // canOpenURL can be flaky on Android for http(s), so just attempt open.
    await Linking.openURL(u);
    return true;
  } catch {
    return false;
  }
}

export default function MatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const fixtureId = useMemo(() => String(params.id ?? "").trim(), [params.id]);

  const [loading, setLoading] = useState(true);
  const [resolvingTickets, setResolvingTickets] = useState(false);

  const match = useMemo(() => {
    if (!fixtureId) return null;
    return fixturesStore.getFixtureById(fixtureId);
  }, [fixtureId]);

  const trip = useMemo(() => {
    if (!fixtureId) return null;
    return tripsStore.getTripByMatchId(fixtureId);
  }, [fixtureId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await fixturesStore.load();
      } catch {}
      if (!alive) return;
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const kickoffText = useMemo(() => {
    const iso = match?.kickoffIso;
    if (!iso) return "TBC";
    // Keep simple: UI already shows date/time elsewhere; don’t over-format here.
    return iso.replace("T", " ").split("+")[0];
  }, [match?.kickoffIso]);

  const openTickets = useCallback(async () => {
    if (!match) return;

    // 1) If already resolved & cached on the trip, use it.
    const cached = String((trip as any)?.sportsevents365EventUrl ?? "").trim();
    if (cached) {
      const ok = await safeOpenUrl(cached);
      if (!ok) Alert.alert("Couldn’t open tickets");
      return;
    }

    // 2) Resolve via SE365 API (exact event page)
    setResolvingTickets(true);
    try {
      const resolved = await resolveSe365EventForFixture({
        leagueId: match.leagueId,
        kickoffIso: match.kickoffIso,
        homeName: match.homeName,
        awayName: match.awayName,
      });

      if (!resolved) {
        // fallback: still offer a search rather than dead-end
        const query = `${match.homeName ?? ""} vs ${match.awayName ?? ""} tickets`;
        const url = `https://www.google.com/search?q=${enc(query)}`;
        const ok = await safeOpenUrl(url);
        if (!ok) Alert.alert("Couldn’t open tickets");
        return;
      }

      // 3) Persist onto trip snapshot so next time is instant
      if (trip?.id) {
        try {
          await tripsStore.updateTrip(trip.id, {
            sportsevents365EventId: resolved.eventId,
            sportsevents365EventUrl: resolved.eventUrl,
          });
        } catch {}
      }

      const ok = await safeOpenUrl(resolved.eventUrl);
      if (!ok) Alert.alert("Couldn’t open tickets");
    } catch (e: any) {
      Alert.alert("Tickets unavailable", e?.message ? String(e.message) : "Couldn’t resolve tickets for this match.");
    } finally {
      setResolvingTickets(false);
    }
  }, [match, trip]);

  const openOfficialClub = useCallback(async () => {
    if (!match) return;
    const query = `${match.homeName ?? ""} official tickets`;
    const url = `https://www.google.com/search?q=${enc(query)}`;
    const ok = await safeOpenUrl(url);
    if (!ok) Alert.alert("Couldn’t open link");
  }, [match]);

  const openGoogleTickets = useCallback(async () => {
    if (!match) return;
    const query = `${match.homeName ?? ""} vs ${match.awayName ?? ""} tickets`;
    const url = `https://www.google.com/search?q=${enc(query)}`;
    const ok = await safeOpenUrl(url);
    if (!ok) Alert.alert("Couldn’t open link");
  }, [match]);

  const openDirections = useCallback(async () => {
    if (!match) return;
    const q = `${match.venueName ?? ""} ${match.venueCity ?? ""}`.trim();
    const url = `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
    const ok = await safeOpenUrl(url);
    if (!ok) Alert.alert("Couldn’t open maps");
  }, [match]);

  if (loading) {
    return (
      <Background>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading match…</Text>
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  if (!match) {
    return (
      <Background>
        <SafeAreaView style={styles.safe}>
          <EmptyState
            title="Match not found"
            subtitle="This fixture isn’t available right now."
            primaryActionText="Back"
            onPrimaryAction={() => router.back()}
          />
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Tickets + logistics</Text>

          <GlassCard style={styles.matchCard}>
            <Text style={styles.sectionLabel}>MATCH (FROM TRIP)</Text>

            <Text style={styles.matchTitle}>
              {match.homeName} vs {match.awayName}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{match.kickoffTbc ? "TBC" : "Confirmed"}</Text>
              </View>
            </View>

            <Text style={styles.meta}>Kickoff: {kickoffText}</Text>
            <Text style={styles.meta}>
              Venue: {match.venueName ?? "TBC"} • {match.venueCity ?? "TBC"}
            </Text>

            {trip?.id ? (
              <Pressable style={styles.backBtn} onPress={() => router.push(`/trip/${trip.id}`)}>
                <Text style={styles.backBtnText}>Back to trip</Text>
              </Pressable>
            ) : null}
          </GlassCard>

          <GlassCard style={styles.gridCard}>
            <Text style={styles.gridTitle}>Tickets</Text>

            <View style={styles.grid}>
              <Pressable style={styles.tile} onPress={openTickets} disabled={resolvingTickets}>
                <Text style={styles.tileTitle}>Tickets</Text>
                <Text style={styles.tileSub}>
                  {resolvingTickets ? "Finding event…" : "Sportsevents365"}
                </Text>
              </Pressable>

              <Pressable style={styles.tile} onPress={openOfficialClub}>
                <Text style={styles.tileTitle}>Official club</Text>
                <Text style={styles.tileSub}>Search</Text>
              </Pressable>

              <Pressable style={styles.tile} onPress={openGoogleTickets}>
                <Text style={styles.tileTitle}>Search tickets</Text>
                <Text style={styles.tileSub}>Google</Text>
              </Pressable>

              <Pressable style={styles.tile} onPress={openDirections}>
                <Text style={styles.tileTitle}>Directions</Text>
                <Text style={styles.tileSub}>Google Maps</Text>
              </Pressable>
            </View>

            <Text style={styles.hint}>
              Ticket links you open from here are saved into your Trip Workspace as Pending.
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: theme.textSecondary },

  title: { fontSize: 22, fontWeight: "700", color: theme.textPrimary, marginBottom: 12 },

  matchCard: { padding: 16, marginBottom: 12 },
  sectionLabel: { color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },
  matchTitle: { marginTop: 10, fontSize: 20, fontWeight: "800", color: theme.textPrimary },
  badgeRow: { flexDirection: "row", marginTop: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: { color: theme.textPrimary, fontWeight: "700", fontSize: 12 },
  meta: { marginTop: 8, color: theme.textSecondary },

  backBtn: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,150,0.25)",
  },
  backBtnText: { color: theme.textPrimary, fontWeight: "700" },

  gridCard: { padding: 16 },
  gridTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "48%",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tileTitle: { color: theme.textPrimary, fontWeight: "800", fontSize: 14 },
  tileSub: { marginTop: 6, color: theme.textSecondary, fontSize: 12 },

  hint: { marginTop: 12, color: theme.textSecondary, fontSize: 12, lineHeight: 16 },
});
