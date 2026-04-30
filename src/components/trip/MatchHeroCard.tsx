// src/components/trip/MatchHeroCard.tsx

import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

function TeamCrest({
  name,
  logo,
  side,
}: {
  name: string;
  logo?: string | null;
  side: "home" | "away";
}) {
  return (
    <View style={[styles.crestShell, side === "away" && styles.awayCrestShell]}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImage} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
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
        <View style={styles.darkOverlay} />
        <View
          style={[
            styles.colourWashLeft,
            { backgroundColor: visual.accentLeft },
          ]}
        />
        <View
          style={[
            styles.colourWashRight,
            { backgroundColor: visual.accentRight },
          ]}
        />
        <View style={styles.waveOne} />
        <View style={styles.waveTwo} />
        <View style={styles.waveThree} />
        <View style={styles.bottomVignette} />

        <View style={styles.crestsRow}>
          <TeamCrest name={homeName} logo={hasRealMatch ? homeLogo : null} side="home" />

          <View style={styles.vsDisc}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <TeamCrest name={awayName} logo={hasRealMatch ? awayLogo : null} side="away" />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoChip}>
              <Text style={styles.infoIcon}>▣</Text>
              <Text style={styles.infoText} numberOfLines={1}>
                {dateLabel}
              </Text>
            </View>

            <View style={styles.infoChip}>
              <Text style={styles.infoIcon}>◷</Text>
              <Text style={styles.infoText} numberOfLines={1}>
                {timeLabel}
              </Text>
            </View>

            <View style={styles.infoChipWide}>
              <Text style={styles.infoIcon}>◉</Text>
              <Text style={styles.infoText} numberOfLines={1}>
                {venueLabel}
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 364,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#041008",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.28)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.26,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },

  flagBackground: {
    flex: 1,
  },

  flagImage: {
    borderRadius: 34,
    opacity: 0.82,
  },

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,18,8,0.58)",
  },

  colourWashLeft: {
    position: "absolute",
    left: -70,
    top: -30,
    width: 190,
    height: 420,
    opacity: 0.22,
    transform: [{ rotate: "-14deg" }],
    borderRadius: 80,
  },

  colourWashRight: {
    position: "absolute",
    right: -80,
    top: -40,
    width: 210,
    height: 430,
    opacity: 0.20,
    transform: [{ rotate: "16deg" }],
    borderRadius: 80,
  },

  waveOne: {
    position: "absolute",
    left: -70,
    right: -30,
    top: 96,
    height: 88,
    backgroundColor: "rgba(255,255,255,0.10)",
    opacity: 0.44,
    transform: [{ rotate: "-8deg" }],
    borderRadius: 999,
  },

  waveTwo: {
    position: "absolute",
    left: -40,
    right: -80,
    top: 172,
    height: 96,
    backgroundColor: "rgba(0,0,0,0.28)",
    opacity: 0.7,
    transform: [{ rotate: "8deg" }],
    borderRadius: 999,
  },

  waveThree: {
    position: "absolute",
    left: -90,
    right: -60,
    bottom: 18,
    height: 94,
    backgroundColor: "rgba(34,197,94,0.14)",
    opacity: 0.7,
    transform: [{ rotate: "-6deg" }],
    borderRadius: 999,
  },

  bottomVignette: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    backgroundColor: "rgba(0,16,8,0.74)",
  },

  crestsRow: {
    position: "absolute",
    left: 28,
    right: 28,
    top: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  crestShell: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  awayCrestShell: {
    shadowColor: "#000000",
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },

  crestImage: {
    width: 66,
    height: 66,
  },

  crestFallback: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  vsDisc: {
    width: 54,
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  vsText: {
    color: "#061008",
    fontSize: 14,
    fontWeight: "900",
  },

  copy: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 22,
    alignItems: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    color: "#A3E635",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
    textTransform: "uppercase",
  },

  infoGrid: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },

  infoChip: {
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,15,7,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  infoChipWide: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,15,7,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  infoIcon: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
  },

  infoText: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
