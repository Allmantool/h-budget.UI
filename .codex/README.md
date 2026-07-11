# Codex Governance Package

Read [the root entry point](../AGENTS.md) first. For Angular/Nx work, then read [the Angular SPA skill](skills/angular-spa/SKILL.md).

## Structure

- `skills/angular-spa/` contains the authoritative, topic-specific engineering standards.
- `prompts/` contains short task starters that reference those standards rather than duplicate them.
- `checklists/` contains execution aids for discovery and self-review.

The files are intentionally layered: root instructions define workflow and precedence; the skill routes work to the detailed rules; supporting standards own the details. Do not create another competing rule hierarchy. Update the owning file and its links when a standard changes.

## Required use

Use this package for implementation, refactoring, bug-fix, architecture-audit, PR-review, test-improvement, and dependency/framework-migration tasks in this Angular/Nx workspace. For standards-only tasks, use the governance scope rules in the root file.

See [the instruction hierarchy](../docs/codex/01-instruction-hierarchy.md) for precedence and [the change rationale](../docs/codex/03-changes-and-rationale.md) for ownership decisions.
