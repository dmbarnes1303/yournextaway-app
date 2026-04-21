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
} from "@/src/features/tripDetail/helpers";

import type { TicketResolutionOption } from "@/src/services/ticketResolver";

type Props = {
  visible: boolean;
  matchLabel: string;
  subtitle?: string | null;
  strongOptions: TicketResolutionOption[];
  weakOptions: TicketResolutionOption[];
  onClose: () => void;
  onSelect: (option: TicketResolutionOption) => void;
  onCompareAll: () => void;
  onOpenOfficial?: (() => void) | null;
};

type DisplayOption = {
  option: TicketResolutionOption;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function priceLabel(option: TicketResolutionOption): string {
  const price = clean(option.priceText);
  return price || "View live price";
}

function providerTone(provider?: string | null) {
  const raw = clean(provider).toLowerCase();

  if (raw === "footballticketnet" || raw === "ftn") {
    return {
      borderColor: "rgba(120,170,255,0.30)",
      backgroundColor: "rgba(120,170,255,0.12)",
      textColor: "rgba(210,226,255,1)",
    };
  }

  if (raw === "sportsevents365" || raw === "se365") {
    return {
      borderColor: "rgba(87,162,56,0.30)",
      backgroundColor: "rgba(87,162,56,0.12)",
      textColor: "rgba(214,241,200,1)",
    };
  }

  return {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    textColor: theme.colors.text,
  };
}

function compareOptions(a: DisplayOption, b: DisplayOption): number {
  const aHasPrice = Boolean(clean(a.option.priceText));
  const bHasPrice = Boolean(clean(b.option.priceText));

  if (aHasPrice && !bHasPrice) return -1;
  if (!aHasPrice && bHasPrice) return 1;

  return clean(a.option.provider).localeCompare(clean(b.option.provider));
}

function OptionCard({
  option,
  onPress,
}: {
  option: TicketResolutionOption;
  onPress: () => void;
}) {
  const provider = providerLabel(option.provider);
  const short = providerShort(option.provider);
  const providerStyle = providerTone(option.provider);

  return (
    <Pressable style={styles.optionCard} onPress={onPress}>
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
            <Text
              style={[styles.providerPillText, { color: providerStyle.textColor }]}
            >
              {short}
            </Text>
          </View>

          <View style={styles.providerTextWrap}>
            <Text style={styles.provider}>{provider}</Text>
            <Text style={styles.providerSub}>Affiliate partner</Text>
          </View>
        </View>

        <Text style={styles.price}>{priceLabel(option)}</Text>
      </View>

      <View style={styles.optionBottomRow}>
        <Text style={styles.metaText}>
          {clean(option.title) || "Tickets"}
        </Text>

        <Text style={styles.cta}>View tickets →</Text>
      </View>
    </Pressable>
  );
}

export default function TicketOptionsSheet({
  visible,
  matchLabel,
  subtitle,
  strongOptions,
  weakOptions,
  onClose,
  onSelect,
  onCompareAll,
  onOpenOfficial,
}: Props) {
  const mergedOptions = useMemo(() => {
    const combined = [
      ...(Array.isArray(strongOptions) ? strongOptions : []),
      ...(Array.isArray(weakOptions) ? weakOptions : []),
    ];

    const seen = new Set<string>();
    const deduped = combined.filter((option) => {
      const key = `${clean(option.provider)}|${clean(option.url)}`;
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped
      .map((option) => ({ option }))
      .sort(compareOptions)
      .slice(0, 8);
  }, [strongOptions, weakOptions]);

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
            {clean(subtitle) || "Choose a ticket partner"}
          </Text>

          <ScrollView
            style={styles.optionsWrap}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {mergedOptions.map(({ option }, index) => (
              <OptionCard
                key={`${option.provider}-${option.url}-${index}`}
                option={option}
                onPress={() => onSelect(option)}
              />
            ))}
          </ScrollView>

          <View style={styles.footerActions}>
            <Pressable style={styles.secondaryBtn} onPress={onCompareAll}>
              <Text style={styles.secondaryBtnText}>Open full match view</Text>
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

  providerSub: {
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

  optionBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  metaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    flex: 1,
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
