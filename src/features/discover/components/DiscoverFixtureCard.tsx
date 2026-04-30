import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";
import type { FixtureListRow } from "@/src/services/apiFootball";

type Variant = "live" | "trending";

type Props = {
  title: string;
  subtitle: string;
  badge: string;
  onPress: () => void;
  variant?: Variant;
  meta?: string;
  imageUri?: string;
  row?: FixtureListRow;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function leagueLine(row?: FixtureListRow) {
  const league = clean(row?.league?.name);
  const country = clean((row?.league as any)?.country);
  if (league && country) return `${league} • ${country}`;
  return league || country || "";
}

function cityLine(row?: FixtureListRow) {
  const venue = clean(row?.fixture?.venue?.name);
  const city = clean(row?.fixture?.venue?.city);
  if (venue && city) return `${venue} • ${city}`;
  return venue || city || "";
}

export default function DiscoverFixtureCard({
  title,
  subtitle,
  badge,
  onPress,
  variant = "live",
  meta,
  imageUri,
  row,
}: Props) {
  const isTrending = variant === "trending";
  const uri = imageUri || PLACEHOLDER_DISCOVER_IMAGE;
  const topMeta = leagueLine(row);
  const bottomMeta = cityLine(row) || meta;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        isTrending ? styles.pressTrending : styles.press,
        pressed && styles.pressed,
      ]}
    >
      <GlassCard
        variant={isTrending ? "gold" : "brand"}
        strength={isTrending ? "strong" : "default"}
        style={[styles.card, isTrending && styles.cardTrending]}
        noPadding
      >
        <View style={isTrending ? styles.imageWrapTrending : styles.imageWrap}>
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          <View style={isTrending ? styles.overlayTrending : styles.overlay} />
          <View style={styles.bottomFade} />

          <View style={styles.topBar}>
            <View style={isTrending ? styles.badgeGold : styles.badge}>
              <Text style={isTrending ? styles.badgeGoldText : styles.badgeText}>
                {badge}
              </Text>
            </View>

            <View style={styles.typePill}>
              <Ionicons
                name={isTrending ? "flame-outline" : "navigate-outline"}
                size={12}
                color={isTrending ? theme.colors.accentGold : theme.colors.primary}
              />
              <Text style={isTrending ? styles.typePillGoldText : styles.typePillText}>
                {isTrending ? "Trending" : "Live"}
              </Text>
            </View>
          </View>

          {topMeta ? (
            <View style={styles.imageBottomLabel}>
              <Text style={styles.imageBottomText} numberOfLines={1}>
                {topMeta}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={isTrending ? styles.bodyTrending : styles.body}>
          <Text style={isTrending ? styles.titleTrending : styles.title} numberOfLines={2}>
            {title}
          </Text>

          {bottomMeta ? (
            <Text style={styles.meta} numberOfLines={2}>
              {bottomMeta}
            </Text>
          ) : null}

          <Text
            style={isTrending ? styles.subtitleTrending : styles.subtitle}
            numberOfLines={3}
          >
            {subtitle}
          </Text>

          <View style={styles.footer}>
            <View style={isTrending ? styles.ctaPillGold : styles.ctaPill}>
              <Text style={isTrending ? styles.ctaGold : styles.cta}>
                {isTrending ? "Open trip" : "View route"}
              </Text>
            </View>

            <View style={isTrending ? styles.arrowGold : styles.arrow}>
              <Ionicons name="arrow-forward-outline" size={14} color={theme.colors.text} />
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: {
    width: 268,
    borderRadius: 24,
    overflow: "hidden",
  },

  pressTrending: {
    width: 292,
    borderRadius: 24,
    overflow: "hidden",
  },

  card: {
    borderRadius: 24,
    borderColor: "rgba(163,230,53,0.14)",
  },

  cardTrending: {
    borderColor: "rgba(245,204,87,0.18)",
  },

  imageWrap: {
    height: 134,
    position: "relative",
  },

  imageWrapTrending: {
    height: 148,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.42)",
  },

  overlayTrending: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,8,4,0.34)",
  },

  bottomFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,5,7,0.16)",
  },

  topBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(6,10,8,0.68)",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.20)",
  },

  badgeGold: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(20,14,4,0.70)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.24)",
  },

  badgeText: {
    color: "#8EF2A5",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  badgeGoldText: {
    color: "#F5CC57",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  typePillText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  typePillGoldText: {
    color: theme.colors.accentGold,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  imageBottomLabel: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },

  imageBottomText: {
    color: "rgba(255,255,255,0.94)",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  body: {
    padding: 14,
    gap: 7,
    minHeight: 150,
  },

  bodyTrending: {
    padding: 14,
    gap: 7,
    minHeight: 160,
  },

  title: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: theme.fontWeight.black,
  },

  titleTrending: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: theme.fontWeight.black,
  },

  meta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  subtitle: {
    color: "#8EF2A5",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  subtitleTrending: {
    color: "#F5CC57",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  footer: {
    marginTop: "auto",
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  ctaPill: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18,103,49,0.24)",
    borderWidth: 1,
    borderColor: "rgba(104,241,138,0.18)",
  },

  ctaPillGold: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,204,87,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.20)",
  },

  cta: {
    color: "#8EF2A5",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  ctaGold: {
    color: "#F5CC57",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  arrow: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.12)" : "rgba(87,162,56,0.10)",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
  },

  arrowGold: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Platform.OS === "android" ? "rgba(245,204,87,0.13)" : "rgba(245,204,87,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.18)",
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
