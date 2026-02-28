// src/services/se365.ts
/**
 * Sportsevents365 resolver + helpers.
 *
 * Goal:
 * - Given a fixture context (leagueId, home/away, kickoffIso),
 *   find the matching SE365 event and return a deep-link URL.
 * - Add affiliate param to the eventUrl for tracking.
 *
 * Notes:
 * - SE365 provides:
 *   - list events by tournament: /events/tournament/{tournamentId}
 *   - event details: /events/{eventId}
 *   Each event details response contains `eventUrl`.
 */

type Json = any;

export type Se365ResolveInput = {
  leagueId?: number;
  homeName?: string;
  awayName?: string;
  kickoffIso?: string; // ISO string
};

export type Se365Resolved = {
  eventId: number;
  eventUrl: string; // tracked deep-link
  rawEventUrl?: string; // original from API
};

const DEFAULT_TIMEOUT_MS = 12000;

// You can override these via app config / env.
// If you don't, it will default to SANDBOX (safe for dev).
const BASE_URL =
  (process.env.EXPO_PUBLIC_SE365_BASE_URL || "").trim() ||
  "https://api-v2.sandbox365.com";

const API_KEY = (process.env.EXPO_PUBLIC_SE365_API_KEY || "").trim();

// Affiliate ID for WEB deep-links (NOT API key).
// If you already have a tracked tickets base url elsewhere, this still works.
// Example: "12345"
const AFFILIATE_ID = (process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID || "").trim();

/**
 * IMPORTANT:
 * You need a mapping from your API-Football leagueId to SE365 tournamentId.
 * Without this, you can't deterministically list the correct set of events.
 *
 * These tournamentIds are placeholders until you confirm them from SE365.
 * You can still ship with this + fallback search, but for "exact match every time"
 * you must fill these accurately.
 */
const LEAGUE_TO_TOURNAMENT: Record<number, number> = {
  // API-Football -> SE365 tournament
  39: 694, // Premier League (example from your email)
  // 140: <LaLiga tournamentId>,
  // 135: <Serie A tournamentId>,
  // 78:  <Bundesliga tournamentId>,
  // 61:  <Ligue 1 tournamentId>,
};

function withTimeout<T>(p: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

async function fetchJson(url: string): Promise<Json> {
  const res = await withTimeout(fetch(url), DEFAULT_TIMEOUT_MS);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`SE365 HTTP ${res.status}: ${txt}`.trim());
  }
  return await res.json();
}

function isoDateOnly(iso?: string): string | null {
  const s = String(iso ?? "").trim();
  if (!s) return null;
  // "2026-03-01T17:30:00+00:00" -> "2026-03-01"
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function normTeam(s?: string): string {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(fc|cf|sc|afc|cfc|cd|ud|ac|sv|ss|de|la|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesLoose(hay: string, needle: string): boolean {
  if (!hay || !needle) return false;
  if (hay === needle) return true;
  return hay.includes(needle) || needle.includes(hay);
}

function addAffiliateParam(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return u;
  if (!AFFILIATE_ID) return u;

  // Avoid duplicates
  if (u.includes("affiliate_id=") || u.includes("a_aid=")) return u;

  const join = u.includes("?") ? "&" : "?";
  // Based on SE365 guidance: "add your affiliate ID parameter to the URL".
  // If they require a different param name for your account, change here.
  return `${u}${join}affiliate_id=${encodeURIComponent(AFFILIATE_ID)}`;
}

async function listTournamentEvents(tournamentId: number, perPage = 200, page = 1) {
  if (!API_KEY) throw new Error("Missing EXPO_PUBLIC_SE365_API_KEY");

  const url =
    `${BASE_URL}/events/tournament/${tournamentId}` +
    `?perPage=${encodeURIComponent(String(perPage))}` +
    `&page=${encodeURIComponent(String(page))}` +
    `&apiKey=${encodeURIComponent(API_KEY)}`;

  return await fetchJson(url);
}

async function getEventDetails(eventId: number) {
  if (!API_KEY) throw new Error("Missing EXPO_PUBLIC_SE365_API_KEY");
  const url =
    `${BASE_URL}/events/${eventId}` +
    `?apiKey=${encodeURIComponent(API_KEY)}`;
  return await fetchJson(url);
}

/**
 * Best-effort event matching:
 * - Pull tournament events
 * - Compare date-only + home/away names (loose normalize)
 * - If eventUrl missing, fetch event details
 */
export async function resolveSe365Event(input: Se365ResolveInput): Promise<Se365Resolved | null> {
  const leagueId = Number(input.leagueId);
  if (!Number.isFinite(leagueId)) return null;

  const tournamentId = LEAGUE_TO_TOURNAMENT[leagueId];
  if (!tournamentId) return null;

  const home = normTeam(input.homeName);
  const away = normTeam(input.awayName);
  const dateOnly = isoDateOnly(input.kickoffIso);

  if (!home || !away) return null;
  if (!dateOnly) return null;

  // Pull first page large enough for most tournaments.
  // If your tournaments exceed this, we can implement pagination later.
  const data = await listTournamentEvents(tournamentId, 250, 1);

  const events: any[] = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
  if (!events.length) return null;

  // Try to find best match
  let best: any | null = null;

  for (const ev of events) {
    const evHome = normTeam(ev?.homeTeam?.name || ev?.homeTeamName || ev?.home || ev?.teamHome || "");
    const evAway = normTeam(ev?.awayTeam?.name || ev?.awayTeamName || ev?.away || ev?.teamAway || "");

    const evDate =
      isoDateOnly(ev?.startDate || ev?.date || ev?.eventDate || ev?.kickoff || ev?.start_time) ||
      isoDateOnly(ev?.startDateTime);

    if (!evDate || evDate !== dateOnly) continue;

    const homeOk = includesLoose(evHome, home);
    const awayOk = includesLoose(evAway, away);

    if (homeOk && awayOk) {
      best = ev;
      break;
    }
  }

  if (!best) return null;

  const eventId = Number(best?.id || best?.eventId);
  if (!Number.isFinite(eventId) || eventId <= 0) return null;

  // eventUrl can be on the event list OR only in details
  let rawEventUrl = String(best?.eventUrl || best?.url || "").trim();

  if (!rawEventUrl) {
    const detail = await getEventDetails(eventId);
    rawEventUrl = String(detail?.eventUrl || detail?.event?.eventUrl || "").trim();
  }

  if (!rawEventUrl) return null;

  const tracked = addAffiliateParam(rawEventUrl);

  return {
    eventId,
    eventUrl: tracked,
    rawEventUrl,
  };
}

/**
 * Fallback: build a safe Google query url for tickets.
 */
export function buildTicketsGoogleSearch(homeName?: string, awayName?: string, kickoffIso?: string) {
  const dateOnly = isoDateOnly(kickoffIso) || "";
  const q = `${homeName ?? ""} vs ${awayName ?? ""} tickets ${dateOnly}`.trim();
  const qs = encodeURIComponent(q);
  return `https://www.google.com/search?q=${qs}`;
}
