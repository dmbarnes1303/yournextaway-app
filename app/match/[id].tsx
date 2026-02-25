// app/match/[id].tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import MatchdayLogisticsCard from "@/src/components/match/MatchdayLogisticsCard";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { toIsoDate } from "@/src/constants/football";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { coerceString } from "@/src/utils/params";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import savedItemsStore from "@/src/state/savedItems";
import { registerPartnerClick } from "@/src/services/partnerReturnBootstrap";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";

import { getMatchdayLogistics } from "@/src/data/matchdayLogistics";
import { getStadiumByHomeTeam } from "@/src/data/stadiums";

/* -------------------------------------------------------------------------- */
/* helpers */
/* -------------------------------------------------------------------------- */

function enc(v: string) {
  return encodeURIComponent(v);
}

function isoDateOnly(isoMaybe?: string) {
  if (!isoMaybe) return undefined;
  const d = new Date(isoMaybe);
  if (Number.isNaN(d.getTime())) return undefined;
  return toIsoDate(d);
}

async function safeOpenUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn’t open link");
  }
}

/* -------------------------------------------------------------------------- */
/* screen */
/* -------------------------------------------------------------------------- */

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const id = useMemo(() => coerceString((params as any)?.id), [params]);

  const [row, setRow] = useState<FixtureListRow | null>(null);
  const [loading, setLoading] = useState(false);

  const home = row?.teams?.home?.name ?? "Home";
  const away = row?.teams?.away?.name ?? "Away";

  /* ------------------------------------------------------------------ */
  /* LOAD MATCH */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const r = await getFixtureById(id);
        if (!cancelled) setRow(r ?? null);
      } catch (e) {
        if (!cancelled) setRow(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const kickoffDisplay = formatUkDateTimeMaybe(row?.fixture?.date);
  const kickoffDateOnly = isoDateOnly(row?.fixture?.date);

  const stadiumMeta = useMemo(() => getStadiumByHomeTeam(home), [home]);
  const stadiumName = stadiumMeta?.name ?? row?.fixture?.venue?.name ?? "";
  const stadiumCity = stadiumMeta?.city ?? row?.fixture?.venue?.city ?? "";

  const mapsUrl = useMemo(() => {
    const q = [stadiumName, stadiumCity].filter(Boolean).join(" ");
    return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
  }, [stadiumName, stadiumCity]);

  const logistics = useMemo(() => getMatchdayLogistics({ homeTeamName: home }), [home]);

  const certainty = useMemo(() => getFixtureCertainty(row, {}), [row]);

  /* ------------------------------------------------------------------ */
  /* SAVE TICKET → WALLET */
  /* ------------------------------------------------------------------ */

  const saveTicketToTrip = useCallback(
    async (provider: string, url: string) => {
      try {
        if (!row) return;

        const tripId = String(row.fixture.id);

        const item = await savedItemsStore.add({
          tripId,
          type: "tickets",
          title: `${home} vs ${away} tickets`,
          status: "pending",
          partnerId: provider,
          partnerUrl: url,
          metadata: {
            fixtureId: row.fixture.id,
            home,
            away,
            kickoffIso: row.fixture.date ?? null,
          },
        });

        registerPartnerClick({
          itemId: item.id,
          provider,
          url,
        });
      } catch (e) {
        console.log("saveTicketToTrip failed", e);
      }
    },
    [row, home, away]
  );

  /* ------------------------------------------------------------------ */
  /* TICKET URLS */
  /* ------------------------------------------------------------------ */

  const se365PrimaryUrl = useMemo(() => {
    const query = `${home} vs ${away}`;
    return `https://www.sportsevents365.com/search?q=${enc(query)}`;
  }, [home, away]);

  const officialHomeTicketsUrl = useMemo(
    () => `https://www.google.com/search?q=${enc(home + " tickets")}`,
    [home]
  );

  const googleHomeTicketsUrl = useMemo(
    () => `https://www.google.com/search?q=${enc(home + " vs " + away + " tickets")}`,
    [home, away]
  );

  /* ------------------------------------------------------------------ */
  /* HANDLERS */
  /* ------------------------------------------------------------------ */

  const openSportsevents365 = useCallback(async () => {
    await saveTicketToTrip("sportsevents365", se365PrimaryUrl);
    await safeOpenUrl(se365PrimaryUrl);
  }, [saveTicketToTrip, se365PrimaryUrl]);

  const openOfficialHomeTickets = useCallback(async () => {
    await saveTicketToTrip("official", officialHomeTicketsUrl);
    await safeOpenUrl(officialHomeTicketsUrl);
  }, [saveTicketToTrip, officialHomeTicketsUrl]);

  const openGoogleFallback = useCallback(async () => {
    // FIXED: previously referenced a garbage variable name
    await saveTicketToTrip("google", googleHomeTicketsUrl);
    await safeOpenUrl(googleHomeTicketsUrl);
  }, [saveTicketToTrip, googleHomeTicketsUrl]);

  /* ------------------------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------------------------ */

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <Stack.Screen options={{ headerShown: true, title: "Match", headerTransparent: true }} />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 100,
            paddingBottom: 80 + insets.bottom,
            paddingHorizontal: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
        >
          <GlassCard>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator />
              </View>
            ) : !row ? (
              <EmptyState title="Match not found" message="Unable to load match." />
            ) : (
              <>
                <Text style={styles.title}>
                  {home} vs {away}
                </Text>

                <View style={styles.badgeWrap}>
                  <FixtureCertaintyBadge state={certainty} />
                </View>

                <Text style={styles.meta}>Kickoff: {kickoffDisplay ?? "—"}</Text>
                <Text style={styles.meta}>
                  Venue: {stadiumName}
                  {stadiumCity ? ` • ${stadiumCity}` : ""}
                </Text>

                <MatchdayLogisticsCard
                  logistics={logistics}
                  city={stadiumCity}
                  onOpenStop={async (q) =>
                    safeOpenUrl(`https://www.google.com/maps/search/?api=1&query=${enc(q)}`)
                  }
                  onSelectStayArea={() => {}}
                />

                <View style={styles.actions}>
                  <Pressable style={styles.primaryBtn} onPress={openSportsevents365}>
                    <Text style={styles.btnText}>Sportsevents365</Text>
                  </Pressable>

                  <Pressable style={styles.primaryBtn} onPress={openOfficialHomeTickets}>
                    <Text style={styles.btnText}>Official club</Text>
                  </Pressable>

                  <Pressable style={styles.secondaryBtn} onPress={openGoogleFallback}>
                    <Text style={styles.btnText}>Google fallback</Text>
                  </Pressable>

                  <Pressable style={styles.secondaryBtn} onPress={() => safeOpenUrl(mapsUrl)}>
                    <Text style={styles.btnText}>Open maps</Text>
                  </Pressable>
                </View>
              </>
            )}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 20,
  },
  meta: {
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  badgeWrap: {
    marginTop: 10,
  },
  actions: {
    gap: 10,
    marginTop: 14,
  },
  loadingWrap: {
    paddingVertical: 16,
  },
  primaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: theme.colors.text,
    fontWeight: "900",
  },
});
