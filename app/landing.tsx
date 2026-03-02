// app/landing.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform, Image as RNImage } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { getBackgroundSource } from "@/src/constants/backgrounds";

const LOGO = require("@/src/yna-logo.png");

// Remote (fixed) image.unsplash.com URL (RN-safe, stable).
// If this ever fails, we fallback to your local landing background.
const REMOTE_BG = {
  uri: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80",
};

const FALLBACK_BG = getBackgroundSource("landing");

export default function Landing() {
  const router = useRouter();

  const [remoteFailed, setRemoteFailed] = useState(false);

  const bgSource = useMemo(() => (remoteFailed ? FALLBACK_BG : REMOTE_BG), [remoteFailed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await RNImage.prefetch(REMOTE_BG.uri);
        if (!ok && !cancelled) setRemoteFailed(true);
      } catch {
        if (!cancelled) setRemoteFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = useCallback(() => {
    router.push("/onboarding");
  }, [router]);

  const handleSkip = useCallback(() => {
    router.replace("/(tabs)/home");
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={bgSource} overlayOpacity={0.58}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.screen}>
            {/* Brand */}
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.motto}>PLAN • FLY • WATCH • REPEAT</Text>
            </View>

            {/* Main CTA */}
            <View style={styles.center}>
              <GlassCard strength="strong" style={styles.card}>
                <Text style={styles.kicker}>YOURNEXTAWAY</Text>
                <Text style={styles.h1}>Football-first city breaks.</Text>
                <Text style={styles.body}>
                  Pick a fixture, then build the entire trip around it — tickets, flights, stays, and matchday planning.
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    onPress={handleStart}
                    style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={[styles.btnText, styles.btnPrimaryText]}>Get started</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSkip}
                    style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                  >
                    <Text style={[styles.btnText, styles.btnGhostText]}>Skip for now</Text>
                  </Pressable>
                </View>

                <Text style={styles.note}>You can disable onboarding later in Profile.</Text>
              </GlassCard>
            </View>

            <View style={{ height: 12 }} />
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

  brand: { alignItems: "center", gap: 12 },

  logo: { width: 148, height: 148 },

  motto: {
    textAlign: "center",
    color: "rgba(79,224,138,0.92)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.0,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  center: { flex: 1, justifyContent: "center", paddingTop: 8 },

  card: { padding: theme.spacing.lg, borderRadius: 26, gap: 10 },

  kicker: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.8,
  },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 26,
    lineHeight: 32,
    textAlign: "center",
    letterSpacing: 0.2,
    marginTop: 2,
  },

  body: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 6,
  },

  actions: { marginTop: 10, flexDirection: "row", gap: 12 },

  btn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  btnPrimary: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },

  btnText: { fontWeight: theme.fontWeight.black, fontSize: 14, letterSpacing: 0.2 },
  btnPrimaryText: { color: theme.colors.text },
  btnGhostText: { color: theme.colors.textSecondary },

  note: {
    marginTop: 6,
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 16,
  },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
});
