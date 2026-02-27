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
import { LEAGUES, getRollingWindowIso } from "@/src/constants/football";

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
  // optional: known venue ids for more precise fixture filtering
  venueIds?: number[];
};

type GuideFull = {
  title: string;
  blocks: { heading?: string; text: string }[];
};

function normalizeText(v: any): string {
  return safeStr(v);
}

function joinParas(v: any): string {
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => safeStr(x)).filter(Boolean).join("\n\n");
  return normalizeText(v);
}

/**
 * Safe runtime access to city data + guide content without hard-coupling to exact exports.
 * - City data: tries src/data/cities or src/data/cityGuides metadata
 * - Guide: tries src/data/cityGuides getter(s)
 */
function getCityData(cityKey: string): CityData | null {
  const key = safeStr(cityKey);
  if (!key) return null;

  // Try src/data/cities first
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
          cityKey: safeStr(c.cityKey) || key,
          name: safeStr(c.name) || safeStr(c.title) || key,
          countryCode: safeStr(c.countryCode),
          countryName: safeStr(c.countryName),
          heroSubtitle: safeStr(c.subtitle) || safeStr(c.tagline),
          venueIds: Array.isArray(c.venueIds) ? c.venueIds : undefined,
        };
      }
    }
  } catch {
    // ignore
  }

  // Fallback: minimal city data derived from key
  return {
    cityKey: key,
    name: key
      .split("-")
      .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
      .join(" "),
  };
}

function getCityGuideFull(cityKey: string): GuideFull | null {
  const key = safeStr(cityKey);
  if (!key) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod: any = require("@/src/data/cityGuides");

    const getter =
      typeof mod.getCityGuide === "function"
        ? mod.getCityGuide
        : typeof mod.getGuide === "function"
          ? mod.getGuide
          : null;

    if (!getter) return null;

    const guide = getter(key);
    if (!guide) return null;

    const title =
      safeStr(guide.title) ||
      safeStr(guide.name) ||
      safeStr(guide.cityName) ||
      "City guide";

    const blocks: { heading?: string; text: string }[] = [];

    const overview =
      normalizeText(guide.overview) ||
      normalizeText(guide.intro) ||
      normalizeText(guide.description) ||
      "";

    if (overview) blocks.push({ heading: "Overview", text: overview });

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

    if (!blocks.length) {
      const anyText = normalizeText(guide.content) || normalizeText(guide.text) || "";
      if (anyText) blocks.push({ heading: undefined, text: anyText });
    }

    if (!blocks.length) blocks.push({ heading: undefined, text: "Guide content is available for this city." });

    return { title, blocks };
  } catch {
    return null;
  }
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

export default function CityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const cityKeyParam = safeStr(params.cityKey);
  const cityKey = cityKeyParam;

  const fromParam = toIsoOrEmpty(params.from);
  const toParam = toIsoOrEmpty(params.to);

  // Default rolling window if not provided
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const from = fromParam || rolling.from;
  const to = toParam || rolling.to;

  const city = useMemo(() => getCityData(cityKey), [cityKey]);
  const guideFull = useMemo(() => getCityGuideFull(cityKey), [cityKey]);

  const [guideOpen, setGuideOpen] = useState(false);

  const [loadingFx, setLoadingFx] = useState(true);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingFx(true);
      setFxError(null);
      setFxRows([]);

      try {
        const cityName = safeStr(city?.name);
        const venueIds = Array.isArray(city?.venueIds) ? city!.venueIds! : [];

        // Pull fixtures league-by-league (within rolling window) then filter to this city.
        // This is heavier than a dedicated endpoint, but correct + simple for Phase 1.
        const all: FixtureListRow[] = [];

        for (const l of LEAGUES) {
          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from,
            to,
          });

          const list = Array.isArray(res) ? (res as FixtureListRow[]) : [];
          all.push(...list);
        }

        if (cancelled) return;

        // Filter: fixtures that actually happen in this city
        const filtered = all.filter((r) => {
          const vCity = safeStr(r?.fixture?.venue?.city).toLowerCase();
          const vId = r?.fixture?.venue?.id;
          const cityLower = cityName.toLowerCase();

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

  const title = city?.name || (cityKeyParam ? cityKeyParam : "City");
  const countryCode = safeStr(city?.countryCode);

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
          from,
          to,
        },
      } as any);
    },
    [router, from, to]
  );

  const bgSource = getBackground("city");

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
                    {city?.countryName ? <Text style={styles.heroMetaText}>{safeStr(city.countryName)}</Text> : null}
                  </View>
                </View>
              </View>

              <Text style={styles.heroRange}>
                {from && to ? `${ddmmyyyyFromIsoDateOnly(from)} → ${ddmmyyyyFromIsoDateOnly(to)}` : ""}
              </Text>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={() => setGuideOpen(true)}
                  style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.btnPrimaryText}>Open city guide</Text>
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

          {/* GUIDE PREVIEW (same “uplift” style as team) */}
          <GlassCard strength="default" style={styles.block} noPadding>
            <View style={styles.blockInner}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Guide</Text>
                <Pressable
                  onPress={() => setGuideOpen(true)}
                  style={({ pressed }) => [styles.previewPill, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                >
                  <Text style={styles.previewPillText}>Open</Text>
                </Pressable>
              </View>

              {guideFull?.blocks?.[0]?.text ? (
                <>
                  <Text style={styles.guideKicker}>Overview</Text>
                  <Text style={styles.guidePreviewText} numberOfLines={10} ellipsizeMode="tail">
                    {guideFull.blocks[0].text}
                  </Text>
                  <Text style={styles.guideHint}>Open the full guide for the complete breakdown.</Text>
                </>
              ) : (
                <Text style={styles.blockNote}>Guide content available.</Text>
              )}
            </View>
          </GlassCard>

          {/* CITY FIXTURES (multi-team) */}
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

        {/* GUIDE MODAL */}
        <Modal visible={guideOpen} animationType="fade" transparent onRequestClose={() => setGuideOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setGuideOpen(false)} />
          <View style={styles.modalSheetWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{guideFull?.title || "City guide"}</Text>
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

  btnPrimary: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnPrimaryText: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },

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
  modalScroll: { maxHeight: 560 },

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
