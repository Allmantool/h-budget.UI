# Angular Code Review Checklist

Use this checklist for human reviews and Codex-generated changes. `AGENTS.md` is the canonical rule source.

## Scope and Behavior

- The change solves the requested problem with a small, focused diff.
- Existing UX, routes, public APIs, data contracts, validation, permissions, telemetry, and error handling are preserved unless the task required a change.
- No unrelated rewrites, dependency additions, state-library changes, standalone migration, folder moves, or mass formatting are included.

## Angular Architecture

- NgModule, `RouterModule`, lazy-loaded feature modules, and NGXS conventions are preserved.
- Feature code stays near the owning `src/presentation/<feature>` area.
- `src/app/modules/shared` remains reusable and domain-neutral.
- Domain contracts/models stay under `src/domain`; HTTP/data-provider implementations and mapping profiles stay under `src/data`.
- Components do not inject `HttpClient` directly.

## Components, Templates, and UX

- Components have clear presentation or orchestration responsibilities.
- Business logic is not buried in templates or oversized components.
- Templates avoid expensive call expressions, complex inline logic, unsafe null assertions, and missing list tracking.
- Loading, empty, error, disabled, and permission states are considered.
- Semantic HTML, keyboard access, focus behavior, labels for icon-only controls, and non-color-only status indicators are preserved or improved.

## State, RxJS, Signals, and Mapping

- NGXS state models, actions, selectors, and updates are typed and immutable.
- Service-based state keeps writable Subjects private.
- Signals expose readonly or controlled state, use `computed` for derivation, and use `effect` only for side effects.
- RxJS subscriptions are lifecycle-safe; nested subscriptions and silent error swallowing are avoided.
- DTO/entity, domain, state, form, and UI/view-model mapping is explicit and tested where meaningful.

## TypeScript, Security, and Maintainability

- Strict typing is preserved; `any` and non-null assertions are avoided or justified.
- Names are domain-specific and responsibilities are cohesive.
- No secrets, tokens, credentials, PII, private endpoints, or sensitive business data are logged or committed.
- Angular sanitization, binding, existing auth/permission patterns, and interceptor behavior are not bypassed.
- Comments explain non-obvious domain or technical decisions rather than restating code.

## Tests and Validation

- Meaningful logic changes have tests; bug fixes include regression coverage when practical.
- Tests focus on public behavior and mock API/provider boundaries.
- Error paths, nullable mapping cases, route behavior, and edge cases are covered when touched.
- Relevant checks passed, or remaining issues are documented:
  - `npm run lint`
  - `npm run test` or `npm run test:ci`
  - `npm run build` or `npm run build:prod`
