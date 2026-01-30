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
    // Best-effort; storage never hard-throws, but keep try/catch anyway.
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

  const handleDevResetLanding = useCallback(async () => {
    if (resetting) return;

    setResetting(true);
    try {
      await storage.setString(STORAGE_KEYS.seenLanding, "false");

      // Go back to boot route so app/index.tsx re-runs routing logic
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

      <Background imageUrl={getBackground("landing")} overlayOpacity={0.72}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
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

            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>YourNextAway</Text>
              <Text style={styles.subtitle}>Football-first city breaks, planned properly.</Text>
            </View>

            <GlassCard style={styles.card} intensity={24}>
              <Text style={styles.h1}>Start planning in one flow</Text>

              <Text style={styles.body}>
                Browse fixtures first. When you’re ready, we’ll walk you through onboarding and you can set preferences
                later.
              </Text>

              <View style={styles.actions}>
                <Pressable onPress={handleGetStarted} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Get started</Text>
                </Pressable>

                <Pressable onPress={handleExploreFirst} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Explore first</Text>
                </Pressable>
              </View>

              <Text style={styles.micro}>Plan • Fly • Watch • Repeat</Text>
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

  devBtnDisabled: {
    opacity: 0.6,
  },

  devBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.2,
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
});
