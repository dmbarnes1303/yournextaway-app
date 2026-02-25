// app/match/[id].tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  Platform,
  TextInput,
  Keyboard,
  Modal,
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

import { getFixtureById, getFixturesByRound, type FixtureListRow } from "@/src/services/apiFootball";
import {
  getRollingWindowIso,
  toIsoDate,
  addDaysIso,
  clampFromIsoToTomorrow,
  normalizeWindowIso,
} from "@/src/constants/football";
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import authStore from "@/src/state/auth";
import useFollowStore from "@/src/state/followStore";
import savedItemsStore from "@/src/state/savedItems";
import { registerPartnerClick } from "@/src/services/partnerReturnBootstrap";

import {
  computeLikelyPlaceholderTbcIds,
  isKickoffTbc,
  kickoffIsoOrNull,
  CONFIRMED_WITHIN_DAYS,
} from "@/src/utils/kickoffTbc";

import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import { getTicketGuide } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";

import { getMatchdayLogistics } from "@/src/data/matchdayLogistics";
import type { LogisticsStop } from "@/src/data/matchdayLogistics/types";
import { getStadiumByHomeTeam } from "@/src/data/stadiums";

/* -------------------------------------------------------------------------- */
/* helpers */
/* -------------------------------------------------------------------------- */

function currentFootballSeasonStartYear(now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth();
  return m >= 6 ? y : y - 1;
}

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

function daysUntilIso(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return (t - Date.now()) / (1000 * 60 * 60 * 24);
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

  const logistics = useMemo(
    () => getMatchdayLogistics({ homeTeamName: home }),
    [home]
  );

  const certainty = useMemo(() => {
    return getFixtureCertainty(row, {});
  }, [row]);

  /* ------------------------------------------------------------------ */
  /* SAVE TICKET → WALLET */
  /* ------------------------------------------------------------------ */

  async function saveTicketToTrip(provider: string, url: string) {
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
  }

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
  /* HANDLERS (MERGED) */
  /* ------------------------------------------------------------------ */

  const openSportsevents365 = useCallback(async () => {
    await saveTicketToTrip("sportsevents365", se365PrimaryUrl);
    await safeOpenUrl(se365PrimaryUrl);
  }, [se365PrimaryUrl, row]);

  const openOfficialHomeTickets = useCallback(async () => {
    await saveTicketToTrip("official", officialHomeTicketsUrl);
    await safeOpenUrl(officialHomeTicketsUrl);
  }, [officialHomeTicketsUrl, row]);

  const openGoogleFallback = useCallback(async () => {
    await saveTicketToTrip("google", googleHomeTicketsertrticketsUrl);
    await safeOpenUrl(googleHomeTicketsUrl);
  }, [googleHomeTicketsUrl, row]);

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
              <ActivityIndicator />
            ) : !row ? (
              <EmptyState title="Match not found" message="Unable to load match." />
            ) : (
              <>
                <Text style={styles.title}>
                  {home} vs {away}
                </Text>

                <View style={{ marginTop: 10 }}>
                  <FixtureCertaintyBadge state={certainty} />
                </View>

                <Text style={styles.meta}>Kickoff: {kickoffDisplay ?? "—"}</Text>
                <Text style={styles.meta}>
                  Venue: {stadiumName} • {stadiumCity}
                </Text>

                <MatchdayLogisticsCard
                  logistics={logistics}
                  city={stadiumCity}
                  onOpenStop={async (q) =>
                    safeOpenUrl(`https://www.google.com/maps/search/?api=1&query=${enc(q)}`)
                  }
                  onSelectStayArea={() => {}}
                />

                <View style={{ gap: 10, marginTop: 14 }}>
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

/* styles unchanged */
