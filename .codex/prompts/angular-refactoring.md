# Angular Refactoring Prompt

```text
Objective: Refactor [target] while preserving [observable behavior].
Scope: [authorized area].
Non-goals: behavior changes, architecture migration, unrelated formatting, dependency changes.
Required discovery: Read AGENTS.md and the Angular/Nx skill; inspect existing behavior, tests, public contracts, ownership boundaries, and git status.
Expected validation: Add characterization coverage if behavior is not protected; run focused checks and broader checks for shared/global changes.
Self-review: Inspect the complete diff, confirm behavior and boundaries are preserved, fix findings, rerun validation.
Final response: Result; behavior preserved; changed files and rationale; PASS/FAIL/NOT RUN validation; self-review corrections; preserved unrelated changes; risks/exceptions; next safe action.
```

Authority: [root instructions](../../AGENTS.md) and [Angular/Nx skill](../skills/angular-spa/SKILL.md).
