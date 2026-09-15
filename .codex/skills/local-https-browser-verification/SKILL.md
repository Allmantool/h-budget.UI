---
name: local-https-browser-verification
description: Diagnose and verify Angular/Nx local HTTPS browser sessions without conflating listener, routing, certificate hostname, trust, or browser-network failures. Use for Angular browser verification, localhost dev servers, HTTPS ng serve, screenshots, browser automation, and ERR_CERT_*, ERR_EMPTY_RESPONSE, or ERR_CONNECTION_REFUSED errors.
---

# Local HTTPS browser verification

Use this skill before declaring a local browser verification blocked or starting
an HTTP fallback. It applies to real-browser acceptance checks, Playwright or
browser automation, screenshots, viewport testing, and certificate or local
transport errors. This is a diagnostic sequence, not permission to modify TLS,
DNS, hosts, certificates, browser security, or application configuration.

## Safety rules

- Never read, print, copy, upload, or commit a private-key file. You may report
  only its configured path, regular-file existence, and whether it can be
  opened for reading without consuming content.
- Inspect public-certificate metadata only: subject, issuer, SAN DNS/IP names,
  validity period, and fingerprint. Do not print certificate blobs or PFX
  passwords.
- Do not use `curl --insecure`/`-k`, browser certificate-interstitial bypasses,
  global certificate exceptions, or `--allow-insecure-localhost` as acceptance
  evidence. A labelled insecure probe is exceptional diagnostic evidence only;
  it never proves HTTPS or browser correctness.
- Do not edit hosts files, DNS, trust stores, browser trust, or application
  HTTPS configuration. State the optional mapping or trust prerequisite and
  request explicit authorization if a system change is needed.
- Do not silently create an HTTP server. A temporary HTTP fallback is permitted
  only for explicitly labelled layout evidence when secure-context behavior is
  irrelevant and the user accepts the limitation; stop the temporary server
  afterward.

## Discovery and classification

1. From the SPA root, trace the active Nx/Angular serve target and selected
   configuration. Read `project.json`, `nx.json`, package scripts, VS Code
   tasks/launch settings, and relevant runbooks; configuration has priority.
   Resolve `ssl`, `sslCert`, `sslKey`, host, port, and build target. Expand a
   configured relative or environment-expanded certificate path before testing
   it. Do not expose environment-variable values.
2. Run `./tools/dev/resolve-angular-https.ps1` when it is available. It is a
   one-shot read-only resolver. If the configuration has no usable certificate
   path, inspect named configuration and runbook references first, then only
   path metadata under the known development-certificate root
   `C:/Dev/Certificates/`; do not search the whole drive.
3. Treat certificate validity as separate facts:
    - `TLS_HOSTNAME_ERROR`: the requested hostname is not a certificate SAN.
    - `TLS_TRUST_ERROR`: the valid hostname's chain is untrusted or cannot be
      verified locally.
    - `TLS_EXPIRED_ERROR`: the certificate is outside its validity period.
      Say, for example, “valid for `vm2.linux`, not `localhost`,” rather than
      “the certificate is invalid.”
4. Resolve each likely hostname (certificate DNS SANs, configured host, and
   `localhost` where relevant) and compare addresses with local interfaces and
   the listener binding. A certificate host resolving to another machine is a
   `ROUTING_ERROR`, not a TLS failure. Read the hosts file only when useful;
   never change it automatically.
5. Check the configured port before TLS diagnosis. Record listener address, PID,
   process, and redacted command line. No listener is
   `SERVER_NOT_LISTENING`; `ERR_CONNECTION_REFUSED` and
   `ERR_EMPTY_RESPONSE` are not inherently certificate failures.
6. Use verified command-line probes by default to distinguish TCP, handshake,
   and HTTP results. Preserve certificate validation. Use a hostname that is a
   SAN and report exactly whether a failure is routing, hostname, trust, or
   application/runtime related.
7. Only after the workstation probe succeeds, exercise the available browser.
   Determine whether browser `localhost` is the workstation namespace or an
   isolated browser/container namespace. If shell access works but the browser
   cannot reach a known workstation-local endpoint, report
   `BROWSER_TRANSPORT_ERROR`; do not change certificates to compensate.

## Browser decision tree

```text
Dev server listening?
  no  -> SERVER_NOT_LISTENING: start or fix the task-owned server.
  yes -> Can verified local HTTPS reach the listener?
           no  -> diagnose listener, routing, TLS hostname/trust, or app failure.
           yes -> Does URL hostname match a certificate SAN?
                    no  -> select a valid SAN hostname or report routing prerequisite.
                    yes -> Is the chain trusted and certificate current?
                             no/unknown -> report TLS trust/expiry requirement.
                             yes        -> Can the browser reach that workstation?
                                             no  -> BROWSER_TRANSPORT_ERROR.
                                             yes -> browser verification proceeds.
```

## Home Ledger hint

The currently observed development configuration names
`C:/Dev/Certificates/vm2.linux/vm2.linux.pem` and the adjacent private-key
path. This is only a hint: always discover the active serve configuration
first. A `vm2.linux` SAN can be correct for TLS while its DNS still routes to a
different machine than the local Nx server.

## Failure boundaries

Keep these classes independent in reporting:

- `BUILD_RESOURCE_ERROR` — Angular compile/resource errors such as NG2008.
- `DEV_SERVER_CACHE_ERROR` — Vite dependency-cache EPERM.
- `DEPENDENCY_SERVE_ERROR` — Vite optimized-dependency 504 responses.
- `SERVER_NOT_LISTENING`, `ROUTING_ERROR`, `TLS_HOSTNAME_ERROR`,
  `TLS_TRUST_ERROR`, `TLS_EXPIRED_ERROR`, and `BROWSER_TRANSPORT_ERROR` — use
  their literal cause as established above.

For Vite EPERM or dependency 504, follow
`docs/runbooks/angular-dev-server-windows.md`; those failures are independent
of local HTTPS unless evidence connects them.
