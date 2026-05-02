import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

const API_BASE = String(env.se365BaseUrl ?? "").replace(/\/+$/, "");
const PUBLIC_BASE = "https://www.sportsevents365.com";
const FOOTBALL_EVENT_TYPE_ID = "1000";

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function normalize(v: unknown) {
  return clean(v)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(fc|cf|club|sc|cp)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aliasesFor(name: string): string[] {
  const preferred = getPreferredTeamName(name);

  return Array.from(
    new Set([
      name,
      preferred,
      ...expandTeamAliases(name),
      ...expandTeamAliases(preferred),
    ])
  )
    .map(normalize)
    .filter(Boolean);
}

function scoreMatch(value: string, aliases: string[]) {
  const v = normalize(value);
  if (!v) return 0;

  let best = 0;

  for (const a of aliases) {
    if (v === a) best = Math.max(best, 100);
    else if (v.includes(a) || a.includes(v)) best = Math.max(best, 85);
    else {
      const vTokens = new Set(v.split(" "));
      const aTokens = a.split(" ");
      const matched = aTokens.filter((t) => vTokens.has(t)).length;
      best = Math.max(best, Math.round((matched / aTokens.length) * 70));
    }
  }

  return best;
}

function headers() {
  const u = clean(env.se365HttpUsername);
  const p = clean(env.se365ApiPassword);

  const h: Record<string, string> = {
    Accept: "application/json",
  };

  if (u && p) {
    h.Authorization = `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
  }

  return h;
}

function url(path: string) {
  const u = new URL(`${API_BASE}${path}`);
  if (env.se365ApiKey) u.searchParams.set("apiKey", env.se365ApiKey);
  return u;
}

async function fetchJson(u: URL) {
  try {
    const res = await fetch(u.toString(), { headers: headers() });
    const text = await res.text();
    const json = (() => {
      try { return JSON.parse(text); } catch { return null; }
    })();

    return { ok: res.ok, json };
  } catch {
    return { ok: false, json: null };
  }
}

function extractArray(json: any) {
  return json?.data || json?.results || json?.items || [];
}

function eventName(ev: any) {
  return clean(ev?.name || ev?.eventName);
}

function eventHome(ev: any) {
  return clean(ev?.homeTeam?.name || ev?.home);
}

function eventAway(ev: any) {
  return clean(ev?.awayTeam?.name || ev?.away);
}

function scoreEvent(ev: any, home: string, away: string) {
  const homeAliases = aliasesFor(home);
  const awayAliases = aliasesFor(away);

  const fields = [
    eventName(ev),
    eventHome(ev),
    eventAway(ev),
  ];

  const homeScore = Math.max(...fields.map(f => scoreMatch(f, homeAliases)));
  const awayScore = Math.max(...fields.map(f => scoreMatch(f, awayAliases)));

  if (homeScore < 45 || awayScore < 45) return 0;

  return homeScore + awayScore;
}

async function fetchAllEvents(kickoffIso: string) {
  const d = new Date(kickoffIso);

  const from = new Date(d);
  from.setDate(from.getDate() - 4);

  const to = new Date(d);
  to.setDate(to.getDate() + 4);

  const u = url("/events");
  u.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
  u.searchParams.set("dateFrom", from.toLocaleDateString("en-GB"));
  u.searchParams.set("dateTo", to.toLocaleDateString("en-GB"));
  u.searchParams.set("perPage", "200");

  const res = await fetchJson(u);
  return extractArray(res.json);
}

async function fetchTickets(id: string) {
  const u = url(`/tickets/${id}`);
  const res = await fetchJson(u);

  const tickets = extractArray(res.json);

  if (!tickets.length) return { hasTickets: false, price: null };

  const price = tickets
    .map((t: any) => Number(t.price))
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  return {
    hasTickets: true,
    price: price ? `£${price}` : "View live price",
  };
}

function buildUrl(id: string) {
  const u = new URL(`${PUBLIC_BASE}/event/${id}`);
  if (env.se365AffiliateId) {
    u.searchParams.set("a_aid", env.se365AffiliateId);
  }
  return u.toString();
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {

  if (!hasSe365Config()) return null;

  const home = clean(input.homeName);
  const away = clean(input.awayName);

  console.log("[SE365] fallback event search triggered");

  const events = await fetchAllEvents(input.kickoffIso);

  const ranked = events
    .map((ev: any) => ({
      ev,
      score: scoreEvent(ev, home, away),
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];

  if (!best) {
    console.log("[SE365] fallback failed — no event match");
    return null;
  }

  const ticket = await fetchTickets(best.ev.id);

  return {
    provider: "sportsevents365",
    exact: true,
    score: ticket.hasTickets ? 130 : 100,
    rawScore: ticket.hasTickets ? 130 : 100,
    url: buildUrl(best.ev.id),
    title: eventName(best.ev) || `${home} vs ${away}`,
    priceText: ticket.price,
    reason: "fallback_event_match",
    urlQuality: "event",
  };
}
