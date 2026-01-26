// app/landing.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

export default function Landing() {
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem("yna:seenLanding", "true");
    } catch {}
    router.push("/onboarding");
  };

  const handleExploreFirst = async () => {
    try {
      await AsyncStorage.setItem("yna:seenLanding", "true");
    } catch {}
    router.replace("/(tabs)/home");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageUrl={getBackground("landing")} overlayOpacity={0.72}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.screen}>
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>YourNextAway</Text>
              <Text style={styles.subtitle}>
                Football-first city breaks, planned properly.
              </Text>
            </View>

            <GlassCard style={styles.card} intensity={24}>
              <Text style={styles.h1}>Start planning in one flow</Text>

              <Text style={styles.body}>
                Browse fixtures first. When you’re ready, we’ll walk you through
                onboarding and you can set preferences later.
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={handleGetStarted}
                  style={[styles.btn, styles.btnPrimary]}
                >
                  <Text style={styles.btnPrimaryText}>Get started</Text>
                </Pressable>

                <Pressable
                  onPress={handleExploreFirst}
                  style={[styles.btn, styles.btnGhost]}
                >
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
