// app/team/[slug].tsx
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

import { getTeamGuide, normalizeTeamKey, teamGuides } from "@/src/data/teamGuides";
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
    home,
    away,
    title: `${home} vs ${away}`,
    meta: extra ? `${kickoff} • ${extra}` : kickoff,
  };
}

function eqTeam(a: string, b: string) {
  // Lightweight normalization: we rely on normalizeTeamKey from teamGuides helpers.
  return normalizeTeamKey(a) === normalizeTeamKey(b);
}

export default function TeamGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slugRaw = useMemo(() => coerceString((params as any)?.slug), [params]);
  const teamKey = useMemo(() => normalizeTeamKey(slugRaw ?? ""), [slugRaw]);

  const guide = useMemo(() => {
    if (!teamKey) return null;
    // getTeamGuide expects any input; it normalizes internally too.
    return getTeamGuide(teamKey) ?? null;
  }, [teamKey]);

  // Rolling window (tomorrow onwards)
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromIso = useMemo(() => clampFromIsoToTomorrow(rolling.from), [rolling.from]);
  const toIso = rolling.to;

  const displayName = useMemo(() => {
    // v1: guide only has fields, no explicit name. Derive from slug for now.
    if (!teamKey) return "Team";
    return teamKey.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  }, [teamKey]);

  // Fixtures involving this team (across configured leagues)
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

        // Filter: team appears as home or away.
        const filtered = flat.filter((r) => {
          const home = String(r?.teams?.home?.name ?? "").trim();
          const away = String(r?.teams?.away?.name ?? "").trim();
          if (!home && !away) return false;

          // Match against display name/slug-derived key
          return eqTeam(home, displayName) || eqTeam(away, displayName) || eqTeam(home, teamKey) || eqTeam(away, teamKey);
        });

        filtered.sort((x, y) => {
          const a = new Date(String(x?.fixture?.date ?? "")).getTime();
          const b = new Date(String(y?.fixture?.date ?? "")).getTime();
          return (Number.isFinite(a) ? a : 0) - (Number.isFinite(b) ? b : 0);
        });

        setRows(filtered);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load team fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (teamKey) run();
    else {
      setLoading(false);
      setRows([]);
      setError("Missing team.");
    }

    return () => {
      cancelled = true;
    };
  }, [teamKey, displayName, fromIso, toIso]);

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
    <Background imageUrl={getBackground("team") ?? getBackground("home")} overlayOpacity={0.86}>
      <Stack.Screen options={{ headerShown: true, title: "Team", headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* HERO */}
          <GlassCard style={styles.hero} intensity={26}>
            <Text style={styles.kicker}>TEAM GUIDE</Text>
            <Text style={styles.title} numberOfLines={2}>
              {displayName}
            </Text>

            <Text style={styles.meta}>
              {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)}
            </Text>

            {!hasGuide ? (
              <View style={{ marginTop: 10 }}>
                <EmptyState
                  title="Guide not found yet"
                  message="This team route is live, but the curated guide content hasn’t been added to the registry yet. Fixtures still work below."
                />
              </View>
            ) : null}
          </GlassCard>

          {/* GUIDE CONTENT (v1 type is minimal, but we still present it cleanly) */}
          {hasGuide ? (
            <>
              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="History" subtitle="Quick context" />
                <Text style={styles.body}>{guide?.history ?? ""}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Stadium" subtitle="What to expect on the day" />
                <Text style={styles.body}>{guide?.stadium ?? ""}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Atmosphere" subtitle="Matchday feel" />
                <Text style={styles.body}>{guide?.atmosphere ?? ""}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Tickets" subtitle="How to approach getting in" />
                <Text style={styles.body}>{guide?.tickets ?? ""}</Text>
              </GlassCard>

              <GlassCard style={styles.card} intensity={22}>
                <SectionHeader title="Getting there" subtitle="Transport and timing" />
                <Text style={styles.body}>{guide?.gettingThere ?? ""}</Text>
              </GlassCard>
            </>
          ) : null}

          {/* TEAM FIXTURES */}
          <GlassCard style={styles.card} intensity={22}>
            <SectionHeader title="Upcoming fixtures" subtitle="Matches in the rolling window" />

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && rows.length === 0 ? (
              <EmptyState title="No fixtures found" message="Either there are no matches in this window, or the team name does not match the API naming yet." />
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

          {/* DEBUG / DISCOVERY (remove later) */}
          <GlassCard style={styles.card} intensity={18}>
            <SectionHeader title="Team key" subtitle="Used for routing + guide lookup" />
            <Text style={styles.muted}>
              slug: {String(slugRaw ?? "")}
              {"\n"}teamKey: {String(teamKey ?? "")}
              {"\n"}known keys: {Object.keys(teamGuides as any).length}
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
  meta: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  body: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

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
