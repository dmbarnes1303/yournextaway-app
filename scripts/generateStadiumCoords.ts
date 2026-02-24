/**
 * Generate stadium coordinates from Wikidata
 * Safe async version (no libuv crash on Windows)
 */

import fs from "fs/promises";
import path from "path";

type StadiumRow = {
  club: string;
  stadium: string;
};

type Coord = {
  lat: number;
  lng: number;
};

const INPUT: StadiumRow[] = [
  // Add clubs progressively or import list
  { club: "Arsenal", stadium: "Emirates Stadium" },
  { club: "Chelsea", stadium: "Stamford Bridge" },
  { club: "Manchester United", stadium: "Old Trafford" },
];

const OUTPUT_FILE = path.resolve("src/utils/stadiums.ts");

async function fetchCoords(stadium: string): Promise<Coord | null> {
  const q = `
    SELECT ?coord WHERE {
      ?s rdfs:label "${stadium}"@en.
      ?s wdt:P625 ?coord.
    } LIMIT 1
  `;

  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(q);

  const res = await fetch(url);
  if (!res.ok) return null;

  const json: any = await res.json();
  const binding = json?.results?.bindings?.[0]?.coord?.value;

  if (!binding) return null;

  const m = binding.match(/Point\\(([-0-9.]+) ([-0-9.]+)\\)/);
  if (!m) return null;

  return {
    lng: Number(m[1]),
    lat: Number(m[2]),
  };
}

async function main() {
  console.log("Fetching Wikidata stadium coords…");

  const out: Record<string, Coord> = {};

  for (const row of INPUT) {
    try {
      const c = await fetchCoords(row.stadium);
      if (c) {
        out[row.club] = c;
        console.log("✓", row.club);
      } else {
        console.log("✗", row.club);
      }
    } catch (e) {
      console.log("ERR", row.club);
    }
  }

  const file = `
export const STADIUM_COORDS: Record<string,{lat:number,lng:number}> = ${JSON.stringify(
    out,
    null,
    2
  )};
`;

  await fs.writeFile(OUTPUT_FILE, file, "utf8");

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
});
