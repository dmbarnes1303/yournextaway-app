import type {
  SavedItem,
  SavedItemStatus,
  SavedItemType,
} from "@/src/core/savedItemTypes";

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

export const WORKSPACE_SECTIONS: Record<WorkspaceSectionKey, WorkspaceSection> = {
  tickets: {
    key: "tickets",
    title: "Tickets",
    subtitle: "Seats, official sellers, confirmations",
    types: ["tickets"],
    requiredForCompletion: true,
  },
  travel: {
    key: "travel",
    title: "Travel",
    subtitle: "Flights, trains",
    types: ["flight", "train"],
    requiredForCompletion: true,
  },
  stay: {
    key: "stay",
    title: "Stay",
    subtitle: "Hotels, apartments",
    types: ["hotel"],
    requiredForCompletion: true,
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
  "travel",
  "stay",
  "transfers",
  "things",
  "insurance",
  "claims",
  "notes",
];

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isWorkspaceSectionKey(value: unknown): value is WorkspaceSectionKey {
  return typeof value === "string" && value in WORKSPACE_SECTIONS;
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
  collapsed?: Record<string, unknown> | null
): Partial<Record<WorkspaceSectionKey, boolean>> {
  const out: Partial<Record<WorkspaceSectionKey, boolean>> = {};
  if (!collapsed || typeof collapsed !== "object") return out;

  for (const key of DEFAULT_SECTION_ORDER) {
    const value = collapsed[key];
    if (typeof value === "boolean") {
      out[key] = value;
    }
  }

  return out;
}

export function normalizeActiveSection(value: unknown): WorkspaceSectionKey {
  return isWorkspaceSectionKey(value) ? value : DEFAULT_SECTION_ORDER[0];
}

export function makeDefaultTripWorkspace(tripId: string): TripWorkspace {
  const now = Date.now();

  return {
    tripId: clean(tripId),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    collapsed: {},
    activeSection: DEFAULT_SECTION_ORDER[0],
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneWorkspace(workspace: TripWorkspace): TripWorkspace {
  const createdAt = isFinitePositiveNumber(workspace.createdAt)
    ? workspace.createdAt
    : Date.now();

  const updatedAt = isFinitePositiveNumber(workspace.updatedAt)
    ? workspace.updatedAt
    : createdAt;

  return {
    tripId: clean(workspace.tripId),
    sectionOrder: normalizeOrder(workspace.sectionOrder),
    collapsed: normalizeCollapsed(workspace.collapsed),
    activeSection: normalizeActiveSection(workspace.activeSection),
    createdAt,
    updatedAt,
  };
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

export function groupSavedItemsBySection(
  items: SavedItem[]
): Record<WorkspaceSectionKey, SavedItem[]> {
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

  for (const item of Array.isArray(items) ? items : []) {
    if (item.status === "archived") continue;
    grouped[sectionForSavedItemType(item.type)].push(item);
  }

  return grouped;
}

export function countByStatus(items: SavedItem[]): Record<SavedItemStatus, number> {
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

function makeEmptySectionCounts(): Record<WorkspaceSectionKey, number> {
  return {
    tickets: 0,
    stay: 0,
    travel: 0,
    transfers: 0,
    things: 0,
    insurance: 0,
    claims: 0,
    notes: 0,
  };
}

export function computeWorkspaceSnapshot(items: SavedItem[]): WorkspaceSnapshot {
  const allItems = Array.isArray(items) ? items : [];
  const activeItems = allItems.filter((item) => item.status !== "archived");

  const statusCounts = countByStatus(allItems);
  const sectionTotals = makeEmptySectionCounts();
  const sectionActiveTotals = makeEmptySectionCounts();

  for (const item of allItems) {
    const section = sectionForSavedItemType(item.type);
    sectionTotals[section] += 1;

    if (item.status !== "archived") {
      sectionActiveTotals[section] += 1;
    }
  }

  const missing: WorkspaceSnapshot["missing"] = [];

  if (sectionActiveTotals.tickets === 0) {
    missing.push({
      section: "tickets",
      reason: "No ticket option saved yet.",
    });
  }

  if (sectionActiveTotals.travel === 0) {
    missing.push({
      section: "travel",
      reason: "No travel option saved yet.",
    });
  }

  if (sectionActiveTotals.stay === 0) {
    missing.push({
      section: "stay",
      reason: "No accommodation saved yet.",
    });
  }

  if (sectionActiveTotals.transfers === 0) {
    missing.push({
      section: "transfers",
      reason: "No transfer option saved yet.",
    });
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
