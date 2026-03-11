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

function containsTeams(name: string, home: string, away: string): boolean {
  const n = norm(name);
  return n.includes(norm(home)) && n.includes(norm(away));
}

function scoreEvent(ev: Se365Event, input: TicketResolveInput): number {
  let score = 0;
  if (containsTeams(clean(ev.name), input.homeName, input.awayName)) score += 60;

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
  return score;
}

export async function resolveSe365Candidate(input: TicketResolveInput): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) return null;

  const q = encodeURIComponent(`${clean(input.homeName)} ${clean(input.awayName)}`);
  const url = `${env.se365BaseUrl.replace(/\/+$/, "")}/events/search?q=${q}`;

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

  let json: Se365Response | null = null;
  try {
    json = (await res.json()) as Se365Response;
  } catch {
    return null;
  }

  const events = Array.isArray(json?.events) ? json!.events! : [];
  if (!events.length) return null;

  const scored = events
    .map((ev) => ({ ev, score: scoreEvent(ev, input) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const best = scored[0];
  const rawUrl = clean(best.ev.url);
  if (!rawUrl) return null;

  return {
    provider: "sportsevents365",
    exact: best.score >= 70,
    score: best.score,
    url: appendAffiliate(rawUrl),
    title: `Tickets: ${clean(input.homeName)} vs ${clean(input.awayName)}`,
    priceText: clean(best.ev.minPrice) || null,
    reason: "exact_event",
  };
}
