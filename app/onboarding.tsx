import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

type Step = { title: string; body: string };

export default function OnboardingScreen() {
  const router = useRouter();

  const steps: Step[] = useMemo(
    () => [
      { title: "Pick a fixture", body: "Browse upcoming matches and open a match for details." },
      { title: "Build a trip", body: "Select a match, save it as a trip, add notes and dates." },
      { title: "Keep it simple", body: "This build prioritises speed and reliability. Fancy comes later." },
    ],
    []
  );

  const [i, setI] = useState(0);
  const isLast = i === steps.length - 1;

  return (
    <Background imageUrl={getBackground("home")}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.wrap}>
          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.kicker}>Step {i + 1} of {steps.length}</Text>
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
    paddingTop: 110,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "flex-end",
  },
  card: { padding: theme.spacing.lg },
  kicker: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
    marginBottom: 10,
  },
  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    marginBottom: 10,
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },
  dots: { marginTop: theme.spacing.lg, flexDirection: "row", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  dotActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  actions: { marginTop: theme.spacing.lg, flexDirection: "row", gap: 12 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  btnPrimary: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.45)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  btnGhost: { borderColor: theme.colors.border, backgroundColor: "rgba(0,0,0,0.25)" },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.md },
});
