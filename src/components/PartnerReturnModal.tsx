// src/components/PartnerReturnModal.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItemType } from "@/src/core/savedItemTypes";
import type { LastPartnerClick } from "@/src/services/partnerClicks";

import { attachTicketProof } from "@/src/services/ticketAttachment";

type Props = {
  visible: boolean;
  itemId: string | null;

  /**
   * Optional context (nice-to-have for UI text),
   * comes from partnerClicks watcher.
   */
  click?: LastPartnerClick | null;

  // Actions
  onBooked: (itemId: string) => Promise<void>;
  onNotBooked: (itemId: string) => Promise<void>;
  onNotNow: (itemId?: string) => Promise<void>;
  onClose: () => void;
};

export default function PartnerReturnModal({
  visible,
  itemId,
  click,
  onBooked,
  onNotBooked,
  onNotNow,
  onClose,
}: Props) {
  const [loading, setLoading] = useState<null | "booked" | "not_booked" | "not_now">(null);

  const item = useMemo(() => {
    const id = String(itemId ?? "").trim();
    if (!id) return null;
    return savedItemsStore.getState().items.find((x) => x.id === id) ?? null;
  }, [itemId]);

  const itemType: SavedItemType | null = (item?.type as any) ?? null;

  const title = useMemo(() => {
    const partner = String(click?.partnerId ?? "").trim();
    if (partner) return "Did you complete booking?";
    return "Did you complete booking?";
  }, [click]);

  const subtitle = useMemo(() => {
    // Keep copy simple. The statuses are what matters.
    if (item?.title) return item.title;
    return "We’ll keep your plan organised in your Trip Hub.";
  }, [item?.title]);

  async function handleBooked() {
    const id = String(itemId ?? "").trim();
    if (!id || loading) return;

    setLoading("booked");
    try {
      await onBooked(id);

      // Proof attachment: only for match tickets (Phase 1)
      if (itemType === "tickets") {
        await attachTicketProof(id);
      }

      onClose();
    } finally {
      setLoading(null);
    }
  }

  async function handleNotBooked() {
    const id = String(itemId ?? "").trim();
    if (!id || loading) return;

    setLoading("not_booked");
    try {
      await onNotBooked(id);
      onClose();
    } finally {
      setLoading(null);
    }
  }

  async function handleNotNow() {
    const id = String(itemId ?? "").trim();
    if (loading) return;

    setLoading("not_now");
    try {
      // Keep pending; just dismiss prompt.
      await onNotNow(id || undefined);
      onClose();
    } finally {
      setLoading(null);
    }
  }

  const isBusy = !!loading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>

          {isBusy ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>
                {loading === "booked"
                  ? "Saving as booked…"
                  : loading === "not_booked"
                  ? "Moving to saved…"
                  : "Keeping it pending…"}
              </Text>
            </View>
          ) : (
            <View style={styles.row}>
              <Pressable style={styles.noBtn} onPress={handleNotBooked}>
                <Text style={styles.noText}>No</Text>
                <Text style={styles.small}>Didn’t book</Text>
              </Pressable>

              <Pressable style={styles.maybeBtn} onPress={handleNotNow}>
                <Text style={styles.maybeText}>Not now</Text>
                <Text style={styles.small}>Keep pending</Text>
              </Pressable>

              <Pressable style={styles.yesBtn} onPress={handleBooked}>
                <Text style={styles.yesText}>Yes</Text>
                <Text style={styles.smallYes}>Booked</Text>
              </Pressable>
            </View>
          )}

          {!isBusy ? (
            <Pressable onPress={onClose} style={styles.dismiss}>
              <Text style={styles.dismissText}>Close</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  sub: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "800",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  noBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 2,
  },
  noText: {
    color: "#fff",
    fontWeight: "900",
  },

  maybeBtn: {
    flex: 1,
    backgroundColor: "rgba(255,200,0,0.10)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(255,200,0,0.18)",
  },
  maybeText: {
    color: "rgba(255,220,140,0.95)",
    fontWeight: "900",
  },

  yesBtn: {
    flex: 1,
    backgroundColor: "rgba(0,255,136,0.18)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.22)",
  },
  yesText: {
    color: "#00FF88",
    fontWeight: "900",
  },

  small: {
    color: "rgba(255,255,255,0.65)",
    fontWeight: "800",
    fontSize: 11,
  },
  smallYes: {
    color: "rgba(0,255,136,0.85)",
    fontWeight: "800",
    fontSize: 11,
  },

  dismiss: {
    marginTop: 6,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dismissText: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: "800",
    fontSize: 12,
  },
});
