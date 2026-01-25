import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("../src/yna-logo.png");

type Feature = { title: string; body: string; accent?: "green" | "gold" };

function FeatureCard({ title, body, accent = "green" }: Feature) {
  const accentStyle = accent === "gold" ? styles.accentGold : styles.accentGreen;

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
    <Background imageUrl={getBackground("landingDark")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logo} />
            </View>

            <Text style={styles.brandName}>YourNextAway</Text>

            {/* Keep It Green-First. Optional Gold As A Tiny EU Nod. */}
            <View style={styles.pins}>
              <View style={styles.pinGreen} />
              <View style={styles.pinGold} />
            </View>

            <Text style={styles.brandTagline}>Football-First European City Breaks</Text>
          </View>

          {/* Pitch */}
          <GlassCard style={styles.heroCard} intensity={22}>
            <Text style={styles.h1}>Plan A Trip Around A Match — Properly.</Text>

            <Text style={styles.sub}>
              YourNextAway Turns Fixtures Into A Complete Short-Break Plan. Find A Match, Pick The Best City Option,
              Save The Trip, Then Build It Out With Stays, Transport, And Practical City Guidance — In One Flow.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>What You Can Do</Text>

            <View style={styles.features}>
              <FeatureCard
                title="Real Fixtures, Real Dates"
                body="Browse Upcoming Games By League And Date Window, Then Open A Match To Start Planning Instantly."
                accent="green"
              />
              <FeatureCard
                title="City-Aware Trip Building"
                body="Save Trips With Dates, Notes, And A Destination Anchor — Designed For Quick Weekend Planning."
                accent="green"
              />
              <FeatureCard
                title="Explore Like A Traveller"
                body="Built For Neutral Travellers Visiting Cities. You Get Practical ‘What To Do’ Guidance — Not Supporter Culture."
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
                <Text style={styles.valueChipKicker}>Focused On</Text>
                <Text style={styles.valueChipMain}>Reliability</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Upgrades In The Full Experience</Text>
            <Text style={styles.upgradeNote}>
              This Build Covers The Core Flow. The Finished Experience Expands Each Trip Into A Full Planner:
            </Text>

            <View style={styles.upgrades}>
              <Text style={styles.bullet}>• Stays: Shortlists, Map-Friendly Areas, And “Best Base” Suggestions</Text>
              <Text style={styles.bullet}>• Flights/Transport: Route Ideas, Airport Links, And Quick Comparisons</Text>
              <Text style={styles.bullet}>• City Guides: Neighbourhoods, Simple Itineraries, And Practical Tips</Text>
              <Text style={styles.bullet}>• Ticket Links + Reminders (Optional), So You Don’t Miss Key Steps</Text>
              <Text style={styles.bullet}>• Saved Trips + Wallet Storage For Bookings And References</Text>
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
              Neutral Travel Planning — Built For Exploring European Cities Around Fixtures.
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

  logoWrap: {
    width: 126,
    height: 126,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.22)",
  },
  logo: { width: 98, height: 98, resizeMode: "contain" },

  brandName: { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "900", marginTop: 2 },

  pins: { flexDirection: "row", gap: 8, alignItems: "center" },
  pinGreen: { width: 32, height: 5, borderRadius: 999, backgroundColor: "rgba(0,255,136,0.78)" },
  pinGold: { width: 14, height: 5, borderRadius: 999, backgroundColor: "rgba(255,196,46,0.55)" },

  brandTagline: { color: "rgba(255,255,255,0.62)", fontSize: theme.fontSize.sm, fontWeight: "800" },

  heroCard: { padding: theme.spacing.lg },

  h1: { color: theme.colors.text, fontSize: theme.fontSize.xxl, fontWeight: "900", marginBottom: 10 },

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

  accentPip: { width: 10, height: 10, borderRadius: 999, marginTop: 4 },
  accentGreen: { backgroundColor: "rgba(0,255,136,0.90)" },
  accentGold: { backgroundColor: "rgba(255,196,46,0.80)" },

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
  },
  valueChipKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900" },
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
