const { spawnSync } = require("child_process");
const path = require("path");

const root = process.cwd();

const checks = [
  "scripts/validation/validate-data-coverage.cjs",
  "scripts/validation/validate-commercial-integrity.cjs",
];

let failed = false;

for (const relPath of checks) {
  console.log(`\n>>> Running ${relPath}\n`);

  const result = spawnSync(process.execPath, [path.join(root, relPath)], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  console.error("\nValidation failed.\n");
  process.exit(1);
}

console.log("\nAll validation checks passed.\n");
