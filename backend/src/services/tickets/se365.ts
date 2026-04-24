import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import type {
  TicketCandidate,
  TicketResolveInput,
} from "./types.js";

const API_BASE = env.se365BaseUrl; // sandbox or prod
const PUBLIC_BASE = "https://www.sportsevents365.com";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function buildHeaders() {
  const username = clean(env.se365HttpUsername);
  const password = clean(env.se365ApiPassword);

  if (!username || !password) {
    return { Accept: "application/json" };
  }

  return {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(
      `${username}:${password}`
    ).toString("base64")}`,
  };
}

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function extractEvents(json: any): any[] {
  if (!json) return [];
  return json.data || json.events || json.results || [];
}

function extractTickets(json: any): any[] {
  if (!json) return [];
  return json.data || json.tickets || json.results || [];
}

function buildAffiliateUrl(eventId: string): string {
  return `${PUBLIC_BASE}/event/${eventId}?a_aid=${env.se365AffiliateId}`;
}

function getDateRange(kickoffIso: string) {
  const d = new Date(kickoffIso);

  const from = new Date(d);
  from.setDate(from.getDate() - 1);

  const to = new Date(d);
  to.setDate(to.getDate() + 1);

  const fmt = (x: Date) => x.toISOString().split("T")[0];

  return {
    from: fmt(from),
    to: fmt(to),
  };
}

function bestPrice(tickets: any[]): string | null {
  const prices = tickets
    .map((t) => Number(t.price || t.minPrice || t.lowestPrice))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  if (!prices.length) return null;
  return `£${prices[0]}`;
}

function matchEvent(ev: any, home: string, away: string): boolean {
  const name = clean(ev.name || ev.title || "").toLowerCase();

  return (
    name.includes(home.toLowerCase()) &&
    name.includes(away.toLowerCase())
  );
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) return null;

  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const kickoff = clean(input.kickoffIso);

  if (!home || !away || !kickoff) return null;

  const { from, to } = getDateRange(kickoff);

  // ---------------------------
  // STEP 1: FETCH EVENTS BY DATE
  // ---------------------------
  const eventsUrl = new URL(`${API_BASE}/events`);
  eventsUrl.searchParams.set("apiKey", env.se365ApiKey);
  eventsUrl.searchParams.set("dateFrom", from);
  eventsUrl.searchParams.set("dateTo", to);

  const eventsJson = await fetchJson(eventsUrl.toString());
  const events = extractEvents(eventsJson);

  if (!events.length) return null;

  // ---------------------------
  // STEP 2: FIND MATCH
  // ---------------------------
  const match = events.find((ev) => matchEvent(ev, home, away));

  if (!match) return null;

  const eventId = clean(match.id || match.eventId);
  if (!eventId) return null;

  // ---------------------------
  // STEP 3: FETCH TICKETS
  // ---------------------------
  const ticketsUrl = `${API_BASE}/tickets/${eventId}?apiKey=${env.se365ApiKey}`;
  const ticketsJson = await fetchJson(ticketsUrl);
  const tickets = extractTickets(ticketsJson);

  // ---------------------------
  // STEP 4: BUILD FINAL URL (IMPORTANT)
  // ---------------------------
  const url = buildAffiliateUrl(eventId);

  return {
    provider: "sportsevents365",
    exact: true,
    score: 95,
    rawScore: 95,
    url,
    title: `Tickets: ${home} vs ${away}`,
    priceText: bestPrice(tickets),
    reason: "exact_event",
    urlQuality: "event",
  };
}
