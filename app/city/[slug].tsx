// app/city/[slug].tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from "react-native";
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

type TopThing = { title: string; tip: string };

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

  const name = useMemo(() => String(guide?.name ?? guide?.title ?? "").trim(), [guide]);
  const country = useMemo(() => String(guide?.country ?? "").trim(), [guide]);

  const overview = useMemo(() => String(guide?.overview ?? "").trim(), [guide]);

  const topThings = useMemo(() => {
    const arr = (guide?.topThings ?? []) as any[];
    return (Array.isArray(arr) ? arr : [])
      .map((x) => ({
        title: String(x?.title ?? "").trim(),
        tip: String(x?.tip ?? "").trim(),
      }))
      .filter((x) => x.title.length > 0) as TopThing[];
  }, [guide]);

  const tips = useMemo(() => {
    const arr = (guide?.tips ?? []) as any[];
    return (Array.isArray(arr) ? arr : []).map((t) => String(t).trim()).filter(Boolean);
  }, [guide]);

  const food = useMemo(() => {
    const arr = (guide?.food ?? []) as any[];
    return (Array.isArray(arr) ? arr : []).map((t) => String(t).trim()).filter(Boolean);
  }, [guide]);

  const transport = useMemo(() => String(guide?.transport ?? "").trim(), [guide]);
  const accommodation = useMemo(() => String(guide?.accommodation ?? "").trim(), [guide]);

  const thingsToDoUrl = useMemo(() => String(guide?.thingsToDoUrl ?? "").trim(), [guide]);

  const title = useMemo(() => (name ? name : cityKey ? cityKey : "City"), [name, cityKey]);

  const [showAllTop, setShowAllTop] = useState(false);
  const [showAllTips, setShowAllTips] = useState(false);
  const [showAllFood, setShowAllFood] = useState(false);
  const [expandedThing, setExpandedThing] = useState<Record<number, boolean>>({});

  function goHome() {
    router.replace("/(tabs)/home");
  }

  function openFixturesWindow() {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: { from: window.from, to: window.to },
    } as any);
  }

  async function openThingsToDo() {
    if (!thingsToDoUrl) return;
    try {
      const can = await Linking.canOpenURL(thingsToDoUrl);
      if (can) await Linking.openURL(thingsToDoUrl);
    } catch {
      // Silent failure; avoid crashing
    }
  }

  const topThingsVisible = useMemo(() => (showAllTop ? topThings : topThings.slice(0, 5)), [topThings, showAllTop]);
  const tipsVisible = useMemo(() => (showAllTips ? tips : tips.slice(0, 4)), [tips, showAllTips]);
  const foodVisible = useMemo(() => (showAllFood ? food : food.slice(0, 4)), [food, showAllFood]);

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
                <Pressable onPress={openFixturesWindow} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>
                    Browse Fixtures ({window.from} → {window.to})
                  </Text>
                </Pressable>
                <Pressable onPress={goHome} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Go Home</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : (
            <>
              {/* HERO */}
              <GlassCard style={styles.hero} intensity={22}>
                <Text style={styles.kicker}>CITY GUIDE</Text>

                <Text style={styles.heroTitle} numberOfLines={2}>
                  {title}
                </Text>

                {!!country && <Text style={styles.heroMeta}>{country}</Text>}

                <Text style={styles.heroOverview} numberOfLines={4}>
                  {overview || "Plan a clean, neutral city break around football fixtures."}
                </Text>

                {/* Quick actions */}
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={openThingsToDo}
                    disabled={!thingsToDoUrl}
                    style={[styles.actionBtn, !thingsToDoUrl && styles.actionBtnDisabled]}
                  >
                    <Text style={[styles.actionBtnText, !thingsToDoUrl && styles.actionBtnTextDisabled]}>
                      Things to do
                    </Text>
                  </Pressable>

                  <Pressable onPress={openFixturesWindow} style={[styles.actionBtn, styles.actionBtnPrimary]}>
                    <Text style={styles.actionBtnPrimaryText}>Browse fixtures</Text>
                  </Pressable>
                </View>
              </GlassCard>

              {/* OVERVIEW */}
              <View style={styles.section}>
                <SectionHeader title="Overview" subtitle="Quick context" />
                <GlassCard style={styles.card} intensity={18}>
                  <Text style={styles.paragraph}>{overview || "Overview coming soon for this city."}</Text>
                </GlassCard>
              </View>

              {/* TOP THINGS */}
              <View style={styles.section}>
                <SectionHeader title="Top things" subtitle="High-ROI shortlist" />
                <GlassCard style={styles.card} intensity={18}>
                  {topThingsVisible.length ? (
                    <>
                      {topThingsVisible.map((t, idx) => {
                        const isOpen = !!expandedThing[idx];
                        const n = idx + 1;
                        const num = n < 10 ? `0${n}` : `${n}`;

                        return (
                          <Pressable
                            key={`${t.title}-${idx}`}
                            onPress={() => setExpandedThing((p) => ({ ...p, [idx]: !p[idx] }))}
                            style={[styles.thingRow, idx === 0 && styles.thingRowFirst]}
                          >
                            <View style={styles.thingLeft}>
                              <View style={styles.numBadge}>
                                <Text style={styles.numText}>{num}</Text>
                              </View>
                            </View>

                            <View style={styles.thingBody}>
                              <Text style={styles.thingTitle} numberOfLines={2}>
                                {t.title}
                              </Text>
                              <Text style={styles.thingTip} numberOfLines={isOpen ? 12 : 2}>
                                {t.tip || "—"}
                              </Text>

                              <Text style={styles.expandHint}>{isOpen ? "Tap to collapse" : "Tap to expand"}</Text>
                            </View>
                          </Pressable>
                        );
                      })}

                      {topThings.length > 5 ? (
                        <Pressable onPress={() => setShowAllTop((v) => !v)} style={styles.showAllBtn}>
                          <Text style={styles.showAllText}>
                            {showAllTop ? "Show less" : `Show all (${topThings.length})`}
                          </Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.muted}>No top things added yet for this city.</Text>
                  )}
                </GlassCard>
              </View>

              {/* TIPS */}
              <View style={styles.section}>
                <SectionHeader title="Local tips" subtitle="Practical, real-world" />
                <GlassCard style={styles.card} intensity={18}>
                  {tipsVisible.length ? (
                    <>
                      {tipsVisible.map((t, idx) => (
                        <View key={`${t}-${idx}`} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{t}</Text>
                        </View>
                      ))}

                      {tips.length > 4 ? (
                        <Pressable onPress={() => setShowAllTips((v) => !v)} style={styles.showAllBtn}>
                          <Text style={styles.showAllText}>
                            {showAllTips ? "Show less" : `Show all (${tips.length})`}
                          </Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.muted}>No tips written yet for this city.</Text>
                  )}
                </GlassCard>
              </View>

              {/* FOOD */}
              <View style={styles.section}>
                <SectionHeader title="Food & drink" subtitle="What to prioritise" />
                <GlassCard style={styles.card} intensity={18}>
                  {foodVisible.length ? (
                    <>
                      {foodVisible.map((t, idx) => (
                        <View key={`${t}-${idx}`} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{t}</Text>
                        </View>
                      ))}

                      {food.length > 4 ? (
                        <Pressable onPress={() => setShowAllFood((v) => !v)} style={styles.showAllBtn}>
                          <Text style={styles.showAllText}>
                            {showAllFood ? "Show less" : `Show all (${food.length})`}
                          </Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.muted}>No food notes added yet.</Text>
                  )}
                </GlassCard>
              </View>

              {/* TRANSPORT */}
              <View style={styles.section}>
                <SectionHeader title="Transport" subtitle="Getting around" />
                <GlassCard style={styles.card} intensity={18}>
                  <Text style={styles.paragraph}>{transport || "Transport notes coming soon."}</Text>
                </GlassCard>
              </View>

              {/* WHERE TO STAY */}
              <View style={styles.section}>
                <SectionHeader title="Where to stay" subtitle="Best base areas" />
                <GlassCard style={styles.card} intensity={18}>
                  <Text style={styles.paragraph}>{accommodation || "Accommodation notes coming soon."}</Text>
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
    paddingTop: 96,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  hero: {
    padding: theme.spacing.lg,
  },

  section: { marginTop: 2 },
  card: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  heroTitle: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    lineHeight: 30,
  },

  heroMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "800",
  },

  heroOverview: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "800",
  },

  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  actionBtnDisabled: {
    opacity: 0.55,
  },

  actionBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },

  actionBtnTextDisabled: {
    color: theme.colors.textSecondary,
  },

  actionBtnPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  actionBtnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },

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

  paragraph: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
    fontWeight: "800",
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "800",
  },

  thingRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  thingRowFirst: {
    paddingTop: 0,
    borderTopWidth: 0,
  },

  thingLeft: {
    width: 44,
    alignItems: "flex-start",
  },

  numBadge: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  numText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.4,
  },

  thingBody: {
    flex: 1,
    paddingBottom: 14,
  },

  thingTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
    lineHeight: 20,
  },

  thingTip: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "800",
  },

  expandHint: {
    marginTop: 6,
    color: "rgba(255,255,255,0.35)",
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  bulletRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 14,
    color: theme.colors.primary,
    fontWeight: "900",
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "800",
  },

  showAllBtn: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  showAllText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },
});
