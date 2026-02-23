// src/components/PlanTripBlock.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { openPartnerUrl } from "@/src/services/partnerClicks";
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";

import preferencesStore from "@/src/state/preferences";

type Props = {
  city: string;
  startDate?: string;
  endDate?: string;
  title?: string;
};

function safeCity(v: unknown) {
  const s = String(v ?? "").trim();
  return s || "";
}

function cleanUpper3(v: unknown, fallback: string) {
  const s = String(v ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(s) ? s : fallback;
}

async function openUrl(url?: string) {
  if (!url) {
    Alert.alert("Missing link", "No link available for this action yet.");
    return;
  }
  try {
    await openPartnerUrl(url);
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}

export default function PlanTripBlock({ city, startDate, endDate, title }: Props) {
  const cityName = useMemo(() => safeCity(city), [city]);

  // Preferred origin IATA (CITY code ideally; fallback LON)
  const [originIata, setOriginIata] = useState<string>(() => {
    const s = preferencesStore.getState();
    return cleanUpper3((s as any)?.preferredOriginIata, "LON");
  });

  useEffect(() => {
    let mounted = true;

    const sync = () => {
      if (!mounted) return;
      const s = preferencesStore.getState();
      setOriginIata(cleanUpper3((s as any)?.preferredOriginIata, "LON"));
    };

    const unsub = preferencesStore.subscribe(sync);
    sync();

    if (!preferencesStore.getState().loaded) {
      preferencesStore.load().finally(sync);
    }

    return () => {
      mounted = false;
      try {
        unsub();
      } catch {
        // ignore
      }
    };
  }, []);

  const links = useMemo(() => {
    if (!cityName) return null;

    return buildAffiliateLinks({
      city: cityName,
      startDate,
      endDate,
      originIata, // ✅ prefill Aviasales origin
    });
  }, [cityName, startDate, endDate, originIata]);

  if (!links) return null;

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>{title ?? "Book this trip"}</Text>
      <Text style={styles.subtitle}>
        These open partner search pages for {cityName}.
      </Text>

      <View style={styles.grid}>
        <Pressable style={styles.btn} onPress={() => openUrl(links.hotelsUrl)}>
          <Text style={styles.btnText}>Hotels</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={() => openUrl(links.flightsUrl)}>
          <Text style={styles.btnText}>Flights</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={() => openUrl(links.trainsUrl)}>
          <Text style={styles.btnText}>Trains</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={() => openUrl(links.experiencesUrl)}>
          <Text style={styles.btnText}>Experiences</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => openUrl(links.mapsUrl)} style={{ marginTop: 10 }}>
        <Text style={styles.maps}>Open maps search</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing.lg },
  title: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.md,
  },
  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  grid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  btn: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  btnText: { color: theme.colors.text, fontWeight: theme.fontWeight.black },
  maps: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: theme.fontWeight.bold,
  },
});
