// app/match/[id].tsx
// NOTE: This is your match screen as provided. It already calls getMatchdayLogistics correctly.
// I am re-posting it as a full-file paste for completeness.

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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import MatchdayLogisticsCard from "@/src/components/match/MatchdayLogisticsCard";

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

import { getMatchdayLogistics } from "@/src/data/matchdayLogistics";
import type { LogisticsStop } from "@/src/data/matchdayLogistics/types";

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

function buildGoogleHomeTicketsUrl(matchQuery: string) {
  return `https://www.google.com/search?q=${enc(matchQuery + " home tickets")}`;
}

const OFFICIAL_TICKETS_BY_TEAM: Record<string, string> = {
  "arsenal": "https://www.arsenal.com/tickets",
  "aston villa": "https://www.avfc.co.uk/tickets",
  "bournemouth": "https://www.afcb.co.uk/tickets",
  "afc bournemouth": "https://www.afcb.co.uk/tickets",
  "brentford": "https://www.brentfordfc.com/en/tickets",
  "brighton": "https://www.brightonandhovealbion.com/tickets",
  "brighton & hove albion": "https://www.brightonandhovealbion.com/tickets",
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

  const foundKey = Object.keys(OFFICIAL_TICKETS_BY_TEAM).find((k) => key === k || key.includes(k) || k.includes(key));
  if (foundKey) return OFFICIAL_TICKETS_BY_TEAM[foundKey];

  return `https://www.google.com/search?q=${enc(String(homeTeamName ?? "") + " official home tickets")}`;
}

/* -------------------------------------------------------------------------- */
/* Venue / stadium urls */
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

  if (!difficulty) return kickoffTbc ? "flexible" : "stable";

  if (!kickoffTbc && (difficulty === "easy" || difficulty === "medium")) return "stable";
  if (kickoffTbc && (difficulty === "very_hard" || difficulty === "hard")) return "uncertain";

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
  const insets = useSafeAreaInsets();

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

  const fixtureId = useMemo(() => {
    const fromRow = row?.fixture?.id != null ? String(row.fixture.id) : "";
    const fallback = id ? String(id) : "";
    return (fromRow || fallback).trim();
  }, [row?.fixture?.id, id]);

  // Subscribe to followed status using fixtureId as dependency (stable + correct)
  const followed = useFollowStore(
    useMemo(() => {
      return (s: any) => {
        const fid = String(fixtureId ?? "").trim();
        if (!fid) return false;
        return s.followed.some((x: any) => x.fixtureId === fid);
      };
    }, [fixtureId])
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

      if (iso && daysAway <= CONFIRMED_WITHIN_DAYS) {
        setPlaceholderIds(new Set());
        return;
      }

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
  const effectiveSeason = routeSeason ?? (typeof apiSeason === "number" ? apiSeason : null) ?? currentFootballSeasonStartYear();

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

  const matchQuery = useMemo(() => buildMatchQuery(home, away, kickoffDateOnly, leagueName), [home, away, kickoffDateOnly, leagueName]);

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

  const mapsUrl = useMemo(() => buildMapsVenueUrl(venue, city), [venue, city]);
  const stadiumInfoUrl = useMemo(() => buildStadiumInfoUrl(venue, home, city), [venue, home, city]);

  const logistics = useMemo(() => {
    return getMatchdayLogistics({ homeTeamName: home, leagueName });
  }, [home, leagueName]);

  const venueQuery = useMemo(() => {
    const q = [venue || logistics?.stadium, city || logistics?.city].filter(Boolean).join(" ").trim();
    return q || "";
  }, [venue, city, logistics?.stadium, logistics?.city]);

  const ticketGuide = useMemo(() => getTicketGuide(home), [home]);

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
    const v = subtitleOrFallback(venue || logistics?.stadium, "Search stadium location");
    const c = subtitleOrFallback(city || logistics?.city, "");
    return [v, c].filter(Boolean).join(" • ");
  }, [venue, city, logistics?.stadium, logistics?.city]);

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
    } catch {}
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
    const line2 = user ? "Sync + notifications can be added next." : "Sign in later to sync across devices and enable email/push alerts.";
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
    const hint = isEpl ? "In this league, kickoff timing can move due to TV scheduling." : "Kickoff timing can move while schedules are being finalised.";
    return `${hint} If you’re booking the weekend anyway, stay flexible and treat the kickoff slot as a bonus once confirmed.`;
  }, [leagueName]);

  const onOpenStop = useCallback(async (query: string, _stop?: LogisticsStop) => {
    await openMapsPreferNative(query);
  }, []);

  const onSelectStayArea = useCallback(
    (area: string) => {
      const a = String(area ?? "").trim();
      if (!a || !fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId,
          cityArea: a,
          ...(effectiveLeagueId ? { leagueId: String(effectiveLeagueId) } : {}),
          ...(effectiveSeason ? { season: String(effectiveSeason) } : {}),
          from: fromIso,
          to: toIso,
        },
      } as any);
    },
    [router, fixtureId, effectiveLeagueId, effectiveSeason, fromIso, toIso]
  );

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
        {/* ... rest of your file unchanged ... */}
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  // ... your styles unchanged ...
});
