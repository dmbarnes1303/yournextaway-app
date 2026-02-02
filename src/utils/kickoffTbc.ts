// src/utils/kickoffTbc.ts
import type { FixtureListRow } from "@/src/services/apiFootball";

function safeLower(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

function fixtureIdOf(r: FixtureListRow): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
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
  const [y, m, d] = dateOnly.split("-").map((n) => Number(n));
  const target = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export function isExplicitTbcStatus(r: FixtureListRow): boolean {
  const short = safeLower(r?.fixture?.status?.short);
  const long = safeLower(r?.fixture?.status?.long);

  // Only treat these as true “not confirmed”.
  // Do NOT treat "NS" as TBC.
  const explicit = new Set(["tbd", "tba", "to be defined", "to be announced"]);
  return explicit.has(short) || explicit.has(long);
}

/**
 * Conservative placeholder detection:
 * If far-future fixtures on the same league+date share the same kickoff time at scale,
 * that time is likely a placeholder broadcast slot.
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
  const groups = new Map<string, { fixtureId: string; timeKey: string; dateOnly: string }[]>();

  for (const r of rows) {
    if (isExplicitTbcStatus(r)) continue;

    const id = fixtureIdOf(r);
    if (!id) continue;

    const iso = r?.fixture?.date ? String(r.fixture.date) : "";
    if (!iso) continue;

    const dateOnly = isoDateOnly(iso);
    const tk = timeKeyLocal(iso);
    if (!dateOnly || !tk) continue;

    const lid = r?.league?.id != null ? String(r.league.id) : "unknown";
    const key = `${lid}:${dateOnly}`;

    const list = groups.get(key) ?? [];
    list.push({ fixtureId: id, timeKey: tk, dateOnly });
    groups.set(key, list);
  }

  for (const metas of groups.values()) {
    if (metas.length < MIN_GROUP_SIZE) continue;

    const dateOnly = metas[0]?.dateOnly;
    if (!dateOnly) continue;

    const ahead = daysFromNow(dateOnly);
    if (ahead <= MIN_DAYS_AHEAD) continue;

    const counts = new Map<string, number>();
    for (const m of metas) counts.set(m.timeKey, (counts.get(m.timeKey) ?? 0) + 1);

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

    for (const m of metas) {
      if (m.timeKey === topTime) out.add(m.fixtureId);
    }
  }

  return out;
}

export function isKickoffTbc(r: FixtureListRow, placeholderIds?: Set<string>): boolean {
  if (isExplicitTbcStatus(r)) return true;

  const iso = r?.fixture?.date ? String(r.fixture.date) : "";
  if (!iso) return true;

  const id = fixtureIdOf(r);
  if (placeholderIds && id && placeholderIds.has(id)) return true;

  return false;
}

export function kickoffIsoOrNull(r: FixtureListRow, placeholderIds?: Set<string>): string | null {
  return isKickoffTbc(r, placeholderIds) ? null : (r?.fixture?.date ? String(r.fixture.date) : null);
}
