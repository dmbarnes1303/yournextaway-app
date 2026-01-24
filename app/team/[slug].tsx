// app/team/[slug].tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import teamGuides from "@/src/data/teamGuides/teamGuides";

function titleCaseLoose(input: string) {
  const s = String(input || "").trim();
  if (!s) return "";
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function TeamGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slug = useMemo(() => String(params.slug ?? "").trim().toLowerCase(), [params.slug]);
  const guide = useMemo(() => (slug ? teamGuides[slug] ?? null : null), [slug]);

  const title = useMemo(() => titleCaseLoose(slug) || "Team", [slug]);

  if (!slug) {
    return (
      <Background imageUrl={getBackground("team")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <View style={styles.bodyPad}>
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState title="Missing team" message="No team slug was provided." />
            </GlassCard>
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  if (!guide) {
    return (
      <Background imageUrl={getBackground("team")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.bodyPad}>
            <GlassCard style={styles.hero} intensity={26}>
              <Text style={styles.kicker}>TEAM GUIDE</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subTitle}>Team guide not available yet.</Text>

              <View style={{ height: 12 }} />

              <Pressable
                onPress={() => router.push("/(tabs)/fixtures")}
                style={styles.primaryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>Browse Fixtures</Text>
                <Text style={styles.primaryBtnMeta}>Find matches to build a trip</Text>
              </Pressable>
            </GlassCard>

            <GlassCard style={styles.card} intensity={22}>
              <SectionHeader title="What will be here" subtitle="V1 placeholder (safe + useful)" />
              <View style={styles.bullets}>
                {[
                  "Short club snapshot and context (who they are, what the city vibe feels like).",
                  "Stadium basics and matchday logistics (getting there, timings, best areas to base).",
                  "Tickets guidance (where to look, what to avoid, typical difficulty).",
                  "Neighbourhood suggestions for a weekend trip (food, bars, walkability).",
                ].map((t, idx) => (
                  <View key={`${idx}-${t}`} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{t}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </ScrollView>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageUrl={getBackground("team")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.bodyPad}>
          <GlassCard style={styles.hero} intensity={26}>
            <Text style={styles.kicker}>TEAM GUIDE</Text>
            <Text style={styles.title}>{title}</Text>

            <View style={styles.heroCtas}>
              <Pressable
                onPress={() => router.push("/(tabs)/fixtures")}
                style={styles.primaryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>Browse Fixtures</Text>
                <Text style={styles.primaryBtnMeta}>Find matches to build a trip</Text>
              </Pressable>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <SectionHeader title="History & identity" subtitle="Quick context" />
            <GlassCard style={styles.card} intensity={22}>
              {guide.history ? <Text style={styles.longText}>{guide.history}</Text> : <EmptyState title="—" message="No content yet." />}
            </GlassCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Stadium" subtitle="Basics and what to expect" />
            <GlassCard style={styles.card} intensity={22}>
              {guide.stadium ? <Text style={styles.longText}>{guide.stadium}</Text> : <EmptyState title="—" message="No content yet." />}
            </GlassCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Atmosphere" subtitle="What a matchday feels like" />
            <GlassCard style={styles.card} intensity={22}>
              {guide.atmosphere ? (
                <Text style={styles.longText}>{guide.atmosphere}</Text>
              ) : (
                <EmptyState title="—" message="No content yet." />
              )}
            </GlassCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Tickets" subtitle="How to approach buying" />
            <GlassCard style={styles.card} intensity={22}>
              {guide.tickets ? <Text style={styles.longText}>{guide.tickets}</Text> : <EmptyState title="—" message="No content yet." />}
            </GlassCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Getting there" subtitle="Transport and timing" />
            <GlassCard style={styles.card} intensity={22}>
              {guide.gettingThere ? (
                <Text style={styles.longText}>{guide.gettingThere}</Text>
              ) : (
                <EmptyState title="—" message="No content yet." />
              )}
            </GlassCard>
          </View>

          <View style={{ height: 14 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },

  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  backText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.sm },

  scroll: { flex: 1 },

  bodyPad: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  hero: { padding: theme.spacing.md },

  kicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900" as any,
    letterSpacing: 0.6,
  },

  title: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900" as any,
  },

  subTitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  heroCtas: { marginTop: 14, gap: 10 },

  primaryBtn: {
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
    alignItems: "center",
  },
  primaryBtnText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.md },
  primaryBtnMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "700" as any },

  section: { marginTop: 2 },
  card: { padding: theme.spacing.md },

  longText: { color: theme.colors.text, fontSize: theme.fontSize.sm, lineHeight: 18 },

  bullets: { gap: 10, marginTop: 10 },
  bulletRow: { flexDirection: "row", gap: 10 },
  bulletDot: { color: theme.colors.primary, fontWeight: "900" as any, width: 12 },
  bulletText: { flex: 1, color: theme.colors.text, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
