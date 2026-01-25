// app/landing.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const STORAGE_KEYS = {
  setupComplete: "yna:setupComplete",
};

const LOGO = require("@/src/yna-logo.png");

export default function Landing() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const done = await AsyncStorage.getItem(STORAGE_KEYS.setupComplete);
        if (!alive) return;

        if (done === "true") {
          router.replace("/(tabs)/home");
          return;
        }
      } catch {
        // If storage fails, fall back to showing Landing (safe default).
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const goOnboarding = useCallback(() => {
    router.push("/onboarding");
  }, [router]);

  const goProfileSetup = useCallback(() => {
    router.replace("/(tabs)/profile");
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageUrl={getBackground("landing")} overlayOpacity={0.72}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.screen}>
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>YourNextAway</Text>
              <Text style={styles.subtitle}>Football-first city breaks, planned properly.</Text>
            </View>

            <GlassCard style={styles.card} intensity={24}>
              {checking ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading…</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.h1}>Start planning in one flow</Text>
                  <Text style={styles.body}>
                    Choose a fixture, then build the full trip — travel, stay, tickets, and what to do — without juggling tabs.
                  </Text>

                  <View style={styles.actions}>
                    <Pressable onPress={goOnboarding} style={[styles.btn, styles.btnPrimary]}>
                      <Text style={styles.btnPrimaryText}>Get started</Text>
                    </Pressable>

                    <Pressable onPress={goProfileSetup} style={[styles.btn, styles.btnGhost]}>
                      <Text style={styles.btnGhostText}>Set up profile</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.micro}>Plan • Fly • Watch • Repeat</Text>
                </>
              )}
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
    gap: 14,
  },

  brand: {
    alignItems: "center",
    gap: 8,
    paddingTop: 18,
  },

  logo: { width: 140, height: 140 },

  title: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.xl,
    letterSpacing: 0.2,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
    textAlign: "center",
    lineHeight: 20,
  },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 8, alignItems: "center", gap: 10 },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.lg,
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
  },

  btnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  btnGhostText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },

  micro: {
    marginTop: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
});
