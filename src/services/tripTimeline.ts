// src/services/tripTimeline.ts
import type { SavedItem } from "@/src/core/savedItemTypes";
import type { Trip } from "@/src/core/tripTypes";

export type TripTimelineKind =
  | "match"
  | "flight"
  | "hotel"
  | "train"
  | "transfer"
  | "things"
  | "insurance"
  | "claim"
  | "note"
  | "other";

export type TripTimelineEvent = {
  id: string;
  tripId: string;
  kind: TripTimelineKind;
  title: string;
  subtitle?: string;
  dateIso: string; // YYYY-MM-DD
  timeLabel?: string;
  sortTs: number;
  status?: SavedItem["status"];
  source: "trip" | "saved_item";
  savedItemId?: string;
  fixtureId?: string;
};

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function isIsoDateOnly(v: unknown): v is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(clean(v));
}

function parseDate(value: unknown): Date | null {
  const s = clean(value);
  if (!s) return null;

  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

function toDateIso(value: unknown): string | null {
  const s = clean(value);
  if (!s) return null;

  if (isIsoDateOnly(s)) return s;

  const d = parseDate(s);
  if (!d) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeLabel(value: unknown): string | undefined {
  const d = parseDate(value);
  if (!d) return undefined;

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  if (hh === "00" && mm === "00") return undefined;
  return `${hh}:${mm}`;
}

function toSortTs(dateIso: string, timeLike?: unknown, fallbackHour = 12): number {
  const d = parseDate(timeLike);

  if (d) return d.getTime();

  if (!isIsoDateOnly(dateIso)) return 0;

  const safe = new Date(`${dateIso}T${String(fallbackHour).padStart(2, "0")}:00:00`);
  return Number.isFinite(safe.getTime()) ? safe.getTime() : 0;
}

function titleFromTripMatch(trip: Trip): string {
  const home = clean((trip as any)?.homeName);
  const away = clean((trip as any)?.awayName);

  if (home && away) return `${home} vs ${away}`;
  if (home) return `${home} match`;
  if (away) return `${away} match`;

  const fixtureId = clean((trip as any)?.fixtureIdPrimary);
  return fixtureId ? `Match ${fixtureId}` : "Match";
}

function subtitleFromTripMatch(trip: Trip): string | undefined {
  const bits: string[] = [];

  const league = clean((trip as any)?.leagueName);
  const venue = clean((trip as any)?.venueName);
  const city = clean((trip as any)?.venueCity || (trip as any)?.displayCity);

  if (league) bits.push(league);
  if (venue) bits.push(venue);
  if (city) bits.push(city);

  return bits.length ? bits.join(" • ") : undefined;
}

function detectItemKind(item: SavedItem): TripTimelineKind {
  switch (item.type) {
    case "tickets":
      return "match";
    case "hotel":
      return "hotel";
    case "flight":
      return "flight";
    case "train":
      return "train";
    case "transfer":
      return "transfer";
    case "things":
      return "things";
    case "insurance":
      return "insurance";
    case "claim":
      return "claim";
    case "note":
      return "note";
    default:
      return "other";
  }
}

function itemDateCandidates(item: SavedItem, trip?: Trip | null): Array<unknown> {
  const m = (item.metadata ?? {}) as Record<string, any>;

  switch (item.type) {
    case "flight":
      return [
        m.departureTime,
        m.departureIso,
        m.outboundTime,
        m.outboundIso,
        m.startDate,
        m.dateIso,
        trip?.startDate,
      ];

    case "hotel":
      return [
        m.checkIn,
        m.checkInIso,
        m.checkin,
        m.checkinIso,
        m.startDate,
        m.dateIso,
        trip?.startDate,
      ];

    case "train":
      return [
        m.departureTime,
        m.departureIso,
        m.travelTime,
        m.startDate,
        m.dateIso,
        trip?.startDate,
      ];

    case "transfer":
      return [
        m.pickupTime,
        m.pickupIso,
        m.transferTime,
        m.dateIso,
        m.startDate,
        trip?.startDate,
      ];

    case "things":
      return [
        m.activityTime,
        m.activityIso,
        m.startTime,
        m.dateIso,
        m.startDate,
        trip?.startDate,
      ];

    case "tickets":
      return [
        m.kickoffIso,
        m.matchTime,
        m.dateIso,
        trip?.kickoffIso,
        trip?.startDate,
      ];

    case "insurance":
    case "claim":
    case "note":
    case "other":
    default:
      return [m.dateIso, m.startDate, trip?.startDate];
  }
}

function itemTimeCandidate(item: SavedItem, trip?: Trip | null): unknown {
  const m = (item.metadata ?? {}) as Record<string, any>;

  switch (item.type) {
    case "flight":
      return m.departureTime ?? m.departureIso ?? m.outboundTime ?? m.outboundIso;
    case "hotel":
      return m.checkIn ?? m.checkInIso ?? m.checkin ?? m.checkinIso;
    case "train":
      return m.departureTime ?? m.departureIso ?? m.travelTime;
    case "transfer":
      return m.pickupTime ?? m.pickupIso ?? m.transferTime;
    case "things":
      return m.activityTime ?? m.activityIso ?? m.startTime;
    case "tickets":
      return m.kickoffIso ?? trip?.kickoffIso;
    default:
      return undefined;
  }
}

function firstDateIso(values: Array<unknown>): string | null {
  for (const v of values) {
    const iso = toDateIso(v);
    if (iso) return iso;
  }
  return null;
}

function subtitleFromItem(item: SavedItem): string | undefined {
  const bits: string[] = [];
  const m = (item.metadata ?? {}) as Record<string, any>;

  const partner = clean(item.partnerId);
  const price = clean(item.priceText || m.resolvedPriceText);
  const city = clean(m.city);
  const venue = clean(m.venueName);
  const provider = clean(m.ticketProvider);

  if (city) bits.push(city);
  if (venue) bits.push(venue);
  if (provider) bits.push(provider);
  else if (partner) bits.push(partner);
  if (price && item.status !== "booked") bits.push(price);

  return bits.length ? bits.join(" • ") : undefined;
}

function dedupeEvents(events: TripTimelineEvent[]): TripTimelineEvent[] {
  const seen = new Set<string>();
  const out: TripTimelineEvent[] = [];

  for (const event of events) {
    const key = [
      event.tripId,
      event.kind,
      event.title.toLowerCase(),
      event.dateIso,
      event.timeLabel || "",
      event.savedItemId || "",
      event.fixtureId || "",
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }

  return out;
}

export function buildTripTimeline(args: {
  trip: Trip | null | undefined;
  items: SavedItem[];
}): TripTimelineEvent[] {
  const trip = args.trip;
  const items = Array.isArray(args.items) ? args.items : [];

  if (!trip?.id) return [];

  const tripId = String(trip.id).trim();
  const events: TripTimelineEvent[] = [];

  const kickoffIso = clean((trip as any)?.kickoffIso);
  const kickoffDateIso = toDateIso(kickoffIso) || (isIsoDateOnly(trip.startDate) ? trip.startDate : null);

  if (kickoffDateIso) {
    events.push({
      id: `trip-match-${tripId}`,
      tripId,
      kind: "match",
      title: titleFromTripMatch(trip),
      subtitle: subtitleFromTripMatch(trip),
      dateIso: kickoffDateIso,
      timeLabel: toTimeLabel(kickoffIso) || (Boolean((trip as any)?.kickoffTbc) ? "TBC" : undefined),
      sortTs: toSortTs(kickoffDateIso, kickoffIso, 15),
      source: "trip",
      fixtureId: clean((trip as any)?.fixtureIdPrimary) || undefined,
    });
  }

  for (const item of items) {
    const itemTripId = clean(item.tripId);
    if (!itemTripId || itemTripId !== tripId) continue;
    if (item.status === "archived") continue;

    const dateIso = firstDateIso(itemDateCandidates(item, trip));
    if (!dateIso) continue;

    const timeLike = itemTimeCandidate(item, trip);
    const timeLabel =
      toTimeLabel(timeLike) ||
      (item.type === "tickets" && Boolean((trip as any)?.kickoffTbc) ? "TBC" : undefined);

    events.push({
      id: `item-${item.id}`,
      tripId,
      kind: detectItemKind(item),
      title: clean(item.title) || "Untitled",
      subtitle: subtitleFromItem(item),
      dateIso,
      timeLabel,
      sortTs: toSortTs(dateIso, timeLike),
      status: item.status,
      source: "saved_item",
      savedItemId: item.id,
      fixtureId: clean((item.metadata as any)?.fixtureId) || undefined,
    });
  }

  return dedupeEvents(events).sort((a, b) => {
    if (a.sortTs !== b.sortTs) return a.sortTs - b.sortTs;
    return a.title.localeCompare(b.title);
  });
}

export function groupTimelineByDate(events: TripTimelineEvent[]) {
  const map = new Map<string, TripTimelineEvent[]>();

  for (const event of events) {
    const arr = map.get(event.dateIso) ?? [];
    arr.push(event);
    map.set(event.dateIso, arr);
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateIso, items]) => ({
      dateIso,
      items: [...items].sort((a, b) => a.sortTs - b.sortTs),
    }));
}
