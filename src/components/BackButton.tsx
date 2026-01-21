import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/src/constants/theme";

type Props = {
  fallbackHref?: string; // where to go if there's no back history
  label?: string;
  hardHref?: string; // long-press escape hatch
};

export default function BackButton({
  fallbackHref = "/(tabs)/home",
  hardHref = "/(tabs)/home",
  label = "Back",
}: Props) {
  const router = useRouter();

  const goBackSafe = () => {
    try {
      if (router.canGoBack()) router.back();
      else router.replace(fallbackHref);
    } catch {
      router.replace(fallbackHref);
    }
  };

  const hardExit = () => {
    try {
      router.replace(hardHref);
    } catch {
      // nothing else sensible to do
    }
  };

  return (
    <Pressable onPress={goBackSafe} onLongPress={hardExit} style={styles.btn} hitSlop={12}>
      <Text style={styles.text}>← {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  text: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },
});
