import type { TeamRecord } from "./types";

const SCOTTISH_PREMIERSHIP = 179;
const SCOTLAND = "Scotland";

export const scottishPremiershipTeams: Record<string, TeamRecord> = {

  "celtic": {
    teamKey: "celtic",
    name: "Celtic",
    country: SCOTLAND,
    city: "Glasgow",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "celtic-park",
    founded: 1887,
    clubColors: ["green", "white"],
    aliases: ["celtic fc"],
  },

  "rangers": {
    teamKey: "rangers",
    name: "Rangers",
    country: SCOTLAND,
    city: "Glasgow",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "ibrox",
    founded: 1872,
    clubColors: ["blue", "white", "red"],
    aliases: ["rangers fc"],
  },

  "hearts": {
    teamKey: "hearts",
    name: "Hearts",
    country: SCOTLAND,
    city: "Edinburgh",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "tynecastle",
    founded: 1874,
    clubColors: ["maroon", "white"],
    aliases: ["heart of midlothian"],
  },

  "hibernian": {
    teamKey: "hibernian",
    name: "Hibernian",
    country: SCOTLAND,
    city: "Edinburgh",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "easter-road",
    founded: 1875,
    clubColors: ["green", "white"],
    aliases: ["hibs"],
  },

  "aberdeen": {
    teamKey: "aberdeen",
    name: "Aberdeen",
    country: SCOTLAND,
    city: "Aberdeen",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "pittodrie",
    founded: 1903,
    clubColors: ["red", "white"],
    aliases: ["aberdeen fc"],
  },

  "dundee-united": {
    teamKey: "dundee-united",
    name: "Dundee United",
    country: SCOTLAND,
    city: "Dundee",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "tannadice",
    founded: 1909,
    clubColors: ["orange", "black"],
    aliases: ["dundee utd"],
  },

  "dundee": {
    teamKey: "dundee",
    name: "Dundee FC",
    country: SCOTLAND,
    city: "Dundee",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "dens-park",
    founded: 1893,
    clubColors: ["dark blue"],
    aliases: ["dundee fc"],
  },

  "motherwell": {
    teamKey: "motherwell",
    name: "Motherwell",
    country: SCOTLAND,
    city: "Motherwell",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "fir-park",
    founded: 1886,
    clubColors: ["claret", "amber"],
    aliases: ["motherwell fc"],
  },

  "st-mirren": {
    teamKey: "st-mirren",
    name: "St Mirren",
    country: SCOTLAND,
    city: "Paisley",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "st-mirren-park",
    founded: 1877,
    clubColors: ["black", "white"],
    aliases: ["st mirren fc"],
  },

  "kilmarnock": {
    teamKey: "kilmarnock",
    name: "Kilmarnock",
    country: SCOTLAND,
    city: "Kilmarnock",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "rugby-park",
    founded: 1869,
    clubColors: ["blue", "white"],
    aliases: ["killie"],
  },

  "falkirk": {
    teamKey: "falkirk",
    name: "Falkirk",
    country: SCOTLAND,
    city: "Falkirk",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "falkirk-stadium",
    founded: 1876,
    clubColors: ["navy", "red"],
    aliases: ["falkirk fc"],
  },

  "livingston": {
    teamKey: "livingston",
    name: "Livingston",
    country: SCOTLAND,
    city: "Livingston",
    leagueId: SCOTTISH_PREMIERSHIP,
    stadiumKey: "almondvale",
    founded: 1943,
    clubColors: ["black", "gold"],
    aliases: ["livingston fc", "livi"],
  }

};

export default scottishPremiershipTeams;
