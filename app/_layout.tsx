// app/_layout.tsx
import { stadiums } from "@/src/data/stadiums";

console.log("Total stadiums loaded:", Object.keys(stadiums).length);
import "@/src/utils/errorLogger";
import React, { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";

import { ProProvider } from "@/src/context/ProContext";
import preferencesStore from "@/src/state/preferences";
import identity from "@/src/services/identity";

import PartnerReturnModal from "@/src/components/PartnerReturnModal";

import {
  bootstrapPartnerReturnPrompt,
  registerReturnModalHandler,
  markItemBooked,
  markItemNotBooked,
  dismissPartnerReturn,
} from "@/src/services/partnerReturnBootstrap";

import type { LastPartnerClick } from "@/src/services/partnerClicks";

export default function RootLayout() {
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [modalClick, setModalClick] = useState<LastPartnerClick | null>(null);

  const mountedRef = useRef(true);

  function closeModal() {
    if (!mountedRef.current) return;
    setModalItemId(null);
    setModalClick(null);
  }

  useEffect(() => {
    mountedRef.current = true;

    // 1) Stable device identity (guest path)
    identity.ensureIdentity().catch(() => null);

    // 2) Partner return detection (booking loop)
    bootstrapPartnerReturnPrompt();

    // IMPORTANT: ensure we can unregister on refresh/remount
    // If registerReturnModalHandler doesn't currently return an unsubscribe,
    // update it so it does. Otherwise you WILL get duplicate handlers over time.
    const maybeUnsub = registerReturnModalHandler((itemId, click) => {
      if (!mountedRef.current) return;
      setModalItemId(itemId);
      setModalClick(click);
    });

    // 3) Preferences (e.g. origin IATA)
    preferencesStore.load().catch(() => null);

    return () => {
      mountedRef.current = false;
      try {
        // If your registerReturnModalHandler returns () => void, this cleans up properly.
        if (typeof maybeUnsub === "function") maybeUnsub();
      } catch {
        // ignore
      }
    };
  }, []);

  async function handleBooked(itemId: string) {
    try {
      await markItemBooked(itemId);
    } finally {
      closeModal();
    }
  }

  async function handleNotBooked(itemId: string) {
    try {
      await markItemNotBooked(itemId);
    } finally {
      closeModal();
    }
  }

  async function handleNotNow(itemId?: string | null) {
    if (!itemId) {
      closeModal();
      return;
    }
    try {
      await dismissPartnerReturn(itemId);
    } finally {
      closeModal();
    }
  }

  return (
    <ProProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="match/[id]" />
        <Stack.Screen name="trip/[id]" />
        <Stack.Screen name="trip/build" />
        <Stack.Screen name="city/[slug]" />
        <Stack.Screen name="team/[teamKey]" />
      </Stack>

      <PartnerReturnModal
        visible={!!modalItemId}
        itemId={modalItemId}
        click={modalClick}
        onBooked={handleBooked}
        onNotBooked={handleNotBooked}
        onNotNow={handleNotNow}
        onClose={closeModal}
      />
    </ProProvider>
  );
}
