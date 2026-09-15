# Local HTTPS browser verification harness

## Status

Verified

## Problem and Goal

Codex browser tasks can misclassify a local development-server failure as a
generic invalid certificate error. Provide reusable, evidence-based local HTTPS
discovery and diagnostic guidance that identifies the active Angular serve
configuration, safely inspects the public certificate, and keeps server,
routing, trust, and browser-transport findings distinct.

## Scope

**Required:**

- Add a reusable Codex skill for Angular/browser HTTPS verification.
- Add one read-only PowerShell resolver under `tools/dev/`.
- Update the main Codex entry point and Windows dev-server runbook concisely.
- Execute the resolver against the current configured SPA TLS setup.

**Non-goals:**

- Change Angular application behavior, `project.json`, browser settings, DNS,
  hosts files, certificate stores, private keys, or HTTP/TLS policy.
- Bypass certificate validation or use HTTP as unlabelled HTTPS evidence.

## Repository Evidence and Unknowns

- **CONFIRMED:** `h-budget:serve` enables TLS and references a PEM certificate
  and PEM private key in `project.json`; Nx target defaults provide host
  `localhost` and port `4200`.
- **CONFIRMED:** `tools/dev/capture-angular-dev-state.ps1` is an existing
  read-only Windows diagnostic pattern, and the Vite runbook owns independent
  cache/504 diagnosis.
- **CONFIRMED:** The configured certificate and key paths exist on this
  workstation; their contents have not been read.
- **CONFIRMED:** The Codex in-app browser reaches a TLS endpoint at
  `https://localhost:4200` and reports `ERR_CERT_COMMON_NAME_INVALID`, so
  localhost transport is available; browser output does not expose a
  certificate fingerprint to independently pin that endpoint to the listener.

## Requirements and Acceptance Criteria

- **REQ-001:** Future sessions use a repository-local skill before calling
  local HTTPS browser verification blocked or creating an HTTP fallback.
    - **AC-001:** The skill defines discovery, classification, safety rules, and
      a browser-verification decision tree.
- **REQ-002:** A read-only resolver reports the effective local serve TLS
  setup without exposing private-key material.
    - **AC-002:** It reports SSL, host, port, certificate/key paths and existence,
      public certificate subject/issuer/SAN/validity/fingerprint, hostname
      resolution, port ownership, and a distinct trust result.
- **REQ-003:** The documented workflow distinguishes TLS hostname/trust from
  routing, no listener, browser transport, Vite cache, and dependency failures.
    - **AC-003:** The runbook has troubleshooting guidance for each requested
      condition and forbids unapproved system mutation.
- **EDGE-001:** If the certificate hostname resolves away from the local server,
  report `ROUTING_ERROR`, not a generic certificate failure.

## Constraints

- The resolver is one-shot and read-only: no writes, process changes, network
  configuration changes, trust-store changes, key reads, or insecure TLS
  bypasses.
- Private-key contents, passwords, tokens, and certificate blobs must not be
  emitted.
- Preserve all unrelated dirty workspace changes.

## Test and Verification Strategy

TDD: Not Applicable — Reason: this is documentation and host-dependent
read-only diagnostic tooling; a deterministic unit-test boundary would require
manufacturing certificate/DNS/process state. Verification: PowerShell parser
validation, live resolver execution, output safety review, task-owned listener
inspection when safely available, browser locality probe where available, Markdown/link checks, and
Git diff checks.

## Implementation Plan

1. Add the specification and record discovered constraints — Definition of
   Ready reached.
2. Add the reusable skill, resolver, entry-point link, and runbook additions —
   all safety and classification requirements are documented.
3. Validate script parsing and run it against the configured certificate —
   output confirms discovery without key contents.
4. Capture listener evidence without disturbing an existing server, probe
   browser locality, and update traceability.
5. Review changed files and complete the verification gate.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation                                                         | Test / Evidence                                                                                                       | Status |
| ----------- | ------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-001     | AC-001              | `.codex/skills/local-https-browser-verification/SKILL.md`, `AGENTS.md` | Skill reviewed; Markdown links resolve; HTTP fallback and system-mutation policy are explicit.                        | PASS   |
| REQ-002     | AC-002              | `tools/dev/resolve-angular-https.ps1`                                  | Parser passed; live resolver found configured files, SANs, trust, DNS, and port listener without reading key content. | PASS   |
| REQ-003     | AC-003              | `docs/runbooks/angular-dev-server-windows.md`                          | Runbook and skill separate Vite, listener, routing, hostname, trust, expiry, and browser transport.                   | PASS   |

## Implementation Progress

### Completed

- Audited the current workspace instructions, Nx target, existing read-only
  diagnostic helper, and Vite runbook.

### In Progress

- None.

### Remaining

- None.

### Decisions and Requirement Changes

- `tools/dev/` is used to match the existing one-shot Windows diagnostic
  helper. The skill has its own focused directory under `.codex/skills/` so it
  remains discoverable without extending the generic Angular skill.
- The already-running port-4200 listener predated this task and was not stopped
  or replaced. Its presence proves resolver listener reporting but is not
  represented as a task-owned server start.

### Verification

- TDD exception recorded above.
- PowerShell parser: PASS.
- Live resolver: PASS. TLS is enabled; certificate and private-key paths are
  found/readable; public certificate SAN, validity, fingerprint, Windows chain,
  DNS, and listener facts are reported. No key content is emitted.
- Validated command-line HTTPS probe: PASS for classification. `localhost`
  fails with `SEC_E_WRONG_PRINCIPAL`; `vm2.linux:4200` times out because DNS
  resolves to `192.168.5.159`, not the local workstation.
- Browser transport: PASS for locality evidence. The Codex in-app browser
  reaches `https://localhost:4200` and reports
  `ERR_CERT_COMMON_NAME_INVALID`, demonstrating a hostname mismatch rather
  than localhost transport isolation. `https://vm2.linux:4200` cannot become
  local HTTPS evidence because that hostname routes elsewhere.
- Read-only comparison: PASS. Port-4200 listener identity was unchanged before
  and after resolver execution. No hosts or trust-store changes were made.
