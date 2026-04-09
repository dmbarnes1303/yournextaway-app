// src/features/tripDetail/helpers.ts

import type {
  TicketResolutionOption,
  TicketResolutionResult,
} from "@/src/services/ticketResolver";
import type { PartnerId } from "@/src/constants/partners";

/**
 * =========
 * BASICS
 * =========
 */

export function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export function coerceId(value: unknown): string | null {
  const raw = clean(value);
  return raw || null;
}

export function titleCaseCity(value: unknown): string {
  const raw = clean(value);
  if (!raw) return "";

  return raw
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => {
      if (part === "st") return "St";
      if (part === "saint") return "Saint";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}


export function defer(fn: () => void, delay = 0) {
  return setTimeout(fn, delay);
}

export type PlanValue = "not_set" | "free" | "premium";

/**
 * =========
 * SIMPLE SHARED TYPES
 * =========
 */

export type SourceSurface =
  | "unknown"
  | "workspace_cta"
  | "workspace_item"
  | "ticket_choice_alert"
  | "progress_strip"
  | "next_best_action"
  | "smart_booking";

export type SourceSection =
  | "unknown"
  | "tickets"
  | "travel"
  | "stay"
  | "things"
  | "transfers"
  | "insurance"
  | "claims"
  | "notes";

export type SmartButton = {
  title: string;
  sub: string;
  onPress: () => void | Promise<void>;
  kind?: "primary" | "neutral";
  provider?: string | null;
};

export type AffiliateUrls = {
  ticketsUrl: string | null;
  flightsUrl: string | null;

  staysUrl: string | null;
  trainsUrl: string | null;
  busesUrl: string | null;
  transfersUrl: string | null;
  insuranceUrl: string | null;
  thingsUrl: string | null;
  carHireUrl: string | null;
  mapsUrl: string | null;
  officialSiteUrl: string | null;
  claimsUrl: string | null;

  hotelsUrl?: string | null;
  experiencesUrl?: string | null;
  transportUrl?: string | null;
  omioUrl?: string | null;

  secondaryTicketsUrl?: string | null;
};

/**
 * =========
 * GENERIC SMALL HELPERS
 * =========
 */

export function cleanUpper3(value: unknown, fallback = "LON"): string {
  const raw = clean(value).toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : fallback;
}

export function getIsoDateOnly(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  const direct = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (direct?.[1]) return direct[1];

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isNumericId(value: unknown): boolean {
  return /^\d+$/.test(clean(value));
}

/**
 * =========
 * PROVIDER NORMALIZATION
 * =========
 */

function normalizeProvider(provider?: string | null): string {
  return clean(provider).toLowerCase();
}

function isSe365(provider?: string | null): boolean {
  const p = normalizeProvider(provider);
  return p === "sportsevents365" || p === "se365";
}

function isFtn(provider?: string | null): boolean {
  const p = normalizeProvider(provider);
  return p === "footballticketnet" || p === "footballticketnet.com" || p === "ftn";
}

/**
 * =========
 * URL QUALITY
 * =========
 */

export type TicketUrlQuality = "event" | "listing" | "search" | "unknown";

export function getTicketUrlQuality(option: TicketResolutionOption): TicketUrlQuality {
  const raw = clean(option.urlQuality).toLowerCase();

  if (raw === "event" || raw === "listing" || raw === "search" || raw === "unknown") {
    return raw;
  }

  const url = clean(option.url).toLowerCase();
  if (!url) return "unknown";

  if (
    url.includes("/search") ||
    url.includes("search-results") ||
    url.includes("query=") ||
    url.includes("q=") ||
    url.includes("text=")
  ) {
    return "search";
  }

  if (url.includes("/listing") || url.includes("/listings")) return "listing";
  if (url.includes("/event") || url.includes("/events") || url.includes("/tickets")) {
    return "event";
  }

  return "unknown";
}

export function normalizeTicketUrlQuality(
  value: unknown,
  fallbackUrl?: string | null
): TicketUrlQuality {
  const raw = clean(value).toLowerCase();

  if (raw === "event" || raw === "listing" || raw === "search" || raw === "unknown") {
    return raw;
  }

  const url = clean(fallbackUrl).toLowerCase();
  if (!url) return "unknown";

  if (
    url.includes("/search") ||
    url.includes("search-results") ||
    url.includes("query=") ||
    url.includes("q=") ||
    url.includes("text=")
  ) {
    return "search";
  }

  if (url.includes("/listing") || url.includes("/listings")) return "listing";
  if (url.includes("/event") || url.includes("/events") || url.includes("/tickets")) {
    return "event";
  }

  return "unknown";
}

/**
 * =========
 * CORE TICKET INTELLIGENCE
 * =========
 *
 * Commercial rule:
 * - SportsEvents365 is Tier 1 monetised and should be treated as the strongest
 *   commercial route when present.
 * - FootballTicketNet is Tier 2 strategic and should be treated as a useful
 *   fallback / broader inventory route, but not equal to SE365.
 */

export function isStrongTicketOption(option: TicketResolutionOption): boolean {
  const reason = clean(option.reason);
  const urlQuality = getTicketUrlQuality(option);

  if (isSe365(option.provider)) {
    if (option.exact || reason === "exact_event") {
      return urlQuality === "event" || urlQuality === "listing" || urlQuality === "unknown";
    }

    if (reason === "partial_match") {
      return urlQuality === "event" || urlQuality === "listing";
    }

    return false;
  }

  if (isFtn(option.provider)) {
    if (option.exact || reason === "exact_event") {
      return urlQuality === "event" || urlQuality === "listing";
    }

    if (reason === "partial_match") {
      return urlQuality === "event" || urlQuality === "listing";
    }

    return false;
  }

  if (option.exact || reason === "exact_event") {
    return urlQuality === "event" || urlQuality === "listing" || urlQuality === "unknown";
  }

  if (reason === "partial_match") {
    return urlQuality === "event" || urlQuality === "listing";
  }

  return false;
}

export function classifyTicketOption(
  option: TicketResolutionOption
): "strong" | "medium" | "weak" {
  const reason = clean(option.reason);
  const urlQuality = getTicketUrlQuality(option);

  if (isSe365(option.provider)) {
    if (option.exact || reason === "exact_event") return "strong";
    if (reason === "partial_match" && (urlQuality === "event" || urlQuality === "listing")) {
      return "strong";
    }
    return "medium";
  }

  if (isFtn(option.provider)) {
    if (option.exact || reason === "exact_event") {
      return urlQuality === "event" || urlQuality === "listing" ? "medium" : "weak";
    }

    if (reason === "partial_match") {
      return urlQuality === "event" || urlQuality === "listing" ? "medium" : "weak";
    }

    return "weak";
  }

  if (option.exact || reason === "exact_event") {
    return urlQuality === "event" || urlQuality === "listing" || urlQuality === "unknown"
      ? "strong"
      : "medium";
  }

  if (reason === "partial_match") {
    return urlQuality === "event" || urlQuality === "listing" ? "medium" : "weak";
  }

  return "weak";
}

export function splitTicketOptions(options: TicketResolutionOption[]) {
  const strong: TicketResolutionOption[] = [];
  const weak: TicketResolutionOption[] = [];

  for (const option of options) {
    if (isStrongTicketOption(option)) {
      strong.push(option);
    } else {
      weak.push(option);
    }
  }

  const sortByPriority = (a: TicketResolutionOption, b: TicketResolutionOption) => {
    const aTier = isSe365(a.provider) ? 3 : isFtn(a.provider) ? 2 : 1;
    const bTier = isSe365(b.provider) ? 3 : isFtn(b.provider) ? 2 : 1;

    if (aTier !== bTier) return bTier - aTier;
    if (b.score !== a.score) return b.score - a.score;
    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;
    return clean(a.provider).localeCompare(clean(b.provider));
  };

  strong.sort(sortByPriority);
  weak.sort(sortByPriority);

  return { strong, weak };
}

export function normalizeTicketOptions(
  resolved: TicketResolutionResult | null | undefined
): TicketResolutionOption[] {
  const fromOptions = Array.isArray(resolved?.options) ? resolved!.options : [];

  const primaryCandidate =
    resolved?.provider && resolved?.url && resolved?.title && typeof resolved?.score === "number"
      ? [
          {
            provider: resolved.provider,
            exact: Boolean(resolved.exact),
            score: resolved.score,
            rawScore: typeof resolved.rawScore === "number" ? resolved.rawScore : null,
            url: resolved.url,
            title: resolved.title,
            priceText: resolved.priceText ?? null,
            reason:
              resolved.reason === "exact_event" ||
              resolved.reason === "partial_match" ||
              resolved.reason === "search_fallback"
                ? resolved.reason
                : "search_fallback",
            urlQuality: normalizeTicketUrlQuality(resolved.urlQuality, resolved.url),
          } as TicketResolutionOption,
        ]
      : [];

  const merged = [...primaryCandidate, ...fromOptions];

  const seen = new Map<string, TicketResolutionOption>();

  for (const option of merged) {
    const key = `${normalizeProvider(option.provider)}|${clean(option.url)}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, {
        ...option,
        urlQuality: normalizeTicketUrlQuality(option.urlQuality, option.url),
      });
      continue;
    }

    const replace =
      Boolean(option.exact && !existing.exact) ||
      Number(option.score ?? 0) > Number(existing.score ?? 0);

    if (replace) {
      seen.set(key, {
        ...option,
        urlQuality: normalizeTicketUrlQuality(option.urlQuality, option.url),
      });
    }
  }

  return Array.from(seen.values());
}

export function ticketResolverFailureMessage(
  resolved: TicketResolutionResult | null | undefined
): string {
  if (!resolved) {
    return "No ticket routes were returned.";
  }

  const error = clean(resolved.error);

  if (error === "timeout") return "Ticket lookup timed out.";
  if (error === "network_error") return "Ticket lookup failed due to a network issue.";
  if (error === "missing_backend_url") return "Ticket lookup backend is not configured.";
  if (error === "invalid_resolve_args") return "Ticket lookup request was invalid.";
  if (error === "not_found") return "No ticket routes were found for this fixture.";

  return "No usable ticket routes were found.";
}

/**
 * =========
 * PROVIDER DISPLAY (UI ONLY)
 * =========
 */

export function providerShort(provider?: string | null): string {
  if (isFtn(provider)) return "FTN";
  if (isSe365(provider)) return "SE365";
  return "T";
}

export function providerLabel(provider?: string | null): string {
  if (isFtn(provider)) return "FootballTicketNet";
  if (isSe365(provider)) return "SportsEvents365";
  return "Tickets";
}

export function providerBadgeStyle(provider?: string | null) {
  if (isFtn(provider)) {
    return {
      backgroundColor: "rgba(0,200,255,0.12)",
      borderColor: "rgba(0,200,255,0.35)",
      textColor: "#00C8FF",
    };
  }

  if (isSe365(provider)) {
    return {
      backgroundColor: "rgba(255,140,0,0.12)",
      borderColor: "rgba(255,140,0,0.35)",
      textColor: "#FF8C00",
    };
  }

  return {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.18)",
    textColor: "#FFFFFF",
  };
}

export function mapTicketProviderToPartnerId(provider?: string | null): PartnerId {
  if (isSe365(provider)) return "sportsevents365";
  if (isFtn(provider)) return "footballticketnet";

  throw new Error(`Unsupported ticket provider: ${clean(provider)}`);
}

/**
 * =========
 * PRICE DISPLAY
 * =========
 */

export function livePriceLine(item: any): string | null {
  const raw = clean(item?.metadata?.priceText);

  if (!raw) return null;

  return raw
    .replace(/\bLive price on\b/gi, "Live price •")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * =========
 * UI HELPERS
 * =========
 */

export function ticketProviderFromItem(item: any | null): string | null {
  if (!item) return null;

  return clean(item?.metadata?.ticketProvider || item?.partnerId) || null;
}

export function itemResolvedScore(item: any | null): number | null {
  const val = item?.metadata?.score;
  return typeof val === "number" ? val : null;
}

export function smartButtonSubtitle(item: any | null, fallback: string): string {
  if (!item) return fallback;

  if (item.status === "booked") return "Booked";
  if (item.status === "pending") return "Pending";
  if (item.status === "saved") return fallback;

  return fallback;
}

export function proCapHint(limit: number, used: number): string | undefined {
  if (!Number.isFinite(limit) || !Number.isFinite(used)) return undefined;
  if (used < limit) return undefined;
  return `Free plan cap reached (${used}/${limit}).`;
}

/**
 * =========
 * NOTES
 * =========
 */

export function cleanNoteText(value: unknown): string {
  return clean(value).replace(/\s+/g, " ").trim();
}

export function noteTitleFromText(text: string): string {
  const cleaned = cleanNoteText(text);
  if (!cleaned) return "Note";
  if (cleaned.length <= 40) return cleaned;
  return `${cleaned.slice(0, 40).trim()}…`;
}

/**
 * =========
 * TRIP DETAIL DISPLAY
 * =========
 */

export function summaryLine(trip: any): string {
  const city = clean(trip?.displayCity || trip?.venueCity || trip?.cityId);
  const start = clean(trip?.startDate);
  const end = clean(trip?.endDate);

  const parts = [city || null, start && end ? `${start} → ${end}` : null].filter(Boolean);
  return parts.length ? parts.join(" • ") : "Trip summary unavailable";
}

export function tripStatus(trip: any): "Upcoming" | "In progress" | "Completed" {
  const start = clean(trip?.startDate);
  const end = clean(trip?.endDate);

  if (!start || !end) return "Upcoming";

  const today = getIsoDateOnly(new Date().toISOString());
  if (!today) return "Upcoming";

  if (today > end) return "Completed";
  if (today >= start && today <= end) return "In progress";
  return "Upcoming";
}

export function formatKickoffMeta(
  fixture: any,
  trip: any
): { line: string; tbc: boolean; dateIso: string | null } {
  const kickoffIso = clean(fixture?.fixture?.date || trip?.kickoffIso);
  const statusShort = clean(fixture?.fixture?.status?.short || "").toUpperCase();
  const dateIso = getIsoDateOnly(kickoffIso);

  const kickoffDate = kickoffIso ? new Date(kickoffIso) : null;
  const validDate = kickoffDate && Number.isFinite(kickoffDate.getTime()) ? kickoffDate : null;

  const midnight = validDate
    ? validDate.getHours() === 0 && validDate.getMinutes() === 0
    : true;

  const tbc =
    Boolean(trip?.kickoffTbc) ||
    statusShort === "TBD" ||
    statusShort === "TBA" ||
    statusShort === "NS" ||
    statusShort === "PST" ||
    midnight;

  if (!validDate || !dateIso) {
    return {
      line: tbc ? "Kickoff TBC" : "Kickoff not confirmed",
      tbc: true,
      dateIso: null,
    };
  }

  const day = validDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const time = validDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    line: tbc ? `${day} • ${time} (TBC)` : `${day} • ${time}`,
    tbc,
    dateIso,
  };
    }
