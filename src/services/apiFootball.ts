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
 */
export type FixtureListRow = {
  fixture?: {
    id?: number;
    date?: string; // ISO
    venue?: { name?: string; city?: string };
    status?: { long?: string; short?: string };
  };
  league?: { id?: number; name?: string; round?: string; season?: number };
  teams?: {
    home?: { id?: number; name?: string };
    away?: { id?: number; name?: string };
  };
};

export async function getFixtures(params: {
  league: number;
  season: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}) {
  const qs = enc({
    league: params.league,
    season: params.season,
    from: params.from,
    to: params.to,
  });

  return apiGet<FixtureListRow[]>(`/fixtures${qs}`);
}

export async function getFixtureById(fixtureId: string | number) {
  const qs = enc({ id: fixtureId });
  const rows = await apiGet<FixtureListRow[]>(`/fixtures${qs}`);
  return rows?.[0] ?? null;
}
