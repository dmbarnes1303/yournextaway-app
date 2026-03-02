// app/paywall.tsx
import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackgroundSource } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { purchasePackage, restorePurchases, subscriptionsSupported, type PurchasesPackage } from "@/src/services/subscriptions";

type PlanCardProps = {
  title: string;
  price: string;
  bullets: string[];
  active?: boolean;
  onPress: () => void;
};

function PlanCard({ title, price, bullets, active, onPress }: PlanCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.planPress, pressed && styles.pressed]}
      android_ripple={{ color: active ? "rgba(79,224,138,0.10)" : "rgba(255,255,255,0.06)" }}
    >
      <GlassCard strength={active ? "strong" : "default"} style={[styles.planCard, active && styles.planCardActive]}>
        <View style={styles.planTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.planTitle}>{title}</Text>
            <Text style={styles.planPrice}>{price}</Text>
          </View>

          <View style={[styles.badge, active && styles.badgeActive]}>
            <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{active ? "Selected" : "Pick"}</Text>
          </View>
        </View>

        <View style={styles.bullets}>
          {bullets.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function PaywallScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock packages (RevenueCat wiring later)
  const packages = useMemo<PurchasesPackage[]>(() => {
    return [
      {
        identifier: "premium_monthly",
        product: { identifier: "premium_monthly", title: "Premium Monthly", priceString: "£4.99 / month", currencyCode: "GBP" },
      },
      {
        identifier: "premium_yearly",
        product: { identifier: "premium_yearly", title: "Premium Yearly", priceString: "£39.99 / year", currencyCode: "GBP" },
      },
    ];
  }, []);

  const [selectedId, setSelectedId] = useState(packages[1]?.identifier ?? packages[0]?.identifier ?? "");
  const selectedPkg = useMemo(() => packages.find((p) => p.identifier === selectedId) ?? null, [packages, selectedId]);

  const close = useCallback(() => router.back(), [router]);

  const onContinue = useCallback(async () => {
    setError(null);

    if (!selectedPkg) {
      setError("Please select a plan.");
      return;
    }

    setLoading(true);
    try {
      if (!subscriptionsSupported()) {
        setError("Purchases aren’t available on web. Use iOS/Android to subscribe.");
        return;
      }

      const res = await purchasePackage(selectedPkg);
      if (!res.ok) {
        setError(res.cancelled ? "Purchase cancelled." : res.message ?? "Purchase failed.");
        return;
      }

      router.back();
    } catch (e: any) {
      setError(e?.message ?? "Purchase failed.");
    } finally {
      setLoading(false);
    }
  }, [router, selectedPkg]);

  const onRestore = useCallback(async () => {
    setError(null);
    setRestoring(true);
    try {
      if (!subscriptionsSupported()) {
        setError("Restore isn’t available on web.");
        return;
      }

      const res = await restorePurchases();
      if (!res.ok) {
        setError(res.message ?? "Restore failed.");
        return;
      }

      router.back();
    } catch (e: any) {
      setError(e?.message ?? "Restore failed.");
    } finally {
      setRestoring(false);
    }
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={getBackgroundSource("home")} overlayOpacity={0.86}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={close} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]} hitSlop={10}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>

            <Text style={styles.kicker}>PREMIUM</Text>
            <Text style={styles.title}>Upgrade your planning.</Text>
            <Text style={styles.sub}>
              Premium adds the tools that make trip-building faster and cleaner. No spam. No noise.
            </Text>
          </View>

          <View style={styles.body}>
            <GlassCard strength="default" style={styles.valueCard}>
              <Text style={styles.valueTitle}>What you get</Text>
              <View style={{ gap: 10, marginTop: 10 }}>
                {[
                  "Smarter filters to find the right fixture faster",
                  "Saved defaults to reduce repeat setup",
                  "Cleaner trip workflow as Wallet + partners come online",
                ].map((t) => (
                  <View key={t} style={styles.valueRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.valueText}>{t}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <PlanCard
              title="Premium Monthly"
              price="£4.99 / month"
              bullets={["Try it without commitment", "All premium features", "Cancel anytime"]}
              active={selectedId === "premium_monthly"}
              onPress={() => setSelectedId("premium_monthly")}
            />

            <PlanCard
              title="Premium Yearly"
              price="£39.99 / year"
              bullets={["Best value", "All monthly features", "Priority updates"]}
              active={selectedId === "premium_yearly"}
              onPress={() => setSelectedId("premium_yearly")}
            />

            {error ? (
              <GlassCard strength="subtle" style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </GlassCard>
            ) : null}

            <Pressable
              onPress={onContinue}
              disabled={loading}
              style={({ pressed }) => [styles.cta, (pressed || loading) && styles.pressed, loading && styles.disabled]}
              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
            >
              {loading ? <ActivityIndicator /> : <Text style={styles.ctaText}>Continue</Text>}
              <Text style={styles.ctaMeta}>{selectedPkg?.product?.priceString ?? "Select a plan"}</Text>
            </Pressable>

            <View style={styles.footerRow}>
              <Pressable
                onPress={onRestore}
                disabled={restoring}
                style={({ pressed }) => [styles.smallBtn, (pressed || restoring) && styles.pressed, restoring && styles.disabled]}
                android_ripple={{ color: "rgba(255,255,255,0.06)" }}
              >
                {restoring ? <ActivityIndicator /> : <Text style={styles.smallBtnText}>Restore</Text>}
              </Pressable>

              <Pressable
                onPress={() => setError("Terms / Privacy screens not wired yet.")}
                style={({ pressed }) => [styles.smallBtn, pressed && styles.pressed]}
                android_ripple={{ color: "rgba(255,255,255,0.06)" }}
              >
                <Text style={styles.smallBtnText}>Terms</Text>
              </Pressable>
            </View>

            <Text style={styles.note}>
              RevenueCat wiring happens later (native only) via src/services/subscriptions.ts.
            </Text>
          </View>
        </SafeAreaView>
      </Background>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md },

  closeBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    marginBottom: 12,
    overflow: "hidden",
  },
  closeText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 13 },

  kicker: { color: "rgba(79,224,138,0.92)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.6 },
  title: { marginTop: 10, color: theme.colors.text, fontSize: 22, fontWeight: theme.fontWeight.black, lineHeight: 28 },
  sub: { marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold, lineHeight: 19, maxWidth: 520 },

  body: { flex: 1, paddingHorizontal: theme.spacing.lg, gap: 12 },

  valueCard: { borderRadius: 20, padding: 14 },
  valueTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 15 },
  valueRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  valueText: { flex: 1, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold, fontSize: 13, lineHeight: 18 },

  planPress: { borderRadius: 18, overflow: "hidden" },
  planCard: { borderRadius: 18, padding: theme.spacing.md },
  planCardActive: { borderColor: "rgba(79,224,138,0.26)" },

  planTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  planTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 15 },
  planPrice: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold, fontSize: 13 },

  badge: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  badgeActive: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  badgeText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  badgeTextActive: { color: theme.colors.text },

  bullets: { marginTop: 12, gap: 10 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { width: 6, height: 6, borderRadius: 999, marginTop: 7, backgroundColor: "rgba(79,224,138,0.65)" },
  bulletText: { flex: 1, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold, fontSize: 13, lineHeight: 18 },

  errorCard: { borderRadius: 16, padding: theme.spacing.md },
  errorText: { color: "rgba(255,120,120,0.95)", fontWeight: theme.fontWeight.black, fontSize: 13 },

  cta: {
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
    gap: 6,
    overflow: "hidden",
  },
  ctaText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 15 },
  ctaMeta: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold, fontSize: 12 },

  footerRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  smallBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  smallBtnText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 13 },

  disabled: { opacity: 0.6 },

  note: {
    marginTop: 8,
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 16,
    paddingBottom: theme.spacing.lg,
  },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
});
