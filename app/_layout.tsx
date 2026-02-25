// app/_layout.tsx
import "@/src/utils/errorLogger";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";

import { ProProvider } from "@/src/context/ProContext";
import preferencesStore from "@/src/state/preferences";

import identity from "@/src/services/identity";

import {
  bootstrapPartnerReturnPrompt,
  registerReturnModalHandler,
  markTicketBooked,
} from "@/src/services/partnerReturnBootstrap";

import PartnerReturnModal from "@/src/components/PartnerReturnModal";

export default function RootLayout() {
  const [modalItemId, setModalItemId] = useState<string | null>(null);

  useEffect(() => {
    // 1) Ensure a stable device identity exists (guest path)
    identity.ensureIdentity().catch(() => null);

    // 2) Partner return detection (your booking loop)
    bootstrapPartnerReturnPrompt();

    registerReturnModalHandler((itemId) => {
      setModalItemId(itemId);
    });

    // 3) Preferences
    preferencesStore.load().catch(() => null);
  }, []);

  async function handleBooked(itemId: string) {
    await markTicketBooked(itemId);
  }

  function closeModal() {
    setModalItemId(null);
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
        onBooked={handleBooked}
        onClose={closeModal}
      />
    </ProProvider>
  );
}
