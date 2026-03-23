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

import type { SavedItem, SavedItemType, WalletAttachment } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
import { getPartner } from "@/src/core/partners";
import type { WorkspaceSectionKey, TripWorkspace } from "@/src/core/tripWorkspace";
import { WORKSPACE_SECTIONS } from "@/src/core/tripWorkspace";
import {
  providerBadgeStyle,
  providerLabel,
  providerShort,
} from "@/src/features/tripDetail/helpers";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function statusLabel(status: SavedItem["status"]) {
  if (status === "pending") return "Pending";
  if (status === "saved") return "Saved";
  if (status === "booked") return "Booked";
  return "Archived";
}

function safePartnerName(item: SavedItem) {
  if (!item.partnerId) return null;

  try {
    return getPartner(item.partnerId as any).name;
  } catch {
    const provider = clean(item.metadata?.ticketProvider).toLowerCase();

    if (provider === "footballticketsnet") return "FootballTicketNet";
    if (provider === "sportsevents365") return "SportsEvents365";
    if (provider === "gigsberg") return "Gigsberg";
    if (provider === "omio") return "Omio";
    if (provider === "aviasales") return "Aviasales";
    if (provider === "expedia") return "Expedia";
    if (provider === "kiwitaxi") return "KiwiTaxi";
    if (provider === "getyourguide") return "GetYourGuide";

    return null;
  }
}

function safeTypeLabel(type: SavedItemType) {
  try {
    return getSavedItemTypeLabel(type);
  } catch {
    return "Notes";
  }
}

function friendlyTypeLabel(type: SavedItemType) {
  const raw = safeTypeLabel(type).toLowerCase();

  if (raw.includes("ticket")) return "Tickets";
  if (raw.includes("flight")) return "Flights";
  if (raw.includes("hotel")) return "Stay";
  if (raw.includes("train")) return "Rail";
  if (raw.includes("transfer")) return "Transfers";
  if (raw.includes("insurance")) return "Insurance";
  if (raw.includes("claim")) return "Claims";
  if (raw.includes("thing")) return "Activities";
  if (raw.includes("note")) return "Notes";
  if (raw.includes("other")) return "Notes";

  return safeTypeLabel(type);
}

function buildMetaLine(item: SavedItem) {
  const bits: string[] = [friendlyTypeLabel(item.type)];

  const partnerName = safePartnerName(item);
  if (partnerName) bits.push(partnerName);

  return bits.join(" • ");
}

function getAttachmentCount(item: SavedItem | null): number {
  const attachments = Array.isArray(item?.attachments)
    ? (item.attachments as WalletAttachment[])
    : [];
  return attachments.length;
}

function hasProof(item: SavedItem | null): boolean {
  return getAttachmentCount(item) > 0;
}

function proofStateText(item: SavedItem): string {
  const count = getAttachmentCount(item);

  if (count <= 0) return "No booking proof added yet";
  if (count === 1) return "1 proof file added";
  return `${count} proof files added`;
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
  const livePrice = cleanUserFacingPriceLine(getLivePriceLine(item));
  const provider = getTicketProviderFromItem(item);
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
            {isNote ? "Notes" : buildMetaLine(item)}
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

        {item.status === "saved" ? (
          <Pressable onPress={() => onConfirmMoveToPending(item)} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Pending</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => onConfirmArchive(item)}
          style={[styles.smallBtn, styles.smallBtnDanger]}
        >
          <Text style={styles.smallBtnText}>Archive</Text>
        </Pressable>
      </View>
    </View>
  );
});

type SectionContentProps = {
  sectionKey: WorkspaceSectionKey;
  items: SavedItem[];
  primaryMatchId: string | null;
  affiliateUrls: TripWorkspaceCardProps["affiliateUrls"];
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

function renderItemList(
  items: SavedItem[],
  props: Omit<SectionContentProps, "sectionKey" | "items">
) {
  if (items.length === 0) return null;

  return (
    <View style={styles.listGap}>
      {items.map((item) => (
        <WorkspaceItemRow
          key={item.id}
          item={item}
          proofBusyId={props.proofBusyId}
          onOpenSavedItem={props.onOpenSavedItem}
          onOpenNoteActions={props.onOpenNoteActions}
          onConfirmMarkBooked={props.onConfirmMarkBooked}
          onAddProofForBookedItem={props.onAddProofForBookedItem}
          onViewWallet={props.onViewWallet}
          onConfirmMoveToPending={props.onConfirmMoveToPending}
          onConfirmArchive={props.onConfirmArchive}
          getLivePriceLine={props.getLivePriceLine}
          getTicketProviderFromItem={props.getTicketProviderFromItem}
        />
      ))}
    </View>
  );
}

const SectionContent = memo(function SectionContent(props: SectionContentProps) {
  const {
    sectionKey,
    items,
    primaryMatchId,
    affiliateUrls,
    cityName,
    originIata,
    tripStartDate,
    tripEndDate,
    noteText,
    noteSaving,
    stayBestAreas,
    stayBudgetAreas,
    transportStops,
    onNoteTextChange,
    onAddNote,
    onOpenTicketsForPrimaryMatch,
    onOpenPartner,
  } = props;

  const hotelsUrl = affiliateUrls?.hotelsUrl ?? null;
  const flightsUrl = affiliateUrls?.flightsUrl ?? null;
  const omioUrl = affiliateUrls?.omioUrl ?? null;
  const transfersUrl = affiliateUrls?.transfersUrl ?? null;
  const experiencesUrl = affiliateUrls?.experiencesUrl ?? null;

  if (sectionKey === "tickets") {
    return (
      <>
        {primaryMatchId ? (
          <Pressable onPress={onOpenTicketsForPrimaryMatch} style={styles.sectionCta}>
            <Text style={styles.sectionCtaTitle}>Compare live ticket options</Text>
            <Text style={styles.sectionCtaBody}>
              This is the anchor step. If tickets are not sorted, the rest of the trip is built on
              guesswork.
            </Text>
          </Pressable>
        ) : (
          <EmptyState
            title="No match selected"
            message="Add a match first. No fixture means no proper ticket route."
          />
        )}

        {items.length > 0 ? (
          renderItemList(items, props)
        ) : (
          <EmptyState
            title="No ticket items yet"
            message="Open ticket options and save the strongest route here."
          />
        )}
      </>
    );
  }

  if (sectionKey === "stay") {
    return (
      <>
        {hotelsUrl ? (
          <Pressable
            onPress={() =>
              onOpenPartner({
                partnerId: "expedia",
                url: hotelsUrl,
                savedItemType: "hotel",
                title: `Hotels in ${cityName}`,
                metadata: {
                  city: cityName,
                  startDate: tripStartDate,
                  endDate: tripEndDate,
                  priceMode: "live",
                  sourceSurface: "workspace_cta",
                  sourceSection: "stay",
                },
              })
            }
            style={styles.sectionCta}
          >
            <Text style={styles.sectionCtaTitle}>Open live stays</Text>
            <Text style={styles.sectionCtaBody}>
              Use stay guidance before booking. Cheap in the wrong area is not smart value.
            </Text>
          </Pressable>
        ) : null}

        {stayBestAreas.length > 0 || stayBudgetAreas.length > 0 ? (
          <View style={styles.guidanceMiniBox}>
            <Text style={styles.guidanceMiniTitle}>Area shortlist</Text>

            {stayBestAreas.slice(0, 2).map((item, index) => (
              <Text key={`stay-best-${index}`} style={styles.guidanceMiniLine}>
                • {item.area}
                {item.notes ? ` — ${item.notes}` : ""}
              </Text>
            ))}

            {stayBudgetAreas.slice(0, 2).map((item, index) => (
              <Text key={`stay-budget-${index}`} style={styles.guidanceMiniLine}>
                • {item.area}
                {item.notes ? ` — ${item.notes}` : ""}
              </Text>
            ))}
          </View>
        ) : null}

        {items.length > 0 ? (
          renderItemList(items, props)
        ) : (
          <EmptyState
            title="No stay items yet"
            message="Save hotel options here so the trip becomes a real booking plan, not a vague intention."
          />
        )}
      </>
    );
  }

  if (sectionKey === "travel") {
    return (
      <>
        <View style={styles.sectionActionRow}>
          {flightsUrl ? (
            <Pressable
              onPress={() =>
                onOpenPartner({
                  partnerId: "aviasales",
                  url: flightsUrl,
                  savedItemType: "flight",
                  title: `Flights to ${cityName}`,
                  metadata: {
                    city: cityName,
                    originIata,
                    startDate: tripStartDate,
                    endDate: tripEndDate,
                    priceMode: "live",
                    sourceSurface: "workspace_cta",
                    sourceSection: "travel",
                  },
                })
              }
              style={[styles.smallActionBtn, styles.smallActionBtnPrimary]}
            >
              <Text style={styles.smallActionBtnText}>Flights</Text>
            </Pressable>
          ) : null}

          {omioUrl ? (
            <Pressable
              onPress={() =>
                onOpenPartner({
                  partnerId: "omio",
                  url: omioUrl,
                  savedItemType: "train",
                  title: `Trains & buses in ${cityName}`,
                  metadata: {
                    city: cityName,
                    startDate: tripStartDate,
                    endDate: tripEndDate,
                    priceMode: "live",
                    transportMode: "rail_bus",
                    sourceSurface: "workspace_cta",
                    sourceSection: "travel",
                  },
                })
              }
              style={styles.smallActionBtn}
            >
              <Text style={styles.smallActionBtnText}>Rail / Bus</Text>
            </Pressable>
          ) : null}
        </View>

        {items.length > 0 ? (
          renderItemList(items, props)
        ) : (
          <EmptyState
            title="No travel items yet"
            message="Flights or rail should be decided early. Leaving them vague is how trips get messy."
          />
        )}
      </>
    );
  }

  if (sectionKey === "transfers") {
    return (
      <>
        {transfersUrl ? (
          <Pressable
            onPress={() =>
              onOpenPartner({
                partnerId: "kiwitaxi",
                url: transfersUrl,
                savedItemType: "transfer",
                title: `Transfers in ${cityName}`,
                metadata: {
                  city: cityName,
                  startDate: tripStartDate,
                  endDate: tripEndDate,
                  priceMode: "live",
                  sourceSurface: "workspace_cta",
                  sourceSection: "transfers",
                },
              })
            }
            style={styles.sectionCta}
          >
            <Text style={styles.sectionCtaTitle}>Open transfer options</Text>
            <Text style={styles.sectionCtaBody}>
              Handle airport-city-stadium movement before matchday friction hits.
            </Text>
          </Pressable>
        ) : null}

        {transportStops.length > 0 ? (
          <View style={styles.guidanceMiniBox}>
            <Text style={styles.guidanceMiniTitle}>Useful transport stops</Text>
            {transportStops.map((line, index) => (
              <Text key={`transport-stop-${index}`} style={styles.guidanceMiniLine}>
                • {line}
              </Text>
            ))}
          </View>
        ) : null}

        {items.length > 0 ? (
          renderItemList(items, props)
        ) : (
          <EmptyState
            title="No transfer items yet"
            message="This section should remove local transport guesswork."
          />
        )}
      </>
    );
  }

  if (sectionKey === "things") {
    return (
      <>
        {experiencesUrl ? (
          <Pressable
            onPress={() =>
              onOpenPartner({
                partnerId: "getyourguide",
                url: experiencesUrl,
                savedItemType: "things",
                title: `Experiences in ${cityName}`,
                metadata: {
                  city: cityName,
                  startDate: tripStartDate,
                  endDate: tripEndDate,
                  priceMode: "live",
                  sourceSurface: "workspace_cta",
                  sourceSection: "things",
                },
              })
            }
            style={styles.sectionCta}
          >
            <Text style={styles.sectionCtaTitle}>Open activities</Text>
            <Text style={styles.sectionCtaBody}>
              Add extras only if they improve the trip. Filler is pointless.
            </Text>
          </Pressable>
        ) : null}

        {items.length > 0 ? (
          renderItemList(items, props)
        ) : (
          <EmptyState
            title="No things saved yet"
            message="This section is optional. Good when useful, bad when bloated."
          />
        )}
      </>
    );
  }

  if (sectionKey === "insurance") {
    return items.length > 0 ? (
      renderItemList(items, props)
    ) : (
      <EmptyState
        title="No insurance saved yet"
        message="Store policy routes and cover records here."
      />
    );
  }

  if (sectionKey === "claims") {
    return items.length > 0 ? (
      renderItemList(items, props)
    ) : (
      <EmptyState
        title="No claim items yet"
        message="Use this for compensation, refund and delay evidence."
      />
    );
  }

  return (
    <>
      <View style={styles.noteBox}>
        <Text style={styles.noteBoxTitle}>Trip notes</Text>
        <Text style={styles.noteBoxSub}>
          Save only useful notes: ticket thoughts, hotel shortlist, reminders, booking gaps.
        </Text>

        <TextInput
          value={noteText}
          onChangeText={onNoteTextChange}
          placeholder="Add a note (tickets, hotel shortlist, reminders, anything)…"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.noteInput}
          multiline
        />

        <Pressable
          onPress={onAddNote}
          disabled={noteSaving}
          style={[styles.noteSaveBtn, noteSaving && styles.noteSaveBtnDisabled]}
        >
          <Text style={styles.noteSaveText}>{noteSaving ? "Saving…" : "Save note"}</Text>
        </Pressable>
      </View>

      {items.length > 0 ? (
        <View style={styles.noteListWrap}>{renderItemList(items, props)}</View>
      ) : (
        <View style={styles.noteEmptyWrap}>
          <EmptyState
            title="No notes yet"
            message="Notes you actually need should live here, not scattered across your phone."
          />
        </View>
      )}
    </>
  );
});

