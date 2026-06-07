import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  collectRootDependencies,
  compareVersions,
  dependencySection,
  ensureWorkDirs,
  getLockVersion,
  logsDir,
  parseVersion,
  preserveRangePrefix,
  readJson,
  repoRoot,
  runCommand,
  workDir,
} from './common.mjs';
import { isAllowedMinorPackage, isBlockedAutomaticPackage } from './rules.mjs';

const mode = process.argv.includes('--minor') ? 'minor' : 'patch';
const stateFile = join(workDir, 'state.json');

ensureWorkDirs();
backupBaseline();

const packageJson = readJson('package.json');
const packageLock = readJson('package-lock.json');
const candidates = findCandidates(packageJson, packageLock, mode);

if (candidates.length === 0) {
  writeState({
    updateType: mode,
    accepted: [],
    rejected: [],
    warnings: ['No eligible dependency updates were found.'],
  });
  console.log(`No eligible ${mode} dependency updates found.`);
  process.exit(0);
}

console.log(`Found ${candidates.length} eligible ${mode} update candidate(s).`);
const bulkResult = tryInstallCandidates(candidates, 'bulk-install.log');

if (bulkResult.ok) {
  writeState({
    updateType: mode,
    accepted: candidates,
    rejected: [],
    warnings: [],
  });
  console.log(`Applied ${candidates.length} ${mode} dependency update(s).`);
  process.exit(0);
}

console.warn('Bulk dependency install failed. Trying deterministic package-by-package mitigation.');
restoreBaseline();
const accepted = [];
const rejected = [];

for (const candidate of candidates) {
  const snapshotPackageJson = readFileSync(join(repoRoot, 'package.json'), 'utf8');
  const snapshotPackageLock = readFileSync(join(repoRoot, 'package-lock.json'), 'utf8');

  const result = tryInstallCandidates([candidate], `install-${safeFileName(candidate.name)}.log`);
  if (result.ok) {
    accepted.push(candidate);
    console.log(`Accepted ${candidate.name}: ${candidate.from} -> ${candidate.to}`);
    continue;
  }

  writeFileSync(join(repoRoot, 'package.json'), snapshotPackageJson);
  writeFileSync(join(repoRoot, 'package-lock.json'), snapshotPackageLock);
  rejected.push({
    ...candidate,
    reason: 'npm install failed; package was reverted during mitigation.',
  });
  console.warn(`Reverted ${candidate.name}: npm install did not produce a safe dependency graph.`);
}

if (accepted.length > 0) {
  const finalInstall = runCommand('npm', ['install'], {
    stdio: 'inherit',
    logFile: join(logsDir, 'final-install.log'),
  });

  if (finalInstall.status !== 0) {
    restoreBaseline();
    writeState({
      updateType: mode,
      accepted: [],
      rejected: candidates.map((candidate) => ({
        ...candidate,
        reason: 'Final mitigated npm install failed; all updates were reverted.',
      })),
      warnings: ['Mitigation could not produce a stable installable dependency set.'],
    });
    process.exit(finalInstall.status ?? 1);
  }
}

writeState({
  updateType: mode,
  accepted,
  rejected,
  warnings:
    accepted.length === 0
      ? ['All candidate updates were reverted because none installed cleanly.']
      : [],
});

function findCandidates(rootPackageJson, rootPackageLock, updateMode) {
  const dependencies = collectRootDependencies(rootPackageJson);
  const result = [];

  for (const [name, spec] of Object.entries(dependencies)) {
    if (isBlockedAutomaticPackage(name)) {
      continue;
    }

    if (updateMode === 'minor' && !isAllowedMinorPackage(name)) {
      continue;
    }

    const currentVersion = getLockVersion(rootPackageLock, name);
    const current = parseVersion(currentVersion);
    if (!current) {
      continue;
    }

    const versions = getPublishedVersions(name)
      .map(parseVersion)
      .filter(Boolean)
      .filter((version) => version.major === current.major)
      .filter((version) =>
        updateMode === 'patch'
          ? version.minor === current.minor && version.patch > current.patch
          : version.minor > current.minor,
      )
      .sort(compareVersions);

    const latestAllowed = versions.at(-1);
    if (!latestAllowed) {
      continue;
    }

    result.push({
      name,
      section: dependencySection(rootPackageJson, name),
      from: spec,
      fromVersion: currentVersion,
      to: preserveRangePrefix(spec, latestAllowed.raw),
      toVersion: latestAllowed.raw,
    });
  }

  return result;
}

function getPublishedVersions(packageName) {
  const result = runCommand('npm', ['view', packageName, 'versions', '--json'], {
    stdio: 'pipe',
    logFile: join(logsDir, `view-${safeFileName(packageName)}.log`),
  });

  if (result.status !== 0) {
    console.warn(`Could not inspect published versions for ${packageName}; skipping.`);
    return [];
  }

  try {
    const parsed = JSON.parse(result.stdout);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    console.warn(`npm returned unparseable version metadata for ${packageName}; skipping.`);
    return [];
  }
}

function tryInstallCandidates(candidatesToInstall, logFileName) {
  const nextPackageJson = readJson('package.json');
  for (const candidate of candidatesToInstall) {
    nextPackageJson[candidate.section][candidate.name] = candidate.to;
  }

  writeFileSync(join(repoRoot, 'package.json'), `${JSON.stringify(nextPackageJson, null, 2)}\n`);
  const result = runCommand('npm', ['install'], {
    stdio: 'inherit',
    logFile: join(logsDir, logFileName),
  });

  return { ok: result.status === 0 };
}

function backupBaseline() {
  copyFileSync(join(repoRoot, 'package.json'), join(workDir, 'package.baseline.json'));
  copyFileSync(join(repoRoot, 'package-lock.json'), join(workDir, 'package-lock.baseline.json'));
}

function restoreBaseline() {
  copyFileSync(join(workDir, 'package.baseline.json'), join(repoRoot, 'package.json'));
  copyFileSync(join(workDir, 'package-lock.baseline.json'), join(repoRoot, 'package-lock.json'));
}

function writeState(state) {
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
}

function safeFileName(packageName) {
  return packageName.replace(/[^a-z0-9.-]+/gi, '_');
}
