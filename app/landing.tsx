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

      <Background imageSource={getBackgroundSource("landing")} overlayOpacity={0.72}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.screen}>
            {/* Brand */}
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              {/* No repeated "YourNextAway" text — logo already says it */}
              <Text style={styles.subtitle}>Football-First City Breaks, Planned Properly.</Text>
            </View>

            {/* CTA Card */}
            <GlassCard style={styles.card} intensity={24}>
              <Text style={styles.h1}>Start With Fixtures</Text>

              <Text style={styles.body}>
                Browse fixtures or pick a city first — either way, YourNextAway builds the whole trip in one place.
              </Text>

              <View style={styles.actions}>
                <Pressable onPress={handleGetStarted} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Get Started</Text>
                </Pressable>

                <Pressable onPress={handleExploreFirst} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Explore First</Text>
                </Pressable>
              </View>

              <Text style={styles.micro}>PLAN • FLY • WATCH • REPEAT</Text>
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
    justifyContent: "flex-end",
    gap: 12,
  },

  brand: {
    alignItems: "center",
    gap: 8,
    paddingTop: 22,
  },

  logo: { width: 150, height: 150 },

  subtitle: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  card: { padding: theme.spacing.lg },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.lg,
    letterSpacing: 0.2,
  },

  body: {
    marginTop: 10,
    color: theme.colors.textSecondary,
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
    backgroundColor: "rgba(0,0,0,0.50)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    letterSpacing: 0.2,
  },

  btnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  btnGhostText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    letterSpacing: 0.2,
  },

  micro: {
    marginTop: 12,
    textAlign: "center",
    color: "rgba(0,255,136,0.90)", // brand green
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.9,
  },
});
