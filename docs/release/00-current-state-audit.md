# Release Automation Audit

Audited on 2026-08-04 against the local checkout of `master` at `e64a0fd`.

## Baseline

- The current authoritative stable tag is `v1.1.60`, a reachable tag on `master` at `e64a0fd`. Its predecessor is `v1.1.59`.
- Historical tags include legacy unprefixed numeric tags, prerelease `-rc` tags, and the current `v1.0.0` / `v1.1.x` stable format. The release system only recognizes the reachable `vMAJOR.MINOR.PATCH` stable format; legacy tags remain untouched.
- `package.json` previously used `0.214.68` while the application released `v1.1.60`. It is a private application manifest, not a release version source, and now uses `0.0.0-development` to prevent release-version drift.

## Previous flow and risks

```text
PR -> build workflow
master push -> third-party semantic-release action -> tag/release commit
tag push and GitHub Release -> build workflow -> Docker image
```

The old configuration released `chore`, `build`, unknown types, and any unmatched commit as PATCH; committed `CHANGELOG.md` and package version updates; allowed an `rc` release branch; used a separate PAT; and deployed from both tag-push and release events. This made release intent ambiguous, enabled recursive/duplicate deployment paths, and did not require all application quality gates immediately before publishing.

## Merge and commit evidence

Recent history uses merge commits and preserves source-branch commits on `master`; it is not squash-only. Recent source commits are inconsistently conventional (`tech:`, free-form messages, and maintenance `chore:` changes), so a release cannot safely derive intent from historical branch names. PR title validation protects any future squash merge, while commit-range validation protects the observed merge-commit strategy.

## Current flow

```text
PR -> branch/title + commit validation -> CI
master push -> repeat quality gates -> semantic-release -> vX.Y.Z + GitHub Release
published stable release -> release-tag Docker build/push
```

GitHub branch-protection/ruleset settings could not be read from this checkout because the GitHub CLI is unavailable. Repository owners must require the `PR Release Policy` and `CI / Verify Angular UI` checks on `master` before enabling the first production release.
