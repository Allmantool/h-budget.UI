# Angular/Nx Self-Review Checklist

- [ ] Treat the implementation as a draft; run `git status --short`, `git diff --stat`, `git diff --check`, and inspect the complete relevant diff.
- [ ] Confirm every changed path is in task scope and unrelated dirty work was preserved.
- [ ] Confirm public behavior, routes, contracts, validation, permissions, telemetry, and errors remain intentional.
- [ ] Confirm layer boundaries, provider lifetime, state ownership, mappings, concurrency, cleanup, and retry/error behavior are sound.
- [ ] Confirm containers/presentational components, templates, forms, semantics, keyboard access, focus, labels, and state feedback are appropriate.
- [ ] Confirm strict typing; review all `any`, assertions, suppressions, logs, DOM/sanitizer use, timers, and subscriptions in context.
- [ ] Confirm file/complexity limits or record a narrow exception.
- [ ] Confirm meaningful behavior tests and validation match the changed risk.
- [ ] Search the diff for warning signs listed in `review-and-validation.md`; fix findings.
- [ ] Rerun affected validation after corrections and report each result as PASS, FAIL, or NOT RUN.
