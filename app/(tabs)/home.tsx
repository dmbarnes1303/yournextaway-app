// app/(tabs)/home.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
  Keyboard,
  Image,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import {
  LEAGUES,
  getRollingWindowIso,
  parseIsoDateOnly,
  toIsoDate,
  type LeagueOption,
  windowFromTomorrowIso,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { buildSearchIndex, querySearchIndex, type SearchResult } from "@/src/services/searchIndex";
import { hasTeamGuide } from "@/src/data/teamGuides";
import { getCityGuide } from "@/src/data/cityGuides";
import { getFlagImageUrl } from "@/src/utils/flagImages";

/**
 * Premium Home (Overhaul):
 * - Remove all “neon rails” / left-edge accents.
 * - Reduce density: hero search, featured upcoming, trips, compact shortcuts, compact discover.
 * - One glass recipe; no nested GlassCard stacks.
 * - Restraint: fewer CTAs visible at once.
 */

const API_SPORTS_TEAM_LOGO = (teamId: number) => `https://media.api-sports.io/football/teams/${teamId}.png`;

type ShortcutWindow = { from: string; to: string };

type CityChip = { name: string; countryCode: string };
type TeamChip = { name: string; teamId: number };

const POPULAR_CITIES: CityChip[] = [
  { name: "Paris", countryCode: "FR" },
  { name: "Rome", countryCode: "IT" },
  { name: "Barcelona", countryCode: "ES" },
  { name: "Amsterdam", countryCode: "NL" },
  { name: "Lisbon", countryCode: "PT" },
];

const POPULAR_TEAMS: TeamChip[] = [
  { name: "Real Madrid", teamId: 541 },
  { name: "Arsenal", teamId: 42 },
  { name: "Bayern Munich", teamId: 157 },
  { name: "Inter Milan", teamId: 505 },
  { name: "Borussia Dortmund", teamId: 165 },
];

function toKey(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function dedupeBy<T>(arr: T[], keyFn: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function tripSummaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} Match${n === 1 ? "" : "es"}`;
}

function fixtureLine(r: FixtureListRow) {
  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
  const venue = r?.fixture?.venue?.name ?? "";
  const city = r?.fixture?.venue?.city ?? "";
  const extra = [venue, city].filter(Boolean).join(" • ");
  return {
    title: `${home} vs ${away}`,
    meta: extra ? `${kickoff} • ${extra}` : kickoff,
  };
}

function splitSearchBuckets(results: SearchResult[]) {
  const teams: SearchResult[] = [];
  const cities: SearchResult[] = [];
  const venues: SearchResult[] = [];
  const countries: SearchResult[] = [];
  const leagues: SearchResult[] = [];

  for (const r of results) {
    if (r.type === "team") teams.push(r);
    else if (r.type === "city") cities.push(r);
    else if (r.type === "venue") venues.push(r);
    else if (r.type === "country") countries.push(r);
    else if (r.type === "league") leagues.push(r);
  }

  return { teams, cities, venues, countries, leagues };
}

function LeagueFlag({ code }: { code: string }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flag} />;
}

function CityFlag({ code }: { code: string }) {
  const url = getFlagImageUrl(code, { size: 40 });
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.cityFlag} />;
}

function TeamCrest({ teamId }: { teamId: number }) {
  const uri = API_SPORTS_TEAM_LOGO(teamId);
  return <Image source={{ uri }} style={styles.teamCrest} resizeMode="contain" />;
}

function CrestSquare({ row }: { row: FixtureListRow }) {
  const homeName = row?.teams?.home?.name ?? "";
  const logo = row?.teams?.home?.logo;

  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(homeName)}</Text>
      )}
    </View>
  );
}

/**
 * Deterministic “attractiveness” scoring (basic, safe).
 * (This is just for ordering top picks; not shown to user.)
 */
function scoreFixture(r: FixtureListRow): number {
  let s = 0;

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;

  const popularIds = new Set(POPULAR_TEAMS.map((t) => t.teamId));
  if (typeof homeId === "number" && popularIds.has(homeId)) s += 60;
  if (typeof awayId === "number" && popularIds.has(awayId)) s += 60;

  const venue = String(r?.fixture?.venue?.name ?? "").trim();
  const city = String(r?.fixture?.venue?.city ?? "").trim();
  if (venue) s += 10;
  if (city) s += 6;

  const dt = r?.fixture?.date ? new Date(r.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) {
    const day = dt.getDay();
    if (day === 5 || day === 6 || day === 0) s += 10; // Fri/Sat/Sun
    const hr = dt.getHours();
    if (hr >= 17 && hr <= 21) s += 6;
  }

  return s;
}

export default function HomeScreen() {
  const router = useRouter();

  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);
  const { from: fromIso, to: toIso } = useMemo(() => getRollingWindowIso(), []);
  const upcomingWindow = useMemo(() => windowFromTomorrowIso(14), []);

  // Trips
  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoadedTrips(s.loaded);
      setTrips(s.trips);
    });
    if (!tripsStore.getState().loaded) tripsStore.loadTrips();
    return unsub;
  }, []);

  const todayMidnight = useMemo(() => {
    const iso = toIsoDate(new Date());
    return parseIsoDateOnly(iso) ?? new Date();
  }, []);

  const upcomingTrips = useMemo(() => {
    return trips
      .map((t) => ({ t, d: t.startDate ? parseIsoDateOnly(t.startDate) : null }))
      .filter((x): x is { t: Trip; d: Date } => !!x.d)
      .filter((x) => x.d.getTime() >= todayMidnight.getTime())
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map((x) => x.t);
  }, [trips, todayMidnight]);

  const nextTrip = useMemo(() => upcomingTrips[0] ?? null, [upcomingTrips]);

  // Fixtures preview
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setFxLoading(true);
      setFxError(null);
      setFxRows([]);

      try {
        const rows = await getFixtures({
          league: league.leagueId,
          season: league.season,
          from: upcomingWindow.from,
          to: upcomingWindow.to,
        });

        if (cancelled) return;
        setFxRows(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        if (cancelled) return;
        setFxError(e?.message ?? "Failed To Load Fixtures.");
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [league, upcomingWindow.from, upcomingWindow.to]);

  const fxOrdered = useMemo(() => {
    const scored = (fxRows ?? [])
      .filter((r) => r?.fixture?.id != null)
      .map((r) => ({ r, s: scoreFixture(r) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r);

    return scored;
  }, [fxRows]);

  const featured = useMemo(() => fxOrdered[0] ?? null, [fxOrdered]);
  const list = useMemo(() => fxOrdered.slice(1, 4), [fxOrdered]);

  // Search
  const [q, setQ] = useState("");
  const qNorm = useMemo(() => q.trim(), [q]);
  const showSearchResults = qNorm.length > 0;

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchIndexBuiltAt, setSearchIndexBuiltAt] = useState<number>(0);

  const indexRef = useRef<Awaited<ReturnType<typeof buildSearchIndex>> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function build() {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const idx = await buildSearchIndex({ from: fromIso, to: toIso, leagues: LEAGUES });
        if (cancelled) return;
        indexRef.current = idx;
        setSearchIndexBuiltAt(idx.builtAt);
      } catch (e: any) {
        if (cancelled) return;
        setSearchError(e?.message ?? "Search Index Failed To Build.");
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }

    build();
    return () => {
      cancelled = true;
    };
  }, [fromIso, toIso]);

  const rawSearchResults = useMemo(() => {
    const idx = indexRef.current;
    if (!idx) return [];
    if (!qNorm) return [];
    return querySearchIndex(idx, qNorm, { limit: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qNorm, searchIndexBuiltAt]);

  const buckets = useMemo(() => splitSearchBuckets(rawSearchResults), [rawSearchResults]);

  const clearSearch = useCallback(() => {
    setQ("");
    Keyboard.dismiss();
  }, []);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);

  const goFixtures = useCallback(() => {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: { leagueId: String(league.leagueId), season: String(league.season), from: fromIso, to: toIso },
    } as any);
  }, [router, league.leagueId, league.season, fromIso, toIso]);

  const goBuildTripGlobal = useCallback(
    (window?: ShortcutWindow) => {
      const w = window ?? getRollingWindowIso({ days: 60 });
      router.push({ pathname: "/trip/build", params: { global: "1", from: w.from, to: w.to } } as any);
    },
    [router]
  );

  const goMatch = useCallback(
    (fixtureId: string) => {
      router.push({
        pathname: "/match/[id]",
        params: { id: fixtureId, leagueId: String(league.leagueId), season: String(league.season), from: fromIso, to: toIso },
      } as any);
    },
    [router, league.leagueId, league.season, fromIso, toIso]
  );

  const onPressSearchResult = useCallback(
    (r: SearchResult) => {
      const p: any = r.payload;

      if (p?.kind === "team") {
        router.push({ pathname: "/team/[teamKey]", params: { teamKey: p.slug, from: fromIso, to: toIso } } as any);
        return;
      }

      if (p?.kind === "city") {
        router.push({ pathname: "/city/[slug]", params: { slug: p.slug, from: fromIso, to: toIso } } as any);
        return;
      }

      if (p?.kind === "venue") {
        const venueName = String(r.title ?? "").trim();
        router.push({
          pathname: "/(tabs)/fixtures",
          params: { leagueId: String(league.leagueId), season: String(league.season), from: fromIso, to: toIso, venue: venueName },
        } as any);
        return;
      }

      if (p?.kind === "country" || p?.kind === "league") {
        router.push({
          pathname: "/(tabs)/fixtures",
          params: { leagueId: String(p.leagueId), season: String(p.season), from: fromIso, to: toIso },
        } as any);
        return;
      }
    },
    [router, fromIso, toIso, league.leagueId, league.season]
  );

  const resultMeta = useCallback((r: SearchResult): string => {
    const p: any = r.payload;

    if (r.type === "team" && p?.kind === "team") return hasTeamGuide(p.slug) ? "Team Guide Available" : "Team Guide Coming Soon";
    if (r.type === "city" && p?.kind === "city") return getCityGuide(p.slug) ? "City Guide Available" : "City Guide Coming Soon";
    return r.subtitle ?? "";
  }, []);

  // Popular chips: dedupe / keep tight
  const dedupedCities = useMemo(() => dedupeBy(POPULAR_CITIES, (c) => toKey(c.name)).slice(0, 5), []);
  const dedupedTeams = useMemo(() => dedupeBy(POPULAR_TEAMS, (t) => String(t.teamId)).slice(0, 5), []);

  // Modals
  const [howOpen, setHowOpen] = useState(false);

  const shortcuts = useMemo(
    () => [
      { key: "wknd", label: "This Weekend", window: windowFromTomorrowIso(3) },
      { key: "d7", label: "Next 7 Days", window: windowFromTomorrowIso(7) },
      { key: "d14", label: "Next 14 Days", window: windowFromTomorrowIso(14) },
      { key: "any", label: "Any Time", window: getRollingWindowIso({ days: 60 }) },
    ],
    []
  );

  return (
    <Background imageSource={getBackground("home")} overlayOpacity={0.76}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.heroTitle}>Plan A Football City Break</Text>
              <Text style={styles.heroSub}>
                Search A City, Team, Country, League, Or Venue. Then Jump Into Fixtures Or Start A Trip Hub.
              </Text>

              <View style={styles.searchBox}>
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search City, Team, Country, League, Venue"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={dismissKeyboard}
                />
                {qNorm.length > 0 ? (
                  <Pressable onPress={clearSearch} style={styles.clearBtn} hitSlop={10}>
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Primary actions: minimal */}
              {!showSearchResults ? (
                <View style={styles.heroActions}>
                  <Pressable
                    onPress={goFixtures}
                    style={({ pressed }) => [styles.heroBtn, styles.heroBtnGhost, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                  >
                    <Text style={styles.heroBtnGhostText}>Browse Fixtures</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => goBuildTripGlobal()}
                    style={({ pressed }) => [styles.heroBtn, styles.heroBtnPrimary, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={styles.heroBtnPrimaryText}>Start A Trip Hub</Text>
                  </Pressable>
                </View>
              ) : null}

              {!showSearchResults ? (
                <Pressable
                  onPress={() => setHowOpen(true)}
                  style={({ pressed }) => [styles.subtleLink, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.subtleLinkText}>How It Works</Text>
                </Pressable>
              ) : null}

              {/* Search Results (tight, no extra chrome) */}
              {showSearchResults ? (
                <View style={styles.searchResults}>
                  {searchLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Preparing Search…</Text>
                    </View>
                  ) : null}

                  {!searchLoading && searchError ? <EmptyState title="Search Unavailable" message={searchError} /> : null}

                  {!searchLoading && !searchError ? (
                    <>
                      {(buckets.teams.length + buckets.cities.length + buckets.venues.length + buckets.countries.length + buckets.leagues.length) ===
                      0 ? (
                        <Text style={styles.groupEmpty}>No Results.</Text>
                      ) : (
                        <View style={styles.resultList}>
                          {[...buckets.teams, ...buckets.cities, ...buckets.venues, ...buckets.countries, ...buckets.leagues]
                            .slice(0, 12)
                            .map((r, idx) => (
                              <Pressable
                                key={`${r.key}-${idx}`}
                                onPress={() => onPressSearchResult(r)}
                                style={({ pressed }) => [styles.resultRow, pressed && styles.pressedRow]}
                                android_ripple={{ color: "rgba(79,224,138,0.08)" }}
                              >
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.resultTitle}>{r.title}</Text>
                                  <Text style={styles.resultMeta}>{resultMeta(r)}</Text>
                                </View>
                                <Text style={styles.chev}>›</Text>
                              </Pressable>
                            ))}
                        </View>
                      )}
                    </>
                  ) : null}
                </View>
              ) : null}

              {/* Popular: optional + compact */}
              {!showSearchResults ? (
                <View style={styles.popularBlock}>
                  <Text style={styles.sectionKicker}>Popular</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow} decelerationRate="fast">
                    {dedupedCities.map((c) => (
                      <Pressable
                        key={`pc-${c.name}`}
                        onPress={() => setQ(c.name)}
                        style={({ pressed }) => [styles.pill, pressed && styles.pressedPill]}
                        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                      >
                        <CityFlag code={c.countryCode} />
                        <Text style={styles.pillText}>{c.name}</Text>
                      </Pressable>
                    ))}
                    {dedupedTeams.map((t) => (
                      <Pressable
                        key={`pt-${t.teamId}`}
                        onPress={() => setQ(t.name)}
                        style={({ pressed }) => [styles.pill, pressed && styles.pressedPill]}
                        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                      >
                        <View style={styles.crestDot}>
                          <TeamCrest teamId={t.teamId} />
                        </View>
                        <Text style={styles.pillText}>{t.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </GlassCard>

          {/* UPCOMING (Featured + 3) */}
          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Matches</Text>
                <Pressable onPress={goFixtures} style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}>
                  <Text style={styles.miniPillText}>View All</Text>
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
                {LEAGUES.map((l) => {
                  const active = l.leagueId === league.leagueId;
                  return (
                    <Pressable
                      key={l.leagueId}
                      onPress={() => setLeague(l)}
                      style={({ pressed }) => [styles.leaguePill, active && styles.leaguePillActive, pressed && { opacity: 0.92 }]}
                      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                    >
                      <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                      <LeagueFlag code={l.countryCode} />
                    </Pressable>
                  );
                })}
              </ScrollView>

              <GlassCard strength="default" style={styles.block} noPadding>
                <View style={styles.blockInner}>
                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Loading Fixtures…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? <EmptyState title="Fixtures Unavailable" message={fxError} /> : null}

                  {!fxLoading && !fxError && !featured ? <EmptyState title="No Fixtures Found" message="Try Another League." /> : null}

                  {!fxLoading && !fxError && featured ? (
                    <>
                      <Text style={styles.blockKicker}>Featured Pick</Text>

                      <Pressable
                        onPress={() => goMatch(String(featured.fixture.id))}
                        style={({ pressed }) => [styles.featured, pressed && styles.pressedRow]}
                        android_ripple={{ color: "rgba(79,224,138,0.08)" }}
                      >
                        <View style={styles.featuredTop}>
                          <CrestSquare row={featured} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.featuredTitle}>{fixtureLine(featured).title}</Text>
                            <Text style={styles.featuredMeta}>{fixtureLine(featured).meta}</Text>
                          </View>
                          <Text style={styles.chev}>›</Text>
                        </View>
                      </Pressable>

                      {list.length > 0 ? <View style={styles.divider} /> : null}

                      <View style={styles.list}>
                        {list.map((r, idx) => {
                          const id = r?.fixture?.id ? String(r.fixture.id) : null;
                          const line = fixtureLine(r);

                          return (
                            <Pressable
                              key={id ?? `l-${idx}`}
                              onPress={() => (id ? goMatch(id) : null)}
                              disabled={!id}
                              style={({ pressed }) => [styles.listRow, pressed && styles.pressedRow]}
                              android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                            >
                              <Text style={styles.listTitle} numberOfLines={1}>
                                {line.title}
                              </Text>
                              <Text style={styles.listMeta} numberOfLines={1}>
                                {line.meta}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <View style={styles.blockActions}>
                        <Pressable
                          onPress={goFixtures}
                          style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                          android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                        >
                          <Text style={styles.btnGhostText}>Browse Fixtures</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => goBuildTripGlobal()}
                          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                        >
                          <Text style={styles.btnPrimaryText}>Start A Trip Hub</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                </View>
              </GlassCard>
            </View>
          ) : null}

          {/* TRIPS */}
          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trips</Text>
                <Pressable onPress={() => router.push("/(tabs)/trips")} style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}>
                  <Text style={styles.miniPillText}>Open</Text>
                </Pressable>
              </View>

              <GlassCard strength="default" style={styles.block} noPadding>
                <View style={styles.blockInner}>
                  {!loadedTrips ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Loading Trips…</Text>
                    </View>
                  ) : null}

                  {loadedTrips && !nextTrip ? (
                    <>
                      <Text style={styles.blockKicker}>Your Next Plan</Text>
                      <Text style={styles.emptyTitle}>No Trips Yet</Text>
                      <Text style={styles.emptyMeta}>Pick A Match And Save Everything In One Place.</Text>

                      <Pressable
                        onPress={() => goBuildTripGlobal()}
                        style={({ pressed }) => [styles.btnFull, styles.btnPrimary, pressed && styles.pressed]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <Text style={styles.btnPrimaryText}>Start A Trip Hub</Text>
                      </Pressable>
                    </>
                  ) : null}

                  {loadedTrips && nextTrip ? (
                    <Pressable
                      onPress={() => router.push({ pathname: "/trip/[id]", params: { id: nextTrip.id } } as any)}
                      style={({ pressed }) => [styles.tripCard, pressed && styles.pressedRow]}
                      android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                    >
                      <Text style={styles.blockKicker}>Next Up</Text>
                      <Text style={styles.tripTitle}>{nextTrip.cityId || "Trip"}</Text>
                      <Text style={styles.tripMeta}>{tripSummaryLine(nextTrip)}</Text>
                      <Text style={styles.tripLink}>Open Trip ›</Text>
                    </Pressable>
                  ) : null}
                </View>
              </GlassCard>
            </View>
          ) : null}

          {/* SHORTCUTS + DISCOVER (compact, premium) */}
          {!showSearchResults ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shortcuts</Text>
              <Text style={styles.sectionSub}>Fast Windows For Planning</Text>

              <View style={styles.chipGrid}>
                {shortcuts.map((s) => (
                  <Pressable
                    key={s.key}
                    onPress={() => goBuildTripGlobal(s.window)}
                    style={({ pressed }) => [styles.gridChip, pressed && styles.pressedPill]}
                    android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                  >
                    <Text style={styles.gridChipText}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Discover</Text>
              <Text style={styles.sectionSub}>Let The App Pick Something Good</Text>

              <View style={styles.discoverRow}>
                <Pressable
                  onPress={async () => {
                    // Minimal: pick a random match from the current league window
                    try {
                      const rows = await getFixtures({
                        league: league.leagueId,
                        season: league.season,
                        from: upcomingWindow.from,
                        to: upcomingWindow.to,
                      });
                      const list = (Array.isArray(rows) ? rows : []).filter((r) => r?.fixture?.id != null);
                      if (!list.length) {
                        Alert.alert("No Matches Found", "Try Another League Or Window.");
                        return;
                      }
                      const chosen = list[Math.floor(Math.random() * list.length)];
                      router.push({
                        pathname: "/trip/build",
                        params: { global: "1", fixtureId: String(chosen.fixture.id), leagueId: String(league.leagueId), season: String(league.season), from: upcomingWindow.from, to: upcomingWindow.to },
                      } as any);
                    } catch (e: any) {
                      Alert.alert("Discover Failed", e?.message ?? "Try Again.");
                    }
                  }}
                  style={({ pressed }) => [styles.discoverChip, styles.discoverPrimary, pressed && styles.pressedPill]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.discoverChipTitle}>Surprise Me</Text>
                  <Text style={styles.discoverChipMeta}>Random Match • Next 14 Days</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push("/(tabs)/fixtures")}
                  style={({ pressed }) => [styles.discoverChip, pressed && styles.pressedPill]}
                  android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                >
                  <Text style={styles.discoverChipTitle}>Browse Instead</Text>
                  <Text style={styles.discoverChipMeta}>Open Fixtures</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={{ height: 12 }} />
        </ScrollView>

        {/* HOW IT WORKS */}
        <Modal visible={howOpen} animationType="fade" transparent onRequestClose={() => setHowOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setHowOpen(false)} />
          <View style={styles.modalSheetWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>How It Works</Text>
                  <Pressable onPress={() => setHowOpen(false)} style={styles.modalClose} hitSlop={10}>
                    <Text style={styles.modalCloseText}>Done</Text>
                  </Pressable>
                </View>

                <View style={styles.howItem}>
                  <Text style={styles.howQ}>Start With A Match</Text>
                  <Text style={styles.howA}>Find Fixtures And Pick A Match That Fits Your Dates.</Text>
                </View>

                <View style={styles.howItem}>
                  <Text style={styles.howQ}>Build A Trip Hub</Text>
                  <Text style={styles.howA}>Save Links, Notes, And Bookings In One Place (Flights, Stays, Tickets).</Text>
                </View>

                <View style={styles.howItem}>
                  <Text style={styles.howQ}>Use Guides When Available</Text>
                  <Text style={styles.howA}>City And Team Guidance Helps You Plan The Break Beyond The Match.</Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable onPress={goFixtures} style={[styles.btn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Browse Fixtures</Text>
                  </Pressable>
                  <Pressable onPress={() => goBuildTripGlobal()} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Start A Trip Hub</Text>
                  </Pressable>
                </View>
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

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 18,
  },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  pressedRow: { opacity: 0.94 },
  pressedPill: { opacity: 0.92 },

  // HERO
  hero: { marginTop: theme.spacing.lg, borderRadius: 26 },
  heroInner: { padding: theme.spacing.lg, gap: 10 },

  heroTitle: {
    color: theme.colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },
  heroSub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
    opacity: 0.94,
  },

  searchBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.bold,
    paddingVertical: 0,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  clearText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  heroActions: { flexDirection: "row", gap: 10, marginTop: 4 },

  heroBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  heroBtnPrimary: {
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  heroBtnPrimaryText: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  heroBtnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  heroBtnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  subtleLink: { alignSelf: "flex-start", marginTop: 2, paddingVertical: 6, paddingHorizontal: 2 },
  subtleLinkText: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },

  // Search results
  searchResults: { marginTop: 10, gap: 10 },
  resultList: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.22)" : "rgba(10,12,14,0.18)",
  },
  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  resultTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  resultMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },
  chev: { color: theme.colors.textTertiary, fontSize: 22, marginTop: -2 },

  groupEmpty: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // Popular (compact)
  popularBlock: { marginTop: 4, gap: 8 },
  sectionKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.3 },
  popularRow: { gap: 10, paddingRight: theme.spacing.lg, paddingVertical: 4 },

  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(18,20,24,0.32)" : "rgba(18,20,24,0.26)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillText: { color: "rgba(242,244,246,0.78)", fontSize: 13, fontWeight: theme.fontWeight.black },
  cityFlag: { width: 16, height: 12, borderRadius: 3, opacity: 0.92 },

  crestDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  teamCrest: { width: 14, height: 14, opacity: 0.95 },

  // Sections
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  sectionSub: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, marginTop: -4 },

  miniPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  miniPillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  // League selector
  leagueRow: { gap: 10, paddingRight: theme.spacing.lg, marginTop: 2 },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.black },
  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  // Blocks
  block: { borderRadius: 24 },
  blockInner: { padding: 14, gap: 12 },
  blockKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.3 },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // Featured fixture
  featured: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(12,14,16,0.22)" : "rgba(12,14,16,0.18)",
    overflow: "hidden",
  },
  featuredTop: { paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  featuredTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  featuredMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  crestWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestImg: { width: 28, height: 28, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.4 },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 2 },

  list: { gap: 8 },
  listRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  listTitle: { color: theme.colors.text, fontSize: 13, fontWeight: theme.fontWeight.black },
  listMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  blockActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  btnFull: { borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },

  btnPrimary: {
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  // Trips card
  emptyTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  emptyMeta: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 18 },

  tripCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(12,14,16,0.20)" : "rgba(12,14,16,0.16)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tripTitle: { marginTop: 6, color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  tripMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },
  tripLink: { marginTop: 10, color: "rgba(79,224,138,0.78)", fontSize: 12, fontWeight: theme.fontWeight.black },

  // Compact chip grid
  chipGrid: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  gridChipText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },

  // Discover compact
  discoverRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  discoverChip: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  discoverPrimary: { borderColor: "rgba(79,224,138,0.24)" },
  discoverChipTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  discoverChipMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

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

  howItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(12,14,16,0.20)" : "rgba(12,14,16,0.16)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  howQ: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  howA: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 18 },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
});
