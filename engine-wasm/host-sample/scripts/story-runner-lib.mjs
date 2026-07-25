import assert from 'node:assert/strict';

export class NoExecutableCoverageError extends Error {}

export function collectExecutableStories(records) {
  return records.flatMap((example) =>
    (example.flows ?? []).map((flow) => ({
      example,
      flow,
      selectors: new Set([...flow.workItems, ...flow.specItems])
    }))
  );
}

export function selectExecutableStories(records, selector) {
  const stories = collectExecutableStories(records);
  if (selector === 'all') {
    return stories;
  }

  const normalized = selector.toUpperCase();
  const selected = stories.filter((story) =>
    [...story.selectors].some((id) => id.toUpperCase() === normalized)
  );
  if (selected.length > 0) {
    return selected;
  }

  const knownMetadataIds = new Set(
    records.flatMap((record) => [...record.workItems, ...record.specItems])
  );
  const suffix = [...knownMetadataIds].some((id) => id.toUpperCase() === normalized)
    ? ' (the id exists in example metadata, but has no executable flow)'
    : '';
  throw new NoExecutableCoverageError(
    `No executable story coverage found for "${selector}"${suffix}.`
  );
}

export function traceContainsSubsequence(actualKinds, expectedKinds) {
  let expectedIndex = 0;
  for (const actual of actualKinds) {
    if (actual === expectedKinds[expectedIndex]) {
      expectedIndex += 1;
      if (expectedIndex === expectedKinds.length) {
        return true;
      }
    }
  }
  return expectedKinds.length === 0;
}

export function assertStoryExpectation(evidence, expectation, label) {
  for (const [key, expected] of Object.entries(expectation.state)) {
    const actual = evidence.snapshot[key] ?? null;
    assert.deepEqual(actual, expected, `${label}: snapshot.${key}`);
  }
  if (expectation.traceKinds) {
    const actualKinds = evidence.traceEntries.map((entry) => entry.kind);
    assert.ok(
      traceContainsSubsequence(actualKinds, expectation.traceKinds),
      `${label}: expected trace subsequence ${expectation.traceKinds.join(' -> ')}, got ${actualKinds.join(' -> ')}`
    );
  }
}

export function storyListLines(records) {
  const stories = collectExecutableStories(records);
  if (stories.length === 0) {
    return ['No executable story flows are defined.'];
  }
  return stories.map(
    ({ example, flow }) =>
      `${example.key}/${flow.id} | ${[...flow.workItems, ...flow.specItems].join(', ')} | ${flow.title}`
  );
}
