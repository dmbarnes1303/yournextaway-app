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
  nextWeekendWindowIso,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { buildSearchIndex, querySearchIndex, type SearchResult } from "@/src/services/searchIndex";
import { hasTeamGuide } from "@/src/data/teamGuides";
import { getCityGuide } from "@/src/data/cityGuides";
import { getFlagImageUrl } from "@/src/utils/flagImages";
import { getPopularTeams, POPULAR_TEAM_IDS } from "@/src/data/teams";

const API_SPORTS_TEAM_LOGO = (teamId: number) => `https://media.api-sports.io/football/teams/${teamId}.png`;

type ShortcutWindow = { from: string; to: string };
type CityChip = { name: string; countryCode: string };

// Popular cities (Home-only)
const POPULAR_CITIES: CityChip[] = [
  { name: "Paris", countryCode: "FR" },
  { name: "Rome", countryCode: "IT" },
  { name: "Barcelona", countryCode: "ES" },
  { name: "Amsterdam", countryCode: "NL" },
  { name: "Lisbon", countryCode: "PT" },
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
]);

type DiscoverWindowKey = "wknd" | "d7" | "d14" | "d30";
type DiscoverTripLength = "day" | "1" | "2" | "3";
type DiscoverVibe = "easy" | "big" | "hidden" | "nightlife" | "culture" | "warm";

function toKey(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

// City route is /city/key/:cityKey
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

  if (typeof homeId === "number" && POPULAR_TEAM_IDS.has(homeId)) s += 60;
  if (typeof awayId === "number" && POPULAR_TEAM_IDS.has(awayId)) s += 60;

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

function windowForKey(key: DiscoverWindowKey): ShortcutWindow {
  if (key === "wknd") return nextWeekendWindowIso();
  if (key === "d7") return windowFromTomorrowIso(7);
  if (key === "d14") return windowFromTomorrowIso(14);
  return windowFromTomorrowIso(30);
}

function labelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "This Weekend";
  if (key === "d7") return "Next 7 Days";
  if (key === "d14") return "Next 14 Days";
  return "Next 30 Days";
}

function labelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day Trip";
  if (v === "1") return "1 Night";
  if (v === "2") return "2 Nights";
  return "3 Nights";
}

function labelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy Travel";
  if (v === "big") return "Big Match";
  if (v === "hidden") return "Different";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  return "Warm-ish";
}

function pickRandom<T>(arr: T[]): T | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

/**
 * Popular Cities chip — small flag icon next to city name (no background flag).
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
  const flagUrl = getFlagImageUrl(countryCode, { size: 48 });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cityPill, pressed && styles.pressedPill]}
      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
    >
      {flagUrl ? <Image source={{ uri: flagUrl }} style={styles.cityFlagIcon} resizeMode="cover" /> : null}
      <Text style={styles.pillText}>{name}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const homeTopLeagues = useMemo(() => {
    const list = LEAGUES.filter((l) => HOME_TOP_LEAGUE_IDS.has(l.leagueId));
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
        router.push({ pathname: "/team/[teamKey]", params: { teamKey: p.slug, from: fromIso, to: toIso } } as any);
        return;
      }

      if (p?.kind === "city") {
        goCityKey(p.slug);
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
    [router, fromIso, toIso, league.leagueId, league.season, goCityKey]
  );

  const resultMeta = useCallback((r: SearchResult): string => {
    const p: any = r.payload;
    if (r.type === "team" && p?.kind === "team") return hasTeamGuide(p.slug) ? "Team Guide Available" : "Team Guide Coming Soon";
    if (r.type === "city" && p?.kind === "city") return getCityGuide(p.slug) ? "City Guide Available" : "City Guide Coming Soon";
    return r.subtitle ?? "";
  }, []);

  const cities = useMemo(() => dedupeBy(POPULAR_CITIES, (c) => toKey(c.name)).slice(0, 5), []);

  // Popular Teams (deep-link, no search)
  const popularTeams = useMemo(() => {
    return getPopularTeams()
      .filter((t) => typeof (t as any)?.teamId === "number")
      .slice(0, 5);
  }, []);

  // How + Discover prefs
  const [howOpen, setHowOpen] = useState(false);

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
    return citySet;
  }, []);

  const pickFixtureFromLeagues = useCallback(async (w: ShortcutWindow, filter: (r: FixtureListRow) => boolean) => {
    const tried = new Set<number>();

    for (let attempt = 0; attempt < 5; attempt++) {
      const remaining = LEAGUES.filter((l) => !tried.has(l.leagueId));
      const next = pickRandom(remaining.length ? remaining : LEAGUES);
      if (!next) break;

      tried.add(next.leagueId);

      const res = await getFixtures({ league: next.leagueId, season: next.season, from: w.from, to: w.to });
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
        const w = windowForKey(discoverWindowKey);

        const filter = (r: FixtureListRow) => {
          const city = toKey(String(r?.fixture?.venue?.city ?? ""));
          const venue = String(r?.fixture?.venue?.name ?? "").trim();
          if (!venue) return false;

          if (mode === "hidden") {
            if (!city) return false;
            if (popularCityNames.has(city)) return false;
          }
          return true;
        };

        const picked = await pickFixtureFromLeagues(w, filter);

        if (!picked) {
          Alert.alert("No Matches Found", "Try Another Window Or Try Again In A Moment.");
          return;
        }

        setDiscoverOpen(false);

        router.push({
          pathname: "/trip/build",
          params: {
            global: "1",
            fixtureId: picked.fixtureId,
            leagueId: String(picked.league.leagueId),
            season: String(picked.league.season),
            from: w.from,
            to: w.to,
            prefMode: mode,
            prefFrom: discoverFrom.trim() ? discoverFrom.trim() : undefined,
            prefWindow: discoverWindowKey,
            prefLength: discoverTripLength,
            prefVibes: discoverVibes.join(","),
          },
        } as any);
      } catch (e: any) {
        Alert.alert(mode === "hidden" ? "Hidden Gems Failed" : "Surprise Me Failed", e?.message ?? "Try Again.");
      } finally {
        setSurpriseLoading(false);
      }
    },
    [
      surpriseLoading,
      discoverWindowKey,
      popularCityNames,
      pickFixtureFromLeagues,
      router,
      discoverFrom,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const quickTiles = useMemo(
    () => [
      { key: "weekend", title: "Weekend Break", sub: "Best for 1–2 nights", icon: "📅", onPress: () => goBuildTripGlobal(nextWeekendWindowIso()) },
      { key: "daytrip", title: "Day Trip", sub: "Pick a same-day kickoff", icon: "⏱️", onPress: () => goBuildTripGlobal(windowFromTomorrowIso(14)) },
      { key: "midweek", title: "Midweek Escape", sub: "One-night quick break", icon: "⚡", onPress: () => goBuildTripGlobal(windowFromTomorrowIso(7)) },
      { key: "fixtures", title: "Browse Fixtures", sub: "Explore all options", icon: "🎟️", onPress: () => goFixturesAll() },
    ],
    [goBuildTripGlobal, goFixturesAll]
  );

  // Trips: display assets (flag + team crest) and capitalise city name.
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
    return getFlagImageUrl(nextTripCountryCode, { size: 64 }) ?? "";
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

  const openTrip = useCallback(() => {
    if (!nextTrip) return;
    const id: any = (nextTrip as any).id ?? (nextTrip as any).tripId ?? null;
    if (!id) {
      Alert.alert("Trip Unavailable", "This trip has no ID yet.");
      return;
    }
    router.push({ pathname: "/trip/[id]", params: { id: String(id) } } as any);
  }, [nextTrip, router]);

  return (
    <Background imageSource={getBackground("home")} overlayOpacity={0.62}>
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
                  placeholder="Search…"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {q.trim().length > 0 ? (
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
                      onPress={goFixturesAll}
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

                  <View style={styles.heroSecondaryRow}>
                    <Pressable
                      onPress={() => setDiscoverOpen(true)}
                      style={({ pressed }) => [styles.heroMiniBtn, pressed && styles.pressed]}
                      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                    >
                      <Text style={styles.heroMiniBtnText}>Discover</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setHowOpen(true)}
                      style={({ pressed }) => [styles.heroMiniBtn, styles.heroMiniBtnAccent, pressed && styles.pressed]}
                      android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                    >
                      <Text style={styles.heroMiniBtnAccentText}>How It Works</Text>
                    </Pressable>
                  </View>
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
                      {(buckets.teams.length +
                        buckets.cities.length +
                        buckets.venues.length +
                        buckets.countries.length +
                        buckets.leagues.length) === 0 ? (
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

              {/* Popular (your latest section) */}
              {!showSearchResults ? (
                <View style={styles.popularBlock}>
                  <Text style={styles.sectionKicker}>Popular Cities</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow} decelerationRate="fast">
                    {cities.map((c) => (
                      <CityChipPremium key={`pc-${c.name}`} name={c.name} countryCode={c.countryCode} onPress={() => goCityFromName(c.name)} />
                    ))}
                  </ScrollView>

                  <Text style={[styles.sectionKicker, { marginTop: 10 }]}>Popular Teams</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow} decelerationRate="fast">
                    {popularTeams
                      .filter((t) => typeof (t as any)?.teamId === "number")
                      .slice(0, 5)
                      .map((t: any) => (
                        <Pressable
                          key={`pt-${String(t.teamKey ?? t.teamId ?? t.name)}`}
                          onPress={() => {
                            Keyboard.dismiss();
                            setQ("");
                            router.push({ pathname: "/team/[teamKey]", params: { teamKey: String(t.teamKey), from: fromIso, to: toIso } } as any);
                          }}
                          style={({ pressed }) => [styles.teamPill, pressed && styles.pressedPill]}
                          android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                        >
                          <View style={styles.teamCrestDot}>
                            <Image
                              source={{ uri: `https://media.api-sports.io/football/teams/${t.teamId}.png` }}
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

          {/* QUICK START */}
          {!showSearchResults ? (
            <GlassCard strength="default" style={styles.block} noPadding>
              <View style={styles.blockInner}>
                <Text style={styles.blockTitle}>Quick Start</Text>
                <View style={styles.tileGrid}>
                  {quickTiles.map((t) => (
                    <Pressable
                      key={t.key}
                      onPress={t.onPress}
                      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
                      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                    >
                      <Text style={styles.tileIcon}>{t.icon}</Text>
                      <Text style={styles.tileTitle}>{t.title}</Text>
                      <Text style={styles.tileSub}>{t.sub}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </GlassCard>
          ) : null}

          {/* NEXT TRIP */}
          {!showSearchResults ? (
            <GlassCard strength="default" style={styles.block} noPadding>
              <View style={styles.blockInner}>
                <View style={styles.rowBetween}>
                  <Text style={styles.blockTitle}>Next Trip</Text>
                  <Text style={styles.miniMeta}>{loadedTrips ? `${upcomingTrips.length} Upcoming` : "Loading…"}</Text>
                </View>

                {!loadedTrips ? (
                  <View style={styles.centerRow}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Loading trips…</Text>
                  </View>
                ) : nextTrip ? (
                  <Pressable onPress={openTrip} style={({ pressed }) => [styles.nextTripCard, pressed && styles.pressedRow]}>
                    <View style={styles.nextTripLeft}>
                      {nextTripFlagUrl ? <Image source={{ uri: nextTripFlagUrl }} style={styles.nextTripFlag} /> : null}
                      <View style={{ gap: 4, flex: 1 }}>
                        <Text style={styles.nextTripTitle}>{nextTripCityTitle || "Trip"}</Text>
                        <Text style={styles.nextTripSub}>{tripSummaryLine(nextTrip)}</Text>
                      </View>
                    </View>

                    <View style={styles.nextTripRight}>
                      {typeof nextTripTeamId === "number" ? (
                        <View style={styles.nextTripCrestDot}>
                          <TeamCrest teamId={nextTripTeamId} size={18} />
                        </View>
                      ) : null}
                      <Text style={styles.chev}>›</Text>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>No upcoming trips yet.</Text>
                    <Text style={styles.emptyMsg}>Start a Trip Hub from fixtures, a team, or a city.</Text>
                    <Pressable
                      onPress={() => goBuildTripGlobal()}
                      style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
                      android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                    >
                      <Text style={styles.ctaBtnText}>Start A Trip Hub</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </GlassCard>
          ) : null}

          {/* FEATURED FIXTURES */}
          {!showSearchResults ? (
            <GlassCard strength="default" style={styles.block} noPadding>
              <View style={styles.blockInner}>
                <View style={styles.rowBetween}>
                  <Text style={styles.blockTitle}>Standout Matches</Text>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/fixtures",
                        params: { leagueId: String(league.leagueId), season: String(league.season), from: upcomingWindow.from, to: upcomingWindow.to },
                      } as any)
                    }
                    style={({ pressed }) => [styles.linkPill, pressed && styles.pressedPill]}
                    android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                  >
                    <Text style={styles.linkPillText}>View All</Text>
                  </Pressable>
                </View>

                {/* League picker */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
                  {homeTopLeagues.map((l) => {
                    const active = l.leagueId === league.leagueId;
                    return (
                      <Pressable
                        key={`${l.leagueId}-${l.season}`}
                        onPress={() => setLeague(l)}
                        style={({ pressed }) => [styles.leaguePill, active && styles.leaguePillActive, pressed && styles.pressedPill]}
                        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                      >
                        <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]} numberOfLines={1}>
                          {String((l as any).name ?? (l as any).label ?? `League ${l.leagueId}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {fxLoading ? (
                  <View style={styles.centerRow}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Loading fixtures…</Text>
                  </View>
                ) : fxError ? (
                  <EmptyState title="Fixtures Unavailable" message={fxError} />
                ) : !featured ? (
                  <Text style={styles.groupEmpty}>No fixtures found in this window.</Text>
                ) : (
                  <>
                    {/* Featured */}
                    <Pressable
                      onPress={() => goMatch(String(featured.fixture.id))}
                      style={({ pressed }) => [styles.featuredCard, pressed && styles.pressedRow]}
                      android_ripple={{ color: "rgba(79,224,138,0.08)" }}
                    >
                      <CrestSquare row={featured} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.featuredTitle}>{fixtureLine(featured).title}</Text>
                        <Text style={styles.featuredMeta}>{fixtureLine(featured).meta}</Text>
                      </View>
                      <Text style={styles.chev}>›</Text>
                    </Pressable>

                    {/* Next up list */}
                    <View style={styles.miniList}>
                      {list.map((r) => (
                        <Pressable
                          key={`fx-${String(r.fixture.id)}`}
                          onPress={() => goMatch(String(r.fixture.id))}
                          style={({ pressed }) => [styles.miniRow, pressed && styles.pressedRow]}
                          android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                        >
                          <View style={styles.dot} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.miniTitle}>{fixtureLine(r).title}</Text>
                            <Text style={styles.miniMeta} numberOfLines={1}>
                              {fixtureLine(r).meta}
                            </Text>
                          </View>
                          <Text style={styles.chev}>›</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </GlassCard>
          ) : null}
        </ScrollView>

        {/* HOW IT WORKS MODAL */}
        <Modal visible={howOpen} transparent animationType="fade" onRequestClose={() => setHowOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setHowOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>How It Works</Text>
              <Text style={styles.modalText}>
                1) Find a match via Search or Fixtures{"\n"}
                2) Start a Trip Hub (your workspace){"\n"}
                3) Add the sections you need: tickets, stays, flights, things, transfers, notes{"\n"}
                4) Save items and move them to booked when you’re done
              </Text>

              <Pressable
                onPress={() => {
                  setHowOpen(false);
                  goFixturesAll();
                }}
                style={({ pressed }) => [styles.modalBtn, pressed && styles.pressed]}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <Text style={styles.modalBtnText}>Browse Fixtures</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* DISCOVER MODAL */}
        <Modal visible={discoverOpen} transparent animationType="fade" onRequestClose={() => setDiscoverOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setDiscoverOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Discover</Text>
              <Text style={styles.modalTextMuted}>Pick a window and vibe. We’ll drop you into a Trip Hub around a great match.</Text>

              <Text style={styles.modalLabel}>When</Text>
              <View style={styles.pillRow}>
                {(["wknd", "d7", "d14", "d30"] as DiscoverWindowKey[]).map((k) => {
                  const active = k === discoverWindowKey;
                  return (
                    <Pressable
                      key={`w-${k}`}
                      onPress={() => setDiscoverWindowKey(k)}
                      style={({ pressed }) => [styles.modalPill, active && styles.modalPillActive, pressed && styles.pressedPill]}
                    >
                      <Text style={[styles.modalPillText, active && styles.modalPillTextActive]}>{labelForKey(k)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.modalLabel, { marginTop: 10 }]}>Trip Length</Text>
              <View style={styles.pillRow}>
                {(["day", "1", "2", "3"] as DiscoverTripLength[]).map((k) => {
                  const active = k === discoverTripLength;
                  return (
                    <Pressable
                      key={`l-${k}`}
                      onPress={() => setDiscoverTripLength(k)}
                      style={({ pressed }) => [styles.modalPill, active && styles.modalPillActive, pressed && styles.pressedPill]}
                    >
                      <Text style={[styles.modalPillText, active && styles.modalPillTextActive]}>{labelForTripLength(k)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.modalLabel, { marginTop: 10 }]}>Vibes (pick up to 3)</Text>
              <View style={styles.pillRowWrap}>
                {(["easy", "big", "hidden", "nightlife", "culture", "warm"] as DiscoverVibe[]).map((v) => {
                  const active = discoverVibes.includes(v);
                  return (
                    <Pressable
                      key={`v-${v}`}
                      onPress={() => toggleVibe(v)}
                      style={({ pressed }) => [styles.modalPill, active && styles.modalPillActive, pressed && styles.pressedPill]}
                    >
                      <Text style={[styles.modalPillText, active && styles.modalPillTextActive]}>{labelForVibe(v)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.modalLabel, { marginTop: 10 }]}>Starting From (optional)</Text>
              <View style={styles.modalInputWrap}>
                <TextInput
                  value={discoverFrom}
                  onChangeText={setDiscoverFrom}
                  placeholder="e.g., London"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.modalInput}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  onPress={() => goDiscover("surprise")}
                  disabled={surpriseLoading}
                  style={({ pressed }) => [styles.modalBtnWide, styles.modalBtnPrimary, pressed && styles.pressed, surpriseLoading && { opacity: 0.7 }]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.modalBtnWideText}>{surpriseLoading ? "Finding…" : "Surprise Me"}</Text>
                </Pressable>

                <Pressable
                  onPress={() => goDiscover("hidden")}
                  disabled={surpriseLoading}
                  style={({ pressed }) => [styles.modalBtnWide, styles.modalBtnGhost, pressed && styles.pressed, surpriseLoading && { opacity: 0.7 }]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.modalBtnWideGhostText}>{surpriseLoading ? "Finding…" : "Hidden Gems"}</Text>
                </Pressable>
              </View>

              <Pressable onPress={() => setDiscoverOpen(false)} style={({ pressed }) => [styles.modalClose, pressed && styles.pressedPill]}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
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

  heroTitle: { color: theme.colors.text, fontSize: 26, lineHeight: 32, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },
  heroSub: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: theme.fontWeight.bold, opacity: 0.94 },

  searchBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
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

  heroSecondaryRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  heroMiniBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(18,20,24,0.28)" : "rgba(18,20,24,0.22)",
    paddingVertical: 10,
    alignItems: "center",
    overflow: "hidden",
  },
  heroMiniBtnText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },
  heroMiniBtnAccent: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
  },
  heroMiniBtnAccentText: { color: "rgba(79,224,138,0.92)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },

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

  popularBlock: { marginTop: 4, gap: 8 },
  sectionKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.3 },
  popularRow: { gap: 10, paddingRight: theme.spacing.lg, paddingVertical: 4 },

  cityPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(18,20,24,0.32)" : "rgba(18,20,24,0.26)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cityFlagIcon: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },
  pillText: { color: "rgba(242,244,246,0.78)", fontSize: 13, fontWeight: theme.fontWeight.black },

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

  block: { borderRadius: 22 },
  blockInner: { padding: theme.spacing.lg, gap: 12 },
  blockTitle: { color: theme.colors.text, fontSize: 16, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },

  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    overflow: "hidden",
  },
  tileIcon: { fontSize: 18, marginBottom: 6 },
  tileTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  tileSub: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },
  centerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  center: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  nextTripCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Platform.OS === "android" ? "rgba(18,20,24,0.26)" : "rgba(18,20,24,0.20)",
  },
  nextTripLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  nextTripRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  nextTripFlag: { width: 22, height: 16, borderRadius: 3, opacity: 0.9 },
  nextTripTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  nextTripSub: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },
  nextTripCrestDot: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  emptyBox: { gap: 8, paddingVertical: 2 },
  emptyTitle: { color: theme.colors.text, fontSize: 13, fontWeight: theme.fontWeight.black },
  emptyMsg: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 18 },

  ctaBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    overflow: "hidden",
  },
  ctaBtnText: { color: "rgba(79,224,138,0.92)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },

  linkPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    overflow: "hidden",
  },
  linkPillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  leagueRow: { gap: 8, paddingVertical: 2, paddingRight: theme.spacing.lg },
  leaguePill: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(18,20,24,0.26)" : "rgba(18,20,24,0.20)",
    overflow: "hidden",
    maxWidth: 220,
  },
  leaguePillActive: { borderColor: "rgba(79,224,138,0.22)" },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  leaguePillTextActive: { color: theme.colors.text },

  featuredCard: {
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.18)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featuredTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  featuredMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  miniList: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
  },
  miniRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: "rgba(79,224,138,0.70)" },
  miniTitle: { color: theme.colors.text, fontSize: 13, fontWeight: theme.fontWeight.black },
  miniMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },

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

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalCard: {
    borderRadius: 22,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(18,20,24,0.92)" : "rgba(18,20,24,0.86)",
    gap: 10,
  },
  modalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: theme.fontWeight.black },
  modalText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 20 },
  modalTextMuted: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 18, opacity: 0.9 },

  modalBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.24)",
    overflow: "hidden",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
  },
  modalBtnText: { color: "rgba(79,224,138,0.92)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.2 },

  modalLabel: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.2, marginTop: 2 },

  pillRow: { flexDirection: "row", gap: 8, flexWrap: "nowrap" },
  pillRowWrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  modalPill: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  modalPillActive: { borderColor: "rgba(79,224,138,0.28)" },
  modalPillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  modalPillTextActive: { color: theme.colors.text },

  modalInputWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
  modalInput: { color: theme.colors.text, fontSize: 13, fontWeight: theme.fontWeight.black },

  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtnWide: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  modalBtnPrimary: { borderColor: "rgba(79,224,138,0.24)", backgroundColor: "rgba(10,12,14,0.18)" },
  modalBtnGhost: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.14)" },
  modalBtnWideText: { color: theme.colors.text, fontSize: 12, fontWeight: theme.fontWeight.black },
  modalBtnWideGhostText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  modalClose: { alignSelf: "center", marginTop: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
  modalCloseText: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },
});
