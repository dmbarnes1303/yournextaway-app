// src/features/tripDetail/helpers.ts

import type { TicketResolutionOption } from "@/src/services/ticketResolver";

/**
 * =========
 * BASICS
 * =========
 */

export function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeProvider(provider?: string | null): string {
  return clean(provider).toLowerCase();
}

function isSe365(provider?: string | null): boolean {
  const p = normalizeProvider(provider);
  return p === "sportsevents365" || p === "se365";
}

function isFtn(provider?: string | null): boolean {
  const p = normalizeProvider(provider);
  return p === "footballticketnet" || p === "ftn";
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

/**
 * =========
 * CORE TICKET INTELLIGENCE (SINGLE SOURCE)
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

/**
 * =========
 * PROVIDER DISPLAY (UI ONLY — NOT COMMERCIAL LOGIC)
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

  return clean(item?.metadata?.ticketProvider) || null;
}

export function itemResolvedScore(item: any | null): number | null {
  const val = item?.metadata?.score;
  return typeof val === "number" ? val : null;
}

/**
 * =========
 * AFFILIATE URL SHAPE
 * =========
 */

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
