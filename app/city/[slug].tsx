// app/city/[slug].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import SectionHeader from "@/src/components/SectionHeader";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { LEAGUES, getRollingWindowIso, clampFromIsoToTomorrow } from "@/src/constants/football";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import { getCityGuide, cityGuides } from "@/src/data/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";
import { coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

function fixtureLine(r: FixtureListRow) {
  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
  const venue = r?.fixture?.venue?.name ?? "";
  const city = r?.fixture?.venue?.city ?? "";
  const extra = [venue, city].filter(Boolean).join(" • ");
  return {
    fixtureId: r?.fixture?.id ? String(r.fixture.id) : null,
    title: `${home} vs ${away}`,
    meta: extra ? `${kickoff} • ${extra}` : kickoff,
  };
}

function eqCity(a: string, b: string) {
  // Normalize to avoid “Madrid, Spain” vs “Madrid” issues.
  return normalizeCityKey(a) === normalizeCityKey(b);
}

export default function CityGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slugRaw = useMemo(() => coerceString((params as any)?.slug), [params]);
  const cityKey = useMemo(() => normalizeCityKey(slugRaw), [slugRaw]);

  const guide = useMemo(() => {
    if (!cityKey) return null;
    // Allow passing either an actual key or a human name.
    return getCityGuide(cityKey) ?? null;
  }, [cityKey]);

  // Rolling window (tomorrow onwards)
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromIso = useMemo(() => clampFromIsoToTomorrow(rolling.from), [rolling.from]);
  const toIso = rolling.to;

  const displayName = useMemo(() => {
    if (guide?.name) return guide.name;
    if (cityKey) return cityKey.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    return "City";
  }, [guide?.name, cityKey]);

  const displayCountry = guide?.country ?? "";

  // Fixtures in this city (across configured leagues)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRows([]);

      try {
        // Fetch fixtures for each configured league in parallel.
        const all = await Promise.all(
          LEAGUES.map((l) =>
            getFixtures({
              league: l.leagueId,
              season: l.season,
              from: fromIso,
              to: toIso,
            })
              .then((r) => (Array.isArray(r) ? r : []))
              .catch(() => [])
          )
        );

        if (cancelled) return;

        const flat = all.flat();

        // Filter by venue.city (best available signal in v1).
        const filtered = flat.filter((r) => {
          const venueCity = String(r?.fixture?.venue?.city ?? "").trim();
          if (!venueCity) return false;

          // If we have a guide, match against guide name/cityId too.
          const a = venueCity;
          const b = guide?.name ?? displayName;
          return eqCity(a, b);
        });

        // Sort by kickoff datetime
        filtered.sort((x, y) => {
          const a = new Date(String(x?.fixture?.date ?? "")).getTime();
          const b = new Date(String(y?.fixture?.date ?? "")).getTime();
          return (Number.isFinite(a) ? a : 0) - (Number.isFinite(b) ? b : 0);
        });

        setRows(filtered);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load city fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // If cityKey is empty, do not fetch.
    if (cityKey) run();
    else {
      setLoading(false);
      setRows([]);
      setError("Missing city.");
    }

    return () => {
      cancelled = true;
    };
  }, [cityKey, guide?.name, displayName, fromIso, toIso]);

  function goPlanTripWithContext(fixtureId: string) {
    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  const hasGuide = !!guide;

  return (
    <Background imageUrl={getBackground("city") ?? getBackground("home")} overlayOpacity={0.86}>
      <Stack.Screen options={{ headerShown: true, title: "City", headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* HERO */}
          <GlassCard style={styles.hero} intensity={26}>
            <Text style={styles.kicker}>CITY GUIDE</Text>
            <Text style={styles.title} numberOfLines={2}>
              {displayName}
            </Text>
            {displayCountry ? <Text style={styles.sub}>{displayCountry}</Text> : null}
            <Text style={styles.meta}>
              {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)}
            </Text>

            {!hasGuide ? (
              <View style={{ marginTop: 10 }}>
                <EmptyState
                  title="Guide not found yet"
                  message="This city route is live, but the curated guide content hasn’t been added to the registry. Fixtures still work below."
                />
              </View>
            ) : null}
          </GlassCard>

          {/* GUIDE CONTENT */}
          {hasGuide ? (
            <>
              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Overview" subtitle="How to plan a strong weekend here" />
                <Text style={styles.body}>{guide?.overview ?? ""}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Top things to do" subtitle="Fast wins for a 1–3 day trip" />
                <View style={styles.list}>
                  {(guide?.topThings ?? []).slice(0, 10).map((x, idx) => (
                    <View key={`${x.title}-${idx}`} style={styles.item}>
                      <Text style={styles.itemTitle}>
                        {idx + 1}. {x.title}
                      </Text>
                      {x.tip ? <Text style={styles.itemBody}>{x.tip}</Text> : null}
                    </View>
                  ))}
                </View>
              </GlassCard>

              {(guide?.tips?.length ?? 0) > 0 ? (
                <GlassCard style={styles.card} intensity={22}>
                  <SectionHeader title="Quick tips" subtitle="Practical, non-fluffy" />
                  <View style={styles.bullets}>
                    {(guide?.tips ?? []).slice(0, 12).map((t, idx) => (
                      <Text key={`${t}-${idx}`} style={styles.bullet}>
                        • {t}
                      </Text>
                    ))}
                  </View>
                </GlassCard>
              ) : null}
            </>
          ) : null}

          {/* CITY FIXTURES */}
          <GlassCard style={styles.card} intensity={22}>
            <SectionHeader title="Fixtures in this city" subtitle="Matches in the rolling window" />

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && rows.length === 0 ? (
              <EmptyState title="No fixtures found" message="Either there are no matches in this window, or the venue city does not match this city key yet." />
            ) : null}

            {!loading && !error && rows.length > 0 ? (
              <View style={styles.fxList}>
                {rows.slice(0, 16).map((r, idx) => {
                  const line = fixtureLine(r);
                  const fixtureId = line.fixtureId;
                  const key = fixtureId ?? `fx-${idx}`;

                  return (
                    <View key={key} style={styles.fxRow}>
                      <Pressable
                        onPress={() => (fixtureId ? router.push({ pathname: "/match/[id]", params: { id: fixtureId, from: fromIso, to: toIso } }) : null)}
                        style={{ flex: 1 }}
                      >
                        <Text style={styles.fxTitle}>{line.title}</Text>
                        <Text style={styles.fxMeta}>{line.meta}</Text>
                      </Pressable>

                      <Pressable
                        disabled={!fixtureId}
                        onPress={() => (fixtureId ? goPlanTripWithContext(fixtureId) : null)}
                        style={[styles.planBtn, !fixtureId && { opacity: 0.5 }]}
                      >
                        <Text style={styles.planText}>Plan</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </GlassCard>

          {/* DEBUG / DISCOVERY (v1 helpful, non-user-facing later) */}
          <GlassCard style={styles.card} intensity={18}>
            <SectionHeader title="City key" subtitle="Used for routing + guide lookup" />
            <Text style={styles.muted}>
              slug: {String(slugRaw ?? "")}
              {"\n"}cityKey: {String(cityKey ?? "")}
              {"\n"}known keys: {Object.keys(cityGuides).length}
            </Text>
          </GlassCard>
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
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    lineHeight: 30,
  },
  sub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  meta: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  body: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  list: { marginTop: 10, gap: 12 },
  item: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  itemTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  itemBody: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  bullets: { marginTop: 10, gap: 6 },
  bullet: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  center: { paddingVertical: 14, alignItems: "center", gap: 10, marginTop: 8 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  fxList: { marginTop: 10, gap: 10 },
  fxRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  fxTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  fxMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  planBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  planText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },
});
