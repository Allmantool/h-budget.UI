# Codex Instruction Hierarchy

## Precedence

1. Explicit task requirements and authorized scope.
2. Closest scoped `AGENTS.md`.
3. Root `AGENTS.md`.
4. Skills the applicable instructions explicitly require.
5. Repository standards referenced by those skills.
6. Existing implementation and local tests as behavior/convention evidence.
7. Official framework/library guidance.

Narrower instructions may add local detail but must not silently weaken security, correctness, data integrity, validation, or task scope. Conflicts must be reported and resolved before implementation. Existing code is not proof of best practice; it may represent behavior that needs preservation or a debt pattern that needs explicit authorization to change.

## Discovery path

1. Start at [`AGENTS.md`](../../AGENTS.md).
2. Locate scoped `AGENTS.md` files from root to the target directory.
3. For Angular/Nx work, load [the Angular/Nx skill](../../.codex/skills/angular-spa/SKILL.md).
4. Load its applicable topic standards, then use checklists/templates as execution aids.

The root document owns mandatory workflow. The skill owns Angular/Nx standards. Supporting files own their subject-specific detail. Prompts and legacy documents must link to authority rather than duplicate it.
