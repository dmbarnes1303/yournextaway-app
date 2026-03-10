export type StadiumTransit = {
  /** Display label, e.g. "Kings Cross" or "Arsenal Station" */
  label: string;

  /** Approximate travel or walk time in minutes */
  minutes?: number;

  /** Short practical note */
  note?: string;
};

export type StadiumStayArea = {
  /** Area / neighbourhood name */
  area: string;

  /** Why this area is useful */
  why: string;
};

export type StadiumParking = {
  /** Short parking guidance summary */
  summary?: string;

  /** Practical parking tips */
  tips?: string[];

  /** Optional named parking locations */
  options?: Array<{
    name: string;
    note?: string;
  }>;
};

export type StadiumRecord = {
  /** Stable registry key */
  stadiumKey: string;

  /** Display name */
  name: string;

  /** City display name */
  city: string;

  /** Country display name */
  country: string;

  /** Team keys that use this stadium */
  teamKeys: string[];

  /** Optional address */
  address?: string;

  /** Optional capacity */
  capacity?: number;

  /** Optional opening year */
  opened?: number;

  /** Nearest airport */
  airport?: string;

  /** Distance from airport in km */
  distanceFromAirportKm?: number;

  /** Quick practical notes */
  tips?: string[];

  /** Main transport anchors */
  transit?: StadiumTransit[];

  /** Useful places to stay */
  stayAreas?: StadiumStayArea[];

  /** Optional parking guidance */
  parking?: StadiumParking;

  /** Optional official info page */
  officialInfoUrl?: string;
};

export type StadiumRegistry = Record<string, StadiumRecord>;
