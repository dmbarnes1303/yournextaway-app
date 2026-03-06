// src/data/stadiums/types.ts

export type StadiumRecord = {
  /** Stable key used across routes / lookups */
  stadiumKey: string;

  /** Stadium display name */
  name: string;

  /** City the stadium is in */
  city: string;

  /** Country the stadium is in */
  country: string;

  /** Optional stadium capacity */
  capacity?: number;

  /** Optional opening year */
  opened?: number;

  /** Team keys that use this stadium */
  teamKeys: string[];
};
