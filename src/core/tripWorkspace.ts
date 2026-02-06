// src/core/tripWorkspace.ts
import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";

export type WorkspaceSectionKey =
  | "tickets"
  | "stay"
  | "travel"
  | "things"
  | "transfers"
  | "insurance"
  | "claims"
  | "notes";

export type WorkspaceSection = {
  key: WorkspaceSectionKey;
  title: string;
  subtitle?: string;

  /**
   * Which SavedItem types belong in this section.
   * The UI uses this for filtering; the engine uses it for derivations.
   */
  types: SavedItemType[];

  /**
   * Lightweight rules for "what’s missing" heuristics.
   * These are deliberately conservative.
   */
  requiredForCompletion?: boolean;
};

export type TripWorkspace = {
  tripId: string;

  /**
   * User preference (per trip): order can be customized.
   * If empty, default order is used.
   */
  sectionOrder: WorkspaceSectionKey[];

  /**
   * UI preference (per trip): collapsed sections.
   */
  collapsed: Partial<Record<WorkspaceSectionKey, boolean>>;

  /**
   * UI preference (per trip): last active section.
   */
  activeSection?: WorkspaceSectionKey;

  createdAt: number;
  updatedAt: number;
};

export const WORKSPACE_SECTIONS: Record<WorkspaceSectionKey, WorkspaceSection> = {
  tickets: {
    key: "tickets",
    title: "Tickets",
    subtitle: "Seats, official sellers, confirmations",
    types: ["tickets"],
    requiredForCompletion: false,
  },
  stay: {
    key: "stay",
    title: "Stay",
    subtitle: "Hotels, apartments",
    types: ["hotel"],
    requiredForCompletion: false,
  },
  travel: {
    key: "travel",
    title: "Travel",
    subtitle: "Flights, trains",
    types: ["flight", "train"],
    requiredForCompletion: false,
  },
  things: {
    key: "things",
    title: "Things to do",
    subtitle: "Experiences, activities",
    types: ["things"],
    requiredForCompletion: false,
  },
  transfers: {
    key: "transfers",
    title: "Transfers",
    subtitle: "Airport ↔ city, local rides",
    types: ["transfer"],
    requiredForCompletion: false,
  },
  insurance: {
    key: "insurance",
    title: "Insurance",
    subtitle: "Travel cover, policy docs",
    types: ["insurance"],
    requiredForCompletion: false,
  },
  claims: {
    key: "claims",
    title: "Claims",
    subtitle: "Delays, refunds, evidence",
    types: ["claim"],
    requiredForCompletion: false,
  },
  notes: {
    key: "notes",
    title: "Notes",
    subtitle: "Plans, reminders, links",
    types: ["note", "other"],
    requiredForCompletion: false,
  },
};

export const DEFAULT_SECTION_ORDER: WorkspaceSectionKey[] = [
  "tickets",
  "stay",
  "travel",
  "things",
  "transfers",
  "insurance",
  "claims",
  "notes",
];

export function normalizeOrder(order?: WorkspaceSectionKey[] | null): WorkspaceSectionKey[] {
  const input = Array.isArray(order) ? order : [];
  const seen = new Set<WorkspaceSectionKey>();
  const out: WorkspaceSectionKey[] = [];

  for (const k of input) {
    if (!k || !(k in WORKSPACE_SECTIONS)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }

  // append any missing defaults
  for (const k of DEFAULT_SECTION_ORDER) {
    if (!seen.has(k)) out.push(k);
  }

  return out;
}

export function sectionForSavedItemType(type: SavedItemType): WorkspaceSectionKey {
  switch (type) {
    case "tickets":
      return "tickets";
    case "hotel":
      return "stay";
    case "flight":
    case "train":
      return "travel";
    case "things":
      return "things";
    case "transfer":
      return "transfers";
    case "insurance":
      return "insurance";
    case "claim":
      return "claims";
    case "note":
    case "other":
    default:
      return "notes";
  }
}

export function groupSavedItemsBySection(items: SavedItem[]) {
  const grouped: Record<WorkspaceSectionKey, SavedItem[]> = {
    tickets: [],
    stay: [],
    travel: [],
    things: [],
    transfers: [],
    insurance: [],
    claims: [],
    notes: [],
  };

  for (const it of items) {
    const key = sectionForSavedItemType(it.type);
    grouped[key].push(it);
  }
  return grouped;
}

export function countByStatus(items: SavedItem[]) {
  const c: Record<SavedItemStatus, number> = {
    saved: 0,
    pending: 0,
    booked: 0,
    archived: 0,
  };
  for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
  return c;
}

export type WorkspaceSnapshot = {
  total: number;
  saved: number;
  pending: number;
  booked: number;
  archived: number;

  /** Per section counts (total) */
  sectionTotals: Record<WorkspaceSectionKey, number>;

  /** Items missing heuristics (Phase 1 conservative) */
  missing: Array<{
    section: WorkspaceSectionKey;
    reason: string;
  }>;
};

export function computeWorkspaceSnapshot(items: SavedItem[]): WorkspaceSnapshot {
  const bySection = groupSavedItemsBySection(items);

  const sectionTotals: Record<WorkspaceSectionKey, number> = {
    tickets: bySection.tickets.length,
    stay: bySection.stay.length,
    travel: bySection.travel.length,
    things: bySection.things.length,
    transfers: bySection.transfers.length,
    insurance: bySection.insurance.length,
    claims: bySection.claims.length,
    notes: bySection.notes.length,
  };

  const s = countByStatus(items);

  // Conservative “missing” logic:
  // - If trip has nothing in stay and nothing in travel, suggest both.
  // - If trip has no tickets, suggest tickets (but not required).
  // - If trip has no things to do, suggest things (nice-to-have).
  const missing: WorkspaceSnapshot["missing"] = [];

  if (sectionTotals.stay === 0) missing.push({ section: "stay", reason: "No accommodation saved yet." });
  if (sectionTotals.travel === 0) missing.push({ section: "travel", reason: "No travel saved yet." });
  if (sectionTotals.tickets === 0) missing.push({ section: "tickets", reason: "No ticket option saved yet." });
  if (sectionTotals.things === 0) missing.push({ section: "things", reason: "Nothing to do saved yet." });

  return {
    total: items.length,
    saved: s.saved,
    pending: s.pending,
    booked: s.booked,
    archived: s.archived,
    sectionTotals,
    missing,
  };
}

export function makeDefaultTripWorkspace(tripId: string): TripWorkspace {
  const now = Date.now();
  return {
    tripId: String(tripId),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    collapsed: {},
    activeSection: "tickets",
    createdAt: now,
    updatedAt: now,
  };
}
