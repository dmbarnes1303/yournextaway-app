// app/onboarding.tsx
import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/YNAlogo.png");
const HERO = require("@/src/assets/backgrounds/onboarding-hero.jpg");

export default function Onboarding() {
  const router = useRouter();

  const goHome = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={HERO} overlayOpacity={0.7}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          
          {/* Top logo */}
          <View style={styles.top}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Main content */}
          <View style={styles.content}>
            <Text style={styles.headline}>
              Your European Football Trip Planner
            </Text>

            <Text style={styles.body}>
              Discover fixtures across Europe, then build the whole trip around
              them — tickets, flights, stays, and in-depth city and team guides
              from 30 top-flight European leagues.
            </Text>
          </View>

          {/* CTA */}
          <View style={styles.bottom}>
            <Pressable
              onPress={goHome}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.ctaText}>Start Exploring</Text>
            </Pressable>
          </View>

        </SafeAreaView>
      </Background>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },

  top: {
    alignItems: "center",
    marginTop: 10,
  },

  logo: {
    width: 90,
    height: 90,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
  },

  headline: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "left",
  },

  body: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    maxWidth: 520,
  },

  bottom: {
    marginBottom: 10,
  },

  cta: {
    backgroundColor: "rgba(79,224,138,0.18)",
    borderColor: "rgba(79,224,138,0.4)",
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },

  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
