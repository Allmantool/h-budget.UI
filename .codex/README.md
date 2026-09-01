# Codex Governance Package

Read [the root entry point](../AGENTS.md) first. For Angular/Nx work, then read [the Angular SPA skill](skills/angular-spa/SKILL.md).

## Structure

- `skills/angular-spa/` contains the authoritative, topic-specific engineering standards.
- `skills/specification-driven-development/`, `skills/test-driven-development/`, and `skills/verification/` define the task lifecycle without duplicating Angular implementation rules.
- `prompts/` contains short task starters that reference those standards rather than duplicate them.
- `checklists/` contains execution aids for discovery and self-review.

The files are intentionally layered: root instructions define workflow and precedence; SDD/TDD/verification skills define the task lifecycle; the Angular skill routes work to repository-specific implementation rules; a task specification in `docs/specs/` retains task state. Do not create another competing rule hierarchy. Update the owning file and its links when a standard changes.

For UI work, `skills/angular-spa/styling-and-ui.md` is the sole detailed owner of BEM, semantic HTML, CSS/SCSS architecture, Material presentation, and UI diff-review standards.

## Required use

Use this package for implementation, refactoring, bug-fix, architecture-audit, PR-review, test-improvement, and dependency/framework-migration tasks in this Angular/Nx workspace. Non-trivial changes use the task lifecycle skills and a specification; lightweight changes remain lightweight but still require validation. For standards-only tasks, use the governance scope rules in the root file.

See [the instruction hierarchy](../docs/codex/01-instruction-hierarchy.md) for precedence and [the change rationale](../docs/codex/03-changes-and-rationale.md) for ownership decisions.
