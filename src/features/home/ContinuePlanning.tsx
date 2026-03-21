import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import type { Trip } from "@/src/state/trips";

type Props = {
  loadedTrips: boolean;
  nextTrip: Trip | null;
  nextTripCityImage: string;
  nextTripFlagUrl: string;
  nextTripTeamId: number | null;
  nextTripCityTitle: string;
  apiSportsTeamLogo: (teamId: number) => string;
  tripSummaryLine: (trip: Trip) => string;
  goTrips: () => void;
  goDiscover: () => void;
  goFixturesHub: () => void;
  onOpenTrip: (tripId: string) => void;
};

export default function ContinuePlanning(props: Props) {
  const {
    loadedTrips,
    nextTrip,
    nextTripCityImage,
    nextTripFlagUrl,
    nextTripTeamId,
    nextTripCityTitle,
    apiSportsTeamLogo,
    tripSummaryLine,
    goTrips,
    goDiscover,
    goFixturesHub,
    onOpenTrip,
  } = props;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionEyebrow}>Workspace</Text>
          <Text style={styles.sectionTitle}>Continue planning</Text>
        </View>

        <Pressable
          onPress={goTrips}
          style={({ pressed }) => [styles.miniPill, pressed && styles.pressedLite]}
        >
          <Text style={styles.miniPillText}>All trips</Text>
        </Pressable>
      </View>

      <GlassCard strength="default" style={styles.block} noPadding>
        <View style={styles.blockInner}>
          {!loadedTrips ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading trips…</Text>
            </View>
          ) : null}

          {loadedTrips && !nextTrip ? (
            <View style={styles.emptyShell}>
              <View style={styles.emptyHeaderRow}>
                <Text style={styles.emptyEyebrow}>Trip workspace</Text>
                <View style={styles.emptyStatusPill}>
                  <Text style={styles.emptyStatusPillText}>Nothing active</Text>
                </View>
              </View>

              <Text style={styles.emptyTitle}>No trip in progress</Text>
              <Text style={styles.emptyMeta}>
                Start from Discover for inspiration or jump straight into upcoming fixtures when you already know the date window.
              </Text>

              <View style={styles.emptyActions}>
                <Pressable
                  onPress={goDiscover}
                  style={({ pressed }) => [styles.primaryAction, pressed && styles.pressedRow]}
                  android_ripple={{ color: "rgba(87,162,56,0.08)" }}
                >
                  <Text style={styles.primaryActionText}>Open Discover</Text>
                </Pressable>

                <Pressable
                  onPress={goFixturesHub}
                  style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressedRow]}
                  android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                >
                  <Text style={styles.secondaryActionText}>Browse fixtures</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {loadedTrips && nextTrip ? (
            <Pressable
              onPress={() => onOpenTrip(String(nextTrip.id))}
              style={({ pressed }) => [styles.tripCard, pressed && styles.pressedRow]}
              android_ripple={{ color: "rgba(255,255,255,0.05)" }}
            >
              <Image
                source={{ uri: nextTripCityImage }}
                style={styles.tripImage}
                resizeMode="cover"
              />
              <View style={styles.tripImageOverlay} />
              <View style={styles.tripDarkFade} />

              <View style={styles.tripTopMeta}>
                <Text style={styles.tripEyebrow}>Next trip workspace</Text>
                <View style={styles.tripStatusPill}>
                  <Text style={styles.tripStatusPillText}>In progress</Text>
                </View>
              </View>

              <View style={styles.tripContent}>
                <View style={styles.tripTitleRow}>
                  {nextTripFlagUrl ? (
                    <Image source={{ uri: nextTripFlagUrl }} style={styles.tripFlag} />
                  ) : null}

                  <Text style={styles.tripTitle} numberOfLines={1}>
                    {nextTripCityTitle || "Trip"}
                  </Text>

                  {typeof nextTripTeamId === "number" ? (
                    <View style={styles.tripCrestWrap}>
                      <Image
                        source={{ uri: apiSportsTeamLogo(nextTripTeamId) }}
                        style={styles.tripCrest}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}
                </View>

                <Text style={styles.tripMeta}>{tripSummaryLine(nextTrip)}</Text>

                <Text style={styles.tripHint}>
                  Matches, travel links, bookings and notes all kept together.
                </Text>

                <View style={styles.inlineLinkRow}>
                  <Text style={styles.inlineLink}>Continue trip</Text>
                  <Text style={styles.inlineChevron}>›</Text>
                </View>
              </View>
            </Pressable>
          ) : null}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionTitleWrap: {
    gap: 2,
  },

  sectionEyebrow: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
  },

  miniPill: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.04)",
  },

  miniPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  block: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(8,11,14,0.72)",
  },

  blockInner: {
    padding: 14,
    gap: 12,
  },

  center: {
    paddingVertical: 18,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  emptyShell: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,13,16,0.24)" : "rgba(10,13,16,0.18)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },

  emptyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  emptyEyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  emptyStatusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  emptyStatusPillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
  },

  emptyMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
  },

  emptyActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
  },

  primaryAction: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryActionText: {
    color: "#8EF2A5",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  secondaryAction: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryActionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  tripCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    minHeight: 194,
    position: "relative",
    backgroundColor: "#0B1014",
  },

  tripImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  tripImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,11,14,0.36)",
  },

  tripDarkFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,7,9,0.32)",
  },

  tripTopMeta: {
    paddingHorizontal: 15,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  tripEyebrow: {
    color: "rgba(244,247,245,0.84)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },

  tripStatusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  tripStatusPillText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  tripContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 7,
  },

  tripTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tripFlag: {
    width: 18,
    height: 13,
    borderRadius: 3,
    opacity: 0.96,
  },

  tripTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: theme.fontWeight.black,
  },

  tripCrestWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },

  tripCrest: {
    width: 18,
    height: 18,
    opacity: 0.98,
  },

  tripMeta: {
    color: "rgba(244,247,245,0.92)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  tripHint: {
    color: "rgba(225,232,226,0.84)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "90%",
  },

  inlineLinkRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  inlineLink: {
    color: "#8EF2A5",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  inlineChevron: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 18,
    marginTop: -1,
  },

  pressedRow: {
    opacity: 0.95,
  },

  pressedLite: {
    opacity: 0.9,
  },
});
