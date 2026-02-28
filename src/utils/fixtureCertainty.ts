// src/utils/fixtureCertainty.ts
import type { FixtureListRow } from "@/src/services/apiFootball";
import { isKickoffTbc, kickoffIsoOrNull } from "@/src/utils/kickoffTbc";

export type FixtureCertaintyState = "confirmed" | "likely_tbc" | "tbc" | "changed";

type Options = {
  placeholderIds?: Set<string>;
  previousKickoffIso?: string | null;
  now?: Date; // optional, lets callers keep a consistent "now"
};

function normalizeIso(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function statusShort(row: FixtureListRow | null | undefined): string {
  return String(row?.fixture?.status?.short ?? "").trim().toUpperCase();
}

function isExplicitTbcShort(short: string) {
  return short === "TBD" || short === "TBA";
}

function toMinuteKey(iso: string) {
  // "2026-04-19T14:00:00+00:00" -> "2026-04-19T14:00"
  const m = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return m?.[1] ?? iso.slice(0, 16);
}

function sameKickoffMinute(a: string | null, b: string | null) {
  if (!a || !b) return false;
  return toMinuteKey(a) === toMinuteKey(b);
}

export function getFixtureCertainty(
  row: FixtureListRow | null | undefined,
  opts?: Options
): FixtureCertaintyState {
  if (!row) return "tbc";

  const short = statusShort(row);

  // 1) Explicit TBC from API always wins (clear, not heuristic)
  if (isExplicitTbcShort(short)) return "tbc";

  const currentIso = normalizeIso(kickoffIsoOrNull(row) ?? row?.fixture?.date);
  // 2) Missing kickoff => true TBC (not "likely")
  if (!currentIso) return "tbc";

  // 3) Kickoff changed (minute-bucketed to avoid formatting noise)
  const previousIso = normalizeIso(opts?.previousKickoffIso);
  if (previousIso && !sameKickoffMinute(currentIso, previousIso)) {
    return "changed";
  }

  // 4) Heuristic “likely placeholder” (cluster / midnight / far-out rules)
  const likely = isKickoffTbc(row, opts?.placeholderIds, { now: opts?.now });
  if (likely) return "likely_tbc";

  return "confirmed";
}
