import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";

import { theme } from "@/src/constants/theme";
import type { TicketResolutionOption } from "@/src/services/ticketResolver";

type Props = {
  visible: boolean;
  matchLabel: string;
  subtitle?: string | null;
  options: TicketResolutionOption[];
  onClose: () => void;
  onSelect: (option: TicketResolutionOption) => void;
  onCompareAll: () => void;
  onOpenOfficial?: (() => void) | null;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function providerLabel(value: unknown): string {
  return clean(value) || "Provider";
}

function priceLabel(value: unknown): string | null {
  const next = clean(value);
  return next || null;
}

function reasonLabel(option: TicketResolutionOption): string | null {
  if (option.reason === "exact_event" && option.exact) return "Exact match";
  if (option.reason === "partial_match") return "Closest match found";
  if (option.reason === "search_fallback") return "Search result";
  return null;
}

export default function TicketOptionsSheet({
  visible,
  matchLabel,
  subtitle,
  options,
  onClose,
  onSelect,
  onCompareAll,
  onOpenOfficial,
}: Props) {
  const topOptions = options.slice(0, 3);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title} numberOfLines={2}>
            {matchLabel}
          </Text>

          <Text style={styles.subtitle}>
            {clean(subtitle) || "Compare ticket providers"}
          </Text>

          <ScrollView
            style={styles.optionsWrap}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {topOptions.map((option, index) => {
              const price = priceLabel(option.priceText);
              const reason = reasonLabel(option);

              return (
                <Pressable
                  key={`${providerLabel(option.provider)}-${index}`}
                  style={styles.optionCard}
                  onPress={() => onSelect(option)}
                >
                  <View style={styles.optionTopRow}>
                    <View style={styles.providerWrap}>
                      <Text style={styles.provider}>
                        {providerLabel(option.provider)}
                      </Text>

                      {reason ? <Text style={styles.reason}>{reason}</Text> : null}
                    </View>

                    <View style={styles.priceWrap}>
                      <Text style={styles.price}>{price || "View options"}</Text>
                    </View>
                  </View>

                  <View style={styles.optionBottomRow}>
                    <Text style={styles.scoreText}>
                      {typeof option.score === "number"
                        ? `Match score ${Math.round(option.score)}`
                        : "Ticket option"}
                    </Text>

                    <Text style={styles.cta}>View tickets →</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footerActions}>
            <Pressable style={styles.secondaryBtn} onPress={onCompareAll}>
              <Text style={styles.secondaryBtnText}>Compare all options</Text>
            </Pressable>

            {onOpenOfficial ? (
              <Pressable style={styles.ghostBtn} onPress={onOpenOfficial}>
                <Text style={styles.ghostBtnText}>Official club site</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#0B1020",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: "78%",
  },

  handle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 14,
  },

  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },

  optionsWrap: {
    marginTop: 16,
    maxHeight: 340,
  },

  optionsContent: {
    gap: 10,
    paddingBottom: 6,
  },

  optionCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  optionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },

  providerWrap: {
    flex: 1,
  },

  provider: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
  },

  reason: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  priceWrap: {
    alignItems: "flex-end",
  },

  price: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.accent,
  },

  optionBottomRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },

  scoreText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },

  cta: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.text,
  },

  footerActions: {
    marginTop: 16,
    gap: 10,
  },

  secondaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
  },

  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0B1020",
  },

  ghostBtn: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 16,
  },

  ghostBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
  },

  closeBtn: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  closeBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.textMuted,
  },
});
