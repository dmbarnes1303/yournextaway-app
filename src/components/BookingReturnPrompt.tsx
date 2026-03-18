import React, { useEffect, useRef } from "react";
import { Alert, AppState, type AppStateStatus } from "react-native";

import { readJson, writeJson } from "@/src/state/persist";
import savedItemsStore from "@/src/state/savedItems";

type PendingBookingPrompt = {
  itemId: string;
  tripId: string;
  partnerName?: string;
  startedAt: number;
  snoozeUntil?: number;
};

const KEY = "yna_pending_booking_prompt_v1";

async function getPrompt(): Promise<PendingBookingPrompt | null> {
  const raw = await readJson<unknown>(KEY, null);
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  const itemId = String(value.itemId ?? "").trim();
  const tripId = String(value.tripId ?? "").trim();
  const startedAt = Number(value.startedAt);

  if (!itemId || !tripId || !Number.isFinite(startedAt)) return null;

  const snoozeUntil = Number(value.snoozeUntil);

  return {
    itemId,
    tripId,
    partnerName: typeof value.partnerName === "string" ? value.partnerName : undefined,
    startedAt,
    snoozeUntil: Number.isFinite(snoozeUntil) ? snoozeUntil : undefined,
  };
}

async function setPrompt(prompt: PendingBookingPrompt | null) {
  await writeJson(KEY, prompt);
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

function minutes(value: number) {
  return value * 60 * 1000;
}

export default function BookingReturnPrompt() {
  const lastState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      const prev = lastState.current;
      lastState.current = next;

      if (!(prev === "background" && next === "active")) return;

      const prompt = await getPrompt();
      if (!prompt) return;

      const now = Date.now();

      if (prompt.snoozeUntil && now < prompt.snoozeUntil) return;

      if (now - prompt.startedAt > minutes(60)) {
        await clearPrompt();
        return;
      }

      const store = savedItemsStore.getState();
      if (!store.loaded) {
        try {
          await savedItemsStore.load();
        } catch {
          // ignore
        }
      }

      const item = savedItemsStore.getState().items.find((entry) => entry.id === prompt.itemId);

      if (!item) {
        await clearPrompt();
        return;
      }

      if (item.status === "booked" || item.status === "archived") {
        await clearPrompt();
        return;
      }

      const partnerSuffix = prompt.partnerName ? ` on ${prompt.partnerName}` : "";

      Alert.alert(
        "Did you book it?",
        `You just returned from your booking search${partnerSuffix}.\n\nMark "${item.title}" as booked?`,
        [
          {
            text: "Not now",
            style: "cancel",
            onPress: async () => {
              await setPrompt({
                ...prompt,
                snoozeUntil: Date.now() + minutes(30),
              });
            },
          },
          {
            text: "No",
            onPress: async () => {
              await clearPrompt();
            },
          },
          {
            text: "Yes — booked",
            onPress: async () => {
              try {
                await savedItemsStore.transitionStatus(item.id, "booked");
              } catch {
                // ignore
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
