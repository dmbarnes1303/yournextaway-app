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
      style={({ pressed }) => [
        styles.cardPress,
        (pressed || loading) && styles.pressed,
      ]}
    >
      <GlassCard strength="strong" style={styles.card} noPadding>
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <View style={styles.copyWrap}>
              <View style={styles.kickerPill}>
                <Ionicons name="sparkles-outline" size={13} color="#F5CC57" />
                <Text style={styles.kicker}>CONCIERGE PICK</Text>
              </View>

              <Text style={styles.title}>Let YourNextAway choose the route</Text>

              <Text style={styles.sub}>
                One stronger live option, ranked against your setup — not endless scrolling.
              </Text>
            </View>

            <View style={styles.iconWrap}>
              {loading ? (
                <ActivityIndicator color="#F5CC57" />
              ) : (
                <Ionicons name="compass-outline" size={21} color="#F5CC57" />
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
            <Text style={styles.summaryLabel}>Using your setup</Text>
            <Text style={styles.summaryText}>{filterSummary}</Text>
          </View>

          <View style={styles.reasonBox}>
            <View style={styles.reasonRow}>
              <Ionicons name="options-outline" size={15} color="#8EF2A5" />
              <Text style={styles.reasonText}>
                Applies your date window, trip length and vibe before choosing.
              </Text>
            </View>

            <View style={styles.reasonRow}>
              <Ionicons name="pulse-outline" size={15} color="#8EF2A5" />
              <Text style={styles.reasonText}>
                Best when you want one good answer, not another browse list.
              </Text>
            </View>
          </View>

          <View style={styles.ctaRow}>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>
                {loading ? "Finding your route…" : "Pick my route"}
              </Text>
              <Text style={styles.ctaSub}>
                {loading
                  ? "Scoring live fixtures now"
                  : "Open the strongest live match-trip option"}
              </Text>
            </View>

            <View style={[styles.ctaArrowWrap, loading && styles.ctaArrowWrapLoading]}>
              {loading ? (
                <ActivityIndicator size="small" color="#F5CC57" />
              ) : (
                <Ionicons name="arrow-forward-outline" size={17} color="#07100A" />
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
    borderRadius: 24,
    overflow: "hidden",
  },

  card: {
    borderRadius: 24,
    borderColor: "rgba(250,204,21,0.18)",
  },

  inner: {
    padding: 17,
    gap: 15,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },

  copyWrap: {
    flex: 1,
    gap: 7,
  },

  kickerPill: {
    alignSelf: "flex-start",
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.22)",
    backgroundColor: "rgba(250,204,21,0.08)",
  },

  kicker: {
    color: "#F5CC57",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.9,
  },

  title: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: theme.fontWeight.black,
    maxWidth: "94%",
  },

  sub: {
    color: "rgba(240,245,242,0.72)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.24)",
    backgroundColor: "rgba(250,204,21,0.08)",
    shadowColor: "#F5CC57",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },

  signalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  signalPillStrong: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(142,242,165,0.25)",
    backgroundColor: "rgba(34,197,94,0.10)",
  },

  signalPillStrongText: {
    color: "#8EF2A5",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  signalPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  signalPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  summaryCard: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.045)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 5,
  },

  summaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },

  summaryText: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  reasonBox: {
    gap: 9,
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  reasonText: {
    flex: 1,
    color: "rgba(240,245,242,0.68)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  ctaRow: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.30)",
    backgroundColor: "rgba(250,204,21,0.10)",
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
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  ctaSub: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  ctaArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5CC57",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  ctaArrowWrapLoading: {
    backgroundColor: "rgba(250,204,21,0.10)",
    borderColor: "rgba(250,204,21,0.20)",
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
