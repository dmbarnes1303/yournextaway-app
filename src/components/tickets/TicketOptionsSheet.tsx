import React, { useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "@/src/constants/theme";
import {
  providerLabel,
  providerShort,
} from "@/src/features/tripDetail/helpers";
import {
  getPartnerLogoUrl,
  getPartnerOrNull,
} from "@/src/constants/partners";

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

const APP_GREEN = theme.colors.primary;
const APP_GREEN_SOFT = "rgba(34,197,94,0.18)";
const APP_GREEN_BORDER = "rgba(34,197,94,0.38)";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function priceLabel(option: TicketResolutionOption): string {
  return clean(option.priceText) || "View live price";
}

function resolveProvider(input?: string | null) {
  const partner = getPartnerOrNull(input);
  return {
    name: clean(partner?.display?.name) || providerLabel(input),
    short: clean(partner?.display?.badgeText) || providerShort(input),
    logoUrl: getPartnerLogoUrl(input),
  };
}

function ProviderLogo({
  logoUrl,
  fallback,
}: {
  logoUrl?: string | null;
  fallback: string;
}) {
  if (logoUrl) {
    return (
      <View style={styles.providerLogoWrap}>
        <Image source={{ uri: logoUrl }} style={styles.providerLogo} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={styles.providerFallback}>
      <Text style={styles.providerFallbackText}>{fallback}</Text>
    </View>
  );
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
  const provider = resolveProvider(option.provider);

  return (
    <View style={[styles.optionCard, highlight && styles.optionCardHighlight]}>
      {highlight ? (
        <View style={styles.bestTag}>
          <Text style={styles.bestTagText}>Best route</Text>
        </View>
      ) : null}

      <View style={styles.optionTopRow}>
        <View style={styles.providerRow}>
          <ProviderLogo logoUrl={provider.logoUrl} fallback={provider.short} />

          <View style={styles.providerCopy}>
            <Text style={styles.providerName} numberOfLines={1}>
              {provider.name}
            </Text>
            <Text style={styles.providerSub} numberOfLines={1}>
              Partner ticket route
            </Text>
          </View>
        </View>

        <Text style={styles.priceText} numberOfLines={1}>
          {priceLabel(option)}
        </Text>
      </View>

      <Text style={styles.ticketTitle} numberOfLines={2}>
        {clean(option.title) || "Match tickets"}
      </Text>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.ticketButton, pressed && styles.pressed]}
      >
        <Text style={styles.ticketButtonText}>View tickets</Text>
        <Text style={styles.ticketButtonArrow}>→</Text>
      </Pressable>

      <Text style={styles.partnerNote}>Opens partner site</Text>
    </View>
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
  const { primary, rest, total } = useMemo(() => {
    const strong = Array.isArray(strongOptions) ? strongOptions : [];
    const weak = Array.isArray(weakOptions) ? weakOptions : [];

    const combined = [...strong, ...weak];

    const seen = new Set<string>();
    const deduped = combined.filter((option) => {
      const key = `${clean(option.provider).toLowerCase()}|${clean(option.url)}`;
      if (!clean(option.provider) || !clean(option.url) || seen.has(key)) return false;
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
      total: sorted.length,
    };
  }, [strongOptions, weakOptions]);

  const subtitleText =
    clean(subtitle) || (total > 1 ? "Best ticket routes first" : "Ticket route found");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.eyebrow}>Ticket options</Text>
            <Text style={styles.title} numberOfLines={2}>
              {matchLabel}
            </Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {primary ? (
              <OptionCard option={primary} onPress={() => onSelect(primary)} highlight />
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No ticket routes found</Text>
                <Text style={styles.emptyText}>
                  Try the match details page or check again later.
                </Text>
              </View>
            )}

            {rest.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>More routes</Text>

                {rest.map((option, index) => (
                  <OptionCard
                    key={`${option.provider}-${option.url}-${index}`}
                    option={option}
                    onPress={() => onSelect(option)}
                  />
                ))}
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.compareButton, pressed && styles.pressed]}
              onPress={onCompareAll}
            >
              <Text style={styles.compareButtonText}>Compare all ticket routes</Text>
            </Pressable>

            {onOpenOfficial ? (
              <Pressable
                style={({ pressed }) => [styles.officialButton, pressed && styles.pressed]}
                onPress={onOpenOfficial}
              >
                <Text style={styles.officialButtonText}>Official club site</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onClose}
            >
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
    backgroundColor: "rgba(0,0,0,0.70)",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  sheet: {
    maxHeight: "84%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "rgba(7,12,12,0.98)",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },

  handle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 16,
  },

  header: {
    gap: 6,
  },

  eyebrow: {
    color: APP_GREEN,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.55,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },

  scroll: {
    marginTop: 18,
  },

  scrollContent: {
    gap: 12,
    paddingBottom: 6,
  },

  sectionLabel: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },

  optionCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },

  optionCardHighlight: {
    borderColor: APP_GREEN_BORDER,
    backgroundColor: "rgba(34,197,94,0.07)",
  },

  bestTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: APP_GREEN_SOFT,
    borderWidth: 1,
    borderColor: APP_GREEN_BORDER,
  },

  bestTagText: {
    color: APP_GREEN,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  optionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  providerRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  providerLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },

  providerLogo: {
    width: 44,
    height: 44,
  },

  providerFallback: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APP_GREEN_SOFT,
    borderWidth: 1,
    borderColor: APP_GREEN_BORDER,
  },

  providerFallbackText: {
    color: APP_GREEN,
    fontSize: 12,
    fontWeight: "900",
  },

  providerCopy: {
    flex: 1,
    minWidth: 0,
  },

  providerName: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.25,
  },

  providerSub: {
    marginTop: 3,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },

  priceText: {
    maxWidth: 126,
    color: APP_GREEN,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },

  ticketTitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  ticketButton: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: APP_GREEN,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  ticketButtonText: {
    color: "#031007",
    fontSize: 15,
    fontWeight: "900",
  },

  ticketButtonArrow: {
    color: "#031007",
    fontSize: 18,
    fontWeight: "900",
    marginTop: -1,
  },

  partnerNote: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  footer: {
    marginTop: 16,
    gap: 10,
  },

  compareButton: {
    minHeight: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: APP_GREEN_BORDER,
  },

  compareButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  officialButton: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  officialButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "900",
  },

  closeButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
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
