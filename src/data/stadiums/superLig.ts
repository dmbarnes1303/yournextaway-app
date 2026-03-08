import type { StadiumRecord } from "./types";

const TURKEY = "Turkey";

const superLigStadiums: Record<string, StadiumRecord> = {
  "ram-park": {
    stadiumKey: "ram-park",
    name: "RAMS Park",
    city: "Istanbul",
    country: TURKEY,
    capacity: 52600,
    opened: 2011,
    airport: "Istanbul Airport (IST)",
    distanceFromAirportKm: 35,
    teamKeys: ["galatasaray"],
    transit: [
      { label: "Seyrantepe", minutes: 5 },
      { label: "Taksim / Şişli", minutes: 25, note: "best wider city base" },
    ],
    stayAreas: [
      { area: "Taksim / Beyoğlu", why: "Best nightlife and central city-break base" },
      { area: "Şişli", why: "Best practical modern-side base with easier stadium access" },
    ],
    tips: [
      "One of the strongest atmosphere trips in European football",
      "Stay central Istanbul rather than near the stadium",
    ],
  },

  "sukru-saracoglu": {
    stadiumKey: "sukru-saracoglu",
    name: "Şükrü Saracoğlu Stadium",
    city: "Istanbul",
    country: TURKEY,
    capacity: 47544,
    opened: 1908,
    airport: "Sabiha Gökçen Airport (SAW)",
    distanceFromAirportKm: 30,
    teamKeys: ["fenerbahce"],
    transit: [
      { label: "Kadıköy", minutes: 15 },
      { label: "Ayrılık Çeşmesi", minutes: 20, note: "best broader Asian-side connection" },
    ],
    stayAreas: [
      { area: "Kadıköy", why: "Best local atmosphere, bars and food scene" },
      { area: "Karaköy / Galata", why: "Best if splitting time across both sides of the city" },
    ],
    tips: [
      "One of the best big-club city football trips because Kadıköy adds a lot to the matchday",
      "Asian-side stays can work very well here if you want a more local-feel trip",
    ],
  },

  "vodafone-park": {
    stadiumKey: "vodafone-park",
    name: "Vodafone Park",
    city: "Istanbul",
    country: TURKEY,
    capacity: 42590,
    opened: 2016,
    airport: "Istanbul Airport (IST)",
    distanceFromAirportKm: 40,
    teamKeys: ["besiktas"],
    transit: [
      { label: "Kabataş", minutes: 10 },
      { label: "Taksim", minutes: 15, note: "best wider central base" },
    ],
    stayAreas: [
      { area: "Beşiktaş", why: "Best local football-and-nightlife base" },
      { area: "Taksim / Cihangir", why: "Best all-round central Istanbul option" },
    ],
    tips: [
      "Probably the easiest of the big Istanbul clubs to turn into a premium city-break football weekend",
      "Very strong option if you want sea views, nightlife and easy stadium access together",
    ],
  },

  "papara-park": {
    stadiumKey: "papara-park",
    name: "Papara Park",
    city: "Trabzon",
    country: TURKEY,
    capacity: 40782,
    opened: 2016,
    airport: "Trabzon Airport (TZX)",
    distanceFromAirportKm: 10,
    teamKeys: ["trabzonspor"],
    transit: [
      { label: "Trabzon city centre", minutes: 20 },
      { label: "Meydan", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Meydan / Centre", why: "Best practical local base" },
      { area: "Seafront", why: "Best scenic option if making a weekend of it" },
    ],
    tips: [
      "A distinctive Black Sea football trip with real local identity",
      "Best if you want a football trip that feels different from the usual big-city breaks",
    ],
  },

  "basaksehir-fatih-terim-stadium": {
    stadiumKey: "basaksehir-fatih-terim-stadium",
    name: "Başakşehir Fatih Terim Stadium",
    city: "Istanbul",
    country: TURKEY,
    capacity: 17156,
    opened: 2014,
    airport: "Istanbul Airport (IST)",
    distanceFromAirportKm: 25,
    teamKeys: ["istanbul-basaksehir"],
    transit: [
      { label: "Başakşehir area", minutes: 15 },
      { label: "Taksim / Şişli", minutes: 35, note: "best wider central stay base" },
    ],
    stayAreas: [
      { area: "Şişli", why: "Best practical central base if doing an Istanbul trip" },
      { area: "Taksim / Beyoğlu", why: "Best nightlife and city-break value" },
    ],
    tips: [
      "This is an Istanbul trip first, club trip second",
      "Central Istanbul remains the right base unless you only care about match logistics",
    ],
  },

  "gursel-aksel-stadium": {
    stadiumKey: "gursel-aksel-stadium",
    name: "Gürsel Aksel Stadium",
    city: "Izmir",
    country: TURKEY,
    capacity: 20035,
    opened: 2020,
    airport: "Izmir Adnan Menderes Airport (ADB)",
    distanceFromAirportKm: 18,
    teamKeys: ["goztepe"],
    transit: [
      { label: "Konak", minutes: 15 },
      { label: "Alsancak", minutes: 20, note: "best wider city-break base" },
    ],
    stayAreas: [
      { area: "Alsancak", why: "Best food, bars and easiest all-round visitor base" },
      { area: "Konak", why: "Best practical central base for short stays" },
    ],
    tips: [
      "Very strong big-city Turkish football trip without Istanbul scale or chaos",
      "One of the better options for combining football with a relaxed coastal-city weekend",
    ],
  },

  "samsun-19-mayis-stadium": {
    stadiumKey: "samsun-19-mayis-stadium",
    name: "Samsun 19 Mayıs Stadium",
    city: "Samsun",
    country: TURKEY,
    capacity: 33919,
    opened: 2017,
    airport: "Samsun Çarşamba Airport (SZF)",
    distanceFromAirportKm: 25,
    teamKeys: ["samsunspor"],
    transit: [
      { label: "Samsun centre", minutes: 20 },
      { label: "Waterfront / central area", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best practical base" },
      { area: "Seafront", why: "Best local atmosphere and easier leisure stay" },
    ],
    tips: [
      "A stronger Black Sea stop than many people expect",
      "Good as a football-focused overnight with a bit of coastal-city value",
    ],
  },

  "caykur-didi-stadium": {
    stadiumKey: "caykur-didi-stadium",
    name: "Çaykur Didi Stadium",
    city: "Rize",
    country: TURKEY,
    capacity: 15532,
    opened: 2009,
    airport: "Trabzon Airport (TZX)",
    distanceFromAirportKm: 75,
    teamKeys: ["rizespor"],
    transit: [
      { label: "Rize centre", minutes: 15 },
      { label: "Trabzon", minutes: 60, note: "best wider regional base" },
    ],
    stayAreas: [
      { area: "Rize Centre", why: "Best local practical option" },
      { area: "Trabzon", why: "Better wider base if combining multiple Black Sea fixtures" },
    ],
    tips: [
      "Very regional football trip with a distinctive Black Sea feel",
      "Best if paired with wider northeast Turkey travel rather than treated as a luxury weekend alone",
    ],
  },

  "yildiz-entegre-kocaeli-stadium": {
    stadiumKey: "yildiz-entegre-kocaeli-stadium",
    name: "Yıldız Entegre Kocaeli Stadium",
    city: "Izmit",
    country: TURKEY,
    capacity: 34157,
    opened: 2018,
    airport: "Sabiha Gökçen Airport (SAW)",
    distanceFromAirportKm: 70,
    teamKeys: ["kocaelispor"],
    transit: [
      { label: "Izmit centre", minutes: 20 },
      { label: "Yahya Kaptan / central business area", minutes: 20, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Izmit Centre", why: "Best practical local stay option" },
      { area: "Yahya Kaptan", why: "Best cleaner modern hotel base" },
    ],
    tips: [
      "A proper football-first trip rather than a mainstream leisure destination",
      "Works best as an overnight or as part of a wider Marmara-region route",
    ],
  },

  "kalyon-stadium": {
    stadiumKey: "kalyon-stadium",
    name: "Kalyon Stadium",
    city: "Gaziantep",
    country: TURKEY,
    capacity: 35000,
    opened: 2017,
    airport: "Gaziantep Airport (GZT)",
    distanceFromAirportKm: 22,
    teamKeys: ["gaziantep"],
    transit: [
      { label: "Gaziantep centre", minutes: 25 },
      { label: "Old city / Bakırcılar area", minutes: 25, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Şahinbey / Centre", why: "Best practical city base" },
      { area: "Old City", why: "Best food and local atmosphere" },
    ],
    tips: [
      "Strong food-led city with more off-pitch value than many expect",
      "Good if you want a football trip with proper regional character",
    ],
  },

  "bahcesehir-okullari-stadium": {
    stadiumKey: "bahcesehir-okullari-stadium",
    name: "Bahçeşehir Okulları Stadium",
    city: "Alanya",
    country: TURKEY,
    capacity: 10000,
    opened: 2011,
    airport: "Gazipaşa-Alanya Airport (GZP)",
    distanceFromAirportKm: 40,
    teamKeys: ["alanyaspor"],
    transit: [
      { label: "Alanya centre", minutes: 15 },
      { label: "Beach / harbour", minutes: 15, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Alanya Centre", why: "Best practical all-round base" },
      { area: "Beachfront", why: "Best sun-and-leisure stay option" },
    ],
    tips: [
      "Very strong football-plus-holiday angle because the destination itself is the sell",
      "Best as a warm-weather weekend rather than just a football stop",
    ],
  },

  "ankara-19-mayis-stadium": {
    stadiumKey: "ankara-19-mayis-stadium",
    name: "Ankara 19 Mayıs Stadium",
    city: "Ankara",
    country: TURKEY,
    capacity: 20250,
    opened: 1936,
    airport: "Ankara Esenboğa Airport (ESB)",
    distanceFromAirportKm: 30,
    teamKeys: ["genclerbirligi"],
    transit: [
      { label: "Ulus", minutes: 10 },
      { label: "Kızılay", minutes: 20, note: "best wider central Ankara base" },
    ],
    stayAreas: [
      { area: "Kızılay", why: "Best practical central Ankara base" },
      { area: "Çankaya", why: "Better restaurants and more polished city stay" },
    ],
    tips: [
      "Classic capital-city football stop rather than a glamour football weekend",
      "Best done as a clean one- or two-night city trip",
    ],
  },

  "konya-buyuksehir-stadium": {
    stadiumKey: "konya-buyuksehir-stadium",
    name: "Konya Büyükşehir Stadium",
    city: "Konya",
    country: TURKEY,
    capacity: 42276,
    opened: 2014,
    airport: "Konya Airport (KYA)",
    distanceFromAirportKm: 18,
    teamKeys: ["konyaspor"],
    transit: [
      { label: "Konya city centre", minutes: 25 },
      { label: "Mevlana area", minutes: 25, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best practical local base" },
      { area: "Mevlana / Alaaddin", why: "Best for sightseeing and restaurants" },
    ],
    tips: [
      "A useful football stop if you want to combine the match with a more cultural Turkish city trip",
      "Better as a one- or two-night stay than a long luxury weekend",
    ],
  },

  "antalya-stadium": {
    stadiumKey: "antalya-stadium",
    name: "Antalya Stadium",
    city: "Antalya",
    country: TURKEY,
    capacity: 32539,
    opened: 2015,
    airport: "Antalya Airport (AYT)",
    distanceFromAirportKm: 16,
    teamKeys: ["antalya"],
    transit: [
      { label: "Antalya centre", minutes: 20 },
      { label: "Kaleiçi", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Kaleiçi", why: "Best atmosphere and old-town stay" },
      { area: "Konyaaltı", why: "Best beach-plus-city option" },
    ],
    tips: [
      "One of the best football-and-sun city-break combinations in the league",
      "Very easy to turn into a leisure-heavy weekend rather than just a match trip",
    ],
  },

  "eyup-stadium": {
    stadiumKey: "eyup-stadium",
    name: "Eyüp Stadium",
    city: "Istanbul",
    country: TURKEY,
    capacity: 2500,
    opened: 1978,
    airport: "Istanbul Airport (IST)",
    distanceFromAirportKm: 35,
    teamKeys: ["eyupspor"],
    transit: [
      { label: "Eyüp", minutes: 10 },
      { label: "Taksim / Beyoğlu", minutes: 20, note: "best wider central stay base" },
    ],
    stayAreas: [
      { area: "Beyoğlu / Taksim", why: "Best nightlife and overall city-break base" },
      { area: "Balat / Fener", why: "Best if you want a more characterful historic-city stay" },
    ],
    tips: [
      "This is another Istanbul trip first, club trip second",
      "Best treated as part of a wider Istanbul weekend rather than a stand-alone stadium-led break",
    ],
  },

  "recep-tayyip-erdogan-stadium": {
    stadiumKey: "recep-tayyip-erdogan-stadium",
    name: "Recep Tayyip Erdoğan Stadium",
    city: "Istanbul",
    country: TURKEY,
    capacity: 14234,
    opened: 2005,
    airport: "Istanbul Airport (IST)",
    distanceFromAirportKm: 38,
    teamKeys: ["kasimpasa"],
    transit: [
      { label: "Taksim", minutes: 15 },
      { label: "Şişhane / Galata", minutes: 15, note: "best wider city-break base" },
    ],
    stayAreas: [
      { area: "Beyoğlu / Taksim", why: "Best nightlife and central value" },
      { area: "Karaköy / Galata", why: "Best bars, views and city-break appeal" },
    ],
    tips: [
      "This is an Istanbul football trip first, local club trip second",
      "Very easy to combine with a wider central Istanbul weekend",
    ],
  },

  "kadir-has-stadium": {
    stadiumKey: "kadir-has-stadium",
    name: "Kadir Has Stadium",
    city: "Kayseri",
    country: TURKEY,
    capacity: 32864,
    opened: 2009,
    airport: "Kayseri Airport (ASR)",
    distanceFromAirportKm: 8,
    teamKeys: ["kayserispor"],
    transit: [
      { label: "Kayseri centre", minutes: 20 },
      { label: "Cumhuriyet Meydanı", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best practical local stay" },
      { area: "Around Cumhuriyet Meydanı", why: "Best food and hotel concentration" },
    ],
    tips: [
      "Works well if paired with wider Cappadocia-style regional travel",
      "More of a strategic football stop than a luxury football weekend",
    ],
  },

  "ataturk-olimpiyat-stadium": {
    stadiumKey: "ataturk-olimpiyat-stadium",
    name: "Atatürk Olympic Stadium",
    city: "Istanbul",
    country: TURKEY,
    capacity: 76092,
    opened: 2002,
    airport: "Istanbul Airport (IST)",
    distanceFromAirportKm: 30,
    teamKeys: ["fatih-karagumruk"],
    transit: [
      { label: "Başakşehir / İkitelli", minutes: 20 },
      { label: "Taksim / Şişli", minutes: 40, note: "best wider central stay base" },
    ],
    stayAreas: [
      { area: "Şişli", why: "Best practical central Istanbul base" },
      { area: "Taksim / Beyoğlu", why: "Best nightlife and general city-break value" },
    ],
    tips: [
      "Massive stadium and not a neighbourhood-intimacy experience",
      "Best handled as part of a wider Istanbul trip, not a stadium-adjacent stay",
    ],
  },
};

export default superLigStadiums;
