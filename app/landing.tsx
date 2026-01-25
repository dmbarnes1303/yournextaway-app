// app/landing.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

type Feature = { title: string; body: string; accent: "green" | "blue" | "gold" };

function FeatureCard({ title, body, accent }: Feature) {
  const pipStyle =
    accent === "green" ? styles.pipGreen : accent === "blue" ? styles.pipBlue : styles.pipGold;

  return (
    <View style={styles.featureCard}>
      <View style={[styles.pip, pipStyle]} />
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
    <Background imageUrl={getBackground("home")} overlayOpacity={0.68}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand (top never disappears because we scroll) */}
          <View style={styles.brand}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
          </View>

          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.h1}>Plan A Trip Around A Match — Properly.</Text>
            <Text style={styles.sub}>
              YourNextAway turns fixtures into a complete short-break plan. Find a match, pick the best city option,
              save the trip, then build it out with stays, transport, and practical city guidance — in one flow.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.h2}>What You Can Do</Text>

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
                <Text style={styles.valueKicker}>Designed for</Text>
                <Text style={styles.valueMain} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.92}>
                  Fast decisions
                </Text>
              </View>

              <View style={styles.valueChip}>
                <Text style={styles.valueKicker}>Optimised for</Text>
                <Text style={styles.valueMain} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.92}>
                  Weekend breaks
                </Text>
              </View>

              <View style={styles.valueChip}>
                <Text style={styles.valueKicker}>
                  Focused{"\n"}On
                </Text>
                <Text style={styles.valueMain} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.92}>
                  Reliability
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.h2}>Upgrades In The Full Experience</Text>
            <Text style={styles.sub}>
              This build covers the core flow. The finished experience expands each trip into a full planner:
            </Text>

            <View style={styles.upgradesBox}>
              <Text style={styles.bullet}>• Stays: shortlists, map-friendly areas, and “best base” suggestions.</Text>
              <Text style={styles.bullet}>• Flights/transport: route ideas, airport links, and quick comparisons.</Text>
              <Text style={styles.bullet}>• City guides: neighbourhoods, simple itineraries, and practical tips.</Text>
              <Text style={styles.bullet}>• Ticket links + reminders (optional), so you don’t miss key steps.</Text>
              <Text style={styles.bullet}>• Saved trips + wallet storage for bookings and references.</Text>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={() => router.push("/onboarding")} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Get started</Text>
              </Pressable>

              <Pressable onPress={() => router.replace("/(tabs)/home")} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Skip for now</Text>
              </Pressable>
            </View>

            <Text style={styles.footerNote}>
              Neutral travel planning — built for exploring European cities around fixtures.
            </Text>
          </GlassCard>

          <View style={{ height: 12 }} />
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

  brand: { alignItems: "center", gap: 10, paddingTop: 6 },
  logo: { width: 136, height: 136 },
  tagline: {
    color: theme.colors.primary,
    fontWeight: "900",
    letterSpacing: 0.6,
    fontSize: theme.fontSize.sm,
  },

  card: { padding: theme.spacing.lg },

  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900",
    lineHeight: 36,
  },

  // Body copy: normal sentence casing
  sub: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },

  // Headings/subheadings only
  h2: {
    marginTop: 14,
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
  },

  divider: {
    marginTop: 14,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  features: { marginTop: 12, gap: 10 },

  featureCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.14)",
    backgroundColor: "rgba(0,0,0,0.26)",
  },

  pip: { width: 10, height: 10, borderRadius: 999, marginTop: 4 },
  pipGreen: { backgroundColor: theme.colors.primary },
  pipBlue: { backgroundColor: theme.colors.accent }, // EU blue, subtle
  pipGold: { backgroundColor: theme.colors.warning },

  featureTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  featureBody: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  valueRow: { marginTop: 14, flexDirection: "row", gap: 10 },

  valueChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 76,
    justifyContent: "center",
  },

  valueKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900", lineHeight: 16 },
  valueMain: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "900" },

  upgradesBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.16)",
    backgroundColor: "rgba(0,0,0,0.22)",
    padding: 12,
    gap: 8,
  },
  bullet: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 19 },

  actions: { marginTop: theme.spacing.lg, gap: 12 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  btnPrimary: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.50)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  btnGhost: { borderColor: theme.colors.border, backgroundColor: "rgba(0,0,0,0.26)" },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.md },

  footerNote: {
    marginTop: 12,
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
  },
});
