// app/onboarding.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, Pressable, Image as RNImage, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";

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
 * Stable Unsplash CDN URLs (predictable + cacheable).
 * If you want, we can later curate “perfect” stadium/city images by specific photo IDs.
 */
const REMOTE_BG_1 = { uri: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80" }; // stadium vibe
const REMOTE_BG_2 = { uri: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80" }; // travel / terminal
const REMOTE_BG_3 = { uri: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80" }; // europe streets
const REMOTE_BG_4 = { uri: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80" }; // flight / sky

type Step = {
  title: string;
  subtitle: string;
  body: string;
  remoteBg: { uri: string };
  fallbackBg: any;
};

const STEPS: Step[] = [
  {
    title: "Start with a fixture",
    subtitle: "Pick the match — everything else snaps into place",
    body:
      "Browse upcoming fixtures across Europe. Follow the ones you like and plan around the best option. If kickoff details change, you’ll get nudged — so you don’t book blind.",
    remoteBg: REMOTE_BG_1,
    fallbackBg: FALLBACK_1,
  },
  {
    title: "Build the trip in one hub",
    subtitle: "Tickets, flights, stays — organised",
    body:
      "Save links, compare options, and keep everything in a single trip workspace. No messy screenshots. No hunting through tabs. Just a clean plan built around the match.",
    remoteBg: REMOTE_BG_2,
    fallbackBg: FALLBACK_2,
  },
  {
    title: "Make the city break better",
    subtitle: "Matchday planning, done properly",
    body:
      "Use city and team guidance to plan beyond the 90 minutes — where to base yourself, how to time the day, and what else is worth doing while you’re there.",
    remoteBg: REMOTE_BG_3,
    fallbackBg: FALLBACK_3,
  },
  {
    title: "Set your defaults",
    subtitle: "So future planning is faster",
    body:
      "Optional — choose basics like your usual departure city and preferences. You can change this anytime in Profile, but setting it now makes planning feel personal.",
    remoteBg: REMOTE_BG_4,
    fallbackBg: FALLBACK_4,
  },
];

function Pill({
  label,
  onPress,
  variant,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant: "primary" | "ghost";
  disabled?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={!!disabled}
      style={({ pressed }) => [
        styles.pillBtn,
        primary ? styles.pillPrimary : styles.pillGhost,
        (pressed || disabled) && styles.pressed,
      ]}
      android_ripple={{ color: primary ? "rgba(79,224,138,0.14)" : "rgba(255,255,255,0.10)" }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.pillBtnText, primary ? styles.pillPrimaryText : styles.pillGhostText]}>{label}</Text>
    </Pressable>
  );
}

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
        if (!ok && !cancelled) setFailedRemote((prev) => ({ ...prev, [stepIndex]: true }));
      } catch {
        if (!cancelled) setFailedRemote((prev) => ({ ...prev, [stepIndex]: true }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stepIndex, step.remoteBg.uri]);

  const goHome = useCallback(() => {
    router.replace("/(tabs)/home" as any);
  }, []);

  const next = useCallback(() => {
    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const back = useCallback(() => {
    setStepIndex((s) => Math.max(s - 1, 0));
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={bgSource} overlayOpacity={0.66}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          {/* Top controls */}
          <View style={styles.topRow}>
            {stepIndex > 0 ? (
              <Pressable
                onPress={back}
                style={({ pressed }) => [styles.topPill, pressed && styles.pressed]}
                android_ripple={{ color: "rgba(255,255,255,0.10)" }}
              >
                <Text style={styles.topPillText}>Back</Text>
              </Pressable>
            ) : (
              <View style={{ width: 90 }} />
            )}

            <Pressable
              onPress={goHome}
              style={({ pressed }) => [styles.topPill, pressed && styles.pressed]}
              android_ripple={{ color: "rgba(255,255,255,0.10)" }}
            >
              <Text style={styles.topPillText}>Skip</Text>
            </Pressable>
          </View>

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.brandTitle}>YourNextAway</Text>
            <Text style={styles.brandMotto}>Fixtures • Guides • Trip workspace</Text>
          </View>

          {/* Content */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} noPadding>
              <View style={styles.cardInner}>
                <Text style={styles.kicker}>
                  Step {stepIndex + 1} of {STEPS.length}
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
                  <Pill label="Not now" onPress={goHome} variant="ghost" />
                  <Pill label={isLast ? "Start exploring" : "Continue"} onPress={isLast ? goHome : next} variant="primary" />
                </View>

                <Text style={styles.micro}>Football-first travel planning — without the chaos.</Text>
              </View>
            </GlassCard>
          </View>
        </SafeAreaView>
      </Background>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    justifyContent: "space-between",
    gap: 14,
  },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  topPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 90,
    alignItems: "center",
    overflow: "hidden",
  },

  topPillText: {
    color: "rgba(255,255,255,0.80)",
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  brand: {
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logo: {
    width: 84,
    height: 84,
    opacity: 0.98,
  },

  brandTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  brandMotto: {
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.2,
  },

  cardWrap: {
    paddingBottom: 6,
    justifyContent: "flex-end",
  },

  card: {
    borderRadius: 26,
    overflow: "hidden",
  },

  cardInner: {
    padding: theme.spacing.lg,
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
    lineHeight: 34,
    letterSpacing: 0.2,
  },

  h2: {
    marginTop: 2,
    color: "rgba(255,255,255,0.92)",
    fontWeight: theme.fontWeight.black,
    fontSize: 13,
    letterSpacing: 0.2,
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
    width: 9,
    height: 9,
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
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },

  pillBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  pillPrimary: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },

  pillGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  pillBtnText: {
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
    letterSpacing: 0.2,
  },

  pillPrimaryText: { color: theme.colors.text },
  pillGhostText: { color: theme.colors.textSecondary },

  micro: {
    marginTop: 10,
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
    opacity: 0.92,
  },
});
