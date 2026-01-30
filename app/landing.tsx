// app/landing.tsx
import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import storage from "@/src/services/storage";

const LOGO = require("@/src/yna-logo.png");

const STORAGE_KEYS = {
  seenLanding: "yna:seenLanding",
};

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

  const tagline = useMemo(() => "Football-First City Breaks Across Europe", []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageUrl={getBackground("landing")} overlayOpacity={0.68}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.screen}>
            {/* Brand block */}
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.tagline}>{tagline}</Text>
            </View>

            {/* CTA card */}
            <GlassCard style={[styles.card, styles.cardLite]} intensity={16}>
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
    paddingBottom: theme.spacing.xxl,
    justifyContent: "space-between",
  },

  brand: {
    alignItems: "center",
    paddingTop: 18,
  },

  // Slightly higher + more “top hero” feel without leaving a dead gap
  logo: {
    width: 150,
    height: 150,
    marginTop: 6,
  },

  tagline: {
    marginTop: 14,
    color: "rgba(255,255,255,0.78)",
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  card: { padding: theme.spacing.lg },

  // More transparent so the background actually shows
  cardLite: {
    backgroundColor: "rgba(0,0,0,0.14)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
  },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.xl,
    letterSpacing: 0.2,
  },

  body: {
    marginTop: 10,
    color: "rgba(255,255,255,0.70)",
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
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  btnGhostText: {
    color: "rgba(255,255,255,0.78)",
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
