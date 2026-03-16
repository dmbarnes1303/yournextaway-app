// src/features/discover/components/DiscoverConciergeCard.tsx

import React from "react";
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
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
      style={({ pressed }) => [styles.cardPress, (pressed || loading) && styles.pressed]}
    >
      <GlassCard strength="strong" style={styles.card} noPadding>
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <View style={styles.copyWrap}>
              <Text style={styles.kicker}>CONCIERGE PICK</Text>
              <Text style={styles.title}>Let the app choose your best live route</Text>
              <Text style={styles.sub}>
                This is not random filler. The app scores the live pool against your current setup
                and surfaces one of the strongest real options.
              </Text>
            </View>

            <View style={styles.iconWrap}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name="sparkles-outline" size={18} color={theme.colors.text} />
              )}
            </View>
          </View>

          <View style={styles.signalRow}>
            <View style={styles.signalPillStrong}>
              <Text style={styles.signalPillStrongText}>Live-ranked</Text>
            </View>

            <View style={styles.signalPill}>
              <Text style={styles.signalPillText}>Setup-aware</Text>
            </View>

            <View style={styles.signalPill}>
              <Text style={styles.signalPillText}>Trip-first</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Using your current setup</Text>
            <Text style={styles.summaryText}>{filterSummary}</Text>
          </View>

          <View style={styles.whyBox}>
            <View style={styles.whyRow}>
              <View style={styles.whyIconWrap}>
                <Ionicons name="options-outline" size={14} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.whyText}>
                Better when you want one strong answer instead of scrolling endless routes.
              </Text>
            </View>

            <View style={styles.whyRow}>
              <View style={styles.whyIconWrap}>
                <Ionicons name="pulse-outline" size={14} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.whyText}>
                Pulls from the live fixture pool, then applies your current trip logic before
                choosing.
              </Text>
            </View>
          </View>

          <View style={styles.ctaRow}>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>
                {loading ? "Finding a strong live route…" : "Pick my route"}
              </Text>
              <Text style={styles.ctaSub}>
                {loading
                  ? "Scoring live options now"
                  : "Open a stronger live option matched to this setup"}
              </Text>
            </View>

            <View style={[styles.ctaArrowWrap, loading && styles.ctaArrowWrapLoading]}>
              {loading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="arrow-forward-outline" size={16} color={theme.colors.text} />
              )}
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPress: {
    borderRadius: 22,
    overflow: "hidden",
  },

  card: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.16)",
  },

  inner: {
    padding: 16,
    gap: 14,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  copyWrap: {
    flex: 1,
    gap: 4,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1,
  },

  title: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: theme.fontWeight.black,
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  signalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  signalPillStrong: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  signalPillStrongText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  signalPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
  },

  signalPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },

  summaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  summaryText: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  whyBox: {
    gap: 8,
  },

  whyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  whyIconWrap: {
    width: 22,
    alignItems: "center",
    paddingTop: 1,
  },

  whyText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  ctaRow: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.26)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  ctaTextWrap: {
    flex: 1,
    gap: 2,
  },

  ctaTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  ctaSub: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  ctaArrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  ctaArrowWrapLoading: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.03)",
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
