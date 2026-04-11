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
  league_name?: string;
  competition?: string;
};

type FtnListResponse = {
  events?: FtnEvent[];
  data?: FtnEvent[];
  success?: boolean | string | number;
  error?: string;
  message?: string;
};

type FtnGetEventResponse =
  | {
      success?: boolean | string | number;
      error?: string;
      message?: string;
      event?: Record<string, unknown>;
      data?: unknown;
      tickets?: unknown;
      listings?: unknown;
      items?: unknown;
      response?: unknown;
    }
  | null;

type NormalizedFtnTicket = {
  id: string | null;
  url: string | null;
  priceText: string | null;
  amount: number | null;
  quantity: number | null;
  hasBlockLikeInfo: boolean;
};

type ScoredEvent = {
  ev: FtnEvent;
  score: number;
  exactTeams: boolean;
  sameDay: boolean;
  hasDirectUrl: boolean;
  penalty: number;
  leagueScore: number;
};

const FTN_FETCH_TIMEOUT_MS = 6500;
const FTN_CANONICAL_HOST = "www.footballticketnet.com";

const FTN_MIN_STRONG_SCORE = 60;
const FTN_MIN_EXACT_SCORE = 92;
const FTN_SEARCH_FALLBACK_PENALTY = 45;
const FTN_WEAK_DIRECT_URL_PENALTY = 10;
const FTN_TICKET_FETCH_BONUS_CAP = 12;

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

function eventLeague(ev: FtnEvent): string {
  return clean(ev.league_name) || clean(ev.competition);
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
    obj.lowest_price ??
    obj.total_price ??
    obj.price_total;

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

function numberFromUnknown(value: unknown): number | null {
  const raw = clean(value);
  if (!raw) return null;

  const match = raw.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;

  const parsed = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
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

function formatFtnDate(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const y = date.getUTCFullYear();
  return `${d}-${m}-${y}`;
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
    fromDate: formatFtnDate(from),
    toDate: formatFtnDate(to),
  };
}

function summarizeEvent(ev: FtnEvent) {
  return {
    eventId: eventId(ev) || null,
    title: eventTitle(ev) || null,
    home: eventHome(ev) || null,
    away: eventAway(ev) || null,
    date: eventDate(ev) || null,
    league: eventLeague(ev) || null,
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

function buildEventIdUrl(eventIdValue: string): string {
  return `https://${FTN_CANONICAL_HOST}/search?event_id=${encodeURIComponent(eventIdValue)}`;
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

function leagueMatchScore(ev: FtnEvent, input: TicketResolveInput): number {
  const eventLeagueText = norm(eventLeague(ev));
  const inputLeagueText = norm(input.leagueName);

  if (!eventLeagueText || !inputLeagueText) return 0;
  if (eventLeagueText === inputLeagueText) return 8;
  if (eventLeagueText.includes(inputLeagueText) || inputLeagueText.includes(eventLeagueText)) {
    return 5;
  }

  return 0;
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

  const leagueScore = leagueMatchScore(ev, input);
  score += leagueScore;

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
    leagueScore,
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractArrayCandidates(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  const obj = asRecord(value);
  if (!obj) return [];

  const keys = ["tickets", "listings", "items", "data", "response"];
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }

  return [];
}

function normalizeTicketLike(raw: unknown): NormalizedFtnTicket | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const priceText =
    normalizePriceValue(obj.price) ||
    normalizePriceValue(obj.min_price) ||
    normalizePriceValue(obj.lowest_price) ||
    normalizePriceValue(obj.total_price) ||
    normalizePriceValue(obj.price_total);

  const amount =
    numberFromUnknown(obj.price) ??
    numberFromUnknown(obj.min_price) ??
    numberFromUnknown(obj.lowest_price) ??
    numberFromUnknown(obj.total_price) ??
    numberFromUnknown(obj.price_total) ??
    null;

  const quantity =
    numberFromUnknown(obj.quantity) ??
    numberFromUnknown(obj.qty) ??
    null;

  const url =
    normalizeFtnUrl(obj.ticket_url) ||
    normalizeFtnUrl(obj.event_url) ||
    normalizeFtnUrl(obj.url) ||
    normalizeFtnUrl(obj.link) ||
    null;

  const hasBlockLikeInfo = Boolean(clean(obj.block) || clean(obj.section) || clean(obj.category));

  return {
    id: clean(obj.id) || clean(obj.ticket_id) || clean(obj.listing_id) || null,
    url,
    priceText,
    amount,
    quantity,
    hasBlockLikeInfo,
  };
}

function extractNormalizedTickets(payload: FtnGetEventResponse): NormalizedFtnTicket[] {
  if (!payload) return [];

  const buckets: unknown[] = [];

  const root = asRecord(payload);
  if (root) {
    buckets.push(root.tickets, root.listings, root.items, root.data, root.response, root.event);

    const eventObj = asRecord(root.event);
    if (eventObj) {
      buckets.push(
        eventObj.tickets,
        eventObj.listings,
        eventObj.items,
        eventObj.data,
        eventObj.response
      );
    }

    const dataObj = asRecord(root.data);
    if (dataObj) {
      buckets.push(
        dataObj.tickets,
        dataObj.listings,
        dataObj.items,
        dataObj.data,
        dataObj.response
      );
    }
  }

  const normalized: NormalizedFtnTicket[] = [];

  for (const bucket of buckets) {
    const rows = extractArrayCandidates(bucket);
    for (const row of rows) {
      const ticket = normalizeTicketLike(row);
      if (ticket) normalized.push(ticket);
    }
  }

  const deduped = new Map<string, NormalizedFtnTicket>();

  for (const ticket of normalized) {
    const key = [
      ticket.id ?? "",
      ticket.url ?? "",
      ticket.priceText ?? "",
      String(ticket.quantity ?? ""),
    ].join("|");

    if (!key.replace(/\|/g, "")) continue;

    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, ticket);
      continue;
    }

    const currentScore =
      (ticket.amount != null ? 3 : 0) +
      (ticket.quantity != null ? 2 : 0) +
      (ticket.hasBlockLikeInfo ? 2 : 0) +
      (ticket.url ? 2 : 0);

    const existingScore =
      (existing.amount != null ? 3 : 0) +
      (existing.quantity != null ? 2 : 0) +
      (existing.hasBlockLikeInfo ? 2 : 0) +
      (existing.url ? 2 : 0);

    if (currentScore > existingScore) {
      deduped.set(key, ticket);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const aAmount = a.amount ?? Number.POSITIVE_INFINITY;
    const bAmount = b.amount ?? Number.POSITIVE_INFINITY;
    if (aAmount !== bAmount) return aAmount - bAmount;

    const aQty = a.quantity ?? 0;
    const bQty = b.quantity ?? 0;
    if (aQty !== bQty) return bQty - aQty;

    return (a.id ?? "").localeCompare(b.id ?? "");
  });
}

function summarizeTicket(ticket: NormalizedFtnTicket) {
  return {
    id: ticket.id,
    url: ticket.url,
    priceText: ticket.priceText,
    amount: ticket.amount,
    quantity: ticket.quantity,
    hasBlockLikeInfo: ticket.hasBlockLikeInfo,
  };
}

function ticketDataBonus(tickets: NormalizedFtnTicket[]): number {
  if (!tickets.length) return 0;

  let bonus = 0;

  if (tickets.some((ticket) => ticket.amount != null)) bonus += 5;
  if (tickets.some((ticket) => (ticket.quantity ?? 0) >= 2)) bonus += 3;
  if (tickets.some((ticket) => ticket.hasBlockLikeInfo)) bonus += 2;
  if (tickets.some((ticket) => ticket.url)) bonus += 2;

  return Math.min(FTN_TICKET_FETCH_BONUS_CAP, bonus);
}

function bestTicketPriceText(tickets: NormalizedFtnTicket[], eventLevelPrice: string | null): string | null {
  const withPrice = tickets.find((ticket) => clean(ticket.priceText));
  return withPrice?.priceText ?? eventLevelPrice;
}

function bestTicketUrl(
  tickets: NormalizedFtnTicket[],
  event: FtnEvent,
  input: TicketResolveInput
): { url: string; isSearchFallback: boolean } {
  const ticketLevelUrl = tickets.find((ticket) => clean(ticket.url))?.url;
  if (ticketLevelUrl) {
    return {
      url: ticketLevelUrl,
      isSearchFallback: false,
    };
  }

  const directEventUrl = normalizeFtnUrl(clean(event.event_url) || clean(event.url));
  if (directEventUrl && hasUsableEventUrl(event)) {
    return {
      url: directEventUrl,
      isSearchFallback: false,
    };
  }

  const id = eventId(event);
  if (id) {
    return {
      url: buildEventIdUrl(id),
      isSearchFallback: false,
    };
  }

  return {
    url: buildStableSearchUrl(input),
    isSearchFallback: true,
  };
}

async function fetchEventTickets(eventIdValue: string): Promise<FtnGetEventResponse> {
  const ts = String(Date.now());
  const sig = sha256(
    `${env.ftnUsername}-get_event-${eventIdValue}-${ts}-${env.ftnAffiliateSecret}`
  );

  const qs = new URLSearchParams({
    action: "get_event",
    u: env.ftnUsername,
    s: sig,
    ts,
    event_id: eventIdValue,
  });

  const url = `${env.ftnBaseUrl}?${qs.toString()}`;

  console.log("[FTN] get_event request start", {
    eventId: eventIdValue,
    url,
  });

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    console.log("[FTN] get_event non-200 response", {
      eventId: eventIdValue,
      status: response.status,
      body: response.body.slice(0, 500),
    });
    return null;
  }

  try {
    return response.body ? (JSON.parse(response.body) as FtnGetEventResponse) : null;
  } catch {
    console.log("[FTN] get_event invalid JSON", {
      eventId: eventIdValue,
      body: response.body.slice(0, 500),
    });
    return null;
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

  console.log("[FTN] list_events request start", {
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
          leagueScore: scored.leagueScore,
        };
      }),
    });
    return null;
  }

  const chosenEventId = eventId(best.ev);
  let tickets: NormalizedFtnTicket[] = [];

  if (chosenEventId) {
    const ticketPayload = await fetchEventTickets(chosenEventId);
    tickets = extractNormalizedTickets(ticketPayload);

    console.log("[FTN] get_event parsed tickets", {
      eventId: chosenEventId,
      count: tickets.length,
      sample: tickets.slice(0, 5).map(summarizeTicket),
    });
  } else {
    console.log("[FTN] best event missing event_id", {
      best: {
        ...summarizeEvent(best.ev),
        score: best.score,
        exactTeams: best.exactTeams,
        sameDay: best.sameDay,
        penalty: best.penalty,
      },
    });
  }

  const priceText = bestTicketPriceText(tickets, eventPrice(best.ev));
  const outbound = bestTicketUrl(tickets, best.ev, input);
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
      ticketCount: tickets.length,
    });
    return null;
  }

  let finalScore = best.score + ticketDataBonus(tickets);

  if (outbound.isSearchFallback) {
    finalScore = Math.max(0, finalScore - FTN_SEARCH_FALLBACK_PENALTY);
  } else if (!best.hasDirectUrl && !tickets.some((ticket) => ticket.url)) {
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
      chosenEventId: chosenEventId || null,
      ticketCount: tickets.length,
      topTicket: tickets[0] ? summarizeTicket(tickets[0]) : null,
      affiliateUrl,
    },
  });

  return {
    provider: "footballticketnet",
    exact,
    score: finalScore,
    url: affiliateUrl,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText,
    reason,
  };
    }
