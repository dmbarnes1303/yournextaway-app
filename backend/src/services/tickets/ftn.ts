import crypto from "node:crypto";
import { env, hasFtnConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

type FtnEvent = {
  event_id?: string | number;
  id?: string | number;
  event_name?: string;
  name?: string;
  event_date?: string;
  date?: string;
  url?: string;
  event_url?: string;
  min_price?: string | number;
  lowest_price?: string | number;
  home_team_name?: string;
  away_team_name?: string;
};

type FtnListResponse = {
  events?: FtnEvent[];
  data?: FtnEvent[];
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

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function appendAffiliate(url: string): string {
  const base = clean(url);
  if (!base) return "";
  if (/[?&](aid|aff)=/i.test(base)) return base;
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}aid=${encodeURIComponent(env.ftnAffiliateId)}`;
}

function eventTitle(ev: FtnEvent): string {
  return clean(ev.event_name) || clean(ev.name);
}

function eventUrl(ev: FtnEvent): string {
  return clean(ev.event_url) || clean(ev.url);
}

function eventDate(ev: FtnEvent): string {
  return clean(ev.event_date) || clean(ev.date);
}

function eventPrice(ev: FtnEvent): string | null {
  const raw = clean(ev.lowest_price) || clean(ev.min_price);
  return raw || null;
}

function eventHome(ev: FtnEvent): string {
  return clean(ev.home_team_name);
}

function eventAway(ev: FtnEvent): string {
  return clean(ev.away_team_name);
}

function containsTeamsLoose(name: string, home: string, away: string): boolean {
  const n = norm(name);
  return n.includes(norm(home)) && n.includes(norm(away));
}

function exactTeamsMatch(ev: FtnEvent, input: TicketResolveInput): boolean {
  const evHome = norm(eventHome(ev));
  const evAway = norm(eventAway(ev));
  const inputHome = norm(input.homeName);
  const inputAway = norm(input.awayName);

  if (evHome && evAway) {
    return evHome === inputHome && evAway === inputAway;
  }

  const title = eventTitle(ev);
  return containsTeamsLoose(title, input.homeName, input.awayName);
}

function scoreEvent(ev: FtnEvent, input: TicketResolveInput): number {
  let score = 0;

  const title = eventTitle(ev);
  const rawUrl = eventUrl(ev);

  const evHome = eventHome(ev);
  const evAway = eventAway(ev);

  if (evHome && evAway) {
    if (norm(evHome) === norm(input.homeName) && norm(evAway) === norm(input.awayName)) {
      score += 80;
    } else if (
      (norm(evHome) === norm(input.awayName) && norm(evAway) === norm(input.homeName))
    ) {
      score += 20;
    }
  } else if (title && containsTeamsLoose(title, input.homeName, input.awayName)) {
    score += 55;
  }

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));
  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);
    if (diff === 0) score += 25;
    else if (diff === 1) score += 15;
    else if (diff === 2) score += 5;
    else if (diff > 2) score -= 1000;
  }

  if (rawUrl) score += 5;
  if (eventPrice(ev)) score += 2;

  return score;
}

function isStrongEnough(score: number): boolean {
  return score >= 50;
}

export async function resolveFtnCandidate(input: TicketResolveInput): Promise<TicketCandidate | null> {
  if (!hasFtnConfig()) return null;

  const ts = String(Date.now());
  const sig = sha256(`${env.ftnUsername}-list_events-${ts}-${env.ftnAffiliateSecret}`);

  const qs = new URLSearchParams({
    action: "list_events",
    u: env.ftnUsername,
    s: sig,
    ts,
    home_team_name: clean(input.homeName),
    away_team_name: clean(input.awayName),
  });

  const kickoff = clean(input.kickoffIso).slice(0, 10);
  if (kickoff) {
    qs.set("from_date", kickoff);
    qs.set("to_date", kickoff);
  }

  const url = `${env.ftnBaseUrl}?${qs.toString()}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }

  if (!res.ok) return null;

  let json: FtnListResponse | null = null;
  try {
    json = (await res.json()) as FtnListResponse;
  } catch {
    return null;
  }

  const events = Array.isArray(json?.events)
    ? json.events
    : Array.isArray(json?.data)
    ? json.data
    : [];

  if (!events.length) return null;

  const scored = events
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
    }))
    .filter((x) => isStrongEnough(x.score))
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const best = scored[0];
  const rawUrl = eventUrl(best.ev);
  if (!rawUrl) return null;

  const exact = exactTeamsMatch(best.ev, input) && best.score >= 90;

  return {
    provider: "footballticketsnet",
    exact,
    score: best.score,
    url: appendAffiliate(rawUrl),
    title: `Tickets: ${clean(input.homeName)} vs ${clean(input.awayName)}`,
    priceText: eventPrice(best.ev),
    reason: exact ? "exact_event" : "search_fallback",
  };
}
