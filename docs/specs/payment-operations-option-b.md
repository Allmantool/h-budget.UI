# Payment Operations Option B

## Status

Verified — ready with documented backend limitations

## Problem and Goal

The payment editor represents unsaved data as a fake history record and performs ambiguous, retry-prone writes without an explicit lifecycle. Deliver the existing right-sidebar master-detail flow as a safe, responsive create/edit/delete experience.

## Scope

**Required:** Explicit create/edit editor mode; typed local form; validated, single-flight writes; removal of unsafe write retries; safe confirmed-store mutation; bounded projection reconciliation; delete confirmation; currency-aware amount, direction-filtered category/payee controls; responsive history/editor improvements; focused tests.

**Non-goals:** Backend contract changes, a new state library/component framework, dashboard rewrite, transfer-workflow redesign, persisted drafts.

**Optional / Follow-up:** Backend idempotency key and operation-status/correlated projection contracts.

## Repository Evidence and Unknowns

- **CONFIRMED:** POST/PATCH/DELETE return `Result` with `paymentOperationId`; history has a `byId` read endpoint; writes retry automatically; `Edit` splices at `findIndex` without guarding `-1`; the existing `right_sidebar` route hosts the editor.
- **ASSUMED:** A successful business result plus `paymentOperationId` means the command was accepted, not projected.
- **UNKNOWN:** Backend idempotency semantics, deletion projection SLA, and correlated payment notifications.

## Requirements and Acceptance Criteria

- **REQ-008:** Unsaved payment input is never silently abandoned. **AC-008:** Selection, new-payment mode, accounting navigation, and route deactivation proceed immediately when pristine and require an explicit keep-editing/discard decision when semantically dirty.
- **REQ-009:** History refreshes preserve a meaningful trigger received during an active read. **AC-009:** One active refresh may queue exactly one trailing refresh; the final history is published in request order.

- **REQ-001:** Confirmed operation state contains only server-confirmed records. **AC-001:** No `Guid.EMPTY` record is added for a new form; an unknown edit ID does not replace another record.
- **REQ-002:** Writes have a single explicit lifecycle. **AC-002:** Repeated submit causes one provider call; failed writes retain form values and show a safe error.
- **REQ-003:** Write acceptance is distinct from projection. **AC-003:** Create/update/delete enter a bounded reconciliation state before success/removal messaging.
- **REQ-004:** Editor actions are unambiguous. **AC-004:** Create shows New payment/Cancel/Create payment; edit shows Edit payment/Delete/Cancel/Save changes.
- **REQ-005:** Financial inputs are validated and accessible. **AC-005:** Amount is positive, numeric, currency-labelled, and errors are associated with the control.
- **REQ-006:** Delete is deliberate. **AC-006:** Persisted payment deletion requires confirmation and error recovery.
- **REQ-007:** Master/detail remains usable on mobile. **AC-007:** History has a compact mobile list and editor uses a full-width responsive surface.

## Constraints

Keep Angular Material, NGXS, current routing and providers. Do not retry non-idempotent writes. Preserve unrelated changes to `project.json` and `src/assets/config.json`.

## Test and Verification Strategy

Use Jasmine/TestBed regression tests for state unknown-ID safety, provider retry removal/business failure, service command validation, editor validation/single-flight/create-edit actions, and focused history interaction. Run focused tests, then typecheck, lint, test:ci, and production build where supported.

## Implementation Plan

1. Protect confirmed state and provider/service write behavior — no unsafe mutation or retry.
2. Replace fake draft editor with typed local create/edit form and lifecycle.
3. Add bounded projection reconciliation and safe failure UX.
4. Build responsive master-detail UI, confirmation, selector return flow, and history list.
5. Complete tests, review, and verification.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence                        | Status  |
| ----------- | ------------------- | -------------- | -------------------------------------- | ------- |
| REQ-001     | AC-001              | Complete       | Unknown-ID NGXS regression test        | PASS    |
| REQ-002     | AC-002              | Complete       | Editor and service single-flight tests | PASS    |
| REQ-003     | AC-003              | Complete       | Bounded reconciliation code/test       | PARTIAL |
| REQ-004     | AC-004              | Complete       | Editor template and focused tests      | PASS    |
| REQ-005     | AC-005              | Complete       | Form validation/template review        | PARTIAL |
| REQ-006     | AC-006              | Complete       | Confirmation implementation review     | PARTIAL |
| REQ-007     | AC-007              | Complete       | CSS/template review only               | PARTIAL |
| REQ-008     | AC-008              | Complete       | Leave coordinator and history interaction tests | PASS |
| REQ-009     | AC-009              | Complete       | Trailing-refresh and teardown regression tests | PASS |

## Implementation Progress

### Completed

- Definition of Ready: requirements, scope, risks, constraints, and verification strategy captured.
- Removed unsafe write retries; guarded unknown store edits; replaced fake drafts with local typed editor state.
- Added lifecycle messaging/reconciliation, confirmation-based deletion, created-entity selection, and responsive history records.
- Hardened reconciliation to validate update payload fields, stop after destruction/account changes, and distinguish accepted-but-delayed projection from a failed command.
- Corrected date-only mapping to preserve the local business date and restored compatibility with existing category/contractor-dialog unit tests.
- Added a route-scoped editor leave coordinator and Material confirmation dialog. Pristine editors leave immediately, semantically dirty editors require Keep editing or Discard changes, and in-flight submissions block leave.
- Guarded history selection, new-payment mode, related-transfer navigation, dashboard account navigation, and route deactivation through the same leave decision.
- Replaced dropped SSE refreshes with one-active/one-trailing projection refreshes, including teardown protection so queued reads cannot outlive the component.

### Remaining

- Explicit tests for business-result failures, lifecycle cancellation, delete outcomes, selector workflows, and responsive browser behavior.
- Backend idempotency/status capabilities and correlated projection notifications.
- Repository-wide lint debt: `npm run lint` passes with 347 warnings; the warnings need separate ownership verification.

### Decisions and Requirement Changes

- Local editor state replaces the `Guid.EMPTY` store placeholder (REQ-001) because a placeholder must never be treated as confirmed history.
- A route-scoped leave workflow (REQ-008) centralizes the authoritative dirty/submission decision. It uses a Material dialog only for meaningful local form changes; in-flight commands block leave rather than being abandoned.
- A serialized trailing refresh (REQ-009) retains one pending refresh while a history read is active, avoiding both lost notifications and unbounded queues.

### Verification

- RED: the unknown-ID edit regression exposed the unguarded `splice(-1, ...)` behavior.
- GREEN: focused state safety, editor single-flight, and delayed-projection recovery tests pass.
- PASS: focused payment-operation tests — 41 specs passed, including POST/PATCH/DELETE transport-failure no-retry coverage.
- PASS: `npm run test:ci` — 262 specs passed.
- PASS: `npm run typecheck`, `npm run build`, and `npm run build:prod`; builds passed with known third-party SignalR/esbuild diagnostics. The production bundle retains the existing 2.38 MB initial-bundle budget warning.
- PASS: `npm run lint` — 0 errors and 347 warnings. Option B errors were corrected; remaining warnings need separate ownership verification.
- PASS: `git diff --check`.

Path: `src/presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component.ts`
Rule/threshold: Component TypeScript 150-line design signal.
Reason: It currently owns editor mapping, submission lifecycle, and dialog orchestration while replacing a legacy monolith.
Why decomposition would worsen the design: Extracting before these new contracts are stabilized would be speculative.
Risk and mitigation: Extract reconciliation and mapping after E2E behavior is established.
Removal condition or review date: Before the next payment-editor behavior change.
