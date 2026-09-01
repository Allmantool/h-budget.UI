---
name: test-driven-development
description: Apply evidence-backed RED, GREEN, REFACTOR cycles to behaviorally testable SPA changes.
---

# Test-Driven Development

Use TDD by default for behaviorally testable implementation, bug-fix, and refactoring work after the task specification identifies the required behavior. Use the cheapest test layer that can prove the requirement: pure TypeScript/unit, service/store, component, then integration. Use a higher layer when the requirement depends on that interaction; do not force E2E where lower-layer evidence is sufficient.

## Required cycle

1. **RED:** Add or identify a deterministic test for the acceptance criterion before changing production behavior. For a non-trivial bug fix, reproduce the defect with a regression test first. Run the focused test and record the expected failure when practical.
2. **GREEN:** Make the smallest production change that satisfies the active requirement. Run the focused test and record the pass.
3. **REFACTOR:** Improve only with behavior protected by green tests. Rerun affected focused validation after the refactor.

Use existing Jasmine, Karma, Angular TestBed, and Nx patterns. Mock provider/API boundaries, avoid network calls and arbitrary delays, and assert observable behavior rather than private implementation details.

## Integrity rules

Never implement first and describe later-added tests as TDD. Do not delete, skip, mute, delay, broaden, or weaken a meaningful test to reach green. Modify an incorrect test only after recording why its expectation conflicts with the specification or confirmed current contract. Do not add speculative capabilities while making the initial implementation green.

## Exceptions

TDD is not applicable to documentation, formatting, generated output, static metadata, some tooling/CI configuration, or changes that cannot be meaningfully exercised by a test before implementation. Record in the specification and final report:

`TDD: Not Applicable — Reason: <specific reason>; Verification: <alternative evidence>.`

Do not use a generic exception for behavior that can reasonably be tested.
