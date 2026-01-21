import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <Background imageUrl={getBackground("home")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
          // Hard back safety: if there's nowhere to go back to, we push to tabs/home
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/(tabs)/home");
              }}
              style={styles.headerBtn}
              hitSlop={12}
            >
              <Text style={styles.headerBtnText}>← Back</Text>
            </Pressable>
          ),
        }}
      />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.wrap}>
          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.h1}>YourNextAway</Text>
            <Text style={styles.sub}>
              Plan football trips fast: fixtures, cities, and trips in one place.
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={() => router.push("/onboarding")}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnPrimaryText}>Get started</Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace("/(tabs)/home")}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={styles.btnGhostText}>Skip for now</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: {
    flex: 1,
    paddingTop: 110,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "flex-end",
  },
  card: {
    padding: theme.spacing.lg,
  },
  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900",
    marginBottom: 10,
  },
  sub: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },
  actions: {
    marginTop: theme.spacing.lg,
    gap: 12,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  btnPrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },
  btnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  btnGhostText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },
  headerBtn: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  headerBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },
});
