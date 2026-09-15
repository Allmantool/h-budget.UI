# Restore Currency Rate Country Flags

## Status

Verified with browser limitation

## Problem and Goal

The Country cells on `/dashboard/currency-rates` render empty although rate rows contain currency abbreviations. Restore visible, accessible country flags without changing rate, selection, or chart behavior.

## Scope

**Required:**

- Map every currently returned currency abbreviation to its intentional flag country/region.
- Render a local `flag-icons` flag with country text for assistive technology and a visible fallback for unknown or missing data.
- Detect the required flag assets during build verification.
- Add focused mapping and grid rendering regression coverage.

**Non-goals:**

- Change the backend contract, rate data workflow, grid behavior, or introduce a network flag service.
- Redesign the Currency Rates dashboard.

**Optional / Follow-up:**

- Extend the mapping if the upstream API introduces another displayable currency.

## Repository Evidence and Unknowns

- **CONFIRMED:** `GET https://vm2.linux:7398/gateway/currency-rates/today` returns RUB, UAH, EUR, TRY, CNY, USD, PLN, and THB; it supplies no country field.
- **CONFIRMED:** DTO, domain, NGXS state, presentation mapper, and grid preserve `abbreviation`.
- **CONFIRMED:** the grid renders `.fi.fi-<pipe result>` and the existing pipe produces the expected two-letter codes for the current set.
- **CONFIRMED:** the local `flag-icons@7.5.0` CSS references all SVGs, but its installed `flags/4x3` and `flags/1x1` directories contain only 48 early-alphabet files. The production output consequently lacks all eight active flags and `npm run verify:flag-icons` fails.
- **ASSUMED:** a clean installation from the locked dependency will restore the complete package; the build verifier will make missing active assets a detectable failure.
- **UNKNOWN:** browser acceptance is blocked on this machine because its local HTTPS listener is `localhost:4200` while the certificate is valid for `vm2.linux`, which routes to a different host.

## Requirements and Acceptance Criteria

- **REQ-001:** Resolve country identity from a centralized presentation mapping using the API currency abbreviation.
- **AC-001:** USD, UAH, EUR, PLN, RUB, TRY, CNY, and THB resolve to US, UA, EU, PL, RU, TR, CN, and TH, respectively.
- **REQ-002:** The grid renders a compact, labelled local flag and does not render an empty Country cell for unsupported or missing information.
- **AC-002:** Unknown or null abbreviations render a visible neutral fallback and do not throw.
- **REQ-003:** Existing row selection and selected-currency chart coordination stay unchanged.
- **AC-003:** The existing selection regression remains green.
- **REQ-004:** Production packaging verifies the flag files used by the current API response.
- **AC-004:** The asset verifier checks all active flag SVGs in both `4x3` and `1x1` catalogs.

## Constraints

- Use the already-declared, locally packaged `flag-icons` dependency; no external flag runtime dependency.
- Keep the country mapping out of templates and preserve current Material table behavior.
- Follow strict TypeScript, component-scoped BEM styling, and WCAG-compatible labels.

## Test and Verification Strategy

- RED/GREEN: pure mapping unit specs and Currency Rates grid component rendering specs.
- Run the focused spec target, then lint, production build, asset verifier, and relevant grid test suite.
- Browser verification uses the local HTTPS skill; the current TLS/routing prerequisite is recorded if unresolved.

## Implementation Plan

1. Add a typed currency-to-country presentation mapping and RED tests — all current codes and fallback are specified.
2. Bind the grid Country column to mapped flag metadata with accessible text and fallback — no blank cell remains.
3. Expand the packaged-asset verifier to the active currencies — an incomplete dependency/build fails clearly.
4. Restore the locked dependency installation locally, validate production output, and run self-review.

## Requirement Traceability

| Requirement | Acceptance Criteria | Implementation                                            | Test / Evidence                                  | Status |
| ----------- | ------------------- | --------------------------------------------------------- | ------------------------------------------------ | ------ |
| REQ-001     | AC-001              | `CurrencyFlagMetadata`, presentation mapper               | Mapping spec: 9 mappings and fallback            | PASS   |
| REQ-002     | AC-002              | Grid metadata binding, label, and Material globe fallback | Grid component spec                              | PASS   |
| REQ-003     | AC-003              | Existing state/grid behavior                              | Grid selection spec                              | PASS   |
| REQ-004     | AC-004              | Active flag assets are checked in both catalogs           | Production build and `npm run verify:flag-icons` | PASS   |

## Implementation Progress

### Completed

- Audited API through grid and reproduced the missing static asset failure in production output.

### In Progress

- Browser verification cannot use the local listener safely because the certificate hostname routes remotely.

### Remaining

- Browser visual confirmation when a certificate-valid local URL is available.

### Decisions and Requirement Changes

- No backend country field is available, so a small presentation mapping is the appropriate source of truth. EUR intentionally maps to the EU flag.

### Verification

- **RED:** Added the mapping specification before its production class existed. The initial focused runner invocation did not return its terminal result within the tool's short execution window; it was not represented as a passing RED run.
- **GREEN:** `npx nx test h-budget --watch=false --browsers=ChromiumNoSandbox --code-coverage=false --progress=false --include=src/tests/share/constants/currency-flag-metadata.spec.ts --include=src/tests/currency-rates/components/currency-rates-grid.component.spec.ts` — PASS, 27 specs.
- **Type check:** `npm run typecheck` — PASS.
- **Focused lint:** changed paths — PASS with zero errors. Existing warnings in the grid template/component remain outside this change.
- **Repository lint:** `npm run lint` — FAIL, 246 pre-existing formatting errors plus 385 warnings in unrelated paths; no suppression or broad formatting was applied.
- **Production build:** `npm run build:prod` — PASS (existing initial-bundle budget warning remains).
- **Asset verification:** `npm run verify:flag-icons` — PASS after the locally installed locked package was rehydrated from its verified `flag-icons@7.5.0` tarball.
- **Browser:** BLOCKED. `resolve-angular-https.ps1` found a trusted, current `vm2.linux` certificate but that hostname resolves to `192.168.5.159`, not the local development listener; `localhost` does not match the certificate. No insecure fallback, hosts-file change, or certificate bypass was used.
