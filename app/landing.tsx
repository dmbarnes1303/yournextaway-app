// app/landing.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

const STORAGE_KEYS = {
  seenLanding: "yna:seenLanding",
};

export default function Landing() {
  const router = useRouter();

  // Mark landing as "seen" the moment the user reaches it once.
  // This is what app/index.tsx uses to decide Landing vs Home on next launch.
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.seenLanding, "true").catch(() => {});
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageUrl={getBackground("landing")} overlayOpacity={0.72}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.brand}>
              <Image
                source={LOGO}
                style={styles.logo}
                resizeMode="contain"
                accessible
                accessibilityRole="image"
                accessibilityLabel="YourNextAway logo"
              />

              <Text style={styles.title} accessibilityRole="header">
                YourNextAway
              </Text>

              <Text style={styles.subtitle}>
                Football-first city breaks, planned properly.
              </Text>
            </View>

            <GlassCard style={styles.card} intensity={24}>
              <Text style={styles.h1}>Start with fixtures. Build the trip.</Text>

              <Text style={styles.body}>
                Browse first. When you’re ready, we’ll guide you through onboarding — preferences can wait.
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => router.push("/onboarding")}
                  accessibilityRole="button"
                  accessibilityLabel="Get started"
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnPrimary,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.btnPrimaryText}>Get started</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.replace("/(tabs)/home")}
                  accessibilityRole="button"
                  accessibilityLabel="Explore first"
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnGhost,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.btnGhostText}>Explore first</Text>
                </Pressable>
              </View>

              <Text style={styles.micro}>Plan • Fly • Watch • Repeat</Text>
            </GlassCard>

            {/* Bottom breathing room so nothing feels pinned to the edge */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </SafeAreaView>
      </Background>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  scroll: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "flex-end",
    gap: theme.spacing.lg,
  },

  brand: {
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 132,
    height: 132,
  },

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
    maxWidth: 320,
  },

  card: {
    padding: theme.spacing.lg,
  },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.lg,
    lineHeight: 24,
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
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
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

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  micro: {
    marginTop: 14,
    textAlign: "center",
    color: "rgba(255,255,255,0.60)",
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
  },

  bottomSpacer: {
    height: 6,
  },
});
