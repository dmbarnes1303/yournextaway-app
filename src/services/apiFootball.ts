// src/services/apiFootball.ts
import { API_FOOTBALL_BASE_URL, assertApiFootballKey } from "@/src/config/apiFootball";

type ApiSportsEnvelope<T> = {
  errors?: any;
  message?: any;
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

async function apiGet<T>(path: string): Promise<T> {
  const key = assertApiFootballKey();
  const url = `${API_FOOTBALL_BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": key,
    },
  });

  const text = await res.text();

  let json: ApiSportsEnvelope<T>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("API-Football returned invalid JSON");
  }

  if (!res.ok) {
    throw new Error(`API-Football HTTP ${res.status}: ${text}`);
  }

  if (json?.errors && Object.keys(json.errors).length) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
  }

  return (json?.response as T) ?? ([] as any);
}

export type FixtureListRow = any; // keep permissive for now; we’ll type it later

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
