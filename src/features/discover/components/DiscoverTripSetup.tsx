import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import type { DiscoverTripLength, DiscoverVibe } from "@/src/features/discover/discoverEngine";
import type { DiscoverWindowKey } from "@/src/features/discover/types";
import DiscoverFilterChip from "./DiscoverFilterChip";
import {
  labelForTripLength,
  labelForVibe,
  shortLabelForKey,
  shortLabelForTripLength,
  shortLabelForVibe,
} from "@/src/features/discover/discoverUtils";

type Props = {
  setupExpanded: boolean;
  onToggleSetup: () => void;
  onReset: () => void;
  browseModeLabel: string;
  filterSummary: string;
  discoverOrigin: string;
  setDiscoverOrigin: (value: string) => void;
  discoverWindowKey: DiscoverWindowKey;
  setDiscoverWindowKey: (value: DiscoverWindowKey) => void;
  discoverTripLength: DiscoverTripLength;
  setDiscoverTripLength: (value: DiscoverTripLength) => void;
  discoverVibes: DiscoverVibe[];
  onToggleVibe: (value: DiscoverVibe) => void;
};

export default function DiscoverTripSetup({
  setupExpanded,
  onToggleSetup,
  onReset,
  browseModeLabel,
  filterSummary,
  discoverOrigin,
  setDiscoverOrigin,
  discoverWindowKey,
  setDiscoverWindowKey,
  discoverTripLength,
  setDiscoverTripLength,
  discoverVibes,
  onToggleVibe,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Trip setup</Text>
          <Text style={styles.sectionSub}>
            Edit your setup here, then let discovery rank the right routes.
          </Text>
        </View>

        <View style={styles.setupHeaderActions}>
          <Pressable onPress={onReset} style={styles.resetPill}>
            <Text style={styles.resetPillText}>Reset</Text>
          </Pressable>

          <Pressable onPress={onToggleSetup} style={styles.collapsePill}>
            <Ionicons
              name={setupExpanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={16}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      {!setupExpanded ? (
        <Pressable onPress={onToggleSetup}>
          <GlassCard strength="default" style={styles.setupCollapsedCard} noPadding>
            <View style={styles.setupCollapsedInner}>
              <View style={styles.setupCollapsedTop}>
                <View style={styles.setupCollapsedBadge}>
                  <Text style={styles.setupCollapsedBadgeText}>{browseModeLabel}</Text>
                </View>
                <Text style={styles.setupCollapsedLink}>Open</Text>
              </View>

              <Text style={styles.setupCollapsedSummary}>{filterSummary}</Text>

              <View style={styles.setupCollapsedChips}>
                <View style={styles.setupTinyChip}>
                  <Text style={styles.setupTinyChipText}>
                    {shortLabelForKey(discoverWindowKey)}
                  </Text>
                </View>
                <View style={styles.setupTinyChip}>
                  <Text style={styles.setupTinyChipText}>
                    {shortLabelForTripLength(discoverTripLength)}
                  </Text>
                </View>
                {discoverVibes.slice(0, 2).map((vibe) => (
                  <View key={vibe} style={styles.setupTinyChip}>
                    <Text style={styles.setupTinyChipText}>{shortLabelForVibe(vibe)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>
        </Pressable>
      ) : (
        <GlassCard strength="default" style={styles.panel} noPadding>
          <View style={styles.panelInner}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Flying from</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="airplane-outline"
                  size={16}
                  color={theme.colors.textTertiary}
                />
                <TextInput
                  value={discoverOrigin}
                  onChangeText={setDiscoverOrigin}
                  placeholder="Optional: London, LGW, MAN"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.label}>Date window</Text>
              <View style={styles.chipsRow}>
                {(["wknd", "d7", "d14", "d30", "d60", "d90"] as DiscoverWindowKey[]).map(
                  (key) => (
                    <DiscoverFilterChip
                      key={key}
                      label={shortLabelForKey(key)}
                      active={discoverWindowKey === key}
                      onPress={() => setDiscoverWindowKey(key)}
                    />
                  )
                )}
              </View>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.label}>Trip length</Text>
              <View style={styles.chipsRow}>
                {(["day", "1", "2", "3"] as DiscoverTripLength[]).map((length) => (
                  <DiscoverFilterChip
                    key={length}
                    label={labelForTripLength(length)}
                    active={discoverTripLength === length}
                    onPress={() => setDiscoverTripLength(length)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterBlock}>
              <View style={styles.inlineLabelRow}>
                <Text style={styles.label}>Vibe</Text>
                <Text style={styles.labelHint}>Pick up to 3</Text>
              </View>

              <View style={styles.chipsRow}>
                {(["easy", "big", "nightlife", "culture", "warm"] as DiscoverVibe[]).map(
                  (vibe) => (
                    <DiscoverFilterChip
                      key={vibe}
                      label={labelForVibe(vibe)}
                      active={discoverVibes.includes(vibe)}
                      onPress={() => onToggleVibe(vibe)}
                    />
                  )
                )}
              </View>
            </View>

            <View style={styles.setupSummaryRow}>
              <View style={styles.setupSummaryPill}>
                <Text style={styles.setupSummaryPillText}>{browseModeLabel}</Text>
              </View>
              <Text style={styles.setupSummaryText}>{filterSummary}</Text>
            </View>
          </View>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionHeaderText: {
    flex: 1,
    gap: 3,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: theme.fontWeight.black,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  setupHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  resetPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
  },

  resetPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  collapsePill: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
  },

  panel: {
    borderRadius: 22,
  },

  panelInner: {
    padding: 14,
    gap: 14,
  },

  setupCollapsedCard: {
    borderRadius: 20,
    borderColor: "rgba(87,162,56,0.12)",
  },

  setupCollapsedInner: {
    padding: 14,
    gap: 10,
  },

  setupCollapsedTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  setupCollapsedBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  setupCollapsedBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedSummary: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  setupCollapsedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  setupTinyChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  setupTinyChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  inputBlock: {
    gap: 7,
  },

  filterBlock: {
    gap: 8,
  },

  label: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  inlineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  labelHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  setupSummaryRow: {
    gap: 8,
    marginTop: 2,
  },

  setupSummaryPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  setupSummaryPillText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  setupSummaryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },
});
