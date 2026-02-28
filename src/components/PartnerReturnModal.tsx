// src/components/PartnerReturnModal.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from "react-native";

import { theme } from "@/src/constants/theme";
import type { LastPartnerClick } from "@/src/services/partnerClicks";
import { getPartnerOrNull } from "@/src/core/partners";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";

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

export default function PartnerReturnModal({
  visible,
  itemId,
  click,
  onBooked,
  onNotBooked,
  onNotNow,
  onClose,
}: Props) {
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
        // 1) Mark booked (store transition)
        await onBooked(itemId);

        // 2) Centralised proof flow (Wallet-friendly, offline-first)
        await confirmBookedAndOfferProof(itemId);

        onClose();
        return;
      }

      if (kind === "notBooked") {
        await onNotBooked(itemId);
        onClose();
        return;
      }

      // kind === "notNow"
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
                {loading === "booked" ? "Saving…" : loading === "notBooked" ? "Updating…" : "Ok…"}
              </Text>
            </View>
          ) : (
            <View style={styles.row}>
              <Pressable style={[styles.btn, styles.btnNeutral]} onPress={() => run("notNow")}>
                <Text style={styles.btnNeutralText}>Not now</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnNo]} onPress={() => run("notBooked")}>
                <Text style={styles.btnNoText}>No</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnYes]} onPress={() => run("booked")}>
                <Text style={styles.btnYesText}>Yes, booked</Text>
              </Pressable>
            </View>
          )}

          {!busy ? (
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
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(10,10,12,0.92)",
  },
  title: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  meta: {
    marginTop: -4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  btnNeutral: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  btnNeutralText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  btnNo: {
    borderColor: "rgba(255,200,80,0.35)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },
  btnNoText: { color: "rgba(255,200,80,1)", fontWeight: "900", fontSize: 12 },

  btnYes: {
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,255,136,0.14)",
  },
  btnYesText: { color: "rgba(0,255,136,1)", fontWeight: "900", fontSize: 12 },

  dismiss: {
    alignSelf: "center",
    paddingTop: 2,
  },
  dismissText: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
  },
});
