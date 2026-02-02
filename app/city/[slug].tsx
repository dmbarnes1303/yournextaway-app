// app/city/[slug].tsx
import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getRollingWindowIso, normalizeWindowIso } from "@/src/constants/football";
import { normalizeCityKey } from "@/src/utils/city";

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

export default function CitySlugRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slugRaw = useMemo(() => paramString((params as any)?.slug) ?? "", [params]);
  const cityKey = useMemo(() => (slugRaw ? normalizeCityKey(slugRaw) : ""), [slugRaw]);

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => paramString((params as any)?.from), [params]);
  const toParam = useMemo(() => paramString((params as any)?.to), [params]);

  const window = useMemo(() => {
    const w = { from: fromParam ?? rolling.from, to: toParam ?? rolling.to };
    return normalizeWindowIso(w);
  }, [fromParam, toParam, rolling.from, rolling.to]);

  useEffect(() => {
    if (!cityKey) return;

    router.replace({
      pathname: "/city/[cityKey]",
      params: { cityKey, from: window.from, to: window.to },
    } as any);
  }, [router, cityKey, window.from, window.to]);

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.88}>
      <Stack.Screen options={{ title: "City", headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.content}>
          <GlassCard style={styles.card} intensity={22}>
            {!cityKey ? (
              <>
                <Text style={styles.title}>City not found</Text>
                <Text style={styles.sub}>This link is missing a valid city slug.</Text>
              </>
            ) : (
              <View style={styles.row}>
                <ActivityIndicator />
                <Text style={styles.sub}>Opening city guide…</Text>
              </View>
            )}
          </GlassCard>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  card: { padding: theme.spacing.lg },
  title: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  sub: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
});
