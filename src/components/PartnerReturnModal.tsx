// src/components/PartnerReturnModal.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";

import { theme } from "@/src/constants/theme";
import type { LastPartnerClick } from "@/src/services/partnerClicks";
import { getPartnerOrNull } from "@/src/constants/partners";

type Props = {
  visible: boolean;
  itemId: string | null;
  click?: LastPartnerClick | null;

  onBooked: (itemId: string) => Promise<void>;
  onNotBooked: (itemId: string) => Promise<void>;
  onNotNow: (itemId: string) => Promise<void>;
};

type LoadingState = "booked" | "notBooked" | "notNow" | null;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function shortDomain(url?: string | null): string {
  const raw = clean(url);
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    return parsed.hostname.replace(/^www\./i, "");
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
}: Props) {
  const [loading, setLoading] = useState<LoadingState>(null);

  useEffect(() => {
    if (!visible) {
      setLoading(null);
    }
  }, [visible]);

  const meta = useMemo(() => {
    const partner = click?.partnerId ? getPartnerOrNull(click.partnerId) : null;
    const partnerName = clean(partner?.display?.name);
    const domain = shortDomain(click?.url);

    const bits = [partnerName, domain].filter(Boolean);
    return bits.length ? bits.join(" • ") : null;
  }, [click]);

  const busy = loading !== null;
  const hasItem = Boolean(clean(itemId));

  const run = useCallback(
    async (kind: Exclude<LoadingState, null>) => {
      const id = clean(itemId);
      if (!id) return;
      if (loading !== null) return;

      setLoading(kind);

      try {
        if (kind === "booked") {
          await onBooked(id);
          return;
        }

        if (kind === "notBooked") {
          await onNotBooked(id);
          return;
        }

        await onNotNow(id);
      } finally {
        setLoading(null);
      }
    },
    [itemId, loading, onBooked, onNotBooked, onNotNow]
  );

  const handleSoftDismiss = useCallback(() => {
    if (!hasItem || busy) return;
    void run("notNow");
  }, [hasItem, busy, run]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSoftDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Did you complete booking?</Text>

          {meta ? <Text style={styles.meta}>{meta}</Text> : null}

          {busy ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>
                {loading === "booked"
                  ? "Saving…"
                  : loading === "notBooked"
                    ? "Updating…"
                    : "Ok…"}
              </Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable
                disabled={!hasItem || busy}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnNeutral,
                  (!hasItem || busy) && styles.btnDisabled,
                  pressed && !busy ? styles.btnPressed : null,
                ]}
                onPress={() => void run("notNow")}
              >
                <Text style={styles.btnNeutralText}>Not now</Text>
              </Pressable>

              <Pressable
                disabled={!hasItem || busy}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnNo,
                  (!hasItem || busy) && styles.btnDisabled,
                  pressed && !busy ? styles.btnPressed : null,
                ]}
                onPress={() => void run("notBooked")}
              >
                <Text style={styles.btnNoText}>No</Text>
              </Pressable>

              <Pressable
                disabled={!hasItem || busy}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnYes,
                  (!hasItem || busy) && styles.btnDisabled,
                  pressed && !busy ? styles.btnPressed : null,
                ]}
                onPress={() => void run("booked")}
              >
                <Text style={styles.btnYesText}>Yes, booked</Text>
              </Pressable>
            </View>
          )}

          {!busy ? (
            <Pressable onPress={handleSoftDismiss} style={styles.dismiss}>
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

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  btn: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  btnPressed: {
    opacity: 0.9,
  },

  btnDisabled: {
    opacity: 0.5,
  },

  btnNeutral: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  btnNeutralText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  btnNo: {
    borderColor: "rgba(255,200,80,0.35)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },

  btnNoText: {
    color: "rgba(255,200,80,1)",
    fontWeight: "900",
    fontSize: 12,
  },

  btnYes: {
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,255,136,0.14)",
  },

  btnYesText: {
    color: "rgba(0,255,136,1)",
    fontWeight: "900",
    fontSize: 12,
  },

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
