// app/city/key/[cityKey].tsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Platform, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { theme } from "@/src/constants/theme";
import { getCityBackground } from "@/src/constants/backgrounds";
import { getFlagImageUrl } from "@/src/utils/flagImages";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { LEAGUES, getRollingWindowIso } from "@/src/constants/football";
import type { CityGuide, CityTopThing } from "@/src/data/cityGuides/types";
import { getCityByKeyLive, type CityRecord } from "@/src/services/citiesRegistry";
import { normalizeCityKey } from "@/src/utils/city";

/* -------------------------------------------------------------------------- */
/* Utils */
/* -------------------------------------------------------------------------- */

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
/* Country → ISO2 resolver (NEW — guarantees flags) */
/* -------------------------------------------------------------------------- */

function countryToIso2(code?: string, name?: string): string | null {
  const c = safeStr(code).toUpperCase();
  if (c.length === 2) return c;

  const n = safeStr(name).toLowerCase();

  const map: Record<string, string> = {
    france: "FR",
    spain: "ES",
    germany: "DE",
    italy: "IT",
    portugal: "PT",
    england: "GB",
    scotland: "GB",
    wales: "GB",
    netherlands: "NL",
    belgium: "BE",
    austria: "AT",
    switzerland: "CH",
    turkey: "TR",
    greece: "GR",
    poland: "PL",
    czechia: "CZ",
    czech: "CZ",
    denmark: "DK",
    sweden: "SE",
    norway: "NO",
    finland: "FI",
    ireland: "IE",
    hungary: "HU",
    romania: "RO",
    croatia: "HR",
    serbia: "RS",
    slovakia: "SK",
    slovenia: "SI",
    bulgaria: "BG",
  };

  return map[n] || null;
}

/* -------------------------------------------------------------------------- */
/* Small UI */
/* -------------------------------------------------------------------------- */

function FlagMini({ countryCode, countryName }: { countryCode?: string; countryName?: string }) {
  const iso2 = countryToIso2(countryCode, countryName);
  if (!iso2) return null;

  const url = getFlagImageUrl(iso2, { size: 64 });
  if (!url) return null;

  return <Image source={{ uri: url }} style={styles.flagMini} resizeMode="cover" />;
}

/* -------------------------------------------------------------------------- */
/* Guide loader */
/* -------------------------------------------------------------------------- */

type GuideBlock = { heading?: string; text: string };
type GuideFull = { title: string; blocks: GuideBlock[] };

function normalizeText(v: any): string {
  return safeStr(v);
}

function getCityGuideFull(cityKey: string): GuideFull | null {
  const key = safeStr(cityKey);
  if (!key) return null;

  try {
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

    if (!blocks.length) return { title, blocks: [{ heading: undefined, text: "Guide content is available for this city." }] };

    return { title, blocks };
  } catch {
    return null;
  }
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
        <Pressable onPress={onPressPlan} style={styles.planBtn}>
          <Text style={styles.planBtnText}>Plan Trip</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function CityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const cityKeyParam = safeStr(params.cityKey);
  const citySlug = useMemo(() => normalizeCityKey(cityKeyParam), [cityKeyParam]);

  const fromParam = toIsoOrEmpty(params.from);
  const toParam = toIsoOrEmpty(params.to);

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const from = fromParam || rolling.from;
  const to = toParam || rolling.to;

  const [cityLive, setCityLive] = useState<CityRecord | null>(null);
  const [cityLiveLoading, setCityLiveLoading] = useState(true);

  const guideFull = useMemo(() => getCityGuideFull(citySlug), [citySlug]);

  const [loadingFx, setLoadingFx] = useState(true);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCity() {
      setCityLiveLoading(true);
      try {
        const c = await getCityByKeyLive(citySlug, LEAGUES);
        if (!cancelled) setCityLive(c);
      } finally {
        if (!cancelled) setCityLiveLoading(false);
      }
    }

    if (citySlug) loadCity();
    else setCityLiveLoading(false);

    return () => {
      cancelled = true;
    };
  }, [citySlug]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingFx(true);
      setFxError(null);
      setFxRows([]);

      try {
        const venueIds = Array.isArray(cityLive?.venueIds) ? cityLive!.venueIds : [];
        const targetSlug = cityLive?.slug || citySlug;

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
          if (s.status === "fulfilled" && Array.isArray(s.value)) {
            all.push(...(s.value as FixtureListRow[]));
          }
        }

        const filtered = all.filter((r) => {
          const vCity = safeStr(r?.fixture?.venue?.city);
          const vSlug = vCity ? normalizeCityKey(vCity) : "";
          const vId = r?.fixture?.venue?.id;

          return vSlug === targetSlug || (typeof vId === "number" && venueIds.includes(vId));
        });

        const dedup = new Map<string, FixtureListRow>();
        for (const r of filtered) {
          const id = r?.fixture?.id != null ? String(r.fixture.id) : "";
          if (id && !dedup.has(id)) dedup.set(id, r);
        }

        const cleaned = Array.from(dedup.values()).sort((a, b) => {
          const da = a?.fixture?.date ? new Date(a.fixture.date).getTime() : 0;
          const db = b?.fixture?.date ? new Date(b.fixture.date).getTime() : 0;
          return da - db;
        });

        setFxRows(cleaned);
      } catch (e: any) {
        if (!cancelled) setFxError(e?.message ?? "Failed to load city fixtures.");
      } finally {
        if (!cancelled) setLoadingFx(false);
      }
    }

    if (citySlug) run();
    else setLoadingFx(false);

    return () => {
      cancelled = true;
    };
  }, [citySlug, cityLive?.slug, cityLive?.venueIds, from, to]);

  const grouped = useMemo(() => groupByMonth(fxRows), [fxRows]);

  const title = cityLive?.name || cityKeyToTitle(citySlug || cityKeyParam);
  const countryCode = safeStr(cityLive?.countryCode);
  const countryName = safeStr(cityLive?.country);

  const goHome = useCallback(() => {
    router.push("/(tabs)/home" as any);
  }, [router]);

  const goPlanTrip = useCallback(
    (row: FixtureListRow) => {
      const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : "";
      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: { fixtureId, from, to },
      } as any);
    },
    [router, from, to]
  );

  const bg = getCityBackground(citySlug || cityKeyParam);
  const bgSource = typeof bg === "string" ? { uri: bg } : bg;

  return (
    <Background imageSource={bgSource} overlayOpacity={0.7}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>CITY GUIDE</Text>

              <View style={styles.heroTitleRow}>
                <FlagMini countryCode={countryCode} countryName={countryName} />
                <Text style={styles.heroTitle}>{title}</Text>
              </View>

              <View style={styles.heroMetaRow}>
                {countryName ? <Text style={styles.heroMetaText}>{countryName}</Text> : null}
                {cityLiveLoading ? <Text style={styles.heroMetaText}>• Loading city…</Text> : null}
              </View>

              <Text style={styles.heroRange}>
                {from && to ? `${ddmmyyyyFromIsoDateOnly(from)} → ${ddmmyyyyFromIsoDateOnly(to)}` : ""}
              </Text>

              <View style={styles.heroActions}>
                <Pressable onPress={goHome} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Back</Text>
                </Pressable>
              </View>
            </View>
          </GlassCard>

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
                      {g.rows.map((r, idx) => {
                        const id = r?.fixture?.id != null ? String(r.fixture.id) : `${idx}`;
                        return <FixtureRow key={id} row={r} onPressPlan={() => goPlanTrip(r)} />;
                      })}
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

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: 14 },

  hero: { marginTop: theme.spacing.lg, borderRadius: 26 },
  heroInner: { padding: theme.spacing.lg, gap: 10 },

  kicker: { color: "rgba(79,224,138,0.70)", fontSize: 12, fontWeight: theme.fontWeight.black },

  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroTitle: { color: theme.colors.text, fontSize: 28, fontWeight: theme.fontWeight.black },

  heroMetaRow: { flexDirection: "row", gap: 10 },
  heroMetaText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },

  flagMini: { width: 20, height: 14, borderRadius: 3 },

  heroRange: { color: theme.colors.textTertiary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  heroActions: { flexDirection: "row", gap: 10 },

  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1 },
  btnGhost: { borderColor: "rgba(255,255,255,0.10)" },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  block: { borderRadius: 24 },
  blockInner: { padding: 14, gap: 10 },
  blockTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  month: { color: theme.colors.textTertiary, fontSize: 13, fontWeight: theme.fontWeight.black },

  fxRow: { borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 12, gap: 12 },

  matchLine: { flexDirection: "row", alignItems: "center", gap: 10 },

  teamSideLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  teamSideRight: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 8 },

  teamNameLeft: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  teamNameRight: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },

  vsPill: { width: 34, height: 26, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center" },
  vsText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  smallCrestImg: { width: 18, height: 18 },

  fxMetaBlock: { gap: 4 },
  fxMetaLine: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  fxCtaRow: { flexDirection: "row", justifyContent: "flex-end" },
  planBtn: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(79,224,138,0.26)" },
  planBtnText: { color: theme.colors.text, fontSize: 12, fontWeight: theme.fontWeight.black },
});
