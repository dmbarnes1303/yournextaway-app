// src/components/BackButton.tsx
import React, { useCallback } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
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
  const navigation = useNavigation();

  const goBackSafe = useCallback(() => {
    try {
      // React Navigation is the source of truth for back-stack on native.
      // Expo Router's router.canGoBack() can be flaky with replace/push flows.
      // @ts-expect-error: typing depends on your nav container; safe at runtime.
      if (navigation?.canGoBack?.() === true) {
        // @ts-expect-error
        navigation.goBack();
        return;
      }
    } catch {
      // fall through
    }

    try {
      router.replace(fallbackHref);
    } catch {
      // If this fails, there's nothing else sane to do.
    }
  }, [navigation, router, fallbackHref]);

  const hardExit = useCallback(() => {
    try {
      router.replace(hardHref);
    } catch {
      // nothing else sensible to do
    }
  }, [router, hardHref]);

  return (
    <View pointerEvents="box-none">
      <Pressable
        onPress={goBackSafe}
        onLongPress={hardExit}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        hitSlop={18}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.text}>← {label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginLeft: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.35)",
    minHeight: 40,
    justifyContent: "center",
  },
  btnPressed: {
    backgroundColor: "rgba(0,0,0,0.50)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  text: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },
});
