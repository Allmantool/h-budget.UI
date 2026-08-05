# Application Semantic Versioning Policy

Stable releases use immutable `vMAJOR.MINOR.PATCH` Git tags. h-budget is a deployable application, so it uses application SemVer rather than the narrower published-library interpretation of Conventional Commits. `master` is the only release branch, and semantic-release uses reachable Conventional Commit history since the previous valid stable tag.

| Commit signal                         | Release |
| ------------------------------------- | ------- |
| `type!:` or `BREAKING CHANGE:` footer | MAJOR   |
| `feat:`                               | MINOR   |
| `fix:`, `perf:`, `revert:`, `refactor:` | PATCH |
| `chore:`, `build:`, `ci:`             | PATCH   |
| `docs:`, `test:`, `style:`            | none    |

Deployable application code, dependencies, build configuration, release and CI/CD infrastructure, and production behavior require an immutable operational version even when they do not introduce a user-facing feature or bug fix. Therefore `chore(deps): update Angular patch dependencies`, `chore(release): harden semantic-release`, `build(app): update builder configuration`, and `ci(release): change production build pipeline` are PATCH-producing changes. Use the accurate Conventional Commit type; do not mislabel a maintenance change as `fix:` merely to force a version.

Release notes expose PATCH-producing `refactor`, `chore`, `build`, and `ci` commits under Refactoring, Maintenance, Build System, and Continuous Integration sections. This keeps an operational version explainable without hiding its cause.

## No-tag audit: PR #680

PR #680 was merged with a merge commit. After `v1.1.60`, semantic-release analyzed the merge commit and both reachable PR commits: `chore: update semantic versioning` and `chore: self review`. The merge commit itself was not Conventional Commit-formatted and did not trigger a release, but it did not mask either reachable PR commit. No tag was created because the former release policy explicitly mapped both `chore` commits to no release. The corrected policy maps `chore` to PATCH, so the synthetic baseline `v1.1.60` plus `chore: update semantic versioning` calculates `v1.1.61`.

Semantic-release remains idempotent: after it creates a stable tag at a commit, a later run at that same tagged commit has an empty post-tag range and produces no further release.

Branch naming validates intent; commit history determines version. Supported branches are `feature/`, `feat/`, `bug/`, `bugfix/`, `fix/`, `hotfix/`, `perf/`, `refactor/`, `chore/`, `docs/`, `test/`, `ci/`, and `build/`. The established `tech/` prefix maps to `chore:`. `automation/deps/`, `dependabot/`, and `renovate/` map to `chore:` and must use a normalized `chore(deps): ...` PR title.

For example, `hotfix/auth-timeout` requires a `fix(auth): ...` PR title and normally emits a PATCH. A breaking hotfix is still MAJOR. Bot branches are accepted by branch validation, but malformed bot titles intentionally fail until the automation is configured to use `chore(deps): ...`.

GitHub Releases are the canonical generated changelog. The repository keeps the historical `CHANGELOG.md` as an archive, but release automation does not update it or create a release commit. Do not manually create release tags or edit the private application manifest version to represent a release.
