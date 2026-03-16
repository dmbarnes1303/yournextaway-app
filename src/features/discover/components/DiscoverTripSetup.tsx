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

import GlassCard from "@/src/components/GlassCard";
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
        <View style={styles.headerTextWrap}>
          <View style={styles.headerKickerRow}>
            <View style={styles.headerKickerPill}>
              <Ionicons
                name="options-outline"
                size={13}
                color={theme.colors.text}
              />
              <Text style={styles.headerKicker}>TRIP SETUP</Text>
            </View>

            <View style={styles.headerModePill}>
              <Text style={styles.headerModePillText}>{browseModeLabel}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Control what Discover prioritises</Text>
          <Text style={styles.sectionSub}>
            These filters directly shape which fixtures, cities and trip routes rank highest.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={onReset} style={({ pressed }) => [styles.resetPill, pressed && styles.pressed]}>
            <Ionicons name="refresh-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.resetPillText}>Reset</Text>
          </Pressable>

          <Pressable onPress={onToggleSetup} style={({ pressed }) => [styles.collapsePill, pressed && styles.pressed]}>
            <Ionicons
              name={setupExpanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={16}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
      </View>

      {!setupExpanded ? (
        <Pressable onPress={onToggleSetup} style={({ pressed }) => [pressed && styles.pressed]}>
          <GlassCard strength="default" style={styles.collapsedCard} noPadding>
            <View style={styles.collapsedInner}>
              <View style={styles.collapsedTopRow}>
                <View style={styles.collapsedTitleRow}>
                  <View style={styles.collapsedIconWrap}>
                    <Ionicons
                      name="sparkles-outline"
                      size={16}
                      color={theme.colors.text}
                    />
                  </View>

                  <View style={styles.collapsedTextWrap}>
                    <Text style={styles.collapsedTitle}>Current discovery setup</Text>
                    <Text style={styles.collapsedSub}>
                      Tap to refine your route intelligence
                    </Text>
                  </View>
                </View>

                <View style={styles.collapsedOpenPill}>
                  <Text style={styles.collapsedOpenPillText}>Open</Text>
                </View>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryBoxLabel}>Live summary</Text>
                <Text style={styles.summaryBoxText}>{filterSummary}</Text>
              </View>

              <View style={styles.collapsedChipRow}>
                <View style={styles.tinyChipStrong}>
                  <Text style={styles.tinyChipStrongText}>
                    {shortLabelForKey(discoverWindowKey)}
                  </Text>
                </View>

                <View style={styles.tinyChip}>
                  <Text style={styles.tinyChipText}>
                    {shortLabelForTripLength(discoverTripLength)}
                  </Text>
                </View>

                {discoverVibes.slice(0, 3).map((vibe) => (
                  <View key={vibe} style={styles.tinyChip}>
                    <Text style={styles.tinyChipText}>{shortLabelForVibe(vibe)}</Text>
                  </View>
                ))}

                {activeVibeCount === 0 ? (
                  <View style={styles.tinyChip}>
                    <Text style={styles.tinyChipText}>Any vibe</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </GlassCard>
        </Pressable>
      ) : (
        <GlassCard strength="default" style={styles.panel} noPadding>
          <View style={styles.panelInner}>
            <View style={styles.panelIntro}>
              <Text style={styles.panelIntroTitle}>Refine your football-trip profile</Text>
              <Text style={styles.panelIntroText}>
                Set your time window, trip shape and mood so Discover stops showing generic filler
                and starts surfacing the right routes.
              </Text>
            </View>

            <View style={styles.controlBlock}>
              <View style={styles.blockHeaderRow}>
                <Text style={styles.label}>Origin</Text>
                <Text style={styles.labelHint}>Optional</Text>
              </View>

              <View style={styles.inputWrap}>
                <View style={styles.inputIconWrap}>
                  <Ionicons
                    name="airplane-outline"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                </View>

                <TextInput
                  value={discoverOrigin}
                  onChangeText={setDiscoverOrigin}
                  placeholder="London, LGW, MAN, Birmingham..."
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.helperText}>
                Add a city or airport if you want lower-friction travel routes to rank better.
              </Text>
            </View>

            <View style={styles.controlBlock}>
              <View style={styles.blockHeaderRow}>
                <Text style={styles.label}>Date window</Text>
                <Text style={styles.labelHint}>How soon you want to go</Text>
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
              <View style={styles.blockHeaderRow}>
                <Text style={styles.label}>Trip length</Text>
                <Text style={styles.labelHint}>How much time you want to commit</Text>
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
              <View style={styles.blockHeaderRow}>
                <Text style={styles.label}>Trip vibe</Text>
                <Text style={styles.labelHint}>Pick up to 3</Text>
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

              <Text style={styles.helperText}>
                Mix filters deliberately. “Easy” and “Big” gives a different result than “Culture”
                and “Warm”.
              </Text>
            </View>

            <View style={styles.outputCard}>
              <View style={styles.outputTopRow}>
                <View style={styles.outputModePill}>
                  <Text style={styles.outputModePillText}>{browseModeLabel}</Text>
                </View>

                <View style={styles.outputCountPill}>
                  <Text style={styles.outputCountPillText}>
                    {activeVibeCount > 0 ? `${activeVibeCount} vibe${activeVibeCount > 1 ? "s" : ""}` : "No vibe lock"}
                  </Text>
                </View>
              </View>

              <Text style={styles.outputLabel}>Current discovery summary</Text>
              <Text style={styles.outputText}>{filterSummary}</Text>
            </View>
          </View>
        </GlassCard>
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

  headerTextWrap: {
    flex: 1,
    gap: 4,
  },

  headerKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  headerKickerPill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.12)" : "rgba(87,162,56,0.08)",
  },

  headerKicker: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.9,
  },

  headerModePill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
  },

  headerModePillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  resetPill: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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

  collapsedCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.14)",
  },

  collapsedInner: {
    padding: 14,
    gap: 12,
  },

  collapsedTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  collapsedTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },

  collapsedIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  collapsedTextWrap: {
    flex: 1,
    gap: 2,
  },

  collapsedTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  collapsedSub: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
  },

  collapsedOpenPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  collapsedOpenPillText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  summaryBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 5,
  },

  summaryBoxLabel: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  summaryBoxText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  collapsedChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tinyChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.04)",
  },

  tinyChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  tinyChipStrong: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  tinyChipStrongText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  panel: {
    borderRadius: 24,
    borderColor: "rgba(255,255,255,0.08)",
  },

  panelInner: {
    padding: 15,
    gap: 16,
  },

  panelIntro: {
    gap: 5,
  },

  panelIntroTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: theme.fontWeight.black,
  },

  panelIntroText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  controlBlock: {
    gap: 8,
  },

  blockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  label: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  labelHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  inputWrap: {
    minHeight: 54,
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

  inputIconWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },

  helperText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  outputCard: {
    marginTop: 2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },

  outputTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },

  outputModePill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  outputModePillText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  outputCountPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.04)",
  },

  outputCountPillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  outputLabel: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  outputText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
