# Release Automation Validation Report

Validation date: 2026-08-04. No Git tag, GitHub Release, Docker image, or deployment was published during this work.

## Baseline

- `master` is checked out at `e64a0fd4997c1cb190b46119c45d5c04b74aad05`.
- `v1.1.60` resolves to that exact commit, is reachable from `master`, and is the newest reachable `vMAJOR.MINOR.PATCH` tag.
- `git log v1.1.60..master --oneline` is empty. The current release outcome is therefore no release.

## Validation results

| Check                                       | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --strict-peer-deps --engine-strict` | PASS   | Completed in 5m35s after the npm-version guard stopped recursively invoking `npm` during the lifecycle. No peer or engine errors. npm reported one deprecated stub package, eight `allow-scripts` notices, and 69 existing audit vulnerabilities (3 low, 26 moderate, 39 high, 1 critical).                                                                                                                       |
| `npm run deps:guard`                        | PASS   | Validated the lockfile, peer graph, and Angular/Nx policy; `webpack-dev-server@5.2.5` has the expected Angular/Nx owners.                                                                                                                                                                                                                                                                                         |
| `npm run deps:verify:framework`             | PASS   | Cleanly reinstalled and ran dependency guard, TypeScript check, lint, Karma tests, production build, Prettier check, and affected production build.                                                                                                                                                                                                                                                               |
| `npm ls --depth=0`                          | PASS   | No invalid or unmet root dependencies.                                                                                                                                                                                                                                                                                                                                                                            |
| `npx nx report`; `npx ng version`           | PASS   | Node 24.10.0, npm 11.17/11.18, Angular 21.2.16, Nx 22.7.5, and TypeScript 5.9.3 are aligned.                                                                                                                                                                                                                                                                                                                      |
| `npm run release:validate`                  | PASS   | Six deterministic tests cover all supported branch prefixes, PATCH/MINOR/MAJOR/none policy outcomes, highest impact, breaking footers, and configuration loading.                                                                                                                                                                                                                                                 |
| `npm run release:dry-run`                   | PASS   | Uses semantic-release in dry-run mode against a local Git ref and the configured analyzer/notes plugins. Detected `v1.1.60`, found zero commits, and determined that no release is required. The GitHub publishing plugin is deliberately excluded from the local dry run because it requires remote credentials before it can analyze commits; its configuration is covered by static tests and workflow review. |
| Prettier release/workflow check             | PASS   | Reformatted and rechecked the changed workflow, release-tooling, and release-documentation paths.                                                                                                                                                                                                                                                                                                                 |
| `actionlint`                                | PASS   | `rhysd/actionlint:1.7.7` container validated all four changed workflows.                                                                                                                                                                                                                                                                                                                                          |
| `npm run lint`                              | PASS   | Existing Angular/TypeScript/template warnings remain; no lint errors.                                                                                                                                                                                                                                                                                                                                             |
| `npm run test:ci`                           | PASS   | Chrome Headless 150 executed 232 specs: 232 passed, 0 failed. Coverage: statements 85.38%, branches 63.70%, functions 81.77%, lines 85.50%.                                                                                                                                                                                                                                                                       |
| `npm run build:prod`                        | PASS   | Output: `dist/h-budget`; initial bundle is 2.38 MB. The existing 2 MB warning budget is exceeded by 375.02 kB; source maps are disabled.                                                                                                                                                                                                                                                                          |
| `git diff --check`                          | PASS   | No whitespace errors.                                                                                                                                                                                                                                                                                                                                                                                             |

## Release and deployment audit

- PR policy validates supported branch intent, Conventional Commit PR titles, and the PR commit range. This matches the repository's retained-commit merge history rather than assuming squash-only merges.
- CI is read-only and runs on pull requests to `master`. A push to `master` repeats dependency, lint, test, and build gates before semantic-release can publish.
- `release.config.mjs` permits only `master`, uses `v${version}`, shares the documented parser/rules, publishes GitHub Releases, and has no npm, changelog, or Git write-back plugin.
- The release job has `contents: write`; ordinary CI and deployment have `contents: read`. No PAT, custom release token, or unnecessary write permission is configured.
- Deployment is a reusable workflow called only when semantic-release produces a new tag. It checks out that exact tag, resolves its commit SHA, verifies the checked-out SHA, and builds version and SHA Docker tags from the same immutable source.
- There is one deployment path. Tag-push and GitHub-Release event triggers were removed, so neither semantic-release nor deployment has a recursive or duplicate trigger path.

## Synthetic release-policy proof

The release-policy test suite invokes the installed `@semantic-release/commit-analyzer` with the production rules and proves the following outcomes from `v1.1.60`:

| Commit                   | Release type | Next tag  |
| ------------------------ | ------------ | --------- |
| `fix:`                   | PATCH        | `v1.1.61` |
| `perf:`                  | PATCH        | `v1.1.61` |
| `revert:`                | PATCH        | `v1.1.61` |
| `feat:`                  | MINOR        | `v1.2.0`  |
| breaking commit          | MAJOR        | `v2.0.0`  |
| maintenance-only commits | none         | none      |

## Local dry-run safeguard

The original local dry-run invoked the publishing configuration directly and waited for remote Git authentication before it could analyze the current history. `tools/ci/semantic-release-dry-run.mjs` now keeps the same branch, tag, parser, analyzer, and release-notes configuration while substituting the local `.git` reference and omitting only the publishing plugin. It is always dry-run/no-CI and sets `GIT_TERMINAL_PROMPT=0`; it cannot create a tag, release, package, image, or deployment.
