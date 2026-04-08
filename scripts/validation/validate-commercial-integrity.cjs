const fs = require("fs");
const path = require("path");

const root = process.cwd();

function readFileSafe(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

let failures = 0;
let warnings = 0;

function fail(message) {
  console.error(`\x1b[31mFAIL\x1b[0m ${message}`);
  failures += 1;
}

function warn(message) {
  console.warn(`\x1b[33mWARN\x1b[0m ${message}`);
  warnings += 1;
}

function pass(message) {
  console.log(`\x1b[32mPASS\x1b[0m ${message}`);
}

function requireNonEmptyConfigKey(fileContent, keyName) {
  const regex = new RegExp(`${keyName}\\s*:\\s*"([^"]*)"`, "m");
  const match = fileContent.match(regex);

  if (!match) {
    fail(`AffiliateConfig is missing key: ${keyName}`);
    return;
  }

  if (!String(match[1] || "").trim()) {
    fail(`AffiliateConfig.${keyName} is empty.`);
    return;
  }

  pass(`AffiliateConfig.${keyName} is present.`);
}

console.log("\n=== Validate commercial integrity ===\n");

const partnersContent = readFileSafe("src/constants/partners.ts");
const affiliateLinks = readFileSafe("src/services/affiliateLinks.ts");
const partnerRegistry = readFileSafe("src/services/partnerRegistry.ts");
const partnerLinks = readFileSafe("src/services/partnerLinks.ts");
const ticketOptionsSheet = readFileSafe("src/components/tickets/TicketOptionsSheet.tsx");
const tripDetailAffiliates = readFileSafe("src/features/tripDetail/tripDetailAffiliates.ts");

[
  "aviasalesMarker",
  "aviasalesFallback",
  "expediaTracked",
  "sportsevents365Tracked",
  "footballticketnetTracked",
  "safetywingAffiliateUrl",
].forEach((key) => requireNonEmptyConfigKey(partnersContent, key));

if (/safetywingTracked\s*:/m.test(partnersContent)) {
  fail("AffiliateConfig still contains safetywingTracked.");
} else {
  pass("AffiliateConfig no longer contains safetywingTracked.");
}

const bannedPartners = [
  "stubhub",
  "gigsberg",
  "omio",
  "kiwitaxi",
  "welcomepickups",
  "ekta",
  "getyourguide",
  "tiqets",
  "klook",
  "wegotrip",
  "airhelp",
  "compensair",
  "google",
  "official_site",
  "internal_claim",
  "internal_note",
  "internal_other",
];

for (const banned of bannedPartners) {
  const regex = new RegExp(`["']${banned}["']|\\b${banned}\\b`, "i");

  if (regex.test(partnersContent)) {
    fail(`Deleted partner still exists in partners.ts: ${banned}`);
  } else {
    pass(`Deleted partner removed from partners.ts: ${banned}`);
  }
}

const requiredPartners = [
  "aviasales",
  "expedia",
  "sportsevents365",
  "footballticketnet",
  "safetywing",
];

for (const required of requiredPartners) {
  const regex = new RegExp(`["']${required}["']|\\b${required}\\b`, "i");

  if (regex.test(partnersContent)) {
    pass(`Approved partner present in partners.ts: ${required}`);
  } else {
    fail(`Approved partner missing in partners.ts: ${required}`);
  }
}

if (/classification\s*:\s*"TIER_1_MONETISED"/g.test(partnersContent)) {
  pass('Tier 1 classification "TIER_1_MONETISED" is present.');
} else {
  fail('Tier 1 classification "TIER_1_MONETISED" is missing.');
}

if (/classification\s*:\s*"TIER_2_STRATEGIC"/g.test(partnersContent)) {
  pass('Tier 2 classification "TIER_2_STRATEGIC" is present.');
} else {
  fail('Tier 2 classification "TIER_2_STRATEGIC" is missing.');
}

if (
  /id:\s*"sportsevents365"[\s\S]*?classification:\s*"TIER_1_MONETISED"/m.test(
    partnersContent
  )
) {
  pass("SportsEvents365 is correctly classified as Tier 1 monetised.");
} else {
  fail("SportsEvents365 must be Tier 1 monetised.");
}

if (
  /id:\s*"footballticketnet"[\s\S]*?classification:\s*"TIER_2_STRATEGIC"/m.test(
    partnersContent
  )
) {
  pass("FootballTicketNet is correctly classified as Tier 2 strategic.");
} else {
  fail("FootballTicketNet must be Tier 2 strategic.");
}

if (
  /id:\s*"footballticketnet"[\s\S]*?capabilities:\s*\{\s*affiliate:\s*false,\s*api:\s*true\s*\}/m.test(
    partnersContent
  )
) {
  pass("FootballTicketNet capabilities correctly reflect non-affiliate API mode.");
} else {
  fail("FootballTicketNet capabilities are wrong. Expected affiliate:false, api:true.");
}

if (
  /id:\s*"safetywing"[\s\S]*?classification:\s*"TIER_1_MONETISED"/m.test(
    partnersContent
  )
) {
  pass("SafetyWing is correctly classified as Tier 1 monetised.");
} else {
  fail("SafetyWing must be Tier 1 monetised.");
}

[
  { file: affiliateLinks, name: "affiliateLinks.ts" },
  { file: partnerRegistry, name: "partnerRegistry.ts" },
  { file: partnerLinks, name: "partnerLinks.ts" },
  { file: ticketOptionsSheet, name: "TicketOptionsSheet.tsx" },
  { file: tripDetailAffiliates, name: "tripDetailAffiliates.ts" },
].forEach(({ file, name }) => {
  bannedPartners.forEach((banned) => {
    const regex = new RegExp(`["']${banned}["']|\\b${banned}\\b`, "i");

    if (regex.test(file)) {
      fail(`${name} still references deleted partner: ${banned}`);
    }
  });
});

if (/transfersUrl|experiencesUrl|transportUrl|omioUrl|claimsUrl|mapsUrl/.test(affiliateLinks)) {
  fail("affiliateLinks.ts still exposes deleted partner categories.");
} else {
  pass("affiliateLinks.ts only exposes approved commercial categories.");
}

if (
  /Best ticket option/.test(partnerRegistry) &&
  /Compare more ticket options/.test(partnerRegistry)
) {
  pass("partnerRegistry.ts applies the correct ticket hierarchy labels.");
} else {
  fail("partnerRegistry.ts is missing the correct ticket hierarchy labels.");
}

if (
  /tier1_trip_tickets_se365/.test(partnerRegistry) &&
  /tier2_trip_tickets_ftn/.test(partnerRegistry)
) {
  pass("partnerRegistry.ts separates Tier 1 and Tier 2 ticket campaigns.");
} else {
  fail("partnerRegistry.ts is not separating Tier 1 and Tier 2 ticket campaigns.");
}

if (
  /case\s*"sportsevents365"/.test(partnerLinks) &&
  /case\s*"footballticketnet"/.test(partnerLinks) &&
  /case\s*"safetywing"/.test(partnerLinks) &&
  /case\s*"aviasales"/.test(partnerLinks) &&
  /case\s*"expedia"/.test(partnerLinks)
) {
  pass("partnerLinks.ts resolves all approved partners.");
} else {
  fail("partnerLinks.ts does not resolve all approved partners.");
}

if (/appendSe365Aid/.test(partnerLinks)) {
  pass("partnerLinks.ts preserves SportsEvents365 affiliate tracking.");
} else {
  fail("partnerLinks.ts is missing SportsEvents365 affiliate tracking logic.");
}

const safetyWingValue =
  (partnersContent.match(/safetywingAffiliateUrl\s*:\s*"([^"]+)"/) || [])[1] || "";

const ftnValue =
  (partnersContent.match(/footballticketnetTracked\s*:\s*"([^"]+)"/) || [])[1] || "";

try {
  const swUrl = new URL(safetyWingValue);
  const referenceId = swUrl.searchParams.get("referenceID");
  const utmSource = swUrl.searchParams.get("utm_source");
  const utmMedium = swUrl.searchParams.get("utm_medium");

  if (referenceId && utmSource && utmMedium) {
    pass("SafetyWing affiliate URL contains expected tracking parameters.");
  } else {
    fail("SafetyWing affiliate URL is missing one or more expected tracking parameters.");
  }
} catch {
  fail("SafetyWing affiliate URL is not a valid URL.");
}

try {
  const ftnUrl = new URL(ftnValue);

  if (ftnUrl.search) {
    warn("FootballTicketNet URL contains query params. Verify they are deliberate and not fake affiliate tracking.");
  } else {
    pass("FootballTicketNet remains a clean non-affiliate strategic URL.");
  }
} catch {
  fail("FootballTicketNet URL is not a valid URL.");
}

console.log("\n=== Commercial integrity summary ===");
console.log(`Failures: ${failures}`);
console.log(`Warnings: ${warnings}\n`);

if (failures > 0) {
  process.exit(1);
}
