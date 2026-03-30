/**
 * Central GetYourGuide affiliate mapping
 *
 * Single source of truth for ALL city-level monetised links.
 * Never scatter these across guide files again.
 */

const PARTNER_ID = "MAQJREP";

function gyg(citySlug: string, id: string) {
  return `https://www.getyourguide.com/en-gb/${citySlug}-${id}/?partner_id=${PARTNER_ID}&utm_medium=online_publisher`;
}

/**
 * IMPORTANT:
 * - Keys MUST match cityId exactly
 * - Only include cities that actually exist on GYG
 */
export const GET_YOUR_GUIDE_LINKS: Record<string, string> = {
  // UK
  london: gyg("london", "l57"),
  manchester: gyg("manchester", "11128"),
  liverpool: gyg("liverpool", "l1210"),
  birmingham: gyg("birmingham", "l12525"),
  "newcastle-upon-tyne": gyg("newcastle-upon-tyne", "l1444"),
  leeds: gyg("leeds", "l11023"),
  nottingham: gyg("nottingham", "l1145813"),
  brighton: gyg("brighton", "l1440"),
  bournemouth: gyg("bournemouth", "l11022"),
  burnley: gyg("burnley", "l1100710"),
  wolverhampton: gyg("wolverhampton", "l1103158"),

  // Europe (expand later properly)
  paris: gyg("paris", "l16"),
  madrid: gyg("madrid", "l46"),
  barcelona: gyg("barcelona", "l45"),
  rome: gyg("rome", "l33"),
  milan: gyg("milan", "l139"),
  berlin: gyg("berlin", "l17"),
  munich: gyg("munich", "l26"),
  amsterdam: gyg("amsterdam", "l36"),
  lisbon: gyg("lisbon", "l42"),
};

/**
 * Safe getter — prevents crashes + keeps UI clean
 */
export function getGYGLink(cityId: string): string | undefined {
  return GET_YOUR_GUIDE_LINKS[cityId];
}
