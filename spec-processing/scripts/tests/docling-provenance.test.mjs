import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  PATHS,
  assertNoSnapshotIdCollision,
  buildSnapshot,
  serializeSnapshot,
  validateSnapshot
} from '../docling-provenance-lib.mjs';

function write(root, relativePath, contents) {
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, contents);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docling-provenance-test-'));
  write(
    root,
    PATHS.policy,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        snapshotId: 'fixture-current',
        recordedOn: '2026-07-25',
        profileId: 'fixture-profile',
        qualityDispositions: []
      },
      null,
      2
    )}\n`
  );
  write(root, PATHS.requirements, 'docling==2.114.0\n');
  write(
    root,
    PATHS.profile,
    'set -g DOCLING_PROFILE_FLAGS \\\n    --from pdf \\\n    --to md \\\n    --no-ocr\n'
  );
  write(root, `${PATHS.sourceRoot}/alpha.pdf`, 'alpha-pdf');
  write(root, `${PATHS.sourceRoot}/beta.PDF`, 'beta-pdf');
  write(root, `${PATHS.cleanedRoot}/alpha.cleaned.md`, '# Alpha\n');
  write(root, `${PATHS.cleanedRoot}/beta.cleaned.md`, '# Beta\n');
  return root;
}

test('strict validation rejects a missing provenance record', () => {
  const root = fixture();
  const expected = buildSnapshot(root);
  const actual = structuredClone(expected);
  actual.records.pop();
  assert.match(validateSnapshot(actual, expected).join('\n'), /missing provenance record/);
});

test('strict validation rejects duplicate provenance records', () => {
  const root = fixture();
  const expected = buildSnapshot(root);
  const actual = structuredClone(expected);
  actual.records.push(structuredClone(actual.records[0]));
  assert.match(validateSnapshot(actual, expected).join('\n'), /duplicate provenance/);
});

test('strict validation rejects stale hashes after a canonical input changes', () => {
  const root = fixture();
  const actual = buildSnapshot(root);
  write(root, `${PATHS.cleanedRoot}/alpha.cleaned.md`, '# Alpha changed\n');
  const expected = buildSnapshot(root);
  assert.match(validateSnapshot(actual, expected).join('\n'), /stale or mismatched provenance/);
});

test('strict validation rejects a mismatched source-to-cleaned mapping', () => {
  const root = fixture();
  const expected = buildSnapshot(root);
  const actual = structuredClone(expected);
  actual.records[0].sourcePdfPath = actual.records[1].sourcePdfPath;
  assert.match(validateSnapshot(actual, expected).join('\n'), /stale or mismatched provenance/);
});

test('snapshot generation rejects a cleaned source without one authoritative PDF', () => {
  const root = fixture();
  write(root, `${PATHS.cleanedRoot}/missing.cleaned.md`, '# Missing\n');
  assert.throws(() => buildSnapshot(root), /missing authoritative source PDF/);
});

test('generation rejects reuse of a run ID when snapshot bytes changed', () => {
  const root = fixture();
  const expected = buildSnapshot(root);
  const stale = structuredClone(expected);
  stale.records[0].cleanedMarkdownSha256 = '0'.repeat(64);
  assert.throws(
    () => assertNoSnapshotIdCollision(serializeSnapshot(stale), expected),
    /snapshot ID collision/
  );
  assert.doesNotThrow(() => assertNoSnapshotIdCollision(serializeSnapshot(expected), expected));
});
