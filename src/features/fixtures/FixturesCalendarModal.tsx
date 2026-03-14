import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";

import Button from "@/src/components/Button";
import { theme } from "@/src/constants/theme";
import { formatFixtureDateDisplay, formatFixtureDateRangeDisplay } from "./helpers";

type CalendarCell = {
  iso: string;
  day: number;
  inMonth: boolean;
};

function formatCalendarSubtitle(raw: string) {
  const value = String(raw ?? "").trim();
  if (!value) return "Choose a day or date range";

  const rangeMatch = value.match(/^Range:\s*(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    return `Range: ${formatFixtureDateRangeDisplay(rangeMatch[1], rangeMatch[2])}`;
  }

  const dayMatch = value.match(/^Day:\s*(\d{4}-\d{2}-\d{2})$/);
  if (dayMatch) {
    return `Day: ${formatFixtureDateDisplay(dayMatch[1])}`;
  }

  return value;
}

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
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheetWrap} pointerEvents="box-none">
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{formatCalendarSubtitle(subtitle)}</Text>
              </View>

              <Button label="Close" tone="ghost" size="sm" onPress={onClose} />
            </View>

            <View style={styles.monthRow}>
              <Pressable onPress={onPrevMonth} style={styles.navBtn} hitSlop={10}>
                <Text style={styles.navText}>‹</Text>
              </Pressable>

              <Text style={styles.monthText}>{monthText}</Text>

              <Pressable onPress={onNextMonth} style={styles.navBtn} hitSlop={10}>
                <Text style={styles.navText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                <Text key={w} style={styles.weekText}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {grid.map((cell, idx) => {
                if (!cell.inMonth) {
                  return <View key={`empty-${idx}`} style={styles.cell} />;
                }

                const iso = cell.iso;
                const disabled = iso < minIso || iso > maxIso;
                const inRange = !disabled && calInRange(iso);
                const edge = !disabled && calIsEdge(iso);

                return (
                  <View key={iso} style={styles.cell}>
                    <Pressable
                      disabled={disabled}
                      onPress={() => onTapDay(iso)}
                      style={[
                        styles.dayBtn,
                        inRange && styles.dayBtnInRange,
                        edge && styles.dayBtnEdge,
                        disabled && styles.dayBtnDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          inRange && styles.dayTextInRange,
                          edge && styles.dayTextEdge,
                          disabled && styles.dayTextDisabled,
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Button
                label="Clear"
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

            <Text style={styles.footnote}>
              Tap two different days to create a range. Tap the same day flow again to go back to
              a single date.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4,6,8,0.78)",
    justifyContent: "flex-end",
  },

  sheetWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },

  sheet: {
    backgroundColor: "#121714",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  headerTextWrap: {
    flex: 1,
    gap: 4,
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h2,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
    lineHeight: 20,
  },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#181E1A",
    alignItems: "center",
    justifyContent: "center",
  },

  navText: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: theme.fontWeight.black,
    marginTop: -2,
  },

  monthText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.black,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  weekText: {
    width: "14.285%",
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  cell: {
    width: "14.285%",
    aspectRatio: 1,
    padding: 4,
  },

  dayBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#181E1A",
    alignItems: "center",
    justifyContent: "center",
  },

  dayBtnInRange: {
    backgroundColor: "rgba(87,162,56,0.08)",
    borderColor: "rgba(87,162,56,0.16)",
  },

  dayBtnEdge: {
    backgroundColor: "rgba(87,162,56,0.18)",
    borderColor: "rgba(87,162,56,0.34)",
  },

  dayBtnDisabled: {
    backgroundColor: "#141815",
    borderColor: "rgba(255,255,255,0.04)",
  },

  dayText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  dayTextInRange: {
    color: theme.colors.textPrimary,
  },

  dayTextEdge: {
    color: theme.colors.textPrimary,
  },

  dayTextDisabled: {
    color: "rgba(255,255,255,0.22)",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },

  footnote: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.medium,
    lineHeight: 16,
  },
});
