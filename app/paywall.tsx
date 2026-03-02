// app/paywall.tsx
import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import {
  purchasePackage,
  restorePurchases,
  subscriptionsSupported,
  type PurchasesPackage,
} from "@/src/services/subscriptions";

/* -------------------------------------------------------------------------- */
/* Small utils */
/* -------------------------------------------------------------------------- */

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function PillButton({
  label,
  onPress,
  variant,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant: "primary" | "ghost";
  disabled?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={!!disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.pillBtn,
        primary ? styles.pillPrimary : styles.pillGhost,
        (pressed || disabled) && styles.pressed,
      ]}
      android_ripple={{ color: primary ? "rgba(79,224,138,0.14)" : "rgba(255,255,255,0.10)" }}
    >
      <Text style={[styles.pillBtnText, primary ? styles.pillPrimaryText : styles.pillGhostText]}>{label}</Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Plan Card */
/* -------------------------------------------------------------------------- */

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
      accessibilityRole="button"
      accessibilityLabel={`Select ${title}`}
      style={({ pressed }) => [styles.planPress, pressed && styles.pressed]}
      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
    >
      <GlassCard strength={active ? "strong" : "default"} style={[styles.planCard, active && styles.planCardActive]} noPadding>
        <View style={styles.planInner}>
          <View style={styles.planTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.planTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.planPrice}>{price}</Text>
            </View>

            <View style={[styles.badge, active && styles.badgeActive]}>
              <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{active ? "Selected" : "Pick"}</Text>
            </View>
          </View>

          <View style={styles.bullets}>
            {bullets.map((b, idx) => (
              <View key={`${title}-b-${idx}`} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function PaywallScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock packages (web-safe). Native wiring later via src/services/subscriptions.ts
  const packages = useMemo<PurchasesPackage[]>(
    () => [
      {
        identifier: "premium_monthly",
        product: {
          identifier: "premium_monthly",
          title: "Premium Monthly",
          priceString: "£4.99 / month",
          currencyCode: "GBP",
        } as any,
      },
      {
        identifier: "premium_yearly",
        product: {
          identifier: "premium_yearly",
          title: "Premium Yearly",
          priceString: "£39.99 / year",
          currencyCode: "GBP",
        } as any,
      },
    ],
    []
  );

  const [selectedId, setSelectedId] = useState(packages[1]?.identifier ?? packages[0]?.identifier ?? "");
  const selectedPkg = useMemo(() => packages.find((p) => p.identifier === selectedId) ?? null, [packages, selectedId]);

  const canPurchase = subscriptionsSupported();
  const busy = loading || restoring;

  const close = useCallback(() => {
    router.back();
  }, [router]);

  const onContinue = useCallback(async () => {
    setError(null);

    if (!selectedPkg) {
      setError("Select a plan to continue.");
      return;
    }

    setLoading(true);
    try {
      if (!canPurchase) {
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
  }, [router, selectedPkg, canPurchase]);

  const onRestore = useCallback(async () => {
    setError(null);
    setRestoring(true);
    try {
      if (!canPurchase) {
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
  }, [router, canPurchase]);

  const bg = getBackground("home");
  const bgSource = typeof bg === "string" ? { uri: bg } : bg;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={bgSource} overlayOpacity={0.86}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          {/* Top row */}
          <View style={styles.topRow}>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close paywall"
              style={({ pressed }) => [styles.topPill, pressed && styles.pressed]}
              android_ripple={{ color: "rgba(255,255,255,0.10)" }}
              hitSlop={10}
            >
              <Text style={styles.topPillText}>Close</Text>
            </Pressable>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={onRestore}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
              disabled={busy}
              style={({ pressed }) => [styles.topPill, (pressed || busy) && styles.pressed]}
              android_ripple={{ color: "rgba(255,255,255,0.10)" }}
              hitSlop={10}
            >
              {restoring ? <ActivityIndicator /> : <Text style={styles.topPillText}>Restore</Text>}
            </Pressable>
          </View>

          {/* Hero */}
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>PREMIUM</Text>
              <Text style={styles.title}>Upgrade your planning</Text>
              <Text style={styles.sub}>
                Premium adds the tools that make trip-building faster and cleaner. No spam. No noise.
              </Text>

              {!canPurchase ? (
                <View style={styles.webNoteWrap}>
                  <Text style={styles.webNote}>
                    Web preview mode: purchases are disabled here. This screen is still useful for layout + copy.
                  </Text>
                </View>
              ) : null}
            </View>
          </GlassCard>

          {/* Plans */}
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
              <GlassCard strength="subtle" style={styles.errorCard} noPadding>
                <View style={styles.errorInner}>
                  <Text style={styles.errorTitle}>Something went wrong</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </GlassCard>
            ) : null}

            {/* CTA */}
            <GlassCard strength="default" style={styles.ctaCard} noPadding>
              <View style={styles.ctaInner}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.ctaLabel}>Continue</Text>
                  <Text style={styles.ctaMeta}>
                    {safeStr(selectedPkg?.product?.priceString) ? safeStr(selectedPkg?.product?.priceString) : "Select a plan"}
                  </Text>
                </View>

                <PillButton label={loading ? "Processing…" : "Subscribe"} onPress={onContinue} variant="primary" disabled={busy} />
              </View>
            </GlassCard>

            {/* Secondary */}
            <View style={styles.footerRow}>
              <PillButton
                label="Terms"
                onPress={() => setError("Terms/Privacy screen not wired yet.")}
                variant="ghost"
                disabled={busy}
              />
              <PillButton
                label="Privacy"
                onPress={() => setError("Terms/Privacy screen not wired yet.")}
                variant="ghost"
                disabled={busy}
              />
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

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: 12,
  },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },

  topPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  topPillText: {
    color: "rgba(255,255,255,0.80)",
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  hero: { borderRadius: 26 },
  heroInner: { padding: theme.spacing.lg, gap: 8 },

  kicker: { color: "rgba(79,224,138,0.70)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.5 },
  title: { color: theme.colors.text, fontSize: 26, lineHeight: 32, fontWeight: theme.fontWeight.black },
  sub: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: theme.fontWeight.bold, opacity: 0.98 },

  webNoteWrap: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  webNote: { color: theme.colors.textTertiary, fontSize: 12, lineHeight: 17, fontWeight: theme.fontWeight.bold },

  body: { flex: 1, gap: 12 },

  planPress: { borderRadius: 18, overflow: "hidden" },
  planCard: { borderRadius: 18 },
  planCardActive: {
    borderColor: "rgba(79,224,138,0.30)",
  },

  planInner: { padding: theme.spacing.md, gap: 10 },

  planTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  planTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 16 },
  planPrice: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold, fontSize: 13 },

  badge: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  badgeActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: "rgba(0,0,0,0.26)",
  },
  badgeText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  badgeTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  bullets: { gap: 10, paddingTop: 2 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { width: 6, height: 6, borderRadius: 999, marginTop: 7, backgroundColor: "rgba(79,224,138,0.65)" },
  bulletText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: theme.fontWeight.bold },

  errorCard: { borderRadius: 18 },
  errorInner: { padding: theme.spacing.md, gap: 6 },
  errorTitle: { color: "rgba(255,180,180,0.95)", fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.3 },
  errorText: { color: "rgba(255,140,140,0.95)", fontSize: 13, lineHeight: 18, fontWeight: theme.fontWeight.bold },

  ctaCard: { borderRadius: 22 },
  ctaInner: { padding: theme.spacing.md, flexDirection: "row", alignItems: "center", gap: 12 },

  ctaLabel: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  ctaMeta: { marginTop: 4, color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  pillBtn: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
    minWidth: 120,
  },

  pillPrimary: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  pillGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  pillBtnText: { fontWeight: theme.fontWeight.black, fontSize: 13, letterSpacing: 0.2 },
  pillPrimaryText: { color: theme.colors.text },
  pillGhostText: { color: theme.colors.textSecondary },

  footerRow: { flexDirection: "row", gap: 10 },

  note: {
    marginTop: 2,
    color: theme.colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
    opacity: 0.92,
    paddingBottom: 4,
  },
});
