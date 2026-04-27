import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

const API_BASE = env.se365BaseUrl;
const PUBLIC_BASE = "https://www.sportsevents365.com";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function normalize(v: unknown): string {
  return clean(v).toLowerCase();
}

function buildHeaders() {
  const username = clean(env.se365HttpUsername);
  const password = clean(env.se365ApiPassword);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (username && password) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  return headers;
}

function appendApiKey(url: URL) {
  url.searchParams.set("apiKey", clean(env.se365ApiKey));
  return url;
}

async function fetchJson(url: URL) {
  try {
    const res = await fetch(url.toString(), { method: "GET", headers: buildHeaders() });
    const text = await res.text();

    console.log("[SE365] fetch", {
      url: url.toString(),
      status: res.status,
      ok: res.ok,
      bodyPreview: text.slice(0, 250),
    });

    if (!res.ok) return null;

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (err) {
    console.log("[SE365] fetch error", {
      url: url.toString(),
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function unwrapData(json: any): any {
  if (!json) return null;
  return json.data ?? json.event ?? json.result ?? json;
}

function extractEvents(json: any): any[] {
  if (!json) return [];

  const data = unwrapData(json);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(json.events)) return json.events;
  if (Array.isArray(json.results)) return json.results;

  return [];
}

function extractMinPrice(event: any): string | null {
  const price =
    event?.minTicketPrice?.price ??
    event?.minimumPrice?.price ??
    event?.price ??
    event?.minPrice ??
    null;

  const currency =
    clean(event?.minTicketPrice?.currency) ||
    clean(event?.minimumPrice?.currency) ||
    "GBP";

  const n = Number(price);
  if (!Number.isFinite(n)) return null;

  if (currency.toUpperCase() === "GBP") return `£${n}`;
  return `${currency} ${n}`;
}

function formatDateDdMmYyyy(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function getDateRange(kickoffIso: string) {
  const d = new Date(kickoffIso);

  const from = new Date(d);
  from.setDate(from.getDate() - 1);

  const to = new Date(d);
  to.setDate(to.getDate() + 1);

  return {
    from: formatDateDdMmYyyy(from),
    to: formatDateDdMmYyyy(to),
  };
}

function eventName(ev: any): string {
  return clean(ev?.name || ev?.title || ev?.caption || ev?.meta?.title);
}

function teamName(ev: any, side: "home" | "away"): string {
  if (side === "home") {
    return clean(ev?.homeTeam?.name || ev?.home?.name || ev?.homeName);
  }

  return clean(ev?.awayTeam?.name || ev?.away?.name || ev?.awayName);
}

function matchEvent(ev: any, home: string, away: string): boolean {
  const targetHome = normalize(home);
  const targetAway = normalize(away);

  const name = normalize(eventName(ev));
  const homeTeam = normalize(teamName(ev, "home"));
  const awayTeam = normalize(teamName(ev, "away"));

  const directTeams =
    homeTeam.includes(targetHome) &&
    awayTeam.includes(targetAway);

  const reversedTeams =
    homeTeam.includes(targetAway) &&
    awayTeam.includes(targetHome);

  const nameMatch =
    name.includes(targetHome) &&
    name.includes(targetAway);

  return directTeams || reversedTeams || nameMatch;
}

function affiliateUrlFromEvent(event: any, eventId: string): string {
  const apiUrl = clean(event?.eventUrl);

  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      parsed.searchParams.set("a_aid", clean(env.se365AffiliateId));
      return parsed.toString();
    } catch {
      // fall through
    }
  }

  return `${PUBLIC_BASE}/event/${eventId}?a_aid=${clean(env.se365AffiliateId)}`;
}

function candidateFromEvent(event: any, home: string, away: string): TicketCandidate | null {
  const eventId = clean(event?.id || event?.eventId);
  if (!eventId) return null;

  const url = affiliateUrlFromEvent(event, eventId);
  const title = eventName(event) || `Tickets: ${home} vs ${away}`;

  return {
    provider: "sportsevents365",
    exact: true,
    score: 95,
    rawScore: 95,
    url,
    title,
    priceText: extractMinPrice(event),
    reason: "exact_event",
    urlQuality: "event",
  };
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
    console.log("[SE365] skipped: missing input", { home, away, kickoff });
    return null;
  }

  const fixtureId = clean(input.fixtureId);

  console.log("[SE365] resolving", {
    home,
    away,
    kickoff,
    fixtureId,
    apiBase: API_BASE,
    hasApiKey: Boolean(clean(env.se365ApiKey)),
    hasUsername: Boolean(clean(env.se365HttpUsername)),
    hasPassword: Boolean(clean(env.se365ApiPassword)),
  });

  if (fixtureId) {
    const directUrl = appendApiKey(new URL(`${API_BASE}/events/${fixtureId}`));
    directUrl.searchParams.set("perPage", "25");

    const directJson = await fetchJson(directUrl);
    const directEvent = unwrapData(directJson);

    if (directEvent?.id && matchEvent(directEvent, home, away)) {
      const candidate = candidateFromEvent(directEvent, home, away);
      if (candidate) {
        console.log("[SE365] direct fixture match", {
          eventId: directEvent.id,
          url: candidate.url,
        });
        return candidate;
      }
    }

    console.log("[SE365] direct fixture id did not match SE365 event", {
      fixtureId,
      returnedId: directEvent?.id ?? null,
      returnedName: eventName(directEvent),
    });
  }

  const { from, to } = getDateRange(kickoff);

  const eventsUrl = appendApiKey(new URL(`${API_BASE}/events`));
  eventsUrl.searchParams.set("perPage", "100");
  eventsUrl.searchParams.set("dateFrom", from);
  eventsUrl.searchParams.set("dateTo", to);

  const eventsJson = await fetchJson(eventsUrl);
  const events = extractEvents(eventsJson);

  console.log("[SE365] events result", {
    count: events.length,
    from,
    to,
    sample: events.slice(0, 5).map((event) => ({
      id: event?.id,
      name: eventName(event),
      home: teamName(event, "home"),
      away: teamName(event, "away"),
      date: event?.dateOfEvent,
      time: event?.timeOfEvent,
    })),
  });

  const match = events.find((event) => matchEvent(event, home, away));

  if (!match) {
    console.log("[SE365] no matching event found", { home, away, from, to });
    return null;
  }

  const candidate = candidateFromEvent(match, home, away);

  console.log("[SE365] result", {
    found: Boolean(candidate),
    eventId: match?.id ?? null,
    title: candidate?.title ?? null,
    url: candidate?.url ?? null,
    priceText: candidate?.priceText ?? null,
  });

  return candidate;
}
