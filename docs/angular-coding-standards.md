# Angular Coding Standards

This project follows the official Angular style guide, existing local conventions, and the priorities in `AGENTS.md`: correctness, simplicity, readability, maintainability, testability, then measured performance.

## Project Conventions

- Use the existing Nx and npm workflow.
- Keep the current NgModule architecture unless a task explicitly asks for standalone migration.
- Keep feature UI under `src/presentation` and app shell/shared modules under `src/app/modules`.
- Keep domain, data, and infrastructure responsibilities separated under their existing top-level folders.
- Use NGXS for shared application state because it is already established in the project.
- Preserve strict TypeScript and strict Angular template checking.

## Architecture

- Prefer feature-based organization and keep feature routing, components, services, models, and data-access code close together.
- Keep `shared` reusable and domain-neutral.
- Keep `core` for singleton app-wide services, interceptors, guards, config, and shell concerns.
- Avoid dumping feature-specific business logic into shared modules.
- Prefer lazy-loaded modules for large feature areas.

## Components and Templates

- Keep components focused on presentation and UI orchestration.
- Move reusable business logic to services, facades, stores, or pure functions.
- Prefer smaller presentational components beneath page/container components when it improves clarity.
- Use `OnPush` where it matches the current feature style.
- Avoid expensive template calls, complex inline expressions, and repeated long expressions.
- Use signals, observables, computed values, or view models for derived UI state.
- Use list tracking with `trackBy` or Angular control-flow tracking where appropriate.
- Prefer semantic HTML, accessible labels, keyboard support, and non-color-only state indicators.

## Services, State, and Data Access

- Give services one clear responsibility.
- Avoid god services that mix API calls, state, business rules, and UI concerns.
- Keep API mapping explicit and testable.
- Prefer immutable state updates.
- Use simple component state for local UI concerns.
- Use NGXS, services, signals, or facades for shared or feature state when needed.
- Do not introduce a new state-management library unless explicitly requested.

## TypeScript

- Avoid `any`; use `unknown` at unsafe boundaries and narrow it.
- Prefer explicit domain models and DTOs.
- Prefer `readonly` when values should not be reassigned.
- Use discriminated unions for meaningful state variants.
- Avoid large parameter lists, deep inheritance, and boolean flag parameters that significantly change behavior.
- Prefer composition and clear domain-specific names.
- Use barrel files only when they simplify imports without creating cycles.

## RxJS and Signals

- Avoid nested subscriptions.
- Prefer the `async` pipe for template subscriptions.
- Clean up manual subscriptions with `takeUntilDestroyed`, `DestroyRef`, or the established local pattern.
- Use `tap` for side effects and `map` for transformations.
- Choose flattening operators intentionally based on cancellation and concurrency needs.
- Do not expose writable Subjects directly.
- Use signals for local reactive state when they simplify code.
- Use `computed` for derived signal state and `effect` only for side effects.
- Do not migrate whole features to signals unless requested.

## Styling

- Keep styles scoped to components unless global styling is genuinely needed.
- Avoid deep selectors unless there is no better option.
- Prefer existing CSS conventions and Angular Material/CDK primitives.
- Avoid magic color and spacing values when reusable tokens or variables are available.

## Testing

- Add or update tests for meaningful behavior changes.
- Prefer public behavior over implementation details.
- Keep tests deterministic and readable.
- Avoid over-mocking.
- Use the existing Karma/Jasmine/Nx setup.
- Add regression tests for fixed bugs.

## Gradual Enforcement

- Keep lint rules warning-level first when existing code is not clean.
- Preserve current strict compiler options.
- Stage additional strictness such as `noImplicitOverride` and `noUncheckedIndexedAccess` behind validation because they can expose many existing issues at once.
- Stage broad cleanup rules such as consistent type-only imports and prefer-readonly after the existing lint error backlog is reduced.
- Do not mass-format the repository as part of behavior changes.
