// src/utils/kickoffTbc.ts
import type { FixtureListRow } from "@/src/services/apiFootball";

type KickoffMeta = {
  fixtureId: string;
  kickoffIso: string | null;
  dateOnly: string | null;
  timeKey: string | null; // "HH:MM" (24h) in local time
  isExplicitTbc: boolean;
};

function toId(r: FixtureListRow): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
}

function safeLower(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

function isoDateOnly(iso: string): string | null {
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function timeKeyLocal(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function daysFromNow(dateOnly: string): number {
  // compare at midnight local
  const [y, m, d] = dateOnly.split("-").map((n) => Number(n));
  const target = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const diffMs = target - today;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function isExplicitTbcStatus(r: FixtureListRow): boolean {
  const short = safeLower(r?.fixture?.status?.short);
  const long = safeLower(r?.fixture?.status?.long);

  // These are the only ones we treat as true “not scheduled / not confirmed”.
  // If API-Football uses other markers in your data, add them here after you’ve observed them.
  const explicit = new Set(["tbd", "tba", "to be defined", "to be announced"]);
  if (explicit.has(short)) return true;
  if (explicit.has(long)) return true;

  // Some feeds shove “not started” only (“ns”) even when time is unknown, so we do NOT treat NS as TBC.
  return false;
}

function buildMeta(r: FixtureListRow): KickoffMeta {
  const fixtureId = toId(r);
  const raw = r?.fixture?.date ? String(r.fixture.date) : null;

  if (!raw) {
    return {
      fixtureId,
      kickoffIso: null,
      dateOnly: null,
      timeKey: null,
      isExplicitTbc: true,
    };
  }

  const dateOnly = isoDateOnly(raw);
  const tk = timeKeyLocal(raw);

  return {
    fixtureId,
    kickoffIso: raw,
    dateOnly,
    timeKey: tk,
    isExplicitTbc: isExplicitTbcStatus(r),
  };
}

/**
 * Compute a set of fixtureIds that are VERY LIKELY placeholders (TBC) based on consensus.
 *
 * Rationale:
 * - Far-future fixtures often default to identical times for all matches on a date (broadcast slot placeholder).
 * - We treat that situation as TBC because the time is not truly confirmed.
 *
 * This is deliberately conservative:
 * - Only triggers if:
 *   - date is > MIN_DAYS_AHEAD
 *   - group size >= MIN_GROUP_SIZE
 *   - a single time dominates >= DOMINANCE_RATIO
 *   - and that time is “on the hour” (MM === "00") to avoid false positives
 */
export function computeLikelyPlaceholderTbcIds(
  rows: FixtureListRow[],
  opts?: {
    minDaysAhead?: number;
    minGroupSize?: number;
    dominanceRatio?: number;
    requireOnTheHour?: boolean;
  }
): Set<string> {
  const MIN_DAYS_AHEAD = opts?.minDaysAhead ?? 14;
  const MIN_GROUP_SIZE = opts?.minGroupSize ?? 6;
  const DOMINANCE_RATIO = opts?.dominanceRatio ?? 0.7;
  const REQUIRE_ON_THE_HOUR = opts?.requireOnTheHour ?? true;

  const out = new Set<string>();

  // Group by leagueId + dateOnly
  const groups = new Map<string, KickoffMeta[]>();

  for (const r of rows) {
    const leagueId = r?.league?.id ?? r?.league?.id ?? null;
    const lid = leagueId != null ? String(leagueId) : "unknown";
    const meta = buildMeta(r);

    if (!meta.fixtureId) continue;
    if (!meta.dateOnly) continue;
    if (!meta.timeKey) continue;

    // If it’s explicitly TBC, it’s already handled elsewhere — no need to rely on heuristics.
    if (meta.isExplicitTbc) continue;

    const key = `${lid}:${meta.dateOnly}`;
    const list = groups.get(key) ?? [];
    list.push(meta);
    groups.set(key, list);
  }

  for (const metas of groups.values()) {
    if (metas.length < MIN_GROUP_SIZE) continue;

    const dateOnly = metas[0]?.dateOnly;
    if (!dateOnly) continue;

    const ahead = daysFromNow(dateOnly);
    if (ahead <= MIN_DAYS_AHEAD) continue;

    // Count times
    const counts = new Map<string, number>();
    for (const m of metas) {
      if (!m.timeKey) continue;
      counts.set(m.timeKey, (counts.get(m.timeKey) ?? 0) + 1);
    }

    // Find dominant time
    let topTime: string | null = null;
    let topCount = 0;
    for (const [t, c] of counts.entries()) {
      if (c > topCount) {
        topCount = c;
        topTime = t;
      }
    }

    if (!topTime) continue;

    if (REQUIRE_ON_THE_HOUR) {
      const mm = topTime.split(":")[1] ?? "";
      if (mm !== "00") continue;
    }

    const ratio = topCount / metas.length;
    if (ratio < DOMINANCE_RATIO) continue;

    // Mark all fixtures that match the dominant time as likely placeholders
    for (const m of metas) {
      if (m.timeKey === topTime) out.add(m.fixtureId);
    }
  }

  return out;
}

/**
 * Single-row decision helper.
 * You pass in the placeholder set from computeLikelyPlaceholderTbcIds.
 */
export function isKickoffTbc(
  r: FixtureListRow,
  placeholderIds?: Set<string>
): boolean {
  const meta = buildMeta(r);
  if (meta.isExplicitTbc) return true;
  if (!meta.kickoffIso) return true;

  if (placeholderIds && meta.fixtureId && placeholderIds.has(meta.fixtureId)) {
    return true;
  }

  return false;
}

/**
 * If TBC: returns null (important for Follow store: kickoffIso should be null when unconfirmed)
 * If confirmed: returns ISO string.
 */
export function kickoffIsoOrNull(
  r: FixtureListRow,
  placeholderIds?: Set<string>
): string | null {
  return isKickoffTbc(r, placeholderIds) ? null : (r?.fixture?.date ? String(r.fixture.date) : null);
}
