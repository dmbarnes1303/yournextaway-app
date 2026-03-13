import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";
import type { SearchResult } from "@/src/services/searchIndex";

type Props = {
  q: string;
  setQ: (s: string) => void;
  clearSearch: () => void;
  showSearchResults: boolean;
  searchBuilding: boolean;
  searchError: string | null;
  results: SearchResult[];
  onPressResult: (r: SearchResult) => void;

  goDiscover: () => void;
  goFixtures: () => void;
  goTrips: () => void;
};

export default function HeroSearch({
  q,
  setQ,
  clearSearch,
  showSearchResults,
  searchBuilding,
  searchError,
  results,
  onPressResult,
  goDiscover,
  goFixtures,
  goTrips,
}: Props) {
  return (
    <GlassCard strength="strong" style={styles.hero} noPadding>
      <View style={styles.heroInner}>
        <Text style={styles.heroKicker}>YOURNEXTAWAY</Text>
        <Text style={styles.heroTitle}>Your football travel hub</Text>

        <View style={styles.searchBox}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search…"
            placeholderTextColor={theme.colors.textTertiary}
            style={styles.searchInput}
          />

          {q.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>

        {!showSearchResults && (
          <View style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={goDiscover}>
              <Text style={styles.primaryText}>Discover</Text>
              <Text style={styles.sub}>I need ideas</Text>
            </Pressable>

            <Pressable style={styles.ghostBtn} onPress={goFixtures}>
              <Text style={styles.primaryText}>Fixtures</Text>
              <Text style={styles.sub}>Browse matches</Text>
            </Pressable>

            <Pressable style={styles.ghostBtn} onPress={goTrips}>
              <Text style={styles.primaryText}>Trips</Text>
              <Text style={styles.sub}>Resume planning</Text>
            </Pressable>
          </View>
        )}

        {showSearchResults && (
          <View style={styles.results}>
            {searchBuilding && <ActivityIndicator />}

            {searchError && (
              <EmptyState title="Search unavailable" message={searchError} />
            )}

            {!searchBuilding &&
              !searchError &&
              results.map((r, i) => (
                <Pressable
                  key={`${r.key}-${i}`}
                  onPress={() => onPressResult(r)}
                  style={styles.resultRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle}>{r.title}</Text>
                    <Text style={styles.resultMeta}>{r.subtitle}</Text>
                  </View>
                </Pressable>
              ))}
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 26 },
  heroInner: { padding: 20, gap: 10 },

  heroKicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  heroTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "900",
  },

  searchBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
  },

  clearText: {
    color: theme.colors.textSecondary,
  },

  actions: { gap: 10 },

  primaryBtn: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.25)",
  },

  ghostBtn: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  primaryText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  results: { marginTop: 10, gap: 8 },

  resultRow: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  resultTitle: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  resultMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});
