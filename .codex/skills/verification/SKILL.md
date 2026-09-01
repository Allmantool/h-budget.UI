---
name: verification
description: Independently prove task completion against acceptance criteria and repository-specific evidence.
---

# Verification Gate

Implementation complete is not task complete. Use this gate before reporting a task as complete. For this SPA, use the actual command guidance and self-review requirements in [Angular review and validation](../angular-spa/review-and-validation.md); CI currently runs dependency guards plus `npm run lint`, `npm run test:ci`, and `npm run build:prod`.

1. Inspect the current specification and evaluate each applicable acceptance criterion separately. Record concrete test, command, inspection, or environment evidence as `PASS`, `FAIL`, `NOT RUN`, or `BLOCKED`.
2. Run focused checks during implementation, then risk-appropriate surrounding regression checks. Choose real repository scripts; typical task checks are `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:ci`, and `npm run build:prod`. Documentation/governance changes need Markdown/link/scope/diff validation, not an application build.
3. Complete the required diff review, including `git status --short`, `git diff --stat`, `git diff --check`, and the full relevant diff. Confirm unrelated dirty changes remain untouched.
4. Update the specification traceability and progress. Report a limitation or unavailable environment honestly; never infer `PASS` from compilation or an unrelated passing suite.

For non-trivial work, report result, specification path, requirement/acceptance outcomes, TDD RED/GREEN/REFACTOR evidence or exception, changed files, validation results, preserved unrelated changes, and remaining risks. Keep the report concise and outcome-oriented.
