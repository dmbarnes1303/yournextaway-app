import React from "react";
import { Pressable, View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";

type Props = {
  loading: boolean;
  filterSummary: string;
  onPress: () => void;
};

export default function DiscoverConciergeCard({
  loading,
  filterSummary,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.randomPress, (pressed || loading) && styles.pressed]}
    >
      <GlassCard strength="default" style={styles.randomCard} noPadding>
        <View style={styles.randomInner}>
          <View style={styles.randomTop}>
            <View style={styles.randomTopText}>
              <Text style={styles.randomTitle}>Let the app choose</Text>
              <Text style={styles.randomSub}>
                We rank a live pool against your setup before making the pick.
              </Text>
            </View>

            <View style={styles.randomIconWrap}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name="sparkles-outline" size={18} color={theme.colors.text} />
              )}
            </View>
          </View>

          <View style={styles.randomSummaryBox}>
            <Text style={styles.randomSummaryLabel}>Using</Text>
            <Text style={styles.randomHint}>{filterSummary}</Text>
          </View>

          <View style={styles.randomButton}>
            <Text style={styles.randomButtonText}>
              {loading ? "Finding a strong option..." : "Pick a trip for me"}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  randomPress: {
    borderRadius: 22,
    overflow: "hidden",
  },

  randomCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.16)",
  },

  randomInner: {
    padding: 16,
    gap: 14,
  },

  randomTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  randomTopText: {
    flex: 1,
    gap: 4,
  },

  randomTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  randomSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  randomIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  randomSummaryBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },

  randomSummaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  randomHint: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  randomButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  randomButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
