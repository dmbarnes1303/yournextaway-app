// app/onboarding.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

type Step = { title: string; body: string; kicker: string; bg: "onboarding1" | "onboarding2" | "onboarding3" };

export default function OnboardingScreen() {
  const router = useRouter();

  const steps: Step[] = useMemo(
    () => [
      {
        kicker: "Step 1 of 3",
        title: "Pick A Fixture",
        body: "Browse upcoming matches by league and date window. Open a match to see venue and city context.",
        bg: "onboarding1",
      },
      {
        kicker: "Step 2 of 3",
        title: "Build The Trip",
        body: "Save dates and notes fast. Your trip stays tied to the destination so you can plan around the match.",
        bg: "onboarding2",
      },
      {
        kicker: "Step 3 of 3",
        title: "Stay In Control",
        body: "This build prioritises speed and reliability. The full experience expands trips into stays, transport, and city guides.",
        bg: "onboarding3",
      },
    ],
    []
  );

  const [i, setI] = useState(0);
  const isLast = i === steps.length - 1;

  return (
    <Background imageUrl={getBackground(steps[i].bg)} overlayOpacity={0.72}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.wrap}>
          <View style={styles.brand}>
            <Image source={require("@/src/yna-logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>

            {/* subtle EU accents (blue + gold) */}
            <View style={styles.euDots}>
              <View style={[styles.euDot, { backgroundColor: theme.colors.accent }]} />
              <View style={[styles.euDot, { backgroundColor: theme.colors.warning }]} />
            </View>
          </View>

          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.kicker}>{steps[i].kicker}</Text>
            <Text style={styles.h1}>{steps[i].title}</Text>
            <Text style={styles.body}>{steps[i].body}</Text>

            <View style={styles.dots}>
              {steps.map((_, idx) => (
                <View key={idx} style={[styles.dot, idx === i && styles.dotActive]} />
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable onPress={() => router.replace("/(tabs)/home")} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Skip</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (isLast) router.replace("/(tabs)/home");
                  else setI((n) => Math.min(n + 1, steps.length - 1));
                }}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnPrimaryText}>{isLast ? "Finish" : "Continue"}</Text>
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
    paddingTop: 78,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "flex-end",
    gap: 14,
  },

  brand: { alignItems: "center", gap: 10 },
  logo: { width: 118, height: 118 },
  tagline: { color: theme.colors.primary, fontWeight: "900", letterSpacing: 0.6, fontSize: theme.fontSize.sm },
  euDots: { flexDirection: "row", gap: 8, marginTop: 2 },
  euDot: { width: 18, height: 6, borderRadius: 999, opacity: 0.85 },

  card: { padding: theme.spacing.lg },

  kicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "900", marginBottom: 10 },
  h1: { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "900", marginBottom: 10 },
  body: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, lineHeight: 22 },

  dots: { marginTop: theme.spacing.lg, flexDirection: "row", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  dotActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },

  actions: { marginTop: theme.spacing.lg, flexDirection: "row", gap: 12 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  btnPrimary: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.45)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  btnGhost: { borderColor: theme.colors.border, backgroundColor: "rgba(0,0,0,0.22)" },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.md },
});
