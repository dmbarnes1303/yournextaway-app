import React from "react";
import { View, ScrollView, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LEAGUES } from "@/src/constants/football";
import { theme } from "@/src/constants/theme";

export default function LeagueStrip() {
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {LEAGUES.slice(0, 12).map((league) => (
        <Pressable
          key={league.leagueId}
          onPress={() =>
            router.push({
              pathname: "/fixtures",
              params: { leagueId: league.leagueId },
            } as any)
          }
          style={styles.item}
        >
          <Image
            source={{ uri: league.logo }}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: theme.spacing.lg,
    gap: 14,
  },

  item: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.bgSurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  logo: {
    width: 32,
    height: 32,
  },
});
