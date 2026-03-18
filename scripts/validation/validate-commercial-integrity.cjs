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

function extractLeagueIdsFromFootball() {
  const content = readFileSafe("src/constants/football.ts");
  return [...new Set([...content.matchAll(/leagueId\s*:\s*(\d+)/g)].map((m) => Number(m[1])))];
}

function extractLeagueIdsFromDiscoverPrice() {
  const content = readFileSafe("src/features/discover/discoverPrice.ts");

  const tupleIds = [...content.matchAll(/\[\s*(\d+)\s*,\s*\d+\s*\]/g)].map((m) => Number(m[1]));
  const objectIds = [...content.matchAll(/\b(\d+)\s*:\s*\{/g)].map((m) => Number(m[1]));
  const ifIds = [...content.matchAll(/if\s*\(\s*.*?===\s*(\d+)\s*\)/g)].map((m) => Number(m[1]));

  return [...new Set([...tupleIds, ...objectIds, ...ifIds])];
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

function requireOptionalConfigKey(fileContent, keyName) {
  const regex = new RegExp(`${keyName}\\s*:\\s*"([^"]*)"`, "m");
  const match = fileContent.match(regex);

  if (!match) {
    fail(`AffiliateConfig is missing optional key: ${keyName}`);
    return;
  }

  if (!String(match[1] || "").trim()) {
    warn(`AffiliateConfig.${keyName} is empty.`);
    return;
  }

  pass(`AffiliateConfig.${keyName} is present.`);
}

console.log("\n=== Validate commercial integrity ===\n");

const footballIds = extractLeagueIdsFromFootball();
const priceIds = extractLeagueIdsFromDiscoverPrice();

const missingInPrice = footballIds.filter((id) => !priceIds.includes(id));
if (missingInPrice.length) {
  fail(`discoverPrice.ts is missing league IDs from football.ts: ${missingInPrice.join(", ")}`);
} else {
  pass("discoverPrice.ts covers every league ID found in football.ts.");
}

const partnersContent = readFileSafe("src/constants/partners.ts");

[
  "aviasalesMarker",
  "aviasalesFallback",
  "expediaToken",
  "kiwitaxiTracked",
  "sportsevents365Tracked",
  "getyourguidePartnerId",
  "omioTracked",
].forEach((key) => requireNonEmptyConfigKey(partnersContent, key));

if (/safetywingTracked\s*:/m.test(partnersContent)) {
  fail("AffiliateConfig still contains safetywingTracked. SafetyWing should be removed if not live.");
} else {
  pass("AffiliateConfig no longer contains stale SafetyWing config.");
}

[
  "ektaTracked",
  "klookTracked",
  "tiqetsTracked",
  "wegotripTracked",
  "airhelpTracked",
  "compensairTracked",
  "welcomepickupsTracked",
].forEach((key) => requireOptionalConfigKey(partnersContent, key));

const partnerRegistry = readFileSafe("src/services/partnerRegistry.ts");
const affiliateLinks = readFileSafe("src/services/affiliateLinks.ts");
const fixtureRowCard = readFileSafe("src/features/fixtures/FixtureRowCard.tsx");
const discoverFixtureCard = readFileSafe("src/features/discover/components/DiscoverFixtureCard.tsx");
const ticketGuidesIndex = readFileSafe("src/data/ticketGuides/index.ts");

if (/google\.com\/search/i.test(partnerRegistry)) {
  fail("partnerRegistry.ts still contains google.com/search fallback URLs.");
} else {
  pass("partnerRegistry.ts no longer uses fake Google search affiliate fallbacks.");
}

if (/google\.com\/search/i.test(affiliateLinks)) {
  fail("affiliateLinks.ts still contains google.com/search fallback URLs.");
} else {
  pass("affiliateLinks.ts no longer uses fake Google search affiliate fallbacks.");
}

if (/safetywingTracked/i.test(affiliateLinks)) {
  fail("affiliateLinks.ts still references SafetyWing.");
} else {
  pass("affiliateLinks.ts no longer references SafetyWing.");
}

if (!/resolveAffiliateUrl\s*\(/.test(fixtureRowCard)) {
  fail("FixtureRowCard.tsx is not resolving affiliate availability through resolveAffiliateUrl().");
} else {
  pass("FixtureRowCard.tsx uses resolveAffiliateUrl().");
}

if (!/getTicketDifficultyBadge\s*\(\s*home\s*,\s*ctxLeagueId\s*\)/.test(fixtureRowCard)) {
  fail("FixtureRowCard.tsx is not passing leagueId into getTicketDifficultyBadge(home, ctxLeagueId).");
} else {
  pass("FixtureRowCard.tsx uses league fallback ticket difficulty correctly.");
}

if (/Flights prefilled/.test(fixtureRowCard)) {
  fail('FixtureRowCard.tsx still contains misleading text: "Flights prefilled".');
} else {
  pass('FixtureRowCard.tsx no longer claims "Flights prefilled".');
}

if (/Hotels prefilled/.test(fixtureRowCard)) {
  fail('FixtureRowCard.tsx still contains misleading text: "Hotels prefilled".');
} else {
  pass('FixtureRowCard.tsx no longer claims "Hotels prefilled".');
}

if (/Tickets live/.test(fixtureRowCard)) {
  fail('FixtureRowCard.tsx still contains misleading generic text: "Tickets live".');
} else {
  pass('FixtureRowCard.tsx no longer uses the weak "Tickets live" fallback.');
}

if (!/Estimated only/i.test(discoverFixtureCard)) {
  fail("DiscoverFixtureCard.tsx does not clearly label pricing as estimated.");
} else {
  pass("DiscoverFixtureCard.tsx clearly labels pricing as estimated.");
}

if (!/getLeagueTicketDifficultyFallback/.test(ticketGuidesIndex)) {
  fail("ticketGuides/index.ts is missing league-level fallback ticket logic.");
} else {
  pass("ticketGuides/index.ts includes league-level fallback ticket logic.");
}

console.log("\n=== Commercial integrity summary ===");
console.log(`Failures: ${failures}`);
console.log(`Warnings: ${warnings}\n`);

if (failures > 0) {
  process.exit(1);
}
