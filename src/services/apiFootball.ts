// src/services/apiFootball.ts
import { API_FOOTBALL_BASE_URL, assertApiFootballKey } from "@/src/config/apiFootball";

type ApiSportsEnvelope<T> = {
  errors?: Record<string, unknown> | unknown[] | string | null;
  message?: unknown;
  results?: number;
  response?: T;
};

function enc(q: Record<string, string | number | undefined>) {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

function stringifySafe(x: unknown) {
  try {
    return typeof x === "string" ? x : JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function extractApiSportsError(json: ApiSportsEnvelope<any>): string | null {
  const e = json?.errors;
  if (!e) return null;

  if (typeof e === "object" && !Array.isArray(e)) {
    const obj = e as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    return `API-Football error: ${stringifySafe(obj)}`;
  }

  if (Array.isArray(e) && e.length) return `API-Football error: ${stringifySafe(e)}`;
  if (typeof e === "string" && e.trim()) return `API-Football error: ${e.trim()}`;

  return null;
}

async function apiGet<T>(path: string): Promise<T> {
  const key = assertApiFootballKey();
  const url = `${API_FOOTBALL_BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "x-apisports-key": key },
  });

  const text = await res.text();

  let json: ApiSportsEnvelope<T>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("API-Football returned invalid JSON");
  }

  const apiErr = extractApiSportsError(json);

  if (!res.ok) {
    throw new Error(apiErr ?? `API-Football HTTP ${res.status}: ${text}`);
  }

  if (apiErr) throw new Error(apiErr);

  return (json?.response as T) ?? ([] as any);
}

/**
 * Minimal fixture shape we actually use in UI.
 * NOTE: includes team logos so we can render crests.
 */
export type FixtureListRow = {
  fixture?: {
    id?: number;
    date?: string; // ISO
    venue?: { name?: string; city?: string };
    status?: { long?: string; short?: string };
  };
  league?: {
    id?: number;
    name?: string;
    round?: string;
    season?: number;
    country?: string;
  };
  teams?: {
    home?: { id?: number; name?: string; logo?: string };
    away?: { id?: number; name?: string; logo?: string };
  };
};

// --------------------
// In-memory caching (V1 critical stability fix)
// - dedupes concurrent calls
// - TTL reduces repeated calls across screens
// --------------------

const FIXTURES_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FIXTURE_BY_ID_TTL_MS = 30 * 60 * 1000; // 30 minutes

type CacheEntry<T> = {
  ts: number;
  value?: T;
  inflight?: Promise<T>;
};

const fixturesCache = new Map<string, CacheEntry<FixtureListRow[]>>();
const fixtureByIdCache = new Map<string, CacheEntry<FixtureListRow | null>>();

function now() {
  return Date.now();
}

function isFresh(ts: number, ttlMs: number) {
  return now() - ts < ttlMs;
}

function fixturesKey(params: { league: number; season: number; from: string; to: string }) {
  return `fixtures:${params.league}:${params.season}:${params.from}:${params.to}`;
}

function fixtureIdKey(id: string | number) {
  return `fixture:${String(id)}`;
}

export async function getFixtures(params: {
  league: number;
  season: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}): Promise<FixtureListRow[]> {
  const key = fixturesKey(params);
  const existing = fixturesCache.get(key);

  if (existing?.value && isFresh(existing.ts, FIXTURES_TTL_MS)) {
    return existing.value;
  }

  if (existing?.inflight) {
    return existing.inflight;
  }

  const qs = enc({
    league: params.league,
    season: params.season,
    from: params.from,
    to: params.to,
  });

  const inflight = apiGet<FixtureListRow[]>(`/fixtures${qs}`)
    .then((rows) => (Array.isArray(rows) ? rows : []))
    .then((rows) => {
      fixturesCache.set(key, { ts: now(), value: rows });
      return rows;
    })
    .catch((err) => {
      fixturesCache.delete(key);
      throw err;
    });

  fixturesCache.set(key, { ts: now(), inflight });
  return inflight;
}

export async function getFixtureById(fixtureId: string | number): Promise<FixtureListRow | null> {
  const key = fixtureIdKey(fixtureId);
  const existing = fixtureByIdCache.get(key);

  if (existing && "value" in existing && isFresh(existing.ts, FIXTURE_BY_ID_TTL_MS)) {
    return existing.value ?? null;
  }

  if (existing?.inflight) return existing.inflight;

  const qs = enc({ id: fixtureId });

  const inflight = apiGet<FixtureListRow[]>(`/fixtures${qs}`)
    .then((rows) => (Array.isArray(rows) ? rows : []))
    .then((rows) => (rows?.[0] ?? null))
    .then((row) => {
      fixtureByIdCache.set(key, { ts: now(), value: row });
      return row;
    })
    .catch((err) => {
      fixtureByIdCache.delete(key);
      throw err;
    });

  fixtureByIdCache.set(key, { ts: now(), inflight });
  return inflight;
}

export function __clearApiFootballCache() {
  fixturesCache.clear();
  fixtureByIdCache.clear();
}
