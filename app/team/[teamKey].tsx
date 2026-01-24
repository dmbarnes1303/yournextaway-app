// app/team/[teamKey].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { LEAGUES, getRollingWindowIso, type LeagueOption } from "@/src/constants/football";
import { coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { getTeam, leagueForTeam, normalizeTeamKey, type TeamRecord } from "@/src/data/teams";
// If/when you have team guides populated, this will light up automatically.
import teamGuides from "@/src/data/teamGuides";

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
    home,
    away,
    venue,
    city,
  };
}

function matchesTeam(r: FixtureListRow, t: TeamRecord) {
  const home = String(r?.teams?.home?.name ?? "").toLowerCase();
  const away = String(r?.teams?.away?.name ?? "").toLowerCase();

  const name = String(t.name ?? "").toLowerCase();
  const aliases = (t.aliases ?? []).map((a) => String(a).toLowerCase());

  const hit = (s: string) => (s ? s.includes(name) || aliases.some((a) => s.includes(a)) : false);

  return hit(home) || hit(away);
}

export default function TeamGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const teamKeyParam = useMemo(() => normalizeTeamKey(coerceString((params as any)?.teamKey) ?? ""), [params]);
  const team = useMemo(() => (teamKeyParam ? getTeam(teamKeyParam) : null), [teamKeyParam]);

  const { from, to } = useMemo(() => getRollingWindowIso(), []);
  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);

  // Try to lock league context to the team’s league if known.
  useEffect(() => {
    if (!team) return;
    const inferred = leagueForTeam(team);
    if (!inferred) return;
    setLeague(inferred);
  }, [team]);

  const guide = useMemo(() => {
    if (!team) return null;
    const key = team.teamKey;
    return (teamGuides as any)?.[key] ?? null;
  }, [team]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!team) return;

      setLoading(true);
      setError(null);
      setRows([]);

      try {
        const res = await getFixtures({
          league: league.leagueId,
          season: league.season,
          from,
          to,
        });

        if (cancelled) return;
        const all = Array.isArray(res) ? res : [];
        const filtered = all.filter((r) => matchesTeam(r, team));
        setRows(filtered);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [team, league, from, to]);

  const preview = useMemo(() => rows.slice(0, 10), [rows]);

  function openFixtures() {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        leagueId: String(league.leagueId),
        season: String(league.season),
        from,
        to,
      },
    } as any);
  }

  function planTripFromFixture(fixtureId: string) {
    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        leagueId: String(league.leagueId),
        season: String(league.season),
        from,
        to,
      },
    } as any);
  }

  if (!team) {
    return (
      <Background imageUrl={getBackground("home")} overlayOpacity={0.86}>
        <Stack.Screen options={{ headerShown: true, title: "Team", headerTransparent: true, headerTintColor: theme.colors.text }} />
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <ScrollView contentContainerStyle={styles.content}>
            <GlassCard style={styles.card} intensity={24}>
              <EmptyState
                title="Team not found"
                message="This team isn’t in your registry yet. Add it to src/data/teams/index.ts so search and guides can route correctly."
              />
              <Pressable onPress={() => router.back()} style={styles.btn}>
                <Text style={styles.btnText}>Go back</Text>
              </Pressable>
            </GlassCard>
          </ScrollView>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageUrl={getBackground("fixtures")}>
      <Stack.Screen options={{ headerShown: true, title: team.name, headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* HEADER */}
          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.kicker}>TEAM GUIDE</Text>
            <Text style={styles.h1}>{team.name}</Text>

            <Text style={styles.sub}>
              {(team.city ? `${team.city}` : "—")}
              {team.country ? ` • ${team.country}` : ""}
            </Text>

            <Text style={styles.meta}>
              Fixtures window: {formatUkDateOnly(from)} → {formatUkDateOnly(to)}
            </Text>

            <View style={styles.actionsRow}>
              <Pressable onPress={openFixtures} style={[styles.actionBtn, styles.actionBtnPrimary]}>
                <Text style={styles.actionBtnText}>Open Fixtures</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/trip/build")} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Build Trip</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* GUIDE CONTENT */}
          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.h2}>Overview</Text>

            {guide ? (
              <>
                {guide.history ? (
                  <>
                    <Text style={styles.h3}>Club snapshot</Text>
                    <Text style={styles.body}>{guide.history}</Text>
                  </>
                ) : null}

                {guide.stadium ? (
                  <>
                    <Text style={styles.h3}>Stadium</Text>
                    <Text style={styles.body}>{guide.stadium}</Text>
                  </>
                ) : null}

                {guide.atmosphere ? (
                  <>
                    <Text style={styles.h3}>Matchday vibe</Text>
                    <Text style={styles.body}>{guide.atmosphere}</Text>
                  </>
                ) : null}

                {guide.tickets ? (
                  <>
                    <Text style={styles.h3}>Tickets</Text>
                    <Text style={styles.body}>{guide.tickets}</Text>
                  </>
                ) : null}

                {guide.gettingThere ? (
                  <>
                    <Text style={styles.h3}>Getting there</Text>
                    <Text style={styles.body}>{guide.gettingThere}</Text>
                  </>
                ) : null}
              </>
            ) : (
              <Text style={styles.muted}>
                Guide content isn’t available yet for this team. Once you add it to src/data/teamGuides, it will appear here automatically.
              </Text>
            )}
          </GlassCard>

          {/* FIXTURES PREVIEW */}
          <GlassCard style={styles.card} intensity={22}>
            <View style={styles.blockTop}>
              <Text style={styles.h2}>Upcoming fixtures</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
                {LEAGUES.map((l) => {
                  const active = l.leagueId === league.leagueId;
                  return (
                    <Pressable
                      key={l.leagueId}
                      onPress={() => setLeague(l)}
                      style={[styles.leaguePill, active && styles.leaguePillActive]}
                    >
                      <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && preview.length === 0 ? (
              <EmptyState title="No fixtures found" message="Try another league in the selector above." />
            ) : null}

            {!loading && !error && preview.length > 0 ? (
              <View style={styles.list}>
                {preview.map((r, idx) => {
                  const f = fixtureLine(r);
                  const key = f.fixtureId ?? `fx-${idx}`;

                  return (
                    <View key={key} style={styles.rowWrap}>
                      <Pressable
                        onPress={() => (f.fixtureId ? router.push({ pathname: "/match/[id]", params: { id: f.fixtureId } }) : null)}
                        style={{ flex: 1 }}
                      >
                        <Text style={styles.rowTitle}>{f.title}</Text>
                        <Text style={styles.rowMeta}>{f.meta}</Text>
                      </Pressable>

                      <Pressable
                        disabled={!f.fixtureId}
                        onPress={() => (f.fixtureId ? planTripFromFixture(f.fixtureId) : null)}
                        style={[styles.pill, !f.fixtureId && { opacity: 0.5 }]}
                      >
                        <Text style={styles.pillText}>Plan</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <Pressable onPress={openFixtures} style={styles.linkBtn}>
              <Text style={styles.linkText}>See all fixtures</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  card: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  h1: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    lineHeight: 30,
  },

  sub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  meta: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },

  actionsRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  actionBtnPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  actionBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  h2: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  h3: { marginTop: 12, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  body: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  muted: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  blockTop: { gap: 10 },

  leagueRow: { gap: 10, paddingRight: theme.spacing.lg, marginTop: 2 },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  leaguePillActive: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: "900" },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },

  list: { marginTop: 10, gap: 10 },

  rowWrap: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowTitle: { color: theme.colors.text, fontWeight: "800", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  pillText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  linkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  linkText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  btn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  btnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
});
