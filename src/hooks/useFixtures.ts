// src/hooks/useFixtures.ts
// Minimal fixtures hook used by match screen and other screens.
// Provides a safe way to fetch a single fixture by id.

import { useEffect, useState } from "react";
import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";

export function useFixture(fixtureId?: number | string | null) {
  const [fixture, setFixture] = useState<FixtureListRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!fixtureId) {
        setFixture(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const f = await getFixtureById(Number(fixtureId));
        if (!mounted) return;
        setFixture(f);
      } catch (e: any) {
        if (!mounted) return;
        setFixture(null);
        setError(String(e?.message || e || "Failed to load fixture"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [fixtureId]);

  return { fixture, loading, error };
}
