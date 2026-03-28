import crypto from "node:crypto";
import { env, hasFtnConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

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

type ScoredEvent = {
  ev: FtnEvent;
  score: number;
  exactTeams: boolean;
  sameDay: boolean;
  hasDirectUrl: boolean;
  penalty: number;
};

const FTN_FETCH_TIMEOUT_MS = 6000;
const FTN_CANONICAL_HOST = "www.footballticketnet.com";

const FTN_MIN_STRONG_SCORE = 60;
const FTN_MIN_EXACT_SCORE = 92;
const FTN_SEARCH_FALLBACK_PENALTY = 45;
const FTN_WEAK_DIRECT_URL_PENALTY = 10;

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

function eventId(ev: FtnEvent): string {
  return clean(ev.event_id) || clean(ev.id);
}

function eventTitle(ev: FtnEvent): string {
  return clean(ev.event_name) || clean(ev.name);
}

function eventDate(ev: FtnEvent): string {
  return clean(ev.event_date) || clean(ev.date);
}

function eventHome(ev: FtnEvent): string {
  return clean(ev.home_team_name);
}

function eventAway(ev: FtnEvent): string {
  return clean(ev.away_team_name);
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

function teamsMatchLoose(
  title: string,
  inputHomeVariants: string[],
  inputAwayVariants: string[]
): boolean {
  const titleNorm = norm(title);
  const homeMatch = inputHomeVariants.some((variant) => titleNorm.includes(norm(variant)));
  const awayMatch = inputAwayVariants.some((variant) => titleNorm.includes(norm(variant)));
  return homeMatch && awayMatch;
}

function exactTeamsMatch(ev: FtnEvent, input: TicketResolveInput): boolean {
  const inputHomeVariants = expandTeamAliases(input.homeName);
  const inputAwayVariants = expandTeamAliases(input.awayName);

  const evHome = norm(eventHome(ev));
  const evAway = norm(eventAway(ev));

  if (evHome && evAway) {
    const homeMatch = inputHomeVariants.some((variant) => evHome === norm(variant));
    const awayMatch = inputAwayVariants.some((variant) => evAway === norm(variant));
    return homeMatch && awayMatch;
  }

  return false;
}

function reversedTeamsMatch(ev: FtnEvent, input: TicketResolveInput): boolean {
  const inputHomeVariants = expandTeamAliases(input.homeName);
  const inputAwayVariants = expandTeamAliases(input.awayName);

  const evHome = norm(eventHome(ev));
  const evAway = norm(eventAway(ev));

  if (!evHome || !evAway) return false;

  const homeReversed = inputAwayVariants.some((variant) => evHome === norm(variant));
  const awayReversed = inputHomeVariants.some((variant) => evAway === norm(variant));

  return homeReversed && awayReversed;
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
    eventId: eventId(ev) || null,
    title: eventTitle(ev) || null,
    home: eventHome(ev) || null,
    away: eventAway(ev) || null,
    date: eventDate(ev) || null,
    rawUrl: clean(ev.event_url) || clean(ev.url) || null,
    price: eventPrice(ev) || null,
  };
}

function normalizeFtnUrl(raw: unknown): string {
  const value = clean(raw);
  if (!value) return "";

  try {
    if (value.startsWith("/")) {
      const parsed = new URL(value, `https://${FTN_CANONICAL_HOST}`);
      parsed.protocol = "https:";
      parsed.hostname = FTN_CANONICAL_HOST;
      return parsed.toString();
    }

    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    const allowed = [
      "footballticketnet.com",
      "www.footballticketnet.com",
      "footballticketsnet.com",
      "www.footballticketsnet.com",
    ];

    if (!allowed.some((root) => host === root || host.endsWith(`.${root}`))) {
      return "";
    }

    parsed.protocol = "https:";
    parsed.hostname = FTN_CANONICAL_HOST;
    return parsed.toString();
  } catch {
    return "";
  }
}

function hasUsableEventUrl(ev: FtnEvent): boolean {
  const normalized = normalizeFtnUrl(clean(ev.event_url) || clean(ev.url));
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized);
    const path = parsed.pathname.toLowerCase();
    const query = parsed.search.toLowerCase();

    if (!path || path === "/") return false;
    if (path.startsWith("/search")) return false;
    if (path.includes("404")) return false;
    if (query.includes("text=") || query.includes("q=")) return false;

    return true;
  } catch {
    return false;
  }
}

function buildStableSearchUrl(input: TicketResolveInput): string {
  const query = `${clean(input.homeName)} vs ${clean(input.awayName)}`.trim();
  const encoded = encodeURIComponent(query);
  return `https://${FTN_CANONICAL_HOST}/search?text=${encoded}`;
}

function buildOutboundUrl(
  ev: FtnEvent,
  input: TicketResolveInput
): {
  url: string;
  isSearchFallback: boolean;
} {
  const direct = normalizeFtnUrl(clean(ev.event_url) || clean(ev.url));

  if (direct && hasUsableEventUrl(ev)) {
    return {
      url: direct,
      isSearchFallback: false,
    };
  }

  return {
    url: buildStableSearchUrl(input),
    isSearchFallback: true,
  };
}

function appendAffiliate(url: string): string {
  const base = clean(url);
  if (!base) return "";

  try {
    const parsed = new URL(base);
    const aid = clean(env.ftnAffiliateId);

    if (aid && !parsed.searchParams.get("aid")) {
      parsed.searchParams.set("aid", aid);
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

async function fetchWithTimeout(
  url: string
): Promise<{ ok: boolean; status: number; body: string }> {
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

function scoreEvent(ev: FtnEvent, input: TicketResolveInput): ScoredEvent {
  let score = 0;

  const title = eventTitle(ev);
  const evHome = eventHome(ev);
  const evAway = eventAway(ev);

  const inputHomeVariants = expandTeamAliases(input.homeName);
  const inputAwayVariants = expandTeamAliases(input.awayName);

  const exactTeams = exactTeamsMatch(ev, input);
  const reversedTeams = reversedTeamsMatch(ev, input);
  const looseTeams = title
    ? teamsMatchLoose(title, inputHomeVariants, inputAwayVariants)
    : false;

  if (exactTeams) score += 82;
  else if (reversedTeams) score += 8;
  else if (evHome && evAway) score -= 50;
  else if (looseTeams) score += 42;

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));
  let sameDay = false;

  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);

    if (diff === 0) {
      score += 24;
      sameDay = true;
    } else if (diff === 1) {
      score += 10;
    } else if (diff === 2) {
      score += 3;
    } else {
      score -= 1000;
    }
  } else {
    score -= 20;
  }

  if (eventPrice(ev)) score += 3;

  const penalty = variantPenalty(ev, input);
  score -= penalty;

  const hasDirectUrl = hasUsableEventUrl(ev);
  if (hasDirectUrl) score += 8;

  if (!exactTeams && !looseTeams) score -= 1000;

  return {
    ev,
    score,
    exactTeams,
    sameDay,
    hasDirectUrl,
    penalty,
  };
}

function dedupeEvents(events: FtnEvent[]): FtnEvent[] {
  const map = new Map<string, FtnEvent>();

  for (const ev of events) {
    const key = [
      eventId(ev),
      eventTitle(ev),
      eventDate(ev),
      eventHome(ev),
      eventAway(ev),
    ]
      .join("|")
      .toLowerCase();

    if (!key.replace(/\|/g, "")) continue;
    if (!map.has(key)) {
      map.set(key, ev);
    }
  }

  return Array.from(map.values());
}

function pickBestEvent(events: FtnEvent[], input: TicketResolveInput): ScoredEvent | null {
  const scored = dedupeEvents(events)
    .map((ev) => scoreEvent(ev, input))
    .filter((x) => x.score >= FTN_MIN_STRONG_SCORE)
    .sort((a, b) => {
      if (a.exactTeams !== b.exactTeams) return a.exactTeams ? -1 : 1;
      if (a.sameDay !== b.sameDay) return a.sameDay ? -1 : 1;
      if (a.hasDirectUrl !== b.hasDirectUrl) return a.hasDirectUrl ? -1 : 1;
      return b.score - a.score;
    });

  if (!scored.length) return null;
  return scored[0];
}

export async function resolveFtnCandidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasFtnConfig()) {
    console.log("[FTN] skipped: missing config");
    return null;
  }

  const homeName = getPreferredTeamName(input.homeName);
  const awayName = getPreferredTeamName(input.awayName);
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

  console.log("[FTN] request start", {
    homeName,
    awayName,
    kickoffIso,
    fromDate: dateWindow.fromDate ?? null,
    toDate: dateWindow.toDate ?? null,
  });

  let response: { ok: boolean; status: number; body: string };
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    console.log("[FTN] network/timeout error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  if (!response.ok) {
    console.log("[FTN] non-200 response", {
      status: response.status,
      body: response.body.slice(0, 500),
    });
    return null;
  }

  let json: FtnListResponse | null = null;
  try {
    json = response.body ? (JSON.parse(response.body) as FtnListResponse) : null;
  } catch {
    console.log("[FTN] invalid JSON response", {
      body: response.body.slice(0, 500),
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

  console.log("[FTN] raw events returned", {
    count: events.length,
    sample: events.slice(0, 5).map(summarizeEvent),
  });

  const best = pickBestEvent(events, input);

  if (!best) {
    console.log("[FTN] events returned but no strong match", {
      count: events.length,
      sample: events.slice(0, 5).map((ev) => {
        const scored = scoreEvent(ev, input);
        return {
          ...summarizeEvent(ev),
          score: scored.score,
          exactTeams: scored.exactTeams,
          sameDay: scored.sameDay,
          hasDirectUrl: scored.hasDirectUrl,
          penalty: scored.penalty,
        };
      }),
    });
    return null;
  }

  const normalizedPrice = eventPrice(best.ev);
  const outbound = buildOutboundUrl(best.ev, input);
  const affiliateUrl = appendAffiliate(outbound.url);

  if (!affiliateUrl) {
    console.log("[FTN] failed to build outbound URL", {
      best: {
        ...summarizeEvent(best.ev),
        score: best.score,
        exactTeams: best.exactTeams,
        sameDay: best.sameDay,
        penalty: best.penalty,
      },
    });
    return null;
  }

  let finalScore = best.score;
  if (outbound.isSearchFallback) {
    finalScore = Math.max(0, finalScore - FTN_SEARCH_FALLBACK_PENALTY);
  } else if (!best.hasDirectUrl) {
    finalScore = Math.max(0, finalScore - FTN_WEAK_DIRECT_URL_PENALTY);
  }

  const exact =
    best.exactTeams &&
    best.sameDay &&
    !outbound.isSearchFallback &&
    finalScore >= FTN_MIN_EXACT_SCORE;

  const reason: TicketCandidate["reason"] = outbound.isSearchFallback
    ? "search_fallback"
    : exact
      ? "exact_event"
      : "partial_match";

  console.log("[FTN] matched event", {
    best: {
      ...summarizeEvent(best.ev),
      score: best.score,
      finalScore,
      exactTeams: best.exactTeams,
      sameDay: best.sameDay,
      penalty: best.penalty,
      hasDirectUrl: best.hasDirectUrl,
      exact,
      isSearchFallback: outbound.isSearchFallback,
      affiliateUrl,
    },
  });

  return {
    provider: "footballticketsnet",
    exact,
    score: finalScore,
    url: affiliateUrl,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: normalizedPrice,
    reason,
  };
      }
