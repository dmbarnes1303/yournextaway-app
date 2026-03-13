import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import Button from "@/src/components/Button";
import { theme } from "@/src/constants/theme";

type CalendarCell = {
  iso: string;
  day: number;
  inMonth: boolean;
};

export default function FixturesCalendarModal({
  visible,
  onClose,
  title = "Select dates",
  subtitle,
  monthText,
  grid,
  minIso,
  maxIso,
  calIsRange,
  calInRange,
  calIsEdge,
  onPrevMonth,
  onNextMonth,
  onTapDay,
  onClearRange,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle: string;
  monthText: string;
  grid: CalendarCell[];
  minIso: string;
  maxIso: string;
  calIsRange: boolean;
  calInRange: (iso: string) => boolean;
  calIsEdge: (iso: string) => boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTapDay: (iso: string) => void;
  onClearRange: () => void;
  onApply: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalWrap} pointerEvents="box-none">
        <GlassCard level="strong" variant="glass" forceBlur style={styles.modalSheet}>
          <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Button label="Close" tone="ghost" size="sm" onPress={onClose} />
            </View>

            <Text style={styles.modalSub}>{subtitle}</Text>

            <View style={styles.calHeaderRow}>
              <Pressable onPress={onPrevMonth} style={styles.calNavBtn} hitSlop={10}>
                <Text style={styles.calNavText}>‹</Text>
              </Pressable>

              <Text style={styles.calMonthText}>{monthText}</Text>

              <Pressable onPress={onNextMonth} style={styles.calNavBtn} hitSlop={10}>
                <Text style={styles.calNavText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.calWeekRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                <Text key={w} style={styles.calWeekText}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {grid.map((cell, idx) => {
                if (!cell.inMonth) {
                  return <View key={`e-${idx}`} style={styles.calCell} />;
                }

                const iso = cell.iso;
                const disabled = iso < minIso || iso > maxIso;
                const inSel = !disabled && calInRange(iso);
                const edge = !disabled && calIsEdge(iso);

                return (
                  <Pressable
                    key={iso}
                    disabled={disabled}
                    onPress={() => onTapDay(iso)}
                    style={[
                      styles.calCell,
                      styles.calDayBtn,
                      inSel && styles.calDayInRange,
                      edge && styles.calDayEdge,
                      disabled && styles.calDayDisabled,
                    ]}
                  >
                    <Text style={[styles.calDayText, edge && styles.calDayTextEdge]}>
                      {cell.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Button
                label="Clear range"
                tone="secondary"
                size="md"
                onPress={onClearRange}
                style={{ flex: 1 }}
              />
              <Button
                label={calIsRange ? "Apply range" : "Apply day"}
                tone="primary"
                size="md"
                glow
                onPress={onApply}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={styles.modalFootnote}>
              Tip: tap two different days to set a range. Tap again to reset back to a single day.
            </Text>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  modalWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalSheet: {
    borderRadius: 22,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  modalInner: {
    padding: 14,
    gap: 12,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h2,
    fontWeight: theme.fontWeight.semibold,
  },

  modalSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
  },

  calHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },

  calNavText: {
    color: theme.colors.textSecondary,
    fontSize: 20,
    fontWeight: theme.fontWeight.semibold,
    marginTop: -2,
  },

  calMonthText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.semibold,
  },

  calWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },

  calWeekText: {
    width: "14.285%",
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
  },

  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  calCell: {
    width: "14.285%",
    aspectRatio: 1,
    padding: 4,
  },

  calDayBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },

  calDayInRange: {
    backgroundColor: "rgba(87,162,56,0.06)",
  },

  calDayEdge: {
    borderColor: "rgba(87,162,56,0.30)",
    backgroundColor: "rgba(87,162,56,0.12)",
  },

  calDayDisabled: {
    opacity: 0.35,
  },

  calDayText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 12,
  },

  calDayTextEdge: {
    color: theme.colors.textPrimary,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  modalFootnote: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    lineHeight: 16,
  },
});
