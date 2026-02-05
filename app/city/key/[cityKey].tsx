// app/city/key/[cityKey].tsx
import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getRollingWindowIso } from "@/src/constants/football";

import { normalizeCityKey } from "@/src/utils/city";
import { cityGuides } from "@/src/data/cityGuides";

function coerceString(v: unknown): string | null {
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

export default function CityKeyRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const cityKeyRaw = useMemo(() => coerceString((params as any)?.cityKey) ?? "", [params]);
  const cityKey = useMemo(() => normalizeCityKey(cityKeyRaw), [cityKeyRaw]);

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const from = useMemo(() => coerceString((params as any)?.from) ?? rolling.from, [params, rolling.from]);
  const to = useMemo(() => coerceString((params as any)?.to) ?? rolling.to, [params, rolling.to]);

  const exists = useMemo(() => !!(cityKey && cityGuides[cityKey]), [cityKey]);

  useEffect(() => {
    if (!cityKey) return;
    if (!exists) return;

    router.replace({
      pathname: "/city/[cityKey]",
      params: { cityKey, from, to },
    } as any);
  }, [router, cityKey, exists, from, to]);

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.88}>
      <Stack.Screen options={{ title: "City", headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.content}>
          <GlassCard style={styles.card} intensity={22}>
            {!cityKey ? (
              <>
                <Text style={styles.title}>City not found</Text>
                <Text style={styles.sub}>This link is missing a valid city key.</Text>

                <Pressable onPress={() => router.replace("/(tabs)/home")} style={styles.btn}>
                  <Text style={styles.btnText}>Go Home</Text>
                </Pressable>
              </>
            ) : !exists ? (
              <>
                <Text style={styles.title}>City not found</Text>
                <Text style={styles.sub}>
                  No city guide exists for: <Text style={styles.mono}>{cityKey}</Text>
                </Text>

                <Pressable onPress={() => router.replace("/(tabs)/home")} style={styles.btn}>
                  <Text style={styles.btnText}>Go Home</Text>
                </Pressable>
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
  mono: { fontFamily: "SpaceMono", color: theme.colors.text },
  btn: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  btnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
});
