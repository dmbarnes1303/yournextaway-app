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
const HOME_MATCH_WINDOW_DAYS = 45;

const API_SPORTS_TEAM_LOGO = (teamId: number) =>
  `https://media.api-sports.io/football/teams/${teamId}.png`;

type ShortcutWindow = { from: string; to: string };

type TripIdea = {
  key: string;
  cityKey: string;
  title: string;
  hook: string;
};

const MARQUEE_TEAM_TERMS = [
  "arsenal",
  "aston villa",
  "atletico",
  "atlético",
  "ajax",
  "bayern",
  "benfica",
  "borussia dortmund",
  "barcelona",
  "celtic",
  "chelsea",
  "dortmund",
  "fenerbahce",
  "fenerbahçe",
  "galatasaray",
  "inter",
  "juventus",
  "lazio",
  "liverpool",
  "manchester city",
  "manchester united",
  "milan",
  "napoli",
  "newcastle",
  "olympiacos",
  "porto",
  "psg",
  "paris saint-germain",
  "real madrid",
  "roma",
  "rangers",
  "sl benfica",
  "sporting",
  "tottenham",
  "tottenham hotspur",
  "west ham",
];

const DESTINATION_CITY_TERMS = [
  "amsterdam",
  "barcelona",
  "benfica",
  "berlin",
  "bilbao",
  "dortmund",
  "florence",
  "glasgow",
  "istanbul",
  "lisbon",
  "liverpool",
  "london",
  "madrid",
  "manchester",
  "milan",
  "munich",
  "naples",
  "napoli",
  "porto",
  "prague",
  "rome",
  "san sebastian",
  "seville",
  "turin",
  "valencia",
  "vienna",
];

const ICONIC_VENUE_TERMS = [
  "allianz arena",
  "anfield",
  "bernabeu",
  "camp nou",
  "celtic park",
  "emet",
  "emirates",
  "estadio da luz",
  "ibrox",
  "johan cruijff arena",
  "mestalla",
  "old trafford",
  "olympico",
  "san siro",
  "signal iduna park",
  "stamford bridge",
  "tottenham hotspur stadium",
  "wanda metropolitano",
  "wembley",
];

const RIVALRY_PATTERNS: Array<readonly [string, string]> = [
  ["arsenal", "tottenham"],
  ["barcelona", "real madrid"],
  ["bayern", "dortmund"],
  ["celtic", "rangers"],
  ["chelsea", "arsenal"],
  ["chelsea", "tottenham"],
  ["everton", "liverpool"],
  ["inter", "milan"],
  ["lazio", "roma"],
  ["manchester city", "manchester united"],
  ["newcastle", "sunderland"],
  ["real madrid", "atletico"],
  ["roma", "napoli"],
  ["tottenham", "west ham"],
];

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

function includesAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(term));
}

function hasRivalryBoost(home: string, away: string) {
  const h = home.toLowerCase();
  const a = away.toLowerCase();

  return RIVALRY_PATTERNS.some(([x, y]) => {
    return (h.includes(x) && a.includes(y)) || (h.includes(y) && a.includes(x));
  });
}

function leagueBaseScore(leagueId?: number | null) {
  if (leagueId === 39) return 130;
  if (leagueId === 140) return 116;
  if (leagueId === 135) return 112;
  if (leagueId === 78) return 104;
  if (leagueId === 61) return 98;
  if (leagueId === 88) return 92;
  if (leagueId === 94) return 90;
  return 68;
}

function kickoffTimingScore(dt: Date) {
  const day = dt.getDay();
  const hr = dt.getHours();

  let s = 0;

  if (day === 6) s += 22;
  else if (day === 0) s += 18;
  else if (day === 5) s += 14;
  else if (day === 3 || day === 2) s += 6;
  else if (day === 1 || day === 4) s += 2;

  if (day === 6 && hr >= 14 && hr <= 20) s += 12;
  else if (day === 0 && hr >= 13 && hr <= 19) s += 9;
  else if (day === 5 && hr >= 18 && hr <= 21) s += 8;
  else if (hr >= 17 && hr <= 21) s += 7;
  else if (hr >= 12 && hr <= 16) s += 3;

  return s;
}

function scoreFixture(r: FixtureListRow): number {
  let s = 0;

  const leagueId = r?.league?.id;
  const home = String(r?.teams?.home?.name ?? "").trim();
  const away = String(r?.teams?.away?.name ?? "").trim();
  const venue = String(r?.fixture?.venue?.name ?? "").trim();
  const city = String(r?.fixture?.venue?.city ?? "").trim();

  const combinedTeams = `${home} ${away}`.toLowerCase();
  const combinedLocation = `${venue} ${city}`.toLowerCase();

  s += leagueBaseScore(leagueId);

  if (venue) s += 10;
  if (city) s += 8;

  if (includesAny(combinedTeams, MARQUEE_TEAM_TERMS)) s += 18;
  if (includesAny(city.toLowerCase(), DESTINATION_CITY_TERMS)) s += 16;
  if (includesAny(combinedLocation, ICONIC_VENUE_TERMS)) s += 14;

  if (hasRivalryBoost(home, away)) s += 26;

  const dt = r?.fixture?.date ? new Date(r.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) {
    s += kickoffTimingScore(dt);
  }

  if (home && away) {
    const longNames = (home.length >= 8 ? 1 : 0) + (away.length >= 8 ? 1 : 0);
    if (longNames === 2) s += 4;
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

function mapFixtureError(message: string | null): string | null {
  const clean = String(message ?? "").trim().toLowerCase();
  if (!clean) return null;
  if (clean.includes("backend_timeout")) {
    return "Live fixtures took too long to respond. Try again in a moment.";
  }
  if (clean.includes("timeout")) {
    return "Fixture data is taking longer than expected. Try again shortly.";
  }
  return message;
}

function getTripIdeas(): TripIdea[] {
  return [
    {
      key: "milan",
      cityKey: "milan",
      title: "Milan",
      hook: "San Siro nights + city break",
    },
    {
      key: "dortmund",
      cityKey: "dortmund",
      title: "Dortmund",
      hook: "Yellow Wall weekend",
    },
    {
      key: "lisbon",
      cityKey: "lisbon",
      title: "Lisbon",
      hook: "Sun, stadiums & easy city trip",
    },
  ];
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
  const upcomingWindow = useMemo(() => windowFromTomorrowIso(HOME_MATCH_WINDOW_DAYS), []);

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
    goFixtures({ window: windowFromTomorrowIso(HOME_MATCH_WINDOW_DAYS) });
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

  const homeFixtureError = useMemo(() => mapFixtureError(fxError), [fxError]);
  const showInitialFixtureLoading = fxLoading && fxRows.length === 0;
  const showFixtureError = !!homeFixtureError && fxRows.length === 0;

  const heroTitle = useMemo(() => {
    if (featured) return fixtureLine(featured).title;
    if (nextTripCityTitle) return `${nextTripCityTitle} football weekend`;
    return "Your next football weekend starts here";
  }, [featured, nextTripCityTitle]);

  const heroSubtitle = useMemo(() => {
    if (featured) {
      const city = String(featured?.fixture?.venue?.city ?? "").trim();
      const leagueName = String(featured?.league?.name ?? "").trim();
      const when = formatUkDateTimeMaybe(featured?.fixture?.date);
      const parts = [city, leagueName, when].filter(Boolean);
      return parts.join(" • ") || "Plan the whole weekend, not just the match.";
    }

    if (nextTripCityTitle) {
      return "Trips, guides, fixtures and bookings all in one workspace.";
    }

    return "Find the fixture worth travelling for.";
  }, [featured, nextTripCityTitle]);

  const heroImage = useMemo(() => {
    if (featuredCityImage) return featuredCityImage;
    if (nextTripCityImage) return nextTripCityImage;
    return getCityImageUrl("london");
  }, [featuredCityImage, nextTripCityImage]);

  const tripIdeas = useMemo(() => getTripIdeas(), []);

  return (
    <Background mode="solid" solidColor="#050708">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 34 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => {
              if (featured?.fixture?.id) {
                goMatch(String(featured.fixture.id));
                return;
              }

              if (nextTrip?.id) {
                router.push({ pathname: "/trip/[id]", params: { id: nextTrip.id } } as any);
                return;
              }

              goFixturesHub();
            }}
            style={({ pressed }) => [styles.heroCard, pressed && styles.pressedCard]}
          >
            <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroImageShade} pointerEvents="none" />
            <View style={styles.heroBottomFade} pointerEvents="none" />
            <View style={styles.heroGlow} pointerEvents="none" />

            <View style={styles.heroContent}>
              <Text style={styles.heroTag}>Top pick this week</Text>
              <Text style={styles.heroTitle}>{heroTitle}</Text>
              <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>

              <View style={styles.heroActions}>
                <View style={styles.heroPrimaryCta}>
                  <Text style={styles.heroPrimaryCtaText}>
                    {featured ? "Plan this trip" : "Browse fixtures"}
                  </Text>
                </View>

                <Text style={styles.heroSecondaryLink}>
                  {featured ? "Open match guide" : "See what’s on"} ›
                </Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.commandWrap}>
            <View style={styles.searchBar}>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search teams, cities, countries or stadiums"
                placeholderTextColor="rgba(224,231,225,0.42)"
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
              <View style={styles.commandChips}>
                <Pressable
                  onPress={goFixturesHub}
                  style={({ pressed }) => [styles.commandChipPrimary, pressed && styles.pressedChip]}
                >
                  <Text style={styles.commandChipPrimaryText}>Next 45 days</Text>
                </Pressable>

                <Pressable
                  onPress={goFixtures}
                  style={({ pressed }) => [styles.commandChip, pressed && styles.pressedChip]}
                >
                  <Text style={styles.commandChipText}>All fixtures</Text>
                </Pressable>

                <Pressable
                  onPress={goDiscover}
                  style={({ pressed }) => [styles.commandChip, pressed && styles.pressedChip]}
                >
                  <Text style={styles.commandChipText}>Top cities</Text>
                </Pressable>
              </View>
            ) : null}

            {showSearchResults ? (
              <View style={styles.searchResultsWrap}>
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

          {!showSearchResults ? (
            <View style={styles.mainStack}>
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
                fxError={showFixtureError ? homeFixtureError : null}
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
                  <Text style={styles.refreshingText}>Refreshing best upcoming matches…</Text>
                </View>
              ) : null}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trip ideas</Text>

                  <Pressable onPress={goDiscover} hitSlop={10}>
                    <Text style={styles.sectionLink}>See more ›</Text>
                  </Pressable>
                </View>

                <View style={styles.ideaGrid}>
                  {tripIdeas.map((item) => {
                    const image = getCityImageUrl(item.cityKey);

                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => goCityKey(item.cityKey)}
                        style={({ pressed }) => [styles.ideaCard, pressed && styles.pressedCard]}
                      >
                        <Image source={{ uri: image }} style={styles.ideaImage} resizeMode="cover" />
                        <View style={styles.ideaOverlay} pointerEvents="none" />
                        <View style={styles.ideaBottomFade} pointerEvents="none" />

                        <View style={styles.ideaContent}>
                          <Text style={styles.ideaEyebrow}>{item.title}</Text>
                          <Text style={styles.ideaTitle}>{item.hook}</Text>
                          <Text style={styles.ideaLink}>Explore city ›</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
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
    gap: 18,
  },

  heroCard: {
    marginTop: theme.spacing.lg,
    height: 324,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#0A0F12",
  },

  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  heroImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,5,7,0.34)",
  },

  heroBottomFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,5,7,0.28)",
  },

  heroGlow: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: -12,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.10)",
  },

  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 7,
  },

  heroTag: {
    color: "#F5CC57",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.75,
    textTransform: "uppercase",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.2,
  },

  heroSubtitle: {
    color: "rgba(240,245,242,0.86)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "92%",
  },

  heroActions: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },

  heroPrimaryCta: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,126,58,0.34)",
    borderWidth: 1,
    borderColor: "rgba(104,241,138,0.22)",
  },

  heroPrimaryCtaText: {
    color: "#9AF2AE",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  heroSecondaryLink: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  commandWrap: {
    gap: 10,
    marginTop: -2,
  },

  searchBar: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Platform.OS === "android" ? "rgba(9,12,14,0.62)" : "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  clearText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  commandChips: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },

  commandChipPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(18,103,49,0.28)",
    borderWidth: 1,
    borderColor: "rgba(104,241,138,0.20)",
  },

  commandChipPrimaryText: {
    color: "#8EF2A5",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  commandChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  commandChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  searchResultsWrap: {
    gap: 10,
  },

  resultList: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Platform.OS === "android" ? "rgba(6,10,8,0.34)" : "rgba(6,10,8,0.30)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
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

  mainStack: {
    gap: 18,
    paddingTop: 2,
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
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  refreshingText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  section: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
  },

  sectionLink: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  ideaGrid: {
    gap: 12,
  },

  ideaCard: {
    height: 172,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0A0F12",
  },

  ideaImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  ideaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,7,9,0.28)",
  },

  ideaBottomFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,7,9,0.30)",
  },

  ideaContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 4,
  },

  ideaEyebrow: {
    color: "#8EF2A5",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },

  ideaTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: theme.fontWeight.black,
    maxWidth: "88%",
  },

  ideaLink: {
    marginTop: 4,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  pressedRow: {
    opacity: 0.94,
  },

  pressedCard: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },

  pressedChip: {
    opacity: 0.94,
  },
});
