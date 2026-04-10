import { getSupabaseClient, isSupabaseConfigured } from "@/src/lib/supabase";
import type { PartnerCategory, PartnerId, PartnerTier } from "@/src/constants/partners";
import type { SavedItemType } from "@/src/core/savedItemTypes";

export type CreatePartnerClickInput = {
  tripId: string;
  savedItemId?: string | null;
  partnerId: PartnerId;
  partnerCategory: PartnerCategory;
  partnerTier: PartnerTier;
  url: string;
  sourceSurface?: string | null;
  sourceSection?: string | null;
  status?: "clicked" | "returned" | "converted" | "abandoned";
  metadata?: Record<string, unknown>;
};

export type PartnerClickRecord = {
  id: string;
  trip_id: string;
  saved_item_id: string | null;
  partner_id: string;
  partner_category: string;
  partner_tier: string;
  url: string;
  source_surface: string | null;
  source_section: string | null;
  status: "clicked" | "returned" | "converted" | "abandoned";
  metadata: Record<string, unknown>;
  created_at: string;
  returned_at: string | null;
  converted_at: string | null;
};

export type LogPartnerEventInput = {
  partnerClickId?: string | null;
  tripId?: string | null;
  savedItemId?: string | null;
  eventName: string;
  partnerId?: PartnerId | null;
  sourceSurface?: string | null;
  sourceSection?: string | null;
  metadata?: Record<string, unknown>;
};

const ANALYTICS_DEBUG_PREFIX = "[analytics]";
const LOCAL_CLICK_ID_PREFIX = "local_";

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function compactMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

function safeExistingMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function logInfo(message: string, context?: Record<string, unknown>) {
  console.info(ANALYTICS_DEBUG_PREFIX, message, context ?? {});
}

function logWarn(message: string, context?: Record<string, unknown>) {
  console.warn(ANALYTICS_DEBUG_PREFIX, message, context ?? {});
}

function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  console.error(ANALYTICS_DEBUG_PREFIX, message, {
    ...(context ?? {}),
    errorMessage: error instanceof Error ? error.message : String(error ?? "unknown_error"),
    error,
  });
}

export function isPartnerTrackingAvailable(): boolean {
  return isSupabaseConfigured();
}

export function buildLocalPartnerClickId(seed?: string): string {
  const suffix =
    clean(seed) ||
    `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${LOCAL_CLICK_ID_PREFIX}${suffix}`;
}

export function isTrackedPartnerClickId(clickId?: string | null): boolean {
  const value = clean(clickId);
  return Boolean(value) && !value.startsWith(LOCAL_CLICK_ID_PREFIX);
}

async function maybe<T>(
  operationName: string,
  work: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T | null> {
  if (!isPartnerTrackingAvailable()) {
    logWarn(`${operationName}: skipped because Supabase is not configured`, context);
    return null;
  }

  try {
    const result = await work();
    logInfo(`${operationName}: success`, context);
    return result;
  } catch (error) {
    logError(`${operationName}: failed`, error, context);
    return null;
  }
}

export async function createPartnerClick(
  input: CreatePartnerClickInput
): Promise<PartnerClickRecord | null> {
  const context = {
    tripId: clean(input.tripId),
    savedItemId: clean(input.savedItemId) || null,
    partnerId: clean(input.partnerId),
    partnerCategory: clean(input.partnerCategory),
    partnerTier: clean(input.partnerTier),
    sourceSurface: clean(input.sourceSurface) || null,
    sourceSection: clean(input.sourceSection) || null,
  };

  return maybe(
    "createPartnerClick",
    async () => {
      const supabase = getSupabaseClient();

      const payload = {
        trip_id: clean(input.tripId),
        saved_item_id: clean(input.savedItemId) || null,
        partner_id: clean(input.partnerId),
        partner_category: clean(input.partnerCategory),
        partner_tier: clean(input.partnerTier),
        url: clean(input.url),
        source_surface: clean(input.sourceSurface) || null,
        source_section: clean(input.sourceSection) || null,
        status: input.status ?? "clicked",
        metadata: compactMetadata(input.metadata),
      };

      const { data, error } = await supabase
        .from("partner_clicks")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;
      return data as PartnerClickRecord;
    },
    context
  );
}

export async function markPartnerClickReturned(args: {
  clickId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const clickId = clean(args.clickId);
  if (!isTrackedPartnerClickId(clickId)) {
    logInfo("markPartnerClickReturned: skipped for local click", { clickId });
    return;
  }

  const context = { clickId };

  await maybe(
    "markPartnerClickReturned",
    async () => {
      const supabase = getSupabaseClient();

      const { data: existingRow, error: fetchError } = await supabase
        .from("partner_clicks")
        .select("metadata")
        .eq("id", clickId)
        .single();

      if (fetchError) throw fetchError;

      const existingMetadata = safeExistingMetadata(existingRow?.metadata);
      const newMetadata = compactMetadata(args.metadata);
      const mergedMetadata = compactMetadata({
        ...existingMetadata,
        ...newMetadata,
      });

      const { error } = await supabase
        .from("partner_clicks")
        .update({
          status: "returned",
          returned_at: new Date().toISOString(),
          metadata: mergedMetadata,
        })
        .eq("id", clickId);

      if (error) throw error;
    },
    context
  );
}

export async function markPartnerClickConverted(args: {
  clickId: string;
  tripId: string;
  savedItemId: string;
  partnerId: PartnerId;
  savedItemType: SavedItemType;
  bookingStatus: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const clickId = clean(args.clickId);
  if (!isTrackedPartnerClickId(clickId)) {
    logInfo("markPartnerClickConverted: skipped for local click", { clickId });
    return;
  }

  await maybe(
    "markPartnerClickConverted",
    async () => {
      const supabase = getSupabaseClient();

      const { error: conversionError } = await supabase
        .from("partner_conversions")
        .upsert(
          {
            partner_click_id: clickId,
            trip_id: clean(args.tripId),
            saved_item_id: clean(args.savedItemId),
            partner_id: clean(args.partnerId),
            saved_item_type: clean(args.savedItemType),
            booking_status: clean(args.bookingStatus),
            metadata: compactMetadata(args.metadata),
          },
          { onConflict: "partner_click_id" }
        );

      if (conversionError) throw conversionError;

      const { error: clickError } = await supabase
        .from("partner_clicks")
        .update({
          saved_item_id: clean(args.savedItemId),
          status: "converted",
          converted_at: new Date().toISOString(),
        })
        .eq("id", clickId);

      if (clickError) throw clickError;
    },
    {
      clickId,
      tripId: clean(args.tripId),
      savedItemId: clean(args.savedItemId),
      partnerId: clean(args.partnerId),
      savedItemType: clean(args.savedItemType),
      bookingStatus: clean(args.bookingStatus),
    }
  );
}

export async function attachSavedItemToPartnerClick(args: {
  clickId: string;
  savedItemId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const clickId = clean(args.clickId);
  if (!isTrackedPartnerClickId(clickId)) {
    logInfo("attachSavedItemToPartnerClick: skipped for local click", { clickId });
    return;
  }

  await maybe(
    "attachSavedItemToPartnerClick",
    async () => {
      const supabase = getSupabaseClient();

      const { data: existingRow, error: fetchError } = await supabase
        .from("partner_clicks")
        .select("metadata")
        .eq("id", clickId)
        .single();

      if (fetchError) throw fetchError;

      const existingMetadata = safeExistingMetadata(existingRow?.metadata);
      const newMetadata = compactMetadata(args.metadata);
      const mergedMetadata = compactMetadata({
        ...existingMetadata,
        ...newMetadata,
      });

      const { error } = await supabase
        .from("partner_clicks")
        .update({
          saved_item_id: clean(args.savedItemId),
          metadata: mergedMetadata,
        })
        .eq("id", clickId);

      if (error) throw error;
    },
    {
      clickId,
      savedItemId: clean(args.savedItemId),
    }
  );
}

export async function logPartnerEvent(input: LogPartnerEventInput): Promise<void> {
  const clickId = clean(input.partnerClickId) || null;

  if (clickId && !isTrackedPartnerClickId(clickId)) {
    logInfo("logPartnerEvent: skipped for local click", {
      partnerClickId: clickId,
      eventName: clean(input.eventName),
    });
    return;
  }

  await maybe(
    "logPartnerEvent",
    async () => {
      const supabase = getSupabaseClient();

      const payload = {
        partner_click_id: clickId,
        trip_id: clean(input.tripId) || null,
        saved_item_id: clean(input.savedItemId) || null,
        event_name: clean(input.eventName),
        partner_id: clean(input.partnerId) || null,
        source_surface: clean(input.sourceSurface) || null,
        source_section: clean(input.sourceSection) || null,
        metadata: compactMetadata(input.metadata),
      };

      const { error } = await supabase.from("partner_events").insert(payload);
      if (error) throw error;
    },
    {
      partnerClickId: clickId,
      tripId: clean(input.tripId) || null,
      savedItemId: clean(input.savedItemId) || null,
      eventName: clean(input.eventName),
      partnerId: clean(input.partnerId) || null,
      sourceSurface: clean(input.sourceSurface) || null,
      sourceSection: clean(input.sourceSection) || null,
    }
  );
}
