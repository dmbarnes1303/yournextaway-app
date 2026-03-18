async function run() {
  console.log("No database migrations are configured for this backend.");
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration runner failed:", error);
    process.exit(1);
  });
