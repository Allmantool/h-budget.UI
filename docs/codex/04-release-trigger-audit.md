# Release Trigger Audit — PR #682

## Scope

This audit investigates the report that the master merge commit
`c9f4c9b6ed56601cd2a8d8f3d8fb9f8fb93e54ae` for PR #682 did not start the
Release workflow. It records evidence only; it does not change release
orchestration.

## GitHub event evidence

- PR #681 and PR #682 are both recorded by GitHub's pull-request API as merged
  by the user `Allmantool`; `auto_merge` is `null` for each PR.
- PR #681 merged at `2026-08-05T17:27:36Z` and its push-triggered Release #89
  began at `2026-08-05T17:27:39Z` for `7a48c1ddeda9ec0618389d221297438c8989d4e0`.
- PR #682 merged at `2026-08-06T20:52:37Z`. GitHub Actions records a
  push-triggered Release #90 for the same merge SHA, created at
  `2026-08-06T21:22:38Z`.
- The workflow file is named `merge-pr.yml`, but it is the Release workflow.
  It has no PR-merge command, merge API call, auto-merge operation, or
  `github-script` step. It therefore cannot be the source of a
  `GITHUB_TOKEN`-authenticated PR merge.

The GitHub API exposes the merge actor and auto-merge state, but not the
client or credential used by a human actor. The evidence proves that the
reported missing run was not caused by a `GITHUB_TOKEN`-suppressed push:
Release #90 has event `push` and the exact PR #682 merge SHA. The approximately
30-minute delay is an external Actions delivery/scheduling observation; its
cause is not exposed by the available repository data.

## GitHub token rule

GitHub documents that events caused by a repository `GITHUB_TOKEN` do not
start another workflow run, except for `workflow_dispatch` and
`repository_dispatch`. This rule is relevant for a future workflow that
performs a PR merge using `GITHUB_TOKEN`, but it is not applicable to the
observed PR #682 path above.

Official source: <https://docs.github.com/en/actions/concepts/security/github_token>.

## Release calculation evidence

Running `npm run release:dry-run` from `master` found `v1.2.0`, analyzed the
two subsequent commits, and calculated a PATCH release, `v1.2.1`. Dry-run
explicitly skipped tag creation.

## Decision

Do not add an automatic `workflow_dispatch` release trigger for PR #682. There
is no merge workflow to dispatch from, and adding a second trigger would create
an unnecessary duplicate-release risk. The existing master-push Release
workflow, concurrency group `semantic-release-master`, semantic-release version
calculation, and versioned deployment dispatch remain unchanged.
