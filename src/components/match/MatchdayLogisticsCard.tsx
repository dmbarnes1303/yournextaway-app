// src/components/match/MatchdayLogisticsCard.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "@/src/constants/theme";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { buildLogisticsSnippet } from "@/src/data/matchdayLogistics";
import { coerceLatLng, haversineKm, estimateTravelMinutes, formatKm, formatMinutes } from "@/src/utils/geo";

type Props = {
  logistics: any | null;
  city: string | null;
  onOpenStop?: (query: string, stop?: any) => void;
  onSelectStayArea?: (area: string) => void;

  // Optional: if you pass kickoffIso we’ll show late-transport hint automatically
  kickoffIso?: string | null;
};

function cleanText(v: unknown) {
  return String(v ?? "").trim();
}

function isLateKickoff(kickoffIso?: string | null): boolean {
  const iso = cleanText(kickoffIso);
  if (!iso) return false;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  const h = d.getHours();
  const m = d.getMinutes();
  // treat 20:30+ as “late” (pragmatic)
  return h > 20 || (h === 20 && m >= 30);
}

function pillCfg(kind: "best" | "budget") {
  if (kind === "best") {
    return { label: "Best area", border: "rgba(0,255,136,0.35)", bg: "rgba(0,255,136,0.08)" };
  }
  return { label: "Budget", border: "rgba(255,200,80,0.40)", bg: "rgba(255,200,80,0.10)" };
}

function Pill({ kind }: { kind: "best" | "budget" }) {
  const c = pillCfg(kind);
  return (
    <View style={[styles.pill, { borderColor: c.border, backgroundColor: c.bg }]}>
      <Text style={styles.pillText}>{c.label}</Text>
    </View>
  );
}

export default function MatchdayLogisticsCard(props: Props) {
  const { logistics, city, onOpenStop, onSelectStayArea, kickoffIso } = props;

  const stadiumName = cleanText(logistics?.stadium) || "Stadium";
  const logisticsCity = cleanText(logistics?.city) || cleanText(city) || "";

  const snippet = useMemo(() => {
    return logistics ? buildLogisticsSnippet(logistics) : "";
  }, [logistics]);

  const stadiumCoord = useMemo(() => coerceLatLng(logistics?.stadiumCoord ?? logistics?.stadiumCoords), [logistics]);
  const centerCoord = useMemo(() => coerceLatLng(logistics?.cityCenterCoord ?? logistics?.cityCenterCoords), [logistics]);

  const proximityLine = useMemo(() => {
    if (!stadiumCoord || !centerCoord) return null;
    const km = haversineKm(centerCoord, stadiumCoord);
    const t = estimateTravelMinutes(km);
    return `${formatKm(km)} • ~${formatMinutes(t.minutes)} (${t.mode}) from city center`;
  }, [stadiumCoord, centerCoord]);

  const bestAreas: Array<{ area: string; notes?: string; coord?: any }> = useMemo(() => {
    const arr = Array.isArray(logistics?.stay?.bestAreas) ? logistics.stay.bestAreas : [];
    return arr
      .map((x: any) => ({
        area: cleanText(x?.area),
        notes: cleanText(x?.notes) || undefined,
        coord: x?.coord ?? x?.coords ?? null,
      }))
      .filter((x: any) => x.area);
  }, [logistics]);

  const budgetAreas: Array<{ area: string; notes?: string; coord?: any }> = useMemo(() => {
    const arr = Array.isArray(logistics?.stay?.budgetAreas) ? logistics.stay.budgetAreas : [];
    return arr
      .map((x: any) => ({
        area: cleanText(x?.area),
        notes: cleanText(x?.notes) || undefined,
        coord: x?.coord ?? x?.coords ?? null,
      }))
      .filter((x: any) => x.area);
  }, [logistics]);

  const stops: Array<{ name: string; notes?: string }> = useMemo(() => {
    const arr = Array.isArray(logistics?.transport?.primaryStops) ? logistics.transport.primaryStops : [];
    return arr
      .map((s: any) => ({ name: cleanText(s?.name), notes: cleanText(s?.notes) || undefined }))
      .filter((s: any) => s.name);
  }, [logistics]);

  const tips: string[] = useMemo(() => {
    const arr = Array.isArray(logistics?.transport?.tips) ? logistics.transport.tips : [];
    return arr.map((t: any) => cleanText(t)).filter(Boolean);
  }, [logistics]);

  const lateTransportNote = useMemo(() => {
    const explicit = cleanText(logistics?.transport?.lateNightNote);
    if (explicit) return explicit;
    if (isLateKickoff(kickoffIso)) {
      return "Late kickoff: check last trains/metros and pre-book a taxi/Uber fallback after the match.";
    }
    return "";
  }, [logistics, kickoffIso]);

  const stadiumQuery = useMemo(() => {
    const bits = [stadiumName, logisticsCity].filter(Boolean).join(" ").trim();
    return bits || stadiumName;
  }, [stadiumName, logisticsCity]);

  function openStadium() {
    if (!onOpenStop) return;
    onOpenStop(stadiumQuery, { kind: "stadium" });
  }

  function openArea(area: string) {
    if (!onOpenStop) return;
    const q = [area, logisticsCity].filter(Boolean).join(" ").trim();
    onOpenStop(q || area, { kind: "area", area });
  }

  if (!logistics) {
    return (
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Stadium proximity</Text>
        <EmptyState
          title="Not available"
          message="We don’t have stadium-area logistics for this match yet."
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Stadium proximity</Text>

      <View style={styles.proxBox}>
        <Text style={styles.proxHeadline} numberOfLines={2}>
          {stadiumName}
          {logisticsCity ? <Text style={styles.proxCity}> • {logisticsCity}</Text> : null}
        </Text>

        {snippet ? <Text style={styles.proxSnippet}>{snippet}</Text> : null}

        {proximityLine ? (
          <Text style={styles.proxLine}>{proximityLine}</Text>
        ) : (
          <Text style={styles.proxLineMuted}>
            Open in maps to see live distance + travel time (we’ll show estimates once coords are added).
          </Text>
        )}

        {onOpenStop ? (
          <Pressable onPress={openStadium} style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Open stadium in maps</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ marginTop: 12, gap: 10 }}>
        <Text style={styles.subTitle}>Where to stay (near the stadium)</Text>

        {bestAreas.length === 0 && budgetAreas.length === 0 ? (
          <EmptyState
            title="No stay areas yet"
            message="Add stay-area recommendations for this club/city to unlock guidance."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {bestAreas.slice(0, 3).map((a, idx) => (
              <View key={`best-${idx}`} style={styles.areaRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.areaTop}>
                    <Text style={styles.areaName} numberOfLines={1}>
                      {a.area}
                    </Text>
                    <Pill kind="best" />
                  </View>
                  {a.notes ? <Text style={styles.areaNotes}>{a.notes}</Text> : null}
                </View>

                <View style={styles.areaBtns}>
                  {onOpenStop ? (
                    <Pressable onPress={() => openArea(a.area)} style={styles.smallBtn}>
                      <Text style={styles.smallBtnText}>Maps</Text>
                    </Pressable>
                  ) : null}
                  {onSelectStayArea ? (
                    <Pressable onPress={() => onSelectStayArea(a.area)} style={[styles.smallBtn, styles.smallBtnPrimary]}>
                      <Text style={styles.smallBtnText}>Use</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}

            {budgetAreas.slice(0, 2).map((a, idx) => (
              <View key={`budget-${idx}`} style={styles.areaRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.areaTop}>
                    <Text style={styles.areaName} numberOfLines={1}>
                      {a.area}
                    </Text>
                    <Pill kind="budget" />
                  </View>
                  {a.notes ? <Text style={styles.areaNotes}>{a.notes}</Text> : null}
                </View>

                <View style={styles.areaBtns}>
                  {onOpenStop ? (
                    <Pressable onPress={() => openArea(a.area)} style={styles.smallBtn}>
                      <Text style={styles.smallBtnText}>Maps</Text>
                    </Pressable>
                  ) : null}
                  {onSelectStayArea ? (
                    <Pressable onPress={() => onSelectStayArea(a.area)} style={[styles.smallBtn, styles.smallBtnPrimary]}>
                      <Text style={styles.smallBtnText}>Use</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {stops.length > 0 ? (
          <View style={{ gap: 6, marginTop: 6 }}>
            <Text style={styles.subTitle}>Best transport stops</Text>
            {stops.slice(0, 3).map((s, idx) => {
              const line = `${s.name}${s.notes ? ` — ${s.notes}` : ""}`;
              return (
                <Pressable
                  key={`stop-${idx}`}
                  onPress={() => onOpenStop?.([s.name, logisticsCity].filter(Boolean).join(" ").trim(), s)}
                  disabled={!onOpenStop}
                  style={styles.stopRow}
                >
                  <Text style={styles.stopText} numberOfLines={2}>
                    • {line}
                  </Text>
                  {onOpenStop ? <Text style={styles.chev}>›</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {tips.length > 0 ? (
          <View style={{ gap: 6, marginTop: 6 }}>
            <Text style={styles.subTitle}>Matchday tips</Text>
            {tips.slice(0, 3).map((t, idx) => (
              <Text key={`tip-${idx}`} style={styles.tipText}>
                • {t}
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
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing.lg },

  title: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },

  subTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  proxBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  proxHeadline: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
    lineHeight: 18,
  },
  proxCity: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  proxSnippet: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  proxLine: {
    marginTop: 8,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  proxLineMuted: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  ctaBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  ctaText: { color: theme.colors.text, fontWeight: "900" },

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

  areaTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  areaName: { color: theme.colors.text, fontWeight: "900", flexShrink: 1 },
  areaNotes: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  areaBtns: { gap: 8, alignItems: "flex-end" },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  smallBtnPrimary: { borderColor: "rgba(0,255,136,0.55)" },
  smallBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { color: theme.colors.text, fontWeight: "900", fontSize: 11 },

  stopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  stopText: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16, flex: 1 },
  tipText: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  lateBox: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.28)",
    backgroundColor: "rgba(255,200,80,0.08)",
    padding: 12,
  },
  lateTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
  lateText: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  chev: { color: theme.colors.textSecondary, fontSize: 22, marginTop: -2 },
});
