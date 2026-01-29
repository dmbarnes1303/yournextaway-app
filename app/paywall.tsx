// app/paywall.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { usePro } from "@/src/context/ProContext";
import {
  getDefaultOfferingSafe,
  pickPackage,
  purchasePackageSafe,
  restorePurchasesSafe,
} from "@/src/services/subscriptions";

export default function PaywallScreen() {
  const router = useRouter();
  const { isPro, purchasesEnabled, refresh } = usePro();

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<"monthly" | "annual" | null>(null);
  const [offering, setOffering] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const off = await getDefaultOfferingSafe();
      if (mounted) setOffering(off);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const monthly = useMemo(() => pickPackage(offering, "monthly"), [offering]);
  const annual = useMemo(() => pickPackage(offering, "annual"), [offering]);

  async function buy(kind: "monthly" | "annual") {
    const pkg = kind === "monthly" ? monthly : annual;
    if (!pkg) return;

    setPurchasing(kind);
    const info = await purchasePackageSafe(pkg);
    await refresh();
    setPurchasing(null);

    if (info) {
      // If pro unlocked, bounce back
      router.back();
    }
  }

  async function restore() {
    setPurchasing("annual");
    await restorePurchasesSafe();
    await refresh();
    setPurchasing(null);
  }

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.88}>
      <Stack.Screen
        options={{
          title: "YourNextAway Pro",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.kicker}>YOURNEXTAWAY PRO</Text>
            <Text style={styles.h1}>Plan a European trip around a fixture in minutes</Text>

            <Text style={styles.sub}>
              Unlock full city & team guides, offline access, and Match Trip Alerts.
            </Text>

            <View style={styles.bullets}>
              {[
                "Match Trip Alerts (push notifications)",
                "Fixture change alerts",
                "Unlimited saved trips",
                "Full city guides + full team guides",
                "Offline city + team guides",
              ].map((x) => (
                <View key={x} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{x}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {!purchasesEnabled ? (
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState
                title="Purchases not enabled yet"
                message="Add EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY, then create the Pro entitlement + products in RevenueCat."
              />
            </GlassCard>
          ) : null}

          {loading ? (
            <GlassCard style={styles.card} intensity={22}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading plans…</Text>
              </View>
            </GlassCard>
          ) : null}

          {!loading && purchasesEnabled && !monthly && !annual ? (
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState
                title="Plans not found"
                message='Create an offering named "default" with Monthly + Annual packages, mapped to products yna_pro_monthly / yna_pro_annual.'
              />
            </GlassCard>
          ) : null}

          {!loading && purchasesEnabled && (monthly || annual) ? (
            <GlassCard style={styles.card} intensity={22}>
              <Text style={styles.h2}>Choose a plan</Text>

              <View style={styles.planGrid}>
                {monthly ? (
                  <Pressable
                    onPress={() => buy("monthly")}
                    disabled={!!purchasing}
                    style={[styles.plan, styles.planPrimary, purchasing && { opacity: 0.7 }]}
                  >
                    <Text style={styles.planTitle}>Monthly</Text>
                    <Text style={styles.planPrice}>{monthly.product.priceString}</Text>
                    <Text style={styles.planMeta}>Cancel anytime</Text>

                    <View style={styles.planBtn}>
                      {purchasing === "monthly" ? <ActivityIndicator /> : <Text style={styles.planBtnText}>Start Pro</Text>}
                    </View>
                  </Pressable>
                ) : null}

                {annual ? (
                  <Pressable
                    onPress={() => buy("annual")}
                    disabled={!!purchasing}
                    style={[styles.plan, purchasing && { opacity: 0.7 }]}
                  >
                    <Text style={styles.planTitle}>Annual</Text>
                    <Text style={styles.planPrice}>{annual.product.priceString}</Text>
                    <Text style={styles.planMeta}>Best value</Text>

                    <View style={styles.planBtnAlt}>
                      {purchasing === "annual" ? <ActivityIndicator /> : <Text style={styles.planBtnText}>Go Annual</Text>}
                    </View>
                  </Pressable>
                ) : null}
              </View>

              <Pressable onPress={restore} disabled={!!purchasing} style={styles.restoreBtn}>
                <Text style={styles.restoreText}>Restore purchases</Text>
              </Pressable>

              {isPro ? (
                <Text style={styles.proNote}>You already have Pro. You can close this screen.</Text>
              ) : null}
            </GlassCard>
          ) : null}

          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.smallTitle}>Next</Text>
            <Text style={styles.muted}>
              After Pro is wired: we add alert frequency settings (Instant/Daily/Weekly) in Profile, then implement the alert engine.
            </Text>

            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingTop: 90,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  card: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  h1: { marginTop: 10, color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "900", lineHeight: 30 },
  sub: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  bullets: { marginTop: 12, gap: 8 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { color: theme.colors.primary, fontWeight: "900", marginTop: 1 },
  bulletText: { flex: 1, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  h2: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg, marginBottom: 10 },
  smallTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  planGrid: { flexDirection: "row", gap: 12, marginTop: 6 },
  plan: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 14,
  },
  planPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.26)",
  },
  planTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  planPrice: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  planMeta: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700", fontSize: theme.fontSize.xs },

  planBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  planBtnAlt: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  planBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  restoreBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },
  restoreText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  proNote: { marginTop: 10, color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.sm },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  muted: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  backBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  backText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
});
