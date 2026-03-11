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
  min_price?: string | number | Record<string, unknown>;
  lowest_price?: string | number | Record<string, unknown>;
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

const FTN_FETCH_TIMEOUT_MS = 6000;

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

function normalizePriceValue(raw: unknown): string | null {
  if (raw == null) return null;

  if (typeof raw === "string" || typeof raw === "number") {
    const value = clean(raw);
    return value || null;
  }

  if (typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;

  const amount =
    obj.amount ??
    obj.value ??
    obj.price ??
    obj.min_price ??
    obj.lowest_price;

  const currency =
    obj.currency ??
    obj.currency_code ??
    obj.curr ??
    obj.symbol ??
    "";

  const amountText = clean(amount);
  const currencyText = clean(currency);

  if (amountText && currencyText) return `${amountText} ${currencyText}`.trim();
  if (amountText) return amountText;

  return null;
}

function eventPrice(ev: FtnEvent): string | null {
  return normalizePriceValue(ev.lowest_price) || normalizePriceValue(ev.min_price);
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

function textContainsVariant(text: string, variant: string): boolean {
  const value = ` ${norm(text)} `;
  const needle = ` ${norm(variant)} `;
  return value.includes(needle);
}

function isBadStandaloneToken(text: string, token: string): boolean {
  const value = ` ${norm(text)} `;
  const needle = ` ${norm(token)} `;
  return value.includes(needle);
}

function variantPenalty(ev: FtnEvent, input: TicketResolveInput): number {
  const haystack = [eventTitle(ev), eventHome(ev), eventAway(ev)].join(" ").toLowerCase();
  const inputText = [input.homeName, input.awayName, input.leagueName ?? ""].join(" ").toLowerCase();

  const variants = [
    "women",
    "women's",
    "(women)",
    "ladies",
    "feminino",
    "femenino",
    "female",
    "u17",
    "u18",
    "u19",
    "u20",
    "u21",
    "u23",
    "youth",
    "juvenil",
    "b team",
    "ii",
    "reserves",
    "reserve",
    "academy",
    "legends",
  ];

  let penalty = 0;

  for (const variant of variants) {
    const eventHas = textContainsVariant(haystack, variant);
    const inputHas = textContainsVariant(inputText, variant);

    if (eventHas && !inputHas) {
      penalty += 35;
    }
  }

  const eventHasStandaloneB = isBadStandaloneToken(haystack, "b");
  const inputHasStandaloneB = isBadStandaloneToken(inputText, "b");
  if (eventHasStandaloneB && !inputHasStandaloneB) {
    penalty += 35;
  }

  return penalty;
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

  score -= variantPenalty(ev, input);

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

function summarizeEvent(ev: FtnEvent) {
  return {
    eventId: clean(ev.event_id) || clean(ev.id) || null,
    title: eventTitle(ev) || null,
    home: eventHome(ev) || null,
    away: eventAway(ev) || null,
    date: eventDate(ev) || null,
    url: eventUrl(ev) || null,
    price: eventPrice(ev) || null,
  };
}

async function fetchWithTimeout(url: string): Promise<{ ok: boolean; status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FTN_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
    });

    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "";
    }

    return {
      ok: res.ok,
      status: res.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
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
  const loggableUrl = `${env.ftnBaseUrl}?action=list_events&u=${encodeURIComponent(env.ftnUsername)}&ts=${encodeURIComponent(ts)}&home_team_name=${encodeURIComponent(homeName)}&away_team_name=${encodeURIComponent(awayName)}${dateWindow.fromDate ? `&from_date=${encodeURIComponent(dateWindow.fromDate)}` : ""}${dateWindow.toDate ? `&to_date=${encodeURIComponent(dateWindow.toDate)}` : ""}`;

  console.log("[FTN] request start", {
    homeName,
    awayName,
    kickoffIso,
    leagueName: clean(input.leagueName) || null,
    leagueId: clean(input.leagueId) || null,
    fromDate: dateWindow.fromDate ?? null,
    toDate: dateWindow.toDate ?? null,
    requestUrl: loggableUrl,
  });

  let response: { ok: boolean; status: number; body: string };
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    console.log("[FTN] network/timeout error", {
      message: error instanceof Error ? error.message : String(error),
      requestUrl: loggableUrl,
    });
    return null;
  }

  if (!response.ok) {
    console.log("[FTN] non-200 response", {
      status: response.status,
      body: response.body.slice(0, 500),
      requestUrl: loggableUrl,
    });
    return null;
  }

  let json: FtnListResponse | null = null;
  try {
    json = response.body ? (JSON.parse(response.body) as FtnListResponse) : null;
  } catch {
    console.log("[FTN] invalid JSON response", {
      body: response.body.slice(0, 500),
      requestUrl: loggableUrl,
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
      requestUrl: loggableUrl,
    });
    return null;
  }

  console.log("[FTN] raw events returned", {
    count: events.length,
    sample: events.slice(0, 5).map(summarizeEvent),
  });

  const scored = events
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
      penalty: variantPenalty(ev, input),
    }))
    .filter((x) => isStrongEnough(x.score))
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    console.log("[FTN] events returned but no strong match", {
      count: events.length,
      sample: events.slice(0, 5).map((ev) => ({
        ...summarizeEvent(ev),
        score: scoreEvent(ev, input),
        penalty: variantPenalty(ev, input),
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
      best: {
        ...summarizeEvent(best.ev),
        score: best.score,
        penalty: best.penalty,
      },
    });
    return null;
  }

  const exact = exactTeamsMatch(best.ev, input) && best.score >= 80;
  const normalizedPrice = eventPrice(best.ev);

  console.log("[FTN] matched event", {
    best: {
      ...summarizeEvent(best.ev),
      score: best.score,
      penalty: best.penalty,
      exact,
      resolvedUrl: rawUrl,
      affiliateUrl: appendAffiliate(rawUrl),
    },
  });

  return {
    provider: "footballticketsnet",
    exact,
    score: best.score,
    url: appendAffiliate(rawUrl),
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: normalizedPrice,
    reason: exact ? "exact_event" : "search_fallback",
  };
}
