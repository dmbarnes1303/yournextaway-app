import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

type Se365Event = {
  id?: number | string;
  eventId?: number | string;
  name?: string;
  event_name?: string;
  title?: string;
  eventTitle?: string;
  url?: string;
  event_url?: string;
  eventUrl?: string;
  startDate?: string;
  start_date?: string;
  date?: string;
  event_date?: string;
  eventDate?: string;
  minPrice?: string | number;
  min_price?: string | number;
  lowestPrice?: string | number;
  lowest_price?: string | number;
  price?: string | number;
  currency?: string;
};

type Se365Response =
  | {
      events?: Se365Event[];
      data?: Se365Event[] | { events?: Se365Event[]; items?: Se365Event[] };
      items?: Se365Event[];
      response?: Se365Event[];
      results?: Se365Event[];
    }
  | null;

const SE365_FETCH_TIMEOUT_MS = 7000;
const SE365_FALLBACK_SCORE = 24;

const SEARCH_PATHS = [
  "/events/search",
  "/search/events",
  "/event/search",
] as const;

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function norm(v: unknown): string {
  return clean(v).toLowerCase();
}

function safeDate(v?: string): Date | null {
  const s = clean(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function absDays(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

function eventId(ev: Se365Event): string {
  return clean(ev.id) || clean(ev.eventId);
}

function eventName(ev: Se365Event): string {
  return (
    clean(ev.name) ||
    clean(ev.event_name) ||
    clean(ev.title) ||
    clean(ev.eventTitle)
  );
}

function eventUrl(ev: Se365Event): string {
  return clean(ev.url) || clean(ev.event_url) || clean(ev.eventUrl);
}

function eventDate(ev: Se365Event): string {
  return (
    clean(ev.startDate) ||
    clean(ev.start_date) ||
    clean(ev.date) ||
    clean(ev.event_date) ||
    clean(ev.eventDate)
  );
}

function eventPrice(ev: Se365Event): string | null {
  return (
    clean(ev.minPrice) ||
    clean(ev.min_price) ||
    clean(ev.lowestPrice) ||
    clean(ev.lowest_price) ||
    clean(ev.price) ||
    null
  );
}

function appendAffiliate(url: string): string {
  const base = clean(url);
  if (!base) return "";
  if (/\ba_aid=/.test(base)) return base;

  const affiliateId = clean(env.se365AffiliateId);
  if (!affiliateId) return base;

  const joiner = base.includes("?") ? "&" : "?";

  if (affiliateId.includes("=")) {
    return `${base}${joiner}${affiliateId}`;
  }

  return `${base}${joiner}a_aid=${encodeURIComponent(affiliateId)}`;
}

function containsTeamsLoose(name: string, home: string, away: string): boolean {
  const n = norm(name);
  return n.includes(norm(home)) && n.includes(norm(away));
}

function textContainsVariant(name: string, variant: string): boolean {
  const haystack = ` ${norm(name)} `;
  const needle = ` ${norm(variant)} `;
  return haystack.includes(needle);
}

function isBadVariant(name: string): boolean {
  const variants = [
    "women",
    "women's",
    "ladies",
    "female",
    "feminine",
    "femeni",
    "femenino",
    "feminino",
    "u17",
    "u18",
    "u19",
    "u20",
    "u21",
    "u23",
    "youth",
    "academy",
    "b team",
    "reserves",
    "reserve",
    "legends",
  ];

  for (const variant of variants) {
    if (textContainsVariant(name, variant)) return true;
  }

  const n = norm(name);
  if (/(^|[\s-])ii($|[\s-])/.test(n)) return true;
  if (/(^|[\s-])b($|[\s-])/.test(n)) return true;

  return false;
}

function scoreEvent(ev: Se365Event, input: TicketResolveInput): number {
  let score = 0;

  const name = eventName(ev);
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  const nameMatch = homeVariants.some((home) =>
    awayVariants.some((away) => containsTeamsLoose(name, home, away))
  );

  if (name && nameMatch) score += 60;
  if (name && isBadVariant(name)) score -= 1000;

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));

  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);
    if (diff === 0) score += 25;
    else if (diff === 1) score += 15;
    else if (diff === 2) score += 5;
    else if (diff > 2) score -= 1000;
  }

  if (eventUrl(ev)) score += 5;
  if (eventPrice(ev)) score += 2;

  return score;
}

function isStrongEnough(score: number): boolean {
  return score >= 50;
}

function isExactEvent(
  ev: Se365Event,
  input: TicketResolveInput,
  score: number
): boolean {
  const name = eventName(ev);
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  const nameMatch = homeVariants.some((home) =>
    awayVariants.some((away) => containsTeamsLoose(name, home, away))
  );

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));

  if (!nameMatch || !kickoff || !evDt) return false;
  if (isBadVariant(name)) return false;

  return absDays(kickoff, evDt) === 0 && score >= 80;
}

function summarizeEvent(ev: Se365Event) {
  return {
    id: eventId(ev) || null,
    name: eventName(ev) || null,
    date: eventDate(ev) || null,
    url: eventUrl(ev) || null,
    priceText: eventPrice(ev),
  };
}

function extractEvents(json: Se365Response): Se365Event[] {
  if (!json) return [];

  if (Array.isArray(json.events)) return json.events;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.response)) return json.response;
  if (Array.isArray(json.results)) return json.results;

  if (Array.isArray(json.data)) return json.data;

  if (json.data && typeof json.data === "object") {
    const obj = json.data as Record<string, unknown>;
    if (Array.isArray(obj.events)) return obj.events as Se365Event[];
    if (Array.isArray(obj.items)) return obj.items as Se365Event[];
  }

  return [];
}

function buildQueries(input: TicketResolveInput): string[] {
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);
  const league = clean(input.leagueName);

  const queries: string[] = [];

  for (const home of homeVariants) {
    for (const away of awayVariants) {
      queries.push(`${home} ${away}`);
      queries.push(`${home} vs ${away}`);
      queries.push(`${away} vs ${home}`);

      if (league) {
        queries.push(`${home} ${away} ${league}`);
        queries.push(`${home} vs ${away} ${league}`);
        queries.push(`${away} vs ${home} ${league}`);
      }
    }
  }

  return Array.from(new Set(queries.map(clean).filter(Boolean)));
}

function buildTrackedSearchFallback(input: TicketResolveInput): string | null {
  const home = getPreferredTeamName(input.homeName);
  const away = getPreferredTeamName(input.awayName);
  const league = clean(input.leagueName);

  const q = league ? `${home} vs ${away} ${league}` : `${home} vs ${away}`;
  if (!q) return null;

  const url = new URL("https://www.sportsevents365.com/events/search");
  url.searchParams.set("q", q);

  const aidRaw = clean(env.se365AffiliateId);
  if (aidRaw) {
    if (aidRaw.includes("=")) {
      const [k, v] = aidRaw.split("=");
      if (k && v) url.searchParams.set(k, v);
    } else {
      url.searchParams.set("a_aid", aidRaw);
    }
  }

  return url.toString();
}

function buildBasicAuthHeader(): string | null {
  const username =
    clean(env.se365HttpUsername) || clean(env.se365HttpSource) || "";
  const password = clean(env.se365ApiPassword);

  if (!username || !password) return null;

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function buildRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const basicAuth = buildBasicAuthHeader();
  if (basicAuth) {
    headers.Authorization = basicAuth;
  }

  if (clean(env.se365ApiKey)) {
    headers["x-api-key"] = clean(env.se365ApiKey);
  }

  return headers;
}

function buildSearchUrl(path: string, query: string): string {
  const base = env.se365BaseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}${path}`);

  url.searchParams.set("q", query);

  if (clean(env.se365ApiKey)) {
    url.searchParams.set("apiKey", clean(env.se365ApiKey));
  }

  return url.toString();
}

async function fetchSearch(url: string): Promise<Se365Event[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SE365_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: buildRequestHeaders(),
      signal: controller.signal,
    });

    const body = await res.text();

    if (!res.ok) {
      console.log("[SE365] non-200 response", {
        url,
        status: res.status,
        body: body.slice(0, 500),
      });
      return [];
    }

    let json: Se365Response = null;
    try {
      json = body ? (JSON.parse(body) as Se365Response) : null;
    } catch {
      console.log("[SE365] invalid JSON response", {
        url,
        body: body.slice(0, 500),
      });
      return [];
    }

    return extractEvents(json);
  } catch (error) {
    console.log("[SE365] fetch error", {
      url,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  const queries = buildQueries(input);
  const allEvents: Se365Event[] = [];

  console.log("[SE365] resolve start", {
    baseUrl: env.se365BaseUrl,
    queries,
    hasApiKey: Boolean(clean(env.se365ApiKey)),
    hasApiPassword: Boolean(clean(env.se365ApiPassword)),
    hasHttpUsername: Boolean(clean(env.se365HttpUsername)),
    hasHttpSource: Boolean(clean(env.se365HttpSource)),
    hasAffiliateId: Boolean(clean(env.se365AffiliateId)),
    homeName: clean(input.homeName),
    awayName: clean(input.awayName),
    kickoffIso: clean(input.kickoffIso),
    leagueName: clean(input.leagueName) || null,
    leagueId: clean(input.leagueId) || null,
  });

  for (const q of queries) {
    for (const path of SEARCH_PATHS) {
      const url = buildSearchUrl(path, q);
      const events = await fetchSearch(url);

      console.log("[SE365] query result", {
        path,
        query: q,
        url,
        eventCount: events.length,
        sample: events.slice(0, 3).map(summarizeEvent),
      });

      if (events.length) {
        allEvents.push(...events);
      }
    }

    if (allEvents.length >= 10) {
      break;
    }
  }

  if (!allEvents.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);
    console.log("[SE365] no events from API, using fallback", { fallbackUrl });

    if (!fallbackUrl) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: SE365_FALLBACK_SCORE,
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const deduped = Array.from(
    new Map(
      allEvents.map((ev) => [
        `${eventId(ev)}|${eventName(ev)}|${eventDate(ev)}`,
        ev,
      ])
    ).values()
  );

  const scored = deduped
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
    }))
    .filter((x) => isStrongEnough(x.score))
    .sort((a, b) => b.score - a.score);

  console.log("[SE365] scored candidates", {
    dedupedCount: deduped.length,
    strongCount: scored.length,
    top: scored.slice(0, 5).map((x) => ({
      ...summarizeEvent(x.ev),
      score: x.score,
    })),
  });

  if (!scored.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);
    if (!fallbackUrl) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: SE365_FALLBACK_SCORE,
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const best = scored[0];
  const rawUrl = eventUrl(best.ev);

  if (!rawUrl) {
    const fallbackUrl = buildTrackedSearchFallback(input);
    console.log("[SE365] best candidate missing URL, using fallback", {
      best: {
        ...summarizeEvent(best.ev),
        score: best.score,
      },
      fallbackUrl,
    });

    if (!fallbackUrl) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: Math.max(SE365_FALLBACK_SCORE, best.score - 15),
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: eventPrice(best.ev),
      reason: "search_fallback",
    };
  }

  const exact = isExactEvent(best.ev, input, best.score);

  console.log("[SE365] matched event", {
    best: {
      ...summarizeEvent(best.ev),
      score: best.score,
      exact,
      resolvedUrl: rawUrl,
      affiliateUrl: appendAffiliate(rawUrl),
    },
  });

  return {
    provider: "sportsevents365",
    exact,
    score: best.score,
    url: appendAffiliate(rawUrl),
    title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
    priceText: eventPrice(best.ev),
    reason: exact ? "exact_event" : "partial_match",
  };
      }
