import React, { ReactNode, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { theme } from "@/src/constants/theme";
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
    // If you pass a rightSlot, we usually don’t want a chevron too (looks cluttered).
    if (rightSlot) return null;
    return (
      <IconSymbol
        ios_icon_name="chevron.right"
        android_material_icon_name="chevron-right"
        size={20}
        color={theme.colors.textTertiary}
      />
    );
  }, [rightSlot, showChevron]);

  const content = (
    <View style={[styles.container, dense && styles.containerDense, style]}>
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

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  containerDense: {
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
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },

  subtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  rightSlot: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  bottomSlot: {
    marginTop: theme.spacing.sm,
  },
});
