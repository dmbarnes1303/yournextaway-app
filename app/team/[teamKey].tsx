// app/team/[teamKey].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { getTeamHeroBackground } from "@/src/constants/teamBackgrounds";
import { theme } from "@/src/constants/theme";

import { LEAGUES, getRollingWindowIso } from "@/src/constants/football";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import teamGuidesRegistry, {
  getTeamGuide,
  hasTeamGuide,
  getTeamGuidesDebugSnapshot,
  normalizeTeamKey,
} from "@/src/data/teamGuides";
import { teams as teamsRegistry } from "@/src/data/teams";
import { usePro } from "@/src/context/ProContext";

function isDev() {
  // eslint-disable-next-line no-undef
  return typeof __DEV__ !== "undefined" ? !!__DEV__ : false;
}

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

function titleFromKey(key: string): string {
  const s = String(key ?? "").trim();
  if (!s) return "Team";
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

function teamMatchesRow(row: FixtureListRow, teamNorm: string): boolean {
  const home = String(row?.teams?.home?.name ?? "");
  const away = String(row?.teams?.away?.name ?? "");
  const homeNorm = normalizeTeamKey(home);
  const awayNorm = normalizeTeamKey(away);

  if (!teamNorm) return false;

  if (homeNorm === teamNorm || awayNorm === teamNorm) return true;

  // Fuzzy fallback
  if (
    homeNorm.includes(teamNorm) ||
    awayNorm.includes(teamNorm) ||
    teamNorm.includes(homeNorm) ||
    teamNorm.includes(awayNorm)
  ) {
    return true;
  }

  return false;
}

function isNonEmptyString(x: any): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function renderParagraphsMaybe(text: any) {
  if (!isNonEmptyString(text)) return null;

  const parts = text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <View style={{ marginTop: 8, gap: 10 }}>
      {parts.map((p, i) => (
        <Text key={i} style={styles.body}>
          {p}
        </Text>
      ))}
    </View>
  );
}

function renderGuideSections(sections: any[], limit?: number) {
  const list = Array.isArray(sections) ? sections : [];
  const sliced = typeof limit === "number" ? list.slice(0, limit) : list;

  return (
    <View style={{ gap: 14, marginTop: 10 }}>
      {sliced.map((s: any, idx: number) => {
        const title = isNonEmptyString(s?.title) ? s.title : `Section ${idx + 1}`;
        const body = s?.body;

        return (
          <View key={`${idx}-${title}`} style={styles.guideSection}>
            <Text style={styles.blockTitle}>{title}</Text>
            {renderParagraphsMaybe(body)}
          </View>
        );
      })}
    </View>
  );
}

function tokenize(s: string): string[] {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function TeamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pro = usePro();

  const teamKeyRaw = useMemo(() => coerceString((params as any)?.teamKey) ?? "", [params]);
  const teamKeyNorm = useMemo(() => normalizeTeamKey(teamKeyRaw), [teamKeyRaw]);

  const guide = useMemo(() => {
    if (!teamKeyRaw) return null;
    return getTeamGuide(teamKeyNorm) ?? getTeamGuide(teamKeyRaw) ?? null;
  }, [teamKeyRaw, teamKeyNorm]);

  const teamRec = useMemo(() => {
    return (teamsRegistry as any)?.[teamKeyNorm] ?? (teamsRegistry as any)?.[teamKeyRaw] ?? null;
  }, [teamKeyNorm, teamKeyRaw]);

  const teamName = useMemo(() => {
    const fromGuide = String((guide as any)?.name ?? "").trim();
    if (fromGuide) return fromGuide;
    const fromRegistry = String(teamRec?.name ?? "").trim();
    if (fromRegistry) return fromRegistry;
    return titleFromKey(teamKeyNorm || teamKeyRaw);
  }, [guide, teamRec, teamKeyNorm, teamKeyRaw]);

  const teamNormForFixtures = useMemo(
    () => normalizeTeamKey(teamKeyNorm || teamKeyRaw || teamName),
    [teamKeyNorm, teamKeyRaw, teamName]
  );

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const from = useMemo(() => coerceString((params as any)?.from) ?? rolling.from, [params, rolling.from]);
  const to = useMemo(() => coerceString((params as any)?.to) ?? rolling.to, [params, rolling.to]);

  const heroBackground = useMemo(() => {
    // Best effort: guide first, then registry, then just name/key.
    const stadium = String((guide as any)?.stadium ?? teamRec?.stadium ?? "").trim() || null;
    const city = String((guide as any)?.city ?? teamRec?.city ?? "").trim() || null;
    const country = String((guide as any)?.country ?? teamRec?.country ?? "").trim() || null;

    return getTeamHeroBackground({
      teamKey: teamKeyNorm || teamKeyRaw,
      teamName,
      stadium,
      city,
      country,
    });
  }, [guide, teamRec, teamKeyNorm, teamKeyRaw, teamName]);

  const [showLockCard, setShowLockCard] = useState(false);

  const devGuideDebug = useMemo(() => {
    if (!isDev()) return null;

    const hasNorm = teamKeyNorm ? hasTeamGuide(teamKeyNorm) : false;
    const hasRaw = teamKeyRaw ? hasTeamGuide(teamKeyRaw) : false;

    const registryKeys = Object.keys(teamGuidesRegistry ?? {});
    const qTokens = Array.from(new Set(tokenize(teamKeyRaw).concat(tokenize(teamKeyNorm))));
    const candidates = registryKeys
      .filter((k) => {
        if (!k) return false;
        if (teamKeyNorm && k === teamKeyNorm) return true;
        if (teamKeyRaw && k === teamKeyRaw) return true;
        if (qTokens.length === 0) return false;
        return qTokens.some((t) => k.includes(t));
      })
      .slice(0, 12);

    const snap = getTeamGuidesDebugSnapshot?.();
    const missingSample = Array.isArray(snap?.missing) ? snap.missing.slice(0, 10) : [];

    return {
      raw: teamKeyRaw,
      norm: teamKeyNorm,
      hasRaw,
      hasNorm,
      guideKeyResolved: (guide as any)?.teamKey ?? null,
      teamsRegistryHas: !!teamRec,
      teamsRegistryName: teamRec?.name ?? null,
      teamsRegistryLeagueId: typeof teamRec?.leagueId === "number" ? teamRec.leagueId : null,
      keysTotal: registryKeys.length,
      candidates,
      snapshot: snap
        ? {
            guidesCount: snap.guidesCount,
            registryTeamsCount: snap.registryTeamsCount,
            missingCount: snap.missingCount,
            duplicatesCount: Array.isArray(snap.duplicates) ? snap.duplicates.length : 0,
          }
        : null,
      missingSample,
    };
  }, [teamKeyRaw, teamKeyNorm, guide, teamRec]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!teamNormForFixtures) return;

      setLoading(true);
      setError(null);
      setRows([]);

      try {
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
            if (teamMatchesRow(row, teamNormForFixtures)) merged.push(row);
          }
        }

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
        setError(e?.message ?? "Couldn’t load team fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [teamNormForFixtures, from, to]);

  function goPaywallInline() {
    setShowLockCard(true);
  }

  function goPaywall() {
    router.push("/paywall");
  }

  function goBuildTrip(fixtureId: string) {
    router.push({ pathname: "/trip/build", params: { fixtureId, from, to } } as any);
  }

  function goMatch(fixtureId: string) {
    router.push({ pathname: "/match/[id]", params: { id: fixtureId, from, to } } as any);
  }

  if (!teamKeyRaw) {
    return (
      <Background imageUrl={getBackground("home")} overlayOpacity={0.88}>
        <Stack.Screen options={{ title: "Team", headerTransparent: true, headerTintColor: theme.colors.text }} />
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <ScrollView contentContainerStyle={styles.content}>
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState title="Missing team" message="No teamKey was provided. This route must be /team/[teamKey]." />
            </GlassCard>
          </ScrollView>
        </SafeAreaView>
      </Background>
    );
  }

  const sections = Array.isArray((guide as any)?.sections) ? ((guide as any).sections as any[]) : [];
  const FREE_SECTION_COUNT = 2;

  return (
    <Background imageUrl={heroBackground} overlayOpacity={0.88}>
      <Stack.Screen options={{ title: teamName, headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* HEADER */}
          <GlassCard style={styles.hero} intensity={24}>
            <Text style={styles.kicker}>TEAM</Text>
            <Text style={styles.title}>{teamName}</Text>

            <Text style={styles.sub}>
              {formatUkDateOnly(from)} → {formatUkDateOnly(to)}
            </Text>

            <View style={styles.pillsRow}>
              <Pressable
                onPress={() => router.push({ pathname: "/(tabs)/fixtures", params: { from, to } } as any)}
                style={styles.pill}
              >
                <Text style={styles.pillText}>Browse fixtures</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/(tabs)/home")} style={styles.pill}>
                <Text style={styles.pillText}>Back to Home</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* DEV DEBUG */}
          {devGuideDebug ? (
            <GlassCard style={styles.card} intensity={22}>
              <Text style={styles.devTitle}>DEV: Team Guide Resolution</Text>
              <View style={{ marginTop: 10, gap: 6 }}>
                <Text style={styles.devLine}>
                  raw: <Text style={styles.devStrong}>{devGuideDebug.raw || "—"}</Text>
                </Text>
                <Text style={styles.devLine}>
                  norm: <Text style={styles.devStrong}>{devGuideDebug.norm || "—"}</Text>
                </Text>
                <Text style={styles.devLine}>
                  hasGuide(raw): <Text style={styles.devStrong}>{String(devGuideDebug.hasRaw)}</Text>
                  {"   "}hasGuide(norm): <Text style={styles.devStrong}>{String(devGuideDebug.hasNorm)}</Text>
                </Text>
                <Text style={styles.devLine}>
                  resolved guideKey: <Text style={styles.devStrong}>{devGuideDebug.guideKeyResolved ?? "—"}</Text>
                </Text>
              </View>
            </GlassCard>
          ) : null}

          {/* GUIDE (PRO-GATED) */}
          <GlassCard style={styles.card} intensity={22}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Team guide</Text>
              <Text style={styles.sectionBadge}>{pro.isPro ? "Pro" : "Preview"}</Text>
            </View>

            {!guide ? (
              <EmptyState title="Guide coming soon" message="No guide exists for this teamKey (or the key doesn’t match)." />
            ) : pro.isPro ? (
              renderGuideSections(sections)
            ) : (
              <>
                {renderGuideSections(sections, FREE_SECTION_COUNT)}

                {sections.length > FREE_SECTION_COUNT ? (
                  <Pressable onPress={goPaywallInline} style={styles.inlineCta}>
                    <Text style={styles.inlineCtaText}>Show full guide</Text>
                  </Pressable>
                ) : null}

                {showLockCard ? (
                  <View style={styles.lockCard}>
                    <Text style={styles.lockTitle}>Unlock YourNextAway Pro</Text>
                    <Text style={styles.lockBody}>Full team guide detail is Pro-only. Unlock to see every section.</Text>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                      <Pressable onPress={goPaywall} style={[styles.unlockBtn, styles.unlockBtnPrimary]}>
                        <Text style={styles.unlockBtnText}>Unlock Pro</Text>
                      </Pressable>
                      <Pressable onPress={pro.refresh} style={styles.unlockBtn}>
                        <Text style={styles.unlockBtnText}>Refresh</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </GlassCard>

          {/* FIXTURES */}
          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.sectionTitle}>Fixtures for {teamName}</Text>
            <Text style={styles.sectionSub}>Filtered from your supported leagues list, within the rolling window.</Text>

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
                message="Either this club isn’t in your supported leagues list, or the rolling window doesn’t include their matches."
              />
            ) : null}

            {!loading && !error && rows.length > 0 ? (
              <View style={styles.list}>
                {rows.slice(0, 20).map((r, idx) => {
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
                      <Pressable onPress={() => (id ? goMatch(id) : null)} style={{ flex: 1 }} disabled={!id}>
                        <Text style={styles.rowTitle}>
                          {home} vs {away}
                        </Text>
                        <Text style={styles.rowMeta}>{line2}</Text>
                      </Pressable>

                      <Pressable
                        disabled={!id}
                        onPress={() => (id ? goBuildTrip(id) : null)}
                        style={[styles.planBtn, !id && styles.disabled]}
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
  sub: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "800" },

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

  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  sectionBadge: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs },

  sectionSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "800" },

  guideSection: { paddingTop: 8, paddingBottom: 2, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  blockTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  body: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 19, fontWeight: "700" },

  inlineCta: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },
  inlineCtaText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  lockCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  lockTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  lockBody: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  unlockBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  unlockBtnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  unlockBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  center: { paddingVertical: 14, alignItems: "center", gap: 10, marginTop: 10 },
  muted: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: "800" },

  list: { marginTop: 10, gap: 10 },
  fixtureRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },

  planBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  planBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  disabled: { opacity: 0.5 },

  devTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  devLine: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: theme.fontSize.xs, lineHeight: 16 },
  devStrong: { color: theme.colors.text, fontWeight: "900" },
});
