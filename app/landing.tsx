import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

const LOGO = require("../src/yna-logo.png");

export default function LandingScreen() {
  const router = useRouter();

  return (
    <Background imageUrl={getBackground("home")}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.wrap}>
          <View style={styles.brandTop}>
            <View style={styles.logoBadge}>
              <Image source={LOGO} style={styles.logo} />
            </View>

            <View style={styles.brandText}>
              <Text style={styles.brandName}>YourNextAway</Text>
              <View style={styles.accentRow}>
                <View style={styles.accentGreen} />
                <View style={styles.accentBlue} />
                <View style={styles.accentGold} />
              </View>
            </View>
          </View>

          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.h1}>Plan your next football city break</Text>
            <Text style={styles.sub}>
              Fixtures, cities and saved trips — in one fast, reliable flow.
            </Text>

            <View style={styles.valueRow}>
              <View style={styles.valuePill}>
                <Text style={styles.valuePillText}>Real fixtures</Text>
              </View>
              <View style={styles.valuePillAlt}>
                <Text style={styles.valuePillText}>City-aware trips</Text>
              </View>
              <View style={styles.valuePillAlt2}>
                <Text style={styles.valuePillText}>Simple saves</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={() => router.push("/onboarding")} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Get started</Text>
              </Pressable>

              <Pressable onPress={() => router.replace("/(tabs)/home")} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Skip for now</Text>
              </Pressable>
            </View>
          </GlassCard>

          <Text style={styles.footerNote}>
            Neutral travel planning — built for exploring cities around fixtures.
          </Text>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  wrap: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "flex-end",
    gap: 14,
  },

  brandTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 2,
  },

  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  logo: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },

  brandText: { flex: 1 },

  brandName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  accentRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  accentGreen: {
    width: 26,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,255,136,0.70)",
  },
  accentBlue: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0, 92, 175, 0.60)",
  },
  accentGold: {
    width: 14,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 196, 46, 0.65)",
  },

  card: { padding: theme.spacing.lg },

  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    marginBottom: 10,
    lineHeight: 34,
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },

  valueRow: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  valuePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  valuePillAlt: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0, 92, 175, 0.40)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  valuePillAlt2: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 196, 46, 0.35)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  valuePillText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

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

  footerNote: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
    paddingHorizontal: 10,
  },
});
