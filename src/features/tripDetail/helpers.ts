// src/features/tripDetail/helpers.ts

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
} from "@/src/services/ticketResolver";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { RankedTrip, TravelDifficulty } from "@/src/features/tripFinder/types";

export type PlanValue = "not_set" | "free" | "premium";

export type AffiliateUrls = {
  /* Canonical */
  ticketsUrl?: string | null;
  flightsUrl?: string | null;
  staysUrl?: string | null;
  trainsUrl?: string | null;
  busesUrl?: string | null;
  transfersUrl?: string | null;
  insuranceUrl?: string | null;
  thingsUrl?: string | null;
  carHireUrl?: string | null;

  /* Utility */
  mapsUrl?: string | null;
  officialSiteUrl?: string | null;

  /* Internal */
  claimsUrl?: string | null;

  /* Compatibility */
  hotelsUrl?: string | null;
  experiencesUrl?: string | null;
  transportUrl?: string | null;
  omioUrl?: string | null;
};

export type SmartButton = {
  title: string;
  sub: string;
  onPress: () => void;
  kind?: "primary" | "neutral";
  provider?: string | null;
};

export type TripFinderSummary = {
  difficulty: string | null;
  confidence: string | null;
  reasons: string | null;
  score: number | null;
};

export type GuidanceArea = {
  area: string;
  notes?: string;
};

export type PartnerUiBadgeStyle = {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
};

export type SourceSurface =
  | "smart_booking"
  | "next_best_action"
  | "progress_strip"
  | "workspace_cta"
  | "workspace_item"
  | "match_screen"
  | "ticket_choice_alert"
  | "match_card"
  | "unknown";

export type SourceSection =
  | "tickets"
  | "stay"
  | "travel"
  | "transfers"
  | "things"
  | "insurance"
  | "claims"
  | "notes"
  | "summary"
  | "unknown";

const DEFAULT_PARTNER_BADGE_STYLE: PartnerUiBadgeStyle = {
  borderColor: "rgba(255,255,255,0.15)",
  backgroundColor: "rgba(255,255,255,0.06)",
  textColor: "rgba(242,244,246,1)",
};

export function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export function coerceId(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim() || null;
  }
  return null;
}

export function isNumericId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]+$/.test(value.trim());
}

export function defer(fn: () => void) {
  setTimeout(fn, 60);
}

export function cleanUpper3(value: unknown, fallback: string): string {
  const upper = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : fallback;
}

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

export function cleanNoteText(value: string): string {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

export function noteTitleFromText(text: string): string {
  const cleaned = cleanNoteText(text);
  if (!cleaned) return "Note";

  const firstLine = cleaned.split("\n")[0]?.trim() || "";
  return firstLine.length > 42 ? `${firstLine.slice(0, 42).trim()}…` : firstLine;
}

export function statusLabel(status: SavedItem["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "saved":
      return "Saved";
    case "booked":
      return "Booked";
    case "archived":
    default:
      return "Archived";
  }
}

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

export function providerBadgeStyle(_provider?: string | null): PartnerUiBadgeStyle {
  return DEFAULT_PARTNER_BADGE_STYLE;
}

export function ticketConfidenceLabel(score?: number | null): string | null {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (score >= 90) return "Best match";
  if (score >= 75) return "Strong option";
  if (score >= 60) return "Good option";
  return "Other option";
}

export function confidenceLabel(score?: number | null): string {
  if (typeof score !== "number" || !Number.isFinite(score)) return "Available";
  if (score >= 90) return "Best match";
  if (score >= 75) return "Strong option";
  if (score >= 60) return "Good option";
  return "Available";
}

export function optionReasonLabel(reason?: TicketResolutionOption["reason"] | string | null): string {
  if (reason === "exact_event") return "Best match for this fixture";
  if (reason === "partial_match") return "Similar fixture listing";
  return "Search result";
}

export function livePriceLine(item: SavedItem): string | null {
  if (!clean(item.partnerUrl)) return null;

  const resolvedPrice = clean(item.metadata?.resolvedPriceText);
  const provider = providerLabel(clean(item.metadata?.ticketProvider) || clean(item.partnerId));

  if (item.status === "booked") {
    const bookedPrice = clean(item.priceText) || resolvedPrice;
    return bookedPrice ? `Booked • ${bookedPrice}` : "Booked";
  }

  if (resolvedPrice && provider) return `From ${resolvedPrice} • ${provider}`;
  if (resolvedPrice) return `From ${resolvedPrice}`;
  if (provider) return `View on ${provider}`;

  return "View offer";
}

export function parseIsoToDate(iso?: string | null): Date | null {
  const raw = clean(iso);
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatKickoffMeta(
  row?: FixtureListRow | null,
  trip?: Trip | null
): { line: string; tbc: boolean; iso: string | null } {
  const isoRaw = (row as any)?.fixture?.date ?? (trip as any)?.kickoffIso;
  const iso = clean(isoRaw) || null;

  const date = parseIsoToDate(iso);
  const short = clean((row as any)?.fixture?.status?.short).toUpperCase();
  const long = clean((row as any)?.fixture?.status?.long);

  const looksTbc = short === "TBD" || short === "TBA" || short === "NS" || short === "PST";
  const snapTbc = Boolean((trip as any)?.kickoffTbc);

  if (!date) {
    const tbc = looksTbc || snapTbc;
    return { line: tbc ? "Kickoff: TBC" : "Kickoff: —", tbc: true, iso };
  }

  const datePart = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const midnight = date.getHours() === 0 && date.getMinutes() === 0;
  const tbc = looksTbc || snapTbc || midnight;

  if (tbc) {
    return { line: `Kickoff: ${datePart} • TBC`, tbc: true, iso };
  }

  return {
    line: `Kickoff: ${datePart} • ${timePart}${long ? ` • ${long}` : ""}`,
    tbc: false,
    iso,
  };
}

export function titleCaseCity(value: string): string {
  const cleaned = clean(value);
  if (!cleaned) return "Trip";

  const looksSlug = cleaned.includes("-") && cleaned === cleaned.toLowerCase();
  const base = looksSlug ? cleaned.replace(/-/g, " ") : cleaned;

  return base
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => (word[0] ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function buildMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean(query))}`;
}

export function buildMapsDirectionsUrl(
  origin: string,
  destination: string,
  mode: "transit" | "walking" | "driving" = "transit"
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    clean(origin)
  )}&destination=${encodeURIComponent(clean(destination))}&travelmode=${encodeURIComponent(mode)}`;
}

export function isLateKickoff(kickoffIso?: string | null): boolean {
  const raw = clean(kickoffIso);
  if (!raw) return false;

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return false;

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return hours > 20 || (hours === 20 && minutes >= 30);
}

export function proCapHint(cap: number, tripCount: number): string {
  return tripCount < cap
    ? `Free plan: up to ${cap} saved trips.`
    : `Free plan cap reached (${cap}). Pro removes the cap.`;
}

export function difficultyLabel(value?: TravelDifficulty | null): string | null {
  if (!value) return null;
  if (value === "easy") return "Easy travel";
  if (value === "moderate") return "Moderate travel";
  if (value === "hard") return "Harder travel";
  if (value === "complex") return "Complex travel";
  return null;
}

export function confidencePctLabel(value?: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return `${pct}% fit`;
}

export function rankReasonsText(trip: RankedTrip | null): string | null {
  const lines = trip?.breakdown?.reasonLines;
  if (!Array.isArray(lines) || lines.length === 0) return null;
  return lines.slice(0, 2).join(" • ");
}

export function mapTicketProviderToPartnerId(provider?: string | null): PartnerId {
  const canonical = canonicalizePartnerId(provider);
  if (!canonical) {
    throw new Error(`Unsupported ticket provider: ${clean(provider) || "unknown"}`);
  }

  const partner = getPartnerOrNull(canonical);
  if (!partner || !supportsCategory(canonical, "tickets")) {
    throw new Error(`Provider is not a canonical ticket partner: ${clean(provider) || canonical}`);
  }

  return canonical;
}

export function ticketResolverFailureMessage(resolved: TicketResolutionResult | null): string {
  if (!resolved) return "Ticket options are unavailable right now.";

  const error = clean((resolved as any)?.error);

  if (error === "network_error") {
    return "We couldn’t reach ticket providers right now. Please try again.";
  }

  if (error === "timeout") {
    return "Ticket providers took too long to respond. Please try again.";
  }

  if (error === "invalid_backend_json") {
    return "Ticket options are temporarily unavailable. Please try again.";
  }

  if (error === "missing_backend_url") {
    return "Ticket options are not set up correctly yet.";
  }

  return "No ticket options found for this fixture right now.";
}

export function smartButtonSubtitle(item: SavedItem | null, fallback: string): string {
  return item ? livePriceLine(item) || statusLabel(item.status) : fallback;
}

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

    const normalized: TicketResolutionOption = {
      provider,
      exact: Boolean(option.exact),
      score,
      url,
      title,
      priceText: clean(option.priceText) || null,
      reason:
        option.reason === "exact_event" || option.reason === "partial_match"
          ? option.reason
          : "search_fallback",
    };

    const key = `${provider.toLowerCase()}|${url}`;
    const existing = deduped.get(key);

    if (!existing || (normalized.exact && !existing.exact) || normalized.score > existing.score) {
      deduped.set(key, normalized);
    }
  }

  const values = Array.from(deduped.values()).sort((a, b) => {
    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;
    if (b.score !== a.score) return b.score - a.score;

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return providerLabel(a.provider).localeCompare(providerLabel(b.provider));
  });

  if (values.length > 0) return values;

  if (resolved.ok && clean(resolved.provider) && clean(resolved.url) && clean(resolved.title)) {
    return [
      {
        provider: clean(resolved.provider),
        exact: Boolean(resolved.exact),
        score: typeof resolved.score === "number" ? resolved.score : 0,
        url: clean(resolved.url),
        title: clean(resolved.title),
        priceText: clean(resolved.priceText) || null,
        reason:
          resolved.reason === "exact_event"
            ? "exact_event"
            : resolved.reason === "partial_match"
              ? "partial_match"
              : "search_fallback",
      },
    ];
  }

  return [];
}

export function ticketProviderFromItem(item: SavedItem | null): string | null {
  if (!item) return null;
  return clean(item.metadata?.ticketProvider) || clean(item.partnerId) || null;
}

export function itemResolvedScore(item: SavedItem | null): number | null {
  if (!item) return null;
  const raw = item.metadata?.score;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function getIsoDateOnly(raw?: string | null): string | undefined {
  const value = clean(raw);
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
      }
