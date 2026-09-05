# Accounting Transaction Direction Semantics

## Status

Complete

## Problem and Goal

The same live payment is classified as income in the SPA dashboard summary and
as an expense in the timeline. Establish the backend contract and make all SPA
direction-derived displays follow it without changing the payment or transfer
transport contracts.

## Scope

**Required:** Align SPA dashboard and timeline direction calculation with the
backend `FinancialTransaction.CalculateIncrement` semantics; retain backend
history balances; add deterministic coverage for the supplied payment and
transfer direction behavior.

**Non-goals:** Changing the backend event/projection protocol, rewriting
existing payment records, changing categories, or treating `TransactionType`
as an income/expense enum.

## Repository Evidence and Unknowns

- **CONFIRMED:** Backend `TransactionTypes.Payment` has key `1`; it denotes an
  ordinary payment, not income.
- **CONFIRMED:** Backend `CalculateIncrement` uses category type for a payment
  with a category: Income applies `Math.Abs(amount)`, Expense applies
  `-Math.Abs(amount)`. A transfer uses its signed amount directly.
- **CONFIRMED:** The SPA payment editor requires a positive amount and filters
  categories by the selected Income/Expense direction. It submits no
  transaction-type field; the backend factory assigns `Payment`.
- **CONFIRMED:** The backend accepts any non-zero API amount rather than
  normalizing it, but payment balance semantics deliberately discard its sign.
- **CONFIRMED:** The live record has `transactionType: 1`, `amount: 23`, and an
  Expense category. Its backend history balance is `22`.
- **CONFIRMED:** `PaymentsDashboardComponent` currently classifies raw positive
  amounts as income. `PaymentRepresentationsMappingProfile` uses category type
  but duplicates the calculation.

## Requirements and Acceptance Criteria

- **REQ-001:** A category-backed payment's direction comes from its category
  type and its display/balance magnitude is absolute. **AC-001:** The supplied
  payment contributes Income `0`, Expense `23`, Net `-23`, and timeline
  `expense: -23` while preserving balance `22`.
- **REQ-002:** Transfer direction remains the signed amount created by the
  transfer workflow. **AC-002:** Sender and recipient transfer calculations
  retain negative and positive increments respectively.
- **REQ-003:** Summary and timeline use one SPA implementation of the backend
  direction contract. **AC-003:** Focused dashboard and mapper tests classify
  the same operation identically.

## Constraints

Keep the existing Angular/NGXS architecture, plain state models, API DTOs, and
date handling. Do not infer payment direction from `transactionType` or merely
invert a raw-amount comparison.

## Test and Verification Strategy

RED: add an exact dashboard regression for the supplied positive Expense
payment; current dashboard behavior must fail it. GREEN: use one pure
calculation in dashboard and representation mapping; retain the existing
timeline fixture. Validate focused tests, type checking, lint, formatting,
full Karma suite, production build, and diff.

## Implementation Plan

1. Add the domain-contract regression tests — observable inconsistency fails.
2. Add a pure direction-calculation function that mirrors backend increment
   rules and consume it from summary and timeline mapping.
3. Verify payment, transfer, and preserved history balance behavior.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation                                        | Test / Evidence                                     | Status |
| ----------- | ------------------- | ----------------------------------------------------- | --------------------------------------------------- | ------ |
| REQ-001     | AC-001              | Shared increment function, dashboard, timeline mapper | Exact operation dashboard and timeline-mapper tests | PASS   |
| REQ-002     | AC-002              | Shared increment function                             | Transfer and uncategorized-operation unit test      | PASS   |
| REQ-003     | AC-003              | Shared increment function consumed by both displays   | Focused dashboard, mapper, and unit suites          | PASS   |

## Implementation Progress

### Completed

- Backend-to-SPA direction and balance-flow audit.
- Definition of Ready with authoritative backend behavior.
- RED dashboard regression: the pre-change implementation returned Income 23,
  Expense 0, Net 23 for the supplied Expense payment.
- Added `calculatePaymentOperationIncrement`, which mirrors the backend's
  category/amount/transfer rule, and consumed it from dashboard aggregation and
  timeline mapping.
- Focused dashboard (9), mapper (6), and increment (3) Karma suites pass.
- Type checking and lint pass; lint reports the repository's existing 347
  warnings and no errors.
- Full CI Karma suite passes 287 tests; production build succeeds with its
  existing initial-bundle budget warning.

### Decisions and Requirement Changes

- Category type is authoritative for category-backed payments; raw payment
  amount sign is not. `TransactionType` selects payment versus transfer rules.

### Verification

- `npm run typecheck`: PASS.
- `npm run lint`: PASS; 347 existing warnings, 0 errors.
- `npm run format:check`: PASS.
- `npm run test:ci`: PASS; 287 tests.
- `npm run build:prod`: PASS; existing 2 MB initial-bundle warning remains.
- `git diff --check`: PASS.
