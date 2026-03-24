// app/match/[id].tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";
import Chip from "@/src/components/Chip";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { useFixture } from "@/src/hooks/useFixtures";
import { useTripsStore } from "@/src/state/trips";

import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";
import {
  resolveTicketForFixture,
  type TicketResolutionOption,
  type TicketResolutionResult,
} from "@/src/services/ticketResolver";

import { getStadiumByTeamFromRegistry } from "@/src/data/stadiumRegistry";
import { normalizeTeamKey } from "@/src/data/teams";

/* -------------------------------------------------------------------------- */
/* CORE HELPERS (STRIPPED BACK)                                               */
/* -------------------------------------------------------------------------- */

const clean = (v: unknown) => String(v ?? "").trim();

const formatKickoff = (iso?: string | null) => {
  if (!iso) return "Kick-off TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Kick-off TBC";

  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price?: string | null) => {
  const p = clean(price);
  if (!p) return "View price";
  if (/^[£€$]/.test(p)) return `From ${p}`;
  return p;
};

/* -------------------------------------------------------------------------- */
/* UI COMPONENTS                                                              */
/* -------------------------------------------------------------------------- */

function Crest({ name, uri }: { name: string; uri?: string | null }) {
  return (
    <View style={styles.crest}>
      {uri ? (
        <Image source={{ uri }} style={styles.crestImg} />
      ) : (
        <Text style={styles.crestFallback}>{name.slice(0, 2)}</Text>
      )}
    </View>
  );
}

function TicketCard({
  option,
  isBest,
  onPress,
  loading,
}: {
  option: TicketResolutionOption;
  isBest: boolean;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable
      style={[styles.ticketCard, isBest && styles.ticketBest]}
      onPress={onPress}
    >
      <Text style={styles.ticketPrice}>{formatPrice(option.priceText)}</Text>

      <Text style={styles.ticketMeta}>
        {option.exact ? "Exact match" : "Live availability"}
      </Text>

      <Text style={styles.ticketProvider}>{option.provider}</Text>

      <Text style={styles.ticketCTA}>
        {loading ? "Opening…" : "View tickets"}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fixtureId = clean((params as any)?.id);
  const tripId = clean((params as any)?.tripId);

  const { fixture, loading } = useFixture(fixtureId);

  const trip = useTripsStore((s) =>
    tripId ? s.trips.find((t) => t.id === tripId) : null
  );

  const [ticketResult, setTicketResult] =
    useState<TicketResolutionResult | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [openingUrl, setOpeningUrl] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* DATA                                                               */
  /* ------------------------------------------------------------------ */

  const home = clean(trip?.homeName ?? fixture?.teams?.home?.name);
  const away = clean(trip?.awayName ?? fixture?.teams?.away?.name);

  const kickoffIso = clean(trip?.kickoffIso ?? fixture?.fixture?.date);
  const kickoffText = formatKickoff(kickoffIso);

  const venue = clean(
    `${fixture?.fixture?.venue?.name ?? ""} ${fixture?.fixture?.venue?.city ?? ""}`
  );

  const crestHome = fixture?.teams?.home?.logo;
  const crestAway = fixture?.teams?.away?.logo;

  const stadium = useMemo(() => {
    return getStadiumByTeamFromRegistry(normalizeTeamKey(home));
  }, [home]);

  /* ------------------------------------------------------------------ */
  /* TICKETS                                                            */
  /* ------------------------------------------------------------------ */

  const options = useMemo(
    () => (ticketResult?.options ?? []).slice(0, 3),
    [ticketResult]
  );

  async function loadTickets() {
    if (loadingTickets) return;

    if (!home || !away || !kickoffIso) {
      Alert.alert("Match data not ready yet");
      return;
    }

    setLoadingTickets(true);

    try {
      const res = await resolveTicketForFixture({
        fixtureId,
        homeName: home,
        awayName: away,
        kickoffIso,
      });

      setTicketResult(res);
    } catch {
      Alert.alert("Couldn’t load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }

  async function openTicket(option: TicketResolutionOption) {
    if (!option.url) return;

    setOpeningUrl(option.url);

    try {
      if (tripId) {
        await beginPartnerClick({
          tripId,
          partnerId: option.provider as any,
          url: option.url,
          savedItemType: "tickets",
        });
      } else {
        await openUntrackedUrl(option.url);
      }
    } catch {
      Alert.alert("Couldn’t open");
    } finally {
      setOpeningUrl(null);
    }
  }

  /* ------------------------------------------------------------------ */
  /* NAV                                                                */
  /* ------------------------------------------------------------------ */

  const goBack = () => (tripId ? router.push(`/trip/${tripId}`) : router.back());

  const buildTrip = () => {
    router.push({
      pathname: "/trip/build",
      params: { fixtureId },
    });
  };

  /* ------------------------------------------------------------------ */
  /* GUARD                                                              */
  /* ------------------------------------------------------------------ */

  if (!fixtureId) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState title="Match not found" />
      </SafeAreaView>
    );
  }

