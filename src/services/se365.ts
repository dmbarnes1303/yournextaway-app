// src/services/se365.ts
// Sportsevents365 integration helpers + event resolution for fixtures.
// Designed to be safe: never crash the app if SE365 is unavailable.
// Supports proxy-first (recommended) with fallback to direct SE365 endpoints.

import Constants from "expo-constants";

type Se365Env = {
  proxyUrl?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  affiliateId?: string;
};

type TournamentEvent = {
  id: number;
  name?: string;
  date?: string; // ISO-ish
  start_date?: string;
  startDate?: string;
  start_time?: string;
  local_time?: string;
  url?: string;
  web_url?: string;
  event_url?: string;
  venue?: { name?: string };
  home_team?: { name?: string };
  away_team?: { name?: string };
  teams?: Array<{ name?: string }>;
  tournament?: { name?: string };
  competition?: { name?: string };
  [k: string]: any;
};

type ResolveResponse =
  | {
      ok: true;
      eventId: number;
      eventUrl?: string;
      affiliateUrl?: string;
      raw?: any;
    }
  | { ok: false; reason: string; raw?: any };

type FixtureForSe365 = {
  fixtureId: number | string;
  homeName: string;
  awayName: string;
  kickoffIso: string; // ISO string from API-Football
  leagueName?: string;
  leagueId?: number | string;
};

const DEFAULT_API_BASE = "https://www.sportsevents365.com/api";
const DEFAULT_TIMEOUT_MS = 12_000;

const memCache: Map<string, { eventId?: number | null; eventUrl?: string | null }> = new Map();

const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const parseIsoToMs = (iso: string | undefined | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
};

const getConfigFromEnv = (): Se365Env => {
  const extra =
    (Constants?.expoConfig?.extra as any) ||
    (Constants as any)?.manifest2?.extra ||
    (Constants as any)?.manifest?.extra ||
    {};

  // Prefer explicit public env vars; fallback to expo extra
  const proxyUrl =
    process.env.EXPO_PUBLIC_SE365_PROXY_URL ||
    extra?.EXPO_PUBLIC_SE365_PROXY_URL ||
    extra?.SE365_PROXY_URL ||
    undefined;

  const apiBaseUrl =
    process.env.EXPO_PUBLIC_SE365_API_BASE_URL ||
    extra?.EXPO_PUBLIC_SE365_API_BASE_URL ||
    extra?.SE365_API_BASE_URL ||
    DEFAULT_API_BASE;

  const apiKey =
    process.env.EXPO_PUBLIC_SE365_API_KEY ||
    extra?.EXPO_PUBLIC_SE365_API_KEY ||
    extra?.SE365_API_KEY ||
    process.env.SE365_API_KEY ||
    extra?.SE365_API_KEY_PRIVATE ||
    undefined;

  const affiliateId =
    process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID ||
    extra?.EXPO_PUBLIC_SE365_AFFILIATE_ID ||
    extra?.SE365_AFFILIATE_ID ||
    undefined;

  return { proxyUrl, apiBaseUrl, apiKey, affiliateId };
};

const withTimeout = async <T>(
  p: Promise<T>,
  ms: number,
  label: string
): Promise<T> => {
  let t: any;
  const timeout = new Promise<T>((_, reject) => {
    t = setTimeout(() => reject(new Error(`timeout:${label}`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
};

const safeJson = async (res: Response): Promise<any> => {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { _raw: txt };
  }
};

const fetchJson = async (url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const res = await withTimeout(fetch(url, init), timeoutMs, url);
  const json = await safeJson(res);
  return { res, json };
};

const pickEventStartIso = (e: TournamentEvent): string | null => {
  const iso =
    e?.start_date ||
    e?.startDate ||
    e?.date ||
    (e?.start_time ? e?.start_time : undefined) ||
    (e?.local_time ? e?.local_time : undefined);

  if (!iso) return null;
  const ms = parseIsoToMs(iso);
  return ms ? new Date(ms).toISOString() : null;
};

const bestUrlFromEvent = (e: TournamentEvent): string | null => {
  const u = e?.event_url || e?.web_url || e?.url;
  if (typeof u === "string" && u.trim()) return u;
  return null;
};

const ensureHttps = (u: string): string => {
  if (!u) return u;
  if (u.startsWith("http://")) return "https://" + u.slice("http://".length);
  if (u.startsWith("https://")) return u;
  // Some SE365 APIs might return relative URLs; normalize to site
  if (u.startsWith("/")) return "https://www.sportsevents365.com" + u;
  return "https://www.sportsevents365.com/" + u;
};

export const buildAffiliateUrl = (eventUrl: string): string => {
  const { affiliateId } = getConfigFromEnv();
  const base = ensureHttps(eventUrl);

  if (!affiliateId) return base;

  try {
    const u = new URL(base);
    // Common affiliate param patterns. We add one without breaking existing query.
    // If partner already includes the param, we leave it as-is.
    const existing =
      u.searchParams.get("aid") ||
      u.searchParams.get("AID") ||
      u.searchParams.get("affiliate") ||
      u.searchParams.get("aff") ||
      u.searchParams.get("utm_source");

    if (!existing) u.searchParams.set("aid", String(affiliateId));
    return u.toString();
  } catch {
    // If parsing fails, append safely
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}aid=${encodeURIComponent(String(affiliateId))}`;
  }
};

export const fetchTournamentEvents = async (
  tournamentId: number,
  opts?: { timeoutMs?: number }
): Promise<TournamentEvent[]> => {
  const { apiBaseUrl, apiKey } = getConfigFromEnv();

  // Some environments require API key; if not present, we still attempt.
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) headers["x-api-key"] = apiKey;

  const url = `${apiBaseUrl || DEFAULT_API_BASE}/tournaments/${tournamentId}/events`;

  const { res, json } = await fetchJson(
    url,
    { method: "GET", headers },
    opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  if (!res.ok) {
    return [];
  }

  // API might return array directly or under data/events
  const arr =
    (Array.isArray(json) ? json : null) ||
    (Array.isArray(json?.events) ? json.events : null) ||
    (Array.isArray(json?.data) ? json.data : null) ||
    (Array.isArray(json?.data?.events) ? json.data.events : null);

  return Array.isArray(arr) ? (arr as TournamentEvent[]) : [];
};

const computeTeamScore = (fixture: FixtureForSe365, e: TournamentEvent): number => {
  const home = normalize(fixture.homeName);
  const away = normalize(fixture.awayName);

  // Candidate event teams
  const eHome =
    normalize(e?.home_team?.name || "") ||
    (Array.isArray(e?.teams) && e.teams.length >= 1 ? normalize(e.teams[0]?.name || "") : "");
  const eAway =
    normalize(e?.away_team?.name || "") ||
    (Array.isArray(e?.teams) && e.teams.length >= 2 ? normalize(e.teams[1]?.name || "") : "");

  const name = normalize(e?.name || "");

  const hasHome =
    (!!eHome && (eHome === home || eHome.includes(home) || home.includes(eHome))) ||
    (home && name.includes(home));
  const hasAway =
    (!!eAway && (eAway === away || eAway.includes(away) || away.includes(eAway))) ||
    (away && name.includes(away));

  let score = 0;
  if (hasHome) score += 2;
  if (hasAway) score += 2;

  // Strong bonus if both teams appear in title
  if (home && away && name.includes(home) && name.includes(away)) score += 2;

  return score;
};

const computeTimePenalty = (fixtureKickoffIso: string, eventIso: string | null): number => {
  const fixMs = parseIsoToMs(fixtureKickoffIso);
  const evMs = parseIsoToMs(eventIso || "");
  if (!fixMs || !evMs) return 10; // unknown -> penalize
  const diffHours = Math.abs(evMs - fixMs) / 36e5;
  // Prefer within 0-36 hours. Beyond that penalize heavily.
  if (diffHours <= 6) return 0;
  if (diffHours <= 24) return 1;
  if (diffHours <= 36) return 2;
  if (diffHours <= 72) return 5;
  return 12;
};

export const findMatchingEvent = (
  fixture: FixtureForSe365,
  events: TournamentEvent[]
): { eventId: number; eventUrl: string | null } | null => {
  if (!events?.length) return null;

  const scored = events
    .map((e) => {
      const startIso = pickEventStartIso(e);
      const teamScore = computeTeamScore(fixture, e);
      const timePenalty = computeTimePenalty(fixture.kickoffIso, startIso);
      const score = teamScore * 10 - timePenalty; // big weight on teams, small on time
      return { e, score, teamScore, timePenalty, startIso };
    })
    // Require at least one of the teams to match, otherwise too risky.
    .filter((x) => x.teamScore >= 2)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const top = scored[0];
  // If ambiguous (top two very close), still pick the best but be conservative.
  // This is still better than failing, but might misroute. Time penalty helps.
  const eventId = Number(top.e?.id);
  if (!Number.isFinite(eventId)) return null;

  const eventUrl = bestUrlFromEvent(top.e);
  return { eventId, eventUrl: eventUrl ? ensureHttps(eventUrl) : null };
};

const tryProxyResolve = async (
  fixture: FixtureForSe365
): Promise<ResolveResponse> => {
  const { proxyUrl } = getConfigFromEnv();
  if (!proxyUrl) return { ok: false, reason: "no-proxy" };

  // We don't know exact worker path from ZIP; try a few common ones safely.
  const candidates = [
    `${proxyUrl.replace(/\/$/, "")}/resolve`,
    `${proxyUrl.replace(/\/$/, "")}/lookup`,
    `${proxyUrl.replace(/\/$/, "")}/event`,
    `${proxyUrl.replace(/\/$/, "")}`,
  ];

  const payload = {
    homeName: fixture.homeName,
    awayName: fixture.awayName,
    kickoffIso: fixture.kickoffIso,
    leagueName: fixture.leagueName,
    leagueId: fixture.leagueId,
    fixtureId: fixture.fixtureId,
  };

  for (const url of candidates) {
    try {
      const { res, json } = await fetchJson(
        url,
        {
          method: "POST",
          headers: { "content-type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        },
        DEFAULT_TIMEOUT_MS
      );

      if (!res.ok) continue;

      // Accept multiple response shapes:
      // { eventId, eventUrl } OR { ok:true, eventId, eventUrl } OR { data:{...} }
      const eventId =
        Number(json?.eventId) ||
        Number(json?.id) ||
        Number(json?.data?.eventId) ||
        Number(json?.data?.id);

      const eventUrl =
        (typeof json?.eventUrl === "string" ? json.eventUrl : null) ||
        (typeof json?.url === "string" ? json.url : null) ||
        (typeof json?.data?.eventUrl === "string" ? json.data.eventUrl : null) ||
        (typeof json?.data?.url === "string" ? json.data.url : null);

      if (Number.isFinite(eventId)) {
        const cleaned = eventUrl ? ensureHttps(eventUrl) : undefined;
        return {
          ok: true,
          eventId,
          eventUrl: cleaned,
          affiliateUrl: cleaned ? buildAffiliateUrl(cleaned) : undefined,
          raw: json,
        };
      }

      // If proxy returns list of events, attempt to match locally
      const events =
        (Array.isArray(json) ? json : null) ||
        (Array.isArray(json?.events) ? json.events : null) ||
        (Array.isArray(json?.data?.events) ? json.data.events : null);

      if (Array.isArray(events) && events.length) {
        const match = findMatchingEvent(fixture, events as TournamentEvent[]);
        if (match) {
          const cleaned = match.eventUrl ? ensureHttps(match.eventUrl) : undefined;
          return {
            ok: true,
            eventId: match.eventId,
            eventUrl: cleaned,
            affiliateUrl: cleaned ? buildAffiliateUrl(cleaned) : undefined,
            raw: json,
          };
        }
      }
    } catch {
      // ignore and keep trying candidates
    }
  }

  return { ok: false, reason: "proxy-no-match" };
};

const tryDirectTournamentResolve = async (
  fixture: FixtureForSe365
): Promise<ResolveResponse> => {
  // Without a known tournamentId mapping this is a fallback strategy:
  // If leagueId is a SE365 tournamentId, we can use it.
  const tid = Number(fixture.leagueId);
  if (!Number.isFinite(tid) || tid <= 0) {
    return { ok: false, reason: "no-tournamentId" };
  }

  try {
    const events = await fetchTournamentEvents(tid);
    const match = findMatchingEvent(fixture, events);
    if (!match) return { ok: false, reason: "direct-no-match", raw: { tid, count: events.length } };

    const cleaned = match.eventUrl ? ensureHttps(match.eventUrl) : undefined;
    return {
      ok: true,
      eventId: match.eventId,
      eventUrl: cleaned,
      affiliateUrl: cleaned ? buildAffiliateUrl(cleaned) : undefined,
      raw: { tid, count: events.length },
    };
  } catch (e: any) {
    return { ok: false, reason: "direct-error", raw: { message: String(e?.message || e) } };
  }
};

export const resolveSe365EventForFixture = async (
  fixture: FixtureForSe365
): Promise<{ eventId: number | null; eventUrl: string | null }> => {
  const key = `fixture:${fixture.fixtureId}`;
  const cached = memCache.get(key);
  if (cached) {
    return {
      eventId: cached.eventId ?? null,
      eventUrl: cached.eventUrl ?? null,
    };
  }

  // Proxy-first
  const proxy = await tryProxyResolve(fixture);
  if (proxy.ok) {
    const finalUrl = proxy.eventUrl ? ensureHttps(proxy.eventUrl) : null;
    memCache.set(key, { eventId: proxy.eventId, eventUrl: finalUrl });
    return { eventId: proxy.eventId, eventUrl: finalUrl };
  }

  // Direct fallback (only if leagueId happens to map)
  const direct = await tryDirectTournamentResolve(fixture);
  if (direct.ok) {
    const finalUrl = direct.eventUrl ? ensureHttps(direct.eventUrl) : null;
    memCache.set(key, { eventId: direct.eventId, eventUrl: finalUrl });
    return { eventId: direct.eventId, eventUrl: finalUrl };
  }

  // Miss
  memCache.set(key, { eventId: null, eventUrl: null });
  return { eventId: null, eventUrl: null };
};

export const getSe365EventUrl = async (fixture: FixtureForSe365): Promise<string | null> => {
  const { eventUrl } = await resolveSe365EventForFixture(fixture);
  if (!eventUrl) return null;
  return buildAffiliateUrl(eventUrl);
};
