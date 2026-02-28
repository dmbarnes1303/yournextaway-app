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
  kickoffIso: string; // ISO
  leagueName?: string;
  leagueId?: string | number;
};

type ResolveResult = {
  eventId: number | null;
  eventUrl: string | null;
  reason?: string;
};

function extraEnv(name: string): string | undefined {
  const extra =
    (Constants?.expoConfig?.extra as any) ||
    (Constants as any)?.manifest2?.extra ||
    (Constants as any)?.manifest?.extra ||
    {};

  const v =
    (typeof process !== "undefined" &&
      (process as any)?.env &&
      typeof (process as any).env[name] === "string" &&
      String((process as any).env[name])) ||
    (typeof extra?.[name] === "string" ? String(extra[name]) : undefined);

  const s = String(v ?? "").trim();
  return s || undefined;
}

function clean(v: any): string {
  return String(v ?? "").trim();
}

function norm(v: any): string {
  return clean(v).toLowerCase();
}

function safeDate(iso?: string): Date | null {
  const raw = clean(iso);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function absDays(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (24 * 60 * 60 * 1000));
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

function containsTeamName(eventName: string, home: string, away: string): boolean {
  const n = norm(eventName);
  const h = norm(home);
  const a = norm(away);
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

  if (clean(ev.url)) score += 5;

  return score;
}

/**
 * Build final affiliate URL for Sportsevents365 event pages.
 *
 * IMPORTANT:
 * - SE365 commonly uses a_aid=<id> as the affiliate parameter.
 * - Your .env currently has EXPO_PUBLIC_SE365_AFFILIATE_ID="a_aid=958" (already includes the key).
 *   We support BOTH formats:
 *     - "958"  -> appends "a_aid=958"
 *     - "a_aid=958" (or any "key=value") -> appends exactly that
 */
export function buildAffiliateUrl(eventUrl: string): string {
  const url = clean(eventUrl);
  if (!url) return "";

  const rawAff = clean(extraEnv("EXPO_PUBLIC_SE365_AFFILIATE_ID"));
  if (!rawAff) return url;

  // If URL already has a_aid or affiliate-ish param, don’t duplicate.
  if (/\ba_aid=/.test(url) || /\baffiliate=/.test(url)) return url;

  // If env already looks like "key=value" (e.g. "a_aid=958"), use it as-is.
  // If it's just a number/string, use a_aid=<value>.
  const affParam = rawAff.includes("=") ? rawAff : `a_aid=${encodeURIComponent(rawAff)}`;

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${affParam}`;
}

function getSe365Config() {
  // Prefer proxy for production (keeps API key off-device)
  const proxyUrl = clean(extraEnv("EXPO_PUBLIC_SE365_PROXY_URL"));
  const baseUrl = clean(extraEnv("EXPO_PUBLIC_SE365_BASE_URL"));
  const apiKey = clean(extraEnv("EXPO_PUBLIC_SE365_API_KEY"));

  return {
    proxyUrl: proxyUrl || "",
    baseUrl: baseUrl || "",
    apiKey: apiKey || "",
  };
}

/**
 * Resolve SE365 event for a fixture.
 *
 * Strategy:
 * - Search by "home away"
 * - Score by name contains both teams + date proximity
 * - Pick highest score
 *
 * Transport:
 * - If EXPO_PUBLIC_SE365_PROXY_URL is set => call that (no key on device)
 * - Else call baseUrl with x-api-key (dev fallback)
 */
export async function resolveSe365EventForFixture(args: ResolveArgs): Promise<ResolveResult> {
  const cfg = getSe365Config();

  const home = clean(args.homeName);
  const away = clean(args.awayName);
  const kickoffIso = clean(args.kickoffIso);

  if (!home || !away || !kickoffIso) {
    return { eventId: null, eventUrl: null, reason: "missing_match_fields" };
  }

  const query = encodeURIComponent(`${home} ${away}`);

  let url = "";
  const headers: Record<string, string> = { "content-type": "application/json" };

  if (cfg.proxyUrl) {
    url = `${cfg.proxyUrl.replace(/\/+$/, "")}/events/search?q=${query}`;
    // proxy should handle auth
  } else {
    if (!cfg.baseUrl || !cfg.apiKey) {
      return { eventId: null, eventUrl: null, reason: "missing_config" };
    }
    url = `${cfg.baseUrl.replace(/\/+$/, "")}/events/search?q=${query}`;
    headers["x-api-key"] = cfg.apiKey;
  }

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    return { eventId: null, eventUrl: null, reason: "network_error" };
  }

  if (!res.ok) {
    return { eventId: null, eventUrl: null, reason: `http_${res.status}` };
  }

  let json: Se365SearchResponse;
  try {
    json = (await res.json()) as Se365SearchResponse;
  } catch {
    return { eventId: null, eventUrl: null, reason: "bad_json" };
  }

  const events = Array.isArray(json.events) ? json.events : [];
  if (events.length === 0) {
    return { eventId: null, eventUrl: null, reason: "no_events" };
  }

  const kickoffDate = safeDate(kickoffIso);
  const kickoffDay = kickoffDate ? dateOnlyFromIso(kickoffIso) : null;

  const scored = events
    .map((ev) => {
      const s = scoreEvent(ev, home, away, kickoffIso);

      // Hard filter if too far out when both dates exist
      if (kickoffDate && ev.startDate) {
        const start = safeDate(ev.startDate);
        if (start) {
          const diff = absDays(kickoffDate, start);
          if (diff > 2) return { ev, score: -999 };
        }
      }

      // Soft penalty for date-only mismatch (±1 day already gets bumped)
      if (kickoffDay && ev.startDate) {
        const evDay = dateOnlyFromIso(ev.startDate);
        if (evDay && evDay !== kickoffDay) {
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
 * Helper used elsewhere: returns affiliate-wrapped URL if resolvable.
 */
export async function getSe365EventUrl(args: ResolveArgs): Promise<string | null> {
  const { eventUrl } = await resolveSe365EventForFixture(args);
  if (!eventUrl) return null;
  const out = buildAffiliateUrl(eventUrl);
  return clean(out) || null;
}
