// app/paywall.tsx
import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackgroundSource } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

export default function PaywallScreen() {
  const router = useRouter();

  const close = useCallback(() => router.back(), [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={getBackgroundSource("home")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              onPress={close}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              hitSlop={10}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>

            <Text style={styles.kicker}>PREMIUM</Text>
            <Text style={styles.title}>Upgrade your planning.</Text>
            <Text style={styles.sub}>
              Premium will unlock faster planning, smarter defaults, and deeper tools
              — without taking away the core free experience.
            </Text>
          </View>

          {/* BODY */}
          <View style={styles.body}>
            <GlassCard strength="default" style={styles.card}>
              <Text style={styles.sectionTitle}>What Premium will unlock</Text>

              <View style={styles.list}>
                {[
                  "Smarter filters to find the right fixture faster",
                  "Saved defaults to remove repeat setup",
                  "More powerful trip-building tools",
                  "Cleaner organisation across trips and wallet",
                  "More advanced alerts and planning insights",
                ].map((t) => (
                  <View key={t} style={styles.row}>
                    <View style={styles.dot} />
                    <Text style={styles.text}>{t}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <GlassCard strength="subtle" style={styles.card}>
              <Text style={styles.sectionTitle}>Status</Text>
              <Text style={styles.status}>
                Premium is not live yet. It will be added once the core experience
                is fully locked and stable.
              </Text>
            </GlassCard>

            <Pressable
              onPress={close}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
            >
              <Text style={styles.ctaText}>Continue with free version</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Background>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },

  closeBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    marginBottom: 12,
  },

  closeText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 13,
  },

  kicker: {
    color: "rgba(79,224,138,0.92)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
  },

  title: {
    marginTop: 10,
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: theme.fontWeight.black,
  },

  sub: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 19,
    maxWidth: 520,
  },

  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    gap: 12,
  },

  card: {
    borderRadius: 20,
    padding: theme.spacing.md,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 15,
  },

  list: {
    marginTop: 12,
    gap: 10,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor: "rgba(79,224,138,0.65)",
  },

  text: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: 13,
    lineHeight: 18,
  },

  status: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  cta: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  ctaText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 15,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
