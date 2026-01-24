// app/team/[slug].tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

// Data (currently empty registry in your project)
import teamGuides from "@/src/data/teamGuides/teamGuides";

function normalizeTeamKey(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

function prettyTitleFromSlug(slug: string) {
  const s = String(slug || "").trim();
  if (!s) return "Team";
  return s
    .split(/[-_]/g)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

async function openUrl(url?: string) {
  if (!url) return;
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) return;
    await Linking.openURL(url);
  } catch {
    // swallow
  }
}

export default function TeamGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slugRaw = useMemo(() => String(params.slug ?? "").trim(), [params.slug]);
  const teamKey = useMemo(() => normalizeTeamKey(slugRaw), [slugRaw]);

  const guide = useMemo(() => {
    if (!teamKey) return null;
    const g = (teamGuides as any)?.[teamKey];
    return g ?? null;
  }, [teamKey]);

  const title = useMemo(() => {
    // If guide later includes a display name field, prefer that (not in your current TeamGuide type)
    return prettyTitleFromSlug(slugRaw);
  }, [slugRaw]);

  const searchUrl = useMemo(() => {
    // Neutral, safe fallback until you add richer team metadata
    const q = title ? `${title} tickets stadium travel` : "football club";
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  }, [title]);

  return (
    <Background imageUrl={getBackground("team")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Team guide</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {!guide ? (
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState
                title="No team guide yet"
                message="This team doesn’t have a guide loaded yet. You can still browse fixtures and build trips normally."
              />

              <Pressable onPress={() => openUrl(searchUrl)} style={styles.linkBtn}>
                <Text style={styles.linkText}>Search info online</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <>
              <View style={styles.section}>
                <SectionHeader title="History" subtitle="Context, identity, and what the club is about." />
                <GlassCard style={styles.card} intensity={22}>
                  <Text style={styles.body}>{guide.history || "—"}</Text>
                </GlassCard>
              </View>

              <View style={styles.section}>
                <SectionHeader title="Stadium" subtitle="Venue basics and what to expect." />
                <GlassCard style={styles.card} intensity={22}>
                  <Text style={styles.body}>{guide.stadium || "—"}</Text>
                </GlassCard>
              </View>

              <View style={styles.section}>
                <SectionHeader title="Atmosphere" subtitle="What the match experience feels like." />
                <GlassCard style={styles.card} intensity={22}>
                  <Text style={styles.body}>{guide.atmosphere || "—"}</Text>
                </GlassCard>
              </View>

              <View style={styles.section}>
                <SectionHeader title="Tickets" subtitle="How to buy without headaches." />
                <GlassCard style={styles.card} intensity={22}>
                  <Text style={styles.body}>{guide.tickets || "—"}</Text>

                  <Pressable onPress={() => openUrl(searchUrl)} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Search tickets and official info</Text>
                  </Pressable>
                </GlassCard>
              </View>

              <View style={styles.section}>
                <SectionHeader title="Getting there" subtitle="Transport notes and practical routing." />
                <GlassCard style={styles.card} intensity={22}>
                  <Text style={styles.body}>{guide.gettingThere || "—"}</Text>
                </GlassCard>
              </View>

              <View style={{ height: 12 }} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  backText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.sm },

  title: {
    color: theme.colors.text,
    fontWeight: "900" as any,
    fontSize: theme.fontSize.xl,
    lineHeight: 30,
  },
  subtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  section: { marginTop: 2 },
  card: { padding: theme.spacing.md },

  body: { color: theme.colors.text, fontSize: theme.fontSize.md, lineHeight: 20 },

  linkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  linkText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.sm },
});
