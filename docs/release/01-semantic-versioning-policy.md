# Semantic Versioning Policy

Stable releases use immutable `vMAJOR.MINOR.PATCH` Git tags. `master` is the only release branch, and semantic-release uses reachable Conventional Commit history since the previous valid stable tag.

| Commit signal                                                      | Release         |
| ------------------------------------------------------------------ | --------------- |
| `type!:` or `BREAKING CHANGE:` footer                              | MAJOR           |
| `feat:`                                                            | MINOR           |
| `fix:`, `perf:`, `revert:`                                         | PATCH           |
| `build:`, `chore:`, `ci:`, `docs:`, `refactor:`, `style:`, `test:` | none by default |

Branch naming validates intent; commit history determines version. Supported branches are `feature/`, `feat/`, `bug/`, `bugfix/`, `fix/`, `hotfix/`, `perf/`, `refactor/`, `chore/`, `docs/`, `test/`, `ci/`, and `build/`. The established `tech/` prefix maps to `chore:`. `automation/deps/`, `dependabot/`, and `renovate/` map to `chore:` and must use a normalized `chore(deps): ...` PR title.

For example, `hotfix/auth-timeout` requires a `fix(auth): ...` PR title and normally emits a PATCH. A breaking hotfix is still MAJOR. Bot branches are accepted by branch validation, but malformed bot titles intentionally fail until the automation is configured to use `chore(deps): ...`.

GitHub Releases are the canonical generated changelog. The repository keeps the historical `CHANGELOG.md` as an archive, but release automation does not update it or create a release commit. Do not manually create release tags or edit the private application manifest version to represent a release.
