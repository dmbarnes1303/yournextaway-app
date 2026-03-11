import { env, hasGigsbergConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

type GigsbergEvent = {
  id?: number | string;
  name?: string;
  event_name?: string;
  date?: string;
  event_date?: string;
  city?: string;
  venue?: string;
  venue_name?: string;
  country?: string;
  country_name?: string;
  type?: string;
  type_name?: string;
  subtype?: string;
  subtype_name?: string;
};

type GigsbergEventsResponse = {
  data?: GigsbergEvent[];
  total?: number;
  nextPage?: string | number | null;
  prevPage?: string | number | null;
  lastPage?: string | number | null;
};

type GigsbergListing = {
  id?: number | string;
  listing_id?: number | string;
  event_id?: number | string;
  block?: string;
  category?: string;
  split_type?: string;
  quantity?: number | string;
  total_price?: number | string;
  totalPrice?: number | string;
  price?: number | string;
  price_per_ticket?: number | string;
  currency?: string;
  currency_code?: string;
};

type GigsbergListingsResponse = {
  data?: GigsbergListing[];
  total?: number;
  nextPage?: string | number | null;
  prevPage?: string | number | null;
  lastPage?: string | number | null;
};

const GIGSBERG_FETCH_TIMEOUT_MS = 6500;
const EVENTS_PER_PAGE = 25;
const LISTINGS_PER_PAGE = 20;

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function norm(v: unknown): string {
  return clean(v).toLowerCase();
}

function safeDate(v?: string | null): Date | null {
  const s = clean(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function absDays(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

function eventName(ev: GigsbergEvent): string {
  return clean(ev.name) || clean(ev.event_name);
}

function eventDate(ev: GigsbergEvent): string {
  return clean(ev.date) || clean(ev.event_date);
}

function eventVenue(ev: GigsbergEvent): string {
  return clean(ev.venue_name) || clean(ev.venue);
}

function eventCity(ev: GigsbergEvent): string {
  return clean(ev.city);
}

function eventCountry(ev: GigsbergEvent): string {
  return clean(ev.country_name) || clean(ev.country);
}

function eventType(ev: GigsbergEvent): string {
  return clean(ev.type_name) || clean(ev.type);
}

function eventSubtype(ev: GigsbergEvent): string {
  return clean(ev.subtype_name) || clean(ev.subtype);
}

function listingId(listing: GigsbergListing): string {
  return clean(listing.id) || clean(listing.listing_id);
}

function listingEventId(listing: GigsbergListing): string {
  return clean(listing.event_id);
}

function numberFromUnknown(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const raw = clean(v);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function listingQuantity(listing: GigsbergListing): number | null {
  return numberFromUnknown(listing.quantity);
}

function listingCurrency(listing: GigsbergListing): string {
  return clean(listing.currency_code) || clean(listing.currency);
}

function listingPriceValue(listing: GigsbergListing): number | null {
  return (
    numberFromUnknown(listing.total_price) ??
    numberFromUnknown(listing.totalPrice) ??
    numberFromUnknown(listing.price_per_ticket) ??
    numberFromUnknown(listing.price) ??
    null
  );
}

function listingPriceText(listing: GigsbergListing): string | null {
  const value = listingPriceValue(listing);
  const currency = listingCurrency(listing);

  if (value == null && !currency) return null;
  if (value != null && currency) return `${value} ${currency}`.trim();
  if (value != null) return String(value);
  return currency || null;
}

function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function buildDateWindow(kickoffIso: string): { dateFrom?: string; dateTo?: string } {
  const kickoff = safeDate(kickoffIso);
  if (!kickoff) return {};

  return {
    dateFrom: formatYmd(addDays(kickoff, -2)),
    dateTo: formatYmd(addDays(kickoff, 2)),
  };
}

function appendAffiliate(url: string): string {
  const base = clean(url);
  if (!base) return "";

  const affiliateId = clean(env.gigsbergAffiliateId);
  if (!affiliateId) return base;

  try {
    const parsed
