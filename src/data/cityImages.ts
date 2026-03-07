// src/data/cityImages.ts

export type CityImageRecord = {
  cityKey: string;
  city: string;
  country?: string;
  imageUrl: string;
  aliases?: string[];
};

function stripDiacritics(input: string): string {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

export function normalizeCityKey(input: string): string {
  return stripDiacritics(String(input ?? ""))
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const CITY_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=80";

const cityImages: Record<string, CityImageRecord> = {
  // England
  "birmingham": { cityKey: "birmingham", city: "Birmingham", country: "England", imageUrl: "https://images.unsplash.com/photo-1593766827228-8737b4534aa6?auto=format&fit=crop&w=1400&q=80" },
  "bournemouth": { cityKey: "bournemouth", city: "Bournemouth", country: "England", imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80" },
  "brighton": { cityKey: "brighton", city: "Brighton", country: "England", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "burnley": { cityKey: "burnley", city: "Burnley", country: "England", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "leeds": { cityKey: "leeds", city: "Leeds", country: "England", imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1400&q=80" },
  "liverpool": { cityKey: "liverpool", city: "Liverpool", country: "England", imageUrl: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60d?auto=format&fit=crop&w=1400&q=80" },
  "london": { cityKey: "london", city: "London", country: "England", imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=80" },
  "manchester": { cityKey: "manchester", city: "Manchester", country: "England", imageUrl: "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?auto=format&fit=crop&w=1400&q=80" },
  "newcastle-upon-tyne": { cityKey: "newcastle-upon-tyne", city: "Newcastle upon Tyne", country: "England", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80", aliases: ["newcastle"] },
  "nottingham": { cityKey: "nottingham", city: "Nottingham", country: "England", imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80" },
  "sunderland": { cityKey: "sunderland", city: "Sunderland", country: "England", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" },
  "wolverhampton": { cityKey: "wolverhampton", city: "Wolverhampton", country: "England", imageUrl: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1400&q=80" },

  // Spain
  "barcelona": { cityKey: "barcelona", city: "Barcelona", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1400&q=80" },
  "bilbao": { cityKey: "bilbao", city: "Bilbao", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?auto=format&fit=crop&w=1400&q=80" },
  "elche": { cityKey: "elche", city: "Elche", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "getafe": { cityKey: "getafe", city: "Getafe", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1400&q=80" },
  "girona": { cityKey: "girona", city: "Girona", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=1400&q=80" },
  "madrid": { cityKey: "madrid", city: "Madrid", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1400&q=80" },
  "oviedo": { cityKey: "oviedo", city: "Oviedo", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "palma": { cityKey: "palma", city: "Palma", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "pamplona": { cityKey: "pamplona", city: "Pamplona", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=80" },
  "san-sebastian": { cityKey: "san-sebastian", city: "San Sebastián", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80", aliases: ["san-sebastian-donostia"] },
  "seville": { cityKey: "seville", city: "Seville", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1400&q=80" },
  "valencia": { cityKey: "valencia", city: "Valencia", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=80" },
  "vigo": { cityKey: "vigo", city: "Vigo", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "villarreal": { cityKey: "villarreal", city: "Villarreal", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80" },
  "vitoria-gasteiz": { cityKey: "vitoria-gasteiz", city: "Vitoria-Gasteiz", country: "Spain", imageUrl: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1400&q=80", aliases: ["vitoria"] },

  // Italy
  "bergamo": { cityKey: "bergamo", city: "Bergamo", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },
  "bologna": { cityKey: "bologna", city: "Bologna", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "cagliari": { cityKey: "cagliari", city: "Cagliari", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "como": { cityKey: "como", city: "Como", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" },
  "cremona": { cityKey: "cremona", city: "Cremona", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80" },
  "florence": { cityKey: "florence", city: "Florence", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1543429776-2782fcf1d548?auto=format&fit=crop&w=1400&q=80" },
  "genoa": { cityKey: "genoa", city: "Genoa", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },
  "lecce": { cityKey: "lecce", city: "Lecce", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80" },
  "milan": { cityKey: "milan", city: "Milan", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },
  "naples": { cityKey: "naples", city: "Naples", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=1400&q=80" },
  "parma": { cityKey: "parma", city: "Parma", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80" },
  "pisa": { cityKey: "pisa", city: "Pisa", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "reggio-emilia": { cityKey: "reggio-emilia", city: "Reggio Emilia", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80" },
  "rome": { cityKey: "rome", city: "Rome", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1400&q=80" },
  "turin": { cityKey: "turin", city: "Turin", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=80" },
  "udine": { cityKey: "udine", city: "Udine", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80" },
  "verona": { cityKey: "verona", city: "Verona", country: "Italy", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },

  // Germany
  "augsburg": { cityKey: "augsburg", city: "Augsburg", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80" },
  "berlin": { cityKey: "berlin", city: "Berlin", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1400&q=80" },
  "bremen": { cityKey: "bremen", city: "Bremen", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },
  "cologne": { cityKey: "cologne", city: "Cologne", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80", aliases: ["koln"] },
  "dortmund": { cityKey: "dortmund", city: "Dortmund", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "frankfurt": { cityKey: "frankfurt", city: "Frankfurt", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80" },
  "freiburg": { cityKey: "freiburg", city: "Freiburg", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1400&q=80" },
  "hamburg": { cityKey: "hamburg", city: "Hamburg", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" },
  "heidenheim": { cityKey: "heidenheim", city: "Heidenheim", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "leipzig": { cityKey: "leipzig", city: "Leipzig", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1400&q=80" },
  "leverkusen": { cityKey: "leverkusen", city: "Leverkusen", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "mainz": { cityKey: "mainz", city: "Mainz", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80" },
  "monchengladbach": { cityKey: "monchengladbach", city: "Mönchengladbach", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80", aliases: ["m-gladbach", "gladbach"] },
  "munich": { cityKey: "munich", city: "Munich", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1400&q=80", aliases: ["munchen"] },
  "sinsheim": { cityKey: "sinsheim", city: "Sinsheim", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "stuttgart": { cityKey: "stuttgart", city: "Stuttgart", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80" },
  "wolfsburg": { cityKey: "wolfsburg", city: "Wolfsburg", country: "Germany", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },

  // France
  "angers": { cityKey: "angers", city: "Angers", country: "France", imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80" },
  "auxerre": { cityKey: "auxerre", city: "Auxerre", country: "France", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "brest": { cityKey: "brest", city: "Brest", country: "France", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },
  "le-havre": { cityKey: "le-havre", city: "Le Havre", country: "France", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },
  "lens": { cityKey: "lens", city: "Lens", country: "France", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "lille": { cityKey: "lille", city: "Lille", country: "France", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },
  "lorient": { cityKey: "lorient", city: "Lorient", country: "France", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },
  "lyon": { cityKey: "lyon", city: "Lyon", country: "France", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "marseille": { cityKey: "marseille", city: "Marseille", country: "France", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },
  "metz": { cityKey: "metz", city: "Metz", country: "France", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "monaco": { cityKey: "monaco", city: "Monaco", country: "Monaco", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "nantes": { cityKey: "nantes", city: "Nantes", country: "France", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },
  "nice": { cityKey: "nice", city: "Nice", country: "France", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "paris": { cityKey: "paris", city: "Paris", country: "France", imageUrl: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?auto=format&fit=crop&w=1400&q=80" },
  "rennes": { cityKey: "rennes", city: "Rennes", country: "France", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },
  "strasbourg": { cityKey: "strasbourg", city: "Strasbourg", country: "France", imageUrl: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=80" },
  "toulouse": { cityKey: "toulouse", city: "Toulouse", country: "France", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },

  // Portugal
  "amadora": { cityKey: "amadora", city: "Amadora", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80" },
  "arouca": { cityKey: "arouca", city: "Arouca", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "barcelos": { cityKey: "barcelos", city: "Barcelos", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80" },
  "braga": { cityKey: "braga", city: "Braga", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80" },
  "estoril": { cityKey: "estoril", city: "Estoril", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "faro": { cityKey: "faro", city: "Faro", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "funchal": { cityKey: "funchal", city: "Funchal", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" },
  "guimaraes": { cityKey: "guimaraes", city: "Guimarães", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80" },
  "lisbon": { cityKey: "lisbon", city: "Lisbon", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80" },
  "moreira-de-conegos": { cityKey: "moreira-de-conegos", city: "Moreira de Cónegos", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "ponta-delgada": { cityKey: "ponta-delgada", city: "Ponta Delgada", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "porto": { cityKey: "porto", city: "Porto", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1400&q=80" },
  "vila-das-aves": { cityKey: "vila-das-aves", city: "Vila das Aves", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "vila-do-conde": { cityKey: "vila-do-conde", city: "Vila do Conde", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },
  "vila-nova-de-famalicao": { cityKey: "vila-nova-de-famalicao", city: "Vila Nova de Famalicão", country: "Portugal", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },

  // Netherlands
  "almelo": { cityKey: "almelo", city: "Almelo", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "alkmaar": { cityKey: "alkmaar", city: "Alkmaar", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "almere": { cityKey: "almere", city: "Almere", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "amsterdam": { cityKey: "amsterdam", city: "Amsterdam", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1400&q=80" },
  "arnhem": { cityKey: "arnhem", city: "Arnhem", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "deventer": { cityKey: "deventer", city: "Deventer", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "eindhoven": { cityKey: "eindhoven", city: "Eindhoven", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "enschede": { cityKey: "enschede", city: "Enschede", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "groningen": { cityKey: "groningen", city: "Groningen", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "heerenveen": { cityKey: "heerenveen", city: "Heerenveen", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "nijmegen": { cityKey: "nijmegen", city: "Nijmegen", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "rotterdam": { cityKey: "rotterdam", city: "Rotterdam", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "sittard": { cityKey: "sittard", city: "Sittard", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "utrecht": { cityKey: "utrecht", city: "Utrecht", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "volendam": { cityKey: "volendam", city: "Volendam", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "waalwijk": { cityKey: "waalwijk", city: "Waalwijk", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },
  "zwolle": { cityKey: "zwolle", city: "Zwolle", country: "Netherlands", imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1400&q=80" },

  // Scotland
  "aberdeen": { cityKey: "aberdeen", city: "Aberdeen", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },
  "dingwall": { cityKey: "dingwall", city: "Dingwall", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" },
  "dundee": { cityKey: "dundee", city: "Dundee", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },
  "edinburgh": { cityKey: "edinburgh", city: "Edinburgh", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?auto=format&fit=crop&w=1400&q=80" },
  "glasgow": { cityKey: "glasgow", city: "Glasgow", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80" },
  "kilmarnock": { cityKey: "kilmarnock", city: "Kilmarnock", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "motherwell": { cityKey: "motherwell", city: "Motherwell", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "paisley": { cityKey: "paisley", city: "Paisley", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" },
  "perth": { cityKey: "perth", city: "Perth", country: "Scotland", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" },

  // Austria
  "altach": { cityKey: "altach", city: "Altach", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "graz": { cityKey: "graz", city: "Graz", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1400&q=80" },
  "hartberg": { cityKey: "hartberg", city: "Hartberg", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "innsbruck": { cityKey: "innsbruck", city: "Innsbruck", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" },
  "klagenfurt": { cityKey: "klagenfurt", city: "Klagenfurt", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "linz": { cityKey: "linz", city: "Linz", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1400&q=80" },
  "salzburg": { cityKey: "salzburg", city: "Salzburg", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1400&q=80" },
  "vienna": { cityKey: "vienna", city: "Vienna", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1400&q=80" },
  "wolfsberg": { cityKey: "wolfsberg", city: "Wolfsberg", country: "Austria", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },

  // Switzerland
  "basel": { cityKey: "basel", city: "Basel", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "bern": { cityKey: "bern", city: "Bern", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "geneva": { cityKey: "geneva", city: "Geneva", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "lausanne": { cityKey: "lausanne", city: "Lausanne", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "lugano": { cityKey: "lugano", city: "Lugano", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "lucerne": { cityKey: "lucerne", city: "Lucerne", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "sion": { cityKey: "sion", city: "Sion", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "st-gallen": { cityKey: "st-gallen", city: "St. Gallen", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80", aliases: ["saint-gallen"] },
  "thun": { cityKey: "thun", city: "Thun", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "winterthur": { cityKey: "winterthur", city: "Winterthur", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "zurich": { cityKey: "zurich", city: "Zurich", country: "Switzerland", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },

  // Denmark
  "aarhus": { cityKey: "aarhus", city: "Aarhus", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "brondby": { cityKey: "brondby", city: "Brøndby", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "copenhagen": { cityKey: "copenhagen", city: "Copenhagen", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "farum": { cityKey: "farum", city: "Farum", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "haderslev": { cityKey: "haderslev", city: "Haderslev", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "herning": { cityKey: "herning", city: "Herning", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "lyngby": { cityKey: "lyngby", city: "Lyngby", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "odense": { cityKey: "odense", city: "Odense", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "randers": { cityKey: "randers", city: "Randers", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "silkeborg": { cityKey: "silkeborg", city: "Silkeborg", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "vejle": { cityKey: "vejle", city: "Vejle", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "viborg": { cityKey: "viborg", city: "Viborg", country: "Denmark", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },

  // Belgium
  "antwerp": { cityKey: "antwerp", city: "Antwerp", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "bruges": { cityKey: "bruges", city: "Bruges", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "brussels": { cityKey: "brussels", city: "Brussels", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "charleroi": { cityKey: "charleroi", city: "Charleroi", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "denderleeuw": { cityKey: "denderleeuw", city: "Denderleeuw", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "genk": { cityKey: "genk", city: "Genk", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "ghent": { cityKey: "ghent", city: "Ghent", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "kortrijk": { cityKey: "kortrijk", city: "Kortrijk", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "leuven": { cityKey: "leuven", city: "Leuven", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "liege": { cityKey: "liege", city: "Liège", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "mechelen": { cityKey: "mechelen", city: "Mechelen", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "sint-truiden": { cityKey: "sint-truiden", city: "Sint-Truiden", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "waregem": { cityKey: "waregem", city: "Waregem", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },
  "westerlo": { cityKey: "westerlo", city: "Westerlo", country: "Belgium", imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80" },

  // Turkey
  "adana": { cityKey: "adana", city: "Adana", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "alanya": { cityKey: "alanya", city: "Alanya", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "ankara": { cityKey: "ankara", city: "Ankara", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "antalya": { cityKey: "antalya", city: "Antalya", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "gaziantep": { cityKey: "gaziantep", city: "Gaziantep", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "istanbul": { cityKey: "istanbul", city: "Istanbul", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1400&q=80" },
  "kayseri": { cityKey: "kayseri", city: "Kayseri", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "konya": { cityKey: "konya", city: "Konya", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "rize": { cityKey: "rize", city: "Rize", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80" },
  "samsun": { cityKey: "samsun", city: "Samsun", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },
  "sivas": { cityKey: "sivas", city: "Sivas", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80" },
  "trabzon": { cityKey: "trabzon", city: "Trabzon", country: "Turkey", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },

  // Greece
  "athens": { cityKey: "athens", city: "Athens", country: "Greece", imageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1400&q=80" },
  "heraklion": { cityKey: "heraklion", city: "Heraklion", country: "Greece", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80" },
  "lamia": { cityKey: "lamia", city: "Lamia", country: "Greece", imageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1400&q=80" },
  "piraeus": { cityKey: "piraeus", city: "Piraeus", country: "Greece", imageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1400&q=80" },
  "thessaloniki": { cityKey: "thessaloniki", city: "Thessaloniki", country: "Greece", imageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1400&q=80" },
  "tripoli": { cityKey: "tripoli", city: "Tripoli", country: "Greece", imageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1400&q=80" },
  "volos": { cityKey: "volos", city: "Volos", country: "Greece", imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80" },

  // Czech Republic
  "hradec-kralove": { cityKey: "hradec-kralove", city: "Hradec Králové", country: "Czech Republic", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "liberec": { cityKey: "liberec", city: "Liberec", country: "Czech Republic", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "mlada-boleslav": { cityKey: "mlada-boleslav", city: "Mladá Boleslav", country: "Czech Republic", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "olomouc": { cityKey: "olomouc", city: "Olomouc", country: "Czech Republic", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "ostrava": { cityKey: "ostrava", city: "Ostrava", country: "Czech Republic", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "plzen": { cityKey: "plzen", city: "Plzeň", country: "Czech Republic", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "prague": { cityKey: "prague", city: "Prague", country: "Czech Republic", imageUrl: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1400&q=80" },
  "teplice": { cityKey: "teplice", city: "Teplice", country: "Czech Republic", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },

  // Poland
  "bialystok": { cityKey: "bialystok", city: "Białystok", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "czestochowa": { cityKey: "czestochowa", city: "Częstochowa", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "gdansk": { cityKey: "gdansk", city: "Gdańsk", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "gliwice": { cityKey: "gliwice", city: "Gliwice", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "krakow": { cityKey: "krakow", city: "Kraków", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "lodz": { cityKey: "lodz", city: "Łódź", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "poznan": { cityKey: "poznan", city: "Poznań", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "szczecin": { cityKey: "szczecin", city: "Szczecin", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "warsaw": { cityKey: "warsaw", city: "Warsaw", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
  "zabrze": { cityKey: "zabrze", city: "Zabrze", country: "Poland", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80" },
};

const aliasMap: Record<string, string> = {};

Object.values(cityImages).forEach((entry) => {
  aliasMap[normalizeCityKey(entry.cityKey)] = entry.cityKey;
  aliasMap[normalizeCityKey(entry.city)] = entry.cityKey;
  (entry.aliases ?? []).forEach((alias) => {
    aliasMap[normalizeCityKey(alias)] = entry.cityKey;
  });
});

export function getCityImageRecord(cityInput?: string | null): CityImageRecord | null {
  const key = normalizeCityKey(String(cityInput ?? ""));
  if (!key) return null;

  const canonical = aliasMap[key] ?? key;
  return cityImages[canonical] ?? null;
}

export function getCityImageUrl(cityInput?: string | null, fallback: string = CITY_IMAGE_FALLBACK): string {
  return getCityImageRecord(cityInput)?.imageUrl ?? fallback;
}

export function hasCityImage(cityInput?: string | null): boolean {
  return !!getCityImageRecord(cityInput);
}

export function getAllCityImages(): CityImageRecord[] {
  return Object.values(cityImages);
}

export default cityImages;
