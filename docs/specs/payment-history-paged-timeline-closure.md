# Payment History Paged Timeline Closure

## Status

Verified

## Problem and Goal

The visible payment-history timeline has migrated to the verified paged query contract, but the production SPA displays “Payments could not be loaded” even though the gateway returns a valid paged response. The refresh stream must remain usable after a read failure, must wait for a valid account, and must execute the real paged provider request exactly once for initial account activation.

## Scope

**Required:** Keep all visible timeline reads on `refreshPagedPaymentsHistory`; prevent invalid-account refreshes; retain the refresh subscription after request, mapping, or account-summary failures; add deterministic selected-account/retry coverage and real-provider HTTP-boundary coverage.

**Non-goals:** Backend, gateway, payment-command protocol, Mongo query, legacy compatibility endpoint, Angular/NGXS migration, and optimistic local timeline mutations.

## Repository Evidence and Unknowns

- **CONFIRMED:** `PaymentAccountState` stores `activeAccountGuid` as a string, but `PaymentsHistoryComponent` declared the selector as `Observable<Guid>` and called `accountId.equals(...)`. At runtime this throws before the history provider is invoked.
- **CONFIRMED:** The component also merged an initial `accountPayments$` emission, which could start a refresh before account readiness. The subscription handled errors only at its outer boundary, so any failure terminated later account activation and Retry.
- **CONFIRMED:** In a local browser smoke test, the active Priorank account showed the generic error while categories and contractors rendered. Retrying left the UI loading; the browser console contained no application error.
- **CONFIRMED:** The exact gateway request for the routed account returned HTTP 200 and one valid record. The missing-request claim in the screenshot is therefore not established by its filtered request list.
- **CONFIRMED:** The backend contract is `GET /accounting/payments-history/query/{paymentAccountId}` with the documented paging and filter query values.

## Requirements and Acceptance Criteria

- **REQ-001:** A timeline refreshes only for a valid selected account. **AC-001:** The selected account starts exactly one paged read with default query values.
- **REQ-002:** A read failure does not terminate future refreshes. **AC-002:** Retry with unchanged account and filters starts a new read and can clear the error on success.
- **REQ-003:** The real paged provider constructs the backend contract correctly. **AC-003:** Angular's HTTP testing backend receives one `GET` for a valid account with default parameters, preserves a valid mapped record, and omits cleared optional filters.
- **REQ-004:** Account changes retain cancellation safety. **AC-004:** The existing `switchMap` behavior remains responsible for obsolete account requests.

## Constraints

No skipped/weakened tests, arbitrary delays, duplicated query state, client-side filtering/sorting, or changes to the verified backend contract. Preserve existing command and selection ownership.

## Test and Verification Strategy

RED: reproduce the original selected-account failure in the browser and add regressions for initial selected-account loading and a failed read followed by Retry; the original selector invokes `String.equals` before HTTP and the outer error terminates Retry. Add a provider integration test that reaches `HttpTestingController`. GREEN: respect the selector's string contract, remove the premature trigger, and contain errors inside the per-request pipeline. Run focused Karma, typecheck, lint, build, and diff review.

## Implementation Plan

1. Add RED coverage for selected-account initialization and an error-resilient refresh stream.
2. Add real-provider HTTP-boundary coverage for default and cleared filters.
3. Filter invalid trigger emissions and contain errors without hiding them from the UI.
4. Run focused and broader validation, then update traceability.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation                        | Test / Evidence                                     | Status |
| ----------- | ------------------- | ------------------------------------- | --------------------------------------------------- | ------ |
| REQ-001     | AC-001              | Account-id trigger only               | Initial selected-account component test             | PASS   |
| REQ-002     | AC-002              | Per-refresh `catchError`              | Failed-read/Retry component test                    | PASS   |
| REQ-003     | AC-003              | Existing provider query serialization | `PaymentsHistoryProvider` + `HttpTestingController` | PASS   |
| REQ-004     | AC-004              | Existing `switchMap`                  | Focused component suite                             | PASS   |

## Implementation Progress

### Completed

- Production browser and gateway investigation.
- Focused component and provider regression suites.
- Browser verification on the original account and a switched second account.
- Typecheck, production build, and diff review.

### Decisions and Requirement Changes

- The supplied Network screenshot was filtered, but the reproduced failure has a stronger explanation: the active-account selector throws synchronously before the provider call. Gateway success independently proves the API has a valid response for the reproduced account.

### Verification

- RED evidence: before the correction, browser navigation reached `String.equals` on the selector value and threw before HTTP; the same outer error would terminate the refresh stream. The added initial-load and failed-read/Retry tests protect those boundaries.
- GREEN: focused component suite — 27/27 PASS; provider HTTP-boundary suite — 2/2 PASS.
- Full unit suite — 318/318 PASS.
- `npm run typecheck` — PASS.
- `npm run build:prod` — PASS with the existing 2.38 MB initial-bundle warning.
- Targeted Prettier check — PASS. Global `npm run lint` remains blocked by 54 pre-existing errors and 416 warnings outside this change.
- Browser smoke: the original account rendered its record after refresh; switching to a second account rendered that account's record without the load-error banner.
