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

function forbidPattern(fileContent, regex, message) {
  if (regex.test(fileContent)) {
    fail(message);
  } else {
    pass(message.replace("still ", "no longer ").replace("contains ", "contains no "));
  }
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
  "footballticketsnetTracked",
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
  "footballticketsnet",
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

if (/classification\s*:\s*"LIVE_MONETISED"/g.test(partnersContent)) {
  pass('Partner classification "LIVE_MONETISED" is present.');
} else {
  fail('Partner classification "LIVE_MONETISED" is missing.');
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

if (/sportsevents365/i.test(partnerRegistry) && /footballticketsnet/i.test(partnerRegistry)) {
  pass("partnerRegistry.ts includes both approved ticket partners.");
} else {
  fail("partnerRegistry.ts is missing one or both approved ticket partners.");
}

if (/safetywing/i.test(partnerRegistry)) {
  pass("partnerRegistry.ts includes SafetyWing.");
} else {
  fail("partnerRegistry.ts is missing SafetyWing.");
}

if (/case\s*"sportsevents365"/.test(partnerLinks) &&
    /case\s*"footballticketsnet"/.test(partnerLinks) &&
    /case\s*"safetywing"/.test(partnerLinks) &&
    /case\s*"aviasales"/.test(partnerLinks) &&
    /case\s*"expedia"/.test(partnerLinks)) {
  pass("partnerLinks.ts resolves all approved partners.");
} else {
  fail("partnerLinks.ts does not resolve all approved partners.");
}

const directUrlWarnings = [
  {
    key: "footballticketsnetTracked",
    value: (partnersContent.match(/footballticketsnetTracked\s*:\s*"([^"]+)"/) || [])[1] || "",
    label: "FootballTicketsNet",
  },
  {
    key: "safetywingAffiliateUrl",
    value: (partnersContent.match(/safetywingAffiliateUrl\s*:\s*"([^"]+)"/) || [])[1] || "",
    label: "SafetyWing",
  },
];

for (const item of directUrlWarnings) {
  try {
    const url = new URL(item.value);
    if (url.search) {
      pass(`${item.label} config contains query parameters.`);
    } else {
      warn(`${item.label} config has no query params. Replace with real affiliate URL if required.`);
    }
  } catch {
    fail(`${item.label} config is not a valid URL.`);
  }
}

console.log("\n=== Commercial integrity summary ===");
console.log(`Failures: ${failures}`);
console.log(`Warnings: ${warnings}\n`);

if (failures > 0) {
  process.exit(1);
}
