# Angular Bug-Fix Prompt

```text
Objective: Fix [observable defect].
Scope: [affected behavior/files].
Non-goals: symptom-only workarounds, unrelated modernization, dependency changes.
Required discovery: Read AGENTS.md and the Angular/Nx skill; inspect existing failure evidence, local code/tests, state/API/mapping/provider paths, and git status.
Expected validation: Reproduce or explain root cause; add a regression test when practical; run focused and risk-appropriate broader checks.
Self-review: Inspect the complete diff, verify the root cause is addressed without regressions, fix findings, rerun validation.
Final response: Result; root cause; regression coverage; changed files; PASS/FAIL/NOT RUN validation; self-review corrections; preserved unrelated changes; risks/exceptions; next safe action.
```

Authority: [root instructions](../../AGENTS.md) and [Angular/Nx skill](../skills/angular-spa/SKILL.md).
