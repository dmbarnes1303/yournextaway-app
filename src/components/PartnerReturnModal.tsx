import React from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { theme } from "@/src/constants/theme";

type Props = {
  visible: boolean;
  onBooked: () => void;
  onNotBooked: () => void;
};

export default function PartnerReturnModal({
  visible,
  onBooked,
  onNotBooked,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Did you complete booking?</Text>

          <View style={styles.row}>
            <Pressable style={styles.noBtn} onPress={onNotBooked}>
              <Text style={styles.noText}>Not yet</Text>
            </Pressable>

            <Pressable style={styles.yesBtn} onPress={onBooked}>
              <Text style={styles.yesText}>Yes, booked</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  title: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  yesBtn: {
    flex: 1,
    backgroundColor: "rgba(0,255,136,0.2)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  yesText: {
    color: "#00FF88",
    fontWeight: "900",
  },
  noBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  noText: {
    color: "#fff",
    fontWeight: "800",
  },
});
