# Angular Code Review Checklist

Use this checklist for human reviews and Codex-generated changes.

## Correctness and Scope

- The change solves the requested problem.
- Scope is small and focused.
- No unrelated rewrites or mass formatting are included.
- Public behavior and APIs are preserved unless the task requires a change.
- Error handling and validation follow existing patterns.

## Angular Architecture

- Feature code stays close to the owning feature.
- `shared` contains only reusable, domain-neutral code.
- `core` contains only singleton app-wide concerns.
- NgModule conventions are preserved unless standalone migration was explicitly requested.
- Lazy loading is preserved or used for large feature areas.

## Components and Templates

- Components have clear presentation or orchestration responsibilities.
- Complex business logic is not placed directly in components.
- Templates are readable and avoid complex inline expressions.
- Repeated lists use tracking where appropriate.
- Expensive methods are not called directly from templates.
- `OnPush`, `protected`, and `readonly` are used where they fit the local style.

## Services, State, RxJS, and Signals

- Services have one clear responsibility.
- API/data mapping is explicit and testable.
- NGXS usage follows existing project patterns.
- RxJS subscriptions are cleaned up.
- Nested subscriptions are avoided.
- Stream errors are handled where user experience or consistency requires it.
- Signals are used intentionally, with `computed` for derived state and `effect` only for side effects.

## TypeScript and Linting

- Strict typing is preserved.
- `any` is avoided or justified at unsafe boundaries.
- Function parameters and constructor dependencies remain understandable.
- ESLint warnings are addressed or documented.
- Formatting follows Prettier and EditorConfig.

## Accessibility and Security

- Semantic HTML is used where practical.
- Interactive controls have labels and keyboard support.
- Important state is not communicated only through color.
- ARIA is valid and purposeful.
- No secrets, tokens, credentials, personal data, or sensitive business data are logged or committed.

## Tests and Validation

- Meaningful behavior changes have tests.
- Bug fixes include regression coverage when practical.
- Tests focus on public behavior.
- `npm run lint` has been run when practical.
- `npm run test:ci` or the closest project test command has been run when practical.
- `npm run build:prod` or the closest build command has been run when practical.

## Performance-Sensitive UI Paths

- Performance changes are based on measurement or an obvious bottleneck.
- Large lists avoid unnecessary re-rendering.
- Observable and signal computations avoid avoidable repeated expensive work.
- Bundle-size impact is considered before adding dependencies.
