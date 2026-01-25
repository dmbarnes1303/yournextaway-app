// app/onboarding.tsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Image, Animated, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackgroundSource } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

type Step = {
  title: string;
  subtitle: string;
  body: string;
  bgKey: "onboarding1" | "onboarding2" | "onboarding3";
};

const STORAGE_KEYS = {
  onboardingComplete: "yna:onboardingComplete",
  setupComplete: "yna:setupComplete",
};

export default function Onboarding() {
  const router = useRouter();

  const steps: Step[] = useMemo(
    () => [
      {
        title: "Start With A Fixture",
        subtitle: "Find The Right Match For Your Dates",
        body:
          "Browse fixtures across the top leagues, lock in your date window, and open a match to anchor the trip. From that moment, YourNextAway turns the fixture into a complete city-break plan.",
        bgKey: "onboarding1",
      },
      {
        title: "Build The Trip In One Hub",
        subtitle: "Flights, Stays, Tickets, And Notes Together",
        body:
          "Compare travel options, shortlist where to stay, and keep ticket links and trip notes organised in one place. Plan midweek bargains or weekend breaks without juggling tabs, screenshots, and group chats.",
        bgKey: "onboarding2",
      },
      {
        title: "Make The City Break Better",
        subtitle: "What To Do, Where To Base Yourself",
        body:
          "Use city guidance to shape the break beyond the match. Pull top-rated ideas (including TripAdvisor inspiration), build a simple itinerary, then store bookings and references in your wallet so everything is ready when you travel.",
        bgKey: "onboarding3",
      },
    ],
    []
  );

  const [i, setI] = useState(0);
  const isLast = i === steps.length - 1;

  const [bootChecking, setBootChecking] = useState(true);

  // Step animation
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(12);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [i, opacity, translateY]);

  // Guard: completed users should never see onboarding again.
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const setupDone = await AsyncStorage.getItem(STORAGE_KEYS.setupComplete);
        if (!mounted) return;

        if (setupDone === "true") {
          router.replace("/(tabs)/home");
          return;
        }

        const onboardingDone = await AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete);
        if (!mounted) return;

        // Onboarding done but setup not done -> push them to profile setup
        if (onboardingDone === "true") {
          router.replace("/(tabs)/profile");
          return;
        }
      } catch {
        // ignore, show onboarding
      } finally {
        if (mounted) setBootChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const dotColors = [theme.colors.primary, theme.colors.accent, theme.colors.warning];
  const bgSource = getBackgroundSource(steps[i].bgKey);

  const completeOnboardingAndGoProfile = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, "true");
      router.replace("/(tabs)/profile");
    } catch {
      Alert.alert("Something went wrong", "We couldn’t save your progress, but you can continue.");
      router.replace("/(tabs)/profile");
    }
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={bgSource} overlayOpacity={0.68}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.screen}>
            <View style={styles.topRow}>
              <Pressable onPress={() => router.back()} style={styles.backPill} hitSlop={10}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>

              <View style={styles.planPill}>
                <Text style={styles.planLabel}>Plan</Text>
                <Text style={styles.planValue}>Choose later</Text>
              </View>
            </View>

            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
            </View>

            <GlassCard style={styles.card} intensity={24}>
              {bootChecking ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading…</Text>
                </View>
              ) : (
                <>
                  <Animated.View style={{ opacity, transform: [{ translateY }] }}>
                    <Text style={styles.kicker}>
                      Step {i + 1} of {steps.length}
                    </Text>

                    <Text style={styles.h1}>{steps[i].title}</Text>
                    <Text style={styles.h2}>{steps[i].subtitle}</Text>
                    <Text style={styles.body}>{steps[i].body}</Text>
                  </Animated.View>

                  <View style={styles.dots}>
                    {steps.map((_, idx) => {
                      const active = idx === i;
                      const color = dotColors[idx];
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.dot,
                            {
                              backgroundColor: active ? color : "rgba(255,255,255,0.12)",
                              borderColor: active ? color : "rgba(255,255,255,0.12)",
                            },
                          ]}
                        />
                      );
                    })}
                  </View>

                  <View style={styles.actions}>
                    <Pressable onPress={completeOnboardingAndGoProfile} style={[styles.btn, styles.btnGhost]}>
                      <Text style={styles.btnGhostText}>Skip</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        if (isLast) completeOnboardingAndGoProfile();
                        else setI((n) => Math.min(n + 1, steps.length - 1));
                      }}
                      style={[styles.btn, styles.btnPrimary]}
                    >
                      <Text style={styles.btnPrimaryText}>{isLast ? "Continue to profile" : "Continue"}</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.micro}>Next step: set your defaults and plan in Profile.</Text>
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
    paddingTop: 14,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "flex-end",
    gap: 12,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  backText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
  },

  planPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.28)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "flex-end",
  },

  planLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
  },

  planValue: {
    marginTop: 2,
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  brand: { alignItems: "center", gap: 8 },

  logo: { width: 132, height: 132 },

  tagline: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    fontSize: theme.fontSize.sm,
  },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 10, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.sm },

  kicker: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    marginBottom: 10,
  },

  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },

  h2: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    marginTop: 4,
    marginBottom: 10,
  },

  body: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
    fontWeight: theme.fontWeight.bold,
  },

  dots: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
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
    backgroundColor: "rgba(0,0,0,0.5)",
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
  },
});
