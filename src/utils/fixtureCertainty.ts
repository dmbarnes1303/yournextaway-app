import type { FixtureListRow } from "@/src/services/apiFootball";
import { isKickoffTbc } from "@/src/utils/kickoffTbc";

export type FixtureCertainty =
  | "tbc"
  | "confirmed"
  | "changed"
  | "safe";

/**
 * Determines certainty state of a fixture kickoff.
 *
 * Inputs:
 * - API fixture row
 * - optional stored kickoff snapshot (trip or followStore)
 */
export function getFixtureCertainty(
  row: FixtureListRow | null | undefined,
  opts?: {
    placeholderIds?: Set<string>;
    previousKickoffIso?: string | null;
  }
): FixtureCertainty {
  if (!row) return "tbc";

  const iso = row?.fixture?.date ?? null;

  if (isKickoffTbc(row, opts?.placeholderIds)) {
    return "tbc";
  }

  if (opts?.previousKickoffIso && iso && iso !== opts.previousKickoffIso) {
    return "changed";
  }

  // confirmed window logic
  const d = iso ? new Date(iso).getTime() : NaN;
  if (Number.isFinite(d)) {
    const days = (d - Date.now()) / 86400000;

    // within 21d = stable
    if (days <= 21) return "safe";
  }

  return "confirmed";
}
