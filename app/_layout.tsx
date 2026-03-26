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

import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";
import type { LastPartnerClick } from "@/src/services/partnerClicks";

export default function RootLayout() {
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [modalClick, setModalClick] = useState<LastPartnerClick | null>(null);

  const mountedRef = useRef(false);

  function closeModal() {
    if (!mountedRef.current) return;
    setModalItemId(null);
    setModalClick(null);
  }

  useEffect(() => {
    mountedRef.current = true;

    try {
      const { setupErrorLogging } = require("@/src/utils/errorLogger");
      setupErrorLogging();
    } catch (error) {
      console.warn("Logger init failed", error);
    }

    identity.ensureIdentity().catch(() => null);
    preferencesStore.load().catch(() => null);

    bootstrapPartnerReturnPrompt();

    const unsubscribe = registerReturnModalHandler((itemId, click) => {
      if (!mountedRef.current) return;
      setModalItemId(String(itemId ?? "").trim() || null);
      setModalClick(click ?? null);
    });

    return () => {
      mountedRef.current = false;

      try {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch {
        // ignore cleanup failure
      }
    };
  }, []);

  async function handleBooked(itemId: string) {
    try {
      await markItemBooked(itemId);
      await confirmBookedAndOfferProof(itemId);
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
        visible={Boolean(modalItemId)}
        itemId={modalItemId}
        click={modalClick}
        onBooked={handleBooked}
        onNotBooked={handleNotBooked}
        onNotNow={handleNotNow}
      />
    </ProProvider>
  );
}
