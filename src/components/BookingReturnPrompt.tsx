// src/components/BookingReturnPrompt.tsx
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";

type PendingBookingPrompt = {
  itemId: string;
  tripId: string;
  partnerName?: string;
  startedAt: number;
  snoozeUntil?: number;
};

const KEY = "yna_pending_booking_prompt_v1";

// Minimal async storage wrapper via your existing persist helpers.
// If you already have a generic KV store, swap these.
import { readJson, writeJson } from "@/src/state/persist";

async function getPrompt(): Promise<PendingBookingPrompt | null> {
  const raw = await readJson<any>(KEY, null);
  if (!raw || typeof raw !== "object") return null;

  const itemId = String(raw.itemId ?? "").trim();
  const tripId = String(raw.tripId ?? "").trim();
  const startedAt = Number(raw.startedAt);

  if (!itemId || !tripId || !Number.isFinite(startedAt)) return null;

  const snoozeUntil = Number(raw.snoozeUntil);
  return {
    itemId,
    tripId,
    partnerName: typeof raw.partnerName === "string" ? raw.partnerName : undefined,
    startedAt,
    snoozeUntil: Number.isFinite(snoozeUntil) ? snoozeUntil : undefined,
  };
}

async function setPrompt(p: PendingBookingPrompt | null) {
  await writeJson(KEY, p);
}

export async function startBookingReturnPrompt(args: {
  itemId: string;
  tripId: string;
  partnerName?: string;
}) {
  await setPrompt({
    itemId: String(args.itemId).trim(),
    tripId: String(args.tripId).trim(),
    partnerName: args.partnerName ? String(args.partnerName).trim() : undefined,
    startedAt: Date.now(),
  });
}

async function clearPrompt() {
  await setPrompt(null);
}

function minutes(ms: number) {
  return ms * 60 * 1000;
}

export default function BookingReturnPrompt() {
  const lastState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      const prev = lastState.current;
      lastState.current = next;

      // Only react on background -> active (returning to app)
      if (!(prev === "background" && next === "active")) return;

      const p = await getPrompt();
      if (!p) return;

      const now = Date.now();

      // Snoozed
      if (p.snoozeUntil && now < p.snoozeUntil) return;

      // Don’t prompt forever. 60 min window is fine for Phase 1.
      if (now - p.startedAt > minutes(60)) {
        await clearPrompt();
        return;
      }

      // If item no longer exists or already booked/archived, clear silently
      const state = savedItemsStore.getState();
      if (!state.loaded) {
        try {
          await savedItemsStore.load();
        } catch {}
      }

      const item = savedItemsStore.getState().items.find((x) => x.id === p.itemId);
      if (!item) {
        await clearPrompt();
        return;
      }
      if (item.status === "booked" || item.status === "archived") {
        await clearPrompt();
        return;
      }

      const who = p.partnerName ? ` on ${p.partnerName}` : "";
      Alert.alert(
        "Did you book it?",
        `You just returned from your booking search${who}.\n\nMark "${item.title}" as booked?`,
        [
          {
            text: "Not now",
            style: "cancel",
            onPress: async () => {
              await setPrompt({ ...p, snoozeUntil: Date.now() + minutes(30) });
            },
          },
          {
            text: "No",
            onPress: async () => {
              // Keep as pending. Just clear the prompt so it doesn’t nag.
              await clearPrompt();
            },
          },
          {
            text: "Yes — booked",
            onPress: async () => {
              try {
                await savedItemsStore.transitionStatus(item.id, "booked");
              } catch {
                // If transition fails, don’t lie—leave it pending.
              }
              await clearPrompt();
            },
          },
        ],
        { cancelable: true }
      );
    });

    return () => sub.remove();
  }, []);

  return null;
}
