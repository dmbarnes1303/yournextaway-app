import type {
  TicketResolutionOption,
  TicketResolutionResult,
} from "@/src/services/ticketResolver";
import type { PartnerId } from "@/src/constants/partners";
import type { RankedTrip } from "@/src/features/tripFinder/types";

/* ============================================================================
 * BASICS
 * ========================================================================== */

export function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export function coerceId(value: unknown): string | null {
  const raw = clean(value);
  return raw || null;
}

export function defer(fn: () => void, delay = 0) {
  return setTimeout(fn, delay);
}

export type PlanValue = "not_set" | "free" | "premium";

/* ============================================================================
 * SHARED FEATURE TYPES
 * ========================================================================== */

export type SourceSurface =
  | "unknown"
  | "workspace_cta"
  | "workspace_item"
  | "ticket_choice_alert"
  | "progress_strip"
  | "next_best_action"
  | "smart_booking"
  | "match_screen";

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
  ticketMarketplaceUrl: string | null;
  secondaryTicketMarketplaceUrl: string | null;
  flightsUrl: string | null;
  hotelsUrl: string | null;
  insuranceUrl: string | null;
};

export type GuidanceArea = {
  area: string;
  notes?: string;
};

export type TripFinderSummary = {
  difficulty: string | null;
  confidence: string | null;
  reasons: string | null;
  score: number | null;
};

/* ============================================================================
 * GENERIC SMALL HELPERS
 * ========================================================================== */

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

export function buildMapsSearchUrl(query: unknown): string | null {
  const q = clean(query);
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

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

/* ============================================================================
 * TICKET PROVIDER NORMALIZATION
 * ========================================================================== */

function normalizeProvider(provider?: string | null): string {
  return clean(provider).toLowerCase();
}

function canonicalTicketProvider(provider?: string | null): string {
  const p = normalizeProvider(provider);

  if (p === "sportsevents365" || p === "se365") return "sportsevents365";

  if (
    p === "footballticketnet" ||
    p === "footballticketsnet" ||
    p === "footballticketnet.com" ||
    p === "footballticketsnet.com" ||
    p === "ftn"
  ) {
    return "footballticketnet";
  }

  return p;
}

function isSe365(provider?: string | null): boolean {
  return canonicalTicketProvider(provider) === "sportsevents365";
}

function isFtn(provider?: string | null): boolean {
  return canonicalTicketProvider(provider) === "footballticketnet";
}

/* ============================================================================
 * TICKET URL QUALITY
 * ========================================================================== */

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

/* ============================================================================
 * TICKET INTELLIGENCE
 * ========================================================================== */

function getReasonWeight(reason?: string | null): number {
  const raw = clean(reason);
  if (raw === "exact_event") return 3;
  if (raw === "partial_match") return 2;
  if (raw === "search_fallback") return 1;
  return 0;
}

function getUrlQualityWeight(urlQuality: TicketUrlQuality): number {
  if (urlQuality === "event") return 4;
  if (urlQuality === "listing") return 3;
  if (urlQuality === "search") return 1;
  return 0;
}

function getNumericScore(option: TicketResolutionOption): number {
  return typeof option.score === "number" && Number.isFinite(option.score) ? option.score : 0;
}

function getParsedPrice(option: TicketResolutionOption): number | null {
  const raw = clean(option.priceText);
  if (!raw) return null;

  const match = raw.match(/(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)/);
  if (!match) return null;

  const parsed = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function optionSortValue(option: TicketResolutionOption) {
  const urlQuality = getTicketUrlQuality(option);
  const price = getParsedPrice(option);

  return {
    exact: option.exact ? 1 : 0,
    reasonWeight: getReasonWeight(option.reason),
    urlWeight: getUrlQualityWeight(urlQuality),
    score: getNumericScore(option),
    hasPrice: price != null ? 1 : 0,
    price: price ?? Number.POSITIVE_INFINITY,
    provider: canonicalTicketProvider(option.provider),
  };
}

export function isStrongTicketOption(option: TicketResolutionOption): boolean {
  const urlQuality = getTicketUrlQuality(option);
  const reasonWeight = getReasonWeight(option.reason);

  if (option.exact && (urlQuality === "event" || urlQuality === "listing")) return true;
  if (reasonWeight >= 2 && (urlQuality === "event" || urlQuality === "listing")) return true;

  return false;
}

export function classifyTicketOption(
  option: TicketResolutionOption
): "strong" | "medium" | "weak" {
  const urlQuality = getTicketUrlQuality(option);
  const reasonWeight = getReasonWeight(option.reason);
  const score = getNumericScore(option);

  if (option.exact && (urlQuality === "event" || urlQuality === "listing")) return "strong";
  if (reasonWeight >= 2 && (urlQuality === "event" || urlQuality === "listing") && score >= 60) {
    return "strong";
  }

  if (reasonWeight >= 2 || urlQuality === "listing" || urlQuality === "event") {
    return "medium";
  }

  return "weak";
}

function compareTicketOptions(a: TicketResolutionOption, b: TicketResolutionOption): number {
  const av = optionSortValue(a);
  const bv = optionSortValue(b);

  if (av.exact !== bv.exact) return bv.exact - av.exact;
  if (av.reasonWeight !== bv.reasonWeight) return bv.reasonWeight - av.reasonWeight;
  if (av.urlWeight !== bv.urlWeight) return bv.urlWeight - av.urlWeight;
  if (av.score !== bv.score) return bv.score - av.score;

  if (av.hasPrice !== bv.hasPrice) return bv.hasPrice - av.hasPrice;
  if (av.price !== bv.price) return av.price - bv.price;

  if (av.provider !== bv.provider) return av.provider.localeCompare(bv.provider);

  return clean(a.title).localeCompare(clean(b.title));
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

  strong.sort(compareTicketOptions);
  weak.sort(compareTicketOptions);

  return { strong, weak };
}

export function normalizeTicketOptions(
  resolved: TicketResolutionResult | null | undefined
): TicketResolutionOption[] {
  const fromOptions = Array.isArray(resolved?.options) ? resolved.options : [];

  const primaryCandidate =
    resolved?.provider && resolved?.url && resolved?.title && typeof resolved?.score === "number"
      ? [
          {
            provider: canonicalTicketProvider(resolved.provider),
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
    const canonicalProvider = canonicalTicketProvider(option.provider);
    const key = `${canonicalProvider}|${clean(option.url)}`;
    const existing = seen.get(key);

    const normalized: TicketResolutionOption = {
      ...option,
      provider: canonicalProvider,
      urlQuality: normalizeTicketUrlQuality(option.urlQuality, option.url),
    };

    if (!existing) {
      seen.set(key, normalized);
      continue;
    }

    if (compareTicketOptions(normalized, existing) < 0) {
      seen.set(key, normalized);
    }
  }

  return Array.from(seen.values()).sort(compareTicketOptions);
}

export function ticketResolverFailureMessage(
  resolved: TicketResolutionResult | null | undefined
): string {
  if (!resolved) return "No ticket routes were returned.";

  const error = clean(resolved.error);

  if (error === "timeout") return "Ticket lookup timed out.";
  if (error === "network_error") return "Ticket lookup failed due to a network issue.";
  if (error === "missing_backend_url") return "Ticket lookup backend is not configured.";
  if (error === "invalid_resolve_args") return "Ticket lookup request was invalid.";
  if (error === "not_found") return "No ticket routes were found for this fixture.";

  return "No usable ticket routes were found.";
}

/* ============================================================================
 * PROVIDER DISPLAY
 * ========================================================================== */

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

export function ticketUrlQualityLabel(value?: string | null): string | null {
  const quality = normalizeTicketUrlQuality(value);

  if (quality === "event") return "Direct event route";
  if (quality === "listing") return "Listing route";
  if (quality === "search") return "Search route";
  return "Unknown route";
}

export function optionReasonLabel(reason?: string | null): string {
  const raw = clean(reason);

  if (raw === "exact_event") return "Exact fixture";
  if (raw === "partial_match") return "Related listing";
  if (raw === "search_fallback") return "Fallback search";
  return "Unknown";
}

export function ticketConfidenceLabel(score?: number | null): string {
  const n = typeof score === "number" && Number.isFinite(score) ? score : null;

  if (n == null) return "Unknown confidence";
  if (n >= 85) return "High confidence";
  if (n >= 70) return "Good confidence";
  if (n >= 60) return "Moderate confidence";
  return "Low confidence";
}

/* ============================================================================
 * PRICE / ITEM DISPLAY
 * ========================================================================== */

export function livePriceLine(item: any): string | null {
  const raw = clean(item?.metadata?.resolvedPriceText || item?.metadata?.priceText);
  if (!raw) return null;

  return raw.replace(/\bLive price on\b/gi, "Live price •").replace(/\s+/g, " ").trim();
}

export function ticketProviderFromItem(item: any | null): string | null {
  if (!item) return null;
  return canonicalTicketProvider(clean(item?.metadata?.ticketProvider || item?.partnerId) || null) || null;
}

export function itemResolvedScore(item: any | null): number | null {
  const val = item?.metadata?.score;
  return typeof val === "number" ? val : null;
}

export function smartButtonSubtitle(item: any | null, fallback: string): string {
  if (!item) return fallback;

  if (item.status === "booked") return "Marked booked";
  if (item.status === "pending") return "Pending";
  if (item.status === "saved") return fallback;

  return fallback;
}

export function proCapHint(limit: number, used: number): string | undefined {
  if (!Number.isFinite(limit) || !Number.isFinite(used)) return undefined;
  if (used < limit) return undefined;
  return `Free plan cap reached (${used}/${limit}).`;
}

/* ============================================================================
 * NOTES
 * ========================================================================== */

export function cleanNoteText(value: unknown): string {
  return clean(value).replace(/\s+/g, " ").trim();
}

export function noteTitleFromText(text: string): string {
  const cleaned = cleanNoteText(text);
  if (!cleaned) return "Note";
  if (cleaned.length <= 40) return cleaned;
  return `${cleaned.slice(0, 40).trim()}…`;
}

/* ============================================================================
 * TRIP DETAIL DISPLAY
 * ========================================================================== */

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

  const midnight =
    validDate ? validDate.getHours() === 0 && validDate.getMinutes() === 0 : true;

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

/* ============================================================================
 * TRIP FINDER / LOGISTICS SHARED HELPERS
 * ========================================================================== */

export function difficultyLabel(value?: unknown): string | null {
  const raw = clean(value).toLowerCase();

  if (!raw) return null;
  if (raw === "easy") return "Easy";
  if (raw === "moderate") return "Moderate";
  if (raw === "hard") return "Hard";
  if (raw === "complex") return "Complex";

  return null;
}

export function confidencePctLabel(value?: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  const normalized = value <= 1 ? value * 100 : value;
  const rounded = Math.max(0, Math.min(100, Math.round(normalized)));

  return `${rounded}%`;
}

export function isLateKickoff(kickoffIso?: string | null): boolean {
  const raw = clean(kickoffIso);
  if (!raw) return false;

  const dt = new Date(raw);
  if (!Number.isFinite(dt.getTime())) return false;

  return dt.getHours() >= 20;
}

export function rankReasonsText(trip: RankedTrip | null): string | null {
  if (!trip) return null;

  const lines = Array.isArray(trip?.breakdown?.reasonLines)
    ? trip.breakdown.reasonLines.map((line) => clean(line)).filter(Boolean)
    : [];

  if (!lines.length) return null;
  return lines.join(" • ");
}
