// app/(tabs)/wallet.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

export default function WalletScreen() {
  const subtitle = useMemo(() => "Tickets, passes, and booking references", []);

  function showHowItWorks() {
    Alert.alert(
      "Wallet (coming soon)",
      "This is where your match tickets, transport/hotel references, and any digital passes will live.\n\nFor now, it’s a preview screen so you can see the structure."
    );
  }

  function showAddDemo() {
    Alert.alert(
      "Demo only",
      "Ticket storage isn’t wired up yet.\n\nWhen it is, you’ll be able to save confirmations here from your trips."
    );
  }

  return (
    <Background imageUrl={getBackground("wallet")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.cardTitle}>What this page is for</Text>
            <Text style={styles.cardBody}>
              Keep everything you need for a trip in one place — tickets, QR codes, booking references, and important confirmations.
              This will become your “leave the house with confidence” screen.
            </Text>

            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Soon</Text>
                <Text style={styles.pillText}>Match tickets</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Soon</Text>
                <Text style={styles.pillText}>Flights / trains</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillKicker}>Soon</Text>
                <Text style={styles.pillText}>Hotels</Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Pressable onPress={showHowItWorks} style={[styles.btn, styles.btnSecondary]}>
                <Text style={styles.btnSecondaryText}>How it works</Text>
              </Pressable>
              <Pressable onPress={showAddDemo} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Add (demo)</Text>
              </Pressable>
            </View>
          </GlassCard>

          <GlassCard style={styles.card} intensity={22}>
            <EmptyState title="No tickets yet" message="When you save a trip, your confirmations will show up here." />
            <View style={{ height: 6 }} />
            <Text style={styles.smallNote}>
              Tip: For now, try building a trip from Fixtures — the flow is what you’re testing tonight.
            </Text>
          </GlassCard>

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },

  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  card: { padding: theme.spacing.md },

  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: "900",
  },

  cardBody: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  pillRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  pillKicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  pillText: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "800",
  },

  btnRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  btnSecondaryText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.50)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
  },

  smallNote: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
  },
});
