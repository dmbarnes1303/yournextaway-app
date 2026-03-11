import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

type Se365Event = {
  id?: number;
  name?: string;
  url?: string;
  startDate?: string;
  minPrice?: string | number;
};

type Se365Response = {
  events?: Se365Event[];
};

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

function isBadVariant(name: string): boolean {
  const n = norm(name);
  return (
    n.includes("women") ||
    n.includes("femeni") ||
    n.includes("feminine") ||
    n.includes("female") ||
    n.includes("u19") ||
    n.includes("u18") ||
    n.includes("u17") ||
    n.includes("u21") ||
    n.includes("u23") ||
    n.includes("youth") ||
    n.includes("b team") ||
    n.includes("ii") ||
    n.includes("reserves")
  );
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
  return diff === 0 && score >= 90;
}

async function fetchSearch(url: string): Promise<Se365Response | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "content-type": "application/json",
        "x-api-key": env.se365ApiKey,
      },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  try {
    return (await res.json()) as Se365Response;
  } catch {
    return null;
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
  }

  return Array.from(new Set(queries.filter(Boolean)));
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) return null;

  const base = env.se365BaseUrl.replace(/\/+$/, "");
  const queries = buildQueries(input);

  const allEvents: Se365Event[] = [];

  for (const q of queries) {
    const url = `${base}/events/search?q=${encodeURIComponent(q)}`;
    const json = await fetchSearch(url);
    const events = Array.isArray(json?.events) ? json.events : [];
    if (events.length) {
      allEvents.push(...events);
    }
  }

  if (!allEvents.length) return null;

  const deduped = Array.from(
    new Map(
      allEvents.map((ev) => [
        `${clean(ev.id)}|${clean(ev.name)}|${clean(ev.startDate)}`,
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

  if (!scored.length) return null;

  const best = scored[0];
  const rawUrl = clean(best.ev.url);
  if (!rawUrl) return null;

  const exact = isExactEvent(best.ev, input, best.score);

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
