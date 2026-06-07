# Codex Project Guidance

This is the canonical instruction file for AI-assisted and developer changes in this repository. Keep tool-specific guidance, PR checklists, and secondary docs aligned with this file instead of duplicating competing rules.

## Engineering Priorities

For all code changes, optimize in this order:

1. Correctness.
2. Simplicity.
3. Readability.
4. Maintainability.
5. Testability.
6. Performance only where measured or clearly needed.

Prefer the smallest safe change that solves the task. Follow existing project conventions before introducing a new pattern.

## Repository Context

- This is an Angular 20 SPA managed with Nx and npm.
- The app is currently NgModule-based and bootstraps with `platformBrowserDynamic().bootstrapModule(AppBootstrapModule)`. Do not migrate the app to standalone components or `bootstrapApplication` unless explicitly requested.
- Feature UI lives mainly under `src/presentation`.
- App shell, core, shared modules, shared components, interceptors, services, and NGXS state live under `src/app/modules`.
- Domain contracts, models, provider interfaces, and use cases live under `src/domain`.
- API/provider implementations, DTO/entity shapes, and mapping profiles live under `src/data`.
- Browser telemetry, SSE, and other infrastructure concerns live under `src/infrastructure`.
- NGXS is the established shared state-management library. Do not introduce NgRx, Akita, Elf, Redux wrappers, or another state library unless explicitly requested.
- Angular Material/CDK, ApexCharts, dynamic-mapper, RxJS, Sentry, OpenTelemetry, and scoped component CSS are already in use.
- TypeScript `strict` and Angular `strictTemplates` are enabled.
- Tests use Karma, Jasmine, Angular TestBed, and Nx. Existing feature tests live under `src/tests`.

## Non-Negotiable Rules

- Prefer the smallest safe change that satisfies the request.
- Preserve existing UX, routes, data contracts, public APIs, validation behavior, permissions, telemetry, and error-handling behavior unless the task explicitly requires a change.
- Do not perform large rewrites, broad folder moves, standalone migrations, state-library migrations, or formatting-only churn unless explicitly requested.
- Do not add production dependencies unless existing platform/library capabilities are insufficient and the benefit is clear.
- Do not hardcode secrets, credentials, tokens, private endpoints, personal data, or sensitive business data.
- Do not suppress TypeScript, Angular, ESLint, or template warnings without fixing the root cause or documenting a strong reason.
- Do not weaken, delete, or skip tests just to make validation pass.
- When uncertain, inspect nearby implementation and follow the existing local pattern.

## Angular Architecture

- Prefer feature-based organization over technical-layer-only organization.
- Keep feature routing, pages/components, feature services, view models, constants, and mappers close to the owning feature under `src/presentation/<feature>`.
- Keep `src/app/modules/core` for singleton app-wide concerns such as HTTP module setup, interceptors, guards, app configuration, and shell-level behavior.
- Keep `src/app/modules/shared` for reusable, domain-neutral Angular modules, components, pipes, directives, constants, and NGXS state that is intentionally shared.
- Do not put feature-specific business logic in `shared`.
- Keep domain provider interfaces and models in `src/domain`; keep concrete HTTP providers and API DTO/entity mappings in `src/data`.
- Prefer lazy-loaded feature routes for large screens/features. Preserve the current `RouterModule.forRoot` / `RouterModule.forChild` module routing style.
- Avoid circular dependencies between features, shared modules, data providers, and domain contracts.
- Do not inject `HttpClient` directly into components. Direct HTTP access belongs in data/provider or API service classes.
- Keep clear boundaries between API DTOs/entities, domain models, UI/view models, form models, and NGXS state models.
- Do not introduce a new folder architecture that requires large moves unless the user explicitly asks for it.

## Design Patterns

- Use Angular DI for services, providers, adapters, strategies, configuration, mapping profiles, and feature abstractions.
- Do not manually instantiate injectable services with `new`.
- Use `providedIn: 'root'` only for true app-wide singletons. Use feature module providers when lifetime should be feature-scoped, matching the current module style.
- Prefer injection tokens for configurable values or interchangeable implementations when a simple constructor dependency is not enough.
- Use singleton services for authentication/session state, app configuration, logging, telemetry, feature flags, API gateway services, and app-wide state only when they have one clear responsibility.
- Use facades for complex features when components would otherwise coordinate too many services, selectors, commands, or API calls.
- Keep smart/container components responsible for route params, page-level state, facade/service calls, and command orchestration.
- Keep presentational components input/output driven, reusable, and free of direct API calls.
- Use adapter/mapper functions, mapping profiles, or dedicated services between DTOs/entities and domain/UI models. Prefer pure mapping where possible.
- Use strategy or factory patterns only when they reduce real conditional complexity, such as dynamic validation modes, export formats, calculation rules, dynamic dialogs, or strategy selection.
- Avoid speculative interfaces or abstractions for a single implementation unless the existing architecture, tests, or DI boundary requires them.

## TypeScript Standards

- Preserve strict TypeScript behavior.
- Avoid `any`; use `unknown` at unsafe boundaries and narrow it. If `any` is unavoidable, isolate and justify it.
- Avoid non-null assertions unless the value is guaranteed by an invariant that is clear in nearby code.
- Prefer explicit domain models, DTO/entity types, request/response types, and view models.
- Prefer `readonly` for values that are not reassigned and for public observable/signal references.
- Prefer discriminated unions for meaningful state variants such as loading/success/error flows.
- Prefer explicit return types for public methods and complex functions.
- Avoid magic strings where typed unions, enums, const objects, route constants, permission constants, or storage-key constants would improve safety.
- Keep interfaces and types close to the feature unless they are genuinely shared.
- Avoid boolean flag parameters that significantly change behavior.
- Keep functions and constructors understandable. When parameter/dependency lists grow, consider a domain-specific request object, options object, or responsibility split.
- Prefer clear domain-specific names over vague names such as `Manager`, `Helper`, `Util`, `Processor`, `Data`, or `Info`.
- Use barrel files only when they simplify imports and do not create circular dependencies.
- Follow existing import ordering, Prettier settings, tab width, and ESLint rules.

## Components and Templates

- Keep components focused on presentation and UI orchestration.
- Move reusable business rules to services, facades, NGXS states/actions/selectors, validators, mappers, use cases, or pure domain helpers.
- Prefer `ChangeDetectionStrategy.OnPush` for presentational and most feature components unless local style or behavior requires otherwise.
- Keep templates readable; avoid complex inline expressions, repeated long expressions, and unsafe null assertions.
- Avoid calling methods from templates when they compute, allocate, filter, sort, or cause side effects. Use observables, signals, computed values, pure pipes, or precomputed view models instead.
- Use `trackBy` or Angular control-flow tracking for repeated lists, especially tables and larger collections.
- Use typed inputs and outputs. Validate required inputs where runtime absence is possible.
- Keep lifecycle hooks simple and delegate orchestration when they become hard to scan.
- Prefer reactive forms for complex forms and typed reactive forms where practical. Existing template-driven or mixed forms can remain when a narrow change does not justify migration.
- Keep validation logic reusable and testable; move cross-field validation outside components when practical.
- Handle loading, empty, error, disabled, and permission states deliberately.
- Use semantic HTML. Use buttons for actions and anchors for navigation.
- Ensure interactive UI is keyboard accessible and icon-only controls have accessible labels.
- Preserve focus behavior in dialogs, menus, and dynamic screens.
- Do not communicate important state only through color.

## State Management

- Follow the current NGXS patterns for shared and feature-level state.
- Register root state in `AppBootstrapModule` with `NgxsModule.forRoot` and feature state in feature modules with `NgxsModule.forFeature`, matching existing modules.
- Keep NGXS state models typed and state updates immutable.
- Keep actions and selectors focused and named around domain/user events or state transitions.
- Keep selectors composable and avoid selecting large state blobs in components when a focused selector or facade/read model is clearer.
- Do not put side-effect-heavy API orchestration directly in components when a service, facade, or NGXS action flow would keep responsibilities clearer.
- For service-based RxJS state, keep writable Subjects private and expose readonly Observables.
- For Signals, keep writable signals private where possible, expose readonly signals/read methods, use `computed` for derived state, and use `effect` only for side effects.
- Do not migrate whole features between NGXS, RxJS services, and Signals unless explicitly requested.

## RxJS

- Prefer declarative async flows and the `async` pipe where practical.
- Avoid nested subscriptions.
- Use manual `subscribe()` only for necessary side effects, and always manage lifecycle with `takeUntilDestroyed`, `DestroyRef`, the local `destroy` helper, or an existing project-standard cleanup pattern.
- Use `tap` for side effects and `map` for transformations.
- Choose `switchMap`, `concatMap`, `mergeMap`, and `exhaustMap` based on desired cancellation, ordering, concurrency, and duplicate-click behavior.
- Handle observable errors where user experience, data consistency, or logging requires it.
- Do not swallow stream errors silently.
- Use `shareReplay` only when lifecycle, cache invalidation, and stale data behavior are understood.
- Keep pipelines readable; extract named helpers when a pipeline becomes difficult to understand.

## API and Data Mapping

- Keep `HttpClient` usage in data/provider or API service classes, not in components.
- Keep endpoint URLs, API headers, request options, retries, and configuration access consistent with existing constants/services.
- API services/providers should return typed DTOs, domain models, or `Result<T>` consistently with nearby providers.
- Keep DTO/entity-to-domain/UI mapping explicit through dynamic-mapper profiles or dedicated pure functions/services.
- Cover mapping edge cases: nullable fields, optional payloads, enum/string conversions, date parsing/formatting, numeric parsing, and default values.
- Do not leak backend-specific naming into templates unless the DTO/entity is already the intended UI model.
- Do not duplicate ad-hoc mapping across components.
- Do not swallow API errors silently. Preserve global interceptors for correlation IDs, request loading, Sentry, OpenTelemetry, and shared HTTP behavior.
- Use retry only when safe, idempotent, and consistent with existing `ApiRequestOptions` usage.

## Error Handling

- Handle API and state errors deliberately.
- Distinguish validation, authorization, not-found, network, and server errors when UX or data consistency requires it.
- Show user-appropriate messages without exposing internal implementation details.
- Log technical details only through existing logging, telemetry, Sentry, or OpenTelemetry mechanisms.
- Do not log secrets, credentials, tokens, PII, or sensitive business data.
- Avoid catch-all fallbacks that hide defects or make data appear valid when it is not.
- Preserve existing global error handling and interceptor behavior unless the task explicitly changes it.

## Security

- Never hardcode secrets, tokens, passwords, API keys, or private endpoints.
- Do not introduce new browser storage of sensitive tokens unless the existing security model explicitly requires it.
- Prefer Angular bindings and sanitization. Avoid direct DOM manipulation.
- Do not bypass Angular sanitization unless absolutely necessary and justified.
- Validate and encode route/query parameters before using them in API calls.
- Follow existing auth and permission guard patterns when present.
- Treat UI authorization checks as UX support only; do not assume they are security boundaries.
- Avoid exposing internal error details to end users.

## Performance

- Prioritize correctness, simplicity, readability, maintainability, and testability before performance unless the path is clearly hot or measured.
- Preserve lazy loading and consider it for large new feature areas.
- Avoid unnecessary subscriptions and repeated API calls.
- Avoid expensive template expressions and unnecessary change detection triggers.
- Use `trackBy` / `track` for large repeated lists.
- Use pagination, virtualization, incremental loading, pure pipes, memoized selectors, or computed signals for large or expensive data transformations where appropriate.
- Consider bundle impact before adding dependencies.
- Do not prematurely optimize simple code at the cost of clarity.

## Styling

- Keep component styles scoped.
- Avoid global styles unless the change is truly app-wide.
- Avoid deep selectors unless there is no better option, and document the reason when they are necessary.
- Prefer existing CSS conventions, Angular Material/CDK primitives, and existing constants/tokens when available.
- Avoid magic spacing and color values when reusable variables or existing constants fit.
- Do not deeply override Angular Material internals unless necessary and documented.

## Testing

- Add or update tests for meaningful behavior changes.
- Add regression tests for bug fixes when practical.
- Prefer unit tests for services, facades, mappers/adapters, validators, guards, interceptors, strategies, NGXS states, actions, and selectors.
- Component tests should verify rendered behavior and user interactions, not Angular internals.
- Mock API/provider boundaries rather than real network calls.
- Test error paths, nullable/optional mapping cases, route behavior, and edge cases when touched.
- Keep tests deterministic and readable.
- Use the existing Karma/Jasmine/Nx setup unless explicitly asked to change test frameworks.
- If tests cannot be added because of existing setup limitations, explain why and suggest the smallest testing improvement.

## Refactoring Safety

- Preserve behavior first.
- Make incremental, reviewable changes.
- Refactor only when it directly supports the requested change or fixes clear technical debt in the touched area.
- Prefer extracting private methods before introducing new services.
- Extract classes/services only when they reduce real complexity, coupling, or duplication.
- Do not combine broad formatting-only changes with behavioral changes.
- Preserve comments that explain business rules; remove comments that merely repeat code.
- Add comments only for non-obvious decisions, constraints, or domain rules.
- Remove unused code only when safe and related to the task.

## Documentation

- Update documentation when architecture, workflows, public behavior, or conventions change.
- Keep examples short and specific to this repository.
- Prefer checklists and decision rules over long essays.
- Do not create excessive documentation for trivial code changes.
- Keep secondary instruction files consistent with this canonical `AGENTS.md`.

## Codex Task Workflow

1. Read this file and any feature-specific instructions first.
2. Inspect the relevant implementation before editing.
3. Identify the smallest safe change.
4. Follow the current NgModule, NGXS, routing, mapping, and testing patterns.
5. Apply Angular patterns only where they reduce current complexity.
6. Update or add tests where practical.
7. Run available checks when practical:
   - `npm run lint`
   - `npm run test`
   - `npm run test:ci`
   - `npm run build`
   - `npm run build:prod`
   - project-specific verification scripts such as `npm run validate`, `npm run ci:build`, or dependency verification commands when relevant
8. If checks cannot be run, state why.
9. Summarize what changed, why it changed, tests/checks run, and remaining risks or follow-ups.

## Review Checklist

- Scope is small and focused.
- Existing behavior is preserved unless the task explicitly requested a change.
- Current Angular style is followed: NgModules, module routing, and feature modules remain intact.
- Feature/domain/data/infrastructure boundaries are respected.
- Components stay thin and templates stay readable.
- Business logic is outside templates/components where appropriate.
- API calls are isolated in data providers or API services.
- DTOs/entities are mapped intentionally.
- NGXS, RxJS, and Signals usage follows existing project patterns.
- Subscriptions are lifecycle-safe.
- Errors are handled deliberately.
- Loading, empty, error, disabled, and permission states are considered.
- Repeated strings/constants are centralized where useful.
- Accessibility is preserved or improved.
- Strict typing is preserved; `any` and non-null assertions are avoided or justified.
- Tests are added or updated for meaningful logic.
- Lint/build/tests passed, or the reason they were not run is documented.
- No secrets, tokens, credentials, PII, or sensitive business data are logged or committed.
- The solution is simpler than the problem it solves.
