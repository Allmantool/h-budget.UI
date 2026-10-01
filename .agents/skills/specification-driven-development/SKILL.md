---
name: specification-driven-development
description: Define, trace, and maintain lightweight repository-grounded specifications for non-trivial work in this SPA.
---

# Specification-Driven Development

Use this skill before production implementation for a non-trivial task: a feature, behavioral change, non-obvious bug, state/API/UI workflow change, architecture or performance/security change, substantial test change, cross-module change, or work with multiple acceptance conditions. When uncertain, use SDD. A typo, clear one-line correction, formatting-only change, static metadata correction, or deterministic no-behavior mechanical refactor may use the lightweight path; validate it and state why a spec was not needed.

## Create the contract

1. Inspect the related implementation, tests, contracts, registration, state, routes, and tooling before deciding behavior. Mark repository evidence as **CONFIRMED**, a safe working choice as **ASSUMED**, and unresolved material information as **UNKNOWN**. Never manufacture a requirement.
2. Create or update `docs/specs/<descriptive-kebab-case-name>.md` from [the template](../../../docs/specs/TEMPLATE.md). Reuse an existing active specification for the same task.
3. Define observable desired behavior, explicit non-goals, stable IDs only where they add value (`REQ-001`, `AC-001`, `EDGE-001`), relevant edge cases, and a test/verification strategy. Requirements are not implementation guesses.
4. Meet Definition of Ready: the problem, scope, desired behavior, testable acceptance criteria, relevant edge cases, constraints, test strategy, and important unknowns are recorded. Stop for direction if an unknown materially changes public behavior or architecture.
5. Turn requirements into small, ordered implementation steps with an observable exit condition. Keep required work separate from optional work and follow-ups.

## Maintain traceability and task state

Each significant requirement maps to acceptance criteria, implementation, verification evidence, and `PASS`, `FAIL`, `NOT RUN`, or `BLOCKED` status. A passing command alone does not prove a requirement.

The specification is the canonical handoff record for long work. Keep its status, completed/in-progress/remaining requirements, decisions, requirement changes, known issues, and verification evidence current. Before changing the intended behavior because of new evidence, update the specification with what changed, why, affected IDs, and test consequences.

## Examples

Good: `REQ-003: When history and today's rate arrive in either order, render one complete series containing both.`

Weak: `Improve the chart loading.` Rewrite weak requests as observable outcomes before implementation.

## Completion

Before reporting completion, use the verification gate to evaluate every acceptance criterion and update the traceability table. Do not silently convert an assumption, missing environment, or unexecuted check into a pass.
