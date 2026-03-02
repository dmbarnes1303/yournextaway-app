// src/components/SelectModal.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";

export type SelectOption = { label: string; value: string };

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: SelectOption[];
  selectedValue?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  allowClear?: boolean;
  clearValue?: string; // default "Not Set"
  clearLabel?: string; // default "Clear"
  searchPlaceholder?: string; // default "Search…"
};

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

export default function SelectModal({
  visible,
  title,
  subtitle,
  options,
  selectedValue,
  onClose,
  onSelect,
  allowClear,
  clearValue = "Not Set",
  clearLabel = "Clear",
  searchPlaceholder = "Search…",
}: Props) {
  const { height: screenH, width: screenW } = useWindowDimensions();
  const [q, setQ] = useState("");

  const modalWidth = Math.min(screenW - 32, 560);
  const modalHeight = Math.min(Math.max(440, Math.floor(screenH * 0.74)), 680);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => norm(o.label).includes(s) || norm(o.value).includes(s));
  }, [options, q]);

  const onPick = useCallback(
    (value: string) => {
      onSelect(value);
      setQ("");
      onClose();
    },
    [onClose, onSelect]
  );

  const renderItem = useCallback(
    ({ item }: { item: SelectOption }) => {
      const active = selectedValue === item.value;

      return (
        <Pressable
          onPress={() => onPick(item.value)}
          style={({ pressed }) => [
            styles.pickRow,
            active && styles.pickRowActive,
            pressed && { opacity: 0.92 },
          ]}
          android_ripple={{ color: "rgba(255,255,255,0.04)" }}
        >
          <Text style={[styles.pickRowText, active && styles.pickRowTextActive]} numberOfLines={1}>
            {item.label}
          </Text>
          {active ? <Text style={styles.pickTick}>✓</Text> : null}
        </Pressable>
      );
    },
    [onPick, selectedValue]
  );

  const Empty = useMemo(() => {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No matches</Text>
        <Text style={styles.emptySubtitle}>Try a different search.</Text>
      </View>
    );
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <GlassCard
          style={[styles.modalCard, { width: modalWidth, height: modalHeight }]}
          level="strong"
          variant="glass"
          forceBlur
          noPadding
        >
          <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{title}</Text>
                {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
              </View>

              <Button label="Close" tone="secondary" size="sm" onPress={onClose} />
            </View>

            <Input
              value={q}
              onChangeText={setQ}
              placeholder={searchPlaceholder}
              leftIcon="search"
              allowClear
              variant="default"
              returnKeyType="search"
            />

            <View style={styles.listArea}>
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.value}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                style={styles.pickList}
                contentContainerStyle={[
                  styles.pickListContent,
                  filtered.length === 0 ? { flexGrow: 1 } : null,
                ]}
                ListEmptyComponent={Empty}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {allowClear ? (
              <View style={styles.footer}>
                <Button
                  label={clearLabel}
                  tone="secondary"
                  size="md"
                  onPress={() => onPick(clearValue)}
                  style={{ flex: 1 }}
                />
              </View>
            ) : null}
          </View>
        </GlassCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrap: { flex: 1, justifyContent: "center", padding: 16 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.60)" },

  modalCard: {
    alignSelf: "center",
    borderRadius: theme.borderRadius.sheet,
    overflow: "hidden",
  },

  modalInner: {
    padding: 14,
    gap: 12,
    flex: 1,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h2,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.2,
  },

  modalSubtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
    lineHeight: 18,
  },

  listArea: { flex: 1, minHeight: 220 },

  pickList: {
    flex: 1,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
  },

  pickListContent: { paddingBottom: 8 },

  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },

  pickRowActive: {
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  pickRowText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
  },

  pickRowTextActive: {
    color: theme.colors.textPrimary,
  },

  pickTick: {
    marginLeft: 10,
    color: theme.colors.accentGreen,
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
  },

  footer: {
    paddingTop: 2,
  },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.body,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.meta,
    textAlign: "center",
    lineHeight: 18,
  },
});
