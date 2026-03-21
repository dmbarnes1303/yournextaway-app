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
const HOME_PREFETCH_LIMIT = 2;
const HOME_PREFETCH_DELAY_MS = 900;

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

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().catch(() => {});
    }

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
  const [fxRefreshing, setFxRefreshing] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);
  const activeFixtureRequestRef = useRef(0);
  const prefetchedKeysRef = useRef(new Set<string>());

  const fixtureWindowKey = useMemo(() => {
    return `${league.leagueId}|${league.season}|${upcomingWindow.from}|${upcomingWindow.to}`;
  }, [league.leagueId, league.season, upcomingWindow.from, upcomingWindow.to]);

  useEffect(() => {
    let cancelled = false;
    const requestId = activeFixtureRequestRef.current + 1;
    activeFixtureRequestRef.current = requestId;

    async function run() {
      const hasExistingRows = fxRows.length > 0;

      if (hasExistingRows) {
        setFxRefreshing(true);
      } else {
        setFxLoading(true);
      }

      setFxError(null);

      try {
        const rows = await getFixtures({
          league: league.leagueId,
          season: league.season,
          from: upcomingWindow.from,
          to: upcomingWindow.to,
        });

        if (cancelled || activeFixtureRequestRef.current !== requestId) return;

        setFxRows(Array.isArray(rows) ? rows : []);
        setFxError(null);
      } catch (e: any) {
        if (cancelled || activeFixtureRequestRef.current !== requestId) return;

        const message = e?.message ?? "Failed to load fixtures.";

        if ((fxRows?.length ?? 0) === 0) {
          setFxRows([]);
          setFxError(message);
        } else {
          setFxError(null);
        }
      } finally {
        if (!cancelled && activeFixtureRequestRef.current === requestId) {
          setFxLoading(false);
          setFxRefreshing(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [fixtureWindowKey]);

  useEffect(() => {
    let cancelled = false;

    const currentKey = fixtureWindowKey;
    if (prefetchedKeysRef.current.has(currentKey)) return;

    const timeout = setTimeout(() => {
      async function prefetchOtherHomeLeagues() {
        const targets = homeTopLeagues
          .filter((l) => l.leagueId !== league.leagueId)
          .slice(0, HOME_PREFETCH_LIMIT);

        await Promise.all(
          targets.map(async (item) => {
            if (cancelled) return;

            try {
              await getFixtures({
                league: item.leagueId,
                season: item.season,
                from: upcomingWindow.from,
                to: upcomingWindow.to,
              });
            } catch {
              return;
            }
          })
        );

        if (!cancelled) {
          prefetchedKeysRef.current.add(currentKey);
        }
      }

      prefetchOtherHomeLeagues().catch(() => null);
    }, HOME_PREFETCH_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [
    fixtureWindowKey,
    homeTopLeagues,
    league.leagueId,
    upcomingWindow.from,
    upcomingWindow.to,
  ]);

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
  const [, setSearchBuiltAt] = useState<number>(0);
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
  }, [qDebounced]);

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

  const logoSource = useMemo(() => require("@/src/YNAlogo.png"), []);

  const showInitialFixtureLoading = fxLoading && fxRows.length === 0;
  const showFixtureError = !!fxError && fxRows.length === 0;

  return (
    <Background mode="solid" solidColor="#07090B">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassCard variant="brand" strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroGoldLine} pointerEvents="none" />
            <View style={styles.heroGlowLeft} pointerEvents="none" />
            <View style={styles.heroGlowRight} pointerEvents="none" />

            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <View style={styles.logoShell}>
                  <View style={styles.logoOuterGlow} />
                  <View style={styles.logoWrap}>
                    <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                  </View>
                </View>

                <View style={styles.heroCopyWrap}>
                  <Text style={styles.heroEyebrow}>Home</Text>
                  <Text style={styles.heroTitle}>Search teams, cities or countries</Text>
                  <Text style={styles.heroSub}>
                    Jump straight into guides, fixtures and trip planning.
                  </Text>
                </View>
              </View>

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

              {!showSearchResults ? (
                <View style={styles.quickRow}>
                  <Pressable
                    onPress={goFixturesHub}
                    style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
                  >
                    <Text style={styles.quickPillText}>Next 14 days</Text>
                  </Pressable>
                </View>
              ) : null}

              {showSearchResults ? (
                <View style={styles.searchResults}>
                  {searchBuilding ? (
                    <View style={styles.centerInline}>
                      <ActivityIndicator color={theme.colors.accentGold} />
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
                            android_ripple={{ color: "rgba(34,197,94,0.08)" }}
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
            <View style={styles.surface}>
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
                fxLoading={showInitialFixtureLoading}
                fxError={showFixtureError ? fxError : null}
                featured={featured}
                list={list}
                featuredCityImage={featuredCityImage}
                fixtureLine={fixtureLine}
                goFixtures={goFixtures}
                goFixturesHub={goFixturesHub}
                goMatch={goMatch}
              />

              {fxRefreshing && fxRows.length > 0 ? (
                <View style={styles.refreshingBadge}>
                  <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                  <Text style={styles.refreshingText}>Refreshing fixtures…</Text>
                </View>
              ) : null}
            </View>
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
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(133,255,91,0.18)",
    backgroundColor: "#07140F",
    overflow: "hidden",
    shadowColor: "#00D26A",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },

  heroGoldLine: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(245,204,87,0.55)",
  },

  heroGlowLeft: {
    position: "absolute",
    top: -30,
    left: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.12)",
  },

  heroGlowRight: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(245,204,87,0.07)",
  },

  heroInner: {
    padding: 18,
    gap: 14,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  logoShell: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },

  logoOuterGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.10)",
  },

  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logo: {
    width: 52,
    height: 52,
  },

  heroCopyWrap: {
    flex: 1,
    gap: 3,
  },

  heroEyebrow: {
    color: "#F5CC57",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  heroTitle: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.15,
  },

  heroSub: {
    color: "rgba(234,240,236,0.82)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
  },

  searchBox: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: "rgba(75,201,115,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.03)",
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
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  clearText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
  },

  quickPill: {
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(102,232,128,0.28)",
    backgroundColor: "rgba(12,92,44,0.34)",
    alignSelf: "flex-start",
  },

  quickPillPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  quickPillText: {
    color: "#88F0A2",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  searchResults: {
    marginTop: 2,
    gap: 10,
  },

  resultList: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor:
      Platform.OS === "android" ? "rgba(6,10,8,0.34)" : "rgba(6,10,8,0.30)",
  },

  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
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

  surface: {
    marginTop: -2,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 18,
  },

  refreshingBadge: {
    marginTop: -8,
    alignSelf: "flex-start",
    marginLeft: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  refreshingText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  pressedRow: {
    opacity: 0.94,
  },
});
