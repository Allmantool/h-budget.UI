# Angular Bug-Fix Prompt

```text
Objective: Fix [observable defect].
Scope: [affected behavior/files].
Non-goals: symptom-only workarounds, unrelated modernization, dependency changes.
Required discovery: Read AGENTS.md and the Angular/Nx skill; create/update the task specification; inspect existing failure evidence, local code/tests, state/API/mapping/provider paths, and git status.
TDD: Reproduce the defect with a focused RED regression test when practical, make the smallest GREEN root-cause fix, then refactor only with tests green.
Expected validation: Evaluate each acceptance criterion; run focused and risk-appropriate broader checks.
Self-review: Inspect the complete diff, verify the root cause is addressed without regressions, fix findings, rerun validation.
Final response: Result; specification and acceptance-criteria outcomes; root cause; RED/GREEN regression evidence; changed files; PASS/FAIL/NOT RUN validation; self-review corrections; preserved unrelated changes; risks/exceptions; next safe action.
```

Authority: [root instructions](../../AGENTS.md) and [Angular/Nx skill](../skills/angular-spa/SKILL.md).
