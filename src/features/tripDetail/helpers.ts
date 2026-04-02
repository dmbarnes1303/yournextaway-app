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
 */

export function isStrongTicketOption(option: TicketResolutionOption): boolean {
  const reason = clean(option.reason);
  const urlQuality = getTicketUrlQuality(option);

  // Exact matches → strong unless clearly search junk
  if (option.exact || reason === "exact_event") {
    return urlQuality === "event" || urlQuality === "listing" || urlQuality === "unknown";
  }

  // Partial matches → only strong if deep-linked
  if (reason === "partial_match") {
    return urlQuality === "event" || urlQuality === "listing";
  }

  return false;
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

  return { strong, weak };
}

/**
 * =========
 * PROVIDER DISPLAY (UI ONLY — NOT COMMERCIAL LOGIC)
 * =========
 */

export function providerShort(provider?: string | null): string {
  const p = clean(provider).toLowerCase();

  if (p.includes("footballticketsnet")) return "FTN";
  if (p.includes("sportsevents365")) return "SE365";
  if (p.includes("gigsberg")) return "GB";
  if (p.includes("stubhub")) return "SH";
  if (p.includes("viagogo")) return "VG";
  if (p.includes("ticketmaster")) return "TM";

  return "T";
}

export function providerLabel(provider?: string | null): string {
  const p = clean(provider).toLowerCase();

  if (p.includes("footballticketsnet")) return "FootballTicketNet";
  if (p.includes("sportsevents365")) return "SportsEvents365";
  if (p.includes("gigsberg")) return "Gigsberg";
  if (p.includes("stubhub")) return "StubHub";
  if (p.includes("viagogo")) return "Viagogo";
  if (p.includes("ticketmaster")) return "Ticketmaster";

  return "Tickets";
}

export function providerBadgeStyle(provider?: string | null) {
  const p = clean(provider).toLowerCase();

  if (p.includes("footballticketsnet")) {
    return {
      backgroundColor: "rgba(0,200,255,0.12)",
      borderColor: "rgba(0,200,255,0.35)",
      textColor: "#00C8FF",
    };
  }

  if (p.includes("sportsevents365")) {
    return {
      backgroundColor: "rgba(255,140,0,0.12)",
      borderColor: "rgba(255,140,0,0.35)",
      textColor: "#FF8C00",
    };
  }

  if (p.includes("gigsberg")) {
    return {
      backgroundColor: "rgba(180,120,255,0.12)",
      borderColor: "rgba(180,120,255,0.35)",
      textColor: "#B478FF",
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
