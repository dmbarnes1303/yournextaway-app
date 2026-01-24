// app/city/[slug].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { LEAGUES, getRollingWindowIso } from "@/src/constants/football";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { getCityGuide } from "@/src/data/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";

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

function titleFromSlug(slug: string): string {
  const s = String(slug ?? "").trim();
  if (!s) return "City";

  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function fixtureKey(r: FixtureListRow, idx: number) {
  const id = r?.fixture?.id;
  return id ? String(id) : `idx-${idx}`;
}

function rowInCity(r: FixtureListRow, cityKey: string): boolean {
  if (!cityKey) return false;

  const venueCity = String(r?.fixture?.venue?.city ?? "").trim();
  const venueKey = normalizeCityKey(venueCity);

  if (!venueKey) return false;

  // Exact match first
  if (venueKey === cityKey) return true;

  // Soft fallback for “greater area” / spelling variants
  if (venueKey.includes(cityKey) || cityKey.includes(venueKey)) return true;

  return false;
}

export default function CityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slug = useMemo(() => coerceString((params as any)?.slug) ?? "", [params]);
  const cityKey = useMemo(() => normalizeCityKey(slug), [slug]);

  const guide = useMemo(() => (slug ? getCityGuide(slug) : null), [slug]);
  const title = useMemo(() => (guide?.name ? guide.name : titleFromSlug(slug)), [guide?.name, slug]);

  // Rolling window defaults (can be overridden by params)
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const from = useMemo(() => coerceString((params as any)?.from) ?? rolling.from, [params, rolling.from]);
  const to = useMemo(() => coerceString((params as any)?.to) ?? rolling.to, [params, rolling.to]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cityKey) return;

      setLoading(true);
      setError(null);
      setRows([]);

      try {
        // V1 approach: pull fixtures for each supported league in the window and filter to this city.
        const results = await Promise.allSettled(
          LEAGUES.map((l) =>
            getFixtures({
              league: l.leagueId,
              season: l.season,
              from,
              to,
            })
          )
        );

        if (cancelled) return;

        const merged: FixtureListRow[] = [];
        for (const r of results) {
          if (r.status !== "fulfilled") continue;
          const list = Array.isArray(r.value) ? (r.value as FixtureListRow[]) : [];
          for (const row of list) {
            if (rowInCity(row, cityKey)) merged.push(row);
          }
        }

        // Sort by kickoff
        merged.sort((a, b) => {
          const ad = new Date(String(a?.fixture?.date ?? "")).getTime();
          const bd = new Date(String(b?.fixture?.date ?? "")).getTime();
          if (!Number.isFinite(ad) && !Number.isFinite(bd)) return 0;
          if (!Number.isFinite(ad)) return 1;
          if (!Number.isFinite(bd)) return -1;
          return ad - bd;
        });

        setRows(merged);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Couldn’t load city fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [cityKey, from, to]);

  function goBuildTrip(fixtureId: string) {
    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        from,
        to,
      },
    } as any);
  }

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.88}>
      <Stack.Screen
        options={{
          title,
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* HEADER */}
          <GlassCard style={styles.hero} intensity={24}>
            <Text style={styles.kicker}>CITY</Text>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.sub}>
              {formatUkDateOnly(from)} → {formatUkDateOnly(to)}
            </Text>

            <View style={styles.pillsRow}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/fixtures",
                    params: { from, to },
                  } as any)
                }
                style={styles.pill}
              >
                <Text style={styles.pillText}>Browse fixtures</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/(tabs)/home")} style={styles.pill}>
                <Text style={styles.pillText}>Back to Home</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* GUIDE */}
          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.sectionTitle}>City guide</Text>

            {!guide ? (
              <EmptyState
                title="Guide coming soon"
                message="This page is live so search routing works now. Your full guides live in src/data/cityGuides/cityGuides.ts."
              />
            ) : (
              <View style={{ gap: 12 }}>
                {guide.overview ? (
                  <View>
                    <Text style={styles.blockTitle}>Overview</Text>
                    <Text style={styles.body}>{guide.overview}</Text>
                  </View>
                ) : null}

                {(guide.topThings?.length ?? 0) > 0 ? (
                  <View>
                    <Text style={styles.blockTitle}>Top things to do</Text>
                    <View style={{ gap: 10, marginTop: 8 }}>
                      {guide.topThings.slice(0, 8).map((t, idx) => (
                        <View key={`${t.title}-${idx}`} style={styles.bulletRow}>
                          <Text style={styles.bulletIdx}>{idx + 1}.</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.bulletTitle}>{t.title}</Text>
                            {t.tip ? <Text style={styles.bulletBody}>{t.tip}</Text> : null}
                          </View>
                        </View>
                      ))}
                    </View>
                    {(guide.topThings?.length ?? 0) > 8 ? (
                      <Text style={styles.moreInline}>More in the full guide (expand in V2).</Text>
                    ) : null}
                  </View>
                ) : null}

                {(guide.tips?.length ?? 0) > 0 ? (
                  <View>
                    <Text style={styles.blockTitle}>Quick tips</Text>
                    <View style={{ gap: 6, marginTop: 8 }}>
                      {guide.tips.slice(0, 8).map((x, idx) => (
                        <Text key={`${x}-${idx}`} style={styles.tipLine}>
                          • {x}
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : null}

                {guide.tripAdvisorTopThingsUrl ? (
                  <Pressable
                    onPress={() => {
                      // No Linking import here; keep V1 simple. Add link-out in V2 if you want.
                      router.push({
                        pathname: "/(tabs)/home",
                      } as any);
                    }}
                    style={styles.linkStub}
                  >
                    <Text style={styles.linkStubText}>TripAdvisor link is stored in data (wire up link-out in V2).</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </GlassCard>

          {/* FIXTURES */}
          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.sectionTitle}>Fixtures in {title}</Text>
            <Text style={styles.sectionSub}>Filtered by venue city within your rolling window.</Text>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && rows.length === 0 ? (
              <EmptyState
                title="No fixtures found"
                message="This can happen if the supported leagues list doesn’t include clubs in this city yet, or the rolling window doesn’t include their matches."
              />
            ) : null}

            {!loading && !error && rows.length > 0 ? (
              <View style={styles.list}>
                {rows.slice(0, 24).map((r, idx) => {
                  const id = r?.fixture?.id ? String(r.fixture.id) : null;
                  const home = r?.teams?.home?.name ?? "Home";
                  const away = r?.teams?.away?.name ?? "Away";
                  const kick = formatUkDateTimeMaybe(r?.fixture?.date);
                  const venue = r?.fixture?.venue?.name ?? "";
                  const city = r?.fixture?.venue?.city ?? "";
                  const extra = [venue, city].filter(Boolean).join(" • ");
                  const line2 = extra ? `${kick} • ${extra}` : kick;

                  return (
                    <View key={fixtureKey(r, idx)} style={styles.fixtureRow}>
                      <Pressable
                        onPress={() => (id ? router.push({ pathname: "/match/[id]", params: { id } }) : null)}
                        style={{ flex: 1 }}
                      >
                        <Text style={styles.rowTitle}>
                          {home} vs {away}
                        </Text>
                        <Text style={styles.rowMeta}>{line2}</Text>
                      </Pressable>

                      <Pressable
                        disabled={!id}
                        onPress={() => (id ? goBuildTrip(id) : null)}
                        style={[styles.planBtn, !id && { opacity: 0.5 }]}
                      >
                        <Text style={styles.planBtnText}>Plan Trip</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </GlassCard>

          <View style={{ height: 18 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  hero: { padding: theme.spacing.lg },
  kicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs, letterSpacing: 0.6 },
  title: { marginTop: 8, color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "900" },
  sub: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  pillsRow: { marginTop: 12, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  pillText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  card: { padding: theme.spacing.md },
  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  sectionSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  blockTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  body: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletIdx: { width: 18, color: theme.colors.primary, fontWeight: "900" },
  bulletTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  bulletBody: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  moreInline: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  tipLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  linkStub: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
    padding: 10,
  },
  linkStubText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },

  center: { paddingVertical: 14, alignItems: "center", gap: 10, marginTop: 10 },
  muted: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },

  list: { marginTop: 10, gap: 10 },
  fixtureRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowTitle: { color: theme.colors.text, fontWeight: "800", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  planBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  planBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },
});
