// app/city/[slug].tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import cityGuides from "@/src/data/cityGuides";
import type { CityGuide } from "@/src/data/cityGuides/types";

function normalizeSlug(v: unknown): string {
  const raw = Array.isArray(v) ? v[0] : v;
  return String(raw ?? "")
    .trim()
    .toLowerCase();
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

export default function CityDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = useMemo(() => normalizeSlug(params.slug), [params.slug]);

  const guide = useMemo<CityGuide | null>(() => {
    if (!slug) return null;
    return cityGuides[slug] ?? null;
  }, [slug]);

  const title = guide ? `${guide.name}` : "City Guide";

  return (
    <Background imageUrl={getBackground("trips")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {!slug ? (
            <GlassCard style={styles.card}>
              <EmptyState title="No city selected" message="This route needs a city slug, e.g. /city/london" />
            </GlassCard>
          ) : null}

          {slug && !guide ? (
            <GlassCard style={styles.card}>
              <EmptyState
                title="City guide not found"
                message={`No guide exists for “${slug}”. Current rollout: london, madrid, rome, berlin, paris.`}
              />
            </GlassCard>
          ) : null}

          {slug && guide ? (
            <>
              {/* HERO */}
              <GlassCard style={styles.card} intensity={26}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h1}>{guide.name}</Text>
                    <Text style={styles.sub}>{guide.country}</Text>
                  </View>

                  {guide.tripAdvisorTopThingsUrl ? (
                    <Pressable onPress={() => safeOpenUrl(guide.tripAdvisorTopThingsUrl)} style={styles.ctaBtn}>
                      <Text style={styles.ctaText}>TripAdvisor</Text>
                      <Text style={styles.ctaSub}>Top things</Text>
                    </Pressable>
                  ) : null}
                </View>

                <Text style={styles.body}>{guide.overview}</Text>
              </GlassCard>

              {/* TOP 10 */}
              <GlassCard style={styles.card} intensity={24}>
                <Text style={styles.h2}>Top 10 things to do</Text>
                <Text style={styles.muted}>A practical short-list to build your itinerary quickly.</Text>

                <View style={styles.bullets}>
                  {guide.topThings.slice(0, 10).map((x, i) => (
                    <View key={`${x.title}-${i}`} style={styles.bulletRow}>
                      <Text style={styles.bulletIndex}>{i + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bulletTitle}>{x.title}</Text>
                        <Text style={styles.bulletTip}>{x.tip}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>

              {/* LOCAL TIPS */}
              <GlassCard style={styles.card} intensity={24}>
                <Text style={styles.h2}>Local tips</Text>
                <Text style={styles.muted}>Away-day focused advice to avoid rookie mistakes.</Text>

                <View style={styles.tipList}>
                  {guide.tips.map((t, i) => (
                    <Text key={`${t}-${i}`} style={styles.tipItem}>
                      • {t}
                    </Text>
                  ))}
                </View>
              </GlassCard>

              {/* PRACTICAL INFO */}
              {guide.transport || guide.accommodation ? (
                <GlassCard style={styles.card} intensity={24}>
                  <Text style={styles.h2}>Practical info</Text>

                  {guide.transport ? (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.label}>Transport</Text>
                      <Text style={styles.body}>{guide.transport}</Text>
                    </View>
                  ) : null}

                  {guide.accommodation ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.label}>Accommodation</Text>
                      <Text style={styles.body}>{guide.accommodation}</Text>
                    </View>
                  ) : null}
                </GlassCard>
              ) : null}

              {/* OPTIONAL legacy fields (if you keep them populated later) */}
              {(guide.attractions?.length || guide.food?.length) ? (
                <GlassCard style={styles.card} intensity={24}>
                  <Text style={styles.h2}>More ideas</Text>

                  {guide.attractions?.length ? (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.label}>Attractions</Text>
                      <Text style={styles.body}>{guide.attractions.join(" • ")}</Text>
                    </View>
                  ) : null}

                  {guide.food?.length ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.label}>Food</Text>
                      <Text style={styles.body}>{guide.food.join(" • ")}</Text>
                    </View>
                  ) : null}
                </GlassCard>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  card: { padding: theme.spacing.lg },

  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

  h1: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xl },
  sub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  h2: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  muted: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  label: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginBottom: 6 },
  body: { marginTop: 10, color: theme.colors.text, fontSize: theme.fontSize.md, lineHeight: 20 },

  ctaBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },
  ctaSub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "800", fontSize: theme.fontSize.xs },

  bullets: { marginTop: 12, gap: 12 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletIndex: {
    width: 22,
    textAlign: "center",
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
    marginTop: 1,
  },
  bulletTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  bulletTip: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  tipList: { marginTop: 12, gap: 10 },
  tipItem: { color: theme.colors.text, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
