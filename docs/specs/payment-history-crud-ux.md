# Payment History CRUD UX

## Status

Implemented — focused datepicker verification passed; release assessment remains conservative pending the complete end-to-end matrix.

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
- **REQ-PH-CRUD-04:** Selection, editor mode, pending commands, and recent mutation feedback remain independent. **AC:** AC-15, AC-23, AC-24.
- **REQ-PH-CRUD-05:** Unknown outcomes retain their original retry identity and existing session recovery. **AC:** AC-20 to AC-22.
- **REQ-PH-CRUD-06:** History selection and responsive presentations are accessible and history has clear loading, empty, and read-failure states. **AC:** AC-25 to AC-28.
- **REQ-PH-CRUD-07:** Unsaved changes are detected by normalized editable values relative to an explicit baseline, not interaction dirtiness. **AC:** AC-31 to AC-39.
- **REQ-PH-CRUD-08:** Row-to-row navigation is safe and atomic. **AC:** AC-31, AC-32, AC-37.
- **REQ-PH-CRUD-09:** Editor title, primary action, and destructive actions consistently derive from explicit editor mode. **AC:** AC-40 to AC-42.
- **REQ-PH-CRUD-10:** Payment date uses the existing Angular Material calendar picker and preserves the date-only API contract. **AC:** AC-43, AC-44, AC-49, AC-51, AC-53, AC-54, AC-56.
- **REQ-PH-CRUD-11:** Date changes participate in semantic dirty-state comparison. **AC:** AC-45 to AC-48, AC-50.
- **REQ-PH-CRUD-12:** Date handling preserves the local date-only business value without UTC drift. **AC:** AC-52.
- **REQ-PH-CRUD-13:** Future payment dates remain valid for scheduled operations. **AC:** AC-49.
- **Engineering constraint:** Production consistency must not depend on arbitrary sleeps. **AC:** AC-29.
- **Conditional DateOnly criterion:** A time picker is required only if the domain persists time-of-day. The confirmed `DateOnly` contract makes AC-55 not applicable; AC-56 requires that no fake Time field is exposed.

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
| REQ-PH-CRUD-04 | Route session + NGXS + executor/registry boundaries | CRUD/history/executor components | Focused ChromeHeadless suite | PASS |
| REQ-PH-CRUD-05 | Existing executor/registry plus editor retention | CRUD/executor regression | Focused ChromeHeadless suite | PASS |
| REQ-PH-CRUD-06 | History template/styles | History component | Focused ChromeHeadless suite | PASS |
| REQ-PH-CRUD-07 | CRUD normalized baseline and leave guard | CRUD component | Focused ChromeHeadless suite | PASS |
| REQ-PH-CRUD-08 | History leave guard before row selection/Add dispatch | History component | Focused ChromeHeadless suite | PASS |
| REQ-PH-CRUD-09 | Shared explicit session mode in CRUD template | CRUD component | Focused ChromeHeadless suite | PASS |
| REQ-PH-CRUD-10 | Material datepicker, local calendar-date form mapping | CRUD component + mapper contract | Focused datepicker + mapper tests | PASS |
| REQ-PH-CRUD-11 | Normalized local-date baseline | CRUD component | Focused datepicker tests | PASS |
| REQ-PH-CRUD-12 | Local `Date` construction + mapper `yyyy-MM-dd` serialization | CRUD component + mapper | Focused mapper/component tests | PASS |
| REQ-PH-CRUD-13 | No picker maximum and valid future form value | CRUD component | Focused datepicker tests | PASS |

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

## Date contract decision

- **CONFIRMED:** The Accounting API accepts `DateOnly OperationDate`; payment command fingerprints canonicalize it as `yyyy-MM-dd`; and the SPA mapper serializes the local `Date` with `date-fns` `yyyy-MM-dd` formatting.
- **Decision:** Use the installed Angular Material native datepicker with a local `Date` form value. Do not expose a time control because the contract intentionally has no time-of-day field.
- **Timezone constraint:** Construct and normalize values using the local calendar day. Do not serialize a picker value with `toISOString()`, which can shift the business date in non-UTC timezones.

## Datepicker implementation plan

1. Add a failing component test proving that the Date field exposes the Material calendar trigger.
2. Change the editor form's `operationDate` from an HTML date string to a local `Date` and use the existing Material native datepicker modules.
3. Preserve mapper-owned `yyyy-MM-dd` request serialization and add deterministic date baseline tests.

## Datepicker verification

- **RED:** The focused CRUD browser test failed before the implementation because no `mat-datepicker-toggle` existed.
- **GREEN:** Focused ChromeHeadless Karma tests pass after the picker change, covering the calendar trigger, projected local-date initialization, date-only semantic dirty state, date restore, and future date validity.
- **Regression evidence:** The existing payment-operation mapper test passes for local date-only parsing and `yyyy-MM-dd` request serialization.
