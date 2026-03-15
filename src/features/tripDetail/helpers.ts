import type { PartnerId } from "@/src/core/partners";
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
  flightsUrl: string;
  hotelsUrl: string;
  omioUrl: string;
  transfersUrl: string;
  experiencesUrl: string;
  mapsUrl: string;
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

export function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export function coerceId(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim() || null;
  return null;
}

export function isNumericId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]+$/.test(value.trim());
}

export function defer(fn: () => void) {
  setTimeout(fn, 60);
}

export function cleanUpper3(value: unknown, fallback: string) {
  const upper = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : fallback;
}

export function summaryLine(trip: Trip) {
  const from = trip.startDate ? formatUkDateOnly(trip.startDate) : "—";
  const to = trip.endDate ? formatUkDateOnly(trip.endDate) : "—";
  const count = trip.matchIds?.length ?? 0;
  return `${from} → ${to} • ${count} match${count === 1 ? "" : "es"}`;
}

export function tripStatus(trip: Trip): "Upcoming" | "Past" {
  const start = trip.startDate ? parseIsoDateOnly(trip.startDate) : null;
  const end = trip.endDate ? parseIsoDateOnly(trip.endDate) : null;
  if (!start || !end) return "Upcoming";

  const today = parseIsoDateOnly(toIsoDate(new Date()));
  if (!today) return "Upcoming";

  return end.getTime() < today.getTime() ? "Past" : "Upcoming";
}

export function cleanNoteText(value: string) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

export function noteTitleFromText(text: string) {
  const cleaned = cleanNoteText(text);
  if (!cleaned) return "Note";
  const firstLine = cleaned.split("\n")[0]?.trim() || "";
  return firstLine.length > 42 ? `${firstLine.slice(0, 42).trim()}…` : firstLine;
}

export function statusLabel(status: SavedItem["status"]) {
  if (status === "pending") return "Pending";
  if (status === "saved") return "Saved";
  if (status === "booked") return "Booked";
  return "Archived";
}

export function providerLabel(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") return "FootballTicketNet";
  if (raw === "sportsevents365") return "SportsEvents365";
  if (raw === "gigsberg") return "Gigsberg";
  if (raw === "seatpick") return "SeatPick";
  if (raw === "aviasales") return "Aviasales";
  if (raw === "expedia" || raw === "expedia_stays") return "Expedia";
  if (raw === "kiwitaxi") return "KiwiTaxi";
  if (raw === "welcomepickups") return "Welcome Pickups";
  if (raw === "omio") return "Omio";
  if (raw === "getyourguide") return "GetYourGuide";
  if (raw === "klook") return "Klook";
  if (raw === "tiqets") return "Tiqets";
  if (raw === "wegotrip") return "WeGoTrip";
  if (raw === "safetywing") return "SafetyWing";
  if (raw === "ekta") return "EKTA";
  if (raw === "airhelp") return "AirHelp";
  if (raw === "compensair") return "Compensair";
  if (raw === "googlemaps") return "Google Maps";

  return clean(provider) || "Provider";
}

export function providerShort(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") return "FTN";
  if (raw === "sportsevents365") return "365";
  if (raw === "gigsberg") return "G";
  if (raw === "seatpick") return "SP";
  if (raw === "aviasales") return "AV";
  if (raw === "expedia" || raw === "expedia_stays") return "EX";
  if (raw === "kiwitaxi") return "KT";
  if (raw === "welcomepickups") return "WP";
  if (raw === "omio") return "OM";
  if (raw === "getyourguide") return "GYG";
  if (raw === "klook") return "KL";
  if (raw === "tiqets") return "TQ";
  if (raw === "wegotrip") return "WGT";
  if (raw === "safetywing") return "SW";
  if (raw === "ekta") return "EK";
  if (raw === "airhelp") return "AH";
  if (raw === "compensair") return "CP";
  if (raw === "googlemaps") return "MAP";

  return "P";
}

export function providerBadgeStyle(provider?: string | null): PartnerUiBadgeStyle {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") {
    return {
      borderColor: "rgba(120,170,255,0.35)",
      backgroundColor: "rgba(120,170,255,0.12)",
      textColor: "rgba(205,225,255,1)",
    };
  }

  if (raw === "sportsevents365") {
    return {
      borderColor: "rgba(87,162,56,0.35)",
      backgroundColor: "rgba(87,162,56,0.12)",
      textColor: "rgba(208,240,192,1)",
    };
  }

  if (raw === "gigsberg") {
    return {
      borderColor: "rgba(255,200,80,0.35)",
      backgroundColor: "rgba(255,200,80,0.12)",
      textColor: "rgba(255,226,160,1)",
    };
  }

  if (raw === "aviasales") {
    return {
      borderColor: "rgba(120,170,255,0.30)",
      backgroundColor: "rgba(120,170,255,0.10)",
      textColor: "rgba(210,225,255,1)",
    };
  }

  if (raw === "expedia" || raw === "expedia_stays") {
    return {
      borderColor: "rgba(87,162,56,0.30)",
      backgroundColor: "rgba(87,162,56,0.10)",
      textColor: "rgba(210,240,205,1)",
    };
  }

  if (raw === "kiwitaxi" || raw === "welcomepickups") {
    return {
      borderColor: "rgba(255,160,120,0.30)",
      backgroundColor: "rgba(255,160,120,0.10)",
      textColor: "rgba(255,220,205,1)",
    };
  }

  if (raw === "omio") {
    return {
      borderColor: "rgba(200,120,255,0.30)",
      backgroundColor: "rgba(200,120,255,0.10)",
      textColor: "rgba(235,210,255,1)",
    };
  }

  if (raw === "getyourguide" || raw === "klook" || raw === "tiqets" || raw === "wegotrip") {
    return {
      borderColor: "rgba(255,90,120,0.30)",
      backgroundColor: "rgba(255,90,120,0.10)",
      textColor: "rgba(255,215,225,1)",
    };
  }

  if (raw === "airhelp" || raw === "compensair") {
    return {
      borderColor: "rgba(255,120,120,0.30)",
      backgroundColor: "rgba(255,120,120,0.10)",
      textColor: "rgba(255,220,220,1)",
    };
  }

  if (raw === "safetywing" || raw === "ekta") {
    return {
      borderColor: "rgba(120,220,200,0.30)",
      backgroundColor: "rgba(120,220,200,0.10)",
      textColor: "rgba(210,250,245,1)",
    };
  }

  return {
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    textColor: "rgba(242,244,246,1)",
  };
}

export function ticketConfidenceLabel(score?: number | null): string | null {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (score >= 90) return "High confidence match";
  if (score >= 75) return "Strong ticket match";
  if (score >= 60) return "Good ticket match";
  return "Fallback ticket match";
}

export function confidenceLabel(score?: number | null): string {
  if (typeof score !== "number" || !Number.isFinite(score)) return "Fallback";
  if (score >= 90) return "High confidence";
  if (score >= 75) return "Strong match";
  if (score >= 60) return "Good match";
  return "Fallback";
}

export function optionReasonLabel(reason?: TicketResolutionOption["reason"] | string | null) {
  if (reason === "exact_event") return "Direct event match";
  if (reason === "partial_match") return "Partial match";
  return "Search fallback";
}

export function livePriceLine(item: SavedItem): string | null {
  if (!clean(item.partnerUrl)) return null;

  const resolvedPrice = clean(item.metadata?.resolvedPriceText);
  const provider = providerLabel(clean(item.metadata?.ticketProvider) || clean(item.partnerId));

  if (item.status === "booked") {
    const bookedPrice = clean(item.priceText) || resolvedPrice;
    return bookedPrice || null;
  }

  if (resolvedPrice) {
    return provider ? `From ${resolvedPrice} on ${provider}` : `From ${resolvedPrice}`;
  }

  return provider ? `Live price on ${provider}` : "Live price on partner";
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

  if (tbc) return { line: `Kickoff: ${datePart} • TBC`, tbc: true, iso };

  return {
    line: `Kickoff: ${datePart} • ${timePart}${long ? ` • ${long}` : ""}`,
    tbc: false,
    iso,
  };
}

export function titleCaseCity(value: string) {
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

export function buildMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean(query))}`;
}

export function buildMapsDirectionsUrl(
  origin: string,
  destination: string,
  mode: "transit" | "walking" | "driving" = "transit"
) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    clean(origin)
  )}&destination=${encodeURIComponent(clean(destination))}&travelmode=${encodeURIComponent(mode)}`;
}

export function isLateKickoff(kickoffIso?: string | null) {
  const raw = clean(kickoffIso);
  if (!raw) return false;

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return false;

  const h = date.getHours();
  const m = date.getMinutes();
  return h > 20 || (h === 20 && m >= 30);
}

export function proCapHint(cap: number, tripCount: number) {
  return tripCount < cap
    ? `Free plan: up to ${cap} saved trips.`
    : `Free plan cap reached (${cap}). Pro removes the cap.`;
}

export function difficultyLabel(value?: TravelDifficulty | null): string | null {
  if (!value) return null;
  if (value === "easy") return "Easy travel";
  if (value === "medium") return "Moderate travel";
  if (value === "hard") return "Harder travel";
  return null;
}

export function confidencePctLabel(value?: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return `${pct}% fit`;
}

export function rankReasonsText(trip: RankedTrip | null): string | null {
  if (!trip || !Array.isArray(trip.reasons) || trip.reasons.length === 0) return null;
  return trip.reasons.slice(0, 2).join(" • ");
}

export function mapTicketProviderToPartnerId(provider?: string | null): PartnerId {
  const raw = clean(provider).toLowerCase();
  if (raw === "footballticketsnet") return "footballticketsnet" as PartnerId;
  if (raw === "gigsberg") return "gigsberg" as PartnerId;
  if (raw === "seatpick") return "seatpick" as PartnerId;
  return "sportsevents365" as PartnerId;
}

export function ticketResolverFailureMessage(resolved: TicketResolutionResult | null): string {
  if (!resolved) return "Ticket resolver didn’t respond. Check backend URL/server.";

  const checkedProviders = Array.isArray(resolved.checkedProviders)
    ? resolved.checkedProviders.filter(Boolean).join(", ")
    : "";

  const error = clean((resolved as any)?.error);

  if (error === "network_error") return "Ticket backend couldn’t be reached. Check backend URL/server.";
  if (error === "timeout") return "Ticket backend timed out. Try again.";
  if (error === "invalid_backend_json") return "Ticket backend returned invalid JSON.";

  return checkedProviders
    ? `No suitable ticket listing found. Checked: ${checkedProviders}.`
    : "No suitable ticket listing found.";
}

export function smartButtonSubtitle(item: SavedItem | null, fallback: string) {
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

export function getIsoDateOnly(raw?: string | null) {
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
