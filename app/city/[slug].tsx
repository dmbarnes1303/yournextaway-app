// app/city/[slug].tsx
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

import { getCityGuide } from "@/src/data/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";

function prettyTitleFromSlug(slug: string) {
  const s = String(slug || "").trim();
  if (!s) return "City";
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
    // swallow (no hard crash on device)
  }
}

export default function CityGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slugRaw = useMemo(() => String(params.slug ?? "").trim(), [params.slug]);
  const cityKey = useMemo(() => normalizeCityKey(slugRaw), [slugRaw]);

  const guide = useMemo(() => (cityKey ? getCityGuide(cityKey) : null), [cityKey]);

  const title = useMemo(() => {
    if (guide?.name) return guide.name;
    return prettyTitleFromSlug(slugRaw);
  }, [guide?.name, slugRaw]);

  const country = guide?.country ?? undefined;

  return (
    <Background imageUrl={getBackground("city")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{country ? country : "City guide"}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {!guide ? (
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState
                title="No city guide yet"
                message="This city doesn’t have a guide loaded yet. You can still use fixtures + trips normally."
              />

              <Pressable
                onPress={() =>
                  openUrl(
                    cityKey
                      ? `https://www.tripadvisor.com/Search?q=${encodeURIComponent(cityKey)}`
                      : "https://www.tripadvisor.com/"
                  )
                }
                style={styles.linkBtn}
              >
                <Text style={styles.linkText}>Open TripAdvisor search</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <>
              {/* Overview */}
              <View style={styles.section}>
                <SectionHeader title="Overview" subtitle="The quick read before you plan anything." />
                <GlassCard style={styles.card} intensity={22}>
                  <Text style={styles.body}>{guide.overview}</Text>

                  {guide.tripAdvisorTopThingsUrl ? (
                    <Pressable onPress={() => openUrl(guide.tripAdvisorTopThingsUrl)} style={styles.linkBtn}>
                      <Text style={styles.linkText}>Open TripAdvisor: top things to do</Text>
                    </Pressable>
                  ) : null}
                </GlassCard>
              </View>

              {/* Top things */}
              <View style={styles.section}>
                <SectionHeader title="Top things to do" subtitle="Curated picks with blunt, time-saving tips." />
                <GlassCard style={styles.card} intensity={22}>
                  {(guide.topThings ?? []).length === 0 ? (
                    <Text style={styles.muted}>No curated picks yet.</Text>
                  ) : (
                    <View style={styles.list}>
                      {(guide.topThings ?? []).map((x, idx) => (
                        <View key={`${x.title}-${idx}`} style={styles.item}>
                          <Text style={styles.itemNum}>{idx + 1}.</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{x.title}</Text>
                            {x.tip ? <Text style={styles.itemTip}>{x.tip}</Text> : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </View>

              {/* Tips */}
              <View style={styles.section}>
                <SectionHeader title="Quick tips" subtitle="Small details that save you hassle." />
                <GlassCard style={styles.card} intensity={22}>
                  {(guide.tips ?? []).length === 0 ? (
                    <Text style={styles.muted}>No tips yet.</Text>
                  ) : (
                    <View style={styles.bullets}>
                      {(guide.tips ?? []).map((t, idx) => (
                        <View key={`${t}-${idx}`} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </View>

              {/* Food */}
              <View style={styles.section}>
                <SectionHeader title="Food" subtitle="Easy wins and reliable defaults." />
                <GlassCard style={styles.card} intensity={22}>
                  {(guide.food ?? []).length === 0 ? (
                    <Text style={styles.muted}>No food notes yet.</Text>
                  ) : (
                    <View style={styles.bullets}>
                      {(guide.food ?? []).map((t, idx) => (
                        <View key={`${t}-${idx}`} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </View>

              {/* Transport */}
              <View style={styles.section}>
                <SectionHeader title="Transport" subtitle="How to move around without wasting time." />
                <GlassCard style={styles.card} intensity={22}>
                  {guide.transport ? <Text style={styles.body}>{guide.transport}</Text> : <Text style={styles.muted}>—</Text>}
                </GlassCard>
              </View>

              {/* Accommodation */}
              <View style={styles.section}>
                <SectionHeader title="Where to stay" subtitle="The base matters more than you think." />
                <GlassCard style={styles.card} intensity={22}>
                  {guide.accommodation ? (
                    <Text style={styles.body}>{guide.accommodation}</Text>
                  ) : (
                    <Text style={styles.muted}>—</Text>
                  )}
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

  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  list: { gap: 12, marginTop: 6 },
  item: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  itemNum: { color: theme.colors.primary, fontWeight: "900" as any, width: 22 },
  itemTitle: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.md },
  itemTip: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  bullets: { gap: 10, marginTop: 6 },
  bulletRow: { flexDirection: "row", gap: 10 },
  bulletDot: { color: theme.colors.primary, fontWeight: "900" as any, marginTop: 1 },
  bulletText: { flex: 1, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

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
