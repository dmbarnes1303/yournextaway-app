import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

type Step = {
  title: string;        // Title Case
  subtitle: string;     // Title Case
  body: string;         // sentence case
};

export default function Onboarding() {
  const router = useRouter();

  const steps: Step[] = useMemo(
    () => [
      {
        title: "Start With A Fixture",
        subtitle: "Find The Right Match Fast",
        body:
          "Browse fixtures by league and date window. Open a match and YourNextAway becomes your trip hub for that city and date.",
      },
      {
        title: "Build The Trip In One Place",
        subtitle: "Flights, Stays, Tickets, Plans",
        body:
          "Compare routes, shortlist areas to stay, add ticket links, and keep everything organised around the fixture so you don’t lose time across ten tabs.",
      },
      {
        title: "Make The City Break Better",
        subtitle: "What To Do, Where To Base Yourself",
        body:
          "Use city and team guides to plan the weekend properly. Save your plan, store bookings in your wallet, and generate random trip ideas when you want inspiration.",
      },
    ],
    []
  );

  const [i, setI] = useState(0);
  const isLast = i === steps.length - 1;

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.75}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.wrap}>
          {/* Brand block */}
          <View style={styles.brand}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appLine}>YourNextAway</Text>
            <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
          </View>

          {/* Card */}
          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.kicker}>
              Step {i + 1} of {steps.length}
            </Text>

            <Text style={styles.h1}>{steps[i].title}</Text>
            <Text style={styles.h2}>{steps[i].subtitle}</Text>
            <Text style={styles.body}>{steps[i].body}</Text>

            <View style={styles.dots}>
              {steps.map((_, idx) => (
                <View key={idx} style={[styles.dot, idx === i && styles.dotActive]} />
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => router.replace("/(tabs)/home")}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={styles.btnGhostText}>Skip For Now</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (isLast) router.replace("/(tabs)/home");
                  else setI((n) => Math.min(n + 1, steps.length - 1));
                }}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnPrimaryText}>
                  {isLast ? "Start Planning" : "Continue"}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.micro}>
              Travel-first planning around fixtures. Choose your vibe for the weekend.
            </Text>
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
    paddingTop: 18,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "flex-end",
    gap: 14,
  },

  brand: { alignItems: "center", gap: 8, paddingBottom: 2 },

  logo: { width: 120, height: 120 },

  appLine: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  tagline: {
    color: theme.colors.primary,
    fontWeight: "900",
    letterSpacing: 0.6,
    fontSize: theme.fontSize.sm,
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
    marginBottom: 6,
    lineHeight: 30,
  },

  h2: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: "900",
    marginBottom: 10,
    opacity: 0.95,
  },

  body: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
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
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  dotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
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
    backgroundColor: "rgba(0,0,0,0.28)",
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
    lineHeight: 16,
    fontWeight: "800",
  },
});
