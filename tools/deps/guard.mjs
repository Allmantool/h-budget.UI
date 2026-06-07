import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  collectRootDependencies,
  ensureWorkDirs,
  getLockVersion,
  gitShowHead,
  parseVersion,
  readJson,
  repoRoot,
  runCommand,
} from './common.mjs';
import { isBlockedAutomaticPackage } from './rules.mjs';

const allowFrameworkUpdates = process.argv.includes('--allow-framework-updates');

ensureWorkDirs();
const packageJson = readJson('package.json');
const packageLock = readJson('package-lock.json');
const failures = [];
const warnings = [];

validateLockfileRoot();
validateBlockedRootUpdates();
validateAngularNxAlignment();
validateNpmPeerGraph();

if (warnings.length > 0) {
  console.warn(warnings.map((warning) => `warning: ${warning}`).join('\n'));
}

if (failures.length > 0) {
  console.error('Dependency guard failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Dependency guard passed.');

function validateLockfileRoot() {
  const rootLock = packageLock.packages?.[''];
  if (!rootLock) {
    failures.push('package-lock.json is missing the root package entry.');
    return;
  }

  for (const section of ['dependencies', 'devDependencies']) {
    const packageDeps = packageJson[section] ?? {};
    const lockDeps = rootLock[section] ?? {};

    for (const [name, spec] of Object.entries(packageDeps)) {
      if (lockDeps[name] !== spec) {
        failures.push(
          `package-lock.json root ${section}.${name} is ${lockDeps[name] ?? '<missing>'}, expected ${spec}.`,
        );
      }
    }
  }
}

function validateBlockedRootUpdates() {
  if (allowFrameworkUpdates) {
    return;
  }

  const headPackageJson = gitShowHead('package.json');
  if (!headPackageJson) {
    warnings.push('Could not read HEAD:package.json; skipped blocked package diff guard.');
    return;
  }

  const before = collectRootDependencies(JSON.parse(headPackageJson));
  const after = collectRootDependencies(packageJson);

  for (const [name, nextSpec] of Object.entries(after)) {
    if (!isBlockedAutomaticPackage(name)) {
      continue;
    }

    const previousSpec = before[name];
    if (previousSpec !== undefined && previousSpec !== nextSpec) {
      failures.push(
        `${name} changed from ${previousSpec} to ${nextSpec}; framework/build-chain packages require manual nx migrate or an explicit allow flag.`,
      );
    }
  }
}

function validateAngularNxAlignment() {
  const angularPackages = [
    '@angular/animations',
    '@angular/common',
    '@angular/compiler',
    '@angular/compiler-cli',
    '@angular/core',
    '@angular/forms',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router',
  ];
  const angularMajors = versionsFor(angularPackages)
    .map(({ name, version }) => ({ name, parsed: parseVersion(version), version }))
    .filter(({ parsed }) => parsed);

  const distinctAngularMajors = new Set(angularMajors.map(({ parsed }) => parsed.major));
  if (distinctAngularMajors.size > 1) {
    failures.push(
      `Angular packages have mixed major versions: ${angularMajors
        .map(({ name, version }) => `${name}@${version}`)
        .join(', ')}.`,
    );
  }

  const nxPackages = ['nx', '@nx/angular', '@nx/eslint', '@nx/workspace'];
  const nxMajors = versionsFor(nxPackages)
    .map(({ name, version }) => ({ name, parsed: parseVersion(version), version }))
    .filter(({ parsed }) => parsed);

  const distinctNxMajors = new Set(nxMajors.map(({ parsed }) => parsed.major));
  if (distinctNxMajors.size > 1) {
    failures.push(
      `Nx packages have mixed major versions: ${nxMajors
        .map(({ name, version }) => `${name}@${version}`)
        .join(', ')}.`,
    );
  }
}

function validateNpmPeerGraph() {
  if (!existsSync(join(repoRoot, 'node_modules'))) {
    warnings.push('node_modules is missing; npm peer graph validation will run after npm ci.');
    return;
  }

  const result = runCommand('npm', ['ls', '--depth=0'], { stdio: 'pipe' });
  if (result.status === 0) {
    return;
  }

  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const importantLines = output
    .split(/\r?\n/)
    .filter((line) => /ERESOLVE|invalid|peer dep|peerDependency|missing/i.test(line))
    .slice(0, 30);

  failures.push(
    importantLines.length > 0
      ? `npm root dependency graph has peer/invalid package problems:\n${importantLines.join('\n')}`
      : 'npm root dependency graph is invalid. Run npm ls --depth=0 for details.',
  );
}

function versionsFor(packageNames) {
  return packageNames
    .map((name) => ({ name, version: getLockVersion(packageLock, name) }))
    .filter(({ version }) => version);
}
