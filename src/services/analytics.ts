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

async function maybe<T>(work: () => Promise<T>): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    return await work();
  } catch {
    return null;
  }
}

export async function createPartnerClick(input: CreatePartnerClickInput): Promise<PartnerClickRecord | null> {
  return maybe(async () => {
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
  });
}

export async function markPartnerClickReturned(args: {
  clickId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await maybe(async () => {
    const supabase = getSupabaseClient();
    const clickId = clean(args.clickId);

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
  });
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
  await maybe(async () => {
    const supabase = getSupabaseClient();
    const clickId = clean(args.clickId);

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
  });
}

export async function attachSavedItemToPartnerClick(args: {
  clickId: string;
  savedItemId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await maybe(async () => {
    const supabase = getSupabaseClient();
    const clickId = clean(args.clickId);

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
  });
}

export async function logPartnerEvent(input: LogPartnerEventInput): Promise<void> {
  await maybe(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("partner_events").insert({
      partner_click_id: clean(input.partnerClickId) || null,
      trip_id: clean(input.tripId) || null,
      saved_item_id: clean(input.savedItemId) || null,
      event_name: clean(input.eventName),
      partner_id: clean(input.partnerId) || null,
      source_surface: clean(input.sourceSurface) || null,
      source_section: clean(input.sourceSection) || null,
      metadata: compactMetadata(input.metadata),
    });
    if (error) throw error;
  });
}
