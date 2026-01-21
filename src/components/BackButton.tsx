import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/src/constants/theme";

type Props = {
  fallbackHref?: string; // where to go if there's no back history
  label?: string;
};

export default function BackButton({ fallbackHref = "/(tabs)/home", label = "Back" }: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace(fallbackHref);
      }}
      style={styles.btn}
      hitSlop={12}
    >
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
