// app/onboarding.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, Pressable, Platform, Image as RNImage } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/YNAlogo.png");

// Local fallbacks (never fails)
const FALLBACK_1 = require("@/src/assets/backgrounds/onboarding-1.png");
const FALLBACK_2 = require("@/src/assets/backgrounds/onboarding-2.png");
const FALLBACK_3 = require("@/src/assets/backgrounds/onboarding-3.png");
const FALLBACK_4 = require("@/src/assets/backgrounds/onboarding-4.png");

// Remote fixed images.unsplash.com URLs (RN-safe).
const REMOTE_1 = { uri: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80" };
const REMOTE_2 = { uri: "https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&w=1600&q=80" };
const REMOTE_3 = { uri: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80" };
const REMOTE_4 = { uri: "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=1600&q=80" };

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
    subtitle: "Pick the match — plan everything around it",
    body:
      "Browse fixtures across Europe, follow the ones you like, and anchor your trip to the best option. If kickoff changes, you’ll be alerted so you don’t book blind.",
    remoteBg: REMOTE_1,
    fallbackBg: FALLBACK_1,
  },
  {
    title: "Build the trip in one hub",
    subtitle: "Tickets, flights, stays — organised",
    body:
      "Save links, compare options, and keep everything in one place. No messy screenshots. No hunting through tabs. Just a trip workspace built around the match.",
    remoteBg: REMOTE_2,
    fallbackBg: FALLBACK_2,
  },
  {
    title: "Make the city break better",
    subtitle: "Matchday planning done properly",
    body:
      "Use city and team guidance to plan beyond the match — where to base yourself, how to time the day, and what to do around it. Effortless beats improvised.",
    remoteBg: REMOTE_3,
    fallbackBg: FALLBACK_3,
  },
  {
    title: "Set your defaults",
    subtitle: "So planning feels personal",
    body:
      "Optional — set your usual departure city and preferences. You can change this anytime in Profile, but setting it now makes future planning faster.",
    remoteBg: REMOTE_4,
    fallbackBg: FALLBACK_4,
  },
];

export default function Onboarding() {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [failedRemote, setFailedRemote] = useState<Record<number, boolean>>({});

  const step = useMemo(() => STEPS[stepIndex] ?? STEPS[0], [stepIndex]);
  const isLast = stepIndex === STEPS.length - 1;

  const bgSource = useMemo(() => {
    if (failedRemote[stepIndex]) return step.fallbackBg;
    return step.remoteBg;
  }, [failedRemote, step, stepIndex]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await RNImage.prefetch(step.remoteBg.uri);
        if (!ok && !cancelled) setFailedRemote((p) => ({ ...p, [stepIndex]: true }));
      } catch {
        if (!cancelled) setFailedRemote((p) => ({ ...p, [stepIndex]: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stepIndex, step.remoteBg.uri]);

  const goHome = useCallback(() => {
    router.replace("/(tabs)/home");
  }, [router]);

  const next = useCallback(() => setStepIndex((s) => Math.min(s + 1, STEPS.length - 1)), []);
  const back = useCallback(() => setStepIndex((s) => Math.max(s - 1, 0)), []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={bgSource} overlayOpacity={0.62}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          {/* Top controls */}
          <View style={styles.topRow}>
            {stepIndex > 0 ? (
              <Pressable
                onPress={back}
                style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
                android_ripple={{ color: "rgba(255,255,255,0.08)" }}
              >
                <Text style={styles.pillText}>Back</Text>
              </Pressable>
            ) : (
              <View style={{ width: 86 }} />
            )}

            <Pressable
              onPress={goHome}
              style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
              android_ripple={{ color: "rgba(255,255,255,0.08)" }}
            >
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
            <GlassCard strength="strong" style={styles.card}>
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
                <Pressable
                  onPress={goHome}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                >
                  <Text style={styles.btnGhostText}>Skip for now</Text>
                </Pressable>

                <Pressable
                  onPress={isLast ? goHome : next}
                  style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.btnPrimaryText}>{isLast ? "Start exploring" : "Continue"}</Text>
                </Pressable>
              </View>

              <Text style={styles.micro}>Premium football travel, without the chaos.</Text>
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
  },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },

  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 86,
    alignItems: "center",
    overflow: "hidden",
  },
  pillText: { color: "rgba(255,255,255,0.78)", fontWeight: theme.fontWeight.black, fontSize: 12, letterSpacing: 0.2 },

  brand: { alignItems: "center", marginTop: 14, gap: 10 },
  logo: { width: 112, height: 112 },

  motto: {
    textAlign: "center",
    color: "rgba(79,224,138,0.92)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.0,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  cardWrap: { paddingBottom: 6, justifyContent: "flex-end" },
  card: { padding: theme.spacing.lg, borderRadius: 26, gap: 10 },

  kicker: { color: "rgba(255,255,255,0.62)", fontWeight: theme.fontWeight.black, fontSize: 11, letterSpacing: 0.6 },

  h1: { marginTop: 2, color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 28, lineHeight: 32, letterSpacing: 0.2 },
  h2: { marginTop: 4, color: "rgba(255,255,255,0.92)", fontWeight: theme.fontWeight.black, fontSize: 13, letterSpacing: 0.3 },

  body: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold, fontSize: 15, lineHeight: 22 },

  dots: { marginTop: 10, flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  dotActive: { backgroundColor: theme.colors.primary, borderColor: "rgba(79,224,138,0.22)" },

  actions: { marginTop: 14, flexDirection: "row", gap: 12 },

  btn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, overflow: "hidden" },

  btnPrimary: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 14, letterSpacing: 0.2 },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 14, letterSpacing: 0.1 },

  micro: { marginTop: 10, textAlign: "center", color: theme.colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
});
