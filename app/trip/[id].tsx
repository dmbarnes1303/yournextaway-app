// app/trip/[id].tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";

// dev-only IATA detection
import { getIataCityCodeForCity, debugCityKey } from "@/src/data/iataCityCodes";

// matchday logistics (areas + stadium metadata)
import { getMatchdayLogistics, buildLogisticsSnippet } from "@/src/data/matchdayLogistics";

/* -------------------------------------------------------------------------- */
/* small helpers */
/* -------------------------------------------------------------------------- */

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

function safeTypeLabel(type: SavedItemType) {
  try {
    return getSavedItemTypeLabel(type);
  } catch {
    return "Notes";
  }
}

function safePartnerName(item: SavedItem) {
  if (!item.partnerId) return null;
  try {
    return getPartner(item.partnerId).name;
  } catch {
    return null;
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
  const home = String(r?.teams?.home?.name ?? "").trim() || String((trip as any)?.homeName ?? "").trim();
  const away = String(r?.teams?.away?.name ?? "").trim() || String((trip as any)?.awayName ?? "").trim();
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

function formatKickoffMeta(
  row?: FixtureListRow | null,
  trip?: Trip | null
): { line: string; tbc: boolean; iso: string | null } {
  const isoRaw = (row?.fixture?.date as any) ?? (trip as any)?.kickoffIso;
  const iso = String(isoRaw ?? "").trim() || null;

  const d = parseIsoToDate(iso);

  const short = String(row?.fixture?.status?.short ?? "").trim().toUpperCase();
  const long = String(row?.fixture?.status?.long ?? "").trim();

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
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
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

function statusLabel(s: SavedItem["status"]) {
  if (s === "pending") return "Pending";
  if (s === "saved") return "Saved";
  if (s === "booked") return "Booked";
  return "Archived";
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

function stepState(items: SavedItem[], types: SavedItemType[]) {
  const relevant = items.filter((x) => types.includes(x.type));
  const booked = relevant.filter((x) => x.status === "booked").length;
  const pending = relevant.filter((x) => x.status === "pending").length;
  const saved = relevant.filter((x) => x.status === "saved").length;

  if (booked > 0) return { state: "booked" as const, label: "Booked", count: booked };
  if (pending > 0) return { state: "pending" as const, label: "Pending", count: pending };
  if (saved > 0) return { state: "saved" as const, label: "Saved", count: saved };
  return { state: "none" as const, label: "Not started", count: 0 };
}

/* -------------------------------------------------------------------------- */
/* screen */
/* -------------------------------------------------------------------------- */

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

  // Calmness controls (default collapsed)
  const [showStayDetails, setShowStayDetails] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

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

  /* ---------------- fixtures enrichment ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const idsRaw = Array.isArray(trip?.matchIds) ? trip!.matchIds : [];
      const ids = idsRaw.map((x) => String(x).trim()).filter(Boolean);
      const numericIds = ids.filter(isNumericId);

      if (numericIds.length === 0) {
        setFixturesById({});
        setFxLoading(false);
        return;
      }

      setFxLoading(true);

      try {
        const map: Record<string, FixtureListRow> = {};
        for (const id of numericIds) {
          try {
            const r = await getFixtureById(String(id));
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
  }, [trip?.matchIds]);

  /* ---------------- derived ---------------- */

  const loading = Boolean(tripId && (!tripsLoaded || !savedLoaded));
  const status = useMemo(() => (trip ? tripStatus(trip) : "Upcoming"), [trip]);

  const cityNameRaw = useMemo(() => {
    const snapCity = String((trip as any)?.displayCity ?? "").trim();
    if (snapCity) return snapCity;

    const snapVenueCity = String((trip as any)?.city ?? "").trim();
    if (snapVenueCity) return snapVenueCity;

    if (trip?.cityId) return trip.cityId;

    const first = trip?.matchIds?.[0];
    return fixturesById[String(first ?? "")]?.fixture?.venue?.city || "Trip";
  }, [trip, fixturesById]);

  const cityName = useMemo(() => titleCaseCity(cityNameRaw), [cityNameRaw]);

  const matchIds = useMemo(() => {
    const raw = Array.isArray(trip?.matchIds) ? trip!.matchIds : [];
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }, [trip?.matchIds]);

  const numericMatchIds = useMemo(() => matchIds.filter(isNumericId), [matchIds]);
  const primaryMatchId = useMemo(() => numericMatchIds[0] ?? null, [numericMatchIds]);
  const primaryFixture = useMemo(() => (primaryMatchId ? fixturesById[String(primaryMatchId)] ?? null : null), [
    primaryMatchId,
    fixturesById,
  ]);

  const homeName = useMemo(() => {
    const fromFixture = String(primaryFixture?.teams?.home?.name ?? "").trim();
    if (fromFixture) return fromFixture;
    return String((trip as any)?.homeName ?? "").trim();
  }, [primaryFixture, trip]);

  const awayName = useMemo(() => {
    const fromFixture = String(primaryFixture?.teams?.away?.name ?? "").trim();
    if (fromFixture) return fromFixture;
    return String((trip as any)?.awayName ?? "").trim();
  }, [primaryFixture, trip]);

  const leagueName = useMemo(() => {
    const fromFixture = String(primaryFixture?.league?.name ?? "").trim();
    if (fromFixture) return fromFixture;
    return String((trip as any)?.leagueName ?? "").trim();
  }, [primaryFixture, trip]);

  const venueName = useMemo(() => {
    const fromFixture = String(primaryFixture?.fixture?.venue?.name ?? "").trim();
    if (fromFixture) return fromFixture;
    return String((trip as any)?.venueName ?? "").trim();
  }, [primaryFixture, trip]);

  const venueCity = useMemo(() => {
    const fromFixture = String(primaryFixture?.fixture?.venue?.city ?? "").trim();
    if (fromFixture) return fromFixture;
    return String((trip as any)?.displayCity ?? "").trim() || cityName;
  }, [primaryFixture, trip, cityName]);

  const kickoffMeta = useMemo(() => formatKickoffMeta(primaryFixture, trip), [primaryFixture, trip]);

  const certainty = useMemo(() => {
    if (!primaryFixture) return null;
    return getFixtureCertainty(primaryFixture, { previousKickoffIso: (trip as any)?.kickoffIso ?? null });
  }, [primaryFixture, trip]);

  const bookingLinks = useMemo(() => {
    if (!trip || !cityName || cityName === "Trip") return null;

    return buildAffiliateLinks({
      city: cityName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      originIata: cleanUpper3(originIata, "LON"),
    });
  }, [trip, cityName, originIata]);

  const notes = useMemo(() => savedItems.filter((x) => x.type === "note" && x.status !== "archived"), [savedItems]);
  const pending = useMemo(() => savedItems.filter((x) => x.status === "pending"), [savedItems]);
  const booked = useMemo(() => savedItems.filter((x) => x.status === "booked"), [savedItems]);

  const ticketsStep = useMemo(() => stepState(savedItems, ["tickets"]), [savedItems]);
  const flightsStep = useMemo(() => stepState(savedItems, ["flight", "train", "transfer"]), [savedItems]);
  const stayStep = useMemo(() => stepState(savedItems, ["hotel"]), [savedItems]);
  const thingsStep = useMemo(() => stepState(savedItems, ["things"]), [savedItems]);
  const insuranceStep = useMemo(() => stepState(savedItems, ["insurance", "claim"]), [savedItems]);

  /* ---------------- matchday logistics (stay guidance) ---------------- */

  const primaryLogistics = useMemo(() => {
    if (!homeName) return null;
    return getMatchdayLogistics({ homeTeamName: homeName, leagueName });
  }, [homeName, leagueName]);

  const primaryLogisticsSnippet = useMemo(() => (primaryLogistics ? buildLogisticsSnippet(primaryLogistics) : ""), [
    primaryLogistics,
  ]);

  const stadiumName = useMemo(() => String(primaryLogistics?.stadium ?? venueName ?? "").trim(), [primaryLogistics, venueName]);
  const stadiumCity = useMemo(() => String(primaryLogistics?.city ?? venueCity ?? "").trim(), [primaryLogistics, venueCity]);

  const stadiumMapsUrl = useMemo(() => {
    const q = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
    return buildMapsSearchUrl(q);
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo(() => {
    const arr = Array.isArray(primaryLogistics?.stay?.bestAreas) ? primaryLogistics!.stay!.bestAreas : [];
    return arr
      .map((x: any) => ({
        area: String(x?.area ?? "").trim(),
        notes: String(x?.notes ?? "").trim(),
      }))
      .filter((x: any) => x.area);
  }, [primaryLogistics]);

  const stayBudgetAreas = useMemo(() => {
    const arr = Array.isArray(primaryLogistics?.stay?.budgetAreas) ? primaryLogistics!.stay!.budgetAreas : [];
    return arr
      .map((x: any) => ({
        area: String(x?.area ?? "").trim(),
        notes: String(x?.notes ?? "").trim(),
      }))
      .filter((x: any) => x.area);
  }, [primaryLogistics]);

  /* ---------------- dev-only IATA warning ---------------- */

  useEffect(() => {
    // @ts-ignore
    const isDev = typeof __DEV__ !== "undefined" && __DEV__;
    if (!isDev) return;

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

  /* -------------------------------------------------------------------------- */
  /* navigation + link openers */
  /* -------------------------------------------------------------------------- */

  const onEditTrip = useCallback(() => {
    if (!trip) return;
    router.push({ pathname: "/trip/build", params: { tripId: trip.id } } as any);
  }, [router, trip]);

  const onViewWallet = useCallback(() => {
    router.push("/(tabs)/wallet" as any);
  }, [router]);

  const openMatch = useCallback(
    (matchId: string) => {
      if (!matchId) return;

      const r = fixturesById[String(matchId)];
      const leagueId = r?.league?.id != null ? String(r.league.id) : undefined;
      const season = (r as any)?.league?.season != null ? String((r as any).league.season) : undefined;

      const from = trip?.startDate ? String(trip.startDate) : undefined;
      const to = trip?.endDate ? String(trip.endDate) : undefined;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: String(matchId),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
        },
      } as any);
    },
    [fixturesById, router, trip?.startDate, trip?.endDate]
  );

  const openUntracked = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open link");
    }
  }, []);

  const openTrackedPartner = useCallback(
    async (args: {
      partnerId: PartnerId;
      url: string;
      title: string;
      savedItemType?: SavedItemType;
      metadata?: Record<string, any>;
    }) => {
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
    },
    [openUntracked, tripId]
  );

  /* -------------------------------------------------------------------------- */
  /* saved item actions */
  /* -------------------------------------------------------------------------- */

  const openSavedItem = useCallback(
    async (item: SavedItem) => {
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
    },
    [openUntracked, tripId]
  );

  const archiveItem = useCallback(async (item: SavedItem) => {
    try {
      await savedItemsStore.transitionStatus(item.id, "archived");
    } catch {
      Alert.alert("Couldn’t archive", "That item can’t be archived right now.");
    }
  }, []);

  const moveToPending = useCallback(async (item: SavedItem) => {
    try {
      await savedItemsStore.transitionStatus(item.id, "pending");
    } catch {
      Alert.alert("Couldn’t move", "That item can’t be moved right now.");
    }
  }, []);

  const markBookedSmart = useCallback(async (item: SavedItem) => {
    try {
      await savedItemsStore.transitionStatus(item.id, "booked");
      defer(() => {
        confirmBookedAndOfferProof(item.id).catch(() => null);
      });
    } catch {
      Alert.alert("Couldn’t mark booked", "That item can’t be marked booked right now.");
    }
  }, []);

  const confirmArchive = useCallback(
    (item: SavedItem) => {
      Alert.alert("Archive this item?", "Archived items are hidden from the trip workspace.", [
        { text: "Cancel", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ]);
    },
    [archiveItem]
  );

  const confirmMarkBooked = useCallback(
    (item: SavedItem) => {
      Alert.alert("Mark as booked?", "Only do this if you completed the booking and want it in Wallet.", [
        { text: "Cancel", style: "cancel" },
        { text: "Mark booked", style: "default", onPress: () => markBookedSmart(item) },
      ]);
    },
    [markBookedSmart]
  );

  const confirmMoveToPending = useCallback(
    (item: SavedItem) => {
      Alert.alert(
        "Move to Pending?",
        "Use Pending when you’re not sure if you booked it yet (so we’ll ask on return next time you open a partner).",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Move", style: "default", onPress: () => moveToPending(item) },
        ]
      );
    },
    [moveToPending]
  );

  const addNote = useCallback(async () => {
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
      });

      setNoteText("");
      Keyboard.dismiss();
    } catch {
      Alert.alert("Couldn’t save note");
    } finally {
      setNoteSaving(false);
    }
  }, [noteText, tripId]);

  const openNoteActions = useCallback(
    (item: SavedItem) => {
      const text = String(item.metadata?.text ?? "").trim();
      Alert.alert(
        item.title || "Notes",
        text || "No details saved.",
        [{ text: "Close", style: "cancel" }, { text: "Archive", style: "destructive", onPress: () => archiveItem(item) }],
        { cancelable: true }
      );
    },
    [archiveItem]
  );

  /* -------------------------------------------------------------------------- */
  /* calm itinerary (minimal) */
  /* -------------------------------------------------------------------------- */

  const itineraryLines = useMemo(() => {
    const a = trip?.startDate ? parseIsoDateOnly(trip.startDate) : null;
    const b = trip?.endDate ? parseIsoDateOnly(trip.endDate) : null;
    const lines: string[] = [];

    if (a) lines.push(`Arrival: ${a.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}`);
    if (kickoffMeta?.iso) {
      lines.push(kickoffMeta.tbc ? "Match: Kickoff TBC (follow for updates)" : kickoffMeta.line.replace(/^Kickoff:\s*/i, "Match: "));
    } else {
      lines.push("Match: Add a match to anchor your plan");
    }
    if (b) lines.push(`Departure: ${b.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}`);

    // Always cap at 3 lines; this is intentionally not a timeline screen.
    return lines.slice(0, 3);
  }, [trip?.startDate, trip?.endDate, kickoffMeta]);

  /* -------------------------------------------------------------------------- */
  /* render */
  /* -------------------------------------------------------------------------- */

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
              {/* 1) Trip header (anchor) */}
              <GlassCard style={styles.hero}>
                <View style={styles.heroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>TRIP WORKSPACE</Text>
                    <Text style={styles.cityTitle}>{cityName}</Text>
                    <Text style={styles.heroMeta}>{summaryLine(trip)}</Text>
                  </View>

                  <View style={styles.heroRight}>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{status}</Text>
                    </View>

                    <Pressable onPress={onViewWallet} style={styles.walletBtn}>
                      <Text style={styles.walletBtnText}>Wallet ›</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.heroDivider} />

                {/* Match anchor (single, calm) */}
                {primaryMatchId ? (
                  <Pressable onPress={() => openMatch(primaryMatchId)} style={styles.matchAnchor}>
                    <TeamCrest name={homeName || "Home"} logo={primaryFixture?.teams?.home?.logo} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.matchTitle} numberOfLines={1}>
                        {safeFixtureTitle(primaryFixture, primaryMatchId, trip)}
                      </Text>
                      <Text style={styles.matchMeta} numberOfLines={1}>
                        {kickoffMeta.line}
                      </Text>
                      <Text style={styles.matchMetaSecondary} numberOfLines={1}>
                        {[leagueName || null, venueName || null, venueCity || null].filter(Boolean).join(" • ") || "Match details"}
                      </Text>

                      {certainty ? (
                        <View style={{ marginTop: 8 }}>
                          <FixtureCertaintyBadge state={certainty} />
                        </View>
                      ) : null}
                    </View>
                    <TeamCrest name={awayName || "Away"} logo={primaryFixture?.teams?.away?.logo} />
                    <Text style={styles.chev}>›</Text>
                  </Pressable>
                ) : (
                  <View style={styles.matchAnchorEmpty}>
                    <EmptyState title="Add a match" message="This trip needs a match to unlock match-specific planning." />
                    <Pressable onPress={onEditTrip} style={[styles.cta, styles.ctaPrimary]}>
                      <Text style={styles.ctaPrimaryText}>Add / change match</Text>
                    </Pressable>
                  </View>
                )}

                {/* Primary CTA logic (don’t push risky booking if kickoff is TBC) */}
                {primaryMatchId ? (
                  <View style={styles.heroCtas}>
                    <Pressable
                      onPress={() => openMatch(primaryMatchId)}
                      style={[styles.cta, styles.ctaPrimary]}
                    >
                      <Text style={styles.ctaPrimaryText}>
                        {kickoffMeta.tbc ? "Open match (follow for kickoff alerts)" : "Open match (tickets + alerts)"}
                      </Text>
                    </Pressable>

                    <View style={styles.heroCtasRow}>
                      <Pressable
                        onPress={() => setShowBookings(true)}
                        style={[styles.cta, styles.ctaSecondary]}
                      >
                        <Text style={styles.ctaSecondaryText}>Bookings</Text>
                        <Text style={styles.ctaSecondarySub}>
                          {booked.length > 0 ? `${booked.length} booked` : pending.length > 0 ? `${pending.length} pending` : "None yet"}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setShowStayDetails((v) => !v)}
                        style={[styles.cta, styles.ctaSecondary]}
                      >
                        <Text style={styles.ctaSecondaryText}>Stay guidance</Text>
                        <Text style={styles.ctaSecondarySub}>
                          {primaryLogistics ? "Best areas + maps" : "Match required"}
                        </Text>
                      </Pressable>
                    </View>

                    {!originLoaded ? <Text style={styles.mutedInline}>Loading departure preference…</Text> : null}
                  </View>
                ) : null}
              </GlassCard>

              {/* 2) Next steps pipeline (conversion engine) */}
              <GlassCard style={styles.card}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Next steps</Text>
                  <Text style={styles.sectionSub}>Simple, in order. Tap to act.</Text>
                </View>

                <View style={{ gap: 10 }}>
                  {/* Tickets */}
                  <Pressable
                    onPress={() => (primaryMatchId ? openMatch(primaryMatchId) : onEditTrip())}
                    style={styles.stepRow}
                  >
                    <View style={styles.stepLeft}>
                      <Text style={styles.stepTitle}>Tickets</Text>
                      <Text style={styles.stepHint} numberOfLines={1}>
                        {kickoffMeta.tbc ? "Kickoff TBC — follow for updates first" : "Most important booking for match-centric trips"}
                      </Text>
                    </View>
                    <View style={styles.stepRight}>
                      <StatusBadge s={ticketsStep.state === "none" ? "saved" : (ticketsStep.state as any)} />
                      <Text style={styles.stepCount}>{ticketsStep.label}</Text>
                      <Text style={styles.chev}>›</Text>
                    </View>
                  </Pressable>

                  {/* Flights */}
                  <View style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <Text style={styles.stepTitle}>Flights</Text>
                      <Text style={styles.stepHint} numberOfLines={1}>
                        Set a baseline now. Book when kickoff feels safe.
                      </Text>
                    </View>

                    <View style={styles.stepRight}>
                      <StatusBadge s={flightsStep.state === "none" ? "saved" : (flightsStep.state as any)} />
                      <Text style={styles.stepCount}>{flightsStep.label}</Text>
                    </View>

                    <Pressable
                      disabled={!bookingLinks || !originLoaded}
                      onPress={() => {
                        if (!bookingLinks) return;
                        openTrackedPartner({
                          partnerId: "aviasales",
                          url: bookingLinks.flightsUrl,
                          savedItemType: "flight",
                          title: `Flights to ${cityName}`,
                          metadata: { city: cityName, originIata: cleanUpper3(originIata, "LON") },
                        });
                      }}
                      style={[styles.stepCta, (!bookingLinks || !originLoaded) && { opacity: 0.55 }]}
                    >
                      <Text style={styles.stepCtaText}>Find</Text>
                    </Pressable>
                  </View>

                  {/* Stay */}
                  <View style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <Text style={styles.stepTitle}>Stay</Text>
                      <Text style={styles.stepHint} numberOfLines={1}>
                        Choose an area first, then pick the hotel.
                      </Text>
                    </View>

                    <View style={styles.stepRight}>
                      <StatusBadge s={stayStep.state === "none" ? "saved" : (stayStep.state as any)} />
                      <Text style={styles.stepCount}>{stayStep.label}</Text>
                    </View>

                    <Pressable
                      disabled={!bookingLinks}
                      onPress={() => {
                        if (!bookingLinks) return;
                        openTrackedPartner({
                          partnerId: "expedia_stays",
                          url: bookingLinks.hotelsUrl,
                          savedItemType: "hotel",
                          title: `Hotels in ${cityName}`,
                          metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate },
                        });
                      }}
                      style={[styles.stepCta, !bookingLinks && { opacity: 0.55 }]}
                    >
                      <Text style={styles.stepCtaText}>Find</Text>
                    </Pressable>
                  </View>

                  {/* Things */}
                  <View style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <Text style={styles.stepTitle}>Things to do</Text>
                      <Text style={styles.stepHint} numberOfLines={1}>
                        Keep it simple: 1–2 great picks for the trip.
                      </Text>
                    </View>

                    <View style={styles.stepRight}>
                      <StatusBadge s={thingsStep.state === "none" ? "saved" : (thingsStep.state as any)} />
                      <Text style={styles.stepCount}>{thingsStep.label}</Text>
                    </View>

                    <Pressable
                      disabled={!bookingLinks}
                      onPress={() => {
                        if (!bookingLinks) return;
                        openTrackedPartner({
                          partnerId: "getyourguide",
                          url: bookingLinks.experiencesUrl,
                          savedItemType: "things",
                          title: `Experiences in ${cityName}`,
                          metadata: { city: cityName },
                        });
                      }}
                      style={[styles.stepCta, !bookingLinks && { opacity: 0.55 }]}
                    >
                      <Text style={styles.stepCtaText}>Find</Text>
                    </Pressable>
                  </View>

                  {/* Insurance/claims (optional) */}
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Insurance & claims",
                        "Phase 1: links + Wallet proof flow.\n\nWe’ll expand this into a dedicated section in Phase 2."
                      );
                    }}
                    style={styles.stepRow}
                  >
                    <View style={styles.stepLeft}>
                      <Text style={styles.stepTitle}>Insurance & claims</Text>
                      <Text style={styles.stepHint} numberOfLines={1}>
                        Useful later — keep it out of the way for now.
                      </Text>
                    </View>
                    <View style={styles.stepRight}>
                      <StatusBadge s={insuranceStep.state === "none" ? "saved" : (insuranceStep.state as any)} />
                      <Text style={styles.stepCount}>{insuranceStep.label}</Text>
                      <Text style={styles.chev}>›</Text>
                    </View>
                  </Pressable>
                </View>

                {fxLoading ? <Text style={styles.mutedInline}>Loading match details…</Text> : null}
              </GlassCard>

              {/* 3) Itinerary (minimal, calm) */}
              <GlassCard style={styles.card}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Itinerary</Text>
                  <Text style={styles.sectionSub}>A light structure (not a wall of text).</Text>
                </View>

                <View style={styles.itinBox}>
                  {itineraryLines.map((l, idx) => (
                    <Text key={idx} style={styles.itinLine}>
                      • {l}
                    </Text>
                  ))}
                </View>

                <Pressable
                  onPress={() =>
                    Alert.alert("Itinerary (Phase 1)", "We’ll add a dedicated itinerary editor screen once the spine is locked.")
                  }
                  style={[styles.cta, styles.ctaSecondary, { marginTop: 12 }]}
                >
                  <Text style={styles.ctaSecondaryText}>Edit itinerary</Text>
                  <Text style={styles.ctaSecondarySub}>Coming next</Text>
                </Pressable>
              </GlassCard>

              {/* 4) City essentials + Stay guidance (collapsed by default) */}
              <GlassCard style={styles.card}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>City essentials</Text>
                  <Text style={styles.sectionSub}>Quick actions that don’t overwhelm.</Text>
                </View>

                <View style={styles.quickGrid}>
                  <Pressable
                    style={styles.quickBtn}
                    onPress={() => bookingLinks && openUntracked(bookingLinks.mapsUrl)}
                    disabled={!bookingLinks}
                  >
                    <Text style={styles.quickTitle}>Maps</Text>
                    <Text style={styles.quickSub}>Search nearby</Text>
                  </Pressable>

                  <Pressable
                    style={styles.quickBtn}
                    onPress={() => {
                      if (!bookingLinks) return;
                      openTrackedPartner({
                        partnerId: "kiwitaxi",
                        url: bookingLinks.transfersUrl,
                        savedItemType: "transfer",
                        title: `Transfers in ${cityName}`,
                        metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate },
                      });
                    }}
                    disabled={!bookingLinks}
                  >
                    <Text style={styles.quickTitle}>Transfers</Text>
                    <Text style={styles.quickSub}>KiwiTaxi</Text>
                  </Pressable>

                  <Pressable
                    style={styles.quickBtn}
                    onPress={() => {
                      if (!bookingLinks) return;
                      openTrackedPartner({
                        partnerId: "getyourguide",
                        url: bookingLinks.experiencesUrl,
                        savedItemType: "things",
                        title: `Experiences in ${cityName}`,
                        metadata: { city: cityName },
                      });
                    }}
                    disabled={!bookingLinks}
                  >
                    <Text style={styles.quickTitle}>Experiences</Text>
                    <Text style={styles.quickSub}>GetYourGuide</Text>
                  </Pressable>

                  <Pressable style={styles.quickBtn} onPress={onEditTrip}>
                    <Text style={styles.quickTitle}>Trip</Text>
                    <Text style={styles.quickSub}>Edit dates</Text>
                  </Pressable>
                </View>

                {/* Stay guidance (accordion) */}
                <Pressable
                  onPress={() => setShowStayDetails((v) => !v)}
                  style={[styles.accordionHead, showStayDetails && styles.accordionHeadOpen]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accordionTitle}>Stay guidance (areas + stadium)</Text>
                    <Text style={styles.accordionSub} numberOfLines={1}>
                      {primaryLogisticsSnippet
                        ? primaryLogisticsSnippet
                        : primaryMatchId
                        ? "Stay tips loading or unavailable for this club yet"
                        : "Add a match to unlock stadium-area guidance"}
                    </Text>
                  </View>
                  <Text style={styles.accordionChevron}>{showStayDetails ? "–" : "+"}</Text>
                </Pressable>

                {showStayDetails ? (
                  <View style={{ marginTop: 12, gap: 12 }}>
                    <View style={styles.stadiumBox}>
                      <Text style={styles.stadiumTitle} numberOfLines={2}>
                        {stadiumName || "Stadium"}
                        {stadiumCity ? <Text style={styles.stadiumCity}> • {stadiumCity}</Text> : null}
                      </Text>

                      <Pressable
                        onPress={() => openUntracked(stadiumMapsUrl)}
                        style={[styles.cta, styles.ctaPrimary, { marginTop: 10 }]}
                        disabled={!stadiumMapsUrl}
                      >
                        <Text style={styles.ctaPrimaryText}>Open stadium in maps</Text>
                      </Pressable>

                      <Text style={styles.stadiumNote}>
                        Tip: distances depend on your exact hotel. Use Transit/Walk for real routes.
                      </Text>
                    </View>

                    {stayBestAreas.length > 0 ? (
                      <View style={{ gap: 8 }}>
                        <Text style={styles.smallSection}>Best areas</Text>
                        {stayBestAreas.slice(0, 3).map((x, idx) => {
                          const stadiumQ = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
                          const origin = [x.area, stadiumCity].filter(Boolean).join(" ").trim();
                          const dest = stadiumQ || stadiumName || "stadium";

                          return (
                            <View key={`best-${idx}`} style={styles.areaRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.areaName} numberOfLines={1}>
                                  {x.area}
                                </Text>
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
                      <View style={{ gap: 8 }}>
                        <Text style={styles.smallSection}>Budget-friendly</Text>
                        {stayBudgetAreas.slice(0, 2).map((x, idx) => {
                          const stadiumQ = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
                          const origin = [x.area, stadiumCity].filter(Boolean).join(" ").trim();
                          const dest = stadiumQ || stadiumName || "stadium";

                          return (
                            <View key={`budget-${idx}`} style={styles.areaRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.areaName} numberOfLines={1}>
                                  {x.area}
                                </Text>
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
                  </View>
                ) : null}
              </GlassCard>

              {/* 5) Bookings (merged, collapsible) */}
              <GlassCard style={styles.card}>
                <Pressable
                  onPress={() => setShowBookings((v) => !v)}
                  style={[styles.accordionHead, showBookings && styles.accordionHeadOpen]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accordionTitle}>Bookings</Text>
                    <Text style={styles.accordionSub} numberOfLines={1}>
                      {booked.length > 0
                        ? `${booked.length} booked in Wallet`
                        : pending.length > 0
                        ? `${pending.length} pending confirmation`
                        : "Nothing yet — partner clicks will appear here"}
                    </Text>
                  </View>
                  <Text style={styles.accordionChevron}>{showBookings ? "–" : "+"}</Text>
                </Pressable>

                {showBookings ? (
                  <View style={{ marginTop: 12, gap: 10 }}>
                    {pending.length === 0 && booked.length === 0 ? (
                      <EmptyState
                        title="No bookings yet"
                        message="When you open a partner link, we track it here until you confirm it’s booked."
                      />
                    ) : null}

                    {pending.length > 0 ? (
                      <View style={{ gap: 10 }}>
                        <Text style={styles.smallSection}>Pending</Text>
                        {pending.slice(0, 6).map((it) => (
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
                              {it.priceText ? (
                                <Text style={styles.priceLine} numberOfLines={1}>
                                  {it.priceText}
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
                        ))}
                      </View>
                    ) : null}

                    {booked.length > 0 ? (
                      <View style={{ gap: 10 }}>
                        <Text style={styles.smallSection}>Booked</Text>
                        {booked.slice(0, 6).map((it) => (
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
                              {it.priceText ? (
                                <Text style={styles.priceLine} numberOfLines={1}>
                                  {it.priceText}
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
                        ))}
                      </View>
                    ) : null}

                    {(pending.length > 6 || booked.length > 6) && (
                      <Pressable onPress={onViewWallet} style={[styles.cta, styles.ctaSecondary]}>
                        <Text style={styles.ctaSecondaryText}>View all in Wallet</Text>
                        <Text style={styles.ctaSecondarySub}>Proof + confirmations</Text>
                      </Pressable>
                    )}
                  </View>
                ) : null}
              </GlassCard>

              {/* 6) Notes (collapsed) */}
              <GlassCard style={styles.card}>
                <Pressable
                  onPress={() => setShowNotes((v) => !v)}
                  style={[styles.accordionHead, showNotes && styles.accordionHeadOpen]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accordionTitle}>Notes</Text>
                    <Text style={styles.accordionSub} numberOfLines={1}>
                      {notes.length > 0 ? `${notes.length} saved` : "Optional — keep it light"}
                    </Text>
                  </View>
                  <Text style={styles.accordionChevron}>{showNotes ? "–" : "+"}</Text>
                </Pressable>

                {showNotes ? (
                  <View style={{ marginTop: 12 }}>
                    <View style={styles.noteBox}>
                      <TextInput
                        value={noteText}
                        onChangeText={setNoteText}
                        placeholder="Add a note (shortlist, reminders, anything)…"
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
                        {notes.slice(0, 6).map((it) => (
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
                  </View>
                ) : null}
              </GlassCard>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* styles */
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
  mutedInline: { marginTop: 10, color: theme.colors.textSecondary, textAlign: "center", fontWeight: "800" },

  /* Hero */
  hero: { padding: theme.spacing.lg },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heroRight: { alignItems: "flex-end", gap: 10 },

  kicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs },
  cityTitle: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "900" },
  heroMeta: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800" },

  statusPill: {
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  walletBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  heroDivider: { marginTop: 14, height: 1, backgroundColor: "rgba(255,255,255,0.10)" },

  matchAnchor: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  matchAnchorEmpty: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  matchTitle: { color: theme.colors.text, fontWeight: "900" },

  matchMeta: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },
  matchMetaSecondary: { marginTop: 4, color: theme.colors.textTertiary, fontWeight: "900", fontSize: 12, lineHeight: 16 },

  heroCtas: { marginTop: 14, gap: 10 },
  heroCtasRow: { flexDirection: "row", gap: 10 },

  cta: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  ctaPrimaryText: { color: theme.colors.text, fontWeight: "900" },

  ctaSecondary: {
    flex: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  ctaSecondaryText: { color: theme.colors.text, fontWeight: "900" },
  ctaSecondarySub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  /* Section head */
  sectionHead: { marginBottom: 10 },
  sectionTitle: { color: theme.colors.text, fontWeight: "900" },
  sectionSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  /* Steps */
  stepRow: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepLeft: { flex: 1 },
  stepTitle: { color: theme.colors.text, fontWeight: "900" },
  stepHint: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },
  stepRight: { alignItems: "flex-end", gap: 6 },
  stepCount: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  stepCta: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  stepCtaText: { color: theme.colors.text, fontWeight: "900" },

  /* Itinerary */
  itinBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  itinLine: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  /* Quick grid */
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  quickTitle: { color: theme.colors.text, fontWeight: "900" },
  quickSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  /* Accordions */
  accordionHead: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accordionHeadOpen: { borderColor: "rgba(0,255,136,0.28)" },
  accordionTitle: { color: theme.colors.text, fontWeight: "900" },
  accordionSub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },
  accordionChevron: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 18 },

  /* Stadium + areas */
  stadiumBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  stadiumTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14, lineHeight: 18 },
  stadiumCity: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  stadiumNote: { marginTop: 10, color: theme.colors.textTertiary, fontWeight: "900", fontSize: 11, lineHeight: 14 },

  smallSection: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

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
  areaName: { color: theme.colors.text, fontWeight: "900", flexShrink: 1 },
  areaNotes: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },
  areaBtns: { gap: 8, alignItems: "flex-end" },

  /* Items */
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
  itemTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  itemTitle: { color: theme.colors.text, fontWeight: "900", flexShrink: 1, paddingRight: 6 },
  itemMeta: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },
  priceLine: { marginTop: 6, color: "rgba(242,244,246,0.92)", fontSize: 12, fontWeight: "900" },
  itemActions: { gap: 8, alignItems: "flex-end" },

  /* Notes */
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

  /* Crest */
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

  /* Buttons + badges */
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  smallBtnDanger: { borderColor: "rgba(255,80,80,0.35)" },
  smallBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: theme.colors.text, fontWeight: "900", fontSize: 11 },
  badgePending: { borderColor: "rgba(255,200,80,0.40)", backgroundColor: "rgba(255,200,80,0.10)" },
  badgeSaved: { borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,255,136,0.08)" },
  badgeBooked: { borderColor: "rgba(120,170,255,0.45)", backgroundColor: "rgba(120,170,255,0.10)" },
  badgeArchived: { borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(255,255,255,0.06)" },

  chev: { color: theme.colors.textSecondary, fontSize: 24, marginTop: -2 },
});
