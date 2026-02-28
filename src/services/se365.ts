// src/services/se365.ts

export type SE365Event = {
  id: number;
  name: string;
  date: string;
  eventUrl?: string;
};

const BASE = process.env.EXPO_PUBLIC_SE365_BASE_URL!;
const API_KEY = process.env.EXPO_PUBLIC_SE365_API_KEY!;
const AFFILIATE = process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID!;

/**
 * Map your app leagues → SE365 tournament IDs
 * IMPORTANT: replace with real IDs when provided by SE365
 */
export const SE365_TOURNAMENT_MAP: Record<number, number> = {
  39: 694,   // Premier League (example)
  140: 693,  // La Liga
  135: 695,  // Serie A
  78: 696,   // Bundesliga
  61: 697,   // Ligue 1
};

export async function fetchTournamentEvents(
  leagueId: number
): Promise<SE365Event[]> {
  const tournamentId = SE365_TOURNAMENT_MAP[leagueId];
  if (!tournamentId) return [];

  const url = `${BASE}/events/tournament/${tournamentId}?perPage=200&apiKey=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();

  return (json?.data ?? []).map((e: any) => ({
    id: e.id,
    name: e.name,
    date: e.date,
    eventUrl: e.eventUrl,
  }));
}

/**
 * Match SE365 event to fixture
 */
export function findMatchingEvent(
  events: SE365Event[],
  home: string,
  away: string,
  dateIso: string
): SE365Event | null {
  const d = dateIso.slice(0, 10);

  return (
    events.find(e => {
      if (!e.eventUrl) return false;
      const sameDate = e.date?.slice(0, 10) === d;
      const name = (e.name ?? "").toLowerCase();
      return (
        sameDate &&
        name.includes(home.toLowerCase()) &&
        name.includes(away.toLowerCase())
      );
    }) ?? null
  );
}

/**
 * Build final deep link with affiliate
 */
export function buildAffiliateUrl(eventUrl: string): string {
  if (!eventUrl) return "";
  const sep = eventUrl.includes("?") ? "&" : "?";
  return `${eventUrl}${sep}aid=${AFFILIATE}`;
}
