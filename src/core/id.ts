// src/core/id.ts

export type ID = string & { readonly __brand: "ID" };
export type TripID = string & { readonly __brand: "TripID" };
export type SavedItemID = string & { readonly __brand: "SavedItemID" };
export type PartnerID = string & { readonly __brand: "PartnerID" };

export function asTripId(v: string): TripID {
  return v as TripID;
}

export function asSavedItemId(v: string): SavedItemID {
  return v as SavedItemID;
}

export function asPartnerId(v: string): PartnerID {
  return v as PartnerID;
}

/**
 * Simple unique id generator suitable for offline-first local storage.
 * You can swap this for nanoid/uuid later without changing the types.
 */
export function makeId(prefix: string): ID {
  const rand = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${prefix}_${t}_${rand}` as ID;
}

export function makeTripId(): TripID {
  return makeId("trip") as unknown as TripID;
}

export function makeSavedItemId(): SavedItemID {
  return makeId("si") as unknown as SavedItemID;
}
