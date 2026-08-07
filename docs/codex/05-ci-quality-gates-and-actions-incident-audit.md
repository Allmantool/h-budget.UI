# CI Quality Gates and GitHub Actions Incident Audit

Audit date: 2026-08-07

## Outcome

The GitHub Actions outage and the missing PR gate enforcement were independent.
`master` protection was restored using the verified GitHub Actions job names. No
workflow, runner, CodeQL, deployment, semantic-release, secret, or release-tag
configuration was changed to work around the outage.

## Incident context

At audit time, GitHub Status reported a major outage for Actions. The incident
reported runner-capacity constraints, jobs waiting or timing out, API errors,
and throttled push/pull-request webhook delivery. Consequently, runner
acquisition failures and an absent workflow run during that window are external
platform evidence, not workflow evidence.

## Classification

| Observation                                           | Classification              | Evidence                                                                                                                                                             |
| ----------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CodeQL on `v1.2.1` could not acquire a hosted runner  | EXTERNAL GITHUB OUTAGE      | Run `31128263497`; the only job was cancelled with no steps and the annotation was `The job was not acquired by Runner of type hosted even after multiple attempts`. |
| Deploy `v1.2.1` could not acquire a hosted runner     | EXTERNAL GITHUB OUTAGE      | Run `31128315004`; its only job had no steps and the same runner-acquisition annotation.                                                                             |
| PR #683 had no checks and could merge                 | REMOTE CONFIGURATION DEFECT | Before remediation there were no rulesets, no required pull request, no required checks, admin enforcement was disabled, and force pushes were allowed.              |
| Release workflow for the PR #683 merge SHA was absent | EXTERNAL GITHUB OUTAGE      | The push occurred during the webhook-throttling incident; there is no Release workflow run/check suite for `6ddba134385fe14749235ceb042607075f9909b9`.               |
| `v1.2.2` is not yet published                         | EXTERNAL GITHUB OUTAGE      | The reachable `fix:` commit requires a PATCH release, but the triggering push did not instantiate Release.                                                           |
| `SonarQubeCloud` on the merge SHA remains queued      | UNKNOWN                     | It is a remote check-suite state; it did not cause the Release workflow to start or block the pre-remediation merge.                                                 |

## PR quality gates

Workflow inventory at the audited revision:

| Quality gate                            | Previously on PR                                     | Currently on PR       | Required on `master` after remediation     |
| --------------------------------------- | ---------------------------------------------------- | --------------------- | ------------------------------------------ |
| Clean install                           | CI                                                   | CI                    | Via `Verify Angular UI`                    |
| Dependency graph and policy             | CI                                                   | CI                    | Via `Verify Angular UI`                    |
| Lint, Karma tests, production build     | CI                                                   | CI                    | Via `Verify Angular UI`                    |
| Release policy and Conventional Commits | Introduced before PR #682                            | PRs to `master`       | `Validate branch and Conventional Commits` |
| CodeQL JavaScript analysis              | PRs to `master`                                      | PRs to `master`       | `Analyze (javascript)`                     |
| Sonar                                   | Master release only                                  | Master release only   | Not a PR requirement                       |
| Formatting                              | Local/formatter validation; no dedicated PR workflow | Unchanged             | Not a remote required check                |
| Deployment                              | Release dispatch only                                | Release dispatch only | Not a PR requirement                       |

The CI workflow intentionally supports the historic target patterns `master`,
`developed`, `feature/*`, `test/*`, `hotfix/*`, `fix/*`, and `tech/**`.
Release-policy and CodeQL intentionally target PRs to `master`, where release
and branch protection apply. The audit found no accidental trigger narrowing
caused by PR #683.

### PR #683 evidence

PR #683 (`fix: improve tag generation, create PR merge event`) targeted
`master`, was opened at `2026-08-06T21:33:09Z`, and merged by `Allmantool` at
`2026-08-06T21:33:17Z`. Its head SHA was
`e95f71e19382d9151b952ad303dc26705745e563`; its merge SHA was
`6ddba134385fe14749235ceb042607075f9909b9`.

The PR status rollup and check-runs were empty: no CI, PR Release Policy, or
CodeQL check was created. There was no merge queue evidence. This was not an
admin bypass of a configured rule: no PR rule existed to bypass. The merge was
permitted because remote branch protection had no `required_pull_request_reviews`
and no required status checks. The concurrent GitHub Actions incident explains
why workflow events did not create checks, but it does not explain why their
absence permitted the merge.

Historical check names were taken from PR #682-era executions and are bound to
the GitHub Actions app (`app_id: 15368`):

- `Verify Angular UI`
- `Validate branch and Conventional Commits`
- `Analyze (javascript)`

### Remediation applied

`master` branch protection now requires a pull request, strictly up-to-date
required checks, and the three checks above. It also enforces administrators,
blocks force pushes and deletion, and retains required conversation resolution.
The pull-request approval count is explicitly zero: this restores the required
PR/check gate without imposing an unrequested second-person review rule on this
personal repository. There are still no repository rulesets.

This is fail-closed: during an Actions outage the three checks cannot pass, so
a PR to `master` cannot merge. No `continue-on-error`, fallback-success job,
retry loop, PAT, secret, self-hosted runner, or workflow duplication was added.

## CodeQL

`.github/workflows/codeql-analysis.yml` remains enabled and structurally
correct: it runs on pushes and PRs to `master`, schedules weekly, uses a
JavaScript matrix, grants `security-events: write`, checks out full history,
initializes CodeQL v3, uses autobuild, and runs CodeQL analyze v3.

The affected CodeQL workflow was run `31128263497` for
`c9f4c9b6ed56601cd2a8d8f3d8fb9f8fb93e54ae` (`v1.2.1`), event `push`, created
at `2026-08-06T21:22:38Z`, runner `ubuntu-latest`. It was cancelled at
`21:37:43Z`; its only job, `Analyze (javascript)`, had an empty steps list.
Therefore actual CodeQL analysis did not execute. Rerun it through GitHub only
after Actions recovers; investigate CodeQL content only if that rerun reaches
an analysis step and fails.

## Release and deployment state

Git history after a tag fetch:

| Item                           | Value                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `v1.2.1` commit                | `c9f4c9b6ed56601cd2a8d8f3d8fb9f8fb93e54ae`                                     |
| `origin/master`                | `6ddba134385fe14749235ceb042607075f9909b9`                                     |
| Commits after `v1.2.1`         | Merge PR #683 and `e95f71e fix: improve tag generation, create PR merge event` |
| Expected next semantic version | `1.2.2` / `v1.2.2` (PATCH)                                                     |
| Release run for merge SHA      | Not instantiated                                                               |

The pre-existing Release run `31128263502` did complete successfully for
`v1.2.1`, including dependency checks, lint, tests, Sonar, build,
semantic-release, and dispatch of the versioned deployment. It has no workflow
dependency on completion of deployment. Release executions serialize only with
other releases through `semantic-release-master`; deployment uses the separate
`h-budget-ui-production` group with `cancel-in-progress: false`. CI, CodeQL,
and PR policy do not share either group.

`Deploy v1.2.1` (run `31128315004`) is now **failed** at the workflow level,
with its job **cancelled**, rather than merely queued. It never acquired
`ubuntu-latest`, never started a step, and has the hosted-runner acquisition
annotation. No duplicate deployment was dispatched.

## Local validation

| Check                                                          | Status  | Evidence                                                                                                            |
| -------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run release:dry-run` in detached `origin/master` worktree | PASS    | Found `v1.2.1`, two commits, a PATCH release, and next version `1.2.2`; dry-run skipped tag creation.               |
| `node --test tools/ci/workflow-contract.spec.mjs`              | PASS    | 7/7 tests passed after the added gate contracts.                                                                    |
| Prettier workflow and changed-file check                       | PASS    | The pre-existing CodeQL YAML formatting drift was normalized without changing its behavior.                         |
| `npm ci --strict-peer-deps --engine-strict`                    | PASS    | The first wrapper timed out while npm continued; the final clean retry completed successfully in about six minutes. |
| `npm ls --depth=0`                                             | PASS    | The restored dependency tree matches the root manifest.                                                             |
| `actionlint`                                                   | NOT RUN | The repository has no pinned actionlint mechanism or installed binary; one was not introduced for this audit.       |
| `npm run deps:guard`                                           | PASS    | Dependency guard passed.                                                                                            |
| `npm run release:validate`                                     | PASS    | 17 tests passed, including all workflow contracts.                                                                  |
| `npm run lint`                                                 | PASS    | Nx lint completed successfully.                                                                                     |
| `npm run test:ci`                                              | PASS    | 232 Karma tests passed. Existing Angular warnings were emitted but did not fail the suite.                          |
| `npm run build:prod`                                           | PASS    | Production build completed. The existing initial bundle budget warning remains (2.38 MB vs. 2 MB).                  |

## Preserved behavior

PR validation, CI dependency gates, Sonar and `SONAR_TOKEN`, CodeQL, tests,
production build, semantic-release as the sole version calculator, `Deploy
vX.Y.Z`, `Redeploy vX.Y.Z`, and immutable Docker version/SHA integrity remain
intact. `v1.2.1` and all tags/releases were left unchanged.
