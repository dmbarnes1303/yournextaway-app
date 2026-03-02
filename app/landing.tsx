// app/landing.tsx
import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";

const LOGO = require("@/src/yna-logo.png");

// IMPORTANT: Unsplash "download?force=true" links can be temperamental.
// Use images.unsplash.com (direct JPG) for stability + caching.
const LANDING_BG = {
  uri: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80",
};

function PillButton({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant: "primary" | "ghost";
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        primary ? styles.btnPrimary : styles.btnGhost,
        pressed && styles.pressed,
      ]}
      android_ripple={{ color: primary ? "rgba(79,224,138,0.14)" : "rgba(255,255,255,0.10)" }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.btnText, primary ? styles.btnPrimaryText : styles.btnGhostText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Landing() {
  const router = useRouter();

  const handleStart = useCallback(() => {
    router.push("/onboarding" as any);
  }, [router]);

  const handleSkip = useCallback(() => {
    router.replace("/(tabs)/home" as any);
  }, [router]);

  const motto = useMemo(() => {
    // Your original motto is a bit “2018 sports poster”.
    // This keeps the vibe but reads more premium.
    return "Fixtures • City guides • Trip workspace";
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={LANDING_BG} overlayOpacity={0.66}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.screen}>
            {/* Brand */}
            <View style={styles.brand}>
              <View style={styles.logoWrap}>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              </View>

              <Text style={styles.brandTitle}>YourNextAway</Text>
              <Text style={styles.brandMotto}>{motto}</Text>
            </View>

            {/* Main card */}
            <View style={styles.center}>
              <GlassCard style={styles.card} noPadding>
                <View style={styles.cardInner}>
                  <Text style={styles.kicker}>FOOTBALL-FIRST TRAVEL PLANNING</Text>

                  <Text style={styles.h1}>
                    Pick a match.
                    {"\n"}Build the trip around it.
                  </Text>

                  <Text style={styles.body}>
                    Browse upcoming fixtures across Europe, then organise the whole city break in one place — with guides
                    made for match weekends.
                  </Text>

                  <View style={styles.actions}>
                    <PillButton label="Get started" onPress={handleStart} variant="primary" />
                    <PillButton label="Skip for now" onPress={handleSkip} variant="ghost" />
                  </View>

                  <Text style={styles.note}>
                    You can disable this landing screen later in Profile.
                  </Text>
                </View>
              </GlassCard>
            </View>

            <View style={styles.footerSpacer} />
          </View>
        </SafeAreaView>
      </Background>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  screen: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    justifyContent: "space-between",
    gap: 14,
  },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },

  brand: { alignItems: "center", gap: 10 },

  logoWrap: {
    width: 112,
    height: 112,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: 92, height: 92, opacity: 0.98 },

  brandTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },
  brandMotto: {
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.2,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 6,
  },

  card: {
    borderRadius: 26,
    overflow: "hidden",
  },
  cardInner: {
    padding: theme.spacing.lg,
    gap: 12,
  },

  kicker: {
    alignSelf: "center",
    color: "rgba(79,224,138,0.74)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.9,
  },

  h1: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  body: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  actions: {
    marginTop: 6,
    flexDirection: "row",
    gap: 12,
  },

  btn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  btnPrimary: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnText: {
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  btnPrimaryText: { color: theme.colors.text },
  btnGhostText: { color: theme.colors.textSecondary },

  note: {
    marginTop: 2,
    textAlign: "center",
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 16,
  },

  footerSpacer: { height: 12 },
});
