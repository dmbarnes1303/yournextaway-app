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
/* Ticket strength classification (NEW CORE LOGIC)                             */
/* -------------------------------------------------------------------------- */

export type TicketStrength = "strong" | "medium" | "weak";

export function classifyTicketOption(option: TicketResolutionOption): TicketStrength {
  const score = typeof option.score === "number" ? option.score : 0;

  if (option.exact && score >= 85) return "strong";
  if (score >= 70) return "medium";
  return "weak";
}

/* -------------------------------------------------------------------------- */
/* Ticket labels (tightened)                                                   */
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
/* Price / display logic (FIXED)                                               */
/* -------------------------------------------------------------------------- */

export function livePriceLine(item: SavedItem): string | null {
  if (!clean(item.partnerUrl)) return null;

  const resolvedPrice = clean(item.metadata?.resolvedPriceText);
  const provider = providerLabel(
    clean(item.metadata?.ticketProvider) || clean(item.partnerId)
  );

  const score =
    typeof item.metadata?.score === "number" ? item.metadata.score : null;

  const strength: TicketStrength =
    score == null
      ? "weak"
      : score >= 85
        ? "strong"
        : score >= 70
          ? "medium"
          : "weak";

  if (item.status === "booked") {
    const bookedPrice = clean(item.priceText) || resolvedPrice;
    return bookedPrice ? `Booked • ${bookedPrice}` : "Booked";
  }

  // Strong = normal UX
  if (strength === "strong") {
    if (resolvedPrice && provider) return `From ${resolvedPrice} • ${provider}`;
    if (resolvedPrice) return `From ${resolvedPrice}`;
    if (provider) return `View on ${provider}`;
  }

  // Medium = slight downgrade
  if (strength === "medium") {
    if (resolvedPrice && provider) return `${resolvedPrice} • ${provider}`;
    if (provider) return `Check ${provider}`;
  }

  // Weak = be honest
  return "Check availability";
}

/* -------------------------------------------------------------------------- */
/* Resolver failure messaging (IMPROVED)                                       */
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

  if (resolved.ok && Array.isArray(resolved.options) && resolved.options.length > 0) {
    return "Only weaker ticket routes available.";
  }

  return "No ticket options found.";
}

/* -------------------------------------------------------------------------- */
/* Ticket normalization (unchanged core, cleaner intent)                       */
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

    if (!existing || (option.exact && !existing.exact) || score > existing.score) {
      deduped.set(key, option);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
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
