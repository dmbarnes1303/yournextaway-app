import type { StadiumRecord } from "./types";

const primeiraLigaStadiums: Record<string, StadiumRecord> = {
  "estadio-da-luz": {
    stadiumKey: "estadio-da-luz",
    name: "Estádio da Luz",
    city: "Lisbon",
    country: "Portugal",
    capacity: 64642,
    opened: 2003,
    airport: "Lisbon Humberto Delgado Airport (LIS)",
    distanceFromAirportKm: 6,
    teamKeys: ["benfica"],
    tips: [
      "One of the largest stadiums in Europe and regularly sold out",
      "Arrive early — pre-match atmosphere around the stadium is excellent",
    ],
    transit: [
      { label: "Colégio Militar/Luz (Metro)", minutes: 5 },
      { label: "Benfica Station", minutes: 15 },
    ],
    stayAreas: [
      { area: "Baixa / Chiado", why: "Best central Lisbon base with nightlife and transport" },
      { area: "Marquês de Pombal", why: "Great metro connections including direct line to stadium" },
    ],
  },

  "estadio-do-dragao": {
    stadiumKey: "estadio-do-dragao",
    name: "Estádio do Dragão",
    city: "Porto",
    country: "Portugal",
    capacity: 50033,
    opened: 2003,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 18,
    teamKeys: ["porto"],
    tips: [
      "Metro station sits directly outside the stadium",
      "Museum and stadium tour worth visiting if arriving early",
    ],
    transit: [
      { label: "Estádio do Dragão (Metro)", minutes: 2 },
      { label: "Campanhã Station", minutes: 10 },
    ],
    stayAreas: [
      { area: "Ribeira", why: "Historic riverside area with restaurants and nightlife" },
      { area: "Bolhão / City Centre", why: "Central location with good metro links" },
    ],
  },

  "estadio-jose-alvalade": {
    stadiumKey: "estadio-jose-alvalade",
    name: "Estádio José Alvalade",
    city: "Lisbon",
    country: "Portugal",
    capacity: 50095,
    opened: 2003,
    airport: "Lisbon Humberto Delgado Airport (LIS)",
    distanceFromAirportKm: 4,
    teamKeys: ["sporting-cp"],
    tips: [
      "Modern stadium next to large shopping centre and metro hub",
      "Easy access from Lisbon city centre via metro",
    ],
    transit: [
      { label: "Campo Grande (Metro)", minutes: 5 },
      { label: "Entrecampos", minutes: 20, note: "useful wider Lisbon connection point" },
    ],
    stayAreas: [
      { area: "Baixa / Chiado", why: "Best central Lisbon base for visitors" },
      { area: "Saldanha", why: "Great metro connections and hotels" },
    ],
  },

  "estadio-municipal-de-braga": {
    stadiumKey: "estadio-municipal-de-braga",
    name: "Estádio Municipal de Braga",
    city: "Braga",
    country: "Portugal",
    capacity: 30286,
    opened: 2003,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 55,
    teamKeys: ["braga"],
    tips: [
      "Unique stadium carved into a quarry cliff",
      "Views behind the stand are spectacular",
    ],
    transit: [
      { label: "Braga Station", minutes: 30 },
      { label: "Braga Historic Centre", minutes: 20, note: "best local visitor base" },
    ],
    stayAreas: [
      { area: "Braga Historic Centre", why: "Best area for restaurants and atmosphere" },
      { area: "Near Braga Station", why: "Best practical option for onward rail travel" },
    ],
  },

  "estadio-dom-afonso-henriques": {
    stadiumKey: "estadio-dom-afonso-henriques",
    name: "Estádio D. Afonso Henriques",
    city: "Guimarães",
    country: "Portugal",
    capacity: 30165,
    opened: 1965,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 53,
    teamKeys: ["vitoria-guimaraes"],
    tips: [
      "One of the best atmospheres in Portuguese football",
      "Historic Guimarães makes this a stronger overnight football trip than many expect",
    ],
    transit: [
      { label: "Guimarães Station", minutes: 20 },
      { label: "Guimarães Old Town", minutes: 15 },
    ],
    stayAreas: [
      { area: "Guimarães Old Town", why: "Beautiful historic centre and short distance to stadium" },
      { area: "Near station", why: "Best practical base for rail-led travel" },
    ],
  },

  "estadio-do-bessa": {
    stadiumKey: "estadio-do-bessa",
    name: "Estádio do Bessa",
    city: "Porto",
    country: "Portugal",
    capacity: 28263,
    opened: 2003,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 12,
    teamKeys: ["boavista"],
    tips: [
      "Easy Porto football trip because the city itself does most of the work",
      "Best treated as a Porto city-break fixture rather than a stadium-area stay",
    ],
    transit: [
      { label: "Casa da Música", minutes: 15 },
      { label: "Trindade", minutes: 20, note: "best wider metro hub" },
    ],
    stayAreas: [
      { area: "Ribeira", why: "Best classic Porto city-break base" },
      { area: "Bolhão / Aliados", why: "Best practical city-centre option" },
    ],
  },

  "estadio-municipal-22-de-junho": {
    stadiumKey: "estadio-municipal-22-de-junho",
    name: "Estádio Municipal 22 de Junho",
    city: "Vila Nova de Famalicão",
    country: "Portugal",
    capacity: 5300,
    opened: 1952,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 30,
    teamKeys: ["famalicao"],
    tips: [
      "More of a compact football stop than a glamour weekend destination",
      "Easy enough to do from Porto if you want a stronger city base",
    ],
    transit: [
      { label: "Famalicão Station", minutes: 20 },
      { label: "Town centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Famalicão Centre", why: "Most practical local option" },
      { area: "Porto", why: "Better wider city-break base if combining football with a larger trip" },
    ],
  },

  "parque-joaquim-de-almeida-freitas": {
    stadiumKey: "parque-joaquim-de-almeida-freitas",
    name: "Parque Joaquim de Almeida Freitas",
    city: "Moreira de Cónegos",
    country: "Portugal",
    capacity: 6153,
    opened: 2002,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 45,
    teamKeys: ["moreirense"],
    tips: [
      "A football stop rather than a classic city-break destination",
      "Best approached with Guimarães or Porto as the wider base",
    ],
    transit: [
      { label: "Guimarães", minutes: 25, note: "best nearby wider base" },
      { label: "Town centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Guimarães", why: "Best nearby city base with more atmosphere and hotels" },
      { area: "Porto", why: "Best if building a wider football trip" },
    ],
  },

  "estadio-cidade-de-barcelos": {
    stadiumKey: "estadio-cidade-de-barcelos",
    name: "Estádio Cidade de Barcelos",
    city: "Barcelos",
    country: "Portugal",
    capacity: 12400,
    opened: 2004,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 45,
    teamKeys: ["gil-vicente"],
    tips: [
      "Good smaller-city northern Portugal football stop",
      "Works best as a compact overnight or as part of a broader Porto/Braga run",
    ],
    transit: [
      { label: "Barcelos Station", minutes: 20 },
      { label: "Historic centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Barcelos Centre", why: "Best local practical base" },
      { area: "Braga", why: "Better wider city option if combining football with a stronger stay base" },
    ],
  },

  "estadio-dos-arcos": {
    stadiumKey: "estadio-dos-arcos",
    name: "Estádio dos Arcos",
    city: "Vila do Conde",
    country: "Portugal",
    capacity: 12815,
    opened: 1984,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 20,
    teamKeys: ["rio-ave"],
    tips: [
      "Easy to combine with Porto thanks to the coastal location",
      "Useful short football trip if you want something less obvious than the big three",
    ],
    transit: [
      { label: "Porto city centre", minutes: 35, note: "best wider base" },
      { label: "Vila do Conde centre", minutes: 10 },
    ],
    stayAreas: [
      { area: "Vila do Conde", why: "Best local option if you want a quieter coastal stay" },
      { area: "Porto", why: "Best overall city-break base" },
    ],
  },

  "estadio-antonio-coimbra-da-mota": {
    stadiumKey: "estadio-antonio-coimbra-da-mota",
    name: "Estádio António Coimbra da Mota",
    city: "Estoril",
    country: "Portugal",
    capacity: 8000,
    opened: 1939,
    airport: "Lisbon Humberto Delgado Airport (LIS)",
    distanceFromAirportKm: 30,
    teamKeys: ["estoril"],
    tips: [
      "Excellent football-and-coast combination because Estoril/Cascais adds leisure value",
      "Usually better as a Lisbon or Cascais-based trip than a pure stadium-area stay",
    ],
    transit: [
      { label: "Estoril Station", minutes: 15 },
      { label: "Cais do Sodré", minutes: 35, note: "best Lisbon rail link" },
    ],
    stayAreas: [
      { area: "Cascais / Estoril", why: "Best coastal leisure base" },
      { area: "Baixa / Chiado", why: "Best if you want a full Lisbon city-break base" },
    ],
  },

  "estadio-pina-manique": {
    stadiumKey: "estadio-pina-manique",
    name: "Estádio Pina Manique",
    city: "Lisbon",
    country: "Portugal",
    capacity: 2500,
    opened: 1937,
    airport: "Lisbon Humberto Delgado Airport (LIS)",
    distanceFromAirportKm: 9,
    teamKeys: ["casa-pia"],
    tips: [
      "This is a Lisbon trip first, club trip second",
      "Central Lisbon remains the right answer for almost everyone",
    ],
    transit: [
      { label: "Sete Rios", minutes: 20 },
      { label: "Campolide / central Lisbon", minutes: 20, note: "best wider practical approach" },
    ],
    stayAreas: [
      { area: "Baixa / Chiado", why: "Best all-round Lisbon base" },
      { area: "Marquês de Pombal", why: "Best practical city base for movement" },
    ],
  },

  "estadio-municipal-de-arouca": {
    stadiumKey: "estadio-municipal-de-arouca",
    name: "Estádio Municipal de Arouca",
    city: "Arouca",
    country: "Portugal",
    capacity: 5600,
    opened: 2006,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 60,
    teamKeys: ["arouca"],
    tips: [
      "More of a niche football stop than a polished city-break destination",
      "Best if paired with a wider northern Portugal road or rail trip",
    ],
    transit: [
      { label: "Arouca centre", minutes: 10 },
      { label: "Porto", minutes: 60, note: "best wider city base" },
    ],
    stayAreas: [
      { area: "Arouca Centre", why: "Most practical local option" },
      { area: "Porto", why: "Much stronger overall visitor base" },
    ],
  },

  "estadio-de-sao-luis": {
    stadiumKey: "estadio-de-sao-luis",
    name: "Estádio de São Luís",
    city: "Faro",
    country: "Portugal",
    capacity: 7000,
    opened: 1923,
    airport: "Faro Airport (FAO)",
    distanceFromAirportKm: 6,
    teamKeys: ["farense"],
    tips: [
      "Very good football-and-sun option because Faro works as a proper weekend city",
      "Easy to pair football with old town, coast and Algarve travel",
    ],
    transit: [
      { label: "Faro Station", minutes: 20 },
      { label: "Cidade Velha / centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Faro Old Town", why: "Best atmosphere and city-break feel" },
      { area: "City Centre / Marina", why: "Best practical base for rail and airport access" },
    ],
  },

  "estadio-da-madeira": {
    stadiumKey: "estadio-da-madeira",
    name: "Estádio da Madeira",
    city: "Funchal",
    country: "Portugal",
    capacity: 5200,
    opened: 1998,
    airport: "Madeira Airport (FNC)",
    distanceFromAirportKm: 20,
    teamKeys: ["nacional"],
    tips: [
      "Madeira turns this into a far more attractive football trip than the club size alone suggests",
      "Funchal should be the base, not the stadium area",
    ],
    transit: [
      { label: "Funchal centre", minutes: 20 },
      { label: "Marina / old town", minutes: 20, note: "best visitor starting area" },
    ],
    stayAreas: [
      { area: "Funchal Centre", why: "Best practical all-round base" },
      { area: "Old Town / Marina", why: "Best scenic and leisure-oriented stay" },
    ],
  },

  "estadio-de-sao-miguel": {
    stadiumKey: "estadio-de-sao-miguel",
    name: "Estádio de São Miguel",
    city: "Ponta Delgada",
    country: "Portugal",
    capacity: 13000,
    opened: 1930,
    airport: "Ponta Delgada Airport (PDL)",
    distanceFromAirportKm: 4,
    teamKeys: ["santa-clara"],
    tips: [
      "One of the most distinctive football trips in Europe because of the Azores setting",
      "Excellent if you want football plus scenery rather than just a straight match weekend",
    ],
    transit: [
      { label: "Ponta Delgada centre", minutes: 15 },
      { label: "Airport", minutes: 10, note: "very easy arrival city" },
    ],
    stayAreas: [
      { area: "Ponta Delgada Centre", why: "Best practical and atmospheric local base" },
      { area: "Marina / waterfront", why: "Best scenic stay option" },
    ],
  },

  "estadio-jose-gomes": {
    stadiumKey: "estadio-jose-gomes",
    name: "Estádio José Gomes",
    city: "Amadora",
    country: "Portugal",
    capacity: 9288,
    opened: 1932,
    airport: "Lisbon Humberto Delgado Airport (LIS)",
    distanceFromAirportKm: 12,
    teamKeys: ["estrela-amadora"],
    tips: [
      "This is effectively a Lisbon football trip rather than an Amadora city break",
      "Central Lisbon gives the best overall experience",
    ],
    transit: [
      { label: "Reboleira", minutes: 15 },
      { label: "Sete Rios", minutes: 20, note: "best practical Lisbon connection point" },
    ],
    stayAreas: [
      { area: "Baixa / Chiado", why: "Best classic Lisbon base" },
      { area: "Marquês de Pombal", why: "Best practical metro-connected option" },
    ],
  },

  "estadio-do-cd-aves": {
    stadiumKey: "estadio-do-cd-aves",
    name: "Estádio do CD Aves",
    city: "Vila das Aves",
    country: "Portugal",
    capacity: 8500,
    opened: 1981,
    airport: "Porto Airport (OPO)",
    distanceFromAirportKm: 30,
    teamKeys: ["avs"],
    tips: [
      "More of a simple football stop than a premium destination in its own right",
      "Best done from Porto or Guimarães if you want a stronger wider trip",
    ],
    transit: [
      { label: "Vila das Aves centre", minutes: 10 },
      { label: "Porto", minutes: 40, note: "best wider city base" },
    ],
    stayAreas: [
      { area: "Porto", why: "Best city-break option with far better hotels and nightlife" },
      { area: "Guimarães", why: "Better nearby local alternative with more character" },
    ],
  },
};

export default primeiraLigaStadiums;
