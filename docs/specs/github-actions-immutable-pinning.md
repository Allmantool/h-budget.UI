# Immutable GitHub Actions Pinning

## Status

Verified

## Problem and Goal

Mutable external GitHub Action references allow an upstream tag to change the code that CI executes. Pin every external action or reusable workflow in the Home Ledger workspace to a verified 40-character commit SHA while retaining an exact release comment.

## Scope

**Required:** Inventory and pin external `uses:` references in repository-owned `.github/workflows` and `.github/actions` YAML across the workspace; preserve local references and workflow behavior; validate YAML and the resulting pins.

**Non-goals:** Changing workflow logic, permissions, triggers, secrets, action major versions, or dependency automation.

**Optional / Follow-up:** Consider dependency-update automation only if it is absent; do not introduce it in this change.

## Repository Evidence and Unknowns

- **CONFIRMED:** 123 `uses:` declarations were found: 122 external actions and one repository-local reusable workflow.
- **CONFIRMED:** Existing external references use mutable tags or version labels rather than immutable commits.
- **CONFIRMED:** Upstream commit IDs and release tags were resolved with `git ls-remote --tags` against the action publishers' GitHub repositories.
- **CONFIRMED:** The bundled `yaml` parser can validate all workflow documents; no repository-provided `actionlint` executable is installed.
- **CONFIRMED:** Dependabot configuration is absent. Renovate configuration exists in the root, accounting, rates, and gateway repositories, which remains compatible with SHA-pinned actions.

## Requirements and Acceptance Criteria

- **REQ-001:** Each external `uses:` declaration has a full 40-character commit SHA and an exact release comment where a release tag is available.
- **AC-001:** No external `uses:` declaration retains a branch, major tag, or abbreviated SHA.
- **REQ-002:** Repository-local action/workflow references remain unchanged and workflow semantics are otherwise untouched.
- **AC-002:** The local `./.github/workflows/ci-master.yml` reference is preserved, and the diff only changes external action references.
- **REQ-003:** The modified YAML remains syntactically valid.
- **AC-003:** All inspected GitHub Actions YAML parses successfully.

## Constraints

Use only authoritative upstream references; do not guess hashes, suppress Sonar findings, or change action major versions.

## Test and Verification Strategy

Use an inventory script to classify references, verify the SHA format and absence of mutable external references, parse each workflow YAML, inspect the focused diff, and run available lightweight GitHub Actions validation tooling if present. TDD is not applicable because this is declarative security metadata with no executable application behavior change.

## Implementation Plan

1. Resolve each distinct external action tag to an upstream release commit — mapping is verified.
2. Replace only external `uses:` values and append release comments — all pins are present.
3. Re-inventory, parse YAML, inspect diffs, and record acceptance evidence — all acceptance criteria are evaluated.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | All 122 external references use 40-character pins and release comments. | Inventory scan found zero mutable external references; each distinct pin appears in upstream tag data. | PASS |
| REQ-002 | AC-002 | Only `uses:` lines changed in workflow diffs. | Focused diff review found 122 removed and 122 added `uses:` lines; the local reusable workflow remains unchanged. | PASS |
| REQ-003 | AC-003 | No YAML structure changed. | The `yaml` parser successfully parsed all 27 workflow YAML files. | PASS |

## Implementation Progress

### Completed

- Completed the workspace inventory and upstream tag resolution.

### In Progress

- None.

### Remaining

- None.

### Decisions and Requirement Changes

- Major references use the latest exact stable release in their existing major line; exact version references retain their existing release. This complies with the task without a major-version upgrade.

### Verification

- TDD exception: no application behavior is changed; verification is declarative inventory, format, YAML parsing, and diff inspection.
- `git ls-remote --tags` verified all 33 distinct source-and-SHA pins as published upstream tag commits.
- The workflow YAML parser passed all 27 files. `actionlint` was not installed and no repository-provided Actions linter was found.
- `git diff --check` passed in the root, SPA, accounting, rates, identity, and gateway repositories.
