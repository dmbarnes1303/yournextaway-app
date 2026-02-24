// src/components/match/MatchdayLogisticsCard.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  AccessibilityProps,
} from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import type { MatchdayLogistics, ParkingAvailability } from "@/src/data/matchdayLogistics/types";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  logistics: MatchdayLogistics | null;

  /**
   * Optional city for Maps deep-links.
   * If omitted, handlers still work if you provide onOpenStop/onSelectStayArea.
   */
  city?: string | null;

  /** Defaults to "Matchday Logistics" */
  title?: string;

  /** Defaults to "Know before you go →" */
  collapsedHint?: string;

  /**
   * Tap transport stop -> open maps.
   * If not provided, transport rows are non-interactive.
   */
  onOpenStop?: (stopName: string) => void;

  /**
   * Tap stay area -> prefill Trip Build.
   * If not provided, stay rows are non-interactive.
   */
  onSelectStayArea?: (area: string) => void;
};

function parkingLabel(a: ParkingAvailability) {
  if (a === "easy") return "Easy";
  if (a === "medium") return "Medium";
  return "Hard";
}

function joinNames(items: Array<{ name: string }> | undefined | null, max = 3) {
  if (!items?.length) return "";
  return items
    .slice(0, max)
    .map((x) => x.name)
    .filter(Boolean)
    .join(" / ");
}

function joinAreas(items: Array<{ area: string }> | undefined | null, max = 2) {
  if (!items?.length) return "";
  return items
    .slice(0, max)
    .map((x) => x.area)
    .filter(Boolean)
    .join(" / ");
}

function Section(props: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{props.icon}</Text>
        <Text style={styles.sectionTitle}>{props.title}</Text>
      </View>
      <View style={styles.sectionBody}>{props.children}</View>
    </View>
  );
}

function BulletList(props: { items?: string[]; max?: number }) {
  const items = (props.items ?? []).filter(Boolean);
  if (!items.length) return null;

  const max = typeof props.max === "number" ? props.max : items.length;

  return (
    <View style={styles.bullets}>
      {items.slice(0, max).map((t, idx) => (
        <Text key={`${idx}-${t}`} style={styles.bullet}>
          • {t}
        </Text>
      ))}
    </View>
  );
}

function RowLine(props: { primary: string; secondary?: string }) {
  return (
    <View style={styles.rowLine}>
      <Text style={styles.rowPrimary}>{props.primary}</Text>
      {props.secondary ? <Text style={styles.rowSecondary}>{props.secondary}</Text> : null}
    </View>
  );
}

function PressableRow(props: {
  primary: string;
  secondary?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const interactive = typeof props.onPress === "function";

  const a11y: AccessibilityProps = interactive
    ? {
        accessibilityRole: "button",
        accessibilityLabel: props.accessibilityLabel || props.primary,
      }
    : {};

  if (!interactive) return <RowLine primary={props.primary} secondary={props.secondary} />;

  return (
    <Pressable onPress={props.onPress} style={styles.pressRow} {...a11y}>
      <RowLine primary={props.primary} secondary={props.secondary} />
      <View style={styles.pressAffordance}>
        <Text style={styles.pressAffordanceText}>Maps</Text>
      </View>
    </Pressable>
  );
}

export default function MatchdayLogisticsCard({
  logistics,
  city,
  title = "Matchday Logistics",
  collapsedHint = "Know before you go →",
  onOpenStop,
  onSelectStayArea,
}: Props) {
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    if (!logistics) return null;

    const transportLine = joinNames(logistics.transport?.primaryStops, 3);
    const parking = parkingLabel(logistics.parking.availability);
    const stayLine =
      joinAreas(logistics.stay?.bestAreas, 2) || joinAreas(logistics.stay?.budgetAreas, 2) || "";

    return { transportLine, parking, stayLine };
  }, [logistics]);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }, []);

  const onStopPress = useCallback(
    (stopName: string) => {
      if (!stopName) return;
      if (onOpenStop) return onOpenStop(stopName);
      // If no handler provided, do nothing (caller owns navigation behavior)
    },
    [onOpenStop]
  );

  const onAreaPress = useCallback(
    (area: string) => {
      if (!area) return;
      if (onSelectStayArea) return onSelectStayArea(area);
    },
    [onSelectStayArea]
  );

  if (!logistics || !summary) return null;

  const stadiumName = logistics?.stadium?.name ? String(logistics.stadium.name) : "";
  const stadiumCity = logistics?.stadium?.city ? String(logistics.stadium.city) : "";
  const headerLine = [stadiumName, stadiumCity || (city ? String(city) : "")]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(" • ");

  const transportStops = logistics.transport?.primaryStops ?? [];
  const parking = logistics.parking;
  const food = logistics.foodDrink ?? [];
  const stayBest = logistics.stay?.bestAreas ?? [];
  const stayBudget = logistics.stay?.budgetAreas ?? [];
  const arrivalTips = logistics.arrivalTips ?? [];

  const stopInteractive = typeof onOpenStop === "function";
  const areaInteractive = typeof onSelectStayArea === "function";

  return (
    <GlassCard style={styles.card} intensity={22}>
      <Pressable onPress={toggle} style={styles.headerPress} accessibilityRole="button">
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>{title}</Text>
          {headerLine ? <Text style={styles.headerLine}>{headerLine}</Text> : null}
          <Text style={styles.subtitle}>Neutral traveller view: arrive smoothly, enjoy the city, keep it simple.</Text>
        </View>

        <View style={[styles.chev, open && styles.chevOpen]}>
          <Text style={styles.chevText}>›</Text>
        </View>
      </Pressable>

      {/* Collapsed summary */}
      {!open ? (
        <View style={styles.summaryWrap}>
          {summary.transportLine ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>🚆</Text>
              <Text style={styles.summaryText} numberOfLines={2}>
                {summary.transportLine}
              </Text>
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>🚗</Text>
            <Text style={styles.summaryText} numberOfLines={1}>
              Parking: {summary.parking}
            </Text>
          </View>

          {summary.stayLine ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>🏨</Text>
              <Text style={styles.summaryText} numberOfLines={1}>
                Stay: {summary.stayLine}
              </Text>
            </View>
          ) : null}

          <Text style={styles.hint}>{collapsedHint}</Text>
        </View>
      ) : null}

      {/* Expanded content */}
      {open ? (
        <View style={styles.expanded}>
          <Section icon="🚆" title="Transport">
            {transportStops.length ? (
              <View style={styles.rows}>
                {transportStops.slice(0, 5).map((s, idx) => {
                  const name = String((s as any)?.name ?? "").trim();
                  const notes = (s as any)?.notes ? String((s as any).notes) : undefined;

                  return (
                    <PressableRow
                      key={`${idx}-${name}`}
                      primary={name}
                      secondary={notes}
                      onPress={stopInteractive ? () => onStopPress(name) : undefined}
                      accessibilityLabel={stopInteractive ? `Open maps for ${name}` : undefined}
                    />
                  );
                })}
                {stopInteractive ? (
                  <Text style={styles.microHint}>Tip: tap a stop to open Maps</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.muted}>Transport tips coming soon.</Text>
            )}

            <BulletList items={logistics.transport?.tips ?? []} max={4} />
          </Section>

          <Section icon="🚗" title="Parking">
            <Text style={styles.parkingHeadline}>
              {parkingLabel(parking.availability)} — {parking.summary}
            </Text>

            {parking.officialLots?.length ? <BulletList items={parking.officialLots} max={4} /> : null}
          </Section>

          {food.length ? (
            <Section icon="🍻" title="Food & drink">
              <View style={styles.rows}>
                {food.slice(0, 5).map((f, idx) => (
                  <RowLine
                    key={`${idx}-${String((f as any)?.name ?? "")}`}
                    primary={String((f as any)?.name ?? "")}
                    secondary={(f as any)?.notes ? String((f as any).notes) : undefined}
                  />
                ))}
              </View>
            </Section>
          ) : null}

          {stayBest.length || stayBudget.length ? (
            <Section icon="🏨" title="Where to stay">
              {stayBest.length ? (
                <>
                  <Text style={styles.groupLabel}>Best areas</Text>
                  <View style={styles.rows}>
                    {stayBest.slice(0, 4).map((a, idx) => {
                      const area = String((a as any)?.area ?? "").trim();
                      const notes = (a as any)?.notes ? String((a as any).notes) : undefined;

                      return (
                        <PressableRow
                          key={`best-${idx}-${area}`}
                          primary={area}
                          secondary={notes}
                          onPress={areaInteractive ? () => onAreaPress(area) : undefined}
                          accessibilityLabel={areaInteractive ? `Use ${area} for trip stay area` : undefined}
                        />
                      );
                    })}
                    {areaInteractive ? (
                      <Text style={styles.microHint}>Tip: tap an area to prefill your trip</Text>
                    ) : null}
                  </View>
                </>
              ) : null}

              {stayBudget.length ? (
                <>
                  <Text style={[styles.groupLabel, { marginTop: 10 }]}>Budget areas</Text>
                  <View style={styles.rows}>
                    {stayBudget.slice(0, 4).map((a, idx) => {
                      const area = String((a as any)?.area ?? "").trim();
                      const notes = (a as any)?.notes ? String((a as any).notes) : undefined;

                      return (
                        <PressableRow
                          key={`budget-${idx}-${area}`}
                          primary={area}
                          secondary={notes}
                          onPress={areaInteractive ? () => onAreaPress(area) : undefined}
                          accessibilityLabel={areaInteractive ? `Use ${area} for trip stay area` : undefined}
                        />
                      );
                    })}
                  </View>
                </>
              ) : null}
            </Section>
          ) : null}

          {arrivalTips.length ? (
            <Section icon="⚠️" title="Arrival advice">
              <BulletList items={arrivalTips} max={6} />
            </Section>
          ) : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing.lg },

  headerPress: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  h2: {
    marginTop: 2,
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
    color: theme.colors.text,
  },

  headerLine: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },

  chev: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    transform: [{ rotate: "0deg" }],
  },
  chevOpen: {
    transform: [{ rotate: "90deg" }],
  },
  chevText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 18,
    lineHeight: 18,
    marginLeft: 2,
  },

  summaryWrap: { marginTop: 12, gap: 10 },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryIcon: { fontSize: 16 },
  summaryText: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
  },

  hint: {
    marginTop: 4,
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.2,
  },

  expanded: { marginTop: 14, gap: 12 },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },

  sectionBody: { marginTop: 10 },

  rows: { gap: 10 },

  // pressable row
  pressRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.10)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pressAffordance: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.28)",
    backgroundColor: "rgba(0,255,136,0.08)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pressAffordanceText: {
    color: "rgba(79,224,138,0.92)",
    fontWeight: "900",
    fontSize: 11,
  },

  rowLine: { flex: 1, gap: 4 },
  rowPrimary: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  rowSecondary: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },

  microHint: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontWeight: "800",
    fontSize: 11,
  },

  bullets: { marginTop: 10, gap: 6 },
  bullet: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  parkingHeadline: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  groupLabel: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.2,
    marginBottom: 8,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },
});
