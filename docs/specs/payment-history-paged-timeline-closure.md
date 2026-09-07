# Payment History Paged Timeline Closure

## Status

Ready

## Problem and Goal

The visible payment-history timeline has migrated to the verified paged query contract, but its component tests still assert the retired unpaged refresh path. Complete the SPA lifecycle by making query state the one source of truth, correcting an invalid page after a destructive refresh, and covering deterministic paging, filters, stale responses, errors, and command-driven refreshes.

## Scope

**Required:** Keep all visible timeline reads on `refreshPagedPaymentsHistory`, migrate the eight obsolete component expectations, add deterministic component coverage for the specified query transitions and command effects, and correct a page only when the authoritative response says the requested page is invalid.

**Non-goals:** Backend, gateway, payment-command protocol, Mongo query, legacy compatibility endpoint, Angular/NGXS migration, and optimistic local timeline mutations.

## Repository Evidence and Unknowns

- **CONFIRMED:** `PaymentsHistoryComponent` owns one `IPaymentHistoryQueryModel` signal and uses `switchMap` for its timeline refresh stream.
- **CONFIRMED:** `PaymentCommandExecutorService` refreshes command projection state; that state emission triggers the timeline's current paged query.
- **CONFIRMED:** The focused component suite has eight failures, all caused by expectations of `refreshPaymentsHistory` or values supplied through it.
- **CONFIRMED:** The response carries `page`, `totalPages`, counts, and navigation flags required for bounded corrective paging.
- **UNKNOWN:** A real browser test is not required because the existing Karma/TestBed harness can deterministically prove these local component transitions.

## Requirements and Acceptance Criteria

- **REQ-001:** Account and query changes issue one authoritative paged request. **AC-001:** Page, page size, sorting, and filters sent to the service match query state.
- **REQ-002:** Stale account requests cannot render after a newer active account request. **AC-002:** A delayed Account A response cannot overwrite Account B rows, metadata, loading, or error state.
- **REQ-003:** Paging/filter/sort actions mutate only the intended query fields. **AC-003:** Resets and preserved fields match the query contract.
- **REQ-004:** A destructive refresh corrects only an out-of-range page. **AC-004:** Page 4 of an authoritative 3-page result performs one corrective page-3 request; page 1 remains page 1 when empty.
- **REQ-005:** Projected create, update, and delete refresh the current query without optimistic local rows. **AC-005:** A selected deleted operation is cleared by the existing projected-delete editor flow.

## Constraints

No skipped/weakened tests, arbitrary delays, duplicated query state, client-side filtering/sorting, or changes to the verified backend contract. Preserve existing command and selection ownership.

## Test and Verification Strategy

RED: run the existing focused component suite (8 failures), then add deterministic Subject-backed regression tests for stale response and invalid-page correction before production changes. GREEN: implement the smallest query-response correction. Run focused Karma, typecheck, lint, build, and diff review.

## Implementation Plan

1. Migrate obsolete focused tests to paged-service expectations — all eight failures classified and replaced by equivalent business assertions.
2. Add red tests for stale response and invalid-page correction — behavior observable through paged requests and rendered state.
3. Add the bounded correction to response handling and command/query transition coverage — focused suite green.
4. Run release validation and update traceability.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | Query signal and paged service | Focused component suite | NOT RUN |
| REQ-002 | AC-002 | Existing `switchMap` lifecycle | Subject-backed component test | NOT RUN |
| REQ-003 | AC-003 | Existing query mutation methods | Component interaction tests | NOT RUN |
| REQ-004 | AC-004 | Bounded response correction | Component regression tests | NOT RUN |
| REQ-005 | AC-005 | Existing projection/store lifecycle | Component and CRUD regression tests | NOT RUN |

## Implementation Progress

### Completed

- Readiness investigation and unchanged focused-suite baseline: 18 passing, 8 failing.

### In Progress

- Test migration and missing lifecycle coverage.

### Remaining

- Implementation and validation.

### Decisions and Requirement Changes

- The eight failures are test migrations, not product defects: each asserts retired unpaged mechanics rather than server-authoritative paged behavior.

### Verification

- RED baseline: `npx nx test h-budget --include=src/tests/accounting/components/payments-history.component.spec.ts --watch=false --browsers=ChromiumNoSandbox` — FAIL, 8 failures.
