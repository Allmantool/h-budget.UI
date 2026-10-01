# TypeScript and File Organization

## Safety requirements

Preserve strict TypeScript and strict Angular templates. Use explicit nullability, typed inputs/outputs, HTTP contracts, route data, state, forms, configuration, and error boundaries. Use discriminated unions and exhaustive handling for meaningful state variants. Prefer `readonly` contracts and immutable updates where appropriate.

Do not use `any`, `@ts-ignore`, `@ts-expect-error`, a broad `eslint-disable`, or a non-null assertion merely to compile. At an unsafe boundary, use `unknown`, narrow it, and make the reason evident. A narrow existing exception must be reviewed contextually, not copied.

## One exported concept per file

Use one named exported declaration per physical file for interfaces, type aliases, enums, classes, components, directives, pipes, services, injection tokens, actions, state, mappers, validators, configuration contracts, models, DTOs, and view models. Local non-exported helper types are allowed only when inseparable from the primary concept and not reusable.

Do not create generic dumping-ground names such as `models.ts`, `interfaces.ts`, `types.ts`, `helpers.ts`, `utils.ts`, `common.ts`, or `constants.ts`. Choose domain-specific names such as `currency-rate.model.ts`, `currency-rate-api.dto.ts`, `currency-rate-view.model.ts`, `fetch-today-currency-rates.action.ts`, or `currency-rate.mapper.ts`. Follow the established local suffix style before introducing a new file.

## Complexity guidance

| Signal                                   | Preferred | Hard stop / review |
| ---------------------------------------- | --------: | -----------------: |
| Production TypeScript/service/state file | 200 lines |    Review at limit |
| Unit-test file                           | 300 lines |    Review at limit |
| Function executable lines                |        25 |    Review above 25 |
| Cognitive/cyclomatic complexity          |        10 |    Review above 10 |
| Nesting depth                            |         3 |     Review above 3 |
| Parameters                               |         5 |                  7 |
| Injected dependencies                    |         5 |                  7 |

Treat these as prompts to improve responsibility design. Do not mechanically extract one-line methods, split an inseparable contract, or add an abstraction solely to reduce a metric. Record the exact, narrow exception when a better design would be worse.

## Naming and APIs

Use domain-specific names, explicit return types for public/complex functions, typed request/response/view models, and typed constants rather than magic strings. Avoid boolean parameters that change behavior substantially; prefer a request/options object only when it truly clarifies a growing contract. Keep public exports intentional; avoid barrel files that create cycles or leak internals.
