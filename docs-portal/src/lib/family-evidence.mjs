/**
 * Summarize selected-profile evidence only. Optional capability rows are separate.
 * @param {{ parents: Array<{ implementationStatus: 'implemented' | 'partial' | 'missing' }>, clauses: Array<{ mapping: { clauseImplementationStatus: 'implemented' | 'not-assessed' } }> } | undefined} family
 */
export function summarizeFamilyEvidence(family) {
  if (!family) return null;
  const parents = { implemented: 0, partial: 0, missing: 0 };
  const clauses = { assessed: 0, notAssessed: 0 };
  for (const parent of family.parents) parents[parent.implementationStatus] += 1;
  for (const clause of family.clauses) {
    if (clause.mapping.clauseImplementationStatus === 'implemented') clauses.assessed += 1;
    else clauses.notAssessed += 1;
  }
  return { parents, clauses };
}
