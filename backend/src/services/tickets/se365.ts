// backend/src/services/tickets/se365.ts

import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import type {
  CandidateUrlQuality,
  TicketCandidate,
  TicketResolveInput,
} from "./types.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

/**
 * SportsEvents365 resolver.
 *
 * SE365 confirmed public deeplinks should use the API response eventUrl.
 * Do not guess event URLs unless the API gives no usable URL.
 */

type Se365Participant = {
  id?: number | string;
  name?: string;
  eventTypeId?: number | string;
  logo?: string;
};

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
  homeTeam?: { id?: number | string; name?: string };
  awayTeam?: { id?: number | string; name?: string };
  participants?: Array<{ id?: number | string; name?: string }>;
  tournament?: { id?: number | string; name?: string };
  url?: string;
  eventUrl?: string;
  event_url?: string;
};

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

type Se365ParticipantsResponse =
  | Se365Participant[]
  | {
      data?: Se365Participant[];
      items?: Se365Participant[];
      participants?: Se365Participant[];
      response?: Se365Participant[];
      results?: Se365Participant[];
    }
  | null;

type Se365EventsResponse =
  | Se365Event[]
  | {
      data?: Se365Event[];
      items?: Se365Event[];
      events?: Se365Event[];
      response?: Se365Event[];
      results?: Se365Event[];
    }
  | null;

type Se365TicketsResponse =
  | Se365Ticket[]
  | {
      data?: Se365Ticket[];
      items?: Se365Ticket[];
      tickets?: Se365Ticket[];
      response?: Se365Ticket[];
      results?: Se365Ticket[];
    }
  | null;

type ScoredEvent = {
  ev: Se365Event;
  score: number;
  exactTeams: boolean;
  sameDay: boolean;
};

type ParticipantMatch = {
  participant: Se365Participant;
  score: number;
};

type TeamParticipantCacheEntry = {
  expires: number;
  participant: Se365Participant;
};

type ParticipantListCacheEntry = {
  expires: number;
  participants: Se365Participant[];
};

type EventCacheEntry = {
  expires: number;
  event: Se365Event;
};

type ResolveParticipantsResult = {
  homeParticipant: Se365Participant | null;
  awayParticipant: Se365Participant | null;
  participantsSource: "team_cache" | "list_cache" | "live_scan" | "live_scan_partial";
  pagesScanned: number;
  scannedCount: number;
};

type EventOutbound = {
  url: string;
  urlQuality: CandidateUrlQuality;
  isSearchFallback: boolean;
};

const SE365_FETCH_TIMEOUT_MS = 5000;
const SE365_TOTAL_BUDGET_MS = 10500;

const SE365_EVENT_TYPE_ID = "1000";
const SE365_PARTICIPANTS_PER_PAGE = 100;
const SE365_MAX_PARTICIPANT_PAGES = 40;
const SE365_PARTICIPANT_PAGE_BATCH_SIZE = 4;

const SE365_EVENTS_PER_PAGE = 50;
const SE365_MAX_EVENT_PAGES = 8;

const SE365_MIN_PARTICIPANT_SCORE = 70;
const SE365_MIN_EVENT_SCORE = 40;

const SE365_PARTICIPANT_LIST_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const SE365_TEAM_PARTICIPANT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const SE365_EVENT_CACHE_TTL_MS = 1000 * 60 * 30;

const SE365_PUBLIC_BASE_URL = "https://www.sportsevents365.com";
const SE365_DEFAULT_API_BASE_URL = "https://api-v2.sandbox365.com";
const FORCED_A_AID = "69834e80ec9d3";

const GENERIC_CLUB_TOKENS = new Set([
  "ac",
  "afc",
  "athletic",
  "atletico",
  "bsc",
  "ca",
  "calcio",
  "cf",
  "city",
  "club",
  "de",
  "deportivo",
  "dynamo",
  "fc",
  "fk",
  "if",
  "jk",
  "lokomotiv",
  "olympique",
  "racing",
  "real",
  "sc",
  "sk",
  "sporting",
  "sv",
  "the",
  "town",
  "ud",
  "united",
]);

let PARTICIPANT_LIST_CACHE: ParticipantListCacheEntry | null = null;
const TEAM_PARTICIPANT_CACHE = new Map<string, TeamParticipantCacheEntry>();
const EVENT_CACHE = new Map<string, EventCacheEntry>();

function clean(value: unknown): string {
  return String(value ?? "").trim();
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

function splitTokens(value: string): string[] {
  return normalizeName(value)
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean);
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function normalizedAliases(teamName: string): string[] {
  return unique(
    expandTeamAliases(teamName)
      .map((alias) => normalizeName(alias))
      .filter(Boolean)
  );
}

function strongAliasTokens(value: string): string[] {
  const raw = splitTokens(value).filter((token) => token.length >= 3);
  const reduced = raw.filter((token) => !GENERIC_CLUB_TOKENS.has(token));

  if (raw.length >= 2) {
    return reduced.length >= 2 ? reduced : raw;
  }

  return reduced.length ? reduced : raw;
}

function hasWholeWord(haystack: string, needle: string): boolean {
  const value = ` ${normalizeName(haystack)} `;
  const target = ` ${normalizeName(needle)} `;
  return Boolean(target.trim()) && value.includes(target);
}

function hasAllTokens(haystackTokens: string[], neededTokens: string[]): boolean {
  if (!neededTokens.length) return false;
  const haystack = new Set(haystackTokens);
  return neededTokens.every((token) => haystack.has(token));
}

function countMatchedTokens(haystackTokens: string[], targetTokens: string[]): number {
  const haystack = new Set(haystackTokens);
  return targetTokens.filter((token) => haystack.has(token)).length;
}

function isDistinctiveSingleToken(token: string): boolean {
  return token.length >= 6 && !GENERIC_CLUB_TOKENS.has(token);
}

function scoreNameAgainstTeam(candidateName: string, teamName: string): number {
  const candidate = normalizeName(candidateName);
  if (!candidate) return 0;

  const aliases = normalizedAliases(teamName);
  if (!aliases.length) return 0;
  if (aliases.includes(candidate)) return 100;

  const candidateTokens = splitTokens(candidate);
  const candidateStrong = strongAliasTokens(candidate);
  let best = 0;

  for (const alias of aliases) {
    if (!alias) continue;

    if (hasWholeWord(candidate, alias)) {
      const aliasTokenCount = splitTokens(alias).length;
      best = Math.max(best, aliasTokenCount >= 2 ? 94 : 82);
    }

    const aliasStrong = strongAliasTokens(alias);

    if (aliasStrong.length >= 2) {
      if (hasAllTokens(candidateTokens, aliasStrong)) {
        best = Math.max(best, aliasStrong.length >= 3 ? 92 : 88);
      }
      continue;
    }

    if (
      aliasStrong.length === 1 &&
      isDistinctiveSingleToken(aliasStrong[0]) &&
      candidateStrong.includes(aliasStrong[0])
    ) {
      best = Math.max(best, 78);
    }
  }

  return best;
}

function scoreTitleAgainstTeam(title: string, teamName: string): number {
  const normalizedTitle = normalizeName(title);
  if (!normalizedTitle) return 0;

  const aliases = normalizedAliases(teamName);
  if (!aliases.length) return 0;

  const titleTokens = splitTokens(normalizedTitle);
  const titleStrong = strongAliasTokens(normalizedTitle);
  let best = 0;

  for (const alias of aliases) {
    if (!alias) continue;

    if (hasWholeWord(normalizedTitle, alias)) {
      const aliasTokenCount = splitTokens(alias).length;
      best = Math.max(best, aliasTokenCount >= 2 ? 86 : 72);
    }

    const aliasStrong = strongAliasTokens(alias);

    if (aliasStrong.length >= 2) {
      if (hasAllTokens(titleTokens, aliasStrong)) best = Math.max(best, 80);
      continue;
    }

    if (
      aliasStrong.length === 1 &&
      isDistinctiveSingleToken(aliasStrong[0]) &&
      titleStrong.includes(aliasStrong[0])
    ) {
      best = Math.max(best, 68);
    }
  }

  return best;
}

function parseDdMmYyyy(raw: string): Date | null {
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const dd = Number(match[1]);
  const mm = Number(match[2]);
  const yyyy = Number(match[3]);
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));

  if (
    d.getUTCFullYear() !== yyyy ||
    d.getUTCMonth() !== mm - 1 ||
    d.getUTCDate() !== dd
  ) {
    return null;
  }

  return d;
}

function safeDate(value?: string): Date | null {
  const raw = clean(value);
  if (!raw) return null;

  const ddmmyyyy = parseDdMmYyyy(raw);
  if (ddmmyyyy) return ddmmyyyy;

  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toUtcDayStart(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function absDays(a: Date, b: Date): number {
  return Math.floor(Math.abs(toUtcDayStart(a) - toUtcDayStart(b)) / 86400000);
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const raw = clean(value);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function participantId(participant: Se365Participant): string {
  return clean(participant.id);
}

function participantName(participant: Se365Participant): string {
  return clean(participant.name);
}

function eventId(event: Se365Event): string {
  return clean(event.id);
}

function eventName(event: Se365Event): string {
  return clean(event.name) || clean(event.eventTitle) || clean(event.title);
}

function eventDate(event: Se365Event): string {
  return (
    clean(event.dateOfEvent) ||
    clean(event.eventDate) ||
    clean(event.startDate) ||
    clean(event.date)
  );
}

function eventUrl(event: Se365Event): string {
  return clean(event.eventUrl) || clean(event.event_url) || clean(event.url);
}

function eventHomeName(event: Se365Event): string {
  return clean(event.homeTeam?.name);
}

function eventAwayName(event: Se365Event): string {
  return clean(event.awayTeam?.name);
}

function eventParticipantNames(event: Se365Event): string[] {
  return Array.isArray(event.participants)
    ? event.participants.map((x) => clean(x.name)).filter(Boolean)
    : [];
}

function eventTournamentName(event: Se365Event): string {
  return clean(event.tournament?.name);
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
  return raw ? raw.replace(/\/+$/, "") : SE365_DEFAULT_API_BASE_URL;
}

function buildBasicAuthHeader(): string | null {
  const username = clean(env.se365HttpUsername) || clean(env.se365HttpSource);
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

function getDeadline(startedAt: number): number {
  return startedAt + SE365_TOTAL_BUDGET_MS;
}

function hasBudget(deadlineAt: number, reserveMs = 0): boolean {
  return Date.now() + reserveMs < deadlineAt;
}

function getSe365UrlQuality(urlValue: unknown): CandidateUrlQuality {
  const raw = clean(urlValue);
  if (!raw) return "unknown";

  try {
    const parsed = new URL(raw);
    const path = parsed.pathname.toLowerCase();
    const query = parsed.search.toLowerCase();

    const looksSearch =
      path === "/search" ||
      path.startsWith("/search/") ||
      path.includes("/events/search") ||
      path.includes("/event/search") ||
      path.includes("/search-results") ||
      query.includes("q=") ||
      query.includes("query=") ||
      query.includes("text=") ||
      query.includes("search");

    if (looksSearch) return "search";
    if (path.includes("/listing") || path.includes("/listings")) return "listing";
    if (path.includes("/event") || path.includes("/events")) return "event";
    if (path.includes("/ticket") || path.includes("/tickets")) return "event";

    return "unknown";
  } catch {
    return "unknown";
  }
}

function buildPublicEventUrlFromId(eventIdValue: string): string {
  return `${SE365_PUBLIC_BASE_URL}/event/${encodeURIComponent(eventIdValue)}`;
}

async function fetchJsonText(
  url: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SE365_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
      signal: controller.signal,
    });

    const body = await response.text().catch(() => "");

    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, status: 408, body: "" };
    }

    throw error;
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
    const parsed = new URL(base.startsWith("http") ? base : `${SE365_PUBLIC_BASE_URL}${base}`);
    parsed.searchParams.set("a_aid", FORCED_A_AID);
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

  const url = new URL(`${SE365_PUBLIC_BASE_URL}/events/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("a_aid", FORCED_A_AID);

  return url.toString();
}

function summarizeParticipant(participant: Se365Participant) {
  return {
    id: participantId(participant) || null,
    name: participantName(participant) || null,
  };
}

function summarizeEvent(event: Se365Event) {
  return {
    id: eventId(event) || null,
    name: eventName(event) || null,
    date: eventDate(event) || null,
    home: eventHomeName(event) || null,
    away: eventAwayName(event) || null,
    participants: eventParticipantNames(event),
    tournament: eventTournamentName(event) || null,
    url: eventUrl(event) || null,
  };
}

function summarizeTicket(ticket: Se365Ticket) {
  return {
    id: clean(ticket.id) || clean(ticket.ticketId) || null,
    priceText: ticketPriceText(ticket),
    quantity: ticketQuantity(ticket),
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

function eventHasBadVariant(event: Se365Event): boolean {
  const value = [
    eventName(event),
    eventHomeName(event),
    eventAwayName(event),
    ...eventParticipantNames(event),
  ]
    .join(" ")
    .trim();

  return hasBadVariantText(value);
}

function cleanupCaches(): void {
  const now = Date.now();

  if (PARTICIPANT_LIST_CACHE && now > PARTICIPANT_LIST_CACHE.expires) {
    PARTICIPANT_LIST_CACHE = null;
  }

  for (const [key, entry] of TEAM_PARTICIPANT_CACHE.entries()) {
    if (now > entry.expires) TEAM_PARTICIPANT_CACHE.delete(key);
  }

  for (const [key, entry] of EVENT_CACHE.entries()) {
    if (now > entry.expires) EVENT_CACHE.delete(key);
  }
}

function getTeamCacheKey(teamName: string): string {
  return normalizeName(getPreferredTeamName(teamName));
}

function getFixtureCacheKey(input: TicketResolveInput): string {
  const kickoff = safeDate(input.kickoffIso);
  const kickoffDay = kickoff ? toUtcDayStart(kickoff) : clean(input.kickoffIso);

  return [
    normalizeName(getPreferredTeamName(input.homeName)),
    normalizeName(getPreferredTeamName(input.awayName)),
    String(kickoffDay),
    normalizeName(clean(input.leagueName)),
  ].join("|");
}

function getCachedEvent(input: TicketResolveInput): Se365Event | null {
  cleanupCaches();
  const key = getFixtureCacheKey(input);
  return EVENT_CACHE.get(key)?.event ?? null;
}

function setCachedEvent(input: TicketResolveInput, event: Se365Event): void {
  const key = getFixtureCacheKey(input);
  if (!key || !eventId(event)) return;

  EVENT_CACHE.set(key, {
    expires: Date.now() + SE365_EVENT_CACHE_TTL_MS,
    event,
  });
}

function getCachedTeamParticipant(teamName: string): Se365Participant | null {
  cleanupCaches();
  const key = getTeamCacheKey(teamName);
  return TEAM_PARTICIPANT_CACHE.get(key)?.participant ?? null;
}

function setCachedTeamParticipant(teamName: string, participant: Se365Participant): void {
  const key = getTeamCacheKey(teamName);
  if (!key || !participantId(participant)) return;

  TEAM_PARTICIPANT_CACHE.set(key, {
    expires: Date.now() + SE365_TEAM_PARTICIPANT_CACHE_TTL_MS,
    participant,
  });
}

function getCachedParticipantList(): Se365Participant[] | null {
  cleanupCaches();
  return PARTICIPANT_LIST_CACHE?.participants ?? null;
}

function setCachedParticipantList(participants: Se365Participant[]): void {
  if (!participants.length) return;

  PARTICIPANT_LIST_CACHE = {
    expires: Date.now() + SE365_PARTICIPANT_LIST_CACHE_TTL_MS,
    participants,
  };
}

function evaluateParticipantMatch(
  participant: Se365Participant,
  teamName: string
): ParticipantMatch | null {
  const name = participantName(participant);
  if (!name) return null;
  if (hasBadVariantText(name)) return null;

  const preferred = getPreferredTeamName(teamName);
  const normalizedParticipant = normalizeName(name);

  const aliases = unique(
    expandTeamAliases(preferred)
      .map((alias) => normalizeName(alias))
      .filter(Boolean)
  );

  if (!aliases.length) return null;

  if (aliases.includes(normalizedParticipant)) {
    return { participant, score: 100 };
  }

  const participantTokens = splitTokens(name);
  const participantStrongTokens = strongAliasTokens(name);
  let best: ParticipantMatch | null = null;

  for (const alias of aliases) {
    const aliasTokens = splitTokens(alias);
    const aliasStrong = strongAliasTokens(alias);

    if (!aliasStrong.length) continue;

    if (aliasTokens.length >= 2) {
      if (aliasStrong.length >= 2 && hasAllTokens(participantTokens, aliasStrong)) {
        const score = aliasStrong.length >= 3 ? 96 : 92;
        if (!best || score > best.score) best = { participant, score };
      }
      continue;
    }

    if (
      aliasStrong.length === 1 &&
      isDistinctiveSingleToken(aliasStrong[0]) &&
      hasWholeWord(name, aliasStrong[0])
    ) {
      const score = 84;
      if (!best || score > best.score) best = { participant, score };
    }
  }

  const preferredStrong = strongAliasTokens(preferred);
  const matchedPreferredTokens = countMatchedTokens(participantStrongTokens, preferredStrong);

  if (preferredStrong.length >= 2 && matchedPreferredTokens >= 2) {
    const score = 78 + Math.min(8, matchedPreferredTokens);
    if (!best || score > best.score) best = { participant, score };
  }

  return best && best.score >= SE365_MIN_PARTICIPANT_SCORE ? best : null;
}

function findBestParticipantMatch(
  participants: Se365Participant[],
  teamName: string
): Se365Participant | null {
  let best: ParticipantMatch | null = null;

  for (const participant of participants) {
    const match = evaluateParticipantMatch(participant, teamName);
    if (!match) continue;
    if (!best || match.score > best.score) best = match;
  }

  return best?.participant ?? null;
}

function findBestParticipantMatchDetailed(
  participants: Se365Participant[],
  teamName: string
): ParticipantMatch | null {
  let best: ParticipantMatch | null = null;

  for (const participant of participants) {
    const match = evaluateParticipantMatch(participant, teamName);
    if (!match) continue;
    if (!best || match.score > best.score) best = match;
  }

  return best;
}

async function fetchParticipantsPage(page: number): Promise<Se365Participant[] | null> {
  const base = buildBaseUrl();
  const apiKey = clean(env.se365ApiKey);

  const url = new URL(`${base}/participants`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("eventTypeId", SE365_EVENT_TYPE_ID);
  url.searchParams.set("perPage", String(SE365_PARTICIPANTS_PER_PAGE));
  url.searchParams.set("page", String(page));

  const response = await fetchJsonText(url.toString());

  if (!response.ok) {
    console.log("[SE365] participants non-200 response", {
      page,
      status: response.status,
      body: response.body.slice(0, 500),
    });
    return null;
  }

  try {
    const parsed = response.body ? (JSON.parse(response.body) as Se365ParticipantsResponse) : null;
    const pageItems = extractParticipants(parsed);

    console.log("[SE365] participants page", {
      page,
      count: pageItems.length,
      sample: pageItems.slice(0, 5).map(summarizeParticipant),
    });

    return pageItems;
  } catch {
    console.log("[SE365] participants invalid JSON", {
      page,
      body: response.body.slice(0, 500),
    });
    return null;
  }
}

async function resolveParticipantsForTeams(
  homeTeamName: string,
  awayTeamName: string,
  deadlineAt: number
): Promise<ResolveParticipantsResult> {
  const cachedHome = getCachedTeamParticipant(homeTeamName);
  const cachedAway = getCachedTeamParticipant(awayTeamName);

  if (cachedHome && cachedAway) {
    return {
      homeParticipant: cachedHome,
      awayParticipant: cachedAway,
      participantsSource: "team_cache",
      pagesScanned: 0,
      scannedCount: 0,
    };
  }

  const cachedParticipants = getCachedParticipantList();
  if (cachedParticipants?.length) {
    const homeFromList = cachedHome ?? findBestParticipantMatch(cachedParticipants, homeTeamName);
    const awayFromList = cachedAway ?? findBestParticipantMatch(cachedParticipants, awayTeamName);

    if (homeFromList) setCachedTeamParticipant(homeTeamName, homeFromList);
    if (awayFromList) setCachedTeamParticipant(awayTeamName, awayFromList);

    return {
      homeParticipant: homeFromList,
      awayParticipant: awayFromList,
      participantsSource: "list_cache",
      pagesScanned: 0,
      scannedCount: cachedParticipants.length,
    };
  }

  const aggregated: Se365Participant[] = [];
  let homeBest: ParticipantMatch | null = null;
  let awayBest: ParticipantMatch | null = null;
  let pagesScanned = 0;
  let completedFullScan = true;

  for (
    let batchStart = 1;
    batchStart <= SE365_MAX_PARTICIPANT_PAGES;
    batchStart += SE365_PARTICIPANT_PAGE_BATCH_SIZE
  ) {
    if (!hasBudget(deadlineAt, SE365_FETCH_TIMEOUT_MS + 250)) {
      completedFullScan = false;
      break;
    }

    const pages: number[] = [];
    for (
      let page = batchStart;
      page < batchStart + SE365_PARTICIPANT_PAGE_BATCH_SIZE &&
      page <= SE365_MAX_PARTICIPANT_PAGES;
      page += 1
    ) {
      pages.push(page);
    }

    const batchResults = await Promise.all(
      pages.map(async (page) => ({
        page,
        items: await fetchParticipantsPage(page),
      }))
    );

    for (const batchResult of batchResults) {
      pagesScanned = Math.max(pagesScanned, batchResult.page);

      if (batchResult.items == null) {
        completedFullScan = false;
        continue;
      }

      if (!batchResult.items.length) continue;

      aggregated.push(...batchResult.items);

      if (!homeBest) {
        const pageHomeBest = findBestParticipantMatchDetailed(batchResult.items, homeTeamName);
        if (pageHomeBest) homeBest = pageHomeBest;
      }

      if (!awayBest) {
        const pageAwayBest = findBestParticipantMatchDetailed(batchResult.items, awayTeamName);
        if (pageAwayBest) awayBest = pageAwayBest;
      }
    }

    if (homeBest?.participant) setCachedTeamParticipant(homeTeamName, homeBest.participant);
    if (awayBest?.participant) setCachedTeamParticipant(awayTeamName, awayBest.participant);

    if (homeBest && awayBest) {
      return {
        homeParticipant: homeBest.participant,
        awayParticipant: awayBest.participant,
        participantsSource: "live_scan",
        pagesScanned,
        scannedCount: aggregated.length,
      };
    }
  }

  if (aggregated.length) setCachedParticipantList(aggregated);

  const finalHome = homeBest?.participant ?? findBestParticipantMatch(aggregated, homeTeamName);
  const finalAway = awayBest?.participant ?? findBestParticipantMatch(aggregated, awayTeamName);

  if (finalHome) setCachedTeamParticipant(homeTeamName, finalHome);
  if (finalAway) setCachedTeamParticipant(awayTeamName, finalAway);

  return {
    homeParticipant: finalHome,
    awayParticipant: finalAway,
    participantsSource: completedFullScan ? "live_scan" : "live_scan_partial",
    pagesScanned,
    scannedCount: aggregated.length,
  };
}

async function fetchParticipantEvents(
  participantIdValue: string,
  deadlineAt: number
): Promise<Se365Event[]> {
  if (!participantIdValue) return [];

  const out: Se365Event[] = [];
  const base = buildBaseUrl();
  const apiKey = clean(env.se365ApiKey);

  for (let page = 1; page <= SE365_MAX_EVENT_PAGES; page += 1) {
    if (!hasBudget(deadlineAt, SE365_FETCH_TIMEOUT_MS + 200)) break;

    const url = new URL(`${base}/events/participant/${encodeURIComponent(participantIdValue)}`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("perPage", String(SE365_EVENTS_PER_PAGE));
    url.searchParams.set("page", String(page));

    const response = await fetchJsonText(url.toString());

    if (!response.ok) {
      if (page === 1) return [];
      break;
    }

    try {
      const parsed = response.body ? (JSON.parse(response.body) as Se365EventsResponse) : null;
      const pageItems = extractEvents(parsed);

      if (!pageItems.length) break;

      out.push(...pageItems);

      if (pageItems.length < SE365_EVENTS_PER_PAGE) break;
    } catch {
      if (page === 1) return [];
      break;
    }
  }

  return out;
}

async function fetchCombinedEvents(
  homeParticipantIdValue: string,
  awayParticipantIdValue: string,
  deadlineAt: number
): Promise<Se365Event[]> {
  const [homeEvents, awayEvents] = await Promise.all([
    fetchParticipantEvents(homeParticipantIdValue, deadlineAt),
    fetchParticipantEvents(awayParticipantIdValue, deadlineAt),
  ]);

  return dedupeEvents([...homeEvents, ...awayEvents]);
}

async function fetchTicketsForEvent(eventIdValue: string): Promise<Se365Ticket[]> {
  if (!eventIdValue) return [];

  const base = buildBaseUrl();
  const apiKey = clean(env.se365ApiKey);

  const url = new URL(`${base}/tickets/${encodeURIComponent(eventIdValue)}`);
  url.searchParams.set("apiKey", apiKey);

  const response = await fetchJsonText(url.toString());
  if (!response.ok) return [];

  try {
    const parsed = response.body ? (JSON.parse(response.body) as Se365TicketsResponse) : null;
    return extractTickets(parsed);
  } catch {
    return [];
  }
}

function dedupeEvents(events: Se365Event[]): Se365Event[] {
  return Array.from(
    new Map(events.map((event) => [`${eventId(event)}|${eventName(event)}|${eventDate(event)}`, event])).values()
  );
}

function eventMatchScore(
  event: Se365Event,
  input: TicketResolveInput,
  homeParticipantId?: string | null,
  awayParticipantId?: string | null
): ScoredEvent {
  let score = 0;

  if (eventHasBadVariant(event)) {
    return {
      ev: event,
      score: -1000,
      exactTeams: false,
      sameDay: false,
    };
  }

  const homeNameText = eventHomeName(event);
  const awayNameText = eventAwayName(event);
  const titleText = eventName(event);
  const participants = eventParticipantNames(event);

  const participantIds = new Set(
    (Array.isArray(event.participants) ? event.participants : [])
      .map((participant) => clean(participant.id))
      .filter(Boolean)
  );

  const participantHomeScore = participants.reduce(
    (best, name) => Math.max(best, scoreNameAgainstTeam(name, input.homeName)),
    0
  );

  const participantAwayScore = participants.reduce(
    (best, name) => Math.max(best, scoreNameAgainstTeam(name, input.awayName)),
    0
  );

  const homeScore = Math.max(scoreNameAgainstTeam(homeNameText, input.homeName), participantHomeScore);
  const awayScore = Math.max(scoreNameAgainstTeam(awayNameText, input.awayName), participantAwayScore);

  const titleHomeScore = scoreTitleAgainstTeam(titleText, input.homeName);
  const titleAwayScore = scoreTitleAgainstTeam(titleText, input.awayName);

  const exactTeams = homeScore >= 95 && awayScore >= 95;
  const looseTeams =
    Math.max(homeScore, titleHomeScore) >= 70 &&
    Math.max(awayScore, titleAwayScore) >= 70;

  if (homeParticipantId && participantIds.has(homeParticipantId)) score += 18;
  if (awayParticipantId && participantIds.has(awayParticipantId)) score += 18;

  if (exactTeams) score += 48;
  else if (looseTeams) score += 24;
  else score -= 1000;

  if (homeScore >= 70 && awayScore >= 70) score += 10;
  if (titleHomeScore >= 70 && titleAwayScore >= 70) score += 4;

  const kickoff = safeDate(input.kickoffIso);
  const eventDt = safeDate(eventDate(event));
  let sameDay = false;

  if (kickoff && eventDt) {
    const diff = absDays(kickoff, eventDt);

    if (diff === 0) {
      score += 24;
      sameDay = true;
    } else if (diff === 1) {
      score += 8;
    } else if (diff === 2) {
      score += 2;
    } else {
      score -= 1000;
    }
  } else {
    score -= 15;
  }

  if (clean(eventUrl(event))) score += 8;

  if (clean(eventTournamentName(event)) && clean(input.leagueName)) {
    const tournament = normalizeName(eventTournamentName(event));
    const league = normalizeName(clean(input.leagueName));

    if (tournament.includes(league) || league.includes(tournament)) {
      score += 6;
    }
  }

  return {
    ev: event,
    score,
    exactTeams,
    sameDay,
  };
}

function pickBestEvent(
  events: Se365Event[],
  input: TicketResolveInput,
  homeParticipantId?: string | null,
  awayParticipantId?: string | null
): ScoredEvent | null {
  return (
    dedupeEvents(events)
      .map((event) => eventMatchScore(event, input, homeParticipantId, awayParticipantId))
      .filter((x) => x.score >= SE365_MIN_EVENT_SCORE)
      .sort((a, b) => {
        if (a.exactTeams !== b.exactTeams) return a.exactTeams ? -1 : 1;
        if (a.sameDay !== b.sameDay) return a.sameDay ? -1 : 1;
        return b.score - a.score;
      })[0] ?? null
  );
}

function bestTicketPriceText(tickets: Se365Ticket[]): string | null {
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

  return priced[0]?.ticket ? ticketPriceText(priced[0].ticket) : null;
}

function buildEventOutbound(event: Se365Event, input: TicketResolveInput): EventOutbound {
  const apiEventUrl = eventUrl(event);
  const trackedApiUrl = appendAffiliate(apiEventUrl);

  if (trackedApiUrl) {
    return {
      url: trackedApiUrl,
      urlQuality: getSe365UrlQuality(trackedApiUrl),
      isSearchFallback: false,
    };
  }

  const matchedEventId = eventId(event);
  if (matchedEventId) {
    const guessed = appendAffiliate(buildPublicEventUrlFromId(matchedEventId));

    if (guessed) {
      return {
        url: guessed,
        urlQuality: "event",
        isSearchFallback: false,
      };
    }
  }

  const fallback = buildTrackedSearchFallback(input);

  return {
    url: fallback ?? "",
    urlQuality: "search",
    isSearchFallback: true,
  };
}

function buildFallbackCandidate(
  input: TicketResolveInput,
  homeName: string,
  awayName: string
): TicketCandidate | null {
  const fallback = buildTrackedSearchFallback(input);
  if (!fallback) return null;

  return {
    provider: "sportsevents365",
    exact: false,
    score: 20,
    rawScore: 20,
    url: fallback,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: null,
    reason: "search_fallback",
    urlQuality: "search",
  };
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  const startedAt = Date.now();
  const deadlineAt = getDeadline(startedAt);

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

  const cachedEvent = getCachedEvent(input);

  if (cachedEvent) {
    const tickets = await fetchTicketsForEvent(eventId(cachedEvent));
    const outbound = buildEventOutbound(cachedEvent, input);

    if (outbound.url) {
      const baseScored = eventMatchScore(cachedEvent, input);
      const exact =
        !outbound.isSearchFallback &&
        outbound.urlQuality === "event" &&
        baseScored.exactTeams &&
        baseScored.sameDay;

      return {
        provider: "sportsevents365",
        exact,
        score: baseScored.score,
        rawScore: baseScored.score,
        url: outbound.url,
        title: `Tickets: ${homeName} vs ${awayName}`,
        priceText: bestTicketPriceText(tickets),
        reason: outbound.isSearchFallback ? "search_fallback" : exact ? "exact_event" : "partial_match",
        urlQuality: outbound.urlQuality,
      };
    }
  }

  const participantResolution = await resolveParticipantsForTeams(homeName, awayName, deadlineAt);

  console.log("[SE365] participant resolution", {
    home: participantResolution.homeParticipant
      ? summarizeParticipant(participantResolution.homeParticipant)
      : null,
    away: participantResolution.awayParticipant
      ? summarizeParticipant(participantResolution.awayParticipant)
      : null,
    source: participantResolution.participantsSource,
    pagesScanned: participantResolution.pagesScanned,
    scannedCount: participantResolution.scannedCount,
  });

  if (!participantResolution.homeParticipant || !participantResolution.awayParticipant) {
    return buildFallbackCandidate(input, homeName, awayName);
  }

  if (!hasBudget(deadlineAt, SE365_FETCH_TIMEOUT_MS + 250)) {
    return buildFallbackCandidate(input, homeName, awayName);
  }

  const homeParticipantId = participantId(participantResolution.homeParticipant);
  const awayParticipantId = participantId(participantResolution.awayParticipant);

  const events = await fetchCombinedEvents(homeParticipantId, awayParticipantId, deadlineAt);

  if (!events.length) {
    return buildFallbackCandidate(input, homeName, awayName);
  }

  const best = pickBestEvent(events, input, homeParticipantId, awayParticipantId);

  if (!best) {
    return buildFallbackCandidate(input, homeName, awayName);
  }

  setCachedEvent(input, best.ev);

  const tickets = await fetchTicketsForEvent(eventId(best.ev));
  const outbound = buildEventOutbound(best.ev, input);

  if (!outbound.url) return null;

  const exact =
    !outbound.isSearchFallback &&
    outbound.urlQuality === "event" &&
    best.exactTeams &&
    best.sameDay;

  console.log("[SE365] matched event", {
    best: summarizeEvent(best.ev),
    exact,
    urlQuality: outbound.urlQuality,
    usedSearchFallback: outbound.isSearchFallback,
    ticketCount: tickets.length,
    bestTicket: tickets[0] ? summarizeTicket(tickets[0]) : null,
    elapsedMs: Date.now() - startedAt,
    resolvedUrl: outbound.url,
  });

  return {
    provider: "sportsevents365",
    exact,
    score: best.score,
    rawScore: best.score,
    url: outbound.url,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: bestTicketPriceText(tickets),
    reason: outbound.isSearchFallback ? "search_fallback" : exact ? "exact_event" : "partial_match",
    urlQuality: outbound.urlQuality,
  };
      }
