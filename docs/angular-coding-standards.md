# Angular Coding Standards

`AGENTS.md` is the canonical source for project coding rules. This document is a short human-facing companion; if the two disagree, update this file to match `AGENTS.md`.

## Project-Specific Defaults

- Use the existing Nx and npm workflow.
- Preserve the current Angular 20 NgModule architecture. Do not migrate to standalone APIs unless explicitly requested.
- Keep feature UI under `src/presentation`, shell/shared Angular modules under `src/app/modules`, domain contracts under `src/domain`, data/provider implementations under `src/data`, and telemetry/SSE infrastructure under `src/infrastructure`.
- Use NGXS for shared state because it is already established.
- Keep Angular Material/CDK, RxJS, Signals, dynamic-mapper, Sentry, and OpenTelemetry usage consistent with nearby code.
- Preserve strict TypeScript and strict Angular template checking.

## Daily Coding Rules

- Make the smallest behavior-preserving change that solves the task.
- Keep components focused on UI orchestration; move reusable business logic to services, facades, NGXS state/selectors, validators, mappers, use cases, or pure helpers.
- Keep direct `HttpClient` usage inside data/provider or API service classes, not components.
- Keep DTO/entity, domain, state, form, and UI/view-model shapes intentionally mapped.
- Prefer lazy-loaded feature modules for large screens/features and keep routing close to the feature.
- Keep `shared` reusable and domain-neutral; keep feature-specific logic in the owning feature.
- Use `OnPush`, list tracking, typed inputs/outputs, lifecycle-safe subscriptions, and accessible templates where they fit local conventions.
- Prefer reactive forms for complex forms; preserve existing form style when a narrow change does not justify migration.
- Do not add dependencies, broad abstractions, folder moves, or formatting churn without a clear current need.

## Validation

Run the smallest relevant verification set for the change:

- `npm run lint`
- `npm run test`
- `npm run test:ci`
- `npm run build`
- `npm run build:prod`
- `npm run validate` or `npm run ci:build` when broader confidence is needed

If a check cannot be run, document why and note the remaining risk.
