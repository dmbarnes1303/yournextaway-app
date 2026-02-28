// src/utils/kickoffTbc.ts
import type { FixtureListRow } from "@/src/services/apiFootball";

/**
 * We infer "likely TBC" when:
 * 1) API explicitly signals TBD/TBA via status.short
 * 2) fixture has no kickoff date
 * 3) fixture is > CONFIRMED_WITHIN_DAYS away AND belongs to a round where
 *    >= PLACEHOLDER_CLUSTER_THRESHOLD fixtures share the exact same kickoff timestamp (bucketed to minute)
 * 4) fixture is > CONFIRMED_WITHIN_DAYS away AND kickoff time is exactly 00:00 (common placeholder)
 *
 * This is a heuristic. It will not be perfect, but it’s pragmatic and matches real scheduling behaviour.
 */

export const CONFIRMED_WITHIN_DAYS = 21;
export const PLACEHOLDER_CLUSTER_THRESHOLD = 7;

function normalizeId(id: unknown) {
  return String(id ?? "").trim();
}

export function kickoffIsoOrNull(row: FixtureListRow | null | undefined): string | null {
  const raw = row?.fixture?.date ? String(row.fixture.date) : "";
  return raw.trim() ? raw.trim() : null;
}

function statusShort(row: FixtureListRow | null | undefined): string {
  return String(row?.fixture?.status?.short ?? "").trim().toUpperCase();
}

function isExplicitTbcStatus(short: string) {
  return short === "TBD" || short === "TBA";
}

function toMinuteKey(iso: string) {
  // "2026-04-19T14:00:00+00:00" -> "2026-04-19T14:00"
  const m = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return m?.[1] ?? iso.slice(0, 16);
}

function daysUntil(iso: string, now: Date) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  const ms = t - now.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function isMidnightPlaceholder(iso: string): boolean {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  return d.getHours() === 0 && d.getMinutes() === 0;
}

/**
 * Quick check for a single row.
 * If you pass `placeholderIds` (computed from a fixtures list), this becomes accurate.
 * If you don't, it only uses explicit TBD/TBA + missing kickoff + <=21 day rule + midnight heuristic.
 */
export function isKickoffTbc(
  row: FixtureListRow,
  placeholderIds?: Set<string>,
  opts?: { now?: Date; confirmedWithinDays?: number }
) {
  const now = opts?.now ?? new Date();
  const confirmedWithinDays = opts?.confirmedWithinDays ?? CONFIRMED_WITHIN_DAYS;

  const id = normalizeId(row?.fixture?.id);
  const iso = kickoffIsoOrNull(row);
  const short = statusShort(row);

  if (isExplicitTbcStatus(short)) return true;
  if (!iso) return true;

  // Anything within the "late window" is treated as confirmed
  if (daysUntil(iso, now) <= confirmedWithinDays) return false;

  // Midnight kickoff far out is very often a placeholder
  if (isMidnightPlaceholder(iso)) return true;

  // If caller gave placeholder set, trust it
  if (placeholderIds && id && placeholderIds.has(id)) return true;

  // Otherwise unknown — default to "not TBC" to avoid misleading UI
  return false;
}

/**
 * Compute likely placeholder (TBC) fixture ids from a set of fixtures.
 * Uses league+season+round grouping and kickoff timestamp clustering.
 */
export function computeLikelyPlaceholderTbcIds(
  rows: FixtureListRow[],
  opts?: { now?: Date; confirmedWithinDays?: number; threshold?: number }
): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(rows) || rows.length === 0) return out;

  const now = opts?.now ?? new Date();
  const confirmedWithinDays = opts?.confirmedWithinDays ?? CONFIRMED_WITHIN_DAYS;
  const threshold = opts?.threshold ?? PLACEHOLDER_CLUSTER_THRESHOLD;

  // 1) Respect explicit TBD/TBA signals + missing kickoff
  for (const r of rows) {
    const id = normalizeId(r?.fixture?.id);
    if (!id) continue;

    const short = statusShort(r);
    if (isExplicitTbcStatus(short)) {
      out.add(id);
      continue;
    }

    const iso = kickoffIsoOrNull(r);
    if (!iso) {
      out.add(id);
      continue;
    }

    // Midnight far out is a common placeholder
    if (daysUntil(iso, now) > confirmedWithinDays && isMidnightPlaceholder(iso)) {
      out.add(id);
    }
  }

  // 2) Group eligible fixtures by league+season+round (only those > confirmedWithinDays away)
  type GroupKey = string;
  const groups = new Map<GroupKey, FixtureListRow[]>();

  for (const r of rows) {
    const id = normalizeId(r?.fixture?.id);
    if (!id) continue;

    const iso = kickoffIsoOrNull(r);
    if (!iso) continue;

    // within X days => treat as confirmed (don’t call it placeholder)
    if (daysUntil(iso, now) <= confirmedWithinDays) continue;

    const leagueId = r?.league?.id != null ? String(r.league.id) : "";
    const season = (r as any)?.league?.season != null ? String((r as any).league.season) : "";
    const round = String(r?.league?.round ?? "").trim();
    if (!leagueId || !season || !round) continue;

    const key = `${leagueId}:${season}:${round}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  // 3) For each group, count kickoff timestamp clusters (minute-bucketed)
  for (const groupRows of groups.values()) {
    if (groupRows.length < threshold) continue;

    const counts = new Map<string, number>();
    for (const r of groupRows) {
      const iso = kickoffIsoOrNull(r);
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

    if (!topKey || topCount < threshold) continue;

    // Mark fixtures that match the cluster
    for (const r of groupRows) {
      const id = normalizeId(r?.fixture?.id);
      const iso = kickoffIsoOrNull(r);
      if (!id || !iso) continue;
      if (toMinuteKey(iso) === topKey) out.add(id);
    }
  }

  return out;
}
