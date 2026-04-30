// src/components/trip/MatchHeroCard.tsx

import React from "react";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";

import { getCountryVisual } from "@/src/constants/visualAssets";

type Props = {
  homeName: string;
  awayName: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  country?: string | null;
  leagueName?: string | null;
  round?: string | null;
  dateLabel: string;
  timeLabel: string;
  venueLabel: string;
  hasRealMatch: boolean;
  cityName?: string | null;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function initials(name?: string | null) {
  const value = clean(name);
  if (!value) return "?";

  const parts = value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) return value.slice(0, 3).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Crest({ name, logo, large }: { name: string; logo?: string | null; large?: boolean }) {
  if (logo) {
    return (
      <Image
        source={{ uri: logo }}
        style={[styles.crestImage, large && styles.crestImageLarge]}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={[styles.fallbackCrest, large && styles.fallbackCrestLarge]}>
      <Text style={styles.fallbackText}>{initials(name)}</Text>
    </View>
  );
}

function InfoCard({ icon, label, wide }: { icon: string; label: string; wide?: boolean }) {
  return (
    <View style={[styles.infoCard, wide && styles.infoCardWide]}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel} numberOfLines={wide ? 2 : 1}>
        {label}
      </Text>
    </View>
  );
}

export default function MatchHeroCard({
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  country,
  leagueName,
  round,
  dateLabel,
  timeLabel,
  venueLabel,
  hasRealMatch,
  cityName,
}: Props) {
  const visual = getCountryVisual(country);

  const title = hasRealMatch
    ? `${homeName} vs ${awayName}`
    : cityName
      ? `${cityName} Football Trip`
      : "Football Trip";

  const subtitle = hasRealMatch
    ? [clean(leagueName) || "Matchday", clean(round)].filter(Boolean).join(" • ")
    : "Add your match";

  return (
    <View style={styles.shell}>
      <ImageBackground
        source={{ uri: visual.flagUrl }}
        style={styles.flagBackground}
        imageStyle={styles.flagImage}
      >
        <View style={styles.flagBoost} />
        <View style={styles.fabricHighlightOne} />
        <View style={styles.fabricHighlightTwo} />
        <View style={styles.fabricShadowOne} />
        <View style={styles.fabricShadowTwo} />
        <View style={styles.topShadow} />
        <View style={styles.bottomShadow} />

        {hasRealMatch ? (
          <View style={styles.matchCrestsLayer}>
            <View style={styles.homeCrestWrap}>
              <Crest name={homeName} logo={homeLogo} large />
            </View>

            <Text style={styles.vsText}>VS</Text>

            <View style={styles.awayCrestWrap}>
              <Crest name={awayName} logo={awayLogo} large />
            </View>
          </View>
        ) : (
          <View style={styles.noMatchPanel}>
            <Text style={styles.noMatchKicker}>TRIP MODE</Text>
            <Text style={styles.noMatchTitle}>Choose your match</Text>
          </View>
        )}

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.infoRow}>
            <InfoCard icon="▣" label={dateLabel} />
            <InfoCard icon="◷" label={timeLabel} />
            <InfoCard icon="◉" label={venueLabel} wide />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 438,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#031007",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.30)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.24,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },

  flagBackground: {
    flex: 1,
  },

  flagImage: {
    borderRadius: 34,
    opacity: 0.95,
  },

  flagBoost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  fabricHighlightOne: {
    position: "absolute",
    left: -70,
    right: -30,
    top: 42,
    height: 105,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    opacity: 0.62,
    transform: [{ rotate: "-8deg" }],
  },

  fabricHighlightTwo: {
    position: "absolute",
    left: 20,
    right: -90,
    top: 132,
    height: 92,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    opacity: 0.5,
    transform: [{ rotate: "7deg" }],
  },

  fabricShadowOne: {
    position: "absolute",
    left: -60,
    right: -80,
    top: 202,
    height: 115,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.34)",
    opacity: 0.6,
    transform: [{ rotate: "-6deg" }],
  },

  fabricShadowTwo: {
    position: "absolute",
    left: -80,
    right: -40,
    bottom: 112,
    height: 112,
    borderRadius: 999,
    backgroundColor: "rgba(0,40,18,0.42)",
    opacity: 0.62,
    transform: [{ rotate: "8deg" }],
  },

  topShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 90,
    backgroundColor: "rgba(0,0,0,0.24)",
  },

  bottomShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 230,
    backgroundColor: "rgba(0,10,5,0.84)",
  },

  matchCrestsLayer: {
    position: "absolute",
    left: 30,
    right: 30,
    top: 82,
    height: 118,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  homeCrestWrap: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
  },

  awayCrestWrap: {
    width: 118,
    height: 118,
    alignItems: "center",
    justifyContent: "center",
  },

  crestImage: {
    width: 86,
    height: 86,
  },

  crestImageLarge: {
    width: 108,
    height: 108,
  },

  fallbackCrest: {
    width: 78,
    height: 78,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  fallbackCrestLarge: {
    width: 98,
    height: 98,
  },

  fallbackText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  vsText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 3 },
  },

  noMatchPanel: {
    position: "absolute",
    left: 32,
    right: 32,
    top: 72,
    minHeight: 118,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,13,6,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  noMatchKicker: {
    color: "#A3E635",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  noMatchTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  copy: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 24,
    alignItems: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.95,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.70)",
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 4 },
  },

  subtitle: {
    marginTop: 11,
    color: "#A3E635",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "uppercase",
  },

  infoRow: {
    marginTop: 25,
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },

  infoCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "rgba(0,13,7,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  infoCardWide: {
    flex: 1.18,
  },

  infoIcon: {
    color: "#D9F99D",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },

  infoLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    textAlign: "center",
  },
});
