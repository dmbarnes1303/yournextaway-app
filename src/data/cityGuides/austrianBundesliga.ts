import type { CityGuide } from "./types";

export const austrianBundesligaCityGuides: Record<string, CityGuide> = {

  vienna: {
    cityId: "vienna",
    name: "Vienna",
    country: "Austria",

    overview:
      "Vienna is one of the strongest football city-break combinations in Central Europe. The city itself carries huge cultural weight, but the football layer adds real character through historic clubs, strong supporter culture and two distinct stadium experiences. A Rapid or Austria Vienna match fits naturally into a classic Vienna weekend of grand architecture, cafés and late evening bars.",

    topThings: [
      { title: "St. Stephen’s Cathedral", tip: "Vienna’s central landmark and the natural starting point for most visits." },
      { title: "Schönbrunn Palace", tip: "Austria’s most famous palace and a major historical highlight." },
      { title: "Belvedere Palace", tip: "Combines major art collections with beautiful palace gardens." },
      { title: "Naschmarkt food district", tip: "Excellent casual food market with international options." },
      { title: "Vienna coffee houses", tip: "Traditional café culture is a huge part of the city's identity." },
      { title: "Prater Park and Giant Ferris Wheel", tip: "Classic Vienna attraction with great city views." },
      { title: "Museum Quarter", tip: "One of Europe’s largest cultural complexes." },
      { title: "Danube Canal bars", tip: "Good nightlife area particularly in warmer months." },
      { title: "Rapid Vienna matchday", tip: "Often the most atmospheric football experience in Austria." },
      { title: "Austria Vienna matchday", tip: "More traditional stadium experience but still strong atmosphere." },
    ],

    tips: [
      "Innere Stadt is the best base for first-time visitors.",
      "Vienna’s metro system makes stadium travel simple.",
      "Rapid Vienna matches generally deliver stronger atmospheres.",
      "Combine football with classic sightseeing rather than building the trip only around the match.",
      "Vienna is one of the easiest cities in Europe for a relaxed football weekend.",
    ],

    food: [
      "Traditional Viennese schnitzel",
      "Classic coffee houses and pastries",
      "Naschmarkt street food stalls",
      "Austrian beer halls",
      "Local bakeries and casual taverns",
    ],

    transport:
      "Vienna has one of the most efficient public transport systems in Europe. The U-Bahn, trams and buses connect nearly every district and make stadium access simple.",

    accommodation:
      "Innere Stadt offers the classic Vienna experience. Neubau and Mariahilf provide livelier nightlife and restaurant scenes. Staying near Hauptbahnhof works well for visitors combining football with wider rail travel.",
  },

  salzburg: {
    cityId: "salzburg",
    name: "Salzburg",
    country: "Austria",

    overview:
      "Salzburg is one of Europe’s most visually beautiful small cities. The old town sits beneath dramatic Alpine scenery and feels almost designed for weekend visits. Red Bull Salzburg dominate Austrian football, and while the stadium is modern and slightly outside the centre, it combines easily with a classic Salzburg sightseeing trip.",

    topThings: [
      { title: "Salzburg Old Town", tip: "UNESCO listed historic centre with baroque architecture." },
      { title: "Hohensalzburg Fortress", tip: "Major hilltop fortress with excellent views." },
      { title: "Mozart Birthplace", tip: "One of the city's most famous historic sites." },
      { title: "Mirabell Gardens", tip: "Beautiful palace gardens perfect for a relaxed walk." },
      { title: "Salzburg Cathedral", tip: "Important religious and architectural landmark." },
      { title: "Getreidegasse street", tip: "Iconic shopping street in the historic centre." },
      { title: "Salzburg river walk", tip: "Simple scenic walk through the city." },
      { title: "Red Bull Salzburg matchday", tip: "Modern stadium experience with strong domestic dominance." },
      { title: "Salzburg Christmas markets", tip: "One of Europe’s best seasonal markets." },
      { title: "Day trip to the Alps", tip: "Mountains are easily accessible from the city." },
    ],

    tips: [
      "Stay in the old town for the best visitor experience.",
      "Red Bull Arena sits outside the centre but is easy to reach by bus.",
      "Salzburg works perfectly as a two-night football city break.",
      "Expect tourist crowds during peak summer and Christmas periods.",
      "The scenery is one of the city’s biggest strengths.",
    ],

    food: [
      "Traditional Austrian dumplings",
      "Local beer halls",
      "Cafés and bakeries",
      "Salzburger Nockerl dessert",
      "Classic Alpine cuisine",
    ],

    transport:
      "Salzburg is compact and very walkable. Buses connect the stadium area and airport with the old town.",

    accommodation:
      "Altstadt is the best location for atmosphere and sightseeing. Hotels near Salzburg Hbf are better for onward travel connections.",
  },

  graz: {
    cityId: "graz",
    name: "Graz",
    country: "Austria",

    overview:
      "Graz is one of Austria’s most underrated football destinations. The city combines a lively student atmosphere with a beautiful old town and two major clubs sharing the Merkur Arena. Sturm Graz currently represent the strongest football product, but the city itself is what makes this a very appealing football weekend.",

    topThings: [
      { title: "Graz Old Town", tip: "UNESCO-listed historic centre with colourful buildings." },
      { title: "Schlossberg hill", tip: "Great views over the city." },
      { title: "Clock Tower landmark", tip: "Iconic symbol of Graz." },
      { title: "Mur river walk", tip: "Nice scenic route through the city." },
      { title: "Kunsthaus Graz museum", tip: "Striking modern architecture." },
      { title: "Graz market squares", tip: "Great casual food options." },
      { title: "Sturm Graz matchday", tip: "One of the best football atmospheres in Austria." },
      { title: "Grazer AK matchday", tip: "Smaller but historic club experience." },
      { title: "University district bars", tip: "Strong nightlife due to large student population." },
      { title: "Styrian wine bars", tip: "Local wines are a regional speciality." },
    ],

    tips: [
      "Sturm Graz matches usually deliver the best atmosphere.",
      "Stay in the old town rather than near the stadium.",
      "Graz is compact and very walkable.",
      "Excellent destination for a relaxed football weekend.",
      "Often overlooked compared with Vienna or Salzburg.",
    ],

    food: [
      "Styrian pumpkin seed dishes",
      "Local wine taverns",
      "Traditional Austrian restaurants",
      "Street markets and cafés",
      "Student-area casual dining",
    ],

    transport:
      "Trams and buses provide easy movement across the city. The stadium sits south of the centre but is easy to reach.",

    accommodation:
      "Old Town is the best visitor base. Jakominiplatz is also a strong transport hub with good hotel options.",
  },

  linz: {
    cityId: "linz",
    name: "Linz",
    country: "Austria",

    overview:
      "Linz offers a modern football experience with two clubs, LASK and Blau-Weiß Linz. The city sits on the Danube and combines contemporary culture with an improving football scene. LASK’s new stadium has helped elevate the football experience considerably.",

    topThings: [
      { title: "Ars Electronica Center", tip: "One of Europe’s best science museums." },
      { title: "Danube riverside walk", tip: "Scenic central walking area." },
      { title: "Linz main square", tip: "Large historic square in the city centre." },
      { title: "Lentos Art Museum", tip: "Modern art museum on the river." },
      { title: "Pöstlingberg hill", tip: "Great viewpoint over the city." },
      { title: "LASK matchday", tip: "Modern stadium and strong football experience." },
      { title: "Blau-Weiß Linz matchday", tip: "Smaller but authentic local club atmosphere." },
      { title: "Danube cycling paths", tip: "Excellent routes along the river." },
      { title: "Local beer halls", tip: "Traditional Austrian beer culture." },
      { title: "Central cafés", tip: "Relaxed atmosphere typical of Austrian cities." },
    ],

    tips: [
      "LASK matches are usually the biggest football event in the city.",
      "Stay centrally rather than near either stadium.",
      "Linz is compact and easy to explore.",
      "Often overlooked by international visitors.",
      "Good stop when travelling between Vienna and Salzburg.",
    ],

    food: [
      "Traditional Austrian dishes",
      "Local beer halls",
      "Danube riverfront restaurants",
      "Cafés and bakeries",
      "Casual street food stalls",
    ],

    transport:
      "Linz has an efficient tram network and good rail connections. Both stadiums are easily reachable from the city centre.",

    accommodation:
      "City centre hotels are the best choice for visitors. Staying near the train station can be useful for short football trips.",
  },

  innsbruck: {
    cityId: "innsbruck",
    name: "Innsbruck",
    country: "Austria",

    overview:
      "Innsbruck is one of the most scenic football destinations in Europe. Surrounded by Alpine mountains, the city offers a unique combination of sport, nature and culture. WSG Tirol matches at Tivoli Stadion Tirol provide a distinctive football stop within a spectacular setting.",

    topThings: [
      { title: "Golden Roof landmark", tip: "Historic symbol of Innsbruck." },
      { title: "Nordkette cable car", tip: "Spectacular mountain views above the city." },
      { title: "Innsbruck Old Town", tip: "Colourful medieval buildings and narrow streets." },
      { title: "Bergisel ski jump", tip: "One of the city’s most famous modern landmarks." },
      { title: "River Inn walk", tip: "Scenic walking route through the centre." },
      { title: "WSG Tirol matchday", tip: "Unique football experience surrounded by mountains." },
      { title: "Alpine hiking routes", tip: "Easily accessible from the city." },
      { title: "Winter sports venues", tip: "Legacy of the Olympic Games." },
      { title: "Tyrolean cuisine restaurants", tip: "Hearty mountain food." },
      { title: "Local beer halls", tip: "Relaxed evening atmosphere." },
    ],

    tips: [
      "One of the most scenic football cities in Europe.",
      "Best as a two-night football and mountain weekend.",
      "Stay in the old town for the best atmosphere.",
      "Transport to the stadium is straightforward from the centre.",
      "Weather can change quickly due to the Alpine setting.",
    ],

    food: [
      "Tyrolean dumplings",
      "Alpine comfort food",
      "Mountain hut restaurants",
      "Local Austrian beers",
      "Traditional bakeries",
    ],

    transport:
      "Innsbruck has efficient trams and buses. The stadium is easy to reach from the city centre.",

    accommodation:
      "Old Town offers the best visitor experience. Hotels near the main station are useful for rail connections.",
  },

};

export default austrianBundesligaCityGuides;
