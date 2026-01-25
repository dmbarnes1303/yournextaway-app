import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const boot = async () => {
      try {
        const completed = await AsyncStorage.getItem("hasCompletedOnboarding");

        if (completed === "true") {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/landing");
        }
      } catch {
        router.replace("/landing");
      }
    };

    boot();
  }, []);

  return null;
}
