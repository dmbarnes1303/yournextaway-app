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

const FTN_FETCH_TIMEOUT_MS = 6000;
const FTN_CANONICAL_HOST = "www.footballticketnet.com";

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

  return teamsMatchLoose(eventTitle(ev), inputHomeVariants, inputAwayVariants);
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
  const evHome = eventHome(ev);
  const evAway = eventAway(ev);

  const inputHomeVariants = expandTeamAliases(input.homeName);
  const inputAwayVariants = expandTeamAliases(input.awayName);

  if (evHome && evAway) {
    const homeExact = inputHomeVariants.some((variant) => norm(evHome) === norm(variant));
    const awayExact = inputAwayVariants.some((variant) => norm(evAway) === norm(variant));

    const homeReversed = inputAwayVariants.some((variant) => norm(evHome) === norm(variant));
    const awayReversed = inputHomeVariants.some((variant) => norm(evAway) === norm(variant));

    if (homeExact && awayExact) score += 80;
    else if (homeReversed && awayReversed) score += 20;
  } else if (title && teamsMatchLoose(title, inputHomeVariants, inputAwayVariants)) {
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
    rawUrl: clean(ev.event_url) || clean(ev.url) || null,
    price: eventPrice(ev) || null,
  };
}

function buildStableSearchUrl(input: TicketResolveInput): string {
  const query = `${clean(input.homeName)} vs ${clean(input.awayName)}`.trim();
  const encoded = encodeURIComponent(query);
  return `https://${FTN_CANONICAL_HOST}/search?text=${encoded}`;
}

function normalizeFtnUrl(raw: unknown): string {
  const value = clean(raw);
  if (!value) return "";

  try {
    const parsed = value.startsWith("/")
      ? new URL(value, `https://${FTN_CANONICAL_HOST}`)
      : new URL(value);

    const host = parsed.hostname.toLowerCase();
    const allowedHosts = [
      "footballticketnet.com",
      "www.footballticketnet.com",
      "footballticketsnet.com",
      "www.footballticketsnet.com",
    ];

    const allowed = allowedHosts.some(
      (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`)
    );

    if (!allowed) {
      return "";
    }

    parsed.protocol = "https:";
    parsed.hostname = FTN_CANONICAL_HOST;

    return parsed.toString();
  } catch {
    return "";
  }
}

function buildSafeEventUrl(ev: FtnEvent): string {
  const direct = normalizeFtnUrl(clean(ev.event_url) || clean(ev.url));
  return direct;
}

function appendAffiliate(url: string): string {
  const normalized = normalizeFtnUrl(url);
  if (!normalized) return "";

  try {
    const parsed = new URL(normalized);
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
  const exact = exactTeamsMatch(best.ev, input) && best.score >= 80;
  const normalizedPrice = eventPrice(best.ev);

  const rawEventUrl = buildSafeEventUrl(best.ev);
  const finalBaseUrl = rawEventUrl || buildStableSearchUrl(input);
  const affiliateUrl = appendAffiliate(finalBaseUrl);

  if (!affiliateUrl) {
    console.log("[FTN] failed to build outbound URL", {
      best: {
        ...summarizeEvent(best.ev),
        score: best.score,
        penalty: best.penalty,
      },
    });
    return null;
  }

  console.log("[FTN] matched event", {
    best: {
      ...summarizeEvent(best.ev),
      score: best.score,
      penalty: best.penalty,
      exact,
      rawEventUrl: rawEventUrl || null,
      finalBaseUrl,
      affiliateUrl,
      usedFallbackSearch: !rawEventUrl,
    },
  });

  return {
    provider: "footballticketsnet",
    exact,
    score: best.score,
    url: affiliateUrl,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: normalizedPrice,
    reason: rawEventUrl
      ? exact
        ? "exact_event"
        : "partial_match"
      : "search_fallback",
  };
}
