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
import {
  providerLabel,
  providerShort,
  classifyTicketOption,
} from "@/src/features/tripDetail/helpers";

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

function reasonLabel(option: TicketResolutionOption): string | null {
  if (option.reason === "exact_event" && option.exact) return "Exact fixture";
  if (option.reason === "partial_match") return "Similar listing";
  if (option.reason === "search_fallback") return "Search result";
  return null;
}

function ctaLabel(strength: "strong" | "medium" | "weak") {
  if (strength === "strong") return "View tickets →";
  if (strength === "medium") return "View options →";
  return "Search tickets →";
}

function priceLabel(
  option: TicketResolutionOption,
  strength: "strong" | "medium" | "weak"
): string {
  const price = clean(option.priceText);

  if (strength === "strong") {
    return price || "View prices";
  }

  if (strength === "medium") {
    return price || "Check options";
  }

  return "Check availability";
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
              const strength = classifyTicketOption(option);
              const reason = reasonLabel(option);

              return (
                <Pressable
                  key={`${option.provider}-${index}`}
                  style={[
                    styles.optionCard,
                    strength === "strong" && styles.strongCard,
                    strength === "weak" && styles.weakCard,
                  ]}
                  onPress={() => onSelect(option)}
                >
                  <View style={styles.optionTopRow}>
                    <View style={styles.providerWrap}>
                      <Text style={styles.provider}>
                        {providerLabel(option.provider)}
                      </Text>

                      {reason ? (
                        <Text style={styles.reason}>{reason}</Text>
                      ) : null}
                    </View>

                    <Text style={styles.price}>
                      {priceLabel(option, strength)}
                    </Text>
                  </View>

                  <View style={styles.optionBottomRow}>
                    <Text style={styles.scoreText}>
                      {strength === "strong"
                        ? "Best match"
                        : strength === "medium"
                        ? "Good option"
                        : "May not match exactly"}
                    </Text>

                    <Text style={styles.cta}>
                      {ctaLabel(strength)}
                    </Text>
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
    padding: 18,
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
    fontWeight: "900",
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  optionsWrap: {
    marginTop: 16,
  },
  optionsContent: {
    gap: 10,
  },
  optionCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  strongCard: {
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  weakCard: {
    opacity: 0.65,
  },
  optionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  provider: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
  },
  reason: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  price: {
    fontWeight: "900",
    color: theme.colors.accent,
  },
  optionBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontWeight: "900",
    color: "#000",
  },
  ghostBtn: {
    padding: 12,
    alignItems: "center",
  },
  ghostBtnText: {
    color: theme.colors.text,
  },
  closeBtn: {
    alignItems: "center",
  },
  closeBtnText: {
    color: theme.colors.textMuted,
  },
});
