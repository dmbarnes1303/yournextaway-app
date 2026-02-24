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
} from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import type {
  MatchdayLogistics,
  ParkingAvailability,
  LogisticsStop,
} from "@/src/data/matchdayLogistics/types";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  logistics: MatchdayLogistics | null;

  /**
   * Optional overrides / wiring
   * - city: used for map deep-link string composition (stop + city)
   * - onOpenStop: open maps for a stop (stop name + city)
   * - onSelectStayArea: push into trip build with area prefill
   */
  city?: string | null;
  onOpenStop?: (query: string, stop?: LogisticsStop) => void;
  onSelectStayArea?: (area: string) => void;

  title?: string; // defaults to "Matchday Logistics"
  collapsedHint?: string; // defaults to "Know before you go →"
};

function parkingLabel(a: ParkingAvailability) {
  if (a === "easy") return "Easy";
  if (a === "medium") return "Medium";
  return "Hard";
}

function stopTypeGlyph(t: LogisticsStop["type"]) {
  switch (t) {
    case "train":
      return "🚆";
    case "metro":
      return "Ⓜ️";
    case "tram":
      return "🚋";
    case "bus":
      return "🚌";
    case "ferry":
      return "⛴️";
    case "walk":
      return "🚶";
    default:
      return "📍";
  }
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

function RowLine(props: {
  primary: string;
  secondary?: string;
  leftGlyph?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.rowLine}>
      <View style={styles.rowTop}>
        {props.leftGlyph ? <Text style={styles.rowGlyph}>{props.leftGlyph}</Text> : null}
        <Text style={styles.rowPrimary}>{props.primary}</Text>
      </View>
      {props.secondary ? <Text style={styles.rowSecondary}>{props.secondary}</Text> : null}
    </View>
  );

  if (!props.onPress) return content;

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [styles.rowPress, pressed && { opacity: 0.78 }]}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
}

function Chip(props: { text: string; onPress?: () => void }) {
  const inner = (
    <View style={styles.chip}>
      <Text style={styles.chipText} numberOfLines={1}>
        {props.text}
      </Text>
    </View>
  );

  if (!props.onPress) return inner;

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [pressed && { opacity: 0.78 }]}
      accessibilityRole="button"
    >
      {inner}
    </Pressable>
  );
}

export default function MatchdayLogisticsCard({
  logistics,
  city,
  onOpenStop,
  onSelectStayArea,
  title = "Matchday Logistics",
  collapsedHint = "Know before you go →",
}: Props) {
  const [open, setOpen] = useState(false);

  const headerLine = useMemo(() => {
    if (!logistics) return "";
    const s = String(logistics.stadium ?? "").trim();
    const c = String(city ?? logistics.city ?? "").trim();
    const parts = [s, c].filter(Boolean);
    return parts.join(" • ");
  }, [logistics, city]);

  const summary = useMemo(() => {
    if (!logistics) return null;

    const transportLine = joinNames(logistics.transport?.primaryStops, 3);
    const parking = parkingLabel(logistics.parking.availability);
    const stayLine =
      joinAreas(logistics.stay?.bestAreas, 2) ||
      joinAreas(logistics.stay?.budgetAreas, 2) ||
      "";

    return { transportLine, parking, stayLine };
  }, [logistics]);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }, []);

  if (!logistics || !summary) return null;

  const transportStops = logistics.transport?.primaryStops ?? [];
  const parking = logistics.parking;
  const food = logistics.foodDrink ?? [];
  const stayBest = logistics.stay?.bestAreas ?? [];
  const stayBudget = logistics.stay?.budgetAreas ?? [];
  const arrivalTips = logistics.arrivalTips ?? [];
  const transportTips = logistics.transport?.tips ?? [];

  const effectiveCity = String(city ?? logistics.city ?? "").trim();

  return (
    <GlassCard style={styles.card} intensity={22}>
      <Pressable onPress={toggle} style={styles.headerPress} accessibilityRole="button">
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>{title}</Text>
          {headerLine ? <Text style={styles.venueLine}>{headerLine}</Text> : null}
          <Text style={styles.subtitle}>
            Neutral traveller view: arrive smoothly, enjoy the city, keep it simple.
          </Text>
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
                  const q = effectiveCity ? `${s.name} ${effectiveCity}` : s.name;
                  const tappable = !!onOpenStop;
                  return (
                    <RowLine
                      key={`${idx}-${s.name}`}
                      leftGlyph={stopTypeGlyph(s.type)}
                      primary={s.name}
                      secondary={s.notes ? String(s.notes) : undefined}
                      onPress={
                        tappable
                          ? () => onOpenStop?.(q, s)
                          : undefined
                      }
                    />
                  );
                })}
              </View>
            ) : (
              <Text style={styles.muted}>Transport stops coming soon.</Text>
            )}

            <BulletList items={transportTips} max={5} />

            {onOpenStop && transportStops.length ? (
              <Text style={styles.tapHint}>Tip: tap a stop to open in Maps.</Text>
            ) : null}
          </Section>

          <Section icon="🚗" title="Parking">
            <Text style={styles.parkingHeadline}>
              {parkingLabel(parking.availability)} — {parking.summary}
            </Text>

            {parking.officialLots?.length ? <BulletList items={parking.officialLots} max={5} /> : null}
          </Section>

          {food.length ? (
            <Section icon="🍻" title="Food & drink">
              <View style={styles.chipWrap}>
                {food.slice(0, 10).map((f, idx) => {
                  const label = String(f.name ?? "").trim();
                  if (!label) return null;
                  const q = effectiveCity ? `${label} ${effectiveCity}` : label;
                  return (
                    <Chip
                      key={`${idx}-${label}`}
                      text={label}
                      onPress={onOpenStop ? () => onOpenStop(q) : undefined}
                    />
                  );
                })}
              </View>
              {onOpenStop ? (
                <Text style={styles.tapHint}>Tap a place to search it in Maps.</Text>
              ) : null}
            </Section>
          ) : null}

          {stayBest.length || stayBudget.length ? (
            <Section icon="🏨" title="Where to stay">
              {stayBest.length ? (
                <>
                  <Text style={styles.groupLabel}>Best areas</Text>
                  <View style={styles.rows}>
                    {stayBest.slice(0, 4).map((a, idx) => {
                      const area = String(a.area ?? "").trim();
                      const secondary = a.notes ? String(a.notes) : undefined;

                      const press =
                        onSelectStayArea
                          ? () => onSelectStayArea(area)
                          : onOpenStop
                          ? () => {
                              const q = effectiveCity ? `${area} ${effectiveCity}` : area;
                              onOpenStop(q);
                            }
                          : undefined;

                      return (
                        <RowLine
                          key={`best-${idx}-${area}`}
                          primary={area}
                          secondary={secondary}
                          onPress={press}
                        />
                      );
                    })}
                  </View>
                </>
              ) : null}

              {stayBudget.length ? (
                <>
                  <Text style={[styles.groupLabel, { marginTop: 10 }]}>Budget areas</Text>
                  <View style={styles.rows}>
                    {stayBudget.slice(0, 4).map((a, idx) => {
                      const area = String(a.area ?? "").trim();
                      const secondary = a.notes ? String(a.notes) : undefined;

                      const press =
                        onSelectStayArea
                          ? () => onSelectStayArea(area)
                          : onOpenStop
                          ? () => {
                              const q = effectiveCity ? `${area} ${effectiveCity}` : area;
                              onOpenStop(q);
                            }
                          : undefined;

                      return (
                        <RowLine
                          key={`budget-${idx}-${area}`}
                          primary={area}
                          secondary={secondary}
                          onPress={press}
                        />
                      );
                    })}
                  </View>
                </>
              ) : null}

              {(onSelectStayArea && (stayBest.length || stayBudget.length)) ? (
                <Text style={styles.tapHint}>Tap an area to prefill your trip stay search.</Text>
              ) : null}
            </Section>
          ) : null}

          {arrivalTips.length ? (
            <Section icon="⚠️" title="Arrival tips">
              <BulletList items={arrivalTips} max={7} />
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

  venueLine: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
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
  chevOpen: { transform: [{ rotate: "90deg" }] },
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

  rowPress: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  rowLine: { gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowGlyph: { fontSize: 14 },
  rowPrimary: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  rowSecondary: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
  },

  bullets: { marginTop: 10, gap: 6 },
  bullet: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  parkingHeadline: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

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

  tapHint: {
    marginTop: 10,
    color: theme.colors.textTertiary,
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 14,
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },
});
