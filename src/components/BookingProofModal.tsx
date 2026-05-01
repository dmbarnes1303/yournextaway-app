import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "@/src/constants/theme";
import type { BookingProofRequest } from "@/src/services/bookingProof";

type Props = {
  visible: boolean;
  request: BookingProofRequest | null;
  onAddProof: (itemId: string) => Promise<void>;
  onNotNow: () => void;
};

type LoadingState = "proof" | "notNow" | null;

const APP_GREEN = theme.colors.primary;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function bookingTypeLabel(title?: string | null): string {
  const value = clean(title).toLowerCase();

  if (value.includes("ticket")) return "Ticket proof";
  if (value.includes("hotel") || value.includes("stay")) return "Stay proof";
  if (value.includes("flight") || value.includes("travel")) return "Travel proof";
  if (value.includes("insurance")) return "Insurance proof";

  return "Booking proof";
}

export default function BookingProofModal({
  visible,
  request,
  onAddProof,
  onNotNow,
}: Props) {
  const [loading, setLoading] = useState<LoadingState>(null);

  useEffect(() => {
    if (!visible) setLoading(null);
  }, [visible]);

  const itemId = clean(request?.itemId);
  const title = clean(request?.title) || "Booking";
  const proofType = useMemo(() => bookingTypeLabel(title), [title]);

  const busy = loading !== null;
  const canAct = Boolean(itemId) && !busy;

  const handleAddProof = useCallback(async () => {
    if (!canAct) return;

    setLoading("proof");

    try {
      await onAddProof(itemId);
    } finally {
      setLoading(null);
    }
  }, [canAct, itemId, onAddProof]);

  const handleNotNow = useCallback(async () => {
    if (busy) return;

    setLoading("notNow");

    try {
      await Promise.resolve(onNotNow());
    } finally {
      setLoading(null);
    }
  }, [busy, onNotNow]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleNotNow}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPress} onPress={handleNotNow} />

        <View style={styles.card}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.walletIcon}>
              <Text style={styles.walletIconText}>✓</Text>
            </View>

            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Saved to Wallet</Text>
              <Text style={styles.title}>Add proof for offline access?</Text>
            </View>
          </View>

          <View style={styles.bookingCard}>
            <Text style={styles.bookingLabel}>{proofType}</Text>
            <Text style={styles.bookingTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.bookingMeta}>
              Store a PDF or screenshot so the booking is easy to find on the trip.
            </Text>
          </View>

          <Text style={styles.body}>
            Booked means user-confirmed. Adding proof makes Wallet more useful, but it still does
            not automatically verify the booking.
          </Text>

          {busy ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={APP_GREEN} />
              <Text style={styles.loadingText}>
                {loading === "proof" ? "Opening proof picker…" : "Saving…"}
              </Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={handleAddProof}
                disabled={!canAct}
              >
                <Text style={styles.primaryButtonText}>Add proof now</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={handleNotNow}
              >
                <Text style={styles.secondaryButtonText}>Not now</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.74)",
  },

  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },

  card: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: "rgba(7,12,12,0.98)",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  handle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 18,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },

  walletIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.34)",
  },

  walletIconText: {
    color: APP_GREEN,
    fontSize: 20,
    fontWeight: "900",
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    color: APP_GREEN,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  title: {
    marginTop: 7,
    color: theme.colors.textPrimary,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.55,
  },

  bookingCard: {
    marginTop: 18,
    borderRadius: 22,
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  bookingLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  bookingTitle: {
    marginTop: 7,
    color: theme.colors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },

  bookingMeta: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  body: {
    marginTop: 14,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  loadingBox: {
    marginTop: 18,
    minHeight: 58,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "900",
  },

  actions: {
    marginTop: 18,
    gap: 10,
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APP_GREEN,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  primaryButtonText: {
    color: "#031007",
    fontSize: 15,
    fontWeight: "900",
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
});
