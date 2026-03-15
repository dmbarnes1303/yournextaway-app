import React, { memo } from "react";
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
    const provider = clean(item.metadata?.ticketProvider);

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

function shortDomain(url?: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function buildMetaLine(item: SavedItem) {
  const bits: string[] = [safeTypeLabel(item.type)];

  const partnerName = safePartnerName(item);
  if (partnerName) bits.push(partnerName);

  const domain = item.partnerUrl ? shortDomain(item.partnerUrl) : "";
  if (domain) bits.push(domain);

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
  if (count <= 0) return "No proof attached yet";
  return `${count} proof file${count === 1 ? "" : "s"} attached`;
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
  stayBestAreas: Array<{ area: string; notes?: string }>;
  stayBudgetAreas: Array<{ area: string; notes?: string }>;
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

  const style =
    status === "pending"
      ? styles.badgePending
      : status === "saved"
        ? styles.badgeSaved
        : status === "booked"
          ? styles.badgeBooked
          : styles.badgeArchived;

  return (
    <View style={[styles.badge, style]}>
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
  const livePrice = getLivePriceLine(item);
  const provider = getTicketProviderFromItem(item);
  const proofText = proofStateText(item);
  const missingProof = item.status === "booked" && !hasProof(item);
  const proofBusy = proofBusyId === item.id;
  const isNote = item.type === "note" || item.type === "other";

  return (
    <View style={styles.itemRow}>
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
  stayBestAreas: Array<{ area: string; notes?: string }>;
  stayBudgetAreas: Array<{ area: string; notes?: string }>;
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

  if (sectionKey === "tickets") {
    return (
      <>
        {primaryMatchId ? (
          <Pressable onPress={onOpenTicketsForPrimaryMatch} style={styles.sectionCta}>
            <Text style={styles.sectionCtaTitle}>Open live ticket options</Text>
            <Text style={styles.sectionCtaBody}>
              Compare providers for the primary match and save the route into the workspace.
            </Text>
          </Pressable>
        ) : (
          <EmptyState
            title="No match selected"
            message="Add a match first to unlock ticket planning."
          />
        )}

        {renderItemList(items, props)}
      </>
    );
  }

  if (sectionKey === "stay") {
    return (
      <>
        {affiliateUrls?.hotelsUrl ? (
          <Pressable
            onPress={() =>
              onOpenPartner({
                partnerId: "expedia",
                url: affiliateUrls.hotelsUrl,
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
              Use the stay guidance below to avoid booking a cheap place in a useless area.
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
            message="Save hotels here so the trip isn’t just a vague idea."
          />
        )}
      </>
    );
  }

  if (sectionKey === "travel") {
    return (
      <>
        <View style={styles.sectionActionRow}>
          {affiliateUrls?.flightsUrl ? (
            <Pressable
              onPress={() =>
                onOpenPartner({
                  partnerId: "aviasales",
                  url: affiliateUrls.flightsUrl,
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

          {affiliateUrls?.omioUrl ? (
            <Pressable
              onPress={() =>
                onOpenPartner({
                  partnerId: "omio",
                  url: affiliateUrls.omioUrl,
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
            message="Flights or rail should live here, not in your head."
          />
        )}
      </>
    );
  }

  if (sectionKey === "transfers") {
    return (
      <>
        {affiliateUrls?.transfersUrl ? (
          <Pressable
            onPress={() =>
              onOpenPartner({
                partnerId: "kiwitaxi",
                url: affiliateUrls.transfersUrl,
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
              Sort airport-to-city and city-to-stadium movement before it becomes a pain.
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
            message="This is where local movement should be sorted."
          />
        )}
      </>
    );
  }

  if (sectionKey === "things") {
    return (
      <>
        {affiliateUrls?.experiencesUrl ? (
          <Pressable
            onPress={() =>
              onOpenPartner({
                partnerId: "getyourguide",
                url: affiliateUrls.experiencesUrl,
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
              Only add things that genuinely improve the trip. Don’t clutter it with filler.
            </Text>
          </Pressable>
        ) : null}

        {items.length > 0 ? (
          renderItemList(items, props)
        ) : (
          <EmptyState
            title="No things saved yet"
            message="This section is optional, but useful when it earns its place."
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
        message="Use this section for cover and policy records."
      />
    );
  }

  if (sectionKey === "claims") {
    return items.length > 0 ? (
      renderItemList(items, props)
    ) : (
      <EmptyState
        title="No claim items yet"
        message="Use this section for compensation, refund and delay evidence."
      />
    );
  }

  return (
    <>
      <View style={styles.noteBox}>
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
          <EmptyState title="No notes yet" message="Notes you save for this trip appear here." />
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
      <Pressable
        onPress={() => onToggleSection(sectionKey)}
        style={styles.workspaceSectionHeader}
      >
        <View style={styles.flexOne}>
          <Text style={styles.workspaceSectionTitle}>{section.title}</Text>
          <Text style={styles.workspaceSectionSub}>
            {section.subtitle || sectionStateLabel(sectionKey, total)}
          </Text>
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
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
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

  noteInput: {
    minHeight: 80,
    color: theme.colors.text,
    textAlignVertical: "top",
    fontWeight: "800",
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
