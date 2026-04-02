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
  splitTicketOptions,
  isStrongTicketOption,
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

type TicketSheetPayload = {
  mid: string;
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string;
  leagueId?: string | number;
  dateIso?: string;
  strongOptions: TicketResolutionOption[];
  weakOptions: TicketResolutionOption[];
  checkedProviders?: string[];
  officialTicketUrl?: string | null;
  hasStrongOptions: boolean;
};

type TicketSheetState = {
  visible: boolean;
  payload: TicketSheetPayload | null;
};

type TicketContext = {
  mid: string;
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string;
  leagueId?: string | number;
  dateIso?: string;
};

type TravelLaunchCandidate = {
  partnerId: PartnerId;
  url: string;
  itemType: SavedItemType;
  title: string;
  sourceSection: SourceSection;
  metadata?: Record<string, unknown>;
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

function getTransferUrl(affiliateUrls?: AffiliateUrls | null): string {
  return clean(affiliateUrls?.transfersUrl);
}

function getTravelLaunchCandidate(
  affiliateUrls: AffiliateUrls | null | undefined,
  cityName: string,
  trip: Trip | null
): TravelLaunchCandidate | null {
  const tripMeta = {
    tripStartDate: trip?.startDate ?? null,
    tripEndDate: trip?.endDate ?? null,
  };

  const flightsUrl = clean(affiliateUrls?.flightsUrl);
  if (flightsUrl) {
    return {
      partnerId: "aviasales",
      url: flightsUrl,
      itemType: "flight",
      title: `Flights to ${cityName}`,
      sourceSection: "travel",
      metadata: {
        ...tripMeta,
        travelMode: "flight",
      },
    };
  }

  const trainsUrl = clean(
    affiliateUrls?.trainsUrl || affiliateUrls?.omioUrl || affiliateUrls?.transportUrl
  );
  if (trainsUrl) {
    return {
      partnerId: "omio",
      url: trainsUrl,
      itemType: "train",
      title: `Rail / bus to ${cityName}`,
      sourceSection: "travel",
      metadata: {
        ...tripMeta,
        travelMode: "rail_bus",
      },
    };
  }

  const busesUrl = clean(affiliateUrls?.busesUrl);
  if (busesUrl) {
    return {
      partnerId: "omio",
      url: busesUrl,
      itemType: "train",
      title: `Rail / bus to ${cityName}`,
      sourceSection: "travel",
      metadata: {
        ...tripMeta,
        travelMode: "rail_bus",
      },
    };
  }

  const transfersUrl = clean(affiliateUrls?.transfersUrl);
  if (transfersUrl) {
    return {
      partnerId: "kiwitaxi",
      url: transfersUrl,
      itemType: "transfer",
      title: `Transfers in ${cityName}`,
      sourceSection: "transfers",
      metadata: {
        ...tripMeta,
        travelMode: "transfer",
      },
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

  const [ticketSheet, setTicketSheet] = React.useState<TicketSheetState>({
    visible: false,
    payload: null,
  });

  function closeTicketSheet() {
    setTicketSheet({
      visible: false,
      payload: null,
    });
  }

  function getResolvedTripId(): string {
    return clean(trip?.id) || clean(activeTripId);
  }

  async function activateSection(section: WorkspaceSectionKey) {
    try {
      await setActiveWorkspaceSection(section);
    } catch {
      // ignore
    }
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
        await activateSection(sectionForSavedItemType(args.savedItemType));
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

      await activateSection(sectionForSavedItemType(item.type));
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
    Alert.alert("Archive this item?", "Archived items are hidden from the trip workspace.", [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: () => void archiveItem(item) },
    ]);
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
      await activateSection("notes");
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

    Alert.alert("Remove this match?", "This only removes it from the trip.", [
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

  function getTicketContext(matchId: string): TicketContext | null {
    const mid = clean(matchId);
    if (!mid) return null;

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

    if (!homeName || !awayName || !kickoffIso) return null;

    return {
      mid,
      homeName,
      awayName,
      kickoffIso,
      leagueName,
      leagueId,
      dateIso: trip?.startDate || getIsoDateOnly(kickoffIso),
    };
  }

  function buildOfficialTicketUrl(homeName: string): string | null {
    const homeGuide = getTicketGuide(homeName);
    return clean(homeGuide?.officialTicketUrl) || null;
  }

  async function openOfficialTicketFallback(
    args: TicketContext & { officialTicketUrl: string }
  ) {
    const title = `Official tickets: ${args.homeName} vs ${args.awayName}`;

    Alert.alert(
      "Official club tickets",
      `No strong reseller ticket routes were found right now. Try ${args.homeName}'s official ticket page instead.`,
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
                strongRoute: false,
              },
              missingTitle: "Official site unavailable",
              missingMessage: "The club ticket page is not available yet.",
            }),
        },
      ]
    );
  }

  async function openTicketOptionForMatch(
    args: TicketContext & {
      option: TicketResolutionOption;
      checkedProviders?: string[];
      optionCount?: number;
      hasStrongOptions?: boolean;
    }
  ) {
    let partnerId: PartnerId;

    try {
      partnerId = mapTicketProviderToPartnerId(args.option.provider);
    } catch {
      Alert.alert("Provider unsupported", "This ticket provider is not mapped yet.");
      return;
    }

    const strongRoute = isStrongTicketOption(args.option);

    if (!strongRoute) {
      Alert.alert(
        "Weak fallback route",
        "This is only a weaker ticket route, not a strong direct match. Check the fixture carefully on the partner page before trusting it."
      );
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
        priceMode: strongRoute ? "live" : "fallback",
        ticketProvider: args.option.provider ?? null,
        resolvedPriceText: args.option.priceText ?? null,
        resolutionReason: args.option.reason ?? null,
        exactMatch: Boolean(args.option.exact),
        score: args.option.score,
        rawScore:
          typeof args.option.rawScore === "number" && Number.isFinite(args.option.rawScore)
            ? args.option.rawScore
            : null,
        urlQuality: clean(args.option.urlQuality) || null,
        checkedProviders: args.checkedProviders,
        optionCount: args.optionCount,
        strongRoute,
        hasStrongOptions: Boolean(args.hasStrongOptions),
      },
      missingTitle: "Tickets not ready",
      missingMessage: "This ticket option is missing a valid link.",
    });
  }

  function showTicketChoiceSheet(payload: TicketSheetPayload) {
    setTicketSheet({
      visible: true,
      payload,
    });
  }

  async function handleResolvedTickets(
    context: TicketContext,
    resolved: TicketResolutionResult | null
  ) {
    const normalizedOptions = normalizeTicketOptions(resolved);
    const { strong, weak } = splitTicketOptions(normalizedOptions);

    const strongOptions = strong;
    const weakOptions = weak;
    const hasStrongOptions = strongOptions.length > 0;
    const totalOptionCount = strongOptions.length + weakOptions.length;
    const officialTicketUrl = buildOfficialTicketUrl(context.homeName);

    if (!hasStrongOptions && totalOptionCount === 0) {
      if (officialTicketUrl) {
        await openOfficialTicketFallback({
          ...context,
          officialTicketUrl,
        });
        return;
      }

      Alert.alert("Tickets not found", ticketResolverFailureMessage(resolved));
      return;
    }

    if (!hasStrongOptions && officialTicketUrl) {
      Alert.alert(
        "Only weak fallback routes found",
        `No strong reseller ticket routes were found for ${context.homeName} vs ${context.awayName}. You can try fallback marketplaces, but the official club ticket page is safer if available.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Official site",
            onPress: () =>
              void openOfficialTicketFallback({
                ...context,
                officialTicketUrl,
              }),
          },
          ...(weakOptions.length > 0
            ? [
                {
                  text: weakOptions.length === 1 ? "Open fallback route" : "See fallback options",
                  onPress: () => {
                    if (weakOptions.length === 1) {
                      void openTicketOptionForMatch({
                        ...context,
                        option: weakOptions[0],
                        checkedProviders: Array.isArray(resolved?.checkedProviders)
                          ? resolved.checkedProviders
                          : undefined,
                        optionCount: weakOptions.length,
                        hasStrongOptions,
                      });
                      return;
                    }

                    showTicketChoiceSheet({
                      ...context,
                      strongOptions: [],
                      weakOptions,
                      checkedProviders: Array.isArray(resolved?.checkedProviders)
                        ? resolved.checkedProviders
                        : undefined,
                      officialTicketUrl,
                      hasStrongOptions,
                    });
                  },
                },
              ]
            : []),
        ]
      );
      return;
    }

    if (strongOptions.length === 1 && weakOptions.length === 0) {
      await openTicketOptionForMatch({
        ...context,
        option: strongOptions[0],
        checkedProviders: Array.isArray(resolved?.checkedProviders)
          ? resolved.checkedProviders
          : undefined,
        optionCount: 1,
        hasStrongOptions,
      });
      return;
    }

    showTicketChoiceSheet({
      ...context,
      strongOptions,
      weakOptions,
      checkedProviders: Array.isArray(resolved?.checkedProviders)
        ? resolved.checkedProviders
        : undefined,
      officialTicketUrl,
      hasStrongOptions,
    });
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

    const context = getTicketContext(mid);
    if (!context) {
      Alert.alert("Tickets not available", "Missing team names or kickoff time for this match.");
      return;
    }

    setTicketLoading(true);

    try {
      const resolved = await resolveTicketForFixture({
        fixtureId: context.mid,
        homeName: context.homeName,
        awayName: context.awayName,
        kickoffIso: context.kickoffIso,
        leagueName: context.leagueName,
        leagueId: context.leagueId,
      });

      await handleResolvedTickets(context, resolved);
    } catch {
      const officialTicketUrl = buildOfficialTicketUrl(context.homeName);

      if (officialTicketUrl) {
        await openOfficialTicketFallback({
          ...context,
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

  function onCompareAllTickets() {
    const payload = ticketSheet.payload;
    if (!payload?.mid) return;

    closeTicketSheet();

    router.push({
      pathname: "/match/[id]",
      params: { id: payload.mid, tripId: activeTripId ?? undefined },
    } as never);
  }

  async function onSelectTicketSheetOption(option: TicketResolutionOption) {
    const payload = ticketSheet.payload;
    if (!payload) return;

    closeTicketSheet();

    const totalCount = payload.strongOptions.length + payload.weakOptions.length;

    await openTicketOptionForMatch({
      mid: payload.mid,
      homeName: payload.homeName,
      awayName: payload.awayName,
      kickoffIso: payload.kickoffIso,
      leagueName: payload.leagueName,
      leagueId: payload.leagueId,
      dateIso: payload.dateIso,
      option,
      checkedProviders: payload.checkedProviders,
      optionCount: totalCount,
      hasStrongOptions: payload.hasStrongOptions,
    });
  }

  async function onOpenOfficialFromSheet() {
    const payload = ticketSheet.payload;
    if (!payload?.officialTicketUrl) return;

    closeTicketSheet();

    await openOfficialTicketFallback({
      mid: payload.mid,
      homeName: payload.homeName,
      awayName: payload.awayName,
      kickoffIso: payload.kickoffIso,
      leagueName: payload.leagueName,
      leagueId: payload.leagueId,
      dateIso: payload.dateIso,
      officialTicketUrl: payload.officialTicketUrl,
    });
  }

  async function launchStay() {
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
  }

  async function launchTravel() {
    const candidate = getTravelLaunchCandidate(affiliateUrls, cityName, trip);

    if (!candidate) {
      Alert.alert("Travel not ready", "No travel search available yet.");
      return;
    }

    await openPartnerLaunch({
      partnerId: candidate.partnerId,
      url: candidate.url,
      savedItemType: candidate.itemType,
      title: candidate.title,
      sourceSurface: "workspace_cta",
      sourceSection: candidate.sourceSection,
      metadata: candidate.metadata,
      missingTitle: "Travel not ready",
      missingMessage: "No travel search available yet.",
    });
  }

  async function launchThings() {
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
  }

  async function launchTransfers() {
    await openPartnerLaunch({
      partnerId: "kiwitaxi",
      url: getTransferUrl(affiliateUrls),
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

  async function onOpenSection(section: WorkspaceSectionKey | string) {
    const next = clean(section) as WorkspaceSectionKey;
    if (!next) return;

    await activateSection(next);

    const tripId = getResolvedTripId();
    if (!tripId) {
      Alert.alert("Save trip first", "Save this trip before booking.");
      return;
    }

    switch (next) {
      case "tickets": {
        const primaryMatchId = clean(trip?.fixtureIdPrimary);
        if (!primaryMatchId) {
          Alert.alert("Tickets not ready", "No primary match is attached to this trip yet.");
          return;
        }

        await openTicketsForMatch(primaryMatchId);
        return;
      }

      case "stay":
        await launchStay();
        return;

      case "travel":
        await launchTravel();
        return;

      case "things":
        await launchThings();
        return;

      case "transfers":
        await launchTransfers();
        return;

      default:
        return;
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
    openTicketOptionForMatch,
    addProofForBookedItem,
    ticketSheet,
    closeTicketSheet,
    onCompareAllTickets,
    onSelectTicketSheetOption,
    onOpenOfficialFromSheet,
  };
      }
