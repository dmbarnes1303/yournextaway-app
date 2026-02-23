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
/* Ticket routing (Sportsevents365 + Official) */
/* -------------------------------------------------------------------------- */

/**
 * Goal: land user on the EXACT event page whenever possible.
 * Reality: without SE365 event IDs, "query params on homepage" does not deep link.
 *
 * Strategy:
 * 1) If we have SE365 event id => open /event/{id}?a_aid=...
 * 2) Else => open SE365 search page (affiliate param preserved) and show the exact string to paste.
 * 3) Official tickets always available as trust option.
 * 4) Google fallback is explicit last resort.
 */
const SE365_AID = "69834e80ec9d3";
const SE365_EVENT_BASE = "https://www.sportsevents365.com/event";
const SE365_SEARCH_BASE = "https://www.sportsevents365.com/search";

// Manual overrides: force exact deep-links for high-intent fixtures.
// Key format: `${home} vs ${away}|${YYYY-MM-DD}`
const SE365_EVENT_OVERRIDES: Record<string, number> = {
  // Example placeholder:
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

function buildGoogleTicketsUrl(matchQuery: string) {
  return `https://www.google.com/search?q=${enc(matchQuery + " tickets")}`;
}

// Official links: best-effort shortcuts (still fine to fall back to Google).
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

function buildOfficialTicketsUrl(homeTeamName?: string) {
  const key = normalizeTeamKey(homeTeamName);
  if (!key) return null;

  if (OFFICIAL_TICKETS_BY_TEAM[key]) return OFFICIAL_TICKETS_BY_TEAM[key];

  const foundKey = Object.keys(OFFICIAL_TICKETS_BY_TEAM).find(
    (k) => key === k || key.includes(k) || k.includes(key)
  );
  if (foundKey) return OFFICIAL_TICKETS_BY_TEAM[foundKey];

  return `https://www.google.com/search?q=${enc(homeTeamName + " official tickets")}`;
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
  const q = [venue || "", city || "", "best pubs bars restaurants near"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildTransportUrl(venue?: string, city?: string) {
  const q = [venue || "stadium", city || "", "how to get there public transport"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildParkingUrl(venue?: string, city?: string) {
  const q = [venue || "stadium", city || "", "parking"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildDisruptionUrl(city?: string) {
  const q = [city || "city", "public transport strike disruption today"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

/* -------------------------------------------------------------------------- */
/* Ticket guide helpers (strict to your schema) */
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

function difficultyTone(d: TicketDifficulty) {
  // UI only
  switch (d) {
    case "very_hard":
      return "bad";
    case "hard":
      return "warn";
    case "medium":
      return "ok";
    case "easy":
      return "good";
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

type ToastState = { visible: false } | { visible: true; title: string; message?: string };
type TicketModalState = { open: boolean };

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  const [placeholderIds, setPlaceholderIds] = useState<Set<string> | null>(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  const toggleFollow = useFollowStore((s) => s.toggle);
  const upsertLatestSnapshot = useFollowStore((s) => s.upsertLatestSnapshot);

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

  const [email, setEmail] = useState("");

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

  const [ticketModal, setTicketModal] = useState<TicketModalState>({ open: false });
  const closeTicketModal = useCallback(() => setTicketModal({ open: false }), []);
  const openTicketModal = useCallback(() => setTicketModal({ open: true }), []);

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

  const officialTicketsUrl = useMemo(() => buildOfficialTicketsUrl(home), [home]);
  const googleTicketsUrl = useMemo(() => buildGoogleTicketsUrl(matchQuery), [matchQuery]);

  const mapsUrl = useMemo(() => buildMapsVenueUrl(venue, city), [venue, city]);
  const stadiumInfoUrl = useMemo(() => buildStadiumInfoUrl(venue, home, city), [venue, home, city]);
  const foodDrinkUrl = useMemo(() => buildFoodDrinkUrl(venue, city), [venue, city]);
  const transportUrl = useMemo(() => buildTransportUrl(venue, city), [venue, city]);
  const parkingUrl = useMemo(() => buildParkingUrl(venue, city), [venue, city]);
  const disruptionUrl = useMemo(() => buildDisruptionUrl(city), [city]);

  const ticketGuide = useMemo(() => getTicketGuide(home), [home]);
  const ticketTone = useMemo(() => (ticketGuide ? difficultyTone(ticketGuide.difficulty) : "neutral"), [ticketGuide]);

  const ticketsSub = useMemo(() => {
    const when = kickoffDateOnly ? ` • ${kickoffDateOnly}` : "";
    const base = `${home} vs ${away}${when}`;

    if (!ticketGuide) {
      return se365EventId
        ? `${base} • Opens the exact match page`
        : `${base} • Opens SE365 search (affiliate) + paste query if needed`;
    }

    const difficulty = ` • ${difficultyLabel(ticketGuide.difficulty)}`;
    const membership = ticketGuide.membershipRequired ? " • Membership often needed" : "";
    if (se365EventId) return `${base}${difficulty}${membership} • Opens the exact match page`;
    return `${base}${difficulty}${membership} • Opens SE365 search (affiliate) + paste query if needed`;
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

    const guideLine = ticketGuide
      ? `Ticket difficulty (home club): ${difficultyLabel(ticketGuide.difficulty)}\n`
      : "";

    const seLine = se365EventId
      ? `Tickets (Sportsevents365 match page): ${se365PrimaryUrl}\n`
      : `Tickets (Sportsevents365 search): ${se365PrimaryUrl}\nPaste in search: ${matchQuery}\n`;

    const message =
      `${title}\n${when}\n${where}\n${meta}\n\n` +
      guideLine +
      seLine +
      (officialTicketsUrl ? `Official tickets: ${officialTicketsUrl}\n` : "") +
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
    officialTicketsUrl,
    mapsUrl,
    ticketGuide,
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
        "Search on Sportsevents365",
        `If it doesn’t land on the exact match, tap search and paste:\n\n${matchQuery}`
      );
    }

    await safeOpenUrl(se365PrimaryUrl);
  }, [closeTicketModal, se365EventId, matchQuery, se365PrimaryUrl]);

  const openOfficialTickets = useCallback(async () => {
    closeTicketModal();
    if (!officialTicketsUrl) {
      Alert.alert("Official tickets unavailable", "We don’t have an official ticket link for this club yet.");
      return;
    }
    await safeOpenUrl(officialTicketsUrl);
  }, [closeTicketModal, officialTicketsUrl]);

  const openGoogleFallback = useCallback(async () => {
    closeTicketModal();
    await safeOpenUrl(googleTicketsUrl);
  }, [closeTicketModal, googleTicketsUrl]);

  const openTicketGuideInfo = useCallback(() => {
    if (!ticketGuide) {
      Alert.alert(
        "Ticket guide not available yet",
        "We don’t have a specific guide for this club yet. Use Official tickets or Sportsevents365 and plan early."
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
      for (const s of ticketGuide.safetyNotes.slice(0, 4)) lines.push(`• ${s}`);
    }

    if (ticketGuide.notes?.length) {
      lines.push("");
      lines.push("Notes:");
      for (const n of ticketGuide.notes.slice(0, 4)) lines.push(`• ${n}`);
    }

    Alert.alert("Ticket guide", lines.join("\n"));
  }, [ticketGuide]);

  const ticketChipLabel = useMemo(() => {
    if (!ticketGuide) return "Tickets: Guide pending";
    return `Tickets: ${difficultyLabel(ticketGuide.difficulty)}`;
  }, [ticketGuide]);

  const chipToneStyle = useMemo(() => {
    if (!ticketGuide) return null;
    if (ticketTone === "bad") return styles.chipBad;
    if (ticketTone === "warn") return styles.chipWarn;
    if (ticketTone === "good") return styles.chipGood;
    return styles.chipOk;
  }, [ticketGuide, ticketTone]);

  return (
    <Background imageUrl={getBackground("fixtures")}>
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

                  <View style={[styles.chip, chipToneStyle]}>
                    <Text style={styles.chipText}>{ticketChipLabel}</Text>
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

                {/* Ticket guide block */}
                <View style={styles.ticketGuideBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketGuideTitle}>Ticket guide (home club)</Text>

                    {ticketGuide ? (
                      <>
                        <Text style={styles.ticketGuideSub}>{ticketGuide.summary}</Text>

                        <View style={styles.ticketGuideBullets}>
                          <Text style={styles.ticketGuideBullet}>
                            • Difficulty: {difficultyLabel(ticketGuide.difficulty)}
                          </Text>

                          <Text style={styles.ticketGuideBullet}>
                            • {ticketGuide.membershipRequired ? "Membership often required" : "Membership not always required"}
                          </Text>

                          <Text style={styles.ticketGuideBullet}>
                            • {formatReleaseWindow(ticketGuide.typicalReleaseDaysBefore)}
                          </Text>

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
                      <Text style={styles.ticketGuideSub}>
                        Guide pending for this club. Use Official tickets first; otherwise use trusted sources only.
                      </Text>
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
                    <Text style={styles.bigKicker}>Tickets</Text>
                    <Text style={styles.bigTitle}>Find tickets</Text>
                    <Text style={styles.bigSub}>{ticketsSub}</Text>
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
            <>
              {/* Matchday essentials */}
              <GlassCard style={styles.card} intensity={22}>
                <Text style={styles.h2}>Matchday essentials</Text>
                <Text style={styles.muted}>
                  Neutral traveller view: arrive smoothly, enjoy the city, keep it simple.
                </Text>

                <View style={styles.opsList}>
                  <View style={styles.opsItem}>
                    <Text style={styles.opsTitle}>Arrive early</Text>
                    <Text style={styles.opsBody}>
                      Aim for 60–90 minutes before kickoff if you’re collecting tickets or navigating security.
                    </Text>
                  </View>

                  <View style={styles.opsItem}>
                    <Text style={styles.opsTitle}>Bag policy and entry</Text>
                    <Text style={styles.opsBody}>
                      Policies vary. If you’re carrying a bag, double-check restrictions before you travel.
                    </Text>
                    <Pressable onPress={() => safeOpenUrl(stadiumInfoUrl)} style={styles.inlineBtn}>
                      <Text style={styles.inlineBtnText}>Search stadium entry rules</Text>
                    </Pressable>
                  </View>

                  <View style={styles.opsItem}>
                    <Text style={styles.opsTitle}>Transport plan</Text>
                    <Text style={styles.opsBody}>
                      Public transport is usually easiest; event traffic and parking are unpredictable near kickoff.
                    </Text>
                    <View style={styles.inlineRow}>
                      <Pressable onPress={() => safeOpenUrl(transportUrl)} style={styles.inlineBtn}>
                        <Text style={styles.inlineBtnText}>Transport options</Text>
                      </Pressable>
                      <Pressable onPress={() => safeOpenUrl(parkingUrl)} style={styles.inlineBtn}>
                        <Text style={styles.inlineBtnText}>Parking</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.opsItem}>
                    <Text style={styles.opsTitle}>Food & drinks</Text>
                    <Text style={styles.opsBody}>
                      Pick something walkable so you’re not rushing. If the stadium area is dead, eat/drink in the city
                      and travel in.
                    </Text>
                    <Pressable onPress={() => safeOpenUrl(foodDrinkUrl)} style={styles.inlineBtn}>
                      <Text style={styles.inlineBtnText}>Search nearby spots</Text>
                    </Pressable>
                  </View>

                  <View style={styles.opsItem}>
                    <Text style={styles.opsTitle}>Disruption check</Text>
                    <Text style={styles.opsBody}>
                      Strikes and shutdowns can wreck the last mile (buses/trams/metros). Quick check before you commit.
                    </Text>
                    <Pressable onPress={() => safeOpenUrl(disruptionUrl)} style={styles.inlineBtn}>
                      <Text style={styles.inlineBtnText}>Check disruption</Text>
                    </Pressable>
                  </View>
                </View>
              </GlassCard>

              {/* Ticket guide safety box */}
              <GlassCard style={styles.card} intensity={22}>
                <Text style={styles.h2}>Ticket safety</Text>
                <Text style={styles.muted}>
                  Your users are saying this is the biggest pain point. Keep it strict: official first, then trusted sources.
                </Text>

                <View style={styles.safetyBox}>
                  <Text style={styles.safetyTitle}>Rule of thumb</Text>
                  <Text style={styles.safetyBody}>
                    If you can’t buy from the home club, only use established marketplaces. Avoid random DMs, “spare tickets”
                    comments, or bank-transfer-only sellers.
                  </Text>

                  {ticketGuide?.safetyNotes?.length ? (
                    <View style={{ marginTop: 10, gap: 6 }}>
                      {ticketGuide.safetyNotes.slice(0, 5).map((n, idx) => (
                        <Text key={`${idx}`} style={styles.safetyBullet}>
                          • {n}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <View style={{ marginTop: 10, gap: 6 }}>
                      <Text style={styles.safetyBullet}>• Use the club’s official ticket site/app whenever possible.</Text>
                      <Text style={styles.safetyBullet}>• If membership gates sales, plan early and expect limited general sale.</Text>
                      <Text style={styles.safetyBullet}>• If you must use resale, prefer platforms with buyer protection.</Text>
                      <Text style={styles.safetyBullet}>• Be wary of “PDF ticket sent by email” scams.</Text>
                    </View>
                  )}

                  <View style={styles.inlineRow}>
                    <Pressable onPress={openTicketModal} style={styles.inlineBtn}>
                      <Text style={styles.inlineBtnText}>Open ticket sources</Text>
                    </Pressable>
                    <Pressable onPress={openTicketGuideInfo} style={styles.inlineBtn}>
                      <Text style={styles.inlineBtnText}>View guide details</Text>
                    </Pressable>
                  </View>
                </View>
              </GlassCard>
            </>
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

        {/* Ticket Source Modal */}
        <Modal visible={ticketModal.open} transparent animationType="fade" onRequestClose={closeTicketModal}>
          <Pressable style={styles.modalBackdrop} onPress={closeTicketModal}>
            <Pressable style={styles.modalCard} onPress={() => null}>
              <Text style={styles.modalTitle}>Tickets</Text>
              <Text style={styles.modalBody}>
                Choose where you want to source tickets. Sportsevents365 uses your affiliate link. Official tickets take you
                to the home club.
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
                  onPress={openOfficialTickets}
                  style={[styles.modalBtn, styles.modalBtnSecondary, !officialTicketsUrl && styles.modalBtnDisabled]}
                  disabled={!officialTicketsUrl}
                >
                  <Text style={styles.modalBtnTitle}>Official tickets (home club)</Text>
                  <Text style={styles.modalBtnSub}>{officialTicketsUrl ? home : "No official link mapped yet"}</Text>
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
                Note: exact Sportsevents365 deep-links require their event ID. Until IDs are supplied, we open SE365 search
                and show the exact query to paste.
              </Text>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles (ADD THESE NEW STYLES BELOW your existing ones) */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.lg },

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

  // NEW: ticket difficulty chip tones (subtle)
  chipGood: { borderColor: "rgba(79,224,138,0.30)", backgroundColor: "rgba(79,224,138,0.08)" },
  chipOk: { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.18)" },
  chipWarn: { borderColor: "rgba(255,200,0,0.22)", backgroundColor: "rgba(255,200,0,0.06)" },
  chipBad: { borderColor: "rgba(255,90,90,0.22)", backgroundColor: "rgba(255,90,90,0.06)" },

  metaBlock: { marginTop: 12, gap: 6 },
  metaLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },
  metaLabel: { color: theme.colors.text, fontWeight: "900" },
  metaSecondary: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: "800" },

  // NEW: ticket guide block
  ticketGuideBox: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  ticketGuideTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  ticketGuideSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },
  ticketGuideBullets: { marginTop: 10, gap: 6 },
  ticketGuideBullet: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },
  ticketGuideInfoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.18)",
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

  inlineRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },
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

  // NEW: safety box
  safetyBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  safetyTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  safetyBody: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },
  safetyBullet: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

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
  modalFootnote: {
    marginTop: 10,
    color: theme.colors.textTertiary,
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 14,
  },
});


              
