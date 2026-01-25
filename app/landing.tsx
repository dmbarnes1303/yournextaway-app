import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

export default function LandingScreen() {
  const router = useRouter();

  return (
    <Background imageUrl={require("@/src/eiffeltower.jpeg")} overlayOpacity={0.72}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* Brand */}
          <View style={styles.brand}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
          </View>

          {/* Hero */}
          <GlassCard style={styles.heroCard} intensity={22}>

            <Text style={styles.h1}>Turn Matches Into Trips.</Text>

            <Text style={styles.sub}>
              YourNextAway helps you plan short breaks around football fixtures.
              Find a match, save it as a trip, then build everything else in one place.
            </Text>

            <View style={styles.divider} />

            {/* Capabilities */}
            <Text style={styles.sectionTitle}>What You Can Do</Text>

            <View style={styles.feature}>
              <View style={[styles.dot, styles.green]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Find Matches Fast</Text>
                <Text style={styles.featureBody}>
                  Browse upcoming fixtures by league and date window, then open a match to start planning.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={[styles.dot, styles.blue]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Build Weekend Trips</Text>
                <Text style={styles.featureBody}>
                  Save a match, set your dates, add notes, and shape a simple short-break plan.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={[styles.dot, styles.gold]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Explore Cities Confidently</Text>
                <Text style={styles.featureBody}>
                  Get quick ideas for what to do, where to base yourself, and how to make the most of the city.
                </Text>
              </View>
            </View>

            {/* Pillars */}
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Designed For</Text>
                <Text style={styles.pillValue}>Fast Decisions</Text>
              </View>

              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Optimised For</Text>
                <Text style={styles.pillValue}>Short Breaks</Text>
              </View>

              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Focused{"\n"}On</Text>
                <Text style={styles.pillValue} numberOfLines={1}>
                  Reliability
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Expanded vision (sold as present) */}
            <Text style={styles.sectionTitle}>Everything In One Hub</Text>

            <View style={styles.upgradesBox}>
              <Text style={styles.bullet}>• Flight and transport comparisons</Text>
              <Text style={styles.bullet}>• Hotel and area recommendations</Text>
              <Text style={styles.bullet}>• Ticket links and reminders</Text>
              <Text style={styles.bullet}>• City and team guides</Text>
              <Text style={styles.bullet}>• Wallet storage for bookings and plans</Text>
              <Text style={styles.bullet}>• Random trip generator</Text>
            </View>

            {/* Actions */}
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

        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* ----------------------------- Styles ----------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 18,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 14,
  },

  /* Brand */

  brand: {
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 150,
    height: 150,
  },

  tagline: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  /* Hero */

  heroCard: {
    padding: theme.spacing.lg,
  },

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

  /* Features */

  feature: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    marginBottom: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
  },

  green: { backgroundColor: theme.colors.primary },
  blue: { backgroundColor: theme.colors.accent },
  gold: { backgroundColor: theme.colors.warning },

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

  /* Pills */

  pillRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  pill: {
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

  pillKicker: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    lineHeight: 16,
  },

  pillValue: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
  },

  /* Upgrades */

  upgradesBox: {
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

  /* Actions */

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
