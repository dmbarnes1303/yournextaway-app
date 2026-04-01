import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
} from "react-native";

import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { theme } from "@/src/constants/theme";

import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import type { WorkspaceSectionKey, TripWorkspace } from "@/src/core/tripWorkspace";
import { WORKSPACE_SECTIONS } from "@/src/core/tripWorkspace";

import {
  providerBadgeStyle,
  providerLabel,
  providerShort,
  statusLabel,
  savedItemMetaLine,
  proofStateText,
  livePriceLine as sharedLivePriceLine,
} from "@/src/features/tripDetail/helpers";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function hasProof(item: SavedItem | null): boolean {
  return Array.isArray(item?.attachments) && item.attachments.length > 0;
}

function sectionStateLabel(sectionKey: WorkspaceSectionKey, total: number) {
  const title = WORKSPACE_SECTIONS[sectionKey].title;

  if (total <= 0) return `No ${title.toLowerCase()} yet`;
  if (total === 1) return "1 item";
  return `${total} items`;
}

function sectionTitle(sectionKey: WorkspaceSectionKey) {
  return WORKSPACE_SECTIONS[sectionKey].title;
}

function sectionLead(sectionKey: WorkspaceSectionKey) {
  if (sectionKey === "tickets") return "Start here. Tickets anchor the whole trip.";
  if (sectionKey === "travel") return "Flights and rail should be handled early, not guessed later.";
  if (sectionKey === "stay") return "A bad hotel area ruins matchday logistics.";
  if (sectionKey === "transfers") return "Sort the airport-city-stadium chain before it becomes friction.";
  if (sectionKey === "things") return "Only add extras that improve the trip.";
  if (sectionKey === "insurance") return "Store cover and policy evidence in one place.";
  if (sectionKey === "claims") return "Keep refund, delay and compensation evidence together.";
  return "Keep useful planning notes here.";
}

function itemPriorityTone(item: SavedItem) {
  if (item.status === "booked" && !hasProof(item)) return styles.itemToneWarn;
  if (item.status === "pending") return styles.itemTonePending;
  if (item.status === "booked") return styles.itemToneBooked;
  if (item.status === "saved") return styles.itemToneSaved;
  return styles.itemToneNeutral;
}

function statusTone(status: SavedItem["status"]) {
  if (status === "pending") return styles.badgePending;
  if (status === "saved") return styles.badgeSaved;
  if (status === "booked") return styles.badgeBooked;
  return styles.badgeArchived;
}

function cleanUserFacingPriceLine(value: string | null) {
  const raw = clean(value);
  if (!raw) return null;

  return raw
    .replace(/\bLive price on\b/gi, "Live price •")
    .replace(/\bFrom\b/gi, "From")
    .replace(/\s+/g, " ")
    .trim();
}

function itemActionHint(item: SavedItem, livePrice: string | null) {
  if (item.type === "note" || item.type === "other") return "Tap to open note";

  if (item.status === "booked" && !hasProof(item)) {
    return "Booked, but proof still needs adding";
  }

  if (item.status === "booked") {
    return "Booked and stored";
  }

  if (item.status === "pending") {
    return "Awaiting confirmation";
  }

  if (item.status === "saved") {
    return livePrice ? "Ready to review" : "Saved to compare later";
  }

  return "Archived item";
}

type PartnerOpenArgs = {
  partnerId: any;
  url: string;
  title: string;
  savedItemType?: SavedItemType;
  metadata?: Record<string, any>;
};

export type TripWorkspaceCardProps = {
  workspaceSnapshot: {
    activeTotal: number;
    sectionActiveTotals: Record<WorkspaceSectionKey, number>;
  };
  workspace: TripWorkspace | null;
  sectionOrder: WorkspaceSectionKey[];
  activeSection: WorkspaceSectionKey;
  groupedBySection: Record<WorkspaceSectionKey, SavedItem[]>;
  primaryMatchId: string | null;
  affiliateUrls: {
    hotelsUrl?: string | null;
    flightsUrl?: string | null;
    omioUrl?: string | null;
    transfersUrl?: string | null;
    experiencesUrl?: string | null;
  } | null;
  cityName: string;
  originIata: string;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  noteText: string;
  noteSaving: boolean;
  proofBusyId: string | null;
  stayBestAreas: { area: string; notes?: string }[];
  stayBudgetAreas: { area: string; notes?: string }[];
  transportStops: string[];

  onSetActiveSection: (section: WorkspaceSectionKey) => void;
  onToggleSection: (section: WorkspaceSectionKey) => void;
  onNoteTextChange: (text: string) => void;
  onAddNote: () => void;

  onOpenTicketsForPrimaryMatch: () => void;
  onOpenSavedItem: (item: SavedItem) => void;
  onOpenNoteActions: (item: SavedItem) => void;
  onConfirmMarkBooked: (item: SavedItem) => void;
  onAddProofForBookedItem: (item: SavedItem) => void;
  onViewWallet: () => void;
  onConfirmMoveToPending: (item: SavedItem) => void;
  onConfirmArchive: (item: SavedItem) => void;

  onOpenPartner: (args: PartnerOpenArgs) => void;

  getLivePriceLine: (item: SavedItem) => string | null;
  getTicketProviderFromItem: (item: SavedItem | null) => string | null;
};

type ProviderBadgeProps = {
  provider?: string | null;
  size?: "sm" | "md";
  showLabel?: boolean;
};

const ProviderBadge = memo(function ProviderBadge({
  provider,
  size = "sm",
  showLabel = false,
}: ProviderBadgeProps) {
  const badge = providerBadgeStyle(provider);
  const short = providerShort(provider);
  const label = providerLabel(provider);

  const circleSize = size === "md" ? 30 : 24;
  const fontSize = size === "md" ? 12 : 11;

  return (
    <View style={[styles.providerBadgeWrap, showLabel && styles.providerBadgeWrapLabeled]}>
      <View
        style={[
          styles.providerBadgeCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderColor: badge.borderColor,
            backgroundColor: badge.backgroundColor,
          },
        ]}
      >
        <Text style={[styles.providerBadgeCircleText, { color: badge.textColor, fontSize }]}>
          {short}
        </Text>
      </View>
      {showLabel ? <Text style={styles.providerBadgeLabel}>{label}</Text> : null}
    </View>
  );
});

const StatusBadge = memo(function StatusBadge({ status }: { status: SavedItem["status"] }) {
  const label = statusLabel(status);
  return (
    <View style={[styles.badge, statusTone(status)]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
});

type WorkspaceItemRowProps = {
  item: SavedItem;
  proofBusyId: string | null;
  onOpenSavedItem: (item: SavedItem) => void;
  onOpenNoteActions: (item: SavedItem) => void;
  onConfirmMarkBooked: (item: SavedItem) => void;
  onAddProofForBookedItem: (item: SavedItem) => void;
  onViewWallet: () => void;
  onConfirmMoveToPending: (item: SavedItem) => void;
  onConfirmArchive: (item: SavedItem) => void;
  getLivePriceLine: (item: SavedItem) => string | null;
  getTicketProviderFromItem: (item: SavedItem | null) => string | null;
};

const WorkspaceItemRow = memo(function WorkspaceItemRow({
  item,
  proofBusyId,
  onOpenSavedItem,
  onOpenNoteActions,
  onConfirmMarkBooked,
  onAddProofForBookedItem,
  onViewWallet,
  onConfirmMoveToPending,
  onConfirmArchive,
  getLivePriceLine,
  getTicketProviderFromItem,
}: WorkspaceItemRowProps) {
  const fallbackLivePrice = sharedLivePriceLine(item);
  const livePrice = cleanUserFacingPriceLine(getLivePriceLine(item) || fallbackLivePrice);
  const provider = getTicketProviderFromItem(item) || clean(item.partnerId) || null;
  const proofText = proofStateText(item);
  const missingProof = item.status === "booked" && !hasProof(item);
  const proofBusy = proofBusyId === item.id;
  const isNote = item.type === "note" || item.type === "other";
  const actionHint = itemActionHint(item, livePrice);

  return (
    <View style={[styles.itemRow, itemPriorityTone(item)]}>
      <Pressable
        style={styles.itemMain}
        onPress={() => (isNote ? onOpenNoteActions(item) : onOpenSavedItem(item))}
      >
        <View style={styles.itemTitleRow}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.itemMetaRow}>
          {provider ? <ProviderBadge provider={provider} size="sm" /> : null}
          <Text style={styles.itemMeta} numberOfLines={1}>
            {isNote ? "Notes" : savedItemMetaLine(item)}
          </Text>
        </View>

        <Text style={styles.itemHintLine} numberOfLines={1}>
          {actionHint}
        </Text>

        {livePrice ? (
          <Text
            style={item.status === "booked" ? styles.paidLine : styles.livePriceLine}
            numberOfLines={1}
          >
            {livePrice}
          </Text>
        ) : null}

        {item.status === "booked" ? (
          <Text
            style={[styles.proofLine, missingProof ? styles.proofLineMissing : undefined]}
            numberOfLines={1}
          >
            {proofText}
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.itemActions}>
        {item.status !== "booked" ? (
          <Pressable onPress={() => onConfirmMarkBooked(item)} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Booked</Text>
          </Pressable>
        ) : missingProof ? (
          <Pressable
            onPress={() => onAddProofForBookedItem(item)}
            style={[
              styles.smallBtn,
              styles.smallBtnPrimary,
              proofBusy && styles.smallBtnDisabled,
            ]}
            disabled={proofBusy}
          >
            <Text style={styles.smallBtnText}>{proofBusy ? "Adding…" : "Add proof"}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onViewWallet} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Wallet</Text>
          </Pressable>
        )}

        {item.status === "saved" ?
