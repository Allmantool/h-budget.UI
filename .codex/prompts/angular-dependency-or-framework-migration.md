# Angular Dependency or Framework Migration Prompt

```text
Objective: Migrate [dependency/framework] from [current] to [target].
Scope: [explicit migration plan and affected projects].
Non-goals: unrelated code cleanup, force installs, manual lockfile edits, hidden compatibility suppressions.
Required discovery: Read AGENTS.md and the Angular/Nx skill; inspect package/version compatibility, workspace targets, migration guidance, local upgrade workflow, affected APIs/tests, and git status.
Expected validation: Use the repository’s actual migration/dependency checks plus focused and production build/test validation.
Self-review: Inspect the complete diff for compatibility, lockfile integrity, APIs, performance/security effects, and scope; fix findings and rerun validation.
Final response: Migration result; compatibility decisions; files changed; PASS/FAIL/NOT RUN validation; self-review corrections; preserved unrelated changes; rollout/rollback risks; next action.
```

Authority: [root instructions](../../AGENTS.md), [Angular/Nx skill](../skills/angular-spa/SKILL.md), and repository dependency guidance.
