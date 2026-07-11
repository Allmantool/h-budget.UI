# Angular Architecture Audit Prompt

```text
Objective: Audit [feature/workspace concern] and produce evidence-backed remediation options.
Scope: Read-only unless a separate implementation authorization is given.
Non-goals: source changes, migrations, dependency/configuration changes.
Required discovery: Read AGENTS.md and the Angular/Nx skill; inspect versions, architecture, patterns, tests, registrations, dependency direction, and git status.
Expected validation: Validate the evidence against code/configuration; do not claim unverified compliance.
Self-review: Recheck findings against complete inspected evidence, severity, scope, and standards.
Final response: Findings by severity with paths/evidence; standards affected; safe remediation plan; PASS/FAIL/NOT RUN checks; limitations; next action.
```

Authority: [root instructions](../../AGENTS.md) and [Angular/Nx skill](../skills/angular-spa/SKILL.md).
