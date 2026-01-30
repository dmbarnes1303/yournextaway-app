// app/landing.tsx
import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackgroundSource } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import storage from "@/src/services/storage";

const LOGO = require("@/src/yna-logo.png");

const STORAGE_KEYS = {
  seenLanding: "yna:seenLanding",
};

export default function Landing() {
  const routerrouter = useRouter();

  const markSeen = useCallback(async () => {
    try {
      await storage.setString(STORAGE_KEYS.seenLanding, "true");
    } catch {
      // ignore
    }
  }, []);

  const handleGetStarted = useCallback(async () => {
    await markSeen();
    R
    const router = useRouter();
    router.push("/onboarding");
  }, [markSeen, router]);

  const handleExploreFirst = useCallback(async () => {
    await markSeen();
    router.replace("/(tabs)/home");
  }, [markSeen, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={getBackgroundSource("landing")} overlayOpacity={0.58}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.screen}>
            {/* Top spacer pushes brand into top third */}
            <View style={styles.brandSpacerTop} />

            {/* Brand */}
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.tagline}>Football-First City Breaks Across Europe</Text>
            </View>

            {/* Middle spacer keeps card positioning stable */}
            <View style={styles.brandSpacerBottom} />

            {/* CTA */}
            <View style={styles.cardWrap}>
              <GlassCard style={styles.card} intensity={8}>
                <Text style={styles.h1}>Plan Your Next Away</Text>

                <Text style={styles.body}>
                  Pick a match or pick a city — we’ll help you build the full trip in one place.
                </Text>

                <View style={styles.actions}>
                  <Pressable onPress={handleGetStarted} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Get Started</Text>
                  </Pressable>

                  <Pressable onPress={handleExploreFirst} style={[styles.btn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Explore First</Text>
                  </Pressable>
                </View>

                <Text style={styles.motto}>PLAN • FLY • WATCH • REPEAT</Text>
              </GlassCard>
            </View>
          </View>
        </SafeAreaView>
      </Background>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  screen: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },

  // ↓ push logo down slightly more than before (premium)
  brandSpacerTop: {
    flex: 1.35,
    minHeight: 24,
  },

  brand: {
    alignItems: "center",
  },

  logo: {
    width: 130,
    height: 130,
  },

  // Improve legibility without adding a "box"
  tagline: {
    marginTop: 10,
    maxWidth: 330,
    color: "rgba(255,255,255,0.86)",
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
    textAlign: "center",
    letterSpacing: 0.25,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  brandSpacerBottom: {
    flex: 1,
    minHeight: 12,
  },

  // bring CTA card up slightly from bottom for balance
  cardWrap: {
    justifyContent: "flex-end",
    paddingBottom: theme.spacing.lg,
  },

  // More transparent + less visible border (stop drawing a rectangle)
  card: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.085)",
  },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.lg,
    lineHeight: 30,
    letterSpacing: 0.2,
  },

  body: {
    marginTop: 10,
    color: "rgba(255,255,255,0.74)",
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },

  actions: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    gap: 12,
  },

  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.14)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.05)",
  },

  btnGhostText: {
    color: "rgba(255,255,255,0.70)",
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  motto: {
    marginTop: 14,
    textAlign: "center",
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.8,
  },
});
