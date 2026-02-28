// src/services/se365.ts
import { ENV } from "@/src/config/env";

type Se365Event = {
  id?: number;
  eventId?: number;
  eventUrl?: string;
  url?: string;

  name?: string;
  homeTeam?: string;
  awayTeam?: string;

  startDate?: string;
  startTime?: string;
  date?: string;
  time?: string;

  tournamentId?: number;
};

type ResolveInput = {
  leagueId?: number;
  kickoffIso?: string;
  homeName?: string;
  awayName?: string;
};

type ResolveResult = {
  eventId: number;
  eventUrl: string;
};

function must(key: string, v: string) {
  if (!v) throw new Error(`${key} missing`);
}

function baseUrl() {
  const b = (ENV.se365BaseUrl || "").replace(/\/+$/, "");
  must("EXPO_PUBLIC_SE365_BASE_URL", b);
  return b;
}

function apiKey() {
  must("EXPO_PUBLIC_SE365_API_KEY", ENV.se365ApiKey);
  return ENV.se365ApiKey;
}

function affiliateId() {
  // can be blank in dev, but opening should still work
  return (ENV.se365AffiliateId || "").trim();
}

/**
 * IMPORTANT:
 * You MUST ensure these tournament IDs are correct in your SE365 account.
 * Eugene’s example used tournament 694 (looks like La Liga in their system).
 *
 * If any are wrong, resolution won’t find the event.
 */
const LEAGUE_TO_TOURNAMENT: Record<number, number> = {
  39: 1,    // Premier League  (CHANGE IF NEEDED)
  140: 694, // La Liga         (likely correct per Eugene email example)
  135: 2,   // Serie A         (CHANGE IF NEEDED)
  78: 3,    // Bundesliga      (CHANGE IF NEEDED)
  61: 4,    // Ligue 1         (CHANGE IF NEEDED)
};

function toDateOnly(iso?: string): string {
  if (!iso) return "";
  // handles "YYYY-MM-DD" or full ISO
  const s = String(iso);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function norm(s?: string): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(fc|cf|sc|ac|afc|cfc|cd|ud|sv|fk|ss|as|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreNameMatch(a?: string, b?: string): number {
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 10;
  if (A.includes(B) || B.includes(A)) return 7;

  // token overlap
  const ta = new Set(A.split(" ").filter(Boolean));
  const tb = new Set(B.split(" ").filter(Boolean));
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap >= 2 ? 5 : overlap === 1 ? 2 : 0;
}

function withAffiliate(url: string): string {
  const a = affiliateId();
  if (!a) return url;

  // already has affiliate param
  if (/[?&]a=/.test(url)) return url;

  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}a=${encodeURIComponent(a)}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SE365 ${res.status}: ${text || "request failed"}`);
  }
  return (await res.json()) as T;
}

async function listTournamentEvents(tournamentId: number): Promise<Se365Event[]> {
  // per Eugene: /events/tournament/{id}?perPage=15&apiKey=...
  // We request more so we can match properly.
  const url = `${baseUrl()}/events/tournament/${tournamentId}?perPage=250&apiKey=${encodeURIComponent(apiKey())}`;
  const data: any = await fetchJson<any>(url);

  // be defensive: API might return {events:[...]} or an array
  const events: any[] = Array.isArray(data) ? data : Array.isArray(data?.events) ? data.events : [];
  return events as Se365Event[];
}

function extractEventId(e: Se365Event): number {
  const n =
    (typeof e.eventId === "number" && e.eventId) ||
    (typeof e.id === "number" && e.id) ||
    0;
  return n;
}

function extractEventUrl(e: Se365Event): string {
  return String(e.eventUrl ?? e.url ?? "").trim();
}

function extractHomeAway(e: Se365Event): { home?: string; away?: string } {
  // Different schemas exist. Use best effort.
  const name = String(e.name ?? "").trim();
  if (name.includes(" vs ")) {
    const [h, a] = name.split(" vs ").map((x) => x.trim());
    return { home: h, away: a };
  }
  return {
    home: (e as any).homeTeam ?? (e as any).home ?? undefined,
    away: (e as any).awayTeam ?? (e as any).away ?? undefined,
  };
}

function extractDateOnly(e: Se365Event): string {
  // try common keys
  const d = String(e.startDate ?? e.date ?? "").trim();
  const t = toDateOnly(d);
  return t;
}

/**
 * Resolve the exact SE365 event for a fixture.
 * Returns eventId + deep-link eventUrl.
 */
export async function resolveSe365EventForFixture(input: ResolveInput): Promise<ResolveResult | null> {
  const leagueId = Number(input.leagueId ?? 0) || 0;
  const tournamentId = LEAGUE_TO_TOURNAMENT[leagueId];

  if (!tournamentId) return null;

  const home = String(input.homeName ?? "").trim();
  const away = String(input.awayName ?? "").trim();
  const targetDate = toDateOnly(input.kickoffIso);

  if (!home || !away || !targetDate) return null;

  const events = await listTournamentEvents(tournamentId);

  // score candidates: date must match, then name similarity
  let best: { score: number; e: Se365Event } | null = null;

  for (const e of events) {
    const d = extractDateOnly(e);
    if (!d || d !== targetDate) continue;

    const { home: eh, away: ea } = extractHomeAway(e);

    // score both orientations
    const s1 = scoreNameMatch(home, eh) + scoreNameMatch(away, ea);
    const s2 = scoreNameMatch(home, ea) + scoreNameMatch(away, eh);
    const score = Math.max(s1, s2);

    if (score <= 0) continue;
    if (!best || score > best.score) best = { score, e };
  }

  if (!best) return null;

  const eventId = extractEventId(best.e);
  const rawUrl = extractEventUrl(best.e);

  if (!eventId || !rawUrl) return null;

  return { eventId, eventUrl: withAffiliate(rawUrl) };
}
