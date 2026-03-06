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
      { label: "Benfica Station", minutes: 15 }
    ],
    stayAreas: [
      { area: "Baixa / Chiado", why: "Best central Lisbon base with nightlife and transport" },
      { area: "Marquês de Pombal", why: "Great metro connections including direct line to stadium" }
    ]
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
      { label: "Campanhã Station", minutes: 10 }
    ],
    stayAreas: [
      { area: "Ribeira", why: "Historic riverside area with restaurants and nightlife" },
      { area: "Bolhão / City Centre", why: "Central location with good metro links" }
    ]
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
      { label: "Campo Grande (Metro)", minutes: 5 }
    ],
    stayAreas: [
      { area: "Baixa / Chiado", why: "Best central Lisbon base for visitors" },
      { area: "Saldanha", why: "Great metro connections and hotels" }
    ]
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
      { label: "Braga Station", minutes: 30 }
    ],
    stayAreas: [
      { area: "Braga Historic Centre", why: "Best area for restaurants and atmosphere" }
    ]
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
    ],
    transit: [
      { label: "Guimarães Station", minutes: 20 }
    ],
    stayAreas: [
      { area: "Guimarães Old Town", why: "Beautiful historic centre and short distance to stadium" }
    ]
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
  }

};

export default primeiraLigaStadiums;
