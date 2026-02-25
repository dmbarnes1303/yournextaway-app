import "@/src/utils/errorLogger";
import React, { useEffect, useRef, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";

import { ProProvider } from "@/src/context/ProContext";
import preferencesStore from "@/src/state/preferences";

import {
  bootstrapPartnerReturnPrompt,
  registerReturnModalHandler,
  markTicketBooked,
} from "@/src/services/partnerReturnBootstrap";

import PartnerReturnModal from "@/src/components/PartnerReturnModal";

export default function RootLayout() {
  const router = useRouter();
  const [modalItemId, setModalItemId] = useState<string | null>(null);

  useEffect(() => {
    bootstrapPartnerReturnPrompt();

    registerReturnModalHandler((itemId) => {
      setModalItemId(itemId);
    });

    preferencesStore.load().catch(() => null);
  }, []);

  async function onBooked() {
    if (!modalItemId) return;
    await markTicketBooked(modalItemId);
    setModalItemId(null);
  }

  function onNotBooked() {
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
        <Stack.Screen name="paywall" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>

      <PartnerReturnModal
        visible={!!modalItemId}
        onBooked={onBooked}
        onNotBooked={onNotBooked}
      />
    </ProProvider>
  );
}
