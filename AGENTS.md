# Codex Project Guidance

## Priorities

For all code changes in this Angular project, optimize in this order:

1. Correctness
2. Simplicity
3. Readability
4. Maintainability
5. Testability
6. Performance only where measured or clearly needed

Prefer the smallest safe change that solves the task. Follow existing project conventions before introducing a new pattern.

## Current Project Shape

- Angular 20 application managed with Nx and npm.
- The project is currently NgModule-based. Do not migrate the app to standalone components unless explicitly requested.
- Feature UI lives mainly under `src/presentation`, app shell modules under `src/app/modules`, and domain/data/infrastructure code under `src/domain`, `src/data`, and `src/infrastructure`.
- NGXS is the established state-management library. Do not introduce another state library unless explicitly requested.
- Angular Material/CDK and scoped CSS are already in use.
- TypeScript `strict` and Angular `strictTemplates` are already enabled.

## Angular Architecture

- Prefer feature-based organization over technical-layer-only organization.
- Keep feature code self-contained where practical: routing, pages, components, feature services, models, and data-access code should stay close to the feature.
- Follow the existing NgModule architecture. Prefer standalone components only for new isolated work when it fits local conventions.
- Prefer lazy loading for large feature areas.
- Keep routing close to the feature where practical.
- Avoid shared dumping-ground modules or folders.
- Keep `shared` limited to reusable, domain-neutral UI, directives, pipes, and utilities.
- Keep `core` limited to singleton app-wide services, interceptors, guards, config, and shell-level concerns.
- Do not place feature-specific business logic in `shared`.

Recommended structure when it fits the existing project:

```text
src/app/
  modules/
    core/
    shared/
src/presentation/
  feature-name/
    components/
    pages/
    services/
    models/
    data-access/
    feature-name-routing.module.ts
```

Do not reorganize the whole project without an explicit request.

## Components

- Keep components focused on presentation and UI orchestration.
- Move reusable business rules to services, facades, stores, or pure functions.
- Prefer page/container components for orchestration and smaller presentational components for rendering.
- Keep templates readable; avoid complex inline expressions and repeated long expressions.
- Avoid calling expensive methods from templates. Prefer computed state, signals, observables, or precomputed view models.
- Use `trackBy` or Angular control-flow tracking for repeated lists where appropriate.
- Use `ChangeDetectionStrategy.OnPush` where it fits the current feature style.
- Use `protected` for members used only by templates where supported and consistent.
- Avoid public component members that are not part of the template or component API.
- Avoid direct DOM manipulation; prefer bindings, directives, Renderer2, or CDK primitives.

Guidance limits:

- Target component `.ts` files under 150 lines; soft maximum 250 lines.
- Target templates under 150 lines; soft maximum 250 lines.
- Target methods under 30 lines; soft maximum 50 lines.
- Prefer nesting depth of 3 or less.

These are review guidelines, not mechanical rules. Explain reasonable exceptions.

## Services and State

- Give each service one clear responsibility.
- Avoid services that mix API calls, state management, business rules, and UI concerns.
- Prefer typed API clients and explicit, testable mapping logic.
- Avoid hidden mutable global state.
- Prefer immutable updates for state.
- Use simple component state for local UI state.
- Use NGXS, services, signals, or facades for shared or feature-level state when needed.
- Do not introduce NgRx, Akita, Elf, or another state library unless the task explicitly requires it.

## TypeScript

- Preserve strict TypeScript behavior.
- Avoid `any`; use `unknown` at unsafe boundaries and narrow it.
- Prefer explicit domain models and DTOs.
- Prefer `readonly` where values should not be reassigned.
- Prefer discriminated unions for meaningful state variants.
- Avoid large parameter lists and boolean flag parameters that significantly change behavior.
- Prefer composition over inheritance.
- Keep functions pure where practical.
- Avoid mutation unless it improves clarity or measured performance.
- Use meaningful names; avoid vague names such as `Manager`, `Helper`, `Util`, `Processor`, `Data`, or `Info`.
- Use barrel files only when they improve imports and do not create circular dependencies.

Parameter guidance:

- Preferred maximum function parameters: 4; soft maximum: 5.
- Preferred maximum constructor dependencies: 5; soft maximum: 7.
- When exceeded, consider a domain-specific request object, options object, config object, view model, or splitting responsibilities.
- Do not create meaningless parameter bags only to satisfy a number.

## RxJS

- Avoid nested subscriptions.
- Prefer the `async` pipe for template subscriptions.
- Clean up manual subscriptions with `takeUntilDestroyed`, `DestroyRef`, or the local project-standard pattern.
- Avoid side effects in `map`; use `tap` for side effects.
- Choose `switchMap`, `concatMap`, `mergeMap`, and `exhaustMap` based on the desired concurrency behavior.
- Avoid unnecessary Subjects.
- Do not expose writable Subjects directly; expose readonly Observables or signals.
- Handle errors explicitly where user experience or data consistency requires it.
- Do not swallow stream errors silently.
- Keep observable pipelines readable.

## Signals

- Use signals for local reactive state where they simplify code.
- Use `computed` for derived state.
- Use `effect` sparingly and only for side effects.
- Do not use effects to propagate state that should be computed.
- Keep signal writes explicit.
- Do not mix signals and observables unnecessarily.
- Use interop helpers only where needed.
- Follow the current feature style; do not migrate the whole project to signals without an explicit request.

## Templates and Accessibility

- Keep templates simple and readable.
- Avoid unsafe null assertions.
- Prefer typed inputs and outputs.
- Prefer strict equality.
- Use semantic HTML.
- Add accessible labels, roles, and keyboard support where appropriate.
- Do not communicate important UI state only with color.
- Avoid duplicated markup; extract components when it improves clarity.
- Do not over-extract tiny markup fragments if it hurts readability.

## Styling

- Keep component styles scoped.
- Avoid global styles unless needed.
- Avoid deep selectors unless there is no better option.
- Prefer project design tokens or variables when available.
- Avoid magic spacing and color values when the design system provides tokens.
- Prefer Angular Material/CDK primitives for accessible complex controls.
- Do not deeply override Angular Material internals unless necessary and documented.

## Testing

- Add or update tests for meaningful behavior changes.
- Prefer testing public behavior over implementation details.
- Keep tests readable and deterministic.
- Avoid over-mocking.
- Use the existing Karma/Jasmine/Nx setup unless explicitly asked to change test frameworks.
- Test components for rendered behavior and user interactions.
- Test services for business logic, API mapping, and error handling.
- Add regression tests for fixed bugs.
- Use test data builders or factories when setup becomes complex.

## Linting, Strictness, and Formatting

- Keep ESLint changes gradual. Prefer warning-level rules first when existing code is not clean.
- Do not suppress analyzer warnings without fixing the root cause or documenting a strong reason.
- Preserve TypeScript `strict` and Angular `strictTemplates`.
- Treat stricter flags such as `noImplicitOverride` and `noUncheckedIndexedAccess` as staged migrations unless validation proves the repo is ready.
- Preserve Prettier and EditorConfig conventions. Do not mass-format the repository unless explicitly requested.

## Review Checklist

- Scope is small and focused.
- No unrelated rewrites or broad formatting churn.
- Angular style guide and local conventions are followed.
- Component and service responsibilities are clear.
- RxJS subscriptions are safe.
- Signals are used intentionally.
- Templates are readable and accessible.
- Strict typing is maintained.
- Tests are added or updated for meaningful behavior changes.
- Lint, test, and build commands have been run when practical.
- No secrets, tokens, personal data, or sensitive business data are logged or committed.
