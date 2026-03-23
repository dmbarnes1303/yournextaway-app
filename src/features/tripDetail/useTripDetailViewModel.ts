import { Alert } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

import tripsStore, { type Trip } from "@/src/state/trips";

import type { PartnerId } from "@/src/core/partners";
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
  metadata?: Record<string, any>;
};

type PartnerActionBundle = {
  url?: string | null;
  message: string;
  config: PartnerActionConfig;
};

type Controller = {
  onViewWallet: () => void;
  openPartnerOrAlert: (
    url: string | null | undefined,
    message: string,
    config: PartnerActionConfig
  ) => void | Promise<void>;
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

type PricePoint = {
  amount: number | null;
  currency: string | null;
  text: string | null;
  source: "saved_item" | "metadata" | "price_text" | null;
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
  setActiveWorkspaceSection: (section: WorkspaceSectionKey) => Promise<void> | void;

  bookingPriceBoard?: BookingPriceBoard | null;
  ticketsPriceFrom?: string | null;
  flightsPriceFrom?: string | null;
  hotelsPriceFrom?: string | null;
  transfersPriceFrom?: string | null;
  experiencesPriceFrom?: string | null;
  tripPriceFrom?: string | null;
};

type BookingStepKey = "tickets" | "flight" | "hotel" | "transfer" | "things";

type BookingStep = {
  key: BookingStepKey;
  complete: boolean;
  state: ProgressState;
};

const FREE_TRIP_CAP = 5;

function isStarted(state: ProgressState) {
  return state !== "empty";
}

function isComplete(state: ProgressState) {
  return state === "booked";
}

function completionLabel(
  state: ProgressState,
  emptyLabel: string,
  inProgressLabel: string,
  doneLabel: string
) {
  if (state === "booked") return doneLabel;
  if (state === "pending" || state === "saved") return inProgressLabel;
  return emptyLabel;
}

function cleanPriceLabel(value?: string | null) {
  const v = String(value ?? "").trim();
  return v || null;
}

function pricingOrFallback(priceLine: string | null | undefined, fallback: string) {
  return cleanPriceLabel(priceLine) || fallback;
}

function ticketButtonSubtitle(args: {
  primaryTicketItem: SavedItem | null;
  ticketState: ProgressState;
  ticketsPriceFrom?: string | null;
}) {
  const { primaryTicketItem, ticketState, ticketsPriceFrom } = args;

  if (ticketState === "booked") return "Ticket booked";
  if (ticketState === "saved" || ticketState === "pending") {
    return smartButtonSubtitle(primaryTicketItem, "Ticket option saved");
  }

  return smartButtonSubtitle(
    primaryTicketItem,
    pricingOrFallback(ticketsPriceFrom, "Compare live ticket options")
  );
}

function stepPriorityScore(step: BookingStepKey) {
  if (step === "tickets") return 1;
  if (step === "flight") return 2;
  if (step === "hotel") return 3;
  if (step === "transfer") return 4;
  return 5;
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
  bookingPriceBoard,
  ticketsPriceFrom,
  flightsPriceFrom,
  hotelsPriceFrom,
  transfersPriceFrom,
  experiencesPriceFrom,
  tripPriceFrom,
}: Params) {
  const hasMatch = Boolean(primaryMatchId);

  const ticketState = progress.tickets;
  const flightState = progress.flight;
  const hotelState = progress.hotel;
  const transportState = progress.transfer;
  const thingsState = progress.things;

  const hasTickets = isStarted(ticketState);
  const hasFlight = isStarted(flightState);
  const hasHotel = isStarted(hotelState);
  const hasTransport = isStarted(transportState);
  const hasThings = isStarted(thingsState);

  const [tripCount, setTripCount] = useState(tripsStore.getState().trips?.length ?? 0);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setTripCount(s.trips?.length ?? 0);
    });
    return unsub;
  }, []);

  const loading = useMemo(
    () => Boolean(routeTripId && (!tripsLoaded || !savedLoaded || !workspaceLoaded)),
    [routeTripId, tripsLoaded, savedLoaded, workspaceLoaded]
  );

  const showHeroBanners = useMemo(
    () => pending.length > 0 || saved.length > 0 || booked.length > 0,
    [pending.length, saved.length, booked.length]
  );

  const baseMeta = useMemo(
    () => ({
      tripId: trip?.id ?? null,
      city: cityName,
      startDate: trip?.startDate ?? null,
      endDate: trip?.endDate ?? null,
      originIata: cleanUpper3(originIata, "LON"),
      primaryMatchId: primaryMatchId ?? null,
    }),
    [trip?.id, cityName, trip?.startDate, trip?.endDate, originIata, primaryMatchId]
  );

  const buildMeta = useCallback(
    (sourceSurface: SourceSurface, sourceSection: SourceSection, extra?: Record<string, any>) => ({
      ...baseMeta,
      sourceSurface,
      sourceSection,
      ...(extra ?? {}),
    }),
    [baseMeta]
  );

  const flightAction = useMemo<PartnerActionBundle>(
    () => ({
      url: affiliateUrls?.flightsUrl,
      message: "We need a city + dates saved to build booking links.",
      config: {
        partnerId: "aviasales",
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: buildMeta("unknown", "travel", {
          provider: "aviasales",
          priceMode: "live",
          priceFrom: cleanPriceLabel(flightsPriceFrom),
        }),
      },
    }),
    [affiliateUrls?.flightsUrl, cityName, buildMeta, flightsPriceFrom]
  );

  const hotelAction = useMemo<PartnerActionBundle>(
    () => ({
      url: affiliateUrls?.hotelsUrl,
      message: "We need a city + dates saved to build booking links.",
      config: {
        partnerId: "expedia",
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: buildMeta("unknown", "stay", {
          provider: "expedia",
          priceMode: "live",
          priceFrom: cleanPriceLabel(hotelsPriceFrom),
        }),
      },
    }),
    [affiliateUrls?.hotelsUrl, cityName, buildMeta, hotelsPriceFrom]
  );

  const transportAction = useMemo<PartnerActionBundle>(
    () => ({
      url: affiliateUrls?.omioUrl || affiliateUrls?.transfersUrl,
      message: "We need a city + dates saved to build booking links.",
      config: affiliateUrls?.omioUrl
        ? {
            partnerId: "omio",
            savedItemType: "train",
            title: `Rail & bus for ${cityName}`,
            metadata: buildMeta("unknown", "travel", {
              provider: "omio",
              priceMode: "live",
              transportMode: "rail_bus",
              priceFrom: cleanPriceLabel(transfersPriceFrom),
            }),
          }
        : {
            partnerId: "kiwitaxi",
            savedItemType: "transfer",
            title: `Transfers in ${cityName}`,
            metadata: buildMeta("unknown", "transfers", {
              provider: "kiwitaxi",
              priceMode: "live",
              transportMode: "transfer",
              priceFrom: cleanPriceLabel(transfersPriceFrom),
            }),
          },
    }),
    [affiliateUrls?.omioUrl, affiliateUrls?.transfersUrl, cityName, buildMeta, transfersPriceFrom]
  );

  const thingsAction = useMemo<PartnerActionBundle>(
    () => ({
      url: affiliateUrls?.experiencesUrl,
      message: "We need a city saved to build booking links.",
      config: {
        partnerId: "getyourguide",
        savedItemType: "things",
        title: `Experiences in ${cityName}`,
        metadata: buildMeta("unknown", "things", {
          provider: "getyourguide",
          priceMode: "live",
          priceFrom: cleanPriceLabel(experiencesPriceFrom),
        }),
      },
    }),
    [affiliateUrls?.experiencesUrl, cityName, buildMeta, experiencesPriceFrom]
  );

  const openFlights = useCallback(
    (sourceSurface: SourceSurface = "unknown") =>
      controller.openPartnerOrAlert(flightAction.url, flightAction.message, {
        ...flightAction.config,
        metadata: buildMeta(sourceSurface, "travel", {
          ...(flightAction.config.metadata ?? {}),
        }),
      }),
    [controller, flightAction, buildMeta]
  );

  const openHotels = useCallback(
    (sourceSurface: SourceSurface = "unknown") =>
      controller.openPartnerOrAlert(hotelAction.url, hotelAction.message, {
        ...hotelAction.config,
        metadata: buildMeta(sourceSurface, "stay", {
          ...(hotelAction.config.metadata ?? {}),
        }),
      }),
    [controller, hotelAction, buildMeta]
  );

  const openTransport = useCallback(
    (sourceSurface: SourceSurface = "unknown") => {
      const section: SourceSection = affiliateUrls?.omioUrl ? "travel" : "transfers";

      return controller.openPartnerOrAlert(transportAction.url, transportAction.message, {
        ...transportAction.config,
        metadata: buildMeta(sourceSurface, section, {
          ...(transportAction.config.metadata ?? {}),
        }),
      });
    },
    [controller, transportAction, affiliateUrls?.omioUrl, buildMeta]
  );

  const openThings = useCallback(
    (sourceSurface: SourceSurface = "unknown") =>
      controller.openPartnerOrAlert(thingsAction.url, thingsAction.message, {
        ...thingsAction.config,
        metadata: buildMeta(sourceSurface, "things", {
          ...(thingsAction.config.metadata ?? {}),
        }),
      }),
    [controller, thingsAction, buildMeta]
  );

  const openTickets = useCallback(
    (sourceSurface: SourceSurface = "unknown") => {
      void sourceSurface;
      if (!hasMatch || !primaryMatchId) {
        Alert.alert("Add a match first", "Add a match to unlock tickets + match planning.");
        return;
      }

      return controller.openTicketsForMatch(primaryMatchId);
    },
    [controller, hasMatch, primaryMatchId]
  );

  const bookingSteps = useMemo<BookingStep[]>(
    () => [
      { key: "tickets", complete: isComplete(ticketState), state: ticketState },
      { key: "flight", complete: isComplete(flightState), state: flightState },
      { key: "hotel", complete: isComplete(hotelState), state: hotelState },
      { key: "transfer", complete: isComplete(transportState), state: transportState },
      { key: "things", complete: isComplete(thingsState), state: thingsState },
    ],
    [ticketState, flightState, hotelState, transportState, thingsState]
  );

  const completeCoreCount = useMemo(
    () => bookingSteps.filter((step) => step.key !== "things" && step.complete).length,
    [bookingSteps]
  );

  const tripCompletionPct = useMemo(() => {
    const score =
      (ticketState === "booked" ? 35 : ticketState !== "empty" ? 20 : 0) +
      (flightState === "booked" ? 25 : flightState !== "empty" ? 15 : 0) +
      (hotelState === "booked" ? 25 : hotelState !== "empty" ? 15 : 0) +
      (transportState === "booked" ? 10 : transportState !== "empty" ? 6 : 0) +
      (thingsState === "booked" ? 5 : thingsState !== "empty" ? 3 : 0);

    return Math.max(0, Math.min(100, score));
  }, [ticketState, flightState, hotelState, transportState, thingsState]);

  const nextIncompleteStep = useMemo(
    () =>
      bookingSteps
        .slice()
        .sort((a, b) => stepPriorityScore(a.key) - stepPriorityScore(b.key))
        .find((step) => !step.complete && step.state !== "booked") ?? null,
    [bookingSteps]
  );

  const progressItems = useMemo<TripProgressItem[]>(
    () => [
      { key: "tickets", label: "Tickets", state: ticketState, onPress: () => openTickets("progress_strip") },
      { key: "flight", label: "Flights", state: flightState, onPress: () => openFlights("progress_strip") },
      { key: "hotel", label: "Hotel", state: hotelState, onPress: () => openHotels("progress_strip") },
      {
        key: "transfer",
        label: affiliateUrls?.omioUrl ? "Rail/Bus" : "Transfer",
        state: transportState,
        onPress: () => openTransport("progress_strip"),
      },
      { key: "things", label: "Things", state: thingsState, onPress: () => openThings("progress_strip") },
    ],
    [
      affiliateUrls?.omioUrl,
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
    ]
  );

  const nextAction = useMemo<NextAction | null>(() => {
    if (!hasMatch) {
      return {
        title: "Start by choosing a match",
        body: "No primary match means no proper trip flow. Pick the match first, then everything else becomes specific and prefilled.",
        cta: "Add a match",
        onPress: () => {
          Alert.alert("Add a match first", "Use the Matches card to add or select the primary fixture for this trip.");
        },
        badge: "Blocked",
      };
    }

    if (!hasTickets) {
      return {
        title: "Book tickets first",
        body: "Tickets are the anchor. Until the seat is sorted, flights and hotels are premature.",
        cta: cleanPriceLabel(ticketsPriceFrom) ? `Compare tickets • ${ticketsPriceFrom}` : "Compare tickets",
        onPress: () => openTickets("next_best_action"),
        badge: "Priority",
      };
    }

    if (kickoffTbc && !hasFlight) {
      return {
        title: "Kickoff not confirmed — use flexible travel",
        body: "You’ve started correctly with tickets. Now keep flights flexible because hard-booking travel against a moving kickoff is reckless.",
        cta: cleanPriceLabel(flightsPriceFrom) ? `View flights • ${flightsPriceFrom}` : "View flights",
        onPress: () => openFlights("next_best_action"),
        secondaryCta: "Open tickets",
        onSecondaryPress: () => openTickets("next_best_action"),
        badge: "TBC",
        proLocked: true,
      };
    }

    if (!hasFlight) {
      return {
        title: "Add flights next",
        body: "The trip is not real until transport in and out is covered.",
        cta: cleanPriceLabel(flightsPriceFrom) ? `View flights • ${flightsPriceFrom}` : "View flights",
        onPress: () => openFlights("next_best_action"),
      };
    }

    if (!hasHotel) {
      return {
        title: "Lock the hotel",
        body: "A bad hotel choice ruins matchday logistics. Book the stay after tickets and flights, not before.",
        cta: cleanPriceLabel(hotelsPriceFrom) ? `View hotels • ${hotelsPriceFrom}` : "View hotels",
        onPress: () => openHotels("next_best_action"),
        secondaryCta: "Stay guidance",
        onSecondaryPress: () => {
          void setActiveWorkspaceSection("stay");
          Alert.alert("Stay guidance", "Use the stay section and guidance card to avoid booking in a useless area.");
        },
      };
    }

    if (!hasTransport) {
      return {
        title: "Sort local transport",
        body: "Airport, hotel, stadium. Remove that friction now instead of scrambling later.",
        cta: cleanPriceLabel(transfersPriceFrom)
          ? `${affiliateUrls?.omioUrl ? "Rail / bus" : "Transfers"} • ${transfersPriceFrom}`
          : affiliateUrls?.omioUrl
          ? "View rail / bus"
          : "View transfers",
        onPress: () => openTransport("next_best_action"),
      };
    }

    if (!hasThings) {
      return {
        title: "Add extras only if they improve the trip",
        body: "Core trip is covered. Extras should earn their place, not bloat the plan.",
        cta: cleanPriceLabel(experiencesPriceFrom) ? `View activities • ${experiencesPriceFrom}` : "View activities",
        onPress: () => openThings("next_best_action"),
        badge: "Optional",
      };
    }

    return {
      title: "Trip booking flow complete",
      body: "Core trip components are covered. Store proof, confirmations and QR codes in Wallet and stop fiddling with finished work.",
      cta: "Open wallet",
      onPress: controller.onViewWallet,
      badge: "Ready",
    };
  }, [
    affiliateUrls?.omioUrl,
    controller.onViewWallet,
    experiencesPriceFrom,
    flightsPriceFrom,
    hasFlight,
    hasHotel,
    hasMatch,
    hasThings,
    hasTickets,
    hasTransport,
    hotelsPriceFrom,
    kickoffTbc,
    openFlights,
    openHotels,
    openThings,
    openTickets,
    openTransport,
    setActiveWorkspaceSection,
    ticketsPriceFrom,
    transfersPriceFrom,
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

    if (!hasTickets && primaryMatchId) {
      add(
        "Tickets",
        ticketButtonSubtitle({ primaryTicketItem, ticketState, ticketsPriceFrom }),
        () => openTickets("smart_booking"),
        "primary",
        ticketProviderFromItem(primaryTicketItem)
      );
    }

    if (!hasFlight) {
      add(
        "Flights",
        completionLabel(
          flightState,
          pricingOrFallback(flightsPriceFrom, "Aviasales • live fares"),
          "Flight option saved",
          "Flight booked"
        ),
        () => openFlights("smart_booking"),
        hasTickets ? "primary" : "neutral",
        "aviasales"
      );
    }

    if (!hasHotel) {
      add(
        "Hotels",
        completionLabel(
          hotelState,
          pricingOrFallback(hotelsPriceFrom, "Expedia • live rates"),
          "Hotel option saved",
          "Hotel booked"
        ),
        () => openHotels("smart_booking"),
        hasTickets && hasFlight ? "primary" : "neutral",
        "expedia"
      );
    }

    if (!hasTransport && affiliateUrls.omioUrl) {
      add(
        "Rail / Bus",
        completionLabel(
          transportState,
          pricingOrFallback(transfersPriceFrom, "Omio • live routes"),
          "Transport option saved",
          "Transport booked"
        ),
        () => openTransport("smart_booking"),
        "neutral",
        "omio"
      );
    } else if (!hasTransport) {
      add(
        "Transfers",
        completionLabel(
          transportState,
          pricingOrFallback(transfersPriceFrom, "Kiwitaxi • live pricing"),
          "Transfer option saved",
          "Transfer booked"
        ),
        () => openTransport("smart_booking"),
        "neutral",
        "kiwitaxi"
      );
    }

    if (!hasThings) {
      add(
        "Activities",
        completionLabel(
          thingsState,
          pricingOrFallback(experiencesPriceFrom, "GetYourGuide • live options"),
          "Activity saved",
          "Activity booked"
        ),
        () => openThings("smart_booking"),
        "neutral",
        "getyourguide"
      );
    }

    if (buttons.length === 0) {
      add("Wallet", "Trip proof and confirmations", controller.onViewWallet, "primary", null);

      if (affiliateUrls.omioUrl) {
        add(
          "Rail / Bus",
          pricingOrFallback(transfersPriceFrom, "Omio • live routes"),
          () => openTransport("smart_booking"),
          "neutral",
          "omio"
        );
      } else {
        add(
          "Activities",
          pricingOrFallback(experiencesPriceFrom, "GetYourGuide • live options"),
          () => openThings("smart_booking"),
          "neutral",
          "getyourguide"
        );
      }
    }

    return buttons.slice(0, 4);
  }, [
    affiliateUrls,
    controller.onViewWallet,
    experiencesPriceFrom,
    flightsPriceFrom,
    hasFlight,
    hasHotel,
    hasThings,
    hasTickets,
    hasTransport,
    hotelsPriceFrom,
    openFlights,
    openHotels,
    openThings,
    openTickets,
    openTransport,
    primaryMatchId,
    primaryTicketItem,
    ticketState,
    flightState,
    hotelState,
    transportState,
    thingsState,
    ticketsPriceFrom,
    transfersPriceFrom,
    trip,
  ]);

  const capHint = useMemo(
    () => (!isPro ? proCapHint(FREE_TRIP_CAP, tripCount) : undefined),
    [isPro, tripCount]
  );

  const heroBannerCounts = useMemo(
    () => ({
      pending: pending.length,
      saved: saved.length,
      booked: booked.length,
    }),
    [pending.length, saved.length, booked.length]
  );

  const bookingFunnelLabel = useMemo(() => {
    if (!hasMatch) return "No fixture selected";
    if (!hasTickets) return "Step 1 of 4 • Tickets";
    if (!hasFlight) return "Step 2 of 4 • Flights";
    if (!hasHotel) return "Step 3 of 4 • Hotel";
    if (!hasTransport) return "Step 4 of 4 • Transport";
    return "Core trip flow complete";
  }, [hasMatch, hasTickets, hasFlight, hasHotel, hasTransport]);

  const commercialSummaryLine = useMemo(() => {
    if (cleanPriceLabel(tripPriceFrom)) return `${tripPriceFrom} total for core trip`;

    const parts = [ticketsPriceFrom, flightsPriceFrom, hotelsPriceFrom]
      .map((x) => cleanPriceLabel(x))
      .filter(Boolean) as string[];

    if (parts.length >= 2) return parts.join(" • ");
    if (parts.length === 1) return parts[0];
    return null;
  }, [tripPriceFrom, ticketsPriceFrom, flightsPriceFrom, hotelsPriceFrom]);

  const completionSummary = useMemo(() => {
    if (!hasMatch) return "Trip not started";
    if (tripCompletionPct >= 90) return "Trip essentially complete";
    if (tripCompletionPct >= 60) return "Trip well underway";
    if (tripCompletionPct >= 30) return "Trip taking shape";
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
