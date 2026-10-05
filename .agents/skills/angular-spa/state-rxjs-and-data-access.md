# State, RxJS, and Data Access

## State ownership

Choose the smallest owner that is authoritative: local component state for ephemeral view state; route state for URL-addressable state; an owning feature service/signal for feature-local coordinated state; NGXS for shared business state, cross-component/route workflows, caching, or centralized feature behavior. Do not duplicate one authoritative value across signals, subjects, NGXS, and route state.

## NGXS and signals

Preserve NGXS; do not introduce NgRx or another state library. Keep actions, state models, selectors, and state implementations typed and owned. Use immutable updates, pure/composable selectors, explicit loading/error states, and deliberate action concurrency. Avoid broad snapshots and store access in presentational components. Export one action per file unless an inseparable family follows an established, documented local convention.

Keep writable signals private when practical; expose read-only signals/reads; use `computed` for derivation and `effect` only for side effects. Do not migrate an entire feature to signals without authorization.

## RxJS

Prefer declarative flows and the `async` pipe. Avoid nested subscriptions. When `subscribe()` is necessary for a side effect, bind its lifecycle using `takeUntilDestroyed`, `DestroyRef`, or the existing local teardown pattern. Choose `switchMap`, `concatMap`, `mergeMap`, or `exhaustMap` based on cancellation, ordering, concurrency, and duplicate-click behavior. Do not silently swallow errors. Use `shareReplay` only with explicit lifecycle/cache invalidation/staleness behavior. Release timers, observers, chart instances, and subscriptions.

## HTTP, mapping, and errors

Keep `HttpClient` in approved data-access code, never a component. Use typed requests/responses, explicit DTO-to-domain/state/form/view mapping, precise money/currency/date/identifier models, cancellation, and established endpoint/configuration patterns. Preserve global interceptors for auth, correlation, shared error normalization, telemetry, and bounded logging; never put feature workflows in an interceptor.

Retries must be bounded, cancellation-aware, status-aware, observable, and limited to safe/idempotent operations; do not blindly retry validation or auth failures. Do not duplicate requests through independent subscriptions. Show user-appropriate errors without internal details and do not log secrets, tokens, PII, or financial payloads.
