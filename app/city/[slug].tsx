// app/city/[slug].tsx
import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

/**
 * Legacy city route redirect
 *
 * Old pattern:
 *   /city/[slug]
 *
 * New canonical pattern:
 *   /city/key/[cityKey]
 *
 * This file exists ONLY to redirect any legacy navigation
 * so nothing breaks if old links remain in the app.
 */

function normalizeCityKey(input: any): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CitySlugRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawSlug = params.slug;

  useEffect(() => {
    const cityKey = normalizeCityKey(rawSlug);

    if (!cityKey) {
      router.replace("/(tabs)/home");
      return;
    }

    router.replace({
      pathname: "/city/key/[cityKey]",
      params: { cityKey },
    } as any);
  }, [rawSlug, router]);

  return null;
}
