import React, { useCallback, useEffect, useState } from "react";
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

  const busy = loading !== null;
  const itemId = clean(request?.itemId);

  const handleAddProof = useCallback(async () => {
    if (!itemId || busy) return;

    setLoading("proof");

    try {
      await onAddProof(itemId);
    } finally {
      setLoading(null);
    }
  }, [busy, itemId, onAddProof]);

  const handleNotNow = useCallback(async () => {
    if (busy) return;

    setLoading("notNow");

    try {
      onNotNow();
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

          <Text style={styles.eyebrow}>Saved to Wallet</Text>

          <Text style={styles.title}>Add booking proof?</Text>

          <View style={styles.bookingCard}>
            <Text style={styles.bookingLabel}>Booked item</Text>
            <Text style={styles.bookingTitle} numberOfLines={2}>
              {clean(request?.title) || "Booking"}
            </Text>
          </View>

          <Text style={styles.body}>
            Your trip now shows this as booked. Add a PDF or screenshot so you can access the proof offline in Wallet.
          </Text>

          {busy ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={APP_GREEN} />
              <Text style={styles.loadingText}>Saving…</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={handleAddProof}
              >
                <Text style={styles.primaryButtonText}>Add proof</Text>
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
    backgroundColor: "rgba(0,0,0,0.72)",
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
    marginBottom: 16,
  },

  eyebrow: {
    color: APP_GREEN,
    fontSize: 10,
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
    marginTop: 16,
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
    marginTop: 6,
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
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
