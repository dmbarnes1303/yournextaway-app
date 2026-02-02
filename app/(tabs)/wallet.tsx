// app/(tabs)/wallet.tsx

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import useFollowStore from "@/src/state/followStore";

export default function WalletScreen() {
  const subtitle = useMemo(() => "Tickets, passes, and booking references", []);

  // SAFE: primitive selector, stable, no derived arrays/objects in selector
  const followingCount = useFollowStore((s) => s.followed.length);

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
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statKicker}>Items</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statKicker}>Following</Text>
              <Text style={styles.statValue}>{followingCount}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statKicker}>Status</Text>
              <Text style={styles.statValue}>Preview</Text>
            </View>
          </View>

          <GlassCard style={styles.card} strength="default">
            <Text style={styles.cardTitle}>Your trip essentials, in one place</Text>
            <Text style={styles.cardBody}>
              When you’re travelling, you don’t want to dig through emails. Wallet will store confirmations and passes so you can leave the house with confidence.
            </Text>

            <View style={styles.btnRow}>
              <Pressable onPress={showHowItWorks} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>How it works</Text>
                <Text style={styles.btnHint}>What will appear here</Text>
              </Pressable>

              <Pressable onPress={showAddDemo} style={[styles.btn, styles.btnSecondary]}>
                <Text style={styles.btnSecondaryText}>Add (demo)</Text>
                <Text style={styles.btnHint}>Not stored yet</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.previewList}>
              <View style={styles.previewRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>Match tickets</Text>
                  <Text style={styles.previewText}>QR codes, PDFs, and entry details for the match.</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Coming soon</Text>
                </View>
              </View>

              <View style={styles.previewRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>Transport</Text>
                  <Text style={styles.previewText}>Flights, trains, and transfer confirmations.</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Coming soon</Text>
                </View>
              </View>

              <View style={styles.previewRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>Stay</Text>
                  <Text style={styles.previewText}>Hotel references, check-in details, and address links.</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Coming soon</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.card} strength="subtle">
            <EmptyState title="Nothing saved yet" message="When ticket and booking storage is enabled, your items will show up here." />
            <Text style={styles.smallNote}>Tip: build a trip first — Wallet will eventually pull items directly from your Trip hub.</Text>
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

  header: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xs },

  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold },

  statsRow: { flexDirection: "row", gap: 10 },
  statPill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900" },
  statValue: { marginTop: 4, color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },

  card: { padding: theme.spacing.lg },

  cardTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },
  cardBody: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  btnRow: { marginTop: 14, flexDirection: "row", gap: 10 },

  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  btnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.34)" },
  btnPrimaryText: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "900" },

  btnSecondary: { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(0,0,0,0.20)" },
  btnSecondaryText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "900" },

  btnHint: { marginTop: 2, color: theme.colors.textTertiary, fontSize: theme.fontSize.xs, fontWeight: "800" },

  divider: { marginTop: 14, height: 1, backgroundColor: "rgba(255,255,255,0.10)" },

  previewList: { marginTop: 14, gap: 10 },

  previewRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  previewTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },
  previewText: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  badgeText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900" },

  smallNote: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16, fontWeight: "700" },
});
