// app/city/[slug].tsx

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import cityGuides from "@/src/data/cityGuides";
import type { CityGuide } from "@/src/data/cityGuides/types";
import { normalizeCityKey } from "@/src/utils/city";

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
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string }>();

  const rawSlug =
    typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : undefined;

  const slug = useMemo(() => normalizeCityKey(rawSlug), [rawSlug]);

  const guide = useMemo<CityGuide | null>(() => {
    if (!slug) return null;
    return cityGuides[slug] ?? null;
  }, [slug]);

  return (
    <Background imageUrl={getBackground("trips")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "City Guide",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.h1}>{guide ? guide.name : slug ? slug : "City"}</Text>
            <Text style={styles.muted}>
              {guide ? `${guide.country}` : "Guide not found yet. Rolling out city guides in phases."}
            </Text>

            {!guide ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState
                  title="No city guide yet"
                  message={`We don’t have a full guide for “${slug || "—"}” yet.\nCurrent guides: London, Madrid, Rome, Berlin, Paris.`}
                />
              </View>
            ) : (
              <>
                <View style={styles.headerRow}>
                  <Pressable
                    onPress={() => (guide.tripAdvisorTopThingsUrl ? safeOpenUrl(guide.tripAdvisorTopThingsUrl) : null)}
                    disabled={!guide.tripAdvisorTopThingsUrl}
                    style={[styles.ctaBtn, !guide.tripAdvisorTopThingsUrl && { opacity: 0.5 }]}
                  >
                    <Text style={styles.ctaText}>TripAdvisor Top 10</Text>
                  </Pressable>

                  <Pressable onPress={() => router.back()} style={styles.ctaBtn}>
                    <Text style={styles.ctaText}>Back</Text>
                  </Pressable>
                </View>

                <Text style={[styles.body, { marginTop: 12 }]}>{guide.overview}</Text>

                <View style={{ marginTop: 16 }}>
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

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Local tips</Text>
                  <View style={styles.tipList}>
                    {guide.tips.map((t, i) => (
                      <Text key={`${t}-${i}`} style={styles.tipItem}>
                        • {t}
                      </Text>
                    ))}
                  </View>
                </View>

                {(guide.transport || guide.accommodation) ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.sectionTitle}>Practical info</Text>

                    {guide.transport ? (
                      <View style={{ marginTop: 10 }}>
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
            )}
          </GlassCard>
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

  h1: { fontSize: theme.fontSize.xl, fontWeight: "900", color: theme.colors.text },
  muted: { marginTop: 6, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },

  headerRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  ctaBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  ctaText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  label: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginBottom: 6 },
  body: { color: theme.colors.text, fontSize: theme.fontSize.md, lineHeight: 20 },

  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

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
});
