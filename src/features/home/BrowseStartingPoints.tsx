import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
} from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { getFlagImageUrl } from "@/src/utils/flagImages";
import { getCityImageUrl } from "@/src/data/cityImages";

type CityChip = { name: string; countryCode: string };

function CityChipPremium({
  name,
  countryCode,
  onPress,
}: {
  name: string;
  countryCode: string;
  onPress: () => void;
}) {
  const flagUrl = getFlagImageUrl(countryCode, { size: 48 });
  const cityImage = getCityImageUrl(name);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cityPill, pressed && styles.pressedPill]}
      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
    >
      <Image source={{ uri: cityImage }} style={styles.cityThumb} resizeMode="cover" />
      <View style={{ gap: 4 }}>
        <Text style={styles.pillText}>{name}</Text>
        {flagUrl ? (
          <Image source={{ uri: flagUrl }} style={styles.cityFlagInline} resizeMode="cover" />
        ) : null}
      </View>
    </Pressable>
  );
}

type Props = {
  cities: CityChip[];
  popularTeams: any[];
  apiSportsTeamLogo: (teamId: number) => string;
  goCityFromName: (name: string) => void;
  onOpenTeam: (teamKey: string) => void;
};

export default function BrowseStartingPoints({
  cities,
  popularTeams,
  apiSportsTeamLogo,
  goCityFromName,
  onOpenTeam,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Browse starting points</Text>
        <Text style={styles.sectionMeta}>City or club first</Text>
      </View>

      <GlassCard strength="default" style={styles.block} noPadding>
        <View style={styles.blockInner}>
          <Text style={styles.sectionKicker}>Popular cities</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularRow}
            decelerationRate="fast"
          >
            {cities.map((c) => (
              <CityChipPremium
                key={`pc-${c.name}`}
                name={c.name}
                countryCode={c.countryCode}
                onPress={() => goCityFromName(c.name)}
              />
            ))}
          </ScrollView>

          <Text style={[styles.sectionKicker, { marginTop: 10 }]}>Popular teams</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularRow}
            decelerationRate="fast"
          >
            {popularTeams.map((t: any) => (
              <Pressable
                key={`pt-${String(t.teamKey ?? t.teamId ?? t.name)}`}
                onPress={() => onOpenTeam(String(t.teamKey))}
                style={({ pressed }) => [styles.teamPill, pressed && styles.pressedPill]}
                android_ripple={{ color: "rgba(255,255,255,0.08)" }}
              >
                <View style={styles.teamCrestDot}>
                  <Image
                    source={{ uri: apiSportsTeamLogo(Number(t.teamId)) }}
                    style={{ width: 16, height: 16, opacity: 0.95 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.pillText}>{String(t.name ?? "")}</Text>
              </Pressable>
            ))}
          </ScrollView>
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
  sectionMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  block: { borderRadius: 24 },
  blockInner: { padding: 14, gap: 12 },

  sectionKicker: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },
  popularRow: { gap: 10, paddingRight: theme.spacing.lg, paddingVertical: 4 },

  cityPill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(18,20,24,0.32)" : "rgba(18,20,24,0.26)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cityThumb: { width: 42, height: 42, borderRadius: 12 },
  cityFlagInline: { width: 16, height: 12, borderRadius: 2, opacity: 0.9 },

  pillText: {
    color: "rgba(242,244,246,0.86)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  teamPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(18,20,24,0.32)" : "rgba(18,20,24,0.26)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  teamCrestDot: {
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

  pressedPill: { opacity: 0.92 },
});
