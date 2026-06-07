# H-bugdet app

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.2.
And migrated up to version 17 at the moment of writting

Maing goal is to create home finantial app for private use

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

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
