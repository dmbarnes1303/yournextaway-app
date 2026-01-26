// app/onboarding.tsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Image, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

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
          "Use city and team guidance to shape the trip beyond the match. Pull top-rated ideas (including TripAdvisor inspiration), build a simple itinerary, then store bookings and references in your wallet so everything is ready when you travel.",
        bgKey: "onboarding3",
      },
    ],
    []
  );

  const [i, setI] = useState(0);
  const isLast = i === steps.length - 1;

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

  const dotColors = [theme.colors.primary, theme.colors.accent, theme.colors.warning];
  const bgSource = getBackgroundSource(steps[i].bgKey);

  const goHome = useCallback(() => {
    router.replace("/(tabs)/home");
  }, [router]);

  const next = useCallback(() => {
    setI((n) => Math.min(n + 1, steps.length - 1));
  }, [steps.length]);

  return (
    <>
      {/* No native header on onboarding (prevents double back + feels intentional). */}
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={bgSource} overlayOpacity={0.68}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.screen}>
            {/* Top Row (Skip only) */}
            <View style={styles.topRow}>
              <View style={{ flex: 1 }} />
              <Pressable onPress={goHome} style={styles.skipPill} hitSlop={10}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            </View>

            {/* Brand */}
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
            </View>

            {/* Card */}
            <GlassCard style={styles.card} intensity={24}>
              <Animated.View style={{ opacity, transform: [{ translateY }] }}>
                <Text style={styles.kicker}>
                  Step {i + 1} of {steps.length}
                </Text>

                <Text style={styles.h1}>{steps[i].title}</Text>
                <Text style={styles.h2}>{steps[i].subtitle}</Text>
                <Text style={styles.body}>{steps[i].body}</Text>

                {/* Dots directly under content */}
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
              </Animated.View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable onPress={goHome} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Skip For Now</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (isLast) goHome();
                    else next();
                  }}
                  style={[styles.btn, styles.btnPrimary]}
                >
                  <Text style={styles.btnPrimaryText}>{isLast ? "Browse Fixtures" : "Continue"}</Text>
                </Pressable>
              </View>

              <Text style={styles.micro}>Football-first city breaks. Planned properly.</Text>
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

  skipPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  skipText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },

  brand: { alignItems: "center", gap: 6 },

  logo: { width: 110, height: 110 },

  tagline: {
    color: theme.colors.primary,
    fontWeight: "900",
    letterSpacing: 0.6,
    fontSize: theme.fontSize.sm,
  },

  card: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    marginBottom: 8,
    fontSize: theme.fontSize.xs,
  },

  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900",
    lineHeight: 34,
  },

  h2: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
    marginTop: 6,
    marginBottom: 10,
    opacity: 0.92,
  },

  body: {
    color: "rgba(255,255,255,0.70)",
    fontSize: theme.fontSize.md,
    lineHeight: 22,
    fontWeight: "700",
  },

  dots: {
    marginTop: 14,
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
    backgroundColor: "rgba(0,0,0,0.50)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  btnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnGhostText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  micro: {
    marginTop: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
  },
});
