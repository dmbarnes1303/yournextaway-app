import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import walletStore, { WalletTicket } from "@/src/state/walletStore";

export default function WalletScreen() {
  const [pending, setPending] = useState<WalletTicket[]>([]);
  const [booked, setBooked] = useState<WalletTicket[]>([]);

  const load = useCallback(async () => {
    const p = await walletStore.getPendingTickets();
    const b = await walletStore.getBookedTickets();
    setPending(p);
    setBooked(b);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function open(url?: string | null) {
    if (!url) return;
    Linking.openURL(url);
  }

  function TicketCard({ t }: { t: WalletTicket }) {
    return (
      <GlassCard style={styles.card}>
        <Text style={styles.title}>{t.title}</Text>

        <Text style={styles.meta}>
          {t.home} vs {t.away}
        </Text>

        {t.kickoffIso ? (
          <Text style={styles.meta}>{new Date(t.kickoffIso).toLocaleString()}</Text>
        ) : null}

        <Text style={styles.provider}>{t.provider ?? "provider"}</Text>

        <View style={styles.row}>
          {t.url ? (
            <Pressable style={styles.btn} onPress={() => open(t.url)}>
              <Text style={styles.btnText}>Open</Text>
            </Pressable>
          ) : null}

          {t.status === "pending" ? (
            <View style={styles.pending}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          ) : (
            <View style={styles.booked}>
              <Text style={styles.bookedText}>Booked</Text>
            </View>
          )}
        </View>
      </GlassCard>
    );
  }

  return (
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.9}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
            paddingBottom: 100,
          }}
        >
          <Text style={styles.section}>Pending tickets</Text>
          {pending.length === 0 ? (
            <Text style={styles.empty}>No pending tickets</Text>
          ) : (
            pending.map((t) => <TicketCard key={t.id} t={t} />)
          )}

          <Text style={styles.section}>Booked tickets</Text>
          {booked.length === 0 ? (
            <Text style={styles.empty}>No booked tickets</Text>
          ) : (
            booked.map((t) => <TicketCard key={t.id} t={t} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  section: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  empty: {
    color: theme.colors.textSecondary,
  },
  card: {
    gap: 6,
  },
  title: {
    color: theme.colors.text,
    fontWeight: "900",
  },
  meta: {
    color: theme.colors.textSecondary,
  },
  provider: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  btn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  pending: {
    backgroundColor: "rgba(255,200,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingText: {
    color: "#FFD54A",
    fontWeight: "900",
  },
  booked: {
    backgroundColor: "rgba(0,255,136,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookedText: {
    color: "#00FF88",
    fontWeight: "900",
  },
});
