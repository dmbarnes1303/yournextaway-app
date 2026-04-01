import { theme } from "@/src/constants/theme";
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
/* Shared types                                                               */
/* -------------------------------------------------------------------------- */

export type PlanValue = "not_set" | "free" | "premium";

export type SourceSurface =
  | "unknown"
  | "workspace_cta"
  | "workspace_item"
  | "next_best_action"
  | "progress_strip"
  | "smart_booking"
  | "ticket_choice_alert"
  | "match_screen";

export type SourceSection =
  | "unknown"
  | "tickets"
  | "stay"
  | "travel"
  | "transfers"
  | "things"
  | "insurance"
  | "claims"
  | "notes";

export type AffiliateUrls = {
  ticketsUrl?: string | null;
  flightsUrl?: string | null;
  staysUrl?: string | null;
  hotelsUrl?: string | null;
  trainsUrl?: string | null;
  busesUrl?: string | null;
  transportUrl?: string | null;
  omioUrl?: string | null;
  transfersUrl?: string | null;
  insuranceUrl?: string | null;
  thingsUrl?: string | null;
  experiencesUrl?: string | null;
  carHireUrl?: string | null;
  mapsUrl?: string | null;
  officialSiteUrl?: string | null;
  claimsUrl?: string | null;
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

export type SmartButton = {
  title: string;
  sub: string;
  onPress: () => void;
  kind?: "primary" | "neutral";
  provider?: string | null;
};

export type ProviderBadgeStyle = {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
};

const DEFAULT_PROVIDER_BADGE_STYLE: ProviderBadgeStyle = {
  borderColor: "rgba(255,255,255,0.15)",
  backgroundColor: "rgba(255,255,255,0.06)",
  textColor: theme.colors.text,
};

/* -------------------------------------------------------------------------- */
/* Core utils                                                                 */
/* -------------------------------------------------------------------------- */

export function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export function defer(task: () => void) {
  setTimeout(task, 0);
}

export function coerceId(value: unknown): string | null {
  const next = clean(value);
  return next || null;
}

export function cleanUpper3(value: unknown, fallback: string): string {
  const upper = clean(value).toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : fallback;
}

export function safeUri(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) return null;
  return raw;
}

export function isNumericId(value: unknown): boolean {
  return /^\d+$/.test(clean(value));
}

export function getIsoDateOnly(raw?: string | null): string | undefined {
  const value = clean(raw);
  if (!value) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;

  return date.toISOString().slice(0, 10);
}

export function buildMapsSearchUrl(query: string): string {
  const q = clean(query);
  if (!q) return "https://www.google.com/maps/search/?api=1";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function titleCaseCity(value: unknown): string {
  const raw = clean(value);
  if (!raw) return "";

  return raw
    .split(/[\s-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function initials(name: string): string {
  const cleanName = clean(name);
  if (!cleanName) return "—";

  const parts = cleanName.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "—";
}

export function parseIsoToDate(iso?: string | null): Date | null {
  const value = clean(iso);
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function isLateKickoff(iso?: string | null): boolean {
  const date = parseIsoToDate(iso);
  if (!date) return false;
  return date.getHours() >= 20;
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

export function safeFixtureTitle(
  row: FixtureListRow | null | undefined,
  fallbackId: string,
  trip?: Trip | null
): string {
  const home = clean(row?.teams?.home?.name) || clean(trip?.homeName);
  const away = clean(row?.teams?.away?.name) || clean(trip?.awayName);

  if (home && away) return `${home} vs ${away}`;
  if (home) return `${home} match`;
  if (away) return `${away} match`;

  return `Match ${fallbackId}`;
}

export function formatKickoffMeta(
  row?: FixtureListRow | null,
  trip?: Trip | null
): { line: string; tbc: boolean; iso: string | null } {
  const isoRaw = row?.fixture?.date ?? trip?.kickoffIso;
  const iso = clean(isoRaw) || null;

  const date = parseIsoToDate(iso);

  const short = clean(row?.fixture?.status?.short).toUpperCase();
  const long = clean(row?.fixture?.status?.long);

  const looksTbc =
    short === "TBD" || short === "TBA" || short === "NS" || short === "PST";

  const snapTbc = Boolean(trip?.kickoffTbc);

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

export function providerBadgeStyle(provider?: string | null): ProviderBadgeStyle {
  const canonical = canonicalizePartnerId(provider);
  if (!canonical) return DEFAULT_PROVIDER_BADGE_STYLE;

  if (canonical === "footballticketnet") {
    return {
      borderColor: "rgba(120,170,255,0.35)",
      backgroundColor: "rgba(120,170,255,0.12)",
      textColor: "rgba(205,225,255,1)",
    };
  }

  if (canonical === "sportsevents365") {
    return {
      borderColor: "rgba(87,162,56,0.35)",
      backgroundColor: "rgba(87,162,56,0.12)",
      textColor: "rgba(208,240,192,1)",
    };
  }

  if (canonical === "gigsberg") {
    return {
      borderColor: "rgba(255,200,80,0.35)",
      backgroundColor: "rgba(255,200,80,0.12)",
      textColor: "rgba(255,226,160,1)",
    };
  }

  if (canonical === "stubhub") {
    return {
      borderColor: "rgba(181,126,255,0.35)",
      backgroundColor: "rgba(181,126,255,0.12)",
      textColor: "rgba(231,214,255,1)",
    };
  }

  if (canonical === "aviasales") {
    return {
      borderColor: "rgba(120,170,255,0.30)",
      backgroundColor: "rgba(120,170,255,0.10)",
      textColor: "rgba(210,225,255,1)",
    };
  }

  if (canonical === "expedia") {
    return {
      borderColor: "rgba(87,162,56,0.30)",
      backgroundColor: "rgba(87,162,56,0.10)",
      textColor: "rgba(210,240,205,1)",
    };
  }

  if (canonical === "kiwitaxi") {
    return {
      borderColor: "rgba(255,160,120,0.30)",
      backgroundColor: "rgba(255,160,120,0.10)",
      textColor: "rgba(255,220,205,1)",
    };
  }

  if (canonical === "omio") {
    return {
      borderColor: "rgba(200,120,255,0.30)",
      backgroundColor: "rgba(200,120,255,0.10)",
      textColor: "rgba(235,210,255,1)",
    };
  }

  if (canonical === "getyourguide") {
    return {
      borderColor: "rgba(255,90,120,0.30)",
      backgroundColor: "rgba(255,90,120,0.10)",
      textColor: "rgba(255,215,225,1)",
    };
  }

  if (canonical === "airhelp") {
    return {
      borderColor: "rgba(255,120,170,0.30)",
      backgroundColor: "rgba(255,120,170,0.10)",
      textColor: "rgba(255,220,235,1)",
    };
  }

  return DEFAULT_PROVIDER_BADGE_STYLE;
}

/* -------------------------------------------------------------------------- */
/* Saved-item helpers                                                         */
/* -------------------------------------------------------------------------- */

export function statusLabel(status: SavedItem["status"]): string {
  if (status === "pending") return "Pending";
  if (status === "saved") return "Saved";
  if (status === "booked") return "Booked";
  return "Archived";
}

export function shortDomain(url?: string | null): string {
  const value = clean(url);
  if (!value) return "";

  try {
    const parsed = new URL(value);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

export function savedItemMetaLine(item: SavedItem): string {
  const bits: string[] = [];

  const typeLabel =
    item.type === "tickets"
      ? "Match tickets"
      : item.type === "hotel"
        ? "Hotel"
        : item.type === "flight"
          ? "Flight"
          : item.type === "train"
            ? "Train"
            : item.type === "transfer"
              ? "Transfer"
              : item.type === "things"
                ? "Experience"
                : item.type === "insurance"
                  ? "Insurance"
                  : item.type === "claim"
                    ? "Claim"
                    : "Note";

  bits.push(typeLabel);

  const provider = clean(item.metadata?.ticketProvider) || clean(item.partnerId);
  if (provider) bits.push(providerLabel(provider));

  const domain = shortDomain(item.partnerUrl);
  if (domain) bits.push(domain);

  return bits.join(" • ");
}

export function attachmentCount(item: SavedItem | null): number {
  return Array.isArray(item?.attachments) ? item.attachments.length : 0;
}

export function hasAttachments(item: SavedItem | null): boolean {
  return attachmentCount(item) > 0;
}

export function proofStateText(item: SavedItem): string {
  const count = attachmentCount(item);
  if (count <= 0) return "No proof attached yet";
  return `${count} proof file${count === 1 ? "" : "s"} attached`;
}

export function ticketProviderFromItem(item: SavedItem | null): string | null {
  if (!item) return null;
  return clean(item.metadata?.ticketProvider) || clean(item.partnerId) || null;
}

export function itemResolvedScore(item: SavedItem | null): number | null {
  if (!item) return null;

  const direct = item.metadata?.score;
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;

  const raw = Number(item.metadata?.rawScore);
  return Number.isFinite(raw) ? raw : null;
}

/* -------------------------------------------------------------------------- */
/* Ticket resolver helpers                                                    */
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

export function ticketResolverFailureMessage(
  resolved: TicketResolutionResult | null
): string {
  if (!resolved) return "Ticket options are unavailable right now.";

  const error = clean((resolved as { error?: unknown })?.error);

  if (error === "network_error") return "Couldn’t reach ticket providers. Try again.";
  if (error === "timeout") return "Ticket providers took too long. Try again.";
  if (error === "invalid_backend_json") return "Ticket data is temporarily unavailable.";
  if (error === "missing_backend_url") return "Ticket system not configured.";

  const options = Array.isArray(resolved.options) ? resolved.options : [];
  if (!resolved.ok && options.length > 0) return "Only weaker ticket routes available.";

  return "No ticket options found.";
}

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

/* -------------------------------------------------------------------------- */
/* Trip-detail pricing / messaging                                            */
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

export function smartButtonSubtitle(
  item: SavedItem | null,
  fallback: string
): string {
  if (!item) return fallback;

  const live = livePriceLine(item);
  if (item.status === "booked") return "Booked";
  if (live) return live;

  return fallback;
}

export function proCapHint(limit: number, currentCount: number): string | undefined {
  if (currentCount < limit) {
    return `Free plan: ${currentCount}/${limit} trips used.`;
  }

  return `Free plan limit reached (${limit} trips). Upgrade for more trips.`;
}

/* -------------------------------------------------------------------------- */
/* Ranking / trip-finder helpers                                              */
/* -------------------------------------------------------------------------- */

export function difficultyLabel(value?: unknown): string | null {
  const raw = clean(value).toLowerCase();

  if (!raw) return null;
  if (raw === "easy") return "Easy";
  if (raw === "moderate") return "Moderate";
  if (raw === "hard") return "Hard";

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function confidencePctLabel(value?: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${Math.round(value)}% confidence`;
}

export function rankReasonsText(trip: RankedTrip | null): string | null {
  if (!trip) return null;

  const reasons = Array.isArray((trip as { reasons?: unknown }).reasons)
    ? ((trip as { reasons?: string[] }).reasons ?? []).map(clean).filter(Boolean)
    : [];

  if (reasons.length > 0) return reasons.join(" • ");

  const breakdown = (trip as { breakdown?: Record<string, unknown> }).breakdown ?? null;
  if (!breakdown) return null;

  const bits: string[] = [];

  const travelDifficulty = difficultyLabel(
    breakdown.travelDifficulty as TravelDifficulty | undefined
  );
  if (travelDifficulty) bits.push(`Travel ${travelDifficulty.toLowerCase()}`);

  const confidence = confidencePctLabel(
    typeof (trip as { confidence?: unknown }).confidence === "number"
      ? Number((trip as { confidence?: unknown }).confidence)
      : null
  );
  if (confidence) bits.push(confidence);

  return bits.length ? bits.join(" • ") : null;
}

/* -------------------------------------------------------------------------- */
/* Note helpers                                                               */
/* -------------------------------------------------------------------------- */

export function cleanNoteText(value: unknown): string {
  return clean(value).replace(/\s+/g, " ").trim();
}

export function noteTitleFromText(value: unknown): string {
  const text = cleanNoteText(value);
  if (!text) return "Note";
  return text.length <= 48 ? text : `${text.slice(0, 48).trimEnd()}…`;
}

/* -------------------------------------------------------------------------- */
/* Misc display helpers                                                       */
/* -------------------------------------------------------------------------- */

export function ticketConfidenceLabel(score?: number | null): string {
  const value = typeof score === "number" && Number.isFinite(score) ? score : 0;

  if (value >= 95) return "Elite match";
  if (value >= 88) return "Best match";
  if (value >= 78) return "Strong match";
  if (value >= 68) return "Good match";
  if (value >= 60) return "Usable match";
  return "Fallback";
}
