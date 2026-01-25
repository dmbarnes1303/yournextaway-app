import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/src/constants/theme";

/**
 * Root bootstrapper.
 * Decides whether user goes to Landing or straight into app.
 */

const STORAGE_KEY = "onboardingComplete";

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    check();
  }, []);

  async function check() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);

      if (value === "true") {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/landing");
      }
    } catch (e) {
      router.replace("/landing");
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return null;
}
