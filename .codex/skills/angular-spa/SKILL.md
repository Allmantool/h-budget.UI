---
name: angular-spa
description: Govern implementation, refactoring, bug-fix, audit, review, testing, and migration work in this repository’s Angular/Nx SPA. Use for every task that reads or changes Angular, TypeScript, templates, CSS, NgModules, routes, NGXS, RxJS, HTTP/data access, tests, Nx configuration, or Angular/Nx governance.
---

# Angular/Nx SPA Skill

## Required workflow

1. Read `AGENTS.md`, applicable scoped `AGENTS.md` files, and this skill before editing.
2. Classify the task as lightweight or non-trivial using the root criteria. For non-trivial work, create or update the task specification before production implementation.
3. Inspect `package.json`, `project.json`, `nx.json`, and relevant compiler/lint configuration to establish installed Angular/Nx versions, project type, available targets, and constraints. Do not apply a newer Angular convention merely because it exists.
4. Identify task type and read the supporting standards below that apply. Read all applicable files before implementation, not after it.
5. Inspect nearby implementation, tests, registrations, and equivalent patterns. Preserve observable behavior unless explicitly changing it.
6. Capture `git status --short`; never overwrite unrelated dirty work.
7. Identify focused and broader validation before modifying files.
8. Implement the smallest coherent change, then treat it as a draft: execute the self-review, verification gate, correct issues, and rerun validation.

## Current repository constraints

- Angular and Nx versions must be read from `package.json` for every task. This skill was calibrated against Angular 21.2 and Nx 22.7, but it is not a license to migrate.
- Preserve the current NgModule bootstrap, module routing, and NGXS architecture unless explicitly authorized otherwise.
- This is currently one `type:app` Nx project, not a library workspace. The Nx taxonomy below is a guardrail for future authorized restructuring, not permission to create libraries or tags.
- Use Jasmine, Karma, Angular TestBed, strict TypeScript, strict templates, Angular Material/CDK, RxJS, NGXS, dynamic-mapper, Sentry, and OpenTelemetry consistently with nearby code.

## Read the applicable supporting standards

- Always: [architecture](architecture.md), [TypeScript](typescript.md), and [review and validation](review-and-validation.md).
- Non-trivial work: [specification-driven development](../specification-driven-development/SKILL.md).
- Behaviorally testable implementation, bug fix, or refactoring: [test-driven development](../test-driven-development/SKILL.md).
- Before reporting completion: [verification gate](../verification/SKILL.md).
- Components, directives, pipes, templates, forms, or styles: [components and templates](components-and-templates.md).
- User-facing templates, CSS/SCSS, Angular Material presentation, or UI/UX behavior: [styling, UI, and template standards](styling-and-ui.md).
- NGXS, signals, RxJS, APIs, providers, mappings, or errors: [state, RxJS, and data access](state-rxjs-and-data-access.md).
- Tests or changed behavior: [testing](testing.md).
- User input, DOM, auth/permissions, telemetry, charts, performance, or user-facing UI: [security, accessibility, and performance](security-accessibility-performance.md).

## Non-negotiable decisions

- Order decisions by correctness, security, data integrity, behavior preservation, simplicity, readability, maintainability, testability, accessibility, then measured performance.
- Apply KISS, YAGNI, DRY, SOLID, high cohesion, low coupling, composition over inheritance, and the Law of Demeter pragmatically. Introduce an abstraction only for an observed present problem.
- Keep clear ownership. Do not use `shared` as a dumping ground, deep-import another library’s internals, introduce a competing state library, inject `HttpClient` into a component, or bypass established mapping/error/telemetry boundaries.
- Keep the scope narrow. Do not perform standalone, zoneless, signals, state-library, or folder migrations without explicit authorization.
- Never hide a problem with `any`, `@ts-ignore`, `@ts-expect-error`, a broad lint disable, `--force`, `--legacy-peer-deps`, test deletion/skipping, weakened strict settings, commented-out old code, or a placeholder.
- Quantitative limits are design signals, not targets to game. Record a narrow exception with exact path, threshold, reason, why decomposition is worse, and removal/review condition.

## Task-type rules

| Task               | Required outcome                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Implementation     | Create/update the non-trivial specification; change only authorized scope; cover meaningful behavior test-first.       |
| Bug fix            | Reproduce and specify the defect; add a failing regression test when practical; avoid symptom-only fixes.               |
| Refactoring        | Preserve observable behavior; add characterization coverage first when it is inadequately protected.                    |
| Architecture audit | Produce evidence and a remediation plan before broad changes; do not modernize application code without authorization. |
| PR review          | Inspect the complete diff against the correct base; report severity and evidence; do not edit unless asked.            |
| Standards-only     | Modify only governance files; validate links and scope; do not change runtime behavior.                                |

Use the [pre-change checklist](../../checklists/angular-pre-change-checklist.md) and [self-review checklist](../../checklists/angular-self-review-checklist.md). Use [prompt templates](../../prompts/) as task starters, never as authority over this skill.
