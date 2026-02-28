// src/services/se365.ts
// Sportsevents365 API (v2) helpers.
//
// Goals:
// - No hard-coded secrets.
// - Tolerant parsing (API responses can vary between sandbox/prod).
// - Provide the minimum building blocks we need for:
//   1) resolving an eventId -> eventUrl
//   2) resolving a fixture (home/away/date) -> eventId via tournament listing

export type Se365Env = {
  baseUrl: string;
  apiKey: string;
  affiliateId?: string;
};

function readEnv(): Se365Env {
  // Expo public env vars are available at build time.
  // We intentionally only read EXPO_PUBLIC_* keys here.
  const baseUrl = String(process.env.EXPO_PUBLIC_SE365_BASE_URL ?? "").trim();
  const apiKey = String(process.env.EXPO_PUBLIC_SE365_API_KEY ?? "").trim();
  const affiliateId = String(process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID ?? "").trim();

  return {
    baseUrl,
    apiKey,
    affiliateId: affiliateId || undefined,
  };
}

function assertConfigured(env: Se365Env) {
  if (!env.baseUrl) throw new Error("SE365 base URL missing (EXPO_PUBLIC_SE365_BASE_URL)");
  if (!env.apiKey) throw new Error("SE365 API key missing (EXPO_PUBLIC_SE365_API_KEY)");
}

function joinUrl(base: string, path: string) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function withApiKey(url: string, apiKey: string) {
  const u = new URL(url);
  // Most SE365 endpoints accept apiKey query param.
  if (!u.searchParams.get("apiKey")) u.searchParams.set("apiKey", apiKey);
  return u.toString();
}

async function se365GetJson(path: string, params?: Record<string, string | number | undefined | null>) {
  const env = readEnv();
  assertConfigured(env);

  const url = new URL(withApiKey(joinUrl(env.baseUrl, path), env.apiKey));
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SE365 ${res.status}: ${text || "request failed"}`);
  }

  return (await res.json()) as any;
}

/* -------------------------------------------------------------------------- */
/* Types (tolerant)                                                           */
/* -------------------------------------------------------------------------- */

export type Se365EventLite = {
  id?: number;
  startDate?: string; // often YYYY-MM-DD
  eventUrl?: string;  // deep link to the event page
  homeName?: string;
  awayName?: string;
};

function toLower(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function normName(s: unknown) {
  return toLower(s)
    .replace(/\s+/g, " ")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function extractEventsArray(payload: any): any[] {
  // Seen patterns:
  // - { data: [...] }
  // - { events: [...] }
  // - [...] (bare array)
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.events)) return payload.events;
  if (payload && payload.data && Array.isArray(payload.data.events)) return payload.data.events;
  return [];
}

function parseEventLite(raw: any): Se365EventLite {
  const id = Number(raw?.id);
  const startDate = typeof raw?.startDate === "string" ? raw.startDate : undefined;
  const eventUrl = typeof raw?.eventUrl === "string" ? raw.eventUrl : undefined;

  // Team name shapes can vary.
  const homeName =
    typeof raw?.homeTeam?.name === "string"
      ? raw.homeTeam.name
      : typeof raw?.home?.name === "string"
        ? raw.home.name
        : typeof raw?.homeName === "string"
          ? raw.homeName
          : undefined;

  const awayName =
    typeof raw?.awayTeam?.name === "string"
      ? raw.awayTeam.name
      : typeof raw?.away?.name === "string"
        ? raw.away.name
        : typeof raw?.awayName === "string"
          ? raw.awayName
          : undefined;

  return {
    id: Number.isFinite(id) ? id : undefined,
    startDate,
    eventUrl,
    homeName,
    awayName,
  };
}

function matchEventByTeamsAndDate(e: Se365EventLite, home: string, away: string, dateIso: string) {
  if (!e) return false;
  if (!home || !away || !dateIso) return false;

  // Date: we only compare YYYY-MM-DD prefix (API often returns date-only).
  const eDate = String(e.startDate ?? "").slice(0, 10);
  if (eDate !== dateIso) return false;

  const eHome = normName(e.homeName);
  const eAway = normName(e.awayName);
  const h = normName(home);
  const a = normName(away);

  // Strict first.
  if (eHome === h && eAway === a) return true;

  // Fallback: allow contains (for suffixes like "FC", accents stripped, etc.)
  const homeOk = eHome.includes(h) || h.includes(eHome);
  const awayOk = eAway.includes(a) || a.includes(eAway);
  return homeOk && awayOk;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function se365GetEvent(eventId: number): Promise<Se365EventLite | null> {
  if (!Number.isFinite(eventId) || eventId <= 0) return null;
  const json = await se365GetJson(`/events/${eventId}`);
  // Could be { data: {...} } or direct object.
  const raw = (json && json.data) ? json.data : json;
  return raw ? parseEventLite(raw) : null;
}

export async function se365FindEventInTournament(opts: {
  tournamentId: number;
  home: string;
  away: string;
  dateIso: string; // YYYY-MM-DD
  perPage?: number;
  maxPages?: number;
}): Promise<Se365EventLite | null> {
  const { tournamentId, home, away, dateIso } = opts;
  const perPage = Math.max(10, Math.min(100, Number(opts.perPage ?? 50) || 50));
  const maxPages = Math.max(1, Math.min(10, Number(opts.maxPages ?? 6) || 6));

  if (!Number.isFinite(tournamentId) || tournamentId <= 0) return null;

  for (let page = 1; page <= maxPages; page++) {
    const json = await se365GetJson(`/events/tournament/${tournamentId}`, {
      perPage,
      page,
    });

    const eventsRaw = extractEventsArray(json);
    const events = eventsRaw.map(parseEventLite);
    const found = events.find((e) => matchEventByTeamsAndDate(e, home, away, dateIso));
    if (found?.id) return found;

    // Stop early if the response clearly has no more items.
    if (!eventsRaw.length || eventsRaw.length < perPage) break;
  }

  return null;
}

export function appendAffiliateId(url: string, affiliateId?: string): string {
  const aff = String(affiliateId ?? readEnv().affiliateId ?? "").trim();
  if (!url || !aff) return url;
  try {
    const u = new URL(url);
    // SE365 expects affiliateId.
    if (!u.searchParams.get("affiliateId")) u.searchParams.set("affiliateId", aff);
    return u.toString();
  } catch {
    // If it's not a full URL, just return original.
    return url;
  }
}

export function normalizeEventUrl(eventUrl: string | undefined | null): string | null {
  const raw = String(eventUrl ?? "").trim();
  if (!raw) return null;

  // Sometimes APIs return relative paths.
  if (/^https?:\/\//i.test(raw)) return raw;

  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return `https://www.sportsevents365.com${withSlash}`;
}
