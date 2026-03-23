// app/stadium/[slug].tsx
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

import { coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

function normalizeVenueKey(input: string | undefined | null): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[,/|].*$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function prettyFromSlug(slug: string) {
  const s = String(slug ?? "").trim();
  if (!s) return "Stadium";
  return s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

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
    venue,
    city,
  };
}

export default function StadiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slugRaw = useMemo(() => coerceString((params as any)?.slug), [params]);
  const venueKey = useMemo(() => normalizeVenueKey(slugRaw ?? ""), [slugRaw]);
  const displayName = useMemo(() => prettyFromSlug(slugRaw ?? ""), [slugRaw]);

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromIso = useMemo(() => clampFromIsoToTomorrow(rolling.from), [rolling.from]);
  const toIso = rolling.to;

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

        const filtered = flat.filter((r) => {
          const venueName = String(r?.fixture?.venue?.name ?? "");
          const key = normalizeVenueKey(venueName);
          return !!key && key === venueKey;
        });

        filtered.sort((x, y) => {
          const a = new Date(String(x?.fixture?.date ?? "")).getTime();
          const b = new Date(String(y?.fixture?.date ?? "")).getTime();
          return (Number.isFinite(a) ? a : 0) - (Number.isFinite(b) ? b : 0);
        });

        setRows(filtered);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load stadium fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (venueKey) {
      run();
    } else {
      setLoading(false);
      setRows([]);
      setError("Missing stadium.");
    }

    return () => {
      cancelled = true;
    };
  }, [venueKey, fromIso, toIso]);

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

  const bgSource = getBackground("stadium") ?? getBackground("fixtures");

  return (
    <Background imageSource={bgSource} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Stadium",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <GlassCard style={styles.hero} intensity={26}>
            <Text style={styles.kicker}>STADIUM</Text>
            <Text style={styles.title} numberOfLines={2}>
              {displayName}
            </Text>
            <Text style={styles.meta}>
              {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)}
            </Text>

            <View style={{ marginTop: 10 }}>
              <EmptyState
                title="V1 note"
                message="This is a working route. In V1, we only guarantee venue-based fixtures and a stable page. V2 can add curated stadium details, transport, nearby areas, and photos."
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.card} intensity={22}>
            <SectionHeader title="Upcoming fixtures at this venue" subtitle="Matches in the rolling window" />

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
                message="Either there are no matches at this venue in the current window, or the venue name does not match the API naming."
              />
            ) : null}

            {!loading && !error && rows.length > 0 ? (
              <View style={styles.fxList}>
                {rows.slice(0, 18).map((r, idx) => {
                  const line = fixtureLine(r);
                  const fixtureId = line.fixtureId;
                  const key = fixtureId ?? `fx-${idx}`;

                  return (
                    <View key={key} style={styles.fxRow}>
                      <Pressable
                        onPress={() =>
                          fixtureId
                            ? router.push({
                                pathname: "/match/[id]",
                                params: { id: fixtureId, from: fromIso, to: toIso },
                              } as any)
                            : null
                        }
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

          <GlassCard style={styles.card} intensity={18}>
            <SectionHeader title="Venue key" subtitle="Used for matching against API venue names" />
            <Text style={styles.muted}>
              slug: {String(slugRaw ?? "")}
              {"\n"}venueKey: {String(venueKey ?? "")}
              {"\n"}Tip: if this returns 0 fixtures but you know there are games, the API venue name differs from the slug.
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

  meta: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },

  center: {
    paddingVertical: 14,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  fxList: {
    marginTop: 10,
    gap: 10,
  },

  fxRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  fxTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  fxMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },

  planBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  planText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
  },
});
