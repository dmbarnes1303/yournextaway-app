// src/features/discover/components/DiscoverTripSetup.tsx

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

import { theme } from "@/src/constants/theme";
import type {
  DiscoverTripLength,
  DiscoverVibe,
} from "@/src/features/discover/discoverEngine";
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

const WINDOW_KEYS: DiscoverWindowKey[] = ["wknd", "d7", "d14", "d30", "d60", "d90"];
const TRIP_LENGTHS: DiscoverTripLength[] = ["day", "1", "2", "3"];
const VIBES: DiscoverVibe[] = ["easy", "big", "nightlife", "culture", "warm"];

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
  const activeVibeCount = discoverVibes.length;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Trip setup</Text>
          <Text style={styles.title}>Shape your Discover feed</Text>
          <Text style={styles.subtitle}>
            Tell the app what kind of football break you want. Discover will rank fixtures around it.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={onReset}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="refresh-outline" size={16} color={theme.colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={onToggleSetup}
            style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Text style={styles.openButtonText}>{setupExpanded ? "Done" : "Edit"}</Text>
          </Pressable>
        </View>
      </View>

      {!setupExpanded ? (
        <Pressable
          onPress={onToggleSetup}
          style={({ pressed }) => [styles.collapsedCard, pressed && styles.pressed]}
        >
          <View style={styles.collapsedTop}>
            <View style={styles.brandIcon}>
              <Ionicons name="sparkles-outline" size={17} color="#A3E635" />
            </View>

            <View style={styles.collapsedCopy}>
              <Text style={styles.collapsedTitle}>{browseModeLabel}</Text>
              <Text style={styles.collapsedSummary} numberOfLines={2}>
                {filterSummary}
              </Text>
            </View>

            <Ionicons name="chevron-forward-outline" size={18} color={theme.colors.textSecondary} />
          </View>

          <View style={styles.summaryChips}>
            <View style={styles.summaryChipStrong}>
              <Text style={styles.summaryChipStrongText}>{shortLabelForKey(discoverWindowKey)}</Text>
            </View>

            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipText}>
                {shortLabelForTripLength(discoverTripLength)}
              </Text>
            </View>

            {discoverVibes.slice(0, 3).map((vibe) => (
              <View key={vibe} style={styles.summaryChip}>
                <Text style={styles.summaryChipText}>{shortLabelForVibe(vibe)}</Text>
              </View>
            ))}

            {activeVibeCount === 0 ? (
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipText}>Any vibe</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      ) : (
        <View style={styles.expandedCard}>
          <View style={styles.priorityCard}>
            <View style={styles.priorityTop}>
              <View>
                <Text style={styles.priorityLabel}>Current priority</Text>
                <Text style={styles.priorityTitle}>{browseModeLabel}</Text>
              </View>

              <View style={styles.vibeCountPill}>
                <Text style={styles.vibeCountText}>
                  {activeVibeCount > 0
                    ? `${activeVibeCount} vibe${activeVibeCount > 1 ? "s" : ""}`
                    : "Flexible"}
                </Text>
              </View>
            </View>

            <Text style={styles.priorityText}>{filterSummary}</Text>
          </View>

          <View style={styles.controlBlock}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlTitle}>When?</Text>
              <Text style={styles.controlHint}>Pick the live fixture window</Text>
            </View>

            <View style={styles.chipsRow}>
              {WINDOW_KEYS.map((key) => (
                <DiscoverFilterChip
                  key={key}
                  label={shortLabelForKey(key)}
                  active={discoverWindowKey === key}
                  onPress={() => setDiscoverWindowKey(key)}
                />
              ))}
            </View>
          </View>

          <View style={styles.controlBlock}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlTitle}>How long?</Text>
              <Text style={styles.controlHint}>Day trip or proper break</Text>
            </View>

            <View style={styles.chipsRow}>
              {TRIP_LENGTHS.map((length) => (
                <DiscoverFilterChip
                  key={length}
                  label={labelForTripLength(length)}
                  active={discoverTripLength === length}
                  onPress={() => setDiscoverTripLength(length)}
                />
              ))}
            </View>
          </View>

          <View style={styles.controlBlock}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlTitle}>What kind of trip?</Text>
              <Text style={styles.controlHint}>Choose the mood</Text>
            </View>

            <View style={styles.chipsRow}>
              {VIBES.map((vibe) => (
                <DiscoverFilterChip
                  key={vibe}
                  label={labelForVibe(vibe)}
                  active={discoverVibes.includes(vibe)}
                  onPress={() => onToggleVibe(vibe)}
                />
              ))}
            </View>
          </View>

          <View style={styles.originBlock}>
            <View style={styles.originHeader}>
              <Ionicons name="airplane-outline" size={15} color={theme.colors.textTertiary} />
              <Text style={styles.originLabel}>Origin</Text>
              <Text style={styles.optionalText}>Optional</Text>
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                value={discoverOrigin}
                onChangeText={setDiscoverOrigin}
                placeholder="London, Manchester, Gatwick..."
                placeholderTextColor="rgba(240,245,242,0.40)"
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.helperText}>
              Add this later if travel friction matters. Don’t over-filter too early.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  headerText: {
    flex: 1,
    gap: 4,
  },

  eyebrow: {
    color: "#A3E635",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  title: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.25,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "96%",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.05)",
  },

  openButton: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.24)",
    backgroundColor: "rgba(18,103,49,0.28)",
  },

  openButtonText: {
    color: "#A3E635",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  collapsedCard: {
    borderRadius: 24,
    padding: 15,
    gap: 13,
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.16)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(12,18,15,0.86)" : "rgba(255,255,255,0.06)",
  },

  collapsedTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.22)",
    backgroundColor: "rgba(163,230,53,0.10)",
  },

  collapsedCopy: {
    flex: 1,
    gap: 3,
  },

  collapsedTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: theme.fontWeight.black,
  },

  collapsedSummary: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  summaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  summaryChip: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  summaryChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  summaryChipStrong: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.24)",
    backgroundColor: "rgba(163,230,53,0.10)",
  },

  summaryChipStrongText: {
    color: "#BEF264",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  expandedCard: {
    borderRadius: 26,
    padding: 15,
    gap: 17,
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.14)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,16,13,0.90)" : "rgba(255,255,255,0.055)",
  },

  priorityCard: {
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.18)",
    backgroundColor: "rgba(18,103,49,0.18)",
  },

  priorityTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  priorityLabel: {
    color: "#A3E635",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  priorityTitle: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },

  priorityText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  vibeCountPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
  },

  vibeCountText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  controlBlock: {
    gap: 9,
  },

  controlHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },

  controlTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: theme.fontWeight.black,
  },

  controlHint: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  originBlock: {
    gap: 8,
    paddingTop: 2,
  },

  originHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  originLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  optionalText: {
    marginLeft: "auto",
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  inputWrap: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.05)",
  },

  input: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
  },

  helperText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
