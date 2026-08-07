# Safe dependency updater

`tools/deps/safe-update.mjs` is the CI-oriented npm update entry point. It has three explicit modes:

- `npm run deps:update:patch:safe` selects only newer stable patches in the current minor.
- `npm run deps:update:minor:safe` selects newer stable versions in the current major, but only for the centralized minor allowlist.
- `npm run deps:update:major:safe` selects only explicitly major-eligible packages. Angular, Nx, and NGXS family majors are deferred to their specialized migration workflow.

The policy lives in `tools/deps/rules.mjs`; no package-specific policy is embedded in orchestration. Dependency families are atomic update units during fallback, so they cannot be partially accepted.

## Safety pipeline

For each bulk set or fallback unit the updater mutates only the direct dependency range, runs `npm install --package-lock-only --ignore-scripts --strict-peer-deps --engine-strict`, checks the exact direct lockfile targets, then proves reproducibility with strict `npm ci`. It runs `npm ls --depth=0`, `deps:guard`, lint, CI tests, production build, and framework verification. Validation scripts receive the current attempt label in `SAFE_NPM_UPDATE_LABEL` for diagnostic context. `--force` and `--legacy-peer-deps` are never used.

Registry failures and invalid metadata are discovery failures, not “no updates.” Prereleases, unsupported specs (`file:`, workspace, aliases, URLs and git), deprecated releases, blocked packages, and policy-ineligible packages are skipped with structured reasons. Exact target release metadata is queried before selection.

Bulk validation is attempted first. On failure, the original package files are restored byte-for-byte and a deterministic alphabetical greedy fallback tries package or atomic-group units. This is a compatible subset, not a mathematical maximum. A final full validation runs against the accumulated subset; a failure restores the original baseline and reports `rolled-back`.

## Artifacts, rollback, and operations

The updater writes `.dependency-upgrade/state.json` with schema version, run id, mode, status, candidates accepted/rejected/skipped, discovery failures, validation evidence, and rollback outcome. Logs are in `logs/dependency-upgrade/`. Run-specific backups are in `.dependency-upgrade/run-<id>/` while a run is active.

The baseline fingerprint hashes `package.json` and `package-lock.json`; restoration succeeds only when the fingerprint matches. An exclusive lock prevents concurrent manifest mutation. `SIGINT` and `SIGTERM` restore a captured baseline. By default, tracked changes prevent a run; `SAFE_NPM_ALLOW_DIRTY=1` is an explicit local escape hatch and validation still rejects newly modified tracked files outside the two dependency manifests.

Exit code `0` means the final dependency state completed validation (including a safe package-specific rejection). Exit code `2` means discovery infrastructure failed; exit code `3` means another updater owns the lock. Other non-zero exits mean final integration validation or rollback failed. A lock-contention attempt writes its own `lock-contention-<run-id>.json` artifact and never changes the active run's `state.json` or lock.

## Tests and troubleshooting

Run `npm run test:deps` for deterministic policy/engine coverage, `npm run test:deps:e2e` for isolated process coverage against a local fixture registry, or `npm run test:deps:all` for both. The deterministic Node test suite uses an injected command/filesystem boundary to exercise patch, minor, and major selection; strict-resolution/peer/engine/lock/install/graph/repository failures; bulk fallback; atomic groups; and final rollback without querying npm. The E2E suite invokes the public CLI, actual npm, package manifests, lockfiles, registry metadata, and lock behavior without changing this application's dependencies.

For CI failures, inspect `state.json` and the matching stage log. Use the manual Angular/Nx migration workflow for framework majors; generic major automation intentionally defers them.

## Scheduled pull-request automation

`.github/workflows/update_npm_packages.yml` is the only automated npm dependency updater. It invokes this updater directly; GitHub Actions does not select package versions or run `npm update` itself.

- Patch runs at `03:17 UTC` on Monday, Wednesday, and Friday; minor runs at `04:23 UTC` on Saturday; major runs at `05:37 UTC` on the first day of each month.
- A manual workflow dispatch must select exactly one mode: `patch`, `minor`, or `major`. Scheduled and manual runs share the same mode-resolution path.
- Workflow concurrency is `safe-npm-dependency-update` with cancellation disabled. A process-level updater lock remains a second protection layer; lock contention creates evidence and no PR.
- The workflow uses a GitHub App installation token. Configure `DEPENDENCY_UPDATER_APP_ID` and `DEPENDENCY_UPDATER_APP_PRIVATE_KEY` as Actions secrets. The App needs repository metadata read, contents read/write, and pull-requests read/write. This avoids the `GITHUB_TOKEN` event-suppression behavior so the App-created PR triggers normal `pull_request` CI.
- Before requesting the token, the workflow checks only that both configured secrets are available. If either is absent, it fails with `Dependency updater GitHub App configuration is unavailable.` without logging a credential value.
- Each mode owns at most one open PR on `automation/deps/<mode>`. If that PR has the expected automation author and ownership marker, a later run safely skips it. Any unknown, human-owned, stale, or conflicting branch fails closed instead of being overwritten.
- Before committing, CI parses `.dependency-upgrade/state.json`, requires a successful `completed` or `completed-with-rejections` state with accepted changes, verifies `package.json` and `package-lock.json` are the exact and only diff, runs `git diff --check`, and confirms accepted manifest/lockfile targets. `no-updates`, an all-rejected completed run, and lock contention finish without a PR; every other state fails the workflow.
- PRs use `chore(deps): apply safe <mode> dependency updates`, include accepted/rejected/skipped/deferred packages, validation evidence, updater run ID, workflow link, and the marker identifying the verified updater. Labels are applied only when they already exist. Auto-merge is intentionally not configured.
- The updater job has a 120-minute timeout, uses the npm cache keyed by `package-lock.json`, uploads state/log evidence for 14 days, and never receives deployment, Sentry, Docker, or production-environment secrets.

The canonical `CI` pull-request workflow runs the dependency graph, guard, framework verification, lint, CI tests, and production build for dependency PRs as for other PRs. The production build is `build:prod`; it does not invoke Sentry source-map upload (`build:prod:deploy`). Major mode remains limited by `rules.mjs`: Angular, Nx, NGXS, and other migration-required framework majors are recorded as deferred and require the separately dispatched `.github/workflows/framework-dependency-migration.yml` workflow.
