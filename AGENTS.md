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
2. Classify the task as implementation, bug fix, refactoring, architecture audit, PR review, standards-only, or lightweight. Treat a task as non-trivial when it changes behavior, has multiple acceptance conditions, spans modules, changes state/API/UI workflows, has an unclear bug root cause, or affects architecture, performance, security, or substantial tests. When uncertain, use the non-trivial path.
3. For any Angular/Nx task, read [the authoritative Angular/Nx skill](.codex/skills/angular-spa/SKILL.md) and every supporting standard it directs for the affected concern. UI templates or styles must apply the [styling, UI, and template standard](.codex/skills/angular-spa/styling-and-ui.md), which is the authoritative BEM/HTML/CSS/SCSS policy.
4. For non-trivial work, read the [SDD skill](.codex/skills/specification-driven-development/SKILL.md), create or update a task specification in `docs/specs/`, and reach Definition of Ready before production implementation. The specification is the persistent task memory.
5. For a behaviorally testable implementation or bug fix, read the [TDD skill](.codex/skills/test-driven-development/SKILL.md) before modifying production behavior. Record a specific TDD exception only when test-first is not meaningful.
6. Inspect nearby implementation, tests, DI/provider registration, routes, state, models, mappings, and public contracts that the change could affect. Distinguish confirmed repository facts from assumptions and unknowns.
7. Run `git status --short`, identify pre-existing changes, and preserve unrelated user work.
8. Discover actual validation scripts and project targets before editing. Do not invent commands or targets.

For a standards-only task, modify only Codex governance files (such as `AGENTS.md`, `.codex/**`, `.agents/**`, `docs/codex/**`, `docs/specs/**`, and exclusively Codex-related documentation). Do not change application code, tests, dependencies, runtime/workspace configuration, CI, or behavior.

## Mandatory implementation workflow

Codex must:

1. Keep changes within the explicit specification and scope, separating required work from optional work and follow-ups. Do not silently change scope or repair unrelated technical debt.
2. For non-trivial work, keep requirements, acceptance criteria, implementation plan, traceability, decisions, progress, and verification evidence current in the task specification. Update the specification before changing behavior when newly discovered evidence changes the requirement.
3. Reuse an established abstraction or pattern before creating another one. Do not perform speculative abstraction, broad modernization, or unrelated formatting.
4. Preserve behavior, routes, contracts, validation, permissions, telemetry, error handling, and legacy architectural constraints unless the current specification explicitly changes them.
5. Use RED → GREEN → REFACTOR for behaviorally testable work: add or identify the focused test first, confirm its expected failure when practical, make the smallest implementation green, then refactor only while coverage remains green. For non-trivial bug fixes, reproduce the defect and add a regression test first when practical.
6. Never use `any`, non-null assertions, suppressions, `--force`, `--legacy-peer-deps`, deleted/skipped tests, weakened assertions or quality gates, arbitrary delays, or placeholder code to conceal a defect. Correct an incorrect test only after documenting why its expected behavior conflicts with the specification.
7. Treat the first implementation as a draft. Inspect the complete diff, perform the self-review and [verification gate](.codex/skills/verification/SKILL.md), correct findings, and rerun affected validation.
8. Stop and report when requirements conflict with security, correctness, repository constraints, or available evidence.

## Validation and reporting

Use the validation levels in [review and validation standards](.codex/skills/angular-spa/review-and-validation.md) and the [verification gate](.codex/skills/verification/SKILL.md). Implementation complete is not task complete: evaluate every applicable acceptance criterion with evidence. Every final report must distinguish `PASS`, `FAIL`, and `NOT RUN`; never describe an unexecuted command as passing.

For non-trivial work, report the result, specification path, requirements/acceptance-criteria outcomes, TDD evidence or exception, files changed, validation evidence, self-review corrections, preserved unrelated changes, remaining risks/exceptions, and the next safe action. Do not claim completion or compliance without evidence.

## Release engineering policy

- Use Conventional Commits 1.0.0 for all new commit and pull-request titles: `<type>(<scope>): <description>`.
- h-budget uses application SemVer: `feat` is MINOR; a `!` marker or `BREAKING CHANGE:` footer is MAJOR; `fix`, `perf`, `revert`, `refactor`, `chore`, `build`, and `ci` are PATCH; `docs`, `test`, and `style` are no-release. This is intentional operational traceability for deployable code, dependencies, build, release, and CI/CD changes. Keep accurate Conventional Commit types; do not misuse `fix` solely to obtain a version.
- Branch names validate development intent only: `feature|feat/* -> feat`, `bug|bugfix|fix|hotfix/* -> fix`, and the remaining supported prefixes map to their matching Conventional Commit type. Never calculate a release version from a branch name.
- `master` is the only stable release branch. semantic-release derives `vMAJOR.MINOR.PATCH` from reachable Conventional Commit history and publishes the immutable GitHub release/tag after CI passes.
- GitHub Releases are the canonical generated release history. Do not manually bump the private SPA package version, create release tags, or commit generated changelog entries.
- Production image work must be triggered by a published stable release and must build the exact release tag; preserve its release SHA and immutable image tags.

## Governance map

- [Governance package guide](.codex/README.md)
- [Angular/Nx skill](.codex/skills/angular-spa/SKILL.md)
- [Specification-driven development skill](.codex/skills/specification-driven-development/SKILL.md)
- [Test-driven development skill](.codex/skills/test-driven-development/SKILL.md)
- [Verification gate](.codex/skills/verification/SKILL.md)
- [Task specification convention](docs/specs/README.md)
- [Styling, UI, and template standard](.codex/skills/angular-spa/styling-and-ui.md)
- [Pre-change checklist](.codex/checklists/angular-pre-change-checklist.md)
- [Self-review checklist](.codex/checklists/angular-self-review-checklist.md)
- [Instruction hierarchy](docs/codex/01-instruction-hierarchy.md)
- [Governance audit](docs/codex/00-codex-governance-audit.md)

Detailed legacy documents are retained as redirects only: [coding standards](docs/angular-coding-standards.md) and [review checklist](docs/angular-code-review-checklist.md). The `.codex` package is authoritative for future Codex work.
