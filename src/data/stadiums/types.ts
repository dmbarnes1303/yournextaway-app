// src/data/stadiums/types.ts

export type StadiumTransit = {
  /** Display label, e.g. "Kings Cross" or "Arsenal Station" */
  label: string;

  /** Approx walk time in minutes from the stadium */
  minutes?: number;

  /** Optional note, e.g. "best for quick exit" */
  note?: string;
};

export type StadiumStayArea = {
  /** Area / neighbourhood name */
  area: string;

  /** Short reason why it is good */
  why: string;
};

export type StadiumRecord = {
  /** Stable key used across routes / lookups */
  stadiumKey: string;

  /** Stadium display name */
  name: string;

  /** City the stadium is in */
  city: string;

  /** Country the stadium is in */
  country: string;

  /** Team keys that use this stadium */
  teamKeys: string[];

  /** Optional address */
  address?: string;

  /** Optional stadium capacity */
  capacity?: number;

  /** Optional opening year */
  opened?: number;

  /** Optional quick travel / matchday notes */
  tips?: string[];

  /** Optional primary transport anchors */
  transit?: StadiumTransit[];

  /** Optional suggested areas to stay nearby / conveniently */
  stayAreas?: StadiumStayArea[];

  /** Optional official info page */
  officialInfoUrl?: string;
};
