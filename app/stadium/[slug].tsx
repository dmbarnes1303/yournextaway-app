// app/stadium/[slug].tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

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

function titleCaseLoose(input: string) {
  const s = String(input || "").trim();
  if (!s) return "";
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * V1 stadium screen:
 * - no DB required
 * - works purely from slug + optional query params
 * - provides high-utility external links for neutral travellers
 *
 * Routing:
 * /stadium/[slug]?name=Allianz%20Arena&city=Munich&team=Bayern%20Munich
 */
export default function StadiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slug = useMemo(() => String(params.slug ?? "").trim().toLowerCase(), [params.slug]);

  const name = useMemo(() => String(params.name ?? "").trim(), [params.name]);
  const city = useMemo(() => String(params.city ?? "").trim(), [params.city]);
  const team = useMemo(() => String(params.team ?? "").trim(), [params.team]);

  const displayTitle = useMemo(() => name || titleCaseLoose(slug) || "Stadium", [name, slug]);

  const placeQuery = useMemo(() => {
    const q = [name || titleCaseLoose(slug), city].filter(Boolean).join(" ").trim();
    return q || "stadium";
  }, [name, slug, city]);

  const mapsUrl = useMemo(() => `https://www.google.com/maps/search/?api=1&query=${enc(placeQuery)}`, [placeQuery]);

  const entryRulesUrl = useMemo(() => {
    const q = [displayTitle, city, team, "bag policy entry rules prohibited items"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [displayTitle, city, team]);

  const transportUrl = useMemo(() => {
    const q = [displayTitle, city, "how to get there public transport metro train parking"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [displayTitle, city]);

  const foodDrinkUrl = useMemo(() => {
    const q = [displayTitle, city, "best pubs bars restaurants near"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [displayTitle, city]);

  const accessibilityUrl = useMemo(() => {
    const q = [displayTitle, city, "accessibility disabled access entrance wheelchair seating"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [displayTitle, city]);

  const bagStorageUrl = useMemo(() => {
    const q = [displayTitle, city, "luggage storage near"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${enc(q)}`;
  }, [displayTitle, city]);

  if (!slug) {
    return (
      <Background imageUrl={getBackground("stadium")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <View style={styles.bodyPad}>
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState title="Missing stadium" message="No stadium slug was provided." />
            </GlassCard>
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageUrl={getBackground("stadium")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.bodyPad}>
          <GlassCard style={styles.hero} intensity={26}>
            <Text style={styles.kicker}>STADIUM</Text>
            <Text style={styles.title} numberOfLines={2}>
              {displayTitle}
            </Text>

            <Text style={styles.subTitle}>
              {city ? `${city}` : "Location and logistics"}
              {team ? ` • ${team}` : ""}
            </Text>

            <View style={styles.heroCtas}>
              <Pressable onPress={() => safeOpenUrl(mapsUrl)} style={styles.primaryBtn} accessibilityRole="button">
                <Text style={styles.primaryBtnText}>Open in Maps</Text>
                <Text style={styles.primaryBtnMeta}>{placeQuery}</Text>
              </Pressable>

              <View style={styles.twoCol}>
                <Pressable
                  onPress={() => safeOpenUrl(entryRulesUrl)}
                  style={[styles.smallBtn, styles.smallBtnSecondary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.smallBtnTitle}>Entry rules</Text>
                  <Text style={styles.smallBtnMeta}>Bags, security, timings</Text>
                </Pressable>

                <Pressable
                  onPress={() => safeOpenUrl(transportUrl)}
                  style={[styles.smallBtn, styles.smallBtnSecondary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.smallBtnTitle}>Transport</Text>
                  <Text style={styles.smallBtnMeta}>Metro, trains, parking</Text>
                </Pressable>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.card} intensity={22}>
            <SectionHeader title="Practical links" subtitle="Fast answers for planning" />

            <View style={styles.linkList}>
              <Pressable onPress={() => safeOpenUrl(foodDrinkUrl)} style={styles.linkRow} accessibilityRole="button">
                <Text style={styles.linkTitle}>Food & drinks nearby</Text>
                <Text style={styles.linkMeta}>Best pre/post options around the stadium district</Text>
              </Pressable>

              <Pressable onPress={() => safeOpenUrl(accessibilityUrl)} style={styles.linkRow} accessibilityRole="button">
                <Text style={styles.linkTitle}>Accessibility</Text>
                <Text style={styles.linkMeta}>Disabled access, entrances, seating guidance</Text>
              </Pressable>

              <Pressable onPress={() => safeOpenUrl(bagStorageUrl)} style={styles.linkRow} accessibilityRole="button">
                <Text style={styles.linkTitle}>Luggage storage</Text>
                <Text style={styles.linkMeta}>Useful if arriving before hotel check-in</Text>
              </Pressable>
            </View>

            <View style={{ height: 10 }} />

            <Text style={styles.smallPrint}>
              V1 note: This screen is intentionally “data-light” and link-driven. In V2 we can add structured stadium data
              (sections, seating, transport hubs, verified entry rules) once your dataset is ready.
            </Text>
          </GlassCard>
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

  card: { padding: theme.spacing.md },

  linkList: { marginTop: 10, gap: 10 },
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

  smallPrint: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },
});
