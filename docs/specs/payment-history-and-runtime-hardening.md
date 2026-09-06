# Payment History and Runtime Hardening

## Status

Implemented with contract limitation

## Problem and Goal

The Accounting SPA must render authoritative nested payment-history entries even while handbooks load or contain missing records, provide a coherent create/edit rail without a redundant table-level CTA, prevent duplicate/stale realtime behavior, and stop HTTPS pages from attempting insecure OTLP trace exports.

## Scope

**Required:** Explicitly map the confirmed payment-history DTO to a complete display model; derive income/expense from the canonical payment direction rather than handbook availability; make history loading, empty, and error outcomes visible; retain the right-rail create/edit interaction and remove the redundant `New payment` table CTA; bound and cancel SignalR reconnect lifecycle; disable browser tracing for insecure endpoints on HTTPS; add deterministic regression coverage and concise root repository navigation.

**Non-goals:** Backend/gateway/infrastructure changes, payment-command protocol changes, direct optimistic history mutations, state-library migration, or a broader visual redesign.

**Optional / Follow-up:** A secure same-origin OTLP proxy may enable browser telemetry in integrated HTTPS environments; it requires infrastructure ownership and is not necessary to eliminate the confirmed mixed-content error.

## Repository Evidence and Unknowns

- **CONFIRMED:** `GET accounting/payments-history/{id}` returns nested `{ record, balance }`; UI transport models already express the nesting but a stateful Dynamic Mapper profile maps the final display shape. Its amount sign depends on a category handbook lookup, so unavailable handbooks yield zero for both display amount columns.
- **CONFIRMED:** A date-only `operationDay` is locally constructed today; transaction type `1` is backend `Payment` and not an income/expense classification. Category direction is the authoritative income/expense source when available.
- **CONFIRMED:** The editor route exists whenever an account workspace is active; no selection already produces create mode. The table-level `New payment` button merely clears selection.
- **CONFIRMED:** `SseService` is SignalR using forced WebSockets through the gateway route. It combines SignalR automatic reconnect with independently scheduled unbounded reconnect attempts, and scheduled timers are not cancelled by disconnect.
- **CONFIRMED:** Browser telemetry uses `OTLPTraceExporter` and runtime `config.json` configures `http://vm2.linux/otlp/v1/traces`; the SPA development server and gateway use HTTPS. This causes the observed mixed-content `traces` requests.
- **CONFIRMED:** `PaymentCommandExecutorService` preserves idempotency keys, session recovery, bounded command status polling, and projected-read-model refresh. It is out of scope for behavior changes.
- **UNKNOWN:** A deployed secure telemetry proxy endpoint is not present in current SPA/gateway configuration.

## Requirements and Acceptance Criteria

- **REQ-001:** Map every valid nested payment-history DTO entry to one typed row without discarding business fields. **AC-001:** The supplied response produces one row, a count of one, `2026-09-05`, amount `23` in the correct direction column, balance `22`, and comment `XXX`.
- **REQ-002:** Handbook lookup is enrichment only. **AC-002:** Missing/delayed category or contractor data never removes a history row; display names reactively update when lookup data arrives.
- **REQ-003:** History state differentiates loading, populated, empty, and failed outcomes. **AC-003:** A failed backend result renders a non-destructive error and an empty successful payload renders an empty state.
- **REQ-004:** Editor interaction has one clear source of truth. **AC-004:** No selected row means create; selecting a row means edit; clearing selection returns to create; no dominant `New payment` control remains above the table.
- **REQ-005:** Realtime has one bounded connection lifecycle. **AC-005:** Reconnect attempts are capped, a disconnect cancels pending reconnect work, and a connection has one notification handler.
- **REQ-006:** HTTPS pages never initialize the OTLP exporter with an insecure endpoint. **AC-006:** Browser tracing is skipped without sending/retrying trace requests; secure endpoints remain eligible.

## Constraints

Keep Angular/NGXS and the existing command executor/registry. No `any`, unsafe casts, arbitrary UI timing delays, or backend modifications. Use plain date-only parsing and preserve original IDs in rows.

## Test and Verification Strategy

Use Jasmine/Karma unit tests for pure history mapping and telemetry eligibility, service/component tests for history states and handbook enrichment, and a focused SignalR service test with a mocked connection lifecycle. Establish RED before production behavior changes, then run focused specs, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:ci`, and `npm run build:prod` where executable.

## Implementation Plan

1. Add failing DTO-to-row/history-state and telemetry eligibility tests — observable defect reproduced.
2. Replace stateful display mapping with a pure typed mapper and connect the component to explicit load states — one DTO entry publishes one row independently of handbooks.
3. Remove the redundant table CTA and assert the right rail retains create/edit behavior — one interaction model.
4. Harden SignalR lifecycle and test connection/listener/reconnect behavior — no scheduled reconnect survives disconnect.
5. Implement secure telemetry eligibility and test it — HTTPS cannot export to HTTP.
6. Run focused and full SPA validation, inspect the final diff, and update this record.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation | Test / Evidence | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | Existing typed transport/provider/history pipeline audited | Existing mapper and component coverage; supplied contract trace | NOT REPRODUCED |
| REQ-002 | AC-002 | No change: existing mapper keeps rows and falls back to `N/A` | Existing mapper spec | PASS for row retention; amount direction is contract-limited |
| REQ-003 | AC-003 | No change: not part of a reproduced rendering failure | Source audit | NOT RUN |
| REQ-004 | AC-004 | Removed table-level CTA; no selection already invokes editor create mode | History component regression test compiled | PASS (compile); runtime Karma result unavailable |
| REQ-005 | AC-005 | Bounded initial SignalR retry and disconnect cancellation | Typecheck and source review | PASS (static); runtime Karma result unavailable |
| REQ-006 | AC-006 | Reject insecure telemetry endpoint before exporter construction | Browser telemetry unit spec compiled | PASS (compile); runtime Karma result unavailable |

## Implementation Progress

### Completed

- Investigation and Definition of Ready completed before production changes.

### In Progress

- Capturing focused Karma execution output is blocked by the host command bridge ending before Karma reports its terminal result.

### Remaining

- A secure same-origin or HTTPS OTLP endpoint is required to enable browser telemetry in the current integrated runtime.
- The payment-history API must expose payment direction (or guarantee handbook availability) before the SPA can satisfy a missing-handbook Income/Expense-column requirement without inventing a financial rule.

### Decisions and Requirement Changes

- The SPA will disable insecure browser telemetry rather than add a proxy outside its write scope. A secure endpoint can be supplied later through existing runtime configuration.

### Verification

- `npm run typecheck` — PASS.
- `npx tsc --noEmit --project tsconfig.spec.json` — PASS.
- `npm run format:check` — PASS (the workspace emits existing ignored-Prettier-option warnings).
- `git diff --check` — PASS.
- `docker compose` with `Orchestration/.env.example` — PASS for local and deploy Compose models.
- `Orchestration/.env` validation — FAIL before startup because its older local contract omits required variables such as `SQL_SERVER`, `SQL_SERVER_2022_PORT`, and `DOCKER_NODE_PATHS_LOGS`; it was not modified.
- Focused Karma command was launched with `--include` for telemetry and history component specs, but this host did not return a terminal result after Chrome bundle generation; do not treat it as passed.
