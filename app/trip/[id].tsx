// app/trip/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";

import TripProgressStrip, { type ProgressState } from "@/src/components/TripProgressStrip";
import NextBestActionCard, { type NextAction } from "@/src/components/NextBestActionCard";
import TripHealthScore from "@/src/components/TripHealthScore";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { parseIsoDateOnly, toIsoDate } from "@/src/constants/football";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";

import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
import { getPartner, type PartnerId } from "@/src/core/partners";

import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";
import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateOnly } from "@/src/utils/formatters";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";

import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";

// ✅ Tickets builder (SE365 resolver + affiliate wrapping)
import { buildTicketLink } from "@/src/services/partnerLinks";

// dev-only IATA detection
import { getIataCityCodeForCity, debugCityKey } from "@/src/data/iataCityCodes";

// matchday logistics (areas + stadium metadata)
import { getMatchdayLogistics, buildLogisticsSnippet } from "@/src/data/matchdayLogistics";

import storage from "@/src/services/storage";

/* -------------------------------------------------------------------------- */
/* small helpers                                                              */
/* -------------------------------------------------------------------------- */

declare const __DEV__: boolean;
const DEV = typeof __DEV__ === "boolean" ? __DEV__ : false;

function coerceId(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

function isNumericId(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  return /^[0-9]+$/.test(s);
}

function defer(fn: () => void) {
  setTimeout(fn, 60);
}

function cleanUpper3(v: unknown, fallback: string) {
  const s = String(v ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(s) ? s : fallback;
}

function summaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} match${n === 1 ? "" : "es"}`;
}

function tripStatus(t: Trip): "Upcoming" | "Past" {
  const start = t.startDate ? parseIsoDateOnly(t.startDate) : null;
  const end = t.endDate ? parseIsoDateOnly(t.endDate) : null;
  if (!start || !end) return "Upcoming";

  const today = parseIsoDateOnly(toIsoDate(new Date()));
  if (!today) return "Upcoming";

  if (end.getTime() < today.getTime()) return "Past";
  return "Upcoming";
}

function cleanNoteText(v: string) {
  return String(v ?? "").replace(/\r\n/g, "\n").trim();
}

function noteTitleFromText(text: string) {
  const t = cleanNoteText(text);
  if (!t) return "Note";
  const firstLine = t.split("\n")[0]?.trim() || "";
  return firstLine.length > 42 ? firstLine.slice(0, 42).trim() + "…" : firstLine;
}

function statusLabel(s: SavedItem["status"]) {
  if (s === "pending") return "Pending";
  if (s === "saved") return "Saved";
  if (s === "booked") return "Booked";
  return "Archived";
}

function safePartnerName(item: SavedItem) {
  if (!item.partnerId) return null;
  try {
    return getPartner(item.partnerId).name;
  } catch {
    return null;
  }
}

function safeTypeLabel(type: SavedItemType) {
  try {
    return getSavedItemTypeLabel(type);
  } catch {
    return "Notes";
  }
}

function shortDomain(url?: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function buildMetaLine(item: SavedItem) {
  const bits: string[] = [];
  bits.push(safeTypeLabel(item.type));

  const p = safePartnerName(item);
  if (p) bits.push(p);

  if (item.partnerUrl) {
    const d = shortDomain(item.partnerUrl);
    if (d) bits.push(d);
  }

  return bits.join(" • ");
}

function livePriceLine(item: SavedItem): string | null {
  const hasUrl = !!String(item.partnerUrl ?? "").trim();
  if (!hasUrl) return null;

  if (item.status === "booked") {
    const p = String(item.priceText ?? "").trim();
    return p ? p : null;
  }

  const pName = safePartnerName(item);
  const dom = shortDomain(item.partnerUrl);
  const tail = pName ? pName : dom ? dom : "partner";
  return `Live price on ${tail}`;
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function TeamCrest({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
    </View>
  );
}

function safeFixtureTitle(r: FixtureListRow | null | undefined, fallbackId: string, trip?: Trip | null) {
  const home =
    String((r as any)?.teams?.home?.name ?? "").trim() || String((trip as any)?.homeName ?? "").trim();
  const away =
    String((r as any)?.teams?.away?.name ?? "").trim() || String((trip as any)?.awayName ?? "").trim();
  if (home && away) return `${home} vs ${away}`;
  if (home) return `${home} match`;
  if (away) return `${away} match`;
  return `Match ${fallbackId}`;
}

function parseIsoToDate(iso?: string | null): Date | null {
  const s = String(iso ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function isoDateOnlyFromKickoffIso(kickoffIso?: string | null): string | null {
  const raw = String(kickoffIso ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatKickoffMeta(
  row?: FixtureListRow | null,
  trip?: Trip | null
): { line: string; tbc: boolean; iso: string | null } {
  const isoRaw = (row as any)?.fixture?.date ?? (trip as any)?.kickoffIso;
  const iso = String(isoRaw ?? "").trim() || null;

  const d = parseIsoToDate(iso);

  const short = String((row as any)?.fixture?.status?.short ?? "").trim().toUpperCase();
  const long = String((row as any)?.fixture?.status?.long ?? "").trim();

  const looksTbc = short === "TBD" || short === "TBA" || short === "NS" || short === "PST";
  const snapTbc = Boolean((trip as any)?.kickoffTbc);

  if (!d) {
    const tbc = looksTbc || snapTbc;
    return { line: tbc ? "Kickoff: TBC" : "Kickoff: —", tbc: true, iso };
  }

  const datePart = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const midnight = d.getHours() === 0 && d.getMinutes() === 0;
  const tbc = looksTbc || snapTbc || midnight;

  if (tbc) return { line: `Kickoff: ${datePart} • TBC`, tbc: true, iso };

  const statusHint = long ? ` • ${long}` : "";
  return { line: `Kickoff: ${datePart} • ${timePart}${statusHint}`, tbc: false, iso };
}

function titleCaseCity(s: string) {
  const v = String(s ?? "").trim();
  if (!v) return "Trip";
  const looksSlug = v.includes("-") && v === v.toLowerCase();
  const base = looksSlug ? v.replace(/-/g, " ") : v;
  return base
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Google Maps links */
function buildMapsSearchUrl(query: string) {
  const q = encodeURIComponent(String(query ?? "").trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function buildMapsDirectionsUrl(
  origin: string,
  destination: string,
  mode: "transit" | "walking" | "driving" = "transit"
) {
  const o = encodeURIComponent(String(origin ?? "").trim());
  const d = encodeURIComponent(String(destination ?? "").trim());
  const m = encodeURIComponent(mode);
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=${m}`;
}

function isLateKickoff(kickoffIso?: string | null): boolean {
  const iso = String(kickoffIso ?? "").trim();
  if (!iso) return false;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  const h = d.getHours();
  const m = d.getMinutes();
  return h > 20 || (h === 20 && m >= 30);
}

function Pill({ label, kind }: { label: string; kind: "best" | "budget" }) {
  const cfg =
    kind === "best"
      ? { border: "rgba(0,255,136,0.35)", bg: "rgba(0,255,136,0.08)" }
      : { border: "rgba(255,200,80,0.40)", bg: "rgba(255,200,80,0.10)" };

  return (
    <View style={[styles.pill, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function proCapHint(cap: number, tripCount: number) {
  if (tripCount < cap) return `Free plan: up to ${cap} saved trips.`;
  return `Free plan cap reached (${cap}). Pro removes the cap.`;
}

function safeUri(u: unknown): string | null {
  const s = String(u ?? "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

function clampIso(iso?: string | null): string | null {
  const s = String(iso ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Affiliate URL resolving (partner-first, NO GOOGLE)                          */
/* -------------------------------------------------------------------------- */

type AffiliateContext = {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;
};

function safeGetPartner(pid: PartnerId) {
  try {
    return getPartner(pid);
  } catch {
    return null;
  }
}

/**
 * We try to use partner-provided builders first (so your affiliate tags apply).
 * Duck-typed to avoid depending on a specific interface.
 */
function partnerUrlFromRegistry(pid: PartnerId, ctx: AffiliateContext): string | null {
  const p: any = safeGetPartner(pid);
  if (!p) return null;

  const args = {
    city: ctx.city,
    startDate: ctx.startDate || undefined,
    endDate: ctx.endDate || undefined,
    originIata: ctx.originIata || undefined,
  };

  const fns = [
    "buildUrl",
    "buildSearchUrl",
    "buildLink",
    "getUrl",
    "getSearchUrl",
    "makeUrl",
    "makeLink",
  ];

  for (const name of fns) {
    const fn = p?.[name];
    if (typeof fn === "function") {
      try {
        const out = fn(args);
        const s = String(out ?? "").trim();
        if (s && /^https?:\/\//i.test(s)) return s;
      } catch {
        // ignore
      }
    }
  }

  // Some registries store a base url or template.
  const raw =
    String(p?.url ?? "").trim() ||
    String(p?.baseUrl ?? "").trim() ||
    String(p?.homepage ?? "").trim();

  if (raw && /^https?:\/\//i.test(raw)) return raw;

  return null;
}

/**
 * LAST RESORT fallback: partner-domain search pages (NOT google).
 * This keeps user on the correct partner domain even if registry lacks builders.
 * If your affiliate attribution relies on tags, you MUST implement builders in partners.
 */
function partnerDomainFallback(pid: PartnerId, ctx: AffiliateContext): string | null {
  const city = encodeURIComponent(ctx.city);

  if (pid === "aviasales") {
    // fallback to Aviasales landing/search entry
    return `https://www.aviasales.com/search?destination=${city}`;
  }
  if (pid === "expedia_stays") {
    return `https://www.expedia.com/Hotel-Search?destination=${city}`;
  }
  if (pid === "kiwitaxi") {
    return `https://kiwitaxi.com/en/search?place=${city}`;
  }
  if (pid === "getyourguide") {
    return `https://www.getyourguide.com/s/?q=${city}`;
  }
  return null;
}

function resolveAffiliateUrl(pid: PartnerId, ctx: AffiliateContext): string | null {
  return partnerUrlFromRegistry(pid, ctx) || partnerDomainFallback(pid, ctx) || null;
}

/* -------------------------------------------------------------------------- */
/* screen                                                                      */
/* -------------------------------------------------------------------------- */

const PLAN_STORAGE_KEY = "yna:plan"; // matches Profile
type PlanValue = "not_set" | "free" | "premium";

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const tripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState(tripsStore.getState().loaded);

  const [savedLoaded, setSavedLoaded] = useState(savedItemsStore.getState().loaded);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  const [fixturesById, setFixturesById] = useState<Record<string, FixtureListRow>>({});
  const [fxLoading, setFxLoading] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [devWarnedCityKey, setDevWarnedCityKey] = useState<string | null>(null);

  const [originLoaded, setOriginLoaded] = useState<boolean>(preferencesStore.getState().loaded);
  const [originIata, setOriginIata] = useState<string>(preferencesStore.getPreferredOriginIata());

  const [plan, setPlan] = useState<PlanValue>("not_set");

  /* ---------------- load plan ---------------- */

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const p = await storage.getString(PLAN_STORAGE_KEY);
        if (!mounted) return;
        if (p === "free" || p === "premium" || p === "not_set") setPlan(p);
        else if (p === "Free Plan") setPlan("free");
        else if (p === "Premium Plan") setPlan("premium");
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const isPro = plan === "premium";

  /* ---------------- load trip ---------------- */

  useEffect(() => {
    const sync = () => {
      const s = tripsStore.getState();
      setTripsLoaded(s.loaded);
      setTrip(s.trips.find((x) => x.id === tripId) ?? null);
    };

    const unsub = tripsStore.subscribe(sync);
    sync();

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().finally(sync);
    }

    return () => unsub();
  }, [tripId]);

  /* ---------------- load saved items ---------------- */

  useEffect(() => {
    const sync = () => {
      const s = savedItemsStore.getState();
      setSavedLoaded(s.loaded);
      setSavedItems(s.items.filter((x) => x.tripId === tripId));
    };

    const unsub = savedItemsStore.subscribe(sync);
    sync();

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().finally(sync);
    }

    return () => unsub();
  }, [tripId]);

  /* ---------------- load preferences ---------------- */

  useEffect(() => {
    let mounted = true;

    const sync = () => {
      const s = preferencesStore.getState();
      if (!mounted) return;
      setOriginLoaded(!!s.loaded);
      setOriginIata(cleanUpper3(s.preferredOriginIata, "LON"));
    };

    const unsub = preferencesStore.subscribe(sync);
    sync();

    if (!preferencesStore.getState().loaded) {
      preferencesStore.load().finally(sync);
    }

    return () => {
      mounted = false;
      try {
        unsub();
      } catch {}
    };
  }, []);

  /* ---------------- derived ids ---------------- */

  const matchIds = useMemo(() => {
    const raw = Array.isArray(trip?.matchIds) ? trip!.matchIds : [];
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }, [trip?.matchIds]);

  const numericMatchIds = useMemo(() => matchIds.filter(isNumericId), [matchIds]);

  const primaryMatchId = useMemo(() => {
    const preferred = String((trip as any)?.fixtureIdPrimary ?? "").trim();
    if (preferred && numericMatchIds.includes(preferred)) return preferred;
    return numericMatchIds[0] ?? null;
  }, [trip, numericMatchIds]);

  /* ---------------- fixtures enrichment ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const ids = numericMatchIds;

      if (ids.length === 0) {
        setFixturesById({});
        setFxLoading(false);
        return;
      }

      setFxLoading(true);

      try {
        const map: Record<string, FixtureListRow> = {};
        for (const id of ids) {
          try {
            const r = await getFixtureById(Number(String(id)));
            if (r) map[String(id)] = r;
          } catch {
            // best-effort
          }
        }
        if (!cancelled) setFixturesById(map);
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [numericMatchIds]);

  /* ---------------- derived (content) ---------------- */

  const status = useMemo(() => (trip ? tripStatus(trip) : "Upcoming"), [trip]);

  const primaryFixture = useMemo(() => {
    if (!primaryMatchId) return null;
    return fixturesById[String(primaryMatchId)] ?? null;
  }, [primaryMatchId, fixturesById]);

  const cityNameRaw = useMemo(() => {
    const snapCity = String((trip as any)?.displayCity ?? "").trim();
    if (snapCity) return snapCity;

    const snapVenueCity = String((trip as any)?.city ?? "").trim();
    if (snapVenueCity) return snapVenueCity;

    if (trip?.cityId) return trip.cityId;

    return String((primaryFixture as any)?.fixture?.venue?.city ?? "").trim() || "Trip";
  }, [trip, primaryFixture]);

  const cityName = useMemo(() => titleCaseCity(cityNameRaw), [cityNameRaw]);

  const primaryLeagueId = useMemo(() => {
    const fromFixture = (primaryFixture as any)?.league?.id;
    if (typeof fromFixture === "number") return fromFixture;
    const fromTrip = (trip as any)?.leagueId;
    return typeof fromTrip === "number" ? fromTrip : undefined;
  }, [primaryFixture, trip]);

  /* ---------------- affiliate urls (partner-first) ---------------- */

  const affiliateCtx = useMemo<AffiliateContext | null>(() => {
    if (!trip) return null;
    const city = String(cityName ?? "").trim();
    if (!city || city === "Trip") return null;

    return {
      city,
      startDate: trip.startDate || null,
      endDate: trip.endDate || null,
      originIata: cleanUpper3(originIata, "LON"),
    };
  }, [trip, cityName, originIata]);

  const affiliateUrls = useMemo(() => {
    if (!affiliateCtx) return null;

    const flightsUrl = resolveAffiliateUrl("aviasales", affiliateCtx);
    const hotelsUrl = resolveAffiliateUrl("expedia_stays", affiliateCtx);
    const transfersUrl = resolveAffiliateUrl("kiwitaxi", affiliateCtx);
    const experiencesUrl = resolveAffiliateUrl("getyourguide", affiliateCtx);

    const mapsUrl = buildMapsSearchUrl(`${affiliateCtx.city} travel`);

    // If any are missing, we still return the object; UI will guard per-button.
    return { flightsUrl, hotelsUrl, transfersUrl, experiencesUrl, mapsUrl };
  }, [affiliateCtx]);

  const pending = useMemo(() => savedItems.filter((x) => x.status === "pending"), [savedItems]);
  const saved = useMemo(
    () => savedItems.filter((x) => x.status === "saved" && x.type !== "note"),
    [savedItems]
  );
  const booked = useMemo(() => savedItems.filter((x) => x.status === "booked"), [savedItems]);
  const notes = useMemo(
    () => savedItems.filter((x) => x.type === "note" && x.status !== "archived"),
    [savedItems]
  );

  /* ---------------- primary match fields ---------------- */

  const primaryHomeName = useMemo(() => {
    const fromFixture = String((primaryFixture as any)?.teams?.home?.name ?? "").trim();
    if (fromFixture) return fromFixture;
    return String((trip as any)?.homeName ?? "").trim();
  }, [primaryFixture, trip]);

  const primaryLeagueName = useMemo(() => {
    const fromFixture = String((primaryFixture as any)?.league?.name ?? "").trim();
    if (fromFixture) return fromFixture;
    return String((trip as any)?.leagueName ?? "").trim();
  }, [primaryFixture, trip]);

  const primaryKickoffIso = useMemo(() => {
    const iso = String((primaryFixture as any)?.fixture?.date ?? (trip as any)?.kickoffIso ?? "").trim();
    return iso || null;
  }, [primaryFixture, trip]);

  const kickoffMeta = useMemo(() => formatKickoffMeta(primaryFixture, trip), [primaryFixture, trip]);

  /* ---------------- primary logistics ---------------- */

  const primaryLogistics = useMemo(() => {
    if (!primaryHomeName) return null;
    return getMatchdayLogistics({ homeTeamName: primaryHomeName, leagueName: primaryLeagueName });
  }, [primaryHomeName, primaryLeagueName]);

  const primaryLogisticsSnippet = useMemo(() => {
    return primaryLogistics ? buildLogisticsSnippet(primaryLogistics) : "";
  }, [primaryLogistics]);

  const stadiumName = useMemo(() => String((primaryLogistics as any)?.stadium ?? "").trim(), [primaryLogistics]);
  const stadiumCity = useMemo(
    () => String((primaryLogistics as any)?.city ?? cityName ?? "").trim(),
    [primaryLogistics, cityName]
  );

  const stadiumMapsUrl = useMemo(() => {
    const q = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
    return buildMapsSearchUrl(q);
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo(() => {
    const arr = Array.isArray((primaryLogistics as any)?.stay?.bestAreas)
      ? (primaryLogistics as any)!.stay!.bestAreas
      : [];
    return arr
      .map((x: any) => ({
        area: String(x?.area ?? "").trim(),
        notes: String(x?.notes ?? "").trim(),
      }))
      .filter((x: any) => x.area);
  }, [primaryLogistics]);

  const stayBudgetAreas = useMemo(() => {
    const arr = Array.isArray((primaryLogistics as any)?.stay?.budgetAreas)
      ? (primaryLogistics as any)!.stay!.budgetAreas
      : [];
    return arr
      .map((x: any) => ({
        area: String(x?.area ?? "").trim(),
        notes: String(x?.notes ?? "").trim(),
      }))
      .filter((x: any) => x.area);
  }, [primaryLogistics]);

  const transportStops = useMemo(() => {
    const stops = Array.isArray((primaryLogistics as any)?.transport?.primaryStops)
      ? (primaryLogistics as any)!.transport!.primaryStops
      : [];
    return stops
      .slice(0, 3)
      .map((s: any) => `${String(s?.name ?? "").trim()}${s?.notes ? ` — ${String(s.notes).trim()}` : ""}`)
      .filter(Boolean);
  }, [primaryLogistics]);

  const transportTips = useMemo(() => {
    const tips = Array.isArray((primaryLogistics as any)?.transport?.tips)
      ? (primaryLogistics as any)!.transport!.tips
      : [];
    return tips
      .slice(0, 3)
      .map((t: any) => String(t).trim())
      .filter(Boolean);
  }, [primaryLogistics]);

  const lateTransportNote = useMemo(() => {
    const explicit = String((primaryLogistics as any)?.transport?.lateNightNote ?? "").trim();
    if (explicit) return explicit;
    if (isLateKickoff(primaryKickoffIso)) {
      return "Late kickoff: check last trains/metros and pre-book a taxi/Uber fallback after the match.";
    }
    return "";
  }, [primaryLogistics, primaryKickoffIso]);

  /* ---------------- tickets: per-match state ---------------- */

  function getTicketItemForFixture(matchId: string): SavedItem | null {
    const mid = String(matchId ?? "").trim();
    if (!mid) return null;

    const candidates = savedItems.filter((x) => x.type === "tickets" && x.status !== "archived");

    const byFixtureId = candidates.filter((x) => String((x.metadata as any)?.fixtureId ?? "").trim() === mid);
    const pool = byFixtureId.length > 0 ? byFixtureId : candidates;

    return (
      pool.find((x) => x.status === "pending") ??
      pool.find((x) => x.status === "saved") ??
      pool.find((x) => x.status === "booked") ??
      null
    );
  }

  const ticketsByMatchId = useMemo(() => {
    const map: Record<string, SavedItem | null> = {};
    for (const mid of numericMatchIds) {
      map[String(mid)] = getTicketItemForFixture(String(mid));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericMatchIds, savedItems]);

  const primaryTicketItem = useMemo(() => {
    if (!primaryMatchId) return null;
    return ticketsByMatchId[String(primaryMatchId)] ?? null;
  }, [primaryMatchId, ticketsByMatchId]);

  /* ---------------- dev-only IATA warning ---------------- */

  useEffect(() => {
    if (!DEV) return;

    const city = String(cityName ?? "").trim();
    if (!city || city === "Trip") return;

    const code = getIataCityCodeForCity(city);
    if (code) return;

    const key = debugCityKey(city);
    if (!key) return;

    if (devWarnedCityKey === key) return;
    setDevWarnedCityKey(key);

    Alert.alert(
      "Missing IATA mapping (dev)",
      `City: ${city}\n\nNormalized key:\n${key}\n\nAdd it to src/data/iataCityCodes.ts`,
      [{ text: "OK" }],
      { cancelable: true }
    );
  }, [cityName, devWarnedCityKey]);

  /* ------------------------------------------------------------------------ */
  /* navigation + link openers                                                 */
  /* ------------------------------------------------------------------------ */

  function onEditTrip() {
    if (!trip) return;

    router.push({
      pathname: "/trip/build",
      params: {
        tripId: trip.id,
        from: trip.startDate,
        to: trip.endDate,
        city: cityName,
        leagueId: String(primaryLeagueId ?? ""),
      },
    } as any);
  }

  function onAddMatch() {
    if (!trip) return;
    router.push({
      pathname: "/trip/build",
      params: {
        tripId: trip.id,
        from: trip.startDate,
        to: trip.endDate,
        city: cityName,
        leagueId: String(primaryLeagueId ?? ""),
      },
    } as any);
  }

  function onViewWallet() {
    router.push("/(tabs)/wallet" as any);
  }

  function onUpgradePress() {
    Alert.alert(
      "Go Pro",
      "Pro removes caps and adds automation (timeline + alerts). Hook up paywall later — this is the placeholder entry point.",
      [{ text: "OK" }]
    );
  }

  async function openUntracked(url?: string | null) {
    if (!url) return;
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open link");
    }
  }

  async function openTrackedPartner(args: {
    partnerId: PartnerId;
    url: string;
    title: string;
    savedItemType?: SavedItemType;
    metadata?: Record<string, any>;
  }) {
    if (!tripId) {
      Alert.alert("Save trip first", "Save this trip before booking so we can store it in Wallet.");
      return;
    }

    if (args.partnerId === "googlemaps") {
      await openUntracked(args.url);
      return;
    }

    try {
      await beginPartnerClick({
        tripId,
        partnerId: args.partnerId,
        url: args.url,
        savedItemType: args.savedItemType,
        title: args.title,
        metadata: args.metadata,
      });
    } catch {
      await openUntracked(args.url);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* saved item actions                                                        */
  /* ------------------------------------------------------------------------ */

  async function openSavedItem(item: SavedItem) {
    if (!item.partnerUrl) {
      const text = String(item.metadata?.text ?? "").trim();
      Alert.alert(item.title || "Notes", text || "No details saved.");
      return;
    }

    if (item.status === "booked" || item.status === "archived") {
      await openUntracked(item.partnerUrl);
      return;
    }

    const pid = String(item.partnerId ?? "").trim();
    if (!pid || pid === "googlemaps") {
      await openUntracked(item.partnerUrl);
      return;
    }

    if (!tripId) {
      await openUntracked(item.partnerUrl);
      return;
    }

    try {
      await beginPartnerClick({
        tripId,
        partnerId: pid as any,
        url: item.partnerUrl,
        savedItemType: item.type,
        title: item.title,
        metadata: item.metadata,
      });
    } catch {
      await openUntracked(item.partnerUrl);
    }
  }

  async function archiveItem(item: SavedItem) {
    try {
      await savedItemsStore.transitionStatus(item.id, "archived");
    } catch {
      Alert.alert("Couldn’t archive", "That item can’t be archived right now.");
    }
  }

  async function moveToPending(item: SavedItem) {
    try {
      await savedItemsStore.transitionStatus(item.id, "pending");
    } catch {
      Alert.alert("Couldn’t move", "That item can’t be moved right now.");
    }
  }

  async function markBookedSmart(item: SavedItem) {
    try {
      await savedItemsStore.transitionStatus(item.id, "booked");
      defer(() => {
        confirmBookedAndOfferProof(item.id).catch(() => null);
      });
    } catch {
      Alert.alert("Couldn’t mark booked", "That item can’t be marked booked right now.");
    }
  }

  function confirmArchive(item: SavedItem) {
    Alert.alert(
      "Archive this item?",
      "Archived items are hidden from the trip workspace. You can restore them later (Phase 2).",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ]
    );
  }

  function confirmMarkBooked(item: SavedItem) {
    Alert.alert("Mark as booked?", "Only do this if you completed the booking and want it in Wallet.", [
      { text: "Cancel", style: "cancel" },
      { text: "Mark booked", style: "default", onPress: () => markBookedSmart(item) },
    ]);
  }

  function confirmMoveToPending(item: SavedItem) {
    Alert.alert(
      "Move to Pending?",
      "Use Pending when you’re not sure if you booked it yet (so we’ll ask on return next time you open a partner).",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Move", style: "default", onPress: () => moveToPending(item) },
      ]
    );
  }

  async function addNote() {
    const text = cleanNoteText(noteText);
    if (!tripId) return;

    if (!text) {
      Alert.alert("Add a note", "Type something first.");
      return;
    }

    setNoteSaving(true);
    try {
      await savedItemsStore.add({
        tripId,
        type: "note",
        status: "saved",
        title: noteTitleFromText(text),
        metadata: { text },
      } as any);

      setNoteText("");
      Keyboard.dismiss();
    } catch {
      Alert.alert("Couldn’t save note");
    } finally {
      setNoteSaving(false);
    }
  }

  function openNoteActions(item: SavedItem) {
    const text = String(item.metadata?.text ?? "").trim();
    Alert.alert(
      item.title || "Notes",
      text || "No details saved.",
      [
        { text: "Close", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ],
      { cancelable: true }
    );
  }

  function StatusBadge({ s }: { s: SavedItem["status"] }) {
    const label = statusLabel(s);
    const style =
      s === "pending"
        ? styles.badgePending
        : s === "saved"
        ? styles.badgeSaved
        : s === "booked"
        ? styles.badgeBooked
        : styles.badgeArchived;

    return (
      <View style={[styles.badge, style]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* matches: set primary + remove                                              */
  /* ------------------------------------------------------------------------ */

  async function setPrimaryMatch(matchId: string) {
    if (!trip) return;
    const mid = String(matchId ?? "").trim();
    if (!mid) return;

    if (mid === String((trip as any)?.fixtureIdPrimary ?? "").trim()) return;

    const r = fixturesById[mid] ?? null;

    const homeName = String((r as any)?.teams?.home?.name ?? "").trim() || undefined;
    const awayName = String((r as any)?.teams?.away?.name ?? "").trim() || undefined;

    const leagueName = String((r as any)?.league?.name ?? "").trim() || undefined;
    const leagueId = typeof (r as any)?.league?.id === "number" ? (r as any).league.id : undefined;

    const kickoffIso = String((r as any)?.fixture?.date ?? "").trim() || undefined;

    const statusShort = String((r as any)?.fixture?.status?.short ?? "").trim().toUpperCase();
    const midnight = kickoffIso
      ? (() => {
          const d = new Date(kickoffIso);
          return Number.isFinite(d.getTime()) ? d.getHours() === 0 && d.getMinutes() === 0 : false;
        })()
      : true;

    const kickoffTbc =
      statusShort === "TBD" || statusShort === "TBA" || statusShort === "NS" || statusShort === "PST" || midnight;

    const venueName = String((r as any)?.fixture?.venue?.name ?? "").trim() || undefined;
    const venueCity = String((r as any)?.fixture?.venue?.city ?? "").trim() || undefined;

    try {
      await tripsStore.setPrimaryMatchForTrip(trip.id, mid);

      await tripsStore.updateTrip(trip.id, {
        fixtureIdPrimary: mid,

        homeName,
        awayName,
        leagueName,
        leagueId,

        kickoffIso,
        kickoffTbc,

        venueName,
        venueCity,

        displayCity: venueCity || (trip as any)?.displayCity,
      } as any);
    } catch {
      Alert.alert("Couldn’t set primary match", "Try again.");
    }
  }

  async function removeMatch(matchId: string) {
    if (!trip) return;
    const mid = String(matchId ?? "").trim();
    if (!mid) return;

    const count = Array.isArray(trip.matchIds) ? trip.matchIds.length : 0;
    if (count <= 1) {
      Alert.alert("Can’t remove", "A trip needs at least one match. Add another match first.");
      return;
    }

    Alert.alert("Remove this match?", "This only removes it from the trip — it won’t delete Wallet items.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await tripsStore.removeMatchFromTrip(trip.id, mid);
          } catch {
            Alert.alert("Couldn’t remove match", "Try again.");
          }
        },
      },
    ]);
  }

  function openMatchActions(matchId: string) {
    if (!trip) return;
    const mid = String(matchId ?? "").trim();
    const isPrimary = mid && mid === String((trip as any)?.fixtureIdPrimary ?? "").trim();

    Alert.alert(
      "Match options",
      isPrimary ? "This is the primary match for the trip." : "Choose what you want to do with this match.",
      [
        { text: "Cancel", style: "cancel" },
        !isPrimary ? { text: "Set as primary", style: "default", onPress: () => setPrimaryMatch(mid) } : null,
        { text: "Remove from trip", style: "destructive", onPress: () => removeMatch(mid) },
      ].filter(Boolean) as any
    );
  }

  /* ------------------------------------------------------------------------ */
  /* tickets: smart open                                                       */
  /* ------------------------------------------------------------------------ */

  async function openTicketsForMatch(matchId: string) {
    const mid = String(matchId ?? "").trim();
    if (!mid) return;

    if (!tripId) {
      Alert.alert("Save trip first", "Save this trip before booking so we can store it in Wallet.");
      return;
    }

    const existing = ticketsByMatchId[mid];
    if (existing && existing.type === "tickets" && existing.status !== "archived" && existing.partnerUrl) {
      await openSavedItem(existing);
      return;
    }

    const r = fixturesById[mid] ?? null;

    const homeName = String((r as any)?.teams?.home?.name ?? (trip as any)?.homeName ?? "").trim();
    const awayName = String((r as any)?.teams?.away?.name ?? (trip as any)?.awayName ?? "").trim();
    const kickoffIso = String((r as any)?.fixture?.date ?? (trip as any)?.kickoffIso ?? "").trim() || null;

    const leagueName = String((r as any)?.league?.name ?? (trip as any)?.leagueName ?? "").trim() || undefined;
    const leagueIdRaw = (r as any)?.league?.id ?? (trip as any)?.leagueId;
    const leagueId = typeof leagueIdRaw === "number" || typeof leagueIdRaw === "string" ? leagueIdRaw : undefined;

    if (!homeName || !awayName || !kickoffIso) {
      Alert.alert("Tickets not available", "Missing team names or kickoff time for this match.");
      return;
    }

    const dateIso = trip?.startDate || isoDateOnlyFromKickoffIso(kickoffIso) || undefined;

    let url: string | null = null;
    try {
      url = await buildTicketLink({
        fixtureId: mid,
        home: homeName,
        away: awayName,
        kickoffIso,
        leagueName,
        leagueId,
        se365EventId:
          typeof (trip as any)?.sportsevents365EventId === "number" ? (trip as any).sportsevents365EventId : undefined,
      });
    } catch {
      url = null;
    }

    if (!url) {
      Alert.alert("Tickets not found", "We couldn’t find a suitable tickets listing for this match.");
      return;
    }

    const title = `Tickets: ${homeName} vs ${awayName}`;

    await openTrackedPartner({
      partnerId: "sportsevents365" as any,
      url,
      title,
      savedItemType: "tickets",
      metadata: {
        fixtureId: mid,
        leagueId,
        leagueName,
        dateIso,
        kickoffIso,
        homeName,
        awayName,
        priceMode: "live",
      },
    });
  }

  /* ------------------------------------------------------------------------ */
  /* powerups: progress + next action + health                                */
  /* ------------------------------------------------------------------------ */

  const tripCount = useMemo(() => (tripsStore.getState().trips?.length ?? 0) as number, [tripsLoaded]);
  const FREE_TRIP_CAP = 5;

  const presentByType = useMemo(() => {
    const present = (type: SavedItemType) => savedItems.some((x) => x.type === type && x.status !== "archived");
    const bookedOnly = (type: SavedItemType) => savedItems.some((x) => x.type === type && x.status === "booked");
    const savedOrPending = (type: SavedItemType) =>
      savedItems.some((x) => x.type === type && (x.status === "saved" || x.status === "pending"));

    const stateFor = (type: SavedItemType): ProgressState => {
      if (bookedOnly(type)) return "booked";
      if (savedOrPending(type)) return "saved";
      return "empty";
    };

    return {
      hasTickets: present("tickets"),
      hasFlight: present("flight"),
      hasHotel: present("hotel"),
      hasTransfer: present("transfer"),
      hasThings: present("things"),

      stateTickets: stateFor("tickets"),
      stateFlight: stateFor("flight"),
      stateHotel: stateFor("hotel"),
      stateTransfer: stateFor("transfer"),
      stateThings: stateFor("things"),
    };
  }, [savedItems]);

  const readiness = useMemo(() => {
    const score =
      (presentByType.hasTickets ? 30 : 0) +
      (presentByType.hasFlight ? 25 : 0) +
      (presentByType.hasHotel ? 25 : 0) +
      (presentByType.hasTransfer ? 10 : 0) +
      (presentByType.hasThings ? 10 : 0);

    const missing: string[] = [];
    if (!presentByType.hasTickets) missing.push("tickets");
    if (!presentByType.hasFlight) missing.push("flights");
    if (!presentByType.hasHotel) missing.push("hotel");
    if (!presentByType.hasTransfer) missing.push("transfers");
    if (!presentByType.hasThings) missing.push("things to do");

    return { score, missing };
  }, [presentByType]);

  const progressItems = useMemo(() => {
    const openOrExplainTickets = () => {
      if (!primaryMatchId) {
        Alert.alert("Add a match first", "Add a match to unlock tickets + match planning.");
        return;
      }
      openTicketsForMatch(primaryMatchId);
    };

    const openHotels = () => {
      const url = affiliateUrls?.hotelsUrl;
      if (!url) return Alert.alert("Not ready", "We need a city + dates saved to build booking links.");
      return openTrackedPartner({
        partnerId: "expedia_stays",
        url,
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: { city: cityName, startDate: trip?.startDate, endDate: trip?.endDate, priceMode: "live" },
      });
    };

    const openFlights = () => {
      const url = affiliateUrls?.flightsUrl;
      if (!url) return Alert.alert("Not ready", "We need a city + dates saved to build booking links.");
      return openTrackedPartner({
        partnerId: "aviasales",
        url,
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: { city: cityName, originIata: cleanUpper3(originIata, "LON"), priceMode: "live" },
      });
    };

    const openTransfers = () => {
      const url = affiliateUrls?.transfersUrl;
      if (!url) return Alert.alert("Not ready", "We need a city + dates saved to build booking links.");
      return openTrackedPartner({
        partnerId: "kiwitaxi",
        url,
        savedItemType: "transfer",
        title: `Transfers in ${cityName}`,
        metadata: { city: cityName, startDate: trip?.startDate, endDate: trip?.endDate, priceMode: "live" },
      });
    };

    const openThings = () => {
      const url = affiliateUrls?.experiencesUrl;
      if (!url) return Alert.alert("Not ready", "We need a city saved to build booking links.");
      return openTrackedPartner({
        partnerId: "getyourguide",
        url,
        savedItemType: "things",
        title: `Experiences in ${cityName}`,
        metadata: { city: cityName, priceMode: "live" },
      });
    };

    return [
      { key: "tickets" as const, label: "Tickets", state: presentByType.stateTickets, onPress: openOrExplainTickets },
      { key: "flight" as const, label: "Flights", state: presentByType.stateFlight, onPress: openFlights },
      { key: "hotel" as const, label: "Hotel", state: presentByType.stateHotel, onPress: openHotels },
      { key: "transfer" as const, label: "Transfer", state: presentByType.stateTransfer, onPress: openTransfers },
      { key: "things" as const, label: "Things", state: presentByType.stateThings, onPress: openThings },
    ];
  }, [
    primaryMatchId,
    affiliateUrls,
    cityName,
    originIata,
    trip?.startDate,
    trip?.endDate,
    presentByType.stateTickets,
    presentByType.stateFlight,
    presentByType.stateHotel,
    presentByType.stateTransfer,
    presentByType.stateThings,
  ]);

  const nextAction = useMemo<NextAction | null>(() => {
    const hasMatch = Boolean(primaryMatchId);

    const openTickets = () => {
      if (!hasMatch || !primaryMatchId) {
        Alert.alert("Add a match first", "Add a match to unlock tickets + match planning.");
        return;
      }
      openTicketsForMatch(primaryMatchId);
    };

    const openFlights = () => {
      const url = affiliateUrls?.flightsUrl;
      if (!url) return Alert.alert("Not ready", "We need a city + dates saved to build booking links.");
      return openTrackedPartner({
        partnerId: "aviasales",
        url,
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: { city: cityName, originIata: cleanUpper3(originIata, "LON"), priceMode: "live" },
      });
    };

    const openHotels = () => {
      const url = affiliateUrls?.hotelsUrl;
      if (!url) return Alert.alert("Not ready", "We need a city + dates saved to build booking links.");
      return openTrackedPartner({
        partnerId: "expedia_stays",
        url,
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: { city: cityName, startDate: trip?.startDate, endDate: trip?.endDate, priceMode: "live" },
      });
    };

    if (!presentByType.hasTickets) {
      return {
        title: "Start with match tickets",
        body: "Tickets are the anchor. Secure seats first, then build travel around it.",
        cta: "Find tickets",
        onPress: openTickets,
        badge: "High impact",
      };
    }

    if (kickoffMeta.tbc) {
      return {
        title: "Kickoff not confirmed — book flexible travel",
        body: "When kickoff is TBC, choose flights/hotels with free changes or good cancellation terms.",
        cta: presentByType.hasFlight ? "View hotels (live)" : "View flights (live)",
        onPress: presentByType.hasFlight ? openHotels : openFlights,
        secondaryCta: "Open tickets",
        onSecondaryPress: openTickets,
        badge: "TBC",
        proLocked: true,
      };
    }

    if (!presentByType.hasFlight) {
      return {
        title: "Add flights for this trip",
        body: "We’ll always show live prices on the partner (no made-up estimates).",
        cta: "View flights (live)",
        onPress: openFlights,
      };
    }

    if (!presentByType.hasHotel) {
      return {
        title: "Pick a hotel in a smart area",
        body: "We’ll open live availability on Expedia. Use stay guidance to avoid bad logistics.",
        cta: "View hotels (live)",
        onPress: openHotels,
        secondaryCta: "Stay guidance",
        onSecondaryPress: () => Alert.alert("Tip", "Scroll down to ‘Stay guidance’ for areas + transport stops."),
      };
    }

    return {
      title: "You’re set — add extras if you want",
      body: "Core planning is complete. If you’re staying longer, add activities or notes.",
      cta: "View hotels (live)",
      onPress: openHotels,
      badge: "Ready",
    };
  }, [
    primaryMatchId,
    affiliateUrls,
    cityName,
    originIata,
    trip?.startDate,
    trip?.endDate,
    presentByType.hasTickets,
    presentByType.hasFlight,
    presentByType.hasHotel,
    kickoffMeta.tbc,
  ]);

  const smartBookButtons = useMemo(() => {
    if (!affiliateUrls || !trip) return [];

    const btns: Array<{ title: string; sub: string; onPress: () => void; kind?: "primary" | "neutral" }> = [];

    const add = (title: string, sub: string, onPress: () => void, kind?: "primary" | "neutral") =>
      btns.push({ title, sub, onPress, kind });

    const openHotels = () => {
      if (!affiliateUrls.hotelsUrl) return Alert.alert("Not ready", "Hotels link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "expedia_stays",
        url: affiliateUrls.hotelsUrl,
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate, priceMode: "live" },
      });
    };

    const openFlights = () => {
      if (!affiliateUrls.flightsUrl) return Alert.alert("Not ready", "Flights link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "aviasales",
        url: affiliateUrls.flightsUrl,
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: { city: cityName, originIata: cleanUpper3(originIata, "LON"), priceMode: "live" },
      });
    };

    const openTransfers = () => {
      if (!affiliateUrls.transfersUrl) return Alert.alert("Not ready", "Transfers link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "kiwitaxi",
        url: affiliateUrls.transfersUrl,
        savedItemType: "transfer",
        title: `Transfers in ${cityName}`,
        metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate, priceMode: "live" },
      });
    };

    const openThings = () => {
      if (!affiliateUrls.experiencesUrl) return Alert.alert("Not ready", "Activities link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "getyourguide",
        url: affiliateUrls.experiencesUrl,
        savedItemType: "things",
        title: `Experiences in ${cityName}`,
        metadata: { city: cityName, priceMode: "live" },
      });
    };

    if (!presentByType.hasTickets && primaryMatchId) {
      add(
        "Tickets",
        primaryTicketItem ? statusLabel(primaryTicketItem.status) : "Live listings",
        () => openTicketsForMatch(primaryMatchId),
        "primary"
      );
    }
    if (!presentByType.hasFlight) add("Flights", "Aviasales (live)", openFlights, "primary");
    if (!presentByType.hasHotel) add("Hotels", "Expedia (live)", openHotels, "primary");
    if (!presentByType.hasTransfer) add("Transfers", "Kiwitaxi (live)", openTransfers);
    if (!presentByType.hasThings) add("Activities", "GetYourGuide (live)", openThings);

    if (btns.length === 0) {
      add("Hotels", "Expedia (live)", openHotels, "primary");
      add("Activities", "GetYourGuide (live)", openThings);
    }

    return btns.slice(0, 4);
  }, [
    affiliateUrls,
    trip,
    cityName,
    originIata,
    primaryMatchId,
    presentByType.hasTickets,
    presentByType.hasFlight,
    presentByType.hasHotel,
    presentByType.hasTransfer,
    presentByType.hasThings,
    primaryTicketItem,
  ]);

  /* ------------------------------------------------------------------------ */
  /* render                                                                    */
  /* ------------------------------------------------------------------------ */

  const loading = Boolean(tripId && (!tripsLoaded || !savedLoaded));
  const showHeroBanners = pending.length > 0 || saved.length > 0 || booked.length > 0;

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Trip",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.xxl + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          {!tripId && (
            <GlassCard style={styles.card}>
              <EmptyState title="Missing trip id" message="No trip id provided." />
            </GlassCard>
          )}

          {loading && (
            <GlassCard style={styles.card}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trip…</Text>
              </View>
            </GlassCard>
          )}

          {!loading && tripId && tripsLoaded && savedLoaded && !trip ? (
            <GlassCard style={styles.card}>
              <EmptyState title="Trip not found" message="This trip doesn’t exist on this device." />
            </GlassCard>
          ) : null}

          {trip ? (
            <>
              {/* HERO */}
              <GlassCard style={styles.hero}>
                <Text style={styles.kicker}>TRIP WORKSPACE</Text>
                <Text style={styles.cityTitle}>{cityName}</Text>
                <Text style={styles.heroMeta}>{summaryLine(trip)}</Text>
                <Text style={styles.heroMetaSmall}>{kickoffMeta.line}</Text>

                <View style={styles.heroTopRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>

                  <Pressable onPress={onViewWallet} style={styles.walletBtn}>
                    <Text style={styles.walletBtnText}>Wallet ›</Text>
                  </Pressable>
                </View>

                {showHeroBanners ? (
                  <View style={styles.bannersRow}>
                    {pending.length > 0 ? (
                      <View style={styles.pendingBanner}>
                        <Text style={styles.pendingText}>
                          {pending.length} pending booking{pending.length === 1 ? "" : "s"}
                        </Text>
                      </View>
                    ) : null}

                    {saved.length > 0 ? (
                      <View style={styles.savedBanner}>
                        <Text style={styles.savedText}>
                          {saved.length} saved item{saved.length === 1 ? "" : "s"}
                        </Text>
                      </View>
                    ) : null}

                    {booked.length > 0 ? (
                      <View style={styles.bookedBanner}>
                        <Text style={styles.bookedText}>
                          {booked.length} booked item{booked.length === 1 ? "" : "s"} in Wallet
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.heroActions}>
                  <Pressable onPress={onEditTrip} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Edit trip</Text>
                  </Pressable>

                  {!isPro ? (
                    <Pressable onPress={onUpgradePress} style={[styles.btn, styles.btnSecondary]}>
                      <Text style={styles.btnSecondaryText}>Go Pro</Text>
                    </Pressable>
                  ) : null}
                </View>

                {!originLoaded ? <Text style={styles.mutedInline}>Loading departure preference…</Text> : null}

                {/* POWERUPS */}
                <View style={{ marginTop: 14, gap: 10 }}>
                  <TripProgressStrip items={progressItems} />
                  <NextBestActionCard action={nextAction} isPro={isPro} onUpgradePress={onUpgradePress} />
                  <TripHealthScore
                    score={readiness.score}
                    missing={readiness.missing}
                    isPro={isPro}
                    capHint={!isPro ? proCapHint(FREE_TRIP_CAP, tripCount) : undefined}
                  />
                </View>
              </GlassCard>

              {/* SMART BOOK */}
              {affiliateUrls ? (
                <GlassCard style={styles.card}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Smart booking</Text>
                    <Text style={styles.sectionSub}>Live prices on partners</Text>
                  </View>

                  <View style={styles.smartGrid}>
                    {smartBookButtons.map((b, idx) => (
                      <Pressable
                        key={`${b.title}-${idx}`}
                        style={[styles.smartBtn, b.kind === "primary" ? styles.smartBtnPrimary : undefined]}
                        onPress={b.onPress}
                      >
                        <Text style={styles.smartBtnText}>{b.title}</Text>
                        <Text style={styles.smartBtnSub}>{b.sub}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable onPress={() => openUntracked(affiliateUrls.mapsUrl)}>
                    <Text style={styles.mapsInline}>Open maps search</Text>
                  </Pressable>
                </GlassCard>
              ) : null}

              {/* MATCHES */}
              <GlassCard style={styles.card}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Matches</Text>
                  <Pressable onPress={onAddMatch} style={styles.inlineLinkBtn}>
                    <Text style={styles.inlineLinkText}>Add match ›</Text>
                  </Pressable>
                </View>

                {numericMatchIds.length === 0 ? (
                  <EmptyState title="No matches added" message="Add a match to unlock match-specific planning." />
                ) : (
                  <View style={{ gap: 10 }}>
                    {numericMatchIds.map((mid) => {
                      const r = fixturesById[String(mid)];
                      const title = safeFixtureTitle(r, mid, trip);

                      const leagueName = String((r as any)?.league?.name ?? (trip as any)?.leagueName ?? "").trim();
                      const round = String((r as any)?.league?.round ?? "").trim();

                      const venue = String((r as any)?.fixture?.venue?.name ?? (trip as any)?.venueName ?? "").trim();
                      const city = String((r as any)?.fixture?.venue?.city ?? (trip as any)?.displayCity ?? "").trim();

                      const kickoff = formatKickoffMeta(r, trip);

                      const meta1 = [leagueName || null, round || null].filter(Boolean).join(" • ");
                      const meta2 = [venue || null, city || null].filter(Boolean).join(" • ");

                      const homeName = String((r as any)?.teams?.home?.name ?? (trip as any)?.homeName ?? "Home");
                      const awayName = String((r as any)?.teams?.away?.name ?? (trip as any)?.awayName ?? "Away");

                      const homeLogo = safeUri((r as any)?.teams?.home?.logo);
                      const awayLogo = safeUri((r as any)?.teams?.away?.logo);

                      const logistics = getMatchdayLogistics({ homeTeamName: homeName, leagueName });
                      const logisticsLine = logistics ? buildLogisticsSnippet(logistics) : "";

                      const certainty = getFixtureCertainty(r as any, {
                        previousKickoffIso: (trip as any)?.kickoffIso ?? null,
                      });

                      const ticketItem = ticketsByMatchId[String(mid)];
                      const isPrimary = String(primaryMatchId ?? "") === String(mid);

                      return (
                        <View key={mid} style={styles.matchRowWrap}>
                          <Pressable
                            onPress={() => openTicketsForMatch(mid)}
                            onLongPress={() => openMatchActions(mid)}
                            style={styles.matchRow}
                          >
                            <TeamCrest name={homeName} logo={homeLogo} />

                            <View style={{ flex: 1 }}>
                              <View style={styles.matchTitleRow}>
                                <Text style={styles.matchTitle} numberOfLines={1}>
                                  {title}
                                </Text>

                                {isPrimary ? (
                                  <View style={[styles.badge, styles.badgePrimary]}>
                                    <Text style={styles.badgeText}>Primary</Text>
                                  </View>
                                ) : null}

                                {ticketItem ? <StatusBadge s={ticketItem.status} /> : null}
                              </View>

                              <Text style={styles.matchMeta} numberOfLines={1}>
                                {kickoff.line}
                              </Text>

                              <View style={{ marginTop: 6 }}>
                                <FixtureCertaintyBadge state={certainty} />
                              </View>

                              {meta1 ? (
                                <Text style={styles.matchMeta} numberOfLines={1}>
                                  {meta1}
                                </Text>
                              ) : null}

                              {meta2 ? (
                                <Text style={styles.matchMeta} numberOfLines={1}>
                                  {meta2}
                                </Text>
                              ) : null}

                              {logisticsLine ? (
                                <Text style={styles.logisticsMeta} numberOfLines={1}>
                                  {logisticsLine}
                                </Text>
                              ) : null}

                              <Text style={styles.matchHint} numberOfLines={1}>
                                {ticketItem
                                  ? `Tap to open tickets (${statusLabel(ticketItem.status)}) • Hold for options`
                                  : "Tap to open tickets (saved to Pending) • Hold for options"}
                              </Text>
                            </View>

                            <TeamCrest name={awayName} logo={awayLogo} />
                            <Text style={styles.chev}>›</Text>
                          </Pressable>

                          <View style={styles.matchActionsRow}>
                            <Pressable
                              onPress={() => openTicketsForMatch(mid)}
                              style={[styles.smallBtn, styles.smallBtnWide]}
                            >
                              <Text style={styles.smallBtnText}>Tickets</Text>
                            </Pressable>

                            {!isPrimary ? (
                              <Pressable
                                onPress={() => setPrimaryMatch(mid)}
                                style={[styles.smallBtn, styles.smallBtnWide, styles.smallBtnPrimary]}
                              >
                                <Text style={styles.smallBtnText}>Set primary</Text>
                              </Pressable>
                            ) : (
                              <View style={[styles.smallBtn, styles.smallBtnWide, styles.smallBtnDisabled]}>
                                <Text style={styles.smallBtnText}>Primary</Text>
                              </View>
                            )}

                            <Pressable
                              onPress={() => removeMatch(mid)}
                              style={[styles.smallBtn, styles.smallBtnWide, styles.smallBtnDanger]}
                            >
                              <Text style={styles.smallBtnText}>Remove</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {fxLoading ? <Text style={styles.mutedInline}>Loading match details…</Text> : null}
              </GlassCard>

              {/* STAY */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Stay guidance (stadium + best areas)</Text>

                {!primaryLogistics ? (
                  <EmptyState
                    title="Stay tips not available"
                    message="Add a match (or load match details) to unlock stadium-area stay suggestions."
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    <View style={styles.proxBox}>
                      <Text style={styles.proxTitle} numberOfLines={2}>
                        {stadiumName || "Stadium"}
                        {stadiumCity ? <Text style={styles.proxCity}> • {stadiumCity}</Text> : null}
                      </Text>

                      <Text style={styles.proxBody}>
                        {primaryLogisticsSnippet ||
                          "Use the areas below as a shortlist. Tap Transit/Walk for real routes in Google Maps."}
                      </Text>

                      <Pressable onPress={() => openUntracked(stadiumMapsUrl)} style={styles.proxBtn}>
                        <Text style={styles.proxBtnText}>Open stadium in maps</Text>
                      </Pressable>

                      <Text style={styles.proxMuted}>
                        Note: distance/time depends on your exact hotel. Use Transit/Walk for real routes.
                      </Text>
                    </View>

                    {stayBestAreas.length > 0 ? (
                      <View style={{ gap: 6 }}>
                        <Text style={styles.stayLabel}>Best areas</Text>

                        {stayBestAreas.slice(0, 3).map((x, idx) => {
                          const stadiumQ = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
                          const areaQ = [x.area, stadiumCity].filter(Boolean).join(" ").trim();
                          const origin = areaQ || x.area;
                          const dest = stadiumQ || stadiumName || "stadium";

                          return (
                            <View key={`best-${idx}`} style={styles.areaRow}>
                              <View style={{ flex: 1 }}>
                                <View style={styles.areaTop}>
                                  <Text style={styles.areaName} numberOfLines={1}>
                                    {x.area}
                                  </Text>
                                  <Pill label="Best area" kind="best" />
                                </View>
                                {x.notes ? <Text style={styles.areaNotes}>{x.notes}</Text> : null}
                              </View>

                              <View style={styles.areaBtns}>
                                <Pressable onPress={() => openUntracked(buildMapsSearchUrl(origin))} style={styles.smallBtn}>
                                  <Text style={styles.smallBtnText}>Maps</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => openUntracked(buildMapsDirectionsUrl(origin, dest, "transit"))}
                                  style={styles.smallBtn}
                                >
                                  <Text style={styles.smallBtnText}>Transit</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => openUntracked(buildMapsDirectionsUrl(origin, dest, "walking"))}
                                  style={styles.smallBtn}
                                >
                                  <Text style={styles.smallBtnText}>Walk</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    {stayBudgetAreas.length > 0 ? (
                      <View style={{ gap: 6, marginTop: 6 }}>
                        <Text style={styles.stayLabel}>Budget-friendly</Text>

                        {stayBudgetAreas.slice(0, 2).map((x, idx) => {
                          const stadiumQ = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
                          const areaQ = [x.area, stadiumCity].filter(Boolean).join(" ").trim();
                          const origin = areaQ || x.area;
                          const dest = stadiumQ || stadiumName || "stadium";

                          return (
                            <View key={`budget-${idx}`} style={styles.areaRow}>
                              <View style={{ flex: 1 }}>
                                <View style={styles.areaTop}>
                                  <Text style={styles.areaName} numberOfLines={1}>
                                    {x.area}
                                  </Text>
                                  <Pill label="Budget" kind="budget" />
                                </View>
                                {x.notes ? <Text style={styles.areaNotes}>{x.notes}</Text> : null}
                              </View>

                              <View style={styles.areaBtns}>
                                <Pressable onPress={() => openUntracked(buildMapsSearchUrl(origin))} style={styles.smallBtn}>
                                  <Text style={styles.smallBtnText}>Maps</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => openUntracked(buildMapsDirectionsUrl(origin, dest, "transit"))}
                                  style={styles.smallBtn}
                                >
                                  <Text style={styles.smallBtnText}>Transit</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => openUntracked(buildMapsDirectionsUrl(origin, dest, "walking"))}
                                  style={styles.smallBtn}
                                >
                                  <Text style={styles.smallBtnText}>Walk</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    {transportStops.length > 0 ? (
                      <View style={{ gap: 6, marginTop: 6 }}>
                        <Text style={styles.stayLabel}>Best transport stops</Text>
                        {transportStops.map((line, idx) => (
                          <Pressable
                            key={`stop-${idx}`}
                            onPress={() => openUntracked(buildMapsSearchUrl([line, stadiumCity].filter(Boolean).join(" ")))}
                            style={styles.stopRow}
                          >
                            <Text style={styles.stayBullet} numberOfLines={2}>
                              • {line}
                            </Text>
                            <Text style={styles.chev}>›</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}

                    {transportTips.length > 0 ? (
                      <View style={{ gap: 6, marginTop: 6 }}>
                        <Text style={styles.stayLabel}>Matchday tips</Text>
                        {transportTips.map((line, idx) => (
                          <Text key={`tip-${idx}`} style={styles.stayBullet}>
                            • {line}
                          </Text>
                        ))}
                      </View>
                    ) : null}

                    {lateTransportNote ? (
                      <View style={styles.lateBox}>
                        <Text style={styles.lateTitle}>Late transport note</Text>
                        <Text style={styles.lateText}>{lateTransportNote}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </GlassCard>

              {/* PENDING */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Pending</Text>
                {pending.length === 0 ? (
                  <EmptyState
                    title="No pending bookings"
                    message="When you click a partner link, it appears here until you confirm it’s booked."
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    {pending.map((it) => {
                      const lp = livePriceLine(it);
                      return (
                        <View key={it.id} style={styles.itemRow}>
                          <Pressable style={{ flex: 1 }} onPress={() => openSavedItem(it)}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {it.title}
                              </Text>
                              <StatusBadge s={it.status} />
                            </View>

                            <Text style={styles.itemMeta} numberOfLines={1}>
                              {buildMetaLine(it)}
                            </Text>

                            {lp ? (
                              <Text style={styles.livePriceLine} numberOfLines={1}>
                                {lp}
                              </Text>
                            ) : null}
                          </Pressable>

                          <View style={styles.itemActions}>
                            <Pressable onPress={() => confirmMarkBooked(it)} style={styles.smallBtn}>
                              <Text style={styles.smallBtnText}>Booked</Text>
                            </Pressable>
                            <Pressable onPress={() => confirmArchive(it)} style={[styles.smallBtn, styles.smallBtnDanger]}>
                              <Text style={styles.smallBtnText}>Archive</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </GlassCard>

              {/* BOOKED */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Booked (in Wallet)</Text>
                {booked.length === 0 ? (
                  <EmptyState title="No booked items yet" message="When you confirm a booking, it will show here and in Wallet." />
                ) : (
                  <View style={{ gap: 10 }}>
                    {booked.map((it) => {
                      const lp = livePriceLine(it);
                      return (
                        <View key={it.id} style={styles.itemRow}>
                          <Pressable style={{ flex: 1 }} onPress={() => openSavedItem(it)}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {it.title}
                              </Text>
                              <StatusBadge s={it.status} />
                            </View>

                            <Text style={styles.itemMeta} numberOfLines={1}>
                              {buildMetaLine(it)}
                            </Text>

                            {lp ? (
                              <Text style={styles.paidLine} numberOfLines={1}>
                                {lp}
                              </Text>
                            ) : null}
                          </Pressable>

                          <View style={styles.itemActions}>
                            <Pressable onPress={onViewWallet} style={styles.smallBtn}>
                              <Text style={styles.smallBtnText}>Wallet</Text>
                            </Pressable>

                            <Pressable onPress={() => confirmArchive(it)} style={[styles.smallBtn, styles.smallBtnDanger]}>
                              <Text style={styles.smallBtnText}>Archive</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </GlassCard>

              {/* SAVED */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Saved</Text>
                {saved.length === 0 ? (
                  <EmptyState
                    title="No saved items"
                    message="If you answer “No” after returning from a partner, we keep the link here as Saved."
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    {saved.map((it) => {
                      const lp = livePriceLine(it);
                      return (
                        <View key={it.id} style={styles.itemRow}>
                          <Pressable style={{ flex: 1 }} onPress={() => openSavedItem(it)}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {it.title}
                              </Text>
                              <StatusBadge s={it.status} />
                            </View>

                            <Text style={styles.itemMeta} numberOfLines={1}>
                              {buildMetaLine(it)}
                            </Text>

                            {lp ? (
                              <Text style={styles.livePriceLine} numberOfLines={1}>
                                {lp}
                              </Text>
                            ) : null}
                          </Pressable>

                          <View style={styles.itemActions}>
                            <Pressable onPress={() => confirmMarkBooked(it)} style={styles.smallBtn}>
                              <Text style={styles.smallBtnText}>Booked</Text>
                            </Pressable>

                            <Pressable onPress={() => confirmMoveToPending(it)} style={styles.smallBtn}>
                              <Text style={styles.smallBtnText}>Pending</Text>
                            </Pressable>

                            <Pressable onPress={() => confirmArchive(it)} style={[styles.smallBtn, styles.smallBtnDanger]}>
                              <Text style={styles.smallBtnText}>Archive</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </GlassCard>

              {/* NOTES */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Notes</Text>

                <View style={styles.noteBox}>
                  <TextInput
                    value={noteText}
                    onChangeText={setNoteText}
                    placeholder="Add a note (tickets, hotel shortlist, reminders, anything)…"
                    placeholderTextColor={theme.colors.textSecondary}
                    style={styles.noteInput}
                    multiline
                  />

                  <Pressable
                    onPress={addNote}
                    disabled={noteSaving}
                    style={[styles.noteSaveBtn, noteSaving && { opacity: 0.7 }]}
                  >
                    <Text style={styles.noteSaveText}>{noteSaving ? "Saving…" : "Save note"}</Text>
                  </Pressable>
                </View>

                {notes.length === 0 ? (
                  <View style={{ marginTop: 10 }}>
                    <EmptyState title="No notes yet" message="Notes you save for this trip appear here." />
                  </View>
                ) : (
                  <View style={{ gap: 10, marginTop: 10 }}>
                    {notes.map((it) => (
                      <Pressable key={it.id} onPress={() => openNoteActions(it)} style={styles.noteRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {it.title}
                          </Text>
                          <Text style={styles.itemMeta} numberOfLines={1}>
                            Notes
                          </Text>
                        </View>
                        <Text style={styles.chev}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </GlassCard>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* styles                                                                      */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  card: { padding: theme.spacing.lg },

  center: { alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: "800" },
  mutedInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "800",
  },

  hero: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
  },

  cityTitle: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
  },

  heroMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },

  heroMetaSmall: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
  },

  heroTopRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  statusPill: {
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.4)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  statusText: { color: theme.colors.text, fontWeight: "900" },

  walletBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  walletBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  bannersRow: { marginTop: 12, gap: 10 },

  pendingBanner: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,200,80,0.15)",
  },

  pendingText: {
    color: "rgba(255,200,80,1)",
    fontWeight: "900",
  },

  savedBanner: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,255,136,0.10)",
  },

  savedText: {
    color: "rgba(0,255,136,1)",
    fontWeight: "900",
  },

  bookedBanner: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(120,170,255,0.14)",
  },

  bookedText: {
    color: "rgba(160,195,255,1)",
    fontWeight: "900",
  },

  heroActions: { marginTop: 12, flexDirection: "row", gap: 10 },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.6)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  btnSecondaryText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },
  sectionSub: { color: theme.colors.textTertiary, fontWeight: "900", fontSize: 12 },

  inlineLinkBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  inlineLinkText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  smartGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  smartBtn: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  smartBtnPrimary: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  smartBtnText: { color: theme.colors.text, fontWeight: "900" },
  smartBtnSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },

  matchRowWrap: { gap: 8 },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  matchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  matchTitle: { color: theme.colors.text, fontWeight: "900", flexShrink: 1 },

  matchMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  logisticsMeta: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 16,
  },

  matchHint: { marginTop: 6, color: theme.colors.textTertiary, fontWeight: "900", fontSize: 11 },

  matchActionsRow: { flexDirection: "row", gap: 8 },

  crestWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  crestImg: { width: 26, height: 26 },

  crestFallback: { color: theme.colors.textSecondary, fontWeight: "900" },

  proxBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  proxTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14, lineHeight: 18 },
  proxCity: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  proxBody: { marginTop: 8, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },
  proxMuted: { marginTop: 8, color: theme.colors.textTertiary, fontWeight: "900", fontSize: 11, lineHeight: 14 },

  proxBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  proxBtnText: { color: theme.colors.text, fontWeight: "900" },

  stayLabel: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
  stayBullet: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  areaRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },
  areaTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  areaName: { color: theme.colors.text, fontWeight: "900", flexShrink: 1 },
  areaNotes: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },
  areaBtns: { gap: 8, alignItems: "flex-end" },

  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: theme.colors.text, fontWeight: "900", fontSize: 11 },

  stopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },

  lateBox: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.28)",
    backgroundColor: "rgba(255,200,80,0.08)",
    padding: 12,
  },
  lateTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
  lateText: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  itemRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },

  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  itemTitle: { color: theme.colors.text, fontWeight: "900", flexShrink: 1, paddingRight: 6 },

  itemMeta: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  livePriceLine: { marginTop: 6, color: theme.colors.textTertiary, fontSize: 12, fontWeight: "900" },
  paidLine: { marginTop: 6, color: "rgba(242,244,246,0.92)", fontSize: 12, fontWeight: "900" },

  itemActions: { gap: 8, alignItems: "flex-end" },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  smallBtnWide: { flex: 1, alignItems: "center" },
  smallBtnPrimary: { borderColor: "rgba(0,255,136,0.35)" },
  smallBtnDisabled: { opacity: 0.65 },
  smallBtnDanger: { borderColor: "rgba(255,80,80,0.35)" },
  smallBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: theme.colors.text, fontWeight: "900", fontSize: 11 },

  badgePrimary: { borderColor: "rgba(0,255,136,0.45)", backgroundColor: "rgba(0,255,136,0.10)" },
  badgePending: { borderColor: "rgba(255,200,80,0.40)", backgroundColor: "rgba(255,200,80,0.10)" },
  badgeSaved: { borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,255,136,0.08)" },
  badgeBooked: { borderColor: "rgba(120,170,255,0.45)", backgroundColor: "rgba(120,170,255,0.10)" },
  badgeArchived: { borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(255,255,255,0.06)" },

  noteBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  noteInput: {
    minHeight: 80,
    color: theme.colors.text,
    textAlignVertical: "top",
    fontWeight: "800",
    ...(Platform.OS === "ios" ? { paddingTop: 10 } : null),
  },

  noteSaveBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  noteSaveText: { color: theme.colors.text, fontWeight: "900" },

  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  mapsInline: { marginTop: 10, color: theme.colors.textSecondary, textAlign: "center", fontWeight: "900" },

  chev: { color: theme.colors.textSecondary, fontSize: 24, marginTop: -2 },
});
