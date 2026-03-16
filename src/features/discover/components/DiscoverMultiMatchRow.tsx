// src/features/discover/components/DiscoverMultiMatchRow.tsx

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
import { Ionicons } from "@expo/vector-icons";

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

function styleLabel(style: MultiMatchTrip["style"]) {
  if (style === "same-city") return "Same-city stack";
  if (style === "nearby-cities") return "Nearby-city run";
  return "Country run";
}

function styleWhy(style: MultiMatchTrip["style"]) {
  if (style === "same-city") {
    return "Lowest-friction way to turn one match into a proper football trip.";
  }
  if (style === "nearby-cities") {
    return "Multiple fixtures without stretching the travel too far.";
  }
  return "A denser football run with more than one genuine reason to travel.";
}

function styleIcon(style: MultiMatchTrip["style"]): keyof typeof Ionicons.glyphMap {
  if (style === "same-city") return "business-outline";
  if (style === "nearby-cities") return "swap-horizontal-outline";
  return "map-outline";
}

function topBadge(index: number, trip: MultiMatchTrip) {
  if (index === 0) return "Top combo";
  if (trip.matchCount >= 3) return "Triple stack";
  return `${trip.matchCount} matches`;
}

function scoreBand(score: number) {
  if (score >= 520) return "Elite route";
  if (score >= 430) return "Strong route";
  return "Usable route";
}

function fixtureLineLabel(trip: MultiMatchTrip, index: number) {
  const row = trip.rows[index];
  if (!row) return null;

  const home = String(row?.teams?.home?.name ?? "Home").trim();
  const away = String(row?.teams?.away?.name ?? "Away").trim();

  if (!home && !away) return null;
  return `${index + 1}. ${home} vs ${away}`;
}

function extraMatchesLabel(trip: MultiMatchTrip) {
  const remaining = trip.rows.length - 2;
  if (remaining <= 0) return null;
  if (remaining === 1) return "+1 more match";
  return `+${remaining} more matches`;
}

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
          <Text style={styles.loadingTitle}>Building multi-match routes…</Text>
          <Text style={styles.loadingText}>
            Looking for same-city stacks, nearby-city doubles, and cleaner country runs.
          </Text>
        </View>
      </GlassCard>
    );
  }

  if (!!error) {
    return (
      <GlassCard strength="default" style={styles.stateCard}>
        <View style={styles.stateIconWrap}>
          <Ionicons name="alert-circle-outline" size={18} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.stateTextWrap}>
          <Text style={styles.stateTitle}>Multi-match routes unavailable</Text>
          <Text style={styles.stateText}>
            {error || "The app could not build stacked routes from the current live pool."}
          </Text>
        </View>
      </GlassCard>
    );
  }

  if (trips.length === 0) {
    return (
      <GlassCard strength="default" style={styles.stateCard}>
        <View style={styles.stateIconWrap}>
          <Ionicons name="git-compare-outline" size={18} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.stateTextWrap}>
          <Text style={styles.stateTitle}>No strong combos yet</Text>
          <Text style={styles.stateText}>
            Widen the date window or relax the vibe filters and the app will surface stronger stacked
            trips.
          </Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.multiRow}
    >
      {trips.map((trip, index) => {
        const line1 = fixtureLineLabel(trip, 0);
        const line2 = fixtureLineLabel(trip, 1);
        const extraLabel = extraMatchesLabel(trip);

        return (
          <Pressable
            key={trip.id}
            onPress={() => onPressTrip(trip)}
            style={({ pressed }) => [styles.multiPress, pressed && styles.pressed]}
          >
            <GlassCard
              strength={index === 0 ? "strong" : "default"}
              style={[styles.multiCard, index === 0 ? styles.multiCardTop : null]}
              noPadding
            >
              <View style={styles.multiImageWrap}>
                <Image
                  source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
                  style={styles.multiImage}
                  resizeMode="cover"
                />
                <View style={[styles.multiOverlay, index === 0 ? styles.multiOverlayTop : null]} />

                <View style={styles.multiTopBar}>
                  <View style={[styles.multiRankPill, index === 0 ? styles.multiRankPillTop : null]}>
                    <Text style={styles.multiRankText}>{topBadge(index, trip)}</Text>
                  </View>

                  <View style={styles.multiStylePill}>
                    <Ionicons
                      name={styleIcon(trip.style)}
                      size={12}
                      color={theme.colors.text}
                    />
                    <Text style={styles.multiStyleText}>{styleLabel(trip.style)}</Text>
                  </View>
                </View>

                <View style={styles.multiBottomOverlayRow}>
                  <View style={styles.multiScorePill}>
                    <Text style={styles.multiScoreText}>{scoreBand(trip.score)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.multiBody}>
                <View style={styles.multiHeaderBlock}>
                  <Text style={styles.multiTitle} numberOfLines={2}>
                    {trip.title}
                  </Text>

                  <Text style={styles.multiSubline} numberOfLines={2}>
                    {trip.subtitle}
                  </Text>

                  <Text style={styles.multiWhy} numberOfLines={2}>
                    {styleWhy(trip.style)}
                  </Text>
                </View>

                <View style={styles.multiMetaRow}>
                  <View style={styles.multiMetaPillStrong}>
                    <Text style={styles.multiMetaPillStrongText}>
                      {trip.matchCount} matches
                    </Text>
                  </View>

                  <View style={styles.multiMetaPill}>
                    <Text style={styles.multiMetaPillText}>{trip.daysSpan} days</Text>
                  </View>

                  {trip.countryLabel ? (
                    <View style={styles.multiMetaPill}>
                      <Text style={styles.multiMetaPillText} numberOfLines={1}>
                        {trip.countryLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {trip.labels.length > 0 ? (
                  <View style={styles.multiLabelRow}>
                    {trip.labels.slice(0, 3).map((label) => (
                      <View key={`${trip.id}-${label}`} style={styles.multiLabelPill}>
                        <Text style={styles.multiLabelText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.multiMatchList}>
                  <Text style={styles.multiMatchListTitle}>Included fixtures</Text>

                  {line1 ? (
                    <Text style={styles.multiMatchLine} numberOfLines={1}>
                      {line1}
                    </Text>
                  ) : null}

                  {line2 ? (
                    <Text style={styles.multiMatchLine} numberOfLines={1}>
                      {line2}
                    </Text>
                  ) : null}

                  {extraLabel ? (
                    <Text style={styles.multiExtraLine} numberOfLines={1}>
                      {extraLabel}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.multiFooter}>
                  <View style={styles.multiFooterTextWrap}>
                    <Text style={styles.multiFooterTitle}>Open stacked route</Text>
                    <Text style={styles.multiFooterText}>
                      Build this trip from the combined fixture path.
                    </Text>
                  </View>

                  <View style={styles.multiFooterArrowWrap}>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={16}
                      color={theme.colors.text}
                    />
                  </View>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  multiRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  multiPress: {
    width: 304,
    borderRadius: 22,
    overflow: "hidden",
  },

  multiCard: {
    borderRadius: 22,
    borderColor: "rgba(255,255,255,0.08)",
    minHeight: 386,
  },

  multiCardTop: {
    borderColor: "rgba(87,162,56,0.16)",
  },

  multiImageWrap: {
    height: 130,
    position: "relative",
  },

  multiImage: {
    width: "100%",
    height: "100%",
  },

  multiOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.40)",
  },

  multiOverlayTop: {
    backgroundColor: "rgba(5,8,10,0.32)",
  },

  multiTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  multiBottomOverlayRow: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  multiRankPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,10,10,0.64)",
  },

  multiRankPillTop: {
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(6,10,8,0.66)",
  },

  multiRankText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  multiStylePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,10,10,0.60)",
    maxWidth: 150,
  },

  multiStyleText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  multiScorePill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  multiScoreText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  multiBody: {
    padding: 14,
    gap: 10,
    minHeight: 236,
  },

  multiHeaderBlock: {
    gap: 6,
  },

  multiTitle: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 23,
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
    marginTop: 1,
  },

  multiMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  multiMetaPillStrong: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  multiMetaPillStrongText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  multiMetaPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  multiMetaPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
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
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.03)",
  },

  multiLabelText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  multiMatchList: {
    gap: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.03)",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  multiMatchListTitle: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  multiMatchLine: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  multiExtraLine: {
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
    marginTop: 2,
  },

  multiFooter: {
    marginTop: "auto",
    paddingTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  multiFooterTextWrap: {
    flex: 1,
    gap: 2,
  },

  multiFooterTitle: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  multiFooterText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  multiFooterArrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  loadingCard: {
    borderRadius: 20,
    padding: 8,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 22,
    paddingHorizontal: 18,
  },

  loadingTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },

  stateCard: {
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  stateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
  },

  stateTextWrap: {
    flex: 1,
    gap: 4,
  },

  stateTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  stateText: {
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
