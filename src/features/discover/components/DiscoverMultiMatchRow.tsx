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

/* -------------------------- helpers -------------------------- */

function styleLabel(style: MultiMatchTrip["style"]) {
  if (style === "same-city") return "Same city";
  if (style === "nearby-cities") return "Nearby cities";
  return "Country route";
}

function styleIcon(style: MultiMatchTrip["style"]): keyof typeof Ionicons.glyphMap {
  if (style === "same-city") return "business-outline";
  if (style === "nearby-cities") return "swap-horizontal-outline";
  return "map-outline";
}

function topBadge(index: number, trip: MultiMatchTrip) {
  if (index === 0) return "Best combo";
  if (trip.matchCount >= 3) return "Triple";
  return `${trip.matchCount} matches`;
}

function fixtureLine(trip: MultiMatchTrip, i: number) {
  const r = trip.rows[i];
  if (!r) return null;
  const home = r?.teams?.home?.name ?? "";
  const away = r?.teams?.away?.name ?? "";
  if (!home && !away) return null;
  return `${home} vs ${away}`;
}

function extraMatches(trip: MultiMatchTrip) {
  const n = trip.rows.length - 2;
  if (n <= 0) return null;
  return n === 1 ? "+1 more" : `+${n} more`;
}

/* -------------------------- component -------------------------- */

export default function DiscoverMultiMatchRow({
  loading,
  error,
  trips,
  onPressTrip,
}: Props) {
  if (loading) {
    return (
      <GlassCard strength="default" style={styles.stateCard}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.stateTitle}>Building stacked trips…</Text>
          <Text style={styles.stateText}>
            Finding cities where multiple fixtures actually make sense together.
          </Text>
        </View>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard strength="default" style={styles.stateCard}>
        <Text style={styles.stateTitle}>Multi-match unavailable</Text>
        <Text style={styles.stateText}>{error}</Text>
      </GlassCard>
    );
  }

  if (!trips.length) {
    return (
      <GlassCard strength="default" style={styles.stateCard}>
        <Text style={styles.stateTitle}>No strong combos</Text>
        <Text style={styles.stateText}>
          Expand your window or loosen filters — combos need room to exist.
        </Text>
      </GlassCard>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {trips.map((trip, index) => {
        const line1 = fixtureLine(trip, 0);
        const line2 = fixtureLine(trip, 1);
        const extra = extraMatches(trip);

        return (
          <Pressable
            key={trip.id}
            onPress={() => onPressTrip(trip)}
            style={({ pressed }) => [styles.cardPress, pressed && styles.pressed]}
          >
            <GlassCard
              strength={index === 0 ? "strong" : "default"}
              style={styles.card}
              noPadding
            >
              {/* IMAGE */}
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
                  style={styles.image}
                />
                <View style={styles.overlay} />

                <View style={styles.topBar}>
                  <Text style={styles.badge}>{topBadge(index, trip)}</Text>

                  <View style={styles.stylePill}>
                    <Ionicons name={styleIcon(trip.style)} size={12} color="#fff" />
                    <Text style={styles.styleText}>{styleLabel(trip.style)}</Text>
                  </View>
                </View>
              </View>

              {/* BODY */}
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {trip.title}
                </Text>

                <Text style={styles.subtitle} numberOfLines={2}>
                  {trip.subtitle}
                </Text>

                {/* META */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaStrong}>{trip.matchCount} matches</Text>
                  <Text style={styles.meta}>{trip.daysSpan} days</Text>
                  {trip.countryLabel && (
                    <Text style={styles.meta}>{trip.countryLabel}</Text>
                  )}
                </View>

                {/* FIXTURE LIST */}
                <View style={styles.list}>
                  {line1 && <Text style={styles.line}>{line1}</Text>}
                  {line2 && <Text style={styles.line}>{line2}</Text>}
                  {extra && <Text style={styles.extra}>{extra}</Text>}
                </View>

                {/* CTA */}
                <View style={styles.cta}>
                  <Text style={styles.ctaText}>Open trip</Text>
                  <Ionicons name="arrow-forward-outline" size={14} color="#fff" />
                </View>
              </View>
            </GlassCard>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* -------------------------- styles -------------------------- */

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  cardPress: {
    width: 300,
    borderRadius: 22,
    overflow: "hidden",
  },

  card: {
    borderRadius: 22,
  },

  imageWrap: {
    height: 130,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  topBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  badge: {
    color: "#fff",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  stylePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  styleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  body: {
    padding: 14,
    gap: 8,
  },

  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  meta: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  metaStrong: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  list: {
    gap: 2,
  },

  line: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  extra: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  cta: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ctaText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  stateCard: {
    borderRadius: 20,
    padding: 16,
  },

  center: {
    alignItems: "center",
    gap: 10,
  },

  stateTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  stateText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
