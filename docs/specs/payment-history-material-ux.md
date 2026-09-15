# Payment History Material UX

## Status

**Implemented; ready with limitations** — 2026-09-10

## Evidence and problem statement

### Confirmed

- `PaymentsHistoryComponent` reads the paged history contract through
  `PaymentsHistoryService.refreshPagedPaymentsHistory`; it does not load an
  unbounded client-side collection.
- The existing editor uses `PaymentEditorLeaveService`,
  `PaymentEditorSessionService`, and `PaymentCommandExecutorService`; these
  preserve idempotency, pending-command recovery, projection observation, and
  dirty-form protection outside the timeline.
- The timeline uses server-side pagination and sorting. Its first load must
  not overwrite a newer account selection or a notification-triggered refresh.
- `recordsCount` is the number of rows in the current page, although the API
  exposes `totalCount`. The old label therefore did not declare its scope.
- The table stylesheet has `min-height: 48em`, creating a large empty surface
  for short result sets.
- Initial loading, retained-data refresh failure, and a generic empty state
  exist; the generic empty state does not distinguish an empty account from a
  filter with no matches.

### Screenshot observations

The supplied brief describes zero-valued dashboard summary cards with a
visible expense. This implementation cannot prove a calculation defect from
that observation: dashboard summary values come from the NGXS operations
collection whereas this component presents the paged history response. This
change makes the timeline scope explicit and does not invent a filtered-total
calculation from a page.

## Scope

Improve the payment-history timeline's Material consistency, feedback, scope
clarity, and responsive presentation. Preserve API/query contracts, server-side
pagination/sorting, account balance refresh, realtime refresh, editor routing,
and the payment command lifecycle.

### Non-goals

- Replacing the editor, command executor, pending-command registry, or server
  history contract.
- Recalculating account-wide dashboard totals from a paged result.
- Adding exports, bulk actions, optimistic transactions, or a new state store.

## Requirements and acceptance criteria

| ID     | Requirement and acceptance criterion                                                                                                      | Implementation                                                                                                              | Evidence                                        | Status           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------- |
| UX-01  | Filters and pagination use Material controls; primary/secondary actions have a consistent hierarchy.                                      | Material form fields/selects, paginator, refresh action.                                                                    | Focused component test; full CI suite.          | PASS             |
| UX-02  | Short result sets size naturally; compact cards are usable below 900px.                                                                   | Remove fixed table height; bounded desktop overflow and mobile cards.                                                       | CSS/template review; production build.          | PASS             |
| UX-03  | Applied query is explicit; Apply resets page, Clear restores defaults, active-filter count and result counts declare server-result scope. | Draft filter signal, validation, `totalCount` label.                                                                        | Focused component test; full CI suite.          | PASS             |
| UX-04  | Timeline values retain authoritative formatted row/balance values; no page total is represented as an account total.                      | Existing mapper/pipes retained; page scope label.                                                                           | Existing mapper/component tests and inspection. | Pass (existing)  |
| UX-05  | Initial, updating, failure, account-empty, and filter-empty states are distinct and actionable.                                           | Scoped progress/status and state copy.                                                                                      | Focused component test; full CI suite.          | PASS             |
| UX-06  | Create/edit/delete command feedback remains owned by the existing editor and command executor.                                            | Add action plus visible labelled row Edit action route to existing editor; delete remains confirmation-gated in the editor. | Focused component test and existing CRUD tests. | PASS             |
| UX-07  | Query changes retain current rows while loading, and a notification during a refresh produces one final current-account refresh.          | Retained rows plus request-id/queued-refresh coordination.                                                                  | Focused component concurrency test.             | PASS             |
| UX-08  | Idempotency, recovery, and leave protection remain intact.                                                                                | No executor/session/guard changes.                                                                                          | Existing CRUD/service tests and inspection.     | Pass (preserved) |
| UX-09  | Status text, busy state, keyboard-accessible Material controls, and non-colour status text are present.                                   | Live status, `aria-busy`, labelled controls.                                                                                | Focused component test; template review.        | PASS             |
| UX-10  | Deterministic unit coverage and applicable SPA checks are run.                                                                            | Focused TDD additions and final validation.                                                                                 | Verification section.                           | PASS with limit  |
| DEV-01 | A Windows dev-server recovery procedure must verify the Vite cache is not in use before clearing only its resolved project path.          | Runbook uses port ownership and resolved-path checks before targeted cleanup.                                               | `docs/runbooks/angular-dev-server-windows.md`.  | PASS             |
| DEV-02 | The EPERM report and HTTP/2 warning must be investigated with traced evidence, not silenced.                                              | Cold/warm/HMR diagnostics ran with `NODE_OPTIONS=--trace-warnings`; no suppression added.                                   | Runbook evidence.                               | PASS with limit  |
| DEV-03 | Reproducible normal startup, safe recovery, and opt-in fallback guidance are available for Windows developers.                            | Focused Windows runbook.                                                                                                    | `docs/runbooks/angular-dev-server-windows.md`.  | PASS             |
| QA-01  | Successful full-SPA final quality gate.                                                                                                   | Typecheck, complete Chromium suite, production build, formatting, and lint pass.                                            | Verification section.                           | PASS             |

## Async feedback matrix

| Operation                   | First load                                        | Refresh with rows                                                          | Failure                                         | Safe next action                      |
| --------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| History query / page / sort | “Loading transactions…”                           | Progress bar + “Updating transactions…” while retained rows remain visible | Retain rows, “could not be refreshed”, Retry    | Retry or change query                 |
| Manual refresh              | Same as query                                     | Busy Refresh button and local progress                                     | Same retained-data error                        | Retry                                 |
| Reference data              | Existing handbook setup runs independently        | Disabled selects until values are available                                | Existing provider state remains scoped          | Continue with other supported filters |
| Payment mutation            | Editor-owned immediate submit/projection feedback | Editor-owned pending/success/failure feedback                              | Existing executor preserves original intent/key | Existing retry/status path            |

## TDD plan

1. Add component assertions for Material filter/pagination controls and the
   distinct filtered-empty state (**RED**).
2. Add the smallest draft-filter, validation, and template/style changes
   (**GREEN**).
3. Review BEM, responsiveness, and existing query/mutation behavior
   (**REFACTOR**).

## Verification

| Check                  | Result  | Notes                                                                                                                                                                                                    |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused Karma spec     | PASS    | `npx nx test h-budget --include=...payments-history.component.spec.ts --watch=false --browsers=ChromiumNoSandbox`: 33/33 passed.                                                                         |
| Dashboard focused spec | PASS    | `...payments-dashboard.component.spec.ts`: 11/11 passed.                                                                                                                                                 |
| Provider focused spec  | PASS    | `...payments-history.provider.spec.ts`: 2/2 passed after typed `HttpParams` reduction.                                                                                                                   |
| Full CI browser suite  | PASS    | `npm run test:ci`: 325/325 passed on the final source state.                                                                                                                                             |
| Typecheck              | PASS    | `npm run typecheck` after source changes.                                                                                                                                                                |
| Formatting             | PASS    | `npm run format:check`, explicit documentation check, and `git diff --check` passed.                                                                                                                     |
| Production build       | PASS    | `npm run build:prod`: 2.38 MB initial total; 2.00 MB budget warning remains (378.08 kB over). No comparable baseline artifact is available.                                                              |
| Lint                   | PASS    | `npm run lint`: 0 errors and 389 repository-policy warnings. The actual three errors were in `payments-history.provider.ts`, not the previously attributed rates provider; fixed without disabling lint. |
| Browser visual states  | NOT RUN | Computer-use transport closed before browser automation; direct local HTTPS smoke and HMR are documented in the runbook.                                                                                 |

## Risks and decisions

- Dates remain ISO date inputs styled through `matInput`; this preserves the
  existing string-only query contract and date-boundary semantics without
  introducing conversion behavior through a new date adapter.
- The paginator remains server-driven. `totalCount` is a filtered-result count
  supplied by the API, never a page subtotal or account-wide total.

## Payment-entry redesign iteration

### Confirmed baseline (2026-09-11)

- The payment editor, cross-account transfer form, and shared rate-range control
  already use Angular Material datepickers. The history `From` and `To` filters
  are the remaining editable native `type="date"` inputs.
- The editor protects local calendar dates by normalising `Date` values to a
  local `yyyy-MM-dd` business day before its existing command mapping. This
  contract must remain unchanged.
- `AccountingLayoutComponent` always renders the right-sidebar outlet and its
  instructional card. This is the confirmed source of the reserved detail
  rail; a table stylesheet alone cannot correct that lost width.
- The local SPA starts successfully, but browser inspection is blocked by its
  configured TLS certificate (`ERR_CERT_COMMON_NAME_INVALID`). No bypass will
  be used.

### Requirements and acceptance criteria

| ID        | Requirement                                                                                                              | Intended implementation                                                                                                                        | Verification                                                        | Status                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------- |
| DATE-01   | Every editable calendar-date field uses a functioning Material picker without changing date-only serialization.          | History From/To use independent Material datepickers with local `yyyy-MM-dd` conversion; editor, transfer, and rate-picker inventory retained. | Focused history tests; source inventory.                            | PASS                    |
| TABLE-01  | The rendered Material table fills the available timeline surface and assigns spare width to descriptive columns.         | The table is 100% inline size; date, amounts, and actions are bounded while contractor/category/comment flex.                                  | Focused component test; browser measurement remains blocked by TLS. | PASS with browser limit |
| ENTRY-01  | Payment entry is an explicit, compact create/edit workflow with a single Add path and no permanently reserved idle rail. | Standard operations navigation leaves `right_sidebar` inactive; Add/row edit activate a temporary drawer without narrowing the history surface. | Focused layout/account/history tests.                               | PASS                    |
| ENTRY-02  | Repeated entry preserves only safe context and begins a clean next draft after projection.                               | The explicit `Save & add another` intent resets a clean draft only after the existing executor reports projection.                             | Focused editor tests.                                               | PASS                    |
| ASYNC-01  | Existing command, idempotency, projection, and retained-read behavior stays authoritative.                               | Existing executor, pending intent retry, and projection feedback remain the source of truth; only post-projection editor navigation changed.   | Focused editor/history regressions.                                 | PASS                    |
| A11Y-01   | Picker toggles, actions, errors, focus, and reduced-motion behavior remain accessible.                                   | Supported Material picker controls, existing row keyboard behavior, and the shared picker keyboard entry are retained.                         | Component tests; browser verification remains blocked by TLS.       | PASS with browser limit |
| VERIFY-01 | Browser layout evidence distinguishes a TLS/tooling blocker from component evidence.                                     | Certificate SAN inspection and a trusted loopback TLS request confirm the configured certificate; temporary local HTTP enables responsive-shell inspection without a browser bypass. | Server log, focused Chromium tests, live browser metrics. | PASS with scope |

### Delivery slices

1. **DATE / TABLE:** replace native filter dates with Material pickers and
   correct table column sizing without touching query semantics.
2. **ENTRY:** make idle detail presentation conditional and introduce the
   explicit repeated-entry submit intent, preserving the existing executor.
3. **VERIFY:** run focused and full checks; inspect the real browser after the
   certificate is trusted by the user/environment.

### TDD record

DATE-01 began with a failing assertion for two independent history pickers and
no native date input; the focused history suite is now green. ENTRY-01/02 are
covered by focused route and editor tests. Browser visual measurement remains
blocked by the local TLS certificate and is not inferred from test output.

### Redesign verification (2026-09-11)

| Check                   | Result                            | Evidence                                                                                                                             |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Focused Chromium tests  | PASS                              | 67/67 across history, editor, accounting layout, and account navigation.                                                             |
| Complete Chromium suite | PASS                              | `npm run test:ci`: 330/330. Existing route-fixture `NG0912` warnings remain non-failing.                                             |
| Typecheck               | PASS                              | `npm run typecheck`.                                                                                                                 |
| Formatting              | PASS                              | `npm run format:check`; the repository's Prettier setup emits its existing unknown `semicolon` option warning.                       |
| Lint                    | PASS with existing warnings       | `npm run lint`: 0 errors, 388 repository-policy warnings, below the prior 389-warning baseline.                                      |
| Production build        | PASS with existing budget warning | `npm run build:prod`: 2.38 MB initial bundle, 378.07 kB over the 2 MB warning budget.                                                |
| Browser interaction     | PASS with scope                  | The configured certificate is valid for `vm2.linux`; live temporary-HTTP browser checks verified the accounting shell/drawer at 390/768/1366/1536/1920px. The isolated browser cannot route `vm2.linux` to the local server, so certificate-host browser interaction was not attempted with a bypass. |

### Follow-up audit (2026-09-11)

The updated acceptance brief requires a stricter repeated-entry contract than
the first delivery covered. **CONFIRMED:** `Save & add another` currently
reinitializes the default form, which resets a deliberately selected date and
income/expense direction. The next slice must preserve only date and direction
while clearing amount, category, contractor, and comment. It also replaces
feature styling that targets Material-generated column classes with
component-owned BEM classes. Browser visual acceptance remains blocked by the
untrusted local certificate.

| ID | Follow-up acceptance criterion | Verification | Status |
| --- | --- | --- | --- |
| ENTRY-02B | A projected `Save & add another` preserves date and direction only; all transaction-specific fields are clean. | Focused editor regression plus full Chromium suite. | PASS |
| TABLE-02 | Column sizing uses application-owned cell classes rather than Material-generated selectors. | Template/CSS review plus full Chromium suite. | PASS |
| ENTRY-03 | Opening a create editor focuses Amount without resetting a repeated Add draft. | Focused editor DOM-focus regression; live browser evidence remains blocked. | PASS with browser limit |

### Final follow-up verification (2026-09-11)

| Check | Result | Evidence |
| --- | --- | --- |
| Editor-focused Chromium spec | PASS | `npx nx test h-budget --include=src/tests/accounting/components/accounting-operations-crud.component.spec.ts --watch=false --browsers=ChromiumNoSandbox`: 17/17. Includes Amount focus and sequential projected-create assertions. |
| Complete Chromium suite | PASS | `npm run test:ci`: 330/330. |
| Typecheck and formatting | PASS | `npm run typecheck`; `npm run format:check`; `git diff --check`. |
| Lint | PASS with existing warnings | `npm run lint`: 0 errors, 388 warnings—below the prior 389-warning baseline; no warning added by this work. |
| Production build | PASS with existing budget warning | `npm run build:prod`: 2.38 MB initial bundle, 378.07 kB over the configured 2 MB warning budget. |
| Live browser viewport evidence | PASS with scope | A temporary HTTP server, with no project configuration change or TLS bypass, rendered the accounting shell at 390/768/1366/1536/1920px. Measured body width stayed within the viewport at every width, and the active detail area remained an overlay. The selected-account route did not reach the payment-history screen in that session, so no claim is made for a live populated table. |

## Navigation and account-workspace remediation (2026-09-11)

### Status

**Verified with viewport and mutation limits**

### Confirmed defect and scope

- **CONFIRMED:** `/dashboard/accounting` activates the empty-path
  `right_sidebar` route for `PaymentAccountCrudComponent`. The accounting
  layout treats every secondary-outlet activation as editor intent and applies
  a fixed, high-z-index detail overlay. The component contains only the
  detached Add/Delete/Edit action stack, so ordinary account browsing can be
  obscured and blocked.
- **CONFIRMED:** the account-delete handler has no confirmation boundary.
  It must not be moved into the new browsing workspace until a confirmed
  deletion flow exists.
- **ASSUMED:** the existing create and edit dialogs are the supported account
  editing flows; they already provide focused modal lifecycle and Cancel.

**Required:** restore account selection and workspace navigation; remove the
default secondary account-action route; place labelled account create/edit
actions in the account workspace; make the payment editor's secondary outlet
an in-flow, responsive editor region; compact duplicated shell copy.

**Non-goals:** change payment command semantics, backend contracts, payment
delete behavior, or introduce a new account-delete confirmation implementation.

### Operation matrix

| Operation | Intent source | Surface | Close/cancel | State after close |
| --- | --- | --- | --- | --- |
| Browse/select account | Primary account route | No editor outlet or backdrop | N/A | Selection enables Operations |
| Add account | Account toolbar | Existing account dialog | Cancel button | Account route remains usable |
| Edit selected account | Contextual selected-account toolbar | Existing account dialog | Cancel button | Selection remains usable |
| Create/edit payment | Explicit operations route or action | Responsive secondary editor region | Existing route/dirty guard | Primary history stays reachable |

### Requirements and acceptance criteria

| ID | Requirement and acceptance criterion | Verification | Status |
| --- | --- | --- | --- |
| NAV-01 | Loading the account list activates no secondary editor route, overlay, backdrop, focus trap, or hidden pointer interceptor. | RED/GREEN route regression; live DOM inspection. | PASS |
| SHELL-01 | The accounting shell provides one compact navigation hierarchy and removes Flow/Workspace explanatory cards from the financial workflow. | Shell component tests; template/CSS review; live DOM inspection. | PASS |
| ACTION-01 | A visible labelled Add account action is available in the account workspace; Edit appears only with an unambiguous selected account. | Account component interaction test; live account selection. | PASS |
| ACTION-02 | No unconfirmed account-delete action is exposed in the new workspace. | Template/source review. | PASS |
| PANEL-01 | Only explicit payment editor routes activate the secondary region. At wide sizes it is side-by-side; smaller sizes use a full-width in-flow region, with no overlap or background interception. | Route/layout tests; live explicit-editor DOM inspection. | PASS with viewport limit |
| SAFE-01 | Existing payment dirty-navigation guard, direct routes, history datepicker, and pending/repeated-command paths remain unchanged. | Existing focused tests and browser-safe smoke. | PASS with mutation limit |
| VERIFY-02 | Focused tests, full quality checks, diff review, and real-SPA browser evidence are recorded without certificate bypass or financial mutation. | Verification table. | PASS with limits |

### TDD and verification plan

1. **RED:** assert that the default account route has no `right_sidebar`
   component; run the focused routing spec and record its failure.
2. **GREEN:** remove the default action route and move create/edit affordances
   to the account workspace; rerun the focused suite.
3. **REFACTOR:** simplify shell copy and make the editor layout in-flow;
   validate keyboard and responsive behavior against the real local SPA.

Final browser checks use ordinary navigation, clicks, Tab, and Enter only.
Save/delete actions are not exercised against the user-owned data source.

### Implementation evidence

- **RED:** the focused SPA-routing test failed because the empty
  `right_sidebar` route existed.
- **GREEN:** the same focused suite passed 34/34 after the default route and
  detached action component were removed and create/edit were moved into the
  account workspace.
- **Live SPA:** a temporary HTTP server served the actual production build.
  Normal clicks opened Accounting, selected an account, navigated to its
  operations, opened and closed the date picker, opened/cancelled the payment
  editor, and used Back/Forward. The open editor reported `position: static`,
  `z-index: auto`, zero CDK backdrops, zero dialogs, and zero inert nodes.
- **Viewport limit:** the available in-app browser does not expose viewport
  emulation. The responsive 390/768/1366/1536/1920 screenshot matrix remains
  unexecuted; the CSS breakpoint and no-fixed-overlay behavior are covered by
  source and component inspection, not claimed as screenshot evidence.

### Final verification

| Check | Result | Evidence |
| --- | --- | --- |
| Focused route/account/shell suite | PASS | 34/34 Chromium tests, including the route regression introduced in RED. |
| Complete Chromium suite | PASS | `npm run test:ci`: 324/324. |
| Typecheck | PASS | `npm run typecheck`. |
| Formatting | PASS | `npm run format:check`; the configured unknown `semicolon` option warning remains. |
| Lint | PASS with existing warnings | `npm run lint`: 0 errors, 374 warnings (below the earlier 388-warning baseline). |
| Production build | PASS with existing budget warning | `npm run build:prod`: 2.37 MB initial bundle, 373.97 kB over the configured 2 MB warning budget. |
| Diff review | PASS | `git diff --check`; no remaining detached CRUD references. |
