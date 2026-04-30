// app/city/key/[cityKey].tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  RefreshControl,
} from "react-native";
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
import {
  LEAGUES,
  getRollingWindowIso,
  type LeagueOption,
} from "@/src/constants/football";
import type { CityGuide, CityTopThing } from "@/src/data/cityGuides/types";
import { getCityGuide } from "@/src/data/cityGuides";
import { getCityByKeyLive, type CityRecord } from "@/src/services/citiesRegistry";
import { normalizeCityKey } from "@/src/utils/city";

type GuideBlock = { heading?: string; text: string };
type GuideFull = { title: string; blocks: GuideBlock[] };

type CanonicalTripStartParams = {
  tripId?: string;
  fixtureId: string;
  from?: string;
  to?: string;
  leagueId?: string;
  season?: string;
  city?: string;
};

function safeStr(v: unknown) {
  return String(v ?? "").trim();
}

function toIsoOrEmpty(v: unknown) {
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

function fixtureDateOnly(iso?: string | null): string {
  const value = safeStr(iso);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function inferTripWindowFromKickoff(kickoffIso?: string | null): { from?: string; to?: string } {
  const dateOnly = fixtureDateOnly(kickoffIso);
  if (!dateOnly) return {};

  const start = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const toIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`;

  return { from: dateOnly, to: toIso };
}

function buildCanonicalTripStartParams(args: {
  tripId?: string | null;
  fixtureId: string;
  from?: string | null;
  to?: string | null;
  leagueId?: number | string | null;
  season?: number | string | null;
  city?: string | null;
  kickoffIso?: string | null;
}): CanonicalTripStartParams {
  const tripId = safeStr(args.tripId);
  const fixtureId = safeStr(args.fixtureId);
  const from = safeStr(args.from);
  const to = safeStr(args.to);
  const leagueId = safeStr(args.leagueId);
  const season = safeStr(args.season);
  const city = safeStr(args.city);

  const fallbackWindow = inferTripWindowFromKickoff(args.kickoffIso);

  return {
    ...(tripId ? { tripId } : {}),
    fixtureId,
    ...(from ? { from } : fallbackWindow.from ? { from: fallbackWindow.from } : {}),
    ...(to ? { to } : fallbackWindow.to ? { to: fallbackWindow.to } : {}),
    ...(leagueId ? { leagueId } : {}),
    ...(season ? { season } : {}),
    ...(city ? { city } : {}),
  };
}

function groupByMonth(rows: FixtureListRow[]) {
  const map = new Map<string, FixtureListRow[]>();

  for (const r of rows) {
    const iso = safeStr(r?.fixture?.date);
    const title = monthHeading(iso) || "Other";
    if (!map.has(title)) map.set(title, []);
    map.get(title)?.push(r);
  }

  const out: { key: string; title: string; rows: FixtureListRow[] }[] = [];

  for (const [key, list] of map.entries()) {
    out.push({ key, title: key, rows: list });
  }

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
    lines.filter((l) => /^[-•]/.test(l) || /^\d+[.)]\s/.test(l)).length >=
      Math.ceil(lines.length * 0.6);

  if (!looksBulleted) return { bullets: [] as string[], paragraph: raw };

  const bullets = lines
    .map((l) => l.replace(/^[-•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  return { bullets, paragraph: "" };
}

function countryToIso2(code?: string, name?: string): string | null {
  const c = safeStr(code).toUpperCase();
  if (c.length === 2) return c;

  const iso3Map: Record<string, string> = {
    FRA: "FR",
    ESP: "ES",
    DEU: "DE",
    GER: "DE",
    ITA: "IT",
    PRT: "PT",
    NLD: "NL",
    BEL: "BE",
    AUT: "AT",
    CHE: "CH",
    TUR: "TR",
    GRC: "GR",
    POL: "PL",
    CZE: "CZ",
    DNK: "DK",
    SWE: "SE",
    NOR: "NO",
    FIN: "FI",
    IRL: "IE",
    HUN: "HU",
    ROU: "RO",
    HRV: "HR",
    SRB: "RS",
    SVK: "SK",
    SVN: "SI",
    BGR: "BG",
    GBR: "GB",
    ENG: "GB",
    SCO: "GB",
    WAL: "GB",
  };

  if (c.length === 3 && iso3Map[c]) return iso3Map[c];

  const n = safeStr(name).toLowerCase();
  const nameMap: Record<string, string> = {
    france: "FR",
    spain: "ES",
    germany: "DE",
    italy: "IT",
    portugal: "PT",
    netherlands: "NL",
    belgium: "BE",
    austria: "AT",
    switzerland: "CH",
    turkey: "TR",
    greece: "GR",
    poland: "PL",
    czechia: "CZ",
    "czech republic": "CZ",
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
    england: "GB",
    scotland: "GB",
    wales: "GB",
    "united kingdom": "GB",
    uk: "GB",
    britain: "GB",
    "great britain": "GB",
  };

  return nameMap[n] || null;
}

function FlagMini({ countryCode, countryName }: { countryCode?: string; countryName?: string }) {
  const iso2 = countryToIso2(countryCode, countryName);
  if (!iso2) return null;

  const url = getFlagImageUrl(iso2, { size: 64 });
  if (!url) return null;

  return <Image source={{ uri: url }} style={styles.flagMini} resizeMode="cover" />;
}

function getCityGuideFull(cityKey: string): GuideFull | null {
  const key = safeStr(cityKey);
  if (!key) return null;

  const guide = getCityGuide(key) as CityGuide | null;
  if (!guide) return null;

  const title = safeStr(guide.name) || safeStr(guide.cityId) || "City guide";
  const blocks: GuideBlock[] = [];

  const overview = safeStr(guide.overview);
  if (overview) blocks.push({ heading: "Overview", text: overview });

  const topThingsText = joinTopThings(guide.topThings, 10);
  if (topThingsText) blocks.push({ heading: "Top things to do", text: topThingsText });

  const tipsText = joinBullets(guide.tips, 14);
  if (tipsText) blocks.push({ heading: "Quick tips", text: tipsText });

  const foodText = joinBullets(guide.food, 14);
  if (foodText) blocks.push({ heading: "Food & drink", text: foodText });

  const transport = safeStr(guide.transport);
  if (transport) blocks.push({ heading: "Getting around", text: transport });

  const stay = safeStr(guide.accommodation);
  if (stay) blocks.push({ heading: "Where to stay", text: stay });

  if (!blocks.length) {
    return {
      title,
      blocks: [{ heading: undefined, text: "Guide content is available for this city." }],
    };
  }

  return { title, blocks };
}

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
            <View style={styles.flexTextWrap}>
              <Text style={styles.modalKicker}>CITY GUIDE</Text>
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

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {!blocks.length ? (
              <GlassCard strength="default" style={styles.block} noPadding>
                <View style={styles.blockInner}>
                  <Text style={styles.blockNote}>Guide content unavailable for this city yet.</Text>
                </View>
              </GlassCard>
            ) : (
              <View style={styles.modalSectionsWrap}>
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

            <View style={styles.modalBottomSpacer} />
          </ScrollView>
        </SafeAreaView>
      </Background>
    </Modal>
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

function uniqueLeaguesById(list: LeagueOption[]) {
  const seen = new Set<number>();
  const out: LeagueOption[] = [];

  for (const l of list) {
    if (!l?.leagueId) continue;
    if (seen.has(l.leagueId)) continue;
    seen.add(l.leagueId);
    out.push(l);
  }

  return out;
}

function pickLeaguesForCity(city: CityRecord | null, fallback: LeagueOption[]): { leagues: LeagueOption[]; reason: string } {
  const all = uniqueLeaguesById(fallback);

  const leagueIds = Array.isArray((city as any)?.leagueIds) ? (((city as any).leagueIds as any[]) ?? []) : [];
  const leagueIdNums = leagueIds.map((x) => Number(x)).filter((n) => Number.isFinite(n));

  if (leagueIdNums.length) {
    const byIds = all.filter((l) => leagueIdNums.includes(l.leagueId));
    if (byIds.length) return { leagues: byIds, reason: "registry-leagueIds" };
  }

  const iso2 = countryToIso2(safeStr(city?.countryCode), safeStr(city?.country));
  if (iso2) {
    const byCountry = all.filter((l) => safeStr((l as any).countryCode).toUpperCase() === iso2);
    if (byCountry.length) return { leagues: byCountry, reason: "country-filter" };
  }

  return { leagues: all, reason: "all-leagues" };
}

async function fetchFixturesBatched({
  leagues,
  from,
  to,
  concurrency,
  onProgress,
  shouldCancel,
}: {
  leagues: LeagueOption[];
  from: string;
  to: string;
  concurrency: number;
  onProgress?: (done: number, total: number) => void;
  shouldCancel: () => boolean;
}) {
  const total = leagues.length;
  const out: FixtureListRow[] = [];

  const runOne = async (l: LeagueOption) => {
    const rows = await getFixtures({ league: l.leagueId, season: l.season, from, to });
    return Array.isArray(rows) ? (rows as FixtureListRow[]) : [];
  };

  for (let i = 0; i < leagues.length; i += concurrency) {
    if (shouldCancel()) break;

    const batch = leagues.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map(runOne));

    for (const s of settled) {
      if (s.status === "fulfilled") out.push(...s.value);
    }

    onProgress?.(Math.min(i + batch.length, total), total);
  }

  return out;
}

export default function CityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const cityKeyParam = safeStr(params.cityKey);
  const citySlug = useMemo(() => normalizeCityKey(cityKeyParam), [cityKeyParam]);

  const activeTripId = safeStr(params.tripId);
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
  const [guideOpen, setGuideOpen] = useState(false);

  const [progress, setProgress] = useState<{ done: number; total: number; reason: string }>({
    done: 0,
    total: 0,
    reason: "",
  });

  const cancelRef = useRef(false);
  const requestSeqRef = useRef(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cancelRef.current = false;
    return () => {
      cancelRef.current = true;
      requestSeqRef.current += 1;
    };
  }, []);

  const loadCityFixtures = useCallback(
    async (activeCity: CityRecord | null) => {
      const requestId = requestSeqRef.current + 1;
      requestSeqRef.current = requestId;

      const isStale = () => cancelRef.current || requestSeqRef.current !== requestId;

      if (!citySlug) {
        setLoadingFx(false);
        setFxRows([]);
        setFxError("Missing city key.");
        return;
      }

      setLoadingFx(true);
      setFxError(null);
      setFxRows([]);

      try {
        const venueIds = Array.isArray(activeCity?.venueIds) ? activeCity.venueIds : [];
        const targetSlug = safeStr(activeCity?.slug) || citySlug;

        const pick = pickLeaguesForCity(activeCity, LEAGUES);
        setProgress({ done: 0, total: pick.leagues.length, reason: pick.reason });

        const all = await fetchFixturesBatched({
          leagues: pick.leagues,
          from,
          to,
          concurrency: 5,
          onProgress: (done, total) => {
            if (!isStale()) setProgress((p) => ({ ...p, done, total }));
          },
          shouldCancel: isStale,
        });

        if (isStale()) return;

        const filtered = all.filter((r) => {
          const vCity = safeStr(r?.fixture?.venue?.city);
          const vSlug = vCity ? normalizeCityKey(vCity) : "";
          const vId = r?.fixture?.venue?.id;

          const byCitySlug = !!targetSlug && !!vSlug && vSlug === targetSlug;
          const byVenueId = typeof vId === "number" && venueIds.includes(vId);

          return byCitySlug || byVenueId;
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
        if (isStale()) return;
        setFxError(e?.message ?? "Failed to load city fixtures.");
      } finally {
        if (!isStale()) setLoadingFx(false);
      }
    },
    [citySlug, from, to]
  );

  useEffect(() => {
    let mounted = true;

    async function boot() {
      if (!citySlug) {
        setCityLive(null);
        setCityLiveLoading(false);
        await loadCityFixtures(null);
        return;
      }

      setCityLiveLoading(true);

      try {
        const c = await getCityByKeyLive(citySlug, LEAGUES);
        if (!mounted || cancelRef.current) return;

        setCityLive(c);
        setCityLiveLoading(false);
        await loadCityFixtures(c);
      } catch {
        if (!mounted || cancelRef.current) return;

        setCityLive(null);
        setCityLiveLoading(false);
        await loadCityFixtures(null);
      }
    }

    void boot();

    return () => {
      mounted = false;
    };
  }, [citySlug, from, to, loadCityFixtures]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const c = citySlug ? await getCityByKeyLive(citySlug, LEAGUES) : null;
      if (cancelRef.current) return;

      setCityLive(c);
      await loadCityFixtures(c);
    } catch {
      if (cancelRef.current) return;

      setCityLive(null);
      await loadCityFixtures(null);
    } finally {
      if (!cancelRef.current) setRefreshing(false);
    }
  }, [citySlug, loadCityFixtures]);

  const grouped = useMemo(() => groupByMonth(fxRows), [fxRows]);

  const title = cityLive?.name || cityKeyToTitle(citySlug || cityKeyParam);
  const countryCode = safeStr(cityLive?.countryCode);
  const countryName = safeStr(cityLive?.country);

  const guideBlocks = useMemo<GuideBlock[]>(() => guideFull?.blocks ?? [], [guideFull]);

  const overview = useMemo(() => {
    return (
      guideBlocks.find((b) => safeStr(b.heading).toLowerCase() === "overview")?.text ||
      guideBlocks[0]?.text ||
      ""
    );
  }, [guideBlocks]);

  const guidePreview = useMemo(() => {
    return guideFull ? clampText(overview, 220) : "";
  }, [guideFull, overview]);

  const guideStats = useMemo(() => {
    if (!guideFull) return "";

    const sections = guideBlocks.length;
    const hasTop = guideBlocks.some((b) => safeStr(b.heading).toLowerCase().includes("top"));
    const hasStay = guideBlocks.some((b) => safeStr(b.heading).toLowerCase().includes("stay"));

    return [
      sections ? `${sections} sections` : "",
      hasTop ? "things to do" : "",
      hasStay ? "where to stay" : "",
    ]
      .filter(Boolean)
      .join(" • ");
  }, [guideFull, guideBlocks]);

  const guideHelper = useMemo(() => {
    if (!guideFull) return "We’ll add this city soon. For now, use fixtures below to anchor your trip.";
    if (!activeTripId) return "This guide is editorial only. Pick a fixture below to start a real trip.";
    return "This guide is editorial planning support. Use a fixture below to build the actual trip.";
  }, [guideFull, activeTripId]);

  const progressLine = useMemo(() => {
    if (!loadingFx) return "";
    if (!progress.total) return "Searching leagues…";

    const base = `Searching ${progress.done}/${progress.total} leagues…`;
    if (progress.reason === "registry-leagueIds") return `${base} (matched by city registry)`;
    if (progress.reason === "country-filter") return `${base} (filtered to country)`;
    return base;
  }, [loadingFx, progress]);

  const goHome = useCallback(() => {
    router.push("/(tabs)/home" as never);
  }, [router]);

  const goPlanTrip = useCallback(
    (row: FixtureListRow) => {
      const fixtureId = row?.fixture?.id != null ? String(row.fixture.id) : "";
      if (!fixtureId) return;

      const leagueId = row?.league?.id != null ? String(row.league.id) : undefined;
      const season = row?.league?.season != null ? String(row.league.season) : undefined;
      const city = safeStr(row?.fixture?.venue?.city) || title;

      const tripParams = buildCanonicalTripStartParams({
        tripId: activeTripId || undefined,
        fixtureId,
        from,
        to,
        leagueId,
        season,
        city,
        kickoffIso: safeStr(row?.fixture?.date) || undefined,
      });

      router.push({
        pathname: "/trip/build",
        params: tripParams,
      } as never);
    },
    [router, activeTripId, from, to, title]
  );

  const bg = getCityBackground(citySlug || cityKeyParam);
  const bgSource = typeof bg === "string" ? { uri: bg } : bg;

  return (
    <Background imageSource={bgSource} overlayOpacity={0.7}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.textSecondary} />
          }
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>CITY GUIDE</Text>

              <View style={styles.heroTitleRow}>
                <View style={styles.flexTextWrap}>
                  <Text style={styles.heroTitle} numberOfLines={2} ellipsizeMode="tail">
                    {title}
                  </Text>

                  <View style={styles.heroMetaRow}>
                    <FlagMini countryCode={countryCode} countryName={countryName} />
                    {countryName ? <Text style={styles.heroMetaText}>{countryName}</Text> : null}
                    {cityLiveLoading ? <Text style={styles.heroMetaText}>• Loading city…</Text> : null}
                  </View>
                </View>
              </View>

              {safeStr((cityLive as any)?.heroSubtitle) ? (
                <Text style={styles.heroSubtitle} numberOfLines={3} ellipsizeMode="tail">
                  {safeStr((cityLive as any)?.heroSubtitle)}
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

          <GlassCard strength="default" style={styles.block} noPadding>
            <View style={styles.blockInner}>
              <View style={styles.guideTopRow}>
                <View style={styles.flexTextWrap}>
                  <Text style={styles.blockTitle}>Guide</Text>
                  <Text style={styles.guideSub} numberOfLines={1}>
                    {guideFull ? guideStats || "Practical, city-break planning notes." : "Guide content unavailable for this city yet."}
                  </Text>
                </View>

                {guideFull ? (
                  <Pressable
                    onPress={() => setGuideOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open city guide"
                    style={({ pressed }) => [styles.miniPrimaryPill, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={styles.miniPrimaryPillText}>Open guide</Text>
                  </Pressable>
                ) : null}
              </View>

              {guideFull && guidePreview ? <Text style={styles.blockNote}>{guidePreview}</Text> : null}
              <Text style={styles.blockNote}>{guideHelper}</Text>
            </View>
          </GlassCard>

          <GlassCard strength="default" style={styles.block} noPadding>
            <View style={styles.blockInner}>
              <Text style={styles.blockTitle}>Fixtures in {title}</Text>

              {loadingFx ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>{progressLine || "Loading fixtures…"}</Text>
                </View>
              ) : null}

              {!loadingFx && fxError ? <EmptyState title="Fixtures Unavailable" message={fxError} /> : null}

              {!loadingFx && !fxError && fxRows.length === 0 ? (
                <EmptyState title="No City Fixtures Found" message="Try another date window." />
              ) : null}

              {!loadingFx && !fxError && fxRows.length > 0 ? (
                <View style={styles.groupWrap}>
                  {grouped.map((g) => (
                    <View key={g.key} style={styles.monthWrap}>
                      <Text style={styles.month}>{g.title}</Text>

                      <View style={styles.fixtureListWrap}>
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

          <View style={styles.bottomSpacer} />
        </ScrollView>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: 14 },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },

  flexTextWrap: { flex: 1, minWidth: 0 },

  hero: { marginTop: theme.spacing.lg, borderRadius: 26 },
  heroInner: { padding: theme.spacing.lg, gap: 10 },

  kicker: {
    color: "rgba(79,224,138,0.70)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },
  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
  },

  heroMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  heroMetaText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },
  flagMini: { width: 20, height: 14, borderRadius: 3, opacity: 0.9 },

  heroSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
    opacity: 0.95,
  },
  heroRange: {
    color: theme.colors.textTertiary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },

  heroActions: { flexDirection: "row", gap: 10, marginTop: 6 },

  btn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  block: { borderRadius: 24 },
  blockInner: { padding: 14, gap: 10 },
  blockTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  blockNote: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 19,
  },

  guideTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  guideSub: {
    marginTop: 4,
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  miniPrimaryPill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  miniPrimaryPillText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  groupWrap: { gap: 14 },
  monthWrap: { gap: 10 },
  fixtureListWrap: { gap: 12 },

  month: {
    color: theme.colors.textTertiary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  fxRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  matchLine: { width: "100%", flexDirection: "row", alignItems: "center", gap: 10 },

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
  },
  teamNameRight: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
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
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  planBtnText: { color: theme.colors.text, fontSize: 12, fontWeight: theme.fontWeight.black },

  modalSafe: { flex: 1, paddingHorizontal: theme.spacing.lg },
  modalTop: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalKicker: {
    color: "rgba(79,224,138,0.70)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
  },
  modalTitle: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: theme.fontWeight.black,
  },
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
  closePillText: {
    color: "rgba(255,255,255,0.78)",
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  modalScroll: { flex: 1 },
  modalContent: { paddingBottom: theme.spacing.xxl, gap: 12 },
  modalSectionsWrap: { gap: 12 },
  modalBottomSpacer: { height: 18 },
  bottomSpacer: { height: 14 },

  guideSecCard: { borderRadius: 22 },
  guideSecHeader: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  guideSecHeading: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },
  guideSecChevron: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: -2,
  },
  guideSecBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },

  guideText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 19,
  },

  bulletList: { gap: 10, paddingTop: 2 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor: "rgba(79,224,138,0.65)",
  },
  bulletText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 19,
  },
});
