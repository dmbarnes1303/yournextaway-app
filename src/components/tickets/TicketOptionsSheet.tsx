import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
} from "react-native";

import { theme } from "@/src/constants/theme";
import type { TicketResolutionOption } from "@/src/services/ticketResolver";

type Props = {
  visible: boolean;
  onClose: () => void;
  options: TicketResolutionOption[];
  matchLabel: string;
  onSelect: (option: TicketResolutionOption) => void;
  onCompareAll: () => void;
};

export default function TicketOptionsSheet({
  visible,
  onClose,
  options,
  matchLabel,
  onSelect,
  onCompareAll,
}: Props) {
  const topOptions = options.slice(0, 3);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{matchLabel}</Text>
          <Text style={styles.subtitle}>Compare ticket providers</Text>

          <FlatList
            data={topOptions}
            keyExtractor={(item, i) => `${item.provider}-${i}`}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => onSelect(item)}
              >
                <View style={styles.row}>
                  <Text style={styles.provider}>
                    {item.provider}
                  </Text>
                  {item.priceText ? (
                    <Text style={styles.price}>{item.priceText}</Text>
                  ) : null}
                </View>

                <Text style={styles.cta}>View tickets →</Text>
              </Pressable>
            )}
          />

          <Pressable style={styles.secondary} onPress={onCompareAll}>
            <Text style={styles.secondaryText}>Compare all options</Text>
          </Pressable>

          <Pressable onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  sheet: {
    backgroundColor: "#0B1020",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  provider: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },

  price: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.accent,
  },

  cta: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  secondary: {
    marginTop: 6,
    padding: 12,
    alignItems: "center",
  },

  secondaryText: {
    color: theme.colors.accent,
    fontWeight: "800",
  },

  close: {
    textAlign: "center",
    color: theme.colors.textMuted,
    marginTop: 8,
  },
});
