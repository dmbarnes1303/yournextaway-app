// app/landing.tsx
import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/YNAlogo.png");
const HERO = require("@/src/assets/backgrounds/onboarding-hero.jpg");

export default function Landing() {
  const router = useRouter();

  const handleStart = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <Image source={HERO} style={styles.bgImage} resizeMode="cover" />

        <LinearGradient
          colors={[
            "rgba(0,0,0,0.82)",
            "rgba(0,0,0,0.44)",
            "rgba(0,0,0,0.90)",
          ]}
          locations={[0, 0.46, 1]}
          style={styles.overlay}
        />

        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.top}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

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

          <View style={styles.bottom}>
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.pressed,
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.08)" }}
            >
              <Text style={styles.ctaText}>Start Exploring</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  safe: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 18,
  },

  top: {
    alignItems: "center",
    marginTop: 6,
  },

  logo: {
    width: 88,
    height: 88,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 88,
  },

  headline: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.5,
    maxWidth: 340,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  body: {
    marginTop: 18,
    color: "rgba(255,255,255,0.88)",
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "500",
    maxWidth: 345,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  bottom: {
    paddingBottom: 6,
  },

  cta: {
    minHeight: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(116,255,181,0.34)",
    backgroundColor: "rgba(31,133,84,0.30)",
    shadowColor: "#63ffb0",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },

  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
});
