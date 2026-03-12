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
  Platform,
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

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { parseIsoDateOnly, toIsoDate, DEFAULT_SEASON } from "@/src/constants/football";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";
import tripWorkspaceStore from "@/src/state/tripWorkspace";

import type { SavedItem, SavedItemType, WalletAttachment } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
import { getPartner, type PartnerId } from "@/src/core/partners";
import type { WorkspaceSectionKey, TripWorkspace } from "@/src/core/tripWorkspace";
import {
  WORKSPACE_SECTIONS,
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

  return end.getTime() < today.getTime() ? "Past" : "Upcoming";
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
    return p || null;
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

function getAttachmentCount(item: SavedItem | null): number {
  const atts = Array.isArray(item?.attachments) ? (item.attachments as WalletAttachment[]) : [];
  return atts.length;
}

function hasProof(item: SavedItem | null): boolean {
  return getAttachmentCount(item) > 0;
}

function proofStateText(item: SavedItem): string {
  const count = getAttachmentCount(item);
  if (count <= 0) return "No proof attached yet";
  return `${count} proof file${count === 1 ? "" : "s"} attached`;
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

function parseIsoToDate(iso?: string | null): Date | null {
  const s = clean(iso);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
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

function sectionStateLabel(sectionKey: WorkspaceSectionKey, total: number) {
  const title = WORKSPACE_SECTIONS[sectionKey].title;
  if (total <= 0) return `No ${title.toLowerCase()} yet`;
  if (total === 1) return "1 item";
  return `${total} items`;
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

  const [devWarnedCityKey, setDevWarnedCityKey] = useState<string | null>(null);

  const [originLoaded, setOriginLoaded] = useState<boolean>(preferencesStore.getState().loaded);
  const [originIata, setOriginIata] = useState<string>(preferencesStore.getPreferredOriginIata());

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const [proofBusyId, setProofBusyId] = useState<string | null>(null);

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
      setTrip(s.trips.find((x) => x.id === routeTripId) ?? null);
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
      const s = savedItemsStore.getState();
      setSavedLoaded(s.loaded);
      setAllSavedItems(Array.isArray(s.items) ? s.items : []);
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
      const s = tripWorkspaceStore.getState();
      setWorkspaceLoaded(s.loaded);
      if (routeTripId) {
        setWorkspace(s.workspaces[routeTripId] ?? null);
      } else {
        setWorkspace(null);
      }
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

  const activeTripId = useMemo(() => clean(trip?.id) || clean(routeTripId) || null, [trip?.id, routeTripId]);

  const savedItems = useMemo(() => {
    if (!activeTripId) return [];
    return allSavedItems.filter((x) => clean(x.tripId) === activeTripId);
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
            const r = await getFixtureById(id);
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

    const snapVenueCity = clean((trip as any)?.venueCity);
    if (snapVenueCity) return snapVenueCity;

    const fixtureVenueCity = clean((primaryFixture as any)?.fixture?.venue?.city);
    if (fixtureVenueCity) return fixtureVenueCity;

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

  const affiliateUrls = useMemo(() => {
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

  const pending = useMemo(() => savedItems.filter((x) => x.status === "pending"), [savedItems]);
  const saved = useMemo(
    () => savedItems.filter((x) => x.status === "saved" && x.type !== "note"),
    [savedItems]
  );
  const booked = useMemo(() => savedItems.filter((x) => x.status === "booked"), [savedItems]);

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
    const q = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
    return buildMapsSearchUrl(q);
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo(() => {
    const arr = Array.isArray((primaryLogistics as any)?.stay?.bestAreas)
      ? (primaryLogistics as any).stay.bestAreas
      : [];
    return arr
      .map((x: any) => ({ area: clean(x?.area), notes: clean(x?.notes) }))
      .filter((x: any) => x.area);
  }, [primaryLogistics]);

  const stayBudgetAreas = useMemo(() => {
    const arr = Array.isArray((primaryLogistics as any)?.stay?.budgetAreas)
      ? (primaryLogistics as any).stay.budgetAreas
      : [];
    return arr
      .map((x: any) => ({ area: clean(x?.area), notes: clean(x?.notes) }))
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

  async function setActiveWorkspaceSection(section: WorkspaceSectionKey) {
    const id = clean(activeTripId);
    if (!id) return;
    try {
      await tripWorkspaceStore.setActiveSection(id, section);
    } catch {}
  }

  async function toggleWorkspaceSection(section: WorkspaceSectionKey) {
    const id = clean(activeTripId);
    if (!id) return;
    try {
      await tripWorkspaceStore.toggleCollapsed(id, section);
    } catch {}
  }

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
    const targetTripId = clean(trip?.id) || clean(activeTripId);
    if (!targetTripId) {
      Alert.alert("Save trip first", "Save this trip before booking so we can store it in Wallet.");
      return;
    }

    if (args.partnerId === ("googlemaps" as any)) {
      await openUntracked(args.url);
      return;
    }

    try {
      await beginPartnerClick({
        tripId: targetTripId,
        partnerId: args.partnerId,
        url: args.url,
        savedItemType: args.savedItemType,
        title: args.title,
        metadata: args.metadata,
      });

      const nextSection = args.savedItemType ? sectionForSavedItemType(args.savedItemType) : undefined;
      if (nextSection) {
        void setActiveWorkspaceSection(nextSection);
      }
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

    const targetTripId = clean(item.tripId) || clean(trip?.id) || clean(activeTripId);
    if (!targetTripId) {
      await openUntracked(item.partnerUrl);
      return;
    }

    try {
      await beginPartnerClick({
        tripId: targetTripId,
        partnerId: pid as any,
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
    const targetTripId = clean(trip?.id) || clean(activeTripId);

    if (!targetTripId) return;

    if (!text) {
      Alert.alert("Add a note", "Type something first.");
      return;
    }

    setNoteSaving(true);
    try {
      await savedItemsStore.add({
        tripId: targetTripId,
        type: "note",
        status: "saved",
        title: noteTitleFromText(text),
        metadata: { text },
      } as any);

      setNoteText("");
      Keyboard.dismiss();
      void setActiveWorkspaceSection("notes");
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
              params: { id: args.mid, tripId: activeTripId ?? undefined },
            } as any),
        },
      ]
    );
  }

  async function openTicketsForMatch(matchId: string) {
    const mid = clean(matchId);
    if (!mid) return;

    if (!activeTripId) {
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

    const dateIso = trip?.startDate || (() => {
      const raw = clean(kickoffIso);
      if (!raw) return undefined;
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
      const d = new Date(raw);
      if (!Number.isFinite(d.getTime())) return undefined;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    })();

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
      const savedItemType: SavedItemType = affiliateUrls?.omioUrl ? "train" : "transfer";

      if (!url) return Alert.alert("Not ready", "We need a city + dates saved to build booking links.");

      return openTrackedPartner({
        partnerId,
        url,
        savedItemType,
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
      { key: "tickets" as const, label: "Tickets", state: progress.tickets, onPress: openOrExplainTickets },
      { key: "flight" as const, label: "Flights", state: progress.flight, onPress: openFlights },
      { key: "hotel" as const, label: "Hotel", state: progress.hotel, onPress: openHotels },
      {
        key: "transfer" as const,
        label: affiliateUrls?.omioUrl ? "Rail/Bus" : "Transfer",
        state: progress.transfer,
        onPress: openTransfers,
      },
      { key: "things" as const, label: "Things", state: progress.things, onPress: openThings },
    ];
  }, [affiliateUrls, cityName, originIata, primaryMatchId, trip?.startDate, trip?.endDate, progress]);

  const nextAction = useMemo<NextAction | null>(() => {
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
        onPress: affiliateUrls?.omioUrl
          ? () =>
              openTrackedPartner({
                partnerId: "omio" as PartnerId,
                url: affiliateUrls.omioUrl!,
                savedItemType: "train",
                title: `Trains & buses in ${cityName}`,
                metadata: {
                  city: cityName,
                  startDate: trip?.startDate,
                  endDate: trip?.endDate,
                  priceMode: "live",
                  transportMode: "rail_bus",
                },
              })
          : () =>
              openTrackedPartner({
                partnerId: "kiwitaxi" as PartnerId,
                url: affiliateUrls?.transfersUrl || "",
                savedItemType: "transfer",
                title: `Transfers in ${cityName}`,
                metadata: {
                  city: cityName,
                  startDate: trip?.startDate,
                  endDate: trip?.endDate,
                  priceMode: "live",
                  transportMode: "transfer",
                },
              }),
      };
    }

    if (!hasThings) {
      return {
        title: "Trip is covered — add experiences if they help",
        body: "Core planning is done. Anything else should improve the trip, not clutter it.",
        cta: "View activities",
        onPress: () =>
          openTrackedPartner({
            partnerId: "getyourguide" as PartnerId,
            url: affiliateUrls?.experiencesUrl || "",
            savedItemType: "things",
            title: `Experiences in ${cityName}`,
            metadata: { city: cityName, priceMode: "live" },
          }),
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
    affiliateUrls,
    cityName,
    hasFlight,
    hasHotel,
    hasMatch,
    hasThings,
    hasTickets,
    hasTransport,
    kickoffMeta.tbc,
    originIata,
    primaryMatchId,
    trip?.startDate,
    trip?.endDate,
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
        savedItemType: "train",
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
      add("Rail / Bus", "Omio (live)", openOmio, "neutral", "omio");
    } else if (!hasTransport) {
      add("Transfers", "Kiwitaxi (live)", openTransfers, "neutral", "kiwitaxi");
    }
    if (!hasThings) add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");

    if (btns.length === 0) {
      add("Hotels", "Expedia (live)", openHotels, "primary", "expedia");
      if (affiliateUrls.omioUrl) add("Rail / Bus", "Omio (live)", openOmio, "neutral", "omio");
      else add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");
    }

    return btns.slice(0, 4);
  }, [
    affiliateUrls,
    trip,
    cityName,
    originIata,
    primaryMatchId,
    primaryTicketItem,
    hasTickets,
    hasFlight,
    hasHotel,
    hasTransport,
    hasThings,
  ]);

  const loading = Boolean(routeTripId && (!tripsLoaded || !savedLoaded || !workspaceLoaded));
  const showHeroBanners = pending.length > 0 || saved.length > 0 || booked.length > 0;

  function renderWorkspaceItem(item: SavedItem) {
    const lp = livePriceLine(item);
    const provider = ticketProviderFromItem(item);
    const proofText = proofStateText(item);
    const missingProof = item.status === "booked" && !hasProof(item);
    const proofBusy = proofBusyId === item.id;
    const isNote = item.type === "note" || item.type === "other";

    return (
      <View key={item.id} style={styles.itemRow}>
        <Pressable style={{ flex: 1 }} onPress={() => (isNote ? openNoteActions(item) : openSavedItem(item))}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <StatusBadge s={item.status} />
          </View>

          <View style={styles.itemMetaRow}>
            {provider ? <ProviderBadge provider={provider} size="sm" /> : null}
            <Text style={styles.itemMeta} numberOfLines={1}>
              {isNote ? "Notes" : buildMetaLine(item)}
            </Text>
          </View>

          {lp ? (
            <Text style={item.status === "booked" ? styles.paidLine : styles.livePriceLine} numberOfLines={1}>
              {lp}
            </Text>
          ) : null}

          {item.status === "booked" ? (
            <Text style={[styles.proofLine, missingProof ? styles.proofLineMissing : undefined]} numberOfLines={1}>
              {proofText}
            </Text>
          ) : null}
        </Pressable>

        <View style={styles.itemActions}>
          {item.status !== "booked" ? (
            <Pressable onPress={() => confirmMarkBooked(item)} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Booked</Text>
            </Pressable>
          ) : missingProof ? (
            <Pressable
              onPress={() => addProofForBookedItem(item)}
              style={[styles.smallBtn, styles.smallBtnPrimary, proofBusy && styles.smallBtnDisabled]}
              disabled={proofBusy}
            >
              <Text style={styles.smallBtnText}>{proofBusy ? "Adding…" : "Add proof"}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onViewWallet} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Wallet</Text>
            </Pressable>
          )}

          {item.status === "saved" ? (
            <Pressable onPress={() => confirmMoveToPending(item)} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Pending</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={() => confirmArchive(item)} style={[styles.smallBtn, styles.smallBtnDanger]}>
            <Text style={styles.smallBtnText}>Archive</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderSectionContent(sectionKey: WorkspaceSectionKey) {
    const items = groupedBySection[sectionKey] ?? [];

    if (sectionKey === "tickets") {
      return (
        <>
          {primaryMatchId ? (
            <Pressable onPress={() => openTicketsForMatch(primaryMatchId)} style={styles.sectionCta}>
              <Text style={styles.sectionCtaTitle}>Open live ticket options</Text>
              <Text style={styles.sectionCtaBody}>
                Compare providers for the primary match and save the route into the workspace.
              </Text>
            </Pressable>
          ) : (
            <EmptyState title="No match selected" message="Add a match first to unlock ticket planning." />
          )}

          {items.length > 0 ? <View style={{ gap: 10 }}>{items.map(renderWorkspaceItem)}</View> : null}
        </>
      );
    }

    if (sectionKey === "stay") {
      return (
        <>
          {affiliateUrls?.hotelsUrl ? (
            <Pressable
              onPress={() =>
                openTrackedPartner({
                  partnerId: "expedia" as PartnerId,
                  url: affiliateUrls.hotelsUrl!,
                  savedItemType: "hotel",
                  title: `Hotels in ${cityName}`,
                  metadata: { city: cityName, startDate: trip?.startDate, endDate: trip?.endDate, priceMode: "live" },
                })
              }
              style={styles.sectionCta}
            >
              <Text style={styles.sectionCtaTitle}>Open live stays</Text>
              <Text style={styles.sectionCtaBody}>
                Use the stay guidance below to avoid booking a cheap place in a useless area.
              </Text>
            </Pressable>
          ) : null}

          {stayBestAreas.length > 0 || stayBudgetAreas.length > 0 ? (
            <View style={styles.guidanceMiniBox}>
              <Text style={styles.guidanceMiniTitle}>Area shortlist</Text>
              {stayBestAreas.slice(0, 2).map((x, idx) => (
                <Text key={`stay-best-${idx}`} style={styles.guidanceMiniLine}>
                  • {x.area}
                  {x.notes ? ` — ${x.notes}` : ""}
                </Text>
              ))}
              {stayBudgetAreas.slice(0, 2).map((x, idx) => (
                <Text key={`stay-budget-${idx}`} style={styles.guidanceMiniLine}>
                  • {x.area}
                  {x.notes ? ` — ${x.notes}` : ""}
                </Text>
              ))}
            </View>
          ) : null}

          {items.length > 0 ? (
            <View style={{ gap: 10 }}>{items.map(renderWorkspaceItem)}</View>
          ) : (
            <EmptyState title="No stay items yet" message="Save hotels here so the trip isn’t just a vague idea." />
          )}
        </>
      );
    }

    if (sectionKey === "travel") {
      return (
        <>
          <View style={styles.sectionActionRow}>
            {affiliateUrls?.flightsUrl ? (
              <Pressable
                onPress={() =>
                  openTrackedPartner({
                    partnerId: "aviasales" as PartnerId,
                    url: affiliateUrls.flightsUrl!,
                    savedItemType: "flight",
                    title: `Flights to ${cityName}`,
                    metadata: { city: cityName, originIata: cleanUpper3(originIata, "LON"), priceMode: "live" },
                  })
                }
                style={[styles.smallActionBtn, styles.smallActionBtnPrimary]}
              >
                <Text style={styles.smallActionBtnText}>Flights</Text>
              </Pressable>
            ) : null}

            {affiliateUrls?.omioUrl ? (
              <Pressable
                onPress={() =>
                  openTrackedPartner({
                    partnerId: "omio" as PartnerId,
                    url: affiliateUrls.omioUrl!,
                    savedItemType: "train",
                    title: `Trains & buses in ${cityName}`,
                    metadata: {
                      city: cityName,
                      startDate: trip?.startDate,
                      endDate: trip?.endDate,
                      priceMode: "live",
                      transportMode: "rail_bus",
                    },
                  })
                }
                style={styles.smallActionBtn}
              >
                <Text style={styles.smallActionBtnText}>Rail / Bus</Text>
              </Pressable>
            ) : null}
          </View>

          {items.length > 0 ? (
            <View style={{ gap: 10 }}>{items.map(renderWorkspaceItem)}</View>
          ) : (
            <EmptyState title="No travel items yet" message="Flights or rail should live here, not in your head." />
          )}
        </>
      );
    }

    if (sectionKey === "transfers") {
      return (
        <>
          {affiliateUrls?.transfersUrl ? (
            <Pressable
              onPress={() =>
                openTrackedPartner({
                  partnerId: "kiwitaxi" as PartnerId,
                  url: affiliateUrls.transfersUrl!,
                  savedItemType: "transfer",
                  title: `Transfers in ${cityName}`,
                  metadata: { city: cityName, startDate: trip?.startDate, endDate: trip?.endDate, priceMode: "live" },
                })
              }
              style={styles.sectionCta}
            >
              <Text style={styles.sectionCtaTitle}>Open transfer options</Text>
              <Text style={styles.sectionCtaBody}>
                Sort airport-to-city and city-to-stadium movement before it becomes a pain.
              </Text>
            </Pressable>
          ) : null}

          {transportStops.length > 0 ? (
            <View style={styles.guidanceMiniBox}>
              <Text style={styles.guidanceMiniTitle}>Useful transport stops</Text>
              {transportStops.map((line, idx) => (
                <Text key={`transport-stop-${idx}`} style={styles.guidanceMiniLine}>
                  • {line}
                </Text>
              ))}
            </View>
          ) : null}

          {items.length > 0 ? (
            <View style={{ gap: 10 }}>{items.map(renderWorkspaceItem)}</View>
          ) : (
            <EmptyState title="No transfer items yet" message="This is where local movement should be sorted." />
          )}
        </>
      );
    }

    if (sectionKey === "things") {
      return (
        <>
          {affiliateUrls?.experiencesUrl ? (
            <Pressable
              onPress={() =>
                openTrackedPartner({
                  partnerId: "getyourguide" as PartnerId,
                  url: affiliateUrls.experiencesUrl!,
                  savedItemType: "things",
                  title: `Experiences in ${cityName}`,
                  metadata: { city: cityName, priceMode: "live" },
                })
              }
              style={styles.sectionCta}
            >
              <Text style={styles.sectionCtaTitle}>Open activities</Text>
              <Text style={styles.sectionCtaBody}>
                Only add things that genuinely improve the trip. Don’t clutter it with filler.
              </Text>
            </Pressable>
          ) : null}

          {items.length > 0 ? (
            <View style={{ gap: 10 }}>{items.map(renderWorkspaceItem)}</View>
          ) : (
            <EmptyState title="No things saved yet" message="This section is optional, but useful when it earns its place." />
          )}
        </>
      );
    }

    if (sectionKey === "insurance") {
      return items.length > 0 ? (
        <View style={{ gap: 10 }}>{items.map(renderWorkspaceItem)}</View>
      ) : (
        <EmptyState title="No insurance saved yet" message="Use this section for cover and policy records." />
      );
    }

    if (sectionKey === "claims") {
      return items.length > 0 ? (
        <View style={{ gap: 10 }}>{items.map(renderWorkspaceItem)}</View>
      ) : (
        <EmptyState title="No claim items yet" message="Use this section for compensation, refund and delay evidence." />
      );
    }

    return (
      <>
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

        {items.length > 0 ? (
          <View style={{ gap: 10, marginTop: 10 }}>{items.map(renderWorkspaceItem)}</View>
        ) : (
          <View style={{ marginTop: 10 }}>
            <EmptyState title="No notes yet" message="Notes you save for this trip appear here." />
          </View>
        )}
      </>
    );
  }

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
          {!routeTripId && (
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

              <TripMatchesCard
                trip={trip}
                numericMatchIds={numericMatchIds}
                primaryMatchId={primaryMatchId}
                fixturesById={fixturesById}
                ticketsByMatchId={ticketsByMatchId}
                fxLoading={fxLoading}
                onAddMatch={onAddMatch}
                onOpenTicketsForMatch={openTicketsForMatch}
                onOpenMatchActions={openMatchActions}
                onSetPrimaryMatch={setPrimaryMatch}
                onRemoveMatch={removeMatch}
                getTicketProviderFromItem={ticketProviderFromItem}
                getTicketScoreFromItem={itemResolvedScore}
                getLivePriceLine={livePriceLine}
              />

              <GlassCard style={styles.card}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Workspace</Text>
                  <Text style={styles.sectionSub}>{workspaceSnapshot.activeTotal} active items</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workspaceTabsRow}>
                  {sectionOrder.map((sectionKey) => {
                    const total = workspaceSnapshot.sectionActiveTotals[sectionKey] ?? 0;
                    const selected = activeSection === sectionKey;

                    return (
                      <Pressable
                        key={sectionKey}
                        onPress={() => setActiveWorkspaceSection(sectionKey)}
                        style={[styles.workspaceTab, selected && styles.workspaceTabActive]}
                      >
                        <Text style={[styles.workspaceTabTitle, selected && styles.workspaceTabTitleActive]}>
                          {WORKSPACE_SECTIONS[sectionKey].title}
                        </Text>
                        <Text style={[styles.workspaceTabSub, selected && styles.workspaceTabSubActive]}>
                          {sectionStateLabel(sectionKey, total)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={{ gap: 10 }}>
                  {sectionOrder.map((sectionKey) => {
                    const section = WORKSPACE_SECTIONS[sectionKey];
                    const total = workspaceSnapshot.sectionActiveTotals[sectionKey] ?? 0;
                    const collapsed = Boolean(workspace?.collapsed?.[sectionKey]);
                    const selected = activeSection === sectionKey;

                    if (!selected) return null;

                    return (
                      <View key={sectionKey} style={styles.workspaceSection}>
                        <Pressable onPress={() => toggleWorkspaceSection(sectionKey)} style={styles.workspaceSectionHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.workspaceSectionTitle}>{section.title}</Text>
                            <Text style={styles.workspaceSectionSub}>
                              {section.subtitle || sectionStateLabel(sectionKey, total)}
                            </Text>
                          </View>

                          <View style={styles.workspaceHeaderRight}>
                            <View style={styles.workspaceCountPill}>
                              <Text style={styles.workspaceCountText}>{total}</Text>
                            </View>
                            <Text style={styles.chev}>{collapsed ? "›" : "⌄"}</Text>
                          </View>
                        </Pressable>

                        {!collapsed ? <View style={{ marginTop: 10 }}>{renderSectionContent(sectionKey)}</View> : null}
                      </View>
                    );
                  })}
                </View>
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

  workspaceTabsRow: {
    paddingRight: 8,
    gap: 10,
  },

  workspaceTab: {
    minWidth: 114,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  workspaceTabActive: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.24)",
  },

  workspaceTabTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  workspaceTabTitleActive: {
    color: theme.colors.text,
  },

  workspaceTabSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 11,
  },

  workspaceTabSubActive: {
    color: theme.colors.textTertiary,
  },

  workspaceSection: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 16,
    padding: 12,
  },

  workspaceSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  workspaceHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  workspaceCountPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  workspaceCountText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  workspaceSectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 15,
  },

  workspaceSectionSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },

  sectionCta: {
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.22)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  sectionCtaTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
  },

  sectionCtaBody: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  sectionActionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  smallActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  smallActionBtnPrimary: {
    borderColor: "rgba(0,255,136,0.35)",
  },

  smallActionBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  guidanceMiniBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },

  guidanceMiniTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  guidanceMiniLine: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

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

  proofLine: {
    marginTop: 6,
    color: "rgba(160,195,255,1)",
    fontSize: 12,
    fontWeight: "900",
  },

  proofLineMissing: {
    color: "rgba(255,200,80,1)",
  },

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

  mapsInline: { marginTop: 10, color: theme.colors.textSecondary, textAlign: "center", fontWeight: "900" },

  chev: { color: theme.colors.textSecondary, fontSize: 22, marginTop: -2 },
});
