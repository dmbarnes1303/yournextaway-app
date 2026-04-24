import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import type {
  CandidateUrlQuality,
  TicketCandidate,
  TicketResolveInput,
} from "./types.js";

const SE365_API_BASE = "https://api-v2.sandbox365.com";
const SE365_PUBLIC_BASE = "https://www.sportsevents365.com";
const A_AID = "69834e80ec9d3";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function buildHeaders() {
  const username = clean(env.se365HttpUsername);
  const password = clean(env.se365ApiPassword);

  if (!username || !password) return { Accept: "application/json" };

  return {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  };
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractEvents(json: any): any[] {
  if (!json) return [];
  return (
    json.data ||
    json.events ||
    json.items ||
    json.response ||
    json.results ||
    (Array.isArray(json) ? json : [])
  );
}

function extractTickets(json: any): any[] {
  if (!json) return [];
  return (
    json.data ||
    json.tickets ||
    json.items ||
    json.response ||
    json.results ||
    (Array.isArray(json) ? json : [])
  );
}

function appendAid(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `${SE365_PUBLIC_BASE}${url}`);
    u.searchParams.set("a_aid", A_AID);
    return u.toString();
  } catch {
    return "";
  }
}

function bestPrice(tickets: any[]): string | null {
  const prices = tickets
    .map((t) => Number(t.price || t.minPrice || t.lowestPrice))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  if (!prices.length) return null;
  return `£${prices[0]}`;
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) return null;

  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const kickoff = clean(input.kickoffIso);

  if (!home || !away || !kickoff) return null;

  // -------------------------------------------------
  // STEP 1: SEARCH EVENTS (broad match)
  // -------------------------------------------------

  const searchUrl = new URL(`${SE365_API_BASE}/events`);
  searchUrl.searchParams.set("apiKey", clean(env.se365ApiKey));
  searchUrl.searchParams.set("search", `${home} ${away}`);

  const searchJson = await fetchJson(searchUrl.toString());
  const events = extractEvents(searchJson);

  if (!events.length) return null;

  // -------------------------------------------------
  // STEP 2: FIND BEST MATCH (simple but effective)
  // -------------------------------------------------

  const match = events.find((ev) => {
    const name = clean(ev.name || ev.eventTitle || ev.title).toLowerCase();
    return name.includes(home.toLowerCase()) && name.includes(away.toLowerCase());
  });

  if (!match) return null;

  const eventId = clean(match.id);
  if (!eventId) return null;

  // -------------------------------------------------
  // STEP 3: CRITICAL FIX — FETCH FULL EVENT
  // -------------------------------------------------

  const eventUrlApi = new URL(`${SE365_API_BASE}/events/${eventId}`);
  eventUrlApi.searchParams.set("apiKey", clean(env.se365ApiKey));

  const fullEvent = await fetchJson(eventUrlApi.toString());

  const realUrl =
    clean(fullEvent?.eventUrl) ||
    clean(fullEvent?.event_url) ||
    clean(fullEvent?.url);

  if (!realUrl) {
    // ONLY fallback if API fails (rare)
    return {
      provider: "sportsevents365",
      exact: false,
      score: 30,
      rawScore: 30,
      url: appendAid(`${SE365_PUBLIC_BASE}/events/search?q=${home}+${away}`),
      title: `Tickets: ${home} vs ${away}`,
      priceText: null,
      reason: "search_fallback",
      urlQuality: "search",
    };
  }

  // -------------------------------------------------
  // STEP 4: FETCH TICKETS
  // -------------------------------------------------

  const ticketsJson = await fetchJson(
    `${SE365_API_BASE}/tickets/${eventId}?apiKey=${clean(env.se365ApiKey)}`
  );

  const tickets = extractTickets(ticketsJson);

  // -------------------------------------------------
  // FINAL OUTPUT
  // -------------------------------------------------

  return {
    provider: "sportsevents365",
    exact: true,
    score: 90,
    rawScore: 90,
    url: appendAid(realUrl),
    title: `Tickets: ${home} vs ${away}`,
    priceText: bestPrice(tickets),
    reason: "exact_event",
    urlQuality: "event",
  };
}
