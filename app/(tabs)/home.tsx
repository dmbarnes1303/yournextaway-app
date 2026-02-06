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
  nextWeekendWindowIso,
  windowFromTomorrowIso,
  type RollingWindowIso,
} from "@/src/constants/football";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { buildSearchIndex, querySearchIndex, type SearchResult } from "@/src/services/searchIndex";
import { hasTeamGuide } from "@/src/data/teamGuides";
import { getCityGuide } from "@/src/data/cityGuides";
import { getFlagImageUrl } from "@/src/utils/flagImages";

/**
 * Popular chips (Option A):
 * - Two horizontal scrollers under the search box when NOT searching:
 *   1) Popular cities (flag + city)
 *   2) Popular teams (club crest + team name)
 *
 * IMPORTANT:
 * - No repeated team/city (e.g., Madrid + Real Madrid). If a team-city overlaps a popular city,
 *   we remove the CITY chip (keep the TEAM chip).
 * - Team crests must be stable (not dependent on fixtures window).
 *   API-Football (API-Sports) team logos follow this CDN pattern:
 *   https://media.api-sports.io/football/teams/{id}.png
 */
const API_SPORTS_TEAM_LOGO = (teamId: number) => `https://media.api-sports.io/football/teams/${teamId}.png`;

type CityChip = { name: string; countryCode: string };
type TeamChip = { name: string; teamId: number; cityName: string };

// Your chosen 5 cities
const POPULAR_CITIES: CityChip[] = [
  { name: "Paris", countryCode: "FR" },
  { name: "Rome", countryCode: "IT" },
  { name: "Barcelona", countryCode: "ES" },
  { name: "Amsterdam", countryCode: "NL" },
  { name: "Lisbon", countryCode: "PT" },
];

// Your chosen 5 teams (API-Football IDs)
const POPULAR_TEAMS: TeamChip[] = [
  { name: "Real Madrid", teamId: 541, cityName: "Madrid" },
  { name: "Arsenal", teamId: 42, cityName: "London" },
  { name: "Bayern Munich", teamId: 157, cityName: "Munich" },
  { name: "Inter Milan", teamId: 505, cityName: "Milan" },
  { name: "Borussia Dortmund", teamId: 165, cityName: "Dortmund" },
];

type DiscoveryIntent = "standard" | "weekend48" | "cheapOvernight" | "family" | "luxury" | "lastMinute";
type DiscoveryMode = "standard" | "cheapestWeekend" | "doubles";
type KickoffWindow = "any" | "morning" | "afternoon" | "evening" | "late";

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

function tripSummaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} match${n === 1 ? "" : "es"}`;
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

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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
      <View pointerEvents="none" style={styles.crestRing} />
    </View>
  );
}

type ShortcutWindow = { from: string; to: string };

type DiscoverWindowKey = "wknd" | "d7" | "d14" | "d30" | "any";
type DiscoverTripLength = "day" | "1" | "2" | "3" | "any";
type DiscoverVibe = "big" | "hidden" | "easy" | "nightlife" | "culture" | "warm";

function windowKeyToWindow(key: DiscoverWindowKey): ShortcutWindow {
  if (key === "wknd") return nextWeekendWindowIso();
  if (key === "d7") return windowFromTomorrowIso(7);
  if (key === "d14") return windowFromTomorrowIso(14);
  if (key === "d30") return windowFromTomorrowIso(30);
  return getRollingWindowIso({ days: 60 });
}

function labelForWindowKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "This weekend";
  if (key === "d7") return "Next 7 days";
  if (key === "d14") return "Next 14 days";
  if (key === "d30") return "Next 30 days";
  return "Any time";
}

function labelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day trip";
  if (v === "1") return "1 night";
  if (v === "2") return "2 nights";
  if (v === "3") return "3 nights";
  return "Any";
}

function labelForVibe(v: DiscoverVibe) {
  if (v === "big") return "Big match";
  if (v === "hidden") return "Hidden gem";
  if (v === "easy") return "Easy travel";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  return "Warm-ish";
}

/**
 * Upcoming match scoring (simple, deterministic, V1-safe):
 * - Big uplift if fixture includes one of POPULAR_TEAMS (by team id if present; fallback by name match)
 * - Weekend uplift
 * - Evening uplift
 * - Venue present uplift
 * - Round contains "Final/Semi/Quarter/Derby" uplift
 */
function scoreFixture(r: FixtureListRow): number {
  let s = 0;

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;
  const homeName = String(r?.teams?.home?.name ?? "").toLowerCase();
  const awayName = String(r?.teams?.away?.name ?? "").toLowerCase();

  const popularIds = new Set(POPULAR_TEAMS.map((t) => t.teamId));
  const isPopularHome =
    typeof homeId === "number" ? popularIds.has(homeId) : POPULAR_TEAMS.some((t) => homeName.includes(t.name.toLowerCase()));
  const isPopularAway =
    typeof awayId === "number" ? popularIds.has(awayId) : POPULAR_TEAMS.some((t) => awayName.includes(t.name.toLowerCase()));

  if (isPopularHome) s += 80;
  if (isPopularAway) s += 80;
  if (isPopularHome && isPopularAway) s += 60;

  const venueName = String(r?.fixture?.venue?.name ?? "").trim();
  const venueCity = String(r?.fixture?.venue?.city ?? "").trim();
  if (venueName) s += 12;
  if (venueCity) s += 6;

  const round = String(r?.league?.round ?? "").toLowerCase();
  if (round.includes("final")) s += 40;
  if (round.includes("semi")) s += 25;
  if (round.includes("quarter")) s += 15;
  if (round.includes("derby")) s += 18;

  const dt = r?.fixture?.date ? new Date(r.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) {
    const day = dt.getDay(); // 0 Sun ... 6 Sat
    if (day === 5 || day === 6 || day === 0) s += 14; // Fri/Sat/Sun
    const hr = dt.getHours();
    if (hr >= 17 && hr <= 21) s += 10;
  }

  return s;
}

/**
 * Home -> Fixtures "intent presets" without changing UI:
 * - We wire these to LONG PRESS on existing Quick Shortcut cards.
 * - Normal press stays exactly as-is (Build Trip Global).
 */
function shortcutToDiscoveryPreset(key: DiscoverWindowKey): {
  intent: DiscoveryIntent;
  mode: DiscoveryMode;
  flexDays: 0 | 3 | 7;
  kickoffWindow: KickoffWindow;
  sort: "attractiveness";
} {
  if (key === "wknd") {
    return { intent: "weekend48", mode: "standard", flexDays: 3, kickoffWindow: "any", sort: "attractiveness" };
  }
  if (key === "d7") {
    return { intent: "lastMinute", mode: "standard", flexDays: 0, kickoffWindow: "any", sort: "attractiveness" };
  }
  if (key === "d14") {
    return { intent: "standard", mode: "standard", flexDays: 3, kickoffWindow: "any", sort: "attractiveness" };
  }
  if (key === "d30") {
    return { intent: "standard", mode: "standard", flexDays: 7, kickoffWindow: "any", sort: "attractiveness" };
  }
  return { intent: "standard", mode: "standard", flexDays: 7, kickoffWindow: "any", sort: "attractiveness" };
}

function pickRandom<T>(arr: T[]): T | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const i = Math.floor(Math.random() * arr.length);
  return arr[i] ?? null;
}

export default function HomeScreen() {
  const router = useRouter();

  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);

  // defaults to 90 days (centralised)
  const { from: fromIso, to: toIso } = useMemo(() => getRollingWindowIso(), []);

  // Upcoming matches window is always next 14 days (as agreed) — inclusive
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

  // Fixtures preview (next 14 days, scored top 5)
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
        setFxError(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [league, upcomingWindow.from, upcomingWindow.to]);

  const fxPreview = useMemo(() => {
    const scored = (fxRows ?? [])
      .filter((r) => r?.fixture?.id != null)
      .map((r) => ({ r, s: scoreFixture(r) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r);

    return scored.slice(0, 5);
  }, [fxRows]);

  // SEARCH
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
        setSearchError(e?.message ?? "Search index failed to build.");
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
    return querySearchIndex(idx, qNorm, { limit: 24 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qNorm, searchIndexBuiltAt]);

  const buckets = useMemo(() => splitSearchBuckets(rawSearchResults), [rawSearchResults]);

  const clearSearch = useCallback(() => {
    setQ("");
    Keyboard.dismiss();
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const goBuildTripWithContext = useCallback(
    (fixtureId?: string) => {
      router.push({
        pathname: "/trip/build",
        params: {
          ...(fixtureId ? { fixtureId } : {}),
          leagueId: String(league.leagueId),
          season: String(league.season),
          from: fromIso,
          to: toIso,
        },
      } as any);
    },
    [router, league.leagueId, league.season, fromIso, toIso]
  );

  const goBuildTripGlobal = useCallback(
    (window?: ShortcutWindow) => {
      const w = window ?? getRollingWindowIso({ days: 60 });
      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          from: w.from,
          to: w.to,
        },
      } as any);
    },
    [router]
  );

  const goMatchWithContext = useCallback(
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

  const goFixturesWithContext = useCallback(
    (params?: { leagueId?: number; season?: number; venue?: string }) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          leagueId: String(params?.leagueId ?? league.leagueId),
          season: String(params?.season ?? league.season),
          from: fromIso,
          to: toIso,
          ...(params?.venue ? { venue: params.venue } : {}),
        },
      } as any);
    },
    [router, league.leagueId, league.season, fromIso, toIso]
  );

  /**
   * NEW (additive): long-press shortcut cards to open Fixtures with discovery params.
   * Standardised: leagueId=0 means "all leagues".
   */
  const goFixturesPreset = useCallback(
    (key: DiscoverWindowKey, w: ShortcutWindow) => {
      const preset = shortcutToDiscoveryPreset(key);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          leagueId: "0", // ALL LEAGUES (standard)
          from: w.from,
          to: w.to,
          intent: preset.intent,
          mode: preset.mode,
          flexDays: String(preset.flexDays),
          kickoffWindow: preset.kickoffWindow,
          sort: preset.sort,
        },
      } as any);
    },
    [router]
  );

  const onPressSearchResult = useCallback(
    (r: SearchResult) => {
      const p: any = r.payload;

      if (p?.kind === "team") {
        router.push({
          pathname: "/team/[teamKey]",
          params: { teamKey: p.slug, from: fromIso, to: toIso },
        } as any);
        return;
      }

      if (p?.kind === "city") {
        router.push({
          pathname: "/city/[slug]",
          params: { slug: p.slug, from: fromIso, to: toIso },
        } as any);
        return;
      }

      if (p?.kind === "venue") {
        const venueName = String(r.title ?? "").trim();
        goFixturesWithContext({
          leagueId: league.leagueId,
          season: league.season,
          venue: venueName || String(p.slug ?? "").trim(),
        });
        return;
      }

      if (p?.kind === "country") {
        goFixturesWithContext({ leagueId: p.leagueId, season: p.season });
        return;
      }

      if (p?.kind === "league") {
        goFixturesWithContext({ leagueId: p.leagueId, season: p.season });
        return;
      }
    },
    [router, fromIso, toIso, goFixturesWithContext, league.leagueId, league.season]
  );

  const resultMeta = useCallback((r: SearchResult): string => {
    const p: any = r.payload;

    if (r.type === "team" && p?.kind === "team") {
      return hasTeamGuide(p.slug) ? "Team guide available" : "Team guide coming soon";
    }

    if (r.type === "city" && p?.kind === "city") {
      return getCityGuide(p.slug) ? "City guide available" : "City guide coming soon";
    }

    if (r.type === "venue") return r.subtitle ?? "Venue";
    if (r.type === "country") return r.subtitle ?? "Country";
    if (r.type === "league") return r.subtitle ?? "League";

    return r.subtitle ?? "";
  }, []);

  // ---------------------------
  // POPULAR CHIPS (NO DUPES)
  // ---------------------------

  const dedupedPopularTeams = useMemo(() => dedupeBy(POPULAR_TEAMS, (t) => String(t.teamId)), []);
  const teamCitiesLower = useMemo(() => new Set(dedupedPopularTeams.map((t) => toKey(t.cityName))), [dedupedPopularTeams]);

  // If a city overlaps a team-city, remove the city chip (prevents "Madrid" + "Real Madrid" etc).
  const filteredPopularCities = useMemo(() => {
    const dedupedCities = dedupeBy(POPULAR_CITIES, (c) => toKey(c.name));
    return dedupedCities.filter((c) => !teamCitiesLower.has(toKey(c.name)));
  }, [teamCitiesLower]);

  const quickShortcuts = useMemo(
    () => [
      { key: "wknd", label: "This weekend", sub: "Sat–Sun", window: nextWeekendWindowIso() },
      { key: "d7", label: "Next 7 days", sub: "Quick break", window: windowFromTomorrowIso(7) },
      { key: "d14", label: "Next 14 days", sub: "Pick a match", window: windowFromTomorrowIso(14) },
      { key: "d30", label: "Next 30 days", sub: "More options", window: windowFromTomorrowIso(30) },
      { key: "any", label: "Any time", sub: "Browse broadly", window: getRollingWindowIso({ days: 60 }) },
    ],
    []
  );

  // ---------------------------
  // DISCOVER: Surprise + Hidden
  // ---------------------------
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("wknd");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverFrom, setDiscoverFrom] = useState<string>("");

  const [surpriseLoading, setSurpriseLoading] = useState(false);

  const toggleVibe = useCallback((v: DiscoverVibe) => {
    setDiscoverVibes((prev) => {
      const has = prev.includes(v);
      const next = has ? prev.filter((x) => x !== v) : [...prev, v];
      if (next.length > 3) return next.slice(next.length - 3);
      return next;
    });
  }, []);

  const popularCityNames = useMemo(() => {
    const citySet = new Set<string>();
    for (const c of POPULAR_CITIES) citySet.add(toKey(c.name));
    for (const t of POPULAR_TEAMS) citySet.add(toKey(t.cityName));
    return citySet;
  }, []);

  const buildDiscoverParams = useCallback(
    (opts: { window: ShortcutWindow; league: LeagueOption; fixtureId: string; mode: "surprise" | "hidden" }) => {
      const fromText = discoverFrom.trim();
      const vibes = discoverVibes.length ? discoverVibes.join(",") : "any";

      return {
        global: "1",
        fixtureId: opts.fixtureId,
        leagueId: String(opts.league.leagueId),
        season: String(opts.league.season),
        from: opts.window.from,
        to: opts.window.to,

        prefMode: opts.mode,
        prefFrom: fromText ? fromText : undefined,
        prefWindow: discoverWindowKey,
        prefLength: discoverTripLength,
        prefVibes: vibes,
      } as any;
    },
    [discoverFrom, discoverTripLength, discoverVibes, discoverWindowKey]
  );

  const pickFixtureFromLeagues = useCallback(async (w: ShortcutWindow, filter: (r: FixtureListRow) => boolean) => {
    const tried = new Set<number>();

    for (let attempt = 0; attempt < 5; attempt++) {
      const remaining = LEAGUES.filter((l) => !tried.has(l.leagueId));
      const next = pickRandom(remaining.length ? remaining : LEAGUES);
      if (!next) break;

      tried.add(next.leagueId);

      const res = await getFixtures({
        league: next.leagueId,
        season: next.season,
        from: w.from,
        to: w.to,
      });

      const list = Array.isArray(res) ? (res as FixtureListRow[]) : [];
      const valid = list.filter((r) => r?.fixture?.id != null).filter(filter);

      if (valid.length > 0) {
        const chosen = pickRandom(valid);
        const fixtureId = chosen?.fixture?.id != null ? String(chosen.fixture.id) : null;
        if (fixtureId) return { league: next, fixtureId };
      }
    }

    return null;
  }, []);

  const goDiscover = useCallback(
    async (mode: "surprise" | "hidden") => {
      if (surpriseLoading) return;
      setSurpriseLoading(true);

      try {
        const w = windowKeyToWindow(discoverWindowKey);

        const filter = (r: FixtureListRow) => {
          const city = toKey(String(r?.fixture?.venue?.city ?? ""));
          const venue = String(r?.fixture?.venue?.name ?? "").trim();
          const hasVenue = Boolean(venue);
          if (!hasVenue) return false;

          if (mode === "hidden") {
            if (!city) return false;
            if (popularCityNames.has(city)) return false;
          }

          return true;
        };

        const picked = await pickFixtureFromLeagues(w, filter);

        if (!picked) {
          Alert.alert("No matches found", "Try another window or try again in a moment.");
          return;
        }

        router.push({
          pathname: "/trip/build",
          params: buildDiscoverParams({
            window: w,
            league: picked.league,
            fixtureId: picked.fixtureId,
            mode,
          }),
        } as any);
      } catch (e: any) {
        Alert.alert(mode === "hidden" ? "Hidden Gem failed" : "Surprise Me failed", e?.message ?? "Try again.");
      } finally {
        setSurpriseLoading(false);
      }
    },
    [buildDiscoverParams, discoverWindowKey, pickFixtureFromLeagues, popularCityNames, router, surpriseLoading]
  );

  const openDiscover = useCallback(() => setDiscoverOpen(true), []);
  const closeDiscover = useCallback(() => setDiscoverOpen(false), []);

  return (
    <Background imageSource={getBackground("home")} overlayOpacity={0.74}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* HERO */}
          <GlassCard style={styles.heroCard} strength="strong" noPadding>
            <View style={styles.heroShell}>
              <View pointerEvents="none" style={styles.edgeGlowWide} />
              <View pointerEvents="none" style={styles.edgeGlowCore} />
              <View pointerEvents="none" style={styles.vignetteTop} />
              <View pointerEvents="none" style={styles.vignetteTR} />

              <Text style={styles.heroTitle}>Plan your next European football trip</Text>

              <Text style={styles.heroSub}>Search countries, cities, teams, or venues — then jump into fixtures or build a trip.</Text>

              <View style={styles.searchBox}>
                <View pointerEvents="none" style={styles.searchSheen} />

                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search country, city or team"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={dismissKeyboard}
                />

                {qNorm.length > 0 ? (
                  <Pressable onPress={clearSearch} style={styles.clearBtn} hitSlop={10}>
                    <Text style={styles.clearBtnText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Popular scrollers (ONLY when not searching) */}
              {!showSearchResults ? (
                <View style={styles.popularBlock}>
                  <View style={styles.popularHeader}>
                    <Text style={styles.popularTitle}>Popular cities</Text>
                    <Text style={styles.popularMeta}>Tap to search</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow} decelerationRate="fast">
                    {filteredPopularCities.map((c) => (
                      <Pressable
                        key={`city-${c.name}`}
                        onPress={() => setQ(c.name)}
                        style={({ pressed }) => [styles.popularChip, pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] }]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <CityFlag code={c.countryCode} />
                        <Text style={styles.popularChipText}>{c.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View style={[styles.popularHeader, { marginTop: 12 }]}>
                    <Text style={styles.popularTitle}>Popular teams</Text>
                    <Text style={styles.popularMeta}>Crests • Tap to search</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow} decelerationRate="fast">
                    {dedupedPopularTeams.map((t) => (
                      <Pressable
                        key={`team-${t.teamId}`}
                        onPress={() => setQ(t.name)}
                        style={({ pressed }) => [styles.teamChip, pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] }]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <View style={styles.teamCrestWrap}>
                          <TeamCrest teamId={t.teamId} />
                          <View pointerEvents="none" style={styles.teamCrestRing} />
                        </View>
                        <Text style={styles.teamChipText} numberOfLines={1}>
                          {t.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {showSearchResults ? (
                <View style={styles.searchResults}>
                  {searchLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Preparing search…</Text>
                    </View>
                  ) : null}

                  {!searchLoading && searchError ? <EmptyState title="Search unavailable" message={searchError} /> : null}

                  {!searchLoading && !searchError ? (
                    <>
                      <View style={styles.group}>
                        <View style={styles.groupHeader}>
                          <Text style={styles.groupTitle}>Teams & Cities</Text>
                          <Text style={styles.groupMeta}>Tap to open</Text>
                        </View>

                        {buckets.teams.length === 0 && buckets.cities.length === 0 ? (
                          <Text style={styles.groupEmpty}>No teams or cities found.</Text>
                        ) : (
                          <View style={styles.resultList}>
                            {[...buckets.teams.slice(0, 6), ...buckets.cities.slice(0, 6)]
                              .slice(0, 10)
                              .map((r, idx) => (
                                <Pressable
                                  key={`${r.key}-${idx}`}
                                  onPress={() => onPressSearchResult(r)}
                                  style={styles.rowPress}
                                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                                >
                                  <GlassCard strength="subtle" noPadding style={styles.rowCard}>
                                    <View style={styles.rowInner}>
                                      <View style={{ flex: 1 }}>
                                        <Text style={styles.rowTitle}>{r.title}</Text>
                                        <Text style={styles.rowMeta}>{resultMeta(r)}</Text>
                                      </View>
                                      <Text style={styles.chev}>›</Text>
                                    </View>
                                  </GlassCard>
                                </Pressable>
                              ))}
                          </View>
                        )}
                      </View>

                      <View style={styles.group}>
                        <View style={styles.groupHeader}>
                          <Text style={styles.groupTitle}>Venues, Countries & Leagues</Text>
                          <Text style={styles.groupMeta}>Routes to Fixtures</Text>
                        </View>

                        {buckets.venues.length === 0 && buckets.countries.length === 0 && buckets.leagues.length === 0 ? (
                          <Text style={styles.groupEmpty}>No venues/countries/leagues found.</Text>
                        ) : (
                          <View style={styles.resultList}>
                            {[...buckets.venues.slice(0, 5), ...buckets.countries.slice(0, 5), ...buckets.leagues.slice(0, 5)]
                              .slice(0, 10)
                              .map((r, idx) => (
                                <Pressable
                                  key={`${r.key}-${idx}`}
                                  onPress={() => onPressSearchResult(r)}
                                  style={styles.rowPress}
                                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                                >
                                  <GlassCard strength="subtle" noPadding style={styles.rowCard}>
                                    <View style={styles.rowInner}>
                                      <View style={{ flex: 1 }}>
                                        <Text style={styles.rowTitle}>{r.title}</Text>
                                        <Text style={styles.rowMeta}>{resultMeta(r)}</Text>
                                      </View>
                                      <Text style={styles.chev}>›</Text>
                                    </View>
                                  </GlassCard>
                                </Pressable>
                              ))}
                          </View>
                        )}

                        <Pressable
                          onPress={() => goFixturesWithContext()}
                          style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.94, transform: [{ scale: 0.995 }] }]}
                          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                        >
                          <View pointerEvents="none" style={styles.linkBtnSheen} />
                          <Text style={styles.linkText}>Open Fixtures</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>
          </GlassCard>

          {/* UPCOMING MATCHES */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming matches</Text>
              <Text style={styles.sectionMeta}>
                {league.label} • Top picks • {labelForWindowKey("d14")}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
              {LEAGUES.map((l) => {
                const active = l.leagueId === league.leagueId;
                return (
                  <Pressable
                    key={l.leagueId}
                    onPress={() => setLeague(l)}
                    style={({ pressed }) => [styles.leaguePill, active && styles.leaguePillActive, pressed && { opacity: 0.94 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                    <LeagueFlag code={l.countryCode} />
                  </Pressable>
                );
              })}
            </ScrollView>

            <GlassCard style={styles.card} strength="default">
              {fxLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!fxLoading && fxError ? <EmptyState title="Fixtures unavailable" message={fxError} /> : null}

              {!fxLoading && !fxError && fxPreview.length === 0 ? (
                <EmptyState title="No fixtures found" message="Try another league or try again later." />
              ) : null}

              {!fxLoading && !fxError && fxPreview.length > 0 ? (
                <View style={styles.matchList}>
                  {fxPreview.map((r, idx) => {
                    const id = r?.fixture?.id;
                    const fixtureId = id ? String(id) : null;
                    const line = fixtureLine(r);

                    return (
                      <Pressable
                        key={fixtureId ?? `fx-${idx}`}
                        onPress={() => (fixtureId ? goMatchWithContext(fixtureId) : null)}
                        disabled={!fixtureId}
                        style={({ pressed }) => [styles.matchRowPress, pressed && { opacity: 0.94 }]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <GlassCard strength="subtle" noPadding style={styles.matchRowCard}>
                          <View style={styles.matchRowInner}>
                            <CrestSquare row={r} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.matchTitle}>{line.title}</Text>
                              <Text style={styles.matchMeta}>{line.meta}</Text>
                            </View>
                            <Text style={styles.chev}>›</Text>
                          </View>
                        </GlassCard>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.ctaRow}>
                <Pressable
                  onPress={() => goFixturesWithContext({ leagueId: league.leagueId, season: league.season })}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.94 }]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.btnGhostText}>Fixtures</Text>
                </Pressable>

                <Pressable
                  onPress={() => goBuildTripWithContext()}
                  style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.94 }]}
                  android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                >
                  <Text style={styles.btnPrimaryText}>Build trip</Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>

          {/* TRIPS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trips</Text>
              <Text style={styles.sectionMeta}>Your next plan</Text>
            </View>

            <GlassCard style={styles.card} strength="default">
              {/* Visual boost header strip */}
              <View style={styles.tripsTopStrip}>
                <View pointerEvents="none" style={styles.tripsTopSheen} />
                <Text style={styles.tripsTopKicker}>🧳 Trip hub</Text>
                <Text style={styles.tripsTopHint}>Keep everything in one place: match, stay, and plan.</Text>
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
                  <Text style={styles.emptyMeta}>Start with a match — then build the break in one hub.</Text>

                  <View style={styles.ctaRow}>
                    <Pressable
                      onPress={() => goBuildTripWithContext()}
                      style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.94 }]}
                      android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                    >
                      <Text style={styles.btnPrimaryText}>Build trip</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => router.push("/(tabs)/trips")}
                    style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.94, transform: [{ scale: 0.995 }] }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <View pointerEvents="none" style={styles.linkBtnSheen} />
                    <Text style={styles.linkText}>Open Trips</Text>
                  </Pressable>
                </>
              ) : null}

              {loadedTrips && nextTrip ? (
                <>
                  <Pressable
                    onPress={() => router.push({ pathname: "/trip/[id]", params: { id: nextTrip.id } } as any)}
                    style={({ pressed }) => [styles.nextTripPress, pressed && { opacity: 0.94 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <GlassCard strength="subtle" noPadding style={styles.nextTripCard}>
                      <View style={styles.nextTripInner}>
                        <Text style={styles.nextTripKicker}>Next up</Text>
                        <Text style={styles.nextTripTitle}>{nextTrip.cityId || "Trip"}</Text>
                        <Text style={styles.nextTripMeta}>{tripSummaryLine(nextTrip)}</Text>
                      </View>
                    </GlassCard>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push("/(tabs)/trips")}
                    style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.94, transform: [{ scale: 0.995 }] }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <View pointerEvents="none" style={styles.linkBtnSheen} />
                    <Text style={styles.linkText}>Open Trips</Text>
                  </Pressable>
                </>
              ) : null}
            </GlassCard>
          </View>

          {/* QUICK SHORTCUTS (HIDE DURING SEARCH) */}
          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick shortcuts</Text>
                <Text style={styles.sectionMeta}>Build Trip • Global • pick a window</Text>
              </View>

              <View style={styles.shortcutWrap}>
                <View pointerEvents="none" style={styles.shortcutRail} />
                <View pointerEvents="none" style={styles.shortcutRailSheen} />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutRow} decelerationRate="fast">
                  {quickShortcuts.map((x) => {
                    const featured = x.key === "wknd";
                    const icon =
                      x.key === "wknd"
                        ? "📅"
                        : x.key === "d7"
                        ? "⚡"
                        : x.key === "d14"
                        ? "🎟️"
                        : x.key === "d30"
                        ? "🗺️"
                        : "🧭";

                    return (
                      <Pressable
                        key={x.key}
                        onPress={() => goBuildTripGlobal(x.window)}
                        onLongPress={() => goFixturesPreset(x.key as any, x.window)}
                        delayLongPress={280}
                        style={({ pressed }) => [
                          styles.shortcutCard,
                          featured && styles.shortcutCardFeatured,
                          pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
                        ]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        {featured ? <View pointerEvents="none" style={styles.shortcutGlowEdge} /> : null}
                        <View pointerEvents="none" style={styles.shortcutSheenTop} />

                        <View style={styles.shortcutTopRow}>
                          <Text style={styles.shortcutTitle}>{x.label}</Text>

                          <View style={[styles.shortcutBadge, featured && styles.shortcutBadgeFeatured]}>
                            <Text style={styles.shortcutBadgeText}>{icon}</Text>
                          </View>
                        </View>

                        {featured ? <Text style={styles.shortcutMicro}>Best for match + 1–2 nights</Text> : null}

                        <View style={styles.shortcutFooter}>
                          <View style={styles.shortcutPill}>
                            <Text style={styles.shortcutPillText}>{x.sub}</Text>
                          </View>
                          <Text style={styles.chev}>›</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View pointerEvents="none" style={styles.shortcutFade} />
              </View>
            </View>
          ) : null}

          {/* DISCOVER */}
          {!showSearchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Discover</Text>
                <Text style={styles.sectionMeta}>Randomise or find hidden gems</Text>
              </View>

              <View style={styles.discoverGrid}>
                <Pressable
                  onPress={() => goDiscover("surprise")}
                  disabled={surpriseLoading}
                  android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                  style={({ pressed }) => [styles.discoverPress, (pressed || surpriseLoading) && { opacity: 0.94, transform: [{ scale: 0.99 }] }]}
                >
                  <GlassCard strength="default" noPadding style={[styles.discoverCard, styles.discoverCardPrimary, surpriseLoading && { opacity: 0.88 }]}>
                    <View pointerEvents="none" style={styles.discoverGlowEdge} />
                    <View pointerEvents="none" style={styles.discoverSheenTop} />

                    <View style={styles.discoverBadge}>
                      <Text style={styles.discoverBadgeText}>🎲</Text>
                    </View>

                    <View style={styles.discoverInner}>
                      <Text style={styles.discoverTitle}>Surprise me</Text>
                      <Text style={styles.discoverSub}>
                        {labelForWindowKey(discoverWindowKey)} • {labelForTripLength(discoverTripLength)}
                      </Text>

                      <View style={styles.discoverFooter}>
                        <Text style={styles.discoverHint}>{discoverVibes.length ? discoverVibes.map(labelForVibe).join(" • ") : "Any vibe"}</Text>
                        {surpriseLoading ? <ActivityIndicator /> : <Text style={styles.chev}>›</Text>}
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>

                <Pressable
                  onPress={() => goDiscover("hidden")}
                  disabled={surpriseLoading}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  style={({ pressed }) => [styles.discoverPress, (pressed || surpriseLoading) && { opacity: 0.94, transform: [{ scale: 0.99 }] }]}
                >
                  <GlassCard strength="default" noPadding style={[styles.discoverCard, styles.discoverCardSecondary, surpriseLoading && { opacity: 0.88 }]}>
                    <View pointerEvents="none" style={styles.discoverGlowEdgeSoft} />
                    <View pointerEvents="none" style={styles.discoverSheenTop} />

                    <View style={styles.discoverBadge}>
                      <Text style={styles.discoverBadgeText}>💎</Text>
                    </View>

                    <View style={styles.discoverInner}>
                      <Text style={styles.discoverTitle}>Hidden gems</Text>
                      <Text style={styles.discoverSub}>Avoid obvious cities • Find something different</Text>

                      <View style={styles.discoverFooter}>
                        <Text style={styles.discoverHint}>Curated by simple heuristics (no price claims)</Text>
                        {surpriseLoading ? <ActivityIndicator /> : <Text style={styles.chev}>›</Text>}
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              </View>

              <Pressable
                onPress={openDiscover}
                style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.94, transform: [{ scale: 0.995 }] }]}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <View pointerEvents="none" style={styles.linkBtnSheen} />
                <Text style={styles.linkText}>Refine Discover preferences</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={{ height: 10 }} />
        </ScrollView>

        {/* DISCOVER PREFERENCES MODAL */}
        <Modal visible={discoverOpen} animationType="fade" transparent onRequestClose={closeDiscover}>
          <Pressable style={styles.modalBackdrop} onPress={closeDiscover} />
          <View style={styles.modalSheetWrap} pointerEvents="box-none">
            <GlassCard strength="strong" style={styles.modalSheet} noPadding>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Discover preferences</Text>
                  <Pressable
                    onPress={closeDiscover}
                    hitSlop={10}
                    style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.92 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={styles.modalCloseText}>Done</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalKicker}>Flying from (optional)</Text>
                <View style={styles.modalInputWrap}>
                  <TextInput
                    value={discoverFrom}
                    onChangeText={setDiscoverFrom}
                    placeholder="e.g. London, LGW, MAN"
                    placeholderTextColor={theme.colors.textTertiary}
                    style={styles.modalInput}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                </View>

                <Text style={styles.modalKicker}>Date window</Text>
                <View style={styles.modalChipsRow}>
                  {(["wknd", "d7", "d14", "d30", "any"] as DiscoverWindowKey[]).map((k) => {
                    const active = discoverWindowKey === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setDiscoverWindowKey(k)}
                        style={({ pressed }) => [styles.modalChip, active && styles.modalChipActive, pressed && { opacity: 0.94 }]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>{labelForWindowKey(k)}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.modalKicker}>Trip length</Text>
                <View style={styles.modalChipsRow}>
                  {(["day", "1", "2", "3", "any"] as DiscoverTripLength[]).map((k) => {
                    const active = discoverTripLength === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setDiscoverTripLength(k)}
                        style={({ pressed }) => [styles.modalChip, active && styles.modalChipActive, pressed && { opacity: 0.94 }]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>{labelForTripLength(k)}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.modalKicker}>Vibe (pick up to 3)</Text>
                <View style={styles.modalChipsRow}>
                  {(["easy", "big", "hidden", "nightlife", "culture", "warm"] as DiscoverVibe[]).map((v) => {
                    const active = discoverVibes.includes(v);
                    return (
                      <Pressable
                        key={v}
                        onPress={() => toggleVibe(v)}
                        style={({ pressed }) => [styles.modalChip, active && styles.modalChipActive, pressed && { opacity: 0.94 }]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>{labelForVibe(v)}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      setDiscoverWindowKey("wknd");
                      setDiscoverTripLength("2");
                      setDiscoverVibes(["easy"]);
                      setDiscoverFrom("");
                    }}
                    style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.94 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={styles.btnGhostText}>Reset</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      closeDiscover();
                      goDiscover("surprise");
                    }}
                    style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.94 }]}
                    android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                  >
                    <Text style={styles.btnPrimaryText}>Surprise me</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalFootnote}>Note: Pricing appears later when booking partners are connected.</Text>
              </View>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

// STYLES UNCHANGED
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  heroCard: { marginTop: theme.spacing.lg, borderRadius: theme.borderRadius.xl },
  heroShell: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 18,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },

  edgeGlowWide: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 18,
    backgroundColor: "rgba(79,224,138,0.12)",
  },
  edgeGlowCore: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(79,224,138,0.65)",
  },

  vignetteTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  vignetteTR: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 220,
    height: 220,
    borderRadius: 240,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  heroTitle: { color: theme.colors.text, fontSize: 26, fontWeight: theme.fontWeight.black, lineHeight: 32 },
  heroSub: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
  },

  searchBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.16)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  searchSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    opacity: 0.55,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
    fontWeight: theme.fontWeight.bold,
  },

  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.22)",
    backgroundColor: "rgba(0,0,0,0.14)",
    overflow: "hidden",
  },
  clearBtnText: {
    color: "rgba(242,244,246,0.72)",
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // Popular scrollers (Option A)
  popularBlock: { marginTop: 12 },
  popularHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  popularTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  popularMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },
  popularRow: { gap: 10, paddingRight: theme.spacing.lg, marginTop: 10, paddingVertical: 4 },

  popularChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.52)" : "rgba(22,25,29,0.46)",
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  popularChipText: { color: "rgba(242,244,246,0.78)", fontSize: 13, fontWeight: theme.fontWeight.semibold },
  cityFlag: { width: 16, height: 12, borderRadius: 3, opacity: 0.92 },

  teamChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.55)" : "rgba(22,25,29,0.48)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 170,
    overflow: "hidden",
  },
  teamCrestWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  teamCrestRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.10)",
    borderRadius: 12,
  },
  teamCrest: { width: 22, height: 22, opacity: 0.95 },
  teamChipText: { flex: 1, color: "rgba(242,244,246,0.82)", fontSize: 13, fontWeight: theme.fontWeight.black },

  section: { marginTop: 2 },
  sectionHeader: { gap: 4 },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  sectionMeta: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  card: { padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // Search results
  searchResults: { marginTop: 14, gap: 16 },
  group: { gap: 10 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  groupTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  groupMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },
  groupEmpty: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },
  resultList: { gap: 10 },

  rowPress: { borderRadius: 16, overflow: "hidden" },
  rowCard: { borderRadius: 16 },
  rowInner: { paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  rowTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 15 },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },
  chev: { color: theme.colors.textTertiary, fontSize: 24, marginTop: -2 },

  // League selector w/ flags
  leagueRow: { gap: 10, paddingRight: theme.spacing.lg, marginTop: 10 },
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
    overflow: "hidden",
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  // Match list
  matchList: { marginTop: 10, gap: 10 },
  matchRowPress: { borderRadius: 16, overflow: "hidden" },
  matchRowCard: { borderRadius: 16 },
  matchRowInner: { paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 },

  crestWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.12)",
    borderRadius: 14,
  },
  crestImg: { width: 30, height: 30, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.4 },

  matchTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  matchMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // CTA row
  ctaRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  btnPrimary: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 15, fontWeight: theme.fontWeight.black },

  // Link button
  linkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    alignItems: "center",
    overflow: "hidden",
  },
  linkBtnSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    opacity: 0.6,
  },
  linkText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  // Trips
  tripsTopStrip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.14)",
    backgroundColor: Platform.OS === "android" ? "rgba(12,14,16,0.28)" : "rgba(12,14,16,0.24)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  tripsTopSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    opacity: 0.6,
  },
  tripsTopKicker: { color: "rgba(79,224,138,0.80)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.3 },
  tripsTopHint: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 18 },

  emptyTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  emptyMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  nextTripPress: { borderRadius: 16, marginTop: 2, overflow: "hidden" },
  nextTripCard: { borderRadius: 16 },
  nextTripInner: { paddingVertical: 14, paddingHorizontal: 14 },
  nextTripKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },
  nextTripTitle: { marginTop: 6, color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  nextTripMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  // Quick shortcuts
  shortcutWrap: { position: "relative", marginTop: 2 },
  shortcutRow: { gap: 10, paddingRight: theme.spacing.lg, marginTop: 10, paddingVertical: 6 },

  shortcutRail: {
    position: "absolute",
    left: -theme.spacing.lg,
    right: -theme.spacing.lg,
    top: 8,
    height: 128,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.26)" : "rgba(10,12,14,0.22)",
  },
  shortcutRailSheen: {
    position: "absolute",
    left: -theme.spacing.lg,
    right: -theme.spacing.lg,
    top: 8,
    height: 26,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    opacity: 0.6,
  },

  shortcutCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.55)" : "rgba(22,25,29,0.48)",
    paddingVertical: 14,
    paddingHorizontal: 14,
    minWidth: 178,
    overflow: "hidden",
  },

  shortcutCardFeatured: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.62)" : "rgba(22,25,29,0.54)",
    minWidth: 210,
  },

  shortcutGlowEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "rgba(79,224,138,0.75)",
    opacity: 0.7,
  },

  shortcutSheenTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    opacity: 0.65,
  },

  shortcutTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

  shortcutTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },

  shortcutMicro: {
    marginTop: 8,
    color: "rgba(79,224,138,0.70)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  shortcutBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  shortcutBadgeFeatured: {
    borderColor: "rgba(79,224,138,0.22)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  shortcutBadgeText: { fontSize: 16, opacity: 0.95 },

  shortcutFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 },

  shortcutPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },

  shortcutPillText: { color: "rgba(242,244,246,0.72)", fontSize: 12, fontWeight: theme.fontWeight.black },

  shortcutFade: {
    position: "absolute",
    right: 0,
    top: 16,
    bottom: 0,
    width: 34,
    backgroundColor: "rgba(0,0,0,0.55)",
    opacity: 0.65,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  // Discover
  discoverGrid: { flexDirection: "row", gap: 10, marginTop: 10 },
  discoverPress: { flex: 1, borderRadius: 16, overflow: "hidden" },

  discoverCard: { borderRadius: 16, overflow: "hidden" },
  discoverCardPrimary: {
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.62)" : "rgba(22,25,29,0.54)",
  },
  discoverCardSecondary: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.52)" : "rgba(22,25,29,0.46)",
  },

  discoverGlowEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "rgba(79,224,138,0.75)",
    opacity: 0.7,
  },
  discoverGlowEdgeSoft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(79,224,138,0.35)",
    opacity: 0.55,
  },
  discoverSheenTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    opacity: 0.65,
  },

  discoverBadge: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  discoverBadgeText: { fontSize: 16, opacity: 0.95 },

  discoverInner: { paddingVertical: 14, paddingHorizontal: 14, gap: 8 },
  discoverTitle: { color: theme.colors.text, fontSize: 16, fontWeight: theme.fontWeight.black },
  discoverSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    lineHeight: 18,
    opacity: 0.92,
  },
  discoverFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 2 },
  discoverHint: { flex: 1, color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, opacity: 0.78 },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
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
    overflow: "hidden",
  },
  modalCloseText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  modalKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },
  modalInputWrap: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  modalInput: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.bold },

  modalChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.55)" : "rgba(22,25,29,0.48)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  modalChipActive: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  modalChipText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  modalChipTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalFootnote: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16 },
});
