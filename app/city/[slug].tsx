// app/city/[slug].tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import SectionHeader from "@/src/components/SectionHeader";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getRollingWindowIso, normalizeWindowIso } from "@/src/constants/football";
import { normalizeCityKey } from "@/src/utils/city";
import { cityGuides } from "@/src/data/cityGuides";

function paramString(v: unknown): string | null {
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : null;
  }
  if (Array.isArray(v) && typeof v[0] === "string") {
    const s = v[0].trim();
    return s ? s : null;
  }
  return null;
}

export default function CityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const slugRaw = useMemo(() => paramString((params as any)?.slug) ?? "", [params]);
  const cityKey = useMemo(() => (slugRaw ? normalizeCityKey(slugRaw) : ""), [slugRaw]);

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => paramString((params as any)?.from), [params]);
  const toParam = useMemo(() => paramString((params as any)?.to), [params]);

  const window = useMemo(() => {
    const w = { from: fromParam ?? rolling.from, to: toParam ?? rolling.to };
    return normalizeWindowIso(w);
  }, [fromParam, toParam, rolling.from, rolling.to]);

  const guide = useMemo(() => (cityKey ? (cityGuides as any)[cityKey] : null), [cityKey]);
  const title = useMemo(() => {
    const t = String(guide?.title ?? guide?.name ?? "").trim();
    return t || (cityKey ? cityKey : "City");
  }, [guide, cityKey]);

  function goHome() {
    router.replace("/(tabs)/home");
  }

  function openFixturesWindow() {
    // Phase 1: keep this simple. Later you can route to a city-filtered fixtures view.
    router.push({
      pathname: "/(tabs)/fixtures",
      params: { from: window.from, to: window.to },
    } as any);
  }

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.88}>
      <Stack.Screen options={{ title: "City", headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.xxl + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {!cityKey ? (
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState title="City not found" message="This link is missing a valid city slug." />
              <Pressable onPress={goHome} style={styles.btn}>
                <Text style={styles.btnText}>Go Home</Text>
              </Pressable>
            </GlassCard>
          ) : !guide ? (
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState
                title="City guide not available yet"
                message={`No guide exists for “${cityKey}” yet. You can still browse fixtures in your date window.`}
              />
              <View style={{ gap: 10, marginTop: 12 }}>
                <Pressable onPress={openFixturesWindow} style={styles.btn}>
                  <Text style={styles.btnText}>Browse Fixtures ({window.from} → {window.to})</Text>
                </Pressable>
                <Pressable onPress={goHome} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Go Home</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : (
            <>
              <GlassCard style={styles.hero} intensity={22}>
                <Text style={styles.kicker}>CITY GUIDE</Text>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>

                {guide?.summary ? (
                  <Text style={styles.summary}>{String(guide.summary)}</Text>
                ) : (
                  <Text style={styles.summary}>
                    Plan a clean, neutral city break around football fixtures.
                  </Text>
                )}

                <View style={styles.heroActions}>
                  <Pressable onPress={openFixturesWindow} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Browse fixtures window</Text>
                  </Pressable>
                </View>
              </GlassCard>

              {/* Minimal sections (won’t assume your exact guide schema) */}
              <View style={styles.section}>
                <SectionHeader title="Top picks" subtitle="Quick shortlist" />
                <GlassCard style={styles.card} intensity={18}>
                  {(Array.isArray((guide as any)?.topPicks) ? (guide as any).topPicks : [])
                    .slice(0, 8)
                    .map((p: any, idx: number) => (
                      <View key={`${p?.title ?? "pick"}-${idx}`} style={styles.bulletRow}>
                        <Text style={styles.bulletIdx}>{idx + 1}.</Text>
                        <Text style={styles.bulletText}>{String(p?.title ?? p ?? "").trim() || "—"}</Text>
                      </View>
                    ))}

                  {!(Array.isArray((guide as any)?.topPicks) && (guide as any).topPicks.length) ? (
                    <Text style={styles.muted}>No curated picks added yet for this city.</Text>
                  ) : null}
                </GlassCard>
              </View>

              <View style={styles.section}>
                <SectionHeader title="Practical notes" subtitle="Getting around, timing, basics" />
                <GlassCard style={styles.card} intensity={18}>
                  {(Array.isArray((guide as any)?.tips) ? (guide as any).tips : [])
                    .slice(0, 8)
                    .map((t: any, idx: number) => (
                      <Text key={`${t}-${idx}`} style={styles.tipLine}>
                        • {String(t)}
                      </Text>
                    ))}

                  {!(Array.isArray((guide as any)?.tips) && (guide as any).tips.length) ? (
                    <Text style={styles.muted}>No tips written yet for this city.</Text>
                  ) : null}
                </GlassCard>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  hero: { padding: theme.spacing.lg },
  card: { padding: theme.spacing.lg },
  section: { marginTop: 2 },

  kicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
  },
  summary: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "800",
  },

  heroActions: { marginTop: 14 },

  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  btnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.sm },

  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "800" },

  bulletRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  bulletIdx: { width: 18, color: theme.colors.primary, fontWeight: "900" },
  bulletText: { flex: 1, color: theme.colors.text, fontWeight: "900" },

  tipLine: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
