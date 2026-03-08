#!/usr/bin/env node

import {
  collectVersionDrift,
  isValidSemver,
  readReleaseVersion,
} from "./release-version-lib.mjs";

try {
  const expectedVersion = await readReleaseVersion();
  if (!isValidSemver(expectedVersion)) {
    throw new Error(`VERSION is not valid semver: ${expectedVersion}`);
  }

  const drift = await collectVersionDrift(expectedVersion);

  if (drift.length > 0) {
    console.error(`FAIL managed version drift detected for ${expectedVersion}`);
    for (const entry of drift) {
      console.error(`- ${entry.path}: ${entry.version}`);
    }
    process.exit(1);
  }

  console.log(`PASS managed versions match ${expectedVersion}`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
}
