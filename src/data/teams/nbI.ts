import type { TeamRecord } from "./types";

const NB_I = 271;
const HUNGARY = "Hungary";

export const nbITeams: Record<string, TeamRecord> = {
  "eto-gyor": {
    teamKey: "eto-gyor",
    name: "ETO Győr",
    country: HUNGARY,
    city: "Győr",
    leagueId: NB_I,
    stadiumKey: "eto-park",
    aliases: ["gyor", "eto gyor", "gyori eto"],
  },

  "ferencvaros": {
    teamKey: "ferencvaros",
    name: "Ferencváros",
    country: HUNGARY,
    city: "Budapest",
    leagueId: NB_I,
    stadiumKey: "groupama-arena",
    aliases: ["ferencvaros", "fradi", "ferencvarosi tc"],
  },

  "debrecen": {
    teamKey: "debrecen",
    name: "Debrecen",
    country: HUNGARY,
    city: "Debrecen",
    leagueId: NB_I,
    stadiumKey: "nagyerdei-stadion",
    aliases: ["dvsc", "debreceni vsc"],
  },

  "kisvarda": {
    teamKey: "kisvarda",
    name: "Kisvárda",
    country: HUNGARY,
    city: "Kisvárda",
    leagueId: NB_I,
    stadiumKey: "vardai-stadion",
    aliases: ["kisvarda fc", "vardai fc"],
  },

  "zalaegerszeg": {
    teamKey: "zalaegerszeg",
    name: "Zalaegerszegi TE",
    country: HUNGARY,
    city: "Zalaegerszeg",
    leagueId: NB_I,
    stadiumKey: "zte-arena",
    aliases: ["zte", "zalaegerszeg", "zalaegerszegi te"],
  },

  "paks": {
    teamKey: "paks",
    name: "Paks",
    country: HUNGARY,
    city: "Paks",
    leagueId: NB_I,
    stadiumKey: "paks-stadion",
    aliases: ["paks fc"],
  },

  "puskas-akademia": {
    teamKey: "puskas-akademia",
    name: "Puskás Akadémia",
    country: HUNGARY,
    city: "Felcsút",
    leagueId: NB_I,
    stadiumKey: "pancho-arena",
    aliases: ["puskas akademia", "puskas academy"],
  },

  "ujpest": {
    teamKey: "ujpest",
    name: "Újpest",
    country: HUNGARY,
    city: "Budapest",
    leagueId: NB_I,
    stadiumKey: "szusza-ferenc-stadion",
    aliases: ["ujpest fc"],
  },

  "nyiregyhaza": {
    teamKey: "nyiregyhaza",
    name: "Nyíregyháza Spartacus",
    country: HUNGARY,
    city: "Nyíregyháza",
    leagueId: NB_I,
    stadiumKey: "varosi-stadion-nyiregyhaza",
    aliases: ["nyiregyhaza", "spartacus nyiregyhaza"],
  },

  "mtk-budapest": {
    teamKey: "mtk-budapest",
    name: "MTK Budapest",
    country: HUNGARY,
    city: "Budapest",
    leagueId: NB_I,
    stadiumKey: "hidegkuti-nandor-stadion",
    aliases: ["mtk"],
  },

  "diosgyor": {
    teamKey: "diosgyor",
    name: "Diósgyőr",
    country: HUNGARY,
    city: "Miskolc",
    leagueId: NB_I,
    stadiumKey: "dvtk-stadion",
    aliases: ["dvtk", "diosgyori vtk"],
  },

  "kazincbarcika": {
    teamKey: "kazincbarcika",
    name: "Kazincbarcika",
    country: HUNGARY,
    city: "Kazincbarcika",
    leagueId: NB_I,
    stadiumKey: "kolorcity-arena",
    aliases: ["kolorcity kazincbarcika"],
  },
};

export default nbITeams;
