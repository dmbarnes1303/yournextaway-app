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

const API_SPORTS_TEAM_LOGO = (teamId: number) => `https://media.api-sports.io/football/teams/${teamId}.png`;

type ShortcutWindow = { from: string; to: string };

type CityChip = { name: string; countryCode: string };
type TeamChip = { name: string; teamId: number };

// Popular cities/teams (Home-only)
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

// Home should NOT show 25+ leagues. Curate top leagues for Home scroller only.
const HOME_TOP_LEAGUE_IDS = new Set<number>([
  39, // Premier League
  140, // La Liga
  135, // Serie A
  78, // Bundesliga
  61, // Ligue 1
  88, // Eredivisie
  94, // Primeira Liga
  203, // Super Lig (optional)
]);

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

function TeamCrest({ teamId, size = 14 }: { teamId: number; size?: number }) {
  const uri = API_SPORTS_TEAM_LOGO(teamId);
  return <Image source={{ uri }} style={{ width: size, height: size, opacity: 0.95 }} resizeMode="contain" />;
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
    if (day === 5 || day === 6 || day === 0) s += 10;
    const hr = dt.getHours();
    if (hr >= 17 && hr <= 21) s += 6;
  }

  return s;
}

export default function HomeScreen() {
  const router = useRouter();

  const homeTopLeagues = useMemo(() => {
    const list = LEAGUES.filter((l) => HOME_TOP_LEAGUE_IDS.has(l.leagueId));
    // Fallback to first 6 if IDs drift
    return list.length ? list : LEAGUES.slice(0, 6);
  }, []);

  const [league, setLeague] = useState<LeagueOption>(homeTopLeagues[0] ?? LEAGUES[0]);

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

  const goFixturesAll = useCallback(() => {
    router.push({ pathname: "/(tabs)/fixtures" } as any);
  }, [router]);

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

  const cities = useMemo(() => dedupeBy(POPULAR_CITIES, (c) => toKey(c.name)).slice(0, 5), []);
  const teams = useMemo(() => dedupeBy(POPULAR_TEAMS, (t) => String(t.teamId)).slice(0, 5), []);

  // Modals
  const [howOpen, setHowOpen] = useState(false);

  return (
    <Background imageSource={getBackground("home")} overlayOpacity={0.76}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* HERO */}
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.heroTitle}>Plan A Football City Break</Text>
              <Text style={styles.heroSub}>Search A City, Team, Country, League, Or Venue. Then Jump Into Fixtures Or Start A Trip Hub.</Text>

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

              {/* Primary actions */}
              {!showSearchResults ? (
                <>
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

                  {/* Intentional tertiary action */}
                  <Pressable
                    onPress={() => setHowOpen(true)}
                    style={({ pressed }) => [styles.howPill, pressed && { opacity: 0.92 }]}
                    android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                  >
                    <Text style={styles.howPillText}>How It Works</Text>
                  </Pressable>
                </>
              ) : null}

              {/* Search Results */}
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
                      {(buckets.teams.length + buckets.cities.length + buckets.venues.length + buckets.countries.length + buckets.leagues.length) === 0 ? (
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

              {/* Popular (clear + premium chips) */}
              {!showSearchResults ? (
                <View style={styles.popularBlock}>
                  <Text style={styles.sectionKicker}>Popular Cities</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow} decelerationRate="fast">
                    {cities.map((c) => (
                      <CityChipPremium
                        key={`pc-${c.name}`}
                        name={c.name}
                        countryCode={c.countryCode}
                        onPress={() => setQ(c.name)}
                      />
                    ))}
                  </ScrollView>

                  <Text style={[styles.sectionKicker, { marginTop: 10 }]}>Popular Teams</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow} decelerationRate="fast">
                    {teams.map((t) => (
                      <Pressable
                        key={`pt-${t.teamId}`}
                        onPress={() => setQ(t.name)}
                        style={({ pressed }) => [styles.teamPill, pressed && styles.pressedPill]}
                        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                      >
                        <View style={styles.teamCrestDot}>
                          <TeamCrest teamId={t.teamId} size={16} />
                        </View>
                        <Text style={styles.pillText}>{t.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </GlassCard>

          {/* UPCOMING */}
          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Matches</Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable onPress={goFixturesAll} style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}>
                    <Text style={styles.miniPillText}>More Leagues</Text>
                  </Pressable>

                  <Pressable onPress={goFixtures} style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}>
                    <Text style={styles.miniPillText}>View All</Text>
                  </Pressable>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
                {homeTopLeagues.map((l) => {
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
                          const homeLogo = r?.teams?.home?.logo;
                          const awayLogo = r?.teams?.away?.logo;

                          return (
                            <Pressable
                              key={id ?? `l-${idx}`}
                              onPress={() => (id ? goMatch(id) : null)}
                              disabled={!id}
                              style={({ pressed }) => [styles.listRow, pressed && styles.pressedRow]}
                              android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                            >
                              <View style={styles.listRowTop}>
                                <View style={styles.smallCrests}>
                                  <View style={styles.smallCrest}>
                                    {homeLogo ? <Image source={{ uri: homeLogo }} style={styles.smallCrestImg} resizeMode="contain" /> : null}
                                  </View>
                                  <View style={styles.smallCrest}>
                                    {awayLogo ? <Image source={{ uri: awayLogo }} style={styles.smallCrestImg} resizeMode="contain" /> : null}
                                  </View>
                                </View>

                                <Text style={styles.listTitle} numberOfLines={1}>
                                  {line.title}
                                </Text>
                              </View>

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
                  <Text style={styles.howA}>Browse Fixtures And Pick A Match That Fits Your Dates.</Text>
                </View>

                <View style={styles.howItem}>
                  <Text style={styles.howQ}>Build A Trip Hub</Text>
                  <Text style={styles.howA}>Save Links, Notes, And Bookings In One Place (Flights, Stays, Tickets).</Text>
                </View>

                <View style={styles.howItem}>
                  <Text style={styles.howQ}>Use Guides When Available</Text>
                  <Text style={styles.howA}>City And Team Guidance Helps You Plan Beyond The Match.</Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable onPress={() => { setHowOpen(false); goFixtures(); }} style={[styles.btn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Browse Fixtures</Text>
                  </Pressable>
                  <Pressable onPress={() => { setHowOpen(false); goBuildTripGlobal(); }} style={[styles.btn, styles.btnPrimary]}>
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

/**
 * Premium City Chip: “flag as subtle background”
 * (This is the look you described—without needing custom waving assets.)
 */
function CityChipPremium({
  name,
  countryCode,
  onPress,
}: {
  name: string;
  countryCode: string;
  onPress: () => void;
}) {
  const flagUrl = getFlagImageUrl(countryCode, { size: 96 });

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cityPill, pressed && styles.pressedPill]} android_ripple={{ color: "rgba(255,255,255,0.08)" }}>
      {flagUrl ? (
        <Image source={{ uri: flagUrl }} style={styles.cityFlagBg} resizeMode="cover" />
      ) : null}
      <View pointerEvents="none" style={styles.cityPillOverlay} />
      <Text style={styles.pillText}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: 18 },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  pressedRow: { opacity: 0.94 },
  pressedPill: { opacity: 0.92 },

  // HERO
  hero: { marginTop: theme.spacing.lg, borderRadius: 26 },
  heroInner: { padding: theme.spacing.lg, gap: 10 },

  heroTitle: { color: theme.colors.text, fontSize: 26, lineHeight: 32, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },
  heroSub: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: theme.fontWeight.bold, opacity: 0.94 },

  // Search (taller + more premium)
  searchBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 0,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.bold,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  clearText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  heroActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  heroBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
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

  // How it works (intentional tertiary)
  howPill: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    overflow: "hidden",
  },
  howPillText: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },

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
  groupEmpty: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  chev: { color: theme.colors.textTertiary, fontSize: 22, marginTop: -2 },

  // Popular
  popularBlock: { marginTop: 4, gap: 8 },
  sectionKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.3 },
  popularRow: { gap: 10, paddingRight: theme.spacing.lg, paddingVertical: 4 },

  // City pill w/ subtle background flag
  cityPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(18,20,24,0.32)" : "rgba(18,20,24,0.26)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: "hidden",
    justifyContent: "center",
  },
  cityFlagBg: {
    position: "absolute",
    right: -10,
    top: -10,
    bottom: -10,
    width: 90,
    opacity: 0.22,
    borderRadius: 18,
  },
  cityPillOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  pillText: { color: "rgba(242,244,246,0.78)", fontSize: 13, fontWeight: theme.fontWeight.black },

  // Team pills
  teamPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(18,20,24,0.32)" : "rgba(18,20,24,0.26)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  teamCrestDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  // Sections
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },

  miniPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  miniPillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  // League selector (Home top leagues only)
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
  listRowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  smallCrests: { flexDirection: "row", gap: 6, alignItems: "center" },
  smallCrest: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  smallCrestImg: { width: 14, height: 14, opacity: 0.95 },

  listTitle: { flex: 1, color: theme.colors.text, fontSize: 13, fontWeight: theme.fontWeight.black },
  listMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  blockActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  btnPrimary: { borderColor: "rgba(79,224,138,0.24)", backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default },
  btnPrimaryText: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  btnGhost: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  modalSheetWrap: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderRadius: 22, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, overflow: "hidden" },
  modalInner: { padding: 14, gap: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: theme.fontWeight.black },
  modalClose: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.18)" },
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
