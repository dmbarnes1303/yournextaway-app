import type { TeamRecord } from "./types";

const BESTA_DEILD = 164;
const ICELAND = "Iceland";

export const bestaDeildTeams: Record<string, TeamRecord> = {
  "breidablik": {
    teamKey: "breidablik",
    name: "Breiðablik",
    country: ICELAND,
    city: "Kópavogur",
    leagueId: BESTA_DEILD,
    stadiumKey: "kopavogsvollur",
    aliases: ["breidablik kopavogur", "breidablik", "blikar"],
  },

  "fh": {
    teamKey: "fh",
    name: "FH",
    country: ICELAND,
    city: "Hafnarfjörður",
    leagueId: BESTA_DEILD,
    stadiumKey: "kaplakriki",
    aliases: [
      "fh hafnarfjordur",
      "fh hafnarfjördur",
      "fh hafnarfjordur",
      "fimleikafelag hafnarfjardar",
      "fimleikafelag hafnarfjordar",
    ],
  },

  "fram": {
    teamKey: "fram",
    name: "Fram",
    country: ICELAND,
    city: "Reykjavík",
    leagueId: BESTA_DEILD,
    stadiumKey: "lambhagavollurinn",
    aliases: ["fram reykjavik", "fram rvk", "knattspyrnufelagid fram"],
  },

  "ia": {
    teamKey: "ia",
    name: "ÍA",
    country: ICELAND,
    city: "Akranes",
    leagueId: BESTA_DEILD,
    stadiumKey: "akranesvollur",
    aliases: ["ia akranes", "akranes", "ibandalag akraness"],
  },

  "ibv": {
    teamKey: "ibv",
    name: "ÍBV",
    country: ICELAND,
    city: "Vestmannaeyjar",
    leagueId: BESTA_DEILD,
    stadiumKey: "hasteinsvollur",
    aliases: ["ibv vestmannaeyjar", "vestmannaeyjar", "ithrottabandalag vestmannaeyja"],
  },

  "ka": {
    teamKey: "ka",
    name: "KA",
    country: ICELAND,
    city: "Akureyri",
    leagueId: BESTA_DEILD,
    stadiumKey: "greifavollurinn",
    aliases: ["ka akureyri", "knattspyrnufelag akureyrar"],
  },

  "keflavik": {
    teamKey: "keflavik",
    name: "Keflavík",
    country: ICELAND,
    city: "Keflavík",
    leagueId: BESTA_DEILD,
    stadiumKey: "hs-orku-vollurinn",
    aliases: ["keflavik if", "keflavik if", "keflavik football club"],
  },

  "kr-reykjavik": {
    teamKey: "kr-reykjavik",
    name: "KR Reykjavík",
    country: ICELAND,
    city: "Reykjavík",
    leagueId: BESTA_DEILD,
    stadiumKey: "kr-vollur",
    aliases: ["kr", "kr reykjavik", "knattspyrnufelag reykjavikur"],
  },

  "stjarnan": {
    teamKey: "stjarnan",
    name: "Stjarnan",
    country: ICELAND,
    city: "Garðabær",
    leagueId: BESTA_DEILD,
    stadiumKey: "samsung-vollurinn",
    aliases: ["stjarnan gardabaer", "stjarnan gardabær", "stjarnan gardabaer"],
  },

  "thor-akureyri": {
    teamKey: "thor-akureyri",
    name: "Þór Akureyri",
    country: ICELAND,
    city: "Akureyri",
    leagueId: BESTA_DEILD,
    stadiumKey: "vis-vollurinn",
    aliases: ["thor", "thor akureyri", "þor akureyri", "thór akureyri"],
  },

  "valur": {
    teamKey: "valur",
    name: "Valur",
    country: ICELAND,
    city: "Reykjavík",
    leagueId: BESTA_DEILD,
    stadiumKey: "n1-vollurinn-hlidarenda",
    aliases: ["valur reykjavik", "valur rvk"],
  },

  "vikingur-reykjavik": {
    teamKey: "vikingur-reykjavik",
    name: "Víkingur Reykjavík",
    country: ICELAND,
    city: "Reykjavík",
    leagueId: BESTA_DEILD,
    stadiumKey: "vikingsvollur",
    aliases: ["vikingur", "vikingur reykjavik", "víkingur", "víkingur reykjavík"],
  },
};

export default bestaDeildTeams;
