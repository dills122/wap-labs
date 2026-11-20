import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [junePath, octoberPath] = process.argv.slice(2);
assert.equal(
  process.argv.length,
  4,
  'Usage: node scripts/check-wml-307-iana-fixtures.mjs <june-raw> <october-raw>'
);

function readRepositoryJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
}

const ingestion = readRepositoryJson(
  '../spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json'
);
const fixture = readRepositoryJson(
  '../transport-rust/tests/fixtures/transport/wbxml_wml13/wml-307-charsets.json'
);
const { artifacts } = ingestion.dependencies.find(
  ({ dependencyId }) => dependencyId === 'iana-character-sets'
);
const assignments = Object.entries({ june: junePath, october: octoberPath }).map(
  ([edition, path]) => {
    const bytes = readFileSync(path);
    const artifact = artifacts.find(({ id }) => id === fixture.captures[edition]);
    assert.equal(artifact?.mediaType, 'text/plain', `${edition}: expected a locked raw capture`);
    assert.equal(bytes.length, artifact.bytes, `${edition}: byte count differs from source lock`);
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      artifact.sha256,
      `${edition}: SHA-256 differs from source lock`
    );
    const numbers = new Set(
      [...bytes.toString('latin1').matchAll(/^MIBenum:[ \t]*(\d+)[ \t]*\r?$/gm)].map(([, number]) =>
        Number(number)
      )
    );
    assert.ok(numbers.size > 0, `${edition}: no MIBenum assignments in capture`);
    return [edition, numbers];
  }
);

assert.notEqual(fixture.captures.june, fixture.captures.october);
assert.ok(fixture.cases.length > 0);
for (const { id, mibEnum, registeredIn } of fixture.cases) {
  const observed = assignments
    .filter(([, numbers]) => numbers.has(mibEnum))
    .map(([edition]) => edition);
  assert.deepEqual(observed, registeredIn, `${id}: registry membership for MIBenum ${mibEnum}`);
}
console.log(
  `PASS WML-307: ${fixture.cases.length} fixture assignments match both locked IANA captures`
);
