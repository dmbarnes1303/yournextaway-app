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
import { getSE365Tickets } from "@/src/services/se365";

import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import { kickoffIsoOrNull } from "@/src/utils/kickoffTbc";

import authStore from "@/src/state/auth";
import useFollowStore from "@/src/state/followStore";

type SE365Ticket = {
  price: number;
  currency: string;
  quantity: number;
  url: string;
  provider?: string;
};

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const id = String(params?.id ?? "");

  const [row, setRow] = useState<FixtureListRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tickets, setTickets] = useState<SE365Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [ticketModal, setTicketModal] = useState(false);

  const followedItem = useFollowStore(
    useMemo(() => {
      return (s: any) =>
        s.followed?.find((x: any) => String(x.fixtureId) === String(id)) ?? null;
    }, [id])
  );

  const upsertLatestSnapshot = useFollowStore((s) => s.upsertLatestSnapshot);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const r = await getFixtureById(id);
        if (cancelled) return;
        setRow(r);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load match");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const se365EventId = useMemo(() => {
    const anyRow: any = row;
    return (
      anyRow?.fixture?.sportsevents365EventId ??
      anyRow?.fixture?.se365EventId ??
      null
    );
  }, [row]);

  useEffect(() => {
    if (!se365EventId) return;

    let cancelled = false;

    async function loadTickets() {
      try {
        setTicketsLoading(true);
        const t = await getSE365Tickets(se365EventId);
        if (!cancelled) setTickets(t ?? []);
      } finally {
        setTicketsLoading(false);
      }
    }

    loadTickets();
    return () => {
      cancelled = true;
    };
  }, [se365EventId]);

  const home = row?.teams?.home?.name ?? "Home";
  const away = row?.teams?.away?.name ?? "Away";

  const kickoff = formatUkDateTimeMaybe(row?.fixture?.date);

  const certainty = getFixtureCertainty(row, {
    previousKickoffIso: followedItem?.kickoffIso ?? null,
  });

  const bestTicket = useMemo(() => {
    if (!tickets?.length) return null;
    return tickets.reduce((a, b) => (a.price < b.price ? a : b));
  }, [tickets]);

  const ticketTitle = bestTicket
    ? `Tickets from £${bestTicket.price}`
    : "Find home tickets";

  const ticketSub = bestTicket
    ? `${bestTicket.quantity} available`
    : "Sportsevents365";

  const openTickets = () => {
    if (bestTicket?.url) Linking.openURL(bestTicket.url);
  };

  const onPlanTrip = () => {
    if (!row) return;

    upsertLatestSnapshot(id, {
      kickoffIso: kickoffIsoOrNull(row),
      homeName: home,
      awayName: away,
      sportsevents365EventId: se365EventId,
      ticketPrice: bestTicket?.price ?? null,
    });

    router.push({
      pathname: "/trip/build",
      params: { fixtureId: id },
    } as any);
  };

  if (loading)
    return (
      <Background imageSource={getBackground("fixtures")}>
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </SafeAreaView>
      </Background>
    );

  if (error)
    return (
      <Background imageSource={getBackground("fixtures")}>
        <SafeAreaView>
          <EmptyState title="Error" message={error} />
        </SafeAreaView>
      </Background>
    );

  return (
    <Background imageSource={getBackground("fixtures")}>
      <Stack.Screen options={{ title: "Match", headerTransparent: true }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: 40 + insets.bottom,
          }}
        >
          <GlassCard>
            <Text style={styles.league}>{row?.league?.name}</Text>

            <Text style={styles.title}>
              {home} vs {away}
            </Text>

            <FixtureCertaintyBadge state={certainty} />

            <Text style={styles.meta}>Kickoff: {kickoff ?? "—"}</Text>
          </GlassCard>

          <GlassCard>
            <Pressable style={styles.ticketBtn} onPress={() => setTicketModal(true)}>
              <Text style={styles.ticketTitle}>{ticketTitle}</Text>
              <Text style={styles.ticketSub}>{ticketSub}</Text>
            </Pressable>
          </GlassCard>

          <GlassCard>
            <Pressable style={styles.tripBtn} onPress={onPlanTrip}>
              <Text style={styles.tripTitle}>Plan this trip</Text>
              <Text style={styles.tripSub}>Pre-fill with this match</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>

        <Modal visible={ticketModal} transparent animationType="fade">
          <Pressable style={styles.modalBg} onPress={() => setTicketModal(false)}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Home tickets</Text>

              {ticketsLoading && <ActivityIndicator />}

              {bestTicket ? (
                <>
                  <Text style={styles.modalPrice}>From £{bestTicket.price}</Text>
                  <Text style={styles.modalQty}>{bestTicket.quantity} available</Text>

                  <Pressable style={styles.modalBtn} onPress={openTickets}>
                    <Text style={styles.modalBtnText}>Open Sportsevents365</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.modalEmpty}>
                  No tickets found yet. Check again later.
                </Text>
              )}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  league: { color: theme.colors.primary, fontWeight: "800", fontSize: 12 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: "900", marginTop: 6 },
  meta: { color: theme.colors.textSecondary, marginTop: 8 },

  ticketBtn: { padding: 14 },
  ticketTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  ticketSub: { color: theme.colors.textSecondary, marginTop: 4 },

  tripBtn: { padding: 14 },
  tripTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  tripSub: { color: theme.colors.textSecondary },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  modal: { backgroundColor: "#111", padding: 20, borderRadius: 14 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  modalPrice: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 10 },
  modalQty: { color: "#aaa", marginTop: 4 },
  modalBtn: { marginTop: 14, backgroundColor: "#0f0", padding: 12, borderRadius: 10 },
  modalBtnText: { color: "#000", fontWeight: "900", textAlign: "center" },
  modalEmpty: { color: "#aaa", marginTop: 10 },
});
