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

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  mode?: "offer" | "success" | "info";
  onConfirm?: () => Promise<void> | void;
  onCancel: () => void;
};

type BusyState = "confirm" | null;

const APP_GREEN = theme.colors.primary;
const APP_GREEN_SOFT = "rgba(34,197,94,0.14)";
const APP_GREEN_BORDER = "rgba(34,197,94,0.34)";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export default function BookingProofModal({
  visible,
  title,
  message,
  confirmLabel = "Add proof",
  cancelLabel = "Not now",
  loadingLabel = "Saving…",
  mode = "offer",
  onConfirm,
  onCancel,
}: Props) {
  const [busy, setBusy] = useState<BusyState>(null);

  useEffect(() => {
    if (!visible) setBusy(null);
  }, [visible]);

  const handleCancel = useCallback(() => {
    if (busy) return;
    onCancel();
  }, [busy, onCancel]);

  const handleConfirm = useCallback(async () => {
    if (busy || !onConfirm) return;

    setBusy("confirm");

    try {
      await onConfirm();
    } finally {
      setBusy(null);
    }
  }, [busy, onConfirm]);

  const isSuccess = mode === "success";
  const hasConfirm = Boolean(onConfirm);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPress} onPress={handleCancel} />

        <View style={styles.card}>
          <View style={styles.handle} />

          <Text style={styles.eyebrow}>
            {isSuccess ? "Wallet updated" : "Booking proof"}
          </Text>

          <Text style={styles.title}>{clean(title) || "Saved in Wallet"}</Text>

          <Text style={styles.body}>
            {clean(message) ||
              "Add booking proof for offline access and a stronger Wallet record."}
          </Text>

          {busy ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={APP_GREEN} />
              <Text style={styles.loadingText}>{loadingLabel}</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              {hasConfirm ? (
                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  hasConfirm ? styles.secondaryButton : styles.primaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleCancel}
              >
                <Text
                  style={hasConfirm ? styles.secondaryButtonText : styles.primaryButtonText}
                >
                  {hasConfirm ? cancelLabel : "OK"}
                </Text>
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
    backgroundColor: APP_GREEN_SOFT,
    borderWidth: 1,
    borderColor: APP_GREEN_BORDER,
  },

  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
});
