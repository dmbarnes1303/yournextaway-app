import React from "react";
import {
  ScrollView,
  Pressable,
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";
import type { MultiMatchTrip } from "@/src/features/discover/types";

type Props = {
  loading: boolean;
  error?: string | null;
  trips: MultiMatchTrip[];
  onPressTrip: (trip: MultiMatchTrip) => void;
};

export default function DiscoverMultiMatchRow({
  loading,
  error,
  trips,
  onPressTrip,
}: Props) {
  if (loading) {
    return (
      <GlassCard strength="default" style={styles.loadingCard}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Building multi-match routes…</Text>
        </View>
      </GlassCard>
    );
  }

  if (!loading && !error && trips.length === 0) {
    return (
      <GlassCard strength="default" style={styles.noComboCard}>
        <Text style={styles.noComboTitle}>No strong combos yet</Text>
        <Text style={styles.noComboText}>
          Widen the date window or ease the vibe filters and the app will surface stacked trips.
        </Text>
      </GlassCard>
    );
  }

  if (!trips.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.multiRow}
    >
      {trips.map((trip, index) => (
        <Pressable
          key={trip.id}
          onPress={() => onPressTrip(trip)}
          style={({ pressed }) => [styles.multiPress, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.multiCard} noPadding>
            <View style={styles.multiImageWrap}>
              <Image
                source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
                style={styles.multiImage}
                resizeMode="cover"
              />
              <View style={styles.multiOverlay} />

              <View style={styles.multiTopBar}>
                <View style={styles.multiRankPill}>
                  <Text style={styles.multiRankText}>
                    {index === 0 ? "Best combo" : `${trip.matchCount} matches`}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.multiBody}>
              <Text style={styles.multiTitle} numberOfLines={2}>
                {trip.title}
              </Text>

              <Text style={styles.multiSubline} numberOfLines={1}>
                {trip.subtitle}
              </Text>

              <Text style={styles.multiWhy} numberOfLines={2}>
                {trip.style === "same-city"
                  ? "Lowest-friction way to turn one match into a proper football trip."
                  : trip.style === "nearby-cities"
                    ? "Multiple fixtures without stretching the travel too far."
                    : "A denser football run with more than one genuine reason to travel."}
              </Text>

              <View style={styles.multiLabelRow}>
                {trip.labels.slice(0, 3).map((label) => (
                  <View key={`${trip.id}-${label}`} style={styles.multiLabelPill}>
                    <Text style={styles.multiLabelText}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.multiMatchList}>
                {trip.rows.slice(0, 2).map((row, rowIndex) => (
                  <Text
                    key={`${trip.id}-${String(row?.fixture?.id ?? rowIndex)}`}
                    style={styles.multiMatchLine}
                    numberOfLines={1}
                  >
                    {`${rowIndex + 1}. ${(row?.teams?.home?.name ?? "Home")} vs ${(
                      row?.teams?.away?.name ?? "Away"
                    )}`}
                  </Text>
                ))}
              </View>

              <View style={styles.multiFooter}>
                <Text style={styles.multiFooterText}>
                  {`${trip.matchCount} matches in ${trip.daysSpan} days`}
                </Text>
                <Text style={styles.multiFooterArrow}>›</Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  multiRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  multiPress: {
    width: 292,
    borderRadius: 22,
    overflow: "hidden",
  },

  multiCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.16)",
  },

  multiImageWrap: {
    height: 126,
    position: "relative",
  },

  multiImage: {
    width: "100%",
    height: "100%",
  },

  multiOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.38)",
  },

  multiTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  multiRankPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(6,10,8,0.64)",
  },

  multiRankText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  multiBody: {
    padding: 14,
    gap: 8,
    minHeight: 184,
  },

  multiTitle: {
    color: theme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: theme.fontWeight.black,
  },

  multiSubline: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  multiWhy: {
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
  },

  multiLabelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  multiLabelPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  multiLabelText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  multiMatchList: {
    gap: 4,
    marginTop: 2,
  },

  multiMatchLine: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  multiFooter: {
    marginTop: "auto",
    paddingTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  multiFooterText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  multiFooterArrow: {
    color: theme.colors.textTertiary,
    fontSize: 22,
    marginTop: -2,
  },

  loadingCard: {
    borderRadius: 20,
    padding: 6,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  noComboCard: {
    borderRadius: 20,
    padding: 16,
  },

  noComboTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  noComboText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
