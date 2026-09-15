# SPA lint remediation and mandatory quality gates

## Status

Verified

## Problem and Goal

The SPA lint target currently fails with four errors while the Codex governance package describes validation without making final lint and automated tests an explicit completion barrier. Restore a green lint target without changing business behavior, and make the real SPA lint/test commands mandatory final gates for future repository-modifying Codex tasks.

## Scope

**Required:**

- Correct the payment-history operation-type model boundary so transfer comparisons share `OperationTypes`.
- Correct the three lint-invalid test patterns in the accounting CRUD component spec.
- Add one cross-platform aggregate quality command using the existing lint check and non-watch CI test command.
- Extend the existing governance package with mandatory post-final-change lint/test execution and remediation rules.

**Non-goals:**

- Reduce the existing repository-wide warning baseline.
- Change ESLint rules, strictness, test discovery, CI behavior, or payment business behavior.
- Perform Angular dependency-injection or template migrations.

**Optional / Follow-up:**

- Reduce legacy warnings through separately scoped work.

## Repository Evidence and Unknowns

- **CONFIRMED:** `npm run lint:fix --verbose` reported 379 problems: 4 errors and 375 warnings on 2026-09-15.
- **CONFIRMED:** the lint check command is `npm run lint` (`nx lint`) and the non-watch full automated SPA suite is `npm run test:ci` (`nx test --watch=false --code-coverage --source-map=false --browsers=ChromiumNoSandbox`). CI runs those commands.
- **CONFIRMED:** `IPaymentRepresentationModel.operationType` is `number`, whereas source `IPaymentOperationModel.operationType` is `OperationTypes`; the representation mapper copies the source value unchanged.
- **CONFIRMED:** the CRUD spec drops the `compileComponents()` Promise, passes a provider member method directly to a matcher, and awaits the synchronous `TestBed.configureTestingModule` call.
- **ASSUMED:** no externally maintained warning-baseline mechanism exists; the current warning count is the baseline to preserve.
- **UNKNOWN:** final test execution may depend on a local Chromium environment; validate it directly.

## Requirements and Acceptance Criteria

- **REQ-001:** History representation records preserve the domain operation type as `OperationTypes`.
- **AC-001:** The transfer-label comparison is between `OperationTypes` values and history/component tests use named operation-type values.
- **REQ-002:** The accounting CRUD spec follows each API’s actual asynchronous and spy contract.
- **AC-002:** `compileComponents()` is awaited, `configureTestingModule()` is not awaited, and the transfer-delete assertion uses an explicit spy reference.
- **REQ-003:** Future Codex repository-modifying tasks must run final lint and non-watch automated tests after the final modification and remediate failures before completion.
- **AC-003:** The authoritative harness names the exact commands, prohibits reporting success while a gate fails, and documents remediation/re-run behavior.
- **REQ-004:** A reusable aggregate command propagates lint and test failures.
- **AC-004:** `npm run quality:gate` chains the existing lint check and `test:ci` without shell-specific control flow or failure suppression.

## Constraints

- Preserve existing SDD/TDD governance and Nx/Jasmine/Karma conventions.
- Do not suppress lint, weaken rules, use `any`, or skip tests.
- Keep warnings at or below the 375-warning baseline.

## Test and Verification Strategy

- TDD: Not Applicable — Reason: the production change tightens a compile-time model boundary without changing runtime behavior; the existing test changes repair test-harness usage. Verification: focused lint of touched paths, existing component tests, and final lint/test gates.
- Run `npm run lint`, `npm run test:ci`, and the aggregate `npm run quality:gate` after final changes. Inspect script chaining statically for failure propagation and full changed diff.

## Implementation Plan

1. Strengthen the representation model and update typed test fixtures — exit: transfer and payment fixtures use `OperationTypes`.
2. Repair the three asynchronous/spy test contracts — exit: focused lint has no errors.
3. Add the aggregate command and extend the existing authoritative governance/verification guidance — exit: future completion contract is explicit and non-duplicative.
4. Run final gates and complete traceability — exit: evidence is recorded from the final working tree.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | `operation-record.ts` and typed history fixtures | `npm run lint`; `npm run test:ci` | PASS |
| REQ-002 | AC-002 | CRUD component spec | `npm run lint`; `npm run test:ci` | PASS |
| REQ-003 | AC-003 | Root `AGENTS.md`; verification skill | Governance inspection; final `npm run quality:gate` | PASS |
| REQ-004 | AC-004 | `package.json` `quality:gate` | Static npm-script inspection; final `npm run quality:gate` | PASS |

## Implementation Progress

### Completed

- Read applicable Codex governance, Angular/Nx, SDD, TDD, verification, TypeScript, architecture, data-access, testing, and validation standards.
- Inspected package/Nx/project/ESLint/CI configuration and captured the lint baseline.
- Corrected the model/test lint errors without changing lint configuration or business behavior.
- Added the canonical aggregate command and the root mandatory SPA quality-gate contract.
- Verified `npm run lint` at 0 errors and 375 warnings, and `npm run test:ci` at 348 passing specs.

### In Progress

- None.

### Remaining

- None.

### Decisions and Requirement Changes

- Use `npm run quality:gate` because the namespace has no existing quality aggregate and it can safely compose existing cross-platform npm scripts.

### Verification

- Baseline lint: FAIL — 4 errors, 375 warnings.
- Focused final lint: PASS — 0 errors, 375 warnings.
- Full non-watch automated tests: PASS — 348 specs, 0 failures, 0 skipped.
- Aggregate quality gate: PASS — `npm run quality:gate` ran the final lint at 0 errors and 375 warnings, then the full `test:ci` suite at 348 passing specs.
