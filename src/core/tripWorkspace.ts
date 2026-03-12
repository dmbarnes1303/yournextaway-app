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

export type WorkspaceSectionStatus = "empty" | "saved" | "pending" | "booked";

export type WorkspaceSnapshot = {
  total: number;
  activeTotal: number;
  saved: number;
  pending: number;
  booked: number;
  archived: number;

  sectionTotals: Record<WorkspaceSectionKey, number>;
  sectionActiveTotals: Record<WorkspaceSectionKey, number>;
  sectionStatus: Record<WorkspaceSectionKey, WorkspaceSectionStatus>;

  missing: Array<{
    section: WorkspaceSectionKey;
    reason: string;
  }>;
};

export const WORKSPACE_SECTION_KEYS: WorkspaceSectionKey[] = [
  "tickets",
  "stay",
  "travel",
  "things",
  "transfers",
  "insurance",
  "claims",
  "notes",
];

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

const SECTION_KEY_SET = new Set<WorkspaceSectionKey>(WORKSPACE_SECTION_KEYS);

export function isWorkspaceSectionKey(value: unknown): value is WorkspaceSectionKey {
  return typeof value === "string" && SECTION_KEY_SET.has(value as WorkspaceSectionKey);
}

export const WORKSPACE_SECTIONS: Record<WorkspaceSectionKey, WorkspaceSection> = {
  tickets: {
    key: "tickets",
    title: "Tickets",
    subtitle: "Seats, sellers, confirmations",
    types: ["tickets"],
    requiredForCompletion: false,
  },
  stay: {
    key: "stay",
    title: "Stay",
    subtitle: "Hotels, apartments, places to sleep",
    types: ["hotel"],
    requiredForCompletion: false,
  },
  travel: {
    key: "travel",
    title: "Travel",
    subtitle: "Flights and rail",
    types: ["flight", "train"],
    requiredForCompletion: false,
  },
  things: {
    key: "things",
    title: "Things to do",
    subtitle: "Experiences and activities",
    types: ["things"],
    requiredForCompletion: false,
  },
  transfers: {
    key: "transfers",
    title: "Transfers",
    subtitle: "Airport, local rides, matchday movement",
    types: ["transfer"],
    requiredForCompletion: false,
  },
  insurance: {
    key: "insurance",
    title: "Insurance",
    subtitle: "Cover and policy docs",
    types: ["insurance"],
    requiredForCompletion: false,
  },
  claims: {
    key: "claims",
    title: "Claims",
    subtitle: "Delays, refunds, compensation",
    types: ["claim"],
    requiredForCompletion: false,
  },
  notes: {
    key: "notes",
    title: "Notes",
    subtitle: "Reminders, plans, loose links",
    types: ["note", "other"],
    requiredForCompletion: false,
  },
};

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeOrder(order?: WorkspaceSectionKey[] | null): WorkspaceSectionKey[] {
  const input = Array.isArray(order) ? order : [];
  const seen = new Set<WorkspaceSectionKey>();
  const out: WorkspaceSectionKey[] = [];

  for (const raw of input) {
    if (!isWorkspaceSectionKey(raw)) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }

  for (const key of DEFAULT_SECTION_ORDER) {
    if (!seen.has(key)) out.push(key);
  }

  return out;
}

export function normalizeCollapsed(
  value?: Partial<Record<WorkspaceSectionKey, boolean>> | Record<string, unknown> | null
): Partial<Record<WorkspaceSectionKey, boolean>> {
  const raw = value && typeof value === "object" ? value : {};
  const out: Partial<Record<WorkspaceSectionKey, boolean>> = {};

  for (const key of WORKSPACE_SECTION_KEYS) {
    if (key in raw) {
      out[key] = Boolean((raw as Record<string, unknown>)[key]);
    }
  }

  return out;
}

export function normalizeActiveSection(value?: unknown): WorkspaceSectionKey | undefined {
  return isWorkspaceSectionKey(value) ? value : undefined;
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

export function getWorkspaceSectionsInOrder(order?: WorkspaceSectionKey[] | null): WorkspaceSection[] {
  return normalizeOrder(order).map((key) => WORKSPACE_SECTIONS[key]);
}

export function groupSavedItemsBySection(
  items: SavedItem[],
  opts?: { includeArchived?: boolean }
): Record<WorkspaceSectionKey, SavedItem[]> {
  const includeArchived = Boolean(opts?.includeArchived);

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

  for (const item of Array.isArray(items) ? items : []) {
    if (!includeArchived && item.status === "archived") continue;
    const key = sectionForSavedItemType(item.type);
    grouped[key].push(item);
  }

  return grouped;
}

export function countByStatus(items: SavedItem[]) {
  const counts: Record<SavedItemStatus, number> = {
    saved: 0,
    pending: 0,
    booked: 0,
    archived: 0,
  };

  for (const item of Array.isArray(items) ? items : []) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }

  return counts;
}

export function reduceSectionStatus(items: SavedItem[]): WorkspaceSectionStatus {
  if (!items.length) return "empty";
  if (items.some((item) => item.status === "booked")) return "booked";
  if (items.some((item) => item.status === "pending")) return "pending";
  if (items.some((item) => item.status === "saved")) return "saved";
  return "empty";
}

export function computeWorkspaceSnapshot(items: SavedItem[]): WorkspaceSnapshot {
  const allItems = Array.isArray(items) ? items : [];
  const activeItems = allItems.filter((item) => item.status !== "archived");

  const allStatusCounts = countByStatus(allItems);
  const bySectionActive = groupSavedItemsBySection(activeItems, { includeArchived: false });
  const bySectionAll = groupSavedItemsBySection(allItems, { includeArchived: true });

  const sectionTotals: Record<WorkspaceSectionKey, number> = {
    tickets: bySectionAll.tickets.length,
    stay: bySectionAll.stay.length,
    travel: bySectionAll.travel.length,
    things: bySectionAll.things.length,
    transfers: bySectionAll.transfers.length,
    insurance: bySectionAll.insurance.length,
    claims: bySectionAll.claims.length,
    notes: bySectionAll.notes.length,
  };

  const sectionActiveTotals: Record<WorkspaceSectionKey, number> = {
    tickets: bySectionActive.tickets.length,
    stay: bySectionActive.stay.length,
    travel: bySectionActive.travel.length,
    things: bySectionActive.things.length,
    transfers: bySectionActive.transfers.length,
    insurance: bySectionActive.insurance.length,
    claims: bySectionActive.claims.length,
    notes: bySectionActive.notes.length,
  };

  const sectionStatus: Record<WorkspaceSectionKey, WorkspaceSectionStatus> = {
    tickets: reduceSectionStatus(bySectionActive.tickets),
    stay: reduceSectionStatus(bySectionActive.stay),
    travel: reduceSectionStatus(bySectionActive.travel),
    things: reduceSectionStatus(bySectionActive.things),
    transfers: reduceSectionStatus(bySectionActive.transfers),
    insurance: reduceSectionStatus(bySectionActive.insurance),
    claims: reduceSectionStatus(bySectionActive.claims),
    notes: reduceSectionStatus(bySectionActive.notes),
  };

  const missing: WorkspaceSnapshot["missing"] = [];

  if (sectionActiveTotals.tickets === 0) {
    missing.push({ section: "tickets", reason: "No ticket option saved yet." });
  }

  if (sectionActiveTotals.stay === 0) {
    missing.push({ section: "stay", reason: "No accommodation saved yet." });
  }

  if (sectionActiveTotals.travel === 0) {
    missing.push({ section: "travel", reason: "No travel option saved yet." });
  }

  if (sectionActiveTotals.transfers === 0) {
    missing.push({ section: "transfers", reason: "No local transfer option saved yet." });
  }

  if (sectionActiveTotals.things === 0) {
    missing.push({ section: "things", reason: "Nothing extra saved for the trip yet." });
  }

  return {
    total: allItems.length,
    activeTotal: activeItems.length,
    saved: allStatusCounts.saved,
    pending: allStatusCounts.pending,
    booked: allStatusCounts.booked,
    archived: allStatusCounts.archived,
    sectionTotals,
    sectionActiveTotals,
    sectionStatus,
    missing,
  };
}

export function cloneWorkspace(workspace: TripWorkspace): TripWorkspace {
  return {
    tripId: cleanString(workspace.tripId),
    sectionOrder: [...normalizeOrder(workspace.sectionOrder)],
    collapsed: { ...normalizeCollapsed(workspace.collapsed) },
    activeSection: normalizeActiveSection(workspace.activeSection),
    createdAt: Number(workspace.createdAt) || Date.now(),
    updatedAt: Number(workspace.updatedAt) || Number(workspace.createdAt) || Date.now(),
  };
}

export function makeDefaultTripWorkspace(tripId: string): TripWorkspace {
  const id = cleanString(tripId);
  const now = Date.now();

  return {
    tripId: id,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    collapsed: {},
    activeSection: "tickets",
    createdAt: now,
    updatedAt: now,
  };
}
