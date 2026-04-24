import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import type {
  TicketCandidate,
  TicketResolveInput,
} from "./types.js";

const API_BASE = env.se365BaseUrl;
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

    console.log("[SE365] fetch", {
      url,
      status: res.status,
      ok: res.ok,
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json;
  } catch (err) {
    console.log("[SE365] fetch error", {
      url,
      error: err instanceof Error ? err.message : String(err),
    });
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
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const kickoff = clean(input.kickoffIso);

  if (!home || !away || !kickoff) {
    console.log("[SE365] skipped: missing input", {
      home,
      away,
      kickoff,
    });
    return null;
  }

  const { from, to } = getDateRange(kickoff);

  console.log("[SE365] resolving", {
    home,
    away,
    kickoff,
    from,
    to,
  });

  // ---------------------------
  // STEP 1: FETCH EVENTS BY DATE
  // ---------------------------
  const eventsUrl = new URL(`${API_BASE}/events`);
  eventsUrl.searchParams.set("apiKey", env.se365ApiKey);
  eventsUrl.searchParams.set("dateFrom", from);
  eventsUrl.searchParams.set("dateTo", to);

  const eventsJson = await fetchJson(eventsUrl.toString());
  const events = extractEvents(eventsJson);

  console.log("[SE365] events result", {
    count: events.length,
    sample: events.slice(0, 3),
  });

  if (!events.length) {
    console.log("[SE365] no events returned");
    return null;
  }

  // ---------------------------
  // STEP 2: FIND MATCH
  // ---------------------------
  const match = events.find((ev) => matchEvent(ev, home, away));

  console.log("[SE365] match result", {
    found: Boolean(match),
    matchPreview: match ? (match.name || match.title || null) : null,
  });

  if (!match) return null;

  const eventId = clean(match.id || match.eventId);

  console.log("[SE365] matched eventId", { eventId });

  if (!eventId) return null;

  // ---------------------------
  // STEP 3: FETCH TICKETS
  // ---------------------------
  const ticketsUrl = `${API_BASE}/tickets/${eventId}?apiKey=${env.se365ApiKey}`;
  const ticketsJson = await fetchJson(ticketsUrl);
  const tickets = extractTickets(ticketsJson);

  console.log("[SE365] tickets result", {
    count: tickets.length,
  });

  // ---------------------------
  // STEP 4: BUILD FINAL URL
  // ---------------------------
  const url = buildAffiliateUrl(eventId);

  console.log("[SE365] SUCCESS", {
    url,
    eventId,
  });

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
