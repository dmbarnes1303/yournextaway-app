// app/trip/[id].tsx

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import TicketOptionsSheet from "@/src/components/tickets/TicketOptionsSheet";

import { getBackground, getCityBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import useTripWorkspace from "@/src/features/tripDetail/useTripWorkspace";
import useTripDetailData from "@/src/features/tripDetail/useTripDetailData";
import useTripDetailController from "@/src/features/tripDetail/useTripDetailController";

import { coerceId } from "@/src/features/tripDetail/helpers";

function clean(v: any) {
  return String(v ?? "").trim();
}

function dateLabel(v?: string | null) {
  if (!v) return "Date TBC";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "Date TBC";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function timeLabel(v?: string | null) {
  if (!v) return "TBC";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "TBC";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function nightsLine(start?: string, end?: string) {
  const s = new Date(start || "");
  const e = new Date(end || "");
  if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) return "";
  const nights = Math.round((e.getTime() - s.getTime()) / 86400000);
  return `${nights} nights`;
}

function getInsight({ kickoff, home, away }: any) {
  if (!kickoff) return "Kickoff not confirmed yet";
  const hour = new Date(kickoff).getHours();

  if (home && away && home !== "Home" && away !== "Away") {
    return "High demand fixture — tickets move fast";
  }

  if (hour >= 17) return "Evening kickoff — perfect for weekend trip";

  return "Plan your trip around this fixture";
}

function getTicketInsight(hasMatch: boolean) {
  if (!hasMatch) return "Add a match to unlock ticket routes";
  return "Compare official & resale routes ranked by reliability";
}

function getItineraryDetail(key: string, state: string) {
  if (state === "booked") return "Confirmed";

  switch (key) {
    case "tickets":
      return "No ticket route saved";
    case "stay":
      return "No hotels saved";
    case "travel":
      return "No routes planned";
    case "things":
      return "No activities added";
    default:
      return "Not started";
  }
}

function TeamBadge({ logo }: any) {
  if (!logo) return null;

  return (
    <Image
      source={{ uri: logo }}
      style={{ width: 64, height: 64 }}
      resizeMode="contain"
    />
  );
}

export default function TripScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [ticketLoading, setTicketLoading] = useState(false);

  const routeTripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const workspace = useTripWorkspace({ routeTripId });

  const trip = workspace.trip;

  const data = useTripDetailData({
    trip,
    savedItems: workspace.savedItems,
    originIata: workspace.originIata,
  });

  const controller = useTripDetailController({
    trip,
    activeTripId: workspace.activeTripId,
    cityName: data.cityName,
    primaryLeagueId: data.primaryLeagueId,
    fixturesById: data.fixturesById,
    ticketsByMatchId: data.ticketsByMatchId,
    affiliateUrls: data.affiliateUrls,
    setTicketLoading,
    setActiveWorkspaceSection: workspace.setActiveSection,
  });

  const fixture = data.primaryMatchId
    ? data.fixturesById?.[data.primaryMatchId]
    : null;

  const home = fixture?.homeName || "Home";
  const away = fixture?.awayName || "Away";

  const completion = Math.round(data.progress?.completionPct || 0);

  const cityImage = getCityBackground(data.cityName || "rome");

  if (!trip) {
    return (
      <Background imageSource={getBackground("trip")}>
        <SafeAreaView>
          <Text style={{ color: "#fff" }}>Loading…</Text>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageSource={getBackground("trip")}>
      <Stack.Screen options={{ headerTransparent: true, title: "" }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 90,
            paddingHorizontal: 20,
            paddingBottom: 40 + insets.bottom,
            gap: 22,
          }}
        >
          {/* HERO */}
          <View style={styles.hero}>
            <ImageBackground
              source={{ uri: cityImage as string }}
              style={styles.heroImg}
              imageStyle={{ borderRadius: 28 }}
            >
              <View style={styles.overlay} />

              <View style={styles.heroContent}>
                <Text style={styles.title}>
                  {home} vs {away}
                </Text>

                <Text style={styles.sub}>
                  {fixture?.leagueName || "Matchday"}
                </Text>

                <View style={styles.chips}>
                  <Text style={styles.chip}>{dateLabel(fixture?.kickoffIso)}</Text>
                  <Text style={styles.chip}>{timeLabel(fixture?.kickoffIso)}</Text>
                  <Text style={styles.chip}>{fixture?.venue || "Stadium"}</Text>
                </View>

                {/* 🔥 INSIGHT LINE */}
                <Text style={styles.insight}>
                  {getInsight({
                    kickoff: fixture?.kickoffIso,
                    home,
                    away,
                  })}
                </Text>

                <View style={styles.badges}>
                  <TeamBadge logo={fixture?.homeLogo} />
                  <Text style={styles.vs}>VS</Text>
                  <TeamBadge logo={fixture?.awayLogo} />
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* TRIP */}
          <View style={styles.tripStrip}>
            <View>
              <Text style={styles.tripCity}>Trip to {data.cityName}</Text>
              <Text style={styles.tripMeta}>
                {trip.startDate} → {trip.endDate}
              </Text>
              <Text style={styles.tripSub}>
                {nightsLine(trip.startDate, trip.endDate)} • {completion}% booked
              </Text>
            </View>

            <Text style={styles.tripProgress}>{completion}%</Text>
          </View>

          {/* MATCH CARD */}
          <GlassCard variant="brand" level="strong">
            <Text style={styles.sectionTitle}>Match & Tickets</Text>

            <Text style={styles.matchBig}>
              {home} vs {away}
            </Text>

            <Text style={styles.matchMeta}>
              {dateLabel(fixture?.kickoffIso)} • {fixture?.venue}
            </Text>

            {/* 🔥 CONFIDENCE LINE */}
            <Text style={styles.ticketInsight}>
              {getTicketInsight(!!data.primaryMatchId)}
            </Text>

            <Pressable
              style={styles.cta}
              onPress={() => {
                if (data.primaryMatchId) {
                  controller.openTicketsForMatch(data.primaryMatchId);
                } else {
                  controller.onAddMatch();
                }
              }}
            >
              <Text style={styles.ctaText}>Find ticket options</Text>
            </Pressable>

            {ticketLoading && <ActivityIndicator />}
          </GlassCard>

          {/* ITINERARY */}
          <View>
            <Text style={styles.sectionTitle}>Your itinerary</Text>

            {["tickets", "stay", "travel", "things"].map((k) => (
              <View key={k} style={styles.row}>
                <View>
                  <Text style={styles.rowText}>{k.toUpperCase()}</Text>
                  <Text style={styles.rowSub}>
                    {getItineraryDetail(k, data.progress?.[k])}
                  </Text>
                </View>
                <Text style={styles.rowStatus}>
                  {data.progress?.[k] === "booked"
                    ? "Confirmed"
                    : "Not started"}
                </Text>
              </View>
            ))}
          </View>

          {/* WALLET */}
          <GlassCard>
            <Text style={styles.sectionTitle}>Wallet</Text>
            <Text style={styles.walletText}>
              {workspace.booked.length} booked • {workspace.pending.length} pending
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>

      <TicketOptionsSheet
        visible={controller.ticketSheet.visible}
        matchLabel={`${home} vs ${away}`}
        subtitle="Compare ticket routes"
        strongOptions={controller.ticketSheet.payload?.strongOptions || []}
        weakOptions={controller.ticketSheet.payload?.weakOptions || []}
        onClose={controller.closeTicketSheet}
        onSelect={controller.onSelectTicketSheetOption}
        onCompareAll={controller.onCompareAllTickets}
      />
    </Background>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 28, overflow: "hidden" },
  heroImg: { height: 260, justifyContent: "flex-end" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroContent: { padding: 20 },

  title: { color: "#fff", fontSize: 26, fontWeight: "900" },
  sub: { color: "#ccc", marginTop: 4 },

  chips: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  chip: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 10,
    color: "#fff",
    fontSize: 12,
  },

  insight: {
    marginTop: 10,
    color: "#86EFAC",
    fontWeight: "800",
  },

  badges: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 14,
  },

  vs: { color: "#FACC15", fontWeight: "900" },

  tripStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tripCity: { color: "#fff", fontWeight: "900" },
  tripMeta: { color: "#888" },
  tripSub: { color: "#666", marginTop: 2 },
  tripProgress: { color: "#22C55E", fontWeight: "900" },

  sectionTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 10,
  },

  matchBig: { color: "#fff", fontSize: 20, fontWeight: "900" },
  matchMeta: { color: "#aaa", marginTop: 4 },

  ticketInsight: {
    color: "#86EFAC",
    marginTop: 6,
    fontWeight: "800",
  },

  cta: {
    marginTop: 14,
    backgroundColor: "#FACC15",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: { fontWeight: "900", color: "#000" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  rowText: { color: "#fff" },
  rowSub: { color: "#777", fontSize: 12 },
  rowStatus: { color: "#777" },

  walletText: { color: "#aaa" },
});
