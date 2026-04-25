// app/trip/[id].tsx

import React, { useMemo } from "react";
import {
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
import { theme } from "@/src/constants/theme";

import useTripWorkspace from "@/src/features/tripDetail/useTripWorkspace";
import useTripDetailData from "@/src/features/tripDetail/useTripDetailData";

import { coerceId } from "@/src/features/tripDetail/helpers";

// TEMP (will move to visualAssets later)
const CITY_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90";

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function getFixtureInfo(fixture: any) {
  return {
    homeName: fixture?.homeName || "Home",
    awayName: fixture?.awayName || "Away",
    leagueName: fixture?.leagueName || "Matchday",
    venue: fixture?.venue || "Stadium",
    kickoff: fixture?.kickoffIso || null,
    homeLogo: fixture?.homeLogo,
    awayLogo: fixture?.awayLogo,
  };
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

function TeamBadge({ logo, name }: any) {
  return (
    <View style={styles.badge}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.badgeImg} />
      ) : (
        <Text style={styles.badgeText}>{name?.slice(0, 2)}</Text>
      )}
    </View>
  );
}

export default function TripScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(
    () => coerceId((params as any)?.id),
    [params]
  );

  const workspace = useTripWorkspace({ routeTripId });
  const data = useTripDetailData({
    trip: workspace.trip,
    savedItems: workspace.savedItems,
    originIata: workspace.originIata,
  });

  const fixture = useMemo(
    () => getFixtureInfo(data.fixturesById?.[data.primaryMatchId]),
    [data]
  );

  const completion = Math.round(data.progress?.completionPct || 0);

  if (!workspace.trip) {
    return (
      <Background imageSource={null}>
        <SafeAreaView>
          <Text style={{ color: "#fff" }}>Loading trip…</Text>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageSource={null}>
      <Stack.Screen
        options={{
          headerTransparent: true,
          title: "",
          headerTintColor: "#fff",
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 90,
            paddingHorizontal: 20,
            paddingBottom: 40 + insets.bottom,
            gap: 22,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={styles.hero}>
            <ImageBackground
              source={{ uri: CITY_IMAGE }}
              style={styles.heroImg}
              imageStyle={styles.heroImgInner}
            >
              <View style={styles.heroOverlay} />

              <View style={styles.heroContent}>
                <Text style={styles.title}>
                  {fixture.homeName} vs {fixture.awayName}
                </Text>

                <Text style={styles.sub}>
                  {fixture.leagueName}
                </Text>

                <View style={styles.chips}>
                  <Text style={styles.chip}>{dateLabel(fixture.kickoff)}</Text>
                  <Text style={styles.chip}>{timeLabel(fixture.kickoff)}</Text>
                  <Text style={styles.chip}>{fixture.venue}</Text>
                </View>

                <View style={styles.badges}>
                  <TeamBadge {...fixture} logo={fixture.homeLogo} />
                  <Text style={styles.vs}>VS</Text>
                  <TeamBadge {...fixture} logo={fixture.awayLogo} />
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* TRIP STRIP */}
          <View style={styles.tripStrip}>
            <View>
              <Text style={styles.tripCity}>
                Trip to {data.cityName}
              </Text>
              <Text style={styles.tripMeta}>
                {workspace.trip.startDate} → {workspace.trip.endDate}
              </Text>
            </View>

            <Text style={styles.tripProgress}>{completion}%</Text>
          </View>

          {/* PRIMARY MATCH / TICKETS */}
          <GlassCard variant="brand" level="strong">
            <Text style={styles.sectionTitle}>Match & Tickets</Text>

            <Text style={styles.matchBig}>
              {fixture.homeName} vs {fixture.awayName}
            </Text>

            <Text style={styles.matchMeta}>
              {dateLabel(fixture.kickoff)} • {fixture.venue}
            </Text>

            <Pressable style={styles.cta}>
              <Text style={styles.ctaText}>Find ticket options</Text>
            </Pressable>
          </GlassCard>

          {/* ITINERARY */}
          <View>
            <Text style={styles.sectionTitle}>Your itinerary</Text>

            {["Tickets", "Stay", "Travel", "Things"].map((item) => (
              <View key={item} style={styles.row}>
                <Text style={styles.rowText}>{item}</Text>
                <Text style={styles.rowStatus}>Not started</Text>
              </View>
            ))}
          </View>

          {/* WALLET */}
          <GlassCard level="subtle">
            <Text style={styles.sectionTitle}>Wallet</Text>
            <Text style={styles.walletText}>
              {workspace.booked.length} booked • {workspace.pending.length} pending
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
    overflow: "hidden",
  },
  heroImg: {
    height: 260,
    justifyContent: "flex-end",
  },
  heroImgInner: {
    borderRadius: 28,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroContent: {
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },
  sub: {
    color: "#ccc",
    marginTop: 4,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    color: "#fff",
    fontSize: 12,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeImg: {
    width: 38,
    height: 38,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
  },
  vs: {
    color: "#fff",
    fontWeight: "900",
  },
  tripStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripCity: {
    color: "#fff",
    fontWeight: "900",
  },
  tripMeta: {
    color: "#888",
    marginTop: 2,
  },
  tripProgress: {
    color: "#22C55E",
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 10,
  },
  matchBig: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  matchMeta: {
    color: "#aaa",
    marginTop: 4,
  },
  cta: {
    marginTop: 14,
    backgroundColor: "#FACC15",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: {
    fontWeight: "900",
    color: "#000",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  rowText: {
    color: "#fff",
  },
  rowStatus: {
    color: "#777",
  },
  walletText: {
    color: "#aaa",
  },
});
