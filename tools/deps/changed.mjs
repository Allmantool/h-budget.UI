import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  collectRootDependencies,
  ensureWorkDirs,
  getLockVersion,
  gitShowHead,
  hasGitDiff,
  readJson,
  repoRoot,
  workDir,
} from './common.mjs';

ensureWorkDirs();

const positionals = readPositionals();
const updateType = readOption('--type') ?? positionals[0] ?? 'dependency';
const summaryFile = readOption('--summary-file') ?? positionals[1] ?? 'dependency-update-summary.md';
const githubOutput = readOption('--github-output');
const changed = hasGitDiff();
const changes = collectChangedDependencies();
const state = readState();
const body = buildSummary(changed, changes, state, updateType);

writeFileSync(join(repoRoot, summaryFile), body);
console.log(body);

if (githubOutput) {
  writeFileSync(githubOutput, `changed=${changed ? 'true' : 'false'}\n`, { flag: 'a' });
}

function collectChangedDependencies() {
  const headPackageJson = gitShowHead('package.json');
  if (!headPackageJson) {
    return [];
  }

  const before = collectRootDependencies(JSON.parse(headPackageJson));
  const afterPackageJson = readJson('package.json');
  const afterLock = readJson('package-lock.json');
  const after = collectRootDependencies(afterPackageJson);
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);

  return [...names]
    .filter((name) => before[name] !== after[name])
    .sort()
    .map((name) => ({
      name,
      from: before[name] ?? '<not declared>',
      to: after[name] ?? '<removed>',
      resolved: getLockVersion(afterLock, name) ?? '<not locked>',
    }));
}

function readState() {
  const stateFile = join(workDir, 'state.json');
  if (!existsSync(stateFile)) {
    return { accepted: [], rejected: [], warnings: [] };
  }

  return JSON.parse(readFileSync(stateFile, 'utf8'));
}

function buildSummary(hasChanges, dependencyChanges, state, type) {
  const guardCommand =
    type === 'angular-nx-migration'
      ? 'npm run deps:guard -- --allow-framework-updates'
      : 'npm run deps:guard';
  const changedRows =
    dependencyChanges.length === 0
      ? '- None'
      : dependencyChanges
          .map(
            (change) =>
              `- ${change.name}: ${change.from} -> ${change.to} (locked ${change.resolved})`,
          )
          .join('\n');

  const rejectedRows =
    state.rejected?.length > 0
      ? state.rejected
          .map((change) => `- ${change.name}: ${change.from} -> ${change.to}; ${change.reason}`)
          .join('\n')
      : '- None';

  const warnings =
    state.warnings?.length > 0
      ? state.warnings.map((warning) => `- ${warning}`).join('\n')
      : '- None';

  return `## Safe NPM Dependency Upgrade

Update type: ${type}

Changed dependencies:
${changedRows}

Mitigated or reverted dependencies:
${rejectedRows}

Verification commands run before PR creation:
- npm ci
- ${guardCommand}
- npx tsc -p tsconfig.app.json --noEmit
- npm run lint
- npm run test:ci
- npm run build:prod
- npx nx affected --target=build --uncommitted --configuration=production

Warnings or manual follow-up:
${warnings}

PR creation is gated on successful clean install, dependency guard, type-check, lint, unit tests, production build, and Nx affected build.

Changes detected: ${hasChanges ? 'yes' : 'no'}
`;
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function readPositionals() {
  const optionsWithValues = new Set(['--type', '--summary-file', '--github-output']);
  const result = [];
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (optionsWithValues.has(arg)) {
      index += 1;
      continue;
    }

    if (!arg.startsWith('--')) {
      result.push(arg);
    }
  }

  return result;
}
