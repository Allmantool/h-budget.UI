# Angular Vite EPERM Diagnostic Capture

## Status

Verified

## Problem and Goal

Vite has intermittently failed while rotating the project-local optimized
dependency cache in both rename directions. The lock owner was not captured.
Provide a small manual capture workflow so the next naturally occurring failure
preserves process, port, and cache-state evidence before recovery.

## Scope

**Required:**

- Add one read-only PowerShell snapshot under `tools/dev/`.
- Capture workspace-related processes, relevant Node-family processes, Angular
  serve-port ownership, Vite cache metadata, and Git/worktree identity.
- Optionally query `handle.exe` when already installed; do not install it.
- Document a ProcMon next-incident procedure and timestamp correlation steps.

**Non-goals:**

- Change Angular application behavior, dependencies, Vite prebundling, cache
  configuration, HTTPS, startup commands, ACLs, or antivirus settings.
- Clear cache, close handles, terminate processes, or add a monitor/service.
- Diagnose a root cause without new evidence.

## Repository Evidence and Unknowns

- **CONFIRMED:** Vite cache rotation has failed as both `deps_temp_* -> deps`
  and `deps -> deps_temp_*` with Windows `EPERM`.
- **CONFIRMED:** A controlled single-server run and a controlled two-server run
  did not reproduce the intermittent failure.
- **CONFIRMED:** Existing tooling directories are organised by concern under
  `tools/`; there is no PowerShell diagnostic-script convention.
- **UNKNOWN:** The precise locking process, re-optimization trigger, and
  timestamp relationship between EPERM and dependency 504 responses.

## Requirements and Acceptance Criteria

- **REQ-001:** A manually invoked script captures a timestamp, Git/worktree
  identity, workspace process details, relevant Node-family processes, port
  ownership, and cache directory metadata without reading file contents.
    - **AC-001:** On a healthy dev-server run it reports the serving PID, port
      4200 ownership, `deps`/`deps_temp_*` state, and exits successfully.
- **REQ-002:** The script remains safe when optional Sysinternals tooling is
  absent.
    - **AC-002:** It reports `handle.exe unavailable` and continues successfully.
- **REQ-003:** The documented workflow preserves evidence before recovery.
    - **AC-003:** The runbook gives exact ProcMon filters, captures the required
      timestamps and trigger context, and explicitly forbids cleanup first.
- **EDGE-001:** Processes whose command line omits the workspace path but are
  Node/npm/ng/Vite-family processes are reported separately rather than hidden.

## Constraints

- The script must be one-shot and read-only: no process, handle, cache, file,
  rename, restart, environment, or network mutation.
- Do not emit environment values, cookie/token data, certificate material, file
  contents, or application payloads.
- Keep normal development-server behavior unchanged.

## Test and Verification Strategy

TDD: Not Applicable — Reason: host process/cache inspection is not a stable
unit-test boundary and must not manufacture EPERM; Verification: PowerShell
parser validation, a healthy-run execution, output inspection, cache/process
before-and-after snapshots, Markdown formatting, and diff checks.

## Implementation Plan

1. Add the read-only snapshot script — parser accepts it and its safety contract
   is visible in comments.
2. Extend the runbook — next-incident ProcMon and correlation procedures are
   explicit.
3. Run the script against one healthy normal server — required observations are
   present and no state is changed.
4. Review the diff and update traceability.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation                            | Test / Evidence                                                                                                             | Status |
| ----------- | ------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-001     | AC-001              | `tools/dev/capture-angular-dev-state.ps1` | Healthy server: PID 44244 owned port 4200; Git identity and `deps`/`deps_temp_*` metadata captured; exit 0 and stderr empty | PASS   |
| REQ-002     | AC-002              | Optional `handle.exe` branch              | `handle.exe` unavailable; `-IncludeHandleReport` reported that condition and exited 0                                       | PASS   |
| REQ-003     | AC-003              | Windows dev-server runbook                | Reviewed dedicated ProcMon, trigger, timestamp, snapshot, and preserve-before-recovery sequence                             | PASS   |

## Implementation Progress

### Completed

- Recorded confirmed cache-rotation evidence and constraints.
- Added and parser-validated the one-shot snapshot script.
- Added the ProcMon next-incident and timestamp-correlation procedure.
- Ran the script against an unchanged healthy server. It emitted no stderr;
  before/after checks confirmed cache metadata and port ownership were unchanged.

### In Progress

- None.

### Remaining

- Capture the next naturally occurring EPERM with the documented workflow.

### Decisions and Requirement Changes

- `tools/dev/` is selected because existing tooling is organised under `tools/`
  by purpose and no narrower PowerShell convention exists.

### Verification

- TDD exception recorded above; no EPERM will be manufactured.
- PowerShell parser: PASS.
- Healthy-run snapshot: PASS (exit code 0, stderr 0 bytes).
- Optional Handle-unavailable path: PASS.
- Default Handle-unavailable path: PASS (explicit availability message, exit
  code 0, stderr 0 bytes).
- Read-only comparison: PASS (cache directory timestamps and port-4200 PID
  unchanged before and after snapshot execution).
- The test server was task-owned and stopped after validation; no server remains
  listening on port 4200.
