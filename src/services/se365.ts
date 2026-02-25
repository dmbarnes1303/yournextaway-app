// src/services/se365.ts
// SportsEvents365 ticket integration (production)

const API_KEY = "481c0195cf15719699c4bcdd081edb30";
const AFF_ID = "69834e80ec9d3";

const BASE = "https://api-v2.sportsevents365.com";

export type SE365TicketOffer = {
  eventId: string;
  url: string;
  minPrice?: number | null;
  currency?: string | null;
};

function attachAffiliate(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("a_aid", AFF_ID);
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchEvent(eventId: string) {
  const url = `${BASE}/tickets/${eventId}?perPage=15&apiKey=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const json: any = await res.json();
  return json;
}

/**
 * Get ticket offer for fixture
 */
export async function getSE365Tickets(eventId: string): Promise<SE365TicketOffer | null> {
  if (!eventId) return null;

  try {
    const json = await fetchEvent(eventId);
    if (!json) return null;

    const eventUrl = String(json?.eventUrl ?? "").trim();
    if (!eventUrl) return null;

    const minPrice =
      Number(json?.minPrice ?? json?.priceFrom ?? json?.fromPrice ?? 0) || null;

    const currency = String(json?.currency ?? "").trim() || null;

    return {
      eventId,
      url: attachAffiliate(eventUrl),
      minPrice,
      currency,
    };
  } catch {
    return null;
  }
}
