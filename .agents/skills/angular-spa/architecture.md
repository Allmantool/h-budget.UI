# Architecture and Nx Boundaries

## Preserve the current architecture

This workspace is a single application. Keep feature work near `src/presentation/<feature>`, app-wide shell/core/shared concerns in `src/app/modules`, contracts/use cases in `src/domain`, HTTP and transport mapping in `src/data`, and browser concerns in `src/infrastructure`.

Use existing code as behavior and convention evidence, but correct a known weak pattern only when the task authorizes it. Do not create a new workspace library, move folders, or change module boundaries merely to match this document.

## Responsibilities

- **Application composition root:** bootstrap, root providers/routing, shell, global errors, telemetry, global styles.
- **Feature:** route-level workflows, container components, feature forms, feature use cases, and feature-state coordination.
- **UI:** typed input/output-driven presentational components, directives, pipes, and visual primitives; never direct HTTP, global-store, or route workflow dependencies.
- **Data access:** typed HTTP, API DTOs, mapping, repositories/gateways, persistence/cache/retry policy, server-error translation, and established NGXS ownership.
- **Utility:** pure reusable parsing, formatting, validation, and low-level types. Do not create generic `utils` or `helpers` dumping grounds.
- **Shared:** only intentional cross-feature, domain-neutral ownership; it is a last resort, not a default location.

Use the terms **container component** and **presentational component**. “Smart” and “dumb” are aliases, not the preferred names.

## Future Nx project taxonomy

When an explicitly authorized Nx library change is needed, use one of `type:app`, `type:feature`, `type:ui`, `type:data-access`, `type:util`, or `type:testing`; define tags from real domains (for example `scope:currency-rates`, `scope:dashboard`, `scope:core`, `scope:shared`). Do not create tags or libraries speculatively.

Permitted dependency direction:

```text
type:app     -> type:feature -> type:ui, type:data-access, type:util
type:feature -> type:ui, type:data-access, type:util
type:ui      -> type:ui, type:util
type:data-access -> type:data-access, type:util
type:util    -> type:util
```

Avoid circular dependencies, application-to-application imports, feature-to-feature implementation imports, imports from another library’s `src/lib`, deep imports that bypass a public API, wildcard public exports without review, and barrels that expose internals.

## Design rules

- Keep state ownership explicit and near its workflow.
- Use dependency inversion only at a meaningful boundary, such as provider/domain contracts, APIs, or interchangeable infrastructure.
- Prefer DI over manual instantiation of injectable classes. Use `providedIn: 'root'` only for actual application-wide singletons; otherwise follow existing module/provider scope.
- Use a facade when it creates a coherent feature boundary, not to proxy every store call.
- Keep containers focused on orchestration; move reusable calculations, validation, mapping, and formatting to their rightful owner.
- Do not put feature business logic in interceptors or presentational components.
- Preserve lazy feature routing and current `RouterModule.forRoot` / `forChild` patterns unless migration is authorized.

## Stop conditions

Stop and report instead of guessing when a requested layer placement contradicts an existing public contract, a dependency boundary, provider lifetime, authorization requirement, or state owner.
