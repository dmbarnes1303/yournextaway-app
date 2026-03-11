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
  success?: boolean | string | number;
  error?: string;
  message?: string;
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

  return containsTeamsLoose(eventTitle(ev), input.homeName, input.awayName);
}

function scoreEvent(ev: FtnEvent, input: TicketResolveInput): number {
  let score = 0;

  const title = eventTitle(ev);
  const candidateUrl = eventUrl(ev);
  const evHome = eventHome(ev);
  const evAway = eventAway(ev);

  if (evHome && evAway) {
    if (norm(evHome) === norm(input.homeName) && norm(evAway) === norm(input.awayName)) {
      score += 80;
    } else if (norm(evHome) === norm(input.awayName) && norm(evAway) === norm(input.homeName)) {
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
    else if (diff === 2) score += 8;
    else if (diff === 3) score += 3;
    else if (diff > 3) score -= 1000;
  }

  if (candidateUrl) score += 5;
  if (eventPrice(ev)) score += 2;

  return score;
}

function isStrongEnough(score: number): boolean {
  return score >= 50;
}

function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function buildDateWindow(kickoffIso: string): { fromDate?: string; toDate?: string } {
  const kickoff = safeDate(kickoffIso);
  if (!kickoff) return {};

  const from = addDays(kickoff, -2);
  const to = addDays(kickoff, 2);

  return {
    fromDate: formatYmd(from),
    toDate: formatYmd(to),
  };
}

export async function resolveFtnCandidate(input: TicketResolveInput): Promise<TicketCandidate | null> {
  if (!hasFtnConfig()) {
    console.log("[FTN] skipped: missing config");
    return null;
  }

  const homeName = clean(input.homeName);
  const awayName = clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);

  if (!homeName || !awayName || !kickoffIso) {
    console.log("[FTN] skipped: missing required input", {
      homeName,
      awayName,
      kickoffIso,
    });
    return null;
  }

  const ts = String(Date.now());
  const sig = sha256(`${env.ftnUsername}-list_events-${ts}-${env.ftnAffiliateSecret}`);

  const qs = new URLSearchParams({
    action: "list_events",
    u: env.ftnUsername,
    s: sig,
    ts,
    home_team_name: homeName,
    away_team_name: awayName,
  });

  const dateWindow = buildDateWindow(kickoffIso);
  if (dateWindow.fromDate) qs.set("from_date", dateWindow.fromDate);
  if (dateWindow.toDate) qs.set("to_date", dateWindow.toDate);

  const url = `${env.ftnBaseUrl}?${qs.toString()}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (error) {
    console.log("[FTN] network error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  let rawText = "";
  try {
    rawText = await res.text();
  } catch {
    rawText = "";
  }

  if (!res.ok) {
    console.log("[FTN] non-200 response", {
      status: res.status,
      body: rawText.slice(0, 500),
    });
    return null;
  }

  let json: FtnListResponse | null = null;
  try {
    json = rawText ? (JSON.parse(rawText) as FtnListResponse) : null;
  } catch {
    console.log("[FTN] invalid JSON response", {
      body: rawText.slice(0, 500),
    });
    return null;
  }

  const events = Array.isArray(json?.events)
    ? json.events
    : Array.isArray(json?.data)
    ? json.data
    : [];

  if (!events.length) {
    console.log("[FTN] no events returned", {
      homeName,
      awayName,
      kickoffIso,
      fromDate: dateWindow.fromDate ?? null,
      toDate: dateWindow.toDate ?? null,
      success: json?.success ?? null,
      error: json?.error ?? null,
      message: json?.message ?? null,
    });
    return null;
  }

  const scored = events
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
    }))
    .filter((x) => isStrongEnough(x.score))
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    console.log("[FTN] events returned but no strong match", {
      count: events.length,
      sample: events.slice(0, 5).map((ev) => ({
        title: eventTitle(ev),
        home: eventHome(ev),
        away: eventAway(ev),
        date: eventDate(ev),
        url: eventUrl(ev),
        price: eventPrice(ev),
      })),
    });
    return null;
  }

  const best = scored[0];

  let rawUrl = eventUrl(best.ev);

  if (!rawUrl) {
    const id = best.ev.event_id ?? best.ev.id;
    if (id) {
      rawUrl = `https://footballticketsnet.com/event/${id}`;
    }
  }

  if (!rawUrl) {
    console.log("[FTN] best match missing URL", {
      title: eventTitle(best.ev),
      score: best.score,
    });
    return null;
  }

  const exact = exactTeamsMatch(best.ev, input) && best.score >= 90;

  console.log("[FTN] matched event", {
    title: eventTitle(best.ev),
    home: eventHome(best.ev),
    away: eventAway(best.ev),
    date: eventDate(best.ev),
    score: best.score,
    exact,
    price: eventPrice(best.ev),
    url: rawUrl,
  });

  return {
    provider: "footballticketsnet",
    exact,
    score: best.score,
    url: appendAffiliate(rawUrl),
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: eventPrice(best.ev),
    reason: exact ? "exact_event" : "search_fallback",
  };
}
