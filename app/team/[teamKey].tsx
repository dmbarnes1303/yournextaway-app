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

/* -------------------------------------------------------------------------- */
/* Utils */
/* -------------------------------------------------------------------------- */

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

  for (const g of out) {
    g.rows.sort((a, b) => {
      const da = a?.fixture?.date ? new Date(a.fixture.date).getTime() : 0;
      const db = b?.fixture?.date ? new Date(b.fixture.date).getTime() : 0;
      return da - db;
    });
  }

  return out;
}

function clampText(text: string, maxChars: number) {
  const s = safeStr(text);
  if (!s) return "";
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars).trim()}…`;
}

function splitLinesToBullets(text: string) {
  const raw = safeStr(text);
  if (!raw) return { bullets: [] as string[], paragraph: "" };

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const looksBulleted =
    lines.length >= 3 &&
    lines.filter((l) => /^[-•]/.test(l) || /^\d+[.)]\s/.test(l)).length >= Math.ceil(lines.length * 0.6);

  if (!looksBulleted) return { bullets: [] as string[], paragraph: raw };

  const bullets = lines
    .map((l) => l.replace(/^[-•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  return { bullets, paragraph: "" };
}

/* -------------------------------------------------------------------------- */
/* Flags */
/* -------------------------------------------------------------------------- */

// Tiny pragmatic fallback: if you only have a country *name* we map it.
// Add to this as you notice missing flags in your content.
const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  england: "GB",
  "united kingdom": "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  germany: "DE",
  spain: "ES",
  france: "FR",
  italy: "IT",
  netherlands: "NL",
  portugal: "PT",
  belgium: "BE",
  austria: "AT",
  switzerland: "CH",
  poland: "PL",
  "czech republic": "CZ",
  czechia: "CZ",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  finland: "FI",
  ireland: "IE",
  turkey: "TR",
  greece: "GR",
  croatia: "HR",
  serbia: "RS",
  romania: "RO",
  bulgaria: "BG",
  ukraine: "UA",
  russia: "RU",
};

function normalizeCountryNameToIso2(name: string) {
  const k = safeStr(name).toLowerCase();
  return k ? COUNTRY_NAME_TO_ISO2[k] : "";
}

function FlagMini({ countryCode }: { countryCode?: string }) {
  const code = safeStr(countryCode).toUpperCase();
  const url = code ? getFlagImageUrl(code, { size: 64 }) : null;
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flagMini} resizeMode="cover" />;
}

/* -------------------------------------------------------------------------- */
/* Small UI */
/* -------------------------------------------------------------------------- */

function TeamCrestHero({ teamId }: { teamId?: number }) {
  if (typeof teamId !== "number") return null;
  return (
    <View style={styles.heroCrestWrap}>
      <Image source={{ uri: API_SPORTS_TEAM_LOGO(teamId) }} style={styles.heroCrestImg} resizeMode="contain" />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Guide loader (safe) */
/* -------------------------------------------------------------------------- */

type GuideBlock = { heading?: string; text: string };
type GuideFull = { title: string; blocks: GuideBlock[] };

function normalizeText(v: any): string {
  return safeStr(v);
}

function joinParas(v: any): string {
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => safeStr(x)).filter(Boolean).join("\n\n");
  return normalizeText(v);
}

/**
 * Pull guide content without assuming a fixed structure.
 * We create "blocks" that render nicely in a full-screen modal (same behavior as City guide).
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

    const title = safeStr(guide.title) || safeStr(guide.name) || safeStr(guide.teamName) || "Team guide";
    const blocks: GuideBlock[] = [];

    const overview =
      normalizeText(guide.overview) ||
      normalizeText(guide.intro) ||
      normalizeText(guide.description) ||
      "";

    if (overview) blocks.push({ heading: "Overview", text: overview });

    if (Array.isArray(guide.sections) && guide.sections.length) {
      for (const s of guide.sections) {
        const heading = safeStr(s?.title) || safeStr(s?.heading) || safeStr(s?.name) || "";
        const text =
          normalizeText(s?.body) ||
          normalizeText(s?.content) ||
          joinParas(s?.paragraphs) ||
          normalizeText(s?.text) ||
          "";

        if (text) blocks.push({ heading: heading || undefined, text });
      }
    }

    if (!blocks.length) {
      const anyText = normalizeText(guide.content) || normalizeText(guide.text) || "";
      if (anyText) blocks.push({ heading: undefined, text: anyText });
    }

    if (!blocks.length) blocks.push({ heading: undefined, text: "Guide content is available for this team." });

    return { title, blocks };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Guide Modal (same UX as City guide) */
/* -------------------------------------------------------------------------- */

function GuideAccordionSection({
  heading,
  text,
  expanded,
  onToggle,
}: {
  heading?: string;
  text: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const h = safeStr(heading) || "Guide";
  const { bullets, paragraph } = splitLinesToBullets(text);

  const paragraphPreview = paragraph ? clampText(paragraph, 260) : "";
  const showInlinePreview = !expanded && !!paragraphPreview;

  return (
    <GlassCard strength="default" style={styles.guideSecCard} noPadding>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={expanded ? `Collapse ${h}` : `Expand ${h}`}
        style={({ pressed }) => [styles.guideSecHeader, pressed && styles.pressed]}
        android_ripple={{ color: "rgba(255,255,255,0.06)" }}
      >
        <Text style={styles.guideSecHeading}>{h}</Text>
        <Text style={styles.guideSecChevron}>{expanded ? "˄" : "˅"}</Text>
      </Pressable>

      {showInlinePreview ? (
        <View style={styles.guideSecBody}>
          <Text style={styles.guideText}>{paragraphPreview}</Text>
        </View>
      ) : null}

      {expanded ? (
        <View style={styles.guideSecBody}>
          {paragraph ? <Text style={styles.guideText}>{paragraph}</Text> : null}

          {bullets.length ? (
            <View style={styles.bulletList}>
              {bullets.map((b, idx) => (
                <View key={`gb-${h}-${idx}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

function GuideModal({
  visible,
  onClose,
  title,
  blocks,
  backgroundSource,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  blocks: GuideBlock[];
  backgroundSource: any;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!visible) return;
    setExpanded({});
  }, [visible]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <Background imageSource={backgroundSource} overlayOpacity={0.78}>
        <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
          <View style={styles.modalTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.modalKicker}>TEAM GUIDE</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close guide"
              style={({ pressed }) => [styles.closePill, pressed && styles.pressed]}
              android_ripple={{ color: "rgba(255,255,255,0.08)" }}
            >
              <Text style={styles.closePillText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {!blocks.length ? (
              <GlassCard strength="default" style={styles.block} noPadding>
                <View style={styles.blockInner}>
                  <Text style={styles.blockNote}>Guide content unavailable for this team yet.</Text>
                </View>
              </GlassCard>
            ) : (
              <View style={{ gap: 12 }}>
                {blocks.map((b, idx) => {
                  const key = `${safeStr(b.heading) || "Guide"}-${idx}`;
                  return (
                    <GuideAccordionSection
                      key={`gsec-${key}`}
                      heading={b.heading}
                      text={b.text}
                      expanded={!!expanded[key]}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </View>
            )}

            <View style={{ height: 18 }} />
          </ScrollView>
        </SafeAreaView>
      </Background>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Fixture Row */
/* -------------------------------------------------------------------------- */

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
          accessibilityRole="button"
          accessibilityLabel="Plan trip"
          style={({ pressed }) => [styles.planBtn, pressed && styles.pressed]}
          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
        >
          <Text style={styles.planBtnText}>Plan Trip</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

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
  const [guideOpen, setGuideOpen] = useState(false);

  const canShowGuide = useMemo(() => (team?.teamKey ? hasTeamGuide(team.teamKey) : false), [team]);

  const guideFull = useMemo(() => {
    if (!team?.teamKey) return null;
    if (!canShowGuide) return null;
    return getTeamGuideFull(team.teamKey);
  }, [team, canShowGuide]);

  // Compute a best-effort country code that can actually render a flag.
  // Priority: league.countryCode -> team.countryCode -> league.countryName -> team.countryName
  const countryCode = useMemo(() => {
    const leagueCode = safeStr((league as any)?.countryCode);
    if (leagueCode) return leagueCode;

    const teamCode = safeStr((team as any)?.countryCode);
    if (teamCode) return teamCode;

    const leagueCountryName = safeStr((league as any)?.country);
    const teamCountryName = safeStr((team as any)?.country);

    const mapped = normalizeCountryNameToIso2(leagueCountryName || teamCountryName);
    return mapped || "";
  }, [league, team]);

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
  const leagueLabel = safeStr(league?.label);

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

  // Guide preview mirrors the City screen vibe (first section text, clamped)
  const guideBlocks = guideFull?.blocks ?? [];
  const overview = guideBlocks.find((b) => safeStr(b.heading).toLowerCase() === "overview")?.text || guideBlocks[0]?.text || "";
  const guidePreview = guideFull ? clampText(overview, 220) : "";
  const guideStats = useMemo(() => {
    if (!guideFull) return "";
    const sections = guideBlocks.length;
    const hasTop = guideBlocks.some((b) => safeStr(b.heading).toLowerCase().includes("top"));
    const hasHistory = guideBlocks.some((b) => safeStr(b.heading).toLowerCase().includes("history"));
    const parts = [sections ? `${sections} sections` : "", hasTop ? "key notes" : "", hasHistory ? "history" : ""].filter(Boolean);
    return parts.join(" • ");
  }, [guideFull, guideBlocks]);

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
                  {/* Team name + FLAG (flag is visually next to team name) */}
                  <View style={styles.heroNameRow}>
                    <Text style={styles.heroTitle} numberOfLines={2} ellipsizeMode="tail">
                      {title}
                    </Text>
                    {/* Always attempt to show a flag beside team name */}
                    {countryCode ? <FlagMini countryCode={countryCode} /> : null}
                  </View>

                  <View style={styles.heroMetaRow}>
                    {leagueLabel ? <Text style={styles.heroMetaText}>{leagueLabel}</Text> : null}
                  </View>
                </View>
              </View>

              <Text style={styles.heroRange}>
                {from && to ? `${ddmmyyyyFromIsoDateOnly(from)} → ${ddmmyyyyFromIsoDateOnly(to)}` : ""}
              </Text>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={goBrowseFixtures}
                  accessibilityRole="button"
                  accessibilityLabel={browseLeagueLabel}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.btnGhostText}>{browseLeagueLabel}</Text>
                </Pressable>

                <Pressable
                  onPress={goHome}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Home"
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.btnGhostText}>Back to Home</Text>
                </Pressable>
              </View>
            </View>
          </GlassCard>

          {/* TEAM GUIDE */}
          <GlassCard strength="default" style={styles.block} noPadding>
            <View style={styles.blockInner}>
              <View style={styles.guideTopRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.blockTitle}>Team guide</Text>
                  <Text style={styles.guideSub} numberOfLines={1}>
                    {guideFull ? guideStats || "Practical, trip-planning notes." : "Guide content unavailable for this team yet."}
                  </Text>
                </View>

                {guideFull ? (
                  <Pressable
                    onPress={() => setGuideOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open team guide"
                    style={({ pressed }) => [styles.miniPrimaryPill, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={styles.miniPrimaryPillText}>Open guide</Text>
                  </Pressable>
                ) : null}
              </View>

              {guideFull && guidePreview ? (
                <Text style={styles.blockNote}>{guidePreview}</Text>
              ) : !guideFull ? (
                <Text style={styles.blockNote}>We’ll add this team soon. For now, use the fixtures below to anchor your trip.</Text>
              ) : null}
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

              {!loading && !error && rows.length === 0 ? (
                <EmptyState title="No Home Fixtures Found" message="Try another date window." />
              ) : null}

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

        {/* TEAM GUIDE MODAL (same open UX as City guide) */}
        <GuideModal
          visible={guideOpen}
          onClose={() => setGuideOpen(false)}
          title={guideFull?.title || title}
          blocks={guideBlocks}
          backgroundSource={bgSource}
        />
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: 14 },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },

  hero: { marginTop: theme.spacing.lg, borderRadius: 26 },
  heroInner: { padding: theme.spacing.lg, gap: 10 },

  kicker: { color: "rgba(79,224,138,0.70)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.4 },

  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },

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

  // Team name row with flag visually next to the title
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "nowrap" },
  heroTitle: { flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 28, lineHeight: 34, fontWeight: theme.fontWeight.black },

  heroMetaRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heroMetaText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },

  // Flag mini (works for team + any other spots)
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
  blockInner: { padding: 14, gap: 10 },
  blockTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  blockNote: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 19 },

  guideTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  guideSub: { marginTop: 4, color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  miniPrimaryPill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  miniPrimaryPillText: { color: theme.colors.text, fontSize: 12, fontWeight: theme.fontWeight.black },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  month: { color: theme.colors.textTertiary, fontSize: 13, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },

  // Fixture row
  fxRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  matchLine: { width: "100%", flexDirection: "row", alignItems: "center", gap: 10 },

  teamSideLeft: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  teamSideRight: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },

  teamNameLeft: { flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black, flexWrap: "wrap" },
  teamNameRight: { flex: 1, minWidth: 0, textAlign: "right", color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black, flexWrap: "wrap" },

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
  fxMetaLine: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16 },

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

  // Guide modal styles (mirrors City screen)
  modalSafe: { flex: 1, paddingHorizontal: theme.spacing.lg },
  modalTop: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing.md, flexDirection: "row", alignItems: "center", gap: 12 },
  modalKicker: { color: "rgba(79,224,138,0.70)", fontSize: 11, fontWeight: theme.fontWeight.black, letterSpacing: 0.5 },
  modalTitle: { marginTop: 4, color: theme.colors.text, fontSize: 20, fontWeight: theme.fontWeight.black },
  closePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 86,
    alignItems: "center",
    overflow: "hidden",
  },
  closePillText: { color: "rgba(255,255,255,0.78)", fontWeight: theme.fontWeight.black, fontSize: 12, letterSpacing: 0.2 },
  modalContent: { paddingBottom: theme.spacing.xxl, gap: 12 },

  guideSecCard: { borderRadius: 22 },
  guideSecHeader: { paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  guideSecHeading: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  guideSecChevron: { color: theme.colors.textSecondary, fontSize: 18, fontWeight: "900", marginTop: -2 },
  guideSecBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },

  guideText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 19 },

  bulletList: { gap: 10, paddingTop: 2 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { width: 6, height: 6, borderRadius: 999, marginTop: 7, backgroundColor: "rgba(79,224,138,0.65)" },
  bulletText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 19 },
});
