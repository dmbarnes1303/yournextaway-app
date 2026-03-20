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
    onOpenTrip,
  } = props;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Continue planning</Text>

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
            <Pressable
              onPress={goDiscover}
              style={({ pressed }) => [styles.emptyCard, pressed && styles.pressedRow]}
              android_ripple={{ color: "rgba(255,255,255,0.05)" }}
            >
              <Text style={styles.emptyEyebrow}>Trip workspace</Text>
              <Text style={styles.emptyTitle}>No trip in progress</Text>
              <Text style={styles.emptyMeta}>
                Use search above or head into Discover when you want to start something new.
              </Text>

              <View style={styles.inlineLinkRow}>
                <Text style={styles.inlineLink}>Open Discover</Text>
                <Text style={styles.inlineChevron}>›</Text>
              </View>
            </Pressable>
          ) : null}

          {loadedTrips && nextTrip ? (
            <>
              <Pressable
                onPress={() => onOpenTrip(String(nextTrip.id))}
                style={({ pressed }) => [styles.tripCard, pressed && styles.pressedRow]}
                android_ripple={{ color: "rgba(255,255,255,0.05)" }}
              >
                <View style={styles.tripImageStripWrap}>
                  <Image
                    source={{ uri: nextTripCityImage }}
                    style={styles.tripImageStrip}
                    resizeMode="cover"
                  />
                  <View style={styles.tripImageStripOverlay} />
                </View>

                <View style={styles.tripCardBody}>
                  <Text style={styles.tripEyebrow}>Next trip workspace</Text>

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
                    Matches, links, bookings and notes kept in one place.
                  </Text>

                  <View style={styles.inlineLinkRow}>
                    <Text style={styles.inlineLink}>Continue trip</Text>
                    <Text style={styles.inlineChevron}>›</Text>
                  </View>
                </View>
              </Pressable>
            </>
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  miniPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
  },

  miniPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  block: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  blockInner: {
    padding: 14,
    gap: 12,
  },

  center: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.20)" : "rgba(10,12,14,0.16)",
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 6,
  },

  emptyEyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  emptyMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  tripCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.20)" : "rgba(10,12,14,0.16)",
    overflow: "hidden",
  },

  tripImageStripWrap: {
    height: 72,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  tripImageStrip: {
    width: "100%",
    height: "100%",
  },

  tripImageStripOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,8,10,0.34)",
  },

  tripCardBody: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },

  tripEyebrow: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
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
    opacity: 0.95,
  },

  tripTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: theme.fontWeight.black,
  },

  tripCrestWrap: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },

  tripCrest: {
    width: 17,
    height: 17,
    opacity: 0.98,
  },

  tripMeta: {
    color: "rgba(242,244,246,0.90)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  tripHint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  inlineLinkRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  inlineLink: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  inlineChevron: {
    color: theme.colors.textTertiary,
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
