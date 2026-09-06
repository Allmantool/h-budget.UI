# Payment Command Idempotency SPA

## Status

Verified

## Problem and Goal

Payment mutations currently regard the initial HTTP response as completion and reconcile the read model using fixed delays. Integrate the released payment-command contract so one user intent has one stable idempotency key and the UI completes only after the command reaches its terminal lifecycle state.

## Scope

**Required:** Send `Idempotency-Key` for payment create, update, and delete; retain a key for retries of an unchanged intent; track command status with bounded, sequential polling; distinguish uncertain transport outcomes, command failure, idempotency conflict, and projected completion; refresh payment and account state after projected completion; persist replayable pending commands in session storage before mutation send; recover them after refresh; add deterministic provider/executor/component tests.

**Non-goals:** Backend changes, idempotency for non-payment APIs, a global HTTP interceptor, a new state library, offline support, cross-tab coordination, and redesigning the editor.

**Optional / Follow-up:** Cross-tab, cross-browser, offline, and multi-device recovery.

## Repository Evidence and Unknowns

- **CONFIRMED:** Angular 21.2, NgModules, NGXS, and route-scoped accounting services are in use. `PaymentOperationsProvider` owns payment HTTP calls. The editor owns create/update/delete and currently uses a bounded fixed-delay projection read loop.
- **CONFIRMED:** The backend contract supplied with this task exposes `commandId`, `status`, and `isDuplicate`, with `Projected` and `Failed` terminal states and a command-status endpoint.
- **ASSUMED:** The existing gateway route prefix remains `accounting/payment-operations`; the status route therefore extends it as `/payment-operations/{accountId}/commands/{commandId}`.
- **UNKNOWN:** No backend error payload shape was supplied for a status `404`; it is treated as an unconfirmed observation rather than a fabricated command failure.
- **CONFIRMED:** The payment feature has no existing browser-storage abstraction. The route-scoped executor is shared by the primary accounting route and sidebar editor.

## Requirements and Acceptance Criteria

- **REQ-001:** Each payment create/update/delete intent sends a cryptographically strong client-generated idempotency key. **AC-001:** The provider sends the exact supplied header for all three mutation verbs.
- **REQ-002:** Same intent uses the same key; a material request change or a terminal failure starts a new intent. **AC-002:** Executor tests prove same-payload recovery reuses a key and changed payload receives a new key.
- **REQ-003:** A mutation response does not mean projected completion. **AC-003:** `Projected` completes and refreshes state; `Accepted`, `Published`, and `Persisted` are polled.
- **REQ-004:** Transport uncertainty is retryable, while a backend `Failed` or HTTP 409 is explicit and terminal. **AC-004:** Tests cover response-loss recovery, duplicate responses, `Failed`, and 409.
- **REQ-005:** Observation polling is bounded, sequential, and cancellation-aware. **AC-005:** The executor has one bounded cadence, checks its active callback before each request, and does not use `setInterval` or fixed projection reads.
- **REQ-006:** The editor maps command outcomes to accessible user-facing state. **AC-006:** It keeps an uncertain intent for Retry, clears terminal intents, and does not claim success before `Projected`.
- **REQ-007:** A pending intent is session-persisted before any mutation transport begins. **AC-007:** A deterministic test observes the registry entry before the mocked provider is invoked.
- **REQ-008:** A refreshed known command is observed without mutation replay. **AC-008:** Recovery calls status, reaches a terminal state, refreshes once on `Projected`, and removes only that registry entry.
- **REQ-009:** A refreshed unknown command replays the exact request with the original key. **AC-009:** Create, update, and delete recovery tests prove action data and idempotency identity are preserved.
- **REQ-010:** Storage is bounded and fail-safe. **AC-010:** Expired, corrupt, unsupported-version, and incomplete records are removed without API calls or application failure.

## Constraints

Keep the existing Angular/NGXS/provider architecture, no `any`, no global idempotency interceptor, no unsafe automatic retries for validation/auth/conflict responses, and no persisted raw payment request beyond the minimum replayable mutation data. Preserve unrelated pending changes to `project.json` and `src/assets/config.json`.

## Test and Verification Strategy

Use Jasmine unit tests with `HttpTestingController` for headers and endpoint contracts, and service/component tests with mocked provider responses for intent identity and lifecycle outcomes. Use immediate mocked statuses for lifecycle tests; timer-based polling is tested with fake timers where applicable. Run targeted tests, then `typecheck`, `lint`, `format:check`, `test:ci`, `build:prod`, and diff checks as supported.

## Implementation Plan

1. Define typed command contracts and extend the payment provider — mutation headers and status endpoint are testable.
2. Replace delay-based projection reconciliation with one reusable route-scoped command executor — same intent/retry and lifecycle outcomes are testable.
3. Connect the editor to executor outcomes and provide an explicit retry state — UI only completes on `Projected`.
4. Add session-backed pending-command persistence and route recovery — known commands poll; unknown commands replay exact requests with their original keys.
5. Complete verification, diff review, and traceability.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | PaymentOperationsProvider headers | 4 provider specs | PASS |
| REQ-002 | AC-002 | PaymentCommandExecutorService intent fingerprint | Same-key and changed-payload specs | PASS |
| REQ-003 | AC-003 | PaymentCommandExecutorService lifecycle tracker | Projected and Accepted-to-Projected specs | PASS |
| REQ-004 | AC-004 | Executor error matrix | Response-loss, duplicate, 409, and Failed specs | PASS |
| REQ-005 | AC-005 | Bounded sequential `timer` polling with active callback | Fake-timer polling spec and code review | PASS |
| REQ-006 | AC-006 | Editor uncertain state and retry affordance | Component retry spec | PASS |
| REQ-007 | AC-007 | PendingPaymentCommandRegistry | Persist-before-send spec | PASS |
| REQ-008 | AC-008 | Executor recovery | Known-command recovery specs | PASS |
| REQ-009 | AC-009 | Executor recovery | Create/update/delete replay specs | PASS |
| REQ-010 | AC-010 | PendingPaymentCommandRegistry | Expiry and malformed-storage specs | PASS |

## Browser Refresh Recovery

The payment route owns recovery through `PaymentCommandExecutorService`, which delegates all browser persistence to the route-scoped `PendingPaymentCommandRegistryService`. The registry uses exactly one session-scoped key, `home-ledger.payment-commands.pending.v1`. It stores a registry rather than a singleton so independent payment operations cannot overwrite one another.

The persisted record is versioned and contains only the data required to observe or replay one command:

```ts
interface PendingPaymentCommand {
  version: 1;
  intentId: string;
  action: 'create' | 'update' | 'delete';
  accountId: string;
  operationId?: string;
  idempotencyKey: string;
  commandId?: string;
  request?: {
    amount: number;
    categoryId: string;
    comment: string;
    contractorId: string;
    operationDate: string;
    operationId: string;
    operationType: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

`intentId` identifies the frontend operation, `idempotencyKey` preserves the backend identity, and `commandId` prevents a known command from being reissued. `accountId`, `operationId`, and the primitive create/update DTO fields reconstruct the exact API request. Delete records contain no artificial body. No headers, tokens, server response bodies, account history, or display-only data are written.

The executor writes the record **before** beginning the mutation. When an accepted response provides a `commandId`, it updates that record before polling or refreshing UI state. `PaymentsDashboardComponent` begins recovery as the route is reconstructed, rather than replaying commands globally at application startup.

### Known command

```text
refresh → restore commandId → GET command status → resume bounded polling → Projected → refresh state once → remove record
```

`Failed` is handled through the existing terminal failure path. A status transport failure leaves the record intact; it does not invent a backend failure or replay a known mutation.

### Unknown command

```text
refresh → restore replay request + K1 → send exact create/update/delete with K1 → persist commandId → poll → Projected → remove record
```

Recovery never generates a second key. A 409 remains a terminal conflict and does not mutate the stored request or retry with a new key. A materially changed editor request does not match the stored intent fingerprint, so normal submission creates a new intent/key instead of overwriting K1.

Cancelling before a command is submitted has no registry entry to remove. If the editor is cancelled after an uncertain send, the record remains recoverable because backend acceptance cannot be ruled out; cancelling UI state is not treated as proof that the command does not exist. A changed re-submission likewise receives K2 without overwriting K1, and K1 remains available for safe recovery until it reaches a terminal state or expires.

Records expire after 60 minutes from `createdAt`. This bounds sensitive payment data to the current active recovery period, while exceeding the executor's 21.5-second observation window enough to cover refresh and a user returning to the payment route. Expiry means only that automatic frontend recovery stops; it does not synthesize `Failed` on the backend. Invalid JSON, non-array storage, unsupported versions, invalid actions/dates/required fields, and invalid replay shapes are discarded without preventing application initialization.

`sessionStorage` is deliberately tab scoped. Refresh and Angular restart in the same tab are supported; closing the tab/browser, cross-tab synchronization, multi-device recovery, and durable offline replay are non-goals.

| Scenario | Contract | Evidence | Result |
| --- | --- | --- | --- |
| Refresh with `commandId` | Status observation resumes without mutation replay | Executor spec | PASS |
| Refresh without `commandId` | Exact request replays with the same key | Executor spec | PASS |
| Create recovery | Same account, DTO, and idempotency intent | Executor spec | PASS |
| Update recovery | Same operation ID, body, and key | Executor spec | PASS |
| Delete recovery | Same account, operation ID, and key | Executor spec | PASS |
| Changed payload | New intent/key; K1 is not overwritten | Executor spec | PASS |
| Expired pending intent | No automatic replay; entry removed | Registry/executor specs | PASS |
| Corrupted storage | Fail-safe discard without crash | Registry spec | PASS |
| `Projected` cleanup | Only terminal command entry is removed | Executor/registry specs | PASS |

## Implementation Progress

### Completed

- Definition of Ready: repository evidence, scope, contract assumptions, acceptance criteria, and test strategy recorded.
- Added explicit payment-command status contracts and an idempotency header on every payment mutation.
- Replaced fixed-delay projection reconciliation with a reusable route-scoped executor. It creates UUID keys, retries one transient transport failure with the same key, retains unknown intents for an explicit retry, polls non-terminal commands, and refreshes NGXS payment history plus the account balance only after `Projected`.
- Updated the editor to keep an uncertain intent for an unchanged Retry and reset it when the material request changes, the intent fails, conflicts, is cancelled, or the selected payment changes.
- Updated route-provider and response fixtures for the command contract.
- Added a versioned, 60-minute `sessionStorage` registry and payment-route recovery for known and response-lost commands.
- Added deterministic recovery coverage for recreation, create/update/delete replay, terminal cleanup, transient status-read retention, expiry, malformed records, and registry isolation.

### Remaining

- No implementation work remains.

### Decisions and Requirement Changes

- The idempotency intent is component-owned for its active editor workflow and represented by a typed object returned by the reusable executor. The executor decides reuse exclusively by an exact material-request fingerprint.
- Browser refresh is handled by one versioned session-storage registry with a 60-minute TTL. It is intentionally tab-scoped and may be cleared on browser/tab close; no cross-tab or durable offline guarantees are made.
- The executor intentionally uses a 10-step, 21.5-second sequential observation cadence. A poll timeout becomes `unknown`, never `Failed`; an inactive component prevents subsequent polling requests.

Path: `src/presentation/accounting/services/payment-command-executor.service.ts`
Rule/threshold: Production TypeScript 200-line design signal.
Reason: The single payment-command abstraction owns the closely coupled intent identity, one controlled mutation retry, lifecycle observation, and projected-store refresh.
Why decomposition would worsen the design: Splitting the short private lifecycle branches into separate services would add provider wiring without reducing the workflow's dependency surface.
Risk and mitigation: The public surface is three action methods; focused lifecycle tests protect the internal branches.
Removal condition or review date: Reassess if another command type needs the same behavior.

### Verification

- TDD: Recovery tests were added before completing the persistence/recovery implementation; focused test compilation and execution prove the resulting behavior.
- RED: Focused provider/executor tests initially failed to compile because `getCommandStatus` and `PaymentCommandExecutorService` did not exist. The first runtime executor cycle then exposed incorrect classification of a second transient transport failure as terminal; the test was corrected by returning `unknown` after the bounded retry.
- GREEN/REFACTOR: 5 focused executor specs and 6 focused provider/editor specs pass after introducing typed contracts, lifecycle ownership, `inject()`-based dependencies, and import/format cleanup.
- PASS: Focused recovery suite — 25 specs passed.
- PASS: `npx tsc --noEmit --project tsconfig.spec.json`.
- PASS: `npm run format:check`.
- PASS: `npm run lint` — 0 errors, 345 existing warnings.
- PASS: `npm run test:ci` — 278 specs passed; coverage statements 81.78%, branches 65.56%, functions 78.71%, lines 82.49%.
- PASS: `npm run build:prod` — production build completed; the existing 2.38 MB initial-bundle budget warning and SignalR diagnostics remain.
- PASS: `git diff --check`; unrelated pending changes to `project.json` and `src/assets/config.json` were preserved.
