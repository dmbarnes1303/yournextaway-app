// app/(tabs)/wallet.tsx
import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

type PillProps = {
  label: string;
  value: string;
};

function Pill({ label, value }: PillProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

type SlotProps = {
  title: string;
  description: string;
  status?: string;
};

function Slot({ title, description, status = "Coming soon" }: SlotProps) {
  return (
    <View style={styles.slot}>
      <View style={styles.slotTop}>
        <Text style={styles.slotTitle}>{title}</Text>
        <View style={styles.slotBadge}>
          <Text style={styles.slotBadgeText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.slotDesc}>{description}</Text>
    </View>
  );
}

export default function WalletScreen() {
  const subtitle = useMemo(() => "Tickets, passes, and booking references", []);

  const showHowItWorks = useCallback(() => {
    Alert.alert(
      "Wallet (coming soon)",
      "This is where your match tickets, transport/hotel references, and any digital passes will live.\n\nFor now, this is a preview screen so you can see the structure."
    );
  }, []);

  const showAddDemo = useCallback(() => {
    Alert.alert(
      "Demo only",
      "Ticket storage isn’t wired up yet.\n\nWhen it is, you’ll be able to save confirmations here from your trips."
    );
  }, []);

  return (
    <Background imageUrl={getBackground("wallet")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.pillsRow}>
              <Pill label="Items" value="0" />
              <Pill label="Trips" value="—" />
              <Pill label="Status" value="Preview" />
            </View>
          </View>

          {/* PRIMARY CARD */}
          <GlassCard style={styles.card} strength="default">
            <Text style={styles.cardTitle}>Your trip essentials, in one place</Text>
            <Text style={styles.cardBody}>
              When you’re travelling, you don’t want to dig through emails. Wallet will store confirmations and passes
              so you can leave the house with confidence.
            </Text>

            <View style={styles.btnRow}>
              <Pressable onPress={showAddDemo} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Add (demo)</Text>
                <Text style={styles.btnMeta}>Not stored yet</Text>
              </Pressable>

              <Pressable onPress={showHowItWorks} style={[styles.btn, styles.btnSecondary]}>
                <Text style={styles.btnSecondaryText}>How it works</Text>
                <Text style={styles.btnMeta}>What will appear here</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.slotList}>
              <Slot title="Match tickets" description="QR codes, PDFs, and entry details for the match." />
              <Slot title="Transport" description="Flights, trains, and transfer confirmations." />
              <Slot title="Stay" description="Hotel references, check-in details, and address links." />
            </View>
          </GlassCard>

          {/* EMPTY / CONTENT AREA */}
          <GlassCard style={styles.card} strength="subtle">
            <EmptyState title="Nothing saved yet" message="When ticket and booking storage is enabled, your items will show up here." />
            <Text style={styles.smallNote}>
              Tip: build a trip first — Wallet will eventually pull items directly from your Trip hub.
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
    gap: 8,
  },

  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
  },

  pillsRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 10,
  },

  pill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 46,
    justifyContent: "center",
  },
  pillLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    lineHeight: 14,
  },
  pillValue: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  card: { padding: theme.spacing.lg },

  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
  },

  cardBody: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },

  btnRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  btn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 2,
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.50)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  btnPrimaryText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  btnSecondaryText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  btnMeta: {
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
  },

  divider: {
    marginTop: 16,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  slotList: { marginTop: 14, gap: 12 },

  slot: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },

  slotTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  slotTitle: { flex: 1, color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.black },

  slotBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  slotBadgeText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black },

  slotDesc: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  smallNote: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
    fontWeight: "800",
  },
});
