# Deterministic Commitlint Hook Resolution

## Status

Verified

## Problem and Goal

SourceTree commits made through the parent checkout execute the UI Husky hook
from the parent repository working directory. The hook uses `npx`, which cannot
resolve the UI package's local Commitlint executable from that directory and
then attempts package resolution in a non-interactive process. Make
commit-message validation use the version-controlled UI dependency directly,
with no package resolution or download at commit time.

## Scope

**Required:**

- Preserve the existing Conventional Commit configuration and CI bypass.
- Make `.husky/commit-msg` locate the UI package and its local Commitlint
  executable relative to the hook, independent of Git's current directory.
- Ensure the commit-message file still resolves correctly when Git supplies a
  relative path and the hook changes directory.
- Remove dynamic `npx` execution from the related pre-commit hook, whose
  current command has no commit-message-file argument available.

**Non-goals:**

- Change Commitlint rules or upgrade dependencies.
- Add Node dependencies to the parent infrastructure repository.
- Alter application code or user-owned working-tree changes.

## Repository Evidence and Unknowns

- **CONFIRMED:** `UI` is a separate Git repository with its own `package.json`,
  `package-lock.json`, `.npmrc`, and Husky `core.hooksPath = .husky/_`.
- **CONFIRMED:** the parent checkout locally sets `core.hooksPath = UI/.husky/_`.
  Its current working directory is therefore the parent checkout when it runs
  the UI hook.
- **CONFIRMED:** `UI/package.json` and its lockfile declare
  `@commitlint/cli@21.2.2`; `UI/node_modules/.bin/commitlint` is installed.
- **CONFIRMED:** executing the existing `npx --no-install commitlint --version`
  from the parent checkout reproduces `npx canceled due to missing packages and
  no YES option: [\"commitlint@21.2.2\"]`.
- **ASSUMED:** SourceTree invokes Git's configured hook in the same way as the
  reproduced non-interactive parent-checkout command.
- **UNKNOWN:** the parent checkout's local Git configuration is not tracked by
  the UI repository and cannot be corrected by a UI-repository commit.

## Requirements and Acceptance Criteria

- **REQ-001:** Commit-message validation must use the UI repository's installed
  Commitlint executable without invoking a package runner.
- **AC-001:** A valid conventional commit message passes through the actual
  commit-msg hook when invoked from both the UI and parent checkout contexts.
- **AC-002:** An invalid message fails due to Commitlint rules, not package
  installation or interactive confirmation.
- **AC-003:** `npm ci` for the UI repository installs the required Hook and
  Commitlint dependencies from its synchronized lockfile.
- **EDGE-001:** The hook must preserve a relative Git commit-message path before
  changing to the UI package directory.

## Constraints

- Use POSIX `sh` compatible with Git for Windows/Husky.
- Keep `\"$1\"` safely quoted and avoid user-specific absolute paths.
- Do not dynamically download packages, use global packages, or weaken rules.

## Test and Verification Strategy

TDD: Not Applicable — Reason: this is shell-hook/tooling configuration with no
existing automated hook-test harness; Verification: direct execution of the
actual Husky hook with temporary valid/invalid message files, checked local
binary version, `npm ci --dry-run`, and Git diff review.

## Implementation Plan

1. Replace `npx` in the commit-msg hook with a hook-relative local executable
   and normalize the message path before changing directories — exit condition:
   no package runner is called.
2. Make pre-commit an explicit no-op because Commitlint only has its message
   file at the commit-msg stage — exit condition: no second/dynamic invocation.
3. Run direct positive/negative hook checks from both repository contexts and
   validate package-lock consistency — exit condition: acceptance criteria have
   recorded evidence.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001, AC-002 | `.husky/commit-msg` | Actual Husky wrapper: valid pass and invalid Commitlint failure from parent and UI contexts | PASS |
| REQ-001 | AC-003 | Existing package metadata | `npm ci --dry-run --ignore-scripts` passed; `npm run prepare` installed Husky hooks | PASS |
| EDGE-001 | AC-001 | `.husky/commit-msg` | Valid message file with spaces passed through both wrapper contexts | PASS |

## Implementation Progress

### Completed

- Read-only audit and defect reproduction completed.
- Replaced dynamic `npx` execution with the hook-relative local executable.
- Verified valid and invalid messages through the generated Husky wrapper from
  both the parent and UI checkout contexts.
- Confirmed the lockfile with `npm ci --dry-run --ignore-scripts` and reran the
  existing Husky `prepare` script.

### Remaining

- None.

### Decisions and Requirement Changes

- The UI repository owns Commitlint and Husky. The parent checkout has no
  package manifest and only a local hook-path override, so dependencies remain
  at the UI boundary.

### Verification

- The commit-msg hook now derives the UI project root from its own location,
  normalizes the commit-message path before changing to that project so its
  configuration is found, and directly executes the repository-local binary.
  The redundant pre-commit invocation is inert because it never receives Git's
  commit-message-file argument.
- `UI/node_modules/.bin/commitlint --version` returned
  `@commitlint/cli@21.2.2`.
- The actual generated Husky wrapper accepted
  `feat(accounting): enhance payment outbox` and rejected an invalid Markdown
  file with Commitlint rule errors (`type-empty`, `subject-empty`, and
  `header-max-length`) from both checkout contexts.
- No `npx` or `npm exec` Commitlint invocation remains in active hook/package
  configuration.
- Final diff and whitespace review passed; no task-file hygiene findings require
  correction.
