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

  const handleBrowseFixtures = useCallback(async () => {
    await markSeen();
    router.replace("/(tabs)/fixtures");
  }, [markSeen, router]);

  const handleSetPreferences = useCallback(async () => {
    await markSeen();
    router.push("/onboarding");
  }, [markSeen, router]);

  const title = useMemo(() => "Start With A Match. Build The Trip.", []);
  const subtitle = useMemo(
    () => "Matches, Cities, And Trips — One Seamless Plan.\nSet Preferences Anytime.",
    []
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageUrl={getBackground("landing")} overlayOpacity={0.72}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.screen}>
            {/* Brand */}
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.tagline}>Football-First City Breaks, Planned Properly.</Text>
            </View>

            {/* Card */}
            <GlassCard style={styles.card} intensity={24}>
              <Text style={styles.h1}>{title}</Text>
              <Text style={styles.body}>{subtitle}</Text>

              <View style={styles.actions}>
                <Pressable onPress={handleBrowseFixtures} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Browse Fixtures</Text>
                </Pressable>

                <Pressable onPress={handleSetPreferences} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Set Preferences</Text>
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
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: "space-between",
  },

  brand: {
    alignItems: "center",
    paddingTop: 6,
    gap: 10,
  },

  logo: { width: 150, height: 150 },

  tagline: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.95,
  },

  card: { padding: theme.spacing.lg },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.lg,
    lineHeight: 26,
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
    gap: 10,
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
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  btnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnGhostText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  micro: {
    marginTop: 14,
    textAlign: "center",
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.8,
    opacity: 0.9,
  },
});
