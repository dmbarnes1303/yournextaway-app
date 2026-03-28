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

type PricePointSource = "saved_item" | "metadata" | "price_text" | null;
type PriceDisplayMode = "booked" | "live_from" | "est_from";

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
  started: boolean;
  state: ProgressState;
};

const FREE_TRIP_CAP = 5;

function isStarted(state: ProgressState): boolean {
  return state !== "empty";
}

function isComplete(state: ProgressState): boolean {
  return state === "booked";
}

function cleanPriceLabel(value?: string | null): string | null {
  const next = String(value ?? "").trim();
  return next || null;
}

function pricingOrFallback(priceLine: string | null | undefined, fallback: string): string {
  return cleanPriceLabel(priceLine) || fallback;
}

function completionLabel(
  state: ProgressState,
  emptyLabel: string,
  inProgressLabel: string,
  doneLabel: string
): string {
  if (state === "booked") return doneLabel;
  if (state === "pending" || state === "saved") return inProgressLabel;
  return emptyLabel;
}

function ticketButtonSubtitle(args: {
  primaryTicketItem: SavedItem | null;
  ticketState: ProgressState;
  ticketsPriceFrom?: string | null;
}): string {
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

function stepPriorityScore(step: BookingStepKey): number {
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
  bookingPriceBoard = null,
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
    };
  }, [affiliateUrls?.flightsUrl, cityName, buildMeta, flightsPriceFrom]);

  const hotelAction = useMemo<PartnerActionBundle>(() => {
    return {
      url: affiliateUrls?.hotelsUrl || affiliateUrls?.staysUrl,
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
    };
  }, [affiliateUrls?.hotelsUrl, affiliateUrls?.staysUrl, cityName, buildMeta, hotelsPriceFrom]);

  const transportAction = useMemo<PartnerActionBundle>(() => {
    const hasOmio = Boolean(affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl);

    return {
      url: affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl || affiliateUrls?.transfersUrl,
      message: "We need a city + dates saved to build booking links.",
      config: hasOmio
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
    };
  }, [
    affiliateUrls?.omioUrl,
    affiliateUrls?.trainsUrl,
    affiliateUrls?.transfersUrl,
    cityName,
    buildMeta,
    transfersPriceFrom,
  ]);

  const thingsAction = useMemo<PartnerActionBundle>(() => {
    return {
      url: affiliateUrls?.experiencesUrl || affiliateUrls?.thingsUrl,
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
    };
  }, [
    affiliateUrls?.experiencesUrl,
    affiliateUrls?.thingsUrl,
    cityName,
    buildMeta,
    experiencesPriceFrom,
  ]);

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
      const section: SourceSection =
        affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl ? "travel" : "transfers";

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
    [
      controller,
      transportAction,
      affiliateUrls?.omioUrl,
      affiliateUrls?.trainsUrl,
      buildMeta,
      setWorkspaceSection,
    ]
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
    const score =
      (ticketState === "booked" ? 35 : ticketState !== "empty" ? 20 : 0) +
      (flightState === "booked" ? 25 : flightState !== "empty" ? 15 : 0) +
      (hotelState === "booked" ? 25 : hotelState !== "empty" ? 15 : 0) +
      (transportState === "booked" ? 10 : transportState !== "empty" ? 6 : 0) +
      (thingsState === "booked" ? 5 : thingsState !== "empty" ? 3 : 0);

    return Math.max(0, Math.min(100, score));
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
        title:
          ticketState === "empty" ? "Book tickets first" : "Finish ticket booking first",
        body:
          ticketState === "empty"
            ? "Tickets are the anchor. Until that is sorted, flights and hotels are guesswork."
            : "You already started the ticket step. Finish that before treating the trip as properly anchored.",
        cta: cleanPriceLabel(ticketsPriceFrom)
          ? `Compare tickets • ${ticketsPriceFrom}`
          : "Compare tickets",
        onPress: () => {
          void openTickets("next_best_action");
        },
        badge: "Priority",
      };
    }

    if (kickoffTbc && flightState === "empty") {
      return {
        title: "Kickoff not confirmed — keep travel flexible",
        body: "Tickets are sorted, but the kickoff still looks unstable. If you book travel now, keep it flexible rather than pretending the schedule is locked.",
        cta: cleanPriceLabel(flightsPriceFrom)
          ? `View flights • ${flightsPriceFrom}`
          : "View flights",
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
            ? "The trip is not real until transport in and out is covered."
            : "Travel has been started but not actually locked in. Finish it instead of skipping ahead.",
        cta: cleanPriceLabel(flightsPriceFrom)
          ? `View flights • ${flightsPriceFrom}`
          : "View flights",
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
            ? "A bad location ruins matchday logistics. Book the stay after tickets and flights, not before."
            : "You started looking at stays. Finish that choice and stop leaving the trip half-built.",
        cta: cleanPriceLabel(hotelsPriceFrom)
          ? `View hotels • ${hotelsPriceFrom}`
          : "View hotels",
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
        title:
          transportState === "empty"
            ? "Sort local transport"
            : "Finish local transport",
        body:
          transportState === "empty"
            ? "Airport, hotel, stadium. Remove that friction now instead of scrambling later."
            : "Transport is underway but not properly settled yet. Finish that before drifting into extras.",
        cta: cleanPriceLabel(transfersPriceFrom)
          ? `${
              affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl ? "Rail / bus" : "Transfers"
            } • ${transfersPriceFrom}`
          : affiliateUrls?.omioUrl || affiliateUrls?.trainsUrl
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
            : "Extras are optional, but if you started adding them, finish cleanly rather than leaving loose ends.",
        cta: cleanPriceLabel(experiencesPriceFrom)
          ? `View activities • ${experiencesPriceFrom}`
          : "View activities",
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
    experiencesPriceFrom,
    flightsPriceFrom,
    ticketState,
    flightState,
    hotelState,
    transportState,
    thingsState,
    hasMatch,
    hotelsPriceFrom,
    kickoffTbc,
    openFlights,
    openHotels,
    openThings,
    openTickets,
    openTransport,
    setWorkspaceSection,
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

    if (ticketState !== "booked" && primaryMatchId) {
      add(
        "Tickets",
        ticketButtonSubtitle({
          primaryTicketItem,
          ticketState,
          ticketsPriceFrom,
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
        completionLabel(
          flightState,
          pricingOrFallback(flightsPriceFrom, "Aviasales • live fares"),
          "Flight option saved",
          "Flight booked"
        ),
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
        completionLabel(
          hotelState,
          pricingOrFallback(hotelsPriceFrom, "Expedia • live rates"),
          "Hotel option saved",
          "Hotel booked"
        ),
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
        completionLabel(
          transportState,
          pricingOrFallback(transfersPriceFrom, "Omio • live routes"),
          "Transport option saved",
          "Transport booked"
        ),
        () => {
          void openTransport("smart_booking");
        },
        "neutral",
        "omio"
      );
    } else if (transportState !== "booked") {
      add(
        "Transfers",
        completionLabel(
          transportState,
          pricingOrFallback(transfersPriceFrom, "Kiwitaxi • live pricing"),
          "Transfer option saved",
          "Transfer booked"
        ),
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
        completionLabel(
          thingsState,
          pricingOrFallback(experiencesPriceFrom, "GetYourGuide • live options"),
          "Activity saved",
          "Activity booked"
        ),
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
          pricingOrFallback(transfersPriceFrom, "Omio • live routes"),
          () => {
            void openTransport("smart_booking");
          },
          "neutral",
          "omio"
        );
      } else {
        add(
          "Activities",
          pricingOrFallback(experiencesPriceFrom, "GetYourGuide • live options"),
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
    experiencesPriceFrom,
    flightsPriceFrom,
    flightState,
    hotelState,
    thingsState,
    transportState,
    ticketState,
    hotelsPriceFrom,
    openFlights,
    openHotels,
    openThings,
    openTickets,
    openTransport,
    primaryMatchId,
    primaryTicketItem,
    ticketsPriceFrom,
    transfersPriceFrom,
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
    if (ticketState !== "booked") return "Step 1 of 4 • Tickets";
    if (flightState !== "booked") return "Step 2 of 4 • Flights";
    if (hotelState !== "booked") return "Step 3 of 4 • Hotel";
    if (transportState !== "booked") return "Step 4 of 4 • Transport";
    return "Core trip flow complete";
  }, [hasMatch, ticketState, flightState, hotelState, transportState]);

  const commercialSummaryLine = useMemo(() => {
    if (cleanPriceLabel(tripPriceFrom)) {
      return `${tripPriceFrom} total for core trip`;
    }

    const parts = [ticketsPriceFrom, flightsPriceFrom, hotelsPriceFrom]
      .map((value) => cleanPriceLabel(value))
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
