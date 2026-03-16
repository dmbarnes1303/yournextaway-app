const fs = require("fs");
const path = require("path");

const root = process.cwd();

function readFileSafe(relPath) {
  const full = path.join(root, relPath);
  return fs.readFileSync(full, "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

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

function listLeagueStems(relDir, ignore = []) {
  const dir = path.join(root, relDir);
  if (!fs.existsSync(dir)) {
    fail(`Missing directory: ${relDir}`);
    return [];
  }

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
    .map((name) => name.replace(/\.(ts|tsx)$/, ""))
    .filter((name) => !ignore.includes(name))
    .sort();

  return entries;
}

function setDiff(a, b) {
  const bSet = new Set(b);
  return a.filter((item) => !bSet.has(item));
}

function parseLeagueIdsFromFootballConfig() {
  const content = readFileSafe("src/constants/football.ts");
  const ids = [...content.matchAll(/leagueId\s*:\s*(\d+)/g)].map((m) => Number(m[1]));
  return [...new Set(ids)];
}

function parseEuropeanCompetitionIds() {
  return [2, 3, 848];
}

let failures = 0;
let warnings = 0;

console.log("\n=== Validate data coverage ===\n");

const teams = listLeagueStems("src/data/teams", ["aliases", "index", "types", "withGuides"]);
const teamGuides = listLeagueStems("src/data/teamGuides", [
  "index",
  "teamGuides",
  "types",
  "utils",
]);
const stadiums = listLeagueStems("src/data/stadiums", [
  "getStadiumTravelGuides",
  "index",
  "types",
  "validateStadiums",
]);
const cityGuides = listLeagueStems("src/data/cityGuides", ["index", "types"]);

if (teams.length === 0) {
  fail("No domestic league files detected in src/data/teams.");
} else {
  pass(`Detected ${teams.length} domestic league team files.`);
}

const missingTeamGuides = setDiff(teams, teamGuides);
const missingStadiums = setDiff(teams, stadiums);
const missingCityGuides = setDiff(teams, cityGuides);

const extraTeamGuides = setDiff(teamGuides, teams);
const extraStadiums = setDiff(stadiums, teams);
const extraCityGuides = setDiff(cityGuides, teams);

if (missingTeamGuides.length) {
  fail(`Missing team guide files for: ${missingTeamGuides.join(", ")}`);
} else {
  pass("Every domestic team file has a matching teamGuides file.");
}

if (missingStadiums.length) {
  fail(`Missing stadium files for: ${missingStadiums.join(", ")}`);
} else {
  pass("Every domestic team file has a matching stadiums file.");
}

if (missingCityGuides.length) {
  fail(`Missing city guide files for: ${missingCityGuides.join(", ")}`);
} else {
  pass("Every domestic team file has a matching cityGuides file.");
}

if (extraTeamGuides.length) {
  warn(`Extra teamGuides files not matched in teams/: ${extraTeamGuides.join(", ")}`);
}

if (extraStadiums.length) {
  warn(`Extra stadiums files not matched in teams/: ${extraStadiums.join(", ")}`);
}

if (extraCityGuides.length) {
  warn(`Extra cityGuides files not matched in teams/: ${extraCityGuides.join(", ")}`);
}

const footballLeagueIds = parseLeagueIdsFromFootballConfig();
const expectedEuropean = parseEuropeanCompetitionIds();

if (footballLeagueIds.length < 33) {
  fail(
    `football.ts only exposed ${footballLeagueIds.length} league IDs. Expected at least 33 (30 domestic + 3 UEFA).`
  );
} else {
  pass(`football.ts exposes ${footballLeagueIds.length} league IDs.`);
}

const missingEuropean = expectedEuropean.filter((id) => !footballLeagueIds.includes(id));
if (missingEuropean.length) {
  fail(`football.ts is missing UEFA competition IDs: ${missingEuropean.join(", ")}`);
} else {
  pass("football.ts includes UCL, UEL and UECL IDs.");
}

if (!exists("src/data/ticketGuides/index.ts")) {
  fail("Missing src/data/ticketGuides/index.ts");
} else {
  pass("Ticket guide registry file exists.");
}

if (!exists("src/data/stadiums/validateStadiums.ts")) {
  warn("No stadium validation helper found outside runtime data.");
} else {
  pass("Existing stadium validation helper detected.");
}

if (!exists("src/data/_dev/validateClubKeys.ts")) {
  warn("No club-key validation helper found.");
} else {
  pass("Existing club-key validation helper detected.");
}

console.log("\n=== Data coverage summary ===");
console.log(`Failures: ${failures}`);
console.log(`Warnings: ${warnings}\n`);

if (failures > 0) {
  process.exit(1);
}
