// app/match/[id].tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";
import { getBackground } from "@/src/constants/backgrounds";
import tripsStore from "@/src/state/trips";
import { beginPartnerClick } from "@/src/services/partnerClicks";
import { openUrlWithMode } from "@/src/services/partnerOpen";
import * as se365 from "@/src/services/se365";

import { apiGetFixtureById } from "@/src/services/apiFootball";
import { formatKickoffLongLocal, formatKickoffShortLocal } from "@/src/utils/dateFormat";
import { safeStr } from "@/src/utils/safeStr";
import { buildGoogleSearchUrl } from "@/src/utils/searchUrls";
import { buildGoogleMapsDirectionsUrl } from "@/src/utils/mapsUrls";

type FixtureRow = any;

async function safeOpenUrl(url: string) {
  const ok = await openUrlWithMode(url, { mode: "external" });
  if (!ok) {
    Alert.alert("Couldn’t open link");
  }
}

export default function MatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fixtureId = useMemo(() => safeStr(params.id), [params.id]);
  const tripId = useMemo(() => safeStr(params.tripId), [params.tripId]);

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<FixtureRow | null>(null);

  // Pull snapshots (if any) from trip for better offline/robust behavior
  const trip = useMemo(() => {
    if (!tripId) return null;
    const s = tripsStore.getState();
    return s.trips.find((t) => t.id === tripId) ?? null;
  }, [tripId]);

  const homeName = useMemo(() => safeStr(row?.teams?.home?.name) || safeStr(trip?.homeName), [row, trip]);
  const awayName = useMemo(() => safeStr(row?.teams?.away?.name) || safeStr(trip?.awayName), [row, trip]);
  const leagueName = useMemo(() => safeStr(row?.league?.name) || safeStr(trip?.leagueName), [row, trip]);

  const kickoffIso = useMemo(() => safeStr(row?.fixture?.date) || safeStr(trip?.kickoffIso), [row, trip]);
  const venueName = useMemo(() => safeStr(row?.fixture?.venue?.name) || safeStr(trip?.venueName), [row, trip]);
  const venueCity = useMemo(() => safeStr(row?.fixture?.venue?.city) || safeStr(trip?.venueCity), [row, trip]);

  const kickoffLabel = useMemo(() => (kickoffIso ? formatKickoffLongLocal(kickoffIso) : "TBC"), [kickoffIso]);
  const kickoffShort = useMemo(() => (kickoffIso ? formatKickoffShortLocal(kickoffIso) : "TBC"), [kickoffIso]);

  const background = useMemo(() => getBackground("default"), []);

  const crestHome = useMemo(() => safeStr(row?.teams?.home?.logo), [row]);
  const crestAway = useMemo(() => safeStr(row?.teams?.away?.logo), [row]);

  const googleTicketsUrl = useMemo(() => {
    const q = `${homeName} vs ${awayName} tickets`;
    return buildGoogleSearchUrl(q);
  }, [homeName, awayName]);

  const officialHomeTicketsUrl = useMemo(() => {
    // If you later add an "official shop URL" per team, swap this.
    const q = `${homeName} official tickets`;
    return buildGoogleSearchUrl(q);
  }, [homeName]);

  const directionsUrl = useMemo(() => {
    if (!venueName && !venueCity) return "";
    return buildGoogleMapsDirectionsUrl(`${venueName} ${venueCity}`.trim());
  }, [venueName, venueCity]);

  const saveTicketToTrip = useCallback(
    async (label: string, url: string) => {
      // Your existing “pending save” pipeline can be wired here later.
      // For now: do nothing if there’s no trip context.
      if (!tripId) return;
      // If you already have a "savedItemsStore.addPending" call elsewhere, you can add it here.
      // Keeping it no-op prevents crashes if your wallet pipeline is mid-refactor.
    },
    [tripId]
  );

  const openPartnerLink = useCallback(
    async (partnerId: string, providerLabel: string, url: string) => {
      try {
        // Save into Trip Workspace/Wallet when we have a trip context.
        if (tripId) {
          await saveTicketToTrip(providerLabel, url);

          // Track partner click (and keep your "pending -> booked" pipeline intact).
          await beginPartnerClick({
            tripId,
            partnerId,
            url,
            title: providerLabel,
            metadata: { fixtureId },
          });
          return;
        }

        // No trip context: just open externally.
        await safeOpenUrl(url);
      } catch {
        Alert.alert("Couldn’t open link");
      }
    },
    [tripId, fixtureId, saveTicketToTrip]
  );

  const openSe365Tickets = useCallback(async () => {
    try {
      // Prefer a previously-snapshotted exact URL if we have one.
      const snapUrl = trip?.sportsevents365EventUrl;

      if (snapUrl) {
        await openPartnerLink("sportsevents365", "Tickets (Sportsevents365)", snapUrl);
        return;
      }

      const query = se365.buildFixtureSearchQuery({
        homeName,
        awayName,
        kickoffIso,
        venueCity,
        leagueName,
      });

      const resolved = await se365.resolveBestUrlFromSearch({ query });
      const url = resolved.url;

      // Snapshot best-known URL (and eventId if we could infer it).
      if (tripId) {
        await tripsStore.updateTrip(tripId, {
          sportsevents365EventId: resolved.eventId ?? trip?.sportsevents365EventId,
          sportsevents365EventUrl: url,
        });
      }

      await openPartnerLink("sportsevents365", "Tickets (Sportsevents365)", url);
    } catch {
      Alert.alert("Couldn’t open tickets");
    }
  }, [tripId, trip, homeName, awayName, kickoffIso, venueCity, leagueName, openPartnerLink]);

  const load = useCallback(async () => {
    if (!fixtureId) {
      setRow(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiGetFixtureById(Number(fixtureId));
      // Your API wrapper appears to return { response: [...] }
      const first = Array.isArray(data?.response) ? data.response[0] : null;
      setRow(first ?? null);
    } catch {
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [fixtureId]);

  useEffect(() => {
    load();
  }, [load]);

  const title = useMemo(() => {
    if (!homeName && !awayName) return "Match";
    return `${homeName} vs ${awayName}`.trim();
  }, [homeName, awayName]);

  const subtitle = useMemo(() => {
    const parts = [leagueName, kickoffShort].filter(Boolean);
    return parts.join(" • ");
  }, [leagueName, kickoffShort]);

  const onBackToTrip = useCallback(() => {
    if (tripId) {
      router.back();
      return;
    }
    router.replace("/(tabs)/trips");
  }, [router, tripId]);

  const onTicketsNoTripNudge = useCallback(() => {
    if (!tripId) {
      Alert.alert("Tip", "Create a Trip from a fixture to save ticket links into your Trip Workspace.");
    }
  }, [tripId]);

  return (
    <Background background={background}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.h1} numberOfLines={1}>
              Tickets + logistics
            </Text>
            <Text style={styles.h2} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.h3} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : !row ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <EmptyState
              title="Couldn’t load match"
              subtitle="Try again, or check your connection."
              actionLabel="Retry"
              onAction={load}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.matchCard}>
              <Text style={styles.sectionEyebrow}>MATCH (FROM TRIP)</Text>

              <View style={styles.matchRow}>
                <View style={styles.crestWrap}>
                  {!!crestHome && <Image source={{ uri: crestHome }} style={styles.crest} resizeMode="contain" />}
                </View>

                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={styles.matchTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Confirmed</Text>
                  </View>
                </View>

                <View style={styles.crestWrap}>
                  {!!crestAway && <Image source={{ uri: crestAway }} style={styles.crest} resizeMode="contain" />}
                </View>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaText}>Kickoff: {kickoffLabel}</Text>
                <Text style={styles.metaText}>
                  Venue: {venueName}
                  {venueCity ? ` • ${venueCity}` : ""}
                </Text>
              </View>

              <Pressable style={styles.primaryBtn} onPress={onBackToTrip}>
                <Text style={styles.primaryBtnText}>Back to trip</Text>
              </Pressable>
            </GlassCard>

            <GlassCard style={styles.gridCard}>
              <Text style={styles.sectionTitle}>Tickets</Text>

              <View style={styles.grid}>
                <Pressable
                  style={styles.gridBtn}
                  onPressIn={onTicketsNoTripNudge}
                  onPress={() => openSe365Tickets()}
                >
                  <Text style={styles.gridBtnTitle}>Tickets</Text>
                  <Text style={styles.gridBtnSub}>Sportsevents365</Text>
                </Pressable>

                <Pressable
                  style={styles.gridBtn}
                  onPressIn={onTicketsNoTripNudge}
                  onPress={async () => {
                    if (tripId) await saveTicketToTrip("Official club", officialHomeTicketsUrl);
                    await safeOpenUrl(officialHomeTicketsUrl);
                  }}
                >
                  <Text style={styles.gridBtnTitle}>Official club</Text>
                  <Text style={styles.gridBtnSub}>Search</Text>
                </Pressable>

                <Pressable
                  style={styles.gridBtn}
                  onPressIn={onTicketsNoTripNudge}
                  onPress={async () => {
                    if (tripId) await saveTicketToTrip("Search tickets (Google)", googleTicketsUrl);
                    await safeOpenUrl(googleTicketsUrl);
                  }}
                >
                  <Text style={styles.gridBtnTitle}>Search tickets</Text>
                  <Text style={styles.gridBtnSub}>Google</Text>
                </Pressable>

                <Pressable
                  style={styles.gridBtn}
                  onPress={async () => {
                    if (!directionsUrl) return;
                    await safeOpenUrl(directionsUrl);
                  }}
                >
                  <Text style={styles.gridBtnTitle}>Directions</Text>
                  <Text style={styles.gridBtnSub}>Google Maps</Text>
                </Pressable>
              </View>

              <Text style={styles.gridHint}>
                Ticket links you open from here can be saved into your Trip Workspace as Pending.
              </Text>
            </GlassCard>
          </ScrollView>
        )}
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.glassBg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  backText: { color: theme.colors.text, fontSize: 18, marginTop: -2 },
  h1: { color: theme.colors.textDim, fontSize: 13, marginBottom: 2 },
  h2: { color: theme.colors.text, fontSize: 18, fontWeight: "700" },
  h3: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: theme.colors.textDim },

  scroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },

  matchCard: { padding: 16 },
  sectionEyebrow: { color: theme.colors.textDim, fontSize: 12, marginBottom: 10 },
  matchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  crestWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  crest: { width: 34, height: 34 },
  matchTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700", textAlign: "center" },
  badge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,200,120,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,200,120,0.22)",
  },
  badgeText: { color: theme.colors.text, fontSize: 12, fontWeight: "600" },

  metaBlock: { marginTop: 12, gap: 6 },
  metaText: { color: theme.colors.textDim, fontSize: 13 },

  primaryBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  primaryBtnText: { color: theme.colors.text, fontWeight: "700" },

  gridCard: { padding: 16 },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridBtn: {
    width: "48%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  gridBtnTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  gridBtnSub: { color: theme.colors.textDim, fontSize: 12, marginTop: 4 },
  gridHint: { color: theme.colors.textDim, fontSize: 12, marginTop: 12, lineHeight: 16 },
});
