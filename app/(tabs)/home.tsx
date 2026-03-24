// app/(tabs)/home.tsx

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import ContinuePlanning from "@/src/features/home/ContinuePlanning";
import UpcomingMatches from "@/src/features/home/UpcomingMatches";

import { getCityImageUrl } from "@/src/data/cityImages";
import { theme } from "@/src/constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");

  // 🔥 HERO DATA (swap dynamically later)
  const hero = {
    title: "Milan football weekend",
    subtitle: "San Siro nights, city guide & best fixtures",
    image: getCityImageUrl("milan"),
  };

  const tripIdeas = useMemo(
    () => [
      {
        city: "Milan",
        title: "San Siro nights + city break",
        image: getCityImageUrl("milan"),
      },
      {
        city: "Dortmund",
        title: "Yellow Wall experience weekend",
        image: getCityImageUrl("dortmund"),
      },
      {
        city: "Lisbon",
        title: "Sun, stadiums & cheap flights",
        image: getCityImageUrl("lisbon"),
      },
    ],
    []
  );

  return (
    <Background mode="solid" solidColor="#050708">
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* 🔥 HERO */}
          <Pressable style={styles.hero}>
            <Image source={{ uri: hero.image }} style={styles.heroImg} />
            <View style={styles.heroOverlay} />

            <View style={styles.heroContent}>
              <Text style={styles.heroTag}>TOP PICK THIS WEEK</Text>

              <Text style={styles.heroTitle}>{hero.title}</Text>
              <Text style={styles.heroSubtitle}>{hero.subtitle}</Text>

              <View style={styles.heroActions}>
                <Pressable style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Plan this trip</Text>
                </Pressable>

                <Text style={styles.secondaryLink}>View details →</Text>
              </View>
            </View>
          </Pressable>

          {/* 🔍 SEARCH */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <TextInput
                placeholder="Search teams, cities or stadiums"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={q}
                onChangeText={setQ}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.quickRow}>
              <Quick text="Next 14 days" />
              <Quick text="Top cities" />
              <Quick text="All fixtures" />
            </View>
          </View>

          {/* 🧳 CONTINUE PLANNING */}
          <ContinuePlanning />

          {/* ⚽ MATCHES */}
          <UpcomingMatches />

          {/* 🔥 TRIP IDEAS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trip ideas</Text>
              <Text style={styles.link}>See more →</Text>
            </View>

            <View style={styles.ideaGrid}>
              {tripIdeas.map((item, i) => (
                <Pressable key={i} style={styles.ideaCard}>
                  <Image source={{ uri: item.image }} style={styles.ideaImg} />
                  <View style={styles.ideaOverlay} />

                  <View style={styles.ideaContent}>
                    <Text style={styles.ideaCity}>{item.city}</Text>
                    <Text style={styles.ideaTitle}>{item.title}</Text>
                    <Text style={styles.ideaLink}>Explore →</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* ---------- small component ---------- */

function Quick({ text }: { text: string }) {
  return (
    <Pressable style={styles.quickPill}>
      <Text style={styles.quickText}>{text}</Text>
    </Pressable>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    padding: 16,
    gap: 22,
  },

  /* HERO */

  hero: {
    height: 320,
    borderRadius: 28,
    overflow: "hidden",
  },

  heroImg: {
    ...StyleSheet.absoluteFillObject,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 18,
    gap: 6,
  },

  heroTag: {
    color: "#F5CC57",
    fontSize: 11,
    fontWeight: "800",
  },

  heroTitle: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "900",
  },

  heroSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },

  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },

  primaryBtn: {
    backgroundColor: "rgba(34,197,94,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },

  primaryBtnText: {
    color: "#8EF2A5",
    fontWeight: "800",
  },

  secondaryLink: {
    color: "rgba(255,255,255,0.7)",
  },

  /* SEARCH */

  searchWrap: {
    gap: 10,
  },

  searchBar: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "center",
  },

  searchInput: {
    color: "#FFF",
    fontSize: 15,
  },

  quickRow: {
    flexDirection: "row",
    gap: 8,
  },

  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  quickText: {
    color: "#ccc",
    fontSize: 12,
    fontWeight: "700",
  },

  /* SECTION */

  section: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
  },

  link: {
    color: "rgba(255,255,255,0.6)",
  },

  /* IDEAS */

  ideaGrid: {
    gap: 12,
  },

  ideaCard: {
    height: 160,
    borderRadius: 24,
    overflow: "hidden",
  },

  ideaImg: {
    ...StyleSheet.absoluteFillObject,
  },

  ideaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  ideaContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 14,
    gap: 4,
  },

  ideaCity: {
    color: "#8EF2A5",
    fontSize: 12,
    fontWeight: "800",
  },

  ideaTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },

  ideaLink: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
});
