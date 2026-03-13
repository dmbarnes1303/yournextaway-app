import React from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import tripsStore, { type Trip } from "@/src/state/trips";
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

import {
  clean,
  defer,
  getIsoDateOnly,
  mapTicketProviderToPartnerId,
  normalizeTicketOptions,
  noteTitleFromText,
  cleanNoteText,
  ticketResolverFailureMessage,
} from "@/src/features/tripDetail/helpers";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

type Props = {
  trip: Trip | null;
  activeTripId: string | null;
  cityName: string;
  primaryLeagueId?: number;
  fixturesById: Record<string, FixtureListRow>;
  ticketsByMatchId: Record<string, SavedItem | null>;
  noteText: string;
  setNoteText: SetState<string>;
  setNoteSaving: SetState<boolean>;
  setProofBusyId: SetState<string | null>;
  setActiveWorkspaceSection: (section: WorkspaceSectionKey) => Promise<void> | void;
};

export default function useTripDetailController({
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
}: Props) {
  const router = useRouter();

  function openTripBuilder() {
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

  function onEditTrip() {
    openTripBuilder();
  }

  function onAddMatch() {
    openTripBuilder();
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
    const tripId = clean(trip?.id) || clean(activeTripId);

    if (!tripId) {
      Alert.alert("Save trip first", "Save this trip before booking so we can store it in Wallet.");
      return;
    }

    if (args.partnerId === ("googlemaps" as any)) {
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

      const nextSection = args.savedItemType ? sectionForSavedItemType(args.savedItemType) : undefined;
      if (nextSection) void setActiveWorkspaceSection(nextSection);
    } catch {
      await openUntracked(args.url);
    }
  }

  function openPartnerOrAlert(
    url: string | null | undefined,
    message: string,
    config: {
      partnerId: PartnerId;
      savedItemType: SavedItemType;
      title: string;
      metadata?: Record<string, any>;
    }
  ) {
    if (!url) {
      Alert.alert("Not ready", message);
      return;
    }

    return openTrackedPartner({
      partnerId: config.partnerId,
      url,
      savedItemType: config.savedItemType,
      title: config.title,
      metadata: config.metadata,
    });
  }

  async function openSavedItem(item: SavedItem) {
    if (!item.partnerUrl) {
      Alert.alert(item.title || "Notes", clean(item.metadata?.text) || "No details saved.");
      return;
    }

    if (item.status === "booked" || item.status === "archived") {
      await openUntracked(item.partnerUrl);
      return;
    }

    const partnerId = clean(item.partnerId);
    if (!partnerId || partnerId === "googlemaps") {
      await openUntracked(item.partnerUrl);
      return;
    }

    const tripId = clean(item.tripId) || clean(trip?.id) || clean(activeTripId);
    if (!tripId) {
      await openUntracked(item.partnerUrl);
      return;
    }

    try {
      await beginPartnerClick({
        tripId,
        partnerId: partnerId as PartnerId,
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
      { text: "Mark booked", onPress: () => markBookedSmart(item) },
    ]);
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
        metadata: { text },
      } as any);

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
    if (!mid || mid === clean((trip as any)?.fixtureIdPrimary)) return;

    const row = fixturesById[mid] ?? null;

    const homeName = clean((row as any)?.teams?.home?.name) || undefined;
    const awayName = clean((row as any)?.teams?.away?.name) || undefined;
    const leagueName = clean((row as any)?.league?.name) || undefined;
    const leagueId = typeof (row as any)?.league?.id === "number" ? (row as any).league.id : undefined;
    const kickoffIso = clean((row as any)?.fixture?.date) || undefined;
    const venueName = clean((row as any)?.fixture?.venue?.name) || undefined;
    const venueCity = clean((row as any)?.fixture?.venue?.city) || undefined;

    const statusShort = clean((row as any)?.fixture?.status?.short).toUpperCase();
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
    if (!
