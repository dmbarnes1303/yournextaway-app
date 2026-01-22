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

import { normalizeCityKey } from "@/src/utils/city";

function coerceSlug(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
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
  const params = useLocalSearchParams();

  const raw = useMemo(() => coerceSlug((params as any)?.slug), [params]);
  const slug = useMemo(() => normalizeCityKey(raw), [raw]);

  const guide = useMemo<CityGuide | null>(() => {
    if (!slug) return null;
    return (cityGuides as Record<string, CityGuide>)[slug] ?? null;
  }, [slug]);

  return (
    <Background imageUrl={getBackground("trips")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: guide ? `${guide.name} Guide` : "City Guide",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card} intensity={26}>
            {!raw ? <EmptyState title="Missing city" message="No city slug was provided." /> : null}

            {raw && !slug ? (
              <EmptyState title="Invalid city" message={`Couldn’t normalize slug: “${raw}”.`} />
            ) : null}

            {slug && !guide ? (
              <>
                <EmptyState
                  title="Guide not found"
                  message={`No guide exists for “${slug}” yet.\nCurrent rollout: London, Madrid, Rome, Berlin, Paris.`}
                />
                <Text style={styles.debugLine}>Raw slug: “{raw}”</Text>
              </>
            ) : null}

            {guide ? (
              <>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h1}>{guide.name}</Text>
                    <Text style={styles.muted}>
                      {guide.country}
                      {slug ? ` • ${slug}` : ""}
                    </Text>
                  </View>

                  {guide.tripAdvisorTopThingsUrl ? (
                    <Pressable
                      onPress={() => safeOpenUrl(guide.tripAdvisorTopThingsUrl)}
                      style={styles.ctaBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Open TripAdvisor top things to do"
                    >
                      <Text style={styles.ctaText}>TripAdvisor Top 10</Text>
                    </Pressable>
                  ) : null}
                </View>

                <Text style={[styles.body, { marginTop: 10 }]}>{guide.overview}</Text>

                <View style={{ marginTop: 14 }}>
                  <Text style={styles.sectionTitle}>Top 10 things to do</Text>
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
                </View>

                <View style={{ marginTop: 14 }}>
                  <Text style={styles.sectionTitle}>Local tips</Text>
                  <View style={styles.tipList}>
                    {guide.tips.map((t, i) => (
                      <Text key={`${t}-${i}`} style={styles.tipItem}>
                        • {t}
                      </Text>
                    ))}
                  </View>
                </View>

                {Array.isArray((guide as any).food) && (guide as any).food.length ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.sectionTitle}>Food highlights</Text>
                    <View style={styles.tipList}>
                      {(guide as any).food.map((t: string, i: number) => (
                        <Text key={`${t}-${i}`} style={styles.tipItem}>
                          • {t}
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : null}

                {(guide.transport || guide.accommodation) ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.sectionTitle}>Practical info</Text>

                    {guide.transport ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.label}>Transport</Text>
                        <Text style={styles.body}>{guide.transport}</Text>
                      </View>
                    ) : null}

                    {guide.accommodation ? (
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.label}>Accommodation</Text>
                        <Text style={styles.body}>{guide.accommodation}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : null}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.lg },
  card: { padding: theme.spacing.lg },

  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },

  h1: { fontSize: theme.fontSize.xl, fontWeight: "900", color: theme.colors.text },
  muted: { marginTop: 6, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },

  label: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginBottom: 6 },
  body: { color: theme.colors.text, fontSize: theme.fontSize.md, lineHeight: 20 },

  ctaBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignSelf: "flex-start",
  },
  ctaText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  sectionTitle: { marginTop: 2, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  bullets: { marginTop: 10, gap: 10 },
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

  tipList: { marginTop: 10, gap: 8 },
  tipItem: { color: theme.colors.text, fontSize: theme.fontSize.sm, lineHeight: 18 },

  debugLine: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
  },
});
