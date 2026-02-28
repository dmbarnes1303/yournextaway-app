// app/city/key/[cityKey].tsx
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
import { LEAGUES, getRollingWindowIso } from "@/src/constants/football";
import type { CityGuide, CityTopThing } from "@/src/data/cityGuides/types";

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function toIsoOrEmpty(v: any) {
  return safeStr(v);
}

function cityKeyToTitle(cityKey: string) {
  const key = safeStr(cityKey);
  if (!key) return "City";
  return key
    .split("-")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
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

  // Sort groups by first fixture date
  out.sort((a, b) => {
    const da = a.rows[0]?.fixture?.date ? new Date(a.rows[0].fixture.date).getTime() : 0;
    const db = b.rows[0]?.fixture?.date ? new Date(b.rows[0].fixture.date).getTime() : 0;
    return da - db;
  });

  // Sort fixtures within each group
  for (const g of out) {
    g.rows.sort((a, b) => {
      const da = a?.fixture?.date ? new Date(a.fixture.date).getTime() : 0;
      const db = b?.fixture?.date ? new Date(b.fixture.date).getTime() : 0;
      return da - db;
    });
  }

  return out;
}

function FlagMini({ countryCode }: { countryCode?: string }) {
  const code = safeStr(countryCode).toUpperCase();
  const url = code ? getFlagImageUrl(code, { size: 64 }) : null;
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flagMini} resizeMode="cover" />;
}

type CityData = {
  cityKey: string;
  name: string;
  countryCode?: string;
  countryName?: string;
  heroSubtitle?: string;
  venueIds?: number[];
};

type GuideBlock = { heading?: string; text: string };
type GuideFull = { title: string; blocks: GuideBlock[] };

function normalizeText(v: any): string {
  return safeStr(v);
}

function joinBullets(items: string[] | undefined, max = 16) {
  const list = Array.isArray(items) ? items.map((x) => safeStr(x)).filter(Boolean) : [];
  if (!list.length) return "";
  return list.slice(0, max).map((x) => `- ${x}`).join("\n");
}

function joinTopThings(items: CityTopThing[] | undefined, max = 10) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return "";
  return list
    .slice(0, max)
    .map((x) => {
      const t = safeStr(x?.title);
      const tip = safeStr(x?.tip);
      if (t && tip) return `- ${t}: ${tip}`;
      if (t) return `- ${t}`;
      if (tip) return `- ${tip}`;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Runtime city metadata (safe, never crashes)
 */
function getCityData(cityKey: string): CityData | null {
  const key = safeStr(cityKey);
  if (!key) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const citiesMod: any = require("@/src/data/cities");
    const getter =
      typeof citiesMod.getCity === "function"
        ? citiesMod.getCity
        : typeof citiesMod.getCityByKey === "function"
          ? citiesMod.getCityByKey
          : null;

    if (getter) {
      const c = getter(key);
      if (c) {
        return {
          cityKey: safeStr(c.slug) || safeStr(c.cityKey) || key,
          name: safeStr(c.name) || safeStr(c.title) || cityKeyToTitle(key),
          countryCode: safeStr(c.countryCode),
          countryName: safeStr(c.country) || safeStr(c.countryName),
          heroSubtitle: safeStr(c.subtitle) || safeStr(c.tagline),
          venueIds: Array.isArray(c.venueIds) ? c.venueIds : undefined,
        };
      }
    }
  } catch {
    // ignore
  }

  return { cityKey: key, name: cityKeyToTitle(key) };
}

/**
 * Runtime guide loader (safe, never crashes)
 * Converts CityGuide fields into section blocks so the City page has real depth.
 */
function getCityGuideFull(cityKey: string): GuideFull | null {
  const key = safeStr(cityKey);
  if (!key) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod: any = require("@/src/data/cityGuides");
    const getter = typeof mod.getCityGuide === "function" ? mod.getCityGuide : null;
    if (!getter) return null;

    const guide = getter(key) as CityGuide | null;
    if (!guide) return null;

    const title = safeStr(guide.name) || safeStr(guide.cityId) || "City guide";
    const blocks: GuideBlock[] = [];

    const overview = normalizeText(guide.overview);
    if (overview) blocks.push({ heading: "Overview", text: overview });

    const topThingsText = joinTopThings(guide.topThings, 10);
    if (topThingsText) blocks.push({ heading: "Top things to do", text: topThingsText });

    const tipsText = joinBullets(guide.tips, 14);
    if (tipsText) blocks.push({ heading: "Quick tips", text: tipsText });

    const foodText = joinBullets(guide.food, 14);
    if (foodText) blocks.push({ heading: "Food & drink", text: foodText });

    const transport = normalizeText(guide.transport);
    if (transport) blocks.push({ heading: "Getting around", text: transport });

    const stay = normalizeText(guide.accommodation);
    if (stay) blocks.push({ heading: "Where to stay", text: stay });

    if (!blocks.length) {
      return { title, blocks: [{ heading: undefined, text: "Guide content is available for this city." }] };
    }

    return { title, blocks };
  } catch {
    return null;
  }
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

function GuideSectionCard({
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

  const previewChars = 260;
  const preview =
    paragraph && paragraph.length > previewChars && !expanded ? `${paragraph.slice(0, previewChars).trim()}…` : paragraph;

  const showToggle =
    (paragraph && paragraph.length > previewChars) || (bullets && bullets.length > 6); // heuristic

  return (
    <GlassCard strength="default" style={styles.sectionCard} noPadding>
      <View style={styles.sectionCardInner}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionHeading}>{h}</Text>

          {showToggle ? (
            <Pressable
              onPress={onToggle}
              accessibilityRole="button"
              accessibilityLabel={expanded ? "Collapse section" : "Expand section"}
              style={({ pressed }) => [styles.miniPill, pressed && styles.pressed]}
              android_ripple={{ color: "rgba(255,255,255,0.06)" }}
            >
              <Text style={styles.miniPillText}>{expanded ? "Collapse" : "Expand"}</Text>
            </Pressable>
          ) : null}
        </View>

        {preview ? <Text style={styles.sectionText}>{preview}</Text> : null}

        {bullets.length ? (
          <View style={styles.bulletList}>
            {(expanded ? bullets : bullets.slice(0, 6)).map((b, idx) => (
              <View key={`b-${h}-${idx}`} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
            {!expanded && bullets.length > 6 ? (
              <Text style={styles.moreHint}>+ {bullets.length - 6} more</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

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
          <Text style={styles.teamNameLeft} numberOfLines={2}>
            {homeName}
          </Text>
        </View>

        <View style={styles.vsPill}>
          <Text style={styles.vsText}>vs</Text>
        </View>

        <View style={styles.teamSideRight}>
          <Text style={styles.teamNameRight} numberOfLines={2}>
            {awayName}
          </Text>
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

export default function CityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const cityKey = safeStr(params.cityKey);

  const fromParam = toIsoOrEmpty(params.from);
  const toParam = toIsoOrEmpty(params.to);

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const from = fromParam || rolling.from;
  const to = toParam || rolling.to;

  const city = useMemo(() => getCityData(cityKey), [cityKey]);
  const guideFull = useMemo(() => getCityGuideFull(cityKey), [cityKey]);

  const [loadingFx, setLoadingFx] = useState(true);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  // Guide expansion state
  const [showAllGuide, setShowAllGuide] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingFx(true);
      setFxError(null);
      setFxRows([]);

      try {
        const cityName = safeStr(city?.name);
        const venueIds = Array.isArray(city?.venueIds) ? city!.venueIds! : [];

        const settled = await Promise.allSettled(
          (LEAGUES ?? []).map((l) =>
            getFixtures({
              league: l.leagueId,
              season: l.season,
              from,
              to,
            })
          )
        );

        if (cancelled) return;

        const all: FixtureListRow[] = [];
        for (const s of settled) {
          if (s.status !== "fulfilled") continue;
          const list = Array.isArray(s.value) ? (s.value as FixtureListRow[]) : [];
          all.push(...list);
        }

        const cityLower = cityName.toLowerCase();

        const filtered = all.filter((r) => {
          const vCity = safeStr(r?.fixture?.venue?.city).toLowerCase();
          const vId = r?.fixture?.venue?.id;

          const byCityName = cityLower && vCity && vCity === cityLower;
          const byVenueId = typeof vId === "number" && venueIds.includes(vId);

          return byCityName || byVenueId;
        });

        const dedup = new Map<string, FixtureListRow>();
        for (const r of filtered) {
          const id = r?.fixture?.id != null ? String(r.fixture.id) : "";
          if (!id) continue;
          if (!dedup.has(id)) dedup.set(id, r);
        }

        const cleaned = Array.from(dedup.values()).sort((a, b) => {
          const da = a?.fixture?.date ? new Date(a.fixture.date).getTime() : 0;
          const db = b?.fixture?.date ? new Date(b.fixture.date).getTime() : 0;
          return da - db;
        });

        setFxRows(cleaned);
      } catch (e: any) {
        if (cancelled) return;
        setFxError(e?.message ?? "Failed to load city fixtures.");
      } finally {
        if (!cancelled) setLoadingFx(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [city?.name, city?.venueIds, from, to]);

  const grouped = useMemo(() => groupByMonth(fxRows), [fxRows]);

  const title = city?.name || cityKeyToTitle(cityKey);
  const countryCode = safeStr(city?.countryCode);
  const countryName = safeStr(city?.countryName);

  const goHome = useCallback(() => {
    router.push("/(tabs)/home" as any);
  }, [router]);

  const goPlanTrip = useCallback(
    (row: FixtureListRow) => {
      const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : "";
      if (!fixtureId) return;

      const leagueId = row?.league?.id != null ? String(row.league.id) : undefined;
      const season = row?.league?.season != null ? String(row.league.season) : undefined;

      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          fixtureId,
          from,
          to,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
        },
      } as any);
    },
    [router, from, to]
  );

  const bgSource = getBackground("city");

  const guideBlocks = guideFull?.blocks ?? [];
  const previewCount = 2;
  const visibleBlocks = showAllGuide ? guideBlocks : guideBlocks.slice(0, previewCount);

  return (
    <Background imageSource={bgSource} overlayOpacity={0.7}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* HERO */}
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>CITY GUIDE</Text>

              <View style={styles.heroTitleRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.heroTitle} numberOfLines={2} ellipsizeMode="tail">
                    {title}
                  </Text>

                  <View style={styles.heroMetaRow}>
                    {countryCode ? <FlagMini countryCode={countryCode} /> : null}
                    {countryName ? <Text style={styles.heroMetaText}>{countryName}</Text> : null}
                  </View>
                </View>
              </View>

              {safeStr(city?.heroSubtitle) ? (
                <Text style={styles.heroSubtitle} numberOfLines={3} ellipsizeMode="tail">
                  {safeStr(city?.heroSubtitle)}
                </Text>
              ) : null}

              <Text style={styles.heroRange}>
                {from && to ? `${ddmmyyyyFromIsoDateOnly(from)} → ${ddmmyyyyFromIsoDateOnly(to)}` : ""}
              </Text>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={goHome}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Home"
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.btnGhostText}>Back</Text>
                </Pressable>
              </View>
            </View>
          </GlassCard>

          {/* GUIDE */}
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Guide</Text>

              {guideBlocks.length > previewCount ? (
                <Pressable
                  onPress={() => setShowAllGuide((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showAllGuide ? "Collapse guide" : "Show full guide"}
                  style={({ pressed }) => [styles.miniPill, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                >
                  <Text style={styles.miniPillText}>{showAllGuide ? "Collapse" : "Show all"}</Text>
                </Pressable>
              ) : null}
            </View>

            {!guideFull ? (
              <GlassCard strength="default" style={styles.block} noPadding>
                <View style={styles.blockInner}>
                  <Text style={styles.blockNote}>Guide content unavailable for this city yet.</Text>
                </View>
              </GlassCard>
            ) : (
              <View style={{ gap: 12 }}>
                {visibleBlocks.map((b, idx) => {
                  const key = `${safeStr(b.heading) || "Guide"}-${idx}`;
                  const isExpanded = !!expandedSections[key] || showAllGuide; // if showing all, treat as expanded
                  return (
                    <GuideSectionCard
                      key={`sec-${key}`}
                      heading={b.heading}
                      text={b.text}
                      expanded={isExpanded}
                      onToggle={() => toggleSection(key)}
                    />
                  );
                })}

                {!showAllGuide && guideBlocks.length > previewCount ? (
                  <GlassCard strength="default" style={styles.block} noPadding>
                    <View style={styles.blockInner}>
                      <Text style={styles.blockNote}>
                        More sections available ({guideBlocks.length - previewCount}). Tap “Show all” to expand the full guide.
                      </Text>
                    </View>
                  </GlassCard>
                ) : null}
              </View>
            )}
          </View>

          {/* CITY FIXTURES */}
          <GlassCard strength="default" style={styles.block} noPadding>
            <View style={styles.blockInner}>
              <Text style={styles.blockTitle}>Fixtures in {title}</Text>

              {loadingFx ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!loadingFx && fxError ? <EmptyState title="Fixtures Unavailable" message={fxError} /> : null}

              {!loadingFx && !fxError && fxRows.length === 0 ? (
                <EmptyState title="No City Fixtures Found" message="Try another date window." />
              ) : null}

              {!loadingFx && !fxError && fxRows.length > 0 ? (
                <View style={{ gap: 14 }}>
                  {grouped.map((g) => (
                    <View key={g.key} style={{ gap: 10 }}>
                      <Text style={styles.month}>{g.title}</Text>

                      <View style={{ gap: 12 }}>
                        {g.rows.map((r, idx) => {
                          const id = r?.fixture?.id != null ? String(r.fixture.id) : "";
                          const stableKey = id ? `fx-${id}` : `fx-${g.key}-${idx}`;
                          return <FixtureRow key={stableKey} row={r} onPressPlan={() => goPlanTrip(r)} />;
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

  heroMetaRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heroMetaText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  flagMini: { width: 20, height: 14, borderRadius: 3, opacity: 0.9 },

  heroSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
    opacity: 0.95,
  },

  heroRange: { color: theme.colors.textTertiary, fontSize: 13, fontWeight: theme.fontWeight.bold, marginTop: 2 },

  heroActions: { flexDirection: "row", gap: 10, marginTop: 6 },

  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },

  miniPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  miniPillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  block: { borderRadius: 24 },
  blockInner: { padding: 14, gap: 12 },
  blockTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  blockNote: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 18 },

  sectionCard: { borderRadius: 24 },
  sectionCardInner: { padding: 14, gap: 10 },
  sectionCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

  sectionHeading: { color: theme.colors.text, fontSize: 16, fontWeight: theme.fontWeight.black },
  sectionText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 19 },

  moreHint: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, marginTop: 2 },

  bulletList: { gap: 10, paddingTop: 2 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { width: 6, height: 6, borderRadius: 999, marginTop: 7, backgroundColor: "rgba(79,224,138,0.65)" },
  bulletText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 19 },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  month: { color: theme.colors.textTertiary, fontSize: 13, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },

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

  teamNameLeft: { flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  teamNameRight: { flex: 1, minWidth: 0, textAlign: "right", color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },

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
});
