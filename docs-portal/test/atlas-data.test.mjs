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
  const wml307 = atlas.program.sprints
    .flatMap((sprint) => sprint.workItems)
    .find((workItem) => workItem.id === 'WML-307');
  assert.deepEqual(wml307.scrMatrices, [
    { family: 'wml', scope: 'selected-clause-parents' },
    { family: 'wbxml', scope: 'selected-clause-parents' }
  ]);
});

test('selected-clause capability categories are known and clauses match their family', () => {
  const atlas = validateAtlasData(baseline());
  const capabilityFamilies = atlas.clauseManifest.families.filter(
    (family) => family.capabilityDisposition
  );

  assert.deepEqual(
    [...new Set(capabilityFamilies.map((family) => family.capabilityDisposition))].sort(),
    ['capability-gated-non-ip-bearer', 'optional-class-c-client-capability']
  );
  for (const family of capabilityFamilies) {
    assert.ok(
      family.capabilityClauses.every(
        (clause) => clause.profileApplicability === family.capabilityDisposition
      )
    );
  }
});

test('unknown selected-clause capability categories fail schema validation', () => {
  const unknownFamily = clone(baseline());
  const family = unknownFamily.clauseManifest.families.find(
    (candidate) => candidate.capabilityDisposition
  );
  family.capabilityDisposition = 'unknown-capability-category';
  assertValidationFailure(
    unknownFamily,
    /capabilityDisposition: must be equal to one of the allowed values/
  );

  const unknownClause = clone(baseline());
  const clause = unknownClause.clauseManifest.families
    .find((candidate) => candidate.capabilityClauses?.length)
    .capabilityClauses[0];
  clause.profileApplicability = 'unknown-capability-category';
  assertValidationFailure(
    unknownClause,
    /profileApplicability: must be equal to one of the allowed values/
  );
});

test('known clause capability category must equal its family disposition', () => {
  const data = clone(baseline());
  const family = data.clauseManifest.families.find(
    (candidate) => candidate.capabilityDisposition === 'optional-class-c-client-capability'
  );
  family.capabilityClauses[0].profileApplicability = 'capability-gated-non-ip-bearer';

  assertValidationFailure(
    data,
    /profileApplicability does not match capabilityDisposition/
  );
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

test('aggregate clause context requires a known, non-direct work item', () => {
  const unknown = clone(baseline());
  const unknownClause = unknown.clauseManifest.families
    .flatMap((family) => family.clauses)
    .find((clause) => clause.aggregateContextWorkItems?.length);
  unknownClause.aggregateContextWorkItems = ['UNKNOWN-WORK-ITEM'];
  assertValidationFailure(
    unknown,
    /aggregateContextWorkItems references unknown work item UNKNOWN-WORK-ITEM/
  );

  const overlapping = clone(baseline());
  const overlappingClause = overlapping.clauseManifest.families
    .flatMap((family) => family.clauses)
    .find((clause) => clause.aggregateContextWorkItems?.length);
  overlappingClause.directWorkItems = [...overlappingClause.aggregateContextWorkItems];
  assertValidationFailure(overlapping, /cannot be both direct and aggregate context/);
});

test('profile completion gates require known profiles and conditional follow-ups', () => {
  const unknownProfile = clone(baseline());
  unknownProfile.program.sprints[7].profileCompletionGates[0].profile = 'unknown-profile';
  assertValidationFailure(
    unknownProfile,
    /TRN-7-CL-C\.profile references unknown profile unknown-profile/
  );

  const unknownFollowUp = clone(baseline());
  unknownFollowUp.program.sprints[7].profileCompletionGates[0].conditionalFollowUps = [
    'UNKNOWN-WORK-ITEM'
  ];
  assertValidationFailure(
    unknownFollowUp,
    /TRN-7-CL-C\.conditionalFollowUps references unknown work item UNKNOWN-WORK-ITEM/
  );
});

test('profile gate dependencies require an earlier declared gate', () => {
  const unknownGate = clone(baseline());
  unknownGate.program.sprints[8].profileGateDependencies = ['UNKNOWN-GATE'];
  assertValidationFailure(
    unknownGate,
    /WSP-8\.profileGateDependencies references unknown profile gate UNKNOWN-GATE/
  );

  const laterGate = clone(baseline());
  laterGate.program.sprints[0].profileGateDependencies = ['TRN-7-CL-C'];
  assertValidationFailure(
    laterGate,
    /SRC-0\.profileGateDependencies must reference a gate declared on an earlier sprint: TRN-7-CL-C/
  );
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
