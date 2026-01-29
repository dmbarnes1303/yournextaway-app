// app/paywall.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { usePro } from "@/src/context/ProContext";

function priceLabel(pkg: PurchasesPackage): string {
  const p: any = pkg?.product;
  const price = p?.priceString ?? "";
  const title = p?.title ?? "";
  const isAnnual = /year|annual/i.test(String(title)) || /P1Y/i.test(String(p?.subscriptionPeriod ?? ""));
  const isMonthly = /month/i.test(String(title)) || /P1M/i.test(String(p?.subscriptionPeriod ?? ""));
  const cadence = isAnnual ? " / year" : isMonthly ? " / month" : "";
  return `${price}${cadence}`.trim();
}

function packageName(pkg: PurchasesPackage): string {
  const id = String((pkg as any)?.identifier ?? "");
  const title = String((pkg as any)?.product?.title ?? "");
  if (/annual|year/i.test(title) || /annual|year/i.test(id)) return "Annual";
  if (/month/i.test(title) || /monthly|month/i.test(id)) return "Monthly";
  return "Pro";
}

export default function PaywallScreen() {
  const router = useRouter();
  const pro = usePro();

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(
    () => ({
      headline: "Plan a European trip around a fixture in minutes",
      bullets: [
        "Full City Guides (complete detail, no fluff)",
        "Full Team Guides (stadium, logistics, tickets, timing)",
        "Fast trip building around a specific match",
        "Priority access to alerts + randomiser features as they ship",
      ],
    }),
    []
  );

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings?.current;

        const pkgs: PurchasesPackage[] = [];
        const ap = (current as any)?.availablePackages;
        if (Array.isArray(ap)) pkgs.push(...ap);

        // De-dupe by identifier
        const seen = new Set<string>();
        const deduped = pkgs.filter((p) => {
          const k = String((p as any)?.identifier ?? (p as any)?.product?.identifier ?? Math.random());
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        if (!mounted) return;
        setPackages(deduped);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Couldn’t load purchase options.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  async function buy(pkg: PurchasesPackage) {
    try {
      setPurchasing(true);
      await Purchases.purchasePackage(pkg);
      await pro.refresh();

      // If they’re Pro now, bounce them back.
      if (pro.isPro) {
        router.back();
        return;
      }

      Alert.alert("Purchase complete", "Thanks! If Pro doesn’t unlock immediately, tap Refresh.");
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      // User cancelled
      if (/cancel/i.test(msg)) return;
      Alert.alert("Purchase failed", msg || "Couldn’t complete purchase.");
    } finally {
      setPurchasing(false);
    }
  }

  async function restore() {
    try {
      setPurchasing(true);
      await Purchases.restorePurchases();
      await pro.refresh();

      if (pro.isPro) {
        Alert.alert("Restored", "Your Pro access is active.");
        router.back();
        return;
      }

      Alert.alert("No active subscription", "We didn’t find an active Pro subscription for this Apple/Google account.");
    } catch (e: any) {
      Alert.alert("Restore failed", String(e?.message ?? "Couldn’t restore purchases."));
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.88}>
      <Stack.Screen options={{ headerShown: true, title: "YourNextAway Pro", headerTransparent: true, headerTintColor: theme.colors.text }} />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.kicker}>YOURNEXTAWAY PRO</Text>
            <Text style={styles.h1}>{copy.headline}</Text>

            <View style={styles.bullets}>
              {copy.bullets.map((b, i) => (
                <Text key={`${i}-${b.slice(0, 12)}`} style={styles.bullet}>
                  • {b}
                </Text>
              ))}
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusText}>
                Status:{" "}
                <Text style={styles.statusStrong}>
                  {pro.isReady ? (pro.isPro ? "Pro active" : "Free") : "Checking…"}
                </Text>
              </Text>

              <Pressable onPress={pro.refresh} style={styles.smallBtn} disabled={!pro.isReady || purchasing}>
                <Text style={styles.smallBtnText}>Refresh</Text>
              </Pressable>
            </View>
          </GlassCard>

          {loading ? (
            <GlassCard style={styles.card} intensity={22}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading purchase options…</Text>
              </View>
            </GlassCard>
          ) : null}

          {!loading && error ? (
            <GlassCard style={styles.card} intensity={22}>
              <EmptyState title="Couldn’t load options" message={error} />
              <Pressable onPress={restore} style={[styles.actionBtn, { marginTop: 12 }]} disabled={purchasing}>
                <Text style={styles.actionBtnText}>Restore purchases</Text>
              </Pressable>
            </GlassCard>
          ) : null}

          {!loading && !error ? (
            <GlassCard style={styles.card} intensity={22}>
              <Text style={styles.h2}>Choose a plan</Text>
              <Text style={styles.muted}>Monthly or annual — cancel anytime in App Store / Google Play.</Text>

              {packages.length === 0 ? (
                <EmptyState
                  title="No packages found"
                  message="Create products + an offering in RevenueCat, then try again."
                />
              ) : (
                <View style={styles.pkgList}>
                  {packages.map((pkg) => (
                    <Pressable
                      key={String((pkg as any)?.identifier ?? pkg?.product?.identifier ?? Math.random())}
                      onPress={() => buy(pkg)}
                      style={[styles.pkgRow, purchasing && { opacity: 0.6 }]}
                      disabled={purchasing}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pkgTitle}>{packageName(pkg)}</Text>
                        <Text style={styles.pkgSub}>{String((pkg as any)?.product?.description ?? "YourNextAway Pro")}</Text>
                      </View>
                      <Text style={styles.pkgPrice}>{priceLabel(pkg)}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.rowBtns}>
                <Pressable onPress={restore} style={styles.actionBtn} disabled={purchasing}>
                  <Text style={styles.actionBtnText}>Restore purchases</Text>
                </Pressable>

                <Pressable onPress={() => router.back()} style={[styles.actionBtn, styles.actionBtnSecondary]} disabled={purchasing}>
                  <Text style={styles.actionBtnText}>Not now</Text>
                </Pressable>
              </View>

              <Text style={styles.legal}>
                By subscribing you agree to the store subscription terms. You can manage or cancel in your device subscription settings.
              </Text>
            </GlassCard>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  card: { padding: theme.spacing.lg },

  kicker: { color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: "900", letterSpacing: 0.6 },
  h1: { marginTop: 8, color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: "900", lineHeight: 30 },

  h2: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg, marginBottom: 6 },

  bullets: { marginTop: 12, gap: 6 },
  bullet: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  muted: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },

  statusRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  statusText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "800" },
  statusStrong: { color: theme.colors.text, fontWeight: "900" },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  smallBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  pkgList: { marginTop: 10, gap: 10 },
  pkgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  pkgTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  pkgSub: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "700" },
  pkgPrice: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  rowBtns: { marginTop: 12, flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  actionBtnSecondary: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  actionBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  legal: { marginTop: 12, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },
});
