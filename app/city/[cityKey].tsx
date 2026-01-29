// app/city/[cityKey].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import PlanTripBlock from "@/src/components/PlanTripBlock";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { LEAGUES, getRollingWindowIso, type LeagueOption } from "@/src/constants/football";
import { coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { getCityGuide } from "@/src/data/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";
import { getTeamsForCity } from "@/src/helpers/cityTeamHelpers";

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

function matchesCity(r: FixtureListRow, cityKey: string, cityName?: string) {
  const vCity = String(r?.fixture?.venue?.city ?? "").toLowerCase();
  const vName = String(r?.fixture?.venue?.name ?? "").toLowerCase();

  const key = String(cityKey ?? "").toLowerCase();
  const name = String(cityName ?? "").toLowerCase();

  const hits = (needle: string) => (needle ? vCity.includes(needle) || vName.includes(needle) : false);

  return hits(name) || hits(key);
}

function titleFromKey(key: string) {
  return String(key ?? "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CityGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const cityKeyParamRaw = useMemo(() => coerceString((params as any)?.cityKey) ?? "", [params]);
  const cityKey = useMemo(() => normalizeCityKey(cityKeyParamRaw), [cityKeyParamRaw]);

  const guide = useMemo(() => (cityKey ? getCityGuide(cityKey) : null), [cityKey]);

  const displayName = guide?.name ?? (cityKey ? titleFromKey(cityKey) : "City");
  const country = guide?.country ?? "";

  const { from, to } = useMemo(() => getRollingWindowIso(), []);
  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);

  const teamsInCity = useMemo(() => (cityKey ? getTeamsForCity(cityKey) : []), [cityKey]);

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
        const res = await getFixtures({
          league: league.leagueId,
          season: league.season,
          from,
          to,
        });

        if (cancelled) return;
        const all = Array.isArray(res) ? res : [];

        const filtered = all.filter((r) => matchesCity(r, cityKey, guide?.name ?? displayName));
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
  }, [cityKey, league, from, to, guide?.name, displayName]);

  const preview = useMemo(() => rows.slice(0, 12), [rows]);

  function openFixturesFilteredToCity() {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        cityKey: String(cityKey),
        leagueId: String(league.leagueId),
        season: String(league.season),
        from,
        to,
      },
    } as any);
  }

  function openTripBuildFromCity() {
    router.push({
      pathname: "/trip/build",
      params: {
        cityKey: String(cityKey),
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
        cityKey: String(cityKey),
        leagueId: String(league.leagueId),
        season: String(league.season),
        from,
        to,
      },
    } as any);
  }

  if (!cityKey) {
    return (
      <Background imageUrl={getBackground("home")} overlayOpacity={0.86}>
        <Stack.Screen options={{ headerShown: true, title: "City", headerTransparent: true, headerTintColor: theme.colors.text }} />
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <ScrollView contentContainerStyle={styles.content}>
            <GlassCard style={styles.card} intensity={24}>
              <EmptyState title="City not found" message="Missing city key in the route." />
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
      <Stack.Screen options={{ headerShown: true, title: displayName, headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* HEADER */}
          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.kicker}>CITY GUIDE</Text>
            <Text style={styles.h1}>{displayName}</Text>

            <Text style={styles.sub}>
              {country ? country : "—"}
              <Text style={{ color: theme.colors.textSecondary }}>{"  •  "}</Text>
              Fixtures window: {formatUkDateOnly(from)} → {formatUkDateOnly(to)}
            </Text>

            <View style={styles.actionsRow}>
              <Pressable onPress={openFixturesFilteredToCity} style={[styles.actionBtn, styles.actionBtnPrimary]}>
                <Text style={styles.actionBtnText}>Upcoming matches</Text>
              </Pressable>

              <Pressable onPress={openTripBuildFromCity} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Build trip</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* CLUB LINKS */}
          {teamsInCity.length > 0 ? (
            <GlassCard style={styles.card} intensity={22}>
              <Text style={styles.h2}>Clubs in {displayName}</Text>
              <Text style={styles.muted}>Tap a club to open the team guide.</Text>

              <View style={styles.teamList}>
                {teamsInCity.map((t) => (
                  <Pressable
                    key={t.teamKey}
                    onPress={() => router.push({ pathname: "/team/[teamKey]", params: { teamKey: t.teamKey } } as any)}
                    style={styles.teamRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teamName}>{t.name}</Text>
                      <Text style={styles.teamMeta}>
                        {[t.stadium, t.country].filter(Boolean).join(" • ") || "Team guide"}
                      </Text>
                    </View>
                    <Text style={styles.teamChevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          ) : null}

          {/* MONETIZATION */}
          <PlanTripBlock
            title={`Plan a weekend in ${displayName}`}
            cityName={displayName}
            country={country}
            onBuildTrip={openTripBuildFromCity}
          />

          {/* GUIDE CONTENT */}
          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.h2}>Overview</Text>

            {guide ? (
              <>
                {guide.overview ? <Text style={styles.body}>{guide.overview}</Text> : <Text style={styles.muted}>—</Text>}

                {(guide.topThings?.length ?? 0) > 0 ? (
                  <>
                    <Text style={styles.h3}>Top things to do</Text>
                    <View style={styles.bullets}>
                      {guide.topThings.slice(0, 10).map((x, idx) => (
                        <View key={`${x.title}-${idx}`} style={styles.bulletRow}>
                          <Text style={styles.bulletIdx}>{idx + 1}.</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.bulletTitle}>{x.title}</Text>
                            {x.tip ? <Text style={styles.bulletBody}>{x.tip}</Text> : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                {(guide.tips?.length ?? 0) > 0 ? (
                  <>
                    <Text style={styles.h3}>Quick tips</Text>
                    <View style={styles.tipBlock}>
                      {guide.tips.slice(0, 10).map((t, idx) => (
                        <Text key={`${t}-${idx}`} style={styles.tipLine}>
                          • {t}
                        </Text>
                      ))}
                    </View>
                  </>
                ) : null}

                {(guide.food?.length ?? 0) > 0 ? (
                  <>
                    <Text style={styles.h3}>Food & drink</Text>
                    <Text style={styles.body}>{guide.food.join(" • ")}</Text>
                  </>
                ) : null}

                {guide.transport ? (
                  <>
                    <Text style={styles.h3}>Transport</Text>
                    <Text style={styles.body}>{guide.transport}</Text>
                  </>
                ) : null}

                {guide.accommodation ? (
                  <>
                    <Text style={styles.h3}>Where to stay</Text>
                    <Text style={styles.body}>{guide.accommodation}</Text>
                  </>
                ) : null}
              </>
            ) : (
              <Text style={styles.muted}>
                No curated guide yet for this city. Add it in src/data/cityGuides/cityGuides.ts and it will appear here automatically.
              </Text>
            )}
          </GlassCard>

          {/* FIXTURES IN THIS CITY */}
          <GlassCard style={styles.card} intensity={22}>
            <View style={styles.blockTop}>
              <Text style={styles.h2}>Matches in {displayName}</Text>

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
              <EmptyState
                title="No matches found"
                message="Either there are no fixtures in this window, or the API venue city doesn’t match this city name yet."
              />
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

            <Pressable onPress={openFixturesFilteredToCity} style={styles.linkBtn}>
              <Text style={styles.linkText}>See all matches in {displayName}</Text>
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

  sub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

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
  h3: { marginTop: 14, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  body: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  muted: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  // teams
  teamList: { marginTop: 10, gap: 10 },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  teamName: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  teamMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "700" },
  teamChevron: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 22, marginLeft: 6 },

  bullets: { marginTop: 10, gap: 10 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletIdx: { width: 20, color: theme.colors.primary, fontWeight: "900" },
  bulletTitle: { color: theme.colors.text, fontWeight: "900" },
  bulletBody: { marginTop: 4, color: theme.colors.textSecondary, lineHeight: 18 },

  tipBlock: { marginTop: 8, gap: 6 },
  tipLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

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
