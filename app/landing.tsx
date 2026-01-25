import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

type Feature = {
  title: string;
  body: string;
  accent: "green" | "blue" | "gold";
};

function FeatureCard({ title, body, accent }: Feature) {
  const pip =
    accent === "green"
      ? styles.pipGreen
      : accent === "blue"
      ? styles.pipBlue
      : styles.pipGold;

  return (
    <View style={styles.featureCard}>
      <View style={[styles.pip, pip]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

export default function Landing() {
  const router = useRouter();

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.75}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* Brand */}
          <View style={styles.brand}>
            <Image source={LOGO} style={styles.logo} />
            <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
          </View>

          {/* Hero */}
          <GlassCard style={styles.heroCard} intensity={22}>
            <Text style={styles.h1}>
              Plan Football-First City Breaks Across Europe.
            </Text>

            <Text style={styles.sub}>
              YourNextAway helps you plan city breaks around football fixtures.
              Find a fixture, save it as a trip, then build everything else in one place —
              travel, stay, tickets, and what to do.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>What You Can Do</Text>

            <View style={styles.features}>
              <FeatureCard
                title="Find Fixtures Fast"
                body="Browse upcoming matches by league and date window, then open a fixture to start planning."
                accent="green"
              />

              <FeatureCard
                title="Build Trips Around Matches"
                body="Save a fixture, set your dates, add notes, and shape a simple city-break plan."
                accent="blue"
              />

              <FeatureCard
                title="Explore Cities Confidently"
                body="Get clear guidance on where to stay, what to do, and how to make the most of your time."
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
                <Text style={styles.valueChipMain}>Short Breaks</Text>
              </View>

              <View style={styles.valueChip}>
                <Text style={styles.valueChipKicker}>Focused{"\n"}On</Text>
                <Text
                  style={styles.valueChipMain}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.9}
                >
                  Reliability
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Everything In One Hub</Text>

            <View style={styles.upgrades}>
              <Text style={styles.bullet}>• Flight and transport comparisons</Text>
              <Text style={styles.bullet}>• Hotel and area recommendations</Text>
              <Text style={styles.bullet}>• Ticket links and reminders</Text>
              <Text style={styles.bullet}>• City and team guides</Text>
              <Text style={styles.bullet}>• Wallet storage for bookings and plans</Text>
              <Text style={styles.bullet}>• Random trip generator</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => router.push("/onboarding")}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnPrimaryText}>Plan YourNextAway</Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace("/(tabs)/home")}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={styles.btnGhostText}>Skip For Now</Text>
              </Pressable>
            </View>

            <Text style={styles.micro}>
              Built for travellers planning football-focused city breaks.
            </Text>
          </GlassCard>

          <View style={{ height: 10 }} />

        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* ---------------------------------- */
/* Styles */
/* ---------------------------------- */

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
    gap: 10,
    paddingTop: 6,
  },

  logo: {
    width: 132,
    height: 132,
    resizeMode: "contain",
  },

  tagline: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  heroCard: {
    padding: theme.spacing.lg,
  },

  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900",
    lineHeight: 36,
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
    borderColor: "rgba(0,255,136,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  pip: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
  },

  pipGreen: { backgroundColor: "rgba(0,255,136,0.9)" },
  pipBlue: { backgroundColor: "rgba(46,110,255,0.75)" },
  pipGold: { backgroundColor: "rgba(255,196,46,0.85)" },

  featureTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  featureBody: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  valueRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

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

  valueChipKicker: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
  },

  valueChipMain: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
  },

  upgrades: {
    gap: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  bullet: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  actions: {
    marginTop: theme.spacing.lg,
    gap: 12,
  },

  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.50)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  btnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  btnGhostText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  micro: {
    marginTop: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
  },
});
