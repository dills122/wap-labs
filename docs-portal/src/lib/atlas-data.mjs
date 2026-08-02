import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import commonSchema from '../../schemas/atlas-common.schema.json' with { type: 'json' };
import programSchema from '../../schemas/compliance-program.schema.json' with { type: 'json' };
import effectiveSpecSchema from '../../schemas/effective-spec.schema.json' with { type: 'json' };
import releaseManifestSchema from '../../schemas/release-manifest.schema.json' with { type: 'json' };
import selectedClausesSchema from '../../schemas/selected-clauses.schema.json' with { type: 'json' };

export const defaultRepositoryRoot = existsSync(resolve(process.cwd(), 'docs-portal/package.json'))
  ? process.cwd()
  : resolve(process.cwd(), '..');

export const atlasInputPaths = Object.freeze({
  program: 'docs/waves/wap-1.2.1-compliance-program.json',
  releaseManifest: 'spec-processing/source-manifests/wap-1.2.1-release.json',
  effectiveSpec: 'spec-processing/source-manifests/wap-1.2.1-effective-spec.json',
  clauseManifest: 'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json'
});

const schemas = [
  commonSchema,
  programSchema,
  releaseManifestSchema,
  effectiveSpecSchema,
  selectedClausesSchema
];
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
for (const schema of schemas) {
  ajv.addSchema(schema);
}

const schemaByInput = {
  program: 'https://wap-labs.dev/schemas/compliance-program.schema.json',
  releaseManifest: 'https://wap-labs.dev/schemas/release-manifest.schema.json',
  effectiveSpec: 'https://wap-labs.dev/schemas/effective-spec.schema.json',
  clauseManifest: 'https://wap-labs.dev/schemas/selected-clauses.schema.json'
};

const knownCapabilityDispositions = new Set([
  'capability-gated-non-ip-bearer',
  'optional-class-c-client-capability'
]);

export class AtlasDataValidationError extends Error {
  constructor(failures) {
    super(
      `Project Atlas data validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`
    );
    this.name = 'AtlasDataValidationError';
    this.failures = failures;
  }
}

export function readAtlasInputData(repositoryRoot = defaultRepositoryRoot) {
  return Object.fromEntries(
    Object.entries(atlasInputPaths).map(([name, relativePath]) => {
      const absolutePath = resolve(repositoryRoot, relativePath);
      try {
        return [name, JSON.parse(readFileSync(absolutePath, 'utf8'))];
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new AtlasDataValidationError([`${relativePath}: ${message}`]);
      }
    })
  );
}

export function validateAtlasData(input) {
  const failures = [];

  for (const [name, schemaId] of Object.entries(schemaByInput)) {
    const validate = ajv.getSchema(schemaId);
    if (!validate(input[name])) {
      for (const error of validate.errors ?? []) {
        const path = error.instancePath || '/';
        failures.push(`${atlasInputPaths[name]} ${path}: ${error.message}`);
      }
    }
  }

  if (failures.length === 0) {
    validateReferencesAndOrder(input, failures);
  }
  if (failures.length > 0) {
    failures.sort(compareStrings);
    throw new AtlasDataValidationError(failures);
  }

  return normalizeForPortal(input);
}

export function loadAtlasData(repositoryRoot = defaultRepositoryRoot) {
  return validateAtlasData(readAtlasInputData(repositoryRoot));
}

function validateReferencesAndOrder(input, failures) {
  const { program, releaseManifest, effectiveSpec, clauseManifest } = input;

  const sprintIds = uniqueIndex(
    program.sprints,
    (sprint) => sprint.id,
    'compliance program sprint',
    failures
  );
  const sprintPosition = new Map(program.sprints.map((sprint, index) => [sprint.id, index]));
  const workItems = program.sprints.flatMap((sprint) => sprint.workItems);
  const workItemIds = uniqueIndex(
    workItems,
    (item) => item.id,
    'compliance program work item',
    failures
  );
  const profileIds = uniqueIndex(
    program.profiles,
    (profile) => profile.id,
    'compliance profile',
    failures
  );
  const profileCompletionGates = program.sprints.flatMap(
    (sprint) => sprint.profileCompletionGates ?? []
  );
  const profileGateIds = uniqueIndex(
    profileCompletionGates,
    (gate) => gate.id,
    'profile completion gate',
    failures
  );
  const profileGatePosition = new Map();

  for (const [index, sprint] of program.sprints.entries()) {
    for (const gate of sprint.profileCompletionGates ?? []) {
      if (!profileGatePosition.has(gate.id)) {
        profileGatePosition.set(gate.id, index);
      }
      if (!profileIds.has(gate.profile)) {
        failures.push(`${gate.id}.profile references unknown profile ${gate.profile}`);
      }
      for (const followUp of gate.conditionalFollowUps) {
        if (!workItemIds.has(followUp)) {
          failures.push(`${gate.id}.conditionalFollowUps references unknown work item ${followUp}`);
        }
      }
    }
  }

  for (const sprint of program.sprints) {
    requireSorted(
      sprint.workItems.map((item) => item.id),
      `${sprint.id}.workItems must be ordered by id`,
      failures
    );
    for (const dependency of sprint.dependsOn) {
      if (!sprintIds.has(dependency)) {
        failures.push(`${sprint.id}.dependsOn references unknown sprint ${dependency}`);
      } else if (sprintPosition.get(dependency) >= sprintPosition.get(sprint.id)) {
        failures.push(`${sprint.id}.dependsOn must reference an earlier sprint: ${dependency}`);
      }
    }
    for (const dependency of sprint.profileGateDependencies ?? []) {
      if (!profileGateIds.has(dependency)) {
        failures.push(
          `${sprint.id}.profileGateDependencies references unknown profile gate ${dependency}`
        );
      } else if (profileGatePosition.get(dependency) >= sprintPosition.get(sprint.id)) {
        failures.push(
          `${sprint.id}.profileGateDependencies must reference a gate declared on an earlier sprint: ${dependency}`
        );
      }
    }
  }
  for (const item of workItems) {
    for (const followUp of item.followUpWorkItems ?? []) {
      if (!workItemIds.has(followUp)) {
        failures.push(`${item.id}.followUpWorkItems references unknown work item ${followUp}`);
      }
    }
  }

  const releaseMembers = uniqueIndex(
    releaseManifest.members,
    (member) => member.documentId,
    'release member',
    failures
  );
  if (releaseManifest.release.memberCount !== releaseManifest.members.length) {
    failures.push('release.memberCount does not match members.length');
  }
  if (releaseManifest.summary.memberCount !== releaseManifest.members.length) {
    failures.push('release summary.memberCount does not match members.length');
  }
  requireCountMap(
    releaseManifest.summary.bySourceClass,
    releaseManifest.members.map((member) => member.sourceClass),
    'release summary.bySourceClass',
    failures
  );
  requireCountMap(
    releaseManifest.summary.byLocalState,
    releaseManifest.members.map((member) => member.local.state),
    'release summary.byLocalState',
    failures
  );

  if (effectiveSpec.releaseId !== releaseManifest.release.id) {
    failures.push(
      `effective specification releaseId ${effectiveSpec.releaseId} does not match ${releaseManifest.release.id}`
    );
  }
  const effectiveFamilies = uniqueIndex(
    effectiveSpec.families,
    (family) => family.family,
    'effective specification family',
    failures
  );
  requireSorted(
    effectiveSpec.families.map((family) => family.family),
    'effective specification families must be ordered by family id',
    failures
  );
  if (effectiveSpec.summary.familyCount !== effectiveSpec.families.length) {
    failures.push('effective specification summary.familyCount does not match families.length');
  }
  requireCountMap(
    effectiveSpec.summary.byTargetDisposition,
    effectiveSpec.families.map((family) => family.targetDisposition),
    'effective specification summary.byTargetDisposition',
    failures
  );

  const effectiveDocumentIds = new Set();
  for (const family of effectiveSpec.families) {
    const familyDocuments = uniqueIndex(
      family.documents,
      (document) => document.documentId,
      `${family.family} effective document`,
      failures
    );
    for (const document of family.documents) {
      if (effectiveDocumentIds.has(document.documentId)) {
        failures.push(`effective specification repeats document ${document.documentId}`);
      }
      effectiveDocumentIds.add(document.documentId);
      const releaseMember = releaseMembers.get(document.documentId);
      if (!releaseMember) {
        failures.push(`${family.family} references unknown release member ${document.documentId}`);
      } else if (releaseMember.family !== family.family) {
        failures.push(
          `${document.documentId} belongs to ${releaseMember.family}, not effective family ${family.family}`
        );
      } else if (releaseMember.sha256 !== document.sha256) {
        failures.push(
          `${document.documentId} effective-spec hash does not match the release manifest`
        );
      }
    }
    requireEqualSequence(
      family.effectiveSequence,
      family.documents
        .filter((document) => document.publicationStatus === 'approved')
        .map((document) => document.documentId),
      `${family.family}.effectiveSequence`,
      failures
    );
    requireEqualSequence(
      family.historicalDocuments,
      family.documents
        .filter((document) => document.publicationStatus !== 'approved')
        .map((document) => document.documentId),
      `${family.family}.historicalDocuments`,
      failures
    );
    requireEqualSequence(
      family.baseDocuments,
      family.documents
        .filter(
          (document) =>
            document.documentRole === 'base' && document.publicationStatus === 'approved'
        )
        .map((document) => document.documentId),
      `${family.family}.baseDocuments`,
      failures
    );
    requireEqualSequence(
      family.sinDocuments,
      family.documents
        .filter(
          (document) => document.documentRole === 'sin' && document.publicationStatus === 'approved'
        )
        .map((document) => document.documentId),
      `${family.family}.sinDocuments`,
      failures
    );
    for (const relationship of family.relationships) {
      for (const endpoint of [relationship.from, relationship.to]) {
        if (!familyDocuments.has(endpoint)) {
          failures.push(`${family.family} relationship references unknown document ${endpoint}`);
        }
      }
    }
  }
  if (effectiveDocumentIds.size !== releaseMembers.size) {
    failures.push(
      `effective specification covers ${effectiveDocumentIds.size} of ${releaseMembers.size} release members`
    );
  }

  if (clauseManifest.releaseId !== releaseManifest.release.id) {
    failures.push(
      `selected clauses releaseId ${clauseManifest.releaseId} does not match ${releaseManifest.release.id}`
    );
  }
  if (!workItemIds.has(clauseManifest.generatedFrom.programWorkItem)) {
    failures.push(
      `selected clauses provenance references unknown work item ${clauseManifest.generatedFrom.programWorkItem}`
    );
  }
  requireEqualSequence(
    clauseManifest.families.map((family) => family.family),
    clauseManifest.scope.coveredFamilies,
    'selected clauses family order',
    failures
  );
  for (const familyId of [
    ...clauseManifest.scope.coveredFamilies,
    ...clauseManifest.scope.remainingFamilies
  ]) {
    if (!effectiveFamilies.has(familyId)) {
      failures.push(`selected clauses scope references unknown effective family ${familyId}`);
    }
  }

  const globalParentIds = new Set();
  const globalClauseIds = new Set();
  let parentCount = 0;
  let clauseCount = 0;
  const obligationCounts = { permitted: 0, recommended: 0, required: 0 };
  let plannedFixtureCount = 0;
  let assessedClauseCount = 0;

  for (const family of clauseManifest.families) {
    const effectiveFamily = effectiveFamilies.get(family.family);
    if (!effectiveFamily) {
      failures.push(`selected clauses references unknown effective family ${family.family}`);
      continue;
    }
    requireEqualSequence(
      family.effectiveSequence,
      effectiveFamily.effectiveSequence,
      `${family.family} selected-clause effectiveSequence`,
      failures
    );
    const parentIds = uniqueIndex(
      family.parents,
      (parent) => parent.id,
      `${family.family} clause parent`,
      failures
    );
    const clauseIds = uniqueIndex(
      family.clauses,
      (clause) => clause.id,
      `${family.family} clause`,
      failures
    );
    if (family.selectedParentCount !== family.parents.length) {
      failures.push(`${family.family}.selectedParentCount does not match parents.length`);
    }
    if (family.clauseCount !== family.clauses.length) {
      failures.push(`${family.family}.clauseCount does not match clauses.length`);
    }
    parentCount += family.parents.length;
    clauseCount += family.clauses.length;

    const clauseSourceIds = new Set(family.clauseSources.map((source) => source.documentId));
    for (const source of family.clauseSources) {
      if (source.sourceKind === 'release-member') {
        const releaseMember = releaseMembers.get(source.documentId);
        if (!releaseMember) {
          failures.push(
            `${family.family} clause source references unknown release member ${source.documentId}`
          );
        } else if (source.pdfSha256 !== releaseMember.sha256) {
          failures.push(`${family.family} clause source ${source.documentId} has a stale PDF hash`);
        }
      }
    }
    for (const parent of family.parents) {
      if (globalParentIds.has(parent.id)) {
        failures.push(`selected clauses repeat parent ${parent.id}`);
      }
      globalParentIds.add(parent.id);
      if (!releaseMembers.has(parent.sourceAnchor.documentId)) {
        failures.push(
          `${parent.id}.sourceAnchor references unknown release member ${parent.sourceAnchor.documentId}`
        );
      }
      for (const id of parent.clauseIds) {
        if (!clauseIds.has(id)) {
          failures.push(`${parent.id}.clauseIds references unknown clause ${id}`);
        }
      }
    }
    for (const clause of family.clauses) {
      if (globalClauseIds.has(clause.id)) {
        failures.push(`selected clauses repeat clause ${clause.id}`);
      }
      globalClauseIds.add(clause.id);
      if (clause.family !== family.family) {
        failures.push(`${clause.id}.family is ${clause.family}, expected ${family.family}`);
      }
      if (!clauseSourceIds.has(clause.sourceAnchor.documentId)) {
        failures.push(
          `${clause.id}.sourceAnchor references undeclared source ${clause.sourceAnchor.documentId}`
        );
      }
      for (const parentId of clause.parentRows) {
        if (!parentIds.has(parentId)) {
          failures.push(`${clause.id}.parentRows references unknown parent ${parentId}`);
        }
      }
      obligationCounts[clause.obligationLevel] += 1;
      plannedFixtureCount += 1;
      for (const workItemId of clause.directWorkItems ?? []) {
        if (!workItemIds.has(workItemId)) {
          failures.push(`${clause.id}.directWorkItems references unknown work item ${workItemId}`);
        }
      }
      for (const workItemId of clause.aggregateContextWorkItems ?? []) {
        if (!workItemIds.has(workItemId)) {
          failures.push(
            `${clause.id}.aggregateContextWorkItems references unknown work item ${workItemId}`
          );
        }
        if (clause.directWorkItems?.includes(workItemId)) {
          failures.push(
            `${clause.id}.${workItemId} cannot be both direct and aggregate context`
          );
        }
      }
      if (clause.mapping.clauseImplementationStatus !== 'not-assessed') {
        assessedClauseCount += 1;
      }
    }
    if (family.capabilityParents || family.capabilityClauses) {
      const capabilityParents = family.capabilityParents ?? [];
      const capabilityClauses = family.capabilityClauses ?? [];
      const capabilityParentIds = uniqueIndex(
        capabilityParents,
        (parent) => parent.id,
        `${family.family} capability parent`,
        failures
      );
      const capabilityClauseIds = uniqueIndex(
        capabilityClauses,
        (clause) => clause.id,
        `${family.family} capability clause`,
        failures
      );
      if (!knownCapabilityDispositions.has(family.capabilityDisposition)) {
        failures.push(`${family.family}.capabilityDisposition is not a known capability category`);
      }
      if (family.capabilityParentCount !== capabilityParents.length) {
        failures.push(`${family.family}.capabilityParentCount does not match capabilityParents.length`);
      }
      if (family.capabilityClauseCount !== capabilityClauses.length) {
        failures.push(`${family.family}.capabilityClauseCount does not match capabilityClauses.length`);
      }
      for (const parent of capabilityParents) {
        if (globalParentIds.has(parent.id)) {
          failures.push(`selected clauses repeat parent ${parent.id}`);
        }
        globalParentIds.add(parent.id);
        for (const id of parent.clauseIds) {
          if (!capabilityClauseIds.has(id)) {
            failures.push(`${parent.id}.clauseIds references unknown capability clause ${id}`);
          }
        }
      }
      for (const clause of capabilityClauses) {
        if (globalClauseIds.has(clause.id)) {
          failures.push(`selected clauses repeat clause ${clause.id}`);
        }
        globalClauseIds.add(clause.id);
        if (clause.family !== family.family) {
          failures.push(`${clause.id}.family is ${clause.family}, expected ${family.family}`);
        }
        if (clause.profileApplicability !== family.capabilityDisposition) {
          failures.push(`${clause.id}.profileApplicability does not match capabilityDisposition`);
        }
        if (!clauseSourceIds.has(clause.sourceAnchor.documentId)) {
          failures.push(`${clause.id}.sourceAnchor references undeclared source ${clause.sourceAnchor.documentId}`);
        }
        for (const parentId of clause.parentRows) {
          if (!capabilityParentIds.has(parentId)) {
            failures.push(`${clause.id}.parentRows references unknown capability parent ${parentId}`);
          }
        }
        for (const workItemId of clause.directWorkItems ?? []) {
          if (!workItemIds.has(workItemId)) {
            failures.push(`${clause.id}.directWorkItems references unknown work item ${workItemId}`);
          }
        }
        for (const workItemId of clause.aggregateContextWorkItems ?? []) {
          if (!workItemIds.has(workItemId)) {
            failures.push(
              `${clause.id}.aggregateContextWorkItems references unknown work item ${workItemId}`
            );
          }
          if (clause.directWorkItems?.includes(workItemId)) {
            failures.push(
              `${clause.id}.${workItemId} cannot be both direct and aggregate context`
            );
          }
        }
      }
    }
    if (family.directEvidence) {
      for (const clauseId of family.directEvidence.implementedClauseIds) {
        if (!clauseIds.has(clauseId)) {
          failures.push(`${family.family}.directEvidence references unknown clause ${clauseId}`);
        }
      }
    }
  }

  const expectedSummary = {
    selectedParentCount: parentCount,
    clauseCount,
    requiredClauseCount: obligationCounts.required,
    recommendedClauseCount: obligationCounts.recommended,
    permittedClauseCount: obligationCounts.permitted,
    plannedFixtureCount,
    assessedClauseCount
  };
  for (const [key, expected] of Object.entries(expectedSummary)) {
    if (clauseManifest.summary[key] !== expected) {
      failures.push(
        `selected clauses summary.${key}=${clauseManifest.summary[key]}; expected ${expected}`
      );
    }
  }
}

function normalizeForPortal(input) {
  return {
    program: {
      ...input.program,
      sprints: input.program.sprints.map((sprint) => ({
        ...sprint,
        workItems: [...sprint.workItems]
      }))
    },
    releaseManifest: {
      ...input.releaseManifest,
      summary: {
        ...input.releaseManifest.summary,
        bySourceClass: sortRecord(input.releaseManifest.summary.bySourceClass),
        byLocalState: sortRecord(input.releaseManifest.summary.byLocalState)
      },
      members: [...input.releaseManifest.members].sort((left, right) =>
        compareStrings(left.documentId, right.documentId)
      )
    },
    effectiveSpec: {
      ...input.effectiveSpec,
      summary: {
        ...input.effectiveSpec.summary,
        byTargetDisposition: sortRecord(input.effectiveSpec.summary.byTargetDisposition)
      },
      families: [...input.effectiveSpec.families]
    },
    clauseManifest: {
      ...input.clauseManifest,
      families: [...input.clauseManifest.families]
    }
  };
}

function uniqueIndex(items, keyFor, label, failures) {
  const result = new Map();
  for (const item of items) {
    const key = keyFor(item);
    if (result.has(key)) {
      failures.push(`duplicate ${label} id ${key}`);
    } else {
      result.set(key, item);
    }
  }
  return result;
}

function requireSorted(values, label, failures) {
  const expected = [...values].sort(compareStrings);
  requireEqualSequence(values, expected, label, failures);
}

function requireEqualSequence(actual, expected, label, failures) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${label} is not in its canonical order`);
  }
}

function requireCountMap(actual, values, label, failures) {
  const expected = {};
  for (const value of values) {
    expected[value] = (expected[value] ?? 0) + 1;
  }
  if (JSON.stringify(sortRecord(actual)) !== JSON.stringify(sortRecord(expected))) {
    failures.push(`${label} does not match its records`);
  }
}

function sortRecord(record) {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => compareStrings(left, right))
  );
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
