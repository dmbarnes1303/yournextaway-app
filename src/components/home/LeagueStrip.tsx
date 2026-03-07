import React from "react";
import { ScrollView, Image, Pressable, StyleSheet, View, Text } from "react-native";
import { theme } from "@/src/constants/theme";
import type { LeagueOption } from "@/src/constants/football";

type Props = {
  leagues: LeagueOption[];
  selectedLeagueId?: number;
  onSelect: (league: LeagueOption) => void;
};

export default function LeagueStrip({
  leagues,
  selectedLeagueId,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {leagues.map((league) => {
        const active = league.leagueId === selectedLeagueId;
        const logo = (league as any)?.logo ? String((league as any).logo) : "";

        return (
          <Pressable
            key={league.leagueId}
            onPress={() => onSelect(league)}
            style={({ pressed }) => [
              styles.item,
              active && styles.itemActive,
              pressed && styles.itemPressed,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.08)" }}
          >
            <View style={styles.inner}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
              ) : (
                <Text style={[styles.fallbackText, active && styles.fallbackTextActive]}>
                  {String(league.label ?? "?").slice(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingRight: theme.spacing.lg,
    gap: 10,
  },

  item: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: theme.colors.bgSurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    overflow: "hidden",
  },

  itemActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: theme.colors.bgElevated,
  },

  itemPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
  },

  inner: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
  },

  logo: {
    width: 30,
    height: 30,
  },

  fallbackText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  fallbackTextActive: {
    color: theme.colors.text,
  },
});
