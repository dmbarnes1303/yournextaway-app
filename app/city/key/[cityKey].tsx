// app/city/key/[cityKey].tsx
import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { theme } from "@/src/constants/theme";

// TODO: Replace this import with YOUR actual city source.
// The goal: given a cityKey, find a slug (string) used by /city/[slug].
import { CITIES } from "@/src/data/cities"; // <-- change if needed

type AnyCity = {
  key?: string;
  cityKey?: string;
  slug?: string;
};

function resolveSlugFromCityKey(cityKey: string): string | null {
  try {
    const list: AnyCity[] = Array.isArray((CITIES as any)) ? (CITIES as any) : Object.values(CITIES as any);

    const hit =
      list.find((c) => c?.key === cityKey) ||
      list.find((c) => c?.cityKey === cityKey) ||
      list.find((c) => c?.slug === cityKey); // last resort

    const slug = (hit?.slug as string) || null;
    return typeof slug === "string" && slug.length ? slug : null;
  } catch {
    return null;
  }
}

export default function CityKeyRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cityKey?: string }>();

  const cityKey = useMemo(() => {
    const v = params.cityKey;
    return typeof v === "string" ? v : "";
  }, [params.cityKey]);

  const slug = useMemo(() => (cityKey ? resolveSlugFromCityKey(cityKey) : null), [cityKey]);

  useEffect(() => {
    if (!cityKey) return;
    if (!slug) return;

    // Replace so user doesn't go "back" to the redirect screen.
    router.replace(`/city/${slug}`);
  }, [cityKey, slug, router]);

  return (
    <>
      <Stack.Screen options={{ headerTitle: "City" }} />
      <View style={styles.wrap}>
        <Text style={styles.h1}>City link</Text>
        {!cityKey ? (
          <Text style={styles.p}>Missing city key.</Text>
        ) : slug ? (
          <Text style={styles.p}>Opening city…</Text>
        ) : (
          <>
            <Text style={styles.p}>
              Couldn’t resolve a city for key: <Text style={styles.mono}>{cityKey}</Text>
            </Text>

            <Pressable onPress={() => router.replace("/(tabs)/home")} style={styles.btn}>
              <Text style={styles.btnText}>Go Home</Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    marginBottom: 8,
  },
  p: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: "700",
    lineHeight: 22,
  },
  mono: {
    fontFamily: "SpaceMono",
    color: theme.colors.text,
  },
  btn: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  btnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },
});
