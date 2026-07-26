#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const browserRoot = process.cwd();
const repoRoot = path.resolve(browserRoot, '..');
const iconsDir = path.join(browserRoot, 'src-tauri', 'icons');
const sourceIcon = path.join(iconsDir, 'waves.svg');
const mode = process.argv[2] ?? 'generate';
const expectedNode = fs.readFileSync(path.join(repoRoot, '.nvmrc'), 'utf8').trim();
const expectedTauriCli = '2.10.0';
const deterministicOutputs = ['32x32.png', '128x128.png', '128x128@2x.png', 'icon.png', 'icon.ico'];
const repositoryInventory = [
  ...deterministicOutputs,
  'generated-assets.json',
  'icon.icns',
  'waves.svg'
].sort();

if (!['generate', 'check', 'refresh-icns'].includes(mode)) {
  throw new Error(`unsupported icon mode: ${mode}`);
}
if (process.version !== `v${expectedNode}`) {
  throw new Error(`Node ${expectedNode} is required; received ${process.version}`);
}

const tauriVersion = execFileSync('cargo', ['tauri', '--version'], { encoding: 'utf8' }).trim();
if (tauriVersion !== `tauri-cli ${expectedTauriCli}`) {
  throw new Error(`tauri-cli ${expectedTauriCli} is required; received ${tauriVersion}`);
}

const manifest = `${JSON.stringify(
  {
    schemaVersion: 1,
    generatedBy: 'pnpm --dir browser run tauri:icons',
    source: 'browser/src-tauri/icons/waves.svg',
    tauriCli: expectedTauriCli,
    committedOutputs: deterministicOutputs,
    semanticOnlyOutput: 'icon.icns',
    note: 'ICNS bytes from tauri-cli 2.10.0 are nondeterministic; normal generation validates but does not replace the committed ICNS. Use tauri:icons:refresh-icns only for an intentional package-asset refresh.'
  },
  null,
  2
)}\n`;

function listFiles(root, prefix = '') {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.posix.join(prefix, entry.name);
      return entry.isDirectory() ? listFiles(path.join(root, entry.name), relative) : [relative];
    })
    .sort();
}

function assertRepositoryInventory() {
  const actual = listFiles(iconsDir);
  if (JSON.stringify(actual) !== JSON.stringify(repositoryInventory)) {
    throw new Error(
      `unexpected repository icon inventory\nexpected: ${repositoryInventory.join(', ')}\nactual: ${actual.join(', ')}`
    );
  }
}

function validateIcns(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 16 || bytes.subarray(0, 4).toString('ascii') !== 'icns') {
    throw new Error(`${filePath} is not an ICNS container`);
  }
  if (bytes.readUInt32BE(4) !== bytes.length) {
    throw new Error(`${filePath} has an invalid ICNS container length`);
  }
  let offset = 8;
  let imageChunks = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) {
      throw new Error(`${filePath} has a truncated ICNS chunk header`);
    }
    const chunkType = bytes.subarray(offset, offset + 4).toString('ascii');
    const chunkLength = bytes.readUInt32BE(offset + 4);
    if (chunkLength < 8 || offset + chunkLength > bytes.length) {
      throw new Error(`${filePath} has an invalid ICNS chunk length`);
    }
    if (/^ic|^it32$|^ih32$|^is32$/.test(chunkType)) {
      imageChunks += 1;
    }
    offset += chunkLength;
  }
  if (offset !== bytes.length || imageChunks === 0) {
    throw new Error(`${filePath} does not contain a complete ICNS image set`);
  }
}

function writeIfChanged(filePath, content) {
  if (!fs.existsSync(filePath) || !fs.readFileSync(filePath).equals(content)) {
    fs.writeFileSync(filePath, content);
    console.log(`generated ${path.relative(browserRoot, filePath)}`);
  }
}

const temporaryOutput = fs.mkdtempSync(path.join(os.tmpdir(), 'waves-tauri-icons-'));
try {
  execFileSync('cargo', ['tauri', 'icon', sourceIcon, '--output', temporaryOutput], {
    stdio: ['ignore', 'ignore', 'ignore']
  });

  for (const output of deterministicOutputs) {
    const generated = fs.readFileSync(path.join(temporaryOutput, output));
    const committedPath = path.join(iconsDir, output);
    if (mode === 'check') {
      if (!fs.existsSync(committedPath) || !fs.readFileSync(committedPath).equals(generated)) {
        throw new Error(`${output} has drifted from waves.svg under tauri-cli ${expectedTauriCli}`);
      }
    } else {
      writeIfChanged(committedPath, generated);
    }
  }

  const generatedIcns = path.join(temporaryOutput, 'icon.icns');
  const committedIcns = path.join(iconsDir, 'icon.icns');
  validateIcns(generatedIcns);
  if (mode === 'refresh-icns') {
    writeIfChanged(committedIcns, fs.readFileSync(generatedIcns));
  } else {
    validateIcns(committedIcns);
  }

  if (mode === 'check') {
    if (!fs.existsSync(path.join(iconsDir, 'generated-assets.json'))) {
      throw new Error('generated-assets.json is missing');
    }
    if (fs.readFileSync(path.join(iconsDir, 'generated-assets.json'), 'utf8') !== manifest) {
      throw new Error('generated-assets.json is stale');
    }
  } else {
    writeIfChanged(path.join(iconsDir, 'generated-assets.json'), Buffer.from(manifest));
  }

  assertRepositoryInventory();
  console.log(`PASS Tauri icon ${mode}`);
} finally {
  fs.rmSync(temporaryOutput, { recursive: true, force: true });
}
