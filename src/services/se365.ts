// src/services/se365.ts
// Sportsevents365 API via your Cloudflare Worker proxy.
// App NEVER talks to SE365 directly (keeps creds off-device).

export type Se365Currency = "GBP" | "EUR" | "USD" | string;

export type Se365ResolvedTickets = {
  ok: true;
  eventId: number;
  deepLink: string; // sportsevents365 web affiliate link
  minPrice: number | null; // in currency units (e.g. 84.50)
  currency: Se365Currency | null;
  raw?: any; // optional debug
};

export type Se365NotFound = {
  ok: false;
  reason: "not_found" | "bad_response" | "network_error";
  message?: string;
  raw?: any;
};

type JsonValue = any;

const DEFAULT_TIMEOUT_MS = 12_000;

// You already use this affiliate ID in Match screen.
// Keep it centralized so everything uses the same ID.
export const SE365_AID = "69834e80ec9d3";
export const SE365_EVENT_WEB_BASE = "https://www.sportsevents365.com/event";

function getProxyBaseUrl(): string {
  // Must be set in app env:
  // EXPO_PUBLIC_SE365_PROXY_URL=https://your-worker.workers.dev
  const base = String(process.env.EXPO_PUBLIC_SE365_PROXY_URL ?? "").trim();
  if (!base) {
    // Fail loudly — otherwise you waste hours debugging “why is it 404”.
    throw new Error(
      "Missing EXPO_PUBLIC_SE365_PROXY_URL. Set it to your Cloudflare Worker URL (e.g. https://yna-se365-proxy-xxx.workers.dev)."
    );
  }
  return base.replace(/\/+$/, "");
}

function enc(v: string) {
  return encodeURIComponent(v);
}

function buildUrl(pathname: string, params?: Record<string, string | number | boolean | null | undefined>) {
  const base = getProxyBaseUrl();
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(`${base}${p}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === null || v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function fetchJson<T = JsonValue>(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // not JSON
      data = text;
    }

    if (!res.ok) {
      const msg =
        typeof data === "object" && data
          ? data.message || data.error || `HTTP ${res.status}`
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data as T;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Generic SE365 request through proxy.
 * You pass the SE365 API pathname (e.g. "/event-types") and optional query params.
 */
export async function se365Request<T = JsonValue>(
  pathname: string,
  params?: Record<string, string | number | boolean | null | undefined>,
  init?: RequestInit
): Promise<T> {
  const url = buildUrl(pathname, params);
  return fetchJson<T>(url, init);
}

/**
 * Quick sanity check: you already confirmed "/event-types" works via worker.
 * Use this in-app to confirm wiring.
 */
export async function se365HealthCheck(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await se365Request("/event-types");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Health check failed" };
  }
}

/* -------------------------------------------------------------------------- */
/* Fixture → Event resolution (search) */
/* -------------------------------------------------------------------------- */

export type ResolveFixtureArgs = {
  home: string;
  away: string;
  kickoffDateOnly?: string | null; // "YYYY-MM-DD" helps a lot
  leagueName?: string | null;
  city?: string | null;
};

/**
 * Build search strings. Keep it simple + stable.
 * SE365 search might like either:
 *  - "Arsenal Chelsea"
 *  - "Arsenal vs Chelsea 2026-02-10"
 *  - "Arsenal Chelsea Premier League"
 */
function buildSearchQueries(args: ResolveFixtureArgs): string[] {
  const home = String(args.home ?? "").trim();
  const away = String(args.away ?? "").trim();
  const date = String(args.kickoffDateOnly ?? "").trim();
  const league = String(args.leagueName ?? "").trim();

  const base1 = [home, away].filter(Boolean).join(" ").trim();
  const base2 = home && away ? `${home} vs ${away}` : base1;

  const q: string[] = [];
  if (base2) q.push(base2);
  if (base1 && date) q.push(`${base1} ${date}`);
  if (base2 && date) q.push(`${base2} ${date}`);
  if (base1 && league) q.push(`${base1} ${league}`);
  if (base2 && league) q.push(`${base2} ${league}`);
  if (base2 && date && league) q.push(`${base2} ${date} ${league}`);

  // de-dupe
  return Array.from(new Set(q.map((x) => x.trim()).filter(Boolean)));
}

/**
 * Normalize “event list” responses into a simple array of candidates.
 * Because different APIs wrap differently:
 *  - { data: [...] }
 *  - { events: [...] }
 *  - [...]
 */
function extractEventCandidates(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.events)) return raw.events;
  if (Array.isArray(raw.results)) return raw.results;
  return [];
}

function pickBestEventCandidate(cands: any[], args: ResolveFixtureArgs): any | null {
  if (!cands.length) return null;

  const home = String(args.home ?? "").toLowerCase().trim();
  const away = String(args.away ?? "").toLowerCase().trim();
  const date = String(args.kickoffDateOnly ?? "").trim();

  // Score candidates by text match + optional date match.
  // We avoid brittle exact matching.
  let best: { cand: any; score: number } | null = null;

  for (const c of cands) {
    const id = Number(c.id ?? c.eventId ?? 0);
    if (!id) continue;

    const name = String(c.name ?? c.title ?? c.eventName ?? "").toLowerCase();
    const homeHit = home ? name.includes(home) : false;
    const awayHit = away ? name.includes(away) : false;

    const iso = String(c.date ?? c.startDate ?? c.kickoff ?? c.start_time ?? "").trim();
    const hasDate = date && iso.includes(date);

    let score = 0;
    if (homeHit) score += 3;
    if (awayHit) score += 3;
    if (homeHit && awayHit) score += 3;
    if (hasDate) score += 2;

    // Mild bonus if it looks like football/soccer
    const sport = String(c.sport ?? c.eventType ?? c.category ?? "").toLowerCase();
    if (sport.includes("football") || sport.includes("soccer")) score += 1;

    if (!best || score > best.score) best = { cand: c, score };
  }

  return best?.cand ?? null;
}

export function buildSe365AffiliateDeepLink(eventId: number) {
  return `${SE365_EVENT_WEB_BASE}/${eventId}?a_aid=${SE365_AID}`;
}

/**
 * Attempts to resolve a fixture into an SE365 eventId.
 * Because we don't yet know the exact SE365 endpoint for searching events,
 * we try a small set of likely paths + query keys.
 *
 * Once you confirm the correct path from SE365 docs, we can delete the guessing
 * and keep the one correct endpoint only.
 */
export async function resolveFixtureToEvent(args: ResolveFixtureArgs): Promise<
  { ok: true; eventId: number; candidate: any; raw: any } | Se365NotFound
> {
  const queries = buildSearchQueries(args);
  if (!queries.length) return { ok: false, reason: "bad_response", message: "Missing team names." };

  // Candidate endpoints (we will prune this once you confirm the real one)
  const endpointCandidates = [
    "/events/search",
    "/event/search",
    "/events",
    "/search/events",
    "/search",
  ];

  // Candidate query param keys
  const queryKeys = ["q", "query", "search", "term", "keyword"];

  for (const q of queries) {
    for (const path of endpointCandidates) {
      for (const key of queryKeys) {
        try {
          const raw = await se365Request<any>(path, { [key]: q });

          const cands = extractEventCandidates(raw);
          const best = pickBestEventCandidate(cands, args);
          const id = Number(best?.id ?? best?.eventId ?? 0);

          if (id > 0) {
            return { ok: true, eventId: id, candidate: best, raw };
          }

          // If it returned candidates but we couldn't pick one, keep trying.
        } catch {
          // ignore and try next combo
        }
      }
    }
  }

  return { ok: false, reason: "not_found", message: "No SE365 event found for this fixture." };
}

/* -------------------------------------------------------------------------- */
/* Pricing (min price) */
/* -------------------------------------------------------------------------- */

function extractMinPrice(raw: any): { min: number | null; currency: Se365Currency | null } {
  if (!raw) return { min: null, currency: null };

  // Possible shapes:
  // - { minPrice: 84.5, currency: "GBP" }
  // - { data: { min_price: 84.5, currency: "GBP" } }
  // - { offers: [{ price: 84.5, currency: "GBP" }, ...] }
  // - { data: [{ price: 84.5, ...}, ...] }

  const directMin =
    raw.minPrice ??
    raw.min_price ??
    raw?.data?.minPrice ??
    raw?.data?.min_price ??
    null;

  const directCur =
    raw.currency ??
    raw?.data?.currency ??
    raw?.data?.cur ??
    null;

  if (typeof directMin === "number") {
    return { min: directMin, currency: directCur ?? null };
  }

  const offers =
    (Array.isArray(raw.offers) ? raw.offers : null) ??
    (Array.isArray(raw.data) ? raw.data : null) ??
    (Array.isArray(raw?.data?.offers) ? raw.data.offers : null) ??
    null;

  if (Array.isArray(offers) && offers.length) {
    let min: number | null = null;
    let currency: Se365Currency | null = null;

    for (const o of offers) {
      const p = Number(o.price ?? o.amount ?? o.value ?? NaN);
      if (!Number.isFinite(p)) continue;
      if (min === null || p < min) min = p;
      const c = o.currency ?? o.cur ?? o.currencyCode;
      if (!currency && c) currency = String(c);
    }

    return { min, currency };
  }

  return { min: null, currency: directCur ?? null };
}

/**
 * Get min ticket price for an SE365 event.
 * We try likely endpoints — once you confirm the real one, we keep only that.
 */
export async function getMinTicketPriceForEvent(eventId: number): Promise<
  { ok: true; minPrice: number | null; currency: Se365Currency | null; raw: any } | Se365NotFound
> {
  if (!eventId || eventId <= 0) return { ok: false, reason: "bad_response", message: "Missing eventId." };

  const candidates = [
    `/events/${eventId}/offers`,
    `/events/${eventId}/tickets`,
    `/event/${eventId}/offers`,
    `/event/${eventId}/tickets`,
    `/offers`,
    `/tickets`,
  ];

  for (const path of candidates) {
    try {
      // If endpoint needs id as query (fallback)
      const raw =
        path === "/offers" || path === "/tickets"
          ? await se365Request<any>(path, { eventId })
          : await se365Request<any>(path);

      const { min, currency } = extractMinPrice(raw);
      return { ok: true, minPrice: min, currency, raw };
    } catch {
      // try next
    }
  }

  return { ok: false, reason: "not_found", message: "Could not fetch pricing for this event." };
}

/* -------------------------------------------------------------------------- */
/* High-level: fixture → resolved tickets summary */
/* -------------------------------------------------------------------------- */

export async function resolveTicketsForFixture(args: ResolveFixtureArgs): Promise<Se365ResolvedTickets | Se365NotFound> {
  try {
    const resolved = await resolveFixtureToEvent(args);
    if (!resolved.ok) return resolved;

    const eventId = resolved.eventId;
    const deepLink = buildSe365AffiliateDeepLink(eventId);

    const pricing = await getMinTicketPriceForEvent(eventId);
    if (!pricing.ok) {
      // Still return eventId + deepLink so user can click through
      return {
        ok: true,
        eventId,
        deepLink,
        minPrice: null,
        currency: null,
        raw: { event: resolved.raw, pricing: pricing.raw ?? null },
      };
    }

    return {
      ok: true,
      eventId,
      deepLink,
      minPrice: pricing.minPrice,
      currency: pricing.currency,
      raw: { event: resolved.raw, pricing: pricing.raw },
    };
  } catch (e: any) {
    return { ok: false, reason: "network_error", message: e?.message ?? "SE365 lookup failed." };
  }
  }
