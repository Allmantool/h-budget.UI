# Governance Changes and Rationale

## Ownership model

- `AGENTS.md` is deliberately concise: it is the discoverable entry point, task gate, precedence source, and workflow contract.
- `.codex/skills/angular-spa/` is the one authoritative Angular/Nx skill. Its topic files prevent a single giant context document while keeping required standards one link away.
- `.codex/prompts/` are short reusable task starters. They do not own engineering policy.
- `.codex/checklists/` support execution and self-review without replacing standards.
- `skills/angular-spa/styling-and-ui.md` is the focused owner for BEM and UI implementation detail; its workflow and checklist are linked from the skill and general review process rather than copied into root guidance.
- `docs/codex/` records inventory, hierarchy, summary, and the reason this package exists.

## Consolidation

The former root guidance and standalone Angular standards/review checklist contained valuable rules but overlapped heavily and were not consistently discoverable. Detailed requirements have been consolidated into the skill, while the root points there explicitly. The older two documents now direct readers to the authority, eliminating conflicting duplicate policy.

## Extension rule

Add a scoped `AGENTS.md` only when a directory has real, stable local constraints. It may specialize but not weaken root/skill safeguards. Add detailed guidance to the existing topic file when it has the same owner; create a new supporting file only for a distinct concern and link it directly from the skill. Do not create generic `standards`, `prompts`, or `guidelines` files that compete with this hierarchy.

## Task lifecycle ownership

- `AGENTS.md` decides when the lightweight or non-trivial path applies and requires the appropriate skills.
- `skills/specification-driven-development/` owns requirement quality, Definition of Ready, traceability, scope/change control, and resumable task state.
- `skills/test-driven-development/` owns RED → GREEN → REFACTOR and exceptions; Angular testing conventions remain in `skills/angular-spa/testing.md`.
- `skills/verification/` owns the independent completion gate and delegates exact SPA validation commands and self-review detail to `skills/angular-spa/review-and-validation.md`.
- `docs/specs/` owns task-specific contracts. It is deliberately outside `.codex` so a specification can be reviewed alongside its implementation without becoming another global instruction source.

This splits durable policy from task state, avoids duplicating Angular rules, and keeps the root instructions small enough to load every session.
