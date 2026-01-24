// app/city/[slug].tsx
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

import { getCityGuide } from "@/src/data/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";

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

function titleFromSlug(slug: string) {
  const s = String(slug || "").trim();
  if (!s) return "";
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * V1 City screen:
 * - pulls from cityGuides registry when available
 * - otherwise uses link-outs (TripAdvisor + Google) so it always “works”
 *
 * Route:
 * /city/[slug]
 * where slug is a city key (e.g. london, madrid, rome, berlin, paris)
 */
export default function CityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawSlug = useMemo(() => String(params.slug ?? "").trim(), [params.slug]);
  const cityKey = useMemo(() => normalizeCityKey(rawSlug), [rawSlug]);

  const guide = useMemo(() => (cityKey ? getCityGuide(cityKey) : null), [cityKey]);

  const cityName = useMemo(() => guide?.name || titleFromSlug(cityKey) || "City", [guide?.name, cityKey]);
  const country = useMemo(() => guide?.country || "", [guide?.country]);

  const tripAdvisorUrl = useMemo(() => {
    if (guide?.tripAdvisorTopThingsUrl) return guide.tripAdvisorTopThingsUrl;
    // fallback: still useful even without a curated guide
    const q = [cityName, country, "things to do TripAdvisor"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [guide?.tripAdvisorTopThingsUrl, cityName, country]);

  const mapsUrl = useMemo(() => {
    const q = [cityName, country].filter(Boolean).join(" ").trim();
    return `https://www.google.com/maps/search/?api=1&query=${enc(q || cityName)}`;
  }, [cityName, country]);

  const hotelsUrl = useMemo(() => {
    const q = [cityName, country, "best areas to stay hotels"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [cityName, country]);

  const transportUrl = useMemo(() => {
    const q = [cityName, country, "public transport pass airport transfer"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [cityName, country]);

  const foodUrl = useMemo(() => {
    const q = [cityName, country, "best restaurants bars neighbourhoods"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [cityName, country]);

  if (!cityKey) {
    return (
      <Background imageUrl={getBackground("city")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <View style={styles.pad}>
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState title="Missing city" message="No city slug was provided." />
            </GlassCard>
          </View>
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

        <ScrollView style={styles.scroll} contentContainerStyle={styles.pad}>
          <GlassCard style={styles.hero} intensity={26}>
            <Text style={styles.kicker}>CITY GUIDE</Text>
            <Text style={styles.title} numberOfLines={2}>
              {cityName}
            </Text>
            <Text style={styles.subTitle}>
              {country ? country : "Plan a clean, low-stress weekend"}
              {guide ? " • Curated picks" : " • Link-out mode"}
            </Text>

            <View style={styles.heroCtas}>
              <Pressable onPress={() => safeOpenUrl(tripAdvisorUrl)} style={styles.primaryBtn} accessibilityRole="button">
                <Text style={styles.primaryBtnText}>Top things to do</Text>
                <Text style={styles.primaryBtnMeta}>Open TripAdvisor / current picks</Text>
              </Pressable>

              <View style={styles.twoCol}>
                <Pressable
                  onPress={() => safeOpenUrl(mapsUrl)}
                  style={[styles.smallBtn, styles.smallBtnSecondary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.smallBtnTitle}>Map</Text>
                  <Text style={styles.smallBtnMeta}>Neighbourhoods & landmarks</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push("/trip/build")}
                  style={[styles.smallBtn, styles.smallBtnSecondary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.smallBtnTitle}>Plan a trip</Text>
                  <Text style={styles.smallBtnMeta}>Pick a match later</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push("/(tabs)/fixtures")}
                style={styles.linkBtn}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>Open Fixtures</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* CURATED GUIDE (when available) */}
          {guide ? (
            <>
              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Overview" subtitle="How to get the best weekend" />
                <Text style={styles.bodyText}>{guide.overview}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Top things to do" subtitle="High value, low fluff" />
                <View style={styles.list}>
                  {(guide.topThings ?? []).slice(0, 10).map((t, idx) => (
                    <View key={`${t.title}-${idx}`} style={styles.itemRow}>
                      <Text style={styles.idx}>{idx + 1}.</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{t.title}</Text>
                        {t.tip ? <Text style={styles.itemBody}>{t.tip}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
                <Pressable
                  onPress={() => safeOpenUrl(guide.tripAdvisorTopThingsUrl)}
                  style={styles.linkBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.linkText}>Open TripAdvisor</Text>
                </Pressable>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Quick tips" subtitle="Small decisions that save time" />
                <View style={{ marginTop: 8, gap: 6 }}>
                  {(guide.tips ?? []).slice(0, 10).map((t, idx) => (
                    <Text key={`${t}-${idx}`} style={styles.bullet}>
                      • {t}
                    </Text>
                  ))}
                </View>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Food" subtitle="Reliable options and areas" />
                <View style={{ marginTop: 8, gap: 6 }}>
                  {(guide.food ?? []).slice(0, 10).map((f, idx) => (
                    <Text key={`${f}-${idx}`} style={styles.bullet}>
                      • {f}
                    </Text>
                  ))}
                </View>

                <Pressable onPress={() => safeOpenUrl(foodUrl)} style={styles.linkBtn} accessibilityRole="button">
                  <Text style={styles.linkText}>Search best food areas</Text>
                </Pressable>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Transport" subtitle="Get around efficiently" />
                <Text style={styles.bodyText}>{guide.transport}</Text>
                <Pressable onPress={() => safeOpenUrl(transportUrl)} style={styles.linkBtn} accessibilityRole="button">
                  <Text style={styles.linkText}>Search passes & airport transfer</Text>
                </Pressable>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Where to stay" subtitle="Base selection matters" />
                <Text style={styles.bodyText}>{guide.accommodation}</Text>
                <Pressable onPress={() => safeOpenUrl(hotelsUrl)} style={styles.linkBtn} accessibilityRole="button">
                  <Text style={styles.linkText}>Search best areas to stay</Text>
                </Pressable>
              </GlassCard>
            </>
          ) : (
            /* LINK-OUT MODE (no curated guide yet) */
            <GlassCard style={styles.card} intensity={22}>
              <SectionHeader title="This city isn’t curated yet" subtitle="Still fully usable in V1" />
              <Text style={styles.bodyText}>
                You can still plan a great weekend here. Use the links below to get the best current recommendations, then
                use Fixtures to choose a match and build your trip.
              </Text>

              <View style={{ marginTop: 10, gap: 10 }}>
                <Pressable onPress={() => safeOpenUrl(tripAdvisorUrl)} style={styles.linkRow} accessibilityRole="button">
                  <Text style={styles.linkTitle}>Top things to do</Text>
                  <Text style={styles.linkMeta}>TripAdvisor / current picks</Text>
                </Pressable>

                <Pressable onPress={() => safeOpenUrl(foodUrl)} style={styles.linkRow} accessibilityRole="button">
                  <Text style={styles.linkTitle}>Food & drink</Text>
                  <Text style={styles.linkMeta}>Best areas and reliable lists</Text>
                </Pressable>

                <Pressable onPress={() => safeOpenUrl(transportUrl)} style={styles.linkRow} accessibilityRole="button">
                  <Text style={styles.linkTitle}>Transport</Text>
                  <Text style={styles.linkMeta}>Passes, airport transfer, getting around</Text>
                </Pressable>

                <Pressable onPress={() => safeOpenUrl(hotelsUrl)} style={styles.linkRow} accessibilityRole="button">
                  <Text style={styles.linkTitle}>Where to stay</Text>
                  <Text style={styles.linkMeta}>Neighbourhood guidance and hotel search</Text>
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

  list: { marginTop: 10, gap: 10 },
  itemRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  idx: { width: 18, color: theme.colors.primary, fontWeight: "900" as any },
  itemTitle: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.sm },
  itemBody: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  bullet: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

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
