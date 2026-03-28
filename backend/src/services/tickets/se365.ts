import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

type Se365Participant = {
  id?: number | string;
  name?: string;
  eventTypeId?: number | string;
  logo?: string;
};

type Se365ParticipantsResponse =
  | {
      data?: Se365Participant[];
      items?: Se365Participant[];
      participants?: Se365Participant[];
      response?: Se365Participant[];
      results?: Se365Participant[];
    }
  | Se365Participant[]
  | null;

type Se365Event = {
  id?: number | string;
  name?: string;
  eventTitle?: string;
  title?: string;
  dateOfEvent?: string;
  date?: string;
  eventDate?: string;
  startDate?: string;
  timeOfEvent?: string;
  homeTeam?: {
    id?: number | string;
    name?: string;
  };
  awayTeam?: {
    id?: number | string;
    name?: string;
  };
  participants?: Array<{
    id?: number | string;
    name?: string;
  }>;
  tournament?: {
    id?: number | string;
    name?: string;
  };
  url?: string;
  eventUrl?: string;
  event_url?: string;
};

type Se365EventsResponse =
  | {
      data?: Se365Event[];
      items?: Se365Event[];
      events?: Se365Event[];
      response?: Se365Event[];
      results?: Se365Event[];
    }
  | Se365Event[]
  | null;

type Se365Ticket = {
  id?: number | string;
  ticketId?: number | string;
  price?: number | string;
  minPrice?: number | string;
  min_price?: number | string;
  lowestPrice?: number | string;
  lowest_price?: number | string;
  currency?: string;
  currencyCode?: string;
  quantity?: number | string;
  qty?: number | string;
};

type Se365TicketsResponse =
  | {
      data?: Se365Ticket[];
      items?: Se365Ticket[];
      tickets?: Se365Ticket[];
      response?: Se365Ticket[];
      results?: Se365Ticket[];
    }
  | Se365Ticket[]
  | null;

type ScoredEvent = {
  ev: Se365Event;
  score: number;
  exactTeams: boolean;
  sameDay: boolean;
  hasDirectUrl: boolean;
  reasons: string[];
};

const SE365_FETCH_TIMEOUT_MS = 7000;
const SE365_EVENT_TYPE_ID = "1000";
const SE365_PARTICIPANTS_PER_PAGE = 100;
const SE365_MAX_PARTICIPANT_PAGES = 40;
const SE365_EVENTS_PER_PAGE = 50;
const SE365_MAX_EVENT_PAGES = 8;

const SE365_MIN_PARTICIPANT_SCORE = 70;
const SE365_MIN_STRONG_EVENT_SCORE = 68;
const SE365_MIN_EXACT_EVENT_SCORE = 94;
const SE365_FALLBACK_SCORE = 22;
const SE365_SEARCH_FALLBACK_PENALTY = 40;
const SE365_TICKET_BONUS_CAP = 10;

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function norm(v: unknown): string {
  return clean(v).toLowerCase();
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(value: string): string {
  return stripAccents(clean(value))
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bfc\b/g, " ")
    .replace(/\bcf\b/g, " ")
    .replace(/\bafc\b/g, " ")
    .replace(/\bsc\b/g, " ")
    .replace(/\bsk\b/g, " ")
    .replace(/\bjk\b/g, " ")
    .replace(/\bclub\b/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeDate(v?: string): Date | null {
  const raw = clean(v);
  if (!raw) return null;

  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return null;

  return d;
}

function absDays(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

function numberFromUnknown(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const raw = clean(v);
  if (!raw) return null;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function participantId(p: Se365Participant): string {
  return clean(p.id);
}

function participantName(p: Se365Participant): string {
  return clean(p.name);
}

function eventId(ev: Se365Event): string {
  return clean(ev.id);
}

function eventName(ev: Se365Event): string {
  return clean(ev.name) || clean(ev.eventTitle) || clean(ev.title);
}

function eventDate(ev: Se365Event): string {
  return (
    clean(ev.dateOfEvent) ||
    clean(ev.eventDate) ||
    clean(ev.startDate) ||
    clean(ev.date)
  );
}

function eventUrl(ev: Se365Event): string {
  return clean(ev.url) || clean(ev.eventUrl) || clean(ev.event_url);
}

function eventHomeName(ev: Se365Event): string {
  return clean(ev.homeTeam?.name);
}

function eventAwayName(ev: Se365Event): string {
  return clean(ev.awayTeam?.name);
}

function eventParticipantNames(ev: Se365Event): string[] {
  const arr = Array.isArray(ev.participants) ? ev.participants : [];
  return arr.map((x) => clean(x.name)).filter(Boolean);
}

function eventTournamentName(ev: Se365Event): string {
  return clean(ev.tournament?.name);
}

function ticketCurrency(ticket: Se365Ticket): string {
  return clean(ticket.currency) || clean(ticket.currencyCode);
}

function ticketQuantity(ticket: Se365Ticket): number | null {
  return numberFromUnknown(ticket.quantity) ?? numberFromUnknown(ticket.qty);
}

function ticketPriceValue(ticket: Se365Ticket): number | null {
  return (
    numberFromUnknown(ticket.minPrice) ??
    numberFromUnknown(ticket.min_price) ??
    numberFromUnknown(ticket.lowestPrice) ??
    numberFromUnknown(ticket.lowest_price) ??
    numberFromUnknown(ticket.price) ??
    null
  );
}

function ticketPriceText(ticket: Se365Ticket): string | null {
  const price = ticketPriceValue(ticket);
  const currency = ticketCurrency(ticket);

  if (price == null && !currency) return null;
  if (price != null && currency) return `${price} ${currency}`;
  if (price != null) return String(price);
  return currency || null;
}

function buildBaseUrl(): string {
  const raw = clean(env.se365BaseUrl);
  return raw ? raw.replace(/\/+$/, "") : "https://api-v2.sandbox365.com";
}

function buildBasicAuthHeader(): string | null {
  const username =
    clean(env.se365HttpUsername) || clean(env.se365HttpSource) || "";
  const password = clean(env.se365ApiPassword);

  if (!username || !password) return null;
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const basic = buildBasicAuthHeader();
  if (basic) headers.Authorization = basic;

  return headers;
}

async function fetchText(
  url: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SE365_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
      signal: controller.signal,
    });

    const body = await res.text().catch(() => "");

    return {
      ok: res.ok,
      status: res.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractParticipants(json: Se365ParticipantsResponse): Se365Participant[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.participants)) return json.participants;
  if (Array.isArray(json.response)) return json.response;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

function extractEvents(json: Se365EventsResponse): Se365Event[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.events)) return json.events;
  if (Array.isArray(json.response)) return json.response;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

function extractTickets(json: Se365TicketsResponse): Se365Ticket[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.tickets)) return json.tickets;
  if (Array.isArray(json.response)) return json.response;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

function appendAffiliate(url: string): string {
  const base = clean(url);
  if (!base) return "";

  try {
    const parsed = new URL(base);
    const affiliateId = clean(env.se365AffiliateId);

    if (!affiliateId) return parsed.toString();

    if (affiliateId.includes("=")) {
      const [k, v] = affiliateId.split("=");
      if (k && v && !parsed.searchParams.get(k)) {
        parsed.searchParams.set(k, v);
      }
      return parsed.toString();
    }

    if (!parsed.searchParams.get("a_aid")) {
      parsed.searchParams.set("a_aid", affiliateId);
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

function buildTrackedSearchFallback(input: TicketResolveInput): string | null {
  const home = getPreferredTeamName(input.homeName);
  const away = getPreferredTeamName(input.awayName);
  const league = clean(input.leagueName);

  const q = league ? `${home} vs ${away} ${league}` : `${home} vs ${away}`;
  if (!q) return null;

  const url = new URL("https://www.sportsevents365.com/events/search");
  url.searchParams.set("q", q);

  const affiliateId = clean(env.se365AffiliateId);
  if (affiliateId) {
    if (affiliateId.includes("=")) {
      const [k, v] = affiliateId.split("=");
      if (k && v) url.searchParams.set(k, v);
    } else {
      url.searchParams.set("a_aid", affiliateId);
    }
  }

  return url.toString();
}

function summarizeParticipant(p: Se365Participant) {
  return {
    id: participantId(p) || null,
    name: participantName(p) || null,
  };
}

function summarizeEvent(ev: Se365Event) {
  return {
    id: eventId(ev) || null,
    name: eventName(ev) || null,
    date: eventDate(ev) || null,
    home: eventHomeName(ev) || null,
    away: eventAwayName(ev) || null,
    participants: eventParticipantNames(ev),
    tournament: eventTournamentName(ev) || null,
    url: eventUrl(ev) || null,
  };
}

function summarizeTicket(t: Se365Ticket) {
  return {
    id: clean(t.id) || clean(t.ticketId) || null,
    priceText: ticketPriceText(t),
    quantity: ticketQuantity(t),
  };
}

function hasBadVariantText(value: string): boolean {
  const normalized = ` ${normalizeName(value)} `;

  const badTokens = [
    " women ",
    " ladies ",
    " female ",
    " feminino ",
    " femenino ",
    " u17 ",
    " u18 ",
    " u19 ",
    " u20 ",
    " u21 ",
    " u23 ",
    " youth ",
    " academy ",
    " reserves ",
    " reserve ",
    " legends ",
    " b team ",
  ];

  if (badTokens.some((token) => normalized.includes(token))) return true;
  if (/(^|\s)ii(\s|$)/.test(normalized)) return true;
  if (/(^|\s)b(\s|$)/.test(normalized)) return true;

  return false;
}

function eventHasBadVariant(ev: Se365Event): boolean {
  const value = [
    eventName(ev),
    eventHomeName(ev),
    eventAwayName(ev),
    ...eventParticipantNames(ev),
  ]
    .join(" ")
    .trim();

  return hasBadVariantText(value);
}

function findBestParticipantMatch(
  participants: Se365Participant[],
  teamName: string
): Se365Participant | null {
  const preferred = getPreferredTeamName(teamName);
  const aliases = expandTeamAliases(preferred).map(normalizeName);
  const exactSet = new Set(aliases);

  let best: { participant: Se365Participant; score: number } | null = null;

  for (const participant of participants) {
    const name = participantName(participant);
    if (!name) continue;
    if (hasBadVariantText(name)) continue;

    const normalized = normalizeName(name);
    let score = -1000;

    if (exactSet.has(normalized)) {
      score = 100;
    } else if (aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      score = 76;
    } else {
      const tokens = normalizeName(preferred).split(" ").filter((x) => x.length >= 4);
      const matched = tokens.filter((token) => normalized.includes(token)).length;
      if (matched >= 2) score = 55;
      else if (matched === 1) score = 20;
    }

    if (!best || score > best.score) {
      best = { participant, score };
    }
  }

  return best && best.score >= SE365_MIN_PARTICIPANT_SCORE ? best.participant : null;
}

async function fetchParticipantsPages(): Promise<Se365Participant[]> {
  const out: Se365Participant[] = [];
  const base = buildBaseUrl();
  const apiKey = clean(env.se365ApiKey);

  for (let page = 1; page <= SE365_MAX_PARTICIPANT_PAGES; page += 1) {
    const url = new URL(`${base}/participants`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("eventTypeId", SE365_EVENT_TYPE_ID);
    url.searchParams.set("perPage", String(SE365_PARTICIPANTS_PER_PAGE));
    url.searchParams.set("page", String(page));

    const res = await fetchText(url.toString());

    if (!res.ok) {
      console.log("[SE365] participants non-200 response", {
        page,
        status: res.status,
        url: url.toString(),
        body: res.body.slice(0, 500),
      });
      if (page === 1) return [];
      break;
    }

    let parsed: Se365ParticipantsResponse = null;
    try {
      parsed = res.body ? (JSON.parse(res.body) as Se365ParticipantsResponse) : null;
    } catch {
      console.log("[SE365] participants invalid JSON", {
        page,
        url: url.toString(),
        body: res.body.slice(0, 500),
      });
      if (page === 1) return [];
      break;
    }

    const pageItems = extractParticipants(parsed);

    console.log("[SE365] participants page", {
      page,
      count: pageItems.length,
      sample: pageItems.slice(0, 5).map(summarizeParticipant),
    });

    if (!pageItems.length) break;

    out.push(...pageItems);

    if (pageItems.length < SE365_PARTICIPANTS_PER_PAGE) {
      break;
    }
  }

  return out;
}

async function fetchParticipantEvents(participantIdValue: string): Promise<Se365Event[]> {
  if (!participantIdValue) return [];

  const out: Se365Event[] = [];
  const base = buildBaseUrl();
  const apiKey = clean(env.se365ApiKey);

  for (let page = 1; page <= SE365_MAX_EVENT_PAGES; page += 1) {
    const url = new URL(`${base}/events/participant/${encodeURIComponent(participantIdValue)}`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("perPage", String(SE365_EVENTS_PER_PAGE));
    url.searchParams.set("page", String(page));

    const res = await fetchText(url.toString());

    if (!res.ok) {
      console.log("[SE365] participant events non-200 response", {
        participantId: participantIdValue,
        page,
        status: res.status,
        url: url.toString(),
        body: res.body.slice(0, 500),
      });
      if (page === 1) return [];
      break;
    }

    let parsed: Se365EventsResponse = null;
    try {
      parsed = res.body ? (JSON.parse(res.body) as Se365EventsResponse) : null;
    } catch {
      console.log("[SE365] participant events invalid JSON", {
        participantId: participantIdValue,
        page,
        url: url.toString(),
        body: res.body.slice(0, 500),
      });
      if (page === 1) return [];
      break;
    }

    const pageItems = extractEvents(parsed);

    console.log("[SE365] participant events page", {
      participantId: participantIdValue,
      page,
      count: pageItems.length,
      sample: pageItems.slice(0, 5).map(summarizeEvent),
    });

    if (!pageItems.length) break;

    out.push(...pageItems);

    if (pageItems.length < SE365_EVENTS_PER_PAGE) {
      break;
    }
  }

  return out;
}

async function fetchTicketsForEvent(eventIdValue: string): Promise<Se365Ticket[]> {
  if (!eventIdValue) return [];

  const base = buildBaseUrl();
  const apiKey = clean(env.se365ApiKey);

  const url = new URL(`${base}/tickets/${encodeURIComponent(eventIdValue)}`);
  url.searchParams.set("apiKey", apiKey);

  const res = await fetchText(url.toString());

  if (!res.ok) {
    console.log("[SE365] tickets non-200 response", {
      eventId: eventIdValue,
      status: res.status,
      url: url.toString(),
      body: res.body.slice(0, 500),
    });
    return [];
  }

  let parsed: Se365TicketsResponse = null;
  try {
    parsed = res.body ? (JSON.parse(res.body) as Se365TicketsResponse) : null;
  } catch {
    console.log("[SE365] tickets invalid JSON", {
      eventId: eventIdValue,
      url: url.toString(),
      body: res.body.slice(0, 500),
    });
    return [];
  }

  const tickets = extractTickets(parsed);

  console.log("[SE365] tickets fetched", {
    eventId: eventIdValue,
    count: tickets.length,
    sample: tickets.slice(0, 5).map(summarizeTicket),
  });

  return tickets;
}

function dedupeEvents(events: Se365Event[]): Se365Event[] {
  return Array.from(
    new Map(events.map((ev) => [`${eventId(ev)}|${eventName(ev)}|${eventDate(ev)}`, ev])).values()
  );
}

function eventMatchScore(
  ev: Se365Event,
  input: TicketResolveInput,
  homeParticipantId?: string | null,
  awayParticipantId?: string | null
): ScoredEvent {
  let score = 0;
  const reasons: string[] = [];

  if (eventHasBadVariant(ev)) {
    return {
      ev,
      score: -1000,
      exactTeams: false,
      sameDay: false,
      hasDirectUrl: false,
      reasons: ["bad_variant"],
    };
  }

  const homeAliases = expandTeamAliases(getPreferredTeamName(input.homeName)).map(normalizeName);
  const awayAliases = expandTeamAliases(getPreferredTeamName(input.awayName)).map(normalizeName);

  const homeName = normalizeName(eventHomeName(ev));
  const awayName = normalizeName(eventAwayName(ev));
  const title = normalizeName(eventName(ev));
  const participants = eventParticipantNames(ev).map(normalizeName);

  const participantIds = new Set(
    (Array.isArray(ev.participants) ? ev.participants : [])
      .map((p) => clean(p.id))
      .filter(Boolean)
  );

  const homeExact =
    homeAliases.some((alias) => alias && homeName === alias) ||
    homeAliases.some((alias) => alias && participants.includes(alias));

  const awayExact =
    awayAliases.some((alias) => alias && awayName === alias) ||
    awayAliases.some((alias) => alias && participants.includes(alias));

  const homeLoose =
    homeExact ||
    homeAliases.some((alias) => alias && (title.includes(alias) || homeName.includes(alias)));

  const awayLoose =
    awayExact ||
    awayAliases.some((alias) => alias && (title.includes(alias) || awayName.includes(alias)));

  const exactTeams = homeExact && awayExact;

  if (homeParticipantId && participantIds.has(homeParticipantId)) {
    score += 18;
    reasons.push("home_participant_id_match");
  }

  if (awayParticipantId && participantIds.has(awayParticipantId)) {
    score += 18;
    reasons.push("away_participant_id_match");
  }

  if (exactTeams) {
    score += 48;
    reasons.push("both_teams_exact");
  } else if (homeLoose && awayLoose) {
    score += 24;
    reasons.push("both_teams_loose");
  } else {
    score -= 1000;
    reasons.push("team_match_failed");
  }

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));
  let sameDay = false;

  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);

    if (diff === 0) {
      score += 24;
      sameDay = true;
      reasons.push("same_day");
    } else if (diff === 1) {
      score += 8;
      reasons.push("one_day_off");
    } else if (diff === 2) {
      score += 2;
      reasons.push("two_days_off");
    } else {
      score -= 1000;
      reasons.push(`date_mismatch_${diff}`);
    }
  } else {
    score -= 15;
    reasons.push("missing_event_date");
  }

  const hasDirectUrl = Boolean(clean(eventUrl(ev)));
  if (hasDirectUrl) {
    score += 8;
    reasons.push("has_event_url");
  }

  if (clean(eventTournamentName(ev)) && clean(input.leagueName)) {
    const tournament = normalizeName(eventTournamentName(ev));
    const league = normalizeName(clean(input.leagueName));
    if (tournament.includes(league) || league.includes(tournament)) {
      score += 6;
      reasons.push("league_hint_match");
    }
  }

  return {
    ev,
    score,
    exactTeams,
    sameDay,
    hasDirectUrl,
    reasons,
  };
}

function scoreTickets(
  tickets: Se365Ticket[]
): { score: number; bestTicket: Se365Ticket | null } {
  if (!tickets.length) {
    return { score: 0, bestTicket: null };
  }

  let score = 0;

  const priced = tickets
    .map((ticket) => ({
      ticket,
      amount: ticketPriceValue(ticket),
    }))
    .sort((a, b) => {
      if (a.amount == null && b.amount == null) return 0;
      if (a.amount == null) return 1;
      if (b.amount == null) return -1;
      return a.amount - b.amount;
    });

  if (priced.some((x) => x.amount != null)) {
    score += 5;
  }

  if (
    tickets.some((x) => {
      const qty = ticketQuantity(x);
      return qty != null && qty >= 2;
    })
  ) {
    score += 5;
  }

  return {
    score: Math.min(SE365_TICKET_BONUS_CAP, score),
    bestTicket: priced[0]?.ticket ?? null,
  };
}

function pickBestEvent(
  events: Se365Event[],
  input: TicketResolveInput,
  homeParticipantId?: string | null,
  awayParticipantId?: string | null
): ScoredEvent | null {
  const scored = dedupeEvents(events)
    .map((ev) => eventMatchScore(ev, input, homeParticipantId, awayParticipantId))
    .filter((x) => x.score >= SE365_MIN_STRONG_EVENT_SCORE)
    .sort((a, b) => {
      if (a.exactTeams !== b.exactTeams) return a.exactTeams ? -1 : 1;
      if (a.sameDay !== b.sameDay) return a.sameDay ? -1 : 1;
      if (a.hasDirectUrl !== b.hasDirectUrl) return a.hasDirectUrl ? -1 : 1;
      return b.score - a.score;
    });

  if (!scored.length) return null;
  return scored[0];
}

function isExactEvent(scored: ScoredEvent, finalScore: number): boolean {
  return (
    scored.exactTeams &&
    scored.sameDay &&
    scored.hasDirectUrl &&
    finalScore >= SE365_MIN_EXACT_EVENT_SCORE
  );
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  console.log("[SE365 CONFIG CHECK]", {
    hasSe365Config: hasSe365Config(),
    apiKeyPresent: Boolean(clean(env.se365ApiKey)),
    baseUrl: env.se365BaseUrl,
    username: env.se365HttpUsername,
    passwordPresent: Boolean(clean(env.se365ApiPassword)),
    affiliateIdPresent: Boolean(clean(env.se365AffiliateId)),
  });

  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  const homeName = getPreferredTeamName(input.homeName);
  const awayName = getPreferredTeamName(input.awayName);

  if (!homeName || !awayName || !clean(input.kickoffIso)) {
    console.log("[SE365] skipped: missing required input", {
      homeName,
      awayName,
      kickoffIso: clean(input.kickoffIso),
    });
    return null;
  }

  console.log("[SE365] resolve start", {
    homeName,
    awayName,
    kickoffIso: clean(input.kickoffIso),
    leagueName: clean(input.leagueName) || null,
    leagueId: clean(input.leagueId) || null,
  });

  const participants = await fetchParticipantsPages();

  if (!participants.length) {
    const fallback = buildTrackedSearchFallback(input);
    console.log("[SE365] participants empty, using fallback", { fallback });
    if (!fallback) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: SE365_FALLBACK_SCORE,
      url: fallback,
      title: `Tickets: ${homeName} vs ${awayName}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const homeParticipant = findBestParticipantMatch(participants, homeName);
  const awayParticipant = findBestParticipantMatch(participants, awayName);

  console.log("[SE365] participant matches", {
    homeParticipant: homeParticipant ? summarizeParticipant(homeParticipant) : null,
    awayParticipant: awayParticipant ? summarizeParticipant(awayParticipant) : null,
  });

  if (!homeParticipant || !awayParticipant) {
    const fallback = buildTrackedSearchFallback(input);
    console.log("[SE365] participant match incomplete, using fallback", { fallback });
    if (!fallback) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: SE365_FALLBACK_SCORE,
      url: fallback,
      title: `Tickets: ${homeName} vs ${awayName}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const homeParticipantId = participantId(homeParticipant);
  const awayParticipantId = participantId(awayParticipant);

  const events = await fetchParticipantEvents(homeParticipantId);

  if (!events.length) {
    const fallback = buildTrackedSearchFallback(input);
    console.log("[SE365] participant events empty, using fallback", { fallback });
    if (!fallback) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: SE365_FALLBACK_SCORE,
      url: fallback,
      title: `Tickets: ${homeName} vs ${awayName}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const best = pickBestEvent(events, input, homeParticipantId, awayParticipantId);

  console.log("[SE365] scored events", {
    total: dedupeEvents(events).length,
    top: dedupeEvents(events)
      .map((ev) => eventMatchScore(ev, input, homeParticipantId, awayParticipantId))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => ({
        ...summarizeEvent(x.ev),
        score: x.score,
        exactTeams: x.exactTeams,
        sameDay: x.sameDay,
        hasDirectUrl: x.hasDirectUrl,
        reasons: x.reasons,
      })),
  });

  if (!best) {
    const fallback = buildTrackedSearchFallback(input);
    console.log("[SE365] no strong event match, using fallback", { fallback });
    if (!fallback) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: SE365_FALLBACK_SCORE,
      url: fallback,
      title: `Tickets: ${homeName} vs ${awayName}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const tickets = await fetchTicketsForEvent(eventId(best.ev));
  const ticketData = scoreTickets(tickets);

  const directUrl = clean(eventUrl(best.ev));
  const resolvedUrl = directUrl
    ? appendAffiliate(directUrl)
    : buildTrackedSearchFallback(input);

  if (!resolvedUrl) {
    console.log("[SE365] failed to build outbound URL", {
      best: {
        ...summarizeEvent(best.ev),
        score: best.score,
        reasons: best.reasons,
      },
    });
    return null;
  }

  let finalScore = Math.min(100, best.score + ticketData.score);

  const usedSearchFallback = !directUrl;
  if (usedSearchFallback) {
    finalScore = Math.max(0, finalScore - SE365_SEARCH_FALLBACK_PENALTY);
  }

  const exact = !usedSearchFallback && isExactEvent(best, finalScore);

  console.log("[SE365] matched event", {
    best: {
      ...summarizeEvent(best.ev),
      score: best.score,
      reasons: best.reasons,
      finalScore,
      exact,
      resolvedUrl,
      usedSearchFallback,
      ticketCount: tickets.length,
      bestTicket: ticketData.bestTicket ? summarizeTicket(ticketData.bestTicket) : null,
    },
  });

  return {
    provider: "sportsevents365",
    exact,
    score: finalScore,
    url: resolvedUrl,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: ticketData.bestTicket ? ticketPriceText(ticketData.bestTicket) : null,
    reason: usedSearchFallback
      ? "search_fallback"
      : exact
        ? "exact_event"
        : "partial_match",
  };
    }
