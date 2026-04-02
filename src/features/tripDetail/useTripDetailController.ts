// FULL FILE — CLEAN + NORMALISED

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

type Props = {
  trip: Trip | null;
  activeTripId: string | null;
  cityName: string;
  primaryLeagueId?: number;
  fixturesById: Record<string, FixtureListRow>;
  ticketsByMatchId: Record<string, SavedItem | null>;
  affiliateUrls?: AffiliateUrls | null;
  noteText?: string;
  setNoteText?: React.Dispatch<React.SetStateAction<string>>;
  setNoteSaving?: React.Dispatch<React.SetStateAction<boolean>>;
  setProofBusyId?: React.Dispatch<React.SetStateAction<string | null>>;
  setTicketLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveWorkspaceSection?: (section: WorkspaceSectionKey) => Promise<void> | void;
};

function getTrackedPartnerErrorMessage(error: unknown): string {
  const raw = clean((error as any)?.message ?? error);

  if (!raw) return "This partner link could not be opened.";
  if (raw.includes("tripId")) return "Save the trip first.";
  if (raw.includes("url")) return "This link is invalid.";
  if (raw.includes("already in progress")) return "Already opening a link.";

  return "This partner link could not be opened.";
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

  const [ticketSheet, setTicketSheet] = React.useState({
    visible: false,
    payload: null as any,
  });

  function getTripId() {
    return clean(trip?.id) || clean(activeTripId);
  }

  async function activate(section: WorkspaceSectionKey) {
    try {
      await setActiveWorkspaceSection(section);
    } catch {}
  }

  function baseMeta() {
    return {
      tripId: getTripId() || null,
      city: cityName,
      startDate: trip?.startDate ?? null,
      endDate: trip?.endDate ?? null,
      primaryMatchId: clean(trip?.fixtureIdPrimary) || null,
    };
  }

  /* =========================
     PARTNER FLOW (LOCKED)
  ========================= */

  async function openTracked({
    partnerId,
    url,
    title,
    savedItemType,
    metadata,
  }: {
    partnerId: PartnerId | string;
    url: string;
    title: string;
    savedItemType?: SavedItemType;
    metadata?: Record<string, unknown>;
  }) {
    const tripId = getTripId();
    if (!tripId) {
      Alert.alert("Save trip first");
      return;
    }

    const cleanUrl = clean(url);
    if (!cleanUrl) {
      Alert.alert("Missing link");
      return;
    }

    const pid = canonicalizePartnerId(partnerId);
    if (!pid) {
      Alert.alert("Invalid partner");
      return;
    }

    if (isUtilityPartner(pid)) {
      return openUntracked(cleanUrl);
    }

    try {
      await beginPartnerClick({
        tripId,
        partnerId: pid,
        url: cleanUrl,
        savedItemType,
        title: clean(title),
        metadata: {
          ...baseMeta(),
          ...(metadata ?? {}),
        },
      });

      if (savedItemType) {
        await activate(sectionForSavedItemType(savedItemType));
      }
    } catch (e) {
      Alert.alert("Error", getTrackedPartnerErrorMessage(e));
    }
  }

  /* =========================
     TICKETS (CLEANED)
  ========================= */

  async function openTickets(matchId: string) {
    const mid = clean(matchId);
    if (!mid) return;

    if (!getTripId()) {
      Alert.alert("Save trip first");
      return;
    }

    const row = fixturesById[mid];
    const home = clean(row?.teams?.home?.name ?? trip?.homeName);
    const away = clean(row?.teams?.away?.name ?? trip?.awayName);
    const kickoff = clean(row?.fixture?.date ?? trip?.kickoffIso);

    if (!home || !away || !kickoff) {
      Alert.alert("Missing match data");
      return;
    }

    setTicketLoading(true);

    try {
      const result = await resolveTicketForFixture({
        fixtureId: mid,
        homeName: home,
        awayName: away,
        kickoffIso: kickoff,
      });

      const options = normalizeTicketOptions(result);
      const { strong, weak } = splitTicketOptions(options);

      if (!strong.length && !weak.length) {
        Alert.alert("No tickets", ticketResolverFailureMessage(result));
        return;
      }

      if (strong.length === 1 && weak.length === 0) {
        return openTicketOption(mid, home, away, kickoff, strong[0]);
      }

      setTicketSheet({
        visible: true,
        payload: {
          mid,
          home,
          away,
          kickoff,
          strong,
          weak,
        },
      });
    } catch {
      Alert.alert("Ticket search failed");
    } finally {
      setTicketLoading(false);
    }
  }

  async function openTicketOption(
    mid: string,
    home: string,
    away: string,
    kickoff: string,
    option: TicketResolutionOption
  ) {
    let partnerId: PartnerId;

    try {
      partnerId = mapTicketProviderToPartnerId(option.provider);
    } catch {
      Alert.alert("Provider unsupported");
      return;
    }

    const strong = isStrongTicketOption(option);

    if (!strong) {
      Alert.alert("Weak route", "Verify carefully.");
    }

    await openTracked({
      partnerId,
      url: option.url,
      title: option.title || `Tickets: ${home} vs ${away}`,
      savedItemType: "tickets",
      metadata: {
        fixtureId: mid,
        homeName: home,
        awayName: away,
        kickoffIso: kickoff,
        strongRoute: strong,
      },
    });
  }

  /* =========================
     NOTES
  ========================= */

  async function addNote() {
    const text = cleanNoteText(noteText);
    const tripId = getTripId();

    if (!tripId || !text) {
      Alert.alert("Add a note first");
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
      await activate("notes");
    } catch {
      Alert.alert("Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  }

  /* =========================
     MATCH MANAGEMENT
  ========================= */

  async function setPrimaryMatch(matchId: string) {
    if (!trip) return;

    const row = fixturesById[matchId];
    if (!row) return;

    const snapshot: TripSnapshotPatch = {
      fixtureIdPrimary: String(row.fixture.id),
      homeName: row.teams?.home?.name,
      awayName: row.teams?.away?.name,
      kickoffIso: row.fixture?.date,
    };

    try {
      await tripsStore.applyPrimaryMatchSelection(trip.id, matchId, snapshot);
    } catch {
      Alert.alert("Failed to set primary match");
    }
  }

  async function removeMatch(matchId: string) {
    if (!trip) return;

    if ((trip.matchIds?.length ?? 0) <= 1) {
      Alert.alert("Trip needs at least one match");
      return;
    }

    await tripsStore.removeMatchFromTrip(trip.id, matchId);
  }

  /* =========================
     RETURN
  ========================= */

  return {
    addNote,
    openTicketsForMatch: openTickets,
    openTicketOptionForMatch: openTicketOption,
    setPrimaryMatch,
    removeMatch,
    ticketSheet,
    closeTicketSheet: () =>
      setTicketSheet({
        visible: false,
        payload: null,
      }),
  };
}
