import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import TripProgressStrip from "@/src/components/TripProgressStrip";
import NextBestActionCard, { type NextAction } from "@/src/components/NextBestActionCard";
import TripHealthScore from "@/src/components/TripHealthScore";
import TripMatchesCard from "@/src/components/trip/TripMatchesCard";
import TripWorkspaceCard from "@/src/components/trip/TripWorkspaceCard";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { parseIsoDateOnly, toIsoDate, DEFAULT_SEASON } from "@/src/constants/football";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";
import tripWorkspaceStore from "@/src/state/tripWorkspace";

import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import type { PartnerId } from "@/src/core/partners";
import type { WorkspaceSectionKey, TripWorkspace } from "@/src/core/tripWorkspace";
import {
  DEFAULT_SECTION_ORDER,
  computeWorkspaceSnapshot,
  groupSavedItemsBySection,
  sectionForSavedItemType,
} from "@/src/core/tripWorkspace";

import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";
import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateOnly } from "@/src/utils/formatters";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";
import { attachTicketProof } from "@/src/services/ticketAttachment";
import { getTripProgress, getTripHealth } from "@/src/services/tripProgress";
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

declare const __DEV__: boolean;
const DEV = typeof __DEV__ === "boolean" ? __DEV__ : false;

const PLAN_STORAGE_KEY = "yna:plan";
const FREE_TRIP_CAP = 5;

type PlanValue = "not_set" | "free" | "premium";

type AffiliateUrls = {
  flightsUrl: string;
  hotelsUrl: string;
  omioUrl: string;
  transfersUrl: string;
  experiencesUrl: string;
  mapsUrl: string;
};

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function coerceId(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

function isNumericId(v: unknown): v is string {
  return typeof v === "string" && /^[0-9]+$/.test(v.trim());
}

function defer(fn: () => void) {
  setTimeout(fn, 60);
}

function cleanUpper3(v: unknown, fallback: string) {
  const s = String(v ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(s) ? s : fallback;
}

function summaryLine(trip: Trip) {
  const from = trip.startDate ? formatUkDateOnly(trip.startDate) : "—";
  const to = trip.endDate ? formatUkDateOnly(trip.endDate) : "—";
  const count = trip.matchIds?.length ?? 0;
  return `${from} → ${to} • ${count} match${count === 1 ? "" : "es"}`;
}

function tripStatus(trip: Trip): "Upcoming" | "Past" {
  const start = trip.startDate ? parseIsoDateOnly(trip.startDate) : null;
  const end = trip.endDate ? parseIsoDateOnly(trip.endDate) : null;
  const today = parseIsoDateOnly(toIsoDate(new Date()));

  if (!start || !end || !today) return "Upcoming";
  return end.getTime() < today.getTime() ? "Past" : "Upcoming";
}

function cleanNoteText(v: string) {
  return String(v ?? "").replace(/\r\n/g, "\n").trim();
}

function noteTitleFromText(text: string) {
  const cleaned = cleanNoteText(text);
  if (!cleaned) return "Note";

  const firstLine = cleaned.split("\n")[0]?.trim() || "";
  return firstLine.length > 42 ? `${firstLine.slice(0, 42).trim()}…` : firstLine;
}

function statusLabel(status: SavedItem["status"]) {
  if (status === "pending") return "Pending";
  if (status === "saved") return "Saved";
  if (status === "booked") return "Booked";
  return "Archived";
}

function livePriceLine(item: SavedItem): string | null {
  if (!clean(item.partnerUrl)) return null;

  const resolvedPrice = clean(item.metadata?.resolvedPriceText);

  if (item.status === "booked") {
    const bookedPrice = clean(item.priceText) || resolvedPrice;
    return bookedPrice || null;
  }

  if (resolvedPrice) {
    const partner = clean(item.partnerId);
    return partner ? `From ${resolvedPrice} on ${partner}` : `From ${resolvedPrice}`;
  }

  return "Live price on partner";
}

function parseIsoToDate(iso?: string | null): Date | null {
  const value = clean(iso);
  if (!value) return null;

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatKickoffMeta(
  row?: FixtureListRow | null,
  trip?: Trip | null
): { line: string; tbc: boolean; iso: string | null } {
  const isoRaw = (row as any)?.fixture?.date ?? (trip as any)?.kickoffIso;
  const iso = clean(isoRaw) || null;

  const date = parseIsoToDate(iso);
  const shortStatus = clean((row as any)?.fixture?.status?.short).toUpperCase();
  const longStatus = clean((row as any)?.fixture?.status?.long);

  const looksTbc = shortStatus === "TBD" || shortStatus === "TBA" || shortStatus === "NS" || shortStatus === "PST";
  const snapshotTbc = Boolean((trip as any)?.kickoffTbc);

  if (!date) {
    const tbc = looksTbc || snapshotTbc;
    return { line: tbc ? "Kickoff: TBC" : "Kickoff: —", tbc: true, iso };
  }

  const datePart = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const midnight = date.getHours() === 0 && date.getMinutes() === 0;
  const tbc = looksTbc || snapshotTbc || midnight;

  if (tbc) return { line: `Kickoff: ${datePart} • TBC`, tbc: true, iso };

  return {
    line: `Kickoff: ${datePart} • ${timePart}${longStatus ? ` • ${longStatus}` : ""}`,
    tbc: false,
    iso,
  };
}

function titleCaseCity(value: string) {
  const cleaned = clean(value);
  if (!cleaned) return "Trip";

  const base = cleaned.includes("-") && cleaned === cleaned.toLowerCase() ? cleaned.replace(/-/g, " ") : cleaned;

  return base
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => (word[0] ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function buildMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean(query))}`;
}

function buildMapsDirectionsUrl(
  origin: string,
  destination: string,
  mode: "transit" | "walking" | "driving" = "transit"
) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    clean(origin)
  )}&destination=${encodeURIComponent(clean(destination))}&travelmode=${encodeURIComponent(mode)}`;
}

function isLateKickoff(kickoffIso?: string | null): boolean {
  const date = parseIsoToDate(kickoffIso);
  if (!date) return false;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  return hours > 20 || (hours === 20 && minutes >= 30);
}

function Pill({ label, kind }: { label: string; kind: "best" | "budget" }) {
  const colors =
    kind === "best"
      ? { borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,255,136,0.08)" }
      : { borderColor: "rgba(255,200,80,0.40)", backgroundColor: "rgba(255,200,80,0.10)" };

  return (
    <View style={[styles.pill, colors]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function proCapHint(cap: number, tripCount: number) {
  return tripCount < cap ? `Free plan: up to ${cap} saved trips.` : `Free plan cap reached (${cap}). Pro removes the cap.`;
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
  return `${Math.max(0, Math.min(100, Math.round(value * 100)))}% fit`;
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
  if (!resolved) return "Ticket resolver didn’t respond. Check backend URL/server.";

  const checkedProviders = Array.isArray(resolved.checkedProviders)
    ? resolved.checkedProviders.filter(Boolean).join(", ")
    : "";

  const error = clean((resolved as any)?.error);

  if (error === "network_error") return "Ticket backend couldn’t be reached. Check backend URL/server.";
  if (error === "timeout") return "Ticket backend timed out. Try again.";
  if (error === "invalid_backend_json") return "Ticket backend returned invalid JSON.";

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
  return item ? livePriceLine(item) || statusLabel(item.status) : fallback;
}

function normalizeTicketOptions(resolved: TicketResolutionResult | null): TicketResolutionOption[] {
  if (!resolved) return [];

  const options = Array.isArray(resolved.options) ? resolved.options : [];
  const deduped = new Map<string, TicketResolutionOption>();

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
        option.reason === "exact_event" || option.reason === "partial_match" ? option.reason : "search_fallback",
    };

    const key = `${provider.toLowerCase()}|${url}`;
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, normalized);
      continue;
    }

    if (normalized.exact && !existing.exact) {
      deduped.set(key, normalized);
      continue;
    }

    if (normalized.score > existing.score) {
      deduped.set(key, normalized);
    }
  }

  const values = Array.from(deduped.values()).sort((a, b) => {
    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;
    if (b.score !== a.score) return b.score - a.score;

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return a.provider.localeCompare(b.provider);
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
  const score = item.metadata?.score;
  return typeof score === "number" && Number.isFinite(score) ? score : null;
}

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState(tripsStore.getState().loaded);

  const [savedLoaded, setSavedLoaded] = useState(savedItemsStore.getState().loaded);
  const [allSavedItems, setAllSavedItems] = useState<SavedItem[]>([]);

  const [workspaceLoaded, setWorkspaceLoaded] = useState(tripWorkspaceStore.getState().loaded);
  const [workspace, setWorkspace] = useState<TripWorkspace | null>(null);

  const [fixturesById, setFixturesById] = useState<Record<string, FixtureListRow>>({});
  const [fxLoading, setFxLoading] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [proofBusyId, setProofBusyId] = useState<string | null>(null);
  const [devWarnedCityKey, setDevWarnedCityKey] = useState<string | null>(null);

  const [originLoaded, setOriginLoaded] = useState<boolean>(preferencesStore.getState().loaded);
  const [originIata, setOriginIata] = useState<string>(preferencesStore.getPreferredOriginIata());

  const [plan, setPlan] = useState<PlanValue>("not_set");

  const isPro = plan === "premium";

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const stored = await storage.getString(PLAN_STORAGE_KEY);
        if (!mounted) return;

        if (stored === "free" || stored === "premium" || stored === "not_set") setPlan(stored);
        else if (stored === "Free Plan") setPlan("free");
        else if (stored === "Premium Plan") setPlan("premium");
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      const state = tripsStore.getState();
      setTripsLoaded(state.loaded);
      setTrip(state.trips.find((x) => x.id === routeTripId) ?? null);
    };

    const unsub = tripsStore.subscribe(sync);
    sync();

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().finally(sync);
    }

    return () => unsub();
  }, [routeTripId]);

  useEffect(() => {
    const sync = () => {
      const state = savedItemsStore.getState();
      setSavedLoaded(state.loaded);
      setAllSavedItems(Array.isArray(state.items) ? state.items : []);
    };

    const unsub = savedItemsStore.subscribe(sync);
    sync();

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().finally(sync);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    const sync = () => {
      const state = tripWorkspaceStore.getState();
      setWorkspaceLoaded(state.loaded);
      setWorkspace(routeTripId ? state.workspaces[routeTripId] ?? null : null);
    };

    const unsub = tripWorkspaceStore.subscribe(sync);
    sync();

    if (!tripWorkspaceStore.getState().loaded) {
      tripWorkspaceStore.loadWorkspaces().finally(sync);
    }

    return () => unsub();
  }, [routeTripId]);

  useEffect(() => {
    if (!routeTripId || !workspaceLoaded) return;
    tripWorkspaceStore.ensureWorkspace(routeTripId);
  }, [routeTripId, workspaceLoaded]);

  useEffect(() => {
    let mounted = true;

    const sync = () => {
      const state = preferencesStore.getState();
      if (!mounted) return;

      setOriginLoaded(Boolean(state.loaded));
      setOriginIata(cleanUpper3(state.preferredOriginIata, "LON"));
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

  const activeTripId = useMemo(() => clean(trip?.id) || clean(routeTripId) || null, [trip?.id, routeTripId]);

  const savedItems = useMemo(() => {
    if (!activeTripId) return [];
    return allSavedItems.filter((item) => clean(item.tripId) === activeTripId);
  }, [allSavedItems, activeTripId]);

  const groupedBySection = useMemo(() => groupSavedItemsBySection(savedItems), [savedItems]);
  const workspaceSnapshot = useMemo(() => computeWorkspaceSnapshot(savedItems), [savedItems]);

  const sectionOrder = useMemo<WorkspaceSectionKey[]>(
    () => workspace?.sectionOrder ?? [...DEFAULT_SECTION_ORDER],
    [workspace]
  );

  const activeSection = useMemo<WorkspaceSectionKey>(() => {
    if (workspace?.activeSection) return workspace.activeSection;
    return sectionOrder[0] ?? "tickets";
  }, [workspace?.activeSection, sectionOrder]);

  const matchIds = useMemo(() => {
    const raw = Array.isArray(trip?.matchIds) ? trip.matchIds : [];
    return raw.map((id) => String(id).trim()).filter(Boolean);
  }, [trip?.matchIds]);

  const numericMatchIds = useMemo(() => matchIds.filter(isNumericId), [matchIds]);

  const primaryMatchId = useMemo(() => {
    const preferred = clean((trip as any)?.fixtureIdPrimary);
    if (preferred && numericMatchIds.includes(preferred)) return preferred;
    return numericMatchIds[0] ?? null;
  }, [trip, numericMatchIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadFixtures() {
      if (numericMatchIds.length === 0) {
        setFixturesById({});
        setFxLoading(false);
        return;
      }

      setFxLoading(true);

      try {
        const map: Record<string, FixtureListRow> = {};

        for (const id of numericMatchIds) {
          try {
            const row = await getFixtureById(id);
            if (row) map[String(id)] = row;
          } catch {}
        }

        if (!cancelled) setFixturesById(map);
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    loadFixtures();

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
    const displayCity = clean((trip as any)?.displayCity);
    if (displayCity) return displayCity;

    const venueCitySnapshot = clean((trip as any)?.venueCity);
    if (venueCitySnapshot) return venueCitySnapshot;

    const venueCityFixture = clean((primaryFixture as any)?.fixture?.venue?.city);
    if (venueCityFixture) return venueCityFixture;

    if (trip?.cityId) return trip.cityId;
    return "Trip";
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

  const affiliateUrls = useMemo<AffiliateUrls | null>(() => {
    if (!affiliateCtx) return null;

    return {
      flightsUrl: resolveAffiliateUrl("aviasales", affiliateCtx),
      hotelsUrl: resolveAffiliateUrl("expedia", affiliateCtx),
      omioUrl: resolveAffiliateUrl("omio", affiliateCtx),
      transfersUrl: resolveAffiliateUrl("kiwitaxi", affiliateCtx),
      experiencesUrl: resolveAffiliateUrl("getyourguide", affiliateCtx),
      mapsUrl: buildMapsSearchUrl(`${affiliateCtx.city} travel`),
    };
  }, [affiliateCtx]);

  const pending = useMemo(() => savedItems.filter((item) => item.status === "pending"), [savedItems]);
  const saved = useMemo(
    () => savedItems.filter((item) => item.status === "saved" && item.type !== "note"),
    [savedItems]
  );
  const booked = useMemo(() => savedItems.filter((item) => item.status === "booked"), [savedItems]);

  const primaryHomeName = useMemo(() => {
    const homeFromFixture = clean((primaryFixture as any)?.teams?.home?.name);
    return homeFromFixture || clean((trip as any)?.homeName);
  }, [primaryFixture, trip]);

  const primaryLeagueName = useMemo(() => {
    const leagueFromFixture = clean((primaryFixture as any)?.league?.name);
    return leagueFromFixture || clean((trip as any)?.leagueName);
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

  const primaryLogisticsSnippet = useMemo(
    () => (primaryLogistics ? buildLogisticsSnippet(primaryLogistics) : ""),
    [primaryLogistics]
  );

  const stadiumName = useMemo(() => clean((primaryLogistics as any)?.stadium), [primaryLogistics]);
  const stadiumCity = useMemo(
    () => clean((primaryLogistics as any)?.city ?? cityName),
    [primaryLogistics, cityName]
  );

  const stadiumMapsUrl = useMemo(() => {
    const query = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
    return buildMapsSearchUrl(query);
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo(() => {
    const areas = Array.isArray((primaryLogistics as any)?.stay?.bestAreas)
      ? (primaryLogistics as any).stay.bestAreas
      : [];

    return areas
      .map((item: any) => ({ area: clean(item?.area), notes: clean(item?.notes) }))
      .filter((item: any) => item.area);
  }, [primaryLogistics]);

  const stayBudgetAreas = useMemo(() => {
    const areas = Array.isArray((primaryLogistics as any)?.stay?.budgetAreas)
      ? (primaryLogistics as any).stay.budgetAreas
      : [];

    return areas
      .map((item: any) => ({ area: clean(item?.area), notes: clean(item?.notes) }))
      .filter((item: any) => item.area);
  }, [primaryLogistics]);

  const transportStops = useMemo(() => {
    const stops = Array.isArray((primaryLogistics as any)?.transport?.primaryStops)
      ? (primaryLogistics as any).transport.primaryStops
      : [];

    return stops
      .slice(0, 3)
      .map((stop: any) => `${clean(stop?.name)}${stop?.notes ? ` — ${clean(stop.notes)}` : ""}`)
      .filter(Boolean);
  }, [primaryLogistics]);

  const transportTips = useMemo(() => {
    const tips = Array.isArray((primaryLogistics as any)?.transport?.tips)
      ? (primaryLogistics as any).transport.tips
      : [];

    return tips.slice(0, 3).map((tip: any) => clean(tip)).filter(Boolean);
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
    const fixtureId = clean(matchId);
    if (!fixtureId) return null;

    const candidates = savedItems.filter((item) => item.type === "tickets" && item.status !== "archived");
    const exact = candidates.filter((item) => clean((item.metadata as any)?.fixtureId) === fixtureId);
    const pool = exact.length > 0 ? exact : candidates;

    return (
      pool.find((item) => item.status === "pending") ??
      pool.find((item) => item.status === "saved") ??
      pool.find((item) => item.status === "booked") ??
      null
    );
  }

  const ticketsByMatchId = useMemo(() => {
    const map: Record<string, SavedItem | null> = {};
    for (const matchId of numericMatchIds) {
      map[String(matchId)] = getTicketItemForFixture(String(matchId));
    }
    return map;
  }, [numericMatchIds, savedItems]);

  const primaryTicketItem = useMemo(() => {
    if (!primaryMatchId) return null;
    return ticketsByMatchId[String(primaryMatchId)] ?? null;
  }, [primaryMatchId, ticketsByMatchId]);

  const progress = useMemo(() => {
    if (!activeTripId) {
      return {
        tickets: "empty",
        flight: "empty",
        hotel: "empty",
        transfer: "empty",
        things: "empty",
      } as const;
    }

    return getTripProgress(activeTripId);
  }, [activeTripId, savedItems]);

  const readiness = useMemo(() => {
    if (!activeTripId) return { score: 0, missing: [] as string[] };
    return getTripHealth(activeTripId);
  }, [activeTripId, savedItems]);

  const hasTickets = progress.tickets !== "empty";
  const hasFlight = progress.flight !== "empty";
  const hasHotel = progress.hotel !== "empty";
  const hasTransport = progress.transfer !== "empty";
  const hasThings = progress.things !== "empty";
  const hasMatch = Boolean(primaryMatchId);

  useEffect(() => {
    if (!DEV) return;

    const city = clean(cityName);
    if (!city || city === "Trip") return;

    if (getIataCityCodeForCity(city)) return;

    const key = debugCityKey(city);
    if (!key || devWarnedCityKey === key) return;

    setDevWarnedCityKey(key);

    Alert.alert(
      "Missing IATA mapping (dev)",
      `City: ${city}\n\nNormalized key:\n${key}\n\nAdd it to src/data/iataCityCodes.ts`,
      [{ text: "OK" }],
      { cancelable: true }
    );
  }, [cityName, devWarnedCityKey]);

  async function setActiveWorkspaceSection(section: WorkspaceSectionKey) {
    const tripId = clean(activeTripId);
    if (!tripId) return;

    try {
      await tripWorkspaceStore.setActiveSection(tripId, section);
    } catch {}
  }

  async function toggleWorkspaceSection(section: WorkspaceSectionKey) {
    const tripId = clean(activeTripId);
    if (!tripId) return;

    try {
      await tripWorkspaceStore.toggleCollapsed(tripId, section);
    } catch {}
  }

  function openTripBuilder() {
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
    const tripId = clean(trip?.id) || clean(activeTripId);

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

      const nextSection = args.savedItemType ? sectionForSavedItemType(args.savedItemType) : undefined;
      if (nextSection) void setActiveWorkspaceSection(nextSection);
    } catch {
      await openUntracked(args.url);
    }
  }

  async function openSavedItem(item: SavedItem) {
    if (!item.partnerUrl) {
      Alert.alert(item.title || "Notes", clean(item.metadata?.text) || "No details saved.");
      return;
    }

    if (item.status === "booked" || item.status === "archived") {
      await openUntracked(item.partnerUrl);
      return;
    }

    const partnerId = clean(item.partnerId);
    if (!partnerId || partnerId === "googlemaps") {
      await openUntracked(item.partnerUrl);
      return;
    }

    const tripId = clean(item.tripId) || clean(trip?.id) || clean(activeTripId);
    if (!tripId) {
      await openUntracked(item.partnerUrl);
      return;
    }

    try {
      await beginPartnerClick({
        tripId,
        partnerId: partnerId as any,
        url: item.partnerUrl,
        savedItemType: item.type,
        title: item.title,
        metadata: item.metadata,
      });

      void setActiveWorkspaceSection(sectionForSavedItemType(item.type));
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

  async function addProofForBookedItem(item: SavedItem) {
    if (!item?.id) return;

    try {
      setProofBusyId(item.id);
      const ok = await attachTicketProof(item.id);
      if (!ok) return;
      Alert.alert("Saved", "Booking proof stored for offline access.");
    } catch {
      Alert.alert("Couldn’t add proof", "Try again.");
    } finally {
      setProofBusyId(null);
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
      { text: "Mark booked", onPress: () => markBookedSmart(item) },
    ]);
  }

  function confirmMoveToPending(item: SavedItem) {
    Alert.alert("Move to Pending?", "Use Pending when you’re not sure if you booked it yet.", [
      { text: "Cancel", style: "cancel" },
      { text: "Move", onPress: () => moveToPending(item) },
    ]);
  }

  async function addNote() {
    const text = cleanNoteText(noteText);
    const tripId = clean(trip?.id) || clean(activeTripId);

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
      void setActiveWorkspaceSection("notes");
    } catch {
      Alert.alert("Couldn’t save note");
    } finally {
      setNoteSaving(false);
    }
  }

  function openNoteActions(item: SavedItem) {
    Alert.alert(
      item.title || "Notes",
      clean(item.metadata?.text) || "No details saved.",
      [
        { text: "Close", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ],
      { cancelable: true }
    );
  }

  async function setPrimaryMatch(matchId: string) {
    if (!trip) return;

    const fixtureId = clean(matchId);
    if (!fixtureId || fixtureId === clean((trip as any)?.fixtureIdPrimary)) return;

    const row = fixturesById[fixtureId] ?? null;

    const homeName = clean((row as any)?.teams?.home?.name) || undefined;
    const awayName = clean((row as any)?.teams?.away?.name) || undefined;
    const leagueName = clean((row as any)?.league?.name) || undefined;
    const leagueId = typeof (row as any)?.league?.id === "number" ? (row as any).league.id : undefined;
    const kickoffIso = clean((row as any)?.fixture?.date) || undefined;
    const venueName = clean((row as any)?.fixture?.venue?.name) || undefined;
    const venueCity = clean((row as any)?.fixture?.venue?.city) || undefined;

    const statusShort = clean((row as any)?.fixture?.status?.short).toUpperCase();
    const midnight = kickoffIso
      ? (() => {
          const date = new Date(kickoffIso);
          return Number.isFinite(date.getTime()) ? date.getHours() === 0 && date.getMinutes() === 0 : false;
        })()
      : true;

    const kickoffTbc =
      statusShort === "TBD" ||
      statusShort === "TBA" ||
      statusShort === "NS" ||
      statusShort === "PST" ||
      midnight;

    try {
      await tripsStore.setPrimaryMatchForTrip(trip.id, fixtureId);

      await tripsStore.updateTrip(trip.id, {
        fixtureIdPrimary: fixtureId,
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

    const fixtureId = clean(matchId);
    if (!fixtureId) return;

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
            await tripsStore.removeMatchFromTrip(trip.id, fixtureId);
          } catch {
            Alert.alert("Couldn’t remove match", "Try again.");
          }
        },
      },
    ]);
  }

  function openMatchActions(matchId: string) {
    if (!trip) return;

    const fixtureId = clean(matchId);
    const isPrimary = fixtureId && fixtureId === clean((trip as any)?.fixtureIdPrimary);

    Alert.alert(
      "Match options",
      isPrimary ? "This is the primary match for the trip." : "Choose what you want to do with this match.",
      [
        { text: "Cancel", style: "cancel" },
        !isPrimary ? { text: "Set as primary", onPress: () => setPrimaryMatch(fixtureId) } : null,
        { text: "Remove from trip", style: "destructive", onPress: () => removeMatch(fixtureId) },
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
            `${index + 1}. ${clean(option.provider)}${clean(option.priceText) ? ` • ${clean(option.priceText)}` : ""}`
        )
        .join("\n"),
      [
        { text: "Cancel", style: "cancel" },
        ...top.map((option) => ({
          text: clean(option.provider),
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
              params: { id: args.mid, tripId: activeTripId ?? undefined },
            } as any),
        },
      ]
    );
  }

  async function openTicketsForMatch(matchId: string) {
    const fixtureId = clean(matchId);
    if (!fixtureId) return;

    if (!activeTripId) {
      Alert.alert("Save trip first", "Save this trip before booking so we can store it in Wallet.");
      return;
    }

    const existing = ticketsByMatchId[fixtureId];
    if (existing && existing.type === "tickets" && existing.status !== "archived" && existing.partnerUrl) {
      await openSavedItem(existing);
      return;
    }

    const row = fixturesById[fixtureId] ?? null;

    const homeName = clean((row as any)?.teams?.home?.name ?? (trip as any)?.homeName);
    const awayName = clean((row as any)?.teams?.away?.name ?? (trip as any)?.awayName);
    const kickoffIso = clean((row as any)?.fixture?.date ?? (trip as any)?.kickoffIso) || null;
    const leagueName = clean((row as any)?.league?.name ?? (trip as any)?.leagueName) || undefined;

    const leagueIdRaw = (row as any)?.league?.id ?? (trip as any)?.leagueId;
    const leagueId = typeof leagueIdRaw === "number" || typeof leagueIdRaw === "string" ? leagueIdRaw : undefined;

    if (!homeName || !awayName || !kickoffIso) {
      Alert.alert("Tickets not available", "Missing team names or kickoff time for this match.");
      return;
    }

    const dateIso =
      trip?.startDate ||
      (() => {
        const raw = clean(kickoffIso);
        if (!raw) return undefined;
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

        const date = new Date(raw);
        if (!Number.isFinite(date.getTime())) return undefined;

        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
          date.getDate()
        ).padStart(2, "0")}`;
      })();

    try {
      const resolved = await resolveTicketForFixture({
        fixtureId,
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
          mid: fixtureId,
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
        mid: fixtureId,
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

  function openFlights() {
    const url = affiliateUrls?.flightsUrl;
    if (!url) {
      Alert.alert("Not ready", "We need a city + dates saved to build booking links.");
      return;
    }

    return openTrackedPartner({
      partnerId: "aviasales" as PartnerId,
      url,
      savedItemType: "flight",
      title: `Flights to ${cityName}`,
      metadata: { city: cityName, originIata: cleanUpper3(originIata, "LON"), priceMode: "live" },
    });
  }

  function openHotels() {
    const url = affiliateUrls?.hotelsUrl;
    if (!url) {
      Alert.alert("Not ready", "We need a city + dates saved to build booking links.");
      return;
    }

    return openTrackedPartner({
      partnerId: "expedia" as PartnerId,
      url,
      savedItemType: "hotel",
      title: `Hotels in ${cityName}`,
      metadata: { city: cityName, startDate: trip?.startDate, endDate: trip?.endDate, priceMode: "live" },
    });
  }

  function openTransfers() {
    const url = affiliateUrls?.omioUrl || affiliateUrls?.transfersUrl;
    if (!url) {
      Alert.alert("Not ready", "We need a city + dates saved to build booking links.");
      return;
    }

    const usingOmio = Boolean(affiliateUrls?.omioUrl);

    return openTrackedPartner({
      partnerId: usingOmio ? ("omio" as PartnerId) : ("kiwitaxi" as PartnerId),
      url,
      savedItemType: usingOmio ? "train" : "transfer",
      title: usingOmio ? `Trains & buses in ${cityName}` : `Transfers in ${cityName}`,
      metadata: {
        city: cityName,
        startDate: trip?.startDate,
        endDate: trip?.endDate,
        priceMode: "live",
        transportMode: usingOmio ? "rail_bus" : "transfer",
      },
    });
  }

  function openThings() {
    const url = affiliateUrls?.experiencesUrl;
    if (!url) {
      Alert.alert("Not ready", "We need a city saved to build booking links.");
      return;
    }

    return openTrackedPartner({
      partnerId: "getyourguide" as PartnerId,
      url,
      savedItemType: "things",
      title: `Experiences in ${cityName}`,
      metadata: { city: cityName, priceMode: "live" },
    });
  }

  const progressItems = useMemo(
    () => [
      {
        key: "tickets" as const,
        label: "Tickets",
        state: progress.tickets,
        onPress: () => {
          if (!primaryMatchId) {
            Alert.alert("Add a match first", "Add a match to unlock tickets + match planning.");
            return;
          }
          openTicketsForMatch(primaryMatchId);
        },
      },
      { key: "flight" as const, label: "Flights", state: progress.flight, onPress: openFlights },
      { key: "hotel" as const, label: "Hotel", state: progress.hotel, onPress: openHotels },
      {
        key: "transfer" as const,
        label: affiliateUrls?.omioUrl ? "Rail/Bus" : "Transfer",
        state: progress.transfer,
        onPress: openTransfers,
      },
      { key: "things" as const, label: "Things", state: progress.things, onPress: openThings },
    ],
    [affiliateUrls?.omioUrl, progress, primaryMatchId, cityName, originIata, trip?.startDate, trip?.endDate]
  );

  const nextAction = useMemo<NextAction | null>(() => {
    const openTickets = () => {
      if (!hasMatch || !primaryMatchId) {
        Alert.alert("Add a match first", "Add a match to unlock tickets + match planning.");
        return;
      }
      openTicketsForMatch(primaryMatchId);
    };

    if (!hasTickets) {
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
        body: "When kickoff is TBC, choose flights or hotels with flexibility. Locking rigid plans too early is how people get burned.",
        cta: hasFlight ? "View hotels (live)" : "View flights (live)",
        onPress: hasFlight ? openHotels : openFlights,
        secondaryCta: "Open tickets",
        onSecondaryPress: openTickets,
        badge: "TBC",
        proLocked: true,
      };
    }

    if (!hasFlight) {
      return {
        title: "Add flights for this trip",
        body: "Tickets are in motion, but the trip still isn’t real until transport is covered.",
        cta: "View flights (live)",
        onPress: openFlights,
      };
    }

    if (!hasHotel) {
      return {
        title: "Pick a hotel in a smart area",
        body: "Don’t just book the cheapest room. Use stay guidance so your matchday logistics aren’t awful.",
        cta: "View hotels (live)",
        onPress: openHotels,
        secondaryCta: "Stay guidance",
        onSecondaryPress: () => {
          void setActiveWorkspaceSection("stay");
          Alert.alert("Tip", "Stay is where your matchday convenience gets won or lost.");
        },
      };
    }

    if (!hasTransport) {
      return {
        title: "Sort local transport next",
        body: "Flights and hotel are covered. Now remove friction between airport, hotel, and stadium.",
        cta: affiliateUrls?.omioUrl ? "View rail/bus" : "View transfers",
        onPress: openTransfers,
      };
    }

    if (!hasThings) {
      return {
        title: "Trip is covered — add experiences if they help",
        body: "Core planning is done. Anything else should improve the trip, not clutter it.",
        cta: "View activities",
        onPress: openThings,
        badge: "Ready",
      };
    }

    return {
      title: "Core planning complete",
      body: "You’ve covered the important parts. From here, only add things that genuinely improve the trip.",
      cta: "View wallet",
      onPress: onViewWallet,
      badge: "Ready",
    };
  }, [
    affiliateUrls?.omioUrl,
    hasMatch,
    hasTickets,
    hasFlight,
    hasHotel,
    hasTransport,
    hasThings,
    kickoffMeta.tbc,
    primaryMatchId,
  ]);

  const smartBookButtons = useMemo(() => {
    if (!affiliateUrls || !trip) return [];

    const buttons: Array<{
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
    ) => buttons.push({ title, sub, onPress, kind, provider });

    if (!hasTickets && primaryMatchId) {
      add(
        "Tickets",
        smartButtonSubtitle(primaryTicketItem, "Compare live ticket options"),
        () => openTicketsForMatch(primaryMatchId),
        "primary",
        ticketProviderFromItem(primaryTicketItem)
      );
    }

    if (!hasFlight) add("Flights", "Aviasales (live)", openFlights, "primary", "aviasales");
    if (!hasHotel) add("Hotels", "Expedia (live)", openHotels, "primary", "expedia");

    if (!hasTransport && affiliateUrls.omioUrl) {
      add("Rail / Bus", "Omio (live)", openTransfers, "neutral", "omio");
    } else if (!hasTransport) {
      add("Transfers", "Kiwitaxi (live)", openTransfers, "neutral", "kiwitaxi");
    }

    if (!hasThings) add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");

    if (buttons.length === 0) {
      add("Hotels", "Expedia (live)", openHotels, "primary", "expedia");
      if (affiliateUrls.omioUrl) add("Rail / Bus", "Omio (live)", openTransfers, "neutral", "omio");
      else add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");
    }

    return buttons.slice(0, 4);
  }, [
    affiliateUrls,
    trip,
    hasTickets,
    hasFlight,
    hasHotel,
    hasTransport,
    hasThings,
    primaryMatchId,
    primaryTicketItem,
  ]);

  const tripCount = useMemo(() => tripsStore.getState().trips?.length ?? 0, [tripsLoaded]);
  const loading = Boolean(routeTripId && (!tripsLoaded || !savedLoaded || !workspaceLoaded));
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
          showsVerticalScrollIndicator={false}
        >
          {!routeTripId ? (
            <GlassCard style={styles.card}>
              <EmptyState title="Missing trip id" message="No trip id provided." />
            </GlassCard>
          ) : null}

          {loading ? (
            <GlassCard style={styles.card}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trip…</Text>
              </View>
            </GlassCard>
          ) : null}

          {!loading && routeTripId && tripsLoaded && savedLoaded && workspaceLoaded && !trip ? (
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
                  <Pressable onPress={openTripBuilder} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Edit trip</Text>
                  </Pressable>

                  {!isPro ? (
                    <Pressable onPress={onUpgradePress} style={[styles.btn, styles.btnSecondary]}>
                      <Text style={styles.btnSecondaryText}>Go Pro</Text>
                    </Pressable>
                  ) : null}
                </View>

                {!originLoaded ? <Text style={styles.mutedInline}>Loading departure preference…</Text> : null}

                <View style={styles.heroUtilityStack}>
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
                    {smartBookButtons.map((button, index) => (
                      <Pressable
                        key={`${button.title}-${index}`}
                        style={[styles.smartBtn, button.kind === "primary" ? styles.smartBtnPrimary : undefined]}
                        onPress={button.onPress}
                      >
                        <View style={styles.smartBtnTop}>
                          <Text style={styles.smartBtnText}>{button.title}</Text>
                        </View>
                        <Text style={styles.smartBtnSub}>{button.sub}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable onPress={() => openUntracked(affiliateUrls.mapsUrl)}>
                    <Text style={styles.mapsInline}>Open maps search</Text>
                  </Pressable>
                </GlassCard>
              ) : null}

              <TripMatchesCard
                trip={trip}
                numericMatchIds={numericMatchIds}
                primaryMatchId={primaryMatchId}
                fixturesById={fixturesById}
                ticketsByMatchId={ticketsByMatchId}
                fxLoading={fxLoading}
                onAddMatch={openTripBuilder}
                onOpenTicketsForMatch={openTicketsForMatch}
                onOpenMatchActions={openMatchActions}
                onSetPrimaryMatch={setPrimaryMatch}
                onRemoveMatch={removeMatch}
                getTicketProviderFromItem={ticketProviderFromItem}
                getTicketScoreFromItem={itemResolvedScore}
                getLivePriceLine={livePriceLine}
              />

              <TripWorkspaceCard
                workspaceSnapshot={workspaceSnapshot}
                workspace={workspace}
                sectionOrder={sectionOrder}
                activeSection={activeSection}
                groupedBySection={groupedBySection}
                primaryMatchId={primaryMatchId}
                affiliateUrls={affiliateUrls}
                cityName={cityName}
                originIata={cleanUpper3(originIata, "LON")}
                tripStartDate={trip.startDate}
                tripEndDate={trip.endDate}
                noteText={noteText}
                noteSaving={noteSaving}
                proofBusyId={proofBusyId}
                stayBestAreas={stayBestAreas}
                stayBudgetAreas={stayBudgetAreas}
                transportStops={transportStops}
                onSetActiveSection={setActiveWorkspaceSection}
                onToggleSection={toggleWorkspaceSection}
                onNoteTextChange={setNoteText}
                onAddNote={addNote}
                onOpenTicketsForPrimaryMatch={() => {
                  if (primaryMatchId) openTicketsForMatch(primaryMatchId);
                }}
                onOpenSavedItem={openSavedItem}
                onOpenNoteActions={openNoteActions}
                onConfirmMarkBooked={confirmMarkBooked}
                onAddProofForBookedItem={addProofForBookedItem}
                onViewWallet={onViewWallet}
                onConfirmMoveToPending={confirmMoveToPending}
                onConfirmArchive={confirmArchive}
                onOpenPartner={openTrackedPartner}
                getLivePriceLine={livePriceLine}
                getTicketProviderFromItem={ticketProviderFromItem}
              />

              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Stay guidance (stadium + best areas)</Text>

                {!primaryLogistics ? (
                  <EmptyState
                    title="Stay tips not available"
                    message="Add a match (or load match details) to unlock stadium-area stay suggestions."
                  />
                ) : (
                  <View style={styles.guidanceStack}>
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
                      <View style={styles.areaBlock}>
                        <Text style={styles.stayLabel}>Best areas</Text>

                        {stayBestAreas.slice(0, 3).map((area, index) => {
                          const stadiumQuery = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
                          const areaQuery = [area.area, stadiumCity].filter(Boolean).join(" ").trim();
                          const origin = areaQuery || area.area;
                          const destination = stadiumQuery || stadiumName || "stadium";

                          return (
                            <View key={`best-${index}`} style={styles.areaRow}>
                              <View style={styles.areaContent}>
                                <View style={styles.areaTop}>
                                  <Text style={styles.areaName} numberOfLines={1}>
                                    {area.area}
                                  </Text>
                                  <Pill label="Best area" kind="best" />
                                </View>

                                {area.notes ? <Text style={styles.areaNotes}>{area.notes}</Text> : null}
                              </View>

                              <View style={styles.areaBtns}>
                                <Pressable onPress={() => openUntracked(buildMapsSearchUrl(origin))} style={styles.smallBtn}>
                                  <Text style={styles.smallBtnText}>Maps</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => openUntracked(buildMapsDirectionsUrl(origin, destination, "transit"))}
                                  style={styles.smallBtn}
                                >
                                  <Text style={styles.smallBtnText}>Transit</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => openUntracked(buildMapsDirectionsUrl(origin, destination, "walking"))}
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
                      <View style={styles.areaBlock}>
                        <Text style={styles.stayLabel}>Budget-friendly</Text>

                        {stayBudgetAreas.slice(0, 2).map((area, index) => {
                          const stadiumQuery = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
                          const areaQuery = [area.area, stadiumCity].filter(Boolean).join(" ").trim();
                          const origin = areaQuery || area.area;
                          const destination = stadiumQuery || stadiumName || "stadium";

                          return (
                            <View key={`budget-${index}`} style={styles.areaRow}>
                              <View style={styles.areaContent}>
                                <View style={styles.areaTop}>
                                  <Text style={styles.areaName} numberOfLines={1}>
                                    {area.area}
                                  </Text>
                                  <Pill label="Budget" kind="budget" />
                                </View>

                                {area.notes ? <Text style={styles.areaNotes}>{area.notes}</Text> : null}
                              </View>

                              <View style={styles.areaBtns}>
                                <Pressable onPress={() => openUntracked(buildMapsSearchUrl(origin))} style={styles.smallBtn}>
                                  <Text style={styles.smallBtnText}>Maps</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => openUntracked(buildMapsDirectionsUrl(origin, destination, "transit"))}
                                  style={styles.smallBtn}
                                >
                                  <Text style={styles.smallBtnText}>Transit</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => openUntracked(buildMapsDirectionsUrl(origin, destination, "walking"))}
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
                      <View style={styles.areaBlock}>
                        <Text style={styles.stayLabel}>Best transport stops</Text>

                        {transportStops.map((line, index) => (
                          <Pressable
                            key={`stop-${index}`}
                            onPress={() =>
                              openUntracked(buildMapsSearchUrl([line, stadiumCity].filter(Boolean).join(" ")))
                            }
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
                      <View style={styles.areaBlock}>
                        <Text style={styles.stayLabel}>Matchday tips</Text>
                        {transportTips.map((tip, index) => (
                          <Text key={`tip-${index}`} style={styles.stayBullet}>
                            • {tip}
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
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  card: {
    padding: theme.spacing.lg,
  },

  center: {
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },

  mutedInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "800",
  },

  hero: {
    padding: theme.spacing.lg,
  },

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

  statusText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

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

  bannersRow: {
    marginTop: 12,
    gap: 10,
  },

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

  heroActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  heroUtilityStack: {
    marginTop: 14,
    gap: 10,
  },

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

  sectionSub: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
  },

  smartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

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

  smartBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  smartBtnSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "left",
  },

  guidanceStack: {
    gap: 10,
  },

  areaBlock: {
    gap: 6,
    marginTop: 6,
  },

  proxBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  proxTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
    lineHeight: 18,
  },

  proxCity: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

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

  proxBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  stayLabel: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  stayBullet: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

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

  areaContent: {
    flex: 1,
  },

  areaTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  areaName: {
    color: theme.colors.text,
    fontWeight: "900",
    flexShrink: 1,
  },

  areaNotes: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  areaBtns: {
    gap: 8,
    alignItems: "flex-end",
  },

  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  pillText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  lateBox: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.28)",
    backgroundColor: "rgba(255,200,80,0.08)",
    padding: 12,
  },

  lateTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  lateText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  smallBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  mapsInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "900",
  },

  chev: {
    color: theme.colors.textSecondary,
    fontSize: 22,
    marginTop: -2,
  },
});
