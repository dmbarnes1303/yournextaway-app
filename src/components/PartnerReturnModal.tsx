import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { attachTicketProof } from "@/src/services/ticketAttachment";

type Props = {
  visible: boolean;
  itemId: string | null;
  onBooked: (itemId: string) => Promise<void>;
  onClose: () => void;
};

export default function PartnerReturnModal({
  visible,
  itemId,
  onBooked,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBooked() {
    if (!itemId) return;

    setLoading(true);

    await onBooked(itemId);

    // ask for attachment
    await attachTicketProof(itemId);

    setLoading(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Did you complete booking?</Text>

          {loading ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.row}>
              <Pressable style={styles.noBtn} onPress={onClose}>
                <Text style={styles.noText}>Not yet</Text>
              </Pressable>

              <Pressable style={styles.yesBtn} onPress={handleBooked}>
                <Text style={styles.yesText}>Yes, booked</Text>
              </Pressable>
            </View>
          )}
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
