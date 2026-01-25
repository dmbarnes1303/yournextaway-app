import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("../src/yna-logo.png");

// NOTE: Only headings/subheadings use Title Case.
// Body copy uses normal sentence casing.
type Feature = { title: string; body: string; accent: "green" | "blue" | "gold" };

function FeatureCard({ title, body, accent }: Feature) {
  const accentStyle = accent === "green" ? styles.pipGreen : accent === "blue" ? styles.pipBlue : styles.pipGold;

  return (
    <View style={styles.featureCard}>
      <View style={[styles.pip, accentStyle]} />
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
    // IMPORTANT: If this still looks blue, your landing background image is blue-toned.
    // Fix is in backgrounds.ts: point "landing" to a neutral/dark image (stadium/night/black).
    <Background imageUrl={getBackground("landing")} overlayOpacity={0.90}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Brand */}
          <View style={styles.brand}>
            {/* No outer circle. Logo itself should be large. */}
            <Image source={LOGO} style={styles.logo} />

            {/* Remove app name text (logo already contains it). */}
            <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
          </View>

          {/* Pitch */}
          <GlassCard style={styles.heroCard} intensity={22}>
            <Text style={styles.h1}>Plan A Trip Around A Match — Properly.</Text>

            <Text style={styles.sub}>
              YourNextAway turns fixtures into a complete short-break plan. Find a match, pick the best city option,
              save the trip, then build it out with stays, transport, and practical city guidance — in one flow.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>What You Can Do</Text>

            <View style={styles.features}>
              <FeatureCard
                title="Real Fixtures, Real Dates"
                body="Browse upcoming games by league and date window, then open a match to start planning instantly."
                accent="green"
              />
              <FeatureCard
                title="City-Aware Trip Building"
                body="Save trips with dates, notes, and a destination anchor — designed for quick weekend planning."
                accent="blue"
              />
              <FeatureCard
                title="Explore Like A Traveller"
                body="Built for neutral travellers visiting cities. You get practical ‘what to do’ guidance — not supporter culture."
                accent="gold"
              />
            </View>

            <View style={styles.valueRow}>
              <View style={styles.valueChip}>
                <Text style={styles.valueChipKicker}>Designed For</Text>
                <Text style={styles.valueChipMain}>Fast Decisions</Text>
              </View>

              <View style={styles.valueChip}>
                <Text style={styles.valueChipKicker}>Optimised For</Text>
                <Text style={styles.valueChipMain}>Weekend Breaks</Text>
              </View>

              <View style={styles.valueChip}>
                {/* Force the two-line label exactly as requested */}
                <Text style={styles.valueChipKicker}>Focused{"\n"}On</Text>

                {/* Keep reliability on one line */}
                <Text style={styles.valueChipMain} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.92}>
                  Reliability
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Upgrades In The Full Experience</Text>
            <Text style={styles.upgradeNote}>
              This build covers the core flow. The finished experience expands each trip into a full planner:
            </Text>

            <View style={styles.upgrades}>
              <Text style={styles.bullet}>• Stays: shortlists, map-friendly areas, and “best base” suggestions.</Text>
              <Text style={styles.bullet}>• Flights/transport: route ideas, airport links, and quick comparisons.</Text>
              <Text style={styles.bullet}>• City guides: neighbourhoods, simple itineraries, and practical tips.</Text>
              <Text style={styles.bullet}>
                • Ticket links + reminders (optional), so you don’t miss key steps.
              </Text>
              <Text style={styles.bullet}>• Saved trips + wallet storage for bookings and references.</Text>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={() => router.push("/onboarding")} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Get Started</Text>
              </Pressable>

              <Pressable onPress={() => router.replace("/(tabs)/home")} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Skip For Now</Text>
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

  brand: { alignItems: "center", paddingTop: 10, gap: 10 },

  // Logo is now the size the old outer circle was (big and dominant).
  logo: { width: 128, height: 128, resizeMode: "contain" },

  // Neon green tagline, no “pins”/lines.
  tagline: {
    color: "rgba(0,255,136,0.92)",
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  heroCard: { padding: theme.spacing.lg },

  // Titles/subtitles in Title Case (these are explicit strings now).
  h1: { color: theme.colors.text, fontSize: theme.fontSize.xxl, fontWeight: "900", marginBottom: 10 },

  // Body copy: normal sentence casing.
  sub: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, lineHeight: 22 },

  divider: { marginTop: 14, marginBottom: 12, height: 1, backgroundColor: "rgba(255,255,255,0.10)" },

  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md, marginBottom: 10 },

  features: { gap: 10 },

  featureCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  pip: { width: 10, height: 10, borderRadius: 999, marginTop: 4 },
  pipGreen: { backgroundColor: "rgba(0,255,136,0.90)" },
  // Use a subtle EU-blue, not dominant.
  pipBlue: { backgroundColor: "rgba(46,110,255,0.75)" },
  pipGold: { backgroundColor: "rgba(255,196,46,0.85)" },

  featureTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  featureBody: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  valueRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  valueChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 72,
    justifyContent: "center",
  },

  valueChipKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900", lineHeight: 16 },
  valueChipMain: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "900" },

  upgradeNote: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, marginBottom: 8 },

  upgrades: {
    gap: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  bullet: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  actions: { marginTop: theme.spacing.lg, gap: 12 },

  btn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  btnPrimary: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.50)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  btnGhost: { borderColor: theme.colors.border, backgroundColor: "rgba(0,0,0,0.28)" },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.md },

  micro: {
    marginTop: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
  },
});
