import { theme } from "@/src/constants/theme";
import type { Trip } from "@/src/state/trips";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { SavedItem } from "@/src/core/savedItemTypes";

export function clean(v: unknown): string {
  return String(v ?? "").trim();
}

export function safeUri(u: unknown): string | null {
  const s = clean(u);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

export function initials(name: string) {
  const cleanName = clean(name);
  if (!cleanName) return "—";

  const parts = cleanName.split(/\s+/g).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function parseIsoToDate(iso?: string | null): Date | null {
  const s = clean(iso);
  if (!s) return null;

  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function safeFixtureTitle(
  row: FixtureListRow | null | undefined,
  fallbackId: string,
  trip?: Trip | null
) {
  const home = clean((row as any)?.teams?.home?.name) || clean((trip as any)?.homeName);
  const away = clean((row as any)?.teams?.away?.name) || clean((trip as any)?.awayName);

  if (home && away) return `${home} vs ${away}`;
  if (home) return `${home} match`;
  if (away) return `${away} match`;

  return `Match ${fallbackId}`;
}

export function formatKickoffMeta(
  row?: FixtureListRow | null,
  trip?: Trip | null
): { line: string; tbc: boolean; iso: string | null } {
  const isoRaw = (row as any)?.fixture?.date ?? (trip as any)?.kickoffIso;
  const iso = clean(isoRaw) || null;

  const d = parseIsoToDate(iso);

  const short = clean((row as any)?.fixture?.status?.short).toUpperCase();
  const long = clean((row as any)?.fixture?.status?.long);

  const looksTbc =
    short === "TBD" ||
    short === "TBA" ||
    short === "NS" ||
    short === "PST";

  const snapTbc = Boolean((trip as any)?.kickoffTbc);

  if (!d) {
    const tbc = looksTbc || snapTbc;
    return { line: tbc ? "Kickoff: TBC" : "Kickoff: —", tbc: true, iso };
  }

  const datePart = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const timePart = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const midnight = d.getHours() === 0 && d.getMinutes() === 0;
  const tbc = looksTbc || snapTbc || midnight;

  if (tbc) {
    return { line: `Kickoff: ${datePart} • TBC`, tbc: true, iso };
  }

  const statusHint = long ? ` • ${long}` : "";

  return {
    line: `Kickoff: ${datePart} • ${timePart}${statusHint}`,
    tbc: false,
    iso,
  };
}

export function providerLabel(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") return "FootballTicketNet";
  if (raw === "sportsevents365") return "SportsEvents365";
  if (raw === "gigsberg") return "Gigsberg";
  if (raw === "aviasales") return "Aviasales";
  if (raw === "expedia" || raw === "expedia_stays") return "Expedia";
  if (raw === "kiwitaxi") return "KiwiTaxi";
  if (raw === "omio") return "Omio";
  if (raw === "getyourguide") return "GetYourGuide";
  if (raw === "safetywing") return "SafetyWing";
  if (raw === "airhelp") return "AirHelp";

  return provider || "Provider";
}

export function providerShort(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") return "FTN";
  if (raw === "sportsevents365") return "365";
  if (raw === "gigsberg") return "G";
  if (raw === "aviasales") return "AV";
  if (raw === "expedia" || raw === "expedia_stays") return "EX";
  if (raw === "kiwitaxi") return "KT";
  if (raw === "omio") return "OM";
  if (raw === "getyourguide") return "GYG";
  if (raw === "safetywing") return "SW";
  if (raw === "airhelp") return "AH";

  return "P";
}

export function providerBadgeStyle(provider?: string | null) {
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

  if (raw === "kiwitaxi") {
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

  if (raw === "getyourguide") {
    return {
      borderColor: "rgba(255,90,120,0.30)",
      backgroundColor: "rgba(255,90,120,0.10)",
      textColor: "rgba(255,215,225,1)",
    };
  }

  if (raw === "safetywing") {
    return {
      borderColor: "rgba(120,220,190,0.28)",
      backgroundColor: "rgba(120,220,190,0.10)",
      textColor: "rgba(210,255,245,1)",
    };
  }

  if (raw === "airhelp") {
    return {
      borderColor: "rgba(255,120,170,0.30)",
      backgroundColor: "rgba(255,120,170,0.10)",
      textColor: "rgba(255,220,235,1)",
    };
  }

  return {
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    textColor: theme.colors.text,
  };
}

export function statusLabel(status: SavedItem["status"]) {
  if (status === "pending") return "Pending";
  if (status === "saved") return "Saved";
  if (status === "booked") return "Booked";
  return "Archived";
}

export function ticketConfidenceLabel(score?: number | null): string {
  const value = typeof score === "number" ? score : 0;

  if (value >= 90) return "High confidence";
  if (value >= 75) return "Strong match";
  if (value >= 60) return "Good match";

  return "Fallback";
}

export function shortDomain(url?: string | null): string {
  const value = clean(url);
  if (!value) return "";

  try {
    const parsed = new URL(value);
    return parsed.hostname.replace(/^www\./, "");
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
