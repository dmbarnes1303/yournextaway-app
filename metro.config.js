const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep package exports disabled for stability with packages that can pull ESM-only builds.
config.resolver = config.resolver || {};
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
