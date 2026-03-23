// src/utils/fixtureCertainty.ts
import type { FixtureListRow } from "@/src/services/apiFootball";
import { isKickoffTbc } from "@/src/utils/kickoffTbc";

export type FixtureCertaintyState = "confirmed" | "likely_tbc" | "tbc" | "changed";

type Options = {
  placeholderIds?: Set<string>;
  previousKickoffIso?: string | null;
};

function normalizeText(v: unknown): string {
  return String(v ?? "").trim();
}

function normalizeIso(v: unknown): string | null {
  const s = normalizeText(v);
  return s || null;
}

function normalizeStatusShort(v: unknown): string {
  return normalizeText(v).toUpperCase();
}

function hasExplicitApiTbc(statusShort: string): boolean {
  return statusShort === "TBD" || statusShort === "TBA";
}

function hasMissingKickoff(row: FixtureListRow | null | undefined): boolean {
  return !normalizeIso(row?.fixture?.date);
}

function hasKickoffChanged(
  row: FixtureListRow | null | undefined,
  previousKickoffIso?: string | null
): boolean {
  const currentIso = normalizeIso(row?.fixture?.date);
  const previousIso = normalizeIso(previousKickoffIso);

  if (!currentIso || !previousIso) return false;
  return currentIso !== previousIso;
}

function isLikelyPlaceholderKickoff(
  row: FixtureListRow | null | undefined,
  placeholderIds?: Set<string>
): boolean {
  if (!row) return false;
  return isKickoffTbc(row, placeholderIds);
}

export function getFixtureCertainty(
  row: FixtureListRow | null | undefined,
  opts?: Options
): FixtureCertaintyState {
  if (!row) return "tbc";

  const statusShort = normalizeStatusShort(row?.fixture?.status?.short);

  if (hasExplicitApiTbc(statusShort)) return "tbc";
  if (hasMissingKickoff(row)) return "tbc";
  if (hasKickoffChanged(row, opts?.previousKickoffIso)) return "changed";
  if (isLikelyPlaceholderKickoff(row, opts?.placeholderIds)) return "likely_tbc";

  return "confirmed";
}

export function isFixtureConfirmed(
  row: FixtureListRow | null | undefined,
  opts?: Options
): boolean {
  return getFixtureCertainty(row, opts) === "confirmed";
}

export function isFixtureTbcLike(
  row: FixtureListRow | null | undefined,
  opts?: Options
): boolean {
  const certainty = getFixtureCertainty(row, opts);
  return certainty === "tbc" || certainty === "likely_tbc";
}

export function hasFixtureKickoffChanged(
  row: FixtureListRow | null | undefined,
  previousKickoffIso?: string | null
): boolean {
  return getFixtureCertainty(row, { previousKickoffIso }) === "changed";
}
