// app/(tabs)/fixtures.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
  Keyboard,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { LEAGUES, getRollingWindowIso, normalizeWindowIso, type LeagueOption } from "@/src/constants/football";
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getFlagImageUrl } from "@/src/utils/flagImages";

type GroupMode = "date" | "league";

const MAX_LEAGUES = 10;
const FETCH_CONCURRENCY = 3;

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function isoDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const da = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function parseIsoDateOnly(iso: string): Date | null {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function compareIso(a: string, b: string) {
  // ISO date-only lexical compare works
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function withinRange(iso: string, from: string, to: string) {
  // inclusive range
  return compareIso(iso, from) >= 0 && compareIso(iso, to) <= 0;
}

function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function rowTitle(r: FixtureListRow) {
  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  return `${home} vs ${away}`;
}

function rowMeta(r: FixtureListRow) {
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
  const venue = r?.fixture?.venue?.name ?? "";
  const city = r?.fixture?.venue?.city ?? "";
  const extra = [venue, city].filter(Boolean).join(" • ");
  return extra ? `${kickoff} • ${extra}` : kickoff;
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function LeagueFlag({ code }: { code: string }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flag} />;
}

function CrestSquare({ r }: { r: FixtureListRow }) {
  const homeName = r?.teams?.home?.name ?? "";
  const logo = r?.teams?.home?.logo;

  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(homeName)}</Text>
      )}
      <View pointerEvents="none" style={styles.crestRing} />
    </View>
  );
}

type LeagueFetchState = {
  rowsByLeague: Record<number, FixtureListRow[]>;
  loaded: Set<number>;
};

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      out[i] = await worker(items[i], i);
    }
  }

  const runners = Array.from({ length: Math.max(1, limit) }, () => runner());
  await Promise.all(runners);
  return out;
}

function resolveInitialLeagues(paramsLeagueId: unknown, paramsSeason: unknown): LeagueOption[] {
  const leagueIdStr = String(paramsLeagueId ?? "").trim().toLowerCase();
  const leagueIdNum = coerceNumber(paramsLeagueId);
  const seasonNum = coerceNumber(paramsSeason);

  if (leagueIdStr === "all") {
    return LEAGUES.slice(0, MAX_LEAGUES);
  }

  if (leagueIdNum) {
    const hit = LEAGUES.find((l) => l.leagueId === leagueIdNum);
    if (hit) return [{ ...hit, season: seasonNum ?? hit.season }];
  }

  // Default = top 5 (lighter first render)
  return LEAGUES.slice(0, 5);
}

type PresetKey = "wknd" | "d7" | "d14" | "d30" | "d90";

function presetLabel(k: PresetKey) {
  if (k === "wknd") return "This weekend";
  if (k === "d7") return "Next 7";
  if (k === "d14") return "Next 14";
  if (k === "d30") return "Next 30";
  return "Next 90";
}

function computePresetWindow(k: PresetKey): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = addDays(today, 1);

  if (k === "wknd") {
    // next Sat–Sun (from Sat to Sun)
    const d = new Date(tomorrow);
    const day = d.getDay(); // 0 Sun..6 Sat
    const daysUntilSat = (6 - day + 7) % 7;
    const sat = addDays(d, daysUntilSat);
    sat.setHours(0, 0, 0, 0);
    const sun = addDays(sat, 1);
    sun.setHours(0, 0, 0, 0);
    return { from: isoDayLocal(sat), to: isoDayLocal(sun) };
  }

  const days = k === "d7" ? 7 : k === "d14" ? 14 : k === "d30" ? 30 : 90;
  const from = isoDayLocal(tomorrow);
  const to = isoDayLocal(addDays(tomorrow, Math.max(1, days)));
  return { from, to };
}

/**
 * Minimal calendar month grid (no deps).
 * - Tap to set start, then end.
 * - Tap new day after range set: resets start.
 */
function CalendarRangeModal(props: {
  open: boolean;
  onClose: () => void;
  fromIso: string;
  toIso: string;
  onApply: (next: { from: string; to: string }) => void;
}) {
  const { open, onClose, fromIso, toIso, onApply } = props;

  const initialFrom = useMemo(() => parseIsoDateOnly(fromIso) ?? new Date(), [fromIso]);
  const initialTo = useMemo(() => parseIsoDateOnly(toIso) ?? addDays(new Date(), 7), [toIso]);

  const [draftFrom, setDraftFrom] = useState<string>(fromIso);
  const [draftTo, setDraftTo] = useState<string>(toIso);

  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date(initialFrom);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    if (!open) return;
    setDraftFrom(fromIso);
    setDraftTo(toIso);

    const d = parseIsoDateOnly(fromIso) ?? new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setMonthCursor(d);
  }, [open, fromIso, toIso]);

  const monthTitle = useMemo(() => {
    return monthCursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }, [monthCursor]);

  const grid = useMemo(() => {
    // Build a 6x7 grid
    const first = new Date(monthCursor);
    const firstDay = new Date(first);
    firstDay.setDate(1);
    const startWeekday = firstDay.getDay(); // 0 Sun..6 Sat

    // We want Mon-first. Convert:
    const startOffset = (startWeekday + 6) % 7; // 0 for Mon, 6 for Sun

    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: Array<{ iso: string | null; label: string }> = [];

    for (let i = 0; i < startOffset; i++) cells.push({ iso: null, label: "" });

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(first.getFullYear(), first.getMonth(), d, 0, 0, 0, 0);
      cells.push({ iso: isoDayLocal(dt), label: String(d) });
    }

    while (cells.length < 42) cells.push({ iso: null, label: "" });
    return cells;
  }, [monthCursor]);

  const onTapDay = useCallback(
    (iso: string) => {
      const a = draftFrom;
      const b = draftTo;

      // If range exists and user taps another day: restart selection
      if (a && b && a !== b) {
        setDraftFrom(iso);
        setDraftTo(iso);
        return;
      }

      // If only one day selected (or same), extend to range
      if (!a) {
        setDraftFrom(iso);
        setDraftTo(iso);
        return;
      }

      // If from exists, choose end
      const from = a;
      const to = iso;

      if (compareIso(to, from) < 0) {
        setDraftFrom(to);
        setDraftTo(from);
      } else {
        setDraftFrom(from);
        setDraftTo(to);
      }
    },
    [draftFrom, draftTo]
  );

  const inDraftRange = useCallback(
    (iso: string) => {
      const a = draftFrom;
      const b = draftTo;
      if (!a || !b) return false;
      return withinRange(iso, a, b);
    },
    [draftFrom, draftTo]
  );

  const isRangeEdge = useCallback(
    (iso: string) => {
      return iso === draftFrom || iso === draftTo;
    },
    [draftFrom, draftTo]
  );

  const goPrev = useCallback(() => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    setMonthCursor(d);
  }, [monthCursor]);

  const goNext = useCallback(() => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    setMonthCursor(d);
  }, [monthCursor]);

  const apply = useCallback(() => {
    // Ensure sane order and non-empty
    const a = draftFrom;
    const b = draftTo || draftFrom;
    const from = compareIso(a, b) <= 0 ? a : b;
    const to = compareIso(a, b) <= 0 ? b : a;
    onApply({ from, to });
    onClose();
  }, [draftFrom, draftTo, onApply, onClose]);

  const setPreset = useCallback(
    (k: PresetKey) => {
      const w = computePresetWindow(k);
      setDraftFrom(w.from);
      setDraftTo(w.to);

      const d = parseIsoDateOnly(w.from) ?? new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      setMonthCursor(d);
    },
    []
  );

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />

      <View style={styles.modalSheetWrap} pointerEvents="box-none">
        <GlassCard strength="strong" style={styles.modalSheet} noPadding>
          <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select dates</Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.92 }]}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.modalSummaryRow}>
              <View style={styles.modalSummaryChip}>
                <Text style={styles.modalSummaryText}>{formatUkDateOnly(draftFrom)}</Text>
              </View>
              <Text style={styles.modalSummaryArrow}>→</Text>
              <View style={styles.modalSummaryChip}>
                <Text style={styles.modalSummaryText}>{formatUkDateOnly(draftTo)}</Text>
              </View>
            </View>

            <View style={styles.presetRow}>
              {(["wknd", "d7", "d14", "d30", "d90"] as PresetKey[]).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setPreset(k)}
                  style={({ pressed }) => [styles.presetPill, pressed && { opacity: 0.94 }]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={styles.presetPillText}>{presetLabel(k)}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.calHeader}>
              <Pressable
                onPress={goPrev}
                hitSlop={10}
                style={({ pressed }) => [styles.calNavBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.calNavText}>‹</Text>
              </Pressable>

              <Text style={styles.calTitle}>{monthTitle}</Text>

              <Pressable
                onPress={goNext}
                hitSlop={10}
                style={({ pressed }) => [styles.calNavBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.calNavText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekHeaderRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                <Text key={w} style={styles.weekHeaderText}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {grid.map((c, idx) => {
                const iso = c.iso;
                const disabled = !iso;
                const active = iso ? inDraftRange(iso) : false;
                const edge = iso ? isRangeEdge(iso) : false;

                return (
                  <Pressable
                    key={`${idx}-${c.label}`}
                    disabled={disabled}
                    onPress={() => (iso ? onTapDay(iso) : null)}
                    style={({ pressed }) => [
                      styles.calCell,
                      disabled && { opacity: 0.15 },
                      active && styles.calCellActive,
                      edge && styles.calCellEdge,
                      pressed && !disabled && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                    ]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={[styles.calCellText, active && styles.calCellTextActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setDraftFrom(fromIso);
                  setDraftTo(toIso);
                }}
                style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.94 }]}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <Text style={styles.btnGhostText}>Reset</Text>
              </Pressable>

              <Pressable
                onPress={apply}
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.94 }]}
                android_ripple={{ color: "rgba(79,224,138,0.12)" }}
              >
                <Text style={styles.btnPrimaryText}>Apply</Text>
              </Pressable>
            </View>

            <Text style={styles.modalFootnote}>
              Tip: tap one day for a single-date range; tap another day to extend.
            </Text>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

function LeaguesModal(props: {
  open: boolean;
  onClose: () => void;
  selected: LeagueOption[];
  onApply: (next: LeagueOption[]) => void;
}) {
  const { open, onClose, selected, onApply } = props;

  const [draft, setDraft] = useState<LeagueOption[]>(selected);

  useEffect(() => {
    if (!open) return;
    setDraft(selected);
  }, [open, selected]);

  const selectedIds = useMemo(() => new Set(draft.map((l) => l.leagueId)), [draft]);
  const canAddMore = draft.length < MAX_LEAGUES;

  const toggle = useCallback(
    (l: LeagueOption) => {
      setDraft((prev) => {
        const has = prev.some((x) => x.leagueId === l.leagueId);
        if (has) return prev.filter((x) => x.leagueId !== l.leagueId);
        if (prev.length >= MAX_LEAGUES) return prev;
        return [...prev, l];
      });
    },
    []
  );

  const apply = useCallback(() => {
    const trimmed = draft.slice(0, MAX_LEAGUES);
    onApply(trimmed.length ? trimmed : LEAGUES.slice(0, 5));
    onClose();
  }, [draft, onApply, onClose]);

  const clear = useCallback(() => setDraft([]), []);
  const top5 = useCallback(() => setDraft(LEAGUES.slice(0, 5)), []);
  const top10 = useCallback(() => setDraft(LEAGUES.slice(0, 10)), []);
  const all10 = useCallback(() => setDraft(LEAGUES.slice(0, MAX_LEAGUES)), []);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />

      <View style={styles.modalSheetWrap} pointerEvents="box-none">
        <GlassCard strength="strong" style={styles.modalSheet} noPadding>
          <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select leagues</Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.92 }]}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.modalSummaryRow}>
              <View style={styles.modalSummaryChip}>
                <Text style={styles.modalSummaryText}>
                  {draft.length}/{MAX_LEAGUES} selected
                </Text>
              </View>
              <Text style={styles.modalSummaryHint}>
                {canAddMore ? "Pick up to 10." : "Max reached."}
              </Text>
            </View>

            <View style={styles.presetRow}>
              <Pressable onPress={top5} style={({ pressed }) => [styles.presetPill, pressed && { opacity: 0.94 }]}>
                <Text style={styles.presetPillText}>Top 5</Text>
              </Pressable>
              <Pressable onPress={top10} style={({ pressed }) => [styles.presetPill, pressed && { opacity: 0.94 }]}>
                <Text style={styles.presetPillText}>Top 10</Text>
              </Pressable>
              <Pressable onPress={all10} style={({ pressed }) => [styles.presetPill, pressed && { opacity: 0.94 }]}>
                <Text style={styles.presetPillText}>All (10)</Text>
              </Pressable>
              <Pressable onPress={clear} style={({ pressed }) => [styles.presetPill, pressed && { opacity: 0.94 }]}>
                <Text style={styles.presetPillText}>Clear</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                {LEAGUES.map((l) => {
                  const active = selectedIds.has(l.leagueId);
                  const disabled = !active && draft.length >= MAX_LEAGUES;

                  return (
                    <Pressable
                      key={l.leagueId}
                      disabled={disabled}
                      onPress={() => toggle(l)}
                      style={({ pressed }) => [
                        styles.leagueRowItem,
                        active && styles.leagueRowItemActive,
                        disabled && { opacity: 0.55 },
                        pressed && !disabled && { opacity: 0.94 },
                      ]}
                      android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                    >
                      <View style={styles.checkbox}>
                        <View style={[styles.checkboxInner, active && styles.checkboxInnerActive]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.leagueRowTitle}>{l.label}</Text>
                        <Text style={styles.leagueRowSub}>Season {l.season}</Text>
                      </View>
                      <LeagueFlag code={l.countryCode} />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.94 }]}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={apply}
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.94 }]}
                android_ripple={{ color: "rgba(79,224,138,0.12)" }}
              >
                <Text style={styles.btnPrimaryText}>Apply</Text>
              </Pressable>
            </View>

            <Text style={styles.modalFootnote}>Session-only: we’re not persisting your picks yet.</Text>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Defaults (90d rolling window) + allow route params override
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => coerceString(params.from), [params.from]);
  const toParam = useMemo(() => coerceString(params.to), [params.to]);

  const window = useMemo(
    () =>
      normalizeWindowIso(
        {
          from: fromParam ?? rolling.from,
          to: toParam ?? rolling.to,
        },
        90
      ),
    [fromParam, toParam, rolling.from, rolling.to]
  );

  const [from, setFrom] = useState(window.from);
  const [to, setTo] = useState(window.to);

  useEffect(() => {
    setFrom(window.from);
    setTo(window.to);
  }, [window.from, window.to]);

  // Prefill query via /fixtures?venue=...
  const venueParamRaw = useMemo(() => coerceString((params as any).venue), [params]);
  const [query, setQuery] = useState<string>(venueParamRaw ?? "");
  const qNorm = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    setQuery(venueParamRaw ?? "");
  }, [venueParamRaw]);

  // Initial leagues can come from ?leagueId & ?season
  const initialLeagues = useMemo(() => resolveInitialLeagues(params.leagueId, params.season), [params.leagueId, params.season]);
  const [selectedLeagues, setSelectedLeagues] = useState<LeagueOption[]>(initialLeagues);

  // Grouping: both options, default to DATE (trip planning)
  const [groupMode, setGroupMode] = useState<GroupMode>("date");

  // Modals
  const [dateOpen, setDateOpen] = useState(false);
  const [leaguesOpen, setLeaguesOpen] = useState(false);

  // Fetch state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rowsByLeague, setRowsByLeague] = useState<Record<number, FixtureListRow[]>>({});
  const [loadedLeagueIds, setLoadedLeagueIds] = useState<Set<number>>(new Set());

  const fetchTokenRef = useRef(0);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);
  const clearQuery = useCallback(() => {
    setQuery("");
    Keyboard.dismiss();
  }, []);

  // Filtering
  const passesQuery = useCallback(
    (r: FixtureListRow) => {
      const q = qNorm.trim().toLowerCase();
      if (!q) return true;

      const home = norm(r?.teams?.home?.name);
      const away = norm(r?.teams?.away?.name);
      const venue = norm(r?.fixture?.venue?.name);
      const city = norm(r?.fixture?.venue?.city);

      return home.includes(q) || away.includes(q) || venue.includes(q) || city.includes(q);
    },
    [qNorm]
  );

  const inWindow = useCallback(
    (r: FixtureListRow) => {
      const d = fixtureIsoDateOnly(r);
      if (!d) return false;
      return withinRange(d, from, to);
    },
    [from, to]
  );

  // Fetch fixtures when constraints change
  useEffect(() => {
    let cancelled = false;
    const myToken = ++fetchTokenRef.current;

    async function run() {
      setError(null);
      setLoading(true);
      setRowsByLeague({});
      setLoadedLeagueIds(new Set());

      const leagues = (selectedLeagues.length ? selectedLeagues : LEAGUES.slice(0, 5)).slice(0, MAX_LEAGUES);

      try {
        const nextState: LeagueFetchState = { rowsByLeague: {}, loaded: new Set() };

        await mapLimit(
          leagues,
          FETCH_CONCURRENCY,
          async (l) => {
            const res = await getFixtures({
              league: l.leagueId,
              season: l.season,
              from,
              to,
            });

            const rows = Array.isArray(res) ? (res as FixtureListRow[]) : [];

            if (cancelled) return null;
            if (fetchTokenRef.current !== myToken) return null;

            nextState.rowsByLeague[l.leagueId] = rows;
            nextState.loaded.add(l.leagueId);

            // progressive UI update
            setRowsByLeague((prev) => ({ ...prev, [l.leagueId]: rows }));
            setLoadedLeagueIds((prev) => {
              const n = new Set(prev);
              n.add(l.leagueId);
              return n;
            });

            return null;
          }
        );
      } catch (e: any) {
        if (!cancelled && fetchTokenRef.current === myToken) {
          setError(e?.message ?? "Failed to load fixtures.");
        }
      } finally {
        if (!cancelled && fetchTokenRef.current === myToken) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [selectedLeagues, from, to]);

  const selectedSummary = useMemo(() => {
    const n = selectedLeagues.length;
    if (n === 0) return "Top leagues";
    if (n === 1) return selectedLeagues[0]?.label ?? "1 league";
    if (n === 2) return `${selectedLeagues[0].label} + 1`;
    return `${selectedLeagues[0].label} + ${n - 1}`;
  }, [selectedLeagues]);

  const dateSummary = useMemo(() => `${formatUkDateOnly(from)} → ${formatUkDateOnly(to)}`, [from, to]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear?: () => void }> = [];

    chips.push({
      key: "dates",
      label: dateSummary,
      onClear: () => {
        const r = getRollingWindowIso();
        setFrom(r.from);
        setTo(r.to);
      },
    });

    chips.push({
      key: "leagues",
      label: selectedLeagues.length ? `${selectedLeagues.length} leagues` : "Top leagues",
      onClear: () => setSelectedLeagues(LEAGUES.slice(0, 5)),
    });

    if (qNorm) chips.push({ key: "query", label: `“${qNorm}”`, onClear: () => setQuery("") });

    return chips;
  }, [dateSummary, selectedLeagues.length, qNorm]);

  // Compose filtered rows with league context
  const filteredByLeague = useMemo(() => {
    const out: Record<number, FixtureListRow[]> = {};
    for (const l of selectedLeagues.slice(0, MAX_LEAGUES)) {
      const rows = rowsByLeague[l.leagueId] ?? [];
      out[l.leagueId] = rows.filter(inWindow).filter(passesQuery).filter((r) => r?.fixture?.id != null);
    }
    return out;
  }, [rowsByLeague, selectedLeagues, inWindow, passesQuery]);

  const groupedByDate = useMemo(() => {
    // Merge across leagues into date buckets
    const map: Record<string, Array<{ league: LeagueOption; row: FixtureListRow }>> = {};
    const leagues = selectedLeagues.slice(0, MAX_LEAGUES);

    for (const l of leagues) {
      const rows = filteredByLeague[l.leagueId] ?? [];
      for (const r of rows) {
        const d = fixtureIsoDateOnly(r);
        if (!d) continue;
        if (!map[d]) map[d] = [];
        map[d].push({ league: l, row: r });
      }
    }

    const dates = Object.keys(map).sort((a, b) => compareIso(a, b));

    // Sort inside each day: kickoff then title
    for (const d of dates) {
      map[d].sort((x, y) => {
        const ax = String(x.row?.fixture?.date ?? "");
        const ay = String(y.row?.fixture?.date ?? "");
        if (ax !== ay) return ax < ay ? -1 : 1;
        const tx = rowTitle(x.row);
        const ty = rowTitle(y.row);
        return tx.localeCompare(ty);
      });
    }

    return { dates, map };
  }, [filteredByLeague, selectedLeagues]);

  const anyResults = useMemo(() => {
    if (groupMode === "date") return groupedByDate.dates.length > 0;
    return selectedLeagues.some((l) => (filteredByLeague[l.leagueId]?.length ?? 0) > 0);
  }, [groupMode, groupedByDate.dates.length, selectedLeagues, filteredByLeague]);

  const emptyMessage = useMemo(() => {
    if (!qNorm) return "Try changing dates or leagues.";
    return "Try another search term (team, city, or venue) or clear the filter.";
  }, [qNorm]);

  const toggleGroupMode = useCallback(() => {
    setGroupMode((m) => (m === "date" ? "league" : "date"));
  }, []);

  const goMatchWithContext = useCallback(
    (fixtureIdStr: string, leagueId: number, season: number) => {
      router.push({
        pathname: "/match/[id]",
        params: {
          id: fixtureIdStr,
          leagueId: String(leagueId),
          season: String(season),
          from,
          to,
          ...(qNorm ? { venue: qNorm } : {}),
        },
      } as any);
    },
    [router, from, to, qNorm]
  );

  const goBuildTripWithContext = useCallback(
    (fixtureIdStr: string, leagueId: number, season: number) => {
      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId: fixtureIdStr,
          leagueId: String(leagueId),
          season: String(season),
          from,
          to,
          ...(qNorm ? { venue: qNorm } : {}),
        },
      } as any);
    },
    [router, from, to, qNorm]
  );

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>Plan • {selectedSummary}</Text>
            </View>

            <Pressable
              onPress={toggleGroupMode}
              style={styles.modePill}
              hitSlop={10}
              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
            >
              <Text style={styles.modePillText}>{groupMode === "date" ? "By date" : "By league"}</Text>
            </Pressable>
          </View>

          {/* Controls row */}
          <View style={styles.controlsRow}>
            <Pressable
              onPress={() => setDateOpen(true)}
              style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.94 }]}
              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
            >
              <Text style={styles.controlBtnKicker}>Dates</Text>
              <Text style={styles.controlBtnValue} numberOfLines={1}>
                {formatUkDateOnly(from)} → {formatUkDateOnly(to)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setLeaguesOpen(true)}
              style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.94 }]}
              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
            >
              <Text style={styles.controlBtnKicker}>Leagues</Text>
              <Text style={styles.controlBtnValue} numberOfLines={1}>
                {selectedLeagues.length ? `${selectedLeagues.length} selected` : "Top leagues"}
              </Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search team, city, or venue"
              placeholderTextColor={theme.colors.textTertiary}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={dismissKeyboard}
            />

            {qNorm.length > 0 ? (
              <Pressable onPress={clearQuery} style={styles.clearBtn} hitSlop={10}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Active filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {activeChips.map((c) => (
              <Pressable
                key={c.key}
                onPress={c.onClear}
                disabled={!c.onClear}
                style={({ pressed }) => [styles.chip, pressed && c.onClear ? { opacity: 0.94 } : null]}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <Text style={styles.chipText}>{c.label}</Text>
                {c.onClear ? <Text style={styles.chipX}>×</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* BODY */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassCard strength="default" style={styles.card}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>
                  Loading fixtures… {loadedLeagueIds.size}/{clamp(selectedLeagues.length || 5, 1, MAX_LEAGUES)}
                </Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error && !anyResults ? <EmptyState title="No matches found" message={emptyMessage} /> : null}

            {!error && anyResults ? (
              groupMode === "date" ? (
                <View style={styles.dateGroups}>
                  {groupedByDate.dates.map((d) => {
                    const list = groupedByDate.map[d] ?? [];
                    return (
                      <View key={d} style={styles.dayGroup}>
                        <View style={styles.dayHeader}>
                          <Text style={styles.dayTitle}>{formatUkDateOnly(d)}</Text>
                          <Text style={styles.dayMeta}>{list.length} match{list.length === 1 ? "" : "es"}</Text>
                        </View>

                        <View style={styles.list}>
                          {list.map(({ league, row }, idx) => {
                            const id = row?.fixture?.id;
                            const fixtureIdStr = id ? String(id) : null;
                            const key = fixtureIdStr ?? `${d}-${league.leagueId}-${idx}`;

                            return (
                              <GlassCard key={key} strength="subtle" noPadding style={styles.rowCard}>
                                <Pressable
                                  disabled={!fixtureIdStr}
                                  onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr, league.leagueId, league.season) : null)}
                                  style={styles.rowMain}
                                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                                >
                                  <View style={styles.rowInner}>
                                    <CrestSquare r={row} />
                                    <View style={{ flex: 1 }}>
                                      <View style={styles.rowTitleRow}>
                                        <Text style={styles.rowTitle}>{rowTitle(row)}</Text>
                                        <View style={styles.leagueBadge}>
                                          <Text style={styles.leagueBadgeText}>{league.label}</Text>
                                          <LeagueFlag code={league.countryCode} />
                                        </View>
                                      </View>
                                      <Text style={styles.rowMeta}>{rowMeta(row)}</Text>

                                      {/* Availability placeholders (future) */}
                                      <View style={styles.signalsRow}>
                                        <View style={styles.signalPill}>
                                          <Text style={styles.signalText}>🎟 Tickets: coming soon</Text>
                                        </View>
                                        <View style={styles.signalPill}>
                                          <Text style={styles.signalText}>✈️ Flights: coming soon</Text>
                                        </View>
                                        <View style={styles.signalPill}>
                                          <Text style={styles.signalText}>🛏 Stays: coming soon</Text>
                                        </View>
                                      </View>
                                    </View>
                                    <Text style={styles.chev}>›</Text>
                                  </View>
                                </Pressable>

                                <View style={styles.actionsRow}>
                                  <Pressable
                                    disabled={!fixtureIdStr}
                                    onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr, league.leagueId, league.season) : null)}
                                    style={[styles.smallBtn, styles.smallGhost, !fixtureIdStr && styles.disabled]}
                                  >
                                    <Text style={styles.smallGhostText}>View match</Text>
                                  </Pressable>

                                  <Pressable
                                    disabled={!fixtureIdStr}
                                    onPress={() => (fixtureIdStr ? goBuildTripWithContext(fixtureIdStr, league.leagueId, league.season) : null)}
                                    style={[styles.smallBtn, styles.smallPrimary, !fixtureIdStr && styles.disabled]}
                                  >
                                    <Text style={styles.smallPrimaryText}>Plan trip</Text>
                                  </Pressable>
                                </View>
                              </GlassCard>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.multiWrap}>
                  {selectedLeagues.slice(0, MAX_LEAGUES).map((l) => {
                    const leagueRows = filteredByLeague[l.leagueId] ?? [];
                    if (leagueRows.length === 0) return null;

                    return (
                      <View key={l.leagueId} style={styles.leagueGroup}>
                        <View style={styles.groupHeader}>
                          <View style={styles.groupTitleRow}>
                            <Text style={styles.groupTitle}>{l.label}</Text>
                            <LeagueFlag code={l.countryCode} />
                          </View>
                          <Text style={styles.groupMeta}>{leagueRows.length} match{leagueRows.length === 1 ? "" : "es"}</Text>
                        </View>

                        <View style={styles.list}>
                          {leagueRows.map((r, idx) => {
                            const id = r?.fixture?.id;
                            const fixtureIdStr = id ? String(id) : null;
                            const key = fixtureIdStr ?? `l-${l.leagueId}-${idx}`;

                            return (
                              <GlassCard key={key} strength="subtle" noPadding style={styles.rowCard}>
                                <Pressable
                                  disabled={!fixtureIdStr}
                                  onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr, l.leagueId, l.season) : null)}
                                  style={styles.rowMain}
                                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                                >
                                  <View style={styles.rowInner}>
                                    <CrestSquare r={r} />
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.rowTitle}>{rowTitle(r)}</Text>
                                      <Text style={styles.rowMeta}>{rowMeta(r)}</Text>

                                      {/* Availability placeholders (future) */}
                                      <View style={styles.signalsRow}>
                                        <View style={styles.signalPill}>
                                          <Text style={styles.signalText}>🎟 Tickets: coming soon</Text>
                                        </View>
                                        <View style={styles.signalPill}>
                                          <Text style={styles.signalText}>✈️ Flights: coming soon</Text>
                                        </View>
                                        <View style={styles.signalPill}>
                                          <Text style={styles.signalText}>🛏 Stays: coming soon</Text>
                                        </View>
                                      </View>
                                    </View>
                                    <Text style={styles.chev}>›</Text>
                                  </View>
                                </Pressable>

                                <View style={styles.actionsRow}>
                                  <Pressable
                                    disabled={!fixtureIdStr}
                                    onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr, l.leagueId, l.season) : null)}
                                    style={[styles.smallBtn, styles.smallGhost, !fixtureIdStr && styles.disabled]}
                                  >
                                    <Text style={styles.smallGhostText}>View match</Text>
                                  </Pressable>

                                  <Pressable
                                    disabled={!fixtureIdStr}
                                    onPress={() => (fixtureIdStr ? goBuildTripWithContext(fixtureIdStr, l.leagueId, l.season) : null)}
                                    style={[styles.smallBtn, styles.smallPrimary, !fixtureIdStr && styles.disabled]}
                                  >
                                    <Text style={styles.smallPrimaryText}>Plan trip</Text>
                                  </Pressable>
                                </View>
                              </GlassCard>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )
            ) : null}
          </GlassCard>

          <View style={{ height: 10 }} />
        </ScrollView>

        {/* MODALS */}
        <CalendarRangeModal
          open={dateOpen}
          onClose={() => setDateOpen(false)}
          fromIso={from}
          toIso={to}
          onApply={(w) => {
            setFrom(w.from);
            setTo(w.to);
          }}
        />

        <LeaguesModal
          open={leaguesOpen}
          onClose={() => setLeaguesOpen(false)}
          selected={selectedLeagues}
          onApply={(next) => setSelectedLeagues(next.slice(0, MAX_LEAGUES))}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: 12,
  },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: theme.fontWeight.black },
  subtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  modePill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  modePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },

  controlsRow: { flexDirection: "row", gap: 10 },
  controlBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  controlBtnKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },
  controlBtnValue: { marginTop: 4, color: theme.colors.text, fontSize: 13, fontWeight: theme.fontWeight.black },

  // Search
  searchBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
    fontWeight: theme.fontWeight.bold,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  clearBtnText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },

  // Chips
  chipsRow: { gap: 8, paddingRight: theme.spacing.lg },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.52)" : "rgba(22,25,29,0.46)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  chipText: { color: "rgba(242,244,246,0.78)", fontSize: 12, fontWeight: theme.fontWeight.bold },
  chipX: { color: "rgba(242,244,246,0.55)", fontSize: 14, marginTop: -1 },

  // Body
  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  card: { minHeight: 260, padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // Groups
  dateGroups: { gap: 18 },
  dayGroup: { gap: 10 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  dayTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  dayMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  // Lists
  list: { gap: 10 },
  rowCard: { borderRadius: 16, overflow: "hidden" },
  rowMain: { borderRadius: 16 },
  rowInner: { paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "flex-start", gap: 12 },

  crestWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.12)",
    borderRadius: 14,
  },
  crestImg: { width: 30, height: 30, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.4 },

  rowTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  rowTitle: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  leagueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  leagueBadgeText: { color: "rgba(242,244,246,0.78)", fontSize: 11, fontWeight: theme.fontWeight.black },

  signalsRow: { marginTop: 10, gap: 6 },
  signalPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.12)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  signalText: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  chev: { color: theme.colors.textTertiary, fontSize: 24, marginTop: -2 },

  actionsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingBottom: 12 },
  smallBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1 },

  smallPrimary: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  smallPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 14 },

  smallGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  smallGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 14 },

  disabled: { opacity: 0.55 },

  // Multi
  multiWrap: { gap: 18 },
  leagueGroup: { gap: 10 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  groupMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  modalSheetWrap: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderRadius: 22, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, overflow: "hidden" },
  modalInner: { padding: 14, gap: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: theme.fontWeight.black },
  modalClose: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    overflow: "hidden",
  },
  modalCloseText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  modalSummaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalSummaryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  modalSummaryText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  modalSummaryHint: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  modalSummaryArrow: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },

  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(22,25,29,0.55)" : "rgba(22,25,29,0.48)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  presetPillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },

  // Calendar
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  calTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  calNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  calNavText: { color: theme.colors.textSecondary, fontSize: 18, fontWeight: theme.fontWeight.black, marginTop: -2 },

  weekHeaderRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2, marginTop: 8 },
  weekHeaderText: { width: `${100 / 7}%`, textAlign: "center", color: theme.colors.textTertiary, fontSize: 11, fontWeight: theme.fontWeight.bold },

  calGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  calCellActive: { backgroundColor: "rgba(79,224,138,0.12)" },
  calCellEdge: { backgroundColor: "rgba(79,224,138,0.22)" },
  calCellText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.bold },
  calCellTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  // League list rows in modal
  leagueRowItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  leagueRowItemActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leagueRowTitle: { color: theme.colors.text, fontSize: 14, fontWeight: theme.fontWeight.black },
  leagueRowSub: { marginTop: 4, color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  checkboxInnerActive: { backgroundColor: "rgba(79,224,138,0.85)" },

  // Modal actions
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },
  btnPrimary: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 15, fontWeight: theme.fontWeight.black },

  modalFootnote: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold, lineHeight: 16 },
});
