import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("../src/yna-logo.png");

type Feature = { title: string; body: string; accent?: "green" | "blue" | "gold" };

function FeatureCard({ title, body, accent = "green" }: Feature) {
  const accentStyle =
    accent === "blue"
      ? styles.accentBlue
      : accent === "gold"
      ? styles.accentGold
      : styles.accentGreen;

  return (
    <View style={styles.featureCard}>
      <View style={[styles.accentPip, accentStyle]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

export default function LandingScreen() {
  const router = useRouter();

  return (
    <Background imageUrl={getBackground("landing")} overlayOpacity={0.80}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand block */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logo} />
            </View>

            <Text style={styles.brandName}>YourNextAway</Text>

            <View style={styles.euPins}>
              <View style={styles.pinGreen} />
              <View style={styles.pinBlue} />
              <View style={styles.pinGold} />
            </View>

            <Text style={styles.brandTagline}>Football-first European city breaks</Text>
          </View>

          {/* Main pitch card */}
          <GlassCard style={styles.heroCard} intensity={22}>
            <Text style={styles.h1}>Plan a trip around a match — properly.</Text>

            <Text style={styles.sub}>
              YourNextAway turns fixtures into a complete short-break plan. Find a match, pick the best city option,
              save the trip, then build it out with stays, transport, and practical city guidance — in one flow.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>What you can do</Text>

            <View style={styles.features}>
              <FeatureCard
                accent="green"
                title="Real fixtures, real dates"
                body="Browse upcoming games by league and date window, then open a match to start planning instantly."
              />
              <FeatureCard
                accent="blue"
                title="City-aware trip building"
                body="Save trips with dates, notes, and a destination anchor — designed for quick weekend planning."
              />
              <FeatureCard
                accent="gold"
                title="Explore like a traveller"
                body="Built for neutral travellers visiting cities. You get practical ‘what to do’ guidance, not supporter culture."
              />
            </View>

            <View style={styles.valueRow}>
              <View style={styles.valueChip}>
                <Text style={styles.valueChipKicker}>Designed for</Text>
                <Text style={styles.valueChipMain}>Fast decisions</Text>
              </View>
              <View style={styles.valueChip}>
                <Text style={styles.valueChipKicker}>Optimised for</Text>
                <Text style={styles.valueChipMain}>Weekend breaks</Text>
              </View>
              <View style={styles.valueChip}>
                <Text style={styles.valueChipKicker}>Focused on</Text>
                <Text style={styles.valueChipMain}>Reliability</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Upgrades coming in the full experience</Text>
            <Text style={styles.upgradeNote}>
              This build is the core flow. The finished experience expands the trip into a full planner:
            </Text>

            <View style={styles.upgrades}>
              <Text style={styles.bullet}>• Stays: shortlists, map-friendly areas, and “best base” suggestions</Text>
              <Text style={styles.bullet}>• Flights/transport: route ideas, airport links, and quick comparisons</Text>
              <Text style={styles.bullet}>• City guides: neighbourhoods, simple itineraries, and practical tips</Text>
              <Text style={styles.bullet}>• Ticket links + reminders (optional), so you don’t miss key steps</Text>
              <Text style={styles.bullet}>• Saved trips + wallet storage for bookings and references</Text>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={() => router.push("/onboarding")} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Get started</Text>
              </Pressable>

              <Pressable onPress={() => router.replace("/(tabs)/home")} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Skip for now</Text>
              </Pressable>
            </View>

            <Text style={styles.micro}>
              Neutral travel planning — built for exploring European cities around fixtures.
            </Text>
          </GlassCard>

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 18,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 14,
  },

  brand: {
    alignItems: "center",
    paddingTop: 10,
    gap: 10,
  },

  // MUCH bigger logo
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  logo: { width: 92, height: 92, resizeMode: "contain" },

  brandName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    marginTop: 2,
  },

  euPins: { flexDirection: "row", gap: 8, alignItems: "center" },
  pinGreen: { width: 28, height: 5, borderRadius: 999, backgroundColor: "rgba(0,255,136,0.70)" },
  pinBlue: { width: 18, height: 5, borderRadius: 999, backgroundColor: "rgba(0, 92, 175, 0.55)" },
  pinGold: { width: 14, height: 5, borderRadius: 999, backgroundColor: "rgba(255, 196, 46, 0.60)" },

  brandTagline: {
    color: "rgba(255,255,255,0.64)",
    fontSize: theme.fontSize.sm,
    fontWeight: "800",
  },

  heroCard: { padding: theme.spacing.lg },

  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900",
    marginBottom: 10,
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },

  divider: {
    marginTop: 14,
    marginBottom: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
    marginBottom: 10,
  },

  features: { gap: 10 },

  featureCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  accentPip: { width: 10, height: 10, borderRadius: 999, marginTop: 4 },
  accentGreen: { backgroundColor: "rgba(0,255,136,0.85)" },
  accentBlue: { backgroundColor: "rgba(0,92,175,0.85)" },
  accentGold: { backgroundColor: "rgba(255,196,46,0.90)" },

  featureTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  featureBody: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  valueRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  valueChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  valueChipKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900" },
  valueChipMain: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "900" },

  upgradeNote: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    marginBottom: 8,
  },

  upgrades: {
    gap: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  bullet: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  actions: { marginTop: theme.spacing.lg, gap: 12 },

  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.45)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  btnGhost: { borderColor: theme.colors.border, backgroundColor: "rgba(0,0,0,0.25)" },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.md },

  micro: {
    marginTop: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
  },
});
