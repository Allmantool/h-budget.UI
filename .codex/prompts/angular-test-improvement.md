# Angular Test-Improvement Prompt

```text
Objective: Improve tests for [behavior/risk].
Scope: [tests and minimum production seams explicitly authorized].
Non-goals: weakening existing assertions, test-framework migration, unrelated refactors.
Required discovery: Read AGENTS.md and the Angular/Nx skill; inspect the implementation, existing tests, provider/state/mapping contracts, actual test target, and git status.
Expected validation: Add deterministic behavior-focused coverage; run relevant tests and lint/build where risk warrants.
Self-review: Inspect the complete diff, confirm tests fail for the intended defect or protect the stated behavior, fix findings, rerun tests.
Final response: Covered behavior/gaps; changed files; test design rationale; PASS/FAIL/NOT RUN validation; self-review corrections; preserved unrelated changes; risks; next action.
```

Authority: [root instructions](../../AGENTS.md) and [Angular/Nx skill](../skills/angular-spa/SKILL.md).
