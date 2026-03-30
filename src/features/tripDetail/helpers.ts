import {
  canonicalizePartnerId,
  getPartnerOrNull,
  supportsCategory,
  type PartnerId,
} from "@/src/constants/partners";
import type { SavedItem } from "@/src/core/savedItemTypes";
import type { Trip } from "@/src/state/trips";
import { parseIsoDateOnly, toIsoDate } from "@/src/constants/football";
import { formatUkDateOnly } from "@/src/utils/formatters";
import type {
  TicketResolutionOption,
  TicketResolutionResult,
  TicketUrlQuality,
} from "@/src/services/ticketResolver";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { RankedTrip, TravelDifficulty } from "@/src/features/tripFinder/types";

/* -------------------------------------------------------------------------- */
/* Core utils                                                                 */
/* -------------------------------------------------------------------------- */

export function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export function cleanUpper3(value: unknown, fallback: string): string {
  const upper = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : fallback;
}

/* -------------------------------------------------------------------------- */
/* Trip helpers                                                               */
/* -------------------------------------------------------------------------- */

export function summaryLine(trip: Trip): string {
  const from = trip.startDate ? formatUkDateOnly(trip.startDate) : "—";
  const to = trip.endDate ? formatUkDateOnly(trip.endDate) : "—";
  const count = Array.isArray(trip.matchIds) ? trip.matchIds.length : 0;
  return `${from} → ${to} • ${count} match${count === 1 ? "" : "es"}`;
}

export function tripStatus(trip: Trip): "Upcoming" | "Past" {
  const end = trip.endDate ? parseIsoDateOnly(trip.endDate) : null;
  if (!end) return "Upcoming";

  const today = parseIsoDateOnly(toIsoDate(new Date()));
  if (!today) return "Upcoming";

  return end.getTime() < today.getTime() ? "Past" : "Upcoming";
}

/* -------------------------------------------------------------------------- */
/* Provider helpers                                                           */
/* -------------------------------------------------------------------------- */

export function providerLabel(provider?: string | null): string {
  const canonical = canonicalizePartnerId(provider);
  if (!canonical) return clean(provider) || "Provider";

  const partner = getPartnerOrNull(canonical);
  return partner?.display.name || clean(provider) || "Provider";
}

export function providerShort(provider?: string | null): string {
  const canonical = canonicalizePartnerId(provider);
  if (!canonical) return "P";

  const partner = getPartnerOrNull(canonical);
  return partner?.display.badgeText || "P";
}

/* -------------------------------------------------------------------------- */
/* Ticket quality / strength helpers                                          */
/* -------------------------------------------------------------------------- */

export type TicketStrength = "strong" | "medium" | "weak";

export function normalizeTicketUrlQuality(
  value?: TicketUrlQuality | string | null,
  fallbackUrl?: string | null
): TicketUrlQuality {
  const raw = clean(value).toLowerCase();

  if (raw === "event") return "event";
  if (raw === "listing") return "listing";
  if (raw === "search") return "search";
  if (raw === "unknown") return "unknown";

  const url = clean(fallbackUrl).toLowerCase();
  if (!url) return "unknown";

  if (
    url.includes("/search") ||
    url.includes("search-results") ||
    url.includes("query=") ||
    url.includes("q=") ||
    url.includes("text=") ||
    url.includes("sjv.io")
  ) {
    return "search";
  }

  if (url.includes("/listing") || url.includes("/listings")) return "listing";
  if (url.includes("/event") || url.includes("/events") || url.includes("/tickets")) {
    return "event";
  }

  return "unknown";
}

export function isStrongTicketOption(option: TicketResolutionOption): boolean {
  const reason = clean(option.reason);
  const urlQuality = normalizeTicketUrlQuality(option.urlQuality, option.url);

  if (option.exact || reason === "exact_event") {
    return urlQuality === "event" || urlQuality === "listing" || urlQuality === "unknown";
  }

  if (reason === "partial_match") {
    return urlQuality === "event" || urlQuality === "listing";
  }

  return false;
}

export function classifyTicketOption(option: TicketResolutionOption): TicketStrength {
  const score = typeof option.score === "number" ? option.score : 0;
  const reason = clean(option.reason);
  const urlQuality = normalizeTicketUrlQuality(option.urlQuality, option.url);

  if (
    (option.exact || reason === "exact_event") &&
    (urlQuality === "event" || urlQuality === "listing") &&
    score >= 78
  ) {
    return "strong";
  }

  if (
    reason === "partial_match" &&
    (urlQuality === "event" || urlQuality === "listing") &&
    score >= 60
  ) {
    return "medium";
  }

  if (
    (option.exact || reason === "exact_event") &&
    urlQuality === "unknown" &&
    score >= 72
  ) {
    return "medium";
  }

  return "weak";
}

/* -------------------------------------------------------------------------- */
/* Ticket labels                                                              */
/* -------------------------------------------------------------------------- */

export function ticketUrlQualityLabel(
  value?: TicketUrlQuality | string | null
): string | null {
  const raw = clean(value).toLowerCase();

  if (raw === "event") return "Direct event page";
  if (raw === "listing") return "Listing page";
  if (raw === "search") return "Search fallback";
  if (raw === "unknown") return "Unclear route";

  return null;
}

export function optionReasonLabel(
  reason?: TicketResolutionOption["reason"] | string | null
): string {
  if (reason === "exact_event") return "Exact fixture match";
  if (reason === "partial_match") return "Related listing";
  return "Fallback search result";
}

/* -------------------------------------------------------------------------- */
/* Price / display logic                                                      */
/* -------------------------------------------------------------------------- */

export function livePriceLine(item: SavedItem): string | null {
  if (!clean(item.partnerUrl)) return null;

  const resolvedPrice = clean(item.metadata?.resolvedPriceText);
  const provider = providerLabel(
    clean(item.metadata?.ticketProvider) || clean(item.partnerId)
  );

  const reason = clean(item.metadata?.resolutionReason);
  const urlQuality = normalizeTicketUrlQuality(
    clean(item.metadata?.urlQuality),
    clean(item.partnerUrl)
  );

  const score =
    typeof item.metadata?.score === "number" ? item.metadata.score : null;

  const strength: TicketStrength =
    (Boolean(item.metadata?.exactMatch) || reason === "exact_event") &&
    (urlQuality === "event" || urlQuality === "listing") &&
    score != null &&
    score >= 78
      ? "strong"
      : reason === "partial_match" &&
          (urlQuality === "event" || urlQuality === "listing") &&
          score != null &&
          score >= 60
        ? "medium"
        : "weak";

  if (item.status === "booked") {
    const bookedPrice = clean(item.priceText) || resolvedPrice;
    return bookedPrice ? `Booked • ${bookedPrice}` : "Booked";
  }

  if (strength === "strong") {
    if (resolvedPrice && provider) return `From ${resolvedPrice} • ${provider}`;
    if (resolvedPrice) return `From ${resolvedPrice}`;
    if (provider) return `View on ${provider}`;
  }

  if (strength === "medium") {
    if (resolvedPrice && provider) return `${resolvedPrice} • ${provider}`;
    if (provider) return `Check ${provider}`;
  }

  return "Check availability";
}

/* -------------------------------------------------------------------------- */
/* Resolver failure messaging                                                 */
/* -------------------------------------------------------------------------- */

export function ticketResolverFailureMessage(
  resolved: TicketResolutionResult | null
): string {
  if (!resolved) return "Ticket options are unavailable right now.";

  const error = clean((resolved as { error?: unknown })?.error);

  if (error === "network_error") {
    return "Couldn’t reach ticket providers. Try again.";
  }

  if (error === "timeout") {
    return "Ticket providers took too long. Try again.";
  }

  if (error === "invalid_backend_json") {
    return "Ticket data is temporarily unavailable.";
  }

  if (error === "missing_backend_url") {
    return "Ticket system not configured.";
  }

  const options = Array.isArray(resolved.options) ? resolved.options : [];
  if (!resolved.ok && options.length > 0) {
    return "Only weaker ticket routes available.";
  }

  return "No ticket options found.";
}

/* -------------------------------------------------------------------------- */
/* Ticket normalization                                                       */
/* -------------------------------------------------------------------------- */

export function normalizeTicketOptions(
  resolved: TicketResolutionResult | null
): TicketResolutionOption[] {
  if (!resolved) return [];

  const options = Array.isArray(resolved.options) ? resolved.options : [];
  const deduped = new Map<string, TicketResolutionOption>();

  for (const option of options) {
    const provider = clean(option?.provider);
    const url = clean(option?.url);
    const title = clean(option?.title);
    const score = typeof option?.score === "number" ? option.score : null;

    if (!provider || !url || !title || score == null) continue;

    const key = `${provider.toLowerCase()}|${url}`;
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, option);
      continue;
    }

    const nextStrength = classifyTicketOption(option);
    const existingStrength = classifyTicketOption(existing);

    const rank = (value: TicketStrength) =>
      value === "strong" ? 3 : value === "medium" ? 2 : 1;

    if (rank(nextStrength) > rank(existingStrength)) {
      deduped.set(key, option);
      continue;
    }

    if (rank(nextStrength) === rank(existingStrength)) {
      if ((option.exact && !existing.exact) || score > existing.score) {
        deduped.set(key, option);
      }
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const aStrength = classifyTicketOption(a);
    const bStrength = classifyTicketOption(b);

    const rank = (value: TicketStrength) =>
      value === "strong" ? 3 : value === "medium" ? 2 : 1;

    if (rank(aStrength) !== rank(bStrength)) {
      return rank(bStrength) - rank(aStrength);
    }

    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;

    return b.score - a.score;
  });
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */

export function mapTicketProviderToPartnerId(provider?: string | null): PartnerId {
  const canonical = canonicalizePartnerId(provider);
  if (!canonical) {
    throw new Error(`Unsupported ticket provider: ${clean(provider) || "unknown"}`);
  }

  const partner = getPartnerOrNull(canonical);
  if (!partner || !supportsCategory(canonical, "tickets")) {
    throw new Error(`Provider is not a ticket partner: ${clean(provider)}`);
  }

  return canonical;
}

export function getIsoDateOnly(raw?: string | null): string | undefined {
  const value = clean(raw);
  if (!value) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;

  return date.toISOString().slice(0, 10);
}
