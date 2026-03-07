import type { StadiumRecord } from "./types";

const superLigStadiums: Record<string, StadiumRecord> = {
  "ram-park": {
    stadiumKey: "ram-park",
    name: "RAMS Park",
    city: "Istanbul",
    country: "Turkey",
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
    country: "Turkey",
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
    country: "Turkey",
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
    country: "Turkey",
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
    country: "Turkey",
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

  "konya-buyuksehir-stadium": {
    stadiumKey: "konya-buyuksehir-stadium",
    name: "Konya Büyükşehir Stadium",
    city: "Konya",
    country: "Turkey",
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

  "sivas-4-eylul-stadium": {
    stadiumKey: "sivas-4-eylul-stadium",
    name: "Sivas 4 Eylül Stadium",
    city: "Sivas",
    country: "Turkey",
    capacity: 27532,
    opened: 2016,
    airport: "Sivas Airport (VAS)",
    distanceFromAirportKm: 25,
    teamKeys: ["sivasspor"],
    transit: [
      { label: "Sivas centre", minutes: 20 },
      { label: "Main station / central area", minutes: 20, note: "best practical base" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Most practical local option" },
      { area: "Around central square", why: "Best simple overnight base" },
    ],
    tips: [
      "More of a committed football stop than a mainstream city-break destination",
      "Useful for coverage depth, but not one of the glamour trip products",
    ],
  },

  "kadir-has-stadium": {
    stadiumKey: "kadir-has-stadium",
    name: "Kadir Has Stadium",
    city: "Kayseri",
    country: "Turkey",
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

  "kalyon-stadium": {
    stadiumKey: "kalyon-stadium",
    name: "Kalyon Stadium",
    city: "Gaziantep",
    country: "Turkey",
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

  "antalya-stadium": {
    stadiumKey: "antalya-stadium",
    name: "Antalya Stadium",
    city: "Antalya",
    country: "Turkey",
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

  "yeni-adana-stadium": {
    stadiumKey: "yeni-adana-stadium",
    name: "Yeni Adana Stadium",
    city: "Adana",
    country: "Turkey",
    capacity: 33543,
    opened: 2021,
    airport: "Adana Şakirpaşa Airport (ADA)",
    distanceFromAirportKm: 8,
    teamKeys: ["adana-demirspor"],
    transit: [
      { label: "Adana centre", minutes: 20 },
      { label: "Seyhan", minutes: 20, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Seyhan / Centre", why: "Best local practical option" },
      { area: "Riverfront area", why: "Best if you want the tidier central stay" },
    ],
    tips: [
      "Strong atmosphere potential and a more characterful football stop than some might expect",
      "Better as a shorter football-focused break than a polished luxury weekend",
    ],
  },

  "hatay-stadium": {
    stadiumKey: "hatay-stadium",
    name: "Hatay Stadium",
    city: "Antakya",
    country: "Turkey",
    capacity: 25500,
    opened: 2018,
    airport: "Hatay Airport (HTY)",
    distanceFromAirportKm: 25,
    teamKeys: ["hatayspor"],
    transit: [
      { label: "Antakya centre", minutes: 20 },
      { label: "Main central area", minutes: 20, note: "best practical local base" },
    ],
    stayAreas: [
      { area: "Antakya Centre", why: "Most practical local option" },
      { area: "Near main roads", why: "Best for simple overnight logistics" },
    ],
    tips: [
      "More of a functional football trip than a mainstream city-break product",
      "Useful for coverage depth, but not one of the headline weekend destinations",
    ],
  },

  "bahcesehir-okullari-stadium": {
    stadiumKey: "bahcesehir-okullari-stadium",
    name: "Bahçeşehir Okulları Stadium",
    city: "Alanya",
    country: "Turkey",
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

  "samsun-19-mayis-stadium": {
    stadiumKey: "samsun-19-mayis-stadium",
    name: "Samsun 19 Mayıs Stadium",
    city: "Samsun",
    country: "Turkey",
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
    country: "Turkey",
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

  "eryaman-stadium": {
    stadiumKey: "eryaman-stadium",
    name: "Eryaman Stadium",
    city: "Ankara",
    country: "Turkey",
    capacity: 22000,
    opened: 2019,
    airport: "Ankara Esenboğa Airport (ESB)",
    distanceFromAirportKm: 45,
    teamKeys: ["ankaragucu"],
    transit: [
      { label: "Eryaman", minutes: 15 },
      { label: "Kızılay", minutes: 30, note: "best wider central Ankara base" },
    ],
    stayAreas: [
      { area: "Kızılay", why: "Best practical central Ankara base" },
      { area: "Çankaya", why: "Better restaurants and more polished city stay" },
    ],
    tips: [
      "A solid capital-city football stop, even if not as naturally compelling as Istanbul",
      "Best as a tidy one- or two-night city trip rather than a glamour football break",
    ],
  },

  "recep-tayyip-erdogan-stadium": {
    stadiumKey: "recep-tayyip-erdogan-stadium",
    name: "Recep Tayyip Erdoğan Stadium",
    city: "Istanbul",
    country: "Turkey",
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

  "pendik-stadium": {
    stadiumKey: "pendik-stadium",
    name: "Pendik Stadium",
    city: "Istanbul",
    country: "Turkey",
    capacity: 2500,
    opened: 1991,
    airport: "Sabiha Gökçen Airport (SAW)",
    distanceFromAirportKm: 12,
    teamKeys: ["pendikspor"],
    transit: [
      { label: "Pendik", minutes: 15 },
      { label: "Kadıköy", minutes: 35, note: "best wider Asian-side base" },
    ],
    stayAreas: [
      { area: "Kadıköy", why: "Best overall base if doing an Istanbul trip on the Asian side" },
      { area: "Pendik", why: "Most practical local option if staying very close" },
    ],
    tips: [
      "Small-ground trip with airport convenience rather than major club glamour",
      "Usually better folded into a wider Istanbul itinerary",
    ],
  },
};

export default superLigStadiums;
