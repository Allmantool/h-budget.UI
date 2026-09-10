# Angular development server on Windows

## Scope

This runbook is for the Home Ledger SPA's Nx Angular/Vite dev server. It
records the investigation of:

```text
EPERM: operation not permitted, rename
'...\\vite\\deps_temp_c27b3429' -> '...\\vite\\deps'
```

The observed environment was Windows x64, Node 24.10.0, npm 11.18.0, Nx
22.7.5, Angular CLI/build 21.2.16, Vite 7.3.2, TypeScript 5.9.3, and Angular
Material/CDK 21.2.14. The project uses `@nx/angular:dev-server` and its Vite
cache is under the project-local `.angular/cache` tree.

## Normal startup

Use the workspace script:

```powershell
npm run start
```

For a diagnostic launch that does not open a browser:

```powershell
.\node_modules\.bin\nx.cmd serve h-budget --watch --open=false --ssl=true --configuration=development
```

The target is already configured for local HTTPS. Do not add a second server
profile or machine-specific paths. Avoid starting both VS Code SPA tasks at
once; each can independently own the same development port.

Angular documents that `serve` rebuilds on file changes, supports HTTPS, and
uses Vite prebundling when the CLI cache is enabled. The workspace-specific Nx
schema also exposes `--prebundle=false`; it is a temporary diagnostic fallback,
not a permanent configuration change.

## Safe recovery from a Vite cache rename failure

1. Stop only dev-server processes that you started. Confirm no process listens
   on the configured port:

    ```powershell
    Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue
    ```

2. Resolve and inspect the exact cache directory. Never recursively delete a
   broad workspace or user cache:

    ```powershell
    $workspaceRoot = (Resolve-Path .).Path
    $viteCache = Join-Path $workspaceRoot '.angular\cache\21.2.16\h-budget\vite'
    Get-Item -LiteralPath $viteCache -Force
    ```

3. If no server is listening and the resolved path is beneath the workspace,
   remove only that Vite cache directory, then restart normally:

    ```powershell
    Remove-Item -LiteralPath $viteCache -Recurse -Force
    npm run start
    ```

Angular's `ng cache clean` deletes its persistent disk cache, but this Nx
workspace was not recognised as an Angular CLI workspace by `ng cache`; use the
targeted project-local procedure above instead. Do not delete `node_modules`
or change antivirus exclusions without a separate confirmed cause.

If the failure recurs immediately, capture fresh logs first, then temporarily
run the diagnostic command with `--prebundle=false`. That fallback was not
needed or validated as a repair in this investigation.

## Evidence from 2026-09-10

- Before cleanup, the resolved Vite cache contained `deps_temp_58223567` and
  `deps_temp_c27b3429`; no `deps` directory was present. No listener owned
  port 4200.
- After the safety checks, only that resolved cache directory was removed.
  `CacheExists=False` was confirmed before restart.
- A cold start rebuilt successfully in 10.731 seconds; two warm starts also
  succeeded in 9.775 and 11.282 seconds. `https://localhost:4200/` returned
  HTTP 200 after each checked start.
- A temporary CSS whitespace edit triggered a 4.414-second rebuild and
  `Component update sent to client(s)`; the edit was restored. No task-owned
  server was left running.
- No EPERM error occurred in the observed cold, warm, or HMR runs. The stale
  `deps_temp_*` directories are correlation, not proof of root cause. A repeat
  under the same failing external condition is required to confirm a cause.

## HTTP/2 warning trace

The dev-server runs were started with `NODE_OPTIONS=--trace-warnings`. The logs
contained only the Node `NO_COLOR`/`FORCE_COLOR` warning stack. They did not
contain `UnsupportedWarning: Status message is not supported by HTTP/2`, and a
repository search found no application runtime use of `statusMessage`,
`writeHead`, `http2`, or `createSecureServer` (only a tooling fixture).

Therefore the HTTP/2 warning is **not reproduced and not attributed**. Do not
suppress it. On recurrence, reproduce with the same traced startup, retain the
warning stack and exact request/tool action, then update the code at the stack
source rather than hiding the warning.

## Verification boundary

The checks above are Windows process, HTTPS, and HMR evidence. A real browser
visual/API session was not available because the computer-use transport closed
before UI automation could begin. Treat authenticated flows, lazy route
navigation, and visual viewport acceptance as still requiring a live-browser
pass.
