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
  Alert,
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
  "real-madrid":
    "https://images.unsplash.com/photo-1548600916-d2d8a0b2b3b6?auto=format&fit=crop&w=1400&q=80",
  "arsenal":
    "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=1400&q=80",
  "bayern-munich":
    "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1400&q=80",
  "inter":
    "https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&w=1400&q=80",
  "borussia-dortmund":
    "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80",
};

const API_SPORTS_TEAM_LOGO = (teamId: number) =>
  `https://media.api-sports.io/football/teams/${teamId}.png`;

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function toIsoOrEmpty(v: any) {
  const s = safeStr(v);
  return s;
}

function monthHeading(iso: string) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

function groupByMonth(rows: FixtureListRow[]) {
  const out: { key: string; title: string; rows: FixtureListRow[] }[] = [];
  const map = new Map<string, FixtureListRow[]>();

  rows.forEach((r) => {
    const iso = safeStr(r?.fixture?.date);
    const title = monthHeading(iso);
    const key = title || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  for (const [key, list] of map.entries()) {
    out.push({ key, title: key, rows: list });
  }

  // Month order: chronological by first fixture date
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

/**
 * This is the "must-fix" layout.
 * Names must never overlap the "vs" and never collide into each other.
 */
function FixtureRow({
  row,
  onPressPlan,
}: {
  row: FixtureListRow;
  onPressPlan: () => void;
}) {
  const homeName = safeStr(row?.teams?.home?.name);
  const awayName = safeStr(row?.teams?.away?.name);
  const homeLogo = safeStr(row?.teams?.home?.logo);
  const awayLogo = safeStr(row?.teams?.away?.logo);

  const kickoff = formatUkDateTimeMaybe(row?.fixture?.date);
  const venue = safeStr(row?.fixture?.venue?.name);
  const city = safeStr(row?.fixture?.venue?.city);
  const meta = [kickoff, venue, city].filter(Boolean).join(" • ");

  return (
    <View style={styles.fxRow}>
      <View style={styles.fxTop}>
        <View style={styles.matchLine}>
          {/* LEFT (home) */}
          <View style={styles.teamSideLeft}>
            {homeLogo ? <Image source={{ uri: homeLogo }} style={styles.smallCrestImg} resizeMode="contain" /> : null}
            <Text style={styles.teamNameLeft} numberOfLines={1} ellipsizeMode="tail">
              {homeName || "Home"}
            </Text>
          </View>

          {/* CENTER (vs) */}
          <View style={styles.vsPill}>
            <Text style={styles.vsText}>vs</Text>
          </View>

          {/* RIGHT (away) */}
          <View style={styles.teamSideRight}>
            <Text style={styles.teamNameRight} numberOfLines={1} ellipsizeMode="tail">
              {awayName || "Away"}
            </Text>
            {awayLogo ? <Image source={{ uri: awayLogo }} style={styles.smallCrestImg} resizeMode="contain" /> : null}
          </View>
        </View>

        <Pressable
          onPress={onPressPlan}
          style={({ pressed }) => [styles.planBtn, pressed && styles.pressed]}
          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
        >
          <Text style={styles.planBtnText}>Plan Trip</Text>
        </Pressable>
      </View>

      <Text style={styles.fxMeta} numberOfLines={2}>
        {meta}
      </Text>
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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRows([]);

      try {
        if (!team || !league) {
          setRows([]);
          setLoading(false);
          return;
        }

        // Team fixtures: rely on league window + filter by team id if present.
        // If your API supports team= filter, swap this to server-side filtering.
        const res = await getFixtures({
          league: league.leagueId,
          season: league.season,
          from: from || undefined,
          to: to || undefined,
        });

        if (cancelled) return;

        const list = Array.isArray(res) ? res : [];
        const filtered =
          typeof team.teamId === "number"
            ? list.filter((r) => r?.teams?.home?.id === team.teamId || r?.teams?.away?.id === team.teamId)
            : list;

        // Keep only future-ish fixtures with ids
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

  const canShowGuide = useMemo(() => (team?.teamKey ? hasTeamGuide(team.teamKey) : false), [team]);

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
    <Background imageSource={bgSource} overlayOpacity={0.70}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* HERO */}
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>TEAM</Text>

              <View style={styles.heroTitleRow}>
                <TeamCrestHero teamId={team?.teamId} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {title}
                  </Text>

                  <View style={styles.heroMetaRow}>
                    {leagueLabel ? <Text style={styles.heroMetaText}>{leagueLabel}</Text> : null}
                    {countryCode ? <FlagMini countryCode={countryCode} /> : null}
                  </View>
                </View>
              </View>

              <Text style={styles.heroRange}>
                {(from && to) ? `${from.split("-").reverse().join("/")} → ${to.split("-").reverse().join("/")}` : ""}
              </Text>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={goBrowseFixtures}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.btnGhostText}>Browse fixtures</Text>
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

          {/* TEAM GUIDE (preview) */}
          {canShowGuide ? (
            <GlassCard strength="default" style={styles.block} noPadding>
              <View style={styles.blockInner}>
                <View style={styles.blockHeader}>
                  <Text style={styles.blockTitle}>Team guide</Text>
                  <Pressable
                    onPress={() => router.push({ pathname: "/team/[teamKey]/guide", params: { teamKey: team?.teamKey } } as any)}
                    style={({ pressed }) => [styles.previewPill, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                  >
                    <Text style={styles.previewPillText}>Preview</Text>
                  </Pressable>
                </View>
                <Text style={styles.blockNote}>Guide content available for this team.</Text>
              </View>
            </GlassCard>
          ) : null}

          {/* FIXTURES */}
          <GlassCard strength="default" style={styles.block} noPadding>
            <View style={styles.blockInner}>
              <Text style={styles.blockTitle}>Fixtures</Text>

              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!loading && error ? <EmptyState title="Fixtures Unavailable" message={error} /> : null}

              {!loading && !error && rows.length === 0 ? (
                <EmptyState title="No Fixtures Found" message="Try another date window." />
              ) : null}

              {!loading && !error && rows.length > 0 ? (
                <View style={{ gap: 14 }}>
                  {grouped.map((g) => (
                    <View key={g.key} style={{ gap: 10 }}>
                      <Text style={styles.month}>{g.title}</Text>

                      <View style={{ gap: 10 }}>
                        {g.rows.map((r) => {
                          const id = r?.fixture?.id != null ? String(r.fixture.id) : "";
                          return (
                            <FixtureRow
                              key={id}
                              row={r}
                              onPressPlan={() => {
                                if (!id) return;
                                goPlanTrip(id);
                              }}
                            />
                          );
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

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  month: { color: theme.colors.textTertiary, fontSize: 13, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },

  // Fixture row (must-fix layout)
  fxRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },

  fxTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

  matchLine: {
    flex: 1,
    minWidth: 0, // critical so children can shrink instead of overlapping
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  teamSideLeft: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  teamSideRight: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },

  teamNameLeft: { flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  teamNameRight: { flex: 1, minWidth: 0, textAlign: "right", color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },

  vsPill: {
    width: 34, // fixed width = no collisions
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

  fxMeta: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16 },
});
