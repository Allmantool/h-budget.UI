# Accounting Dashboard Payment History Timeline

## Status

Implemented — browser acceptance not run

## Problem and Goal

The Accounting Dashboard receives the supplied nested payment-history item for
`ccca2b39-c8b6-4aa8-b44b-3ef2112ff042`, but the timeline remains empty when
handbook display mapping throws. A valid payment-history item must map to and
render as a history row without relying on prototype methods attached to HTTP
JSON arrays.

## Scope

**Required:** Prove and correct the timeline representation failure at the
handbook-name formatting boundary; add deterministic regression coverage; keep
the existing history envelope, nested DTO mapping, NGXS update, account
selection, date-only parsing, and timeline UI behavior intact.

**Non-goals:** Changes to the backend contract, financial direction rules,
handbook loading policy, global state architecture, routes, realtime behavior,
or unrelated existing worktree changes.

## Repository Evidence and Unknowns

- **CONFIRMED:** `PaymentsHistoryProvider` reads `Result.payload` and maps
  `IPaymentHistoryEntity { record, balance }` through
  `PaymentHistoryMappingProfile` and `PaymentOperationsMappingProfile`.
- **CONFIRMED:** `PaymentsHistoryService.refreshPaymentsHistory()` dispatches
  nested `record` values to `AccountingOperationsState` in `tap`, then invokes
  `PaymentRepresentationsMappingProfile` in a later RxJS `map`.
- **CONFIRMED:** `PaymentRepresentationsMappingProfile.getRepresentationView()`
  invokes `handbookPayload.nameNodes.parseToTreeAsString()`.
- **CONFIRMED:** category and contractor HTTP DTOs declare `nameNodes:
  string[]`; their data profiles and NGXS state preserve the array as plain
  serializable data.
- **CONFIRMED:** `parseToTreeAsString()` is a global `Array.prototype`
  augmentation in `src/domain/extensions/handbookExtensions.ts`. Production
  source does not import that side-effect module, while the mapper spec does.
- **CONFIRMED:** an exception in the representation `map` prevents the
  component subscription from calling `publishPayments`, leaving its initial
  `BehaviorSubject([])` datasource unchanged. The summary reads the NGXS
  operations state populated earlier in `tap`.
- **CONFIRMED:** The configured gateway returned normal JSON arrays for the
  supplied category (`['category', 'two', 'expense']`) and contractor
  (`['Parties', 'one']`); neither has a runtime `parseToTreeAsString` method.

## Requirements and Acceptance Criteria

- **REQ-001:** Plain, JSON-deserialized handbook name arrays are formatted
  without a prototype extension. **AC-001:** The representation mapper formats
  category and contractor `string[]` values as the existing colon-separated
  label and does not throw.
- **REQ-002:** A valid nested history item is not lost during presentation
  enrichment. **AC-002:** A history item matching the supplied record shape
  reaches one representation row with its key, date, amount, balance, and
  comment preserved.
- **REQ-003:** Existing behavior remains intact. **AC-003:** Missing handbook
  entries retain the established `N/A` label behavior and no date, envelope, or
  account-selection behavior changes.

## Constraints

Use the existing Angular/NGXS and Dynamic Mapper architecture. Do not make the
prototype call optional or swallow mapping errors. Keep DTO/state models plain
and serialization-safe. Preserve unrelated dirty files.

## Test and Verification Strategy

RED: remove the test-only global extension side effect and add a mapper test
using the supplied nested-history shape and ordinary arrays; confirm current
production code throws. GREEN: format the declared array DTO directly; rerun
the focused mapper spec. Then run typecheck, lint, format check, affected test
suite, production build, and diff review as executable.

## Implementation Plan

1. Establish the mapper regression with plain array DTO data — failure proves
   the runtime contract mismatch.
2. Replace the prototype-dependent formatter with a typed, array-based mapping
   operation — history mapping emits a row.
3. Run proportionate verification and update this record with evidence.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | Direct `string[]` formatting in the mapper and selectors | Focused mapper suite: 6/6 PASS | PASS |
| REQ-002 | AC-002 | Representation mapper keeps the mapped history entry | Exact live-fixture regression and full Karma suite: 283/283 PASS | PASS |
| REQ-003 | AC-003 | Existing `N/A` behavior retained | Existing missing-handbook tests and diff review | PASS |

## Implementation Progress

### Completed

- Repository, route/provider/state/mapper/component flow audit.
- Definition of Ready based on source evidence.
- RED/GREEN mapper regression cycle using the supplied record and live handbook
  payload shapes.
- Serialization-safe formatter implementation and equivalent selector updates.
- Focused and full automated validation.

### Remaining

- Browser acceptance against the local development server could not run because
  the available in-app browser cannot reach the host-local `vm2.linux:4200`
  server. Account switching and browser refresh remain unexecuted.

### Decisions and Requirement Changes

- Plain `string[]` formatting is the architecture-consistent boundary because
  the source DTO and NGXS models are serializable arrays; no rich handbook
  class exists to reconstruct.

### Verification

- RED: with the original prototype call restored, focused Karma failed 6/6 at
  `PaymentRepresentationsMappingProfile.getRepresentationView()` with the
  reported `TypeError`.
- GREEN: focused mapper suite passed 6/6 after the direct array formatter was
  restored.
- `npm run typecheck` — PASS.
- `npm run format:check` — PASS (existing ignored `semicolon` option warnings).
- `npm run lint` — PASS with 0 errors and 344 pre-existing warnings.
- `npm run test:ci` — PASS, 283/283 tests.
- `npm run build:prod` — PASS; existing initial bundle budget warning remains.
- `git diff --check` — PASS.
