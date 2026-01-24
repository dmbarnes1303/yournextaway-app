// app/team/[teamKey].tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { DEFAULT_SEASON, LEAGUES, getRollingWindowIso, type LeagueOption } from "@/src/constants/football";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import teamGuides from "@/src/data/teamGuides";
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

function normalizeTeamKey(input: string) {
  const s = String(input ?? "").trim().toLowerCase();
  if (!s) return "";
  return s
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeTeamName(teamNameParam: string | null, teamKeyParam: string | null) {
  if (teamNameParam) return teamNameParam;
  if (!teamKeyParam) return "Team";
  // Title-ish fallback from slug
  return teamKeyParam
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function fixtureLine(r: FixtureListRow) {
  const id = r?.fixture?.id;
  const fixtureId = id ? String(id) : null;

  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);

  const venue = r?.fixture?.venue?.name ?? "";
  const city = r?.fixture?.venue?.city ?? "";
  const extra = [venue, city].filter(Boolean).join(" • ");

  return {
    fixtureId,
    title: `${home} vs ${away}`,
    meta: extra ? `${kickoff} • ${extra}` : kickoff,
    home,
    away,
    city,
  };
}

type SearchLeague = LeagueOption & { aliases: string[] };

function buildSearchLeagues(): SearchLeague[] {
  const base: SearchLeague[] = LEAGUES.map((l) => {
    const label = l.label.toLowerCase();
    const aliases: string[] = [label];

    if (label.includes("premier league")) aliases.push("england", "english", "uk", "united kingdom");
    if (label.includes("la liga")) aliases.push("spain", "spanish");
    if (label.includes("serie a")) aliases.push("italy", "italian");
    if (label.includes("bundesliga") && !label.includes("austrian")) aliases.push("germany", "german");
    if (label.includes("ligue 1")) aliases.push("france", "french");

    return { ...l, aliases };
  });

  // Austria: helps team discovery when users typed Austria in Home search.
  const hasAustria = base.some((x) => x.leagueId === 218 || x.label.toLowerCase().includes("austrian"));
  if (!hasAustria) {
    base.push({
      label: "Austrian Bundesliga",
      leagueId: 218,
      season: DEFAULT_SEASON ?? (LEAGUES[0]?.season ?? 2025),
      aliases: ["austria", "austrian", "austrian bundesliga", "bundesliga austria"],
    });
  }

  return base;
}

export default function TeamGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const teamKeyParam = useMemo(() => paramString((params as any)?.teamKey), [params]);
  const teamNameParam = useMemo(() => paramString((params as any)?.teamName), [params]);

  const teamKey = useMemo(() => normalizeTeamKey(teamKeyParam ?? teamNameParam ?? ""), [teamKeyParam, teamNameParam]);
  const teamName = useMemo(() => safeTeamName(teamNameParam, teamKeyParam), [teamNameParam, teamKeyParam]);

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromIso = rolling.from;
  const toIso = rolling.to;

  const SEARCH_LEAGUES = useMemo(() => buildSearchLeagues(), []);

  const [scope, setScope] = useState<"all" | "league">("all");
  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(LEAGUES[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  const abortRef = useRef({ cancelled: false });

  const guide = useMemo(() => {
    if (!teamKey) return null;
    return (teamGuides as any)?.[teamKey] ?? null;
  }, [teamKey]);

  // Fetch fixtures for this team
  useEffect(() => {
    abortRef.current.cancelled = false;

    async function run() {
      if (!teamKey && !teamName) {
        setError("Missing team details.");
        return;
      }

      setLoading(true);
      setError(null);
      setRows([]);

      const queryName = teamName.trim().toLowerCase();
      const matchesTeam = (r: FixtureListRow) => {
        const home = String(r?.teams?.home?.name ?? "").trim().toLowerCase();
        const away = String(r?.teams?.away?.name ?? "").trim().toLowerCase();

        // Strong match first; then fallback to includes
        if (home === queryName || away === queryName) return true;
        return home.includes(queryName) || away.includes(queryName);
      };

      try {
        if (scope === "league") {
          const res = await getFixtures({
            league: selectedLeague.leagueId,
            season: selectedLeague.season,
            from: fromIso,
            to: toIso,
          });

          if (abortRef.current.cancelled) return;

          const list = (Array.isArray(res) ? res : []).filter(matchesTeam);
          setRows(list);
          return;
        }

        // scope === "all": search across leagues but stop once we have enough
        const collected: FixtureListRow[] = [];
        for (const l of SEARCH_LEAGUES) {
          if (abortRef.current.cancelled) return;

          // eslint-disable-next-line no-await-in-loop
          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from: fromIso,
            to: toIso,
          });

          if (abortRef.current.cancelled) return;

          const list = (Array.isArray(res) ? res : []).filter(matchesTeam);
          collected.push(...list);

          // Early stop: enough items for a useful guide
          if (collected.length >= 18) break;
        }

        setRows(collected);
      } catch (e: any) {
        if (abortRef.current.cancelled) return;
        setError(e?.message ?? "Failed to load fixtures for this team.");
      } finally {
        if (!abortRef.current.cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      abortRef.current.cancelled = true;
    };
  }, [teamKey, teamName, scope, selectedLeague, fromIso, toIso, SEARCH_LEAGUES]);

  const preview = useMemo(() => rows.slice(0, 12), [rows]);

  function goBuildTripWithContext(fixtureId: string) {
    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        // Keep context sensible: if user is on single-league scope, pass it; otherwise omit.
        ...(scope === "league"
          ? { leagueId: String(selectedLeague.leagueId), season: String(selectedLeague.season) }
          : {}),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  function openCityIfPossible(city: string) {
    const key = normalizeCityKey(city);
    router.push({ pathname: "/city/[cityKey]", params: { cityKey: key } } as any);
  }

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTintColor: theme.colors.text,
          title: "Team guide",
        }}
      />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.xxl + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.kicker}>TEAM GUIDE</Text>
            <Text style={styles.title}>{teamName}</Text>
            <Text style={styles.sub}>
              Upcoming fixtures • {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)}
            </Text>

            {/* Guide content (v1 fallback if empty) */}
            <View style={styles.guideBlock}>
              <Text style={styles.blockTitle}>Overview</Text>
              <Text style={styles.blockBody}>
                {guide?.history
                  ? guide.history
                  : "Guide content is being added. For v1, use fixtures below to plan a trip around a match."}
              </Text>

              {guide?.stadium ? (
                <>
                  <Text style={[styles.blockTitle, { marginTop: 10 }]}>Stadium</Text>
                  <Text style={styles.blockBody}>{guide.stadium}</Text>
                </>
              ) : null}

              {guide?.gettingThere ? (
                <>
                  <Text style={[styles.blockTitle, { marginTop: 10 }]}>Getting there</Text>
                  <Text style={styles.blockBody}>{guide.gettingThere}</Text>
                </>
              ) : null}
            </View>

            {/* Scope controls */}
            <View style={styles.scopeRow}>
              <Pressable
                onPress={() => setScope("all")}
                style={[styles.scopePill, scope === "all" && styles.scopePillActive]}
              >
                <Text style={[styles.scopeText, scope === "all" && styles.scopeTextActive]}>All leagues</Text>
              </Pressable>

              <Pressable
                onPress={() => setScope("league")}
                style={[styles.scopePill, scope === "league" && styles.scopePillActive]}
              >
                <Text style={[styles.scopeText, scope === "league" && styles.scopeTextActive]}>Pick league</Text>
              </Pressable>
            </View>

            {scope === "league" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
                {LEAGUES.map((l) => {
                  const active = l.leagueId === selectedLeague.leagueId;
                  return (
                    <Pressable
                      key={l.leagueId}
                      onPress={() => setSelectedLeague(l)}
                      style={[styles.leaguePill, active && styles.leaguePillActive]}
                    >
                      <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </GlassCard>

          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.sectionTitle}>Fixtures</Text>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && rows.length === 0 ? (
              <EmptyState title="No fixtures found" message="Try ‘All leagues’ or widen the date window later in v2." />
            ) : null}

            {!loading && !error && preview.length > 0 ? (
              <View style={styles.list}>
                {preview.map((r, idx) => {
                  const line = fixtureLine(r);
                  const key = line.fixtureId ?? `fx-${idx}`;

                  return (
                    <View key={key} style={styles.fxRow}>
                      <Pressable
                        onPress={() =>
                          line.fixtureId ? router.push({ pathname: "/match/[id]", params: { id: line.fixtureId } }) : null
                        }
                        style={{ flex: 1 }}
                      >
                        <Text style={styles.rowTitle}>{line.title}</Text>
                        <Text style={styles.rowMeta}>{line.meta}</Text>

                        {line.city ? (
                          <Pressable onPress={() => openCityIfPossible(line.city)} style={styles.inlineLink}>
                            <Text style={styles.inlineLinkText}>Open city guide: {line.city}</Text>
                          </Pressable>
                        ) : null}
                      </Pressable>

                      <Pressable
                        disabled={!line.fixtureId}
                        onPress={() => (line.fixtureId ? goBuildTripWithContext(line.fixtureId) : null)}
                        style={[styles.planBtn, !line.fixtureId && { opacity: 0.5 }]}
                      >
                        <Text style={styles.planBtnText}>Plan</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/fixtures",
                  params: {
                    ...(scope === "league"
                      ? { leagueId: String(selectedLeague.leagueId), season: String(selectedLeague.season) }
                      : {}),
                    from: fromIso,
                    to: toIso,
                  },
                } as any)
              }
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>Open Fixtures</Text>
            </Pressable>
          </GlassCard>

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 96,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  card: { padding: theme.spacing.lg },

  kicker: { color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: "900", letterSpacing: 0.6 },
  title: { marginTop: 8, color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "900", lineHeight: 30 },
  sub: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  guideBlock: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  blockTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  blockBody: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  scopeRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  scopePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  scopePillActive: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  scopeText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "800" },
  scopeTextActive: { color: theme.colors.text },

  leagueRow: { gap: 10, paddingRight: theme.spacing.lg, marginTop: 10 },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  leaguePillActive: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.45)" },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },
  leaguePillTextActive: { color: theme.colors.text },

  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  muted: { marginTop: 8, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  center: { paddingVertical: 12, alignItems: "center", gap: 10 },

  list: { marginTop: 10, gap: 10 },

  fxRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  rowTitle: { color: theme.colors.text, fontWeight: "800", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  inlineLink: { marginTop: 6 },
  inlineLinkText: { color: "rgba(0,255,136,0.85)", fontWeight: "800", fontSize: theme.fontSize.xs },

  planBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  planBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

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
});
