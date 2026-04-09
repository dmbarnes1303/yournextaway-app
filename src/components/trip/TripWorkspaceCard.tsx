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
  clean,
  providerBadgeStyle,
  providerLabel,
  providerShort,
  statusLabel,
  savedItemMetaLine,
  proofStateText,
} from "@/src/features/tripDetail/helpers";

type PartnerOpenArgs = {
  partnerId: unknown;
  url: string;
  title: string;
  savedItemType?: SavedItemType;
  metadata?: Record<string, unknown>;
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
    insuranceUrl?: string | null;
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

function friendlyTypeLabel(item: SavedItem): string {
  if (item.type === "tickets") return "Tickets";
  if (item.type === "flight") return "Flights";
  if (item.type === "hotel") return "Stay";
  if (item.type === "train") return "Rail";
  if (item.type === "transfer") return "Transport";
  if (item.type === "insurance") return "Insurance";
  if (item.type === "claim") return "Claims";
  if (item.type === "things") return "Extras";
  if (item.type === "note" || item.type === "other") return "Notes";
  return "Item";
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
  if (sectionKey === "travel") return "Flights should be handled early, not guessed later.";
  if (sectionKey === "stay") {
    return "This currently opens Expedia hotel search, not a full best-value comparison system.";
  }
  if (sectionKey === "transfers") {
    return "No live transport booking partner exists yet. Use this section for manual planning.";
  }
  if (sectionKey === "things") return "Extras are optional. Do not clutter the trip.";
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

  return raw.replace(/\bLive price on\b/gi, "Live price •").replace(/\s+/g, " ").trim();
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
  return (
    <View style={[styles.badge, statusTone(status)]}>
      <Text style={styles.badgeText}>{statusLabel(status)}</Text>
    </View>
  );
});

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
            {isNote ? "Notes" : savedItemMetaLine(item) || friendlyTypeLabel(item)}
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
  const insuranceUrl = affiliateUrls?.insuranceUrl ?? null;

  if (sectionKey === "tickets") {
    return (
      <>
        {primaryMatchId ? (
          <Pressable onPress={onOpenTicketsForPrimaryMatch} style={styles.sectionCta}>
            <Text style={styles.sectionCtaTitle}>Compare live ticket options</Text>
            <Text style={styles.sectionCtaBody}>
              This is the anchor step. If tickets are not sorted, the rest of the trip is built on guesswork.
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
            <Text style={styles.sectionCtaTitle}>Search hotels on Expedia</Text>
            <Text style={styles.sectionCtaBody}>
              This currently opens Expedia hotel search for your saved city and dates. It is not a full best-value comparison engine.
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
        </View>

        {items.length > 0 ? (
          renderItemList(items, props)
        ) : (
          <EmptyState
            title="No travel items yet"
            message="Flights should be decided early. Leaving them vague is how trips get messy."
          />
        )}
      </>
    );
  }

  if (sectionKey === "transfers") {
    return (
      <>
        <View style={styles.guidanceMiniBox}>
          <Text style={styles.guidanceMiniTitle}>Transport planning</Text>
          <Text style={styles.guidanceMiniLine}>
            • No supported transport booking partner is live in this build yet.
          </Text>
          <Text style={styles.guidanceMiniLine}>
            • Use this section to track airport, hotel and stadium movement manually.
          </Text>
        </View>

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
            title="No transport items yet"
            message="Use this section for manual transport planning until a real partner is wired in."
          />
        )}
      </>
    );
  }

  if (sectionKey === "things") {
    return items.length > 0 ? (
      renderItemList(items, props)
    ) : (
      <EmptyState
        title="No extras saved yet"
        message="Extras are optional. Do not pad the trip with pointless filler."
      />
    );
  }

  if (sectionKey === "insurance") {
    return (
      <>
        {insuranceUrl ? (
          <Pressable
            onPress={() =>
              onOpenPartner({
                partnerId: "safetywing",
                url: insuranceUrl,
                savedItemType: "insurance",
                title: `Travel insurance for ${cityName}`,
                metadata: {
                  city: cityName,
                  startDate: tripStartDate,
                  endDate: tripEndDate,
                  sourceSurface: "workspace_cta",
                  sourceSection: "insurance",
                },
              })
            }
            style={styles.sectionCta}
          >
            <Text style={styles.sectionCtaTitle}>Open travel insurance</Text>
            <Text style={styles.sectionCtaBody}>
              Insurance is optional for some trips, but if you use it, keep the policy route and proof in one place.
            </Text>
          </Pressable>
        ) : null}

        {items.length > 0 ? (
          renderItemList(items, props)
        ) : (
          <EmptyState
            title="No insurance saved yet"
            message="Store policy routes and cover records here."
          />
        )}
      </>
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

type WorkspaceTabsProps = {
  sectionOrder: WorkspaceSectionKey[];
  activeSection: WorkspaceSectionKey;
  sectionActiveTotals: Record<WorkspaceSectionKey, number>;
  onSetActiveSection: (section: WorkspaceSectionKey) => void;
};

const WorkspaceTabs = memo(function WorkspaceTabs({
  sectionOrder,
  activeSection,
  sectionActiveTotals,
  onSetActiveSection,
}: WorkspaceTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.workspaceTabsRow}
    >
      {sectionOrder.map((sectionKey) => {
        const total = sectionActiveTotals[sectionKey] ?? 0;
        const selected = activeSection === sectionKey;

        return (
          <Pressable
            key={sectionKey}
            onPress={() => onSetActiveSection(sectionKey)}
            style={[styles.workspaceTab, selected && styles.workspaceTabActive]}
          >
            <Text style={[styles.workspaceTabTitle, selected && styles.workspaceTabTitleActive]}>
              {sectionTitle(sectionKey)}
            </Text>
            <Text style={[styles.workspaceTabSub, selected && styles.workspaceTabSubActive]}>
              {sectionStateLabel(sectionKey, total)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

type WorkspaceSectionCardProps = {
  sectionKey: WorkspaceSectionKey;
  workspace: TripWorkspace | null;
  activeSection: WorkspaceSectionKey;
  total: number;
  children: React.ReactNode;
  onToggleSection: (section: WorkspaceSectionKey) => void;
};

const WorkspaceSectionCard = memo(function WorkspaceSectionCard({
  sectionKey,
  workspace,
  activeSection,
  total,
  children,
  onToggleSection,
}: WorkspaceSectionCardProps) {
  const section = WORKSPACE_SECTIONS[sectionKey];
  const collapsed = Boolean(workspace?.collapsed?.[sectionKey]);
  const selected = activeSection === sectionKey;

  if (!selected) return null;

  return (
    <View style={styles.workspaceSection}>
      <Pressable onPress={() => onToggleSection(sectionKey)} style={styles.workspaceSectionHeader}>
        <View style={styles.flexOne}>
          <Text style={styles.workspaceSectionTitle}>{section.title}</Text>
          <Text style={styles.workspaceSectionSub}>{sectionLead(sectionKey)}</Text>
        </View>

        <View style={styles.workspaceHeaderRight}>
          <View style={styles.workspaceCountPill}>
            <Text style={styles.workspaceCountText}>{total}</Text>
          </View>
          <Text style={styles.chev}>{collapsed ? "›" : "⌄"}</Text>
        </View>
      </Pressable>

      {!collapsed ? <View style={styles.sectionContentWrap}>{children}</View> : null}
    </View>
  );
});

const WorkspaceSummaryStrip = memo(function WorkspaceSummaryStrip({
  snapshot,
}: {
  snapshot: TripWorkspaceCardProps["workspaceSnapshot"];
}) {
  const summary = useMemo(() => {
    const totals = snapshot.sectionActiveTotals;
    return [
      `Tickets ${totals.tickets ?? 0}`,
      `Travel ${totals.travel ?? 0}`,
      `Stay ${totals.stay ?? 0}`,
      `Transfers ${totals.transfers ?? 0}`,
      `Things ${totals.things ?? 0}`,
    ];
  }, [snapshot]);

  return (
    <View style={styles.summaryStrip}>
      <Text style={styles.summaryStripTitle}>Workspace snapshot</Text>
      <Text style={styles.summaryStripText}>{summary.join(" • ")}</Text>
    </View>
  );
});

export default function TripWorkspaceCard({
  workspaceSnapshot,
  workspace,
  sectionOrder,
  activeSection,
  groupedBySection,
  primaryMatchId,
  affiliateUrls,
  cityName,
  originIata,
  tripStartDate,
  tripEndDate,
  noteText,
  noteSaving,
  proofBusyId,
  stayBestAreas,
  stayBudgetAreas,
  transportStops,
  onSetActiveSection,
  onToggleSection,
  onNoteTextChange,
  onAddNote,
  onOpenTicketsForPrimaryMatch,
  onOpenSavedItem,
  onOpenNoteActions,
  onConfirmMarkBooked,
  onAddProofForBookedItem,
  onViewWallet,
  onConfirmMoveToPending,
  onConfirmArchive,
  onOpenPartner,
  getLivePriceLine,
  getTicketProviderFromItem,
}: TripWorkspaceCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Workspace</Text>
        <Text style={styles.sectionSub}>{workspaceSnapshot.activeTotal} active items</Text>
      </View>

      <WorkspaceSummaryStrip snapshot={workspaceSnapshot} />

      <WorkspaceTabs
        sectionOrder={sectionOrder}
        activeSection={activeSection}
        sectionActiveTotals={workspaceSnapshot.sectionActiveTotals}
        onSetActiveSection={onSetActiveSection}
      />

      <View style={styles.sectionStack}>
        {sectionOrder.map((sectionKey) => {
          const total = workspaceSnapshot.sectionActiveTotals[sectionKey] ?? 0;
          const items = groupedBySection[sectionKey] ?? [];

          return (
            <WorkspaceSectionCard
              key={sectionKey}
              sectionKey={sectionKey}
              workspace={workspace}
              activeSection={activeSection}
              total={total}
              onToggleSection={onToggleSection}
            >
              <SectionContent
                sectionKey={sectionKey}
                items={items}
                primaryMatchId={primaryMatchId}
                affiliateUrls={affiliateUrls}
                cityName={cityName}
                originIata={originIata}
                tripStartDate={tripStartDate}
                tripEndDate={tripEndDate}
                noteText={noteText}
                noteSaving={noteSaving}
                proofBusyId={proofBusyId}
                stayBestAreas={stayBestAreas}
                stayBudgetAreas={stayBudgetAreas}
                transportStops={transportStops}
                onNoteTextChange={onNoteTextChange}
                onAddNote={onAddNote}
                onOpenTicketsForPrimaryMatch={onOpenTicketsForPrimaryMatch}
                onOpenSavedItem={onOpenSavedItem}
                onOpenNoteActions={onOpenNoteActions}
                onConfirmMarkBooked={onConfirmMarkBooked}
                onAddProofForBookedItem={onAddProofForBookedItem}
                onViewWallet={onViewWallet}
                onConfirmMoveToPending={onConfirmMoveToPending}
                onConfirmArchive={onConfirmArchive}
                onOpenPartner={onOpenPartner}
                getLivePriceLine={getLivePriceLine}
                getTicketProviderFromItem={getTicketProviderFromItem}
              />
            </WorkspaceSectionCard>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },

  card: {
    padding: theme.spacing.lg,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },

  sectionSub: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
  },

  summaryStrip: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.18)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  summaryStripTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  summaryStripText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  providerBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  providerBadgeWrapLabeled: {
    maxWidth: 180,
  },

  providerBadgeCircle: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  providerBadgeCircleText: {
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  providerBadgeLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "900",
  },

  workspaceTabsRow: {
    paddingRight: 8,
    gap: 10,
  },

  workspaceTab: {
    minWidth: 114,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  workspaceTabActive: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.24)",
  },

  workspaceTabTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  workspaceTabTitleActive: {
    color: theme.colors.text,
  },

  workspaceTabSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 11,
  },

  workspaceTabSubActive: {
    color: theme.colors.textTertiary,
  },

  sectionStack: {
    gap: 10,
  },

  workspaceSection: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 16,
    padding: 12,
  },

  workspaceSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  workspaceHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  workspaceCountPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  workspaceCountText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  workspaceSectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 15,
  },

  workspaceSectionSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  sectionContentWrap: {
    marginTop: 10,
  },

  sectionCta: {
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.22)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  sectionCtaTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
  },

  sectionCtaBody: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  sectionActionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  smallActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  smallActionBtnPrimary: {
    borderColor: "rgba(0,255,136,0.35)",
  },

  smallActionBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  guidanceMiniBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },

  guidanceMiniTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  guidanceMiniLine: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  listGap: {
    gap: 10,
  },

  itemRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },

  itemToneNeutral: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  itemTonePending: {
    borderColor: "rgba(255,200,80,0.24)",
    backgroundColor: "rgba(255,200,80,0.07)",
  },

  itemToneSaved: {
    borderColor: "rgba(0,255,136,0.18)",
    backgroundColor: "rgba(0,255,136,0.05)",
  },

  itemToneBooked: {
    borderColor: "rgba(120,170,255,0.20)",
    backgroundColor: "rgba(120,170,255,0.06)",
  },

  itemToneWarn: {
    borderColor: "rgba(255,200,80,0.28)",
    backgroundColor: "rgba(255,200,80,0.08)",
  },

  itemMain: {
    flex: 1,
  },

  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  itemTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    flexShrink: 1,
    paddingRight: 6,
  },

  itemMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  itemMeta: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    flex: 1,
  },

  itemHintLine: {
    marginTop: 5,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
  },

  livePriceLine: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "900",
  },

  paidLine: {
    marginTop: 6,
    color: "rgba(242,244,246,0.92)",
    fontSize: 12,
    fontWeight: "900",
  },

  proofLine: {
    marginTop: 6,
    color: "rgba(160,195,255,1)",
    fontSize: 12,
    fontWeight: "900",
  },

  proofLineMissing: {
    color: "rgba(255,200,80,1)",
  },

  itemActions: {
    gap: 8,
    alignItems: "flex-end",
  },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  smallBtnPrimary: {
    borderColor: "rgba(0,255,136,0.35)",
  },

  smallBtnDisabled: {
    opacity: 0.65,
  },

  smallBtnDanger: {
    borderColor: "rgba(255,80,80,0.35)",
  },

  smallBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  badgePending: {
    borderColor: "rgba(255,200,80,0.40)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },

  badgeSaved: {
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },

  badgeBooked: {
    borderColor: "rgba(120,170,255,0.45)",
    backgroundColor: "rgba(120,170,255,0.10)",
  },

  badgeArchived: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  noteBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  noteBoxTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
  },

  noteBoxSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  noteInput: {
    minHeight: 80,
    color: theme.colors.text,
    textAlignVertical: "top",
    fontWeight: "800",
    marginTop: 10,
    ...(Platform.OS === "ios" ? { paddingTop: 10 } : null),
  },

  noteSaveBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  noteSaveBtnDisabled: {
    opacity: 0.7,
  },

  noteSaveText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  noteListWrap: {
    marginTop: 10,
  },

  noteEmptyWrap: {
    marginTop: 10,
  },

  chev: {
    color: theme.colors.textSecondary,
    fontSize: 22,
    marginTop: -2,
  },
});
