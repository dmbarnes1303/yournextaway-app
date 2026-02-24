import type { FixtureListRow } from "@/src/services/apiFootball";
import { isKickoffTbc } from "@/src/utils/kickoffTbc";

export type FixtureCertaintyState =
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
): FixtureCertaintyState {
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

  // Kickoff changed
  if (previousIso && currentIso !== previousIso) {
    return "changed";
  }

  // Likely placeholder cluster
  const tbc = isKickoffTbc(row, opts?.placeholderIds);
  if (tbc) return "likely_tbc";

  return "confirmed";
}
