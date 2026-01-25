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
  title: string; // Title Case
  subtitle: string; // Title Case
  body: string; // sentence case
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

  const dotColors = useMemo(() => [theme.colors.primary, theme.colors.accent, theme.colors.warning], []);
  const [i, setI] = useState(0);
  const isLast = i === steps.length - 1;

  const bg = steps[i]?.bgKey ?? "onboarding1";

  return (
    <Background imageUrl={getBackground(bg)} overlayOpacity={0.68}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.screen}>
          {/* Top row */}
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.backPill} hitSlop={10}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            <View style={styles.planPill}>
              <Text style={styles.planLabel}>Plan</Text>
              <Text style={styles.planValue}>Full Access</Text>
            </View>
          </View>

          {/* Brand block */}
          <View style={styles.brand}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
          </View>

          {/* Card */}
          <GlassCard style={styles.card} intensity={24}>
            <Text style={styles.kicker}>
              Step {i + 1} of {steps.length}
            </Text>

            <Text style={styles.h1}>{steps[i].title}</Text>
            <Text style={styles.h2}>{steps[i].subtitle}</Text>
            <Text style={styles.body}>{steps[i].body}</Text>

            {/* Dots */}
            <View style={styles.dots}>
              {steps.map((_, idx) => {
                const base = dotColors[idx] ?? "rgba(255,255,255,0.16)";
                const active = idx === i;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: active ? base : "rgba(255,255,255,0.12)",
                        borderColor: active ? base : "rgba(255,255,255,0.10)",
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable onPress={() => router.replace("/(tabs)/home")} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Skip For Now</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (isLast) router.replace("/(tabs)/home");
                  else setI((n) => Math.min(n + 1, steps.length - 1));
                }}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnPrimaryText}>{isLast ? "Start Planning" : "Continue"}</Text>
              </Pressable>
            </View>

            <Text style={styles.micro}>
              Football-first city breaks across Europe — planned properly in one flow.
            </Text>
          </GlassCard>
        </View>
      </SafeAreaView>
    </Background>
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  backPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  backText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  planPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.28)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "flex-end",
  },
  planLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900" },
  planValue: { marginTop: 2, color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: "900" },

  brand: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },

  logo: { width: 132, height: 132 },

  tagline: {
    color: theme.colors.primary,
    fontWeight: "900",
    letterSpacing: 0.6,
    fontSize: theme.fontSize.sm,
  },

  card: {
    padding: theme.spacing.lg,
    marginTop: 6,
  },

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
