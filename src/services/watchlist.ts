// src/services/watchlist.ts
import { supabase } from "@/src/services/supabase";

export type WatchRecord = {
  fixtureId: string;
  leagueId?: number;
  season?: number;
  lastKnownKickoffIso?: string | null;
  lastKnownIsTbc: boolean;
};

function toIsoOrNull(v: unknown): string | null {
  if (!v) return null;
  const s = String(v);
  // supabase returns ISO-ish timestamptz strings
  return s.trim() ? s : null;
}

export async function listWatchedFixtureIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("watched_fixtures")
    .select("fixture_id")
    .limit(5000);

  if (error) throw error;

  const set = new Set<string>();
  for (const row of data ?? []) {
    const id = String((row as any)?.fixture_id ?? "").trim();
    if (id) set.add(id);
  }
  return set;
}

export async function isWatched(fixtureId: string): Promise<boolean> {
  const id = String(fixtureId ?? "").trim();
  if (!id) return false;

  const { data, error } = await supabase
    .from("watched_fixtures")
    .select("fixture_id")
    .eq("fixture_id", id)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.fixture_id);
}

export async function watchFixture(input: WatchRecord): Promise<void> {
  const fixtureId = String(input.fixtureId ?? "").trim();
  if (!fixtureId) throw new Error("Missing fixtureId.");

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const payload: any = {
    user_id: userId,
    fixture_id: fixtureId,
    league_id: typeof input.leagueId === "number" ? input.leagueId : null,
    season: typeof input.season === "number" ? input.season : null,
    last_known_kickoff: input.lastKnownKickoffIso ? input.lastKnownKickoffIso : null,
    last_known_is_tbc: Boolean(input.lastKnownIsTbc),
  };

  const { error } = await supabase.from("watched_fixtures").upsert(payload, {
    onConflict: "user_id,fixture_id",
  });

  if (error) throw error;
}

export async function unwatchFixture(fixtureId: string): Promise<void> {
  const id = String(fixtureId ?? "").trim();
  if (!id) return;

  const { error } = await supabase.from("watched_fixtures").delete().eq("fixture_id", id);
  if (error) throw error;
}

export async function updateLastKnown(fixtureId: string, kickoffIso: string | null, isTbc: boolean): Promise<void> {
  const id = String(fixtureId ?? "").trim();
  if (!id) return;

  const { error } = await supabase
    .from("watched_fixtures")
    .update({
      last_known_kickoff: kickoffIso ? kickoffIso : null,
      last_known_is_tbc: Boolean(isTbc),
    })
    .eq("fixture_id", id);

  if (error) throw error;
}

export async function getWatchSnapshot(fixtureId: string): Promise<{
  lastKnownKickoffIso: string | null;
  lastKnownIsTbc: boolean;
} | null> {
  const id = String(fixtureId ?? "").trim();
  if (!id) return null;

  const { data, error } = await supabase
    .from("watched_fixtures")
    .select("last_known_kickoff,last_known_is_tbc")
    .eq("fixture_id", id)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  return {
    lastKnownKickoffIso: toIsoOrNull((data as any)?.last_known_kickoff),
    lastKnownIsTbc: Boolean((data as any)?.last_known_is_tbc),
  };
}
