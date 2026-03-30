import React, { useMemo } from "react";
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

type TicketStrength = "strong" | "medium" | "weak";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function reasonLabel(option: TicketResolutionOption): string | null {
  if (option.reason === "exact_event" && option.exact) return "Exact fixture";
  if (option.reason === "partial_match") return "Related listing";
  if (option.reason === "search_fallback") return "Fallback search";
  return null;
}

function strengthLabel(strength: TicketStrength): string {
  if (strength === "strong") return "Best match";
  if (strength === "medium") return "Good option";
  return "Weak fallback";
}

function ctaLabel(strength: TicketStrength): string {
  if (strength === "strong") return "View tickets →";
  if (strength === "medium") return "View options →";
  return "Search carefully →";
}

function priceLabel(
  option: TicketResolutionOption,
  strength: TicketStrength
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

function providerTone(provider?: string | null) {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketsnet") {
    return {
      borderColor: "rgba(120,170,255,0.30)",
      backgroundColor: "rgba(120,170,255,0.12)",
      textColor: "rgba(210,226,255,1)",
    };
  }

  if (raw === "sportsevents365") {
    return {
      borderColor: "rgba(87,162,56,0.30)",
      backgroundColor: "rgba(87,162,56,0.12)",
      textColor: "rgba(214,241,200,1)",
    };
  }

  if (raw === "stubhub") {
    return {
      borderColor: "rgba(181,126,255,0.30)",
      backgroundColor: "rgba(181,126,255,0.12)",
      textColor: "rgba(231,214,255,1)",
    };
  }

  if (raw === "gigsberg") {
    return {
      borderColor: "rgba(255,200,80,0.30)",
      backgroundColor: "rgba(255,200,80,0.12)",
      textColor: "rgba(255,228,165,1)",
    };
  }

  return {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    textColor: theme.colors.text,
  };
}

function OptionCard({
  option,
  strength,
  onPress,
}: {
  option: TicketResolutionOption;
  strength: TicketStrength;
  onPress: () => void;
}) {
  const provider = providerLabel(option.provider);
  const short = providerShort(option.provider);
  const reason = reasonLabel(option);
  const providerStyle = providerTone(option.provider);

  return (
    <Pressable
      style={[
        styles.optionCard,
        strength === "strong" && styles.strongCard,
        strength === "medium" && styles.mediumCard,
        strength === "weak" && styles.weakCard,
      ]}
      onPress={onPress}
    >
      <View style={styles.optionTopRow}>
        <View style={styles.providerBlock}>
          <View
            style={[
              styles.providerPill,
              {
                borderColor: providerStyle.borderColor,
                backgroundColor: providerStyle.backgroundColor,
              },
            ]}
          >
            <Text style={[styles.providerPillText, { color: providerStyle.textColor }]}>
              {short}
            </Text>
          </View>

          <View style={styles.providerTextWrap}>
            <Text style={styles.provider}>{provider}</Text>
            {reason ? <Text style={styles.reason}>{reason}</Text> : null}
          </View>
        </View>

        <Text
          style={[
            styles.price,
            strength === "weak" && styles.priceWeak,
          ]}
        >
          {priceLabel(option, strength)}
        </Text>
      </View>

      <View style={styles.optionBottomRow}>
        <Text
          style={[
            styles.scoreText,
            strength === "weak" && styles.scoreTextWeak,
          ]}
        >
          {strengthLabel(strength)}
        </Text>

        <Text style={styles.cta}>{ctaLabel(strength)}</Text>
      </View>

      {strength === "weak" ? (
        <Text style={styles.warningText}>
          Fallback route only. Verify the exact fixture on the partner page.
        </Text>
      ) : null}
    </Pressable>
  );
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
  const { strongOptions, mediumOptions, weakOptions, visibleOptions } = useMemo(() => {
    const strong: TicketResolutionOption[] = [];
    const medium: TicketResolutionOption[] = [];
    const weak: TicketResolutionOption[] = [];

    for (const option of options) {
      const strength = classifyTicketOption(option);
      if (strength === "strong") strong.push(option);
      else if (strength === "medium") medium.push(option);
      else weak.push(option);
    }

    const merged = [...strong, ...medium, ...weak].slice(0, 5);

    return {
      strongOptions: strong,
      mediumOptions: medium,
      weakOptions: weak,
      visibleOptions: merged,
    };
  }, [options]);

  const hasBetterRoutes = strongOptions.length > 0 || mediumOptions.length > 0;
  const weakOnly = !hasBetterRoutes && weakOptions.length > 0;

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

          {weakOnly ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>Only fallback routes found</Text>
              <Text style={styles.noticeText}>
                These options may still help, but they are weaker than a direct event or strong listing route.
              </Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.optionsWrap}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {visibleOptions.map((option, index) => {
              const strength = classifyTicketOption(option);

              return (
                <OptionCard
                  key={`${option.provider}-${option.url}-${index}`}
                  option={option}
                  strength={strength}
                  onPress={() => onSelect(option)}
                />
              );
            })}
          </ScrollView>

          <View style={styles.footerActions}>
            <Pressable style={styles.secondaryBtn} onPress={onCompareAll}>
              <Text style={styles.secondaryBtnText}>
                Compare all options
              </Text>
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  noticeBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.22)",
    backgroundColor: "rgba(255,200,80,0.08)",
    gap: 4,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: theme.colors.text,
  },

  noticeText: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  optionsWrap: {
    marginTop: 16,
    maxHeight: 360,
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
    gap: 10,
  },

  strongCard: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  mediumCard: {
    borderColor: "rgba(120,170,255,0.18)",
  },

  weakCard: {
    borderColor: "rgba(255,200,80,0.18)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  optionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  providerBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },

  providerPill: {
    minWidth: 38,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  providerPillText: {
    fontSize: 11,
    fontWeight: "900",
  },

  providerTextWrap: {
    flex: 1,
  },

  provider: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
  },

  reason: {
    marginTop: 3,
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  price: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.accent,
    textAlign: "right",
  },

  priceWeak: {
    color: theme.colors.textSecondary,
  },

  optionBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  scoreText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    flex: 1,
  },

  scoreTextWeak: {
    color: "rgba(255,215,140,1)",
  },

  cta: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.text,
  },

  warningText: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,215,140,1)",
    fontWeight: "700",
  },

  footerActions: {
    marginTop: 16,
    gap: 10,
  },

  secondaryBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryBtnText: {
    fontWeight: "900",
    color: "#000",
    fontSize: 14,
  },

  ghostBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 16,
  },

  ghostBtnText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },

  closeBtn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },

  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
});
