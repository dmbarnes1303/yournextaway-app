// src/services/se365.ts

const BASE = process.env.EXPO_PUBLIC_SE365_BASE_URL;
const KEY = process.env.EXPO_PUBLIC_SE365_API_KEY;
const AFF = process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID;

export type SE365Event = {
  eventId: number;
  eventUrl: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  city?: string;
};

function buildApiUrl(path: string) {
  return `${BASE}${path}?apiKey=${KEY}`;
}

/**
 * Find SE365 event for a fixture by team names + date.
 * Phase 1: simple search by team text match.
 */
export async function findEventForFixture(
  home: string,
  away: string,
  isoDate: string
): Promise<SE365Event | null> {
  try {
    const url = buildApiUrl(`/events/search/${encodeURIComponent(home)}`);
    const res = await fetch(url);
    const json = await res.json();

    if (!Array.isArray(json?.data)) return null;

    const match = json.data.find((e: any) => {
      const teams =
        `${e.homeTeam} ${e.awayTeam}`.toLowerCase();

      return (
        teams.includes(home.toLowerCase()) &&
        teams.includes(away.toLowerCase())
      );
    });

    if (!match) return null;

    return {
      eventId: match.eventId,
      eventUrl: match.eventUrl,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: match.date,
      city: match.city,
    };
  } catch {
    return null;
  }
}

/**
 * Append affiliate ID safely
 */
export function buildAffiliateUrl(eventUrl: string): string {
  if (!eventUrl) return "";
  if (!AFF) return eventUrl;

  if (eventUrl.includes("affId=")) return eventUrl;

  const sep = eventUrl.includes("?") ? "&" : "?";
  return `${eventUrl}${sep}affId=${AFF}`;
}
