import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";

type Area = {
  area: string;
  notes?: string;
};

type Props = {
  primaryLogisticsSnippet: string;
  stadiumName: string;
  stadiumCity: string;
  stadiumMapsUrl: string;
  stayBestAreas: Area[];
  stayBudgetAreas: Area[];
  transportStops: string[];
  transportTips: string[];
  lateTransportNote: string;
  onOpenUrl: (url?: string | null) => void;
  buildMapsSearchUrl: (query: string) => string;
  buildMapsDirectionsUrl: (
    origin: string,
    destination: string,
    mode?: "transit" | "walking" | "driving"
  ) => string;
};

function Pill({ label, kind }: { label: string; kind: "best" | "budget" }) {
  const colors =
    kind === "best"
      ? {
          borderColor: "rgba(0,255,136,0.35)",
          backgroundColor: "rgba(0,255,136,0.08)",
        }
      : {
          borderColor: "rgba(255,200,80,0.40)",
          backgroundColor: "rgba(255,200,80,0.10)",
        };

  return (
    <View style={[styles.pill, colors]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

export default function StayGuidanceCard({
  primaryLogisticsSnippet,
  stadiumName,
  stadiumCity,
  stadiumMapsUrl,
  stayBestAreas,
  stayBudgetAreas,
  transportStops,
  transportTips,
  lateTransportNote,
  onOpenUrl,
  buildMapsSearchUrl,
  buildMapsDirectionsUrl,
}: Props) {
  const hasContent =
    Boolean(primaryLogisticsSnippet) ||
    Boolean(stadiumName) ||
    stayBestAreas.length > 0 ||
    stayBudgetAreas.length > 0 ||
    transportStops.length > 0 ||
    transportTips.length > 0 ||
    Boolean(lateTransportNote);

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.sectionTitle}>Stay guidance (stadium + best areas)</Text>

      {!hasContent ? (
        <EmptyState
          title="Stay tips not available"
          message="Add a match (or load match details) to unlock stadium-area stay suggestions."
        />
      ) : (
        <View style={styles.guidanceStack}>
          <View style={styles.proxBox}>
            <Text style={styles.proxTitle} numberOfLines={2}>
              {stadiumName || "Stadium"}
              {stadiumCity ? <Text style={styles.proxCity}> • {stadiumCity}</Text> : null}
            </Text>

            <Text style={styles.proxBody}>
              {primaryLogisticsSnippet ||
                "Use the areas below as a shortlist. Tap Transit/Walk for real routes in Google Maps."}
            </Text>

            <Pressable onPress={() => onOpenUrl(stadiumMapsUrl)} style={styles.proxBtn}>
              <Text style={styles.proxBtnText}>Open stadium in maps</Text>
            </Pressable>

            <Text style={styles.proxMuted}>
              Note: distance/time depends on your exact hotel. Use Transit/Walk for real routes.
            </Text>
          </View>

          {stayBestAreas.length > 0 ? (
            <View style={styles.guidanceGroup}>
              <Text style={styles.stayLabel}>Best areas</Text>

              {stayBestAreas.slice(0, 3).map((area, idx) => {
                const stadiumQuery = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
                const areaQuery = [area.area, stadiumCity].filter(Boolean).join(" ").trim();
                const origin = areaQuery || area.area;
                const destination = stadiumQuery || stadiumName || "stadium";

                return (
                  <View key={`best-${idx}`} style={styles.areaRow}>
                    <View style={styles.areaLeft}>
                      <View style={styles.areaTop}>
                        <Text style={styles.areaName} numberOfLines={1}>
                          {area.area}
                        </Text>
                        <Pill label="Best area" kind="best" />
                      </View>
                      {area.notes ? <Text style={styles.areaNotes}>{area.notes}</Text> : null}
                    </View>

                    <View style={styles.areaBtns}>
                      <Pressable onPress={() => onOpenUrl(buildMapsSearchUrl(origin))} style={styles.smallBtn}>
                        <Text style={styles.smallBtnText}>Maps</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onOpenUrl(buildMapsDirectionsUrl(origin, destination, "transit"))}
                        style={styles.smallBtn}
                      >
                        <Text style={styles.smallBtnText}>Transit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onOpenUrl(buildMapsDirectionsUrl(origin, destination, "walking"))}
                        style={styles.smallBtn}
                      >
                        <Text style={styles.smallBtnText}>Walk</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {stayBudgetAreas.length > 0 ? (
            <View style={styles.guidanceGroup}>
              <Text style={styles.stayLabel}>Budget-friendly</Text>

              {stayBudgetAreas.slice(0, 2).map((area, idx) => {
                const stadiumQuery = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
                const areaQuery = [area.area, stadiumCity].filter(Boolean).join(" ").trim();
                const origin = areaQuery || area.area;
                const destination = stadiumQuery || stadiumName || "stadium";

                return (
                  <View key={`budget-${idx}`} style={styles.areaRow}>
                    <View style={styles.areaLeft}>
                      <View style={styles.areaTop}>
                        <Text style={styles.areaName} numberOfLines={1}>
                          {area.area}
                        </Text>
                        <Pill label="Budget" kind="budget" />
                      </View>
                      {area.notes ? <Text style={styles.areaNotes}>{area.notes}</Text> : null}
                    </View>

                    <View style={styles.areaBtns}>
                      <Pressable onPress={() => onOpenUrl(buildMapsSearchUrl(origin))} style={styles.smallBtn}>
                        <Text style={styles.smallBtnText}>Maps</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onOpenUrl(buildMapsDirectionsUrl(origin, destination, "transit"))}
                        style={styles.smallBtn}
                      >
                        <Text style={styles.smallBtnText}>Transit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onOpenUrl(buildMapsDirectionsUrl(origin, destination, "walking"))}
                        style={styles.smallBtn}
                      >
                        <Text style={styles.smallBtnText}>Walk</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {transportStops.length > 0 ? (
            <View style={styles.guidanceGroup}>
              <Text style={styles.stayLabel}>Best transport stops</Text>
              {transportStops.map((line, idx) => (
                <Pressable
                  key={`stop-${idx}`}
                  onPress={() => onOpenUrl(buildMapsSearchUrl([line, stadiumCity].filter(Boolean).join(" ")))}
                  style={styles.stopRow}
                >
                  <Text style={styles.stayBullet} numberOfLines={2}>
                    • {line}
                  </Text>
                  <Text style={styles.chev}>›</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {transportTips.length > 0 ? (
            <View style={styles.guidanceGroup}>
              <Text style={styles.stayLabel}>Matchday tips</Text>
              {transportTips.map((line, idx) => (
                <Text key={`tip-${idx}`} style={styles.stayBullet}>
                  • {line}
                </Text>
              ))}
            </View>
          ) : null}

          {lateTransportNote ? (
            <View style={styles.lateBox}>
              <Text style={styles.lateTitle}>Late transport note</Text>
              <Text style={styles.lateText}>{lateTransportNote}</Text>
            </View>
          ) : null}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing.lg },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },

  guidanceStack: {
    gap: 10,
  },

  guidanceGroup: {
    gap: 6,
  },

  proxBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  proxTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
    lineHeight: 18,
  },

  proxCity: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  proxBody: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  proxMuted: {
    marginTop: 8,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
    lineHeight: 14,
  },

  proxBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  proxBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  stayLabel: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  stayBullet: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  areaRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },

  areaLeft: {
    flex: 1,
  },

  areaTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  areaName: {
    color: theme.colors.text,
    fontWeight: "900",
    flexShrink: 1,
  },

  areaNotes: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  areaBtns: {
    gap: 8,
    alignItems: "flex-end",
  },

  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  pillText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  lateBox: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.28)",
    backgroundColor: "rgba(255,200,80,0.08)",
    padding: 12,
  },

  lateTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  lateText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  smallBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  chev: {
    color: theme.colors.textSecondary,
    fontSize: 22,
    marginTop: -2,
  },
});
