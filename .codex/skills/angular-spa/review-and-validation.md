# Review and Validation

## Validation levels

Discover the scripts/targets that actually exist before running commands. In this workspace, common commands include `npm run lint`, `npm run test`, `npm run test:ci`, `npm run build`, `npm run build:prod`, `npm run validate`, and `npm run ci:build`; use only those that fit the change and are present at execution time.

- **Focused validation:** run checks covering touched files/projects and changed behavior during implementation.
- **Broader validation:** run when shared state/providers, routing, global configuration, dependency boundaries, workspace configuration, or framework/dependency versions are affected.
- **Documentation/governance validation:** validate Markdown, links, heading structure, diff whitespace, and scope. A build is not needed unless generated documentation is part of the product.

Report each check as `PASS`, `FAIL`, or `NOT RUN`, with material output or reason. Never report an unexecuted command as a pass.

## Mandatory self-review

Treat the first implementation as a draft. Before finalizing:

1. Run `git status --short`, `git diff --stat`, `git diff --check`, and inspect the complete relevant diff (including staged changes where relevant).
2. Review every changed file for task scope, unintended dirty-file overlap, architecture boundaries, API/data-contract compatibility, state ownership, loading/error behavior, lifecycle teardown, type safety, accessibility, security, performance, and tests.
3. Search the changed diff contextually for `TODO`, `FIXME`, `HACK`, `TEMP`, `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `console.log`, `bypassSecurityTrust`, `innerHTML`, `subscribe(`, `setTimeout`, and `setInterval`.
4. Correct violations the review finds, then rerun affected validation.

## Exception format

For any quantitative or intentional standards exception, record near the decision or in the final report:

```text
Path:
Rule/threshold:
Reason:
Why decomposition or compliance would worsen the design:
Risk and mitigation:
Removal condition or review date:
```

Exceptions must be exact and temporary where possible; never grant a whole-directory exemption.

## Final evidence

State the result, behavior/scope, changed files, design decisions, validation status, self-review findings/corrections, non-run checks, preserved unrelated changes, and concrete remaining risks. Distinguish verified facts, inferences, and unknowns.
