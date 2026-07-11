# Testing Standards

Add or update deterministic tests for meaningful changed behavior. Do not delete, skip, weaken, or replace tests with snapshots merely to turn validation green. Mock provider/API boundaries; avoid real network calls, arbitrary delays, and unnecessary private-method assertions.

Cover the scenarios relevant to the change: loading, success, empty, error, retry, cancellation, concurrency, state transitions, selectors, mappers, validators, route behavior, component input/output contracts, and accessibility-critical interactions. Prefer unit tests for mappers, validators, guards, interceptors, actions/selectors/state, and domain logic. Component tests must verify rendered behavior and user interactions, not Angular internals.

For bug fixes, reproduce or explain the failure and add a regression test when practical. For refactors where behavior is insufficiently protected, add characterization coverage first. Do not allow global coverage to decrease; prioritize strong meaningful coverage for financial calculation, state transition, data mapping, and validation changes over an arbitrary percentage.

Use the existing Jasmine/Karma/Angular TestBed/Nx setup unless migration is explicitly requested. Discover actual targets in `package.json` and `project.json`; report tests that were not run honestly.
