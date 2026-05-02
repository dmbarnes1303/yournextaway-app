import crypto from "node:crypto";

import { env, hasFtnConfig } from "../../lib/env.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

const FTN_FETCH_TIMEOUT_MS = 10000;
const FTN_BASE_PUBLIC_URL = "https://www.footballticketnet.com";
const FTN_AFFILIATE_PARAM = "aff";
const FTN_AFFILIATE_VALUE = "yournextaway";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function stripAccents(value: unknown): string {
  return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(value: unknown): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\b(fc|cf|ac|afc|sc|sk|club|the)\b/g, " ")
    .replace(/\binter milan\b/g, "inter")
    .replace(/\binternazionale\b/g, "inter")
    .replace(/\bhellas verona\b/g, "verona")
    .replace(/\bathletic bilbao\b/g, "athletic club")
    .replace(/\bceltic vigo\b/g, "celta vigo")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: unknown): string {
  return normalizeName(value).replace(/[^a-z0-9]/g, "");
}

function getAliases(value: unknown): string[] {
  const raw = clean(value);
  const preferred = clean(getPreferredTeamName(raw));

  return Array.from(
    new Set([
      raw,
      preferred,
      ...expandTeamAliases(raw),
      ...expandTeamAliases(preferred),
      normalizeName(raw),
      normalizeName(preferred),
      compact(raw),
      compact(preferred),
    ])
  )
    .map(normalizeName)
    .filter(Boolean);
}

function safeDate(value: unknown): Date | null {
  const raw = clean(value);
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDdMmYyyy(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getUTCFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function toUtcDayStart(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function absDays(a: Date, b: Date): number {
  return Math.floor(Math.abs(toUtcDayStart(a) - toUtcDayStart(b)) / 86_400_000);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildListEventsUrl(input: {
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string | null;
  includeTeamFilters: boolean;
}): string {
  const username = clean(env.ftnUsername);
  const secret = clean(env.ftnAffiliateSecret);
  const action = "list_events";
  const timestamp = Math.floor(Date.now() / 1000);
  const hash = sha256(`${username}-${action}-${timestamp}-${secret}`);

  const url = new URL(clean(env.ftnBaseUrl) || `${FTN_BASE_PUBLIC_URL}/api`);
  url.searchParams.set("action", action);
  url.searchParams.set("u", username);
  url.searchParams.set("s", hash);
  url.searchParams.set("ts", String(timestamp));

  const kickoff = safeDate(input.kickoffIso);
  if (kickoff) {
    const from = new Date(kickoff);
    from.setUTCDate(from.getUTCDate() - 7);

    const to = new Date(kickoff);
    to.setUTCDate(to.getUTCDate() + 7);

    url.searchParams.set("from_date", formatDdMmYyyy(from));
    url.searchParams.set("to_date", formatDdMmYyyy(to));
  }

  if (input.includeTeamFilters) {
    const homeName = clean(getPreferredTeamName(input.homeName));
    const awayName = clean(getPreferredTeamName(input.awayName));

    if (homeName) url.searchParams.set("home_team_name", homeName);
    if (awayName) url.searchParams.set("away_team_name", awayName);
  }

  return url.toString();
}

async function fetchText(url: string): Promise<{ ok: boolean; status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FTN_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json,text/plain,*/*" },
    });

    return {
      ok: res.ok,
      status: res.status,
      body: await res.text().catch(() => ""),
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

function parseJsonSafe(body: string): any {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function extractEvents(payload: any): any[] {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.results)) return payload.results;

  if (payload.data && Array.isArray(payload.data.events)) return payload.data.events;
  if (payload.result && Array.isArray(payload.result.events)) return payload.result.events;
  if (payload.response && Array.isArray(payload.response.events)) return payload.response.events;

  return [];
}

function eventId(ev: any): string {
  return clean(ev?.event_id ?? ev?.eventId ?? ev?.id);
}

function eventName(ev: any): string {
  return clean(ev?.event_name ?? ev?.eventName ?? ev?.name ?? ev?.title);
}

function eventDate(ev: any): string {
  return clean(ev?.event_date ?? ev?.eventDate ?? ev?.date ?? ev?.dateOfEvent ?? ev?.startDate);
}

function eventHomeName(ev: any): string {
  return clean(
    ev?.home_team_name ??
      ev?.homeTeamName ??
      ev?.home_team ??
      ev?.homeTeam?.name ??
      ev?.home?.name ??
      ev?.home
  );
}

function eventAwayName(ev: any): string {
  return clean(
    ev?.away_team_name ??
      ev?.awayTeamName ??
      ev?.away_team ??
      ev?.awayTeam?.name ??
      ev?.away?.name ??
      ev?.away
  );
}

function eventLeagueName(ev: any): string {
  return clean(ev?.league_name ?? ev?.leagueName ?? ev?.league ?? ev?.competition ?? ev?.category_name);
}

function eventUrl(ev: any): string {
  return clean(
    ev?.event_url ??
      ev?.eventUrl ??
      ev?.url ??
      ev?.link ??
      ev?.pageUrl ??
      ev?.publicUrl ??
      ev?.event_page_url
  );
}

function isSafeFtnUrl(value: string): boolean {
  try {
    const url = new URL(value.startsWith("http") ? value : `${FTN_BASE_PUBLIC_URL}${value}`);
    const host = url.hostname.toLowerCase();

    return (
      host === "footballticketnet.com" ||
      host === "www.footballticketnet.com" ||
      host === "footballticketsnet.com" ||
      host === "www.footballticketsnet.com"
    );
  } catch {
    return false;
  }
}

function appendAffiliate(urlValue: unknown): string {
  const raw = clean(urlValue);
  if (!raw || !isSafeFtnUrl(raw)) return "";

  try {
    const url = new URL(raw.startsWith("http") ? raw : `${FTN_BASE_PUBLIC_URL}${raw}`);
    url.searchParams.set(FTN_AFFILIATE_PARAM, FTN_AFFILIATE_VALUE);
    return url.toString();
  } catch {
    return "";
  }
}

function scoreNameMatch(candidate: unknown, targetAliases: string[]): number {
  const c = normalizeName(candidate);
  const cc = compact(candidate);

  if (!c || !cc) return 0;

  let best = 0;

  for (const alias of targetAliases) {
    const a = normalizeName(alias);
    const ac = compact(alias);

    if (!a || !ac) continue;

    if (c === a || cc === ac) best = Math.max(best, 100);
    else if (c.includes(a) || cc.includes(ac)) best = Math.max(best, 88);
    else if (a.includes(c) || ac.includes(cc)) best = Math.max(best, 76);
    else {
      const cTokens = new Set(c.split(" ").filter(Boolean));
      const aTokens = a.split(" ").filter(Boolean);
      const matched = aTokens.filter((token) => cTokens.has(token)).length;

      if (aTokens.length) {
        best = Math.max(best, Math.round((matched / aTokens.length) * 72));
      }
    }
  }

  return best;
}

function scoreEvent(ev: any, input: { homeName: string; awayName: string; kickoffIso: string; leagueName?: string | null }): number {
  const name = eventName(ev);
  const home = eventHomeName(ev);
  const away = eventAwayName(ev);

  const homeAliases = getAliases(input.homeName);
  const awayAliases = getAliases(input.awayName);

  const bestHome = Math.max(
    scoreNameMatch(home, homeAliases),
    scoreNameMatch(name, homeAliases)
  );

  const bestAway = Math.max(
    scoreNameMatch(away, awayAliases),
    scoreNameMatch(name, awayAliases)
  );

  if (bestHome < 65 || bestAway < 65) return -1000;

  let score = bestHome + bestAway;

  const kickoff = safeDate(input.kickoffIso);
  const evDate = safeDate(eventDate(ev));

  if (kickoff && evDate) {
    const diff = absDays(kickoff, evDate);

    if (diff === 0) score += 45;
    else if (diff === 1) score += 28;
    else if (diff <= 3) score += 18;
    else if (diff <= 7) score += 6;
    else return -1000;
  }

  const league = normalizeName(input.leagueName);
  const evLeague = normalizeName(eventLeagueName(ev));

  if (league && evLeague && (league.includes(evLeague) || evLeague.includes(league))) {
    score += 15;
  }

  if (eventUrl(ev)) score += 20;
  if (eventId(ev)) score += 5;

  return score;
}

function pickBestEvent(events: any[], input: { homeName: string; awayName: string; kickoffIso: string; leagueName?: string | null }) {
  const scored = events
    .map((ev) => ({ ev, score: scoreEvent(ev, input) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log("[FTN] event scoring", {
    homeName: input.homeName,
    awayName: input.awayName,
    leagueName: input.leagueName ?? null,
    eventsChecked: events.length,
    matched: scored.length,
    top: scored.slice(0, 8).map((x) => ({
      score: x.score,
      id: eventId(x.ev) || null,
      name: eventName(x.ev) || null,
      home: eventHomeName(x.ev) || null,
      away: eventAwayName(x.ev) || null,
      date: eventDate(x.ev) || null,
      league: eventLeagueName(x.ev) || null,
      url: eventUrl(x.ev) || null,
    })),
  });

  return scored[0] ?? null;
}

async function fetchEventsWithFallbacks(input: {
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string | null;
}): Promise<any[]> {
  const urls = [
    buildListEventsUrl({ ...input, includeTeamFilters: true }),
    buildListEventsUrl({ ...input, includeTeamFilters: false }),
  ];

  const eventMap = new Map<string, any>();

  for (const url of urls) {
    const res = await fetchText(url);

    console.log("[FTN] list_events response", {
      ok: res.ok,
      status: res.status,
      usedTeamFilters: url.includes("home_team_name=") || url.includes("away_team_name="),
      bodyPreview: res.body.slice(0, 500),
    });

    if (!res.ok) continue;

    const parsed = parseJsonSafe(res.body);
    const events = extractEvents(parsed);

    for (const event of events) {
      const key = eventId(event) || eventUrl(event) || eventName(event);
      if (key && !eventMap.has(key)) eventMap.set(key, event);
    }
  }

  return Array.from(eventMap.values());
}

export async function resolveFtnCandidate(input: any) {
  if (!hasFtnConfig()) {
    console.log("[FTN] skipped: missing config");
    return null;
  }

  const homeName = clean(getPreferredTeamName(input.homeName)) || clean(input.homeName);
  const awayName = clean(getPreferredTeamName(input.awayName)) || clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);
  const leagueName = clean(input.leagueName);

  if (!homeName || !awayName || !kickoffIso) {
    console.log("[FTN] skipped: missing required input", {
      homeName,
      awayName,
      kickoffIso,
    });
    return null;
  }

  const events = await fetchEventsWithFallbacks({
    homeName,
    awayName,
    kickoffIso,
    leagueName,
  });

  const best = pickBestEvent(events, {
    homeName,
    awayName,
    kickoffIso,
    leagueName,
  });

  if (!best) {
    console.log("[FTN] no API event match", {
      homeName,
      awayName,
      leagueName,
      eventsChecked: events.length,
    });
    return null;
  }

  const directEventUrl = appendAffiliate(eventUrl(best.ev));

  if (!directEventUrl) {
    console.log("[FTN] matched event but no safe public URL returned", {
      id: eventId(best.ev) || null,
      name: eventName(best.ev) || null,
      rawUrl: eventUrl(best.ev) || null,
    });
    return null;
  }

  console.log("[FTN] matched event", {
    id: eventId(best.ev) || null,
    name: eventName(best.ev) || null,
    date: eventDate(best.ev) || null,
    url: directEventUrl,
    score: best.score,
  });

  return {
    provider: "footballticketnet",
    exact: best.score >= 185,
    score: best.score,
    rawScore: best.score,
    url: directEventUrl,
    title: eventName(best.ev) || `Tickets: ${homeName} vs ${awayName}`,
    priceText: null,
    reason: best.score >= 185 ? "exact_event" : "partial_match",
    urlQuality: "event",
  };
}
