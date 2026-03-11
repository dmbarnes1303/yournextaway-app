import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

type Se365Event = {
  id?: number | string;
  name?: string;
  url?: string;
  startDate?: string;
  minPrice?: string | number;
};

type Se365Response = {
  events?: Se365Event[];
};

const SE365_FETCH_TIMEOUT_MS = 6000;

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

function appendAffiliate(url: string): string {
  const base = clean(url);
  if (!base) return "";
  if (/\ba_aid=/.test(base)) return base;
  if (!env.se365AffiliateId) return base;

  const joiner = base.includes("?") ? "&" : "?";
  const param = env.se365AffiliateId.includes("=")
    ? env.se365AffiliateId
    : `a_aid=${encodeURIComponent(env.se365AffiliateId)}`;

  return `${base}${joiner}${param}`;
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

  const eventName = clean(ev.name);
  if (eventName && containsTeamsLoose(eventName, input.homeName, input.awayName)) {
    score += 60;
  }

  if (eventName && isBadVariant(eventName)) {
    score -= 1000;
  }

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(ev.startDate);
  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);

    if (diff === 0) score += 25;
    else if (diff === 1) score += 15;
    else if (diff === 2) score += 5;
    else if (diff > 2) score -= 1000;
  }

  if (clean(ev.url)) score += 5;
  if (clean(ev.minPrice)) score += 2;

  return score;
}

function isStrongEnough(score: number): boolean {
  return score >= 50;
}

function isExactEvent(ev: Se365Event, input: TicketResolveInput, score: number): boolean {
  const nameMatch = containsTeamsLoose(clean(ev.name), input.homeName, input.awayName);
  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(ev.startDate);

  if (!nameMatch || !kickoff || !evDt) return false;
  if (isBadVariant(clean(ev.name))) return false;

  const diff = absDays(kickoff, evDt);
  return diff === 0 && score >= 80;
}

function summarizeEvent(ev: Se365Event) {
  return {
    id: clean(ev.id) || null,
    name: clean(ev.name) || null,
    startDate: clean(ev.startDate) || null,
    url: clean(ev.url) || null,
    minPrice: clean(ev.minPrice) || null,
  };
}

async function fetchSearch(url: string): Promise<Se365Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SE365_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        "content-type": "application/json",
        "x-api-key": env.se365ApiKey,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch {
        body = "";
      }

      console.log("[SE365] non-200 response", {
        url,
        status: res.status,
        body: body.slice(0, 500),
      });
      return null;
    }

    try {
      const json = (await res.json()) as Se365Response;
      return json;
    } catch {
      console.log("[SE365] invalid JSON response", { url });
      return null;
    }
  } catch (error) {
    console.log("[SE365] fetch error", {
      url,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildQueries(input: TicketResolveInput): string[] {
  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const league = clean(input.leagueName);

  const queries = [
    `${home} ${away}`,
    `${home} vs ${away}`,
  ];

  if (league) {
    queries.push(`${home} ${away} ${league}`);
    queries.push(`${home} vs ${away} ${league}`);
  }

  return Array.from(new Set(queries.filter(Boolean)));
}

function buildTrackedSearchFallback(input: TicketResolveInput): string | null {
  const base = env.se365BaseUrl.replace(/\/+$/, "");
  const aidRaw = clean(env.se365AffiliateId);

  const q = clean(input.leagueName)
    ? `${clean(input.homeName)} ${clean(input.awayName)} ${clean(input.leagueName)}`
    : `${clean(input.homeName)} ${clean(input.awayName)}`;

  if (!q) return null;

  const searchBase = `${base}/events/search?q=${encodeURIComponent(q)}`;

  if (!aidRaw) return searchBase;

  const joiner = searchBase.includes("?") ? "&" : "?";
  const aidParam = aidRaw.includes("=") ? aidRaw : `a_aid=${encodeURIComponent(aidRaw)}`;
  return `${searchBase}${joiner}${aidParam}`;
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  const base = env.se365BaseUrl.replace(/\/+$/, "");
  const queries = buildQueries(input);

  console.log("[SE365] resolve start", {
    base,
    queries,
    homeName: clean(input.homeName),
    awayName: clean(input.awayName),
    kickoffIso: clean(input.kickoffIso),
    leagueName: clean(input.leagueName) || null,
    leagueId: clean(input.leagueId) || null,
  });

  const allEvents: Se365Event[] = [];

  for (const q of queries) {
    const url = `${base}/events/search?q=${encodeURIComponent(q)}`;
    const json = await fetchSearch(url);
    const events = Array.isArray(json?.events) ? json.events : [];

    console.log("[SE365] query result", {
      query: q,
      url,
      eventCount: events.length,
      sample: events.slice(0, 3).map(summarizeEvent),
    });

    if (events.length) {
      allEvents.push(...events);
    }
  }

  if (!allEvents.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);

    console.log("[SE365] no events from API, using tracked search fallback", {
      fallbackUrl,
    });

    if (!fallbackUrl) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: 15,
      url: fallbackUrl,
      title: `Tickets: ${clean(input.homeName)} vs ${clean(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const deduped = Array.from(
    new Map(
      allEvents.map((ev) => [
        `${clean(ev.id)}|${clean(ev.name)}|${clean(ev.startDate)}`,
        ev,
      ])
    ).values()
  );

  console.log("[SE365] deduped events", {
    rawCount: allEvents.length,
    dedupedCount: deduped.length,
  });

  const scored = deduped
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
    }))
    .filter((x) => isStrongEnough(x.score))
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);

    console.log("[SE365] events found but no strong match", {
      sample: deduped.slice(0, 5).map((ev) => ({
        ...summarizeEvent(ev),
        score: scoreEvent(ev, input),
        badVariant: isBadVariant(clean(ev.name)),
      })),
      fallbackUrl,
    });

    if (!fallbackUrl) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: 15,
      url: fallbackUrl,
      title: `Tickets: ${clean(input.homeName)} vs ${clean(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const best = scored[0];
  const rawUrl = clean(best.ev.url);
  if (!rawUrl) {
    const fallbackUrl = buildTrackedSearchFallback(input);

    console.log("[SE365] best candidate missing URL", {
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
      score: 15,
      url: fallbackUrl,
      title: `Tickets: ${clean(input.homeName)} vs ${clean(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const exact = isExactEvent(best.ev, input, best.score);

  console.log("[SE365] matched event", {
    best: {
      ...summarizeEvent(best.ev),
      score: best.score,
      exact,
    },
  });

  return {
    provider: "sportsevents365",
    exact,
    score: best.score,
    url: appendAffiliate(rawUrl),
    title: `Tickets: ${clean(input.homeName)} vs ${clean(input.awayName)}`,
    priceText: clean(best.ev.minPrice) || null,
    reason: exact ? "exact_event" : "search_fallback",
  };
}
