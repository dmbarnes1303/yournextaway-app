// app/landing.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.68}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.wrap}>
          {/* Brand block (no outer circle, logo is the hero) */}
          <View style={styles.brand}>
            <Image source={require("@/src/yna-logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
          </View>

          <GlassCard style={styles.card} intensity={26}>
            {/* Title/subtitle: capitalise like normal headings, not every word */}
            <Text style={styles.h1}>Plan A Trip Around A Match — Properly.</Text>
            <Text style={styles.sub}>
              YourNextAway turns fixtures into a complete short-break plan. Find a match, pick the best city option,
              save the trip, then build it out with stays, transport, and practical city guidance — in one flow.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.h2}>What you can do</Text>

            {/* Bullet cards: top green, middle blue, bottom gold */}
            <View style={styles.feature}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Real fixtures, real dates</Text>
                <Text style={styles.featureBody}>
                  Browse upcoming games by league and date window, then open a match to start planning instantly.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>City-aware trip building</Text>
                <Text style={styles.featureBody}>
                  Save trips with dates, notes, and a destination anchor — designed for quick weekend planning.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Explore like a traveller</Text>
                <Text style={styles.featureBody}>
                  Built for neutral travellers visiting cities. You get practical “what to do” guidance — not supporter
                  culture.
                </Text>
              </View>
            </View>

            {/* Three pillars */}
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Designed for</Text>
                <Text style={styles.pillValue}>Fast decisions</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Optimised for</Text>
                <Text style={styles.pillValue}>Weekend breaks</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Focused{"\n"}On</Text>
                <Text style={styles.pillValue} numberOfLines={1}>
                  Reliability
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.h2}>Upgrades in the full experience</Text>
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
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: {
    flex: 1,
    paddingTop: 86,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "flex-end",
    gap: 14,
  },

  brand: { alignItems: "center", gap: 10 },
  logo: { width: 132, height: 132 },
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
  sub: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },

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

  feature: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.18)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  dot: { width: 12, height: 12, borderRadius: 999, marginTop: 3 },
  featureTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  featureBody: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 19 },

  pillRow: { marginTop: 14, flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 74,
    justifyContent: "space-between",
  },
  pillKicker: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs, lineHeight: 14 },
  pillValue: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  upgradesBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.22)",
    backgroundColor: "rgba(0,0,0,0.24)",
    padding: 12,
    gap: 8,
  },
  bullet: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 19 },

  actions: { marginTop: theme.spacing.lg, gap: 12 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  btnPrimary: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.45)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  btnGhost: { borderColor: theme.colors.border, backgroundColor: "rgba(0,0,0,0.22)" },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.md },

  footerNote: {
    marginTop: 12,
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
  },
});
