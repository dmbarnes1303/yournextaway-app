// src/data/stadiums/types.ts

export type StadiumTransit = {
  label: string; // e.g. "Euston (National Rail)"
  minutes?: number; // walk minutes, optional
  note?: string; // e.g. "best for quick exit"
};

export type StadiumStayArea = {
  area: string; // e.g. "Kings Cross"
  why: string; // short reason
};

export type StadiumRecord = {
  /** Canonical home club name (display) */
  clubName: string;

  /** Keys that can match API team names (normalized with normalizeTeamKey) */
  teamKeys: string[];

  stadiumName: string;
  city: string;

  /** Optional address line */
  address?: string;

  /** Optional capacity (number) */
  capacity?: number;

  /** Optional “what to know” bullets (no fluff) */
  tips?: string[];

  /** Primary transport anchors / stations */
  transit?: StadiumTransit[];

  /** Suggested stay areas that feed Trip Build (via onSelectStayArea) */
  stayAreas?: StadiumStayArea[];

  /** Optional official page (stadium info / visitor info) */
  officialInfoUrl?: string;
};
