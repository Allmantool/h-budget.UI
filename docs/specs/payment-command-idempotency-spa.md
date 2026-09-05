# Payment Command Idempotency SPA

## Status

Verified

## Problem and Goal

Payment mutations currently regard the initial HTTP response as completion and reconcile the read model using fixed delays. Integrate the released payment-command contract so one user intent has one stable idempotency key and the UI completes only after the command reaches its terminal lifecycle state.

## Scope

**Required:** Send `Idempotency-Key` for payment create, update, and delete; retain a key for retries of an unchanged intent; track command status with bounded, sequential polling; distinguish uncertain transport outcomes, command failure, idempotency conflict, and projected completion; refresh payment and account state after projected completion; add deterministic provider/executor/component tests.

**Non-goals:** Backend changes, idempotency for non-payment APIs, a global HTTP interceptor, a new state library, offline support, cross-tab coordination, and redesigning the editor.

**Optional / Follow-up:** Browser-refresh recovery. It would require persisting the exact payment request to safely retry a response-lost command whose command ID is unknown; this financial-data persistence is not justified by the current route-scoped workflow.

## Repository Evidence and Unknowns

- **CONFIRMED:** Angular 21.2, NgModules, NGXS, and route-scoped accounting services are in use. `PaymentOperationsProvider` owns payment HTTP calls. The editor owns create/update/delete and currently uses a bounded fixed-delay projection read loop.
- **CONFIRMED:** The backend contract supplied with this task exposes `commandId`, `status`, and `isDuplicate`, with `Projected` and `Failed` terminal states and a command-status endpoint.
- **ASSUMED:** The existing gateway route prefix remains `accounting/payment-operations`; the status route therefore extends it as `/payment-operations/{accountId}/commands/{commandId}`.
- **UNKNOWN:** No backend error payload shape was supplied for a status `404`; it is treated as an unconfirmed observation rather than a fabricated command failure.

## Requirements and Acceptance Criteria

- **REQ-001:** Each payment create/update/delete intent sends a cryptographically strong client-generated idempotency key. **AC-001:** The provider sends the exact supplied header for all three mutation verbs.
- **REQ-002:** Same intent uses the same key; a material request change or a terminal failure starts a new intent. **AC-002:** Executor tests prove same-payload recovery reuses a key and changed payload receives a new key.
- **REQ-003:** A mutation response does not mean projected completion. **AC-003:** `Projected` completes and refreshes state; `Accepted`, `Published`, and `Persisted` are polled.
- **REQ-004:** Transport uncertainty is retryable, while a backend `Failed` or HTTP 409 is explicit and terminal. **AC-004:** Tests cover response-loss recovery, duplicate responses, `Failed`, and 409.
- **REQ-005:** Observation polling is bounded, sequential, and cancellation-aware. **AC-005:** The executor has one bounded cadence, checks its active callback before each request, and does not use `setInterval` or fixed projection reads.
- **REQ-006:** The editor maps command outcomes to accessible user-facing state. **AC-006:** It keeps an uncertain intent for Retry, clears terminal intents, and does not claim success before `Projected`.

## Constraints

Keep the existing Angular/NGXS/provider architecture, no `any`, no global idempotency interceptor, no unsafe automatic retries for validation/auth/conflict responses, and no persisted raw payment request. Preserve unrelated pending changes to `project.json` and `src/assets/config.json`.

## Test and Verification Strategy

Use Jasmine unit tests with `HttpTestingController` for headers and endpoint contracts, and service/component tests with mocked provider responses for intent identity and lifecycle outcomes. Use immediate mocked statuses for lifecycle tests; timer-based polling is tested with fake timers where applicable. Run targeted tests, then `typecheck`, `lint`, `format:check`, `test:ci`, `build:prod`, and diff checks as supported.

## Implementation Plan

1. Define typed command contracts and extend the payment provider — mutation headers and status endpoint are testable.
2. Replace delay-based projection reconciliation with one reusable route-scoped command executor — same intent/retry and lifecycle outcomes are testable.
3. Connect the editor to executor outcomes and provide an explicit retry state — UI only completes on `Projected`.
4. Complete verification, diff review, and traceability.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | PaymentOperationsProvider headers | 4 provider specs | PASS |
| REQ-002 | AC-002 | PaymentCommandExecutorService intent fingerprint | Same-key and changed-payload specs | PASS |
| REQ-003 | AC-003 | PaymentCommandExecutorService lifecycle tracker | Projected and Accepted-to-Projected specs | PASS |
| REQ-004 | AC-004 | Executor error matrix | Response-loss, duplicate, 409, and Failed specs | PASS |
| REQ-005 | AC-005 | Bounded sequential `timer` polling with active callback | Fake-timer polling spec and code review | PASS |
| REQ-006 | AC-006 | Editor uncertain state and retry affordance | Component retry spec | PASS |

## Implementation Progress

### Completed

- Definition of Ready: repository evidence, scope, contract assumptions, acceptance criteria, and test strategy recorded.
- Added explicit payment-command status contracts and an idempotency header on every payment mutation.
- Replaced fixed-delay projection reconciliation with a reusable route-scoped executor. It creates UUID keys, retries one transient transport failure with the same key, retains unknown intents for an explicit retry, polls non-terminal commands, and refreshes NGXS payment history plus the account balance only after `Projected`.
- Updated the editor to keep an uncertain intent for an unchanged Retry and reset it when the material request changes, the intent fails, conflicts, is cancelled, or the selected payment changes.
- Updated route-provider and response fixtures for the command contract.

### Remaining

- Browser-refresh recovery and cross-tab recovery remain intentionally out of scope.

### Decisions and Requirement Changes

- The idempotency intent is component-owned for its active editor workflow and represented by a typed object returned by the reusable executor. The executor decides reuse exclusively by an exact material-request fingerprint.
- Pending intents are route-lifecycle safe, not browser-refresh persistent. No raw financial request is stored in browser storage.
- The executor intentionally uses a 10-step, 21.5-second sequential observation cadence. A poll timeout becomes `unknown`, never `Failed`; an inactive component prevents subsequent polling requests.

Path: `src/presentation/accounting/services/payment-command-executor.service.ts`
Rule/threshold: Production TypeScript 200-line design signal.
Reason: The single payment-command abstraction owns the closely coupled intent identity, one controlled mutation retry, lifecycle observation, and projected-store refresh.
Why decomposition would worsen the design: Splitting the short private lifecycle branches into separate services would add provider wiring without reducing the workflow's dependency surface.
Risk and mitigation: The public surface is three action methods; focused lifecycle tests protect the internal branches.
Removal condition or review date: Reassess if another command type needs the same behavior.

### Verification

- RED: Focused provider/executor tests initially failed to compile because `getCommandStatus` and `PaymentCommandExecutorService` did not exist. The first runtime executor cycle then exposed incorrect classification of a second transient transport failure as terminal; the test was corrected by returning `unknown` after the bounded retry.
- GREEN/REFACTOR: 5 focused executor specs and 6 focused provider/editor specs pass after introducing typed contracts, lifecycle ownership, `inject()`-based dependencies, and import/format cleanup.
- PASS: `npx tsc --noEmit --project tsconfig.spec.json`.
- PASS: `npm run format:check`.
- PASS: `npm run lint` — 0 errors, 346 existing warnings.
- PASS: `npm run test:ci` — 265 specs passed; coverage statements 81.88%, branches 63.88%, functions 79.11%, lines 82.37%.
- PASS: `npm run build:prod` — production build completed; pre-existing initial-bundle budget warning remains (2.38 MB vs 2.00 MB) and existing SignalR indirect-`require` diagnostics were emitted.
- PASS: `git diff --check` and relevant diff/self-review. Unrelated pending changes to `project.json` and `src/assets/config.json` were preserved.
