import { loadAtlasData } from './atlas-data.mjs';

export interface WorkItem {
  id: string;
  status: string;
  ownerLayers: string[];
  sourceFamilies: string[];
  existingTickets: string[];
  outputs: string[];
  acceptance: string[];
  evidence: string[];
  scrMatrix?: { family: string; scope: string };
  scrMatrices?: Array<{ family: string; scope: string }>;
  sprintId?: string;
  sprintTitle?: string;
}

export interface Sprint {
  id: string;
  title: string;
  status: string;
  dependsOn: string[];
  goal: string;
  workItems: WorkItem[];
  exitGates: string[];
}

interface ComplianceProgram {
  target: {
    release: string;
    markup: string;
    compatibilityFloor: string;
    implementationClaim: string;
    certificationClaim: string;
  };
  profiles: Array<{
    id: string;
    role: string;
    status: string;
    summary: string;
  }>;
  executionPolicy: Record<string, boolean>;
  sprints: Sprint[];
}

export interface SourceMember {
  documentId: string;
  specificationNumber: number;
  revision: string | null;
  documentRole: string;
  publicationStatus: string;
  publishedOn: string;
  family: string;
  title: string;
  sourceClass: string;
  ingestionPriority: number;
  filename: string;
  authority: string;
  archiveMemberPath: string;
  individualSourceUrl: string;
  bytes: number;
  sha256: string;
  redistributionStatus: string;
  local: {
    state: string;
    path: string | null;
    sha256: string | null;
  };
}

interface ReleaseManifest {
  release: {
    id: string;
    title: string;
    releaseLabel: string;
    authority: string;
    catalogUrl: string;
    retrievedOn: string;
  };
  summary: {
    memberCount: number;
    bySourceClass: Record<string, number>;
    byLocalState: Record<string, number>;
  };
  members: SourceMember[];
}

export interface SpecFamily {
  family: string;
  title: string;
  sourceClass: string;
  targetDisposition: string;
  ownerLayers: string[];
  completeness: string;
  interpretationRule: string;
  effectiveSequence: string[];
  baseDocuments: string[];
  sinDocuments: string[];
  historicalDocuments: string[];
  scrExtraction?: {
    status: string;
    ledger?: string;
    selectedProfile?: string;
    selectedFeatureGroup?: string;
    note?: string;
  };
  documents: Array<{
    documentId: string;
    filename: string;
    documentRole: string;
    publicationStatus: string;
    publishedOn: string;
    sha256: string;
    localState: string;
  }>;
}

interface EffectiveSpec {
  releaseId: string;
  summary: {
    familyCount: number;
    byTargetDisposition: Record<string, number>;
  };
  semantics: Record<string, string>;
  families: SpecFamily[];
}

interface ClauseManifest {
  summary: {
    selectedParentCount: number;
    clauseCount: number;
    requiredClauseCount: number;
    recommendedClauseCount: number;
    permittedClauseCount: number;
    plannedFixtureCount: number;
    assessedClauseCount: number;
  };
  families: Array<{
    family: string;
    status: string;
    selectedParentCount: number;
    clauseCount: number;
  }>;
}

const atlasData = loadAtlasData() as {
  program: ComplianceProgram;
  releaseManifest: ReleaseManifest;
  effectiveSpec: EffectiveSpec;
  clauseManifest: ClauseManifest;
};

export const program = atlasData.program;
export const releaseManifest = atlasData.releaseManifest;
export const effectiveSpec = atlasData.effectiveSpec;
export const clauseManifest = atlasData.clauseManifest;

export const workItems = program.sprints.flatMap((sprint) =>
  sprint.workItems.map((item) => ({
    ...item,
    sprintId: sprint.id,
    sprintTitle: sprint.title
  }))
);

export const progress = {
  sprints: countStatuses(program.sprints),
  workItems: countStatuses(workItems)
};

export const strictFamilies = effectiveSpec.families.filter((family) =>
  family.targetDisposition.startsWith('strict-')
);

export const sourceFamilyById = new Map(
  effectiveSpec.families.map((family) => [family.family, family])
);

export const sourceById = new Map(
  releaseManifest.members.map((source) => [source.documentId, source])
);

function countStatuses(items: Array<{ status: string }>) {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
    return counts;
  }, {});
}

export function percentComplete(): number {
  const done = progress.workItems.done ?? 0;
  return Math.round((done / workItems.length) * 100);
}

export function formatBytes(bytes: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(bytes);
}

export function labelize(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function isActiveDoc(id: string): boolean {
  const basename = id.split('/').at(-1) ?? id;
  return (
    !id.split('/').includes('archive') &&
    !/[-_]archive(?:\.md)?$/i.test(basename) &&
    !/(?:^|[^0-9])20\d{2}[-_]\d{2}[-_]\d{2}(?:[^0-9]|$)/.test(id)
  );
}

export function docTitle(body: string | undefined, id: string): string {
  const heading = body?.match(/^#\s+(.+)$/m)?.[1];
  return (
    heading
      ?.replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim() ??
    id
      .split('/')
      .at(-1)!
      .replace(/[-_]/g, ' ')
  );
}

export function docSection(id: string): string {
  return id.split('/')[0] ?? 'other';
}
