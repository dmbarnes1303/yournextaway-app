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
import { getPopularTeams } from "@/src/data/teams";
import { getCityImageUrl } from "@/src/data/cityImages";

import ContinuePlanning from "@/src/features/home/ContinuePlanning";
import RouteTiles from "@/src/features/home/RouteTiles";
import UpcomingMatches from "@/src/features/home/UpcomingMatches";
import BrowseStartingPoints from "@/src/features/home/BrowseStartingPoints";

const API_SPORTS_TEAM_LOGO = (teamId: number) =>
  `https://media.api-sports.io/football/teams/${teamId}.png`;

type ShortcutWindow = { from: string; to: string };
type CityChip = { name: string; countryCode: string };

const POPULAR_CITIES: CityChip[] = [
  { name: "Paris", countryCode: "FR" },
  { name: "Rome", countryCode: "IT" },
  { name: "Barcelona", countryCode: "ES" },
  { name: "Amsterdam", countryCode: "NL" },
  { name: "Lisbon", countryCode: "PT" },
];

const HOME_TOP_LEAGUE_IDS = new Set<number>([39, 140, 135, 78, 61, 88, 94]);

function toKey(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function cityKeyFromName(name: string) {
  return toKey(name)
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function dedupeBy<T>(arr: T[], keyFn: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

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

  const goWallet = useCallback(() => {
    router.push("/(tabs)/wallet" as any);
  }, [router]);

  const goFootballCalendar = useCallback(() => {
    router.push("/football-calendar" as any);
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

  const goCityFromName = useCallback(
    (name: string) => {
      const ck = cityKeyFromName(name);
      if (!ck) return;
