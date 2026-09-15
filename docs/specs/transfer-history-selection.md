# Transfer History Selection

## Status

Ready

## Problem and Goal

Selecting a transfer history row opens the ordinary payment editor. Transfer records intentionally have no payment category or contractor, so that editor waits for reference data that can never arrive and remains on “Loading payment…”. The transactions table also retains a redundant desktop Actions/pencil column after rows became selectable.

## Scope

**Required:**

- Classify selection from the authoritative `operationType` carried by the history/store model.
- Keep payment rows in the existing payment editor and show a stable read-only transfer-details view for transfer rows.
- Expose only the existing paired transfer delete contract, with confirmation; never call the ordinary payment delete path for a transfer.
- Preserve leave protection, stale selection/account-switch protection, related-transfer navigation, and desktop row accessibility.
- Remove the desktop Actions/pencil column and redistribute its width to the useful text columns.
- Add deterministic payment/transfer selection and interaction regression coverage.

**Non-goals:**

- Changing accounting totals, transfer creation, payment command execution, idempotency, API contracts, or backend transfer-update behavior.
- Fabricating transfer editing. The API’s `PATCH /cross-accounts-transfer` currently rebuilds stored legs without applying the requested amount/date/rate fields, so it is not safe evidence for an edit UI.

## Repository Evidence and Unknowns

- **CONFIRMED:** History maps `transactionType` to `IPaymentOperationModel.operationType`; `OperationTypes.Payment = 1` and `OperationTypes.Transfer = 2`.
- **CONFIRMED:** Transfer rows carry their paired account in `relatedPaymentAccountId`; their operation key is shared across the paired transfer legs.
- **CONFIRMED:** `AccountingOperationsCrudComponent` interprets every selected ID as a payment and waits for category/contractor references. Transfers have empty references by design, producing the infinite loading state.
- **CONFIRMED:** `DELETE /accounting/cross-accounts-transfer` accepts account and transfer-operation IDs and backend code deletes both linked legs.
- **CONFIRMED:** `PATCH /accounting/cross-accounts-transfer` exists, but the current service does not apply the request’s changed fields before issuing `UpdateTransferCommand`; transfer editing is therefore not exposed.
- **UNKNOWN:** The pasted screenshot itself was not attached; the supplied record characteristics are represented by deterministic component fixtures instead.

## Requirements and Acceptance Criteria

- **REQ-001:** A payment selection opens only the ordinary payment editor. **AC-001:** payment forms are populated and retain their current actions.
- **REQ-002:** A transfer selection is distinguished by `OperationTypes.Transfer`, never comment/category/contractor display text. **AC-002:** incoming and outgoing transfer rows render transfer details without “Loading payment…”.
- **REQ-003:** Transfer details show source, destination, amount, currency context, date, comment, direction, and related account. **AC-003:** transfer rows settle to a meaningful terminal view.
- **REQ-004:** A transfer delete is explicit, confirmed once, and calls only the paired transfer endpoint. **AC-004:** successful deletion clears selection and returns to New payment; ordinary payment delete is not used.
- **REQ-005:** Desktop history has no Actions/pencil column; row focus/hover/selected state and Enter/Space activation remain available. **AC-005:** table headers are Date, Contractor, Category, Income, Expense, Balance, Comment and the comment area uses the reclaimed width.
- **REQ-006:** Related-transfer navigation remains independently operable and does not also select the row. **AC-006:** click invokes only related navigation after leave protection.
- **EDGE-001:** A late payment/reference-data update cannot replace an already selected transfer; account changes clear selection as before.

## Constraints

Use the existing NgModule/NGXS/route-scoped service architecture, Angular Material, typed domain models, existing dirty-form guard, and component-owned BEM CSS. Do not infer transfer status from rendered data. Do not alter summary calculations.

## Test and Verification Strategy

Use Jasmine/TestBed component tests for row keyboard selection, header removal, transfer terminal details, and related-link propagation; use a focused transfer-details test for paired deletion. Run the user-required final SPA scripts after the final source edit, plus diff and browser verification through the configured local HTTPS procedure.

## Implementation Plan

1. Add RED tests for transfer routing/details and column removal — observed failure proves the current payment-only selection path.
2. Branch the existing right rail from the selected authoritative operation type and implement read-only transfer details with safe delete.
3. Remove the Actions template/column and rebalance table widths while preserving accessible row and link behavior.
4. Run focused tests, review, browser checks, and full quality gate; update this record with evidence.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 |  |  | NOT RUN |
| REQ-002 | AC-002 |  |  | NOT RUN |
| REQ-003 | AC-003 |  |  | NOT RUN |
| REQ-004 | AC-004 |  |  | NOT RUN |
| REQ-005 | AC-005 |  |  | NOT RUN |
| REQ-006 | AC-006 |  |  | NOT RUN |

## Implementation Progress

### Completed

- Repository and API audit; Definition of Ready reached.

### In Progress

- RED test and focused implementation.

### Remaining

- Implementation, browser acceptance, full quality gate, and verification update.

### Decisions and Requirement Changes

- Read-only details are the safe transfer UX because the existing frontend transfer dialog is create-only and the discovered backend update implementation does not apply requested edits. This affects REQ-003 and avoids falsely satisfying an edit capability.

### Verification

- TDD RED/GREEN/REFACTOR evidence and acceptance results pending.
