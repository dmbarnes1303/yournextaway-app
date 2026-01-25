// src/components/SelectModal.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";

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

  const modalWidth = Math.min(screenW - 32, 520);
  const modalHeight = Math.min(Math.max(420, Math.floor(screenH * 0.72)), 640);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)
    );
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
          style={[styles.pickRow, active && styles.pickRowActive]}
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalWrap}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <GlassCard style={[styles.modalCard, { width: modalWidth, height: modalHeight }]} intensity={26}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>

            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={searchPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.40)"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

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
            <Pressable onPress={() => onPick(clearValue)} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>{clearLabel}</Text>
            </Pressable>
          ) : null}
        </GlassCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrap: { flex: 1, justifyContent: "center", padding: 16 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },

  modalCard: { padding: 14, borderRadius: 18, alignSelf: "center" },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
  },

  modalSubtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  modalCloseBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  modalCloseText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
  },

  searchWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },

  searchInput: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
    padding: 0,
  },

  listArea: { flex: 1, minHeight: 200 },

  pickList: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
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
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  pickRowActive: { backgroundColor: "rgba(0,255,136,0.08)" },

  pickRowText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
  },

  pickRowTextActive: { color: theme.colors.text },

  pickTick: {
    marginLeft: 10,
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: theme.fontWeight.black,
  },

  clearBtn: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 12,
    alignItems: "center",
  },

  clearBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
  },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  emptyTitle: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
    textAlign: "center",
    lineHeight: 18,
  },
});
