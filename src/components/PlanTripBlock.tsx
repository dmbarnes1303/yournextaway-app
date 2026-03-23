// src/components/PlanTripBlock.tsx
import React, { useMemo } from "react";
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

function cleanCity(v: unknown): string {
  const s = String(v ?? "").trim();
  return s || "";
}

async function openUrl(url?: string | null) {
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

export default function PlanTripBlock({
  city,
  startDate,
  endDate,
  title,
}: Props) {
  const cityName = useMemo(() => cleanCity(city), [city]);

  const originIata = useMemo(() => {
    try {
      return preferencesStore.getPreferredOriginIata?.() ?? "LON";
    } catch {
      return "LON";
    }
  }, []);

  const links = useMemo(() => {
    if (!cityName) return null;

    try {
      return buildAffiliateLinks({
        city: cityName,
        startDate,
        endDate,
        originIata,
      });
    } catch {
      return null;
    }
  }, [cityName, startDate, endDate, originIata]);

  if (!links) return null;

  const transportUrl = links.transportUrl ?? links.omioUrl ?? null;

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

        <Pressable style={styles.btn} onPress={() => openUrl(transportUrl)}>
          <Text style={styles.btnText}>Transport</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={() => openUrl(links.experiencesUrl)}>
          <Text style={styles.btnText}>Experiences</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => openUrl(links.mapsUrl)} style={styles.mapsWrap}>
        <Text style={styles.maps}>Open maps search</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
  },

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

  btnText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
  },

  mapsWrap: {
    marginTop: 10,
  },

  maps: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: theme.fontWeight.bold,
  },
});
