// app/onboarding.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const LOGO = require("../src/yna-logo.png");

// Use the local files you already committed
const BG_1 = require("../src/assets/backgrounds/onboarding-1.png");
const BG_2 = require("../src/assets/backgrounds/onboarding-2.png");
const BG_3 = require("../src/assets/backgrounds/onboarding-3.png");
const BG_4 = require("../src/assets/backgrounds/onboarding-4.png");

type Step = {
  title: string;
  subtitle: string;
  body: string;
  bg: any;
};

const STEPS: Step[] = [
  {
    title: "Start With A Fixture",
    subtitle: "Find The Right Match For Your Dates",
    body:
      "Browse fixtures across the top leagues, lock in your date window, and open a match to anchor the trip. From that moment, YourNextAway turns the fixture into a complete city-break plan.",
    bg: BG_1,
  },
  {
    title: "Build The Trip In One Hub",
    subtitle: "Flights, Stays, Tickets, And Notes Together",
    body:
      "Compare travel options, shortlist where to stay, and keep ticket links and trip notes organised in one place. Plan midweek bargains or weekend breaks without juggling tabs, screenshots, and group chats.",
    bg: BG_2,
  },
  {
    title: "Make The City Break Better",
    subtitle: "What To Do, Where To Base Yourself",
    body:
      "Use city and team guidance to shape the trip beyond the match. Build a simple itinerary, then store bookings and references so everything is ready when you travel.",
    bg: BG_3,
  },
  {
    title: "Set your defaults",
    subtitle: "So fixtures and budgets feel personal",
    body:
      "Optional. You can change any of this later in Profile. We use it to pre-fill comparisons and quick picks.",
    bg: BG_4,
  },
];

export default function Onboarding() {
  const [stepIndex, setStepIndex] = useState(0);

  const step = useMemo(() => STEPS[stepIndex] ?? STEPS[0], [stepIndex]);

  const goHome = () => router.replace("/(tabs)/home");

  const next = () => setStepIndex((s) => Math.min(s + 1, 3));
  const back = () => setStepIndex((s) => Math.max(s - 1, 0));

  return (
    <ImageBackground source={step.bg} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          {stepIndex > 0 ? (
            <Pressable onPress={back} style={styles.pill}>
              <Text style={styles.pillText}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ width: 74 }} />
          )}

          <Pressable onPress={goHome} style={styles.pill}>
            <Text style={styles.pillText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.brand}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>Step {stepIndex + 1} of 4</Text>
          <Text style={styles.h1}>{step.title}</Text>
          <Text style={styles.h2}>{step.subtitle}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={`dot-${i}`} style={[styles.dot, i === stepIndex && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={goHome} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Skip For Now</Text>
            </Pressable>

            <Pressable onPress={stepIndex === 3 ? goHome : next} style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>{stepIndex === 3 ? "Browse Fixtures" : "Continue"}</Text>
            </Pressable>
          </View>

          <Text style={styles.micro}>Football-first city breaks. Planned properly.</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" },

  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, justifyContent: "space-between" },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 74,
    alignItems: "center",
  },
  pillText: { color: "rgba(255,255,255,0.75)", fontWeight: "900", fontSize: 12 },

  brand: { alignItems: "center", marginTop: 18 },
  logo: { width: 110, height: 110 },
  tagline: { marginTop: 6, color: "#00FF88", fontWeight: "900", letterSpacing: 0.6, fontSize: 12 },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(0,0,0,0.12)",
    padding: 18,
  },

  kicker: { color: "rgba(255,255,255,0.65)", fontWeight: "900", fontSize: 11, marginBottom: 8 },
  h1: { color: "#fff", fontSize: 34, fontWeight: "900", lineHeight: 36 },
  h2: { color: "#fff", fontSize: 13, fontWeight: "900", marginTop: 6, marginBottom: 10, opacity: 0.92 },
  body: { color: "rgba(255,255,255,0.70)", fontSize: 15, lineHeight: 22, fontWeight: "700" },

  dots: { marginTop: 14, flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" },
  dotActive: { backgroundColor: "#00FF88" },

  actions: { marginTop: 18, flexDirection: "row", gap: 12 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  btnPrimary: { borderColor: "#00FF88", backgroundColor: "rgba(0,0,0,0.50)" },
  btnPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  btnGhost: { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.22)" },
  btnGhostText: { color: "rgba(255,255,255,0.75)", fontWeight: "900", fontSize: 15 },

  micro: { marginTop: 12, textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "800" },
});
