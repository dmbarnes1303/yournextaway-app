// src/core/tripTypes.ts

export type ISODate = `${number}-${number}-${number}`; // "YYYY-MM-DD" (date-only)
export type ISODateTime = string; // API-Football gives full ISO datetime; keep flexible

export type Id = string;

export type TripCategory =
  | "tickets"
  | "stay"
  | "flight"
  | "train"
  | "car"
  | "transfers"
  | "insurance"
  | "experiences"
  | "food"
  | "notes"
  | "other";

export type SavedStatus = "saved" | "pending" | "booked" | "cancelled";

export type Provider =
  | "booking"
  | "skyscanner"
  | "omio"
  | "getyourguide"
  | "google"
  | "other";

export type PartnerOpenMode = "in_app_browser" | "system_browser";

export type Money = {
  currency: "GBP" | "EUR" | "USD" | (string & {});
  amount: number; // store minor-units separately only if you need it later
};

export type PartnerLink = {
  id: Id;
  provider: Provider;
  title: string; // e.g. "Hotels", "Flights"
  url: string;

  // How we open it (default locked to expo-web-browser style).
  openMode?: PartnerOpenMode;

  // Optional: for analytics + wallet attribution later
  campaign?: string;
  createdAt?: number; // ms
};

export type SavedItem = {
  id: Id;

  tripId: Id;

  category: TripCategory;
  status: SavedStatus;

  title: string; // "Hotel search", "Flight to Barcelona", "Match tickets"
  subtitle?: string; // city, date, etc.

  provider: Provider;

  // The outbound partner link used (or last used)
  partner?: PartnerLink;

  // Price display policy: show exact price if user entered it, else “View live price”
  price?: Money;

  // Store raw references the user can paste in
  reference?: string;

  // Optional user notes (short)
  notes?: string;

  // Evidence / wallet association
  walletItemIds?: Id[];

  // Metadata
  createdAt: number; // ms
  updatedAt: number; // ms
};

export type Trip = {
  id: Id;

  // Minimal identity
  title: string; // e.g. "Barcelona weekend"
  cityName?: string; // human-friendly
  citySlug?: string; // your current "citySlug" usage

  // Fixture-centric
  fixtureId?: Id;
  leagueId?: number;
  season?: number;

  // Dates are date-only (YYYY-MM-DD)
  startDate?: ISODate;
  endDate?: ISODate;

  // One flexible workspace: saved items by category
  saved: SavedItem[];

  // Free-form notes for the trip (long)
  notes?: string;

  createdAt: number;
  updatedAt: number;
};

export type WalletItemType = "pdf" | "image" | "text" | "link" | "unknown";

export type WalletItem = {
  id: Id;

  // Global wallet item can optionally be linked to a trip
  tripId?: Id;

  type: WalletItemType;

  title: string;
  subtitle?: string;

  // Local file storage: uri or path you can reopen offline
  // (for web, this can be a data URL or persisted reference later)
  localUri?: string;

  // Original source link (partner page, email link, etc.)
  sourceUrl?: string;

  // Optional extracted reference
  reference?: string;

  // Optional category tagging for filtering
  category?: TripCategory;

  createdAt: number;
  updatedAt: number;
};

export type FollowAlertType = "kickoff_confirmed" | "kickoff_changed" | "price_drop" | "general";

export type FollowAlert = {
  id: Id;
  fixtureId: Id;
  type: FollowAlertType;
  createdAt: number;
  readAt?: number;
};
