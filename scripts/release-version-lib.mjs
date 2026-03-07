import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const JSON_VERSION_FILES = [
  "package.json",
  "browser/package.json",
  "browser/frontend/package.json",
  "engine-wasm/host-sample/package.json",
  "marketing-site/package.json",
  "wml-server/package.json",
  "browser/src-tauri/tauri.conf.json",
];

const CARGO_VERSION_FILES = [
  "transport-rust/Cargo.toml",
  "engine-wasm/engine/Cargo.toml",
  "browser/src-tauri/Cargo.toml",
];

const SPECIAL_HANDLERS = {
  "wml-server/package-lock.json": {
    readVersion(payload) {
      return payload.version;
    },
    setVersion(payload, version) {
      payload.version = version;
      if (payload.packages?.[""]) {
        payload.packages[""].version = version;
      }
      return payload;
    },
  },
};

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9A-Za-z-][0-9A-Za-z-]*)(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function absolutePath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

async function readJson(relativePath) {
  const raw = await readFile(absolutePath(relativePath), "utf8");
  return JSON.parse(raw);
}

async function writeJson(relativePath, payload) {
  await writeFile(
    absolutePath(relativePath),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

async function readCargoVersion(relativePath) {
  const raw = await readFile(absolutePath(relativePath), "utf8");
  const match = raw.match(/^version = "([^"]+)"$/m);
  if (!match) {
    throw new Error(`Missing Cargo package version in ${relativePath}`);
  }

  return match[1];
}

async function writeCargoVersion(relativePath, version) {
  const raw = await readFile(absolutePath(relativePath), "utf8");
  const currentVersion = await readCargoVersion(relativePath);
  if (currentVersion === version) {
    return;
  }

  const next = raw.replace(/^version = "[^"]+"$/m, `version = "${version}"`);

  if (next === raw) {
    throw new Error(`Unable to update Cargo package version in ${relativePath}`);
  }

  await writeFile(absolutePath(relativePath), next, "utf8");
}

export function isValidSemver(version) {
  return SEMVER_PATTERN.test(version);
}

export async function readReleaseVersion() {
  return (await readFile(absolutePath("VERSION"), "utf8")).trim();
}

export async function writeReleaseVersion(version) {
  await writeFile(absolutePath("VERSION"), `${version}\n`, "utf8");
}

export async function getManagedVersions() {
  const versions = [{ path: "VERSION", version: await readReleaseVersion() }];

  for (const relativePath of JSON_VERSION_FILES) {
    const payload = await readJson(relativePath);
    versions.push({ path: relativePath, version: payload.version });
  }

  for (const relativePath of CARGO_VERSION_FILES) {
    versions.push({ path: relativePath, version: await readCargoVersion(relativePath) });
  }

  for (const [relativePath, handler] of Object.entries(SPECIAL_HANDLERS)) {
    const payload = await readJson(relativePath);
    versions.push({ path: relativePath, version: handler.readVersion(payload) });
  }

  return versions;
}

export async function setManagedVersions(version) {
  if (!isValidSemver(version)) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  await writeReleaseVersion(version);

  for (const relativePath of JSON_VERSION_FILES) {
    const payload = await readJson(relativePath);
    payload.version = version;
    await writeJson(relativePath, payload);
  }

  for (const relativePath of CARGO_VERSION_FILES) {
    await writeCargoVersion(relativePath, version);
  }

  for (const [relativePath, handler] of Object.entries(SPECIAL_HANDLERS)) {
    const payload = await readJson(relativePath);
    await writeJson(relativePath, handler.setVersion(payload, version));
  }
}

export async function collectVersionDrift(expectedVersion) {
  const managedVersions = await getManagedVersions();

  return managedVersions.filter(({ version }) => version !== expectedVersion);
}
