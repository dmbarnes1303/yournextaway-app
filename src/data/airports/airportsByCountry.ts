// src/data/airports/airportsByCountry.ts

export type AirportOption = { label: string; value: string };

// Curated “major airports” list by country.
// This is intentionally a data module so you can expand it without touching UI.
// Later: swap this out for a fuller dataset (or API) and keep the same interface.
export const AIRPORTS_BY_COUNTRY: Record<string, AirportOption[]> = {
  GB: [
    { label: "London Heathrow (LHR)", value: "London Heathrow (LHR)" },
    { label: "London Gatwick (LGW)", value: "London Gatwick (LGW)" },
    { label: "London Stansted (STN)", value: "London Stansted (STN)" },
    { label: "London Luton (LTN)", value: "London Luton (LTN)" },
    { label: "London City (LCY)", value: "London City (LCY)" },
    { label: "Manchester (MAN)", value: "Manchester (MAN)" },
    { label: "Birmingham (BHX)", value: "Birmingham (BHX)" },
    { label: "Edinburgh (EDI)", value: "Edinburgh (EDI)" },
    { label: "Glasgow (GLA)", value: "Glasgow (GLA)" },
    { label: "Bristol (BRS)", value: "Bristol (BRS)" },
    { label: "Newcastle (NCL)", value: "Newcastle (NCL)" },
    { label: "Liverpool (LPL)", value: "Liverpool (LPL)" },
    { label: "Leeds Bradford (LBA)", value: "Leeds Bradford (LBA)" },
    { label: "Belfast Intl (BFS)", value: "Belfast Intl (BFS)" },
    { label: "Belfast City (BHD)", value: "Belfast City (BHD)" },
    { label: "East Midlands (EMA)", value: "East Midlands (EMA)" },
    { label: "Cardiff (CWL)", value: "Cardiff (CWL)" },
    { label: "Aberdeen (ABZ)", value: "Aberdeen (ABZ)" },
  ],

  ES: [
    { label: "Madrid (MAD)", value: "Madrid (MAD)" },
    { label: "Barcelona (BCN)", value: "Barcelona (BCN)" },
    { label: "Málaga (AGP)", value: "Málaga (AGP)" },
    { label: "Alicante (ALC)", value: "Alicante (ALC)" },
    { label: "Valencia (VLC)", value: "Valencia (VLC)" },
    { label: "Seville (SVQ)", value: "Seville (SVQ)" },
    { label: "Palma de Mallorca (PMI)", value: "Palma de Mallorca (PMI)" },
    { label: "Bilbao (BIO)", value: "Bilbao (BIO)" },
    { label: "Tenerife South (TFS)", value: "Tenerife South (TFS)" },
    { label: "Gran Canaria (LPA)", value: "Gran Canaria (LPA)" },
  ],

  IT: [
    { label: "Rome Fiumicino (FCO)", value: "Rome Fiumicino (FCO)" },
    { label: "Milan Malpensa (MXP)", value: "Milan Malpensa (MXP)" },
    { label: "Milan Linate (LIN)", value: "Milan Linate (LIN)" },
    { label: "Bergamo (BGY)", value: "Bergamo (BGY)" },
    { label: "Venice (VCE)", value: "Venice (VCE)" },
    { label: "Naples (NAP)", value: "Naples (NAP)" },
    { label: "Bologna (BLQ)", value: "Bologna (BLQ)" },
    { label: "Turin (TRN)", value: "Turin (TRN)" },
    { label: "Florence (FLR)", value: "Florence (FLR)" },
    { label: "Pisa (PSA)", value: "Pisa (PSA)" },
  ],

  DE: [
    { label: "Frankfurt (FRA)", value: "Frankfurt (FRA)" },
    { label: "Munich (MUC)", value: "Munich (MUC)" },
    { label: "Berlin (BER)", value: "Berlin (BER)" },
    { label: "Düsseldorf (DUS)", value: "Düsseldorf (DUS)" },
    { label: "Hamburg (HAM)", value: "Hamburg (HAM)" },
    { label: "Cologne Bonn (CGN)", value: "Cologne Bonn (CGN)" },
    { label: "Stuttgart (STR)", value: "Stuttgart (STR)" },
    { label: "Nuremberg (NUE)", value: "Nuremberg (NUE)" },
  ],

  FR: [
    { label: "Paris Charles de Gaulle (CDG)", value: "Paris Charles de Gaulle (CDG)" },
    { label: "Paris Orly (ORY)", value: "Paris Orly (ORY)" },
    { label: "Nice (NCE)", value: "Nice (NCE)" },
    { label: "Lyon (LYS)", value: "Lyon (LYS)" },
    { label: "Marseille (MRS)", value: "Marseille (MRS)" },
    { label: "Toulouse (TLS)", value: "Toulouse (TLS)" },
    { label: "Bordeaux (BOD)", value: "Bordeaux (BOD)" },
    { label: "Nantes (NTE)", value: "Nantes (NTE)" },
  ],
};

export function getAirportOptionsForCountry(countryCode: string, fallbackCountryCode = "GB"): AirportOption[] {
  const cc = (countryCode || "").toUpperCase();
  return AIRPORTS_BY_COUNTRY[cc] ?? AIRPORTS_BY_COUNTRY[fallbackCountryCode] ?? [];
}
