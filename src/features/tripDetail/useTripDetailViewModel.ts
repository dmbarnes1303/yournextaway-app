import { Alert } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

import tripsStore, { type Trip } from "@/src/state/trips";

import type { PartnerId } from "@/src/constants/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import type { NextAction } from "@/src/components/NextBestActionCard";
import type { TripProgressItem } from "@/src/components/TripProgressStrip";
import type { WorkspaceSectionKey } from "@/src/core/tripWorkspace";

import {
  cleanUpper3,
  proCapHint,
  smartButtonSubtitle,
  ticketProviderFromItem,
  type AffiliateUrls,
  type SmartButton,
  type SourceSection,
  type SourceSurface,
} from "@/src/features/tripDetail/helpers";

type PartnerActionConfig = {
  partnerId: PartnerId;
  savedItemType: SavedItemType;
  title: string;
  metadata?: Record<string, unknown>;
};

type PartnerActionBundle = {
  url?: string | null;
  message: string;
  config: PartnerActionConfig;
};

type Controller = {
  onViewWallet: () => void;
  openTrackedPartner: (args: {
    partnerId: PartnerId | string;
    url: string;
    title: string;
    savedItemType?: SavedItemType;
    metadata?: Record<string, unknown>;
  }) => void | Promise<void>;
  openTicketsForMatch: (matchId: string) => void | Promise<void>;
};

type ProgressState = "empty" | "saved" | "pending" | "booked";

type ProgressMap = {
  tickets: ProgressState;
  flight: ProgressState;
  hotel: ProgressState;
  transfer: ProgressState;
  things: ProgressState;
};

type PricePointSource = "saved_item" | "metadata" | "price_text" | "live_api" | null;
type PriceDisplayMode = "booked";

type PricePoint = {
  amount: number | null;
  currency: string | null;
  text: string | null;
  source: PricePointSource;
  displayMode: PriceDisplayMode;
};

type BookingPriceBoard = {
  tickets: PricePoint | null;
  flights: PricePoint | null;
  hotels: PricePoint | null;
  transfers: PricePoint | null;
  experiences: PricePoint | null;
  tripTotal: PricePoint | null;
};

type Params = {
  trip: Trip | null;
  tripsLoaded: boolean;
  savedLoaded: boolean;
  workspaceLoaded: boolean;
  routeTripId: string | null;
  cityName: string;
  originIata: string;
  affiliateUrls: AffiliateUrls | null;
  progress: ProgressMap;
  readiness: { score: number; missing: string[] };
  pending: SavedItem[];
  saved: SavedItem[];
  booked: SavedItem[];
  primaryMatchId: string | null;
  primaryTicketItem: SavedItem | null;
  isPro: boolean;
  kickoffTbc: boolean;
  controller: Controller;
  setActiveWorkspaceSection?: (section: WorkspaceSectionKey) => Promise<void> | void;
  bookingPriceBoard?: BookingPriceBoard | null;
};

type BookingStepKey = "tickets" | "flight" | "hotel" | "transfer" | "things";

type BookingStep = {
  key: BookingStepKey;
  complete: boolean;
  started: boolean;
  state: ProgressState;
};

const FREE_TRIP_CAP = 5;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function hasUsablePartnerUrl(value?: string | null): boolean {
  return Boolean(clean(value));
}

function isStarted(state: ProgressState): boolean {
  return state === "saved" || state === "pending" || state === "booked";
}

function isComplete(state: ProgressState): boolean {
  return state === "booked";
}

function isBookedOnly(state: ProgressState): boolean {
  return state === "booked";
}

function ticketButtonSubtitle(args: {
  primaryTicketItem: SavedItem | null;
  ticketState: ProgressState;
}): string {
  const { primaryTicketItem, ticketState } = args;

  if (ticketState === "booked") return "Ticket booked";

  if (ticketState === "saved" || ticketState === "pending") {
    return smartButtonSubtitle(primaryTicketItem, "Ticket option saved");
  }

  return "Compare ticket options";
}

function stepPriorityScore(step: BookingStepKey): number {
  if (step === "tickets") return 1;
  if (step === "flight") return 2;
  if (step === "hotel") return 3;
  if (step === "transfer") return 4;
  return 5;
}

function genericActionFallback(kind: "flights" | "hotels" | "transport" | "activities"): string {
  if (kind === "flights") return "Check flight options";
  if (kind === "hotels") return "Check hotel options";
  if (kind === "transport") return "Check transport options";
  return "Check activity options";
}

function stepCoverageLabel(
  state: ProgressState,
  labels: {
    empty: string;
    started: string;
    booked: string;
  }
): string {
  if (state === "booked") return labels.booked;
  if (state === "saved" || state === "pending") return labels.started;
  return labels.empty;
}

function bookedOnlyCompletionScore(args: {
  ticketState: ProgressState;
  flightState: ProgressState;
  hotelState: ProgressState;
  transportState: ProgressState;
  thingsState: ProgressState;
}): number {
  const { ticketState, flightState, hotelState, transportState, thingsState } = args;

  const score =
    (ticketState === "booked" ? 40 : 0) +
    (flightState === "booked" ? 25 : 0) +
    (hotelState === "booked" ? 25 : 0) +
    (transportState === "booked" ? 7 : 0) +
    (thingsState === "booked" ? 3 : 0);

  return Math.max(0, Math.min(100, score));
}

function categoryActionSubtitle(args: {
  state: ProgressState;
  emptyFallback: string;
  startedLabel: string;
  bookedLabel: string;
}): string {
  const { state, emptyFallback, startedLabel, bookedLabel } = args;

  if (state === "booked") return bookedLabel;
  if (state === "saved" || state === "pending") return startedLabel;
  return emptyFallback;
}

function transportSectionFromAffiliateUrls(
  affiliateUrls: AffiliateUrls | null | undefined
): SourceSection {
  return affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl ? "travel" : "transfers";
}

export default function useTripDetailViewModel({
  trip,
  tripsLoaded,
  savedLoaded,
  workspaceLoaded,
  routeTripId,
  cityName,
  originIata,
  affiliateUrls,
  progress,
  readiness,
  pending,
  saved,
  booked,
  primaryMatchId,
  primaryTicketItem,
  isPro,
  kickoffTbc,
  controller,
  setActiveWorkspaceSection,
  bookingPriceBoard = null,
}: Params) {
  const hasMatch = Boolean(primaryMatchId);

  const ticketState = progress.tickets;
  const flightState = progress.flight;
  const hotelState = progress.hotel;
  const transportState = progress.transfer;
  const thingsState = progress.things;

  const hasTickets = isBookedOnly(ticketState);
  const hasFlight = isBookedOnly(flightState);
  const hasHotel = isBookedOnly(hotelState);
  const hasTransport = isBookedOnly(transportState);
  const hasThings = isBookedOnly(thingsState);

  const [tripCount, setTripCount] = useState<number>(tripsStore.getState().trips?.length ?? 0);

  useEffect(() => {
    const unsub = tripsStore.subscribe((state) => {
      setTripCount(state.trips?.length ?? 0);
    });

    return unsub;
  }, []);

  const loading = useMemo(() => {
    return Boolean(routeTripId && (!tripsLoaded || !savedLoaded || !workspaceLoaded));
  }, [routeTripId, tripsLoaded, savedLoaded, workspaceLoaded]);

  const showHeroBanners = useMemo(() => {
    return pending.length > 0 || saved.length > 0 || booked.length > 0;
  }, [pending.length, saved.length, booked.length]);

  const baseMeta = useMemo(() => {
    return {
      tripId: trip?.id ?? null,
      city: cityName,
      startDate: trip?.startDate ?? null,
      endDate: trip?.endDate ?? null,
      originIata: cleanUpper3(originIata, "LON"),
      primaryMatchId: primaryMatchId ?? null,
    };
  }, [trip?.id, cityName, trip?.startDate, trip?.endDate, originIata, primaryMatchId]);

  const buildMeta = useCallback(
    (
      sourceSurface: SourceSurface,
      sourceSection: SourceSection,
      extra?: Record<string, unknown>
    ) => {
      return {
        ...baseMeta,
        sourceSurface,
        sourceSection,
        ...(extra ?? {}),
      };
    },
    [baseMeta]
  );

  const setWorkspaceSection = useCallback(
    async (section: WorkspaceSectionKey) => {
      try {
        await setActiveWorkspaceSection?.(section);
      } catch {
        // ignore
      }
    },
    [setActiveWorkspaceSection]
  );

  const flightAction = useMemo<PartnerActionBundle>(() => {
    return {
      url: affiliateUrls?.flightsUrl,
      message: "We need a city + dates saved to build flight links.",
      config: {
        partnerId: "aviasales",
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: {
          provider: "aviasales",
        },
      },
    };
  }, [affiliateUrls?.flightsUrl, cityName]);

  const hotelAction = useMemo<PartnerActionBundle>(() => {
    return {
      url: affiliateUrls?.hotelsUrl || affiliateUrls?.staysUrl,
      message: "We need a city + dates saved to build hotel links.",
      config: {
        partnerId: "expedia",
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: {
          provider: "expedia",
        },
      },
    };
  }, [affiliateUrls?.hotelsUrl, affiliateUrls?.staysUrl, cityName]);

  const transportAction = useMemo<PartnerActionBundle>(() => {
    const hasOmio = Boolean(affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl);

    return {
      url: affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl || affiliateUrls?.transfersUrl,
      message: "We need a city + dates saved to build transport links.",
      config: hasOmio
        ? {
            partnerId: "omio",
            savedItemType: "train",
            title: `Rail & bus for ${cityName}`,
            metadata: {
              provider: "omio",
              transportMode: "rail_bus",
            },
          }
        : {
            partnerId: "kiwitaxi",
            savedItemType: "transfer",
            title: `Transfers in ${cityName}`,
            metadata: {
              provider: "kiwitaxi",
              transportMode: "transfer",
            },
          },
    };
  }, [
    affiliateUrls?.omioUrl,
    affiliateUrls?.trainsUrl,
    affiliateUrls?.transfersUrl,
    cityName,
  ]);

  const thingsAction = useMemo<PartnerActionBundle>(() => {
    return {
      url: affiliateUrls?.experiencesUrl || affiliateUrls?.thingsUrl,
      message: "We need a city saved to build activity links.",
      config: {
        partnerId: "getyourguide",
        savedItemType: "things",
        title: `Experiences in ${cityName}`,
        metadata: {
          provider: "getyourguide",
        },
      },
    };
  }, [affiliateUrls?.experiencesUrl, affiliateUrls?.thingsUrl, cityName]);

  const openFlights = useCallback(
    async (sourceSurface: SourceSurface = "unknown") => {
      if (!flightAction.url) {
        Alert.alert("Flights not ready", flightAction.message);
        return;
      }

      await setWorkspaceSection("travel");

      return controller.openTrackedPartner({
        partnerId: flightAction.config.partnerId,
        url: flightAction.url,
        savedItemType: flightAction.config.savedItemType,
        title: flightAction.config.title,
        metadata: buildMeta(sourceSurface, "travel", {
          ...(flightAction.config.metadata ?? {}),
        }),
      });
    },
    [controller, flightAction, buildMeta, setWorkspaceSection]
  );

  const openHotels = useCallback(
    async (sourceSurface: SourceSurface = "unknown") => {
      if (!hotelAction.url) {
        Alert.alert("Hotels not ready", hotelAction.message);
        return;
      }

      await setWorkspaceSection("stay");

      return controller.openTrackedPartner({
        partnerId: hotelAction.config.partnerId,
        url: hotelAction.url,
        savedItemType: hotelAction.config.savedItemType,
        title: hotelAction.config.title,
        metadata: buildMeta(sourceSurface, "stay", {
          ...(hotelAction.config.metadata ?? {}),
        }),
      });
    },
    [controller, hotelAction, buildMeta, setWorkspaceSection]
  );

  const openTransport = useCallback(
    async (sourceSurface: SourceSurface = "unknown") => {
      const section = transportSectionFromAffiliateUrls(affiliateUrls);

      if (!transportAction.url) {
        Alert.alert("Transport not ready", transportAction.message);
        return;
      }

      await setWorkspaceSection(section === "travel" ? "travel" : "transfers");

      return controller.openTrackedPartner({
        partnerId: transportAction.config.partnerId,
        url: transportAction.url,
        savedItemType: transportAction.config.savedItemType,
        title: transportAction.config.title,
        metadata: buildMeta(sourceSurface, section, {
          ...(transportAction.config.metadata ?? {}),
        }),
      });
    },
    [controller, transportAction, affiliateUrls, buildMeta, setWorkspaceSection]
  );

  const openThings = useCallback(
    async (sourceSurface: SourceSurface = "unknown") => {
      if (!thingsAction.url) {
        Alert.alert("Activities not ready", thingsAction.message);
        return;
      }

      await setWorkspaceSection("things");

      return controller.openTrackedPartner({
        partnerId: thingsAction.config.partnerId,
        url: thingsAction.url,
        savedItemType: thingsAction.config.savedItemType,
        title: thingsAction.config.title,
        metadata: buildMeta(sourceSurface, "things", {
          ...(thingsAction.config.metadata ?? {}),
        }),
      });
    },
    [controller, thingsAction, buildMeta, setWorkspaceSection]
  );

  const openTickets = useCallback(
    async (_sourceSurface: SourceSurface = "unknown") => {
      if (!hasMatch || !primaryMatchId) {
        Alert.alert("Add a match first", "Add a match to unlock tickets and proper trip planning.");
        return;
      }

      await setWorkspaceSection("tickets");
      return controller.openTicketsForMatch(primaryMatchId);
    },
    [controller, hasMatch, primaryMatchId, setWorkspaceSection]
  );

  const bookingSteps = useMemo<BookingStep[]>(() => {
    return [
      {
        key: "tickets",
        complete: isComplete(ticketState),
        started: isStarted(ticketState),
        state: ticketState,
      },
      {
        key: "flight",
        complete: isComplete(flightState),
        started: isStarted(flightState),
        state: flightState,
      },
      {
        key: "hotel",
        complete: isComplete(hotelState),
        started: isStarted(hotelState),
        state: hotelState,
      },
      {
        key: "transfer",
        complete: isComplete(transportState),
        started: isStarted(transportState),
        state: transportState,
      },
      {
        key: "things",
        complete: isComplete(thingsState),
        started: isStarted(thingsState),
        state: thingsState,
      },
    ];
  }, [ticketState, flightState, hotelState, transportState, thingsState]);

  const completeCoreCount = useMemo(() => {
    return bookingSteps.filter((step) => step.key !== "things" && step.complete).length;
  }, [bookingSteps]);

  const tripCompletionPct = useMemo(() => {
    return bookedOnlyCompletionScore({
      ticketState,
      flightState,
      hotelState,
      transportState,
      thingsState,
    });
  }, [ticketState, flightState, hotelState, transportState, thingsState]);

  const nextIncompleteStep = useMemo(() => {
    return (
      bookingSteps
        .slice()
        .sort((a, b) => stepPriorityScore(a.key) - stepPriorityScore(b.key))
        .find((step) => !step.complete) ?? null
    );
  }, [bookingSteps]);

  const progressItems = useMemo<TripProgressItem[]>(() => {
    return [
      {
        key: "tickets",
        label: "Tickets",
        state: ticketState,
        onPress: () => {
          void openTickets("progress_strip");
        },
      },
      {
        key: "flight",
        label: "Flights",
        state: flightState,
        onPress: () => {
          void openFlights("progress_strip");
        },
      },
      {
        key: "hotel",
        label: "Hotel",
        state: hotelState,
        onPress: () => {
          void openHotels("progress_strip");
        },
      },
      {
        key: "transfer",
        label: affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl ? "Rail/Bus" : "Transfer",
        state: transportState,
        onPress: () => {
          void openTransport("progress_strip");
        },
      },
      {
        key: "things",
        label: "Things",
        state: thingsState,
        onPress: () => {
          void openThings("progress_strip");
        },
      },
    ];
  }, [
    affiliateUrls?.omioUrl,
    affiliateUrls?.trainsUrl,
    openTickets,
    openFlights,
    openHotels,
    openTransport,
    openThings,
    ticketState,
    flightState,
    hotelState,
    transportState,
    thingsState,
  ]);

  const nextAction = useMemo<NextAction | null>(() => {
    if (!hasMatch) {
      return {
        title: "Start by choosing a match",
        body: "No primary match means no real trip flow. Pick the match first, then the rest becomes specific instead of vague.",
        cta: "Add a match",
        onPress: () => {
          Alert.alert(
            "Add a match first",
            "Use the Matches card to add or select the primary fixture for this trip."
          );
        },
        badge: "Blocked",
      };
    }

    if (ticketState !== "booked") {
      return {
        title: ticketState === "empty" ? "Book tickets first" : "Finish ticket booking first",
        body:
          ticketState === "empty"
            ? "Tickets are the anchor. Until that is actually booked, flights and hotels are still softer planning."
            : "A saved or pending ticket is not a locked ticket. Finish this before pretending the trip is anchored.",
        cta: "Compare tickets",
        onPress: () => {
          void openTickets("next_best_action");
        },
        badge: "Priority",
      };
    }

    if (kickoffTbc && flightState === "empty") {
      return {
        title: "Kickoff not confirmed — keep travel flexible",
        body: "Tickets are sorted, but the kickoff still looks unstable. If you move into travel now, keep it flexible rather than acting like the schedule is locked.",
        cta: "View flights",
        onPress: () => {
          void openFlights("next_best_action");
        },
        secondaryCta: "Open tickets",
        onSecondaryPress: () => {
          void openTickets("next_best_action");
        },
        badge: "TBC",
        proLocked: true,
      };
    }

    if (flightState !== "booked") {
      return {
        title: flightState === "empty" ? "Add flights next" : "Finish sorting travel",
        body:
          flightState === "empty"
            ? "The trip is not properly covered until transport in and out is actually booked."
            : "Travel has been started, not finished. A saved link or tentative plan is not a locked journey.",
        cta: "View flights",
        onPress: () => {
          void openFlights("next_best_action");
        },
      };
    }

    if (hotelState !== "booked") {
      return {
        title: hotelState === "empty" ? "Lock the hotel" : "Finish the stay choice",
        body:
          hotelState === "empty"
            ? "A bad stay location ruins matchday logistics. Sort it after tickets and flights."
            : "A saved hotel option is not a finished stay decision. Lock the stay properly before moving on.",
        cta: "View hotels",
        onPress: () => {
          void openHotels("next_best_action");
        },
        secondaryCta: "Stay guidance",
        onSecondaryPress: () => {
          void setWorkspaceSection("stay");
          Alert.alert(
            "Stay guidance",
            "Use the stay section and guidance card to avoid booking in a pointless area."
          );
        },
      };
    }

    if (transportState !== "booked") {
      return {
        title: transportState === "empty" ? "Sort local transport" : "Finish local transport",
        body:
          transportState === "empty"
            ? "Airport, hotel, stadium. Remove that friction now instead of scrambling later."
            : "Transport has been started, but it is not properly settled yet. Finish it before wasting time on extras.",
        cta:
          affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl
            ? "View rail / bus"
            : "View transfers",
        onPress: () => {
          void openTransport("next_best_action");
        },
      };
    }

    if (thingsState !== "booked") {
      return {
        title:
          thingsState === "empty"
            ? "Add extras only if they improve the trip"
            : "Finish optional extras",
        body:
          thingsState === "empty"
            ? "Core trip is covered. Extras should improve the trip, not clutter it."
            : "Extras are optional. If you started them, finish them cleanly rather than leaving loose ends.",
        cta: "View activities",
        onPress: () => {
          void openThings("next_best_action");
        },
        badge: "Optional",
      };
    }

    return {
      title: "Trip booking flow complete",
      body: "Core trip components are covered. Store proof, confirmations and QR codes in Wallet and stop messing with finished work.",
      cta: "Open wallet",
      onPress: controller.onViewWallet,
      badge: "Ready",
    };
  }, [
    affiliateUrls?.omioUrl,
    affiliateUrls?.trainsUrl,
    controller.onViewWallet,
    ticketState,
    flightState,
    hotelState,
    transportState,
    thingsState,
    hasMatch,
    kickoffTbc,
    openFlights,
    openHotels,
    openThings,
    openTickets,
    openTransport,
    setWorkspaceSection,
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

    if (ticketState !== "booked" && primaryMatchId) {
      add(
        "Tickets",
        ticketButtonSubtitle({
          primaryTicketItem,
          ticketState,
        }),
        () => {
          void openTickets("smart_booking");
        },
        "primary",
        ticketProviderFromItem(primaryTicketItem)
      );
    }

    if (flightState !== "booked") {
      add(
        "Flights",
        categoryActionSubtitle({
          state: flightState,
          emptyFallback: genericActionFallback("flights"),
          startedLabel: stepCoverageLabel(flightState, {
            empty: "Check flight options",
            started: "Flight option saved",
            booked: "Flight booked",
          }),
          bookedLabel: "Flight booked",
        }),
        () => {
          void openFlights("smart_booking");
        },
        ticketState === "booked" ? "primary" : "neutral",
        "aviasales"
      );
    }

    if (hotelState !== "booked") {
      add(
        "Hotels",
        categoryActionSubtitle({
          state: hotelState,
          emptyFallback: genericActionFallback("hotels"),
          startedLabel: stepCoverageLabel(hotelState, {
            empty: "Check hotel options",
            started: "Hotel option saved",
            booked: "Hotel booked",
          }),
          bookedLabel: "Hotel booked",
        }),
        () => {
          void openHotels("smart_booking");
        },
        ticketState === "booked" && flightState === "booked" ? "primary" : "neutral",
        "expedia"
      );
    }

    if (transportState !== "booked" && (affiliateUrls.omioUrl || affiliateUrls.trainsUrl)) {
      add(
        "Rail / Bus",
        categoryActionSubtitle({
          state: transportState,
          emptyFallback: genericActionFallback("transport"),
          startedLabel: "Transport option saved",
          bookedLabel: "Transport booked",
        }),
        () => {
          void openTransport("smart_booking");
        },
        "neutral",
        "omio"
      );
    } else if (transportState !== "booked") {
      add(
        "Transfers",
        categoryActionSubtitle({
          state: transportState,
          emptyFallback: genericActionFallback("transport"),
          startedLabel: "Transfer option saved",
          bookedLabel: "Transfer booked",
        }),
        () => {
          void openTransport("smart_booking");
        },
        "neutral",
        "kiwitaxi"
      );
    }

    if (thingsState !== "booked") {
      add(
        "Activities",
        categoryActionSubtitle({
          state: thingsState,
          emptyFallback: genericActionFallback("activities"),
          startedLabel: "Activity saved",
          bookedLabel: "Activity booked",
        }),
        () => {
          void openThings("smart_booking");
        },
        "neutral",
        "getyourguide"
      );
    }

    if (buttons.length === 0) {
      add("Wallet", "Trip proof and confirmations", controller.onViewWallet, "primary", null);

      if (affiliateUrls.omioUrl || affiliateUrls.trainsUrl) {
        add(
          "Rail / Bus",
          genericActionFallback("transport"),
          () => {
            void openTransport("smart_booking");
          },
          "neutral",
          "omio"
        );
      } else if (hasUsablePartnerUrl(affiliateUrls.experiencesUrl || affiliateUrls.thingsUrl)) {
        add(
          "Activities",
          genericActionFallback("activities"),
          () => {
            void openThings("smart_booking");
          },
          "neutral",
          "getyourguide"
        );
      }
    }

    return buttons.slice(0, 4);
  }, [
    affiliateUrls,
    controller.onViewWallet,
    flightState,
    hotelState,
    thingsState,
    transportState,
    ticketState,
    openFlights,
    openHotels,
    openThings,
    openTickets,
    openTransport,
    primaryMatchId,
    primaryTicketItem,
    trip,
  ]);

  const capHint = useMemo(() => {
    return !isPro ? proCapHint(FREE_TRIP_CAP, tripCount) : undefined;
  }, [isPro, tripCount]);

  const heroBannerCounts = useMemo(() => {
    return {
      pending: pending.length,
      saved: saved.length,
      booked: booked.length,
    };
  }, [pending.length, saved.length, booked.length]);

  const bookingFunnelLabel = useMemo(() => {
    if (!hasMatch) return "No fixture selected";

    if (ticketState !== "booked") {
      return ticketState === "empty"
        ? "Step 1 of 4 • Tickets not booked"
        : "Step 1 of 4 • Tickets not booked";
    }

    if (flightState !== "booked") {
      return flightState === "empty"
        ? "Step 2 of 4 • Flights not booked"
        : "Step 2 of 4 • Flights not booked";
    }

    if (hotelState !== "booked") {
      return hotelState === "empty"
        ? "Step 3 of 4 • Hotel not booked"
        : "Step 3 of 4 • Hotel not booked";
    }

    if (transportState !== "booked") {
      return transportState === "empty"
        ? "Step 4 of 4 • Transport not booked"
        : "Step 4 of 4 • Transport not booked";
    }

    return "Core trip flow complete";
  }, [hasMatch, ticketState, flightState, hotelState, transportState]);

  const commercialSummaryLine = useMemo(() => {
    return null;
  }, []);

  const completionSummary = useMemo(() => {
    if (!hasMatch) return "Trip not started";
    if (tripCompletionPct >= 90) return "Trip essentially complete";
    if (tripCompletionPct >= 65) return "Trip materially covered";
    if (tripCompletionPct >= 35) return "Trip partly covered";
    return "Trip still early";
  }, [hasMatch, tripCompletionPct]);

  return {
    hasTickets,
    hasFlight,
    hasHotel,
    hasTransport,
    hasThings,
    hasMatch,
    tripCount,
    loading,
    showHeroBanners,
    progressItems,
    nextAction,
    smartBookButtons,
    openFlights,
    openHotels,
    openTransport,
    openThings,
    capHint,
    heroBannerCounts,
    readiness,
    bookingSteps,
    completeCoreCount,
    tripCompletionPct,
    bookingFunnelLabel,
    nextIncompleteStep,
    commercialSummaryLine,
    completionSummary,
    bookingPriceBoard,
  };
}
