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

    // ✅ SAFE: initialise logger AFTER app starts
    try {
      const { setupErrorLogging } = require("@/src/utils/errorLogger");
      setupErrorLogging();
    } catch (e) {
      console.warn("Logger init failed", e);
    }

    identity.ensureIdentity().catch(() => null);

    bootstrapPartnerReturnPrompt();

    const maybeUnsub = registerReturnModalHandler((itemId, click) => {
      if (!mountedRef.current) return;
      setModalItemId(itemId);
      setModalClick(click);
    });

    preferencesStore.load().catch(() => null);

    return () => {
      mountedRef.current = false;
      try {
        if (typeof maybeUnsub === "function") maybeUnsub();
      } catch {}
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
