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
import { parseIsoDateOnly, toIsoDate, DEFAULT_SEASON } from "@/src/constants/football";

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

import { resolveAffiliateUrl } from "@/src/services/partnerLinks";
import {
  resolveTicketForFixture,
  type TicketResolutionOption,
  type TicketResolutionResult,
} from "@/src/services/ticketResolver";

import { getIataCityCodeForCity, debugCityKey } from "@/src/data/iataCityCodes";
import { getMatchdayLogistics, buildLogisticsSnippet } from "@/src/data/matchdayLogistics";

import storage from "@/src/services/storage";

import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip, TravelDifficulty } from "@/src/features/tripFinder/types";

/* -------------------------------------------------------------------------- */
/* small helpers                                                              */
/* -------------------------------------------------------------------------- */

declare const __DEV__: boolean;
const DEV = typeof __DEV__ === "boolean" ? __DEV__ : false;

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

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
  return firstLine.length > 42 ? `${firstLine.slice(0, 42).trim()}…` : firstLine;
}

function statusLabel(s: SavedItem["status"]) {
  if (s === "pending") return "Pending";
  if (s === "saved") return "Saved";
  if (s === "booked") return "Booked";
  return "Archived";
}

function providerLabel(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();
  if (raw === "footballticketsnet") return "FootballTicketNet";
  if (raw === "sportsevents365") return "SportsEvents365";
  if (raw === "gigsberg") return "Gigsberg";
  if (raw === "aviasales") return "Aviasales";
  if (raw === "expedia" || raw === "expedia_stays") return "Expedia";
  if (raw === "kiwitaxi") return "KiwiTaxi";
  if (raw === "omio") return "Omio";
  if (raw === "getyourguide") return "GetYourGuide";
  return provider || "Provider";
}

function providerShort(provider?: string | null): string {
  const raw = clean(provider).toLowerCase();
  if (raw === "footballticketsnet") return "FTN";
  if (raw === "sportsevents365") return "365";
  if (raw === "gigsberg") return "G";
  if (raw === "aviasales") return "AV";
  if (raw === "expedia" || raw === "expedia_stays") return "EX";
  if (raw === "kiwitaxi") return "KT";
  if (raw === "omio") return "OM";
  if (raw === "getyourguide") return "GYG";
  return "P";
}

function providerBadgeStyle(provider?: string | null) {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") {
    return {
      borderColor: "rgba(120,170,255,0.35)",
      backgroundColor: "rgba(120,170,255,0.12)",
      textColor: "rgba(205,225,255,1)",
    };
  }

  if (raw === "sportsevents365") {
    return {
      borderColor: "rgba(87,162,56,0.35)",
      backgroundColor: "rgba(87,162,56,0.12)",
      textColor: "rgba(208,240,192,1)",
    };
  }

  if (raw === "gigsberg") {
    return {
      borderColor: "rgba(255,200,80,0.35)",
      backgroundColor: "rgba(255,200,80,0.12)",
      textColor: "rgba(255,226,160,1)",
    };
  }

  if (raw === "aviasales") {
    return {
      borderColor: "rgba(120,170,255,0.30)",
      backgroundColor: "rgba(120,170,255,0.10)",
      textColor: "rgba(210,225,255,1)",
    };
  }

  if (raw === "expedia" || raw === "expedia_stays") {
    return {
      borderColor: "rgba(87,162,56,0.30)",
      backgroundColor: "rgba(87,162,56,0.10)",
      textColor: "rgba(210,240,205,1)",
    };
  }

  if (raw === "kiwitaxi") {
    return {
      borderColor: "rgba(255,160,120,0.30)",
      backgroundColor: "rgba(255,160,120,0.10)",
      textColor: "rgba(255,220,205,1)",
    };
  }

  if (raw === "omio") {
    return {
      borderColor: "rgba(200,120,255,0.30)",
      backgroundColor: "rgba(200,120,255,0.10)",
      textColor: "rgba(235,210,255,1)",
    };
  }

  if (raw === "getyourguide") {
    return {
      borderColor: "rgba(255,90,120,0.30)",
      backgroundColor: "rgba(255,90,120,0.10)",
      textColor: "rgba(255,215,225,1)",
    };
  }

  return {
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    textColor: theme.colors.text,
  };
}

function ticketConfidenceLabel(score?: number | null): string {
  const value = typeof score === "number" ? score : 0;
  if (value >= 90) return "High confidence";
  if (value >= 75) return "Strong match";
  if (value >= 60) return "Good match";
  return "Fallback";
}

function safePartnerName(item: SavedItem) {
  if (!item.partnerId) return null;
  try {
    return getPartner(item.partnerId as any).name;
  } catch {
    const provider = String(item.metadata?.ticketProvider ?? "").trim();
    if (provider === "footballticketsnet") return "FootballTicketNet";
    if (provider === "sportsevents365") return "SportsEvents365";
    if (provider === "gigsberg") return "Gigsberg";
    if (provider === "omio") return "Omio";
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
  const hasUrl = !!clean(item.partnerUrl);
  if (!hasUrl) return null;

  const resolvedPrice = clean(item.metadata?.resolvedPriceText);

  if (item.status === "booked") {
    const p = clean(item.priceText) || resolvedPrice;
    return p ? p : null;
  }

  if (resolvedPrice) {
    const pName = safePartnerName(item);
    return pName ? `From ${resolvedPrice} on ${pName}` : `From ${resolvedPrice}`;
  }

  const pName = safePartnerName(item);
  const dom = shortDomain(item.partnerUrl);
  const tail = pName ? pName : dom ? dom : "partner";
  return `Live price on ${tail}`;
}

function initials(name: string) {
  const cleanName = clean(name);
  if (!cleanName) return "—";
  const parts = cleanName.split(/\s+/g).filter(Boolean);
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

function ProviderBadge({
  provider,
  size = "sm",
  showLabel = false,
}: {
  provider?: string | null;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const badge = providerBadgeStyle(provider);
  const short = providerShort(provider);
  const label = providerLabel(provider);

  const circleSize = size === "md" ? 30 : 24;
  const fontSize = size === "md" ? 12 : 11;

  return (
    <View style={[styles.providerBadgeWrap, showLabel && styles.providerBadgeWrapLabeled]}>
      <View
        style={[
          styles.providerBadgeCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderColor: badge.borderColor,
            backgroundColor: badge.backgroundColor,
          },
        ]}
      >
        <Text style={[styles.providerBadgeCircleText, { color: badge.textColor, fontSize }]}>
          {short}
        </Text>
      </View>
      {showLabel ? <Text style={styles.providerBadgeLabel}>{label}</Text> : null}
    </View>
  );
}

function safeFixtureTitle(r: FixtureListRow | null | undefined, fallbackId: string, trip?: Trip | null) {
  const home = clean((r as any)?.teams?.home?.name) || clean((trip as any)?.homeName);
  const away = clean((r as any)?.teams?.away?.name) || clean((trip as any)?.awayName);
  if (home && away) return `${home} vs ${away}`;
  if (home) return `${home} match`;
  if (away) return `${away} match`;
  return `Match ${fallbackId}`;
}

function parseIsoToDate(iso?: string | null): Date | null {
  const s = clean(iso);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function isoDateOnlyFromKickoffIso(kickoffIso?: string | null): string | null {
  const raw = clean(kickoffIso);
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
  const iso = clean(isoRaw) || null;

  const d = parseIsoToDate(iso);

  const short = clean((row as any)?.fixture?.status?.short).toUpperCase();
  const long = clean((row as any)?.fixture?.status?.long);

  const looksTbc = short === "TBD" || short === "TBA" || short === "NS" || short === "PST";
  const snapTbc = Boolean((trip as any)?.kickoffTbc);

  if (!d) {
    const tbc = looksTbc || snapTbc;
    return { line: tbc ? "Kickoff: TBC" : "Kickoff: —", tbc: true, iso };
  }

  const datePart = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const midnight = d.getHours() === 0 && d.getMinutes() === 0;
  const tbc = looksTbc || snapTbc || midnight;

  if (tbc) return { line: `Kickoff: ${datePart} • TBC`, tbc: true, iso };

  const statusHint = long ? ` • ${long}` : "";
  return { line: `Kickoff: ${datePart} • ${timePart}${statusHint}`, tbc: false, iso };
}

function titleCaseCity(s: string) {
  const v = clean(s);
  if (!v) return "Trip";
  const looksSlug = v.includes("-") && v === v.toLowerCase();
  const base = looksSlug ? v.replace(/-/g, " ") : v;
  return base
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function buildMapsSearchUrl(query: string) {
  const q = encodeURIComponent(clean(query));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function buildMapsDirectionsUrl(
  origin: string,
  destination: string,
  mode: "transit" | "walking" | "driving" = "transit"
) {
  const o = encodeURIComponent(clean(origin));
  const d = encodeURIComponent(clean(destination));
  const m = encodeURIComponent(mode);
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=${m}`;
}

function isLateKickoff(kickoffIso?: string | null): boolean {
  const iso = clean(kickoffIso);
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
  const s = clean(u);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

function difficultyLabel(value?: TravelDifficulty | null): string | null {
  if (!value) return null;
  if (value === "easy") return "Easy travel";
  if (value === "medium") return "Moderate travel";
  if (value === "hard") return "Harder travel";
  return null;
}

function confidencePctLabel(value?: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return `${pct}% fit`;
}

function rankReasonsText(trip: RankedTrip | null): string | null {
  if (!trip || !Array.isArray(trip.reasons) || trip.reasons.length === 0) return null;
  return trip.reasons.slice(0, 2).join(" • ");
}

function mapTicketProviderToPartnerId(provider?: string | null): PartnerId {
  const raw = clean(provider).toLowerCase();
  if (raw === "footballticketsnet") return "footballticketsnet" as PartnerId;
  if (raw === "gigsberg") return "gigsberg" as PartnerId;
  return "sportsevents365" as PartnerId;
}

function ticketResolverFailureMessage(resolved: TicketResolutionResult | null): string {
  if (!resolved) {
    return "Ticket resolver didn’t respond. Check backend URL/server.";
  }

  const checkedProviders = Array.isArray(resolved.checkedProviders)
    ? resolved.checkedProviders.filter(Boolean).join(", ")
    : "";

  const error = clean((resolved as any)?.error);

  if (error === "network_error") {
    return "Ticket backend couldn’t be reached. Check backend URL/server.";
  }

  if (error === "invalid_backend_json") {
    return "Ticket backend returned invalid JSON.";
  }

  if (error && error.startsWith("http_")) {
    return checkedProviders
      ? `No suitable ticket listing found. Checked: ${checkedProviders}.`
      : "No suitable ticket listing found.";
  }

  return checkedProviders
    ? `No suitable ticket listing found. Checked: ${checkedProviders}.`
    : "No suitable ticket listing found.";
}

function smartButtonSubtitle(item: SavedItem | null, fallback: string) {
  if (!item) return fallback;
  return livePriceLine(item) || statusLabel(item.status);
}

function normalizeTicketOptions(resolved: TicketResolutionResult | null): TicketResolutionOption[] {
  if (!resolved) return [];

  const options = Array.isArray(resolved.options) ? resolved.options : [];
  const map = new Map<string, TicketResolutionOption>();

  for (const option of options) {
    const provider = clean(option?.provider);
    const url = clean(option?.url);
    const title = clean(option?.title);
    const score = typeof option?.score === "number" ? option.score : null;

    if (!provider || !url || !title || score == null) continue;

    const normalized: TicketResolutionOption = {
      provider,
      exact: Boolean(option.exact),
      score,
      url,
      title,
      priceText: clean(option.priceText) || null,
      reason:
        option.reason === "exact_event" || option.reason === "partial_match"
          ? option.reason
          : "search_fallback",
    };

    const key = `${provider.toLowerCase()}|${url}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, normalized);
      continue;
    }

    if (normalized.exact && !existing.exact) {
      map.set(key, normalized);
      continue;
    }

    if (normalized.score > existing.score) {
      map.set(key, normalized);
    }
  }

  const values = Array.from(map.values()).sort((a, b) => {
    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;
    if (b.score !== a.score) return b.score - a.score;

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return providerLabel(a.provider).localeCompare(providerLabel(b.provider));
  });

  if (values.length > 0) return values;

  if (resolved.ok && clean(resolved.provider) && clean(resolved.url) && clean(resolved.title)) {
    return [
      {
        provider: clean(resolved.provider),
        exact: Boolean(resolved.exact),
        score: typeof resolved.score === "number" ? resolved.score : 0,
        url: clean(resolved.url),
        title: clean(resolved.title),
        priceText: clean(resolved.priceText) || null,
        reason:
          resolved.reason === "exact_event"
            ? "exact_event"
            : resolved.reason === "partial_match"
            ? "partial_match"
            : "search_fallback",
      },
    ];
  }

  return [];
}

function ticketProviderFromItem(item: SavedItem | null): string | null {
  if (!item) return null;
  return clean(item.metadata?.ticketProvider) || clean(item.partnerId) || null;
}

function itemResolvedScore(item: SavedItem | null): number | null {
  if (!item) return null;
  const raw = item.metadata?.score;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/* -------------------------------------------------------------------------- */
/* screen                                                                     */
/* -------------------------------------------------------------------------- */

const PLAN_STORAGE_KEY = "yna:plan";
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

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const p = await storage.getString(PLAN_STORAGE_KEY);
        if (!mounted) return;
        if (p === "free" || p === "premium" || p === "not_set") setPlan(p);
        else if (p === "Free Plan") setPlan("free");
        else if (p === "Premium Plan") setPlan("premium");
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const isPro = plan === "premium";

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

  const matchIds = useMemo(() => {
    const raw = Array.isArray(trip?.matchIds) ? trip.matchIds : [];
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }, [trip?.matchIds]);

  const numericMatchIds = useMemo(() => matchIds.filter(isNumericId), [matchIds]);

  const primaryMatchId = useMemo(() => {
    const preferred = clean((trip as any)?.fixtureIdPrimary);
    if (preferred && numericMatchIds.includes(preferred)) return preferred;
    return numericMatchIds[0] ?? null;
  }, [trip, numericMatchIds]);

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
            const r = await getFixtureById(Number(id));
            if (r) map[String(id)] = r;
          } catch {}
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

  const status = useMemo(() => (trip ? tripStatus(trip) : "Upcoming"), [trip]);

  const primaryFixture = useMemo(() => {
    if (!primaryMatchId) return null;
    return fixturesById[String(primaryMatchId)] ?? null;
  }, [primaryMatchId, fixturesById]);

  const cityNameRaw = useMemo(() => {
    const snapCity = clean((trip as any)?.displayCity);
    if (snapCity) return snapCity;

    const snapVenueCity = clean((trip as any)?.city);
    if (snapVenueCity) return snapVenueCity;

    if (trip?.cityId) return trip.cityId;

    return clean((primaryFixture as any)?.fixture?.venue?.city) || "Trip";
  }, [trip, primaryFixture]);

  const cityName = useMemo(() => titleCaseCity(cityNameRaw), [cityNameRaw]);

  const primaryLeagueId = useMemo(() => {
    const fromFixture = (primaryFixture as any)?.league?.id;
    if (typeof fromFixture === "number") return fromFixture;
    const fromTrip = (trip as any)?.leagueId;
    return typeof fromTrip === "number" ? fromTrip : undefined;
  }, [primaryFixture, trip]);

  const affiliateCtx = useMemo(() => {
    if (!trip) return null;
    const city = clean(cityName);
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
    const hotelsUrl = resolveAffiliateUrl("expedia", affiliateCtx);
    const omioUrl = resolveAffiliateUrl("omio", affiliateCtx);
    const transfersUrl = resolveAffiliateUrl("kiwitaxi", affiliateCtx);
    const experiencesUrl = resolveAffiliateUrl("getyourguide", affiliateCtx);
    const mapsUrl = buildMapsSearchUrl(`${affiliateCtx.city} travel`);

    return { flightsUrl, hotelsUrl, omioUrl, transfersUrl, experiencesUrl, mapsUrl };
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

  const primaryHomeName = useMemo(() => {
    const fromFixture = clean((primaryFixture as any)?.teams?.home?.name);
    if (fromFixture) return fromFixture;
    return clean((trip as any)?.homeName);
  }, [primaryFixture, trip]);

  const primaryLeagueName = useMemo(() => {
    const fromFixture = clean((primaryFixture as any)?.league?.name);
    if (fromFixture) return fromFixture;
    return clean((trip as any)?.leagueName);
  }, [primaryFixture, trip]);

  const primaryKickoffIso = useMemo(() => {
    const iso = clean((primaryFixture as any)?.fixture?.date ?? (trip as any)?.kickoffIso);
    return iso || null;
  }, [primaryFixture, trip]);

  const kickoffMeta = useMemo(() => formatKickoffMeta(primaryFixture, trip), [primaryFixture, trip]);

  const primaryLogistics = useMemo(() => {
    if (!primaryHomeName) return null;
    return getMatchdayLogistics({ homeTeamName: primaryHomeName, leagueName: primaryLeagueName });
  }, [primaryHomeName, primaryLeagueName]);

  const primaryLogisticsSnippet = useMemo(() => {
    return primaryLogistics ? buildLogisticsSnippet(primaryLogistics) : "";
  }, [primaryLogistics]);

  const stadiumName = useMemo(() => clean((primaryLogistics as any)?.stadium), [primaryLogistics]);
  const stadiumCity = useMemo(
    () => clean((primaryLogistics as any)?.city ?? cityName),
    [primaryLogistics, cityName]
  );

  const stadiumMapsUrl = useMemo(() => {
    const q = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
    return buildMapsSearchUrl(q);
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo(() => {
    const arr = Array.isArray((primaryLogistics as any)?.stay?.bestAreas)
      ? (primaryLogistics as any).stay.bestAreas
      : [];
    return arr
      .map((x: any) => ({
        area: clean(x?.area),
        notes: clean(x?.notes),
      }))
      .filter((x: any) => x.area);
  }, [primaryLogistics]);

  const stayBudgetAreas = useMemo(() => {
    const arr = Array.isArray((primaryLogistics as any)?.stay?.budgetAreas)
      ? (primaryLogistics as any).stay.budgetAreas
      : [];
    return arr
      .map((x: any) => ({
        area: clean(x?.area),
        notes: clean(x?.notes),
      }))
      .filter((x: any) => x.area);
  }, [primaryLogistics]);

  const transportStops = useMemo(() => {
    const stops = Array.isArray((primaryLogistics as any)?.transport?.primaryStops)
      ? (primaryLogistics as any).transport.primaryStops
      : [];
    return stops
      .slice(0, 3)
      .map((s: any) => `${clean(s?.name)}${s?.notes ? ` — ${clean(s.notes)}` : ""}`)
      .filter(Boolean);
  }, [primaryLogistics]);

  const transportTips = useMemo(() => {
    const tips = Array.isArray((primaryLogistics as any)?.transport?.tips)
      ? (primaryLogistics as any).transport.tips
      : [];
    return tips
      .slice(0, 3)
      .map((t: any) => clean(t))
      .filter(Boolean);
  }, [primaryLogistics]);

  const lateTransportNote = useMemo(() => {
    const explicit = clean((primaryLogistics as any)?.transport?.lateNightNote);
    if (explicit) return explicit;
    if (isLateKickoff(primaryKickoffIso)) {
      return "Late kickoff: check last trains/metros and pre-book a taxi/Uber fallback after the match.";
    }
    return "";
  }, [primaryLogistics, primaryKickoffIso]);

  const rankedTrip = useMemo<RankedTrip | null>(() => {
    if (!trip || !primaryFixture) return null;

    try {
      const ranked = rankTrips([
        {
          tripId: String(trip.id),
          fixture: primaryFixture,
          cityName,
          originIata: cleanUpper3(originIata, "LON"),
          startDate: trip.startDate,
          endDate: trip.endDate,
          kickoffIso: primaryKickoffIso ?? undefined,
        } as any,
      ]);

      return Array.isArray(ranked) && ranked.length > 0 ? ranked[0] : null;
    } catch {
      return null;
    }
  }, [trip, primaryFixture, cityName, originIata, primaryKickoffIso]);

  const tripFinderSummary = useMemo(() => {
    if (!rankedTrip) return null;

    return {
      difficulty: difficultyLabel((rankedTrip as any)?.travelDifficulty ?? null),
      confidence: confidencePctLabel((rankedTrip as any)?.confidence ?? null),
      reasons: rankReasonsText(rankedTrip),
      score:
        typeof (rankedTrip as any)?.score === "number" && Number.isFinite((rankedTrip as any)?.score)
          ? Math.round((rankedTrip as any).score)
          : null,
    };
  }, [rankedTrip]);

  function getTicketItemForFixture(matchId: string): SavedItem | null {
    const mid = clean(matchId);
    if (!mid) return null;

    const candidates = savedItems.filter((x) => x.type === "tickets" && x.status !== "archived");
    const byFixtureId = candidates.filter((x) => clean((x.metadata as any)?.fixtureId) === mid);
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
  }, [numericMatchIds, savedItems]);

  const primaryTicketItem = useMemo(() => {
    if (!primaryMatchId) return null;
    return ticketsByMatchId[String(primaryMatchId)] ?? null;
  }, [primaryMatchId, ticketsByMatchId]);

  useEffect(() => {
    if (!DEV) return;

    const city = clean(cityName);
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
        season: String(DEFAULT_SEASON),
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
        season: String(DEFAULT_SEASON),
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

    if (args.partnerId === ("googlemaps" as any)) {
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

  async function openSavedItem(item: SavedItem) {
    if (!item.partnerUrl) {
      const text = clean(item.metadata?.text);
      Alert.alert(item.title || "Notes", text || "No details saved.");
      return;
    }

    if (item.status === "booked" || item.status === "archived") {
      await openUntracked(item.partnerUrl);
      return;
    }

    const pid = clean(item.partnerId);
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
      "Use Pending when you’re not sure if you booked it yet.",
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
    const text = clean(item.metadata?.text);
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

  async function setPrimaryMatch(matchId: string) {
    if (!trip) return;
    const mid = clean(matchId);
    if (!mid) return;

    if (mid === clean((trip as any)?.fixtureIdPrimary)) return;

    const r = fixturesById[mid] ?? null;

    const homeName = clean((r as any)?.teams?.home?.name) || undefined;
    const awayName = clean((r as any)?.teams?.away?.name) || undefined;

    const leagueName = clean((r as any)?.league?.name) || undefined;
    const leagueId = typeof (r as any)?.league?.id === "number" ? (r as any).league.id : undefined;

    const kickoffIso = clean((r as any)?.fixture?.date) || undefined;

    const statusShort = clean((r as any)?.fixture?.status?.short).toUpperCase();
    const midnight = kickoffIso
      ? (() => {
          const d = new Date(kickoffIso);
          return Number.isFinite(d.getTime()) ? d.getHours() === 0 && d.getMinutes() === 0 : false;
        })()
      : true;

    const kickoffTbc =
      statusShort === "TBD" ||
      statusShort === "TBA" ||
      statusShort === "NS" ||
      statusShort === "PST" ||
      midnight;

    const venueName = clean((r as any)?.fixture?.venue?.name) || undefined;
    const venueCity = clean((r as any)?.fixture?.venue?.city) || undefined;

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
    const mid = clean(matchId);
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
    const mid = clean(matchId);
    const isPrimary = mid && mid === clean((trip as any)?.fixtureIdPrimary);

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

  async function openTicketOptionForMatch(args: {
    mid: string;
    homeName: string;
    awayName: string;
    kickoffIso: string;
    leagueName?: string;
    leagueId?: string | number;
    dateIso?: string;
    option: TicketResolutionOption;
    checkedProviders?: string[];
    optionCount?: number;
  }) {
    await openTrackedPartner({
      partnerId: mapTicketProviderToPartnerId(args.option.provider),
      url: args.option.url,
      title: args.option.title || `Tickets: ${args.homeName} vs ${args.awayName}`,
      savedItemType: "tickets",
      metadata: {
        fixtureId: args.mid,
        leagueId: args.leagueId,
        leagueName: args.leagueName,
        dateIso: args.dateIso,
        kickoffIso: args.kickoffIso,
        homeName: args.homeName,
        awayName: args.awayName,
        priceMode: "live",
        ticketProvider: args.option.provider ?? null,
        resolvedPriceText: args.option.priceText ?? null,
        resolutionReason: args.option.reason ?? null,
        exactMatch: Boolean(args.option.exact),
        score: args.option.score,
        checkedProviders: args.checkedProviders,
        optionCount: args.optionCount,
      },
    });
  }

  function showTicketChoiceAlert(args: {
    mid: string;
    homeName: string;
    awayName: string;
    kickoffIso: string;
    leagueName?: string;
    leagueId?: string | number;
    dateIso?: string;
    options: TicketResolutionOption[];
    checkedProviders?: string[];
  }) {
    const top = args.options.slice(0, 3);

    Alert.alert(
      "Choose ticket provider",
      top
        .map(
          (option, index) =>
            `${index + 1}. ${providerLabel(option.provider)}${clean(option.priceText) ? ` • ${clean(option.priceText)}` : ""}`
        )
        .join("\n"),
      [
        { text: "Cancel", style: "cancel" },
        ...top.map((option) => ({
          text: providerLabel(option.provider),
          onPress: () =>
            openTicketOptionForMatch({
              ...args,
              option,
              optionCount: args.options.length,
            }),
        })),
        {
          text: "Compare all",
          onPress: () =>
            router.push({
              pathname: "/match/[id]",
              params: { id: args.mid, tripId: tripId ?? undefined },
            } as any),
        },
      ]
    );
  }

  async function openTicketsForMatch(matchId: string) {
    const mid = clean(matchId);
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

    const homeName = clean((r as any)?.teams?.home?.name ?? (trip as any)?.homeName);
    const awayName = clean((r as any)?.teams?.away?.name ?? (trip as any)?.awayName);
    const kickoffIso = clean((r as any)?.fixture?.date ?? (trip as any)?.kickoffIso) || null;

    const leagueName = clean((r as any)?.league?.name ?? (trip as any)?.leagueName) || undefined;
    const leagueIdRaw = (r as any)?.league?.id ?? (trip as any)?.leagueId;
    const leagueId = typeof leagueIdRaw === "number" || typeof leagueIdRaw === "string" ? leagueIdRaw : undefined;

    if (!homeName || !awayName || !kickoffIso) {
      Alert.alert("Tickets not available", "Missing team names or kickoff time for this match.");
      return;
    }

    const dateIso = trip?.startDate || isoDateOnlyFromKickoffIso(kickoffIso) || undefined;

    try {
      const resolved = await resolveTicketForFixture({
        fixtureId: mid,
        homeName,
        awayName,
        kickoffIso,
        leagueName,
        leagueId,
      });

      const options = normalizeTicketOptions(resolved);

      if (!resolved?.ok || options.length === 0) {
        Alert.alert("Tickets not found", ticketResolverFailureMessage(resolved));
        return;
      }

      if (options.length === 1) {
        await openTicketOptionForMatch({
          mid,
          homeName,
          awayName,
          kickoffIso,
          leagueName,
          leagueId,
          dateIso,
          option: options[0],
          checkedProviders: Array.isArray(resolved.checkedProviders) ? resolved.checkedProviders : undefined,
          optionCount: options.length,
        });
        return;
      }

      showTicketChoiceAlert({
        mid,
        homeName,
        awayName,
        kickoffIso,
        leagueName,
        leagueId,
        dateIso,
        options,
        checkedProviders: Array.isArray(resolved.checkedProviders) ? resolved.checkedProviders : undefined,
      });
    } catch {
      Alert.alert("Tickets unavailable", "Ticket search failed before the partner click was created.");
    }
  }

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
        partnerId: "expedia" as PartnerId,
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
        partnerId: "aviasales" as PartnerId,
        url,
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: { city: cityName, originIata: cleanUpper3(originIata, "LON"), priceMode: "live" },
      });
    };

    const openTransfers = () => {
      const url = affiliateUrls?.omioUrl || affiliateUrls?.transfersUrl;
      const partnerId = affiliateUrls?.omioUrl ? ("omio" as PartnerId) : ("kiwitaxi" as PartnerId);

      if (!url) return Alert.alert("Not ready", "We need a city + dates saved to build booking links.");

      return openTrackedPartner({
        partnerId,
        url,
        savedItemType: "transfer",
        title: affiliateUrls?.omioUrl ? `Trains & buses in ${cityName}` : `Transfers in ${cityName}`,
        metadata: {
          city: cityName,
          startDate: trip?.startDate,
          endDate: trip?.endDate,
          priceMode: "live",
          transportMode: affiliateUrls?.omioUrl ? "rail_bus" : "transfer",
        },
      });
    };

    const openThings = () => {
      const url = affiliateUrls?.experiencesUrl;
      if (!url) return Alert.alert("Not ready", "We need a city saved to build booking links.");
      return openTrackedPartner({
        partnerId: "getyourguide" as PartnerId,
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
      { key: "transfer" as const, label: affiliateUrls?.omioUrl ? "Rail/Bus" : "Transfer", state: presentByType.stateTransfer, onPress: openTransfers },
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
        partnerId: "aviasales" as PartnerId,
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
        partnerId: "expedia" as PartnerId,
        url,
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: { city: cityName, startDate: trip?.startDate, endDate: trip?.endDate, priceMode: "live" },
      });
    };

    if (!presentByType.hasTickets) {
      return {
        title: "Start with match tickets",
        body: "Tickets are the anchor. Compare providers and secure seats first, then build travel around it.",
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
      body: "Core planning is complete. If you’re staying longer, add transport, activities or notes.",
      cta: affiliateUrls?.omioUrl ? "View rail/bus" : "View hotels (live)",
      onPress: affiliateUrls?.omioUrl
        ? () =>
            openTrackedPartner({
              partnerId: "omio" as PartnerId,
              url: affiliateUrls.omioUrl!,
              savedItemType: "transfer",
              title: `Trains & buses in ${cityName}`,
              metadata: {
                city: cityName,
                startDate: trip?.startDate,
                endDate: trip?.endDate,
                priceMode: "live",
                transportMode: "rail_bus",
              },
            })
        : openHotels,
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

    const btns: Array<{
      title: string;
      sub: string;
      onPress: () => void;
      kind?: "primary" | "neutral";
      provider?: string | null;
    }> = [];

    const add = (
      title: string,
      sub: string,
      onPress: () => void,
      kind?: "primary" | "neutral",
      provider?: string | null
    ) => btns.push({ title, sub, onPress, kind, provider });

    const openHotels = () => {
      if (!affiliateUrls.hotelsUrl) return Alert.alert("Not ready", "Hotels link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "expedia" as PartnerId,
        url: affiliateUrls.hotelsUrl,
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate, priceMode: "live" },
      });
    };

    const openFlights = () => {
      if (!affiliateUrls.flightsUrl) return Alert.alert("Not ready", "Flights link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "aviasales" as PartnerId,
        url: affiliateUrls.flightsUrl,
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: { city: cityName, originIata: cleanUpper3(originIata, "LON"), priceMode: "live" },
      });
    };

    const openOmio = () => {
      if (!affiliateUrls.omioUrl) return Alert.alert("Not ready", "Rail/bus link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "omio" as PartnerId,
        url: affiliateUrls.omioUrl,
        savedItemType: "transfer",
        title: `Trains & buses in ${cityName}`,
        metadata: {
          city: cityName,
          startDate: trip.startDate,
          endDate: trip.endDate,
          priceMode: "live",
          transportMode: "rail_bus",
        },
      });
    };

    const openTransfers = () => {
      if (!affiliateUrls.transfersUrl) return Alert.alert("Not ready", "Transfers link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "kiwitaxi" as PartnerId,
        url: affiliateUrls.transfersUrl,
        savedItemType: "transfer",
        title: `Transfers in ${cityName}`,
        metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate, priceMode: "live" },
      });
    };

    const openThings = () => {
      if (!affiliateUrls.experiencesUrl) return Alert.alert("Not ready", "Activities link couldn’t be built.");
      return openTrackedPartner({
        partnerId: "getyourguide" as PartnerId,
        url: affiliateUrls.experiencesUrl,
        savedItemType: "things",
        title: `Experiences in ${cityName}`,
        metadata: { city: cityName, priceMode: "live" },
      });
    };

    if (!presentByType.hasTickets && primaryMatchId) {
      add(
        "Tickets",
        smartButtonSubtitle(primaryTicketItem, "Compare live ticket options"),
        () => openTicketsForMatch(primaryMatchId),
        "primary",
        ticketProviderFromItem(primaryTicketItem)
      );
    }

    if (!presentByType.hasFlight) add("Flights", "Aviasales (live)", openFlights, "primary", "aviasales");
    if (!presentByType.hasHotel) add("Hotels", "Expedia (live)", openHotels, "primary", "expedia");
    if (!presentByType.hasTransfer && affiliateUrls.omioUrl) {
      add("Rail / Bus", "Omio (live)", openOmio, "neutral", "omio");
    } else if (!presentByType.hasTransfer) {
      add("Transfers", "Kiwitaxi (live)", openTransfers, "neutral", "kiwitaxi");
    }
    if (!presentByType.hasThings) add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");

    if (btns.length === 0) {
      add("Hotels", "Expedia (live)", openHotels, "primary", "expedia");
      if (affiliateUrls.omioUrl) {
        add("Rail / Bus", "Omio (live)", openOmio, "neutral", "omio");
      } else {
        add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");
      }
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

                {tripFinderSummary ? (
                  <View style={styles.tripFinderBox}>
                    <Text style={styles.tripFinderTitle}>Trip Finder read</Text>
                    <View style={styles.tripFinderBadges}>
                      {tripFinderSummary.difficulty ? (
                        <View style={styles.tripFinderBadge}>
                          <Text style={styles.tripFinderBadgeText}>{tripFinderSummary.difficulty}</Text>
                        </View>
                      ) : null}
                      {tripFinderSummary.confidence ? (
                        <View style={styles.tripFinderBadge}>
                          <Text style={styles.tripFinderBadgeText}>{tripFinderSummary.confidence}</Text>
                        </View>
                      ) : null}
                      {tripFinderSummary.score != null ? (
                        <View style={styles.tripFinderBadge}>
                          <Text style={styles.tripFinderBadgeText}>Score {tripFinderSummary.score}</Text>
                        </View>
                      ) : null}
                    </View>
                    {tripFinderSummary.reasons ? (
                      <Text style={styles.tripFinderReasons}>{tripFinderSummary.reasons}</Text>
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
                        <View style={styles.smartBtnTop}>
                          <Text style={styles.smartBtnText}>{b.title}</Text>
                          {b.provider ? <ProviderBadge provider={b.provider} size="sm" /> : null}
                        </View>
                        <Text style={styles.smartBtnSub}>{b.sub}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable onPress={() => openUntracked(affiliateUrls.mapsUrl)}>
                    <Text style={styles.mapsInline}>Open maps search</Text>
                  </Pressable>
                </GlassCard>
              ) : null}

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

                      const leagueName = clean((r as any)?.league?.name ?? (trip as any)?.leagueName);
                      const round = clean((r as any)?.league?.round);

                      const venue = clean((r as any)?.fixture?.venue?.name ?? (trip as any)?.venueName);
                      const city = clean((r as any)?.fixture?.venue?.city ?? (trip as any)?.displayCity);

                      const kickoff = formatKickoffMeta(r, trip);

                      const meta1 = [leagueName || null, round || null].filter(Boolean).join(" • ");
                      const meta2 = [venue || null, city || null].filter(Boolean).join(" • ");

                      const homeName = clean((r as any)?.teams?.home?.name ?? (trip as any)?.homeName ?? "Home");
                      const awayName = clean((r as any)?.teams?.away?.name ?? (trip as any)?.awayName ?? "Away");

                      const homeLogo = safeUri((r as any)?.teams?.home?.logo);
                      const awayLogo = safeUri((r as any)?.teams?.away?.logo);

                      const logistics = getMatchdayLogistics({ homeTeamName: homeName, leagueName });
                      const logisticsLine = logistics ? buildLogisticsSnippet(logistics) : "";

                      const certainty = getFixtureCertainty(r as any, {
                        previousKickoffIso: (trip as any)?.kickoffIso ?? null,
                      });

                      const ticketItem = ticketsByMatchId[String(mid)];
                      const isPrimary = String(primaryMatchId ?? "") === String(mid);
                      const ticketScore = itemResolvedScore(ticketItem);
                      const ticketProvider = ticketProviderFromItem(ticketItem);

                      return (
                        <View key={mid} style={styles.matchRowWrap}>
                          <Pressable
                            onPress={() => openTicketsForMatch(mid)}
                            onLongPress={() => openMatchActions(mid)}
                            style={styles.matchRow}
                          >
                            <TeamCrest name={homeName} logo={homeLogo} />

                            <View style={{ flex: 1, minWidth: 0 }}>
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

                              {ticketItem ? (
                                <View style={styles.ticketSignalRow}>
                                  {ticketProvider ? <ProviderBadge provider={ticketProvider} size="sm" /> : null}
                                  <Text style={styles.matchHint} numberOfLines={1}>
                                    {livePriceLine(ticketItem) || `Tap to open tickets (${statusLabel(ticketItem.status)})`}
                                  </Text>
                                </View>
                              ) : (
                                <Text style={styles.matchHint} numberOfLines={1}>
                                  Tap to compare live ticket options • Hold for options
                                </Text>
                              )}

                              {ticketScore != null ? (
                                <Text style={styles.ticketQualityMeta} numberOfLines={1}>
                                  {ticketConfidenceLabel(ticketScore)}
                                </Text>
                              ) : null}
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
                      const provider = ticketProviderFromItem(it);

                      return (
                        <View key={it.id} style={styles.itemRow}>
                          <Pressable style={{ flex: 1 }} onPress={() => openSavedItem(it)}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {it.title}
                              </Text>
                              <StatusBadge s={it.status} />
                            </View>

                            <View style={styles.itemMetaRow}>
                              {provider ? <ProviderBadge provider={provider} size="sm" /> : null}
                              <Text style={styles.itemMeta} numberOfLines={1}>
                                {buildMetaLine(it)}
                              </Text>
                            </View>

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

              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Booked (in Wallet)</Text>
                {booked.length === 0 ? (
                  <EmptyState title="No booked items yet" message="When you confirm a booking, it will show here and in Wallet." />
                ) : (
                  <View style={{ gap: 10 }}>
                    {booked.map((it) => {
                      const lp = livePriceLine(it);
                      const provider = ticketProviderFromItem(it);

                      return (
                        <View key={it.id} style={styles.itemRow}>
                          <Pressable style={{ flex: 1 }} onPress={() => openSavedItem(it)}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {it.title}
                              </Text>
                              <StatusBadge s={it.status} />
                            </View>

                            <View style={styles.itemMetaRow}>
                              {provider ? <ProviderBadge provider={provider} size="sm" /> : null}
                              <Text style={styles.itemMeta} numberOfLines={1}>
                                {buildMetaLine(it)}
                              </Text>
                            </View>

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
                      const provider = ticketProviderFromItem(it);

                      return (
                        <View key={it.id} style={styles.itemRow}>
                          <Pressable style={{ flex: 1 }} onPress={() => openSavedItem(it)}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {it.title}
                              </Text>
                              <StatusBadge s={it.status} />
                            </View>

                            <View style={styles.itemMetaRow}>
                              {provider ? <ProviderBadge provider={provider} size="sm" /> : null}
                              <Text style={styles.itemMeta} numberOfLines={1}>
                                {buildMetaLine(it)}
                              </Text>
                            </View>

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
/* styles                                                                     */
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

  tripFinderBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
    gap: 8,
  },

  tripFinderTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  tripFinderBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tripFinderBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  tripFinderBadgeText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 11,
  },

  tripFinderReasons: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
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
    alignItems: "stretch",
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  smartBtnPrimary: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  smartBtnTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  smartBtnText: { color: theme.colors.text, fontWeight: "900" },

  smartBtnSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "left",
  },

  providerBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  providerBadgeWrapLabeled: {
    maxWidth: 180,
  },

  providerBadgeCircle: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  providerBadgeCircleText: {
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  providerBadgeLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "900",
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

  ticketSignalRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },

  matchHint: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
    flex: 1,
  },

  ticketQualityMeta: {
    marginTop: 4,
    color: "rgba(160,195,255,1)",
    fontWeight: "900",
    fontSize: 11,
  },

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

  proxBody: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  proxMuted: {
    marginTop: 8,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
    lineHeight: 14,
  },

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

  itemMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  itemMeta: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    flex: 1,
  },

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
