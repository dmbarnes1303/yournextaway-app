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
      borderColor: "rgba(120,170,255,0.35)",
      bg: "rgba(120,170,255,0.14)",
      text: "#DCE6FF",
    };
  }

  if (raw === "sportsevents365" || raw === "se365") {
    return {
      borderColor: "rgba(87,162,56,0.35)",
      bg: "rgba(87,162,56,0.14)",
      text: "#D9F2C8",
    };
  }

  return {
    borderColor: "rgba(255,255,255,0.14)",
    bg: "rgba(255,255,255,0.06)",
    text: theme.colors.text,
  };
}

function OptionCard({
  option,
  onPress,
  highlight,
}: {
  option: TicketResolutionOption;
  onPress: () => void;
  highlight?: boolean;
}) {
  const provider = providerLabel(option.provider);
  const short = providerShort(option.provider);
  const tone = providerTone(option.provider);

  return (
    <Pressable
      style={[
        styles.optionCard,
        highlight && styles.optionCardHighlight,
      ]}
      onPress={onPress}
    >
      {highlight && (
        <View style={styles.bestTag}>
          <Text style={styles.bestTagText}>Best option</Text>
        </View>
      )}

      <View style={styles.topRow}>
        <View style={styles.providerWrap}>
          <View
            style={[
              styles.providerPill,
              {
                borderColor: tone.borderColor,
                backgroundColor: tone.bg,
              },
            ]}
          >
            <Text style={[styles.providerPillText, { color: tone.text }]}>
              {short}
            </Text>
          </View>

          <View style={styles.providerText}>
            <Text style={styles.provider}>{provider}</Text>
            <Text style={styles.providerSub}>Secure via partner</Text>
          </View>
        </View>

        <Text style={styles.price}>{priceLabel(option)}</Text>
      </View>

      <Text style={styles.meta} numberOfLines={1}>
        {clean(option.title) || "Match tickets"}
      </Text>

      <View style={styles.ctaRow}>
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
  const { primary, rest } = useMemo(() => {
    const strong = Array.isArray(strongOptions) ? strongOptions : [];
    const weak = Array.isArray(weakOptions) ? weakOptions : [];

    const combined = [...strong, ...weak];

    const seen = new Set<string>();
    const deduped = combined.filter((o) => {
      const key = `${clean(o.provider)}|${clean(o.url)}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const sorted = deduped.sort((a, b) => {
      const aPrice = clean(a.priceText);
      const bPrice = clean(b.priceText);

      if (aPrice && !bPrice) return -1;
      if (!aPrice && bPrice) return 1;

      return clean(a.provider).localeCompare(clean(b.provider));
    });

    return {
      primary: sorted[0] || null,
      rest: sorted.slice(1, 6),
    };
  }, [strongOptions, weakOptions]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>{matchLabel}</Text>

          <Text style={styles.subtitle}>
            {clean(subtitle) || "Choose where to get tickets"}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {primary && (
              <OptionCard
                option={primary}
                onPress={() => onSelect(primary)}
                highlight
              />
            )}

            {rest.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>More options</Text>

                {rest.map((option, i) => (
                  <OptionCard
                    key={`${option.provider}-${option.url}-${i}`}
                    option={option}
                    onPress={() => onSelect(option)}
                  />
                ))}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.primaryBtn} onPress={onCompareAll}>
              <Text style={styles.primaryBtnText}>Compare all ticket routes</Text>
            </Pressable>

            {onOpenOfficial && (
              <Pressable style={styles.secondaryBtn} onPress={onOpenOfficial}>
                <Text style={styles.secondaryBtnText}>Official club site</Text>
              </Pressable>
            )}

            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
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
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#0B1020",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: "82%",
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

  scroll: {
    marginTop: 16,
  },

  scrollContent: {
    gap: 12,
    paddingBottom: 6,
  },

  sectionLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "900",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
  },

  optionCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 10,
  },

  optionCardHighlight: {
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },

  bestTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,255,136,0.18)",
    marginBottom: 4,
  },

  bestTagText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#9CFFB8",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  providerWrap: {
    flexDirection: "row",
    gap: 10,
    flex: 1,
  },

  providerPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  providerPillText: {
    fontSize: 11,
    fontWeight: "900",
  },

  providerText: {
    flex: 1,
  },

  provider: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
  },

  providerSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  price: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.accent,
  },

  meta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  ctaRow: {
    alignItems: "flex-end",
  },

  cta: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.text,
  },

  footer: {
    marginTop: 16,
    gap: 10,
  },

  primaryBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryBtnText: {
    fontWeight: "900",
    color: "#000",
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  secondaryBtnText: {
    color: theme.colors.text,
    fontWeight: "800",
  },

  closeText: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontWeight: "800",
    marginTop: 6,
  },
});
