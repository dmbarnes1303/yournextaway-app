// src/utils/fixtureCertainty.ts
import type { FixtureListRow } from "@/src/services/apiFootball";
import { isKickoffTbc } from "@/src/utils/kickoffTbc";

export type FixtureCertainty =
  | "confirmed"
  | "likely_tbc"
  | "tbc"
  | "changed";

type Options = {
  placeholderIds?: Set<string>;
  previousKickoffIso?: string | null;
};

function normalizeIso(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export function getFixtureCertainty(
  row: FixtureListRow | null | undefined,
  opts?: Options
): FixtureCertainty {
  if (!row) return "tbc";

  const currentIso = normalizeIso(row?.fixture?.date);
  const previousIso = normalizeIso(opts?.previousKickoffIso);

  const short = String(row?.fixture?.status?.short ?? "")
    .trim()
    .toUpperCase();

  // Explicit TBC from API
  if (short === "TBD" || short === "TBA") return "tbc";

  // Missing kickoff
  if (!currentIso) return "tbc";

  // Kickoff changed (diff vs snapshot / previous)
  if (previousIso && currentIso !== previousIso) return "changed";

  // Likely placeholder cluster (only accurate if placeholderIds provided)
  if (isKickoffTbc(row, opts?.placeholderIds)) return "likely_tbc";

  return "confirmed";
}
