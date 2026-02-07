// src/utils/kickoffTbc.ts
import type { FixtureListRow } from "@/src/services/apiFootball";

/**
 * We infer "likely TBC" when:
 * 1) API explicitly signals TBD/TBA via status.short
 * 2) fixture has no kickoff date
 * 3) fixture is > 21 days away AND belongs to a round where >= 7 fixtures share the exact same kickoff timestamp
 *
 * This is a heuristic. It will not be perfect, but it’s pragmatic and matches real scheduling behaviour.
 */

const CONFIRMED_WITHIN_DAYS = 21;
const PLACEHOLDER_CLUSTER_THRESHOLD = 7;

function normalizeId(id: unknown) {
  return String(id ?? "").trim();
}

function kickoffIso(r: { fixture?: { date?: string } } | null | undefined): string | null {
  const raw = r?.fixture?.date ? String(r.fixture.date) : "";
  return raw.trim() ? raw.trim() : null;
}

function statusShort(r: FixtureListRow | null | undefined): string {
  return String(r?.fixture?.status?.short ?? "").trim().toUpperCase();
}

function isExplicitTbcStatus(short: string) {
  return short === "TBD" || short === "TBA";
}

function toMinuteKey(iso: string) {
  // ISO from API Football usually contains seconds; bucket to minute.
  // "2026-04-19T14:00:00+00:00" -> "2026-04-19T14:00"
  const m = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return m?.[1] ?? iso.slice(0, 16);
}

function daysUntil(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  const ms = t - Date.now();
  return ms / (1000 * 60 * 60 * 24);
}

export function isKickoffTbc(row: FixtureListRow, placeholderIds?: Set<string>) {
  const id = normalizeId(row?.fixture?.id);
  const iso = kickoffIso(row);
  const short = statusShort(row);

  if (isExplicitTbcStatus(short)) return true;
  if (!iso) return true;

  // Anything within the "late window" is treated as confirmed
  if (daysUntil(iso) <= CONFIRMED_WITHIN_DAYS) return false;

  // If caller gave placeholder set, trust it
  if (placeholderIds && id && placeholderIds.has(id)) return true;

  return false;
}

/**
 * Compute likely placeholder (TBC) fixture ids from a set of fixtures.
 * Uses league.round grouping and kickoff timestamp clustering.
 */
export function computeLikelyPlaceholderTbcIds(rows: FixtureListRow[]): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(rows) || rows.length === 0) return out;

  // 1) Respect explicit TBD/TBA signals
  for (const r of rows) {
    const id = normalizeId(r?.fixture?.id);
    if (!id) continue;
    const short = statusShort(r);
    if (isExplicitTbcStatus(short)) out.add(id);
  }

  // 2) Group by league+season+round
  type GroupKey = string;
  const groups = new Map<GroupKey, FixtureListRow[]>();

  for (const r of rows) {
    const id = normalizeId(r?.fixture?.id);
    if (!id) continue;

    const iso = kickoffIso(r);
    if (!iso) {
      out.add(id);
      continue;
    }

    // Within 21 days => confirmed, do not mark as placeholder
    if (daysUntil(iso) <= CONFIRMED_WITHIN_DAYS) continue;

    const leagueId = r?.league?.id != null ? String(r.league.id) : "";
    const season = r?.league?.season != null ? String(r.league.season) : "";
    const round = String(r?.league?.round ?? "").trim();
    if (!leagueId || !season || !round) continue;

    const key = `${leagueId}:${season}:${round}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  // 3) For each group, count kickoff timestamp clusters
  for (const groupRows of groups.values()) {
    if (groupRows.length < PLACEHOLDER_CLUSTER_THRESHOLD) continue;

    const counts = new Map<string, number>();
    for (const r of groupRows) {
      const iso = kickoffIso(r);
      if (!iso) continue;
      const k = toMinuteKey(iso);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    // Find the biggest cluster
    let topKey: string | null = null;
    let topCount = 0;
    for (const [k, c] of counts.entries()) {
      if (c > topCount) {
        topCount = c;
        topKey = k;
      }
    }

    if (!topKey || topCount < PLACEHOLDER_CLUSTER_THRESHOLD) continue;

    // Mark fixtures that match the cluster
    for (const r of groupRows) {
      const id = normalizeId(r?.fixture?.id);
      const iso = kickoffIso(r);
      if (!id || !iso) continue;
      if (toMinuteKey(iso) === topKey) out.add(id);
    }
  }

  return out;
}
