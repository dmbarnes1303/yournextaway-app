// se365.ts

import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

const API_BASE = String(env.se365BaseUrl ?? "").replace(/\/+$/, "");
const PUBLIC_BASE = "https://www.sportsevents365.com";
const FOOTBALL_EVENT_TYPE_ID = "1000";

const PARTICIPANT_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const EVENT_CACHE_TTL_MS = 1000 * 60 * 30;
const TICKET_CACHE_TTL_MS = 1000 * 60 * 10;

type CacheEntry<T> = {
  expires: number;
  value: T;
};

type CacheRead<T> = {
  hit: boolean;
  value: T | null;
};

type FetchResult = {
  ok: boolean;
  status: number;
  json: any | null;
  bodyPreview: string;
};

type Participant = {
  id: string;
  name: string;
  raw: any;
  score: number;
  source: string;
};

type EventCandidate = {
  id: string;
  name: string;
  raw: any;
  score: number;
  source: string;
};

type TicketSummary = {
  hasTickets: boolean;
  priceText: string | null;
  raw: any;
};

const PARTICIPANT_POOL_CACHE = new Map<string, CacheEntry<any[]>>();
const PARTICIPANT_LOOKUP_CACHE = new Map<string, CacheEntry<Participant[]>>();
const EVENTS_BY_PARTICIPANT_CACHE = new Map<string, CacheEntry<EventCandidate[]>>();
const TICKETS_CACHE = new Map<string, CacheEntry<TicketSummary | null>>();

const KNOWN_SE365_PARTICIPANT_IDS: Record<string, { id: string; name: string }> = {
  sporting: { id: "1512", name: "Sporting Club Portugal (Lisbon)" },
  "sporting-cp": { id: "1512", name: "Sporting Club Portugal (Lisbon)" },
  "sporting-lisbon": { id: "1512", name: "Sporting Club Portugal (Lisbon)" },
  "sporting-clube-de-portugal": { id: "1512", name: "Sporting Club Portugal (Lisbon)" },
  benfica: { id: "1499", name: "SL Benfica" },
  "sl-benfica": { id: "1499", name: "SL Benfica" },
  porto: { id: "1500", name: "FC Porto" },
  "fc-porto": { id: "1500", name: "FC Porto" },

  inter: { id: "1760", name: "Inter" },
  "inter-milan": { id: "1760", name: "Inter" },
  internazionale: { id: "1760", name: "Inter" },
  "hellas-verona": { id: "3899", name: "Hellas Verona" },
  milan: { id: "1765", name: "AC Milan" },
  "ac-milan": { id: "1765", name: "AC Milan" },
  juventus: { id: "1764", name: "Juventus FC" },
  roma: { id: "1757", name: "AS Roma" },
  lazio: { id: "1758", name: "SS Lazio" },
  napoli: { id: "1759", name: "SSC Napoli" },

  "real-madrid": { id: "1385", name: "Real Madrid" },
  barcelona: { id: "1013", name: "FC Barcelona" },
  "fc-barcelona": { id: "1013", name: "FC Barcelona" },
  "atletico-madrid": { id: "1386", name: "Atletico Madrid" },
  "athletic-club": { id: "1520", name: "Athletic Club Bilbao" },
  "athletic-bilbao": { id: "1520", name: "Athletic Club Bilbao" },
  "real-sociedad": { id: "1519", name: "Real Sociedad" },
  "real-betis": { id: "1527", name: "Real Betis Balompie" },

  "bayern-munich": { id: "1182", name: "Bayern Munich" },
  "bayer-leverkusen": { id: "1187", name: "Bayer Leverkusen" },
  "borussia-dortmund": { id: "1183", name: "Borussia Dortmund" },
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function stripAccents(value: unknown): string {
  return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: unknown): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bfootball\b/g, " ")
    .replace(/\bsoccer\b/g, " ")
    .replace(/\bclub\b/g, " ")
    .replace(/\bfc\b/g, " ")
    .replace(/\bcf\b/g, " ")
    .replace(/\bafc\b/g, " ")
    .replace(/\bsc\b/g, " ")
    .replace(/\bcp\b/g, " ")
    .replace(/\bss\b/g, " ")
    .replace(/\bas\b/g, " ")
    .replace(/\bac\b/g, " ")
    .replace(/\bsl\b/g, " ")
    .replace(/\bsv\b/g, " ")
    .replace(/\bsk\b/g, " ")
    .replace(/\bjk\b/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\bda\b/g, " ")
    .replace(/\bdo\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\bbalompie\b/g, "betis")
    .replace(/\bbalompié\b/g, "betis")
    .replace(/\bmunchen\b/g, "munich")
    .replace(/\bmuenchen\b/g, "munich")
    .replace(/\bmönchengladbach\b/g, "monchengladbach")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: unknown): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function slug(value: unknown): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function aliasesFor(name: string): string[] {
  const preferred = getPreferredTeamName(name);
  const baseAliases = [name, preferred, ...expandTeamAliases(name), ...expandTeamAliases(preferred)];
  const extra = new Set<string>();

  for (const alias of baseAliases) {
    const n = normalize(alias);
    if (!n) continue;

    extra.add(n);
    extra.add(n.replace(/\blisbon\b/g, "portugal").trim());
    extra.add(n.replace(/\bportugal\b/g, "lisbon").trim());
    extra.add(n.replace(/\bclube\b/g, "").trim());

    const parts = n.split(" ").filter(Boolean);
    if (parts.length > 1) {
      extra.add(parts[0]);
      extra.add(parts.slice(0, 2).join(" "));
    }
  }

  return Array.from(new Set([...baseAliases.map(normalize), ...extra])).filter(Boolean);
}

function scoreAgainstAliases(value: string, aliases: string[]): number {
  const raw = normalize(value);
  const rawCompact = compact(value);

  if (!raw || !rawCompact) return 0;

  let best = 0;

  for (const alias of aliases) {
    const aliasNorm = normalize(alias);
    const aliasCompact = compact(aliasNorm);
    if (!aliasNorm || !aliasCompact) continue;

    if (raw === aliasNorm || rawCompact === aliasCompact) best = Math.max(best, 100);
    else if (raw.includes(aliasNorm) || rawCompact.includes(aliasCompact)) best = Math.max(best, 92);
    else if (aliasNorm.includes(raw) || aliasCompact.includes(rawCompact)) best = Math.max(best, 82);
    else {
      const rawTokens = new Set(raw.split(" ").filter(Boolean));
      const aliasTokens = aliasNorm.split(" ").filter(Boolean);
      const matched = aliasTokens.filter((token) => rawTokens.has(token)).length;

      if (aliasTokens.length > 0) {
        best = Math.max(best, Math.round((matched / aliasTokens.length) * 72));
      }
    }
  }

  return best;
}

function readCache<T>(map: Map<string, CacheEntry<T>>, key: string): CacheRead<T> {
  const entry = map.get(key);
  if (!entry) return { hit: false, value: null };

  if (Date.now() > entry.expires) {
    map.delete(key);
    return { hit: false, value: null };
  }

  return { hit: true, value: entry.value };
}

function setCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttl: number): void {
  map.set(key, {
    expires: Date.now() + ttl,
    value,
  });
}

function buildHeaders(): Record<string, string> {
  const username = clean(env.se365HttpUsername);
  const password = clean(env.se365ApiPassword);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (username && password) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  return headers;
}

function makeApiUrl(path: string): URL {
  const url = new URL(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  const apiKey = clean(env.se365ApiKey);
  if (apiKey) url.searchParams.set("apiKey", apiKey);
  return url;
}

async function fetchJson(url: URL): Promise<FetchResult> {
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: buildHeaders(),
    });

    const body = await res.text().catch(() => "");
    const bodyPreview = body.slice(0, 700);

    let json: any = null;
    try {
      json = body ? JSON.parse(body) : null;
    } catch {
      json = null;
    }

    console.log("[SE365] fetch", {
      url: url.toString(),
      status: res.status,
      ok: res.ok,
      bodyPreview,
    });

    return { ok: res.ok, status: res.status, json, bodyPreview };
  } catch (error) {
    console.log("[SE365] fetch error", {
      url: url.toString(),
      message: error instanceof Error ? error.message : String(error),
    });

    return { ok: false, status: 0, json: null, bodyPreview: "" };
  }
}

function unwrap(json: any): any {
  return json?.data ?? json?.result ?? json?.results ?? json;
}

function extractArray(json: any, keys: string[]): any[] {
  if (!json) return [];

  const data = unwrap(json);
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(json?.[key])) return json[key];
  }

  return [];
}

function participantId(value: any): string {
  return clean(value?.id ?? value?.participantId ?? value?.participant_id);
}

function participantName(value: any): string {
  return clean(
    value?.name ?? value?.title ?? value?.caption ?? value?.participantName ?? value?.participant_name
  );
}

function eventId(value: any): string {
  return clean(value?.id ?? value?.eventId ?? value?.event_id);
}

function eventName(value: any): string {
  return clean(
    value?.name ??
      value?.title ??
      value?.caption ??
      value?.eventName ??
      value?.event_name ??
      value?.description
  );
}

function eventHome(value: any): string {
  return clean(
    value?.homeTeam?.name ??
      value?.home?.name ??
      value?.homeName ??
      value?.home_team_name ??
      value?.home_team
  );
}

function eventAway(value: any): string {
  return clean(
    value?.awayTeam?.name ??
      value?.away?.name ??
      value?.awayName ??
      value?.away_team_name ??
      value?.away_team
  );
}

function eventParticipants(value: any): string[] {
  if (!Array.isArray(value?.participants)) return [];
  return value.participants.map((participant: any) => participantName(participant)).filter(Boolean);
}

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}/${date.getFullYear()}`;
}

function getDateRange(kickoffIso: string): { from: string; to: string } {
  const base = new Date(kickoffIso);

  const from = new Date(base);
  from.setDate(from.getDate() - 4);

  const to = new Date(base);
  to.setDate(to.getDate() + 4);

  return {
    from: formatDate(from),
    to: formatDate(to),
  };
}

async function fetchParticipantPage(route: string, page: number): Promise<any[]> {
  const url = makeApiUrl(route);
  url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
  url.searchParams.set("perPage", "100");
  url.searchParams.set("page", String(page));

  const result = await fetchJson(url);
  const participants = extractArray(result.json, ["participants", "items", "data", "results"]);

  console.log("[SE365] participants page", {
    route,
    page,
    status: result.status,
    count: participants.length,
    sample: participants.slice(0, 5).map((participant) => ({
      id: participantId(participant),
      name: participantName(participant),
    })),
  });

  return participants;
}

async function fetchParticipantsForSearch(): Promise<any[]> {
  const cacheKey = "participants:football:paged:v4";
  const cached = readCache(PARTICIPANT_POOL_CACHE, cacheKey);
  if (cached.hit) return cached.value ?? [];

  const routes = ["/participants", "/participants/top"];
  const all: any[] = [];

  for (const route of routes) {
    const seenPageSignatures = new Set<string>();

    for (let page = 1; page <= 25; page += 1) {
      const participants = await fetchParticipantPage(route, page);
      if (participants.length === 0) break;

      const signature = participants
        .slice(0, 10)
        .map((participant) => participantId(participant))
        .filter(Boolean)
        .join("|");

      if (signature && seenPageSignatures.has(signature)) break;
      if (signature) seenPageSignatures.add(signature);

      all.push(...participants);
      if (participants.length < 100) break;
    }
  }

  const deduped = new Map<string, any>();
  for (const participant of all) {
    const id = participantId(participant);
    if (id && !deduped.has(id)) deduped.set(id, participant);
  }

  const value = Array.from(deduped.values());
  setCache(PARTICIPANT_POOL_CACHE, cacheKey, value, PARTICIPANT_CACHE_TTL_MS);
  return value;
}

function knownParticipantsForTeam(teamName: string): Participant[] {
  const aliases = aliasesFor(teamName);
  const candidateKeys = new Set<string>([slug(teamName)]);

  for (const alias of aliases) candidateKeys.add(slug(alias));

  const out: Participant[] = [];

  for (const key of candidateKeys) {
    const known = KNOWN_SE365_PARTICIPANT_IDS[key];
    if (!known?.id) continue;

    out.push({
      id: known.id,
      name: known.name,
      raw: { id: known.id, name: known.name, source: "known_se365_participant_ids" },
      score: 100,
      source: "known",
    });
  }

  const deduped = new Map<string, Participant>();
  for (const item of out) {
    if (!deduped.has(item.id)) deduped.set(item.id, item);
  }

  return Array.from(deduped.values());
}

async function findParticipantCandidates(teamName: string): Promise<Participant[]> {
  const lookupKey = `participant-candidates:${slug(teamName)}:v4`;
  const cached = readCache(PARTICIPANT_LOOKUP_CACHE, lookupKey);
  if (cached.hit) return cached.value ?? [];

  const known = knownParticipantsForTeam(teamName);
  const aliases = aliasesFor(teamName);
  const participants = await fetchParticipantsForSearch();

  const ranked = participants
    .map((participant) => ({
      id: participantId(participant),
      name: participantName(participant),
      raw: participant,
      score: scoreAgainstAliases(participantName(participant), aliases),
      source: "participant_pool",
    }))
    .filter((entry) => entry.id && entry.name && entry.score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const merged = new Map<string, Participant>();
  for (const participant of [...known, ...ranked]) {
    if (!merged.has(participant.id)) merged.set(participant.id, participant);
  }

  const value = Array.from(merged.values());

  console.log("[SE365] participant candidates", {
    teamName,
    aliases,
    selected: value.map((x) => ({ id: x.id, name: x.name, score: x.score, source: x.source })),
  });

  setCache(PARTICIPANT_LOOKUP_CACHE, lookupKey, value, PARTICIPANT_CACHE_TTL_MS);
  return value;
}

function extractPossiblePublicUrls(event: any): string[] {
  return [
    event?.eventUrl,
    event?.pageUrl,
    event?.websiteUrl,
    event?.publicUrl,
    event?.url,
    event?.link,
    event?.affiliateUrl,
    event?.seo?.url,
    event?.seo?.canonical,
  ]
    .map(clean)
    .filter(Boolean);
}

async function fetchEventsByParticipant(
  participant: Participant,
  kickoffIso: string
): Promise<EventCandidate[]> {
  const { from, to } = getDateRange(kickoffIso);
  const cacheKey = `events:${participant.id}:${from}:${to}`;

  const cached = readCache(EVENTS_BY_PARTICIPANT_CACHE, cacheKey);
  if (cached.hit) return cached.value ?? [];

  const url = makeApiUrl(`/events/participant/${participant.id}`);
  url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
  url.searchParams.set("dateFrom", from);
  url.searchParams.set("dateTo", to);
  url.searchParams.set("perPage", "100");

  const result = await fetchJson(url);
  const events = extractArray(result.json, ["events", "items", "data", "results"]);

  const mapped = events
    .map((event) => ({
      id: eventId(event),
      name: eventName(event),
      raw: event,
      score: 0,
      source: `participant:${participant.id}:${participant.name}`,
    }))
    .filter((event) => event.id);

  console.log("[SE365] events by participant", {
    participantId: participant.id,
    participantName: participant.name,
    status: result.status,
    from,
    to,
    count: mapped.length,
    sample: mapped.slice(0, 8).map((event) => ({
      id: event.id,
      name: event.name,
      home: eventHome(event.raw),
      away: eventAway(event.raw),
      participants: eventParticipants(event.raw),
      urlFields: extractPossiblePublicUrls(event.raw),
    })),
  });

  setCache(EVENTS_BY_PARTICIPANT_CACHE, cacheKey, mapped, EVENT_CACHE_TTL_MS);
  return mapped;
}

function scoreEvent(event: EventCandidate, homeName: string, awayName: string): number {
  const homeAliases = aliasesFor(homeName);
  const awayAliases = aliasesFor(awayName);

  const fields = [event.name, eventHome(event.raw), eventAway(event.raw), ...eventParticipants(event.raw)].filter(Boolean);

  const homeScore = Math.max(...fields.map((field) => scoreAgainstAliases(field, homeAliases)), 0);
  const awayScore = Math.max(...fields.map((field) => scoreAgainstAliases(field, awayAliases)), 0);

  if (homeScore < 55 || awayScore < 55) return 0;

  let score = homeScore + awayScore;
  score += scoreAgainstAliases(eventHome(event.raw), homeAliases) >= 55 ? 25 : 0;
  score += scoreAgainstAliases(eventAway(event.raw), awayAliases) >= 55 ? 25 : 0;
  if (event.source.startsWith("participant:")) score += 10;

  return score;
}

function pickBestEvent(
  events: EventCandidate[],
  homeName: string,
  awayName: string
): EventCandidate | null {
  const ranked = events
    .map((event) => ({ ...event, score: scoreEvent(event, homeName, awayName) }))
    .filter((event) => event.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log("[SE365] event scoring", {
    homeName,
    awayName,
    count: ranked.length,
    top: ranked.slice(0, 8).map((event) => ({
      id: event.id,
      name: event.name,
      score: event.score,
      source: event.source,
      home: eventHome(event.raw),
      away: eventAway(event.raw),
      participants: eventParticipants(event.raw),
    })),
  });

  return ranked[0] ?? null;
}

function extractTickets(json: any): any[] {
  return extractArray(json, ["tickets", "items", "data", "results", "ticketOptions"]);
}

function priceFromTicket(ticket: any): number | null {
  const raw =
    ticket?.ticketPrice ??
    ticket?.ticket_price ??
    ticket?.price ??
    ticket?.salePrice ??
    ticket?.minPrice ??
    ticket?.amount ??
    ticket?.totalPrice ??
    ticket?.ticket?.price ??
    null;

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function currencyFromTicket(ticket: any): string {
  return clean(
    ticket?.currency ?? ticket?.priceCurrency ?? ticket?.ticketCurrency ?? ticket?.ticket?.currency ?? "GBP"
  ).toUpperCase();
}

function formatPrice(amount: number, currency: string): string {
  if (currency === "GBP") return `£${amount}`;
  if (currency === "EUR") return `€${amount}`;
  if (currency === "USD") return `$${amount}`;
  return `${currency || "GBP"} ${amount}`;
}

function summarizeTickets(json: any): TicketSummary {
  const tickets = extractTickets(json);

  const priced = tickets
    .map((ticket) => ({
      price: priceFromTicket(ticket),
      currency: currencyFromTicket(ticket),
    }))
    .filter((entry) => entry.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price));

  const cheapest = priced[0] ?? null;

  return {
    hasTickets: tickets.length > 0,
    priceText:
      cheapest?.price != null
        ? formatPrice(Number(cheapest.price), cheapest.currency)
        : tickets.length > 0
          ? "View live price"
          : null,
    raw: json,
  };
}

async function fetchTickets(eventIdValue: string): Promise<TicketSummary | null> {
  const id = clean(eventIdValue);
  if (!id) return null;

  const cacheKey = `tickets:${id}`;
  const cached = readCache(TICKETS_CACHE, cacheKey);
  if (cached.hit) return cached.value;

  const url = makeApiUrl(`/tickets/${id}`);
  const result = await fetchJson(url);

  if (!result.ok) {
    setCache(TICKETS_CACHE, cacheKey, null, TICKET_CACHE_TTL_MS);
    return null;
  }

  const summary = summarizeTickets(result.json);

  console.log("[SE365] tickets", {
    eventId: id,
    status: result.status,
    hasTickets: summary.hasTickets,
    priceText: summary.priceText,
  });

  setCache(TICKETS_CACHE, cacheKey, summary, TICKET_CACHE_TTL_MS);
  return summary;
}

function buildPublicUrl(event: any, id: string): string {
  const affiliateId = clean(env.se365AffiliateId);

  const possibleUrls = [
    event?.eventUrl,
    event?.pageUrl,
    event?.websiteUrl,
    event?.publicUrl,
    event?.url,
    event?.link,
    event?.affiliateUrl,
    event?.seo?.url,
    event?.seo?.canonical,
  ]
    .map(clean)
    .filter(Boolean);

  for (const value of possibleUrls) {
    try {
      const parsed = new URL(value.startsWith("http") ? value : `${PUBLIC_BASE}${value}`);
      const host = parsed.hostname.toLowerCase();

      if (host.includes("sportsevents365.com")) {
        if (affiliateId) parsed.searchParams.set("a_aid", affiliateId);
        return parsed.toString();
      }
    } catch {
      // ignore bad URL
    }
  }

  const url = new URL(`${PUBLIC_BASE}/event/${id}`);
  if (affiliateId) url.searchParams.set("a_aid", affiliateId);

  return url.toString();
}

async function resolveEventFromParticipants(
  homeName: string,
  awayName: string,
  kickoffIso: string
): Promise<EventCandidate | null> {
  const [homeCandidates, awayCandidates] = await Promise.all([
    findParticipantCandidates(homeName),
    findParticipantCandidates(awayName),
  ]);

  const participantMap = new Map<string, Participant>();

  for (const participant of [...homeCandidates, ...awayCandidates]) {
    if (!participantMap.has(participant.id)) participantMap.set(participant.id, participant);
  }

  const participants = Array.from(participantMap.values());

  if (participants.length === 0) return null;

  const eventLists = await Promise.all(
    participants.map((participant) => fetchEventsByParticipant(participant, kickoffIso))
  );

  const eventMap = new Map<string, EventCandidate>();

  for (const event of eventLists.flat()) {
    if (!eventMap.has(event.id)) eventMap.set(event.id, event);
  }

  return pickBestEvent(Array.from(eventMap.values()), homeName, awayName);
}

export async function resolveSe365Candidate(input: TicketResolveInput): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) return null;

  const homeName = clean(input.homeName);
  const awayName = clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);

  if (!API_BASE || !homeName || !awayName || !kickoffIso) return null;

  console.log("[SE365] resolve start", {
    homeName,
    awayName,
    kickoffIso,
    apiBase: API_BASE,
  });

  const bestEvent = await resolveEventFromParticipants(homeName, awayName, kickoffIso);

  if (!bestEvent) {
    console.log("[SE365] no usable event found", { homeName, awayName, kickoffIso });
    return null;
  }

  const ticketSummary = await fetchTickets(bestEvent.id);
  const publicUrl = buildPublicUrl(bestEvent.raw, bestEvent.id);

  const candidate: TicketCandidate = {
    provider: "sportsevents365",
    exact: true,
    score: ticketSummary?.hasTickets ? 130 : 105,
    rawScore: ticketSummary?.hasTickets ? 130 : 105,
    url: publicUrl,
    title: bestEvent.name || `${homeName} vs ${awayName}`,
    priceText: ticketSummary?.priceText ?? "View live price",
    reason: "exact_event",
    urlQuality: "event",
  };

  console.log("[SE365] candidate accepted", {
    eventId: bestEvent.id,
    title: candidate.title,
    url: candidate.url,
    hasTickets: Boolean(ticketSummary?.hasTickets),
    priceText: candidate.priceText,
    source: bestEvent.source,
  });

  return candidate;
  }
