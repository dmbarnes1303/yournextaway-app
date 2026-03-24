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

function getTripSignal(nextTrip: Trip | null) {
  if (!nextTrip) return "Ready when you are";

  const savedCount = Array.isArray((nextTrip as any)?.matchIds)
    ? (nextTrip as any).matchIds.length
    : 0;

  if (savedCount > 1) return `${savedCount} matches saved`;
  if (savedCount === 1) return "1 match saved";
  return "Workspace live";
}

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

  const signal = getTripSignal(nextTrip);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Continue planning</Text>

        <Pressable
          onPress={goTrips}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressedLite]}
          hitSlop={10}
        >
          <Text style={styles.headerActionText}>All trips ›</Text>
        </Pressable>
      </View>

      {!loadedTrips ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={theme.colors.textSecondary} />
          <Text style={styles.loadingText}>Loading trips…</Text>
        </View>
      ) : null}

      {loadedTrips && !nextTrip ? (
        <View style={styles.emptyCard}>
          <Image
            source={{ uri: nextTripCityImage }}
            style={styles.emptyImage}
            resizeMode="cover"
          />
          <View style={styles.emptyImageShade} pointerEvents="none" />
          <View style={styles.emptyBottomFade} pointerEvents="none" />
          <View style={styles.emptyGlow} pointerEvents="none" />

          <View style={styles.emptyContent}>
            <Text style={styles.emptyTag}>Trip workspace</Text>
            <Text style={styles.emptyTitle}>Start your first football trip</Text>
            <Text style={styles.emptyMeta}>
              Pick a city, fixture or date window and build the whole weekend in one place.
            </Text>

            <View style={styles.emptyActions}>
              <Pressable
                onPress={goDiscover}
                style={({ pressed }) => [styles.primaryAction, pressed && styles.pressedRow]}
                android_ripple={{ color: "rgba(87,162,56,0.08)" }}
              >
                <Text style={styles.primaryActionText}>Explore cities</Text>
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
        </View>
      ) : null}

      {loadedTrips && nextTrip ? (
        <Pressable
          onPress={() => onOpenTrip(String(nextTrip.id))}
          style={({ pressed }) => [styles.tripCard, pressed && styles.pressedCard]}
          android_ripple={{ color: "rgba(255,255,255,0.05)" }}
        >
          <Image
            source={{ uri: nextTripCityImage }}
            style={styles.tripImage}
            resizeMode="cover"
          />
          <View style={styles.tripImageOverlay} pointerEvents="none" />
          <View style={styles.tripBottomFade} pointerEvents="none" />
          <View style={styles.tripGlow} pointerEvents="none" />

          <View style={styles.tripTopMeta}>
            <Text style={styles.tripTag}>Next trip workspace</Text>

            <View style={styles.tripStatusRow}>
              <View style={styles.tripSignalPill}>
                <Text style={styles.tripSignalPillText}>{signal}</Text>
              </View>

              <View style={styles.tripStatusPill}>
                <Text style={styles.tripStatusPillText}>In progress</Text>
              </View>
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

            <View style={styles.tripFooter}>
              <View style={styles.tripFooterCta}>
                <Text style={styles.tripFooterCtaText}>Open workspace</Text>
              </View>

              <Text style={styles.tripFooterLink}>Continue trip ›</Text>
            </View>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
  },

  headerAction: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },

  headerActionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  loadingCard: {
    minHeight: 168,
    borderRadius: 26,
    backgroundColor:
      Platform.OS === "android" ? "rgba(9,12,14,0.52)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  emptyCard: {
    minHeight: 214,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0A0F12",
  },

  emptyImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  emptyImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,9,12,0.60)",
  },

  emptyBottomFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,7,9,0.24)",
  },

  emptyGlow: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: -14,
    height: 68,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.08)",
  },

  emptyContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 7,
  },

  emptyTag: {
    color: "#8EF2A5",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 31,
    fontWeight: theme.fontWeight.black,
    maxWidth: "88%",
  },

  emptyMeta: {
    color: "rgba(232,239,234,0.84)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "92%",
  },

  emptyActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },

  primaryAction: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: "rgba(18,103,49,0.30)",
    borderWidth: 1,
    borderColor: "rgba(104,241,138,0.20)",
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
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryActionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  tripCard: {
    minHeight: 224,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0A0F12",
  },

  tripImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  tripImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,10,12,0.38)",
  },

  tripBottomFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,7,9,0.28)",
  },

  tripGlow: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: -14,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.10)",
  },

  tripTopMeta: {
    paddingHorizontal: 16,
    paddingTop: 15,
    gap: 10,
  },

  tripTag: {
    color: "rgba(244,247,245,0.82)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },

  tripStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  tripSignalPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,204,87,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.18)",
  },

  tripSignalPillText: {
    color: "#F5CC57",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  tripStatusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  tripStatusPillText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  tripContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    fontSize: 30,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
  },

  tripCrestWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
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

  tripFooter: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  tripFooterCta: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(18,103,49,0.28)",
    borderWidth: 1,
    borderColor: "rgba(104,241,138,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  tripFooterCtaText: {
    color: "#8EF2A5",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  tripFooterLink: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  pressedRow: {
    opacity: 0.95,
  },

  pressedCard: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },

  pressedLite: {
    opacity: 0.9,
  },
});
