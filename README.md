# H-budget app

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.2 and has since been migrated to Angular 20 with Nx.

Main goal is to create a home financial app for private use.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` for a development build or `npm run build:prod` for a production build. The build artifacts will be stored in the `dist/` directory.

## Start and debug the SPA in VS Code

Prerequisites: use Node.js 24+ and npm 11+ and ensure the development TLS certificate configured in `project.json` is available. Google Chrome is the configured debug browser.

1. Open **Run and Debug**.
2. Select **SPA: Start and Debug**.
3. Set a breakpoint in an Angular TypeScript file.
4. Press `F5`.

VS Code starts `npm run start:debug`, waits for the Angular server at `https://localhost:4200`, and launches Chrome with the built-in JavaScript debugger. The debug-only browser session accepts the locally configured development certificate; it does not change your normal Chrome profile. Stop the debug session to stop the server task.

Use **Terminal → Run Task** to run the remaining workflows:

- **SPA: Start Debug Server** or **SPA: Start Development Server** for the HTTPS development server.
- **SPA: Unit Tests**, **SPA: Unit Tests - Watch**, and **SPA: Unit Tests - Coverage** for Karma/Jasmine tests; use **SPA: Debug Unit Tests** from Run and Debug to set breakpoints in tests or application code.
- **SPA: Lint**, **SPA: Format Check**, **SPA: Type Check**, **SPA: Build Development**, and **SPA: Build Production** for individual checks.
- **SPA: Verify** for type checking, linting, formatting verification, unit tests, and a production build.

The equivalent command-line verification workflow is `npm run verify`. To attach to an already running Chrome instance, start Chrome with `--remote-debugging-port=9222 --user-data-dir=<temporary-directory>` and select **SPA: Attach to Browser**.

## Running unit tests

Run `npm run test` or `npm run test:ci` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Safe dependency upgrades

Dependency upgrade PRs are created by `.github/workflows/update_npm_packages.yml` only after the upgraded dependency set passes a clean verification run. The workflow installs the current lockfile with `npm ci`, applies the selected update, validates dependency compatibility, removes `node_modules`, installs again with `npm ci`, and then runs type-check, lint, unit tests, production build, and Nx affected build validation.

Automatic patch updates run daily through `npm run deps:update:patch:safe`. They update only eligible patch versions and exclude Angular, Nx, TypeScript, RxJS, Zone.js, ESLint, builders, test frameworks, bundlers, and other build-chain packages from generic automation.

Automatic minor updates run weekly through `npm run deps:update:minor:safe`. Minor updates are limited to an allowlist of low-risk runtime or type packages in `tools/deps/rules.mjs`. Framework, compiler, builder, lint, test, and bundler packages are intentionally excluded.

Angular and Nx migrations are manual. Run the GitHub Actions workflow manually, or run `npx nx migrate <target>` locally, then `npm install`, `npx nx migrate --run-migrations`, and `npm run deps:verify:framework`. These packages should move together through `nx migrate`, not through broad npm update commands.

If an automated dependency update causes an npm install or peer dependency conflict, `tools/deps/safe-update.mjs` first tries the full eligible set, then falls back to deterministic package-by-package mitigation. Packages that cannot install cleanly are reverted and listed in the generated PR summary. The workflow never uses `--force` or `--legacy-peer-deps` to hide conflicts.

Troubleshooting failed runs:

- Download the workflow diagnostic artifact and inspect `dependency-update-summary.md` plus `logs/dependency-upgrade/`.
- Run `npm ci` locally to confirm the baseline lockfile is installable.
- Run `npm run deps:guard` to check lockfile consistency, peer dependencies, and Angular/Nx ecosystem alignment.
- Run `npm run deps:verify` for the same clean verification gate used before automated PR creation.
- For blocked Angular/Nx/TypeScript/RxJS/Zone.js changes, use the manual migration path instead of editing versions directly.
