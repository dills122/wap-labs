import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  checkDocumentationLinks,
  isActiveDocPath,
  markdownAnchors
} from '../check-active-doc-links.mjs';

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wap-doc-links-'));
  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, source);
  }
  return root;
}

test('active documentation scope excludes archives and dated snapshots', () => {
  assert.equal(isActiveDocPath('docs/ci/CI_SETUP.md'), true);
  assert.equal(isActiveDocPath('docs/waves/archive/old.md'), false);
  assert.equal(isActiveDocPath('docs/waves/WORK_ITEMS_ARCHIVE.md'), false);
  assert.equal(isActiveDocPath('docs/waves/REVIEW_2026-07-25.md'), false);
});

test('GitHub heading anchors include deterministic duplicate suffixes and explicit ids', () => {
  const anchors = markdownAnchors(
    [
      '# Cache keys',
      '## Cache keys',
      '## <strong>Nested <em>markup</em></strong>',
      '<a id="manual-anchor"></a>'
    ].join('\n')
  );
  assert.deepEqual([...anchors], ['cache-keys', 'cache-keys-1', 'nested-markup', 'manual-anchor']);
});

test('active documentation links validate files, anchors, and reference targets', () => {
  const root = fixture({
    'docs/index.md': [
      '# Index',
      '[guide](guide.md#cache-keys)',
      '[root](/README.md)',
      '[reference][policy]',
      '[policy]: guide.md#cache-keys'
    ].join('\n'),
    'docs/guide.md': '# Cache keys\n',
    'README.md': '# Root\n'
  });
  const result = checkDocumentationLinks(root, ['README.md', 'docs']);
  assert.deepEqual(result.failures, []);
  assert.equal(result.fileCount, 3);
});

test('missing local targets and anchors fail with source locations', () => {
  const root = fixture({
    'docs/index.md': '# Index\n[missing](absent.md)\n[anchor](guide.md#absent)\n',
    'docs/guide.md': '# Present\n'
  });
  const result = checkDocumentationLinks(root, ['docs']);
  assert.deepEqual(result.failures, [
    'docs/index.md:2: missing target `absent.md`',
    'docs/index.md:3: missing anchor `#absent` in `docs/guide.md`'
  ]);
});
