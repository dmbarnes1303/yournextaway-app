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
  nextWeekendWindowIso,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { buildSearchIndex, querySearchIndex, type SearchResult } from "@/src/services/searchIndex";
import { hasTeamGuide } from "@/src/data/teamGuides";
import { getCityGuide } from "@/src/data/cityGuides";
import { getFlagImageUrl } from "@/src/utils/flagImages";
import { getPopularTeams, POPULAR_TEAM_IDS } from "@/src/data/teams";
import { getCityImageUrl } from "@/src/data/cityImages";

import rankTrips from "@/src/features/tripFinder/rankTrips";
import groupTripsByWeekend from "@/src/features/tripFinder/groupTripsByWeekend";
import type { RankedTrip, WeekendBucket } from "@/src/features/tripFinder/types";

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

const HOME_TRIP_FINDER_LEAGUE_IDS = new Set<number>([
  39, 140, 135, 78, 61, 88, 94, 203, 197, 179, 207, 218, 119,
]);

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

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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

function TeamCrest({ teamId, size = 16 }: { teamId: number; size?: number }) {
  const uri = API_SPORTS_TEAM_LOGO(teamId);
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, opacity: 0.95 }}
      resizeMode="contain"
    />
  );
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

function LeagueStrip({
  leagues,
  activeLeagueId,
  onSelect,
}: {
  leagues: LeagueOption[];
  activeLeagueId: number;
  onSelect: (league: LeagueOption) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueStripRow}>
      {leagues.map((league) => {
        const active = league.leagueId === activeLeagueId;

        return (
          <Pressable
            key={league.leagueId}
            onPress={() => onSelect(league)}
            style={({ pressed }) => [
              styles.leagueStripItem,
              active && styles.leagueStripItemActive,
              pressed && styles.pressedPill,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.08)" }}
          >
            <Image source={{ uri: league.logo }} style={styles.leagueStripLogo} resizeMode="contain" />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function scoreFixture(r: FixtureListRow): number {
  let s = 0;

  const leagueId = r?.league?.id;
  if (leagueId === 39) s += 120;
  else if (leagueId === 140) s += 105;
  else if (leagueId === 135) s += 100;
  else if (leagueId === 78) s += 95;
  else if (leagueId === 61) s += 90;
  else s += 60;

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;
  if (typeof homeId === "number" && POPULAR_TEAM_IDS.has(homeId)) s += 60;
  if (typeof awayId === "number" && POPULAR_TEAM_IDS.has(awayId)) s += 60;

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

function difficultyLabel(v: RankedTrip["breakdown"]["travelDifficulty"]) {
  if (v === "easy") return "Easy";
  if (v === "moderate") return "Moderate";
  if (v === "hard") return "Hard";
  return "Complex";
}

function bucketStrengthLabel(bucket: WeekendBucket) {
  if (bucket.avgScore >= 84 || bucket.topScore >= 90) return "Elite weekend";
  if (bucket.avgScore >= 74 || bucket.topScore >= 84) return "Strong weekend";
  if (bucket.avgScore >= 64 || bucket.topScore >= 74) return "Good weekend";
  return "Decent weekend";
}

function bucketStrengthTone(bucket: WeekendBucket) {
  if (bucket.avgScore >= 84 || bucket.topScore >= 90) return "elite";
  if (bucket.avgScore >= 74 || bucket.topScore >= 84) return "strong";
  if (bucket.avgScore >= 64 || bucket.topScore >= 74) return "good";
  return "decent";
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length) as R[];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

function CityChipPremium({
  name,
  countryCode,
  onPress,
}: {
  name: string;
  countryCode: string;
  onPress: () => void;
}) {
  const flagUrl = getFlagImageUrl(countryCode, { size: 48 });
  const cityImage = getCityImageUrl(name);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cityPill, pressed && styles.pressedPill]}
      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
    >
      <Image source={{ uri: cityImage }} style={styles.cityThumb} resizeMode="cover" />
      <View style={{ gap: 4 }}>
        <Text style={styles.pillText}>{name}</Text>
        {flagUrl ? (
          <Image source={{ uri: flagUrl }} style={styles.cityFlagInline} resizeMode="cover" />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const homeTopLeagues = useMemo(() => {
    const list = LEAGUES.filter((l) => HOME_TOP_LEAGUE_IDS.has(l.leagueId));
    return list.length ? list : LEAGUES.slice(0, 6);
  }, []);

  const tripFinderLeagues = useMemo(() => {
    const list = LEAGUES.filter((l) => HOME_TRIP_FINDER_LEAGUE_IDS.has(l.leagueId));
    return list.length ? list : LEAGUES.slice(0, 10);
  }, []);

  const [league, setLeague] = useState<LeagueOption>(homeTopLeagues[0] ?? LEAGUES[0]);

  const { from: fromIso, to: toIso } = useMemo(() => getRollingWindowIso(), []);
  const upcomingWindow = useMemo(() => windowFromTomorrowIso(14), []);
  const weekendWindow = useMemo(() => nextWeekendWindowIso(), []);

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

  const [tfLoading, setTfLoading] = useState(false);
  const [tfError, setTfError] = useState<string | null>(null);
  const [tfRows, setTfRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setTfLoading(true);
      setTfError(null);
      setTfRows([]);

      try {
        const batches = await mapLimit(tripFinderLeagues, 4, async (l) => {
          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from: weekendWindow.from,
            to: weekendWindow.to,
          });
          return Array.isArray(res) ? res : [];
        });

        if (cancelled) return;
        setTfRows(batches.flat().filter((r) => r?.fixture?.id != null));
      } catch (e: any) {
        if (cancelled) return;
        setTfError(e?.message ?? "Failed to load best trips.");
        setTfRows([]);
      } finally {
        if (!cancelled) setTfLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [tripFinderLeagues, weekendWindow.from, weekendWindow.to]);

  const rankedWeekendTrips = useMemo(() => rankTrips(tfRows), [tfRows]);
  const weekendBuckets = useMemo(() => groupTripsByWeekend(rankedWeekendTrips), [rankedWeekendTrips]);

  const bestWeekendBucket = useMemo(() => {
    return [...weekendBuckets].sort((a, b) => {
      if (b.topScore !== a.topScore) return b.topScore - a.topScore;
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      return a.from.localeCompare(b.from);
    })[0] ?? null;
  }, [weekendBuckets]);

  const bestWeekendTrip = useMemo(() => bestWeekendBucket?.trips?.[0] ?? null, [bestWeekendBucket]);
  const nextWeekendTrips = useMemo(() => bestWeekendBucket?.trips?.slice(1, 3) ?? [], [bestWeekendBucket]);

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

  const goPlanTrip = useCallback(() => {
    const w = windowFromTomorrowIso(14);
    goFixtures({ window: w, sort: "rating" });
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

  const goWeekendTripMatch = useCallback(
    (trip: RankedTrip, bucket?: WeekendBucket | null) => {
      const fixtureId = trip?.fixture?.fixture?.id != null ? String(trip.fixture.fixture.id) : "";
      if (!fixtureId) return;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: fixtureId,
          from: bucket?.from ?? weekendWindow.from,
          to: bucket?.to ?? weekendWindow.to,
        },
      } as any);
    },
    [router, weekendWindow.from, weekendWindow.to]
  );

  const goWeekendTripBuild = useCallback(
    (trip: RankedTrip, bucket?: WeekendBucket | null) => {
      const fixtureId = trip?.fixture?.fixture?.id != null ? String(trip.fixture.fixture.id) : "";
      const leagueId = trip?.fixture?.league?.id != null ? String(trip.fixture.league.id) : "";
      const season =
        (trip?.fixture as any)?.league?.season != null
          ? String((trip.fixture as any).league.season)
          : "";

      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
          from: bucket?.from ?? weekendWindow.from,
          to: bucket?.to ?? weekendWindow.to,
        },
      } as any);
    },
    [router, weekendWindow.from, weekendWindow.to]
  );

  const goTripFinder = useCallback(() => {
    router.push({
      pathname: "/trip-finder",
      params: { window: "wknd", mode: "all" },
    } as any);
  }, [router]);

  const goFootballCalendar = useCallback(() => {
    router.push("/football-calendar" as any);
  }, [router]);

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
      goCityKey(ck);
    },
    [goCityKey]
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

  const cities = useMemo(() => dedupeBy(POPULAR_CITIES, (c) => toKey(c.name)).slice(0, 5), []);
  const popularTeams = useMemo(
    () => getPopularTeams().filter((t) => typeof (t as any)?.teamId === "number").slice(0, 5),
    []
  );

  const quickTiles = useMemo(
    () => [
      {
        key: "weekend",
        title: "Weekend Break",
        sub: "Best for 1–2 nights",
        icon: "📅",
        onPress: () => goFixtures({ window: nextWeekendWindowIso() }),
      },
      {
        key: "daytrip",
        title: "Day Trip",
        sub: "Pick a same-day kickoff",
        icon: "⏱️",
        onPress: () => goFixtures({ window: windowFromTomorrowIso(14) }),
      },
      {
        key: "midweek",
        title: "Midweek Escape",
        sub: "One-night quick break",
        icon: "⚡",
        onPress: () => goFixtures({ window: windowFromTomorrowIso(7) }),
      },
      {
        key: "topPicks",
        title: "Top Picks",
        sub: "Best games • 14 days",
        icon: "⭐",
        onPress: () => goPlanTrip(),
      },
      {
        key: "tripFinder",
        title: "Trip Finder",
        sub: "Ranked football trips",
        icon: "🎯",
        onPress: () => goTripFinder(),
      },
      {
        key: "calendar",
        title: "Football Calendar",
        sub: "Best upcoming weekends",
        icon: "🗓️",
        onPress: () => goFootballCalendar(),
      },
    ],
    [goFixtures, goPlanTrip, goTripFinder, goFootballCalendar]
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

  const bestWeekendTripImage = useMemo(() => {
    const city = String(bestWeekendTrip?.city ?? "").trim();
    return getCityImageUrl(city || "london");
  }, [bestWeekendTrip]);

  const bestWeekendTone = useMemo(() => {
    return bestWeekendBucket ? bucketStrengthTone(bestWeekendBucket) : "decent";
  }, [bestWeekendBucket]);

  return (
    <Background imageSource={getBackground("home")} overlayOpacity={0.64}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 22 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.heroKicker}>YOURNEXTAWAY</Text>
              <Text style={styles.heroTitle}>Plan a football city break</Text>
              <Text style={styles.heroSub}>
                Search a city, team, country, league, or venue — then pick a match and build your trip workspace.
              </Text>

              <View style={styles.searchBox}>
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search…"
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
                <View style={styles.heroActionsSingle}>
                  <Pressable
                    onPress={goPlanTrip}
                    style={({ pressed }) => [
                      styles.heroBtnSingle,
                      styles.heroBtnPrimary,
                      pressed && styles.pressed,
                    ]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={styles.heroBtnPrimaryText}>Plan a trip</Text>
                  </Pressable>
                </View>
              ) : null}

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
                    <>
                      {rawSearchResults.length === 0 ? (
                        <Text style={styles.groupEmpty}>No results.</Text>
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

              {!showSearchResults ? (
                <View style={styles.popularBlock}>
                  <Text style={styles.sectionKicker}>Popular cities</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularRow}
                    decelerationRate="fast"
                  >
                    {cities.map((c) => (
                      <CityChipPremium
                        key={`pc-${c.name}`}
                        name={c.name}
                        countryCode={c.countryCode}
                        onPress={() => goCityFromName(c.name)}
                      />
                    ))}
                  </ScrollView>

                  <Text style={[styles.sectionKicker, { marginTop: 10 }]}>Popular teams</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularRow}
                    decelerationRate="fast"
                  >
                    {popularTeams.map((t: any) => (
                      <Pressable
                        key={`pt-${String(t.teamKey ?? t.teamId ?? t.name)}`}
                        onPress={() => {
                          Keyboard.dismiss();
                          setQ("");
                          router.push({
                            pathname: "/team/[teamKey]",
                            params: { teamKey: String(t.teamKey), from: fromIso, to: toIso },
                          } as any);
                        }}
                        style={({ pressed }) => [styles.teamPill, pressed && styles.pressedPill]}
                        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                      >
                        <View style={styles.teamCrestDot}>
                          <Image
                            source={{ uri: API_SPORTS_TEAM_LOGO(Number(t.teamId)) }}
                            style={{ width: 16, height: 16, opacity: 0.95 }}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.pillText}>{String(t.name ?? "")}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </GlassCard>

          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Best trips this weekend</Text>
                <Pressable
                  onPress={goTripFinder}
                  style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.miniPillText}>Open Trip Finder</Text>
                </Pressable>
              </View>

              <GlassCard strength="default" style={styles.block} noPadding>
                <View style={styles.blockInner}>
                  {tfLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Ranking weekend trips…</Text>
                    </View>
                  ) : null}

                  {!tfLoading && tfError ? (
                    <EmptyState title="Trip Finder unavailable" message={tfError} />
                  ) : null}

                  {!tfLoading && !tfError && !bestWeekendTrip ? (
                    <EmptyState
                      title="No standout trips found"
                      message="Try opening Trip Finder or Football Calendar for a wider view."
                    />
                  ) : null}

                  {!tfLoading && !tfError && bestWeekendTrip && bestWeekendBucket ? (
                    <>
                      <Text style={styles.blockKicker}>Ranked preview</Text>

                      <View
                        style={[
                          styles.weekendHeroCard,
                          bestWeekendTone === "elite" && styles.weekendHeroCardElite,
                          bestWeekendTone === "strong" && styles.weekendHeroCardStrong,
                          bestWeekendTone === "good" && styles.weekendHeroCardGood,
                        ]}
                      >
                        <Image source={{ uri: bestWeekendTripImage }} style={styles.weekendHeroImage} resizeMode="cover" />
                        <View style={styles.weekendHeroImageOverlay} />

                        <View style={styles.weekendHeroContent}>
                          <View style={styles.weekendHeroTop}>
                            <View
                              style={[
                                styles.weekendScoreBadge,
                                bestWeekendTone === "elite" && styles.weekendScoreBadgeElite,
                                bestWeekendTone === "strong" && styles.weekendScoreBadgeStrong,
                                bestWeekendTone === "good" && styles.weekendScoreBadgeGood,
                              ]}
                            >
                              <Text style={styles.weekendScoreBadgeText}>
                                {bestWeekendTrip.breakdown.combinedScore}
                              </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.weekendHeroTitle} numberOfLines={1}>
                                {String(bestWeekendTrip.fixture?.teams?.home?.name ?? "Home")} vs{" "}
                                {String(bestWeekendTrip.fixture?.teams?.away?.name ?? "Away")}
                              </Text>
                              <Text style={styles.weekendHeroMeta} numberOfLines={1}>
                                {formatUkDateTimeMaybe(bestWeekendTrip.kickoffIso)}
                              </Text>
                              <Text style={styles.weekendHeroMeta} numberOfLines={1}>
                                {[bestWeekendTrip.city, bestWeekendTrip.stadiumName].filter(Boolean).join(" • ")}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.weekendInfoRow}>
                            <View style={styles.weekendInfoPill}>
                              <Text style={styles.weekendInfoLabel}>Weekend</Text>
                              <Text style={styles.weekendInfoValue}>{bestWeekendBucket.label}</Text>
                            </View>
                            <View style={styles.weekendInfoPill}>
                              <Text style={styles.weekendInfoLabel}>Strength</Text>
                              <Text style={styles.weekendInfoValue}>
                                {bucketStrengthLabel(bestWeekendBucket)}
                              </Text>
                            </View>
                            <View style={styles.weekendInfoPill}>
                              <Text style={styles.weekendInfoLabel}>Travel</Text>
                              <Text style={styles.weekendInfoValue}>
                                {difficultyLabel(bestWeekendTrip.breakdown.travelDifficulty)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.weekendReasonBox}>
                            {bestWeekendTrip.breakdown.reasonLines.slice(0, 3).map((line, idx) => (
                              <Text key={`${line}-${idx}`} style={styles.weekendReasonText}>
                                • {line}
                              </Text>
                            ))}
                          </View>

                          <View style={styles.blockActions}>
                            <Pressable
                              onPress={() => goWeekendTripMatch(bestWeekendTrip, bestWeekendBucket)}
                              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                              android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                            >
                              <Text style={styles.btnGhostText}>View match</Text>
                            </Pressable>

                            <Pressable
                              onPress={() => goWeekendTripBuild(bestWeekendTrip, bestWeekendBucket)}
                              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                            >
                              <Text style={styles.btnPrimaryText}>Build trip</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>

                      {nextWeekendTrips.length > 0 ? <View style={styles.divider} /> : null}

                      {nextWeekendTrips.length > 0 ? (
                        <View style={styles.list}>
                          {nextWeekendTrips.map((trip, idx) => {
                            const fixtureId =
                              trip?.fixture?.fixture?.id != null
                                ? String(trip.fixture.fixture.id)
                                : `w-${idx}`;

                            return (
                              <Pressable
                                key={fixtureId}
                                onPress={() => goWeekendTripMatch(trip, bestWeekendBucket)}
                                style={({ pressed }) => [styles.listRow, pressed && styles.pressedRow]}
                                android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                              >
                                <View style={styles.listRowTop}>
                                  <View style={styles.tripMiniScoreWrap}>
                                    <Text style={styles.tripMiniScoreText}>
                                      {trip.breakdown.combinedScore}
                                    </Text>
                                  </View>

                                  <Text style={styles.listTitle} numberOfLines={1} ellipsizeMode="tail">
                                    {String(trip.fixture?.teams?.home?.name ?? "Home")} vs{" "}
                                    {String(trip.fixture?.teams?.away?.name ?? "Away")}
                                  </Text>
                                </View>

                                <Text style={styles.listMeta} numberOfLines={1} ellipsizeMode="tail">
                                  {[
                                    formatUkDateTimeMaybe(trip.kickoffIso),
                                    trip.city,
                                    difficultyLabel(trip.breakdown.travelDifficulty),
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}

                      <View style={styles.blockActions}>
                        <Pressable
                          onPress={goTripFinder}
                          style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                          android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                        >
                          <Text style={styles.btnGhostText}>Open Trip Finder</Text>
                        </Pressable>
                        <Pressable
                          onPress={goFootballCalendar}
                          style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                          android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                        >
                          <Text style={styles.btnGhostText}>Football Calendar</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                </View>
              </GlassCard>
            </View>
          ) : null}

          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming matches</Text>
                <Pressable
                  onPress={() =>
                    goFixtures({
                      window: upcomingWindow,
                      leagueId: league.leagueId,
                      season: league.season,
                    })
                  }
                  style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.miniPillText}>View all</Text>
                </Pressable>
              </View>

              <LeagueStrip leagues={homeTopLeagues} activeLeagueId={league.leagueId} onSelect={setLeague} />

              <GlassCard strength="default" style={styles.block} noPadding>
                <View style={styles.blockInner}>
                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Loading fixtures…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? (
                    <EmptyState title="Fixtures unavailable" message={fxError} />
                  ) : null}

                  {!fxLoading && !fxError && !featured ? (
                    <EmptyState title="No fixtures found" message="Try another league." />
                  ) : null}

                  {!fxLoading && !fxError && featured ? (
                    <>
                      <Text style={styles.blockKicker}>Featured pick</Text>

                      <Pressable
                        onPress={() => goMatch(String(featured.fixture.id))}
                        style={({ pressed }) => [styles.featured, pressed && styles.pressedRow]}
                        android_ripple={{ color: "rgba(79,224,138,0.08)" }}
                      >
                        <Image source={{ uri: featuredCityImage }} style={styles.featuredImage} resizeMode="cover" />
                        <View style={styles.featuredImageOverlay} />

                        <View style={styles.featuredTop}>
                          <CrestSquare row={featured} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.featuredTitle} numberOfLines={1} ellipsizeMode="tail">
                              {fixtureLine(featured).title}
                            </Text>
                            <Text style={styles.featuredMeta} numberOfLines={1} ellipsizeMode="tail">
                              {fixtureLine(featured).meta}
                            </Text>
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
                                    {homeLogo ? (
                                      <Image source={{ uri: homeLogo }} style={styles.smallCrestImg} resizeMode="contain" />
                                    ) : null}
                                  </View>
                                  <View style={styles.smallCrest}>
                                    {awayLogo ? (
                                      <Image source={{ uri: awayLogo }} style={styles.smallCrestImg} resizeMode="contain" />
                                    ) : null}
                                  </View>
                                </View>

                                <Text style={styles.listTitle} numberOfLines={1} ellipsizeMode="tail">
                                  {line.title}
                                </Text>
                              </View>

                              <Text style={styles.listMeta} numberOfLines={1} ellipsizeMode="tail">
                                {line.meta}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <Pressable
                        onPress={goPlanTrip}
                        style={({ pressed }) => [
                          styles.singleCta,
                          styles.btn,
                          styles.btnPrimary,
                          pressed && styles.pressed,
                        ]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <Text style={styles.btnPrimaryText}>Plan a trip</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </GlassCard>
            </View>
          ) : null}

          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trips</Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/trips")}
                  style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.miniPillText}>Open</Text>
                </Pressable>
              </View>

              <GlassCard strength="default" style={styles.block} noPadding>
                <View style={styles.blockInner}>
                  <View style={styles.hubTop}>
                    <Text style={styles.hubKicker}>Trip workspaces</Text>
                    <Text style={styles.hubSub}>
                      Save your match, links, notes and bookings in one place.
                    </Text>
                  </View>

                  {!loadedTrips ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Loading trips…</Text>
                    </View>
                  ) : null}

                  {loadedTrips && !nextTrip ? (
                    <>
                      <Text style={styles.emptyTitle}>No trips yet</Text>
                      <Text style={styles.emptyMeta}>
                        Pick a match in Fixtures, then plan your trip around it.
                      </Text>

                      <View style={styles.blockActions}>
                        <Pressable
                          onPress={goPlanTrip}
                          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                        >
                          <Text style={styles.btnPrimaryText}>Plan a trip</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => router.push("/(tabs)/trips")}
                          style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                          android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                        >
                          <Text style={styles.btnGhostText}>Open trips</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}

                  {loadedTrips && nextTrip ? (
                    <>
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: "/trip/[id]", params: { id: nextTrip.id } } as any)
                        }
                        style={({ pressed }) => [styles.nextTripCard, pressed && styles.pressedRow]}
                        android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                      >
                        <Image source={{ uri: nextTripCityImage }} style={styles.nextTripImage} resizeMode="cover" />
                        <View style={styles.nextTripImageOverlay} />

                        <View style={styles.nextTripContent}>
                          <Text style={styles.nextTripKicker}>Next up</Text>

                          <View style={styles.nextTripTitleRow}>
                            {nextTripFlagUrl ? (
                              <Image source={{ uri: nextTripFlagUrl }} style={styles.nextTripFlag} />
                            ) : null}
                            {typeof nextTripTeamId === "number" ? (
                              <View style={styles.nextTripCrestDot}>
                                <TeamCrest teamId={nextTripTeamId} size={16} />
                              </View>
                            ) : null}
                            <Text style={styles.nextTripTitle}>{nextTripCityTitle || "Trip"}</Text>
                          </View>

                          <Text style={styles.nextTripMeta}>{tripSummaryLine(nextTrip)}</Text>
                        </View>
                      </Pressable>

                      <View style={styles.blockActions}>
                        <Pressable
                          onPress={() => router.push("/(tabs)/trips")}
                          style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                          android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                        >
                          <Text style={styles.btnGhostText}>Open trips</Text>
                        </Pressable>
                        <Pressable
                          onPress={goPlanTrip}
                          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                        >
                          <Text style={styles.btnPrimaryText}>Plan another trip</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                </View>
              </GlassCard>
            </View>
          ) : null}

          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick shortcuts</Text>
                <Text style={styles.sectionMeta}>One-tap starting points</Text>
              </View>

              <View style={styles.grid2}>
                {quickTiles.map((s) => (
                  <Pressable
                    key={s.key}
                    onPress={s.onPress}
                    style={({ pressed }) => [styles.tilePress, pressed && styles.pressed]}
                    android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                  >
                    <GlassCard strength="default" style={styles.tile} noPadding>
                      <View style={styles.tileInner}>
                        <View style={styles.tileTopRow}>
                          <Text style={styles.tileTitle}>{s.title}</Text>
                          <View style={styles.tileBadge}>
                            <Text style={styles.tileBadgeText}>{s.icon}</Text>
                          </View>
                        </View>
                        <Text style={styles.tileSub}>{s.sub}</Text>
                        <Text style={styles.tileHint}>Tap to start</Text>
                      </View>
                    </GlassCard>
                  </Pressable>
                ))}
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
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: 18 },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  pressedRow: { opacity: 0.94 },
  pressedPill: { opacity: 0.92 },

  hero: { marginTop: theme.spacing.lg, borderRadius: 26 },
  heroInner: { padding: theme.spacing.lg, gap: 10 },

  heroKicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.2,
  },
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
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 18,
    paddingHorizontal: 14,
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
  clearText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  heroActionsSingle: { marginTop: 4 },
  heroBtnSingle: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  heroBtnPrimary: {
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  heroBtnPrimaryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  searchResults: { marginTop: 10, gap: 10 },
  resultList: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.22)" : "rgba(10,12,14,0.18)",
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

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  centerInline: { flexDirection: "row", alignItems: "center", gap: 10 },
  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  chev: { color: theme.colors.textTertiary, fontSize: 22, marginTop: -2 },

  popularBlock: { marginTop: 4, gap: 8 },
  sectionKicker: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },
  popularRow: { gap: 10, paddingRight: theme.spacing.lg, paddingVertical: 4 },

  cityPill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(18,20,24,0.32)" : "rgba(18,20,24,0.26)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cityThumb: { width: 42, height: 42, borderRadius: 12 },
  cityFlagInline: { width: 16, height: 12, borderRadius: 2, opacity: 0.9 },
  pillText: {
    color: "rgba(242,244,246,0.86)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  teamPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(18,20,24,0.32)" : "rgba(18,20,24,0.26)",
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

  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },
  sectionMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  miniPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  miniPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  leagueStripRow: { gap: 12, paddingRight: theme.spacing.lg, marginTop: 2 },
  leagueStripItem: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  leagueStripItemActive: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leagueStripLogo: { width: 34, height: 34, opacity: 0.98 },

  block: { borderRadius: 24 },
  blockInner: { padding: 14, gap: 12 },
  blockKicker: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  featured: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(12,14,16,0.22)" : "rgba(12,14,16,0.18)",
    overflow: "hidden",
    position: "relative",
    minHeight: 92,
  },
  featuredImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,8,10,0.58)",
  },
  featuredTop: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featuredTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },
  featuredMeta: {
    marginTop: 4,
    color: "rgba(242,244,246,0.84)",
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  crestWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestImg: { width: 28, height: 28, opacity: 0.95 },
  crestFallback: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 2 },

  list: { gap: 8 },
  listRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
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

  listTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },
  listMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  blockActions: { flexDirection: "row", gap: 10, marginTop: 2 },

  btn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  btnPrimary: {
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
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

  singleCta: { alignSelf: "center", marginTop: 2, width: "72%" },

  hubTop: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  hubKicker: {
    color: "rgba(79,224,138,0.78)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },
  hubSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },
  emptyMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  nextTripCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    overflow: "hidden",
    position: "relative",
    minHeight: 124,
  },
  nextTripImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  nextTripImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,8,10,0.62)",
  },
  nextTripContent: { paddingVertical: 12, paddingHorizontal: 12 },
  nextTripKicker: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },
  nextTripTitleRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  nextTripFlag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },
  nextTripCrestDot: {
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
  nextTripTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },
  nextTripMeta: {
    marginTop: 6,
    color: "rgba(242,244,246,0.84)",
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tilePress: { width: "48.5%", borderRadius: 18, overflow: "hidden" },
  tile: { borderRadius: 18 },
  tileInner: { paddingVertical: 14, paddingHorizontal: 14, gap: 8 },
  tileTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  tileTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },
  tileSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 16,
  },
  tileHint: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    opacity: 0.8,
  },

  tileBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  tileBadgeText: { fontSize: 16, opacity: 0.95 },

  weekendHeroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(12,14,16,0.22)" : "rgba(12,14,16,0.18)",
    overflow: "hidden",
    position: "relative",
    minHeight: 236,
  },
  weekendHeroCardElite: { borderColor: "rgba(79,224,138,0.24)" },
  weekendHeroCardStrong: { borderColor: "rgba(255,210,90,0.18)" },
  weekendHeroCardGood: { borderColor: "rgba(110,170,255,0.18)" },
  weekendHeroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  weekendHeroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,8,10,0.60)",
  },
  weekendHeroContent: { padding: 12, gap: 12 },
  weekendHeroTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  weekendScoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  weekendScoreBadgeElite: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  weekendScoreBadgeStrong: {
    borderColor: "rgba(255,210,90,0.22)",
    backgroundColor: "rgba(255,210,90,0.08)",
  },
  weekendScoreBadgeGood: {
    borderColor: "rgba(110,170,255,0.22)",
    backgroundColor: "rgba(110,170,255,0.08)",
  },
  weekendScoreBadgeText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },
  weekendHeroTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: theme.fontWeight.black,
  },
  weekendHeroMeta: {
    marginTop: 4,
    color: "rgba(242,244,246,0.84)",
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },
  weekendInfoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  weekendInfoPill: {
    minWidth: 96,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,12,14,0.24)",
  },
  weekendInfoLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },
  weekendInfoValue: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },
  weekendReasonBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,12,14,0.22)",
    padding: 10,
    gap: 5,
  },
  weekendReasonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },
  tripMiniScoreWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tripMiniScoreText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },
});
