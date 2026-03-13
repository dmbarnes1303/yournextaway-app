// app/(tabs)/fixtures.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import {
  LEAGUES,
  FEATURED_LEAGUES,
  LEAGUE_BROWSE_REGION_ORDER,
  LEAGUE_BROWSE_REGION_LABELS,
  type LeagueOption,
  type LeagueBrowseRegion,
} from "@/src/constants/football";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getFlagImageUrl } from "@/src/utils/flagImages";

import tripsStore from "@/src/state/trips";
import useFollowStore from "@/src/state/followStore";

import {
  computeLikelyPlaceholderTbcIds,
  kickoffIsoOrNull,
} from "@/src/utils/kickoffTbc";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";

import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
import { POPULAR_TEAM_IDS, getTeam } from "@/src/data/teams";

import {
  buildDiscoverScores,
  type DiscoverFixture,
  type DiscoverReason,
} from "@/src/features/discover/discoverEngine";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DAYS_AHEAD = 365;
const MAX_MULTI_LEAGUES = 10;
const STRIP_DAYS = 7;

/* -------------------------------------------------------------------------- */
/* Discover                                                                   */
/* -------------------------------------------------------------------------- */

type DiscoverCategory =
  | "bigMatches"
  | "derbies"
  | "atmospheres"
  | "valueTrips"
  | "legendaryStadiums"
  | "iconicCities"
  | "perfectTrips"
  | "nightMatches"
  | "titleDrama"
  | "easyTickets"
  | "bucketList"
  | "matchdayCulture"
  | "underratedTrips";

const DISCOVER_CATEGORY_META: Record<
  DiscoverCategory,
  {
    title: string;
    subtitle: string;
    helper: string;
  }
> = {
  bigMatches: {
    title: "Big Matches",
    subtitle: "Highest-profile fixtures in the selected window",
    helper:
      "Discover mode • ranked for occasion, club size, derby energy, and night factor",
  },
  derbies: {
    title: "Derbies & Rivalries",
    subtitle: "Fixtures with the strongest rivalry signal",
    helper: "Discover mode • ranked for derby intensity first",
  },
  atmospheres: {
    title: "Insane Atmospheres",
    subtitle: "Fixtures likely to deliver the strongest matchday atmosphere",
    helper: "Discover mode • ranked for atmosphere and occasion",
  },
  valueTrips: {
    title: "Best Value Football Trips",
    subtitle: "Fixtures leaning toward better-value travel and ticket potential",
    helper: "Discover mode • ranked for value over prestige",
  },
  legendaryStadiums: {
    title: "Legendary Stadiums",
    subtitle: "Fixtures weighted toward iconic clubs and stadium pull",
    helper: "Discover mode • ranked for stadium and club prestige",
  },
  iconicCities: {
    title: "Iconic Football Cities",
    subtitle: "Fixtures in stronger football city destinations",
    helper: "Discover mode • ranked for city pull and trip appeal",
  },
  perfectTrips: {
    title: "Perfect Football Trips",
    subtitle: "Fixtures with the best all-round trip balance",
    helper: "Discover mode • ranked for overall trip quality",
  },
  nightMatches: {
    title: "Night Matches",
    subtitle: "Fixtures weighted toward evening kickoffs",
    helper: "Discover mode • ranked for later kickoffs and atmosphere",
  },
  titleDrama: {
    title: "Title Race Drama",
    subtitle: "Fixtures leaning toward late-season pressure and stakes",
    helper: "Discover mode • ranked for title-race tension signals",
  },
  easyTickets: {
    title: "Easy Ticket Matches",
    subtitle: "Fixtures leaning toward easier home-ticket access",
    helper: "Discover mode • ranked for easier ticket difficulty first",
  },
  bucketList: {
    title: "Football Bucket List",
    subtitle: "Fixtures with prestige, atmosphere, and destination pull",
    helper: "Discover mode • ranked for once-in-a-while trip appeal",
  },
  matchdayCulture: {
    title: "Best Matchday Culture",
    subtitle: "Fixtures weighted toward atmosphere and football-culture feel",
    helper: "Discover mode • ranked for culture and atmosphere",
  },
  underratedTrips: {
    title: "Underrated Trips",
    subtitle: "Fixtures that look better than their mainstream hype",
    helper: "Discover mode • ranked away from obvious glamour picks",
  },
};

function isDiscoverCategory(value: string | null): value is DiscoverCategory {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(DISCOVER_CATEGORY_META, value);
}

/* -------------------------------------------------------------------------- */
/* Param helpers                                                              */
/* -------------------------------------------------------------------------- */

function coerceString(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function coerceNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* -------------------------------------------------------------------------- */
/* UTC-safe date helpers                                                      */
/* -------------------------------------------------------------------------- */

function isoFromUtcParts(y: number, m0: number, d: number) {
  const ms = Date.UTC(y, m0, d, 0, 0, 0, 0);
  return new Date(ms).toISOString().slice(0, 10);
}

function utcTodayIso() {
  const now = new Date();
  return isoFromUtcParts(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
}

function addDaysIsoUtc(iso: string, days: number) {
  const base = new Date(`${iso}T00:00:00.000Z`);
  const ms = base.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function tomorrowIsoUtc() {
  return addDaysIsoUtc(utcTodayIso(), 1);
}

function clampIsoToWindow(iso: string, minIso: string, maxIso: string) {
  const s = String(iso ?? "").trim();
  if (!s) return minIso;
  if (s < minIso) return minIso;
  if (s > maxIso) return maxIso;
  return s;
}

function normalizeRange(fromIso: string, toIso: string) {
  const a = String(fromIso ?? "").trim();
  const b = String(toIso ?? "").trim();
  if (!a) return { from: b, to: b };
  if (!b) return { from: a, to: a };
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

function isValidIsoDateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? "").trim());
}

/* -------------------------------------------------------------------------- */
/* Ticket helpers                                                             */
/* -------------------------------------------------------------------------- */

function ticketDifficultyLabel(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "very_hard":
      return "Very hard";
    default:
      return "Unknown";
  }
}

function ticketDifficultyRank(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return 4;
    case "medium":
      return 3;
    case "hard":
      return 2;
    case "very_hard":
      return 1;
    default:
      return 0;
  }
}

/* -------------------------------------------------------------------------- */
/* Fixture helpers                                                            */
/* -------------------------------------------------------------------------- */

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const iso = kickoffIsoOrNull(r);
  if (!iso) return null;
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function kickoffPresentation(r: FixtureListRow, placeholderIds?: Set<string>) {
  const certainty = getFixtureCertainty(r, { placeholderIds });
  const iso = kickoffIsoOrNull(r);

  if (!iso) {
    return { primary: "TBC", secondary: "Kickoff time not set yet", certainty };
  }

  const formatted = formatUkDateTimeMaybe(iso) || "TBC";

  if (certainty === "likely_tbc") {
    return {
      primary: formatted,
      secondary: "Likely placeholder (TV schedule not confirmed)",
      certainty,
    };
  }

  if (certainty === "tbc") {
    return {
      primary: formatted,
      secondary: "Kickoff time not confirmed",
      certainty,
    };
  }

  return {
    primary: formatted,
    secondary: null as string | null,
    certainty,
  };
}

function resolveTripForFixture(fixtureId: string): string | null {
  const trips = tripsStore.getState().trips;
  const hit = trips.find((t) => (t.matchIds ?? []).includes(String(fixtureId)));
  return hit ? String(hit.id) : null;
}

/* -------------------------------------------------------------------------- */
/* Base scoring                                                               */
/* -------------------------------------------------------------------------- */

function leagueWeight(leagueId: number | null): number {
  if (leagueId === 39) return 120;
  if (leagueId === 140) return 105;
  if (leagueId === 135) return 100;
  if (leagueId === 78) return 95;
  if (leagueId === 61) return 90;
  if (leagueId === 88) return 82;
  if (leagueId === 94) return 80;
  if (leagueId === 203) return 78;
  if (leagueId === 179) return 75;
  return 60;
}

function baseFixtureScore(r: FixtureListRow): number {
  const lid = r?.league?.id != null ? Number(r.league.id) : null;
  let s = leagueWeight(lid);

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

  const iso = kickoffIsoOrNull(r);
  if (!iso) s -= 8;

  return s;
}

/* -------------------------------------------------------------------------- */
/* Discover ranking                                                           */
/* -------------------------------------------------------------------------- */

function cityPrestigeScore(city: string): number {
  const key = norm(city);
  if (!key) return 0;

  if (
    [
      "london",
      "madrid",
      "barcelona",
      "milan",
      "rome",
      "munich",
      "amsterdam",
      "lisbon",
      "paris",
      "glasgow",
      "istanbul",
      "dortmund",
      "liverpool",
      "manchester",
    ].includes(key)
  ) {
    return 3;
  }

  if (
    [
      "porto",
      "seville",
      "turin",
      "naples",
      "rotterdam",
      "marseille",
      "berlin",
      "vienna",
      "prague",
    ].includes(key)
  ) {
    return 2;
  }

  return 0;
}

function perfectTripScore(scored: DiscoverFixture): number {
  const r = scored.fixture;
  const base = baseFixtureScore(r);

  return (
    base +
    scored.scores.atmosphereScore * 28 +
    scored.scores.valueScore * 24 +
    scored.scores.nightScore * 18 +
    scored.scores.stadiumScore * 20 +
    scored.scores.derbyScore * 16
  );
}

function iconicCityScore(scored: DiscoverFixture): number {
  const city = String(scored.fixture?.fixture?.venue?.city ?? "");
  return (
    cityPrestigeScore(city) * 50 +
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 18
  );
}

function bucketListScore(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 36 +
    scored.scores.atmosphereScore * 26 +
    scored.scores.derbyScore * 18 +
    scored.scores.nightScore * 12
  );
}

function matchdayCultureScore(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.atmosphereScore * 34 +
    scored.scores.derbyScore * 18 +
    scored.scores.nightScore * 12
  );
}

function underratedTripScore(scored: DiscoverFixture): number {
  const r = scored.fixture;
  const base = baseFixtureScore(r);

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;
  const glamourPenalty =
    (typeof homeId === "number" && POPULAR_TEAM_IDS.has(homeId) ? 28 : 0) +
    (typeof awayId === "number" && POPULAR_TEAM_IDS.has(awayId) ? 28 : 0);

  return (
    base +
    scored.scores.atmosphereScore * 26 +
    scored.scores.valueScore * 24 +
    scored.scores.nightScore * 10 -
    glamourPenalty
  );
}

function discoverScoreForCategory(
  category: DiscoverCategory,
  scored: DiscoverFixture
): number {
  const r = scored.fixture;
  const base = baseFixtureScore(r);
  const home = String(r?.teams?.home?.name ?? "");
  const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
  const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";
  const easyRank = ticketDifficultyRank(difficulty);

  switch (category) {
    case "bigMatches":
      return (
        base +
        scored.scores.derbyScore * 34 +
        scored.scores.atmosphereScore * 28 +
        scored.scores.nightScore * 14 +
        scored.scores.titleDramaScore * 18
      );

    case "derbies":
      return (
        base +
        scored.scores.derbyScore * 60 +
        scored.scores.atmosphereScore * 18 +
        scored.scores.nightScore * 8
      );

    case "atmospheres":
      return (
        base +
        scored.scores.atmosphereScore * 42 +
        scored.scores.derbyScore * 14 +
        scored.scores.nightScore * 10
      );

    case "valueTrips":
      return (
        base * 0.45 +
        scored.scores.valueScore * 60 +
        easyRank * 10 +
        scored.scores.nightScore * 6
      );

    case "legendaryStadiums":
      return (
        base +
        scored.scores.stadiumScore * 52 +
        scored.scores.atmosphereScore * 12 +
        scored.scores.derbyScore * 8
      );

    case "iconicCities":
      return iconicCityScore(scored);

    case "perfectTrips":
      return perfectTripScore(scored);

    case "nightMatches":
      return (
        base +
        scored.scores.nightScore * 60 +
        scored.scores.atmosphereScore * 18 +
        scored.scores.derbyScore * 10
      );

    case "titleDrama":
      return (
        base +
        scored.scores.titleDramaScore * 60 +
        scored.scores.derbyScore * 10 +
        scored.scores.atmosphereScore * 10
      );

    case "easyTickets":
      return easyRank * 80 + scored.scores.valueScore * 12 + base * 0.2;

    case "bucketList":
      return bucketListScore(scored);

    case "matchdayCulture":
      return matchdayCultureScore(scored);

    case "underratedTrips":
      return underratedTripScore(scored);

    default:
      return base;
  }
}

/* -------------------------------------------------------------------------- */
/* League / country browse helpers                                            */
/* -------------------------------------------------------------------------- */

function LeagueFlag({ code, size = "sm" }: { code: string; size?: "sm" | "md" }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return (
    <Image
      source={{ uri: url }}
      style={size === "md" ? styles.flagMd : styles.flag}
    />
  );
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function TeamCrest({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
    </View>
  );
}

function prettifyKey(input: string) {
  return String(input ?? "")
    .trim()
    .split("-")
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === "fc") return "FC";
      if (part.toLowerCase() === "if") return "IF";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function featuredClubLine(league: LeagueOption): string {
  const parts = (league.featuredClubKeys ?? []).slice(0, 2).map((key) => {
    const team = getTeam(key);
    if (team?.name && team?.city) return `${team.name} (${team.city})`;
    if (team?.name) return team.name;
    return prettifyKey(key);
  });

  return parts.join(" • ");
}

function leagueScopeSubtitle(selectedLeagues: LeagueOption[]) {
  if (selectedLeagues.length === 0) return "Featured leagues";
  if (selectedLeagues.length === 1) {
    const one = selectedLeagues[0];
    return `${one.label} • ${one.country}`;
  }
  return `${selectedLeagues.length} leagues selected`;
}

/* -------------------------------------------------------------------------- */
/* Concurrency-limited fetch                                                  */
/* -------------------------------------------------------------------------- */

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length) as any;
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }

  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }).map(worker));
  return results;
}

/* -------------------------------------------------------------------------- */
/* Calendar helpers                                                           */
/* -------------------------------------------------------------------------- */

function daysInMonthUtc(year: number, month0: number) {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

function firstWeekdayUtc(year: number, month0: number) {
  const sundayBased = new Date(Date.UTC(year, month0, 1)).getUTCDay();
  return (sundayBased + 6) % 7;
}

function monthLabel(year: number, month0: number) {
  const d = new Date(Date.UTC(year, month0, 1));
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function parseIsoToUtcParts(iso: string) {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: Number(m[1]), m0: Number(m[2]) - 1, d: Number(m[3]) };
}

function buildMonthGrid(year: number, month0: number) {
  const dim = daysInMonthUtc(year, month0);
  const firstW = firstWeekdayUtc(year, month0);
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < firstW; i++) {
    cells.push({ iso: "", day: 0, inMonth: false });
  }
  for (let day = 1; day <= dim; day++) {
    cells.push({ iso: isoFromUtcParts(year, month0, day), day, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ iso: "", day: 0, inMonth: false });
  }

  return cells;
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeFrom = useMemo(() => coerceString((params as any)?.from), [params]);
  const routeTo = useMemo(() => coerceString((params as any)?.to), [params]);
  const routeDiscover = useMemo(() => coerceString((params as any)?.discover), [params]);

  const discoverCategory = useMemo(
    () => (isDiscoverCategory(routeDiscover) ? routeDiscover : null),
    [routeDiscover]
  );

  const routeSort = useMemo(
    () => coerceString((params as any)?.sort) ?? coerceString((params as any)?.mode),
    [params]
  );

  const isTopPicksMode = useMemo(() => {
    const s = String(routeSort ?? "").toLowerCase();
    return s === "rating" || s === "toppicks" || s === "top_picks" || s === "top-picks";
  }, [routeSort]);

  const defaultTopFrom = useMemo(() => minIso, [minIso]);
  const defaultTopTo = useMemo(() => addDaysIsoUtc(minIso, 13), [minIso]);

  const defaultBrowseRange = useMemo(
    () => ({ from: minIso, to: addDaysIsoUtc(minIso, STRIP_DAYS - 1) }),
    [minIso]
  );

  const initialDay = useMemo(() => {
    const base =
      routeFrom && isValidIsoDateOnly(routeFrom)
        ? routeFrom
        : isTopPicksMode
          ? defaultTopFrom
          : minIso;

    return clampIsoToWindow(base, minIso, maxIso);
  }, [routeFrom, isTopPicksMode, defaultTopFrom, minIso, maxIso]);

  const initialRange = useMemo(() => {
    const a =
      routeFrom && isValidIsoDateOnly(routeFrom)
        ? clampIsoToWindow(routeFrom, minIso, maxIso)
        : null;

    const b =
      routeTo && isValidIsoDateOnly(routeTo)
        ? clampIsoToWindow(routeTo, minIso, maxIso)
        : null;

    if (a && b && a !== b) return normalizeRange(a, b);

    if (isTopPicksMode && !a && !b) {
      return { from: defaultTopFrom, to: defaultTopTo };
    }

    if (!isTopPicksMode && !a && !b) {
      return defaultBrowseRange;
    }

    return null;
  }, [
    routeFrom,
    routeTo,
    isTopPicksMode,
    defaultTopFrom,
    defaultTopTo,
    defaultBrowseRange,
    minIso,
    maxIso,
  ]);

  const [selectedDay, setSelectedDay] = useState<string>(initialDay);
  const [range, setRange] = useState<{ from: string; to: string } | null>(initialRange);

  const effectiveRange = useMemo(() => {
    return range
      ? normalizeRange(range.from, range.to)
      : { from: selectedDay, to: selectedDay };
  }, [range, selectedDay]);

  const isRange = useMemo(
    () => effectiveRange.from !== effectiveRange.to,
    [effectiveRange]
  );

  const stripDays = useMemo(() => {
    const start = clampIsoToWindow(selectedDay, minIso, maxIso);
    return Array.from({ length: STRIP_DAYS }).map((_, i) => {
      const iso = addDaysIsoUtc(start, i);
      const d = new Date(`${iso}T00:00:00.000Z`);
      return {
        iso,
        top: d.toLocaleDateString("en-GB", { weekday: "short" }),
        bottom: d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
      };
    });
  }, [selectedDay, minIso, maxIso]);

  const [selectedLeagueIds, setSelectedLeagueIds] = useState<number[]>(() => {
    if (routeLeagueId && Number.isFinite(routeLeagueId)) return [routeLeagueId];
    return [];
  });

  const selectedLeagues = useMemo(() => {
    if (selectedLeagueIds.length === 0) return [] as LeagueOption[];
    const set = new Set(selectedLeagueIds);
    return LEAGUES.filter((l) => set.has(l.leagueId));
  }, [selectedLeagueIds]);

  const fetchLeagues = useMemo(() => {
    if (selectedLeagues.length > 0) return selectedLeagues;
    return FEATURED_LEAGUES;
  }, [selectedLeagues]);

  const leagueSubtitle = useMemo(
    () => leagueScopeSubtitle(selectedLeagues),
    [selectedLeagues]
  );

  const [activeRegion, setActiveRegion] =
    useState<LeagueBrowseRegion>("featured-europe");

  const leaguesByRegion = useMemo(() => {
    const out: Record<LeagueBrowseRegion, LeagueOption[]> = {
      "featured-europe": [],
      "central-eastern-europe": [],
      nordics: [],
    };

    LEAGUES.forEach((league) => {
      if (!league.browseRegion) return;
      out[league.browseRegion].push(league);
    });

    LEAGUE_BROWSE_REGION_ORDER.forEach((region) => {
      out[region].sort(
        (a, b) => a.country.localeCompare(b.country) || a.label.localeCompare(b.label)
      );
    });

    return out;
  }, []);

  const toggleLeague = useCallback((leagueId: number) => {
    setSelectedLeagueIds((prev) => {
      const has = prev.includes(leagueId);

      if (has) return prev.filter((x) => x !== leagueId);

      if (prev.length >= MAX_MULTI_LEAGUES) {
        Alert.alert(
          "Max leagues reached",
          `You can select up to ${MAX_MULTI_LEAGUES} leagues at once.`
        );
        return prev;
      }

      return [...prev, leagueId];
    });
  }, []);

  const selectSingleLeague = useCallback((leagueId: number) => {
    setSelectedLeagueIds([leagueId]);
  }, []);

  const resetToFeatured = useCallback(() => {
    setSelectedLeagueIds([]);
  }, []);

  const [query, setQuery] = useState("");
  const qNorm = query.trim().toLowerCase();

  const followed = useFollowStore((s) => s.followed);
  const toggleFollow = useFollowStore((s) => s.toggle);

  const followedIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const f of followed) {
      const id = String(f.fixtureId ?? "").trim();
      if (id) set.add(id);
    }
    return set;
  }, [followed]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const placeholderIds = useMemo(() => computeLikelyPlaceholderTbcIds(rows), [rows]);

  const fetchFrom = effectiveRange.from;
  const fetchTo = effectiveRange.to;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRows([]);
      setExpandedKey(null);

      try {
        const batches = await mapLimit(fetchLeagues, 4, async (l) => {
          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from: fetchFrom,
            to: fetchTo,
          });
          return Array.isArray(res) ? res : [];
        });

        if (cancelled) return;

        const flat = batches.flat().filter((r) => r?.fixture?.id != null);

        if (discoverCategory) {
          const scored = buildDiscoverScores(flat);

          const ranked = scored
            .map((item) => ({
              fixture: item.fixture,
              reasons: item.reasons,
              discoverScore: discoverScoreForCategory(discoverCategory, item),
              kickoffIso: String(item.fixture?.fixture?.date ?? ""),
            }))
            .sort((a, b) => {
              if (b.discoverScore !== a.discoverScore) {
                return b.discoverScore - a.discoverScore;
              }
              return a.kickoffIso.localeCompare(b.kickoffIso);
            })
            .map((x) => ({
              ...x.fixture,
              discoverReasons: x.reasons,
            }));

          setRows(ranked as FixtureListRow[]);
          return;
        }

        if (isTopPicksMode) {
          flat.sort((a, b) => {
            const sa = baseFixtureScore(a);
            const sb = baseFixtureScore(b);
            if (sb !== sa) return sb - sa;
            const da = String(a?.fixture?.date ?? "");
            const db = String(b?.fixture?.date ?? "");
            return da.localeCompare(db);
          });
        } else {
          flat.sort((a, b) => {
            const da = String(a?.fixture?.date ?? "");
            const db = String(b?.fixture?.date ?? "");
            return da.localeCompare(db);
          });
        }

        setRows(flat);
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
  }, [fetchLeagues, fetchFrom, fetchTo, isTopPicksMode, discoverCategory]);

  const filtered = useMemo(() => {
    const base = rows;

    const dayFiltered = !isRange
      ? base.filter((r) => fixtureIsoDateOnly(r) === effectiveRange.from)
      : base;

    if (!qNorm) return dayFiltered;

    return dayFiltered.filter((r) => {
      return (
        norm(r?.teams?.home?.name).includes(qNorm) ||
        norm(r?.teams?.away?.name).includes(qNorm) ||
        norm(r?.fixture?.venue?.name).includes(qNorm) ||
        norm(r?.fixture?.venue?.city).includes(qNorm) ||
        norm(r?.league?.name).includes(qNorm)
      );
    });
  }, [rows, isRange, effectiveRange.from, qNorm]);

  const goMatch = useCallback(
    (id: string, ctx?: { leagueId?: number | null; season?: number | null }) => {
      const fid = String(id ?? "").trim();
      if (!fid) return;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: fid,
          from: effectiveRange.from,
          to: effectiveRange.to,
          ...(ctx?.leagueId ? { leagueId: String(ctx.leagueId) } : {}),
          ...(ctx?.season ? { season: String(ctx.season) } : {}),
        },
      } as any);
    },
    [router, effectiveRange.from, effectiveRange.to]
  );

  const goTripOrBuild = useCallback(
    (fixtureId: string, ctx?: { leagueId?: number | null; season?: number | null }) => {
      const fid = String(fixtureId ?? "").trim();
      if (!fid) return;

      const existingTripId = resolveTripForFixture(fid);

      if (existingTripId) {
        router.push({ pathname: "/trip/[id]", params: { id: existingTripId } } as any);
        return;
      }

      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId: fid,
          from: effectiveRange.from,
          to: effectiveRange.to,
          ...(ctx?.leagueId ? { leagueId: String(ctx.leagueId) } : {}),
          ...(ctx?.season ? { season: String(ctx.season) } : {}),
        },
      } as any);
    },
    [router, effectiveRange.from, effectiveRange.to]
  );

  const onToggleFollowFromRow = useCallback(
    (r: FixtureListRow) => {
      const fixtureId = r?.fixture?.id != null ? String(r.fixture.id) : "";
      if (!fixtureId) return;

      const leagueId = r?.league?.id != null ? Number(r.league.id) : 0;
      const season = (r as any)?.league?.season != null ? Number((r as any).league.season) : 0;

      const homeTeamId = r?.teams?.home?.id != null ? Number(r.teams.home.id) : 0;
      const awayTeamId = r?.teams?.away?.id != null ? Number(r.teams.away.id) : 0;

      const homeName = r?.teams?.home?.name != null ? String(r.teams.home.name) : null;
      const awayName = r?.teams?.away?.name != null ? String(r.teams.away.name) : null;
      const leagueName = r?.league?.name != null ? String(r.league.name) : null;
      const round = r?.league?.round != null ? String(r.league.round) : null;

      toggleFollow({
        fixtureId,
        leagueId,
        season,
        homeTeamId,
        awayTeamId,
        homeName,
        awayName,
        leagueName,
        round,
        kickoffIso: kickoffIsoOrNull(r),
        venue: r?.fixture?.venue?.name != null ? String(r.fixture.venue.name) : null,
        city: r?.fixture?.venue?.city != null ? String(r.fixture.venue.city) : null,
      });
    },
    [toggleFollow]
  );

  /* ----------------------------- Calendar modal ---------------------------- */

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [calMonthYear, setCalMonthYear] = useState(() => {
    const base =
      parseIsoToUtcParts(selectedDay) ??
      parseIsoToUtcParts(minIso) ?? { y: 2026, m0: 0, d: 1 };

    return { y: base.y, m0: base.m0 };
  });

  const [calPickA, setCalPickA] = useState<string>(selectedDay);
  const [calPickB, setCalPickB] = useState<string>(selectedDay);

  const calNorm = useMemo(() => normalizeRange(calPickA, calPickB), [calPickA, calPickB]);
  const calIsRange = useMemo(() => calNorm.from !== calNorm.to, [calNorm]);

  const openCalendar = useCallback(() => {
    if (range) {
      setCalPickA(range.from);
      setCalPickB(range.to);
      const parts = parseIsoToUtcParts(range.from) ?? parseIsoToUtcParts(selectedDay);
      if (parts) setCalMonthYear({ y: parts.y, m0: parts.m0 });
    } else {
      setCalPickA(selectedDay);
      setCalPickB(selectedDay);
      const parts = parseIsoToUtcParts(selectedDay);
      if (parts) setCalMonthYear({ y: parts.y, m0: parts.m0 });
    }
    setCalendarOpen(true);
  }, [range, selectedDay]);

  const closeCalendar = useCallback(() => setCalendarOpen(false), []);

  const calGrid = useMemo(
    () => buildMonthGrid(calMonthYear.y, calMonthYear.m0),
    [calMonthYear]
  );

  const calPrevMonth = useCallback(() => {
    setCalMonthYear((prev) => {
      const m0 = prev.m0 - 1;
      if (m0 < 0) return { y: prev.y - 1, m0: 11 };
      return { y: prev.y, m0 };
    });
  }, []);

  const calNextMonth = useCallback(() => {
    setCalMonthYear((prev) => {
      const m0 = prev.m0 + 1;
      if (m0 > 11) return { y: prev.y + 1, m0: 0 };
      return { y: prev.y, m0 };
    });
  }, []);

  const calInRange = useCallback(
    (iso: string) => {
      if (!iso) return false;
      return iso >= calNorm.from && iso <= calNorm.to;
    },
    [calNorm]
  );

  const calIsEdge = useCallback(
    (iso: string) => {
      if (!iso) return false;
      return iso === calNorm.from || iso === calNorm.to;
    },
    [calNorm]
  );

  const onCalendarTapDay = useCallback(
    (iso: string) => {
      if (!iso) return;

      const d = clampIsoToWindow(iso, minIso, maxIso);

      if (calPickA === calPickB) {
        if (d === calPickA) return;
        setCalPickB(d);
        return;
      }

      setCalPickA(d);
      setCalPickB(d);
    },
    [calPickA, calPickB, minIso, maxIso]
  );

  const applyCalendar = useCallback(() => {
    const a = clampIsoToWindow(calNorm.from, minIso, maxIso);
    const b = clampIsoToWindow(calNorm.to, minIso, maxIso);
    const n = normalizeRange(a, b);

    if (n.from === n.to) {
      setSelectedDay(n.from);
      setRange(null);
    } else {
      setRange({ from: n.from, to: n.to });
      setSelectedDay(n.from);
    }

    setCalendarOpen(false);
  }, [calNorm, minIso, maxIso]);

  const clearCalendarRange = useCallback(() => {
    setCalPickA(selectedDay);
    setCalPickB(selectedDay);
  }, [selectedDay]);

  /* ----------------------------- Date strip tap ---------------------------- */

  const onTapStripDate = useCallback(
    (iso: string) => {
      const d = clampIsoToWindow(iso, minIso, maxIso);
      setSelectedDay(d);
      setRange(null);
    },
    [minIso, maxIso]
  );

  /* ----------------------------- Titles ----------------------------------- */

  const titleText = useMemo(() => {
    if (discoverCategory) return DISCOVER_CATEGORY_META[discoverCategory].title;
    return isTopPicksMode ? "Top Picks" : "Fixtures";
  }, [discoverCategory, isTopPicksMode]);

  const subtitleText = useMemo(() => {
    if (discoverCategory) return DISCOVER_CATEGORY_META[discoverCategory].subtitle;
    return leagueSubtitle;
  }, [discoverCategory, leagueSubtitle]);

  const helperLineText = useMemo(() => {
    if (discoverCategory) {
      const base = DISCOVER_CATEGORY_META[discoverCategory].helper;
      const datePart = isRange
        ? `${effectiveRange.from} → ${effectiveRange.to}`
        : effectiveRange.from;
      const scopePart =
        selectedLeagueIds.length > 0
          ? `${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues`
          : "Featured scope";

      return `${base} • ${datePart} • ${scopePart}`;
    }

    return `${
      isRange
        ? `Range • ${effectiveRange.from} → ${effectiveRange.to}`
        : `Day • ${effectiveRange.from}`
    }${
      selectedLeagueIds.length > 0
        ? ` • ${selectedLeagueIds.length}/${MAX_MULTI_LEAGUES} leagues`
        : " • Featured scope"
    }${isTopPicksMode ? " • Sorted by rating" : ""}`;
  }, [discoverCategory, isRange, effectiveRange, selectedLeagueIds.length, isTopPicksMode]);

  /* ----------------------------- Row rendering ----------------------------- */

  const renderRow = useCallback(
    ({ item }: { item: FixtureListRow }) => {
      const r = item;
      const fixtureId = r?.fixture?.id != null ? String(r.fixture.id) : "";
      if (!fixtureId) return null;

      const rowKey = `${String(r?.league?.id ?? "L")}-${fixtureId}`;
      const expanded = expandedKey === rowKey;

      const home = String(r?.teams?.home?.name ?? "Home");
      const away = String(r?.teams?.away?.name ?? "Away");

      const venue = String(r?.fixture?.venue?.name ?? "").trim();
      const city = String(r?.fixture?.venue?.city ?? "").trim();

      const kickoff = kickoffPresentation(r, placeholderIds);
      const certainty = kickoff.certainty;
      const isFollowed = followedIdSet.has(fixtureId);

      const ctxLeagueId = r?.league?.id != null ? Number(r.league.id) : null;
      const ctxSeason =
        (r as any)?.league?.season != null ? Number((r as any).league.season) : null;

      const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
      const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";

      const leagueCode =
        String(r?.league?.country ?? "").trim() ||
        LEAGUES.find((l) => l.leagueId === ctxLeagueId)?.countryCode ||
        "";

      const discoverReasons = Array.isArray((r as any).discoverReasons)
        ? ((r as any).discoverReasons as DiscoverReason[])
        : [];

      return (
        <View style={styles.rowWrap}>
          <GlassCard style={styles.rowCard} level="default" variant="matte">
            <Pressable
              onPress={() => setExpandedKey(expanded ? null : rowKey)}
              style={({ pressed }) => [styles.rowMainPress, pressed && { opacity: 0.96 }]}
              android_ripple={{ color: "rgba(255,255,255,0.04)" }}
            >
              <View style={styles.rowInner}>
                <View style={styles.fixtureLeagueLine}>
                  {leagueCode ? <LeagueFlag code={leagueCode} /> : null}
                  <Text style={styles.fixtureLeagueText}>
                    {String(r?.league?.name ?? "")}
                  </Text>
                </View>

                <View style={styles.topRow}>
                  <TeamCrest name={home} logo={r?.teams?.home?.logo} />

                  <View style={styles.centerCol}>
                    <Text style={styles.teamName} numberOfLines={2}>
                      {home}
                    </Text>
                    <Text style={styles.vs}>vs</Text>
                    <Text style={styles.teamName} numberOfLines={2}>
                      {away}
                    </Text>
                  </View>

                  <TeamCrest name={away} logo={r?.teams?.away?.logo} />
                </View>

                <View style={styles.metaBlock}>
                  <Text style={styles.metaPrimary}>{kickoff.primary}</Text>

                  {venue || city ? (
                    <Text style={styles.metaVenue}>
                      {[venue, city].filter(Boolean).join(" • ")}
                    </Text>
                  ) : null}

                  {kickoff.secondary ? (
                    <Text style={styles.metaSecondary}>{kickoff.secondary}</Text>
                  ) : null}
                </View>

                <View style={styles.badgeRow}>
                  <FixtureCertaintyBadge state={certainty} variant="compact" />

                  <View
                    style={[
                      styles.ticketPill,
                      difficulty === "easy" && styles.ticketEasy,
                      difficulty === "medium" && styles.ticketMedium,
                      (difficulty === "hard" || difficulty === "very_hard") &&
                        styles.ticketHard,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ticketText,
                        difficulty === "easy" && styles.ticketTextEasy,
                        difficulty === "medium" && styles.ticketTextMedium,
                        (difficulty === "hard" || difficulty === "very_hard") &&
                          styles.ticketTextHard,
                      ]}
                    >
                      Home tickets: {ticketDifficultyLabel(difficulty)}
                    </Text>
                  </View>
                </View>

                {discoverReasons.length > 0 ? (
                  <View style={styles.discoverReasonRow}>
                    {discoverReasons.slice(0, 3).map((reason) => (
                      <View key={reason} style={styles.discoverReasonPill}>
                        <Text style={styles.discoverReasonText}>{reason}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.followRow}>
                  <Button
                    label={isFollowed ? "Following" : "Follow"}
                    onPress={() => onToggleFollowFromRow(r)}
                    tone={isFollowed ? "secondary" : "primary"}
                    size="sm"
                    glow={!isFollowed}
                    style={{ flex: 1 }}
                  />
                </View>

                <Text style={styles.tapHint}>Tap for actions</Text>
              </View>
            </Pressable>

            {expanded ? (
              <View style={styles.expandArea}>
                <Button
                  label="Match"
                  onPress={() =>
                    goMatch(fixtureId, { leagueId: ctxLeagueId, season: ctxSeason })
                  }
                  tone="secondary"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Build trip"
                  onPress={() =>
                    goTripOrBuild(fixtureId, {
                      leagueId: ctxLeagueId,
                      season: ctxSeason,
                    })
                  }
                  tone="primary"
                  size="md"
                  glow
                  style={{ flex: 1 }}
                />
              </View>
            ) : null}
          </GlassCard>
        </View>
      );
    },
    [
      expandedKey,
      followedIdSet,
      goMatch,
      goTripOrBuild,
      onToggleFollowFromRow,
      placeholderIds,
    ]
  );

  const headerDateLine = useMemo(() => {
    if (!isRange) {
      const d = new Date(`${effectiveRange.from}T00:00:00.000Z`);
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return `${effectiveRange.from} → ${effectiveRange.to}`;
  }, [isRange, effectiveRange]);

  const bg = getBackground("fixtures");
  const bgProps =
    typeof bg === "string"
      ? ({ imageUrl: bg } as const)
      : ({ imageSource: bg } as const);

  const headerComponent = (
    <View style={styles.headerListWrap}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>
            <Text style={styles.dateLine}>{headerDateLine}</Text>
          </View>

          <Button label="Calendar" tone="secondary" size="sm" onPress={openCalendar} />
        </View>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search team, city, venue, or league"
          leftIcon="search"
          variant="default"
          returnKeyType="search"
          allowClear
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 12 }}
        >
          {stripDays.map((d, i) => {
            const active = !isRange && d.iso === selectedDay;

            return (
              <Pressable
                key={`${d.iso}-${i}`}
                onPress={() => onTapStripDate(d.iso)}
                style={[styles.datePill, active && styles.datePillActive]}
              >
                <Text style={[styles.dateTop, active && styles.dateTopActive]}>
                  {d.top}
                </Text>
                <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>
                  {d.bottom}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.scopeRow}>
          <Text style={styles.sectionLabel}>Featured leagues</Text>
          {selectedLeagueIds.length > 0 ? (
            <Button
              label="Reset to featured"
              tone="ghost"
              size="sm"
              onPress={resetToFeatured}
            />
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 12 }}
        >
          {FEATURED_LEAGUES.map((league) => {
            const active =
              selectedLeagueIds.length > 0 &&
              selectedLeagueIds.length === 1 &&
              selectedLeagueIds[0] === league.leagueId;

            return (
              <Pressable
                key={`featured-${league.leagueId}`}
                onPress={() => selectSingleLeague(league.leagueId)}
                style={[styles.featuredLeagueCard, active && styles.featuredLeagueCardActive]}
              >
                <View style={styles.featuredLeagueTop}>
                  <LeagueFlag code={league.countryCode} size="md" />
                  <Text
                    style={[
                      styles.featuredLeagueText,
                      active && styles.featuredLeagueTextActive,
                    ]}
                  >
                    {league.label}
                  </Text>
                </View>
                <Text style={styles.featuredLeagueCountry}>{league.country}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.scopeRow}>
          <Text style={styles.sectionLabel}>Browse by region</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 12 }}
        >
          {LEAGUE_BROWSE_REGION_ORDER.map((region) => {
            const active = region === activeRegion;
            return (
              <Pressable
                key={region}
                onPress={() => setActiveRegion(region)}
                style={[styles.regionPill, active && styles.regionPillActive]}
              >
                <Text style={[styles.regionPillText, active && styles.regionPillTextActive]}>
                  {LEAGUE_BROWSE_REGION_LABELS[region]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.countryGrid}>
          {leaguesByRegion[activeRegion].map((league) => {
            const active = selectedLeagueIds.includes(league.leagueId);

            return (
              <Pressable
                key={`country-card-${league.leagueId}`}
                onPress={() => selectSingleLeague(league.leagueId)}
                onLongPress={() => toggleLeague(league.leagueId)}
                style={[styles.countryCardWrap, active && styles.countryCardWrapActive]}
              >
                <GlassCard style={styles.countryCard} level="default" variant="matte">
                  <View style={styles.countryCardHeader}>
                    <LeagueFlag code={league.countryCode} size="md" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.countryCardCountry}>{league.country}</Text>
                      <Text style={styles.countryCardLeague}>{league.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.countryCardClubs} numberOfLines={2}>
                    {featuredClubLine(league)}
                  </Text>

                  <View style={styles.countryCardFooter}>
                    <Text style={styles.countryCardHint}>Tap to view</Text>
                    <Text style={styles.countryCardHint}>Hold to multi-select</Text>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        {selectedLeagueIds.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 12 }}
          >
            {selectedLeagues.map((league) => (
              <Pressable
                key={`selected-${league.leagueId}`}
                onPress={() => toggleLeague(league.leagueId)}
                style={[styles.leaguePill, styles.leaguePillActive]}
              >
                <Text style={[styles.leagueText, styles.leagueTextActive]}>
                  {league.label}
                </Text>
                <LeagueFlag code={league.countryCode} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Text style={styles.helperLine}>{helperLineText}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.listWrap}>
          {!loading && !error && filtered.length > 0 ? (
            <Text style={styles.resultsLine}>
              {filtered.length} match{filtered.length === 1 ? "" : "es"} found
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <Background {...bgProps} overlayOpacity={0}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <FlatList
          data={loading || error ? [] : filtered}
          keyExtractor={(item, index) => {
            const fid =
              item?.fixture?.id != null ? String(item.fixture.id) : `row-${index}`;
            const lid = item?.league?.id != null ? String(item.league.id) : "L";
            return `${lid}-${fid}`;
          }}
          renderItem={renderRow}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={
            <View style={[styles.content, styles.listWrap]}>
              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!loading && error ? (
                <EmptyState title="Error" message={error} iconName="alert-circle" />
              ) : null}

              {!loading && !error ? (
                <EmptyState
                  title="No matches found"
                  message="Try another date, another region, or a different league selection."
                  iconName="search"
                />
              ) : null}
            </View>
          }
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        />

        <Modal
          visible={calendarOpen}
          animationType="fade"
          transparent
          onRequestClose={closeCalendar}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeCalendar} />
          <View style={styles.modalWrap} pointerEvents="box-none">
            <GlassCard level="strong" variant="glass" forceBlur style={styles.modalSheet}>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select dates</Text>
                  <Button label="Close" tone="ghost" size="sm" onPress={closeCalendar} />
                </View>

                <Text style={styles.modalSub}>
                  {calIsRange ? `Range: ${calNorm.from} → ${calNorm.to}` : `Day: ${calNorm.from}`}
                </Text>

                <View style={styles.calHeaderRow}>
                  <Pressable onPress={calPrevMonth} style={styles.calNavBtn} hitSlop={10}>
                    <Text style={styles.calNavText}>‹</Text>
                  </Pressable>

                  <Text style={styles.calMonthText}>
                    {monthLabel(calMonthYear.y, calMonthYear.m0)}
                  </Text>

                  <Pressable onPress={calNextMonth} style={styles.calNavBtn} hitSlop={10}>
                    <Text style={styles.calNavText}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.calWeekRow}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                    <Text key={w} style={styles.calWeekText}>
                      {w}
                    </Text>
                  ))}
                </View>

                <View style={styles.calGrid}>
                  {calGrid.map((c, idx) => {
                    if (!c.inMonth) {
                      return <View key={`e-${idx}`} style={styles.calCell} />;
                    }

                    const iso = c.iso;
                    const disabled = iso < minIso || iso > maxIso;
                    const inSel = !disabled && calInRange(iso);
                    const edge = !disabled && calIsEdge(iso);

                    return (
                      <Pressable
                        key={iso}
                        disabled={disabled}
                        onPress={() => onCalendarTapDay(iso)}
                        style={[
                          styles.calCell,
                          styles.calDayBtn,
                          inSel && styles.calDayInRange,
                          edge && styles.calDayEdge,
                          disabled && { opacity: 0.35 },
                        ]}
                      >
                        <Text style={[styles.calDayText, edge && styles.calDayTextEdge]}>
                          {c.day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.modalActions}>
                  <Button
                    label="Clear range"
                    tone="secondary"
                    size="md"
                    onPress={clearCalendarRange}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Apply"
                    tone="primary"
                    size="md"
                    glow
                    onPress={applyCalendar}
                    style={{ flex: 1 }}
                  />
                </View>

                <Text style={styles.modalFootnote}>
                  Tip: tap two different days to set a range. Tap again to reset back to a single day.
                </Text>
              </View>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  flatListContent: {
    paddingBottom: theme.spacing.xl,
  },

  headerListWrap: {
    width: "100%",
  },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h1,
    fontWeight: theme.fontWeight.semibold,
  },

  subtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
  },

  dateLine: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  helperLine: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    marginTop: 2,
  },

  sectionLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
  },

  scopeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginTop: 2,
  },

  datePill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
  },

  datePillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  dateTop: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.semibold,
  },

  dateBottom: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
    marginTop: 2,
  },

  dateTopActive: { color: "rgba(87,162,56,0.95)" },
  dateBottomActive: { color: theme.colors.textPrimary },

  featuredLeagueCard: {
    width: 160,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 8,
  },

  featuredLeagueCardActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  featuredLeagueTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  featuredLeagueText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.meta,
    flex: 1,
  },

  featuredLeagueTextActive: {
    color: theme.colors.textPrimary,
  },

  featuredLeagueCountry: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  regionPill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  regionPillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  regionPillText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.tiny,
  },

  regionPillTextActive: {
    color: theme.colors.textPrimary,
  },

  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  countryCardWrap: {
    width: "48.2%",
  },

  countryCardWrapActive: {
    transform: [{ scale: 0.99 }],
  },

  countryCard: {
    minHeight: 138,
    borderRadius: theme.borderRadius.sheet,
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  countryCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  countryCardCountry: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
  },

  countryCardLeague: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  countryCardClubs: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.tiny,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
    opacity: 0.96,
  },

  countryCardFooter: {
    gap: 2,
  },

  countryCardHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
  },

  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  leaguePillActive: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  leagueText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.tiny,
  },

  leagueTextActive: { color: theme.colors.textPrimary },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },
  flagMd: { width: 22, height: 16, borderRadius: 4, opacity: 0.95 },

  content: {
    paddingHorizontal: theme.spacing.lg,
  },

  listWrap: {
    gap: 12,
  },

  resultsLine: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  center: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },

  rowWrap: {
    width: "100%",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 12,
  },

  rowCard: {
    borderRadius: theme.borderRadius.sheet,
    padding: 0,
  },

  rowMainPress: {
    borderRadius: theme.borderRadius.sheet,
    overflow: "hidden",
  },

  rowInner: {
    padding: 16,
    gap: 12,
  },

  fixtureLeagueLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  fixtureLeagueText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  crestWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 38,
    height: 38,
    opacity: 0.95,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },

  centerCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },

  teamName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.body,
    lineHeight: 20,
    fontWeight: theme.fontWeight.semibold,
    width: "100%",
    textAlign: "center",
  },

  vs: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
  },

  metaBlock: {
    width: "100%",
    alignItems: "center",
    gap: 4,
  },

  metaPrimary: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
  },

  metaVenue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
    opacity: 0.95,
  },

  metaSecondary: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    textAlign: "center",
    fontWeight: theme.fontWeight.medium,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  discoverReasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },

  discoverReasonPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  discoverReasonText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },

  ticketPill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
  },

  ticketText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 11,
  },

  ticketEasy: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  ticketTextEasy: {
    color: "rgba(87,162,56,0.95)",
  },

  ticketMedium: {
    borderColor: "rgba(242,201,76,0.30)",
    backgroundColor: "rgba(242,201,76,0.10)",
  },

  ticketTextMedium: {
    color: "rgba(242,201,76,0.95)",
  },

  ticketHard: {
    borderColor: "rgba(214,69,69,0.30)",
    backgroundColor: "rgba(214,69,69,0.10)",
  },

  ticketTextHard: {
    color: "rgba(214,69,69,0.95)",
  },

  followRow: {
    marginTop: 2,
    flexDirection: "row",
    gap: 10,
  },

  tapHint: {
    marginTop: -2,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
  },

  expandArea: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingTop: 0,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  modalWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalSheet: {
    borderRadius: 22,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  modalInner: {
    padding: 14,
    gap: 12,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h2,
    fontWeight: theme.fontWeight.semibold,
  },

  modalSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
  },

  calHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },

  calNavText: {
    color: theme.colors.textSecondary,
    fontSize: 20,
    fontWeight: theme.fontWeight.semibold,
    marginTop: -2,
  },

  calMonthText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
  },

  calWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },

  calWeekText: {
    width: "14.285%",
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
  },

  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  calCell: {
    width: "14.285%",
    aspectRatio: 1,
    padding: 4,
  },

  calDayBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },

  calDayInRange: {
    backgroundColor: "rgba(87,162,56,0.06)",
  },

  calDayEdge: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.12)",
  },

  calDayText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 12,
  },

  calDayTextEdge: {
    color: theme.colors.textPrimary,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  modalFootnote: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    lineHeight: 16,
  },
});
