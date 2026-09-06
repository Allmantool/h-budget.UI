# Payment History CRUD UX

## Status

Implemented — focused browser verification passed; release assessment remains conservative pending end-to-end viewport coverage.

## Problem and goal

The payment editor currently derives create/edit mode solely from the selected NGXS row. A projected create selects the new row, which forces the editor into Edit mode and makes sequential entry of payments awkward. Deliver an explicit, accessible create/edit workflow with projection-confirmed mutation feedback while preserving the existing payment-command lifecycle and browser recovery.

## Confirmed repository facts

- `AccountingOperationsCrudComponent` derives its mode from the selected operation and selects a projected create result.
- `PaymentCommandExecutorService` owns idempotency keys, command polling, projected refresh, and session-backed recovery; it remains authoritative.
- The editor and history are sibling route-outlet components, so short-lived shared UI state needs route scope rather than a new NGXS/global store.
- Payment history uses the stable operation GUID and SignalR-triggered/read-model refresh.

## Requirements

- **REQ-PH-CRUD-01:** A user can create Payment B immediately after Payment A projects. **AC:** AC-01, AC-08 to AC-10, AC-30.
- **REQ-PH-CRUD-02:** Editor mode is explicit and separate from selection. **AC:** AC-02 to AC-07, AC-17 to AC-19.
- **REQ-PH-CRUD-03:** A created or updated row receives a 2-second, projection-confirmed, non-colour-only marker. **AC:** AC-11 to AC-16.
- **REQ-PH-CRUD-04:** Unknown outcomes retain their original retry identity and existing session recovery. **AC:** AC-20 to AC-24.
- **REQ-PH-CRUD-05:** History selection and responsive presentations are accessible and history has clear loading, empty, and read-failure states. **AC:** AC-25 to AC-28.
- **REQ-PH-CRUD-06:** Unsaved changes are detected by normalized editable values relative to an explicit baseline, not interaction dirtiness. **AC:** AC-31 to AC-39.
- **REQ-PH-CRUD-07:** Editor title, primary action, and destructive actions consistently derive from explicit editor mode. **AC:** AC-40 to AC-42.

## Scope and constraints

Keep Angular, NGXS, the command executor, pending-command registry, command-status endpoint, SignalR, and existing routes. Do not add a global state library, optimistic completion, backend changes, arbitrary consistency delays, or a page redesign. A route-scoped UI coordination service may own explicit editor mode and transient mutation feedback.

## Test strategy

Use Jasmine/TestBed component and route-scoped service tests. Fake timers prove marker expiry. Component tests cover sequential create, create-from-edit, update retention, stale selection reconciliation, keyboard/card semantics, and history state rendering. Existing executor/registry recovery tests remain regression protection.

## Implementation order

1. Add failing tests for route-scoped editor/mutation state and the history Add action.
2. Add explicit editor-session and recent-mutation state.
3. Change CRUD transitions and unknown-outcome dismissal semantics.
4. Add history toolbar, accessible state rendering, loading/empty/error UI, and table overflow.
5. Update traceability and run focused then broader validation.

## Traceability

| Requirement | Implementation | Tests | Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-PH-CRUD-01 | Editor session + CRUD create transition | CRUD/history components | ChromeHeadless focused Karma suite | PASS |
| REQ-PH-CRUD-02 | Editor session + selection reconciliation | CRUD/history components | ChromeHeadless focused Karma suite | PASS |
| REQ-PH-CRUD-03 | Mutation feedback service + history states | session/history components | Fake-timer ChromeHeadless tests | PASS |
| REQ-PH-CRUD-04 | Existing executor/registry plus editor retention | CRUD/executor regression | ChromeHeadless focused Karma suite | PASS |
| REQ-PH-CRUD-05 | History template/styles | History component | ChromeHeadless focused Karma suite | PASS |
| REQ-PH-CRUD-06 | CRUD normalized baseline and leave guard | CRUD component | ChromeHeadless focused Karma suite | PASS |
| REQ-PH-CRUD-07 | Shared explicit session mode in CRUD template | CRUD component | ChromeHeadless focused Karma suite | PASS |

## Implementation progress

### Completed

- Added a route-scoped `PaymentEditorSessionService`. It owns only explicit editor mode and queued/recent UI feedback; NGXS still owns selection and the existing executor/registry still own command/recovery state.
- Added persistent history-header Add payment actions, explicit create/edit transitions, clean projected-create/delete transitions, stale-selection reconciliation, accessible roving row focus, responsive selected/recent card states, table overflow, and clear history loading/empty/error presentations.
- Added deterministic fake-timer coverage for the two-second marker and component coverage for projected create reset, Add from edit, selected-plus-updated styling, stale selection, and retained uncertain retry identity.
- Replaced serialized raw-form comparison with a normalized editable-value baseline. Reverting a material change, restoring a value, or loading a record programmatically now returns the form to a clean semantic state.
- Reset editor mode, selection, and transient mutation state when the active account actually changes, without touching the durable command-recovery registry.
- Removed unreachable `accepted` and `projectionDelayed` editor submission variants rather than presenting states the component cannot produce.

### Verification

- **RED:** `npx tsc --noEmit --project tsconfig.spec.json` failed as expected before the new editor-session service existed.
- **PASS:** `npx tsc --noEmit --project tsconfig.app.json`, `npx tsc --noEmit --project tsconfig.spec.json`, `npm run format:check`, and `git diff --check` complete successfully. Prettier emits the repository's existing ignored `semicolon` option warnings.
- **PASS:** focused `nx test` completes in ChromeHeadless: 50 specs, 0 failures.
- **PASS:** `npm run lint` completes with 0 errors (370 pre-existing warnings).
- **PASS:** `npm run build:prod` completes successfully. The configured initial-bundle budget emits its existing warning (2.38 MB versus 2 MB).
- **NOT VERIFIED:** end-to-end account switching and manual viewport checks; no E2E target exists in this workspace.
