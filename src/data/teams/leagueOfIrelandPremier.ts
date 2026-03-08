import type { TeamRecord } from "./types";

const IRELAND = "Ireland";
const PREMIER_DIVISION = 357;

export const leagueOfIrelandPremierTeams: Record<string, TeamRecord> = {
  "bohemians": {
    teamKey: "bohemians",
    name: "Bohemians",
    country: IRELAND,
    city: "Dublin",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "dalymount-park",
    aliases: ["bohs", "bohemian fc"],
  },

  "st-patricks-athletic": {
    teamKey: "st-patricks-athletic",
    name: "St Patrick's Athletic",
    country: IRELAND,
    city: "Dublin",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "richmond-park",
    aliases: ["st pats", "st patricks", "saint patricks athletic"],
  },

  "shamrock-rovers": {
    teamKey: "shamrock-rovers",
    name: "Shamrock Rovers",
    country: IRELAND,
    city: "Dublin",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "tallaght-stadium",
    aliases: ["rovers", "shamrock"],
  },

  "derry-city": {
    teamKey: "derry-city",
    name: "Derry City",
    country: IRELAND,
    city: "Derry",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "brandywell-stadium",
    aliases: ["derry"],
  },

  "drogheda-united": {
    teamKey: "drogheda-united",
    name: "Drogheda United",
    country: IRELAND,
    city: "Drogheda",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "weavers-park",
    aliases: ["drogheda"],
  },

  "shelbourne": {
    teamKey: "shelbourne",
    name: "Shelbourne",
    country: IRELAND,
    city: "Dublin",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "tolka-park",
    aliases: ["shels"],
  },

  "galway-united": {
    teamKey: "galway-united",
    name: "Galway United",
    country: IRELAND,
    city: "Galway",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "eamonn-deacy-park",
    aliases: ["galway"],
  },

  "dundalk": {
    teamKey: "dundalk",
    name: "Dundalk",
    country: IRELAND,
    city: "Dundalk",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "oriel-park",
    aliases: ["dundalk fc"],
  },

  "sligo-rovers": {
    teamKey: "sligo-rovers",
    name: "Sligo Rovers",
    country: IRELAND,
    city: "Sligo",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "showgrounds-sligo",
    aliases: ["sligo"],
  },

  "waterford": {
    teamKey: "waterford",
    name: "Waterford",
    country: IRELAND,
    city: "Waterford",
    leagueId: PREMIER_DIVISION,
    stadiumKey: "regional-sports-centre",
    aliases: ["waterford fc"],
  },
};

export default leagueOfIrelandPremierTeams;
