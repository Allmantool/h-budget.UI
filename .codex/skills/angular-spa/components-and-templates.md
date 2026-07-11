# Components, Templates, and Forms

## Component ownership

Container components may read route state, select/dispatch NGXS, coordinate data access, map view models, own page loading/error states, orchestrate children, and navigate as a workflow outcome. They must not become page-sized god components or contain reusable visual sections, formatting, domain calculations, or direct DOM manipulation.

Presentational components must receive typed data through inputs, emit semantic outputs such as `saveRequested`, `accountSelected`, or `dialogClosed`, and own only local view state. They must not inject the global store, API clients, `HttpClient`, feature repositories, or route orchestration. Do not emit raw DOM events when the parent needs a business event.

Use `ChangeDetectionStrategy.OnPush` for presentational and most feature components unless the local pattern has a documented reason otherwise. Use semantic HTML, native buttons for actions, anchors for navigation, and accessible names for icon-only controls.

## Decomposition signals

Split a component when any of these is true: TypeScript file or template exceeds 150 lines; orchestration and reusable presentation are mixed; independently understandable regions have clear input/output contracts; there are multiple unrelated reasons to change; injected dependencies or test collaborators are unrelated; template nesting is excessive; or the name represents multiple responsibilities. Do not add trivial wrapper components merely to satisfy a count.

## Templates

- Keep templates declarative. Precompute complex display state; do not perform domain calculations, allocation, mutation, side effects, sorting, filtering, or expensive calls in bindings.
- Use project-consistent Angular control flow only after checking the installed version and local direction. Use stable domain keys for repeated/mutable lists; never use an array index as identity for a mutable list.
- Deliberately provide loading, empty, error, disabled, and permission states when applicable.
- Avoid unsafe null assertions, deep conditional nesting, layout-shifting loading overlays, and visual state communicated only by color.
- Preserve focus in dialogs, menus, and dynamic views. Use ARIA only to supplement native semantics.

## Forms

Prefer typed reactive forms for new complex forms, preserving existing template-driven/mixed forms when a narrow task does not justify migration. Use pure reusable validators; keep cross-field validation out of component orchestration; map form values explicitly to domain/request models; make submission and update behavior intentional; expose associated, accessible errors. Do not send raw form values directly to an API, duplicate business validation rules, or embed workflows in templates.

## Size guidance

| Artifact                       | Default limit |
| ------------------------------ | ------------: |
| Component/directive TypeScript |     150 lines |
| Pipe TypeScript                |     100 lines |
| Template                       |     150 lines |
| Component stylesheet           |     250 lines |

Use the exception format from [review and validation](review-and-validation.md) when a limit is exceeded.
