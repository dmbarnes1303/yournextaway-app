import type { TeamRecord } from "./types";

const IRELAND = "Ireland";

export const leagueOfIrelandPremierTeams: Record<string, TeamRecord> = {

  "bohemians": {
    teamKey: "bohemians",
    name: "Bohemians",
    country: IRELAND,
    city: "Dublin",
    stadiumKey: "dalymount-park"
  },

  "st-patricks-athletic": {
    teamKey: "st-patricks-athletic",
    name: "St Patrick's Athletic",
    country: IRELAND,
    city: "Dublin",
    stadiumKey: "richmond-park"
  },

  "shamrock-rovers": {
    teamKey: "shamrock-rovers",
    name: "Shamrock Rovers",
    country: IRELAND,
    city: "Dublin",
    stadiumKey: "tallaght-stadium"
  },

  "derry-city": {
    teamKey: "derry-city",
    name: "Derry City",
    country: IRELAND,
    city: "Derry",
    stadiumKey: "brandywell-stadium"
  },

  "drogheda-united": {
    teamKey: "drogheda-united",
    name: "Drogheda United",
    country: IRELAND,
    city: "Drogheda",
    stadiumKey: "weavers-park"
  },

  "shelbourne": {
    teamKey: "shelbourne",
    name: "Shelbourne",
    country: IRELAND,
    city: "Dublin",
    stadiumKey: "tolka-park"
  },

  "galway-united": {
    teamKey: "galway-united",
    name: "Galway United",
    country: IRELAND,
    city: "Galway",
    stadiumKey: "eamonn-deacy-park"
  },

  "dundalk": {
    teamKey: "dundalk",
    name: "Dundalk",
    country: IRELAND,
    city: "Dundalk",
    stadiumKey: "oriel-park"
  },

  "sligo-rovers": {
    teamKey: "sligo-rovers",
    name: "Sligo Rovers",
    country: IRELAND,
    city: "Sligo",
    stadiumKey: "showgrounds-sligo"
  },

  "waterford": {
    teamKey: "waterford",
    name: "Waterford",
    country: IRELAND,
    city: "Waterford",
    stadiumKey: "regional-sports-centre"
  }

};

export default leagueOfIrelandPremierTeams;
