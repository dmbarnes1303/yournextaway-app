// app/city/[cityKey].tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getRollingWindowIso, normalizeWindowIso } from "@/src/constants/football";
import { normalizeCityKey } from "@/src/utils/city";
import { getCityGuide } from "@/src/data/cityGuides";

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

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

export default function CityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const cityKeyRaw = useMemo(() => paramString((params as any)?.cityKey) ?? "", [params]);
  const cityKey = useMemo(() => (cityKeyRaw ? normalizeCityKey(cityKeyRaw) : ""), [cityKeyRaw]);

  // Preserve optional window overrides
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => paramString((params as any)?.from), [params]);
  const toParam = useMemo(() => paramString((params as any)?.to), [params]);

  const window = useMemo(() => {
    const w = { from: fromParam ?? rolling.from, to: toParam ?? rolling.to };
    return normalizeWindowIso(w);
  }, [fromParam, toParam, rolling.from, rolling.to]);

  const guide = useMemo(() => (cityKey ? getCityGuide(cityKey) : null), [cityKey]);

  const title = useMemo(() => {
    // CityGuide likely has name; if not, fall back hard
    const n = safeStr((guide as any)?.name) || safeStr(cityKeyRaw) || safeStr(cityKey);
    return n || "City";
  }, [guide, cityKeyRaw, cityKey]);

  const country = useMemo(() => safeStr((guide as any)?.country), [guide]);

  const intro = useMemo(() => {
    // You may or may not have an intro/summary field; keep it safe.
    return safeStr((guide as any)?.intro || (guide as any)?.summary || (guide as any)?.description);
  }, [guide]);

  const topThings = useMemo(() => {
    const arr = (guide as any)?.topThings;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x: any) => ({
        title: safeStr(x?.title),
        tip: safeStr(x?.tip),
      }))
      .filter((x: any) => x.title)
      .slice(0, 10);
  }, [guide]);

  const tips = useMemo(() => {
    const arr = (guide as any)?.tips;
    if (!Array.isArray(arr)) return [];
    return arr.map((t: any) => safeStr(t)).filter(Boolean).slice(0, 10);
  }, [guide]);

  const tripAdvisorUrl = useMemo(() => safeStr((guide as any)?.tripAdvisorTopThingsUrl), [guide]);

  function goTripBuild() {
    router.push({
      pathname: "/trip/build",
      params: {
        global: "1",
        from: window.from,
        to: window.to,
      },
    } as any);
  }

  function goFixtures() {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: { from: window.from, to: window.to },
    } as any);
  }

  function goHome() {
    router.replace("/(tabs)/home");
  }

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.88}>
      <Stack.Screen options={{ headerShown: true, title, headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.hero} intensity={22}>
            <Text style={styles.kicker}>CITY GUIDE</Text>
            <Text style={styles.h1}>{title}</Text>
            {country ? <Text style={styles.sub}>{country}</Text> : null}
            {intro ? <Text style={styles.p}>{intro}</Text> : null}

            <View style={styles.ctaRow}>
              <Pressable onPress={goTripBuild} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Plan a trip</Text>
              </Pressable>

              <Pressable onPress={goFixtures} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Browse fixtures</Text>
              </Pressable>
            </View>

            <Text style={styles.windowMeta}>
              Window: {window.from} → {window.to}
            </Text>
          </GlassCard>

          {!cityKey ? (
            <GlassCard style={styles.card} intensity={20}>
              <EmptyState title="City not found" message="This route is missing a valid city key." />
              <Pressable onPress={goHome} style={styles.inlineBtn}>
                <Text style={styles.inlineBtnText}>Go Home</Text>
              </Pressable>
            </GlassCard>
          ) : !guide ? (
            <GlassCard style={styles.card} intensity={20}>
              <EmptyState
                title="No guide yet"
                message={`We don’t have a guide for “${safeStr(cityKeyRaw || cityKey)}” yet. You can still browse matches and plan a trip.`}
              />
              <View style={{ height: 12 }} />
              <Pressable onPress={goTripBuild} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Plan a trip</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <>
              {topThings.length > 0 ? (
                <GlassCard style={styles.card} intensity={20}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>Top things to do</Text>
                    {tripAdvisorUrl ? (
                      <Pressable
                        onPress={() => {
                          // Don’t hard-crash if Linking fails: TripBuild already has safeOpenUrl,
                          // but we keep City screen minimal. Worst case: nothing happens.
                          // eslint-disable-next-line @typescript-eslint/no-floating-promises
                          import("react-native").then(({ Linking }) => Linking.openURL(tripAdvisorUrl));
                        }}
                        style={styles.pillBtn}
                      >
                        <Text style={styles.pillBtnText}>TripAdvisor</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={{ height: 10 }} />
                  {topThings.map((it, idx) => (
                    <View key={`${it.title}-${idx}`} style={styles.itemRow}>
                      <Text style={styles.itemIdx}>{idx + 1}.</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{it.title}</Text>
                        {it.tip ? <Text style={styles.itemDesc}>{it.tip}</Text> : null}
                      </View>
                    </View>
                  ))}
                </GlassCard>
              ) : null}

              {tips.length > 0 ? (
                <GlassCard style={styles.card} intensity={20}>
                  <Text style={styles.sectionTitle}>Quick tips</Text>
                  <View style={{ height: 10 }} />
                  {tips.map((t, idx) => (
                    <Text key={`${t}-${idx}`} style={styles.tipLine}>
                      • {t}
                    </Text>
                  ))}
                </GlassCard>
              ) : null}

              {topThings.length === 0 && tips.length === 0 ? (
                <GlassCard style={styles.card} intensity={20}>
                  <EmptyState title="Guide is empty" message="This city exists but doesn’t have content yet." />
                  <View style={{ height: 12 }} />
                  <Pressable onPress={goTripBuild} style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Plan a trip</Text>
                  </Pressable>
                </GlassCard>
              ) : null}
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
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  hero: { padding: theme.spacing.lg },
  card: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.6,
  },
  h1: {
    marginTop: 8,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.xl,
  },
  sub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: theme.fontSize.sm,
  },
  p: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "700",
    lineHeight: 20,
  },

  ctaRow: { marginTop: 14, flexDirection: "row", gap: 10 },

  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  primaryBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  secondaryBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  windowMeta: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
  },

  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  pillBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  pillBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  itemRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 10 },
  itemIdx: { width: 18, color: theme.colors.primary, fontWeight: "900" },
  itemTitle: { color: theme.colors.text, fontWeight: "900" },
  itemDesc: { marginTop: 4, color: theme.colors.textSecondary, lineHeight: 18 },

  tipLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  inlineBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  inlineBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
});
