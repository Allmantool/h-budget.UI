# Codex Governance Audit

## Scope and method

This standards-only audit inspected the workspace root, `AGENTS.md`, `README.md`, `package.json`, `project.json`, `nx.json`, TypeScript/ESLint configuration, existing Codex-related documents, and repository structure. No application finding was remediated in this task.

## Inventory before hardening

| Path                                    | Purpose and scope              | Findings                                                                                                                                                                                               |
| --------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AGENTS.md`                             | Root instructions for all work | Discoverable, but detailed policy duplicated other files, omitted an explicit precedence model and skill loading, and identified the app as Angular 20 although dependencies now declare Angular 21.2. |
| `docs/angular-coding-standards.md`      | Broad Angular standards        | Comprehensive but 1,500+ lines, unreferenced from root, overlaps `AGENTS.md`, mixes human standards and agent workflow, and cannot be reliably loaded as a single task instruction.                    |
| `docs/angular-code-review-checklist.md` | Review aid                     | Useful but unreferenced, duplicates root rules, lacks complete-diff/self-correction requirements and task-type distinction.                                                                            |
| `README.md`                             | Project/dependency workflow    | Relevant supporting repository guidance, but not an AI instruction source. It contains an outdated Angular 20 migration statement; this task leaves non-Codex application documentation untouched.     |

No nested `AGENTS.md`, `SKILL.md`, `.codex`, `.agents`, Codex prompts, or Codex checklists existed. `.agents` is present but empty. `.github` contains workflows and a PR template, not Codex instruction files.

## Key gaps and resolutions

- **Unreachable/duplicated standards:** moved future authority to the linked `.codex` skill; retained legacy documents only as redirects.
- **No precedence model:** added a clear root hierarchy and conflict reporting rule.
- **No mandatory version detection:** skill requires checking installed Angular/Nx versions before version-specific guidance.
- **Weak dirty-tree protection and validation evidence:** root requires status capture, scope preservation, explicit validation discovery, complete diff review, correction, rerun, and PASS/FAIL/NOT RUN reporting.
- **No clear standards-only mode:** root and skill prohibit non-governance changes for such tasks.
- **Unmeasurable design guidance:** added practical responsibility, file-size, complexity, dependency, one-export, exception, validation, and review criteria.

## Repository-calibrated constraints

Current dependencies declare Angular 21.2 and Nx 22.7. The app remains NgModule-bootstrapped with `RouterModule` and NGXS; the governance package treats those as current constraints, not a migration opportunity. The repository has one Nx application project, so future library taxonomy is prospective and requires explicit task authorization.

## Remaining audit limitations

This was a governance audit, not an application architecture assessment. Existing application patterns were sampled only to calibrate standards; no claim is made that they meet the new standards. Markdown linting is not currently configured as a project script.
