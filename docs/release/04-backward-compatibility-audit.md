# Backward-Compatibility Audit

Audited on 2026-08-05 against `master...tech/semantic-versioning-v2` (`e64a0fd...da5c877`). The PR contains one semantic-versioning commit and no deleted application files; the two modified base-layout files are unrelated UI/test changes, not CI/CD removals.

## Executive summary

Regressions were found and restored. The semantic-release design remains the single release-to-deployment path: only `master` can release, Git history determines SemVer, the repository `GITHUB_TOKEN` publishes the immutable tag and GitHub Release, and deployment consumes that exact tag. The intentionally removed PAT workflow, manual version bumper, release-branch prereleases, manifest/changelog write-back, and duplicate tag/release deployment triggers remain removed.

## Capability matrix

| Capability                      | Before PR                                                         | After semantic-release PR                   | Final                                                                                      | Classification / evidence                                         |
| ------------------------------- | ----------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| PR CI                           | PRs to master, developed, feature/test/hotfix/fix/tech            | master only                                 | Previous target set restored                                                               | RESTORE: `build.yml` trigger diff                                 |
| Root dependency graph           | `npm ls --depth=0`                                                | Removed                                     | Restored in CI and release                                                                 | RESTORE: previous build gate                                      |
| Dependency policy               | `deps:guard`; release also used online metadata check             | `deps:guard` only                           | Guard retained; online check restored before release                                       | RESTORE: deleted `sem-release.yml` step                           |
| Lint / tests / coverage / build | CI and release-tag build                                          | CI plus master release gates                | Retained; master test still produces the configured coverage and Sonar XML before analysis | PRESERVED                                                         |
| Sonar                           | Non-PR tag/release build, `SONAR_TOKEN`, full history             | Removed                                     | Master release gate with identical secret/scanner contract                                 | RESTORE                                                           |
| Security automation             | CodeQL and dependency-update workflows                            | Unchanged                                   | CodeQL action updated from unsupported v2 to v3; triggers and permissions unchanged        | PRESERVED; no prior `security-check` CI step existed              |
| Artifacts                       | Dependency-update/migration artifacts only                        | Unchanged                                   | Unchanged                                                                                  | PRESERVED; no build/Sonar artifact consumer exists                |
| Release                         | PAT-backed reusable semantic release                              | Native semantic-release with `GITHUB_TOKEN` | Retained new design                                                                        | SUPERSEDED                                                        |
| Deployment                      | Tag push and GitHub Release events, plus manual dispatch on a tag | Single release output only                  | Single automatic path plus explicit-tag manual redeploy                                    | RESTORE manual recovery; duplicate triggers intentionally removed |
| Sentry / telemetry              | No CI source-map upload; `build:prod:deploy` remained opt-in      | Same                                        | Same                                                                                       | PRESERVED                                                         |

## Sonar

Before the PR, `build.yml` invoked `npm run sonar -Dsonar.login="$SONAR_TOKEN"` on non-PR tag/release/manual-tag builds, with `SONAR_TOKEN` from `secrets.SONAR_TOKEN` and `fetch-depth: 0`. `karma.conf.js` writes `coverage/h-budget/lcov.info` and `reports/sonarqube_report.xml`; `sonar-project.properties` consumes both paths. The semantic-release PR removed the sole scanner invocation, so no Sonar analysis ran on PRs or `master`.

The final implementation keeps PR scans disabled, preventing secret exposure to fork PRs. On `master`, the release job checks out full history, runs `test:ci`, and then invokes the same scanner command with the unchanged `SONAR_TOKEN` secret contract. The scanner runs before semantic-release, so a scanner failure now blocks publication; this is consistent with the new PR's documented mandatory-quality-gate flow and preserves the legacy failure behavior that blocked the tag/release build and Docker handoff. Remote authentication and the SonarCloud quality-gate result require GitHub CI evidence and cannot be verified locally.

## Intentionally not restored

- The PAT-backed reusable release workflow (`GH_PAT`) is superseded by native semantic-release using the scoped repository `GITHUB_TOKEN`.
- The manual version bumper is superseded by commit-history SemVer calculation.
- The `release` branch / `rc` prereleases, release-generated CHANGELOG commit, and package manifest write-back conflict with the documented master-only immutable-release policy.
- Tag-push and GitHub-Release deployment triggers are intentionally removed because the release output is the single verified deployment handoff; restoring them would recreate duplicate deployment paths. The replacement manual recovery input accepts only an existing stable `refs/tags/vMAJOR.MINOR.PATCH` ref.
- The unused `build.yml` `workflow_call` surface has no in-repository caller and is superseded by the explicit deployment reusable workflow.

## Remote-only verification

- Repository administrators must confirm that `SONAR_TOKEN`, Docker credentials, and production-environment protections exist and that branch protection requires the CI and PR-policy checks.
- A GitHub Actions run is required to prove authenticated SonarCloud analysis and its remote quality-gate status.
