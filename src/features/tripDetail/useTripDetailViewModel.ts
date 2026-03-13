import { Alert } from "react-native";
import { useCallback, useMemo } from "react";

import tripsStore, { type Trip } from "@/src/state/trips";

import type { PartnerId } from "@/src/core/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import type { NextAction } from "@/src/components/NextBestActionCard";
import type { TripProgressStripItem } from "@/src/components/TripProgressStrip";

import {
  cleanUpper3,
  proCapHint,
  smartButtonSubtitle,
  ticketProviderFromItem,
  type SmartButton,
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

type ProgressState = {
  tickets: string;
  flight: string;
  hotel: string;
  transfer: string;
  things: string;
};

type AffiliateUrls = {
  flightsUrl: string;
  hotelsUrl: string;
  omioUrl: string;
  transfersUrl: string;
  experiencesUrl: string;
  mapsUrl: string;
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
  progress: ProgressState;
  readiness: { score: number; missing: string[] };
  pending: SavedItem[];
  saved: SavedItem[];
  booked: SavedItem[];
  primaryMatchId: string | null;
  primaryTicketItem: SavedItem | null;
  isPro: boolean;
  kickoffTbc: boolean;
  controller: Controller;
  setActiveWorkspaceSection: (section: string) => Promise<void> | void;
};

const FREE_TRIP_CAP = 5;

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
}: Params) {
  const hasTickets = progress.tickets !== "empty";
  const hasFlight = progress.flight !== "empty";
  const hasHotel = progress.hotel !== "empty";
  const hasTransport = progress.transfer !== "empty";
  const hasThings = progress.things !== "empty";
  const hasMatch = Boolean(primaryMatchId);

  const tripCount = useMemo(() => tripsStore.getState().trips?.length ?? 0, [tripsLoaded]);

  const loading = useMemo(
    () => Boolean(routeTripId && (!tripsLoaded || !savedLoaded || !workspaceLoaded)),
    [routeTripId, tripsLoaded, savedLoaded, workspaceLoaded]
  );

  const showHeroBanners = useMemo(
    () => pending.length > 0 || saved.length > 0 || booked.length > 0,
    [pending.length, saved.length, booked.length]
  );

  const flightAction = useMemo<PartnerActionBundle>(
    () => ({
      url: affiliateUrls?.flightsUrl,
      message: "We need a city + dates saved to build booking links.",
      config: {
        partnerId: "aviasales",
        savedItemType: "flight",
        title: `Flights to ${cityName}`,
        metadata: {
          city: cityName,
          originIata: cleanUpper3(originIata, "LON"),
          priceMode: "live",
        },
      },
    }),
    [affiliateUrls?.flightsUrl, cityName, originIata]
  );

  const hotelAction = useMemo<PartnerActionBundle>(
    () => ({
      url: affiliateUrls?.hotelsUrl,
      message: "We need a city + dates saved to build booking links.",
      config: {
        partnerId: "expedia",
        savedItemType: "hotel",
        title: `Hotels in ${cityName}`,
        metadata: {
          city: cityName,
          startDate: trip?.startDate,
          endDate: trip?.endDate,
          priceMode: "live",
        },
      },
    }),
    [affiliateUrls?.hotelsUrl, cityName, trip?.startDate, trip?.endDate]
  );

  const transportAction = useMemo<PartnerActionBundle>(
    () => ({
      url: affiliateUrls?.omioUrl || affiliateUrls?.transfersUrl,
      message: "We need a city + dates saved to build booking links.",
      config: affiliateUrls?.omioUrl
        ? {
            partnerId: "omio",
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
            partnerId: "kiwitaxi",
            savedItemType: "transfer",
            title: `Transfers in ${cityName}`,
            metadata: {
              city: cityName,
              startDate: trip?.startDate,
              endDate: trip?.endDate,
              priceMode: "live",
              transportMode: "transfer",
            },
          },
    }),
    [affiliateUrls?.omioUrl, affiliateUrls?.transfersUrl, cityName, trip?.startDate, trip?.endDate]
  );

  const thingsAction = useMemo<PartnerActionBundle>(
    () => ({
      url: affiliateUrls?.experiencesUrl,
      message: "We need a city saved to build booking links.",
      config: {
        partnerId: "getyourguide",
        savedItemType: "things",
        title: `Experiences in ${cityName}`,
        metadata: {
          city: cityName,
          priceMode: "live",
        },
      },
    }),
    [affiliateUrls?.experiencesUrl, cityName]
  );

  const openFlights = useCallback(() => {
    return controller.openPartnerOrAlert(
      flightAction.url,
      flightAction.message,
      flightAction.config
    );
  }, [controller, flightAction]);

  const openHotels = useCallback(() => {
    return controller.openPartnerOrAlert(
      hotelAction.url,
      hotelAction.message,
      hotelAction.config
    );
  }, [controller, hotelAction]);

  const openTransport = useCallback(() => {
    return controller.openPartnerOrAlert(
      transportAction.url,
      transportAction.message,
      transportAction.config
    );
  }, [controller, transportAction]);

  const openThings = useCallback(() => {
    return controller.openPartnerOrAlert(
      thingsAction.url,
      thingsAction.message,
      thingsAction.config
    );
  }, [controller, thingsAction]);

  const openTickets = useCallback(() => {
    if (!hasMatch || !primaryMatchId) {
      Alert.alert("Add a match first", "Add a match to unlock tickets + match planning.");
      return;
    }

    return controller.openTicketsForMatch(primaryMatchId);
  }, [controller, hasMatch, primaryMatchId]);

  const progressItems = useMemo<TripProgressStripItem[]>(
    () => [
      {
        key: "tickets",
        label: "Tickets",
        state: progress.tickets as any,
        onPress: openTickets,
      },
      {
        key: "flight",
        label: "Flights",
        state: progress.flight as any,
        onPress: openFlights,
      },
      {
        key: "hotel",
        label: "Hotel",
        state: progress.hotel as any,
        onPress: openHotels,
      },
      {
        key: "transfer",
        label: affiliateUrls?.omioUrl ? "Rail/Bus" : "Transfer",
        state: progress.transfer as any,
        onPress: openTransport,
      },
      {
        key: "things",
        label: "Things",
        state: progress.things as any,
        onPress: openThings,
      },
    ],
    [
      affiliateUrls?.omioUrl,
      openFlights,
      openHotels,
      openThings,
      openTickets,
      openTransport,
      progress.flight,
      progress.hotel,
      progress.things,
      progress.tickets,
      progress.transfer,
    ]
  );

  const nextAction = useMemo<NextAction | null>(() => {
    if (!hasTickets) {
      return {
        title: "Start with match tickets",
        body: "Tickets are the anchor. Compare providers and secure seats first, then build travel around it.",
        cta: "Find tickets",
        onPress: openTickets,
        badge: "High impact",
      };
    }

    if (kickoffTbc) {
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
        onPress: openTransport,
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
      onPress: controller.onViewWallet,
      badge: "Ready",
    };
  }, [
    affiliateUrls?.omioUrl,
    controller.onViewWallet,
    hasFlight,
    hasHotel,
    hasThings,
    hasTickets,
    hasTransport,
    kickoffTbc,
    openFlights,
    openHotels,
    openThings,
    openTickets,
    openTransport,
    setActiveWorkspaceSection,
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
        smartButtonSubtitle(primaryTicketItem, "Compare live ticket options"),
        openTickets,
        "primary",
        ticketProviderFromItem(primaryTicketItem)
      );
    }

    if (!hasFlight) add("Flights", "Aviasales (live)", openFlights, "primary", "aviasales");
    if (!hasHotel) add("Hotels", "Expedia (live)", openHotels, "primary", "expedia");

    if (!hasTransport && affiliateUrls.omioUrl) {
      add("Rail / Bus", "Omio (live)", openTransport, "neutral", "omio");
    } else if (!hasTransport) {
      add("Transfers", "Kiwitaxi (live)", openTransport, "neutral", "kiwitaxi");
    }

    if (!hasThings) {
      add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");
    }

    if (buttons.length === 0) {
      add("Hotels", "Expedia (live)", openHotels, "primary", "expedia");

      if (affiliateUrls.omioUrl) {
        add("Rail / Bus", "Omio (live)", openTransport, "neutral", "omio");
      } else {
        add("Activities", "GetYourGuide (live)", openThings, "neutral", "getyourguide");
      }
    }

    return buttons.slice(0, 4);
  }, [
    affiliateUrls,
    hasFlight,
    hasHotel,
    hasThings,
    hasTickets,
    hasTransport,
    openFlights,
    openHotels,
    openThings,
    openTickets,
    openTransport,
    primaryMatchId,
    primaryTicketItem,
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
  };
}
