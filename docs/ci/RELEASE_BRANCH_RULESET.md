# Release Branch Ruleset Guidance

GitHub branch immutability cannot be enforced from source files alone. Use a repository ruleset for `release/v*`.

## Goal

Each release branch should be a durable historical snapshot:

- created once
- never updated afterward
- never deleted

## Recommended ruleset

Target branch pattern:

- `release/v*`

Recommended restrictions:

- block deletions
- block force pushes
- restrict branch creations
- restrict branch updates

Recommended bypass model:

- allow branch creation bypass only for the GitHub Actions app used by the manual release-branch workflow, or a small release-admin team
- allow no update bypass after creation
- allow no deletion bypass unless your governance requires repository-admin recovery

This structure lets the manual release workflow create `release/vX.Y.Z` once, while preventing later pushes to that branch.

## If GitHub rulesets are unavailable

Approximate the policy with branch protection on `release/*`:

- disable deletions
- disable force pushes
- require pull requests for changes
- restrict who can push to an empty or tightly scoped release-admin list

That is weaker than a ruleset because branch creation and immutability controls are less precise, but it is still better than leaving release branches unprotected.

## Operational sequence

1. Merge milestone-ready code into `main`.
2. Run the manual `Release Prepare` workflow to create `release/vX.Y.Z`.
3. Confirm the ruleset now blocks any subsequent updates to that branch.
4. When the milestone is approved for public shipment, run the manual `Milestone Release` workflow from that release branch.
