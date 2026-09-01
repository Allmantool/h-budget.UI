# Angular/Nx Pre-Change Checklist

- [ ] Verify repository root, task type, scope, and non-goals.
- [ ] Classify the task as lightweight or non-trivial; when uncertain, use the non-trivial SDD path.
- [ ] Read root and closest scoped `AGENTS.md` files.
- [ ] Read `.codex/skills/angular-spa/SKILL.md` and applicable supporting standards.
- [ ] For non-trivial work, create or update `docs/specs/<task>.md` with confirmed facts, assumptions/unknowns, requirements, acceptance criteria, test strategy, traceability, and an implementation plan.
- [ ] For behaviorally testable work, identify the RED test and expected failure before changing production behavior; otherwise record the specific TDD exception and alternative evidence.
- [ ] Read `package.json`, `project.json`, `nx.json`, and relevant TypeScript/lint configuration.
- [ ] Inspect nearby implementation, tests, DI/provider registration, routes, state, models, mappings, contracts, errors, and telemetry.
- [ ] Record `git status --short`; identify and preserve unrelated user changes.
- [ ] Identify existing pattern/abstraction to reuse and the smallest coherent change.
- [ ] For UI/template/style work, inspect existing primitives, tokens/theme conventions, component ownership, responsive behavior, and the BEM structure required by `styling-and-ui.md`.
- [ ] Identify actual focused and broader validation commands before editing.
- [ ] Confirm whether loading, empty, error, authorization, accessibility, security, and performance concerns apply.
- [ ] Confirm that any planned new file has a clear owner and one named exported concept.
