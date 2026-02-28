// app/_layout.tsx
import "@/src/utils/errorLogger";
import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    // 1) Ensure a stable device identity exists (guest path)
    identity.ensureIdentity().catch(() => null);

    // 2) Partner return detection (booking loop)
    bootstrapPartnerReturnPrompt();

    registerReturnModalHandler((itemId, click) => {
      setModalItemId(itemId);
      setModalClick(click);
    });

    // 3) Preferences
    preferencesStore.load().catch(() => null);
  }, []);

  async function handleBooked(itemId: string) {
    await markItemBooked(itemId);
  }

  async function handleNotBooked(itemId: string) {
    await markItemNotBooked(itemId);
  }

  async function handleNotNow(itemId?: string | null) {
    if (!itemId) return;
    await dismissPartnerReturn(itemId);
  }

  function closeModal() {
    setModalItemId(null);
    setModalClick(null);
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
