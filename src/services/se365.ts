// src/services/se365.ts
/**
 * SportsEvents365 helpers
 *
 * Goal (Phase 1):
 * - Open the user on the MOST SPECIFIC page we can (ideally the exact event/tickets page).
 * - If we can't resolve an exact event reliably, fall back to the SE365 search page.
 *
 * Notes:
 * - We do *not* claim prices inside the app unless we fetch them live.
 * - This module intentionally favors "works reliably" over cleverness.
 */

export type Se365Resolved = {
  /** Best URL we could resolve (event/tickets page if possible, otherwise search). */
  url: string;
  /** If we can infer an event/tickets id from HTML, include it (useful for snapshotting). */
  eventId?: number;
  /** How we resolved the link. */
  source: "event" | "tickets" | "search";
};

// ⚠️ These are currently hardcoded in your repo.
// Move to env/config before shipping publicly.
const API_KEY = "YOUR_SE365_API_KEY";
const AFF_ID = "YOUR_AFFILIATE_ID";

/** Canonical web base. */
const WEB_BASE = "https://www.sportsevents365.com";

/** Build a SE365 website search URL. */
export function buildSearchUrl(query: string): string {
  const q = String(query ?? "").trim();
  const u = new URL(WEB_BASE + "/search/");
  if (q) u.searchParams.set("q", q);
  return u.toString();
}

/**
 * Attach affiliate params safely (preserves existing query params).
 */
export function attachAffiliate(url: string): string {
  const raw = String(url ?? "").trim();
  if (!raw) return raw;

  try {
    const u = new URL(raw);
    // Only attach on SE365 domain.
    if (!u.hostname.includes("sportsevents365.com")) return raw;

    if (AFF_ID) u.searchParams.set("a_aid", AFF_ID);
    // a_bid appears to be required by their tracking.
    u.searchParams.set("a_bid", "f66d820f");

    return u.toString();
  } catch {
    return raw;
  }
}

/**
 * Best-effort resolve of an exact event/tickets page by scraping the SE365 search HTML.
 * This avoids relying on undocumented API search endpoints.
 *
 * If parsing fails, you'll still get a working search URL.
 */
export async function resolveBestUrlFromSearch(args: {
  query: string;
  timeoutMs?: number;
}): Promise<Se365Resolved> {
  const query = String(args.query ?? "").trim();
  const searchUrl = buildSearchUrl(query);

  // Short-circuit if query is empty.
  if (!query) return { url: attachAffiliate(searchUrl), source: "search" };

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutMs = Math.max(1500, Number(args.timeoutMs ?? 4500) || 4500);

  const timeout = controller
    ? setTimeout(() => {
        try {
          controller.abort();
        } catch {}
      }, timeoutMs)
    : null;

  try {
    const res = await fetch(searchUrl, {
      method: "GET",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "YourNextAway/1.0",
      },
      signal: controller?.signal,
    });

    if (!res.ok) {
      return { url: attachAffiliate(searchUrl), source: "search" };
    }

    const html = await res.text();

    // Try to extract a tickets link first.
    // Common patterns we can handle:
    //   href="/tickets/123456"
    //   href="https://www.sportsevents365.com/tickets/123456"
    const ticketsMatch =
      html.match(/href\s*=\s*"(?:https?:\/\/www\.)?sportsevents365\.com\/tickets\/(\d+)[^"]*"/i) ??
      html.match(/href\s*=\s*"\/tickets\/(\d+)[^"]*"/i);

    if (ticketsMatch?.[1]) {
      const eventId = Number(ticketsMatch[1]);
      const url = attachAffiliate(`${WEB_BASE}/tickets/${eventId}`);
      return { url, eventId: Number.isFinite(eventId) ? eventId : undefined, source: "tickets" };
    }

    // Next, try an event page pattern:
    const eventMatch =
      html.match(/href\s*=\s*"(?:https?:\/\/www\.)?sportsevents365\.com\/event\/(\d+)[^"]*"/i) ??
      html.match(/href\s*=\s*"\/event\/(\d+)[^"]*"/i);

    if (eventMatch?.[1]) {
      const eventId = Number(eventMatch[1]);
      const url = attachAffiliate(`${WEB_BASE}/event/${eventId}`);
      return { url, eventId: Number.isFinite(eventId) ? eventId : undefined, source: "event" };
    }

    // Fallback: just open search.
    return { url: attachAffiliate(searchUrl), source: "search" };
  } catch {
    return { url: attachAffiliate(searchUrl), source: "search" };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/**
 * Build a strong, deterministic search query for a football fixture.
 * Add date + city to reduce ambiguity.
 */
export function buildFixtureSearchQuery(args: {
  homeName?: string;
  awayName?: string;
  kickoffIso?: string;
  venueCity?: string;
  leagueName?: string;
}): string {
  const home = String(args.homeName ?? "").trim();
  const away = String(args.awayName ?? "").trim();
  const city = String(args.venueCity ?? "").trim();
  const league = String(args.leagueName ?? "").trim();

  // Keep date-only (YYYY-MM-DD) if possible.
  let dateOnly = "";
  const iso = String(args.kickoffIso ?? "").trim();
  if (iso) {
    const m = iso.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) dateOnly = m[0];
  }

  const parts = [home && away ? `${home} vs ${away}` : home || away, dateOnly, city, league].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/* -------------------------------------------------------------------------- */
/* API V2 (tickets by event id)                                               */
/* -------------------------------------------------------------------------- */

/**
 * If you already have a SE365 event id, you can fetch their ticket JSON.
 * This can be used later for real "from £X" pricing (only if you parse it from this API).
 */
export async function getSE365Tickets(eventId: number): Promise<any> {
  const url = `https://api-v2.sportsevents365.com/tickets/?event_id=${eventId}&api_key=${API_KEY}`;

  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
                                       }
