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

function buildHeaders(): Record<string, string> {
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

function appendApiKey(url: URL): URL {
  url.searchParams.set("apiKey", clean(env.se365ApiKey));
  return url;
}

async function fetchJson(url: URL): Promise<{ ok: boolean; status: number; json: any | null }> {
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: buildHeaders(),
    });

    const text = await res.text();

    console.log("[SE365] fetch", {
      url: url.toString(),
      status: res.status,
      ok: res.ok,
      bodyPreview: text.slice(0, 250),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, json: null };
    }

    try {
      return { ok: true, status: res.status, json: JSON.parse(text) };
    } catch {
      return { ok: true, status: res.status, json: null };
    }
  } catch (err) {
    console.log("[SE365] fetch error", {
      url: url.toString(),
      error: err instanceof Error ? err.message : String(err),
    });

    return { ok: false, status: 0, json: null };
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
    event?.minPrice?.price ??
    event?.price?.amount ??
    event?.price ??
    event?.minPrice ??
    null;

  const currency =
    clean(event?.minTicketPrice?.currency) ||
    clean(event?.minimumPrice?.currency) ||
    clean(event?.minPrice?.currency) ||
    clean(event?.price?.currency) ||
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

function getDateRange(kickoffIso: string): { from: string; to: string } {
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

function participantNames(ev: any): string[] {
  if (!Array.isArray(ev?.participants)) return [];

  return ev.participants
    .map((participant: any) => clean(participant?.name))
    .filter(Boolean);
}

function matchEvent(ev: any, home: string, away: string): boolean {
  const targetHome = normalize(home);
  const targetAway = normalize(away);

  const name = normalize(eventName(ev));
  const homeTeam = normalize(teamName(ev, "home"));
  const awayTeam = normalize(teamName(ev, "away"));
  const participants = participantNames(ev).map(normalize);

  const directTeams =
    homeTeam.includes(targetHome) && awayTeam.includes(targetAway);

  const reversedTeams =
    homeTeam.includes(targetAway) && awayTeam.includes(targetHome);

  const nameMatch = name.includes(targetHome) && name.includes(targetAway);

  const participantMatch =
    participants.some((participant) => participant.includes(targetHome)) &&
    participants.some((participant) => participant.includes(targetAway));

  return directTeams || reversedTeams || nameMatch || participantMatch;
}

function affiliateUrlFromEvent(event: any, eventId: string): string {
  const affiliateId = clean(env.se365AffiliateId);

  const apiUrl =
    clean(event?.eventUrl) ||
    clean(event?.url) ||
    clean(event?.link) ||
    clean(event?.affiliateUrl);

  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      if (affiliateId) parsed.searchParams.set("a_aid", affiliateId);
      return parsed.toString();
    } catch {
      // fall through
    }
  }

  const fallbackUrl = new URL(`${PUBLIC_BASE}/event/${eventId}`);
  if (affiliateId) fallbackUrl.searchParams.set("a_aid", affiliateId);

  return fallbackUrl.toString();
}

function buildPublicSearchUrl(home: string, away: string, kickoffIso: string): string {
  const affiliateId = clean(env.se365AffiliateId);
  const kickoffDate = clean(kickoffIso).slice(0, 10);
  const query = `${home} ${away}`;

  const url = new URL(`${PUBLIC_BASE}/search`);
  url.searchParams.set("q", query);

  if (kickoffDate) {
    url.searchParams.set("date", kickoffDate);
  }

  if (affiliateId) {
    url.searchParams.set("a_aid", affiliateId);
  }

  return url.toString();
}

function candidateFromEvent(
  event: any,
  home: string,
  away: string
): TicketCandidate | null {
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

function fallbackSearchCandidate(
  input: TicketResolveInput,
  home: string,
  away: string,
  kickoffIso: string
): TicketCandidate {
  return {
    provider: "sportsevents365",
    exact: false,
    score: 45,
    rawScore: 45,
    url: buildPublicSearchUrl(home, away, kickoffIso),
    title: `SportsEvents365: ${home} vs ${away}`,
    priceText: "View live price",
    reason: "search_fallback",
    urlQuality: "search",
  };
}

async function tryDirectEventById(
  fixtureId: string,
  home: string,
  away: string
): Promise<TicketCandidate | null> {
  const directUrl = appendApiKey(new URL(`${API_BASE}/events/${fixtureId}`));
  directUrl.searchParams.set("perPage", "25");

  const directResult = await fetchJson(directUrl);
  const directEvent = unwrapData(directResult.json);

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
    status: directResult.status,
    returnedId: directEvent?.id ?? null,
    returnedName: eventName(directEvent),
    returnedParticipants: participantNames(directEvent),
  });

  return null;
}

async function tryKnownSearchRoutes(
  home: string,
  away: string,
  kickoffIso: string
): Promise<TicketCandidate | null> {
  const { from, to } = getDateRange(kickoffIso);

  const routes = [
    {
      label: "events_list",
      url: new URL(`${API_BASE}/events`),
      params: {
        perPage: "100",
        dateFrom: from,
        dateTo: to,
      },
    },
    {
      label: "events_search",
      url: new URL(`${API_BASE}/events/search`),
      params: {
        perPage: "100",
        dateFrom: from,
        dateTo: to,
        q: `${home} ${away}`,
      },
    },
    {
      label: "search_events",
      url: new URL(`${API_BASE}/search/events`),
      params: {
        perPage: "100",
        dateFrom: from,
        dateTo: to,
        q: `${home} ${away}`,
      },
    },
  ];

  for (const route of routes) {
    const url = appendApiKey(route.url);

    for (const [key, value] of Object.entries(route.params)) {
      url.searchParams.set(key, value);
    }

    const result = await fetchJson(url);
    const events = extractEvents(result.json);

    console.log("[SE365] search route result", {
      route: route.label,
      status: result.status,
      count: events.length,
      from,
      to,
      sample: events.slice(0, 5).map((event) => ({
        id: event?.id,
        name: eventName(event),
        home: teamName(event, "home"),
        away: teamName(event, "away"),
        participants: participantNames(event),
        date: event?.dateOfEvent,
        time: event?.timeOfEvent,
      })),
    });

    const match = events.find((event) => matchEvent(event, home, away));

    if (!match) continue;

    const candidate = candidateFromEvent(match, home, away);

    if (candidate) {
      console.log("[SE365] API search match", {
        route: route.label,
        eventId: match?.id ?? null,
        title: candidate.title,
        url: candidate.url,
        priceText: candidate.priceText,
      });

      return candidate;
    }
  }

  return null;
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config", {
      hasBaseUrl: Boolean(clean(env.se365BaseUrl)),
      hasApiKey: Boolean(clean(env.se365ApiKey)),
      hasUsername: Boolean(clean(env.se365HttpUsername)),
      hasPassword: Boolean(clean(env.se365ApiPassword)),
      hasAffiliateId: Boolean(clean(env.se365AffiliateId)),
    });

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
    hasAffiliateId: Boolean(clean(env.se365AffiliateId)),
  });

  if (fixtureId) {
    const directCandidate = await tryDirectEventById(fixtureId, home, away);
    if (directCandidate) return directCandidate;
  }

  const searchCandidate = await tryKnownSearchRoutes(home, away, kickoff);
  if (searchCandidate) return searchCandidate;

  console.log("[SE365] no exact API event found; returning public search fallback", {
    home,
    away,
    kickoff,
    url: buildPublicSearchUrl(home, away, kickoff),
  });

  return fallbackSearchCandidate(input, home, away, kickoff);
}
