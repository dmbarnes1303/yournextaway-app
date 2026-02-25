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
import tripsStore from "@/src/state/trips";

import {
  computeLikelyPlaceholderTbcIds,
  isKickoffTbc,
  kickoffIsoOrNull,
  CONFIRMED_WITHIN_DAYS,
} from "@/src/utils/kickoffTbc";

import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import { getTicketGuide } from "@/src/data/ticketGuides";
import { getMatchdayLogistics } from "@/src/data/matchdayLogistics";
import { getStadiumByHomeTeam } from "@/src/data/stadiums";

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
  const u = String(url ?? "").trim();
  if (!u) return;
  const hasScheme = /^https?:\/\//i.test(u);
  const candidate = hasScheme ? u : `https://${u}`;
  try {
    const can = await Linking.canOpenURL(candidate);
    if (!can) throw new Error();
    await Linking.openURL(candidate);
  } catch {
    Alert.alert("Couldn’t open link");
  }
}

/* -------------------------------------------------------------------------- */

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const id = useMemo(() => coerceString((params as any)?.id), [params]);

  const [row, setRow] = useState<FixtureListRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ticketModal, setTicketModal] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* Load fixture                                                               */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const r = await getFixtureById(id);
        if (!cancelled) setRow(r);
      } catch {
        if (!cancelled) setError("Failed to load match");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* -------------------------------------------------------------------------- */
  /* Derived                                                                     */
  /* -------------------------------------------------------------------------- */

  const home = row?.teams?.home?.name ?? "";
  const away = row?.teams?.away?.name ?? "";
  const kickoffIso = row?.fixture?.date ?? null;

  const venue = row?.fixture?.venue?.name ?? "";
  const city = row?.fixture?.venue?.city ?? "";

  const stadiumMeta = useMemo(() => getStadiumByHomeTeam(home), [home]);

  const se365Url = useMemo(() => {
    const query = `${home} vs ${away}`;
    return `https://www.sportsevents365.com/search?q=${enc(query)}&a_aid=69834e80ec9d3`;
  }, [home, away]);

  const officialUrl = useMemo(() => {
    return `https://www.google.com/search?q=${enc(home + " tickets")}`;
  }, [home]);

  /* -------------------------------------------------------------------------- */
  /* Save ticket into trip wallet                                               */
  /* -------------------------------------------------------------------------- */

  const saveTicketToTrip = useCallback(
    async (provider: "se365" | "official" | "google", url: string) => {
      if (!row) return;

      try {
        const trips = tripsStore.getState().items ?? [];
        let trip = trips.find((t: any) => String(t.fixtureId) === String(row.fixture.id));

        if (!trip) {
          trip = await tripsStore.getState().add({
            fixtureId: row.fixture.id,
            title: `${home} vs ${away}`,
            kickoffIso,
            city: stadiumMeta?.city ?? city ?? null,
          });
        }

        await savedItemsStore.add({
          tripId: trip.id,
          type: "tickets",
          title: `${home} vs ${away} tickets`,
          status: "pending",
          partnerId: provider,
          partnerUrl: url,
          metadata: {
            fixtureId: row.fixture.id,
            home,
            away,
            kickoffIso,
          },
        });

        showToast("Ticket saved to trip");
      } catch {
        // silent
      }
    },
    [row, home, away, kickoffIso, stadiumMeta, city, showToast]
  );

  /* -------------------------------------------------------------------------- */
  /* Ticket actions                                                             */
  /* -------------------------------------------------------------------------- */

  const openSe365 = useCallback(async () => {
    setTicketModal(false);
    await saveTicketToTrip("se365", se365Url);
    await safeOpenUrl(se365Url);
  }, [saveTicketToTrip, se365Url]);

  const openOfficial = useCallback(async () => {
    setTicketModal(false);
    await saveTicketToTrip("official", officialUrl);
    await safeOpenUrl(officialUrl);
  }, [saveTicketToTrip, officialUrl]);

  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </SafeAreaView>
      </Background>
    );
  }

  if (error || !row) {
    return (
      <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
        <SafeAreaView style={{ flex: 1 }}>
          <EmptyState title="Match unavailable" message={error ?? ""} />
        </SafeAreaView>
      </Background>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* UI                                                                         */
  /* -------------------------------------------------------------------------- */

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <Stack.Screen options={{ headerShown: true, title: "Match", headerTransparent: true }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 100 }}>
          <GlassCard>
            <Text style={styles.league}>{row.league?.name}</Text>

            <Text style={styles.title}>
              {home} vs {away}
            </Text>

            <Text style={styles.meta}>{formatUkDateTimeMaybe(kickoffIso)}</Text>
            <Text style={styles.meta}>
              {venue} • {city}
            </Text>

            <Pressable style={styles.primaryBtn} onPress={() => setTicketModal(true)}>
              <Text style={styles.primaryBtnText}>Find home tickets</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        <Modal visible={ticketModal} transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setTicketModal(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Home tickets</Text>

              <Pressable style={styles.modalBtn} onPress={openSe365}>
                <Text style={styles.modalBtnText}>Sportsevents365</Text>
              </Pressable>

              <Pressable style={styles.modalBtn} onPress={openOfficial}>
                <Text style={styles.modalBtnText}>Official club</Text>
              </Pressable>

              <Pressable style={styles.modalBtn} onPress={() => setTicketModal(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  league: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 12,
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
  },
  meta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },
  primaryBtn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,255,136,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.4)",
  },
  primaryBtnText: {
    textAlign: "center",
    fontWeight: "900",
    color: theme.colors.text,
  },
  toast: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  toastText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  modalBtn: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
});
