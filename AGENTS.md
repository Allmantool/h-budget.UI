# Codex Governance Entry Point

This file is the mandatory entry point for AI-assisted work in this repository. It governs Codex work; it does not replace explicit task requirements or the application’s existing behavior.

## Repository snapshot

- This is a single Angular SPA managed with Nx and npm. At the time of this document’s update, `package.json` declares Angular 21.2 and Nx 22.7; verify versions before applying version-specific guidance.
- The application currently uses NgModules, `platformBrowserDynamic().bootstrapModule(AppBootstrapModule)`, `RouterModule`, and NGXS. Preserve these choices unless the task explicitly authorizes a migration.
- Feature UI is mainly in `src/presentation`; app-wide Angular concerns and shared NGXS state are in `src/app/modules`; domain contracts are in `src/domain`; HTTP providers and mappings are in `src/data`; browser infrastructure is in `src/infrastructure`; Jasmine/Karma tests are in `src/tests`.

## Instruction precedence

Apply instructions in this order:

1. Explicit task requirements and scope.
2. The closest applicable scoped `AGENTS.md`.
3. This root `AGENTS.md`.
4. Skills explicitly required here or by a scoped instruction.
5. Referenced repository standards.
6. Existing code and nearby tests as evidence of current behavior and local conventions.
7. Official framework and library guidance.

A narrower instruction may specialize a broader one, but must not silently weaken security, correctness, data integrity, required validation, or this task’s scope. Report conflicts instead of choosing silently. Existing code is not proof of best practice.

## Mandatory discovery

Before editing, Codex must:

1. Verify the repository root and read this file plus every applicable nested `AGENTS.md`.
2. Classify the task as implementation, bug fix, refactoring, architecture audit, PR review, or standards-only.
3. For any Angular/Nx task, read [the authoritative Angular/Nx skill](.codex/skills/angular-spa/SKILL.md) and every supporting standard it directs for the affected concern.
4. Inspect nearby implementation, tests, DI/provider registration, routes, state, models, mappings, and public contracts that the change could affect.
5. Run `git status --short`, identify pre-existing changes, and preserve unrelated user work.
6. Discover actual validation scripts and project targets before editing. Do not invent commands or targets.

For a standards-only task, modify only Codex governance files (such as `AGENTS.md`, `.codex/**`, `.agents/**`, `docs/codex/**`, and exclusively Codex-related documentation). Do not change application code, tests, dependencies, runtime/workspace configuration, CI, or behavior.

## Mandatory implementation workflow

Codex must:

1. Keep changes within the explicit scope and choose the smallest coherent design.
2. Reuse an established abstraction or pattern before creating another one. Do not perform speculative abstraction, broad modernization, or unrelated formatting.
3. Preserve behavior, routes, contracts, validation, permissions, telemetry, error handling, and legacy architectural constraints unless the task explicitly changes them.
4. Add or update meaningful tests for changed behavior; for a bug fix, reproduce or explain the defect and add a regression test when practical.
5. Never use `any`, non-null assertions, suppressions, `--force`, `--legacy-peer-deps`, deleted/skipped tests, weakened quality gates, or placeholder code to conceal a defect.
6. Treat the first implementation as a draft. Inspect the complete diff, perform the self-review required by the Angular/Nx skill, fix findings, and rerun affected validation.
7. Stop and report when requirements conflict with security, correctness, repository constraints, or available evidence.

## Validation and reporting

Use the validation levels in [review and validation standards](.codex/skills/angular-spa/review-and-validation.md). Every final report must distinguish `PASS`, `FAIL`, and `NOT RUN`; never describe an unexecuted command as passing.

For non-trivial work, report the objective/result, design reasoning, principles applied, files changed, validation evidence, self-review corrections, preserved unrelated changes, remaining risks/exceptions, and the next safe action. Do not claim completion or compliance without evidence.

## Governance map

- [Governance package guide](.codex/README.md)
- [Angular/Nx skill](.codex/skills/angular-spa/SKILL.md)
- [Pre-change checklist](.codex/checklists/angular-pre-change-checklist.md)
- [Self-review checklist](.codex/checklists/angular-self-review-checklist.md)
- [Instruction hierarchy](docs/codex/01-instruction-hierarchy.md)
- [Governance audit](docs/codex/00-codex-governance-audit.md)

Detailed legacy documents are retained as redirects only: [coding standards](docs/angular-coding-standards.md) and [review checklist](docs/angular-code-review-checklist.md). The `.codex` package is authoritative for future Codex work.
