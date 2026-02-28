// src/components/PartnerReturnModal.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from "react-native";

import { theme } from "@/src/constants/theme";
import { attachTicketProof } from "@/src/services/ticketAttachment";
import type { LastPartnerClick } from "@/src/services/partnerClicks";
import { getPartnerOrNull } from "@/src/core/partners";

type Props = {
  visible: boolean;
  itemId: string | null;
  click?: LastPartnerClick | null;

  onBooked: (itemId: string) => Promise<void>;
  onNotBooked: (itemId: string) => Promise<void>;
  onNotNow: (itemId: string) => Promise<void>;

  onClose: () => void;
};

function shortDomain(url?: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function PartnerReturnModal({ visible, itemId, click, onBooked, onNotBooked, onNotNow, onClose }: Props) {
  const [loading, setLoading] = useState<"booked" | "notBooked" | "notNow" | null>(null);

  const meta = useMemo(() => {
    const partnerName = click?.partnerId ? getPartnerOrNull(click.partnerId)?.name : null;
    const domain = shortDomain(click?.url);
    const bits = [partnerName, domain].filter(Boolean);
    return bits.length ? bits.join(" • ") : null;
  }, [click]);

  async function run(kind: "booked" | "notBooked" | "notNow") {
    if (!itemId) return;

    setLoading(kind);
    try {
      if (kind === "booked") {
        await onBooked(itemId);

        // Ask for attachment proof (Phase 1).
        // NOTE: current implementation is ticket-focused. If you later generalise attachments,
        // swap this to a generic "attachProof" service.
        await attachTicketProof(itemId);

        onClose();
        return;
      }

      if (kind === "notBooked") {
        await onNotBooked(itemId);
        onClose();
        return;
      }

      // notNow
      await onNotNow(itemId);
      onClose();
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Did you complete booking?</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}

          {busy ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>
                {loading === "booked" ? "Saving to Wallet…" : loading === "notBooked" ? "Updating…" : "Dismissing…"}
              </Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.btnNeutral]} onPress={() => run("notNow")}>
                <Text style={styles.btnNeutralText}>Not now</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnNo]} onPress={() => run("notBooked")}>
                <Text style={styles.btnNoText}>No, didn’t book</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnYes]} onPress={() => run("booked")}>
                <Text style={styles.btnYesText}>Yes, booked</Text>
              </Pressable>
            </View>
          )}

          {!busy ? (
            <Text style={styles.hint}>
              Tip: “Not now” keeps it Pending. “No” moves it to Saved so it doesn’t keep nagging you.
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 10,
  },
  title: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
    paddingBottom: 2,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },
  actions: {
    marginTop: 6,
    gap: 10,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  btnNeutral: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  btnNeutralText: { color: "#fff", fontWeight: "900" },

  btnNo: {
    backgroundColor: "rgba(255,80,80,0.10)",
    borderColor: "rgba(255,80,80,0.35)",
  },
  btnNoText: { color: "rgba(255,140,140,1)", fontWeight: "900" },

  btnYes: {
    backgroundColor: "rgba(0,255,136,0.16)",
    borderColor: "rgba(0,255,136,0.45)",
  },
  btnYesText: { color: "#00FF88", fontWeight: "900" },

  hint: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 14,
  },
});
