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

type FtnTicket = {
  id?: string | number;
  ticket_id?: string | number;
  url?: string;
  event_url?: string;
  deep_link?: string;
  deeplink?: string;
  link?: string;
  title?: string;
  name?: string;
  price?: string | number | Record<string, unknown>;
  min_price?: string | number | Record<string, unknown>;
  lowest_price?: string | number | Record<string, unknown>;
  currency?: string;
  currency_code?: string;
};

type FtnListResponse = {
  events?: FtnEvent[];
  data?: FtnEvent[];
  success?: boolean | string | number;
  error?: string;
  message?: string;
};

type FtnGetEventResponse = {
  success?: boolean | string | number;
  error?: string;
  message?: string;
  event?: FtnEvent | null;
  data?: unknown;
  tickets?: unknown;
  event_url?: string;
  url?: string;
  deep_link?: string;
  deeplink?: string;
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

function eventIdOf(ev: FtnEvent): string {
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

function ticketPrice(ticket: FtnTicket): string | null {
  return (
    normalizePriceValue(ticket.lowest_price) ||
    normalizePriceValue(ticket.min_price) ||
    normalizePriceValue(ticket.price)
  );
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
  const homeMatch = inputHomeVariants.some((variant) =>
    titleNorm.includes(norm(variant))
  );
  const awayMatch = inputAwayVariants.some((variant) =>
    titleNorm.includes(norm(variant))
  );
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
  const haystack = [eventTitle(ev), eventHome(ev), eventAway(ev)]
    .join(" ")
    .toLowerCase();
  const inputText = [input.homeName, input.awayName, input.leagueName ?? ""]
    .join(" ")
    .toLowerCase();

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
    eventId: eventIdOf(ev) || null,
    title: eventTitle(ev) || null,
    home: eventHome(ev) || null,
    away: eventAway(ev) || null,
    date: eventDate(ev) || null,
    rawUrl: clean(ev.event_url) || clean(ev.url) || null,
    price: eventPrice(ev) || null,
  };
}

function encodeQuery(value: string): string {
  return encodeURIComponent(clean(value));
}

function buildSafeFtnSearchUrl(input: TicketResolveInput): string {
  const query = `${clean(input.homeName)} vs ${clean(input.awayName)}`.trim();
  return `https://${FTN_CANONICAL_HOST}/search?text=${encodeQuery(query)}`;
}

function normalizeFtnUrl(raw: unknown): string {
  const value = clean(raw);
  if (!value) return "";

  try {
    if (value.startsWith("/")) {
      return new URL(value, `https://${FTN_CANONICAL_HOST}`).toString();
    }

    const parsed = new URL(value, `https://${FTN_CANONICAL_HOST}`);
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

function appendAffiliate(url: string): string {
  const base = normalizeFtnUrl(url);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toTicketLike(value: unknown): FtnTicket | null {
  if (!isRecord(value)) return null;

  const ticket: FtnTicket = {
    id: value.id,
    ticket_id: value.ticket_id,
    url: clean(value.url),
    event_url: clean(value.event_url),
    deep_link: clean(value.deep_link),
    deeplink: clean(value.deeplink),
    link: clean(value.link),
    title: clean(value.title),
    name: clean(value.name),
    price: value.price,
    min_price: value.min_price,
    lowest_price: value.lowest_price,
    currency: clean(value.currency),
    currency_code: clean(value.currency_code),
  };

  const anyUrl =
    clean(ticket.url) ||
    clean(ticket.event_url) ||
    clean(ticket.deep_link) ||
    clean(ticket.deeplink) ||
    clean(ticket.link);

  const anyPrice = ticketPrice(ticket);

  if (!anyUrl && !anyPrice && !clean(ticket.title) && !clean(ticket.name)) {
    return null;
  }

  return ticket;
}

function extractTicketsFromUnknown(data: unknown): FtnTicket[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.map(toTicketLike).filter((x): x is FtnTicket => x !== null);
  }

  if (!isRecord(data)) return [];

  const directTicket = toTicketLike(data);
  const out: FtnTicket[] = directTicket ? [directTicket] : [];

  const candidateKeys = [
    "tickets",
    "data",
    "items",
    "results",
    "list",
    "event_tickets",
  ];

  for (const key of candidateKeys) {
    const value = data[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        const ticket = toTicketLike(item);
        if (ticket) out.push(ticket);
      }
      continue;
    }

    if (isRecord(value)) {
      for (const nested of Object.values(value)) {
        const ticket = toTicketLike(nested);
        if (ticket) out.push(ticket);
      }
    }
  }

  return dedupeTickets(out);
}

function dedupeTickets(tickets: FtnTicket[]): FtnTicket[] {
  const seen = new Set<string>();
  const out: FtnTicket[] = [];

  for (const ticket of tickets) {
    const key = [
      clean(ticket.ticket_id) || clean(ticket.id),
      clean(ticket.url),
      clean(ticket.event_url),
      clean(ticket.deep_link),
      clean(ticket.deeplink),
      clean(ticket.link),
      clean(ticket.title) || clean(ticket.name),
      ticketPrice(ticket) || "",
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ticket);
  }

  return out;
}

function summarizeTicket(ticket: FtnTicket) {
  return {
    ticketId: clean(ticket.ticket_id) || clean(ticket.id) || null,
    title: clean(ticket.title) || clean(ticket.name) || null,
    rawUrl:
      clean(ticket.deep_link) ||
      clean(ticket.deeplink) ||
      clean(ticket.event_url) ||
      clean(ticket.url) ||
      clean(ticket.link) ||
      null,
    price: ticketPrice(ticket),
  };
}

function buildGetEventUrl(eventId: string): string {
  const action = "get_event";
  const ts = String(Date.now());
  const sig = sha256(
    `${env.ftnUsername}-${action}-${eventId}-${ts}-${env.ftnAffiliateSecret}`
  );

  const qs = new URLSearchParams({
    action,
    u: env.ftnUsername,
    s: sig,
    ts,
    event_id: eventId,
  });

  return `${env.ftnBaseUrl}?${qs.toString()}`;
}

function pickBestTicketUrlFromGetEvent(
  response: FtnGetEventResponse | null,
  fallbackEvent: FtnEvent,
  input: TicketResolveInput
): {
  resolvedUrl: string;
  usedGetEventUrl: boolean;
  usedSearchFallback: boolean;
  bestTicketPrice: string | null;
} {
  const responseLevelUrl = normalizeFtnUrl(
    clean(response?.deep_link) ||
      clean(response?.deeplink) ||
      clean(response?.event_url) ||
      clean(response?.url)
  );

  const nestedEvent = isRecord(response?.event) ? (response?.event as FtnEvent) : null;
  const nestedEventUrl = normalizeFtnUrl(
    clean(nestedEvent?.event_url) || clean(nestedEvent?.url)
  );

  const tickets = dedupeTickets([
    ...extractTicketsFromUnknown(response?.tickets),
    ...extractTicketsFromUnknown(response?.data),
  ]);

  const bestTicket = tickets
    .map((ticket) => {
      const raw =
        clean(ticket.deep_link) ||
        clean(ticket.deeplink) ||
        clean(ticket.event_url) ||
        clean(ticket.url) ||
        clean(ticket.link);

      return {
        ticket,
        normalizedUrl: normalizeFtnUrl(raw),
        priceText: ticketPrice(ticket),
      };
    })
    .find((x) => Boolean(x.normalizedUrl));

  if (bestTicket?.normalizedUrl) {
    return {
      resolvedUrl: bestTicket.normalizedUrl,
      usedGetEventUrl: true,
      usedSearchFallback: false,
      bestTicketPrice: bestTicket.priceText,
    };
  }

  if (responseLevelUrl) {
    return {
      resolvedUrl: responseLevelUrl,
      usedGetEventUrl: true,
      usedSearchFallback: false,
      bestTicketPrice: null,
    };
  }

  if (nestedEventUrl) {
    return {
      resolvedUrl: nestedEventUrl,
      usedGetEventUrl: true,
      usedSearchFallback: false,
      bestTicketPrice: null,
    };
  }

  const listEventUrl = normalizeFtnUrl(
    clean(fallbackEvent.event_url) || clean(fallbackEvent.url)
  );

  if (listEventUrl) {
    return {
      resolvedUrl: listEventUrl,
      usedGetEventUrl: false,
      usedSearchFallback: false,
      bestTicketPrice: null,
    };
  }

  return {
    resolvedUrl: buildSafeFtnSearchUrl(input),
    usedGetEventUrl: false,
    usedSearchFallback: true,
    bestTicketPrice: null,
  };
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

async function fetchGetEvent(eventId: string): Promise<FtnGetEventResponse | null> {
  const url = buildGetEventUrl(eventId);

  let response: { ok: boolean; status: number; body: string };
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    console.log("[FTN] get_event network/timeout error", {
      eventId,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  if (!response.ok) {
    console.log("[FTN] get_event non-200 response", {
      eventId,
      status: response.status,
      body: response.body.slice(0, 500),
    });
    return null;
  }

  try {
    return response.body ? (JSON.parse(response.body) as FtnGetEventResponse) : null;
  } catch {
    console.log("[FTN] get_event invalid JSON", {
      eventId,
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
  const sig = sha256(
    `${env.ftnUsername}-list_events-${ts}-${env.ftnAffiliateSecret}`
  );

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
  const loggableUrl =
    `${env.ftnBaseUrl}?action=list_events&u=${encodeURIComponent(env.ftnUsername)}` +
    `&ts=${encodeURIComponent(ts)}` +
    `&home_team_name=${encodeURIComponent(homeName)}` +
    `&away_team_name=${encodeURIComponent(awayName)}` +
    `${dateWindow.fromDate ? `&from_date=${encodeURIComponent(dateWindow.fromDate)}` : ""}` +
    `${dateWindow.toDate ? `&to_date=${encodeURIComponent(dateWindow.toDate)}` : ""}`;

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
  const bestEventId = eventIdOf(best.ev);

  let getEventResponse: FtnGetEventResponse | null = null;
  if (bestEventId) {
    getEventResponse = await fetchGetEvent(bestEventId);

    if (getEventResponse) {
      console.log("[FTN] get_event response summary", {
        eventId: bestEventId,
        responseLevelUrl:
          clean(getEventResponse.deep_link) ||
          clean(getEventResponse.deeplink) ||
          clean(getEventResponse.event_url) ||
          clean(getEventResponse.url) ||
          null,
        ticketSamples: dedupeTickets([
          ...extractTicketsFromUnknown(getEventResponse.tickets),
          ...extractTicketsFromUnknown(getEventResponse.data),
        ])
          .slice(0, 5)
          .map(summarizeTicket),
      });
    }
  }

  const chosen = pickBestTicketUrlFromGetEvent(getEventResponse, best.ev, input);
  const affiliateUrl = appendAffiliate(chosen.resolvedUrl);

  if (!affiliateUrl) {
    console.log("[FTN] failed to build safe outbound URL", {
      best: {
        ...summarizeEvent(best.ev),
        score: best.score,
        penalty: best.penalty,
      },
      usedGetEventUrl: chosen.usedGetEventUrl,
      usedSearchFallback: chosen.usedSearchFallback,
    });
    return null;
  }

  const exact = exactTeamsMatch(best.ev, input) && best.score >= 80;
  const normalizedPrice = chosen.bestTicketPrice || eventPrice(best.ev);

  console.log("[FTN] matched event", {
    best: {
      ...summarizeEvent(best.ev),
      score: best.score,
      penalty: best.penalty,
      exact,
      eventId: bestEventId || null,
      usedGetEventUrl: chosen.usedGetEventUrl,
      usedSearchFallback: chosen.usedSearchFallback,
      resolvedUrl: chosen.resolvedUrl,
      affiliateUrl,
    },
  });

  return {
    provider: "footballticketsnet",
    exact,
    score: best.score,
    url: affiliateUrl,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: normalizedPrice,
    reason: exact ? "exact_event" : "search_fallback",
  };
      }
