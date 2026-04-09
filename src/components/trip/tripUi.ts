import { theme } from "@/src/constants/theme";
import { canonicalizePartnerId, getPartnerOrNull } from "@/src/constants/partners";
import type { Trip } from "@/src/state/trips";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { SavedItem } from "@/src/core/savedItemTypes";

export type ProviderBadgeStyle = {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
};

const DEFAULT_BADGE_STYLE: ProviderBadgeStyle = {
  borderColor: "rgba(255,255,255,0.15)",
  backgroundColor: "rgba(255,255,255,0.06)",
  textColor: theme.colors.text,
};

export function clean(v: unknown): string {
  return String(v ?? "").trim();
}

export function safeUri(u: unknown): string | null {
  const s = clean(u);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

export function initials(name: string): string {
  const cleanName = clean(name);
  if (!cleanName) return "—";
  const parts = cleanName.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "—";
}

export function parseIsoToDate(iso?: string | null): Date | null {
  const s = clean(iso);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function safeFixtureTitle(row: FixtureListRow | null | undefined, fallbackId: string, trip?: Trip | null): string {
  const home = clean(row?.teams?.home?.name) || clean(trip?.homeName);
  const away = clean(row?.teams?.away?.name) || clean(trip?.awayName);
  if (home && away) return `${home} vs ${away}`;
  if (home) return `${home} match`;
  if (away) return `${away} match`;
  return `Match ${fallbackId}`;
}

export function formatKickoffMeta(row?: FixtureListRow | null, trip?: Trip | null): { line: string; tbc: boolean; iso: string | null } {
  const isoRaw = row?.fixture?.date ?? trip?.kickoffIso;
  const iso = clean(isoRaw) || null;
  const d = parseIsoToDate(iso);
  const short = clean(row?.fixture?.status?.short).toUpperCase();
  const long = clean(row?.fixture?.status?.long);
  const looksTbc = short === "TBD" || short === "TBA" || short === "NS" || short === "PST";
  const snapTbc = Boolean(trip?.kickoffTbc);
  if (!d) {
    const tbc = looksTbc || snapTbc;
    return { line: tbc ? "Kickoff: TBC" : "Kickoff: —", tbc: true, iso };
  }
  const datePart = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const midnight = d.getHours() === 0 && d.getMinutes() === 0;
  const tbc = looksTbc || snapTbc || midnight;
  if (tbc) return { line: `Kickoff: ${datePart} • TBC`, tbc: true, iso };
  return { line: `Kickoff: ${datePart} • ${timePart}${long ? ` • ${long}` : ""}`, tbc: false, iso };
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

export function providerBadgeStyle(provider?: string | null): ProviderBadgeStyle {
  const canonical = canonicalizePartnerId(provider);
  if (!canonical) return DEFAULT_BADGE_STYLE;

  if (canonical === "sportsevents365") {
    return {
      borderColor: "rgba(87,162,56,0.35)",
      backgroundColor: "rgba(87,162,56,0.12)",
      textColor: "rgba(208,240,192,1)",
    };
  }

  if (canonical === "footballticketnet") {
    return {
      borderColor: "rgba(120,170,255,0.35)",
      backgroundColor: "rgba(120,170,255,0.12)",
      textColor: "rgba(205,225,255,1)",
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

  if (canonical === "safetywing") {
    return {
      borderColor: "rgba(255,200,80,0.35)",
      backgroundColor: "rgba(255,200,80,0.12)",
      textColor: "rgba(255,226,160,1)",
    };
  }

  return DEFAULT_BADGE_STYLE;
}

export function statusLabel(status: SavedItem["status"]): string {
  if (status === "pending") return "Pending";
  if (status === "saved") return "Saved";
  if (status === "booked") return "Booked";
  return "Archived";
}
