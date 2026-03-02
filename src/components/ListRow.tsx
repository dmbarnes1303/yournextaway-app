// src/components/ListRow.tsx
import React, { ReactNode, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, type ViewStyle } from "react-native";
import { theme } from "@/src/constants/theme";
import GlassCard from "@/src/components/GlassCard";
import { IconSymbol } from "@/components/IconSymbol";

interface ListRowProps {
  title: string;
  subtitle?: string;

  onPress?: () => void;
  showChevron?: boolean;

  /** Optional: right-side content (e.g. Switch, badge, count, etc.) */
  rightSlot?: ReactNode;

  /** Optional: content below title/subtitle (e.g. chips row) */
  bottomSlot?: ReactNode;

  /** Optional: override row container styling */
  style?: ViewStyle;

  /** Optional: if true, makes the row more compact */
  dense?: boolean;
}

export default function ListRow({
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightSlot,
  bottomSlot,
  style,
  dense = false,
}: ListRowProps) {
  const chevron = useMemo(() => {
    if (!showChevron) return null;
    if (rightSlot) return null;
    return (
      <IconSymbol
        ios_icon_name="chevron.right"
        android_material_icon_name="chevron-right"
        size={18}
        color={theme.colors.textMuted}
      />
    );
  }, [rightSlot, showChevron]);

  const body = (
    <View style={[styles.inner, dense && styles.innerDense]}>
      <View style={styles.mainRow}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
        {chevron}
      </View>

      {bottomSlot ? <View style={styles.bottomSlot}>{bottomSlot}</View> : null}
    </View>
  );

  return (
    <GlassCard style={[styles.card, style]} level="default" variant="matte" noPadding>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.press, pressed && styles.pressPressed]}
          android_ripple={{ color: "rgba(255,255,255,0.04)" }}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.card,
    overflow: "hidden",
  },

  press: {
    borderRadius: theme.borderRadius.card,
    overflow: "hidden",
  },

  pressPressed: {
    opacity: 0.96,
  },

  inner: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },

  innerDense: {
    paddingVertical: theme.spacing.sm,
  },

  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    letterSpacing: 0.1,
  },

  subtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.meta,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  rightSlot: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  bottomSlot: {
    marginTop: theme.spacing.sm,
  },
});
