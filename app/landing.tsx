// app/landing.tsx
import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import { getBackgroundSource } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import storage from "@/src/services/storage";

const LOGO = require("@/src/yna-logo.png");

const STORAGE_KEYS = {
  seenLanding: "yna:seenLanding",
};

/**
 * TUNING KNOBS (edit these two numbers only)
 * - BRAND_TOP: higher = logo sits lower (moves DOWN)
 * - CARD_RAISE: higher = card moves up more (exposes stadium)
 */
const BRAND_TOP = 45;
const CARD_RAISE = 18;

export default function Landing() {
  const router = useRouter();

  const markSeen = useCallback(async () => {
    try {
      await storage.setString(STORAGE_KEYS.seenLanding, "true");
    } catch {
      // ignore
    }
  }, []);

  const handleGetStarted = useCallback(async () => {
    await markSeen();
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
            {/* Brand (top-third, controllable) */}
            <View style={[styles.brand, { marginTop: BRAND_TOP }]}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.tagline}>Football-First City Breaks Across Europe</Text>
            </View>

            {/* CTA (raised, more transparent, NO blur) */}
            <View style={[styles.cardWrap, { transform: [{ translateY: -CARD_RAISE }] }]}>
              <View style={styles.card}>
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
              </View>
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    justifyContent: "space-between", // decouples brand + card positioning
  },

  brand: {
    alignItems: "center",
  },

  logo: {
    width: 130,
    height: 130,
  },

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

  cardWrap: {
    paddingBottom: theme.spacing.lg,
  },

  // transparent + premium, NO blur
  card: {
    padding: theme.spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
    backgroundColor: "rgba(0,0,0,0.055)",
  },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.lg,
    lineHeight: 30,
    letterSpacing: 0.2,
  },

  body: {
    marginTop: 8,
    color: "rgba(255,255,255,0.74)",
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },

  actions: {
    marginTop: theme.spacing.md,
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
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  btnGhostText: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  motto: {
    marginTop: 10,
    textAlign: "center",
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.8,
  },
});
