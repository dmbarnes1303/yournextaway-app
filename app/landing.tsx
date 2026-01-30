// app/landing.tsx
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
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
  const [resetting, setResetting] = useState(false);

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
    router.push("/(tabs)/profile");
  }, [markSeen, router]);

  const handleDevResetLanding = useCallback(async () => {
    if (resetting) return;

    setResetting(true);
    try {
      await storage.setString(STORAGE_KEYS.seenLanding, "false");
      router.replace("/");
    } catch {
      Alert.alert("Reset failed", "Couldn’t reset the landing flag.");
    } finally {
      setResetting(false);
    }
  }, [resetting, router]);

  const devResetLabel = useMemo(() => {
    if (!__DEV__) return "";
    return resetting ? "Resetting…" : "Dev: Reset Landing";
  }, [resetting]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageUrl={getBackground("landing")} overlayOpacity={0.74}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.screen}>
            {/* Dev-only utility */}
            {__DEV__ ? (
              <View style={styles.devRow}>
                <Pressable
                  onPress={handleDevResetLanding}
                  disabled={resetting}
                  style={[styles.devBtn, resetting && styles.devBtnDisabled]}
                  hitSlop={10}
                >
                  <Text style={styles.devBtnText}>{devResetLabel}</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Brand (higher) */}
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.subtitle}>Football-first city breaks, planned properly.</Text>
            </View>

            {/* Spacer keeps the card anchored low while logo sits higher */}
            <View style={{ flex: 1 }} />

            <GlassCard style={styles.card} intensity={26}>
              <Text style={styles.h1}>Start with fixtures</Text>

              <Text style={styles.body}>
                Matches, cities, and trips — one seamless plan.{"\n"}
                Set preferences anytime.
              </Text>

              <View style={styles.actions}>
                <Pressable onPress={handleBrowseFixtures} style={[styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Browse fixtures</Text>
                </Pressable>

                <Pressable onPress={handleSetPreferences} hitSlop={8} style={styles.btnTextWrap}>
                  <Text style={styles.btnText}>Set preferences</Text>
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
  },

  devRow: {
    alignItems: "flex-end",
    marginTop: 10,
  },

  devBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(0,0,0,0.30)",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  devBtnDisabled: { opacity: 0.6 },

  devBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.2,
  },

  brand: {
    alignItems: "center",
    paddingTop: 18,
    gap: 10,
  },

  logo: { width: 150, height: 150 },

  subtitle: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.92,
  },

  card: {
    padding: theme.spacing.lg,
    marginTop: 16,
  },

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
    gap: 10,
  },

  btnPrimary: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    letterSpacing: 0.2,
  },

  btnTextWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },

  btnText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    letterSpacing: 0.2,
    opacity: 0.9,
  },

  micro: {
    marginTop: 12,
    textAlign: "center",
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.9,
    opacity: 0.95,
  },
});
