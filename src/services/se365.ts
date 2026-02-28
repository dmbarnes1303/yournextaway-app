// src/services/se365.ts
import Constants from "expo-constants";

type Se365Event = {
  id: number;
  name?: string;
  url?: string;
  startDate?: string; // ISO
  venue?: { name?: string; city?: string };
  category?: { id?: number; name?: string };
};

type Se365SearchResponse = {
  events?: Se365Event[];
};

type ResolveArgs = {
  fixtureId: string | number;
  homeName: string;
  awayName: string;
  kickoffIso: string; // from API-Football fixture.date
  leagueName?: string;
  leagueId?: string | number;
};

type ResolveResult = {
  eventId: number | null;
  eventUrl: string | null;
  reason?: string;
};

function env(name: string): string | undefined {
  const extra = (Constants?.expoConfig as any)?.extra ?? (Constants as any)?.manifest?.extra ?? {};
  const v =
    (extra && typeof extra[name] === "string" ? String(extra[name]) : undefined) ??
    (typeof process !== "undefined" &&
    (process as any)?.env &&
    typeof (process as any).env[name] === "string"
      ? String((process as any).env[name])
      : undefined);

  const s = String(v ?? "").trim();
  return s || undefined;
}

function clean(s: any): string {
  return String(s ?? "").trim();
}

function norm(s: any): string {
  return clean(s).toLowerCase();
}

function dateOnlyFromIso(iso: string): string | null {
  const raw = clean(iso);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function absDays(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function safeDate(iso?: string): Date | null {
  const raw = clean(iso);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function containsTeamName(eventName: string, home: string, away: string): boolean {
  const n = norm(eventName);
  const h = norm(home);
  const a = norm(away);

  // Basic containment — works well for "Team A vs Team B" / "Team A - Team B"
  return n.includes(h) && n.includes(a);
}

function scoreEvent(ev: Se365Event, home: string, away: string, kickoffIso: string): number {
  let score = 0;

  const evName = clean(ev.name);
  if (evName && containsTeamName(evName, home, away)) score += 50;

  const kickoff = safeDate(kickoffIso);
  const start = safeDate(ev.startDate);
  if (kickoff && start) {
    const diff = absDays(kickoff, start);
    if (diff === 0) score += 25;
    else if (diff === 1) score += 15;
    else if (diff === 2) score += 5;
  }

  // Slight bump for having a URL
  if (clean(ev.url)) score += 5;

  return score;
}

/**
 * Build final affiliate-tracked URL.
 * - We prefer appending an affiliate param only if SE365 supports it.
 * - Keep it deterministic and simple.
 */
export function buildAffiliateUrl(eventUrl: string): string {
  const url = clean(eventUrl);
  if (!url) return "";

  const aff = clean(env("EXPO_PUBLIC_SE365_AFFILIATE_ID"));
  if (!aff) return url;

  // avoid duplication
  if (url.includes("aff=") || url.includes("affiliate=")) return url;

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}aff=${encodeURIComponent(aff)}`;
}

/**
 * Core resolver: Search SE365 and pick the best matching event.
 *
 * Strategy:
 * - Query using team names (best recall)
 * - Filter/score by name contains both teams + date tolerance ±1 day
 * - Pick highest score
 */
export async function resolveSe365EventForFixture(args: ResolveArgs): Promise<ResolveResult> {
  const baseUrl = clean(env("EXPO_PUBLIC_SE365_BASE_URL"));
  const apiKey = clean(env("EXPO_PUBLIC_SE365_API_KEY"));

  if (!baseUrl || !apiKey) {
    return { eventId: null, eventUrl: null, reason: "missing_config" };
  }

  const home = clean(args.homeName);
  const away = clean(args.awayName);
  const kickoffIso = clean(args.kickoffIso);
  if (!home || !away || !kickoffIso) {
    return { eventId: null, eventUrl: null, reason: "missing_match_fields" };
  }

  const query = encodeURIComponent(`${home} ${away}`);
  const url = `${baseUrl.replace(/\/+$/, "")}/events/search?q=${query}`;

  const res = await fetch(url, {
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    return { eventId: null, eventUrl: null, reason: `http_${res.status}` };
  }

  const json = (await res.json()) as Se365SearchResponse;
  const events = Array.isArray(json.events) ? json.events : [];

  if (events.length === 0) {
    return { eventId: null, eventUrl: null, reason: "no_events" };
  }

  const kickoffDate = safeDate(kickoffIso);
  const kickoffDay = kickoffDate ? dateOnlyFromIso(kickoffIso) : null;

  // Score and pick best
  const scored = events
    .map((ev) => {
      const s = scoreEvent(ev, home, away, kickoffIso);

      // Hard filter if date is too far out when both dates exist
      if (kickoffDate && ev.startDate) {
        const start = safeDate(ev.startDate);
        if (start) {
          const diff = absDays(kickoffDate, start);
          if (diff > 2) return { ev, score: -999 };
        }
      }

      // Soft filter: if we have date-only and event has startDate-only mismatch
      if (kickoffDay && ev.startDate) {
        const evDay = dateOnlyFromIso(ev.startDate);
        if (evDay && evDay !== kickoffDay) {
          // allow ±1 day already handled by absDays bump; this is a small penalty only
          const kd = safeDate(kickoffIso);
          const sd = safeDate(ev.startDate);
          if (kd && sd) {
            const diff = absDays(kd, sd);
            if (diff === 1) return { ev, score: s - 3 };
          }
        }
      }

      return { ev, score: s };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { eventId: null, eventUrl: null, reason: "no_good_match" };
  }

  const best = scored[0].ev;
  const eventId = typeof best.id === "number" ? best.id : null;
  const eventUrl = clean(best.url) || null;

  return { eventId, eventUrl, reason: "ok" };
}

/**
 * High-level helper used by screens/services.
 * Returns a fully affiliate-wrapped event URL if resolvable.
 */
export async function getSe365EventUrl(args: ResolveArgs): Promise<string | null> {
  const { eventUrl } = await resolveSe365EventForFixture(args);
  if (!eventUrl) return null;
  const out = buildAffiliateUrl(eventUrl);
  return clean(out) || null;
}
