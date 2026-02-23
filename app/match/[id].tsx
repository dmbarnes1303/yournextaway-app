// app/match/[id].tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  Platform,
  TextInput,
  Keyboard,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtureById, getFixturesByRound, type FixtureListRow } from "@/src/services/apiFootball";
import {
  getRollingWindowIso,
  toIsoDate,
  addDaysIso,
  clampFromIsoToTomorrow,
  normalizeWindowIso,
} from "@/src/constants/football";
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import authStore from "@/src/state/auth";
import useFollowStore from "@/src/state/followStore";
import {
  computeLikelyPlaceholderTbcIds,
  isKickoffTbc,
  kickoffIsoOrNull,
  CONFIRMED_WITHIN_DAYS,
} from "@/src/utils/kickoffTbc";

import { getTicketGuide } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";

/* -------------------------------------------------------------------------- */
/* helpers */
/* -------------------------------------------------------------------------- */

function currentFootballSeasonStartYear(now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0=Jan
  return m >= 6 ? y : y - 1;
}

function enc(v: string) {
  return encodeURIComponent(v);
}

function isoDateOnly(isoMaybe?: string) {
  if (!isoMaybe) return undefined;
  const d = new Date(isoMaybe);
  if (Number.isNaN(d.getTime())) return undefined;
  return toIsoDate(d);
}

function subtitleOrFallback(value: string | null | undefined, fallback: string) {
  const v = String(value ?? "").trim();
  return v ? v : fallback;
}

async function safeOpenUrl(url: string) {
  const u = String(url ?? "").trim();
  if (!u) return;

  const hasScheme = /^https?:\/\//i.test(u);
  const candidate = hasScheme ? u : `https://${u}`;

  try {
    const can = await Linking.canOpenURL(candidate);
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(candidate);
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}

async function openMapsPreferNative(query: string) {
  const q = String(query ?? "").trim();
  if (!q) return safeOpenUrl("https://www.google.com/maps");

  const geo = `geo:0,0?q=${enc(q)}`;
  const web = `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;

  // iOS geo: is inconsistent; web is reliable.
  if (Platform.OS === "ios") return safeOpenUrl(web);

  try {
    const canGeo = await Linking.canOpenURL(geo);
    await safeOpenUrl(canGeo ? geo : web);
  } catch {
    await safeOpenUrl(web);
  }
}

function daysUntilIso(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return (t - Date.now()) / (1000 * 60 * 60 * 24);
}

/* -------------------------------------------------------------------------- */
/* Home-ticket routing (Sportsevents365 + Official) */
/* -------------------------------------------------------------------------- */

const SE365_AID = "69834e80ec9d3";
const SE365_EVENT_BASE = "https://www.sportsevents365.com/event";
const SE365_SEARCH_BASE = "https://www.sportsevents365.com/search";

// Manual overrides: force exact deep-links for high-intent fixtures.
// Key format: `${home} vs ${away}|${YYYY-MM-DD}`
const SE365_EVENT_OVERRIDES: Record<string, number> = {
  "Tottenham Hotspur vs Arsenal|2026-02-22": 369672,
  "Tottenham vs Arsenal|2026-02-22": 369672,
};

function buildMatchKey(home?: string, away?: string, kickoffDateOnly?: string) {
  const h = String(home ?? "").trim();
  const a = String(away ?? "").trim();
  const d = String(kickoffDateOnly ?? "").trim();
  return `${h} vs ${a}|${d}`;
}

function buildMatchQuery(home?: string, away?: string, kickoffDateOnly?: string, league?: string) {
  const vs = home && away ? `${home} vs ${away}` : "match";
  const when = kickoffDateOnly ? ` ${kickoffDateOnly}` : "";
  const extra = league ? ` ${league}` : "";
  return `${vs}${when}${extra}`.trim();
}

function buildSE365EventUrl(eventId: number) {
  return `${SE365_EVENT_BASE}/${eventId}?a_aid=${SE365_AID}`;
}

function buildSE365SearchUrl(matchQuery: string) {
  return `${SE365_SEARCH_BASE}?a_aid=${SE365_AID}&q=${enc(matchQuery)}`;
}

/**
 * We keep this as "home tickets" so users don’t infer anything else.
 * It’s a fallback web search; we don’t present it as “official”.
 */
function buildGoogleHomeTicketsUrl(matchQuery: string) {
  return `https://www.google.com/search?q=${enc(matchQuery + " home tickets")}`;
}

const OFFICIAL_TICKETS_BY_TEAM: Record<string, string> = {
  "arsenal": "https://www.arsenal.com/tickets",
  "aston villa": "https://www.avfc.co.uk/tickets",
  "bournemouth": "https://www.afcb.co.uk/tickets",
  "brentford": "https://www.brentfordfc.com/en/tickets",
  "brighton": "https://www.brightonandhovealbion.com/tickets",
  "chelsea": "https://www.chelseafc.com/en/tickets",
  "crystal palace": "https://www.cpfc.co.uk/tickets",
  "everton": "https://www.evertonfc.com/tickets",
  "fulham": "https://www.fulhamfc.com/tickets",
  "ipswich town": "https://www.itfc.co.uk/tickets",
  "leicester city": "https://www.lcfc.com/tickets",
  "liverpool": "https://www.liverpoolfc.com/tickets",
  "manchester city": "https://www.mancity.com/tickets",
  "manchester united": "https://tickets.manutd.com/",
  "newcastle united": "https://book.nufc.co.uk/",
  "nottingham forest": "https://tickets.nottinghamforest.co.uk/",
  "southampton": "https://www.southamptonfc.com/tickets",
  "tottenham hotspur": "https://www.tottenhamhotspur.com/tickets/",
  "west ham united": "https://www.whufc.com/tickets",
  "wolverhampton wanderers": "https://ticketswolves.co.uk/",
  "wolves": "https://ticketswolves.co.uk/",
};

function normalizeTeamKey(name?: string) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildOfficialHomeTicketsUrl(homeTeamName?: string) {
  const key = normalizeTeamKey(homeTeamName);
  if (!key) return null;

  if (OFFICIAL_TICKETS_BY_TEAM[key]) return OFFICIAL_TICKETS_BY_TEAM[key];

  const foundKey = Object.keys(OFFICIAL_TICKETS_BY_TEAM).find(
    (k) => key === k || key.includes(k) || k.includes(key)
  );
  if (foundKey) return OFFICIAL_TICKETS_BY_TEAM[foundKey];

  // Fallback: make the intent explicit (official + home tickets)
  return `https://www.google.com/search?q=${enc(String(homeTeamName ?? "") + " official home tickets")}`;
}

/* -------------------------------------------------------------------------- */
/* Logistics links (FB feedback: food/drink, transport, parking, disruption) */
/* -------------------------------------------------------------------------- */

function buildMapsVenueUrl(venue?: string, city?: string) {
  const q = [venue, city].filter(Boolean).join(" ").trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
}

function buildStadiumInfoUrl(venue?: string, homeTeam?: string, city?: string) {
  const q = [venue || "stadium", homeTeam, city, "bag policy entry time seats"].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildFoodDrinkUrl(venue?: string, city?: string) {
  // Split to bias towards actual options, not generic pages
  const q = [venue || "", city || "", "best pubs bars restaurants near"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildTransportUrl(venue?: string, city?: string) {
  const q = [venue || "stadium", city || "", "how to get there public transport train tram metro"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildParkingUrl(venue?: string, city?: string) {
  const q = [venue || "stadium", city || "", "parking park and ride"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildCheapHotelsUrl(venue?: string, city?: string) {
  // This is deliberately “search-y” (works worldwide, no partner dependency).
  const q = [venue || "", city || "", "cheap hotels near"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildTaxiRideshareUrl(venue?: string, city?: string) {
  const q = [venue || "stadium", city || "", "uber bolt taxi rank pickup"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildDisruptionUrl(city?: string) {
  const q = [city || "city", "public transport strike disruption today"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

/* -------------------------------------------------------------------------- */
/* Ticket guide helpers (HOME CLUB ONLY) */
/* -------------------------------------------------------------------------- */

function difficultyLabel(d: TicketDifficulty) {
  switch (d) {
    case "very_hard":
      return "Very hard";
    case "hard":
      return "Hard";
    case "medium":
      return "Medium";
    case "easy":
      return "Easy";
  }
}

function formatReleaseWindow(days?: { min: number; max: number }) {
  if (!days) return "Release timing varies";
  const min = typeof days.min === "number" ? days.min : null;
  const max = typeof days.max === "number" ? days.max : null;
  if (!min && !max) return "Release timing varies";
  if (min && max) return `Typically ${min}–${max} days before`;
  if (min) return `Typically ${min}+ days before`;
  if (max) return `Typically up to ${max} days before`;
  return "Release timing varies";
}

/* -------------------------------------------------------------------------- */
/* Trip stability (kickoff certainty + ticket difficulty) */
/* -------------------------------------------------------------------------- */

type TripStability = "stable" | "flexible" | "uncertain";

function computeTripStability(args: { kickoffTbc: boolean; difficulty?: TicketDifficulty | null }): TripStability {
  const { kickoffTbc, difficulty } = args;

  // If we don't know ticket difficulty, stability is mostly kickoff-driven.
  if (!difficulty) return kickoffTbc ? "flexible" : "stable";

  if (!kickoffTbc && (difficulty === "easy" || difficulty === "medium")) return "stable";
  if (kickoffTbc && (difficulty === "very_hard" || difficulty === "hard")) return "uncertain";

  // everything else: workable if you plan around it
  return "flexible";
}

function stabilityLabel(s: TripStability) {
  if (s === "stable") return "Trip: Stable";
  if (s === "flexible") return "Trip: Flexible";
  return "Trip: Uncertain";
}

type ToastState = { visible: false } | { visible: true; title: string; message?: string };
type TicketModalState = { open: boolean };

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // auth (optional for future sync + email/push)
  const booted = authStore((s) => s.booted);
  const user = authStore((s) => s.user);
  const initAuth = authStore((s) => s.init);
  const signInWithMagicLink = authStore((s) => s.signInWithMagicLink);
  const signOut = authStore((s) => s.signOut);

  useEffect(() => {
    if (!booted) initAuth().catch(() => null);
  }, [booted, initAuth]);

  const id = useMemo(() => coerceString((params as any)?.id), [params]);
  const routeSe365EventId = useMemo(() => coerceNumber((params as any)?.se365EventId), [params]);

  // Routing context (for Plan Trip and back to Fixtures)
  const rolling = useMemo(() => getRollingWindowIso(), []);

  const window = useMemo(() => {
    const routeFrom = coerceString((params as any)?.from);
    const routeTo = coerceString((params as any)?.to);

    const from = clampFromIsoToTomorrow(routeFrom ?? rolling.from);
    const to = routeTo ?? rolling.to ?? addDaysIso(from, 30);

    return normalizeWindowIso({ from, to }, 30);
  }, [params, rolling.from, rolling.to]);

  const fromIso = window.from;
  const toIso = window.to;

  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeSeason = useMemo(() => coerceNumber((params as any)?.season), [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<FixtureListRow | null>(null);

  // Round clustering (for “likely placeholder”)
  const [placeholderIds, setPlaceholderIds] = useState<Set<string> | null>(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  // follow store actions
  const toggleFollow = useFollowStore((s) => s.toggle);
  const upsertLatestSnapshot = useFollowStore((s) => s.upsertLatestSnapshot);

  // IMPORTANT: subscribe to the boolean (derived), not a function
  const fixtureIdFromRow = row?.fixture?.id != null ? String(row.fixture.id) : "";
  const fixtureId = useMemo(() => fixtureIdFromRow || (id ?? ""), [fixtureIdFromRow, id]);

  const followed = useFollowStore(
    useCallback(
      (s) => {
        const fid = String(fixtureId ?? "").trim();
        if (!fid) return false;
        return s.followed.some((x) => x.fixtureId === fid);
      },
      [fixtureId]
    )
  );

  // sign-in UI
  const [email, setEmail] = useState("");

  // non-blocking toast
  const [toast, setToast] = useState<ToastState>({ visible: false });
  const toastTimer = useRef<any>(null);

  const showToast = useCallback((title: string, message?: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, title, message });
    toastTimer.current = setTimeout(() => setToast({ visible: false }), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Home tickets modal
  const [ticketModal, setTicketModal] = useState<TicketModalState>({ open: false });
  const closeTicketModal = useCallback(() => setTicketModal({ open: false }), []);
  const openTicketModal = useCallback(() => setTicketModal({ open: true }), []);

  // Load match
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) {
        setError("Missing match id.");
        return;
      }

      setLoading(true);
      setError(null);
      setRow(null);
      setPlaceholderIds(null);

      try {
        const r = await getFixtureById(id);
        if (cancelled) return;

        if (!r) {
          setError("Match not found.");
          return;
        }

        setRow(r);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load match details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load round fixtures for clustering (only when it matters)
  useEffect(() => {
    let cancelled = false;

    async function runCluster() {
      if (!row) return;

      const leagueId = row?.league?.id ?? routeLeagueId ?? null;
      const season = (row as any)?.league?.season ?? routeSeason ?? currentFootballSeasonStartYear();
      const round = String(row?.league?.round ?? "").trim();

      const iso = kickoffIsoOrNull(row);
      const daysAway = iso ? daysUntilIso(iso) : Number.POSITIVE_INFINITY;

      // If within confirmed window, don’t waste requests
      if (iso && daysAway <= CONFIRMED_WITHIN_DAYS) {
        setPlaceholderIds(new Set());
        return;
      }

      // Need league/season/round to do cluster evidence
      if (!leagueId || !season || !round) {
        setPlaceholderIds(new Set());
        return;
      }

      setClusterLoading(true);
      try {
        const roundRows = await getFixturesByRound({ league: leagueId, season, round });
        if (cancelled) return;
        setPlaceholderIds(computeLikelyPlaceholderTbcIds(roundRows));
      } catch {
        if (cancelled) return;
        // Fail open
        setPlaceholderIds(new Set());
      } finally {
        if (!cancelled) setClusterLoading(false);
      }
    }

    runCluster();
    return () => {
      cancelled = true;
    };
  }, [row, routeLeagueId, routeSeason]);

  const home = row?.teams?.home?.name ?? "Home";
  const away = row?.teams?.away?.name ?? "Away";

  const kickoffDisplay = formatUkDateTimeMaybe(row?.fixture?.date);
  const kickoffDateOnly = isoDateOnly(row?.fixture?.date as string | undefined);

  const venue = row?.fixture?.venue?.name ?? "";
  const city = row?.fixture?.venue?.city ?? "";
  const place = [venue, city].filter(Boolean).join(" • ");

  const leagueName = row?.league?.name ?? "League";
  const apiLeagueId = row?.league?.id ?? null;
  const effectiveLeagueId = apiLeagueId ?? routeLeagueId ?? null;

  const apiSeason = (row as any)?.league?.season;
  const effectiveSeason =
    routeSeason ?? (typeof apiSeason === "number" ? apiSeason : null) ?? currentFootballSeasonStartYear();

  const round = String(row?.league?.round ?? "").trim() || null;

  const tbc = useMemo(() => {
    if (!row) return true;
    return isKickoffTbc(row, placeholderIds ?? undefined);
  }, [row, placeholderIds]);

  const kickoffSecondary = useMemo(() => {
    if (!row) return null;
    const iso = kickoffIsoOrNull(row);
    if (!iso) return "Kickoff time not set yet";
    const daysAway = daysUntilIso(iso);
    if (daysAway <= CONFIRMED_WITHIN_DAYS) return null;
    return tbc ? "TV schedule pending" : null;
  }, [row, tbc]);

  const matchQuery = useMemo(
    () => buildMatchQuery(home, away, kickoffDateOnly, leagueName),
    [home, away, kickoffDateOnly, leagueName]
  );

  // Determine SE365 event id using (priority):
  // 1) route param
  // 2) row-provided property (future)
  // 3) manual override map
  const se365EventId = useMemo(() => {
    const fromRoute = typeof routeSe365EventId === "number" && routeSe365EventId > 0 ? routeSe365EventId : null;

    const fromRow = (() => {
      const anyRow = row as any;
      const v =
        anyRow?.fixture?.sportsevents365EventId ??
        anyRow?.fixture?.se365EventId ??
        anyRow?.sportsevents365EventId ??
        anyRow?.se365EventId;
      return typeof v === "number" && v > 0 ? v : null;
    })();

    if (fromRoute) return fromRoute;
    if (fromRow) return fromRow;

    const key = buildMatchKey(home, away, kickoffDateOnly);
    const v = SE365_EVENT_OVERRIDES[key];
    return typeof v === "number" && v > 0 ? v : null;
  }, [routeSe365EventId, row, home, away, kickoffDateOnly]);

  const se365PrimaryUrl = useMemo(() => {
    if (se365EventId) return buildSE365EventUrl(se365EventId);
    return buildSE365SearchUrl(matchQuery);
  }, [se365EventId, matchQuery]);

  const officialHomeTicketsUrl = useMemo(() => buildOfficialHomeTicketsUrl(home), [home]);
  const googleHomeTicketsUrl = useMemo(() => buildGoogleHomeTicketsUrl(matchQuery), [matchQuery]);

  // Logistics URLs
  const mapsUrl = useMemo(() => buildMapsVenueUrl(venue, city), [venue, city]);
  const stadiumInfoUrl = useMemo(() => buildStadiumInfoUrl(venue, home, city), [venue, home, city]);
  const foodDrinkUrl = useMemo(() => buildFoodDrinkUrl(venue, city), [venue, city]);
  const transportUrl = useMemo(() => buildTransportUrl(venue, city), [venue, city]);
  const parkingUrl = useMemo(() => buildParkingUrl(venue, city), [venue, city]);
  const cheapHotelsUrl = useMemo(() => buildCheapHotelsUrl(venue, city), [venue, city]);
  const taxiUrl = useMemo(() => buildTaxiRideshareUrl(venue, city), [venue, city]);
  const disruptionUrl = useMemo(() => buildDisruptionUrl(city), [city]);

  // Ticket guide (HOME CLUB ONLY)
  const ticketGuide = useMemo(() => getTicketGuide(home), [home]);

  // Trip stability chip (kickoff + ticket difficulty)
  const tripStability = useMemo(
    () => computeTripStability({ kickoffTbc: tbc, difficulty: ticketGuide?.difficulty ?? null }),
    [tbc, ticketGuide]
  );

  const stabilityChipStyle = useMemo(() => {
    if (tripStability === "stable") return styles.chipStable;
    if (tripStability === "flexible") return styles.chipFlexible;
    return styles.chipUncertain;
  }, [tripStability]);

  const homeTicketsSub = useMemo(() => {
    const when = kickoffDateOnly ? ` • ${kickoffDateOnly}` : "";
    const base = `${home} vs ${away}${when}`;

    const diff = ticketGuide ? ` • ${difficultyLabel(ticketGuide.difficulty)}` : "";
    const membership = ticketGuide?.membershipRequired ? " • Membership often needed" : "";

    if (se365EventId) return `${base}${diff}${membership} • Opens the exact match page`;
    return `${base}${diff}${membership} • Opens SE365 search (affiliate) + paste query if needed`;
  }, [home, away, kickoffDateOnly, se365EventId, ticketGuide]);

  const directionsSub = useMemo(() => {
    const v = subtitleOrFallback(venue, "Search stadium location");
    const c = subtitleOrFallback(city, "");
    return [v, c].filter(Boolean).join(" • ");
  }, [venue, city]);

  const onPlanTrip = useCallback(() => {
    if (!fixtureId) return;

    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        ...(effectiveLeagueId ? { leagueId: String(effectiveLeagueId) } : {}),
        ...(effectiveSeason ? { season: String(effectiveSeason) } : {}),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }, [router, fixtureId, effectiveLeagueId, effectiveSeason, fromIso, toIso]);

  const onOpenFixtures = useCallback(() => {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        ...(effectiveLeagueId ? { leagueId: String(effectiveLeagueId) } : {}),
        ...(effectiveSeason ? { season: String(effectiveSeason) } : {}),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }, [router, effectiveLeagueId, effectiveSeason, fromIso, toIso]);

  const onShare = useCallback(async () => {
    const title = `${home} vs ${away}`;
    const when = tbc
      ? `Kickoff: TBC${kickoffDisplay ? ` (${kickoffDisplay})` : ""}`
      : kickoffDisplay
      ? `Kickoff: ${kickoffDisplay}`
      : "Kickoff: —";
    const where = place ? `Venue: ${place}` : "Venue: —";
    const meta = `League: ${leagueName} • Season: ${String(effectiveSeason)}`;

    const stabilityLine = `Trip stability: ${tripStability.toUpperCase()}\n`;
    const guideLine = ticketGuide ? `Home ticket difficulty: ${difficultyLabel(ticketGuide.difficulty)}\n` : "";

    const seLine = se365EventId
      ? `Home tickets (Sportsevents365 match page): ${se365PrimaryUrl}\n`
      : `Home tickets (Sportsevents365 search): ${se365PrimaryUrl}\nPaste in search: ${matchQuery}\n`;

    const message =
      `${title}\n${when}\n${where}\n${meta}\n\n` +
      stabilityLine +
      guideLine +
      seLine +
      (officialHomeTicketsUrl ? `Official home tickets: ${officialHomeTicketsUrl}\n` : "") +
      `Maps: ${mapsUrl}`;

    try {
      await Share.share(Platform.OS === "ios" ? { message, url: se365PrimaryUrl } : { message });
    } catch {
      // non-critical
    }
  }, [
    home,
    away,
    tbc,
    kickoffDisplay,
    place,
    leagueName,
    effectiveSeason,
    se365EventId,
    se365PrimaryUrl,
    matchQuery,
    officialHomeTicketsUrl,
    mapsUrl,
    ticketGuide,
    tripStability,
  ]);

  const onToggleFollow = useCallback(() => {
    if (!fixtureId) return;

    const willFollow = !followed;

    const homeTeamId = row?.teams?.home?.id ?? 0;
    const awayTeamId = row?.teams?.away?.id ?? 0;

    const lid = effectiveLeagueId ?? 0;
    const sea = typeof effectiveSeason === "number" ? effectiveSeason : 0;

    toggleFollow({
      fixtureId,
      leagueId: lid,
      season: sea,
      homeTeamId,
      awayTeamId,

      homeName: home ? String(home) : null,
      awayName: away ? String(away) : null,
      leagueName: leagueName ? String(leagueName) : null,
      round,

      kickoffIso: row ? kickoffIsoOrNull(row) : null,
      venue: row?.fixture?.venue?.name ? String(row.fixture.venue.name) : null,
      city: row?.fixture?.venue?.city ? String(row.fixture.venue.city) : null,

      sportsevents365EventId: se365EventId ?? null,
    });

    if (row && willFollow) {
      upsertLatestSnapshot(
        fixtureId,
        {
          kickoffIso: kickoffIsoOrNull(row),
          venue: row?.fixture?.venue?.name ? String(row.fixture.venue.name) : null,
          city: row?.fixture?.venue?.city ? String(row.fixture.venue.city) : null,

          homeTeamId: row?.teams?.home?.id ?? undefined,
          awayTeamId: row?.teams?.away?.id ?? undefined,
          leagueId: row?.league?.id ?? undefined,
          season: (row as any)?.league?.season ?? routeSeason ?? undefined,

          homeName: home ? String(home) : null,
          awayName: away ? String(away) : null,
          leagueName: leagueName ? String(leagueName) : null,
          round,

          sportsevents365EventId: se365EventId ?? null,
        } as any
      );
    }

    if (!willFollow) {
      showToast("Unfollowed", "Removed from your followed list on this device.");
      return;
    }

    const line1 = tbc ? "We’ll alert you when kickoff is confirmed or changes." : "We’ll alert you if kickoff changes.";
    const line2 = user
      ? "Sync + notifications can be added next."
      : "Sign in later to sync across devices and enable email/push alerts.";
    showToast("Following", `${line1} ${line2}`);
  }, [
    fixtureId,
    followed,
    toggleFollow,
    row,
    effectiveLeagueId,
    effectiveSeason,
    tbc,
    user,
    showToast,
    upsertLatestSnapshot,
    routeSeason,
    home,
    away,
    leagueName,
    round,
    se365EventId,
  ]);

  const onSendMagicLink = useCallback(async () => {
    const e = String(email ?? "").trim();
    if (!e) {
      Alert.alert("Email required", "Enter an email to sign in.");
      return;
    }

    try {
      Keyboard.dismiss();
      await signInWithMagicLink(e);
      Alert.alert("Check your email", "Tap the link to finish signing in.");
      setEmail("");
    } catch (err: any) {
      Alert.alert("Sign in failed", err?.message ?? "Could not send magic link.");
    }
  }, [email, signInWithMagicLink]);

  const openSportsevents365 = useCallback(async () => {
    closeTicketModal();

    if (!se365EventId) {
      Alert.alert(
        "Sportsevents365 search",
        `If it doesn’t land on the exact match, use search and paste:\n\n${matchQuery}\n\nTip: buy host-club tickets / home sections where applicable.`
      );
    }

    await safeOpenUrl(se365PrimaryUrl);
  }, [closeTicketModal, se365EventId, matchQuery, se365PrimaryUrl]);

  const openOfficialHomeTickets = useCallback(async () => {
    closeTicketModal();
    if (!officialHomeTicketsUrl) {
      Alert.alert("Official home tickets unavailable", "We don’t have an official ticket link for this club yet.");
      return;
    }
    await safeOpenUrl(officialHomeTicketsUrl);
  }, [closeTicketModal, officialHomeTicketsUrl]);

  const openGoogleFallback = useCallback(async () => {
    closeTicketModal();
    await safeOpenUrl(googleHomeTicketsUrl);
  }, [closeTicketModal, googleHomeTicketsUrl]);

  const openTicketGuideInfo = useCallback(() => {
    if (!ticketGuide) {
      Alert.alert(
        "Home ticket guide not available yet",
        "We don’t have a specific guide for this home club yet. Use Official home tickets or Sportsevents365 and plan early."
      );
      return;
    }

    const lines: string[] = [];
    lines.push(`${ticketGuide.clubName} — ${ticketGuide.league}`);
    lines.push("");
    lines.push(ticketGuide.summary);

    if (typeof ticketGuide.membershipRequired === "boolean") {
      lines.push("");
      lines.push(`Membership: ${ticketGuide.membershipRequired ? "Often required" : "Not always required"}`);
    }

    if (ticketGuide.typicalReleaseDaysBefore) {
      lines.push(`Typical release: ${formatReleaseWindow(ticketGuide.typicalReleaseDaysBefore)}`);
    }

    if (typeof ticketGuide.ukCardUsuallyWorks === "boolean") {
      lines.push(`UK bank card: ${ticketGuide.ukCardUsuallyWorks ? "Usually works" : "May be restricted"}`);
    }

    if (typeof ticketGuide.touristFriendly === "boolean") {
      lines.push(`Tourist-friendly: ${ticketGuide.touristFriendly ? "Usually OK" : "Restrictions possible"}`);
    }

    if (ticketGuide.safetyNotes?.length) {
      lines.push("");
      lines.push("Safety:");
      for (const s of ticketGuide.safetyNotes.slice(0, 5)) lines.push(`• ${s}`);
    }

    if (ticketGuide.notes?.length) {
      lines.push("");
      lines.push("Notes:");
      for (const n of ticketGuide.notes.slice(0, 6)) lines.push(`• ${n}`);
    }

    Alert.alert("Home ticket guide", lines.join("\n"));
  }, [ticketGuide]);

  const weekendPlanningBody = useMemo(() => {
    const isEpl = String(leagueName ?? "").toLowerCase().includes("premier league");
    const hint = isEpl
      ? "In this league, kickoff timing can move due to TV scheduling."
      : "Kickoff timing can move while schedules are being finalised.";

    return `${hint} If you’re booking the weekend anyway, stay flexible and treat the kickoff slot as a bonus once confirmed.`;
  }, [leagueName]);

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Match",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card} intensity={26}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading match…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Match unavailable" message={error} /> : null}

            {!loading && !error && row ? (
              <>
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>{leagueName}</Text>
                    {round ? (
                      <Text style={styles.roundLine} numberOfLines={1}>
                        {round}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable onPress={onToggleFollow} style={[styles.watchPill, followed && styles.watchPillActive]}>
                    <Text style={[styles.watchPillText, followed && styles.watchPillTextActive]}>
                      {followed ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  {home} vs {away}
                </Text>

                <View style={styles.chipRow}>
                  {tbc ? (
                    <>
                      <View style={[styles.chip, styles.chipTbc]}>
                        <Text style={[styles.chipText, styles.chipTextTbc]}>Kickoff TBC</Text>
                      </View>
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>TV schedule pending</Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.chip, styles.chipConfirmed]}>
                      <Text style={[styles.chipText, styles.chipTextConfirmed]}>Kickoff confirmed</Text>
                    </View>
                  )}

                  <View style={[styles.chip, stabilityChipStyle]}>
                    <Text style={styles.chipText}>{stabilityLabel(tripStability)}</Text>
                  </View>

                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {ticketGuide ? `Home tickets: ${difficultyLabel(ticketGuide.difficulty)}` : "Home tickets: Guide pending"}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaBlock}>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Kickoff: </Text>
                    {kickoffDisplay || "—"}
                  </Text>

                  {kickoffSecondary ? (
                    <Text style={styles.metaSecondary}>{kickoffSecondary}</Text>
                  ) : clusterLoading ? (
                    <Text style={styles.metaSecondary}>Checking schedule…</Text>
                  ) : null}

                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Venue: </Text>
                    {place || "—"}
                  </Text>

                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Season: </Text>
                    {String(effectiveSeason)}
                  </Text>
                </View>

                {/* Weekend-first planning (only when kickoff is not locked) */}
                {tbc ? (
                  <View style={styles.planningBox}>
                    <Text style={styles.planningTitle}>Planning tip</Text>
                    <Text style={styles.planningBody}>{weekendPlanningBody}</Text>

                    <View style={styles.planningBtnRow}>
                      <Pressable onPress={onToggleFollow} style={[styles.miniBtn, styles.miniBtnPrimary]}>
                        <Text style={styles.miniBtnText}>Follow for alerts</Text>
                      </Pressable>

                      <Pressable onPress={onPlanTrip} style={[styles.miniBtn, styles.miniBtnSecondary]}>
                        <Text style={styles.miniBtnText}>Plan weekend</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {/* Home ticket guide block */}
                <View style={styles.ticketGuideBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketGuideTitle}>Home ticket guide</Text>

                    {ticketGuide ? (
                      <>
                        <Text style={styles.ticketGuideSub}>{ticketGuide.summary}</Text>

                        <View style={styles.ticketGuideBullets}>
                          <Text style={styles.ticketGuideBullet}>• Difficulty: {difficultyLabel(ticketGuide.difficulty)}</Text>
                          <Text style={styles.ticketGuideBullet}>
                            • {ticketGuide.membershipRequired ? "Membership often required" : "Membership not always required"}
                          </Text>
                          <Text style={styles.ticketGuideBullet}>• {formatReleaseWindow(ticketGuide.typicalReleaseDaysBefore)}</Text>

                          {typeof ticketGuide.ukCardUsuallyWorks === "boolean" ? (
                            <Text style={styles.ticketGuideBullet}>
                              • UK bank cards: {ticketGuide.ukCardUsuallyWorks ? "usually work" : "may be restricted"}
                            </Text>
                          ) : null}

                          {typeof ticketGuide.touristFriendly === "boolean" ? (
                            <Text style={styles.ticketGuideBullet}>
                              • Tourist-friendly: {ticketGuide.touristFriendly ? "usually OK" : "restrictions possible"}
                            </Text>
                          ) : null}
                        </View>
                      </>
                    ) : (
                      <Text style={styles.ticketGuideSub}>Guide pending for this home club. Use trusted sources and plan early.</Text>
                    )}
                  </View>

                  <Pressable onPress={openTicketGuideInfo} style={styles.ticketGuideInfoBtn}>
                    <Text style={styles.ticketGuideInfoText}>Details</Text>
                  </Pressable>
                </View>

                {followed ? (
                  <View style={styles.followInfo}>
                    <Text style={styles.followInfoTitle}>Following</Text>
                    <Text style={styles.followInfoBody}>
                      {tbc ? "We’ll notify you when kickoff is confirmed or changes." : "We’ll notify you if kickoff changes."}
                    </Text>
                  </View>
                ) : null}

                {!user ? (
                  <View style={styles.signInBox}>
                    <Text style={styles.signInTitle}>Sign in (optional)</Text>
                    <Text style={styles.signInBody}>
                      Following works on this device already. Sign in later to sync across devices and enable email/push alerts.
                    </Text>

                    <View style={styles.inputRow}>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@email.com"
                        placeholderTextColor={theme.colors.textTertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        style={styles.input}
                        returnKeyType="done"
                        onSubmitEditing={onSendMagicLink}
                      />
                      <Pressable onPress={onSendMagicLink} style={styles.inputBtn}>
                        <Text style={styles.inputBtnText}>Send</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.accountRow}>
                    <Text style={styles.accountText}>{user.email ?? "Signed in"}</Text>
                    <Pressable onPress={async () => signOut()} style={styles.signOutBtn}>
                      <Text style={styles.signOutText}>Sign out</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.ctaGrid}>
                  <Pressable onPress={openTicketModal} style={[styles.bigBtn, styles.bigBtnPrimary]}>
                    <Text style={styles.bigKicker}>Home tickets</Text>
                    <Text style={styles.bigTitle}>Find home tickets</Text>
                    <Text style={styles.bigSub}>{homeTicketsSub}</Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      const q = [venue, city].filter(Boolean).join(" ").trim();
                      if (!q) return safeOpenUrl(mapsUrl);
                      await openMapsPreferNative(q);
                    }}
                    style={[styles.bigBtn, styles.bigBtnSecondary]}
                  >
                    <Text style={styles.bigKicker}>Directions</Text>
                    <Text style={styles.bigTitle}>Open maps</Text>
                    <Text style={styles.bigSub}>{directionsSub}</Text>
                  </Pressable>

                  <Pressable onPress={onPlanTrip} style={[styles.bigBtn, styles.bigBtnSecondary]}>
                    <Text style={styles.bigKicker}>Trip</Text>
                    <Text style={styles.bigTitle}>Plan this trip</Text>
                    <Text style={styles.bigSub}>Pre-fills this match</Text>
                  </Pressable>

                  <Pressable onPress={onShare} style={[styles.bigBtn, styles.bigBtnSecondary]}>
                    <Text style={styles.bigKicker}>Share</Text>
                    <Text style={styles.bigTitle}>Share match</Text>
                    <Text style={styles.bigSub}>Copy-friendly summary</Text>
                  </Pressable>
                </View>

                <View style={styles.smallRow}>
                  <Pressable onPress={onOpenFixtures} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>Open Fixtures</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(stadiumInfoUrl)} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>Stadium info</Text>
                  </Pressable>
                </View>

                {/* Logistics quick actions (FB feedback) */}
                <View style={styles.quickGrid}>
                  <Pressable onPress={() => safeOpenUrl(foodDrinkUrl)} style={styles.quickBtn}>
                    <Text style={styles.quickTitle}>Food & drink</Text>
                    <Text style={styles.quickSub}>Pubs, bars, restaurants</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(transportUrl)} style={styles.quickBtn}>
                    <Text style={styles.quickTitle}>Transport</Text>
                    <Text style={styles.quickSub}>Train / tram / metro routes</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(parkingUrl)} style={styles.quickBtn}>
                    <Text style={styles.quickTitle}>Parking</Text>
                    <Text style={styles.quickSub}>Parking + park & ride</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(cheapHotelsUrl)} style={styles.quickBtn}>
                    <Text style={styles.quickTitle}>Cheap hotels</Text>
                    <Text style={styles.quickSub}>Near stadium / city area</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(taxiUrl)} style={styles.quickBtn}>
                    <Text style={styles.quickTitle}>Taxi / rideshare</Text>
                    <Text style={styles.quickSub}>Pickup points + options</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(disruptionUrl)} style={styles.quickBtn}>
                    <Text style={styles.quickTitle}>Disruption</Text>
                    <Text style={styles.quickSub}>Strikes / closures today</Text>
                  </Pressable>
                </View>

                <Text style={styles.smallPrint}>Match ID: {fixtureId}</Text>
                {se365EventId ? (
                  <Text style={styles.smallPrint}>SE365 Event ID: {String(se365EventId)}</Text>
                ) : (
                  <Text style={styles.smallPrint}>SE365 Event ID: — (opens SE365 search)</Text>
                )}
              </>
            ) : null}
          </GlassCard>

          {!loading && !error && row ? (
            <GlassCard style={styles.card} intensity={22}>
              <Text style={styles.h2}>Matchday essentials</Text>
              <Text style={styles.muted}>Neutral traveller view: arrive smoothly, enjoy the city, keep it simple.</Text>

              <View style={styles.opsList}>
                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Arrive early</Text>
                  <Text style={styles.opsBody}>
                    Aim for 60–90 minutes before kickoff if you’re picking up home tickets or navigating security.
                  </Text>
                </View>

                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Bag policy and entry</Text>
                  <Text style={styles.opsBody}>Policies vary. If you’re carrying a bag, double-check restrictions before you travel.</Text>
                  <Pressable onPress={() => safeOpenUrl(stadiumInfoUrl)} style={styles.inlineBtn}>
                    <Text style={styles.inlineBtnText}>Search stadium entry rules</Text>
                  </Pressable>
                </View>

                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Transport plan</Text>
                  <Text style={styles.opsBody}>
                    Public transport is usually easiest; event traffic and parking are unpredictable near kickoff.
                  </Text>
                  <Pressable onPress={() => safeOpenUrl(transportUrl)} style={styles.inlineBtn}>
                    <Text style={styles.inlineBtnText}>Search transport options</Text>
                  </Pressable>
                </View>

                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Food & drinks nearby</Text>
                  <Text style={styles.opsBody}>
                    Pick something walkable so you’re not rushing. Atmosphere is often best around the stadium district.
                  </Text>
                  <Pressable onPress={() => safeOpenUrl(foodDrinkUrl)} style={styles.inlineBtn}>
                    <Text style={styles.inlineBtnText}>Search nearby spots</Text>
                  </Pressable>
                </View>

                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Cheap hotel shortcut</Text>
                  <Text style={styles.opsBody}>
                    If you’re staying near the stadium, check cancellation and late check-in rules so match timing doesn’t trap you.
                  </Text>
                  <Pressable onPress={() => safeOpenUrl(cheapHotelsUrl)} style={styles.inlineBtn}>
                    <Text style={styles.inlineBtnText}>Search cheap hotels</Text>
                  </Pressable>
                </View>

                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Disruption check</Text>
                  <Text style={styles.opsBody}>
                    Strikes and closures can ruin “easy” transfers. A quick check before you set off saves money and stress.
                  </Text>
                  <Pressable onPress={() => safeOpenUrl(disruptionUrl)} style={styles.inlineBtn}>
                    <Text style={styles.inlineBtnText}>Check disruption</Text>
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          ) : null}
        </ScrollView>

        {toast.visible ? (
          <View pointerEvents="none" style={styles.toastWrap}>
            <View style={styles.toast}>
              <Text style={styles.toastTitle}>{toast.title}</Text>
              {toast.message ? <Text style={styles.toastMsg}>{toast.message}</Text> : null}
            </View>
          </View>
        ) : null}

        {/* Home Ticket Source Modal (Sportsevents365 + Official are equal) */}
        <Modal visible={ticketModal.open} transparent animationType="fade" onRequestClose={closeTicketModal}>
          <Pressable style={styles.modalBackdrop} onPress={closeTicketModal}>
            <Pressable style={styles.modalCard} onPress={() => null}>
              <Text style={styles.modalTitle}>Home tickets</Text>
              <Text style={styles.modalBody}>
                Choose where you want to source host-club home tickets. Official takes you directly to the club.
                Sportsevents365 uses your affiliate link.
              </Text>

              <View style={styles.modalBtnCol}>
                <Pressable onPress={openSportsevents365} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                  <Text style={styles.modalBtnTitle}>
                    {se365EventId ? "Sportsevents365 (match page • affiliate)" : "Sportsevents365 (search • affiliate)"}
                  </Text>
                  <Text style={styles.modalBtnSub}>
                    {se365EventId ? `Event #${String(se365EventId)}` : `Paste: ${matchQuery}`}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={openOfficialHomeTickets}
                  style={[styles.modalBtn, styles.modalBtnPrimary, !officialHomeTicketsUrl && styles.modalBtnDisabled]}
                  disabled={!officialHomeTicketsUrl}
                >
                  <Text style={styles.modalBtnTitle}>Official home tickets (club)</Text>
                  <Text style={styles.modalBtnSub}>{officialHomeTicketsUrl ? home : "No official link mapped yet"}</Text>
                </Pressable>

                <Pressable onPress={openGoogleFallback} style={[styles.modalBtn, styles.modalBtnSecondary]}>
                  <Text style={styles.modalBtnTitle}>Google fallback</Text>
                  <Text style={styles.modalBtnSub}>Last resort web search</Text>
                </Pressable>

                <Pressable onPress={closeTicketModal} style={[styles.modalBtn, styles.modalBtnGhost]}>
                  <Text style={styles.modalBtnGhostText}>Cancel</Text>
                </Pressable>
              </View>

              <Text style={styles.modalFootnote}>
                Note: exact Sportsevents365 deep-links require their event ID. Until IDs are supplied, we open SE365 search and
                show the exact query to paste.
              </Text>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: theme.spacing.xl, alignItems: "center", gap: 10 },
  muted: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },

  kicker: { color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: "900", letterSpacing: 0.6 },
  roundLine: { marginTop: 4, color: theme.colors.textTertiary, fontSize: 12, fontWeight: "800" },

  title: { marginTop: 8, fontSize: theme.fontSize.xl, fontWeight: "900", color: theme.colors.text, lineHeight: 30 },

  watchPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  watchPillActive: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  watchPillText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  watchPillTextActive: { color: "rgba(79,224,138,0.92)" },

  chipRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  chipText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  chipTbc: { borderColor: "rgba(255,200,0,0.22)", backgroundColor: "rgba(255,200,0,0.06)" },
  chipTextTbc: { color: "rgba(255,220,140,0.92)" },
  chipConfirmed: { borderColor: "rgba(0,255,136,0.28)", backgroundColor: "rgba(0,255,136,0.08)" },
  chipTextConfirmed: { color: "rgba(79,224,138,0.92)" },

  chipStable: { borderColor: "rgba(0,255,136,0.28)", backgroundColor: "rgba(0,255,136,0.08)" },
  chipFlexible: { borderColor: "rgba(255,200,0,0.22)", backgroundColor: "rgba(255,200,0,0.06)" },
  chipUncertain: { borderColor: "rgba(255,120,120,0.22)", backgroundColor: "rgba(255,120,120,0.06)" },

  metaBlock: { marginTop: 12, gap: 6 },
  metaLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },
  metaLabel: { color: theme.colors.text, fontWeight: "900" },
  metaSecondary: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: "800" },

  planningBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,200,0,0.18)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  planningTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  planningBody: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },
  planningBtnRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  miniBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  miniBtnPrimary: { borderColor: "rgba(79,224,138,0.35)", backgroundColor: "rgba(79,224,138,0.10)" },
  miniBtnSecondary: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.16)" },
  miniBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  ticketGuideBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  ticketGuideTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  ticketGuideSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },
  ticketGuideBullets: { marginTop: 10, gap: 6 },
  ticketGuideBullet: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  ticketGuideInfoBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  ticketGuideInfoText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  followInfo: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.22)",
    backgroundColor: "rgba(79,224,138,0.07)",
    padding: 12,
  },
  followInfoTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  followInfoBody: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },

  h2: { marginTop: 2, fontSize: theme.fontSize.lg, fontWeight: "900", color: theme.colors.text },

  signInBox: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  signInTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  signInBody: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },
  inputRow: { marginTop: 10, flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    paddingHorizontal: 12,
    color: theme.colors.text,
    backgroundColor: "rgba(0,0,0,0.16)",
    fontWeight: "800",
  },
  inputBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  inputBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  accountRow: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  accountText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  signOutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  signOutText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  ctaGrid: { marginTop: 14, gap: 10 },
  bigBtn: { borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  bigBtnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.34)" },
  bigBtnSecondary: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.22)" },
  bigKicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs, letterSpacing: 0.2 },
  bigTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  bigSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  smallRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  smallBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  smallBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  quickGrid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  quickTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  quickSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },

  smallPrint: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "700" },

  opsList: { marginTop: 12, gap: 12 },
  opsItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  opsTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  opsBody: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  inlineBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  inlineBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  toastWrap: {
    position: "absolute",
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
  },
  toast: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.78)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  toastTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  toastMsg: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(10,10,10,0.92)",
    padding: 14,
  },
  modalTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  modalBody: { marginTop: 8, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },
  modalBtnCol: { marginTop: 12, gap: 10 },
  modalBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalBtnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.34)" },
  modalBtnSecondary: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.22)" },
  modalBtnDisabled: { opacity: 0.45 },
  modalBtnTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  modalBtnSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },
  modalBtnGhost: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "transparent" },
  modalBtnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12, textAlign: "center" },
  modalFootnote: { marginTop: 10, color: theme.colors.textTertiary, fontWeight: "800", fontSize: 11, lineHeight: 14 },
});
