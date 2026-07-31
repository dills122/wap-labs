import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function globMatches(pattern, candidate) {
  let expression = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '*' && pattern[index + 1] === '*') {
      expression += '.*';
      index += 1;
    } else if (character === '*') {
      expression += '[^/]*';
    } else {
      expression += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp(`${expression}$`).test(candidate);
}

function parseCiFilters(source) {
  const filters = new Map();
  let inFilters = false;
  let current = null;

  for (const line of source.split(/\r?\n/)) {
    if (line === '          filters: |') {
      inFilters = true;
      continue;
    }
    if (!inFilters) {
      continue;
    }
    const key = line.match(/^ {12}([a-z_]+):$/);
    if (key) {
      current = key[1];
      filters.set(current, []);
      continue;
    }
    const pattern = line.match(/^ {14}- "([^"]+)"$/);
    if (pattern && current) {
      filters.get(current).push(pattern[1]);
      continue;
    }
    if (line.trim() !== '' && !line.startsWith('            ')) {
      break;
    }
  }
  return filters;
}

function parsePullRequestPaths(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line === '    paths:');
  assert.notEqual(start, -1, 'workflow must define pull_request paths');
  const patterns = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^ {6}- '([^']+)'$/);
    if (!match) {
      break;
    }
    patterns.push(match[1]);
  }
  return patterns;
}

const ciWorkflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
const transportWorkflow = fs.readFileSync('.github/workflows/transport-wap-smoke.yml', 'utf8');
const nativeWorkflow = fs.readFileSync('.github/workflows/native-tauri-kannel-e2e.yml', 'utf8');
const securityWorkflow = fs.readFileSync('.github/workflows/security.yml', 'utf8');
const fixtures = JSON.parse(fs.readFileSync('scripts/tests/fixtures/ci-path-routing.json', 'utf8'));
const ciFilters = parseCiFilters(ciWorkflow);
const transportPaths = parsePullRequestPaths(transportWorkflow);
const nativePaths = parsePullRequestPaths(nativeWorkflow);
const securityFilters = parseCiFilters(securityWorkflow);

test('CI path filters are parseable and cover every declared output family', () => {
  assert.deepEqual(
    [...ciFilters.keys()],
    [
      'ci',
      'compliance',
      'rust_engine',
      'rust_transport',
      'host_sample',
      'marketing_site',
      'docs_portal',
      'browser_shell',
      'browser_frontend',
      'wml_server'
    ]
  );
});

for (const fixture of fixtures) {
  test(`routes ${fixture.path} to the intended validation families`, () => {
    const actualFilters = [...ciFilters]
      .filter(([, patterns]) => patterns.some((pattern) => globMatches(pattern, fixture.path)))
      .map(([name]) => name);
    assert.deepEqual(actualFilters, fixture.ciFilters);
    assert.equal(
      transportPaths.some((pattern) => globMatches(pattern, fixture.path)),
      fixture.transportSmoke
    );
    assert.equal(
      nativePaths.some((pattern) => globMatches(pattern, fixture.path)),
      fixture.nativeE2e
    );
    assert.equal(
      securityFilters
        .get('network_preview_images')
        .some((pattern) => globMatches(pattern, fixture.path)),
      fixture.securityImages
    );
  });
}
