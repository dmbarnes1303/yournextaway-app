// src/components/trip/MatchHeroCard.tsx

import React from "react";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";

import { getCountryBackdrop } from "@/src/constants/visualAssets";
import { theme } from "@/src/constants/theme";

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

function formatRoundLabel(round?: string | null): string {
  const value = clean(round);
  if (!value) return "";

  return value
    .replace(/\bRegular Season\b/gi, "Matchday")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function Crest({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return <Image source={{ uri: logo }} style={styles.crestImage} resizeMode="contain" />;
  }

  return (
    <View style={styles.fallbackCrest}>
      <Text style={styles.fallbackText}>{initials(name)}</Text>
    </View>
  );
}

function InfoCard({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <View style={[styles.infoCard, wide && styles.infoCardWide]}>
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
  const backdrop = getCountryBackdrop(null, country);

  const title = hasRealMatch
    ? `${homeName} vs ${awayName}`
    : cityName
      ? `${cityName} Football Trip`
      : "Football Trip";

  const roundLabel = formatRoundLabel(round);

  const subtitle = hasRealMatch
    ? [clean(leagueName) || "Matchday", roundLabel].filter(Boolean).join(" • ")
    : "Add your match";

  const content = (
    <>
      <View style={styles.flagBoost} />
      <View style={styles.edgeShade} />
      <View style={styles.bottomShade} />
      <View style={styles.greenGlow} />

      <View style={styles.topLine}>
        <Text style={styles.kicker}>Match trip</Text>
        <Text style={styles.countryPill}>{clean(country) || "Football"}</Text>
      </View>

      {hasRealMatch ? (
        <View style={styles.crestsRow}>
          <View style={styles.crestShell}>
            <Crest name={homeName} logo={homeLogo} />
          </View>

          <View style={styles.vsPill}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.crestShell}>
            <Crest name={awayName} logo={awayLogo} />
          </View>
        </View>
      ) : (
        <View style={styles.noMatchPanel}>
          <Text style={styles.noMatchKicker}>Trip mode</Text>
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
          <InfoCard label={dateLabel} />
          <InfoCard label={timeLabel} />
          <InfoCard label={venueLabel} wide />
        </View>
      </View>
    </>
  );

  if (backdrop) {
    return (
      <View style={styles.shell}>
        <ImageBackground
          source={{ uri: backdrop }}
          style={styles.flagBackground}
          imageStyle={styles.flagImage}
          resizeMode="cover"
        >
          {content}
        </ImageBackground>
      </View>
    );
  }

  return <View style={[styles.shell, styles.fallbackShell]}>{content}</View>;
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 356,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(7,12,12,0.96)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  fallbackShell: {
    position: "relative",
  },

  flagBackground: {
    flex: 1,
    minHeight: 356,
  },

  flagImage: {
    borderRadius: 28,
    opacity: 0.94,
  },

  flagBoost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.34)",
  },

  edgeShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 190,
    backgroundColor: "rgba(0,8,5,0.82)",
  },

  greenGlow: {
    position: "absolute",
    right: -56,
    bottom: -68,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.14)",
  },

  topLine: {
    paddingHorizontal: 16,
    paddingTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  kicker: {
    color: theme.colors.emeraldSoft,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  countryPill: {
    maxWidth: 116,
    overflow: "hidden",
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  crestsRow: {
    marginTop: 30,
    paddingHorizontal: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  crestShell: {
    width: 102,
    height: 102,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4,8,8,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  crestImage: {
    width: 76,
    height: 76,
  },

  fallbackCrest: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.46)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  fallbackText: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  vsPill: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.44)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  vsText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  noMatchPanel: {
    marginTop: 36,
    marginHorizontal: 22,
    minHeight: 110,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.34)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  noMatchKicker: {
    color: theme.colors.emeraldSoft,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  noMatchTitle: {
    marginTop: 8,
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.35,
  },

  copy: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 16,
    alignItems: "center",
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.75,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.70)",
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 4 },
  },

  subtitle: {
    marginTop: 10,
    color: theme.colors.textPrimary,
    opacity: 0.86,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 0.45,
    textAlign: "center",
    textTransform: "uppercase",
  },

  infoRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 9,
    width: "100%",
  },

  infoCard: {
    flex: 1,
    minHeight: 60,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "rgba(3,7,7,0.64)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  infoCardWide: {
    flex: 1.22,
  },

  infoLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    textAlign: "center",
  },
});
