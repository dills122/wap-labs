import assert from 'node:assert/strict';

export class NoExecutableCoverageError extends Error {}

export function storyEntryUrl(baseUrl, story) {
  if ((story.flow.target ?? 'host-sample') !== 'waves-browser') {
    return baseUrl;
  }
  const url = new URL(baseUrl);
  for (const [command, delayMs] of Object.entries(story.flow.setup?.commandDelaysMs ?? {})) {
    url.searchParams.append('host-delay', `${command}:${delayMs}`);
  }
  return url.href;
}

export function assertConfiguredCommandDelaysExercised(evidence, setup, label) {
  for (const command of Object.keys(setup?.commandDelaysMs ?? {})) {
    const actual = evidence.testHost?.delayedCommandCounts?.[command] ?? 0;
    assert.ok(actual > 0, `${label}: configured host delay for ${command} was never exercised`);
  }
}

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
  if (selector === 'waves' || selector === 'waves-browser') {
    return stories.filter((story) => story.flow.target === 'waves-browser');
  }
  if (selector === 'host-sample') {
    return stories.filter((story) => (story.flow.target ?? 'host-sample') === 'host-sample');
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

export function isExpectedHostFailureStatus(status, expectation) {
  return Boolean(expectation.statusIncludes && status?.includes(expectation.statusIncludes));
}

export function assertStoryExpectation(evidence, expectation, label) {
  assert.ok(evidence.snapshot, `${label}: runtime snapshot is unavailable`);
  for (const [key, expected] of Object.entries(expectation.state)) {
    const actual = stripUndefinedFields(evidence.snapshot[key] ?? null);
    assert.deepEqual(actual, expected, `${label}: snapshot.${key}`);
  }
  if (expectation.traceKinds) {
    const actualKinds = evidence.traceEntries.map((entry) => entry.kind);
    assert.ok(
      traceContainsSubsequence(actualKinds, expectation.traceKinds),
      `${label}: expected trace subsequence ${expectation.traceKinds.join(' -> ')}, got ${actualKinds.join(' -> ')}`
    );
  }
  if (expectation.session) {
    assert.ok(evidence.session, `${label}: host session evidence is unavailable`);
    for (const [key, expected] of Object.entries(expectation.session)) {
      const actual = evidence.session[key] ?? null;
      assert.deepEqual(actual, expected, `${label}: session.${key}`);
    }
  }
  if (expectation.statusIncludes) {
    assert.match(
      evidence.status ?? '',
      new RegExp(escapeRegExp(expectation.statusIncludes)),
      `${label}: status`
    );
  }
  if (expectation.render) {
    assert.ok(evidence.render, `${label}: semantic render evidence is unavailable`);
    const actualText = normalizeRenderText(evidence.render.draw.map((command) => command.text));
    for (const expectedText of expectation.render.textIncludes) {
      const normalizedExpected = normalizeRenderText([expectedText]);
      assert.ok(
        actualText.includes(normalizedExpected),
        `${label}: expected render text to include "${expectedText}", got "${actualText}"`
      );
    }
  }
  if (expectation.frame) {
    assert.ok(evidence.frame, `${label}: engine presentation frame is unavailable`);
    assert.equal(
      evidence.frame.contractVersion,
      expectation.frame.contractVersion,
      `${label}: frame.contractVersion`
    );
    assert.equal(
      evidence.frame.profileId,
      expectation.frame.profileId,
      `${label}: frame.profileId`
    );
    assert.equal(evidence.frame.card.id, expectation.frame.cardId, `${label}: frame.card.id`);
    if (expectation.frame.viewport) {
      assert.deepEqual(
        evidence.frame.viewport,
        expectation.frame.viewport,
        `${label}: frame.viewport`
      );
    }
    const actualAffordances = evidence.frame.affordances.map(
      ({ actionId, label: actionLabel, source, control, enabled }) => ({
        actionId,
        label: actionLabel,
        source,
        control,
        enabled
      })
    );
    assert.deepEqual(
      actualAffordances,
      expectation.frame.affordances,
      `${label}: frame.affordances`
    );
    if (expectation.frame.hitRegions) {
      const actualHitRegions = evidence.frame.hitRegions.map(
        ({ x, y, width, height, actionId, targetKind }) => ({
          x,
          y,
          width,
          height,
          actionId,
          targetKind
        })
      );
      assert.deepEqual(
        actualHitRegions,
        expectation.frame.hitRegions,
        `${label}: frame.hitRegions`
      );
    }
  }
}

export function storyListLines(records) {
  const stories = collectExecutableStories(records);
  if (stories.length === 0) {
    return ['No executable story flows are defined.'];
  }
  return stories.map(
    ({ example, flow }) =>
      `${example.key}/${flow.id} [${flow.target ?? 'host-sample'}] | ${[...flow.workItems, ...flow.specItems].join(', ')} | ${flow.title}`
  );
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeRenderText = (parts) => parts.join(' ').replace(/\s+/g, ' ').trim();

const stripUndefinedFields = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedFields);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([field, fieldValue]) => [field, stripUndefinedFields(fieldValue)])
    );
  }
  return value;
};
