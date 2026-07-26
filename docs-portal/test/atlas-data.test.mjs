import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AtlasDataValidationError,
  readAtlasInputData,
  validateAtlasData
} from '../src/lib/atlas-data.mjs';

function baseline() {
  return readAtlasInputData();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertValidationFailure(data, pattern) {
  assert.throws(
    () => validateAtlasData(data),
    (error) => error instanceof AtlasDataValidationError && pattern.test(error.message)
  );
}

test('current Atlas inputs pass schema, reference, and ordering validation', () => {
  const atlas = validateAtlasData(baseline());

  assert.equal(atlas.program.schemaVersion, 1);
  assert.equal(atlas.releaseManifest.schemaVersion, 1);
  assert.equal(atlas.effectiveSpec.schemaVersion, 2);
  assert.equal(atlas.clauseManifest.schemaVersion, 1);
});

test('unknown compliance-program schema versions fail before portal assembly', () => {
  const data = clone(baseline());
  data.program.schemaVersion = 2;

  assertValidationFailure(data, /compliance-program\.json \/schemaVersion/);
});

test('stale and unknown effective-spec schema versions fail before portal assembly', () => {
  for (const schemaVersion of [1, 3]) {
    const data = clone(baseline());
    data.effectiveSpec.schemaVersion = schemaVersion;

    assertValidationFailure(data, /wap-1\.2\.1-effective-spec\.json \/schemaVersion/);
  }
});

test('stale effective-spec generator provenance fails before portal assembly', () => {
  const data = clone(baseline());
  data.effectiveSpec.generatedFrom.generator =
    'spec-processing/scripts/legacy-generate-wap-effective-spec.mjs';

  assertValidationFailure(
    data,
    /wap-1\.2\.1-effective-spec\.json \/generatedFrom\/generator: must be equal to constant/
  );
});

test('unintended effective-spec fields fail before portal assembly', () => {
  const rootData = clone(baseline());
  rootData.effectiveSpec.unexpected = true;
  assertValidationFailure(
    rootData,
    /wap-1\.2\.1-effective-spec\.json \/: must NOT have additional properties/
  );

  const nestedData = clone(baseline());
  nestedData.effectiveSpec.strictTransportProfile.selectedBearer.unexpected = true;
  assertValidationFailure(
    nestedData,
    /wap-1\.2\.1-effective-spec\.json \/strictTransportProfile\/selectedBearer: must NOT have additional properties/
  );
});

test('missing required portal fields fail before portal assembly', () => {
  const data = clone(baseline());
  delete data.releaseManifest.members[0].title;

  assertValidationFailure(
    data,
    /wap-1\.2\.1-release\.json \/members\/0: must have required property 'title'/
  );
});

test('invalid delivery statuses fail their allowed enum', () => {
  const data = clone(baseline());
  data.program.sprints[0].status = 'complete';

  assertValidationFailure(
    data,
    /compliance-program\.json \/sprints\/0\/status: must be equal to one of the allowed values/
  );
});

test('invalid cross-record references fail with the owning record', () => {
  const data = clone(baseline());
  data.program.sprints[1].dependsOn = ['UNKNOWN-SPRINT'];

  assertValidationFailure(data, /CONF-1\.dependsOn references unknown sprint UNKNOWN-SPRINT/);
});

test('invalid cross-file source references fail before portal assembly', () => {
  const data = clone(baseline());
  data.effectiveSpec.families[0].documents[0].documentId = 'UNKNOWN-DOCUMENT';

  assertValidationFailure(data, /architecture references unknown release member UNKNOWN-DOCUMENT/);
});

test('non-canonical effective-family ordering fails before portal assembly', () => {
  const data = clone(baseline());
  data.effectiveSpec.families.reverse();

  assertValidationFailure(data, /effective specification families must be ordered by family id/);
});

test('portal catalog output is stable when source member order changes', () => {
  const firstInput = baseline();
  const secondInput = clone(firstInput);
  secondInput.releaseManifest.members.reverse();

  const first = validateAtlasData(firstInput);
  const second = validateAtlasData(secondInput);
  const firstIds = first.releaseManifest.members.map((member) => member.documentId);
  const secondIds = second.releaseManifest.members.map((member) => member.documentId);

  assert.deepEqual(secondIds, firstIds);
  assert.deepEqual(firstIds, [...firstIds].sort());
});
