# Angular development server on Windows

## Scope and current evidence

This runbook covers the Home Ledger SPA's Nx Angular/Vite development server.
The generated dependency cache is project-local:

```text
.angular\\cache\\21.2.16\\h-budget\\vite\\deps
```

Two Vite cache-replacement failures have been observed:

```text
EPERM: operation not permitted, rename
'...\\vite\\deps_temp_<id>' -> '...\\vite\\deps'

EPERM: operation not permitted, rename
'...\\vite\\deps' -> '...\\vite\\deps_temp_<id>'
```

Both directions are part of Vite replacing its optimized-dependency directory.
They confirm that the failure occurs at the optimizer cache-rotation boundary.
They do **not** identify the process or condition that denied the rename. Do not
describe antivirus, Chrome, VS Code, or a second server as the root cause until
a handle capture or equivalent filesystem evidence identifies it.

The observed toolchain is Windows x64, Node 24.10.0, npm 11.18.0, Nx 22.7.5,
Angular CLI/build 21.2.16, and Vite 7.3.2. The project uses
`@nx/angular:dev-server` with Angular prebundling enabled.

## Normal startup

Use the workspace script:

```powershell
npm run start
```

For a no-browser diagnostic launch, use:

```powershell
.\node_modules\.bin\nx.cmd serve h-budget --watch --open=false --ssl=true --configuration=development
```

Do not start the normal and debug VS Code server tasks together, and do not
start a second `nx serve` on another port while the first server is using this
project's Vite cache. A different port does not provide a different Vite cache.
Karma uses port 9876 and does not start the SPA dev server.

The target is already configured for local HTTPS. Angular `serve` rebuilds on
file changes and uses Vite prebundling when the CLI cache is enabled.

## Local HTTPS and browser verification

Before calling a browser check blocked, run the repository-local resolver from
the SPA root:

```powershell
.\tools\dev\resolve-angular-https.ps1
```

It reads the active `serve` target and Nx target defaults, confirms configured
certificate/key *file metadata*, safely reports public-certificate SANs and
validity, resolves likely hostnames, checks listener ownership, and evaluates
the local Windows chain. It does not read private-key contents, make an HTTP
request, start or stop processes, or change DNS, hosts, browser settings, or
certificate stores.

Use the resolver's facts in this order:

1. A missing listener is `SERVER_NOT_LISTENING`; it is not a TLS fault.
2. A browser URL must use a DNS/IP SAN. If the certificate is valid for
   `vm2.linux` but not `localhost`, `https://localhost:4200` is a
   `TLS_HOSTNAME_ERROR`, not a generically invalid certificate.
3. A valid certificate hostname that resolves to another machine is a
   `ROUTING_ERROR`. Do not edit the hosts file automatically; an optional
   `127.0.0.1 vm2.linux` mapping needs explicit user authorization and is only
   appropriate when the intended local listener is known.
4. An untrusted or expired chain is `TLS_TRUST_ERROR` or
   `TLS_EXPIRED_ERROR`. Do not import a CA, accept a browser interstitial, or
   use `--allow-insecure-localhost` as HTTPS evidence.
5. If a verified workstation probe succeeds but browser automation cannot reach
   the same endpoint, report `BROWSER_TRANSPORT_ERROR`; its localhost is likely
   isolated from the workstation network namespace.

The resolver cannot prove browser locality by itself. Follow the
[`local-https-browser-verification` skill](../../.codex/skills/local-https-browser-verification/SKILL.md)
for the verified command-line probe and browser decision tree. A temporary HTTP
server, if explicitly authorized for non-secure layout evidence, must be
labelled **REAL BROWSER + TEST HTTP FALLBACK** and cannot prove HTTPS,
certificate, secure-cookie, or secure-context behavior.

Vite cache EPERM and optimized-dependency 504 errors remain independent of TLS;
continue with the evidence-first procedure below rather than changing
certificates or HTTPS configuration.

## Evidence-first investigation

Do not clear `.angular/cache`, delete `deps`, restart repeatedly, disable
prebundling, or terminate all `node.exe` processes before capturing evidence.

### 1. Record process ownership

At the time of the EPERM, record the complete command line, parent, and start
time for each workspace process and the listener on port 4200:

```powershell
$workspace = (Resolve-Path .).Path
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like "*$workspace*" } |
  Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, CreationDate, CommandLine

Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue |
  Select-Object State, LocalAddress, LocalPort, OwningProcess
```

Check for an old or second `nx serve`, a VS Code task plus manual `npm run
start`, an automated browser/test launch, an orphaned Node child, or another
worktree using this cache path. One port listener is not proof that there is
only one cache owner.

### 2. Find the handle; do not close it

Prefer Sysinternals Process Explorer (**Find Handle or DLL**) or `handle.exe`.
Search both exact paths:

```text
...\.angular\cache\21.2.16\h-budget\vite\deps
...\.angular\cache\21.2.16\h-budget\vite
```

Capture the process name, PID, command line, and the exact file or directory
handle. Do not use a handle-closing option. If Sysinternals is unavailable, use
Resource Monitor's Associated Handles search. For a transient failure, ProcMon
is the fallback: filter paths beginning with the `vite` directory and correlate
`SetRenameInformationFile`, `CreateFile`, `CloseFile`, and `QueryOpen` with the
Vite error timestamp. Preserve results such as `SHARING VIOLATION`, `ACCESS
DENIED`, `DELETE PENDING`, or `NAME COLLISION`.

### 3. Treat the 504 burst as a downstream symptom

After a failed rotation, browser requests to `/@fs/.../vite/deps/*.js` can
return 504 because Vite's optimized-dependency state is incomplete or stale.
Capture the ordering in the dev-server log and browser network panel:

```text
optimizer rename EPERM -> failed optimizer update -> dependency 504 responses
```

This is a causal hypothesis until timestamps demonstrate the ordering. The
appearance of Angular Material, CDK, Forms, or ng-apexcharts in the 504 list
does not make those libraries the cause.

## Capture the next intermittent EPERM

Prepare ProcMon before normal SPA use; do not alter the server, cache, or
prebundling to provoke the incident. Add these filters:

| Column    | Relation    | Value                                |
| --------- | ----------- | ------------------------------------ |
| Path      | begins with | `C:\Dev\h-budget\UI\.angular\cache\` |
| Operation | is          | `SetRenameInformationFile`           |
| Operation | is          | `CreateFile`                         |
| Operation | is          | `CloseFile`                          |
| Operation | is          | `QueryOpen`                          |

Keep cleanup/delete operations in view, and inspect results including `SHARING
VIOLATION`, `ACCESS DENIED`, `DELETE PENDING`, `NAME COLLISION`, and `NAME NOT
FOUND`.

When EPERM occurs:

1. Stop ProcMon immediately and save the capture.
2. Record the Vite EPERM timestamp, the immediately preceding optimizer or
   re-optimization message, and what happened just before it: startup, route
   navigation, Accounting/date-picker/editor use, HMR edit, reload, a second
   tab, dependency change, or no visible action.
3. Record the first browser request returning `/vite/deps/` 504, if any.
4. Without clearing the cache, run the one-shot snapshot from the SPA root:

    ```powershell
    .\tools\dev\capture-angular-dev-state.ps1
    ```

    If `handle.exe` has already been installed manually and its EULA has been
    accepted, capture exact `deps` and parent `vite` handles too:

    ```powershell
    .\tools\dev\capture-angular-dev-state.ps1 -IncludeHandleReport
    ```

5. Preserve the dev-server log and record the snapshot's `deps` and
   `deps_temp_*` timestamps/file counts.
6. Inspect ProcMon events surrounding the EPERM timestamp before performing
   incident recovery.

The snapshot only writes to standard output; it does not terminate processes,
close handles, or alter cache content. Redirect output to an incident file only
when needed. This sequence is intended to establish or reject:

```text
optimizer starts -> cache rename fails -> optimizer state is inconsistent -> dependency 504 begins
```

Do not claim that sequence until the captured timestamps prove it.

## Recovery after ownership has been captured

1. Stop only the identified, task-owned dev-server or test processes from the
   terminal that started them (Ctrl+C). Do not kill all Node processes.
2. Verify no task-owned cache holder remains and port 4200 is free:

    ```powershell
    Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue
    ```

3. Use the Angular CLI cache cleanup command only when the CLI recognises the
   workspace. In this Nx repository, `npx ng cache clean` currently reports
   that it is outside an Angular CLI workspace; do not replace that command
   with an unreviewed `Remove-Item` workaround. Record the limitation and
   obtain a reviewed repository-local cleanup procedure before deleting cache
   content.
4. Start one normal server with prebundling enabled, load the app, and keep the
   diagnostic log for the first lazy-route navigation.

`--prebundle=false` is an A/B diagnostic only after normal mode fails with
ownership evidence. It must not become the default merely because it avoids a
symptom.

## Verification matrix

After a confirmed cause is corrected and any one-time supported cleanup is
complete, verify normal prebundling with:

- cold start, then two warm starts without cache cleanup;
- lazy navigation through Overview, Rates, Accounting, and payment history;
- Material datepicker, select/autocomplete, table/paginator, and editor;
- one harmless HMR style edit, its exact restoration, and a second update;
- several page reloads and a browser restart;
- successful optimized-dependency responses for Angular common, Material
  button/datepicker/table, Forms, and ng-apexcharts.

No EPERM or `/vite/deps/` 504 burst is acceptable in this matrix. Keep normal
prebundling enabled unless a documented, evidence-backed fallback is accepted.

## Separate HTTP/2 warning

`UnsupportedWarning: Status message is not supported by HTTP/2` is separate
from a Windows filesystem rename failure. Reproduce it once with
`NODE_OPTIONS=--trace-warnings`, retain the stack, and attribute it to the
project, Angular dev server, proxy, or dependency before changing code or
suppressing warnings.
