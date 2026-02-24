// src/components/match/MatchdayLogisticsCard.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";

import { getStadiumCoordByClubName } from "@/src/data/stadiumCoords";
import { haversineKm, estimateTravelTimeMinutes, formatKm, formatMins } from "@/src/utils/geo";

import type { MatchdayLogistics } from "@/src/data/matchdayLogistics/types";
import type { LogisticsStop } from "@/src/data/matchdayLogistics/types";

/**
 * NOTE:
 * We don’t have coordinates for each “stay area” (e.g., Borough / Eixample).
 * So Phase-1 proximity uses:
 * - stadium coords (accurate)
 * - “city center” proxy = stadium city unknown -> no calc
 *
 * If you later add city-center coords per city, we can upgrade this to:
 * distance(stay area centroid -> stadium)
 */

export default function MatchdayLogisticsCard(props: {
  logistics: MatchdayLogistics | null | undefined;
  city?: string | null;
  onOpenStop?: (query: string, stop?: LogisticsStop) => void;
  onSelectStayArea?: (area: string) => void;
}) {
  const { logistics, city, onOpenStop, onSelectStayArea } = props;

  const stadiumName = String(logistics?.stadium ?? "").trim();
  const clubName = String(logistics?.clubName ?? "").trim(); // optional if you store it
  const league = String(logistics?.league ?? "").trim();

  // Best-effort: stadium coords from club name first, else try stadium name
  const stadiumCoord = useMemo(() => {
    const byClub = getStadiumCoordByClubName(clubName || logistics?.homeTeamName || null);
    if (byClub) return { lat: byClub.lat, lng: byClub.lng, stadiumName: byClub.stadiumName ?? stadiumName };

    // fallback: try using stadium string as “club name” key (works sometimes)
    const byStadiumAsKey = getStadiumCoordByClubName(stadiumName);
    if (byStadiumAsKey) return { lat: byStadiumAsKey.lat, lng: byStadiumAsKey.lng, stadiumName };

    return null;
  }, [clubName, logistics?.homeTeamName, stadiumName]);

  // We cannot compute “distance to stadium” without a second point.
  // For Phase-1 we use a heuristic: assume “city centre” is ~3.5km from stadium unless known.
  // This is intentionally conservative and labeled as estimate.
  const proximity = useMemo(() => {
    if (!stadiumCoord) return null;

    // If you later add CITY_CENTER_COORDS, replace this section.
    const assumedCityCentre = null as any;

    if (!assumedCityCentre) {
      // fallback heuristic bucket only
      return {
        label: "Proximity estimate",
        distanceKm: 3.5,
        travel: estimateTravelTimeMinutes(3.5),
        estimated: true,
      };
    }

    const km = haversineKm(assumedCityCentre, stadiumCoord);
    return {
      label: "City centre → stadium",
      distanceKm: km,
      travel: estimateTravelTimeMinutes(km),
      estimated: false,
    };
  }, [stadiumCoord]);

  const bestAreas = Array.isArray(logistics?.stay?.bestAreas) ? logistics!.stay!.bestAreas : [];
  const budgetAreas = Array.isArray(logistics?.stay?.budgetAreas) ? logistics!.stay!.budgetAreas : [];
  const stops = Array.isArray(logistics?.transport?.primaryStops) ? logistics!.transport!.primaryStops : [];
  const tips = Array.isArray(logistics?.transport?.tips) ? logistics!.transport!.tips : [];

  if (!logistics) {
    return (
      <GlassCard style={styles.card}>
        <EmptyState title="Matchday logistics" message="No logistics guidance available for this match yet." />
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.h1}>Matchday logistics</Text>

      <View style={styles.metaRow}>
        {league ? <Text style={styles.meta}>League: {league}</Text> : null}
        {city ? <Text style={styles.meta}>City: {String(city).trim()}</Text> : null}
      </View>

      <View style={styles.stadiumBox}>
        <Text style={styles.stadiumTitle}>Stadium</Text>
        <Text style={styles.stadiumName}>{stadiumName || "—"}</Text>

        {proximity ? (
          <View style={styles.proxRow}>
            <View style={styles.proxPill}>
              <Text style={styles.proxPillText}>
                {formatKm(proximity.distanceKm)} • {formatMins(proximity.travel.minutes)} ({proximity.travel.mode})
                {proximity.estimated ? " • estimate" : ""}
              </Text>
            </View>

            {stadiumName ? (
              <Pressable
                onPress={() => onOpenStop?.([stadiumName, city].filter(Boolean).join(" ").trim(), undefined)}
                style={styles.mapBtn}
              >
                <Text style={styles.mapBtnText}>Map</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Text style={styles.smallMuted}>Proximity not available (missing stadium coordinates).</Text>
        )}

        {tips.length ? (
          <View style={{ marginTop: 10, gap: 6 }}>
            <Text style={styles.label}>Late transport note</Text>
            <Text style={styles.bullet}>• {String(tips[0]).trim()}</Text>
          </View>
        ) : null}
      </View>

      {bestAreas.length ? (
        <View style={styles.section}>
          <Text style={styles.label}>Best areas (recommended)</Text>
          {bestAreas.slice(0, 4).map((a, idx) => {
            const area = String(a.area ?? "").trim();
            const note = String(a.notes ?? "").trim();
            const line = [area, note ? `— ${note}` : ""].filter(Boolean).join(" ");
            return (
              <Pressable
                key={`best-${idx}`}
                onPress={() => (area ? onSelectStayArea?.(area) : null)}
                style={styles.areaRow}
              >
                <Text style={styles.bullet}>• {line}</Text>
                {area ? <Text style={styles.pick}>Pick</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {budgetAreas.length ? (
        <View style={styles.section}>
          <Text style={styles.label}>Budget-friendly</Text>
          {budgetAreas.slice(0, 3).map((a, idx) => {
            const area = String(a.area ?? "").trim();
            const note = String(a.notes ?? "").trim();
            const line = [area, note ? `— ${note}` : ""].filter(Boolean).join(" ");
            return (
              <Pressable
                key={`budget-${idx}`}
                onPress={() => (area ? onSelectStayArea?.(area) : null)}
                style={styles.areaRow}
              >
                <Text style={styles.bullet}>• {line}</Text>
                {area ? <Text style={styles.pick}>Pick</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {stops.length ? (
        <View style={styles.section}>
          <Text style={styles.label}>Best transport stops</Text>
          {stops.slice(0, 4).map((s, idx) => {
            const name = String(s.name ?? "").trim();
            const note = String(s.notes ?? "").trim();
            const q = [name, city].filter(Boolean).join(" ").trim();
            return (
              <Pressable key={`stop-${idx}`} onPress={() => onOpenStop?.(q, s)} style={styles.stopRow}>
                <Text style={styles.bullet}>• {name}{note ? ` — ${note}` : ""}</Text>
                <Text style={styles.pick}>Map</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing.lg },

  h1: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  metaRow: { marginTop: 8, gap: 4 },
  meta: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  stadiumBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  stadiumTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
  stadiumName: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: 14 },

  proxRow: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

  proxPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.22)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  proxPillText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  mapBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mapBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  smallMuted: { marginTop: 10, color: theme.colors.textTertiary, fontWeight: "800", fontSize: 12 },

  section: { marginTop: 12, gap: 8 },
  label: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  bullet: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },
  pick: { color: theme.colors.primary, fontWeight: "900", fontSize: 12 },
});
