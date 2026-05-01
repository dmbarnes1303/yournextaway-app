import React, { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";

import { ProProvider } from "@/src/context/ProContext";
import preferencesStore from "@/src/state/preferences";
import identity from "@/src/services/identity";

import PartnerReturnModal from "@/src/components/PartnerReturnModal";
import BookingProofModal from "@/src/components/BookingProofModal";

import {
  bootstrapPartnerReturnPrompt,
  registerReturnModalHandler,
  markItemBooked,
  markItemNotBooked,
  dismissPartnerReturn,
} from "@/src/services/partnerReturnBootstrap";

import {
  requestBookingProofFlow,
  consumeBookingProofRequest,
  completeBookingProofFlow,
} from "@/src/services/bookingProof";

import { attachTicketProof } from "@/src/services/ticketAttachment";
import type { LastPartnerClick } from "@/src/services/partnerClicks";

export default function RootLayout() {
  // ===== Partner return modal =====
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [modalClick, setModalClick] = useState<LastPartnerClick | null>(null);

  // ===== Booking proof modal =====
  const [proofVisible, setProofVisible] = useState(false);
  const [proofItemId, setProofItemId] = useState<string | null>(null);
  const [proofMode, setProofMode] = useState<"offer" | "success" | "info">("offer");

  const mountedRef = useRef(false);

  function closePartnerModal() {
    if (!mountedRef.current) return;
    setModalItemId(null);
    setModalClick(null);
  }

  function closeProofModal() {
    setProofVisible(false);
    setProofItemId(null);
  }

  useEffect(() => {
    mountedRef.current = true;

    try {
      const { setupErrorLogging } = require("@/src/utils/errorLogger");
      setupErrorLogging();
    } catch {}

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
        if (typeof unsubscribe === "function") unsubscribe();
      } catch {}
    };
  }, []);

  // ===== Handle booking confirmation =====
  async function handleBooked(itemId: string) {
    try {
      await markItemBooked(itemId);

      // Trigger proof flow (no UI here)
      await requestBookingProofFlow(itemId);

      const request = consumeBookingProofRequest();
      if (request) {
        setProofItemId(request.itemId);
        setProofMode(request.mode);
        setProofVisible(true);
      }
    } finally {
      closePartnerModal();
    }
  }

  async function handleNotBooked(itemId: string) {
    try {
      await markItemNotBooked(itemId);
    } finally {
      closePartnerModal();
    }
  }

  async function handleNotNow(itemId?: string | null) {
    if (!itemId) {
      closePartnerModal();
      return;
    }

    try {
      await dismissPartnerReturn(itemId);
    } finally {
      closePartnerModal();
    }
  }

  // ===== Proof modal actions =====
  async function handleAddProof() {
    if (!proofItemId) return;

    const success = await attachTicketProof(proofItemId);

    if (success) {
      setProofMode("success");
      completeBookingProofFlow();
    } else {
      closeProofModal();
    }
  }

  function handleSkipProof() {
    completeBookingProofFlow();
    closeProofModal();
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

      {/* ===== Partner return modal ===== */}
      <PartnerReturnModal
        visible={Boolean(modalItemId)}
        itemId={modalItemId}
        click={modalClick}
        onBooked={handleBooked}
        onNotBooked={handleNotBooked}
        onNotNow={handleNotNow}
      />

      {/* ===== Booking proof modal ===== */}
      <BookingProofModal
        visible={proofVisible}
        mode={proofMode}
        title={
          proofMode === "success"
            ? "Proof added"
            : "Saved in Wallet"
        }
        message={
          proofMode === "success"
            ? "Your booking proof is now stored in Wallet."
            : "Add booking proof (PDF or screenshot) for offline access?"
        }
        confirmLabel={proofMode === "success" ? undefined : "Add proof"}
        cancelLabel={proofMode === "success" ? "Done" : "Not now"}
        onConfirm={proofMode === "success" ? undefined : handleAddProof}
        onCancel={proofMode === "success" ? closeProofModal : handleSkipProof}
      />
    </ProProvider>
  );
}
