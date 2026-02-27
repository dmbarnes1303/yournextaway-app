// app/team/[teamKey].tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { theme } from "@/src/constants/theme";
import { getBackground } from "@/src/constants/backgrounds";
import { getFlagImageUrl } from "@/src/utils/flagImages";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { getTeam, leagueForTeam, normalizeTeamKey } from "@/src/data/teams";
import { hasTeamGuide } from "@/src/data/teamGuides";

// Remote stadium backgrounds (V1). Use direct JPG/PNG URLs.
// Keep it curated: only add teams you actively support in product.
const TEAM_BACKGROUNDS: Record<string, string> = {
  "real-madrid": "https://images.unsplash.com/photo-1548600916-d2d8a0b2b3b6?auto=format&fit=crop&w=1400&q=80",
  "arsenal": "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=1400&q=80",
  "bayern-munich": "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1400&q=80",
  "inter": "https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&w=1400&q=80",
  "borussia-dortmund": "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80",
};

const API_SPORTS_TEAM_LOGO = (teamId: number) => `https://media.api-sports.io/football/teams/${teamId}.png`;

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function toIsoOrEmpty(v: any) {
  return safeStr(v);
}

function ddmmyyyyFromIsoDateOnly(iso: string) {
  const s = safeStr(iso);
  if (!s) return "";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const [y, m, d] = parts;
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function monthHeading(iso: string) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

function groupByMonth(rows: FixtureListRow[]) {
  const map = new Map<string, FixtureListRow[]>();

  for (const r of rows) {
    const iso = safeStr(r?.fixture?.date);
    const title = monthHeading(iso) || "Other";
    if (!map.has(title)) map.set(title, []);
    map.get(title)!.push(r);
  }

  const out: { key: string; title: string; rows: FixtureListRow[] }[] = [];
  for (const [key, list] of map.entries()) out.push({ key, title: key, rows: list });

  out.sort((a, b) => {
    const da = a.rows[0]?.fixture?.date ? new Date(a.rows[0].fixture.date).getTime() : 0;
    const db = b.rows[0]?.fixture?.date ? new Date(b.rows[0].fixture.date).getTime() : 0;
    return da - db;
  });

  return out;
}

function TeamCrestHero({ teamId }: { teamId?: number }) {
  if (typeof teamId !== "number") return null;
  return (
    <View style={styles.heroCrestWrap}>
      <Image source={{ uri: API_SPORTS_TEAM_LOGO(teamId) }} style={styles.heroCrestImg} resizeMode="contain" />
    </View>
  );
}

function FlagMini({ countryCode }: { countryCode?: string }) {
  const code = safeStr(countryCode).toUpperCase();
  const url = code ? getFlagImageUrl(code, { size: 64 }) : null;
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flagMini} resizeMode="cover" />;
}

type GuideFull = {
  title: string;
  blocks: { heading?: string; text: string }[];
};

function normalizeText(v: any): string {
  const s = safeStr(v);
  return s;
}

function joinParas(v: any): string {
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => safeStr(x)).filter(Boolean).join("\n\n");
  return normalizeText(v);
}

/**
 * Pull guide content without assuming a fixed structure.
 * We create "blocks" that render nicely in a modal.
 */
function getTeamGuideFull(teamKey: string): GuideFull | null {
  const key = safeStr(teamKey);
  if (!key) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod: any = require("@/src/data/teamGuides");

    const getter =
      typeof mod.getTeamGuide === "function" ? mod.getTeamGuide : typeof mod.getGuide === "function" ? mod.getGuide : null;

    if (!getter) return null;

    const guide = getter(key);
    if (!guide) return null;

    const title =
      safeStr(guide.title) ||
      safeStr(guide.name) ||
      safeStr(guide.teamName) ||
      "Team guide";

    const blocks: { heading?: string; text: string }[] = [];

    // Common top-level fields
    const overview =
      normalizeText(guide.overview) ||
      normalizeText(guide.intro) ||
      normalizeText(guide.description) ||
      "";

    if (overview) blocks.push({ heading: "Overview", text: overview });

    // Sections array shapes (very common in your data)
    if (Array.isArray(guide.sections) && guide.sections.length) {
      for (const s of guide.sections) {
        const heading =
          safeStr(s?.title) ||
          safeStr(s?.heading) ||
          safeStr(s?.name) ||
          "";

        const text =
          normalizeText(s?.body) ||
          normalizeText(s?.content) ||
          joinParas(s?.paragraphs) ||
          normalizeText(s?.text) ||
          "";

        if (text) blocks.push({ heading: heading || undefined, text });
      }
    }

    // Fallback if nothing parsed yet
    if (!blocks.length) {
      const anyText =
        normalizeText(guide.content) ||
        normalizeText(guide.text) ||
        "";

      if (anyText) blocks.push({ heading: undefined, text: anyText });
    }

    if (!blocks.length) {
      // At least allow modal to open and say “content available”
      blocks.push({ heading: undefined, text: "Guide content is available for this team." });
    }

    return { title, blocks };
  } catch {
    return null;
  }
}

/**
 * Fixture row — NO truncations:
 * - team names can wrap
 * - meta is split across lines (kickoff / stadium / city)
 * - Plan Trip moved off the name row so it doesn't steal width
 */
function FixtureRow({ row, onPressPlan }: { row: FixtureListRow; onPressPlan: () => void }) {
  const homeName = safeStr(row?.teams?.home?.name) || "Home";
  const awayName = safeStr(row?.teams?.away?.name) || "Away";
  const homeLogo = safeStr(row?.teams?.home?.logo);
  const awayLogo = safeStr(row?.teams?.away?.logo);

  const kickoff = formatUkDateTimeMaybe(row?.fixture?.date);
  const venue = safeStr(row?.fixture?.venue?.name);
  const city = safeStr(row?.fixture?.venue?.city);

  return (
    <View style={styles.fxRow}>
      <View style={styles.matchLine}>
        <View style={styles.teamSideLeft}>
          {homeLogo ? <Image source={{ uri: homeLogo }} style={styles.smallCrestImg} resizeMode="contain" /> : null}
          <Text style={styles.teamNameLeft}>{homeName}</Text>
        </View>

        <View style={styles.vsPill}>
          <Text style={styles.vsText}>vs</Text>
        </View>

        <View style={styles.teamSideRight}>
          <Text style={styles.teamNameRight}>{awayName}</Text>
          {awayLogo ? <Image source={{ uri: awayLogo }} style={styles.smallCrestImg} resizeMode="contain" /> : null}
        </View>
      </View>

      <View style={styles.fxMetaBlock}>
        {kickoff ? <Text style={styles.fxMetaLine}>{kickoff}</Text> : null}
        {venue ? <Text style={styles.fxMetaLine}>{venue}</Text> : null}
        {city ? <Text style={styles.fxMetaLine}>{city}</Text> : null}
      </View>

      <View style={styles.fxCtaRow}>
        <Pressable
          onPress={onPressPlan}
          style={({ pressed }) => [styles.planBtn, pressed && styles.pressed]}
          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
        >
          <Text style={styles.planBtnText}>Plan Trip</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TeamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const teamKeyParam = safeStr(params.teamKey);
  const teamKey = useMemo(() => normalizeTeamKey(teamKeyParam), [teamKeyParam]);

  const from = toIsoOrEmpty(params.from);
  const to = toIsoOrEmpty(params.to);

  const team = useMemo(() => getTeam(teamKey) ?? getTeam(teamKeyParam), [teamKey, teamKeyParam]);
  const league = useMemo(() => (team ? leagueForTeam(team) : null), [team]);

  const bgUrl = useMemo(() => TEAM_BACKGROUNDS[team?.teamKey ?? teamKey] ?? "", [team, teamKey]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);

  const canShowGuide = useMemo(() => (team?.teamKey ? hasTeamGuide(team.teamKey) : false), [team]);
  const guideFull = useMemo(() => {
    if (!team?.teamKey) return null;
    if (!canShowGuide) return null;
    return getTeamGuideFull(team.teamKey);
  }, [team, canShowGuide]);

  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRows([]);

      try {
        if (!team || !league) {
          if (!cancelled) {
            setRows([]);
            setLoading(false);
          }
          return;
        }

        const res = await getFixtures({
          league: league.leagueId,
          season: league.season,
          from: from || undefined,
          to: to || undefined,
        });

        if (cancelled) return;

        const list = Array.isArray(res) ? (res as FixtureListRow[]) : [];

        // ONLY HOME FIXTURES for this team.
        const filtered = typeof team.teamId === "number" ? list.filter((r) => r?.teams?.home?.id === team.teamId) : [];

        const cleaned = filtered
          .filter((r) => r?.fixture?.id != null)
          .sort((a, b) => {
            const da = a?.fixture?.date ? new Date(a.fixture.date).getTime() : 0;
            const db = b?.fixture?.date ? new Date(b.fixture.date).getTime() : 0;
            return da - db;
          });

        setRows(cleaned);
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

  const grouped = useMemo(() => groupByMonth(rows), [rows]);

  const title = team?.name ?? (teamKeyParam ? teamKeyParam : "Team");
  const leagueLabel = league?.label ?? "";
  const countryCode = league?.countryCode ?? "";

  const browseLeagueLabel = useMemo(() => {
    const l = safeStr(leagueLabel);
    return l ? `Browse ${l} fixtures` : "Browse league fixtures";
  }, [leagueLabel]);

  const goBrowseFixtures = useCallback(() => {
    if (!league) {
      router.push("/(tabs)/fixtures" as any);
      return;
    }
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        leagueId: String(league.leagueId),
        season: String(league.season),
        from: from || undefined,
        to: to || undefined,
      },
    } as any);
  }, [router, league, from, to]);

  const goHome = useCallback(() => {
    router.push("/(tabs)/home" as any);
  }, [router]);

  const goPlanTrip = useCallback(
    (fixtureId: string) => {
      if (!fixtureId) return;
      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          fixtureId,
          leagueId: league ? String(league.leagueId) : undefined,
          season: league ? String(league.season) : undefined,
          from: from || undefined,
          to: to || undefined,
        },
      } as any);
    },
    [router, league, from, to]
  );

  const bgSource = bgUrl ? ({ uri: bgUrl } as any) : getBackground("team");

  return (
    <Background imageSource={bgSource} overlayOpacity={0.7}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* HERO */}
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>TEAM</Text>

              <View style={styles.heroTitleRow}>
                <TeamCrestHero teamId={team?.teamId} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.heroTitle} numberOfLines={2} ellipsizeMode="tail">
                    {title}
                  </Text>

                  <View style={styles.heroMetaRow}>
                    {leagueLabel ? <Text style={styles.heroMetaText}>{leagueLabel}</Text> : null}
                    {countryCode ? <FlagMini countryCode={countryCode} /> : null}
                  </View>
                </View>
              </View>

              <Text style={styles.heroRange}>{from && to ? `${ddmmyyyyFromIsoDateOnly(from)} → ${ddmmyyyyFromIsoDateOnly(to)}` : ""}</Text>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={goBrowseFixtures}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.btnGhostText}>{browseLeagueLabel}</Text>
                </Pressable>

                <Pressable
                  onPress={goHome}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.btnGhostText}>Back to Home</Text>
                </Pressable>
              </View>
            </View>
          </GlassCard>

          {/* TEAM GUIDE (MAIN PURPOSE) */}
          <GlassCard strength="default" style={styles.block} noPadding>
            <View style={styles.blockInner}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Team guide</Text>

                {canShowGuide ? (
                  <Pressable
                    onPress={() => setGuideOpen(true)}
                    style={({ pressed }) => [styles.previewPill, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                  >
                    <Text style={styles.previewPillText}>Open</Text>
                  </Pressable>
                ) : null}
              </View>

              {!canShowGuide ? (
                <Text style={styles.blockNote}>Guide coming soon for this team.</Text>
              ) : (
                <>
                  {/* Keep your existing preview vibe */}
                  {guideFull?.blocks?.[0]?.text ? (
                    <>
                      <Text style={styles.guideKicker}>Club Overview</Text>
                      <Text style={styles.guidePreviewText} numberOfLines={10} ellipsizeMode="tail">
                        {guideFull.blocks[0].text}
                      </Text>
                      <Text style={styles.guideHint}>Open the full guide for the complete breakdown.</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.blockNote}>Guide content is available for this team.</Text>
                      <Text style={styles.guideHint}>Tap “Open” to view it.</Text>
                    </>
                  )}
                </>
              )}
            </View>
          </GlassCard>

          {/* FIXTURES (HOME ONLY) */}
          <GlassCard strength="default" style={styles.block} noPadding>
            <View style={styles.blockInner}>
              <Text style={styles.blockTitle}>Home fixtures</Text>

              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!loading && error ? <EmptyState title="Fixtures Unavailable" message={error} /> : null}

              {!loading && !error && rows.length === 0 ? <EmptyState title="No Home Fixtures Found" message="Try another date window." /> : null}

              {!loading && !error && rows.length > 0 ? (
                <View style={{ gap: 14 }}>
                  {grouped.map((g) => (
                    <View key={g.key} style={{ gap: 10 }}>
                      <Text style={styles.month}>{g.title}</Text>

                      <View style={{ gap: 12 }}>
                        {g.rows.map((r, idx) => {
                          const id = r?.fixture?.id != null ? String(r.fixture.id) : "";
                          const stableKey = id ? `fx-${id}` : `fx-${g.key}-${idx}`;
                          return <FixtureRow key={stableKey} row={r} onPressPlan={() => (id ? goPlanTrip(id) : null)} />;
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </GlassCard>

          <View style={{ height: 14 }} />
        </ScrollView>

        {/* TEAM GUIDE MODAL (NO ROUTE = NO UNMATCHED ROUTE) */}
        <Modal visible={guideOpen} animationType="fade" transparent onRequestClose={() => setGuideOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setGuideOpen(false)} />
          <View style={styles.modalSheetWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{guideFull?.title || "Team guide"}</Text>
                  <Pressable onPress={() => setGuideOpen(false)} style={styles.modalClose} hitSlop={10}>
                    <Text style={styles.modalCloseText}>Done</Text>
                  </Pressable>
                </View>

                {!guideFull ? (
                  <Text style={styles.modalBodyText}>Guide content unavailable.</Text>
                ) : (
                  <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
                    {guideFull.blocks.map((b, idx) => (
                      <View key={`g-${idx}`} style={styles.guideBlock}>
                        {b.heading ? <Text style={styles.guideBlockTitle}>{b.heading}</Text> : null}
                        <Text style={styles.modalBodyText}>{b.text}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: 14 },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },

  hero: { marginTop: theme.spacing.lg, borderRadius: 26 },
  heroInner: { padding: theme.spacing.lg, gap: 10 },

  kicker: { color: "rgba(79,224,138,0.70)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.4 },

  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroTitle: { color: theme.colors.text, fontSize: 28, lineHeight: 34, fontWeight: theme.fontWeight.black },

  heroCrestWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroCrestImg: { width: 46, height: 46, opacity: 0.98 },

  heroMetaRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heroMetaText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  flagMini: { width: 20, height: 14, borderRadius: 3, opacity: 0.9 },

  heroRange: { color: theme.colors.textTertiary, fontSize: 13, fontWeight: theme.fontWeight.bold, marginTop: 2 },

  heroActions: { flexDirection: "row", gap: 10, marginTop: 6 },

  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  block: { borderRadius: 24 },
  blockInner: { padding: 14, gap: 12 },
  blockHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  blockTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  blockNote: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 18 },

  previewPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  previewPillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  guideKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.25 },
  guidePreviewText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 19 },
  guideHint: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16, opacity: 0.9 },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  month: { color: theme.colors.textTertiary, fontSize: 13, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },

  // Fixture row (no truncations)
  fxRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
  },

  matchLine: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  teamSideLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamSideRight: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },

  teamNameLeft: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
    flexWrap: "wrap",
  },
  teamNameRight: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
    flexWrap: "wrap",
  },

  vsPill: {
    flexShrink: 0,
    width: 34,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  smallCrestImg: { width: 18, height: 18, opacity: 0.95 },

  fxMetaBlock: { gap: 4 },
  fxMetaLine: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 16,
  },

  fxCtaRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center" },

  planBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  planBtnText: { color: theme.colors.text, fontSize: 12, fontWeight: theme.fontWeight.black },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  modalSheetWrap: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderRadius: 22, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, overflow: "hidden" },
  modalInner: { padding: 14, gap: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: theme.fontWeight.black },
  modalClose: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  modalCloseText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  modalScroll: { maxHeight: 520 },
  guideBlock: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(12,14,16,0.20)" : "rgba(12,14,16,0.16)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 10,
  },
  guideBlockTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  modalBodyText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 19 },
});
