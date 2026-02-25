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

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import { getMatchdayLogistics } from "@/src/data/matchdayLogistics";
import { getStadiumByHomeTeam } from "@/src/data/stadiums";

import savedItemsStore from "@/src/state/savedItems";
import { registerPartnerClick } from "@/src/services/partnerReturnBootstrap";

/* -------------------------------------------------------------------------- */
/* helpers */
/* -------------------------------------------------------------------------- */

function enc(v: string) {
  return encodeURIComponent(v);
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

  const id = String((params as any)?.id ?? "").trim();

  const [row, setRow] = useState<FixtureListRow | null>(null);
  const [loading, setLoading] = useState(false);

  const [ticketModalOpen, setTicketModalOpen] = useState(false);

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

  const home = row?.teams?.home?.name ?? "Home";
  const away = row?.teams?.away?.name ?? "Away";

  const kickoffDisplay = formatUkDateTimeMaybe(row?.fixture?.date);

  const stadiumMeta = useMemo(() => getStadiumByHomeTeam(home), [home]);
  const logistics = useMemo(() => getMatchdayLogistics({ homeTeamName: home }), [home]);

  const stadiumName = stadiumMeta?.name ?? row?.fixture?.venue?.name ?? "";
  const stadiumCity = stadiumMeta?.city ?? row?.fixture?.venue?.city ?? "";

  const mapsUrl = useMemo(() => {
    const q = [stadiumName, stadiumCity].filter(Boolean).join(" ");
    return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
  }, [stadiumName, stadiumCity]);

  const certainty = useMemo(() => {
    return getFixtureCertainty(row, {});
  }, [row]);

  /* -------------------------------------------------------------------------- */
  /* SAVE TICKET → TRIP WALLET */
  /* -------------------------------------------------------------------------- */

  const saveTicketToTrip = useCallback(
    async (provider: string, url: string) => {
      if (!row) return;

      try {
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

  /* -------------------------------------------------------------------------- */
  /* TICKET LINKS */
  /* -------------------------------------------------------------------------- */

  const se365Url = useMemo(() => {
    const query = `${home} vs ${away}`;
    return `https://www.sportsevents365.com/search?q=${enc(query)}`;
  }, [home, away]);

  const officialUrl = useMemo(() => {
    return `https://www.google.com/search?q=${enc(home + " tickets")}`;
  }, [home]);

  const googleUrl = useMemo(() => {
    return `https://www.google.com/search?q=${enc(home + " vs " + away + " tickets")}`;
  }, [home, away]);

  /* -------------------------------------------------------------------------- */
  /* UI actions */
  /* -------------------------------------------------------------------------- */

  const openSe365 = async () => {
    setTicketModalOpen(false);
    await saveTicketToTrip("sportsevents365", se365Url);
    await safeOpenUrl(se365Url);
  };

  const openOfficial = async () => {
    setTicketModalOpen(false);
    await saveTicketToTrip("official", officialUrl);
    await safeOpenUrl(officialUrl);
  };

  const openGoogle = async () => {
    setTicketModalOpen(false);
    await saveTicketToTrip("google", googleUrl);
    await safeOpenUrl(googleUrl);
  };

  const onShare = async () => {
    const text = `${home} vs ${away}\n${kickoffDisplay}\n${stadiumName}`;
    try {
      await Share.share({ message: text });
    } catch {}
  };

  /* -------------------------------------------------------------------------- */
  /* render */
  /* -------------------------------------------------------------------------- */

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
                  onOpenStop={async (q) => safeOpenUrl(`https://www.google.com/maps/search/?api=1&query=${enc(q)}`)}
                  onSelectStayArea={() => {}}
                />

                <View style={{ gap: 10, marginTop: 14 }}>
                  <Pressable style={styles.primaryBtn} onPress={() => setTicketModalOpen(true)}>
                    <Text style={styles.btnText}>Find home tickets</Text>
                  </Pressable>

                  <Pressable style={styles.secondaryBtn} onPress={() => safeOpenUrl(mapsUrl)}>
                    <Text style={styles.btnText}>Open maps</Text>
                  </Pressable>

                  <Pressable style={styles.secondaryBtn} onPress={onShare}>
                    <Text style={styles.btnText}>Share</Text>
                  </Pressable>
                </View>
              </>
            )}
          </GlassCard>
        </ScrollView>

        {/* Ticket modal */}
        <Modal visible={ticketModalOpen} transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setTicketModalOpen(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Home tickets</Text>

              <Pressable style={styles.modalBtn} onPress={openSe365}>
                <Text style={styles.modalBtnText}>Sportsevents365</Text>
              </Pressable>

              <Pressable style={styles.modalBtn} onPress={openOfficial}>
                <Text style={styles.modalBtnText}>Official club</Text>
              </Pressable>

              <Pressable style={styles.modalBtn} onPress={openGoogle}>
                <Text style={styles.modalBtnText}>Google search</Text>
              </Pressable>

              <Pressable style={styles.modalCancel} onPress={() => setTicketModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
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
    fontSize: 22,
    fontWeight: "900",
  },

  meta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },

  primaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.6)",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    alignItems: "center",
  },

  btnText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#111",
    gap: 10,
  },

  modalTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
  },

  modalBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    alignItems: "center",
  },

  modalBtnText: {
    color: "#fff",
    fontWeight: "800",
  },

  modalCancel: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: "center",
  },

  modalCancelText: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
  },
});
