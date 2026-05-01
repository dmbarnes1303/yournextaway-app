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
import { getPartnerOrNull } from "@/src/constants/partners";
import type { LastPartnerClick } from "@/src/services/partnerClicks";

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

function savedItemLabel(type?: string | null): string {
  const value = clean(type).toLowerCase();

  if (value === "tickets") return "Ticket route";
  if (value === "hotel") return "Stay";
  if (value === "flight") return "Travel";
  if (value === "train") return "Travel";
  if (value === "insurance") return "Insurance";

  return "Booking route";
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

  const partnerMeta = useMemo(() => {
    const partner = click?.partnerId ? getPartnerOrNull(click.partnerId) : null;
    const partnerName = clean(partner?.display?.name);
    const domain = shortDomain(click?.url);

    return {
      partnerName: partnerName || "Partner site",
      domain,
      typeLabel: savedItemLabel(click?.savedItemType),
    };
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
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPress} onPress={handleDismiss} />

        <View style={styles.card}>
          <View style={styles.handle} />

          <Text style={styles.eyebrow}>Partner return</Text>

          <Text style={styles.title}>Did you complete the booking?</Text>

          <View style={styles.partnerCard}>
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>
                {partnerMeta.typeLabel.slice(0, 2).toUpperCase()}
              </Text>
            </View>

            <View style={styles.partnerCopy}>
              <Text style={styles.partnerName} numberOfLines={1}>
                {partnerMeta.partnerName}
              </Text>

              <Text style={styles.partnerSub} numberOfLines={1}>
                {partnerMeta.domain || partnerMeta.typeLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            Be honest here. This only updates your trip tracker and Wallet. It does not verify the
            booking unless you add proof later.
          </Text>

          {busy ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.colors.emeraldSoft} />
              <Text style={styles.loadingText}>Saving your choice…</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={() => void run("booked")}
              >
                <Text style={styles.primaryButtonText}>Yes, I booked it</Text>
              </Pressable>

              <View style={styles.secondaryRow}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                  onPress={() => void run("notBooked")}
                >
                  <Text style={styles.secondaryButtonText}>Didn’t book</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                  onPress={() => void run("notNow")}
                >
                  <Text style={styles.secondaryButtonText}>Not now</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!busy ? (
            <Pressable style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} onPress={handleDismiss}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          ) : null}
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
    color: theme.colors.emeraldSoft,
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

  partnerCard: {
    marginTop: 16,
    minHeight: 72,
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  partnerBadge: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.24)",
  },

  partnerBadgeText: {
    color: theme.colors.emeraldSoft,
    fontSize: 12,
    fontWeight: "900",
  },

  partnerCopy: {
    flex: 1,
    minWidth: 0,
  },

  partnerName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  partnerSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
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
    backgroundColor: theme.colors.emeraldSoft,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  primaryButtonText: {
    color: "#031007",
    fontSize: 15,
    fontWeight: "900",
  },

  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },

  secondaryButton: {
    flex: 1,
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
    textAlign: "center",
  },

  closeButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  closeText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
});
