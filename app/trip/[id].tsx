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
import { Stack, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import TripProgressStrip from "@/src/components/TripProgressStrip";
import NextBestActionCard, { type NextAction } from "@/src/components/NextBestActionCard";
import TripHealthScore from "@/src/components/TripHealthScore";
import TripMatchesCard from "@/src/components/trip/TripMatchesCard";
import TripWorkspaceCard from "@/src/components/trip/TripWorkspaceCard";
import TripStayGuidanceCard from "@/src/components/trip/TripStayGuidanceCard";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";
import tripWorkspaceStore from "@/src/state/tripWorkspace";

import type { PartnerId } from "@/src/core/partners";
import type { SavedItem } from "@/src/core/savedItemTypes";
import type { WorkspaceSectionKey, TripWorkspace } from "@/src/core/tripWorkspace";
import {
  DEFAULT_SECTION_ORDER,
  computeWorkspaceSnapshot,
  groupSavedItemsBySection,
} from "@/src/core/tripWorkspace";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { getTripProgress, getTripHealth } from "@/src/services/tripProgress";
import { resolveAffiliateUrl } from "@/src/services/partnerLinks";
import { getIataCityCodeForCity, debugCityKey } from "@/src/data/iataCityCodes";
import { getMatchdayLogistics, buildLogisticsSnippet } from "@/src/data/matchdayLogistics";
import storage from "@/src/services/storage";
import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip } from "@/src/features/tripFinder/types";

import useTripDetailController from "@/src/features/tripDetail/useTripDetailController";
import {
  type AffiliateUrls,
  type PlanValue,
  type SmartButton,
  buildMapsSearchUrl,
  clean,
  cleanUpper3,
  coerceId,
  confidencePctLabel,
  difficultyLabel,
  formatKickoffMeta,
  isLateKickoff,
  isNumericId,
  itemResolvedScore,
  livePriceLine,
  proCapHint,
  rankReasonsText,
  smartButtonSubtitle,
  summaryLine,
  ticketProviderFromItem,
  titleCaseCity,
  tripStatus,
} from "@/src/features/tripDetail/helpers";

declare const __DEV__: boolean;
const DEV = typeof __DEV__ === "boolean" ? __DEV__ : false;

const PLAN_STORAGE_KEY = "yna:plan";
const FREE_TRIP_CAP = 5;

export default function TripDetailScreen() {
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

  const [originLoaded, setOriginLoaded] = useState<boolean>(preferencesStore.getState().loaded);
  const [originIata, setOriginIata] = useState<string>(preferencesStore.getPreferredOriginIata());

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const [proofBusyId, setProofBusyId] = useState<string | null>(null);
  const [devWarnedCityKey, setDevWarnedCityKey] = useState<string | null>(null);

  const isPro = plan === "premium";

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const value = await storage.getString(PLAN_STORAGE_KEY);
        if (!mounted) return;

        if (value === "free" || value === "premium" || value === "not_set") {
          setPlan(value);
          return;
        }

        if (value === "Free Plan") setPlan("free");
        if (value === "Premium Plan") setPlan("premium");
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
    if (routeTripId && workspaceLoaded) {
      tripWorkspaceStore.ensureWorkspace(routeTripId);
    }
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

  const activeTripId = useMemo(
    () => clean(trip?.id) || clean(routeTripId) || null,
    [trip?.id, routeTripId]
  );

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

  const activeSection = useMemo<WorkspaceSectionKey>(
    () => workspace?.activeSection ?? sectionOrder[0] ?? "tickets",
    [workspace?.activeSection, sectionOrder]
  );

  const numericMatchIds = useMemo(() => {
    const ids = Array.isArray(trip?.matchIds) ? trip.matchIds : [];
    return ids.map((x) => String(x).trim()).filter(isNumericId);
  }, [trip?.matchIds]);

  const primaryMatchId = useMemo(() => {
    const preferred = clean((trip as any)?.fixtureIdPrimary);
    if (preferred && numericMatchIds.includes(preferred)) return preferred;
    return numericMatchIds[0] ?? null;
  }, [trip, numericMatchIds]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (numericMatchIds.length === 0) {
        setFixturesById({});
        setFxLoading(false);
        return;
      }

      setFxLoading(true);

      try {
        const next: Record<string, FixtureListRow> = {};
        for (const id of numericMatchIds) {
          try {
            const row = await getFixtureById(id);
            if (row) next[String(id)] = row;
          } catch {}
        }
        if (!cancelled) setFixturesById(next);
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

  const primaryFixture = useMemo(
    () => (primaryMatchId ? fixturesById[String(primaryMatchId)] ?? null : null),
    [primaryMatchId, fixturesById]
  );

  const cityName = useMemo(() => {
    const raw =
      clean((trip as any)?.displayCity) ||
      clean((trip as any)?.venueCity) ||
      clean((primaryFixture as any)?.fixture?.venue?.city) ||
      clean(trip?.cityId) ||
      "Trip";

    return titleCaseCity(raw);
  }, [trip, primaryFixture]);

  const primaryLeagueId = useMemo(() => {
    const fromFixture = (primaryFixture as any)?.league?.id;
    if (typeof fromFixture === "number") return fromFixture;

    const fromTrip = (trip as any)?.leagueId;
    return typeof fromTrip === "number" ? fromTrip : undefined;
  }, [primaryFixture, trip]);

  const affiliateUrls = useMemo<AffiliateUrls | null>(() => {
    if (!trip || !clean(cityName) || cityName === "Trip") return null;

    const ctx = {
      city: clean(cityName),
      startDate: trip.startDate || null,
      endDate: trip.endDate || null,
      originIata: cleanUpper3(originIata, "LON"),
    };

    return {
      flightsUrl: resolveAffiliateUrl("aviasales", ctx),
      hotelsUrl: resolveAffiliateUrl("expedia", ctx),
      omioUrl: resolveAffiliateUrl("omio", ctx),
      transfersUrl: resolveAffiliateUrl("kiwitaxi", ctx),
      experiencesUrl: resolveAffiliateUrl("getyourguide", ctx),
      mapsUrl: buildMapsSearchUrl(`${ctx.city} travel`),
    };
  }, [trip, cityName, originIata]);

  const pending = useMemo(() => savedItems.filter((x) => x.status === "pending"), [savedItems]);
  const saved = useMemo(
    () => savedItems.filter((x) => x.status === "saved" && x.type !== "note"),
    [savedItems]
  );
  const booked = useMemo(() => savedItems.filter((x) => x.status === "booked"), [savedItems]);

  const primaryHomeName = useMemo(
    () => clean((primaryFixture as any)?.teams?.home?.name) || clean((trip as any)?.homeName),
    [primaryFixture, trip]
  );

  const primaryLeagueName = useMemo(
    () => clean((primaryFixture as any)?.league?.name) || clean((trip as any)?.leagueName),
    [primaryFixture, trip]
  );

  const primaryKickoffIso = useMemo(
    () => clean((primaryFixture as any)?.fixture?.date ?? (trip as any)?.kickoffIso) || null,
    [primaryFixture, trip]
  );

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
    return tips.slice(0, 3).map((x: any) => clean(x)).filter(Boolean);
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

  const ticketsByMatchId = useMemo(() => {
    const next: Record<string, SavedItem | null> = {};
    const ticketCandidates = savedItems.filter((x) => x.type === "tickets" && x.status !== "archived");

    for (const mid of numericMatchIds) {
      const exact = ticketCandidates.filter((x) => clean((x.metadata as any)?.fixtureId) === clean(mid));
      const pool = exact.length > 0 ? exact : ticketCandidates;

      next[String(mid)] =
        pool.find((x) => x.status === "pending") ??
        pool.find((x) => x.status === "saved") ??
        pool.find((x) => x.status === "booked") ??
        null;
    }

    return next;
  }, [numericMatchIds, savedItems]);

  const primaryTicketItem = useMemo(
    () => (primaryMatchId ? ticketsByMatchId[String(primaryMatchId)] ?? null : null),
    [primaryMatchId, ticketsByMatchId]
  );

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

  const controller = useTripDetailController({
    trip,
    activeTripId,
    cityName,
    primaryLeagueId,
    fixturesById,
    ticketsByMatchId,
    noteText,
    setNoteText,
    setNoteSaving,
    setProofBusyId,
    setActiveWorkspaceSection,
  });

  const tripCount = useMemo(() => tripsStore.getState().trips?.length ?? 0, [tripsLoaded]);

  const progressItems = useMemo(() => {
    return [
      {
        key: "tickets" as const,
        label: "Tickets",
        state: progress.tickets,
        onPress: () => {
          if (!primaryMatchId) {
            Alert.alert("Add a match first", "Add a match to unlock tickets + match planning.");
            return;
          }
          controller.openTicketsForMatch(primaryMatchId);
        },
      },
      {
        key: "flight" as const,
        label: "Flights",
        state: progress.flight,
        onPress: () =>
          controller.openPartnerOrAlert(affiliateUrls?.flightsUrl, "We need a city + dates saved to build booking links.", {
            partnerId: "aviasales" as PartnerId,
            savedItemType: "flight",
            title: `Flights to ${cityName}`,
            metadata: {
              city: cityName,
              originIata: cleanUpper3(originIata, "LON"),
              priceMode: "live",
            },
          }),
      },
      {
        key: "hotel" as const,
        label: "Hotel",
        state: progress.hotel,
        onPress: () =>
          controller.openPartnerOrAlert(affiliateUrls?.hotelsUrl, "We need a city + dates saved to build booking links.", {
            partnerId: "expedia" as PartnerId,
            savedItemType: "hotel",
            title: `Hotels in ${cityName}`,
            metadata: {
              city: cityName,
              startDate: trip?.startDate,
              endDate: trip?.endDate,
              priceMode: "live",
            },
          }),
      },
      {
        key: "transfer" as const,
        label: affiliateUrls?.omioUrl ? "Rail/Bus" : "Transfer",
        state: progress.transfer,
        onPress: () =>
          controller.openPartnerOrAlert(
            affiliateUrls?.omioUrl || affiliateUrls?.transfersUrl,
            "We need a city + dates saved to build booking links.",
            affiliateUrls?.omioUrl
              ? {
                  partnerId: "omio" as PartnerId,
                  savedItemType: "train",
                  title: `Trains & buses in ${cityName}`,
                  metadata: {
                    city: cityName,
                    startDate: trip?.startDate,
                    endDate: trip?.endDate,
                    priceMode: "live",
                    transportMode: "rail_bus",
                  },
                }
              : {
                  partnerId: "kiwitaxi" as PartnerId,
                  savedItemType: "transfer",
                  title: `Transfers in ${cityName}`,
                  metadata: {
                    city: cityName,
                    startDate: trip?.startDate,
                    endDate: trip?.endDate,
                    priceMode: "live",
                    transportMode: "transfer",
                  },
                }
          ),
      },
      {
        key: "things" as const,
        label: "Things",
        state: progress.things,
        onPress: () =>
          controller.openPartnerOrAlert(affiliateUrls?.experiencesUrl, "We need a city saved to build booking links.", {
            partnerId: "getyourguide" as PartnerId,
            savedItemType: "things",
            title: `Experiences in ${cityName}`,
            metadata: {
              city: cityName,
              priceMode: "live",
            },
          }),
      },
    ];
  }, [affiliateUrls, cityName, controller, originIata, primaryMatchId, progress, trip?.startDate, trip?.endDate]);

  const nextAction = useMemo<NextAction | null>(() => {
    const openTickets = () => {
      if (!hasMatch || !primaryMatchId) {
        Alert.alert("Add a match first", "Add a match to unlock tickets + match planning.");
        return;
      }
      controller.openTicketsForMatch(primaryMatchId);
    };

    const openFlights = () =>
      controller.openPartnerOrAlert(affiliateUrls?.flightsUrl, "We need a city + dates saved to build booking links.", {
        partnerId: "aviasales" as PartnerId,
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: {
          city: cityName,
          originIata: cleanUpper3(originIata, "LON"),
          priceMode: "live",
        },
      });

    const openHotels = () =>
      controller.openPartnerOrAlert(affiliateUrls?.hotelsUrl, "We need a city + dates saved to build booking links.", {
        partnerId: "expedia" as PartnerId,
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: {
          city: cityName,
          startDate: trip?.startDate,
          endDate: trip?.endDate,
          priceMode: "live",
        },
      });

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
              controller.openPartnerOrAlert(
                affiliateUrls.omioUrl,
                "We need a city + dates saved to build booking links.",
                {
                  partnerId: "omio" as PartnerId,
                  savedItemType: "train",
                  title: `Trains & buses in ${cityName}`,
                  metadata: {
                    city: cityName,
                    startDate: trip?.startDate,
                    endDate: trip?.endDate,
                    priceMode: "live",
                    transportMode: "rail_bus",
                  },
                }
              )
          : () =>
              controller.openPartnerOrAlert(
                affiliateUrls?.transfersUrl,
                "We need a city + dates saved to build booking links.",
                {
                  partnerId: "kiwitaxi" as PartnerId,
                  savedItemType: "transfer",
                  title: `Transfers in ${cityName}`,
                  metadata: {
                    city: cityName,
                    startDate: trip?.startDate,
                    endDate: trip?.endDate,
                    priceMode: "live",
                    transportMode: "transfer",
                  },
                }
              ),
      };
    }

    if (!hasThings) {
      return {
        title: "Trip is covered — add experiences if they help",
        body: "Core planning is done. Anything else should improve the trip, not clutter it.",
        cta: "View activities",
        onPress: () =>
          controller.openPartnerOrAlert(affiliateUrls?.experiencesUrl, "We need a city saved to build booking links.", {
            partnerId: "getyourguide" as PartnerId,
            savedItemType: "things",
            title: `Experiences in ${cityName}`,
            metadata: {
              city: cityName,
              priceMode: "live",
            },
          }),
        badge: "Ready",
      };
    }

    return {
      title: "Core planning complete",
      body: "You’ve covered the important parts. From here, only add things that genuinely improve the trip.",
      cta: "View wallet",
      onPress: controller.onViewWallet,
      badge: "Ready",
    };
  }, [
    affiliateUrls,
    cityName,
    controller,
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

  const smartBookButtons = useMemo<SmartButton[]>(() => {
    if (!affiliateUrls || !trip) return [];

    const buttons: SmartButton[] = [];

    const add = (
      title: string,
      sub: string,
      onPress: () => void,
      kind?: "primary" | "neutral",
      provider?: string | null
    ) => {
      buttons.push({ title, sub, onPress, kind, provider });
    };

    const openHotels = () =>
      controller.openPartnerOrAlert(affiliateUrls.hotelsUrl, "Hotels link couldn’t be built.", {
        partnerId: "expedia" as PartnerId,
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: {
          city: cityName,
          startDate: trip.startDate,
          endDate: trip.endDate,
          priceMode: "live",
        },
      });

    const openFlights = () =>
      controller.openPartnerOrAlert(affiliateUrls.flightsUrl, "Flights link couldn’t be built.", {
        partnerId: "aviasales" as PartnerId,
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: {
          city: cityName,
          originIata: cleanUpper3(originIata, "LON"),
          priceMode: "live",
        },
      });

    const openOmio = () =>
      controller.openPartnerOrAlert(affiliateUrls.omioUrl, "Rail/bus link couldn’t be built.", {
        partnerId: "omio" as PartnerId,
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

    const openTransfers = () =>
      controller.openPartnerOrAlert(affiliateUrls.transfersUrl, "Transfers link couldn’t be built.", {
        partnerId: "kiwitaxi" as PartnerId,
        savedItemType: "transfer",
        title: `Transfers in ${cityName}`,
        metadata: {
          city: cityName,
          startDate: trip.startDate,
          endDate: trip.endDate,
          priceMode: "live",
        },
      });

    const openThings = () =>
      controller.openPartnerOrAlert(affiliateUrls.experiencesUrl, "Activities link couldn’t be built.", {
        partnerId: "getyourguide" as PartnerId,
        savedItemType: "things",
        title: `Experiences in ${cityName}`,
        metadata: {
          city: cityName,
          priceMode: "live",
        },
      });

    if (!hasTickets && primaryMatchId) {
      add(
        "Tickets",
        smartButtonSubtitle(primaryTicketItem, "Compare live ticket options"),
        () => controller.openTicketsForMatch(primaryMatchId),
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

    if (buttons.length === 0) {
      add("Hotels", "Expedia (live)", openHotels, "primary", "expedia");
      if (affiliateUrls.omioUrl) add("Rail / Bus", "Omio (live)", openOmio, "neutral", "omio");
      else add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");
    }

    return buttons.slice(0, 4);
  }, [
    affiliateUrls,
    trip,
    cityName,
    controller,
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

                  <Pressable onPress={controller.onViewWallet} style={styles.walletBtn}>
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
                  <Pressable onPress={controller.onEditTrip} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Edit trip</Text>
                  </Pressable>

                  {!isPro ? (
                    <Pressable onPress={controller.onUpgradePress} style={[styles.btn, styles.btnSecondary]}>
                      <Text style={styles.btnSecondaryText}>Go Pro</Text>
                    </Pressable>
                  ) : null}
                </View>

                {!originLoaded ? <Text style={styles.mutedInline}>Loading departure preference…</Text> : null}

                <View style={styles.heroBottomStack}>
                  <TripProgressStrip items={progressItems} />
                  <NextBestActionCard action={nextAction} isPro={isPro} onUpgradePress={controller.onUpgradePress} />
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
                        style={[styles.smartBtn, button.kind === "primary" && styles.smartBtnPrimary]}
                        onPress={button.onPress}
                      >
                        <View style={styles.smartBtnTop}>
                          <Text style={styles.smartBtnText}>{button.title}</Text>
                        </View>
                        <Text style={styles.smartBtnSub}>{button.sub}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable onPress={() => controller.openUntracked(affiliateUrls.mapsUrl)}>
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
                onAddMatch={controller.onAddMatch}
                onOpenTicketsForMatch={controller.openTicketsForMatch}
                onOpenMatchActions={controller.openMatchActions}
                onSetPrimaryMatch={controller.setPrimaryMatch}
                onRemoveMatch={controller.removeMatch}
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
                onAddNote={controller.addNote}
                onOpenTicketsForPrimaryMatch={() => {
                  if (primaryMatchId) controller.openTicketsForMatch(primaryMatchId);
                }}
                onOpenSavedItem={controller.openSavedItem}
                onOpenNoteActions={controller.openNoteActions}
                onConfirmMarkBooked={controller.confirmMarkBooked}
                onAddProofForBookedItem={controller.addProofForBookedItem}
                onViewWallet={controller.onViewWallet}
                onConfirmMoveToPending={controller.confirmMoveToPending}
                onConfirmArchive={controller.confirmArchive}
                onOpenPartner={controller.openTrackedPartner}
                getLivePriceLine={livePriceLine}
                getTicketProviderFromItem={ticketProviderFromItem}
              />

              <TripStayGuidanceCard
                stadiumName={stadiumName}
                stadiumCity={stadiumCity}
                logisticsSnippet={primaryLogisticsSnippet}
                bestAreas={stayBestAreas}
                budgetAreas={stayBudgetAreas}
                transportStops={transportStops}
                transportTips={transportTips}
                lateTransportNote={lateTransportNote}
                stadiumMapsUrl={stadiumMapsUrl}
                openUrl={controller.openUntracked}
              />
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

  heroBottomStack: {
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

  mapsInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "900",
  },
});
