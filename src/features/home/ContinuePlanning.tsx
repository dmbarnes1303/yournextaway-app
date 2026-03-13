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

export default function ContinuePlanning({
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
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Continue planning</Text>
        <Pressable
          onPress={goTrips}
          style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.miniPillText}>Open Trips</Text>
        </Pressable>
      </View>

      <GlassCard strength="default" style={styles.block} noPadding>
        <View style={styles.blockInner}>
          <View style={styles.hubTop}>
            <Text style={styles.hubKicker}>Trip workspaces</Text>
            <Text style={styles.hubSub}>
              Save your match, links, notes and bookings in one place.
            </Text>
          </View>

          {!loadedTrips ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading trips…</Text>
            </View>
          ) : null}

          {loadedTrips && !nextTrip ? (
            <>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptyMeta}>
                Start in Discover if you want ideas. Use Fixtures if you already know you
                just want to browse matches.
              </Text>

              <View style={styles.blockActions}>
                <Pressable
                  onPress={goDiscover}
                  style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.btnPrimaryText}>Open Discover</Text>
                </Pressable>
                <Pressable
                  onPress={goFixturesHub}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.btnGhostText}>Browse Fixtures</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {loadedTrips && nextTrip ? (
            <>
              <Pressable
                onPress={() => onOpenTrip(String(nextTrip.id))}
                style={({ pressed }) => [styles.nextTripCard, pressed && styles.pressedRow]}
                android_ripple={{ color: "rgba(255,255,255,0.06)" }}
              >
                <Image
                  source={{ uri: nextTripCityImage }}
                  style={styles.nextTripImage}
                  resizeMode="cover"
                />
                <View style={styles.nextTripImageOverlay} />

                <View style={styles.nextTripContent}>
                  <Text style={styles.nextTripKicker}>Next up</Text>

                  <View style={styles.nextTripTitleRow}>
                    {nextTripFlagUrl ? (
                      <Image source={{ uri: nextTripFlagUrl }} style={styles.nextTripFlag} />
                    ) : null}
                    {typeof nextTripTeamId === "number" ? (
                      <View style={styles.nextTripCrestDot}>
                        <Image
                          source={{ uri: apiSportsTeamLogo(nextTripTeamId) }}
                          style={{ width: 16, height: 16, opacity: 0.95 }}
                          resizeMode="contain"
                        />
                      </View>
                    ) : null}
                    <Text style={styles.nextTripTitle}>{nextTripCityTitle || "Trip"}</Text>
                  </View>

                  <Text style={styles.nextTripMeta}>{tripSummaryLine(nextTrip)}</Text>
                </View>
              </Pressable>

              <View style={styles.blockActions}>
                <Pressable
                  onPress={goTrips}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Text style={styles.btnGhostText}>Open Trips</Text>
                </Pressable>
                <Pressable
                  onPress={goDiscover}
                  style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.btnPrimaryText}>Plan another trip</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
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
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  miniPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  block: { borderRadius: 24 },
  blockInner: { padding: 14, gap: 12 },

  hubTop: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  hubKicker: {
    color: "rgba(79,224,138,0.78)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },
  hubSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },
  emptyMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  blockActions: { flexDirection: "row", gap: 10, marginTop: 2 },

  btn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  btnPrimary: {
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  nextTripCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    overflow: "hidden",
    position: "relative",
    minHeight: 124,
  },
  nextTripImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  nextTripImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,8,10,0.62)",
  },
  nextTripContent: { paddingVertical: 12, paddingHorizontal: 12 },
  nextTripKicker: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },
  nextTripTitleRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  nextTripFlag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },
  nextTripCrestDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  nextTripTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },
  nextTripMeta: {
    marginTop: 6,
    color: "rgba(242,244,246,0.84)",
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  pressedRow: { opacity: 0.94 },
});
