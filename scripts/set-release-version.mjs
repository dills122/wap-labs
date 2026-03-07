#!/usr/bin/env node

import { setManagedVersions } from "./release-version-lib.mjs";

const version = process.argv[2];

if (!version) {
  console.error("Usage: node scripts/set-release-version.mjs <semver>");
  process.exit(1);
}

try {
  await setManagedVersions(version);
  console.log(`PASS set managed repo version to ${version}`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
}
