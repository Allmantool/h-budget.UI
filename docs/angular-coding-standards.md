# Angular 20+ SPA Coding Standards

`AGENTS.md` is the canonical source for repository-specific coding rules. This document is the comprehensive human-facing companion.

If this document and `AGENTS.md` disagree:

1. Follow `AGENTS.md`.
2. Treat the discrepancy as documentation debt.
3. Update this document in the same change when appropriate.
4. Do not silently choose whichever rule is more convenient.

These standards apply to production code, tests, scripts, generated code that is subsequently maintained, and changes produced by humans or coding agents.

---

## 1. Rule Language

The following terms are normative:

* **MUST / MUST NOT**: mandatory unless an explicitly documented exception is approved.
* **SHOULD / SHOULD NOT**: expected default; deviations require a concrete reason.
* **MAY**: optional and context-dependent.
* **Prefer**: use unless local consistency or a documented constraint makes another option safer.
* **Review threshold**: crossing the threshold is not automatically wrong, but the design MUST be reviewed and justified.
* **Hard limit**: MUST NOT be crossed without an approved architecture decision or documented exception.

Repository consistency takes precedence over introducing a preferred style as part of an unrelated change.

---

## 2. Core Engineering Policy

Every change MUST optimize for:

1. Correctness.
2. Security.
3. Maintainability.
4. Testability.
5. Operational visibility.
6. Accessibility.
7. Performance.
8. Delivery scope.

Implement the smallest **coherent** change that solves the requested problem.

“Smallest change” does not mean:

* hiding defects;
* duplicating dangerous logic;
* bypassing architecture boundaries;
* omitting necessary tests;
* suppressing errors;
* adding temporary code without an explicit removal plan.

Do not combine feature delivery with unrelated modernization, formatting, folder restructuring, standalone migration, state-management replacement, or dependency upgrades.

---

## 3. Project-Specific Defaults

### 3.1 Tooling and framework

* Use the existing Nx and npm workflow.
* Preserve strict TypeScript compilation.
* Preserve strict Angular template checking.
* Preserve existing lint, formatting, test, build, telemetry, and CI conventions.
* Do not introduce an alternative build system, test runner, state library, UI library, mapper, HTTP abstraction, or telemetry library without explicit approval.
* Use the versions already defined by the workspace lock file and package configuration.
* Do not manually edit generated output, build output, package caches, coverage output, or dependency folders.

### 3.2 Angular architecture

This project currently uses an Angular 20 NgModule-based architecture.

Therefore:

* Preserve the existing NgModule architecture.
* Do not migrate modules, routes, components, directives, pipes, providers, or bootstrap configuration to standalone APIs unless the task explicitly requests that migration.
* Do not mix a standalone migration into an unrelated feature or defect fix.
* A standalone migration MUST include explicit scope, compatibility analysis, provider analysis, route analysis, tests, and rollback considerations.
* Existing provider scope and module registration behavior MUST be preserved unless intentionally changed.
* Existing NGXS state registration, dynamic-mapper registration, interceptors, telemetry registration, and injection-token registration MUST not be moved accidentally.

Angular supporting a newer style is not sufficient justification for changing the project architecture.

### 3.3 Existing technology choices

Use these established technologies consistently with nearby code:

* Angular Material and Angular CDK;
* RxJS;
* Angular Signals;
* NGXS;
* dynamic-mapper;
* Sentry;
* OpenTelemetry;
* the existing HTTP, routing, forms, configuration, and localization conventions.

Do not create competing local frameworks around technologies the project already standardizes.

---

## 4. Architectural Model

The application follows layered, dependency-directed architecture.

The layers are:

```text
Composition / Shell
        |
        v
Presentation
        |
        v
Domain abstractions
        ^
        |
Data and Infrastructure implementations
```

Runtime composition may connect all layers, but source-code dependencies MUST respect the permitted direction.

### 4.1 Layer responsibilities

#### `src/domain`

Contains stable application and business concepts:

* domain models;
* value objects;
* business rules;
* domain services;
* repository/provider contracts;
* use-case contracts;
* domain errors;
* shared business validation;
* domain-specific types and enums.

Rules:

* Domain code MUST remain independent of Angular UI.
* Domain code MUST NOT import components, Angular Material, forms, router APIs, NGXS state, browser APIs, telemetry SDKs, or concrete HTTP services.
* Prefer framework-neutral TypeScript where existing architecture permits it.
* Domain models MUST not be API DTOs merely renamed.
* Business invariants MUST be enforced at the most appropriate domain boundary, not only in the UI.

#### `src/data`

Contains concrete data access and integration logic:

* API clients;
* HTTP providers;
* repository implementations;
* transport DTOs;
* request and response models;
* serialization;
* data mappers;
* persistence adapters;
* endpoint-specific error translation.

Rules:

* Direct `HttpClient` usage belongs here or in an explicitly designated API integration layer.
* Data code MAY depend on domain contracts.
* Data code MUST NOT depend on presentation components or feature views.
* API DTOs MUST not escape into presentation or domain code without an intentional mapping decision.
* Transport errors SHOULD be translated into stable application errors before crossing the data boundary.

#### `src/infrastructure`

Contains cross-cutting technical implementations:

* telemetry;
* Sentry integration;
* OpenTelemetry integration;
* SSE infrastructure;
* browser/platform adapters;
* storage adapters;
* logging implementations;
* technical configuration;
* cross-cutting runtime integrations.

Rules:

* Infrastructure MUST NOT import presentation components.
* Third-party SDK details SHOULD remain isolated here.
* Infrastructure SHOULD implement project-owned abstractions where that reduces coupling.
* Application and domain code SHOULD not depend directly on vendor-specific telemetry or transport types.

#### `src/presentation`

Contains user-facing features:

* routed feature modules;
* page/container components;
* presentational components;
* feature facades;
* NGXS actions, state, selectors, and models;
* forms;
* view models;
* presentation validators;
* UI-specific mapping;
* dialogs;
* feature routing.

Rules:

* Components MUST focus on rendering, interaction, and UI orchestration.
* Presentation MAY depend on domain abstractions and approved shared UI infrastructure.
* Presentation MUST NOT directly instantiate or deeply import concrete data implementations.
* Provider wiring SHOULD occur through the owning module or composition root.
* Presentation models MUST be optimized for UI needs, not forced to match API DTOs.

#### `src/app/modules`

Contains application composition and reusable Angular shell concerns:

* root and shell modules;
* application-level configuration;
* reusable domain-neutral Angular modules;
* root provider wiring;
* layout and navigation infrastructure;
* cross-feature UI composition.

Rules:

* This layer MAY wire concrete providers to abstractions.
* It MUST NOT become a dumping ground for feature-specific business logic.
* Shared modules MUST remain cohesive and intentionally scoped.
* Avoid a single “everything shared” module imported by every feature.

### 4.2 Dependency rules

The following rules are mandatory:

* `domain` MUST NOT depend on `presentation`, `data`, or concrete `infrastructure`.
* `data` MUST NOT depend on `presentation`.
* `infrastructure` MUST NOT depend on feature presentation.
* Feature A MUST NOT deep-import Feature B’s internal files.
* Cross-feature access MUST go through an explicitly supported public contract.
* Shared code MUST NOT import feature-specific code.
* Lower-level code MUST NOT call upward into UI code.
* Circular imports and circular project dependencies are prohibited.
* A relative import MUST NOT escape through multiple parent directories to bypass an intended public boundary.
* Public barrel files MUST expose only intentional APIs; they MUST NOT export every internal file automatically.

Where the workspace is divided into Nx projects, enforce these rules with project tags and `@nx/enforce-module-boundaries`.

Where layers remain folders within one project, enforce equivalent rules with ESLint restrictions and code review.

### 4.3 Composition root

Provider selection and concrete implementation wiring belong in an explicit composition location, normally:

* root application modules;
* shell modules;
* feature modules;
* provider-registration modules;
* approved application configuration.

Components MUST NOT select concrete repository or provider implementations dynamically.

Business logic MUST NOT know how telemetry, HTTP, persistence, or transport implementations are constructed.

---

## 5. Design Principles

Patterns are tools, not objectives. Apply them to reduce risk and complexity, not to maximize abstraction count.

### 5.1 SOLID

#### Single Responsibility Principle

A class, function, module, or component SHOULD have one primary reason to change.

Examples:

* a component coordinates UI interaction;
* a mapper translates models;
* a provider communicates with an endpoint;
* a validator validates;
* a selector derives state;
* a use case coordinates one application operation.

Do not interpret “single responsibility” as “one method per class.”

#### Open/Closed Principle

Prefer extension through stable contracts when actual variation exists.

Do not create interfaces, strategies, factories, or plugin systems for hypothetical future variation.

#### Liskov Substitution Principle

Implementations MUST preserve the behavioral contract of the abstraction they implement.

Do not use inheritance when subclasses need to disable, ignore, or contradict base behavior.

#### Interface Segregation Principle

Consumers SHOULD depend only on operations they need.

Avoid broad “manager,” “service,” or “repository” interfaces containing unrelated operations.

#### Dependency Inversion Principle

High-level policy SHOULD depend on project-owned abstractions rather than transport, browser, or vendor implementation details.

Do not add an abstraction that merely renames one concrete class without creating a meaningful boundary.

### 5.2 GRASP

Apply the following GRASP principles:

* **Information Expert:** place behavior with the code that owns the required information.
* **Controller:** use a focused page component, facade, state action, or use case to coordinate a user operation.
* **Creator:** construct objects where lifecycle and dependencies are naturally understood.
* **Low Coupling:** minimize the number of modules that know concrete implementation details.
* **High Cohesion:** keep closely related behavior together.
* **Polymorphism:** use polymorphism only when real behavioral variation exists.
* **Indirection:** introduce an intermediary only when it meaningfully isolates volatility or simplifies consumers.
* **Protected Variations:** isolate unstable APIs, SDKs, and transport contracts behind stable application boundaries.
* **Pure Fabrication:** use services, mappers, facades, or adapters when domain objects or components are not the correct owner of a responsibility.

### 5.3 KISS

Choose the simplest design that:

* satisfies current requirements;
* preserves architecture boundaries;
* is testable;
* makes failure behavior explicit;
* does not create foreseeable operational risk.

Avoid clever code that is shorter but harder to understand.

### 5.4 YAGNI

Do not build:

* extension points without an identified consumer;
* generalized frameworks for one use case;
* feature flags with no rollout need;
* configuration for values that are not expected to vary;
* wrappers around every Angular or RxJS API;
* speculative caching;
* generic repositories that erase meaningful domain behavior.

### 5.5 DRY

Remove duplication when the duplicated knowledge is truly the same and changes for the same reason.

Do not merge code merely because it currently looks similar.

A small amount of local duplication is preferable to a premature abstraction that couples unrelated features.

### 5.6 Law of Demeter

Code SHOULD communicate with direct collaborators rather than navigating long object graphs.

Avoid:

```ts
this.session.user.account.settings.currency.code
```

Prefer a focused model, selector, facade operation, or accessor representing the required concept.

Do not expose entire services, stores, forms, or mutable models merely so consumers can navigate their internals.

### 5.7 Composition over inheritance

Prefer:

* composition;
* directives;
* services;
* pure functions;
* host directives where supported by project conventions;
* configuration objects;
* focused reusable components.

Avoid deep component or service inheritance hierarchies.

Base classes MUST NOT be used solely to share subscription cleanup, logging, injected services, or miscellaneous helper methods.

---

## 6. Change Scope and Repository Hygiene

Before editing code, identify:

* the owning feature;
* the affected architectural layer;
* existing public contracts;
* provider scope;
* state registration;
* route registration;
* mapper registration;
* relevant tests;
* observable side effects;
* telemetry implications;
* security and authorization implications.

Every change MUST:

* preserve unrelated behavior;
* preserve public contracts unless contract change is intentional;
* avoid unrelated formatting;
* avoid moving files without need;
* avoid renaming unrelated symbols;
* avoid upgrading packages without need;
* avoid modifying generated output;
* avoid overwriting unrelated worktree changes;
* keep the diff reviewable.

A nearby defect MAY be fixed only when:

* it is directly involved in the requested behavior;
* leaving it unfixed would make the requested implementation unsafe or incorrect;
* the additional change is documented.

---

## 7. Angular Components and Directives

### 7.1 Component responsibilities

A component SHOULD be either:

* a routed/page/container component coordinating a feature view; or
* a focused presentational component with explicit inputs and outputs.

A component MAY:

* expose UI-ready state;
* coordinate forms;
* dispatch user intents;
* invoke a facade or feature service;
* manage focus and view lifecycle;
* translate user interaction into application actions.

A component MUST NOT:

* contain reusable business rules;
* perform direct HTTP calls;
* deserialize API responses;
* implement repository logic;
* contain broad state-transition logic;
* access unrelated feature internals;
* become the primary error-normalization layer;
* perform telemetry implementation details directly.

### 7.2 Change detection

* New or substantially modified components SHOULD use `ChangeDetectionStrategy.OnPush`.
* Existing components SHOULD not be converted as an incidental one-line change unless the behavior has been verified.
* Inputs and state used with `OnPush` MUST be treated immutably.
* Do not mutate arrays or objects and expect an `OnPush` child to detect the change.
* Manual `detectChanges()` or `markForCheck()` requires a specific lifecycle or integration reason.
* Do not use manual change detection to hide incorrect state ownership.

### 7.3 Inputs and outputs

* Inputs and outputs MUST be explicitly typed.
* Outputs SHOULD describe business or UI intent, such as `saveRequested`, not implementation events such as `buttonClicked`.
* Do not prefix output names with `on`.
* Avoid input setters with hidden side effects.
* Do not mutate input objects.
* Prefer readonly declarations where supported by the local API style.
* Use a cohesive view-model input when many values always travel together.
* Do not replace several independent inputs with a generic options object merely to reduce a metric.

### 7.4 Member visibility

* Injected collaborators SHOULD be `private readonly`.
* Members used only by the template SHOULD be `protected` where compatible with local conventions.
* Public members MUST represent an intentional public API.
* Constants and immutable references SHOULD be `readonly`.
* Avoid exposing Subjects, stores, services, or mutable collections publicly.

### 7.5 Lifecycle hooks

* Implement the corresponding lifecycle interface.
* Keep lifecycle methods small and declarative.
* Delegate meaningful work to named methods.
* Do not put complex branching or long workflows inside `ngOnInit`, `ngOnChanges`, or `ngAfterViewInit`.
* Do not use lifecycle hooks to compensate for unclear ownership or duplicated state.

---

## 8. Templates

Templates MUST remain declarative and understandable without reverse-engineering component internals.

### 8.1 Required practices

* Use semantic HTML before ARIA.
* Use `<button>` for actions and `<a>` for navigation.
* Keep expressions simple.
* Use list tracking for repeated collections.
* Bind classes and styles directly when practical.
* Use pipes, computed values, selectors, or prepared view models for reusable derivation.
* Represent loading, empty, error, success, disabled, and permission states deliberately.
* Keep visual state consistent with actual application state.
* Use the project’s established structural-control-flow style within an existing file.

### 8.2 Prohibited or discouraged practices

Avoid:

* assignment in templates;
* nested ternaries;
* multiple transformations in one expression;
* creating arrays or objects during every change-detection pass;
* calling computational or allocation-producing methods from bindings;
* deeply nested structural directives;
* duplicated authorization or business conditions;
* subscriptions in templates other than approved async interop;
* clickable non-interactive elements;
* direct DOM manipulation.

Simple event handlers and trivial property accessors are acceptable.

### 8.3 Lists

Every non-trivial rendered list MUST use a stable identity.

Do not use the array index as identity when items can:

* be reordered;
* be inserted;
* be removed;
* be refreshed from the server;
* maintain internal component state.

### 8.4 Template consistency

Do not migrate an entire template from legacy structural directives to built-in control flow as part of an unrelated change.

A deliberate migration SHOULD cover the whole coherent template and include behavior verification.

---

## 9. Dependency Injection

### 9.1 Injection style

For new classes, prefer Angular’s `inject()` function unless:

* the surrounding feature consistently uses constructor injection;
* changing the style would create unnecessary inconsistency;
* a framework or test constraint requires constructor injection.

Do not convert existing injection style solely for modernization during a narrow change.

### 9.2 Dependency limits

Injected dependencies are a design signal.

* **Target:** no more than 5 injected collaborators per class.
* **Review threshold:** 6 or 7 injected dependencies.
* **Hard limit:** 8 or more without an approved documented exception.

All injected services and tokens count. Framework lifecycle primitives may be identified separately in the justification, but they do not make an incohesive class cohesive.

When the threshold is crossed, investigate:

* mixed responsibilities;
* missing facade or use case;
* excessive component orchestration;
* an overly broad service;
* missing parameter object or cohesive collaborator;
* incorrect layer ownership.

Do not solve dependency explosion by injecting `Injector`, creating a service locator, or hiding services inside a generic context object.

### 9.3 Injection tokens and provider scope

* Use injection tokens for meaningful abstraction, configuration, or multiple implementations.
* Token names MUST be domain-specific.
* Provider scope MUST be intentional.
* Do not move a provider from feature scope to root scope without analyzing lifecycle and state-sharing consequences.
* Do not register the same state, mapper, interceptor, or provider in multiple scopes accidentally.
* Avoid `providedIn: 'root'` for stateful services that should be feature-scoped.

---

## 10. State Management: NGXS, Signals, RxJS, and Forms

Use each state mechanism for the problem it solves.

### 10.1 State ownership decision

Use component-local Signals or fields for:

* local display state;
* expanded/collapsed state;
* selected tab;
* short-lived interaction state;
* derived synchronous view state.

Use typed reactive forms for:

* user-editable form state;
* validation state;
* dirty/touched status;
* form submission values.

Use NGXS for:

* state shared across multiple components;
* state surviving routed component recreation;
* coordinated feature workflows;
* cached domain data with defined ownership;
* cross-route state;
* state requiring actions and selectors.

Use RxJS for:

* asynchronous event streams;
* cancellation;
* concurrency;
* debouncing;
* WebSocket/SSE streams;
* composition of multiple async sources.

Do not put every boolean into NGXS.

Do not create parallel writable copies of the same state in NGXS, a Signal, a Subject, and a component field.

### 10.2 NGXS rules

* Actions MUST express an intent or meaningful event.
* Selectors MUST be pure.
* State transitions MUST be immutable.
* State classes MUST not become endpoint clients.
* Components SHOULD consume focused selectors or a facade rather than understand the entire state shape.
* Do not expose the whole state model when a focused selector is sufficient.
* Loading and failure state SHOULD be modeled explicitly when the UI depends on them.
* Concurrent actions MUST have intentional cancellation or ordering semantics.
* State reset behavior MUST be explicit.
* Avoid dispatch chains used as hidden control flow.
* Do not use snapshots as a default substitute for reactive selection.

### 10.3 Facades

Introduce a facade when it:

* reduces component coupling to store structure;
* combines multiple selectors into a stable view model;
* coordinates a coherent use case;
* hides state-library details from reusable UI;
* centralizes feature-level error and loading interpretation.

Do not introduce a facade that only forwards every store method one-for-one without simplifying the consumer.

### 10.4 Signals

Use Signals for synchronous state and derivation.

* `computed` values MUST be pure.
* `effect` MUST be reserved for genuine side effects.
* Do not use effects to copy state from one Signal into another.
* Do not mutate values stored in Signals.
* Do not create circular Signal dependencies.
* Keep Signal ownership clear.
* Prefer one authoritative source of state.
* Avoid repeatedly converting between Signals and Observables without a boundary reason.

### 10.5 RxJS

* Prefer declarative pipelines to nested subscriptions.
* Choose flattening operators intentionally:

  * `switchMap` for cancellation/replacement;
  * `concatMap` for ordered execution;
  * `exhaustMap` for ignoring re-entry while active;
  * `mergeMap` for intentional concurrency.
* Imperative long-lived subscriptions MUST be lifecycle-safe.
* Prefer `AsyncPipe`, approved Signal interop, or `takeUntilDestroyed`.
* Do not use a manual `destroy$` Subject in new Angular 20 code unless an existing abstraction requires it.
* Do not expose mutable Subjects publicly; expose an Observable or Signal.
* Place `catchError` at the boundary that can meaningfully recover, translate, or present the failure.
* Never silently replace an error with an empty success value unless that behavior is explicitly required.
* `shareReplay` MUST use deliberate buffer and reference-count behavior.
* Avoid retrying non-idempotent operations automatically.
* Retry policies MUST be bounded and observable.
* Do not use `subscribe()` merely to assign values that could remain declarative.
* Avoid side effects in `map`, selectors, and computed values.
* Use `tap` only for non-transforming side effects.

---

## 11. Forms

### 11.1 Form approach

* Prefer strictly typed reactive forms for complex, reusable, or business-critical forms.
* Preserve an existing template-driven form during a narrow change when migration is not required.
* New template-driven forms SHOULD be limited to genuinely simple UI.
* Do not use untyped form APIs in new code.
* Prefer non-nullable controls when null is not a valid domain or UI state.

### 11.2 Form boundaries

Keep these shapes distinct when their responsibilities differ:

* API DTO;
* domain model;
* form model;
* state model;
* view model;
* submission command.

Do not bind an API DTO directly as the mutable form source merely to avoid mapping.

### 11.3 Validation

* Validators SHOULD be pure.
* Reusable validation belongs outside the component.
* Cross-field validation belongs at the correct group level.
* Server validation errors MUST be mapped deliberately.
* Validation messages MUST be actionable.
* Do not display every error before the user has interacted with the form unless submission has been attempted.
* Submission MUST guard against invalid or pending form state.
* Disabled control behavior and `getRawValue()` usage MUST be intentional.
* Business invariants MUST still be enforced outside the browser.

---

## 12. HTTP and Data Access

### 12.1 HTTP location

Direct `HttpClient` usage MUST remain in:

* data providers;
* API clients;
* approved infrastructure adapters.

It MUST NOT appear in components, pipes, validators, or presentation helpers.

### 12.2 API contracts

* Request and response DTOs MUST be typed.
* Do not use `any` for API payloads.
* Treat external data as untrusted.
* Nullable and optional fields MUST match actual contract semantics.
* Map snake case, date strings, enums, identifiers, and money values deliberately.
* Do not assume JSON dates are JavaScript `Date` instances.
* Do not use floating-point arithmetic for money without an explicit domain decision.
* Do not expose `HttpResponse`, transport headers, or transport-specific errors beyond the boundary unless required.

### 12.3 Interceptors

Use interceptors only for cross-cutting concerns such as:

* authentication headers;
* correlation identifiers;
* consistent telemetry;
* approved global error translation;
* request timing;
* globally applicable retry behavior.

Do not place endpoint-specific business logic in an interceptor.

Interceptor ordering MUST be understood and tested when behavior depends on order.

### 12.4 Retries and failure behavior

Retries MUST be:

* bounded;
* appropriate for the operation;
* limited to recoverable failures;
* safe for the operation’s idempotency;
* visible in telemetry when operationally relevant.

Do not retry:

* validation failures;
* authorization failures;
* deterministic client errors;
* non-idempotent commands without an idempotency design.

Every user-triggered operation SHOULD define:

* loading behavior;
* success behavior;
* failure behavior;
* duplicate-submission behavior;
* cancellation behavior;
* retry behavior;
* user feedback;
* telemetry behavior where appropriate.

---

## 13. Routing

* Keep feature routing close to the owning feature.
* Prefer lazy-loaded feature modules for substantial screens and feature areas.
* Route configuration MUST not contain feature business logic.
* Guards MAY improve navigation UX but MUST NOT be treated as server authorization.
* Resolvers SHOULD be used only when navigation genuinely requires data before activation.
* Avoid resolvers that make routes appear frozen without loading feedback.
* Route parameters and query parameters MUST be validated and normalized.
* Route components SHOULD not depend on router snapshots when reactive parameter changes are expected.
* Redirects and wildcard routes MUST be explicit and ordered correctly.
* Large feature bundles SHOULD not be eagerly imported into the root module without justification.

---

## 14. Error Handling and User Feedback

Failures MUST not disappear.

### 14.1 Error ownership

Handle an error at the lowest layer that can make a meaningful decision:

* data layer: translate transport failures;
* use case/state/facade: decide recovery and state transition;
* component: present actionable feedback;
* global handler: capture truly unhandled failures.

### 14.2 Required behavior

* Preserve original error context when translating errors.
* Avoid logging the same error independently in every layer.
* User messages MUST not expose stack traces, internal URLs, tokens, SQL, or sensitive payloads.
* Technical logging SHOULD include correlation context where available.
* Expected business errors SHOULD be modeled separately from unexpected technical failures.
* Empty state MUST not be used to disguise a failed request.
* A global error handler MUST not be the normal control flow for recoverable operations.
* Errors MUST NOT be swallowed with an empty `catchError`.
* Fire-and-forget operations require explicit failure and telemetry handling.

---

## 15. Security

Security rules are non-negotiable.

* Never place secrets, private keys, service credentials, or privileged API keys in Angular source, environment files delivered to the browser, or client-visible configuration.
* Treat all external and user-provided values as untrusted.
* Prefer Angular template binding and sanitization.
* Avoid direct DOM APIs.
* Use `DomSanitizer.bypassSecurityTrust...` only with a documented security review.
* Never construct Angular templates from user input.
* Do not use client-side route guards as the sole authorization control.
* Authorization MUST be enforced by the server.
* Do not log authentication tokens, personal data, account details, or sensitive request bodies.
* Follow the existing authentication-token storage architecture; do not introduce a new browser storage mechanism casually.
* Do not append sensitive values to query strings.
* External links opened in a new browsing context MUST prevent opener abuse.
* File names, MIME types, and client-side validation MUST not be trusted as server-side security validation.
* Do not suppress dependency security warnings without documenting the reason and remediation.
* Security headers, CSP, Trusted Types, cookie flags, and CSRF protections are application-wide concerns and MUST be changed only with end-to-end analysis.

---

## 16. Accessibility

Target WCAG 2.2 AA unless project requirements specify a stronger standard.

Every interactive feature MUST support:

* keyboard operation;
* visible focus;
* meaningful focus order;
* screen-reader semantics;
* sufficient contrast;
* zoom and responsive reflow;
* clear labels;
* understandable error messages.

Required practices:

* Use semantic HTML first.
* Every form control MUST have an accessible name.
* Icon-only controls MUST have an accessible label.
* Do not use color as the only indicator.
* Dialogs MUST manage focus correctly.
* Dynamic status changes SHOULD be announced when necessary.
* Custom controls MUST support keyboard behavior and ARIA semantics.
* Prefer Angular Material/CDK accessibility behavior over reimplementing interaction primitives.
* Decorative images MUST be ignored by assistive technology.
* Informative images MUST have meaningful alternatives.
* Validation errors SHOULD be associated with their controls.
* Disabled appearance MUST match actual interaction behavior.
* Accessibility tests SHOULD cover keyboard navigation and automated checks for important flows.

ARIA does not repair incorrect HTML semantics. Use it only where native semantics are insufficient.

---

## 17. Performance

Performance work MUST be evidence-driven, but obvious scalable defaults are required.

### 17.1 Rendering

* Use `OnPush` for new or substantially modified components.
* Use stable tracking for rendered lists.
* Avoid expensive template methods.
* Avoid repeated allocation in bindings.
* Keep derived values memoized through selectors, computed values, or appropriately cached streams.
* Avoid rendering very large collections without pagination, incremental rendering, or virtual scrolling.
* Avoid unnecessary manual change detection.
* Do not mutate shared state under `OnPush`.

### 17.2 Loading

* Lazy-load substantial feature routes.
* Avoid importing large libraries through broad entry points when a supported focused import exists.
* Use deferrable views for heavy, non-critical content when compatible with the project architecture.
* Use optimized image handling for significant application images.
* Do not add a large dependency for a small utility.
* Preserve or improve configured bundle budgets.
* Analyze unexpected main-bundle growth before merging.

### 17.3 Network

* Avoid duplicate subscriptions that create duplicate HTTP requests.
* Cache only when freshness, invalidation, ownership, and error behavior are defined.
* Cancel obsolete searches and route-dependent requests.
* Debounce high-frequency user input where appropriate.
* Do not preload all lazy features without measuring the trade-off.

### 17.4 Measurement

Use Angular DevTools, browser performance tools, bundle analysis, and production telemetry before introducing complex optimization.

Do not introduce memoization, custom scheduling, manual DOM operations, or caching based only on speculation.

---

## 18. TypeScript and General Coding Rules

### 18.1 Types

* Do not use `any` in new production code.
* Prefer `unknown` at untrusted boundaries and narrow it safely.
* Avoid unsafe type assertions.
* Never use double assertions to bypass the compiler.
* Prefer discriminated unions for finite states.
* Use enums only when they improve the domain model or match existing conventions.
* Prefer literal unions for small closed UI choices when no runtime enum object is needed.
* Use `readonly` for immutable contracts and collections where practical.
* Model nullability explicitly.
* Do not use `!` to conceal uncertain initialization without a lifecycle guarantee.
* Export only symbols intended for external use.

### 18.2 Naming

Names MUST communicate purpose.

Avoid vague names such as:

* `data`;
* `item`;
* `obj`;
* `manager`;
* `processor`;
* `handler`;
* `helper`;
* `utils`;
* `common`;
* `temp`;
* `doWork`.

Context may make a short name acceptable for a small local scope.

Use:

* nouns for values and types;
* verbs for operations;
* `is`, `has`, `can`, or `should` for booleans;
* meaningful action names for event handlers;
* names reflecting units, such as `timeoutMs`.

### 18.3 Functions

* Functions SHOULD perform one coherent operation.
* Prefer guard clauses to deep nesting.
* Avoid boolean parameters that radically change behavior.
* Prefer a named options object when several related arguments travel together.
* Do not use a parameter object to hide an incoherent operation.
* Keep side effects visible.
* Pure functions MUST not mutate inputs.
* Do not mix validation, persistence, telemetry, and UI messaging in one function.

### 18.4 Comments

Comments SHOULD explain:

* why a non-obvious decision exists;
* a constraint not visible in code;
* a workaround and its removal condition;
* a security or compatibility concern;
* an intentional trade-off.

Comments SHOULD NOT repeat what the code already states.

TODO comments MUST include enough context to be actionable and SHOULD reference a tracked item where project conventions support it.

### 18.5 Constants and magic values

* Extract values when the name adds meaning or the value is reused.
* Do not create a constants file containing unrelated values.
* Keep feature constants near the owning feature.
* Include units in time, size, and quantity names.
* Do not hard-code environment-specific URLs, tenant identifiers, secrets, or deployment assumptions.

---

## 19. Quantitative Complexity Guardrails

Metrics are design alarms, not substitutes for engineering judgment.

Generated files, declarative configuration, test data, and unavoidable contract definitions may require different limits, but deviations MUST remain intentional.

| Area                                      |    Preferred target |                              Review threshold / hard rule |
| ----------------------------------------- | ------------------: | --------------------------------------------------------: |
| Production TypeScript file                | ≤ 300 logical lines |                                          Review above 400 |
| Component TypeScript                      | ≤ 250 logical lines |                                          Review above 300 |
| Service, facade, provider, or state class | ≤ 300 logical lines |                                          Review above 400 |
| HTML template                             | ≤ 200 logical lines |                                          Review above 250 |
| Component stylesheet                      | ≤ 300 logical lines |                                          Review above 400 |
| Function or method                        |  ≤ 30 logical lines |                                           Review above 50 |
| Control-flow nesting                      |          ≤ 3 levels |                                             Avoid above 4 |
| Cyclomatic complexity per function        |                ≤ 10 |                              Refactor or justify above 15 |
| Function parameters                       |                 ≤ 4 |                                     Review at 5; avoid 6+ |
| Injected dependencies per class           |                 ≤ 5 |             Review at 6–7; 8+ requires approved exception |
| Component inputs                          |                 ≤ 7 |                                            Review above 7 |
| Component outputs                         |                 ≤ 5 |                                            Review above 5 |
| Public/protected component API members    |        Keep minimal | Review when API is difficult to understand as one concept |

Logical lines exclude blank lines, imports, and comment-only lines.

Crossing a threshold SHOULD trigger questions such as:

* Does this file contain more than one concept?
* Is orchestration mixed with implementation?
* Is there a missing child component, mapper, validator, selector, use case, or adapter?
* Is the abstraction already cohesive despite its size?
* Would splitting make navigation and reasoning worse?
* Is the file large because of repetitive declarations that can be generated safely?

Do not split code into arbitrary fragments merely to satisfy a metric.

---

## 20. Shared Code and Reuse

Shared code has a higher maintenance cost because it increases coupling.

Code belongs in shared infrastructure only when:

* at least two real consumers need the same behavior;
* the behavior is domain-neutral or has a clearly defined shared domain;
* consumers need the same contract;
* ownership and change policy are clear.

Do not move code to `shared` because it might be useful later.

Avoid:

* giant shared modules;
* generic component libraries containing feature behavior;
* global helper files;
* shared mutable state;
* base classes used by unrelated features;
* public exports of internal implementation details.

Feature-specific reusable code belongs in the owning feature.

---

## 21. Testing Standards

Tests MUST protect behavior and important contracts, not mirror implementation structure.

### 21.1 Test levels

Use the smallest appropriate level:

* pure unit tests for domain rules, validators, mappers, reducers, selectors, and helpers;
* Angular component tests for template and component interaction;
* service/provider tests for API contracts and error translation;
* NGXS tests for state transitions and selectors;
* routing tests for guards, parameters, redirects, and routed behavior;
* integration tests for connected feature slices;
* end-to-end tests for critical business journeys.

### 21.2 Required scenarios

Changed behavior SHOULD test applicable scenarios:

* successful operation;
* validation failure;
* transport failure;
* business failure;
* unauthorized or forbidden behavior;
* empty state;
* loading state;
* retry or duplicate submission;
* cancellation or stale request;
* boundary and null cases;
* accessibility-relevant interaction.

### 21.3 Component tests

* Test the component and template together where rendering behavior matters.
* Prefer user-visible behavior over private method calls.
* Use Angular Material/CDK harnesses where available.
* Create harnesses for reusable interactive components when that meaningfully stabilizes tests.
* Avoid brittle CSS and DOM-structure selectors.
* Do not rely on private implementation details.
* Avoid `NO_ERRORS_SCHEMA` as a default way to make tests compile.
* Do not mock every child blindly when integration with that child is the behavior under test.

### 21.4 HTTP tests

* Use Angular HTTP testing utilities.
* Assert method, URL, parameters, relevant headers, and body.
* Test error mapping.
* Verify outstanding requests.
* Do not call real backend services from unit tests.

### 21.5 Test quality

Tests MUST be:

* deterministic;
* isolated;
* readable;
* fast enough for their level;
* free of arbitrary sleeps;
* explicit about expected behavior.

Do not weaken, delete, skip, or broadly rewrite tests merely to make a change pass.

Coverage percentage is a signal, not proof of correctness.

### 21.6 Test placement

Follow the repository’s established test-location convention.

Do not relocate existing tests as part of an unrelated implementation.

---

## 22. Observability and Telemetry

Operational behavior is part of production correctness.

* Preserve existing Sentry and OpenTelemetry conventions.
* Add telemetry only when it helps diagnose or measure meaningful behavior.
* Avoid logging every method entry or successful trivial operation.
* Errors SHOULD contain actionable context without sensitive data.
* Preserve correlation identifiers across supported request flows.
* Do not emit high-cardinality values as metric dimensions.
* Do not include user-entered sensitive values in telemetry.
* Avoid duplicate reporting of the same error at multiple layers.
* Expected validation failures SHOULD not be reported as unexpected application crashes.
* Telemetry failures MUST NOT break primary user behavior.

For important operations, consider whether operators need to know:

* that the operation failed;
* which operation failed;
* whether it was retried;
* whether it recovered;
* how long it took;
* whether data reconciliation is needed.

---

## 23. Top 20 Angular SPA Anti-Patterns

### 1. God component

**Problem:** One component performs rendering, data access, mapping, validation, state transitions, telemetry, and business logic.

**Replacement:** Split UI, orchestration, business policy, mapping, and integration responsibilities.

### 2. Components calling `HttpClient`

**Problem:** UI becomes coupled to transport contracts and difficult to test.

**Replacement:** Use a provider/API client and expose an application-facing contract.

### 3. Business logic in templates

**Problem:** Rules are duplicated, difficult to test, and repeatedly evaluated.

**Replacement:** Use domain functions, selectors, computed values, validators, or prepared view models.

### 4. Nested subscriptions

**Problem:** Creates race conditions, hidden concurrency, weak error handling, and cleanup problems.

**Replacement:** Use RxJS composition with the correct flattening operator.

### 5. Unmanaged subscriptions

**Problem:** Causes memory leaks and callbacks after component destruction.

**Replacement:** Use `AsyncPipe`, approved Signal interop, or `takeUntilDestroyed`.

### 6. Duplicated sources of truth

**Problem:** The same state is independently writable in a form, Signal, Subject, component field, and NGXS.

**Replacement:** Define one owner and derive all other representations.

### 7. Global state for local UI

**Problem:** Temporary view details create global coupling and complex reset behavior.

**Replacement:** Keep local interaction state in the component or focused local abstraction.

### 8. Direct store coupling in every component

**Problem:** Store shape becomes the public API of the entire feature.

**Replacement:** Use focused selectors, container boundaries, or a facade where it reduces coupling.

### 9. DTO leakage

**Problem:** API transport changes propagate throughout domain, state, forms, and templates.

**Replacement:** Map DTOs into intentional domain, state, form, or view models.

### 10. Feature internals imported across features

**Problem:** Creates hidden dependencies and prevents independent evolution.

**Replacement:** Expose an intentional public contract or move truly shared behavior to an owned shared boundary.

### 11. Giant shared module or shared folder

**Problem:** Everything depends on everything, bundles grow, and ownership disappears.

**Replacement:** Create small cohesive shared units and keep feature code with its owner.

### 12. Generic `utils`, `helpers`, `common`, or `manager` dumping grounds

**Problem:** Unrelated behavior accumulates without clear ownership.

**Replacement:** Name code after its responsibility and place it with the owning feature or layer.

### 13. Dependency-injection explosion

**Problem:** A class coordinates too many responsibilities.

**Replacement:** Split responsibilities, introduce a cohesive facade/use case, or move behavior to the information expert.

### 14. Service locator

**Problem:** Dependencies become hidden and runtime failures replace compile-time clarity.

**Replacement:** Inject explicit collaborators. Do not use `Injector` to bypass dependency design.

### 15. Mutation with `OnPush`

**Problem:** UI updates become inconsistent because object identity does not change.

**Replacement:** Apply immutable updates and pass new references.

### 16. Missing list tracking

**Problem:** Angular recreates DOM and component state unnecessarily.

**Replacement:** Track by stable domain identity.

### 17. Premature abstraction and speculative frameworks

**Problem:** YAGNI violations add indirection and make simple behavior difficult to follow.

**Replacement:** Implement the current use case simply and extract only after variation or duplication is demonstrated.

### 18. Swallowed errors and blind retries

**Problem:** Failures appear as empty success, and unsafe operations may execute repeatedly.

**Replacement:** Model failure explicitly and retry only bounded, recoverable, safe operations.

### 19. Client-side security as authorization

**Problem:** Guards, hidden buttons, or disabled controls are treated as access control.

**Replacement:** Enforce authorization on the server and use client checks only for UX.

### 20. Brittle implementation-detail tests

**Problem:** Tests fail during harmless refactoring but miss user-visible defects.

**Replacement:** Test public behavior, DOM interaction, contracts, state transitions, failures, and critical journeys.

---

## 24. Dependency and Package Governance

A new dependency MUST have:

* a current concrete requirement;
* an owner;
* a license compatible with the project;
* acceptable security posture;
* acceptable maintenance activity;
* acceptable bundle/runtime impact;
* a reason existing Angular, RxJS, Material/CDK, browser, or project utilities are insufficient;
* a test strategy;
* a removal or replacement consideration if it is high-risk.

Do not add a package for functionality that can be implemented safely and clearly in a few lines.

Do not duplicate packages already providing the same capability.

Package upgrades MUST be separate from unrelated behavior changes unless required to implement or secure the requested change.

---

## 25. Documentation

Update documentation when a change affects:

* architecture;
* setup;
* runtime configuration;
* routes;
* provider registration;
* state registration;
* public contracts;
* API expectations;
* telemetry behavior;
* security behavior;
* deployment;
* developer workflow;
* known operational recovery.

Documentation MUST describe current behavior, not an intended future state presented as complete.

Architecture decisions with lasting consequences SHOULD be recorded in an ADR or the project’s equivalent decision log.

---

## 26. Coding-Agent Execution Protocol

A coding agent MUST follow this sequence.

### Step 1: Read instructions

Read:

* `AGENTS.md`;
* relevant nested instruction files;
* project configuration;
* the requested task;
* nearby implementation and tests.

Do not assume generic Angular conventions override project rules.

### Step 2: Establish scope

Identify:

* files likely to change;
* behavior that must remain unchanged;
* affected architectural layers;
* public contracts;
* provider and state registrations;
* existing uncommitted changes;
* relevant validation commands.

### Step 3: Inspect before designing

Search for:

* existing equivalent patterns;
* reusable contracts;
* selectors;
* facades;
* providers;
* mappers;
* validators;
* tests;
* telemetry;
* error handling.

Do not create a second pattern before understanding the first.

### Step 4: Choose the smallest coherent design

The design MUST:

* respect dependency direction;
* avoid unrelated modernization;
* make failure behavior explicit;
* preserve compatibility;
* remain testable;
* satisfy the standards in this document.

### Step 5: Implement narrowly

* Change only necessary files.
* Preserve local naming and formatting.
* Avoid broad search-and-replace operations.
* Do not touch unrelated worktree changes.
* Do not add suppressed lint or compiler errors without a documented reason.
* Do not leave placeholder implementations presented as complete.

### Step 6: Validate

Run the smallest relevant verification set, expanding according to risk.

Document:

* commands run;
* commands not run;
* failures;
* environmental limitations;
* remaining risks.

### Step 7: Report

The final implementation report MUST include:

1. summary;
2. behavior changed;
3. files changed;
4. architecture and design decisions;
5. validation performed;
6. tests added or updated;
7. known limitations or remaining risks;
8. confirmation that unrelated changes were preserved.

An agent MUST distinguish:

* verified fact;
* reasonable inference;
* unresolved unknown.

It MUST NOT claim a command passed if it was not run successfully.

---

## 27. Validation Matrix

Run the smallest relevant checks first.

### Documentation-only change

* Markdown or documentation validation if available.
* Link or formatting validation where relevant.
* No build is required unless documentation generation is part of the product.

### Pure TypeScript/domain change

* targeted unit tests;
* lint or type checking for the affected project;
* dependent tests when contracts changed.

### Component/template/style change

* targeted component tests;
* template compilation;
* lint;
* accessibility checks where applicable;
* affected project build.

### State/facade change

* targeted NGXS/state tests;
* selector tests;
* component integration tests;
* lint and type checking.

### Provider/API change

* provider tests with HTTP testing utilities;
* mapper tests;
* error-path tests;
* affected feature tests;
* build.

### Routing/module/provider-registration change

* route or module tests;
* provider-scope verification;
* state registration verification;
* production build;
* broader feature smoke tests.

### Dependency or configuration change

* clean install where feasible;
* lint;
* tests;
* production build;
* bundle or dependency analysis;
* security/license review as applicable.

Available project commands include:

```bash
npm run lint
npm run test
npm run test:ci
npm run build
npm run build:prod
npm run validate
npm run ci:build
```

Use the actual scripts defined in `package.json`. Do not invent missing commands.

If a check cannot be run, document why and state the remaining risk.

---

## 28. Definition of Done

A change is complete only when applicable conditions are satisfied:

* requested behavior is implemented;
* acceptance criteria are met;
* architecture boundaries are preserved;
* public contracts are intentional;
* loading, empty, success, and failure behavior are addressed;
* security implications are addressed;
* accessibility implications are addressed;
* subscriptions and resources are lifecycle-safe;
* state ownership is clear;
* DTO/domain/form/view-model mapping is intentional;
* relevant tests pass;
* relevant build and lint checks pass;
* telemetry is preserved or updated appropriately;
* documentation is updated when required;
* no unrelated files were changed;
* no compiler, lint, or test suppression was introduced to hide a problem;
* remaining risks and unverified assumptions are documented.

---

## 29. Exception Policy

A standards exception MUST be:

* explicit;
* narrow;
* justified by a concrete constraint;
* documented near the decision or in an ADR;
* reviewed by the appropriate owner;
* accompanied by risk mitigation;
* temporary when possible.

An exception justification SHOULD include:

```text
Rule:
Reason:
Alternatives considered:
Risk:
Mitigation:
Owner:
Removal condition or review date:
```

“Existing code does it,” “Angular allows it,” “the agent generated it,” and “it was faster” are not sufficient justifications by themselves.

---

## 30. Final Decision Hierarchy

When rules compete, decide in this order:

1. Security and data integrity.
2. Explicit task requirements.
3. `AGENTS.md` and repository-specific constraints.
4. Correct behavior and compatibility.
5. Architectural dependency direction.
6. Testability and operational support.
7. Local consistency.
8. Angular and TypeScript best practices.
9. Quantitative guardrails.
10. Personal style preference.

The objective is not maximally abstract or maximally modern Angular code.

The objective is a secure, understandable, testable, observable, accessible, and evolvable production application.
