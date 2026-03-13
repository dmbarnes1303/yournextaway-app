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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
import {
  buildSearchIndex,
  querySearchIndex,
  type SearchResult,
} from "@/src/services/searchIndex";
import { hasTeamGuide } from "@/src/data/teamGuides";
import { getCityGuide } from "@/src/data/cityGuides";
import { getFlagImageUrl } from "@/src/utils/flagImages";
import { getCityImageUrl } from "@/src/data/cityImages";

import ContinuePlanning from "@/src/features/home/ContinuePlanning";
import UpcomingMatches from "@/src/features/home/UpcomingMatches";

const HOME_TOP_LEAGUE_IDS = new Set<number>([39, 140, 135, 78, 61, 88, 94]);

const API_SPORTS_TEAM_LOGO = (teamId: number) =>
  `https://media.api-sports.io/football/teams/${teamId}.png`;

type ShortcutWindow = { from: string; to: string };

function titleFromSlug(s: string) {
  const clean = String(s ?? "").trim();
  if (!clean) return "";
  const spaced = clean.replace(/[-_]+/g, " ");
  return spaced.replace(/\b\w/g, (m) => m.toUpperCase());
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

function scoreFixture(r: FixtureListRow): number {
  let s = 0;

  const leagueId = r?.league?.id;
  if (leagueId === 39) s += 120;
  else if (leagueId === 140) s += 105;
  else if (leagueId === 135) s += 100;
  else if (leagueId === 78) s += 95;
  else if (leagueId === 61) s += 90;
  else if (leagueId === 88) s += 82;
  else if (leagueId === 94) s += 80;
  else s += 60;

  const venue = String(r?.fixture?.venue?.name ?? "").trim();
  const city = String(r?.fixture?.venue?.city ?? "").trim();
  if (venue) s += 10;
  if (city) s += 6;

  const dt = r?.fixture?.date ? new Date(r.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) {
    const day = dt.getDay();
    if (day === 5 || day === 6 || day === 0) s += 12;
    const hr = dt.getHours();
    if (hr >= 17 && hr <= 21) s += 8;
  }

  return s;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const homeTopLeagues = useMemo(() => {
    const list = LEAGUES.filter((l) => HOME_TOP_LEAGUE_IDS.has(l.leagueId));
    return list.length ? list : LEAGUES.slice(0, 6);
  }, []);

  const [league, setLeague] = useState<LeagueOption>(homeTopLeagues[0] ?? LEAGUES[0]);

  const { from: fromIso, to: toIso } = useMemo(() => getRollingWindowIso(), []);
  const upcomingWindow = useMemo(() => windowFromTomorrowIso(14), []);

  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoadedTrips(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) tripsStore.loadTrips().catch(() => {});

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

  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setFxLoading(true);
      setFxError(null);

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
        setFxError(e?.message ?? "Failed to load fixtures.");
        setFxRows([]);
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
    return (fxRows ?? [])
      .filter((r) => r?.fixture?.id != null)
      .map((r) => ({ r, s: scoreFixture(r) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r);
  }, [fxRows]);

  const featured = useMemo(() => fxOrdered[0] ?? null, [fxOrdered]);
  const list = useMemo(() => fxOrdered.slice(1, 4), [fxOrdered]);

  const [q, setQ] = useState("");
  const qNorm = useMemo(() => q.trim(), [q]);
  const qDebounced = useDebouncedValue(qNorm, 140);
  const showSearchResults = qNorm.length > 0;

  const [searchBuilding, setSearchBuilding] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchBuiltAt, setSearchBuiltAt] = useState<number>(0);
  const indexRef = useRef<Awaited<ReturnType<typeof buildSearchIndex>> | null>(null);
  const buildOnceRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function ensureIndex() {
      if (!showSearchResults || indexRef.current || buildOnceRef.current) return;

      buildOnceRef.current = true;
      setSearchBuilding(true);
      setSearchError(null);

      try {
        const idx = await buildSearchIndex({ from: fromIso, to: toIso, leagues: LEAGUES });
        if (cancelled) return;
        indexRef.current = idx;
        setSearchBuiltAt(idx.builtAt);
      } catch (e: any) {
        if (cancelled) return;
        setSearchError(e?.message ?? "Search index failed to build.");
      } finally {
        if (!cancelled) setSearchBuilding(false);
      }
    }

    ensureIndex().catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [showSearchResults, fromIso, toIso]);

  const rawSearchResults = useMemo(() => {
    const idx = indexRef.current;
    if (!idx || !qDebounced) return [];
    return querySearchIndex(idx, qDebounced, { limit: 16 });
  }, [qDebounced, searchBuiltAt]);

  const buckets = useMemo(() => splitSearchBuckets(rawSearchResults), [rawSearchResults]);

  const clearSearch = useCallback(() => {
    setQ("");
    Keyboard.dismiss();
  }, []);

  const goFixtures = useCallback(
    (opts?: {
      window?: ShortcutWindow;
      leagueId?: number;
      season?: number;
      sort?: "rating" | "date";
      venue?: string;
    }) => {
      const w = opts?.window ?? getRollingWindowIso({ days: 60 });

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: w.from,
          to: w.to,
          ...(opts?.leagueId ? { leagueId: String(opts.leagueId) } : {}),
          ...(opts?.season ? { season: String(opts.season) } : {}),
          ...(opts?.sort ? { sort: String(opts.sort) } : {}),
          ...(opts?.venue ? { venue: String(opts.venue) } : {}),
        },
      } as any);
    },
    [router]
  );

  const goDiscover = useCallback(() => {
    router.push("/(tabs)/discover" as any);
  }, [router]);

  const goTrips = useCallback(() => {
    router.push("/(tabs)/trips" as any);
  }, [router]);

  const goFixturesHub = useCallback(() => {
    goFixtures({ window: windowFromTomorrowIso(14) });
  }, [goFixtures]);

  const goMatch = useCallback(
    (fixtureId: string) => {
      router.push({
        pathname: "/match/[id]",
        params: {
          id: fixtureId,
          leagueId: String(league.leagueId),
          season: String(league.season),
          from: fromIso,
          to: toIso,
        },
      } as any);
    },
    [router, league.leagueId, league.season, fromIso, toIso]
  );

  const goCityKey = useCallback(
    (cityKey: string) => {
      const ck = String(cityKey ?? "").trim();
      if (!ck) return;

      Keyboard.dismiss();
      setQ("");

      router.push({
        pathname: "/city/key/[cityKey]",
        params: { cityKey: ck, from: fromIso, to: toIso },
      } as any);
    },
    [router, fromIso, toIso]
  );

  const onPressSearchResult = useCallback(
    (r: SearchResult) => {
      const p: any = r.payload;

      if (p?.kind === "team") {
        Keyboard.dismiss();
        setQ("");
        router.push({
          pathname: "/team/[teamKey]",
          params: { teamKey: p.slug, from: fromIso, to: toIso },
        } as any);
        return;
      }

      if (p?.kind === "city") {
        goCityKey(p.slug);
        return;
      }

      if (p?.kind === "venue") {
        const venueName = String(r.title ?? "").trim();
        Keyboard.dismiss();
        setQ("");
        goFixtures({ window: { from: fromIso, to: toIso }, venue: venueName });
        return;
      }

      if (p?.kind === "country" || p?.kind === "league") {
        Keyboard.dismiss();
        setQ("");
        goFixtures({
          window: { from: fromIso, to: toIso },
          leagueId: Number(p.leagueId),
          season: Number(p.season),
        });
      }
    },
    [router, fromIso, toIso, goCityKey, goFixtures]
  );

  const resultMeta = useCallback((r: SearchResult): string => {
    const p: any = r.payload;

    if (r.type === "team" && p?.kind === "team") {
      return hasTeamGuide(p.slug) ? "Team guide available" : "Team guide coming soon";
    }

    if (r.type === "city" && p?.kind === "city") {
      return getCityGuide(p.slug) ? "City guide available" : "City guide coming soon";
    }

    return r.subtitle ?? "";
  }, []);

  const flatSearchResults = useMemo(
    () =>
      [
        ...buckets.teams,
        ...buckets.cities,
        ...buckets.venues,
        ...buckets.countries,
        ...buckets.leagues,
      ].slice(0, 12),
    [buckets]
  );

  const nextTripCityTitle = useMemo(() => {
    if (!nextTrip) return "";
    const raw = (nextTrip as any).cityName || (nextTrip as any).city || nextTrip.cityId || "Trip";
    return titleFromSlug(String(raw));
  }, [nextTrip]);

  const nextTripCountryCode = useMemo(() => {
    if (!nextTrip) return "";
    const raw =
      (nextTrip as any).countryCode ||
      (nextTrip as any).country ||
      (nextTrip as any).countryIso ||
      (nextTrip as any).countryISO ||
      "";
    return String(raw).toUpperCase();
  }, [nextTrip]);

  const nextTripFlagUrl = useMemo(() => {
    if (!nextTripCountryCode) return "";
    return getFlagImageUrl(nextTripCountryCode, { size: 48 }) ?? "";
  }, [nextTripCountryCode]);

  const nextTripTeamId = useMemo(() => {
    if (!nextTrip) return null;
    const raw =
      (nextTrip as any).teamId ||
      (nextTrip as any).homeTeamId ||
      (nextTrip as any).primaryTeamId ||
      (nextTrip as any).clubTeamId ||
      null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [nextTrip]);

  const nextTripCityImage = useMemo(() => {
    if (!nextTrip) return getCityImageUrl("london");
    const raw =
      (nextTrip as any).cityName ||
      (nextTrip as any).city ||
      nextTrip.cityId ||
      nextTripCityTitle ||
      "Trip";
    return getCityImageUrl(String(raw));
  }, [nextTrip, nextTripCityTitle]);

  const featuredCityImage = useMemo(() => {
    const city = String(featured?.fixture?.venue?.city ?? "").trim();
    return getCityImageUrl(city || "london");
  }, [featured]);

  const logoSource = useMemo(() => require("@/src/yna-logo.png"), []);

  return (
    <Background
      imageSource={getBackground("home")}
      overlayOpacity={0.06}
      topShadeOpacity={0.42}
      bottomShadeOpacity={0.46}
      centerShadeOpacity={0.05}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 26 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <View style={styles.logoWrap}>
                  <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                </View>
              </View>

              <Text style={styles.heroTitle}>Plan • Fly • Watch • Repeat</Text>
              <Text style={styles.heroSub}>
                Search by team, city or country and go straight where you need.
              </Text>

              <View style={styles.searchBox}>
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search team, city or country"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />

                {qNorm.length > 0 ? (
                  <Pressable onPress={clearSearch} style={styles.clearBtn} hitSlop={10}>
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>

              {showSearchResults ? (
                <View style={styles.searchResults}>
                  {searchBuilding ? (
                    <View style={styles.centerInline}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Preparing search…</Text>
                    </View>
                  ) : null}

                  {!searchBuilding && searchError ? (
                    <EmptyState title="Search unavailable" message={searchError} />
                  ) : null}

                  {!searchBuilding && !searchError ? (
                    flatSearchResults.length === 0 ? (
                      <Text style={styles.groupEmpty}>No results.</Text>
                    ) : (
                      <View style={styles.resultList}>
                        {flatSearchResults.map((r, idx) => (
                          <Pressable
                            key={`${r.key}-${idx}`}
                            onPress={() => onPressSearchResult(r)}
                            style={({ pressed }) => [
                              styles.resultRow,
                              idx === 0 ? styles.resultRowFirst : null,
                              pressed && styles.pressedRow,
                            ]}
                            android_ripple={{ color: "rgba(87,162,56,0.08)" }}
                          >
                            <View style={styles.resultTextWrap}>
                              <Text style={styles.resultTitle}>{r.title}</Text>
                              <Text style={styles.resultMeta}>{resultMeta(r)}</Text>
                            </View>
                            <Text style={styles.chev}>›</Text>
                          </Pressable>
                        ))}
                      </View>
                    )
                  ) : null}
                </View>
              ) : null}
            </View>
          </GlassCard>

          {!showSearchResults ? (
            <>
              <ContinuePlanning
                loadedTrips={loadedTrips}
                nextTrip={nextTrip}
                nextTripCityImage={nextTripCityImage}
                nextTripFlagUrl={nextTripFlagUrl}
                nextTripTeamId={nextTripTeamId}
                nextTripCityTitle={nextTripCityTitle}
                apiSportsTeamLogo={API_SPORTS_TEAM_LOGO}
                tripSummaryLine={tripSummaryLine}
                goTrips={goTrips}
                goDiscover={goDiscover}
                goFixturesHub={goFixturesHub}
                onOpenTrip={(tripId) =>
                  router.push({ pathname: "/trip/[id]", params: { id: tripId } } as any)
                }
              />

              <UpcomingMatches
                homeTopLeagues={homeTopLeagues}
                league={league}
                setLeague={setLeague}
                upcomingWindow={upcomingWindow}
                fxLoading={fxLoading}
                fxError={fxError}
                featured={featured}
                list={list}
                featuredCityImage={featuredCityImage}
                fixtureLine={fixtureLine}
                goFixtures={goFixtures}
                goFixturesHub={goFixturesHub}
                goMatch={goMatch}
              />
            </>
          ) : null}
        </ScrollView>
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

  hero: {
    marginTop: theme.spacing.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  heroInner: {
    padding: 18,
    gap: 10,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 2,
  },

  logoWrap: {
    width: 46,
    height: 46,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 36,
    height: 36,
    opacity: 0.98,
  },

  heroTitle: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  heroSub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
    opacity: 0.96,
    maxWidth: "92%",
  },

  searchBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
    borderRadius: 18,
    paddingHorizontal: 14,
    minHeight: 56,
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

  clearText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  searchResults: {
    marginTop: 10,
    gap: 10,
  },

  resultList: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.24)" : "rgba(10,12,14,0.20)",
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

  resultRowFirst: {
    borderTopWidth: 0,
  },

  resultTextWrap: {
    flex: 1,
  },

  resultTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  resultMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  groupEmpty: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  centerInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  chev: {
    color: theme.colors.textTertiary,
    fontSize: 22,
    marginTop: -2,
  },

  pressedRow: {
    opacity: 0.94,
  },
});
