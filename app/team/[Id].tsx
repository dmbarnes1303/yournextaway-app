// app/team/[id].tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import teamGuides from "@/src/data/teamGuides";

function enc(v: string) {
  return encodeURIComponent(v);
}

async function safeOpenUrl(url: string) {
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}

function normalizeTeamKey(input: string) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function titleFromKey(key: string) {
  if (!key) return "";
  return key
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildTicketsUrl(teamName: string) {
  const q = `${teamName} tickets`;
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildStadiumUrl(stadium: string, teamName: string) {
  const q = `${stadium} ${teamName} bag policy entry times seating`;
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildMapsUrl(stadium: string) {
  const q = stadium.trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
}

/**
 * V1 Team screen:
 * - reads from src/data/teamGuides registry when available
 * - otherwise “link-out mode” keeps the screen useful
 *
 * Route:
 * /team/[id]
 * where id is a team key/slug you control (e.g. "arsenal", "real-madrid", etc.)
 */
export default function TeamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawId = useMemo(() => String(params.id ?? "").trim(), [params.id]);
  const teamKey = useMemo(() => normalizeTeamKey(rawId), [rawId]);

  const guide = useMemo(() => (teamKey ? (teamGuides as any)[teamKey] ?? null : null), [teamKey]);

  const teamName = useMemo(() => {
    // Your current TeamGuide type doesn’t include a display name, so we derive it from the key.
    return titleFromKey(teamKey) || "Team";
  }, [teamKey]);

  const stadium = useMemo(() => String(guide?.stadium ?? "").trim(), [guide?.stadium]);

  const ticketsUrl = useMemo(() => buildTicketsUrl(teamName), [teamName]);
  const stadiumInfoUrl = useMemo(() => buildStadiumUrl(stadium || "stadium", teamName), [stadium, teamName]);
  const mapsUrl = useMemo(() => buildMapsUrl(stadium || teamName), [stadium, teamName]);

  if (!teamKey) {
    return (
      <Background imageUrl={getBackground("team")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <View style={styles.pad}>
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState title="Missing team" message="No team id was provided." />
            </GlassCard>
          </View>
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

        <ScrollView style={styles.scroll} contentContainerStyle={styles.pad}>
          <GlassCard style={styles.hero} intensity={26}>
            <Text style={styles.kicker}>TEAM GUIDE</Text>
            <Text style={styles.title} numberOfLines={2}>
              {teamName}
            </Text>

            <Text style={styles.subTitle}>
              {guide ? "Curated guide" : "Guide not written yet"} • V1 still works via link-outs
            </Text>

            <View style={styles.heroCtas}>
              <Pressable
                onPress={() => router.push("/(tabs)/fixtures")}
                style={styles.primaryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>Browse fixtures</Text>
                <Text style={styles.primaryBtnMeta}>Pick a match → plan your trip</Text>
              </Pressable>

              <View style={styles.twoCol}>
                <Pressable
                  onPress={() => safeOpenUrl(ticketsUrl)}
                  style={[styles.smallBtn, styles.smallBtnSecondary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.smallBtnTitle}>Tickets</Text>
                  <Text style={styles.smallBtnMeta}>Search current options</Text>
                </Pressable>

                <Pressable
                  onPress={() => safeOpenUrl(mapsUrl)}
                  style={[styles.smallBtn, styles.smallBtnSecondary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.smallBtnTitle}>Stadium map</Text>
                  <Text style={styles.smallBtnMeta}>{stadium ? stadium : "Open maps"}</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => safeOpenUrl(stadiumInfoUrl)}
                style={styles.linkBtn}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>Stadium info (entry, bags, seating)</Text>
              </Pressable>
            </View>
          </GlassCard>

          {guide ? (
            <>
              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="History" subtitle="Context in one pass" />
                <Text style={styles.bodyText}>{String(guide.history ?? "").trim() || "—"}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Stadium" subtitle="What to expect on arrival" />
                <Text style={styles.bodyText}>{stadium || "—"}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Atmosphere" subtitle="What the matchday feels like" />
                <Text style={styles.bodyText}>{String(guide.atmosphere ?? "").trim() || "—"}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Tickets" subtitle="How to approach it" />
                <Text style={styles.bodyText}>{String(guide.tickets ?? "").trim() || "—"}</Text>
                <Pressable onPress={() => safeOpenUrl(ticketsUrl)} style={styles.linkBtn} accessibilityRole="button">
                  <Text style={styles.linkText}>Search tickets</Text>
                </Pressable>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Getting there" subtitle="Transport and timing" />
                <Text style={styles.bodyText}>{String(guide.gettingThere ?? "").trim() || "—"}</Text>
                <Pressable onPress={() => safeOpenUrl(mapsUrl)} style={styles.linkBtn} accessibilityRole="button">
                  <Text style={styles.linkText}>Open maps</Text>
                </Pressable>
              </GlassCard>
            </>
          ) : (
            <GlassCard style={styles.card} intensity={22}>
              <SectionHeader title="This team isn’t curated yet" subtitle="Still useful right now" />
              <Text style={styles.bodyText}>
                Team guides will be filled properly in the next phase. For V1, use Fixtures to find a match, then build
                your trip. The links below keep everything functional.
              </Text>

              <View style={{ marginTop: 10, gap: 10 }}>
                <Pressable onPress={() => safeOpenUrl(ticketsUrl)} style={styles.linkRow} accessibilityRole="button">
                  <Text style={styles.linkTitle}>Tickets</Text>
                  <Text style={styles.linkMeta}>Search current availability</Text>
                </Pressable>

                <Pressable onPress={() => safeOpenUrl(mapsUrl)} style={styles.linkRow} accessibilityRole="button">
                  <Text style={styles.linkTitle}>Stadium map</Text>
                  <Text style={styles.linkMeta}>Location and nearby areas</Text>
                </Pressable>

                <Pressable onPress={() => safeOpenUrl(stadiumInfoUrl)} style={styles.linkRow} accessibilityRole="button">
                  <Text style={styles.linkTitle}>Stadium info</Text>
                  <Text style={styles.linkMeta}>Entry rules, bags, seating</Text>
                </Pressable>
              </View>
            </GlassCard>
          )}

          <View style={{ height: 6 }} />
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

  pad: {
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
  primaryBtnMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: "700" as any,
    textAlign: "center",
  },

  twoCol: { flexDirection: "row", gap: 10 },

  smallBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  smallBtnSecondary: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  smallBtnTitle: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.sm },
  smallBtnMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },

  linkBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  linkText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.sm },

  card: { padding: theme.spacing.md },

  bodyText: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  linkRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  linkTitle: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.sm },
  linkMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
