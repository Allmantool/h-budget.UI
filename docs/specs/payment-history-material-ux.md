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
