// app/landing.tsx
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import storage from "@/src/services/storage";

const LOGO = require("@/src/yna-logo.png");

// Remote Unsplash (stable URL). RN <ImageBackground> will follow redirects.
const LANDING_BG = { uri: "https://unsplash.com/photos/5IS7UghgoMA/download?force=true" };

const STORAGE_KEYS = {
  disableLanding: "yna:disableLanding", // if "true" -> skip landing (future Profile toggle)
};

// Tuning knobs (safe, simple)
const LOGO_SIZE = 156;
const HERO_GAP = 14;
const CARD_GAP = 12;

export default function Landing() {
  const router = useRouter();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const disabled = (await storage.getString(STORAGE_KEYS.disableLanding))?.trim() === "true";
        if (disabled) {
          router.replace("/(tabs)/home");
          return;
        }
      } catch {
        // ignore: default to showing landing
      } finally {
        if (mounted) setBooting(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleStart = useCallback(() => {
    router.push("/onboarding");
  }, [router]);

  const handleSkip = useCallback(() => {
    router.replace("/(tabs)/home");
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={LANDING_BG} overlayOpacity={0.56}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.screen}>
            {/* Top brand block */}
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.motto}>PLAN • FLY • WATCH • REPEAT</Text>
            </View>

            {/* Center content */}
            <View style={styles.center}>
              {booting ? (
                <View style={styles.boot}>
                  <ActivityIndicator />
                </View>
              ) : (
                <GlassCard style={styles.card}>
                  <Text style={styles.h1}>European football trips, perfectly planned</Text>

                  <Text style={styles.body}>
                    Build the whole trip in one place — fixtures, tickets, flights, stays, and the plan for matchday.
                  </Text>

                  <View style={styles.actions}>
                    <Pressable onPress={handleStart} style={[styles.btn, styles.btnPrimary]}>
                      <Text style={styles.btnPrimaryText}>Get Started</Text>
                    </Pressable>

                    <Pressable onPress={handleSkip} style={[styles.btn, styles.btnGhost]}>
                      <Text style={styles.btnGhostText}>Skip for now</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.note}>
                    You can turn this off on future openings in your Profile.
                  </Text>
                </GlassCard>
              )}
            </View>

            {/* Bottom spacer keeps everything centered and premium */}
            <View style={{ height: 18 }} />
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    justifyContent: "space-between",
  },

  brand: {
    alignItems: "center",
    gap: HERO_GAP,
  },

  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },

  motto: {
    textAlign: "center",
    color: theme.colors.primary, // your green
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.1,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 6,
  },

  boot: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },

  card: {
    padding: theme.spacing.lg,
    borderRadius: 26,
    gap: CARD_GAP,
  },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 26,
    lineHeight: 32,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  body: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
    textAlign: "center",
  },

  actions: {
    marginTop: 4,
    flexDirection: "row",
    gap: 12,
  },

  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    letterSpacing: 0.2,
  },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  btnGhostText: {
    color: "rgba(255,255,255,0.68)",
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    letterSpacing: 0.1,
  },

  note: {
    marginTop: 4,
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },
});
