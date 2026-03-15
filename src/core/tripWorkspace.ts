import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";

export type WorkspaceSectionKey =
  | "tickets"
  | "stay"
  | "travel"
  | "transfers"
  | "things"
  | "insurance"
  | "claims"
  | "notes";

export type WorkspaceSection = {
  key: WorkspaceSectionKey;
  title: string;
  subtitle?: string;
  types: SavedItemType[];
  requiredForCompletion?: boolean;
};

export type TripWorkspace = {
  tripId: string;
  sectionOrder: WorkspaceSectionKey[];
  collapsed: Partial<Record<WorkspaceSectionKey, boolean>>;
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
  transfers: {
    key: "transfers",
    title: "Transfers",
    subtitle: "Airport ↔ city, local rides",
    types: ["transfer"],
    requiredForCompletion: false,
  },
  things: {
    key: "things",
    title: "Things to do",
    subtitle: "Experiences, activities",
    types: ["things"],
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
  "transfers",
  "things",
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
    case "transfer":
      return "transfers";
    case "things":
      return "things";
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
    transfers: [],
    things: [],
    insurance: [],
    claims: [],
    notes: [],
  };

  for (const it of items) {
    if (it.status === "archived") continue;
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

  for (const it of items) {
    c[it.status] = (c[it.status] ?? 0) + 1;
  }

  return c;
}

export type WorkspaceSnapshot = {
  total: number;
  activeTotal: number;
  saved: number;
  pending: number;
  booked: number;
  archived: number;
  sectionTotals: Record<WorkspaceSectionKey, number>;
  sectionActiveTotals: Record<WorkspaceSectionKey, number>;
  missing: Array<{
    section: WorkspaceSectionKey;
    reason: string;
  }>;
};

export function computeWorkspaceSnapshot(items: SavedItem[]): WorkspaceSnapshot {
  const allItems = Array.isArray(items) ? items : [];
  const activeItems = allItems.filter((it) => it.status !== "archived");

  const bySection = groupSavedItemsBySection(activeItems);
  const statusCounts = countByStatus(allItems);

  const sectionActiveTotals: Record<WorkspaceSectionKey, number> = {
    tickets: bySection.tickets.length,
    stay: bySection.stay.length,
    travel: bySection.travel.length,
    transfers: bySection.transfers.length,
    things: bySection.things.length,
    insurance: bySection.insurance.length,
    claims: bySection.claims.length,
    notes: bySection.notes.length,
  };

  const sectionTotals: Record<WorkspaceSectionKey, number> = {
    tickets: allItems.filter((it) => sectionForSavedItemType(it.type) === "tickets").length,
    stay: allItems.filter((it) => sectionForSavedItemType(it.type) === "stay").length,
    travel: allItems.filter((it) => sectionForSavedItemType(it.type) === "travel").length,
    transfers: allItems.filter((it) => sectionForSavedItemType(it.type) === "transfers").length,
    things: allItems.filter((it) => sectionForSavedItemType(it.type) === "things").length,
    insurance: allItems.filter((it) => sectionForSavedItemType(it.type) === "insurance").length,
    claims: allItems.filter((it) => sectionForSavedItemType(it.type) === "claims").length,
    notes: allItems.filter((it) => sectionForSavedItemType(it.type) === "notes").length,
  };

  const missing: WorkspaceSnapshot["missing"] = [];

  if (sectionActiveTotals.tickets === 0) {
    missing.push({ section: "tickets", reason: "No ticket option saved yet." });
  }

  if (sectionActiveTotals.stay === 0) {
    missing.push({ section: "stay", reason: "No accommodation saved yet." });
  }

  if (sectionActiveTotals.travel === 0) {
    missing.push({ section: "travel", reason: "No travel saved yet." });
  }

  if (sectionActiveTotals.transfers === 0) {
    missing.push({ section: "transfers", reason: "No transfer option saved yet." });
  }

  return {
    total: allItems.length,
    activeTotal: activeItems.length,
    saved: statusCounts.saved,
    pending: statusCounts.pending,
    booked: statusCounts.booked,
    archived: statusCounts.archived,
    sectionTotals,
    sectionActiveTotals,
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
