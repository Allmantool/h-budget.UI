# Payment account deletion

## Status

Implemented — runtime browser/API verification blocked

## Problem and Goal

The Accounting account list exposes Open and Edit but no safe way to delete a payment account. Restore deletion through the existing backend contract with a discoverable row menu, contextual confirmation, duplicate-submit protection, clear async feedback, and consistent NGXS account state.

## Scope

**Required:**

- Replace the permanent Edit icon with an accessible account-actions menu containing Edit and Delete account while retaining Open as the primary row action.
- Confirm deletion in an Angular Material dialog that identifies the account, currency, and current balance.
- Execute one delete request per confirmation, prevent duplicate submission, keep the dialog open on failure, allow retry, and close on success.
- Remove the account from NGXS only after API success, clear it as the active account when applicable, and let existing derived groups/counts render the new state.
- Announce success on the Accounting page and show actionable failure feedback in the dialog.
- Preserve account Open, Edit, Add, grouping, balances, empty states, responsive behavior, and keyboard-accessible Material menu/dialog behavior.

**Non-goals:**

- Backend, gateway, payment-history, balance, currency, or account-grouping changes.
- Cascading deletion of payment history or new frontend business rules for balance/history.
- A new global notification framework or UI dependency.

**Optional / Follow-up:**

- Define a product policy for accounts that have payment history if deletion should be restricted or become archival.

## Repository Evidence and Unknowns

- **CONFIRMED:** `PaymentAccountsController.DeleteByIdAsync` handles `DELETE /payment-accounts/{paymentAccountId}` and returns `Result<Guid>`; successful controller results are HTTP 200 with the deleted identifier in `payload`.
- **CONFIRMED:** Ocelot maps `DELETE /gateway/accounting/{entity}/{paymentAccountId}` to `/{entity}/{paymentAccountId}`, so the SPA path is `/gateway/accounting/payment-accounts/{paymentAccountId}` through the configured gateway host.
- **CONFIRMED:** The Mongo client calls `DeleteOneAsync` on the account document only. It does not inspect balance, payment history, or concurrency/version data and does not cascade to operation stores.
- **CONFIRMED:** A syntactically invalid identifier returns a failure result classified as HTTP 400. Infrastructure/unexpected exceptions are normalized by the API exception handling. A valid missing identifier is currently an idempotent HTTP 200 success because the Mongo deleted count is not inspected.
- **CONFIRMED:** The SPA provider and NGXS `RemovePaymentAccount` action exist but are unused. The provider incorrectly models the response as `Result<boolean>`, filters result failures, retries every failure, and logs to the console.
- **CONFIRMED:** Git commit `436190f` added a direct delete call without confirmation or failure UX. Commit `f6c98be` removed the separate payment-account CRUD component during the current Accounting redesign while leaving provider/state code behind.
- **CONFIRMED:** The current page is the standalone `PaymentAccountComponent`; NGXS owns the canonical account collection. The app already uses Angular Material menus/dialogs and inline ARIA live status/error feedback, but has no snackbar/toast service.
- **ASSUMED:** The existing inline live-region pattern is the appropriate success notification mechanism for this focused change because no global notification primitive exists.
- **UNKNOWN:** Whether product policy ultimately intends account deletion to archive or reject accounts with history; the current backend contract performs neither, so the SPA will not invent such a rule or warning.

## Requirements and Acceptance Criteria

- **REQ-001:** Each account exposes secondary management actions through an accessible Material menu.
    - **AC-001:** The trigger is named `Actions for <account name>` and the menu contains labeled Edit and Delete account items; Open remains independently functional.
    - **AC-002:** Choosing Edit invokes the existing edit flow for exactly that account; menu interaction does not navigate to operations.
- **REQ-002:** Deletion requires contextual confirmation.
    - **AC-003:** The dialog exposes a semantic title and account name, currency, balance, safe consequence copy, Cancel, and a visually differentiated Delete account action.
    - **AC-004:** Cancel and standard pre-submit dialog dismissal perform no request, and Material restores focus to the trigger.
- **REQ-003:** The delete operation is safe under concurrency and failure.
    - **AC-005:** Confirm invokes the provider once for the selected account; a second confirmation while pending is ignored and the destructive action is disabled with progress text.
    - **AC-006:** API/network failure keeps the dialog and account visible, presents an actionable error, re-enables retry, and does not mutate NGXS.
    - **AC-007:** Success closes the dialog and dispatches the NGXS removal only after the successful response.
- **REQ-004:** State and rendered aggregates stay consistent.
    - **AC-008:** Removal targets every duplicate entry with the matching ID, preserves all other accounts and balances, and clears the active ID only when that account was active.
    - **AC-009:** Existing derived group and total counts update; an emptied group and zero-account page use the established empty rendering.
    - **AC-010:** A polite page status announces `<name> was deleted.` after success.
- **REQ-005:** Existing account workflows and responsive/accessibility behavior remain intact.
    - **AC-011:** Add, Open, Edit, grouping, balance rendering, long-name truncation, and keyboard-reachable Material menu/dialog behavior remain functional without horizontal overflow at target widths.
- **EDGE-001:** A valid account that disappeared server-side is treated as successful idempotent deletion under the confirmed backend contract.
- **EDGE-002:** If the component is destroyed, component result handling is lifecycle-bound; the dialog/request owns its own lifecycle and never issues nested subscriptions.

## Constraints

- Preserve standalone Angular components, NGXS state ownership, strict typing, Angular Material primitives, OnPush change detection, and current gateway configuration.
- Do not add dependencies, frontend-only domain deletion rules, optimistic pre-response removal, nested subscriptions, or custom menu/dialog accessibility behavior.
- New application-owned classes follow BEM. Destructive meaning must use text plus the existing Material warning semantic, not color alone.

## Test and Verification Strategy

- RED/GREEN component tests for menu rendering, accessible names, Edit/Open/Add regression, confirmation invocation, success announcement, state/count/empty-group behavior, and correct account identity.
- RED/GREEN dialog tests for context, cancel, pending/disabled state, duplicate-submit prevention, failure/retry, and success close behavior.
- Provider test for the exact DELETE URL and `Result<string>` contract; NGXS state tests for targeted removal and active-ID clearing.
- Focused Karma runs during implementation, then final `npm run quality:gate`, `npm run build:prod`, diff/self-review checks, and browser verification at 390, 768, 1366, 1536, and 1920 px using the repository HTTPS workflow.
- Inspect a real browser network request when the local backend is available; otherwise report runtime API verification as blocked while retaining source/test contract evidence.

## Implementation Plan

1. Add focused failing tests for menu, dialog, provider contract, and NGXS removal semantics — exit when failures prove the missing behavior.
2. Add the minimal dialog/deletion service and correct the typed provider boundary — exit when async success/failure/retry tests pass.
3. Integrate the Material row menu, success live region, and responsive presentation — exit when component/regression tests pass.
4. Self-review, run mandatory/full validation and production build, then exercise the real page across target viewports — exit when each acceptance criterion has evidence or an explicit blocked status.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status  |
| ----------- | ------------------- | -------------- | --------------- | ------- |
| REQ-001     | AC-001, AC-002      | Account row Material menu; existing Open and Edit flows retained | Component and route-provider specs | PASS |
| REQ-002     | AC-003, AC-004      | Contextual Material confirmation dialog with focus restoration | Dialog and deletion-service specs | PASS |
| REQ-003     | AC-005–AC-007       | Pending guard, single DELETE request, inline failure/retry, success-only close/removal | Dialog, service, and provider specs | PASS |
| REQ-004     | AC-008–AC-010       | NGXS targeted removal/active-ID cleanup and page live status | State and component specs | PASS |
| REQ-005     | AC-011              | Existing workflows retained; responsive layout styles added | Full 361-test suite and production build pass; real-browser viewport checks blocked by HTTPS routing | BLOCKED |

## Implementation Progress

### Completed

- Audited the current component, NGXS state, provider, gateway, backend controller/Mongo client, error-status filter, existing dialogs, feedback patterns, and relevant Git history.
- Confirmed the API semantics and selected a Material menu plus contextual dialog design.
- Added the account-actions menu, contextual confirmation dialog, deletion orchestration service, provider contract correction, NGXS active-account cleanup, success announcement, and responsive truncation.
- Added focused component, dialog, service, provider, state, and route-provider regression coverage.
- Completed focused, aggregate, type-check, lint, production-build, and diff validation.

### In Progress

- Secure local browser routing and disposable-account runtime verification.

### Remaining

- Resolve the repository HTTPS host mismatch, then verify 390, 768, 1366, 1536, and 1920 px viewports and inspect one authorized disposable-account DELETE in the browser network panel.

### Decisions and Requirement Changes

- The page will use its established inline ARIA live feedback rather than introducing a snackbar framework solely for this feature.
- Confirmation copy states only that the account is removed from Home Ledger; it does not claim that payment history is deleted.
- The provider performs exactly one request per confirmation and does not retry destructive calls automatically.
- NGXS remains the canonical account collection and is mutated only after the API reports success.

### Verification

- **RED:** The focused Karma run failed because the deletion dialog/service did not exist and the provider still exposed `Result<boolean>`.
- **GREEN/REFACTOR:** The focused deletion/regression suite passes 25/25 after implementation and dependency-wiring cleanup.
- `npm run typecheck` passes.
- `npm run quality:gate` passes: lint exits with zero errors and the full Chrome Headless suite passes 361/361.
- `npm run build:prod` passes; the existing initial-bundle warning remains (2.31 MB, 314.19 kB over its warning budget).
- `git diff --check` passes.
- A non-destructive gateway GET to `/gateway/accounting/payment-accounts` succeeds over trusted TLS, confirming reachability and the result envelope.
- Real-browser verification is blocked: the configured certificate is valid for `vm2.linux`, which resolves to `192.168.5.159`, while the workstation serving the SPA is `192.168.5.62`; the certificate has no `localhost` SAN. No DNS/trust bypass was applied.
- A live DELETE was not issued because no account was identified as disposable; deleting user financial data without explicit authorization would be unsafe.
