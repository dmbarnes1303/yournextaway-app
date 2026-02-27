// app/team/[teamKey].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
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

import { getTeamGuide, normalizeTeamKey } from "@/src/data/teamGuides";
import { teams as teamsRegistry } from "@/src/data/teams";
import { usePro } from "@/src/context/ProContext";

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

function getMonthKey(iso?: string | null): string {
  const s = String(iso ?? "");
  if (!s) return "";
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1; // 1-12
  return `${y}-${String(m).padStart(2, "0")}`;
}

function monthLabel(monthKey: string): string {
  // monthKey: YYYY-MM
  const [y, m] = monthKey.split("-").map((x) => Number(x));
  if (!y || !m) return "Upcoming";
  const d = new Date(Date.UTC(y, m - 1, 1));
  const label = d.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return label;
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

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const from = useMemo(
    () => coerceString((params as any)?.from) ?? rolling.from,
    [params, rolling.from]
  );
  const to = useMemo(
    () => coerceString((params as any)?.to) ?? rolling.to,
    [params, rolling.to]
  );

  const heroBackground = useMemo(() => {
    const stadium = String((guide as any)?.stadium ?? teamRec?.stadium ?? "").trim() || null;
    const city = String((guide as any)?.city ?? teamRec?.city ?? "").trim() || null;
    const country = String((guide as any)?.country ?? teamRec?.country ?? "").trim() || null;

    const url = getTeamHeroBackground({
      teamKey: teamKeyNorm || teamKeyRaw,
      teamName,
      stadium,
      city,
      country,
    });

    // Hard fallback so we never render a blank background.
    return url || getBackground("home");
  }, [guide, teamRec, teamKeyNorm, teamKeyRaw, teamName]);

  // Best-effort crest sources (support both registry + API rows)
  const crestUrl = useMemo(() => {
    const c =
      String(teamRec?.crestUrl ?? teamRec?.crest ?? teamRec?.logo ?? "").trim() ||
      String((guide as any)?.crestUrl ?? (guide as any)?.logo ?? "").trim();
    return c || null;
  }, [teamRec, guide]);

  const teamNormForFixtures = useMemo(
    () => normalizeTeamKey(teamKeyNorm || teamKeyRaw || teamName),
    [teamKeyNorm, teamKeyRaw, teamName]
  );

  const [showLockCard, setShowLockCard] = useState(false);

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
            // HOME FIXTURES ONLY:
            const homeName = String(row?.teams?.home?.name ?? "");
            const homeNorm = normalizeTeamKey(homeName);
            if (homeNorm && homeNorm === teamNormForFixtures) merged.push(row);
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

  // Group fixtures by month for readability
  const grouped = useMemo(() => {
    const map = new Map<string, FixtureListRow[]>();
    for (const r of rows) {
      const key = getMonthKey(String(r?.fixture?.date ?? ""));
      const k = key || "upcoming";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    const keys = Array.from(map.keys()).sort((a, b) => (a === "upcoming" ? 1 : b === "upcoming" ? -1 : a.localeCompare(b)));
    return keys.map((k) => ({ key: k, label: k === "upcoming" ? "Upcoming" : monthLabel(k), items: map.get(k)! }));
  }, [rows]);

  return (
    <Background imageUrl={heroBackground} overlayOpacity={0.88}>
      <Stack.Screen options={{ title: teamName, headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* HEADER */}
          <GlassCard style={styles.hero} intensity={24}>
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>TEAM</Text>
                <Text style={styles.title}>{teamName}</Text>
                <Text style={styles.sub}>
                  {formatUkDateOnly(from)} → {formatUkDateOnly(to)}
                </Text>
              </View>

              {crestUrl ? (
                <View style={styles.crestWrap}>
                  <Image source={{ uri: crestUrl }} style={styles.crest} resizeMode="contain" />
                </View>
              ) : null}
            </View>

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

          {/* GUIDE (PRO-GATED) */}
          <GlassCard style={styles.card} intensity={22}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Team guide</Text>
              <Text style={styles.sectionBadge}>{pro.isPro ? "Pro" : "Preview"}</Text>
            </View>

            {!guide ? (
              <EmptyState title="Guide coming soon" message="No guide exists for this team yet." />
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

          {/* FIXTURES (HOME ONLY + CRESTS) */}
          <GlassCard style={styles.card} intensity={22}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Home fixtures</Text>
              <Text style={styles.sectionBadge}>Next {Math.min(20, rows.length)}</Text>
            </View>
            <Text style={styles.sectionSub}>
              Showing only fixtures where <Text style={{ fontWeight: "900", color: theme.colors.text }}>{teamName}</Text> is the home team (within your rolling window).
            </Text>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && rows.length === 0 ? (
              <EmptyState
                title="No home fixtures found"
                message="Either this club isn’t in your supported leagues list, or the rolling window doesn’t include their home matches."
              />
            ) : null}

            {!loading && !error && rows.length > 0 ? (
              <View style={styles.list}>
                {grouped.map((g) => (
                  <View key={g.key} style={{ gap: 10 }}>
                    <Text style={styles.monthHeader}>{g.label}</Text>

                    {g.items.slice(0, 20).map((r, idx) => {
                      const id = r?.fixture?.id ? String(r.fixture.id) : null;

                      const home = r?.teams?.home?.name ?? "Home";
                      const away = r?.teams?.away?.name ?? "Away";

                      const homeLogo = String((r as any)?.teams?.home?.logo ?? "").trim() || null;
                      const awayLogo = String((r as any)?.teams?.away?.logo ?? "").trim() || null;

                      const kick = formatUkDateTimeMaybe(r?.fixture?.date);
                      const venue = r?.fixture?.venue?.name ?? "";
                      const city = r?.fixture?.venue?.city ?? "";
                      const extra = [venue, city].filter(Boolean).join(" • ");
                      const line2 = extra ? `${kick} • ${extra}` : kick;

                      return (
                        <View key={fixtureKey(r, idx)} style={styles.fixtureRow}>
                          <Pressable onPress={() => (id ? goMatch(id) : null)} style={{ flex: 1 }} disabled={!id}>
                            <View style={styles.rowTitleRow}>
                              <View style={styles.crestRow}>
                                {homeLogo ? (
                                  <Image source={{ uri: homeLogo }} style={styles.rowCrest} resizeMode="contain" />
                                ) : (
                                  <View style={styles.rowCrestFallback} />
                                )}
                                <Text style={styles.rowTitle} numberOfLines={1}>
                                  {home}
                                </Text>
                              </View>

                              <Text style={styles.vs}>vs</Text>

                              <View style={[styles.crestRow, { justifyContent: "flex-end" }]}>
                                <Text style={styles.rowTitle} numberOfLines={1}>
                                  {away}
                                </Text>
                                {awayLogo ? (
                                  <Image source={{ uri: awayLogo }} style={styles.rowCrest} resizeMode="contain" />
                                ) : (
                                  <View style={styles.rowCrestFallback} />
                                )}
                              </View>
                            </View>

                            <Text style={styles.rowMeta}>{line2}</Text>

                            <View style={styles.tagsRow}>
                              <View style={styles.tag}>
                                <Text style={styles.tagText}>HOME</Text>
                              </View>
                            </View>
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
                ))}
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
  heroTopRow: { flexDirection: "row", gap: 14, alignItems: "center" },

  crestWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  crest: { width: 40, height: 40 },

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

  sectionSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "800",
  },

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

  list: { marginTop: 10, gap: 16 },
  monthHeader: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm, opacity: 0.95 },

  fixtureRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  rowTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  crestRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },

  rowCrest: { width: 18, height: 18 },
  rowCrestFallback: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  rowTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  vs: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs },

  rowMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },

  tagsRow: { marginTop: 8, flexDirection: "row", gap: 8 },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  tagText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

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
});
