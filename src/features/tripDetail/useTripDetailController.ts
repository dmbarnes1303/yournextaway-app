import React from "react";
import { Alert, type AlertButton } from "react-native";
import { useRouter } from "expo-router";

import tripsStore, {
  type Trip,
  type TripSnapshotPatch,
} from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import type { PartnerId } from "@/src/core/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import type { WorkspaceSectionKey } from "@/src/core/tripWorkspace";
import { sectionForSavedItemType } from "@/src/core/tripWorkspace";

import { DEFAULT_SEASON } from "@/src/constants/football";

import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";
import { attachTicketProof } from "@/src/services/ticketAttachment";
import {
  resolveTicketForFixture,
  type TicketResolutionOption,
  type TicketResolutionResult,
} from "@/src/services/ticketResolver";
import type { FixtureListRow } from "@/src/services/apiFootball";

import { getTicketGuide } from "@/src/data/ticketGuides";

import {
  clean,
  defer,
  getIsoDateOnly,
  mapTicketProviderToPartnerId,
  normalizeTicketOptions,
  noteTitleFromText,
  cleanNoteText,
  ticketResolverFailureMessage,
  type SourceSection,
  type SourceSurface,
} from "@/src/features/tripDetail/helpers";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

type AffiliateUrls = {
  ticketsUrl?: string | null;
  hotelUrl?: string | null;
  flightsUrl?: string | null;
  trainsUrl?: string | null;
  transfersUrl?: string | null;
  thingsUrl?: string | null;
  mapsUrl?: string | null;
} | null;

type Props = {
  trip: Trip | null;
  activeTripId: string | null;
  cityName: string;
  primaryLeagueId?: number;
  fixturesById: Record<string, FixtureListRow>;
  ticketsByMatchId: Record<string, SavedItem | null>;
  affiliateUrls?: AffiliateUrls;
  noteText?: string;
  setNoteText?: SetState<string>;
  setNoteSaving?: SetState<boolean>;
  setProofBusyId?: SetState<string | null>;
  setActiveWorkspaceSection?: (section: WorkspaceSectionKey) => Promise<void> | void;
};

type TrackedPartnerArgs = {
  partnerId: PartnerId;
  url: string;
  title: string;
  savedItemType?: SavedItemType;
  metadata?: Record<string, unknown>;
};

type CanonicalTripBuildParams = {
  tripId: string;
  from: string;
  to: string;
  city?: string;
  leagueId?: string;
  season?: string;
};

function inferSourceSectionFromSavedItemType(type?: SavedItemType): SourceSection {
  switch (type) {
    case "tickets":
      return "tickets";
    case "hotel":
      return "stay";
    case "flight":
    case "train":
      return "travel";
    case "transfer":
      return "transfers";
    case "things":
      return "things";
    case "insurance":
      return "insurance";
    case "claim":
      return "claims";
    case "note":
    case "other":
      return "notes";
    default:
      return "unknown";
  }
}

function safeSourceSurface(value: unknown): SourceSurface {
  const v = clean(value);
  if (!v) return "unknown";
  return v as SourceSurface;
}

function getTrackedPartnerErrorMessage(error: unknown): string {
  const raw = clean((error as { message?: unknown })?.message ?? error);

  if (!raw) return "This partner link could not be opened right now.";
  if (raw.includes("tripId is required")) {
    return "Save the trip first before opening booking partners.";
  }
  if (raw.includes("url is required")) {
    return "This partner link is missing a valid URL.";
  }
  if (raw.includes("Partner open already in progress")) {
    return "A partner link is already opening. Wait a second and try again.";
  }

  return "This partner link could not be opened right now.";
}

function normalizeTrackedPartnerArgs(
  args: TrackedPartnerArgs,
  context: {
    tripId: string | null;
    cityName: string;
    trip: Trip | null;
  },
  sourceSurface: SourceSurface
): TrackedPartnerArgs {
  const rawSourceSection = clean(args.metadata?.sourceSection);
  const sourceSection =
    (rawSourceSection as SourceSection) ||
    inferSourceSectionFromSavedItemType(args.savedItemType);

  return {
    ...args,
    url: clean(args.url),
    title: clean(args.title),
    metadata: {
      tripId: context.tripId,
      city: context.cityName,
      startDate: context.trip?.startDate ?? null,
      endDate: context.trip?.endDate ?? null,
      primaryMatchId: clean(context.trip?.fixtureIdPrimary) || null,
      sourceSurface,
      sourceSection,
      ...(args.metadata ?? {}),
    },
  };
}

function buildOfficialTicketFallbackMessage(homeName: string) {
  return `No valid reseller ticket options were found right now. Try ${homeName}'s official ticket page instead.`;
}

function buildCanonicalTripBuildParams(args: {
  trip: Trip;
  cityName: string;
  primaryLeagueId?: number;
}): CanonicalTripBuildParams {
  return {
    tripId: args.trip.id,
    from: args.trip.startDate,
    to: args.trip.endDate,
    city: args.cityName || undefined,
    leagueId:
      typeof args.primaryLeagueId === "number" && Number.isFinite(args.primaryLeagueId)
        ? String(args.primaryLeagueId)
        : undefined,
    season: String(DEFAULT_SEASON),
  };
}

function buildPrimarySnapshotFromFixtureRow(
  row: FixtureListRow | null,
  fallbackDisplayCity?: string
): TripSnapshotPatch | null {
  if (!row?.fixture?.id) return null;

  const homeName = clean(row.teams?.home?.name) || undefined;
  const awayName = clean(row.teams?.away?.name) || undefined;
  const leagueName = clean(row.league?.name) || undefined;
  const round = clean(row.league?.round) || undefined;
  const kickoffIso = clean(row.fixture?.date) || undefined;
  const venueName = clean(row.fixture?.venue?.name) || undefined;
  const venueCity = clean(row.fixture?.venue?.city) || undefined;

  const homeTeamId =
    typeof row.teams?.home?.id === "number" ? row.teams.home.id : undefined;
  const awayTeamId =
    typeof row.teams?.away?.id === "number" ? row.teams.away.id : undefined;
  const leagueId =
    typeof row.league?.id === "number" ? row.league.id : undefined;

  const statusShort = clean(row.fixture?.status?.short).toUpperCase();
  const kickoffDate = kickoffIso ? new Date(kickoffIso) : null;
  const midnight =
    kickoffDate && Number.isFinite(kickoffDate.getTime())
      ? kickoffDate.getHours() === 0 && kickoffDate.getMinutes() === 0
      : true;

  const kickoffTbc =
    statusShort === "TBD" ||
    statusShort === "TBA" ||
    statusShort === "NS" ||
    statusShort === "PST" ||
    midnight;

  return {
    fixtureIdPrimary: String(row.fixture.id),
    homeTeamId,
    awayTeamId,
    homeName,
    awayName,
    leagueId,
    leagueName,
    round,
    kickoffIso,
    kickoffTbc,
    venueName,
    venueCity,
    displayCity: venueCity || clean(fallbackDisplayCity) || undefined,
  };
}

export default function useTripDetailController({
  trip,
  activeTripId,
  cityName,
  primaryLeagueId,
  fixturesById,
  ticketsByMatchId,
  affiliateUrls = null,
  noteText = "",
  setNoteText = () => {},
  setNoteSaving = () => {},
  setProofBusyId = () => {},
  setActiveWorkspaceSection = () => {},
}: Props) {
  const router = useRouter();

  function openTripBuilder() {
    if (!trip) return;

    const params = buildCanonicalTripBuildParams({
      trip,
      cityName,
      primaryLeagueId,
    });

    router.push({
      pathname: "/trip/build",
      params,
    } as never);
  }

  function onEditTrip() {
    openTripBuilder();
  }

  function onAddMatch() {
    openTripBuilder();
  }

  function onViewWallet() {
    router.push("/(tabs)/wallet" as never);
  }

  function onUpgradePress() {
    Alert.alert(
      "Go Pro",
      "Pro removes caps and adds automation later. This is the placeholder entry point.",
      [{ text: "OK" }]
    );
  }

  async function onOpenSection(section: WorkspaceSectionKey | string) {
    const next = clean(section) as WorkspaceSectionKey;
    if (!next) return;

    try {
      await setActiveWorkspaceSection(next);
    } catch {}

    const tripId = clean(trip?.id) || clean(activeTripId);
    if (!tripId) {
      Alert.alert("Save trip first", "Save this trip before booking.");
      return;
    }

    if (next === "tickets") {
      const primaryMatchId = clean(trip?.fixtureIdPrimary);
      if (primaryMatchId) {
        await openTicketsForMatch(primaryMatchId);
      } else {
        Alert.alert("Tickets not ready", "No primary match is attached to this trip yet.");
      }
      return;
    }

    if (next === "stay") {
      const url = clean(affiliateUrls?.hotelUrl);
      if (!url) {
        Alert.alert("Hotels not ready", "No hotel search available yet.");
        return;
      }

      await openTrackedPartner({
        partnerId: "expedia" as PartnerId,
        url,
        savedItemType: "hotel",
        title: `Stays in ${cityName}`,
        metadata: {
          sourceSurface: "planning_rail",
          sourceSection: "stay",
        },
      });
      return;
    }

    if (next === "travel") {
      const url = clean(
        affiliateUrls?.flightsUrl || affiliateUrls?.trainsUrl || affiliateUrls?.transfersUrl
      );
      if (!url) {
        Alert.alert("Travel not ready", "No travel search available yet.");
        return;
      }

      const partnerId: PartnerId = clean(affiliateUrls?.flightsUrl)
        ? ("aviasales" as PartnerId)
        : clean(affiliateUrls?.trainsUrl)
          ? ("omio" as PartnerId)
          : ("kiwitaxi" as PartnerId);

      const itemType: SavedItemType = clean(affiliateUrls?.flightsUrl)
        ? "flight"
        : clean(affiliateUrls?.trainsUrl)
          ? "train"
          : "transfer";

      const title =
        itemType === "flight"
          ? `Flights to ${cityName}`
          : itemType === "train"
            ? `Trains to ${cityName}`
            : `Transfers in ${cityName}`;

      await openTrackedPartner({
        partnerId,
        url,
        savedItemType: itemType,
        title,
        metadata: {
          sourceSurface: "planning_rail",
          sourceSection: "travel",
        },
      });
      return;
    }

    if (next === "things") {
      const url = clean(affiliateUrls?.thingsUrl);
      if (!url) {
        Alert.alert("Experiences not ready", "No activities available yet.");
        return;
      }

      await openTrackedPartner({
        partnerId: "getyourguide" as PartnerId,
        url,
        savedItemType: "things",
        title: `Things to do in ${cityName}`,
        metadata: {
          sourceSurface: "planning_rail",
          sourceSection: "things",
        },
      });
      return;
    }

    if (next === "transfers") {
      const url = clean(affiliateUrls?.transfersUrl);
      if (!url) {
        Alert.alert("Transfers not ready", "No transfer booking link is available yet.");
        return;
      }

      await openTrackedPartner({
        partnerId: "kiwitaxi" as PartnerId,
        url,
        savedItemType: "transfer",
        title: `Transfers in ${cityName}`,
        metadata: {
          sourceSurface: "planning_rail",
          sourceSection: "transfers",
        },
      });
    }
  }

  async function openUntracked(url?: string | null) {
    const nextUrl = clean(url);
    if (!nextUrl) {
      Alert.alert("Missing link", "No valid link is available here yet.");
      return;
    }

    try {
      await openUntrackedUrl(nextUrl);
    } catch {
      Alert.alert("Couldn’t open link", "Try again in a moment.");
    }
  }

  async function openTrackedPartner(args: TrackedPartnerArgs) {
    const tripId = clean(trip?.id) || clean(activeTripId);

    if (!tripId) {
      Alert.alert(
        "Save trip first",
        "Save this trip before booking so we can store it in Wallet."
      );
      return;
    }

    const rawUrl = clean(args.url);
    if (!rawUrl) {
      Alert.alert("Missing link", "This booking link is not ready yet.");
      return;
    }

    if (args.partnerId === ("googlemaps" as PartnerId)) {
      await openUntracked(rawUrl);
      return;
    }

    const enriched = normalizeTrackedPartnerArgs(
      args,
      { tripId, cityName, trip },
      safeSourceSurface(args.metadata?.sourceSurface)
    );

    try {
      await beginPartnerClick({
        tripId,
        partnerId: enriched.partnerId,
        url: enriched.url,
        savedItemType: enriched.savedItemType,
        title: enriched.title,
        metadata: enriched.metadata,
      });

      const nextSection = enriched.savedItemType
        ? sectionForSavedItemType(enriched.savedItemType)
        : undefined;

      if (nextSection) {
        void setActiveWorkspaceSection(nextSection);
      }
    } catch (error) {
      Alert.alert("Partner link failed", getTrackedPartnerErrorMessage(error));
    }
  }

  function openPartnerOrAlert(
    url: string | null | undefined,
    message: string,
    config: {
      partnerId: PartnerId;
      savedItemType: SavedItemType;
      title: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const nextUrl = clean(url);
    if (!nextUrl) {
      Alert.alert("Not ready", message);
      return;
    }

    return openTrackedPartner({
      partnerId: config.partnerId,
      url: nextUrl,
      savedItemType: config.savedItemType,
      title: config.title,
      metadata: config.metadata,
    });
  }

  async function openSavedItem(item: SavedItem) {
    const partnerUrl = clean(item.partnerUrl);
    if (!partnerUrl) {
      Alert.alert(item.title || "Notes", clean(item.metadata?.text) || "No details saved.");
      return;
    }

    if (item.status === "booked" || item.status === "archived") {
      await openUntracked(partnerUrl);
      return;
    }

    const partnerId = clean(item.partnerId);
    if (!partnerId || partnerId === "googlemaps") {
      await openUntracked(partnerUrl);
      return;
    }

    const tripId = clean(item.tripId) || clean(trip?.id) || clean(activeTripId);
    if (!tripId) {
      Alert.alert("Save trip first", "Save the trip before opening tracked booking items.");
      return;
    }

    try {
      await beginPartnerClick({
        tripId,
        partnerId: partnerId as PartnerId,
        url: partnerUrl,
        savedItemType: item.type,
        title: item.title,
        metadata: {
          city: cityName,
          startDate: trip?.startDate ?? null,
          endDate: trip?.endDate ?? null,
          sourceSurface: "workspace_item",
          sourceSection: inferSourceSectionFromSavedItemType(item.type),
          ...(item.metadata ?? {}),
        },
      });

      void setActiveWorkspaceSection(sectionForSavedItemType(item.type));
    } catch (error) {
      Alert.alert("Couldn’t open booking item", getTrackedPartnerErrorMessage(error));
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
      "Archived items are hidden from the trip workspace.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ]
    );
  }

  function confirmMarkBooked(item: SavedItem) {
    Alert.alert(
      "Mark as booked?",
      "Only do this if you completed the booking and want it in Wallet.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Mark booked", onPress: () => markBookedSmart(item) },
      ]
    );
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
        metadata: {
          text,
          city: cityName,
          sourceSurface: "workspace_cta",
          sourceSection: "notes",
        },
      });

      setNoteText("");
      void setActiveWorkspaceSection("notes");
    } catch {
      Alert.alert("Couldn’t save note");
    } finally {
      setNoteSaving(false);
    }
  }

  function openNoteActions(item: SavedItem) {
    Alert.alert(item.title || "Notes", clean(item.metadata?.text) || "No details saved.", [
      { text: "Close", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
    ]);
  }

  async function setPrimaryMatch(matchId: string) {
    if (!trip) return;

    const mid = clean(matchId);
    if (!mid || mid === clean(trip.fixtureIdPrimary)) return;

    const row = fixturesById[mid] ?? null;
    const snapshot = buildPrimarySnapshotFromFixtureRow(row, trip.displayCity);

    if (!snapshot) {
      Alert.alert("Couldn’t set primary match", "Match data is missing.");
      return;
    }

    try {
      await tripsStore.applyPrimaryMatchSelection(trip.id, mid, snapshot);
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

    Alert.alert(
      "Remove this match?",
      "This only removes it from the trip.",
      [
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
      ]
    );
  }

  function openMatchActions(matchId: string) {
    if (!trip) return;

    const mid = clean(matchId);
    const isPrimary = mid === clean(trip.fixtureIdPrimary);

    Alert.alert(
      "Match options",
      isPrimary
        ? "This is the primary match for the trip."
        : "Choose what you want to do with this match.",
      [
        { text: "Cancel", style: "cancel" },
        !isPrimary ? { text: "Set as primary", onPress: () => setPrimaryMatch(mid) } : null,
        { text: "Remove from trip", style: "destructive", onPress: () => removeMatch(mid) },
      ].filter(Boolean) as AlertButton[]
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
    let partnerId: PartnerId;

    try {
      partnerId = mapTicketProviderToPartnerId(args.option.provider);
    } catch {
      Alert.alert("Provider unsupported", "This ticket provider is not mapped yet.");
      return;
    }

    await openTrackedPartner({
      partnerId,
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
        sourceSurface: "ticket_choice_alert",
        sourceSection: "tickets",
      },
    });
  }

  async function openOfficialTicketFallback(args: {
    mid: string;
    homeName: string;
    awayName: string;
    kickoffIso: string;
    leagueName?: string;
    leagueId?: string | number;
    officialTicketUrl: string;
  }) {
    const title = `Official tickets: ${args.homeName} vs ${args.awayName}`;

    Alert.alert(
      "Official club tickets",
      buildOfficialTicketFallbackMessage(args.homeName),
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open official site",
          onPress: async () => {
            await openPartnerOrAlert(
              args.officialTicketUrl,
              "The club ticket page is not available yet.",
              {
                partnerId: "googlemaps" as PartnerId,
                savedItemType: "tickets",
                title,
                metadata: {
                  fixtureId: args.mid,
                  leagueId: args.leagueId,
                  leagueName: args.leagueName,
                  kickoffIso: args.kickoffIso,
                  homeName: args.homeName,
                  awayName: args.awayName,
                  ticketProvider: "official_club_site",
                  sourceSurface: "official_ticket_fallback",
                  sourceSection: "tickets",
                  officialFallback: true,
                },
              }
            );
          },
        },
      ]
    );
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
            `${index + 1}. ${clean(option.provider)}${
              clean(option.priceText) ? ` • ${clean(option.priceText)}` : ""
            }`
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
            } as never),
        },
      ] as AlertButton[]
    );
  }

  async function openTicketsForMatch(matchId: string) {
    const mid = clean(matchId);
    if (!mid) return;

    if (!activeTripId) {
      Alert.alert(
        "Save trip first",
        "Save this trip before booking so we can store it in Wallet."
      );
      return;
    }

    const existing = ticketsByMatchId[mid];
    if (
      existing &&
      existing.type === "tickets" &&
      existing.status !== "archived" &&
      existing.partnerUrl
    ) {
      await openSavedItem(existing);
      return;
    }

    const row = fixturesById[mid] ?? null;

    const homeName = clean(row?.teams?.home?.name ?? trip?.homeName);
    const awayName = clean(row?.teams?.away?.name ?? trip?.awayName);
    const kickoffIso = clean(row?.fixture?.date ?? trip?.kickoffIso) || null;
    const leagueName = clean(row?.league?.name ?? trip?.leagueName) || undefined;
    const leagueIdRaw = row?.league?.id ?? trip?.leagueId;
    const leagueId =
      typeof leagueIdRaw === "number" || typeof leagueIdRaw === "string"
        ? leagueIdRaw
        : undefined;

    if (!homeName || !awayName || !kickoffIso) {
      Alert.alert("Tickets not available", "Missing team names or kickoff time for this match.");
      return;
    }

    const dateIso = trip?.startDate || getIsoDateOnly(kickoffIso);

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
      const homeGuide = getTicketGuide(homeName);
      const officialTicketUrl = clean(homeGuide?.officialTicketUrl);

      if (!resolved?.ok || options.length === 0) {
        if (officialTicketUrl) {
          await openOfficialTicketFallback({
            mid,
            homeName,
            awayName,
            kickoffIso,
            leagueName,
            leagueId,
            officialTicketUrl,
          });
          return;
        }

        Alert.alert(
          "Tickets not found",
          ticketResolverFailureMessage(resolved as TicketResolutionResult | null)
        );
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
          checkedProviders: Array.isArray(resolved.checkedProviders)
            ? resolved.checkedProviders
            : undefined,
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
        checkedProviders: Array.isArray(resolved.checkedProviders)
          ? resolved.checkedProviders
          : undefined,
      });
    } catch {
      const homeGuide = getTicketGuide(homeName);
      const officialTicketUrl = clean(homeGuide?.officialTicketUrl);

      if (officialTicketUrl) {
        await openOfficialTicketFallback({
          mid,
          homeName,
          awayName,
          kickoffIso,
          leagueName,
          leagueId,
          officialTicketUrl,
        });
        return;
      }

      Alert.alert(
        "Tickets unavailable",
        "Ticket search failed before the partner click was created."
      );
    }
  }

  return {
    onEditTrip,
    onAddMatch,
    onViewWallet,
    onUpgradePress,
    onOpenSection,
    openUntracked,
    openTrackedPartner,
    openPartnerOrAlert,
    openSavedItem,
    confirmArchive,
    confirmMarkBooked,
    confirmMoveToPending,
    addNote,
    openNoteActions,
    setPrimaryMatch,
    removeMatch,
    openMatchActions,
    openTicketsForMatch,
    addProofForBookedItem,
  };
    }
