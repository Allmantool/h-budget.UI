# Angular/Nx Standards Summary

The authoritative rules are in [the Angular/Nx skill](../../.codex/skills/angular-spa/SKILL.md); this is a concise map, not a second authority.

- Preserve the current Angular/Nx/NgModule/NGXS architecture until explicitly authorized to migrate.
- Use explicit feature, UI, data-access, utility, and composition-root ownership. Future Nx libraries follow directional dependencies only when authorized.
- Use focused container and presentational components; no component-level HTTP or presentational global-store coupling.
- Keep one named exported concept per file and use domain-specific names; review component/template files at 150 lines, services/states/general TypeScript at 200 lines, and functions/complexity at 25/10.
- Preserve strict types, immutable state, typed contracts/forms/mapping, controlled signals, lifecycle-safe RxJS, and deliberate concurrency/errors.
- Keep templates declarative; provide loading, empty, error, disabled, permission, semantic, and accessible behavior where relevant.
- Test changed behavior deterministically; preserve and strengthen regression/characterization coverage.
- Review security, accessibility to WCAG 2.2 AA, and measured performance; never conceal defects with suppression or relaxed quality gates.
- Treat the first output as a draft, self-review the full diff, correct findings, rerun checks, and report PASS/FAIL/NOT RUN evidence.
