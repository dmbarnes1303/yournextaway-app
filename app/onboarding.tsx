// app/onboarding.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, Pressable, Image as RNImage } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

// Local fallbacks you already have (never fails)
const FALLBACK_1 = require("@/src/assets/backgrounds/onboarding-1.png");
const FALLBACK_2 = require("@/src/assets/backgrounds/onboarding-2.png");
const FALLBACK_3 = require("@/src/assets/backgrounds/onboarding-3.png");
const FALLBACK_4 = require("@/src/assets/backgrounds/onboarding-4.png");

/**
 * Unsplash (RN-safe) sources.
 * These are keyword-based and can change — acceptable for now.
 * When you’re ready to lock it down, we’ll swap these to fixed images.unsplash.com photo IDs.
 */
const REMOTE_BG_1 = { uri: "https://source.unsplash.com/1600x2400/?football,stadium,night,floodlights" };
const REMOTE_BG_2 = { uri: "https://source.unsplash.com/1600x2400/?airport,departure,travel,lounge,modern" }; // cleaner than “airport interior”
const REMOTE_BG_3 = { uri: "https://source.unsplash.com/1600x2400/?europe,city,night,street,lights" };
const REMOTE_BG_4 = { uri: "https://source.unsplash.com/1600x2400/?airplane,sunset,sky,travel" };

type Step = {
  title: string;
  subtitle: string;
  body: string;
  remoteBg: { uri: string };
  fallbackBg: any;
};

const STEPS: Step[] = [
  {
    title: "Start With A Fixture",
    subtitle: "Pick The Match — We Handle The Rest",
    body:
      "Browse fixtures across Europe’s top leagues, follow the ones you like, and anchor your trip around the best option. If kickoff changes, you’ll be alerted — so you don’t book blind.",
    remoteBg: REMOTE_BG_1,
    fallbackBg: FALLBACK_1,
  },
  {
    title: "Build The Trip In One Hub",
    subtitle: "Tickets, Flights, Stays — Organised",
    body:
      "Save ticket links, compare flights and places to stay, and keep everything in one place. No messy screenshots. No hunting through tabs. Just a clean trip workspace built around the match.",
    remoteBg: REMOTE_BG_2,
    fallbackBg: FALLBACK_2,
  },
  {
    title: "Make The City Break Better",
    subtitle: "Matchday Planning, Done Properly",
    body:
      "Use city and team guidance to plan beyond the match — where to base yourself, how to time the day, and what to do around it. Your trip should feel effortless, not improvised.",
    remoteBg: REMOTE_BG_3,
    fallbackBg: FALLBACK_3,
  },
  {
    title: "Set Your Defaults",
    subtitle: "So Planning Feels Personal",
    body:
      "Optional — set your usual departure city, currency, and preferences. You can change this anytime in Profile, but setting it now makes future planning faster.",
    remoteBg: REMOTE_BG_4,
    fallbackBg: FALLBACK_4,
  },
];

export default function Onboarding() {
  const [stepIndex, setStepIndex] = useState(0);

  // Track which remote backgrounds failed so we can instantly fallback
  const [failedRemote, setFailedRemote] = useState<Record<number, boolean>>({});

  const step = useMemo(() => STEPS[stepIndex] ?? STEPS[0], [stepIndex]);
  const isLast = stepIndex === STEPS.length - 1;

  const bgSource = useMemo(() => {
    if (failedRemote[stepIndex]) return step.fallbackBg;
    return step.remoteBg;
  }, [failedRemote, step, stepIndex]);

  // Prefetch remote background for the current step; fallback if it fails
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ok = await RNImage.prefetch(step.remoteBg.uri);
        if (!ok && !cancelled) {
          setFailedRemote((prev) => ({ ...prev, [stepIndex]: true }));
        }
      } catch {
        if (!cancelled) setFailedRemote((prev) => ({ ...prev, [stepIndex]: true }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stepIndex, step.remoteBg.uri]);

  const goHome = useCallback(() => {
    router.replace("/(tabs)/home");
  }, []);

  const next = useCallback(() => {
    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const back = useCallback(() => {
    setStepIndex((s) => Math.max(s - 1, 0));
  }, []);

  return (
    <Background imageSource={bgSource} overlayOpacity={0.62}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Top controls */}
        <View style={styles.topRow}>
          {stepIndex > 0 ? (
            <Pressable onPress={back} style={styles.pill}>
              <Text style={styles.pillText}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ width: 86 }} />
          )}

          <Pressable onPress={goHome} style={styles.pill}>
            <Text style={styles.pillText}>Skip</Text>
          </Pressable>
        </View>

        {/* Brand */}
        <View style={styles.brand}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.motto}>PLAN • FLY • WATCH • REPEAT</Text>
        </View>

        {/* Content */}
        <View style={styles.cardWrap}>
          <GlassCard style={styles.card}>
            <Text style={styles.kicker}>
              Step {stepIndex + 1} Of {STEPS.length}
            </Text>

            <Text style={styles.h1}>{step.title}</Text>
            <Text style={styles.h2}>{step.subtitle}</Text>
            <Text style={styles.body}>{step.body}</Text>

            <View style={styles.dots}>
              {STEPS.map((_, i) => {
                const active = i === stepIndex;
                return <View key={`dot-${i}`} style={[styles.dot, active && styles.dotActive]} />;
              })}
            </View>

            <View style={styles.actions}>
              <Pressable onPress={goHome} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Skip For Now</Text>
              </Pressable>

              <Pressable onPress={isLast ? goHome : next} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>{isLast ? "Start Exploring" : "Continue"}</Text>
              </Pressable>
            </View>

            <Text style={styles.micro}>Premium Football Travel, Without The Chaos.</Text>
          </GlassCard>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 86,
    alignItems: "center",
  },

  pillText: {
    color: "rgba(255,255,255,0.78)",
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  brand: {
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },

  logo: {
    width: 112,
    height: 112,
  },

  motto: {
    textAlign: "center",
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.0,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  cardWrap: {
    paddingBottom: 6,
    justifyContent: "flex-end",
  },

  card: {
    padding: theme.spacing.lg,
    borderRadius: 26,
    gap: 10,
  },

  kicker: {
    color: "rgba(255,255,255,0.62)",
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    letterSpacing: 0.6,
  },

  h1: {
    marginTop: 2,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0.2,
  },

  h2: {
    marginTop: 4,
    color: "rgba(255,255,255,0.92)",
    fontWeight: theme.fontWeight.black,
    fontSize: 13,
    letterSpacing: 0.3,
  },

  body: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: 15,
    lineHeight: 22,
  },

  dots: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  dotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: "rgba(79,224,138,0.22)",
  },

  actions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },

  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    letterSpacing: 0.2,
  },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  btnGhostText: {
    color: "rgba(255,255,255,0.70)",
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    letterSpacing: 0.1,
  },

  micro: {
    marginTop: 10,
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
