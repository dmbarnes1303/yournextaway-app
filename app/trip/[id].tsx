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
  type ImageSourcePropType,
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

/* ================================
   CORE FIX: NORMALIZE FIXTURE DATA
================================ */

function clean(v: any) {
  return String(v ?? "").trim();
}

function getFixtureUi(fixture: any, trip: any) {
  const homeName =
    clean(fixture?.teams?.home?.name) ||
    clean(trip?.homeName) ||
    "Home";

  const awayName =
    clean(fixture?.teams?.away?.name) ||
    clean(trip?.awayName) ||
    "Away";

  const leagueName =
    clean(fixture?.league?.name) ||
    clean(trip?.leagueName) ||
    "Matchday";

  const venue =
    clean(fixture?.fixture?.venue?.name) ||
    clean(trip?.venueName) ||
    "Stadium";

  const kickoffIso =
    clean(fixture?.fixture?.date) ||
    clean(trip?.kickoffIso) ||
    null;

  const homeLogo = clean(fixture?.teams?.home?.logo) || null;
  const awayLogo = clean(fixture?.teams?.away?.logo) || null;

  const status = clean(fixture?.fixture?.status?.short).toUpperCase();

  const kickoffDate = kickoffIso ? new Date(kickoffIso) : null;
  const valid = kickoffDate && Number.isFinite(kickoffDate.getTime());

  const tbc =
    !valid ||
    status === "TBD" ||
    status === "TBA" ||
    status === "PST" ||
    Boolean(trip?.kickoffTbc);

  return {
    homeName,
    awayName,
    leagueName,
    venue,
    kickoffIso,
    homeLogo,
    awayLogo,
    tbc,
  };
}

/* ================================
   FORMATTERS
================================ */

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

/* ================================
   UI HELPERS
================================ */

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function TeamBadge({ logo, name }: any) {
  return (
    <View style={styles.badgeWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.badgeImg} />
      ) : (
        <Text style={styles.badgeFallback}>{initials(name)}</Text>
      )}
    </View>
  );
}

/* ================================
   MAIN SCREEN
================================ */

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
    ? data.fixturesById?.[String(data.primaryMatchId)]
    : null;

  const fx = useMemo(() => getFixtureUi(fixture, trip), [fixture, trip]);

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
                  {fx.homeName} vs {fx.awayName}
                </Text>

                <Text style={styles.sub}>{fx.leagueName}</Text>

                <View style={styles.chips}>
                  <Text style={styles.chip}>{dateLabel(fx.kickoffIso)}</Text>
                  <Text style={styles.chip}>
                    {fx.tbc ? "Kickoff TBC" : timeLabel(fx.kickoffIso)}
                  </Text>
                  <Text style={styles.chip}>{fx.venue}</Text>
                </View>

                <View style={styles.badges}>
                  <TeamBadge logo={fx.homeLogo} name={fx.homeName} />
                  <Text style={styles.vs}>VS</Text>
                  <TeamBadge logo={fx.awayLogo} name={fx.awayName} />
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* MATCH CARD */}
          <GlassCard>
            <Text style={styles.sectionTitle}>Match & Tickets</Text>

            <Text style={styles.matchBig}>
              {fx.homeName} vs {fx.awayName}
            </Text>

            <Text style={styles.matchMeta}>
              {dateLabel(fx.kickoffIso)} • {fx.venue}
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
        </ScrollView>
      </SafeAreaView>

      <TicketOptionsSheet
        visible={controller.ticketSheet.visible}
        matchLabel={`${fx.homeName} vs ${fx.awayName}`}
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

/* ================================
   STYLES
================================ */

const styles = StyleSheet.create({
  hero: { borderRadius: 28, overflow: "hidden" },
  heroImg: { height: 260, justifyContent: "flex-end" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
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

  badges: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 14,
  },

  badgeWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  badgeImg: { width: 50, height: 50 },
  badgeFallback: { color: "#fff", fontWeight: "900" },

  vs: { color: "#FACC15", fontWeight: "900" },

  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 18 },
  matchBig: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 8 },
  matchMeta: { color: "#aaa", marginTop: 4 },

  cta: {
    marginTop: 14,
    backgroundColor: "#FACC15",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  ctaText: { fontWeight: "900", color: "#000" },
});
