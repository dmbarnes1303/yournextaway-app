import React from "react";
import { Alert, type AlertButton } from "react-native";
import { useRouter } from "expo-router";

import tripsStore, {
  type Trip,
  type TripSnapshotPatch,
} from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import {
  canonicalizePartnerId,
  isUtilityPartner,
  type PartnerId,
} from "@/src/constants/partners";
import { DEFAULT_SEASON } from "@/src/constants/football";

import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import type { WorkspaceSectionKey } from "@/src/core/tripWorkspace";
import { sectionForSavedItemType } from "@/src/core/tripWorkspace";

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
  type AffiliateUrls,
  type SourceSection,
  type SourceSurface,
} from "@/src/features/tripDetail/helpers";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

type Props = {
  trip: Trip | null;
  activeTripId: string | null;
  cityName: string;
  primaryLeagueId?: number;
  fixturesById: Record<string, FixtureListRow>;
  ticketsByMatchId: Record<string, SavedItem | null>;
  affiliateUrls?: AffiliateUrls | null;
  noteText?: string;
  setNoteText?: SetState<string>;
  setNoteSaving?: SetState<boolean>;
  setProofBusyId?: SetState<string | null>;
  setTicketLoading?: SetState<boolean>;
  setActiveWorkspaceSection?: (section: WorkspaceSectionKey) => Promise<void> | void;
};

type TrackedPartnerArgs = {
  partnerId: PartnerId | string;
  url: string;
  title: string;
  savedItemType?: SavedItemType;
  metadata?: Record<string, unknown>;
};

type PartnerLaunchArgs = {
  partnerId: PartnerId | string;
  url: string | null | undefined;
  title: string;
  savedItemType?: SavedItemType;
  sourceSurface: SourceSurface;
  sourceSection?: SourceSection;
  metadata?: Record<string, unknown>;
  missingTitle?: string;
  missingMessage?: string;
};

type OpenPartnerOrAlertConfig = {
  partnerId: PartnerId;
  savedItemType: SavedItemType;
  title: string;
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
  return v ? (v as SourceSurface) : "unknown";
}

function safeSourceSection(value: unknown, fallback?: SavedItemType): SourceSection {
  const v = clean(value);
  return v ? (v as SourceSection) : inferSourceSectionFromSavedItemType(fallback);
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

function getStayUrl(affiliateUrls?: AffiliateUrls | null): string {
  return clean(affiliateUrls?.staysUrl || affiliateUrls?.hotelsUrl);
}

function getThingsUrl(affiliateUrls?: AffiliateUrls | null): string {
  return clean(affiliateUrls?.thingsUrl || affiliateUrls?.experiencesUrl);
}

function getTravelCandidate(affiliateUrls?: AffiliateUrls | null): {
  url: string;
  partnerId: PartnerId;
  itemType: SavedItemType;
  titleKind: "flight" | "train" | "bus" | "transfer";
} | null {
  const flightsUrl = clean(affiliateUrls?.flightsUrl);
  if (flightsUrl) {
    return {
      url: flightsUrl,
      partnerId: "aviasales",
      itemType: "flight",
      titleKind: "flight",
    };
  }

  const trainsUrl = clean(
    affiliateUrls?.trainsUrl || affiliateUrls?.omioUrl || affiliateUrls?.transportUrl
  );
  if (trainsUrl) {
    return {
      url: trainsUrl,
      partnerId: "omio",
      itemType: "train",
      titleKind: "train",
    };
  }

  const busesUrl = clean(affiliateUrls?.busesUrl);
  if (busesUrl) {
    return {
      url: busesUrl,
      partnerId: "omio",
      itemType: "train",
      titleKind: "bus",
    };
  }

  const transfersUrl = clean(affiliateUrls?.transfersUrl);
  if (transfersUrl) {
    return {
      url: transfersUrl,
      partnerId: "kiwitaxi",
      itemType: "transfer",
      titleKind: "transfer",
    };
  }

  return null;
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
  setTicketLoading = () => {},
  setActiveWorkspaceSection = () => {},
}: Props) {
  const router = useRouter();

  function getResolvedTripId(): string {
    return clean(trip?.id) || clean(activeTripId);
  }

  function getBaseCommercialMetadata() {
    const tripId = getResolvedTripId();

    return {
      tripId: tripId || null,
      city: cityName,
      startDate: trip?.startDate ?? null,
      endDate: trip?.endDate ?? null,
      primaryMatchId: clean(trip?.fixtureIdPrimary) || null,
    };
  }

  async function openTripBuilder() {
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
    void openTripBuilder();
  }

  function onAddMatch() {
    void openTripBuilder();
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
    const tripId = getResolvedTripId();
    if (!tripId) {
      Alert.alert(
        "Save trip first",
        "Save this trip before booking so we can store it in Wallet."
      );
      return;
    }

    const url = clean(args.url);
    if (!url) {
      Alert.alert("Missing link", "This booking link is not ready yet.");
      return;
    }

    const canonicalPartnerId = canonicalizePartnerId(args.partnerId);
    if (!canonicalPartnerId) {
      Alert.alert("Partner link failed", "This partner is not configured correctly.");
      return;
    }

    if (isUtilityPartner(canonicalPartnerId)) {
      await openUntracked(url);
      return;
    }

    const sourceSurface = safeSourceSurface(args.metadata?.sourceSurface);
    const sourceSection = safeSourceSection(args.metadata?.sourceSection, args.savedItemType);

    try {
      await beginPartnerClick({
        tripId,
        partnerId: canonicalPartnerId,
        url,
        savedItemType: args.savedItemType,
        title: clean(args.title),
        metadata: {
          ...getBaseCommercialMetadata(),
          sourceSurface,
          sourceSection,
          ...(args.metadata ?? {}),
        },
      });

      if (args.savedItemType) {
        void setActiveWorkspaceSection(sectionForSavedItemType(args.savedItemType));
      }
    } catch (error) {
      Alert.alert("Partner link failed", getTrackedPartnerErrorMessage(error));
    }
  }

  async function openPartnerLaunch(args: PartnerLaunchArgs) {
    const url = clean(args.url);

    if (!url) {
      Alert.alert(
        args.missingTitle || "Not ready",
        args.missingMessage || "This link is not ready yet."
      );
      return;
    }

    const canonicalPartnerId = canonicalizePartnerId(args.partnerId);
    if (!canonicalPartnerId) {
      Alert.alert("Partner link failed", "This partner is not configured correctly.");
      return;
    }

    if (isUtilityPartner(canonicalPartnerId)) {
      await openUntracked(url);
      return;
    }

    await openTrackedPartner({
      partnerId: canonicalPartnerId,
      url,
      title: args.title,
      savedItemType: args.savedItemType,
      metadata: {
        sourceSurface: args.sourceSurface,
        sourceSection:
          args.sourceSection || inferSourceSectionFromSavedItemType(args.savedItemType),
        ...(args.metadata ?? {}),
      },
    });
  }

  async function openPartnerOrAlert(
    url: string | null | undefined,
    message: string,
    config: OpenPartnerOrAlertConfig
  ) {
    await openPartnerLaunch({
      partnerId: config.partnerId,
      url,
      title: config.title,
      savedItemType: config.savedItemType,
      sourceSurface: safeSourceSurface(config.metadata?.sourceSurface),
      sourceSection: safeSourceSection(config.metadata?.sourceSection, config.savedItemType),
      metadata: config.metadata,
      missingTitle: "Not ready",
      missingMessage: message,
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

    const canonicalPartnerId = canonicalizePartnerId(item.partnerId);
    if (!canonicalPartnerId || isUtilityPartner(canonicalPartnerId)) {
      await openUntracked(partnerUrl);
      return;
    }

    const tripId = clean(item.tripId) || getResolvedTripId();
    if (!tripId) {
      Alert.alert("Save trip first", "Save the trip before opening tracked booking items.");
      return;
    }

    try {
      await beginPartnerClick({
        tripId,
        partnerId: canonicalPartnerId,
        url: partnerUrl,
        savedItemType: item.type,
        title: item.title,
        metadata: {
          ...getBaseCommercialMetadata(),
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
        { text: "Archive", style: "destructive", onPress: () => void archiveItem(item) },
      ]
    );
  }

  function confirmMarkBooked(item: SavedItem) {
    Alert.alert(
      "Mark as booked?",
      "Only do this if you completed the booking and want it in Wallet.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Mark booked", onPress: () => void markBookedSmart(item) },
      ]
    );
  }

  function confirmMoveToPending(item: SavedItem) {
    Alert.alert("Move to Pending?", "Use Pending when you’re not sure if you booked it yet.", [
      { text: "Cancel", style: "cancel" },
      { text: "Move", onPress: () => void moveToPending(item) },
    ]);
  }

  async function addNote() {
    const text = cleanNoteText(noteText);
    const tripId = getResolvedTripId();

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
      { text: "Archive", style: "destructive", onPress: () => void archiveItem(item) },
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
        !isPrimary ? { text: "Set as primary", onPress: () => void setPrimaryMatch(mid) } : null,
        { text: "Remove from trip", style: "destructive", onPress: () => void removeMatch(mid) },
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

    await openPartnerLaunch({
      partnerId,
      url: args.option.url,
      title: args.option.title || `Tickets: ${args.homeName} vs ${args.awayName}`,
      savedItemType: "tickets",
      sourceSurface: "ticket_choice_alert",
      sourceSection: "tickets",
      metadata: {
        fixtureId: args.mid,
        leagueId: args.leagueId,
        leagueName: args.leagueName,
        dateIso: args.dateIso,
        kickoffIso: args.kickoffIso,
        homeName: args.homeName,
        awayName: args.awayName,
        tripStartDate: trip?.startDate ?? null,
        tripEndDate: trip?.endDate ?? null,
        priceMode: "live",
        ticketProvider: args.option.provider ?? null,
        resolvedPriceText: args.option.priceText ?? null,
        resolutionReason: args.option.reason ?? null,
        exactMatch: Boolean(args.option.exact),
        score: args.option.score,
        checkedProviders: args.checkedProviders,
        optionCount: args.optionCount,
      },
      missingTitle: "Tickets not ready",
      missingMessage: "This ticket option is missing a valid link.",
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
      `No valid reseller ticket options were found right now. Try ${args.homeName}'s official ticket page instead.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open official site",
          onPress: () =>
            void openPartnerLaunch({
              partnerId: "official_site",
              url: args.officialTicketUrl,
              title,
              savedItemType: "tickets",
              sourceSurface: "ticket_choice_alert",
              sourceSection: "tickets",
              metadata: {
                fixtureId: args.mid,
                leagueId: args.leagueId,
                leagueName: args.leagueName,
                kickoffIso: args.kickoffIso,
                homeName: args.homeName,
                awayName: args.awayName,
                tripStartDate: trip?.startDate ?? null,
                tripEndDate: trip?.endDate ?? null,
                ticketProvider: "official_site",
                officialFallback: true,
              },
              missingTitle: "Official site unavailable",
              missingMessage: "The club ticket page is not available yet.",
            }),
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
            void openTicketOptionForMatch({
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
      existing.status === "booked" &&
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

    setTicketLoading(true);

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
    } finally {
      setTicketLoading(false);
    }
  }

  async function onOpenSection(section: WorkspaceSectionKey | string) {
    const next = clean(section) as WorkspaceSectionKey;
    if (!next) return;

    try {
      await setActiveWorkspaceSection(next);
    } catch {
      // ignore
    }

    const tripId = getResolvedTripId();
    if (!tripId) {
      Alert.alert("Save trip first", "Save this trip before booking.");
      return;
    }

    if (next === "tickets") {
      const primaryMatchId = clean(trip?.fixtureIdPrimary);
      if (!primaryMatchId) {
        Alert.alert("Tickets not ready", "No primary match is attached to this trip yet.");
        return;
      }

      await openTicketsForMatch(primaryMatchId);
      return;
    }

    if (next === "stay") {
      await openPartnerLaunch({
        partnerId: "expedia",
        url: getStayUrl(affiliateUrls),
        savedItemType: "hotel",
        title: `Stays in ${cityName}`,
        sourceSurface: "workspace_cta",
        sourceSection: "stay",
        metadata: {
          tripStartDate: trip?.startDate ?? null,
          tripEndDate: trip?.endDate ?? null,
        },
        missingTitle: "Hotels not ready",
        missingMessage: "No hotel search available yet.",
      });
      return;
    }

    if (next === "travel") {
      const candidate = getTravelCandidate(affiliateUrls);
      if (!candidate) {
        Alert.alert("Travel not ready", "No travel search available yet.");
        return;
      }

      const title =
        candidate.titleKind === "flight"
          ? `Flights to ${cityName}`
          : candidate.titleKind === "bus"
            ? `Buses to ${cityName}`
            : candidate.titleKind === "train"
              ? `Trains to ${cityName}`
              : `Transfers in ${cityName}`;

      await openPartnerLaunch({
        partnerId: candidate.partnerId,
        url: candidate.url,
        savedItemType: candidate.itemType,
        title,
        sourceSurface: "workspace_cta",
        sourceSection: candidate.itemType === "transfer" ? "transfers" : "travel",
        metadata: {
          travelMode: candidate.titleKind,
          tripStartDate: trip?.startDate ?? null,
          tripEndDate: trip?.endDate ?? null,
        },
        missingTitle: "Travel not ready",
        missingMessage: "No travel search available yet.",
      });
      return;
    }

    if (next === "things") {
      await openPartnerLaunch({
        partnerId: "getyourguide",
        url: getThingsUrl(affiliateUrls),
        savedItemType: "things",
        title: `Things to do in ${cityName}`,
        sourceSurface: "workspace_cta",
        sourceSection: "things",
        metadata: {
          tripStartDate: trip?.startDate ?? null,
          tripEndDate: trip?.endDate ?? null,
        },
        missingTitle: "Experiences not ready",
        missingMessage: "No activities available yet.",
      });
      return;
    }

    if (next === "transfers") {
      await openPartnerLaunch({
        partnerId: "kiwitaxi",
        url: clean(affiliateUrls?.transfersUrl),
        savedItemType: "transfer",
        title: `Transfers in ${cityName}`,
        sourceSurface: "workspace_cta",
        sourceSection: "transfers",
        metadata: {
          tripStartDate: trip?.startDate ?? null,
          tripEndDate: trip?.endDate ?? null,
        },
        missingTitle: "Transfers not ready",
        missingMessage: "No transfer booking link is available yet.",
      });
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
