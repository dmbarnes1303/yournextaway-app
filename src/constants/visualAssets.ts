// src/constants/visualAssets.ts

export type VisualAsset = {
  flagBackdrop: string;
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const COUNTRY_VISUALS: Record<string, VisualAsset> = {
  ENG: {
    flagBackdrop: unsplash("photo-1521295121783-8a321d551ad2"), // placeholder UK vibe (replace later with real flag renders)
  },
  ES: {
    flagBackdrop: unsplash("photo-1505739771261-7f6a5d6f8c0f"),
  },
  IT: {
    flagBackdrop: unsplash("photo-1523906630133-f6934a1ab2b9"),
  },
  DE: {
    flagBackdrop: unsplash("photo-1467269204594-9661b134dd2b"),
  },
  FR: {
    flagBackdrop: unsplash("photo-1502602898657-3e91760cbb34"),
  },
  NL: {
    flagBackdrop: unsplash("photo-1505761671935-60b3a7427bad"),
  },
  PT: {
    flagBackdrop: unsplash("photo-1513735492246-483525079686"),
  },
  SCO: {
    flagBackdrop: unsplash("photo-1506377247377-2a5b3b417ebb"),
  },
  TR: {
    flagBackdrop: unsplash("photo-1527838832700-5059252407fa"),
  },
  HU: {
    flagBackdrop: unsplash("photo-1563720223185-11003d516935"),
  },
  BG: {
    flagBackdrop: unsplash("photo-1571867424486-1c8e7b7c3a6d"),
  },
};

export function getCountryBackdrop(code?: string | null): string | null {
  if (!code) return null;
  return COUNTRY_VISUALS[code]?.flagBackdrop ?? null;
}
