// app/city/[slug].tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getCityGuide } from "@/src/data/cityGuides";

function titleCaseLoose(input: string) {
  const s = String(input || "").trim();
  if (!s) return "";
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function openUrl(url?: string) {
  if (!url) return;
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) return;
    await Linking.openURL(url);
  } catch {
    // no-op
  }
}

export default function CityGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slug = useMemo(() => String(params.slug ?? "").trim().toLowerCase(), [params.slug]);
  const guide = useMemo(() => (slug ? getCityGuide(slug) : null), [slug]);

  const title = useMemo(() => guide?.name ?? titleCaseLoose(slug) || "City", [guide?.name, slug]);
  const subtitle = useMemo(() => {
    const parts = [guide?.country].filter(Boolean);
    return parts.join(" • ");
  }, [guide?.country]);

  if (!slug) {
    return (
      <Background imageUrl={getBackground("city")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <View style={styles.bodyPad}>
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState title="Missing city" message="No city slug was provided." />
            </GlassCard>
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  if (!guide) {
    return (
      <Background imageUrl={getBackground("city")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.bodyPad}>
            <GlassCard style={styles.card} intensity={22}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subTitle}>City guide not available yet.</Text>

              <View style={{ height: 12 }} />

              <Pressable
                onPress={() => openUrl(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(title)}`)}
                style={styles.primaryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>Browse top things on TripAdvisor</Text>
                <Text style={styles.primaryBtnMeta}>Opens in your browser</Text>
              </Pressable>

              <View style={{ height: 10 }} />

              <Pressable
                onPress={() => router.push("/(tabs)/fixtures")}
                style={styles.secondaryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>Open Fixtures</Text>
              </Pressable>
            </GlassCard>
          </ScrollView>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageUrl={getBackground("city")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.bodyPad}>
          <GlassCard style={styles.hero} intensity={26}>
            <Text style={styles.kicker}>CITY GUIDE</Text>
            <Text style={styles.title}>{guide.name}</Text>
            {subtitle ? <Text style={styles.subTitle}>{subtitle}</Text> : null}

            {guide.overview ? <Text style={styles.overview}>{guide.overview}</Text> : null}

            <View style={styles.heroCtas}>
              <Pressable
                onPress={() => openUrl(guide.tripAdvisorTopThingsUrl)}
                style={styles.primaryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>TripAdvisor: Top things to do</Text>
                <Text style={styles.primaryBtnMeta}>Opens in your browser</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(tabs)/fixtures")}
                style={styles.secondaryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>Browse Fixtures</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* TOP THINGS */}
          <View style={styles.section}>
            <SectionHeader title="Top things to do" subtitle="Curated picks + quick tips" />
            <GlassCard style={styles.card} intensity={22}>
              {(guide.topThings ?? []).length === 0 ? (
                <EmptyState title="No picks yet" message="This guide will be expanded soon." />
              ) : (
                <View style={styles.list}>
                  {(guide.topThings ?? []).slice(0, 12).map((x, idx) => (
                    <View key={`${x.title}-${idx}`} style={styles.itemRow}>
                      <Text style={styles.itemNumber}>{idx + 1}.</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{x.title}</Text>
                        {x.tip ? <Text style={styles.itemMeta}>{x.tip}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </View>

          {/* QUICK TIPS */}
          <View style={styles.section}>
            <SectionHeader title="Quick tips" subtitle="Practical travel notes" />
            <GlassCard style={styles.card} intensity={22}>
              {(guide.tips ?? []).length === 0 ? (
                <EmptyState title="No tips yet" message="Tips will appear here as the guide grows." />
              ) : (
                <View style={styles.bullets}>
                  {(guide.tips ?? []).slice(0, 12).map((t, idx) => (
                    <View key={`${idx}-${t}`} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </View>

          {/* FOOD */}
          <View style={styles.section}>
            <SectionHeader title="Food ideas" subtitle="Fast wins to eat well" />
            <GlassCard style={styles.card} intensity={22}>
              {(guide.food ?? []).length === 0 ? (
                <EmptyState title="No food ideas yet" message="Add a few staples and local specialties here." />
              ) : (
                <View style={styles.pillsWrap}>
                  {(guide.food ?? []).slice(0, 16).map((f, idx) => (
                    <View key={`${idx}-${f}`} style={styles.pill}>
                      <Text style={styles.pillText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </View>

          {/* TRANSPORT */}
          <View style={styles.section}>
            <SectionHeader title="Getting around" subtitle="Transport notes" />
            <GlassCard style={styles.card} intensity={22}>
              {guide.transport ? <Text style={styles.longText}>{guide.transport}</Text> : <EmptyState title="—" message="No transport notes yet." />}
            </GlassCard>
          </View>

          {/* ACCOMMODATION */}
          <View style={styles.section}>
            <SectionHeader title="Where to stay" subtitle="Best areas and value logic" />
            <GlassCard style={styles.card} intensity={22}>
              {guide.accommodation ? (
                <Text style={styles.longText}>{guide.accommodation}</Text>
              ) : (
                <EmptyState title="—" message="No accommodation notes yet." />
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

  overview: {
    marginTop: 12,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    lineHeight: 20,
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

  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  secondaryBtnText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.sm },

  section: { marginTop: 2 },
  card: { padding: theme.spacing.md },

  list: { gap: 12 },

  itemRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  itemNumber: { color: theme.colors.primary, fontWeight: "900" as any, width: 22 },
  itemTitle: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.md },
  itemMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  bullets: { gap: 10 },
  bulletRow: { flexDirection: "row", gap: 10 },
  bulletDot: { color: theme.colors.primary, fontWeight: "900" as any, width: 12 },
  bulletText: { flex: 1, color: theme.colors.text, fontSize: theme.fontSize.sm, lineHeight: 18 },

  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  pillText: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "800" as any },

  longText: { color: theme.colors.text, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
