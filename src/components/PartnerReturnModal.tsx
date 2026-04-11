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
    if (!visible) setLoading(null);
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
      if (!id || loading) return;

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

  const handleDismiss = useCallback(() => {
    if (!hasItem || busy) return;
    void run("notNow");
  }, [hasItem, busy, run]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Did you book this on the partner site?</Text>

          {meta ? <Text style={styles.meta}>{meta}</Text> : null}

          <Text style={styles.subtext}>
            We can’t verify bookings automatically. Your choice only updates your trip
            tracker and Wallet unless you add proof.
          </Text>

          {busy ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Saving your choice…</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={() => void run("notNow")}>
                <Text style={styles.btnText}>Not now</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnWarn]} onPress={() => void run("notBooked")}>
                <Text style={styles.btnText}>Didn’t book</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => void run("booked")}>
                <Text style={styles.btnText}>Yes — I booked it</Text>
              </Pressable>
            </View>
          )}

          {!busy ? (
            <Pressable onPress={handleDismiss} style={styles.dismiss}>
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
    backgroundColor: "rgba(10,10,12,0.95)",
  },
  title: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },
  subtext: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  btnPrimary: {
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,255,136,0.12)",
  },
  btnWarn: {
    borderColor: "rgba(255,200,80,0.35)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },
  btnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },
  dismiss: {
    alignSelf: "center",
  },
  dismissText: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
  },
});
