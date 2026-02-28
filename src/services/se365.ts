// src/services/se365.ts
import { FixtureListRow } from "@/src/services/apiFootball";

const BASE = process.env.EXPO_PUBLIC_SE365_BASE_URL;
const KEY = process.env.EXPO_PUBLIC_SE365_API_KEY;
const AFF = process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID;

type Se365Event = {
  id: number;
  name: string;
  eventUrl?: string;
  date?: string;
};

const cache: Record<string, string | null> = {};

/**
 * Normalize team name for matching
 */
function norm(s?: string | null) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/fc|cf|club|de|the/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Extract YYYY-MM-DD
 */
function isoDateOnly(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/**
 * Try match SE365 event from fixture
 */
function matchEvent(
  events: Se365Event[],
  home: string,
  away: string,
  date: string
): Se365Event | null {
  const h = norm(home);
  const a = norm(away);

  for (const e of events) {
    const n = norm(e.name);
    const d = isoDateOnly(e.date);

    if (n.includes(h) && n.includes(a)) {
      if (!date || !d || d === date) {
        return e;
      }
    }
  }

  return null;
}

/**
 * Fetch SE365 events for tournament (league)
 */
async function fetchTournamentEvents(tournamentId: string) {
  const url = `${BASE}/events/tournament/${tournamentId}?perPage=100&apiKey=${KEY}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = await r.json();
  return (j?.data ?? []) as Se365Event[];
}

/**
 * MAIN: get ticket URL for fixture
 */
export async function getSe365EventUrl(
  fixture: FixtureListRow
): Promise<string | null> {
  const id = String(fixture?.fixture?.id ?? "");
  if (!id) return null;

  if (cache[id] !== undefined) {
    return cache[id];
  }

  try {
    const leagueId = String(fixture?.league?.id ?? "");
    const home = fixture?.teams?.home?.name ?? "";
    const away = fixture?.teams?.away?.name ?? "";
    const date = isoDateOnly(fixture?.fixture?.date);

    if (!leagueId || !home || !away) {
      cache[id] = null;
      return null;
    }

    const events = await fetchTournamentEvents(leagueId);

    const match = matchEvent(events, home, away, date);

    if (!match?.eventUrl) {
      cache[id] = null;
      return null;
    }

    let url = match.eventUrl;

    if (AFF && !url.includes("aff=")) {
      url += url.includes("?") ? `&aff=${AFF}` : `?aff=${AFF}`;
    }

    cache[id] = url;
    return url;
  } catch {
    cache[id] = null;
    return null;
  }
}
