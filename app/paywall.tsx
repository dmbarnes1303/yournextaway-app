// app/paywall.tsx
import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
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
    <Pressable onPress={onPress} style={{ borderRadius: 18 }}>
      <GlassCard strength={active ? "strong" : "default"} style={[styles.planCard, active && styles.planCardActive]}>
        <View style={styles.planTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitle}>{title}</Text>
            <Text style={styles.planPrice}>{price}</Text>
          </View>
          <View style={[styles.badge, active && styles.badgeActive]}>
            <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{active ? "Selected" : "Pick"}</Text>
          </View>
        </View>

        <View style={styles.bullets}>
          {bullets.map((b) => (
            <Text key={b} style={styles.bullet}>
              • {b}
            </Text>
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

  const packages = useMemo<PurchasesPackage[]>(() => {
    return [
      {
        identifier: "premium_monthly",
        product: {
          identifier: "premium_monthly",
          title: "Premium Monthly",
          priceString: "£4.99 / month",
          currencyCode: "GBP",
        },
      },
      {
        identifier: "premium_yearly",
        product: {
          identifier: "premium_yearly",
          title: "Premium Yearly",
          priceString: "£39.99 / year",
          currencyCode: "GBP",
        },
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
    <Background imageUrl={getBackground("home")} overlayOpacity={0.86}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={close} style={styles.closeBtn} hitSlop={10}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>

          <Text style={styles.kicker}>PREMIUM</Text>
          <Text style={styles.title}>Upgrade your planning.</Text>
          <Text style={styles.sub}>
            Premium adds the tools that make trip-building faster and cleaner. No spam. No noise.
          </Text>
        </View>

        <View style={styles.body}>
          <PlanCard
            title="Premium Monthly"
            price="£4.99 / month"
            bullets={["Faster planning flow", "Better filtering", "Saved defaults"]}
            active={selectedId === "premium_monthly"}
            onPress={() => setSelectedId("premium_monthly")}
          />

          <PlanCard
            title="Premium Yearly"
            price="£39.99 / year"
            bullets={["Best value", "Everything in monthly", "Priority updates"]}
            active={selectedId === "premium_yearly"}
            onPress={() => setSelectedId("premium_yearly")}
          />

          {error ? (
            <GlassCard strength="subtle" style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </GlassCard>
          ) : null}

          <Pressable onPress={onContinue} disabled={loading} style={[styles.cta, loading && styles.disabled]}>
            {loading ? <ActivityIndicator /> : <Text style={styles.ctaText}>Continue</Text>}
            <Text style={styles.ctaMeta}>{selectedPkg?.product?.priceString ?? "Select a plan"}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Pressable onPress={onRestore} disabled={restoring} style={[styles.smallBtn, restoring && styles.disabled]}>
              {restoring ? <ActivityIndicator /> : <Text style={styles.smallBtnText}>Restore</Text>}
            </Pressable>

            <Pressable onPress={() => setError("Terms/Privacy screen not wired yet.")} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Terms</Text>
            </Pressable>
          </View>

          <Text style={styles.note}>
            This screen is web-safe. RevenueCat wiring happens later (native only) via src/services/subscriptions.ts.
          </Text>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },

  closeBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.glass.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    marginBottom: 12,
  },
  closeText: { color: theme.colors.textSecondary, fontWeight: "900" as any, fontSize: theme.fontSize.sm },

  kicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900" as any,
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900" as any,
    lineHeight: 30,
  },
  sub: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "700" as any,
    lineHeight: 19,
    maxWidth: 520,
  },

  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    gap: 12,
  },

  planCard: { borderRadius: 18, padding: theme.spacing.md },
  planCardActive: { borderColor: "rgba(0,255,136,0.55)" },

  planTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  planTitle: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.md },
  planPrice: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800" as any, fontSize: theme.fontSize.sm },

  badge: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.glass.border,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  badgeActive: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  badgeText: { color: theme.colors.textSecondary, fontWeight: "900" as any, fontSize: theme.fontSize.xs },
  badgeTextActive: { color: theme.colors.text, fontWeight: "900" as any },

  bullets: { marginTop: 10, gap: 6 },
  bullet: { color: theme.colors.textSecondary, fontWeight: "700" as any, fontSize: theme.fontSize.sm, lineHeight: 18 },

  errorCard: { borderRadius: 16, padding: theme.spacing.md },
  errorText: { color: "rgba(255,120,120,0.95)", fontWeight: "900" as any, fontSize: theme.fontSize.sm },

  cta: {
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
    gap: 6,
  },
  ctaText: { color: theme.colors.text, fontWeight: "900" as any, fontSize: theme.fontSize.md },
  ctaMeta: { color: theme.colors.textSecondary, fontWeight: "800" as any, fontSize: theme.fontSize.xs },

  footerRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  smallBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.glass.border,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  smallBtnText: { color: theme.colors.textSecondary, fontWeight: "900" as any, fontSize: theme.fontSize.sm },

  disabled: { opacity: 0.6 },

  note: {
    marginTop: 8,
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.xs,
    fontWeight: "700" as any,
    lineHeight: 16,
    paddingBottom: theme.spacing.lg,
  },
});
